import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { updateRecommendScore, SCORE_RULES } from './matching.js';

/**
 * 会话状态机 - 管理咨询会话的生命周期
 */
export class SessionManager {
  constructor(
    private prisma: PrismaClient,
    private io: Server
  ) {}

  /**
   * 创建新咨询会话
   */
  async createConsultation(
    userId: string,
    question: string,
    context?: string,
    energyCost: number = 10,
    usingTrial: boolean = false
  ) {
    // 检查用户能量值
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // 如果用户不存在，尝试通过钱包地址查找或创建演示用户
    if (!user) {
      // 根据 demo 用户等级给予相应能量
      const demoEnergyMap: Record<string, number> = {
        demo_bronze: 50,
        demo_silver: 500,
        demo_gold: 2500,
        demo_diamond: 10000,
      };
      const initialEnergy = demoEnergyMap[userId] || 100;

      // 为演示/MVP目的，自动创建用户
      user = await this.prisma.user.create({
        data: {
          id: userId,
          walletAddress: `demo_${userId}`,
          isWhitelist: true,
          energyBalance: initialEnergy,
        },
      });
      console.log('[Session] Auto-created demo user:', userId, 'with energy:', initialEnergy);
    }

    // 使用体验券时跳过能量检查
    if (!usingTrial) {
      if (user.energyBalance < energyCost) {
        throw new Error('Insufficient energy balance');
      }

      // 扣除能量值
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          energyBalance: { decrement: energyCost },
        },
      });

      // 记录能量值变动
      await this.prisma.energyTransaction.create({
        data: {
          userId,
          amount: -energyCost,
          type: 'CONSULTATION',
          remark: '发起咨询',
        },
      });
    } else {
      console.log('[Session] Using trial voucher, skipping energy deduction for user:', userId);
    }

    // 创建会话
    const consultation = await this.prisma.consultation.create({
      data: {
        userId,
        question,
        context,
        energyCost,
        status: 'PENDING',
        maxRounds: 10, // 显式设置为 10 轮
        timeoutAt: new Date(Date.now() + 2 * 60 * 1000), // 2分钟超时
      },
    });

    return consultation;
  }

  /**
   * 分配研究员到会话
   */
  async assignResearchers(consultationId: string, researcherIds: string[]) {
    const records = researcherIds.map((researcherId) => ({
      consultationId,
      researcherId,
    }));

    await this.prisma.consultationResearcher.createMany({
      data: records,
    });

    return records;
  }

  /**
   * 研究员提交首次回答
   */
  async submitFirstAnswer(
    consultationId: string,
    researcherId: string,
    answer: string
  ) {
    const cr = await this.prisma.consultationResearcher.update({
      where: {
        consultationId_researcherId: {
          consultationId,
          researcherId,
        },
      },
      data: {
        firstAnswer: answer,
        answeredAt: new Date(),
      },
    });

    // 检查响应时间，更新推荐分
    const notifiedAt = cr.notifiedAt;
    const responseTime = (Date.now() - notifiedAt.getTime()) / 1000;
    if (responseTime < 60) {
      await updateRecommendScore(this.prisma, researcherId, SCORE_RULES.FAST_RESPONSE);
    }

    // 检查是否所有研究员都已回答
    const allAnswers = await this.prisma.consultationResearcher.findMany({
      where: { consultationId },
    });

    const answeredCount = allAnswers.filter((a) => a.firstAnswer).length;

    if (answeredCount >= 1) {
      // 至少有1个回答，更新状态为等待选择
      await this.prisma.consultation.update({
        where: { id: consultationId },
        data: {
          status: 'WAITING_SELECT',
          timeoutAt: new Date(Date.now() + 3 * 60 * 1000), // 3分钟选择超时
        },
      });

      // 通知用户
      this.io.to(`user:${consultationId}`).emit('answers_ready', {
        consultationId,
        answeredCount,
      });
    }

    return cr;
  }

  /**
   * 用户选择研究员
   */
  async selectResearcher(consultationId: string, researcherId: string) {
    // 标记选中的研究员
    await this.prisma.consultationResearcher.update({
      where: {
        consultationId_researcherId: {
          consultationId,
          researcherId,
        },
      },
      data: { isSelected: true },
    });

    // 更新会话状态
    // roundsUsed 从 0 开始，每次用户发追问消息才加 1
    // 这样 maxRounds=3 就是 3 次追问机会
    await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: 'IN_PROGRESS',
        roundsUsed: 0, // 从 0 开始，用户追问才计数
        timeoutAt: new Date(Date.now() + 10 * 60 * 1000), // 10分钟对话超时
      },
    });

    // 增加研究员推荐分
    await updateRecommendScore(this.prisma, researcherId, SCORE_RULES.SELECTED);

    // 更新研究员服务次数
    await this.prisma.researcher.update({
      where: { id: researcherId },
      data: {
        serviceCount: { increment: 1 },
      },
    });

    return { success: true };
  }

  /**
   * 发送消息
   */
  async sendMessage(
    consultationId: string,
    senderType: 'USER' | 'RESEARCHER',
    senderId: string,
    content: string
  ) {
    console.log('sendMessage called:', { consultationId, senderType, senderId, content: content.substring(0, 50) });

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        consultationResearchers: {
          where: { isSelected: true },
        },
      },
    });

    console.log('consultation found:', consultation ? { id: consultation.id, status: consultation.status } : null);

    if (!consultation || consultation.status !== 'IN_PROGRESS') {
      console.log('Validation failed:', { found: !!consultation, status: consultation?.status });
      throw new Error('Consultation not in progress');
    }

    // 如果是研究员发送消息，验证是否是被选中的研究员
    if (senderType === 'RESEARCHER') {
      const selectedResearcher = consultation.consultationResearchers[0];
      if (!selectedResearcher || selectedResearcher.researcherId !== senderId) {
        console.log('Researcher not selected:', { senderId, selectedId: selectedResearcher?.researcherId });
        throw new Error('Only selected researcher can send messages');
      }
    }

    // 创建消息
    const message = await this.prisma.message.create({
      data: {
        consultationId,
        senderType,
        senderId,
        content,
      },
    });

    // 如果是用户发的消息，增加对话轮次
    if (senderType === 'USER') {
      const updated = await this.prisma.consultation.update({
        where: { id: consultationId },
        data: {
          roundsUsed: { increment: 1 },
          timeoutAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      // 检查是否达到最大轮次 - 不自动关闭，而是通知用户可以续费
      if (updated.roundsUsed >= updated.maxRounds) {
        // 通知用户轮次已用完，可以选择续费或结束
        this.io.to(`consultation:${consultationId}`).emit('rounds_exhausted', {
          consultationId,
          roundsUsed: updated.roundsUsed,
          maxRounds: updated.maxRounds,
          canExtend: true,
          extendCost: 5, // 续费能量消耗
        });
      }
    }

    return message;
  }

  /**
   * 完成咨询
   */
  async completeConsultation(consultationId: string) {
    await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: 'COMPLETED',
        closedAt: new Date(),
      },
    });

    this.io.to(`consultation:${consultationId}`).emit('consultation_completed', {
      consultationId,
    });
  }

  /**
   * 超时处理
   */
  async handleTimeout(consultationId: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        consultationResearchers: true,
      },
    });

    if (!consultation) return;

    if (consultation.status === 'PENDING') {
      // 研究员首次回答超时
      const unanswered = consultation.consultationResearchers.filter(
        (cr) => !cr.firstAnswer
      );

      // 扣除未回答研究员的推荐分
      for (const cr of unanswered) {
        await updateRecommendScore(this.prisma, cr.researcherId, SCORE_RULES.TIMEOUT);
      }

      // 如果没有任何人回答，退款
      const answered = consultation.consultationResearchers.filter(
        (cr) => cr.firstAnswer
      );

      if (answered.length === 0) {
        await this.refundConsultation(consultationId);
      }
    } else if (consultation.status === 'WAITING_SELECT') {
      // 用户选择超时，退款
      await this.refundConsultation(consultationId);
    } else if (consultation.status === 'IN_PROGRESS') {
      // 对话超时，直接完成
      await this.completeConsultation(consultationId);
    }
  }

  /**
   * 退款
   */
  async refundConsultation(consultationId: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) return;

    // 退还能量值
    await this.prisma.user.update({
      where: { id: consultation.userId },
      data: {
        energyBalance: { increment: consultation.energyCost },
      },
    });

    // 记录退款
    await this.prisma.energyTransaction.create({
      data: {
        userId: consultation.userId,
        amount: consultation.energyCost,
        type: 'REFUND',
        refId: consultationId,
        remark: '咨询超时退款',
      },
    });

    // 更新会话状态
    await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: 'CANCELLED',
        closedAt: new Date(),
      },
    });

    this.io.to(`user:${consultation.userId}`).emit('consultation_refunded', {
      consultationId,
      amount: consultation.energyCost,
    });
  }

  /**
   * 提交评价
   */
  async submitRating(
    consultationId: string,
    userId: string,
    score: number,
    comment?: string
  ) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        consultationResearchers: {
          where: { isSelected: true },
        },
      },
    });

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    const selectedResearcher = consultation.consultationResearchers[0];
    if (!selectedResearcher) {
      throw new Error('No selected researcher');
    }

    const researcherId = selectedResearcher.researcherId;

    // 创建评价
    const rating = await this.prisma.rating.create({
      data: {
        consultationId,
        researcherId,
        userId,
        score,
        comment,
      },
    });

    // 更新研究员评分
    const allRatings = await this.prisma.rating.findMany({
      where: { researcherId },
    });

    const avgScore =
      allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

    await this.prisma.researcher.update({
      where: { id: researcherId },
      data: {
        ratingScore: avgScore,
      },
    });

    // 根据评分更新推荐分
    if (score >= 4) {
      await updateRecommendScore(this.prisma, researcherId, SCORE_RULES.GOOD_RATING);
    } else if (score <= 2) {
      await updateRecommendScore(this.prisma, researcherId, SCORE_RULES.BAD_RATING);
    }

    return rating;
  }
}
