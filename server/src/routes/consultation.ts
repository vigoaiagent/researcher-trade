import { FastifyInstance } from 'fastify';
import { matchResearchers } from '../services/matching.js';
import { SessionManager } from '../services/session.js';
import { notifyResearcherNewQuestion } from '../services/notification.js';

export async function consultationRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // 发起咨询
  fastify.post<{
    Body: {
      userId: string;
      question: string;
      context?: string;
      targetResearcherId?: string; // 直接咨询指定研究员
      usingTrial?: boolean; // 是否使用体验券
    };
  }>('/create', async (request, reply) => {
    const { userId, question, context, targetResearcherId, usingTrial } = request.body;
    const io = (global as any).io;

    console.log('[Consultation] Create request:', { userId, question, context, targetResearcherId, usingTrial });

    const sessionManager = new SessionManager(prisma, io);

    try {
      // 创建会话
      const consultation = await sessionManager.createConsultation(
        userId,
        question,
        context,
        10, // energyCost
        usingTrial || false
      );

      let researchers;

      if (targetResearcherId) {
        // 直接咨询模式 - 仅指定研究员
        const targetResearcher = await prisma.researcher.findUnique({
          where: { id: targetResearcherId },
        });

        if (!targetResearcher) {
          await sessionManager.refundConsultation(consultation.id);
          return reply.status(400).send({
            error: 'Target researcher not found',
            refunded: true,
          });
        }

        if (targetResearcher.status !== 'ONLINE') {
          await sessionManager.refundConsultation(consultation.id);
          return reply.status(400).send({
            error: 'Target researcher is offline',
            refunded: true,
          });
        }

        researchers = [targetResearcher];
        console.log('[Consultation] Direct consultation with researcher:', targetResearcher.name);
      } else {
        // 正常匹配模式
        researchers = await matchResearchers(prisma, context || null, 3);
      }

      if (researchers.length === 0) {
        // 没有在线研究员，退款
        await sessionManager.refundConsultation(consultation.id);
        return reply.status(400).send({
          error: 'No researchers available',
          refunded: true,
        });
      }

      // 分配研究员
      await sessionManager.assignResearchers(
        consultation.id,
        researchers.map((r) => r.id)
      );

      // 通知研究员
      for (const researcher of researchers) {
        await notifyResearcherNewQuestion(researcher, consultation);
      }

      // 直接咨询模式：自动选中研究员，跳过等待匹配
      if (targetResearcherId) {
        await sessionManager.selectResearcher(consultation.id, targetResearcherId);
        console.log('[Consultation] Direct mode: auto-selected researcher');
      }

      return {
        success: true,
        consultationId: consultation.id,
        researcherCount: researchers.length,
        isDirect: !!targetResearcherId,
        targetResearcherId: targetResearcherId || null,
      };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // 获取咨询详情
  fastify.get<{
    Params: { id: string };
  }>('/detail/:id', async (request, reply) => {
    const { id } = request.params;

    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        consultationResearchers: {
          include: {
            researcher: {
              select: {
                id: true,
                name: true,
                avatar: true,
                specialties: true,
                ratingScore: true,
                serviceCount: true,
                responseTimeAvg: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        rating: true,
      },
    });

    if (!consultation) {
      return reply.status(404).send({ error: 'Consultation not found' });
    }

    // 解析研究员的 specialties JSON 字符串
    const parsedConsultation = {
      ...consultation,
      consultationResearchers: consultation.consultationResearchers.map((cr) => ({
        ...cr,
        researcher: {
          ...cr.researcher,
          specialties: JSON.parse(cr.researcher.specialties || '[]'),
        },
      })),
    };

    return parsedConsultation;
  });

  // 获取研究员回答列表 (用于用户选择)
  fastify.get<{
    Params: { id: string };
  }>('/answers/:id', async (request, reply) => {
    const { id } = request.params;

    const answers = await prisma.consultationResearcher.findMany({
      where: {
        consultationId: id,
        firstAnswer: { not: null },
      },
      include: {
        researcher: {
          select: {
            id: true,
            name: true,
            avatar: true,
            specialties: true,
            ratingScore: true,
            serviceCount: true,
            responseTimeAvg: true,
          },
        },
      },
    });

    // 解析 specialties JSON 字符串为数组
    const parsedAnswers = answers.map((answer) => ({
      ...answer,
      researcher: {
        ...answer.researcher,
        specialties: JSON.parse(answer.researcher.specialties || '[]'),
      },
    }));

    return { answers: parsedAnswers };
  });

  // 选择研究员
  fastify.post<{
    Body: {
      consultationId: string;
      researcherId: string;
    };
  }>('/select', async (request, reply) => {
    const { consultationId, researcherId } = request.body;
    const io = (global as any).io;

    const sessionManager = new SessionManager(prisma, io);

    try {
      await sessionManager.selectResearcher(consultationId, researcherId);

      // 获取所有参与此咨询的研究员
      const allCRs = await prisma.consultationResearcher.findMany({
        where: { consultationId },
        include: { researcher: true },
      });

      const { notifyResearcherSelected, notifyResearcherNotSelected } = await import('../services/notification.js');
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
      });

      for (const cr of allCRs) {
        if (cr.researcherId === researcherId) {
          // 通知被选中的研究员
          if (consultation) {
            await notifyResearcherSelected(cr.researcher, consultation);
          }
        } else if (cr.firstAnswer) {
          // 通知未被选中但已回答的研究员
          if (consultation) {
            await notifyResearcherNotSelected(cr.researcher, consultation);
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // 发送消息
  fastify.post<{
    Body: {
      consultationId: string;
      senderType: 'USER' | 'RESEARCHER';
      senderId: string;
      content: string;
    };
  }>('/message', async (request, reply) => {
    const { consultationId, senderType, senderId, content } = request.body;
    const io = (global as any).io;

    const sessionManager = new SessionManager(prisma, io);

    try {
      const message = await sessionManager.sendMessage(
        consultationId,
        senderType,
        senderId,
        content
      );

      // 研究员发的消息需要广播给用户（用户在Web端接收）
      // 用户发的消息不需要广播（用户从API返回值获取）
      if (senderType === 'RESEARCHER') {
        io.to(`consultation:${consultationId}`).emit('new_message', {
          message,
        });
      }

      // 如果是用户发的消息，通知研究员(通过TG)
      if (senderType === 'USER') {
        const consultation = await prisma.consultation.findUnique({
          where: { id: consultationId },
          include: {
            consultationResearchers: {
              where: { isSelected: true },
              include: { researcher: true },
            },
          },
        });

        if (consultation?.consultationResearchers[0]?.researcher) {
          const researcher = consultation.consultationResearchers[0].researcher;
          const { notifyResearcherFollowUp } = await import('../services/notification.js');
          const roundsLeft = consultation.maxRounds - consultation.roundsUsed;
          await notifyResearcherFollowUp(researcher, consultationId, content, roundsLeft);
        }
      }

      return { success: true, message };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // 结束咨询
  fastify.post<{
    Body: { consultationId: string };
  }>('/complete', async (request, reply) => {
    const { consultationId } = request.body;
    const io = (global as any).io;

    const sessionManager = new SessionManager(prisma, io);

    await sessionManager.completeConsultation(consultationId);

    return { success: true };
  });

  // 续费追问（消耗能量增加轮次）
  fastify.post<{
    Body: {
      consultationId: string;
      userId: string;
      additionalRounds?: number;  // 默认增加 3 轮
    };
  }>('/extend', async (request, reply) => {
    const { consultationId, userId, additionalRounds = 3 } = request.body;
    const ENERGY_COST_PER_EXTEND = 5; // 每次续费消耗 5 能量

    try {
      // 检查咨询状态
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
      });

      if (!consultation) {
        return reply.status(404).send({ error: 'Consultation not found' });
      }

      if (consultation.status !== 'IN_PROGRESS') {
        return reply.status(400).send({ error: 'Consultation is not in progress' });
      }

      // 检查用户能量
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      if (user.energyBalance < ENERGY_COST_PER_EXTEND) {
        return reply.status(400).send({
          error: 'Insufficient energy',
          required: ENERGY_COST_PER_EXTEND,
          current: user.energyBalance,
        });
      }

      // 扣除能量
      await prisma.user.update({
        where: { id: userId },
        data: { energyBalance: { decrement: ENERGY_COST_PER_EXTEND } },
      });

      // 记录能量消耗
      await prisma.energyTransaction.create({
        data: {
          userId,
          amount: -ENERGY_COST_PER_EXTEND,
          type: 'EXTEND_CONSULTATION',
          refId: consultationId,
          remark: `续费追问 +${additionalRounds} 轮`,
        },
      });

      // 增加轮次
      const updated = await prisma.consultation.update({
        where: { id: consultationId },
        data: {
          maxRounds: { increment: additionalRounds },
          timeoutAt: new Date(Date.now() + 10 * 60 * 1000), // 重置超时
        },
      });

      return {
        success: true,
        newMaxRounds: updated.maxRounds,
        roundsUsed: updated.roundsUsed,
        roundsLeft: updated.maxRounds - updated.roundsUsed,
        energyCost: ENERGY_COST_PER_EXTEND,
        newEnergyBalance: user.energyBalance - ENERGY_COST_PER_EXTEND,
      };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // 提交评价
  fastify.post<{
    Body: {
      consultationId: string;
      userId: string;
      score: number;
      comment?: string;
    };
  }>('/rate', async (request, reply) => {
    const { consultationId, userId, score, comment } = request.body;
    const io = (global as any).io;

    if (score < 1 || score > 5) {
      return reply.status(400).send({ error: 'Score must be between 1 and 5' });
    }

    const sessionManager = new SessionManager(prisma, io);

    try {
      const rating = await sessionManager.submitRating(
        consultationId,
        userId,
        score,
        comment
      );

      return { success: true, rating };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // 获取用户咨询历史
  fastify.get<{
    Params: { userId: string };
    Querystring: { limit?: string };
  }>('/history/:userId', async (request, reply) => {
    const { userId } = request.params;
    const limit = parseInt(request.query.limit || '10');

    const consultations = await prisma.consultation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        consultationResearchers: {
          where: { isSelected: true },
          include: {
            researcher: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        rating: true,
      },
    });

    return { consultations };
  });

  // ========== 评价申诉系统 ==========

  // 研究员提交申诉（通过 TG Bot 调用）
  fastify.post<{
    Body: {
      tgUserId: string;
      ratingId: string;
      reason: string;
    };
  }>('/appeal/submit', async (request, reply) => {
    const { tgUserId, ratingId, reason } = request.body;

    // 获取研究员
    const researcher = await prisma.researcher.findUnique({
      where: { tgUserId },
    });

    if (!researcher) {
      return reply.status(404).send({ error: 'Researcher not found' });
    }

    // 获取评价
    const rating = await prisma.rating.findUnique({
      where: { id: ratingId },
      include: {
        consultation: true,
        appeal: true,
      },
    });

    if (!rating) {
      return reply.status(404).send({ error: 'Rating not found' });
    }

    if (rating.researcherId !== researcher.id) {
      return reply.status(403).send({ error: 'You can only appeal your own ratings' });
    }

    // 只允许对 1-2 星差评提起申诉
    if (rating.score > 2) {
      return reply.status(400).send({ error: 'Only ratings with score 1-2 can be appealed' });
    }

    if (rating.appeal) {
      return reply.status(400).send({ error: 'This rating has already been appealed' });
    }

    // 创建申诉
    const appeal = await prisma.ratingAppeal.create({
      data: {
        ratingId,
        reason,
        status: 'PENDING',
      },
    });

    // 标记评价正在申诉中
    await prisma.rating.update({
      where: { id: ratingId },
      data: { isDisputed: true },
    });

    return {
      success: true,
      appeal,
      message: '申诉已提交，等待管理员审核',
    };
  });

  // 获取研究员的待处理申诉列表
  fastify.get<{
    Params: { tgUserId: string };
  }>('/appeal/list/:tgUserId', async (request, reply) => {
    const { tgUserId } = request.params;

    const researcher = await prisma.researcher.findUnique({
      where: { tgUserId },
    });

    if (!researcher) {
      return reply.status(404).send({ error: 'Researcher not found' });
    }

    const appeals = await prisma.ratingAppeal.findMany({
      where: {
        rating: {
          researcherId: researcher.id,
        },
      },
      include: {
        rating: {
          include: {
            consultation: {
              select: {
                question: true,
              },
            },
            user: {
              select: {
                walletAddress: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      appeals: appeals.map((a) => ({
        id: a.id,
        status: a.status,
        reason: a.reason,
        adminNote: a.adminNote,
        createdAt: a.createdAt,
        resolvedAt: a.resolvedAt,
        rating: {
          id: a.rating.id,
          score: a.rating.score,
          comment: a.rating.comment,
          question: a.rating.consultation.question.slice(0, 50),
          userAddress: a.rating.user.walletAddress.slice(0, 6) + '...' + a.rating.user.walletAddress.slice(-4),
        },
      })),
    };
  });

  // 获取研究员可申诉的差评列表
  fastify.get<{
    Params: { tgUserId: string };
  }>('/appeal/eligible/:tgUserId', async (request, reply) => {
    const { tgUserId } = request.params;

    const researcher = await prisma.researcher.findUnique({
      where: { tgUserId },
    });

    if (!researcher) {
      return reply.status(404).send({ error: 'Researcher not found' });
    }

    // 获取1-2星且未申诉的评价
    const eligibleRatings = await prisma.rating.findMany({
      where: {
        researcherId: researcher.id,
        score: { lte: 2 },
        isDisputed: false,
        appeal: null,
      },
      include: {
        consultation: {
          select: {
            question: true,
          },
        },
        user: {
          select: {
            walletAddress: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      ratings: eligibleRatings.map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        question: r.consultation.question.slice(0, 50),
        userAddress: r.user.walletAddress.slice(0, 6) + '...' + r.user.walletAddress.slice(-4),
      })),
    };
  });

  // 管理员处理申诉
  fastify.post<{
    Body: {
      appealId: string;
      decision: 'APPROVED' | 'REJECTED';
      adminNote?: string;
    };
  }>('/appeal/resolve', async (request, reply) => {
    const { appealId, decision, adminNote } = request.body;

    const appeal = await prisma.ratingAppeal.findUnique({
      where: { id: appealId },
      include: {
        rating: true,
      },
    });

    if (!appeal) {
      return reply.status(404).send({ error: 'Appeal not found' });
    }

    if (appeal.status !== 'PENDING') {
      return reply.status(400).send({ error: 'Appeal already resolved' });
    }

    // 更新申诉状态
    await prisma.ratingAppeal.update({
      where: { id: appealId },
      data: {
        status: decision,
        adminNote,
        resolvedAt: new Date(),
      },
    });

    // 如果申诉通过，移除差评的影响
    if (decision === 'APPROVED') {
      // 更新研究员评分（排除该差评重新计算）
      const researcher = await prisma.researcher.findUnique({
        where: { id: appeal.rating.researcherId },
      });

      if (researcher) {
        // 获取所有非申诉成功的评价
        const validRatings = await prisma.rating.findMany({
          where: {
            researcherId: researcher.id,
            OR: [
              { isDisputed: false },
              {
                appeal: {
                  status: { not: 'APPROVED' },
                },
              },
            ],
          },
        });

        // 排除当前申诉成功的评价
        const ratingsExcludingCurrent = validRatings.filter((r) => r.id !== appeal.rating.id);

        if (ratingsExcludingCurrent.length > 0) {
          const newAvg =
            ratingsExcludingCurrent.reduce((sum, r) => sum + r.score, 0) / ratingsExcludingCurrent.length;
          await prisma.researcher.update({
            where: { id: researcher.id },
            data: { ratingScore: newAvg },
          });
        }
      }

      // 标记评价为已处理（不再计入统计）
      await prisma.rating.update({
        where: { id: appeal.rating.id },
        data: { isDisputed: true },
      });
    } else {
      // 申诉失败，取消争议标记
      await prisma.rating.update({
        where: { id: appeal.rating.id },
        data: { isDisputed: false },
      });
    }

    return {
      success: true,
      decision,
      message: decision === 'APPROVED' ? '申诉已通过，差评已移除' : '申诉已驳回',
    };
  });

  // 获取所有待审核申诉（管理接口）
  fastify.get('/appeal/pending', async (request, reply) => {
    const appeals = await prisma.ratingAppeal.findMany({
      where: { status: 'PENDING' },
      include: {
        rating: {
          include: {
            consultation: {
              select: {
                question: true,
              },
            },
            researcher: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                walletAddress: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      appeals: appeals.map((a) => ({
        id: a.id,
        reason: a.reason,
        createdAt: a.createdAt,
        rating: {
          id: a.rating.id,
          score: a.rating.score,
          comment: a.rating.comment,
          question: a.rating.consultation.question,
        },
        researcher: a.rating.researcher,
        userAddress: a.rating.user.walletAddress.slice(0, 6) + '...' + a.rating.user.walletAddress.slice(-4),
      })),
    };
  });
}
