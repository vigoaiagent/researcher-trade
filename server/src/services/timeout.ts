import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import cron from 'node-cron';
import { SessionManager } from './session.js';
import { notifyResearcherTimeout } from './notification.js';

/**
 * 启动超时检查调度器
 * 每30秒检查一次超时的咨询
 */
export function startTimeoutScheduler(prisma: PrismaClient, io: Server) {
  const sessionManager = new SessionManager(prisma, io);

  // 每30秒检查一次
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await checkTimeouts(prisma, sessionManager);
    } catch (error) {
      console.error('Timeout check error:', error);
    }
  });

  console.log('⏰ Timeout scheduler started');
}

async function checkTimeouts(
  prisma: PrismaClient,
  sessionManager: SessionManager
) {
  const now = new Date();

  // 查找所有超时的咨询
  const timeoutConsultations = await prisma.consultation.findMany({
    where: {
      status: {
        in: ['PENDING', 'WAITING_SELECT', 'IN_PROGRESS'],
      },
      timeoutAt: {
        lte: now,
      },
    },
    include: {
      consultationResearchers: {
        include: {
          researcher: true,
        },
      },
    },
  });

  for (const consultation of timeoutConsultations) {
    console.log(`⏰ Processing timeout for consultation: ${consultation.id}`);

    if (consultation.status === 'PENDING') {
      // 重新获取最新数据，避免竞态条件
      const freshData = await prisma.consultationResearcher.findMany({
        where: { consultationId: consultation.id },
        include: { researcher: true },
      });

      // 研究员首次回答超时
      const unanswered = freshData.filter((cr) => !cr.firstAnswer);
      const answered = freshData.filter((cr) => cr.firstAnswer);

      // 只对确实未回答的研究员进行处理
      for (const cr of unanswered) {
        console.log(`⏰ Researcher ${cr.researcher.name} did not answer in time`);
        await notifyResearcherTimeout(cr.researcher, consultation.id);
        // 扣推荐分
        await prisma.researcher.update({
          where: { id: cr.researcherId },
          data: { recommendScore: { decrement: 10 } },
        });
      }

      if (answered.length === 0) {
        // 没有人回答，退款
        await sessionManager.refundConsultation(consultation.id);
      } else {
        // 有人回答了，更新状态为等待选择
        await prisma.consultation.update({
          where: { id: consultation.id },
          data: {
            status: 'WAITING_SELECT',
            timeoutAt: new Date(Date.now() + 3 * 60 * 1000),
          },
        });
      }
    } else if (consultation.status === 'WAITING_SELECT') {
      // 用户选择超时，退款
      await sessionManager.refundConsultation(consultation.id);
    } else if (consultation.status === 'IN_PROGRESS') {
      // 对话超时，完成咨询
      await sessionManager.completeConsultation(consultation.id);
    }
  }
}
