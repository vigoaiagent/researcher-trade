import { FastifyInstance } from 'fastify';

export async function researcherRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // 研究员注册/绑定 (由TG Bot调用)
  fastify.post<{
    Body: {
      tgUserId: string;
      tgChatId: string;
      name: string;
      specialties?: string[];
      avatar?: string | null;
    };
  }>('/register', async (request, reply) => {
    const { tgUserId, tgChatId, name, specialties = [], avatar } = request.body;

    let researcher = await prisma.researcher.findUnique({
      where: { tgUserId },
    });

    if (researcher) {
      // 更新已有研究员
      researcher = await prisma.researcher.update({
        where: { tgUserId },
        data: {
          tgChatId,
          name,
          ...(avatar && { avatar }),
        },
      });
    } else {
      // 创建新研究员
      researcher = await prisma.researcher.create({
        data: {
          tgUserId,
          tgChatId,
          name,
          avatar,
          specialties: JSON.stringify(specialties),
          status: 'OFFLINE',
        },
      });
    }

    return { success: true, researcher };
  });

  // 更新研究员状态
  fastify.post<{
    Body: {
      tgUserId: string;
      status: 'ONLINE' | 'OFFLINE' | 'BUSY';
    };
  }>('/status', async (request, reply) => {
    const { tgUserId, status } = request.body;

    const researcher = await prisma.researcher.update({
      where: { tgUserId },
      data: { status },
    });

    return { success: true, status: researcher.status };
  });

  // 获取研究员信息
  fastify.get<{
    Params: { tgUserId: string };
  }>('/info/:tgUserId', async (request, reply) => {
    const { tgUserId } = request.params;

    const researcher = await prisma.researcher.findUnique({
      where: { tgUserId },
    });

    if (!researcher) {
      return reply.status(404).send({ error: 'Researcher not found' });
    }

    return researcher;
  });

  // 获取研究员统计数据
  fastify.get<{
    Params: { tgUserId: string };
  }>('/stats/:tgUserId', async (request, reply) => {
    const { tgUserId } = request.params;

    const researcher = await prisma.researcher.findUnique({
      where: { tgUserId },
    });

    if (!researcher) {
      return reply.status(404).send({ error: 'Researcher not found' });
    }

    // 获取本月服务统计
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyServices = await prisma.consultationResearcher.count({
      where: {
        researcherId: researcher.id,
        isSelected: true,
        answeredAt: { gte: startOfMonth },
      },
    });

    const monthlyRatings = await prisma.rating.findMany({
      where: {
        researcherId: researcher.id,
        createdAt: { gte: startOfMonth },
      },
    });

    const avgMonthlyRating =
      monthlyRatings.length > 0
        ? monthlyRatings.reduce((sum, r) => sum + r.score, 0) / monthlyRatings.length
        : 0;

    return {
      researcher: {
        id: researcher.id,
        name: researcher.name,
        status: researcher.status,
        ratingScore: researcher.ratingScore,
        serviceCount: researcher.serviceCount,
        recommendScore: researcher.recommendScore,
        totalEarnings: researcher.totalEarnings,
      },
      monthly: {
        services: monthlyServices,
        ratings: monthlyRatings.length,
        avgRating: avgMonthlyRating.toFixed(2),
      },
    };
  });

  // 研究员提交首次回答 (由TG Bot调用)
  fastify.post<{
    Body: {
      consultationId: string;
      tgUserId: string;
      answer: string;
    };
  }>('/answer', async (request, reply) => {
    const { consultationId, tgUserId, answer } = request.body;
    const io = (global as any).io;

    const researcher = await prisma.researcher.findUnique({
      where: { tgUserId },
    });

    if (!researcher) {
      return reply.status(404).send({ error: 'Researcher not found' });
    }

    // 检查是否是该咨询的分配研究员
    const cr = await prisma.consultationResearcher.findUnique({
      where: {
        consultationId_researcherId: {
          consultationId,
          researcherId: researcher.id,
        },
      },
    });

    if (!cr) {
      return reply.status(400).send({ error: 'Not assigned to this consultation' });
    }

    if (cr.firstAnswer) {
      return reply.status(400).send({ error: 'Already answered' });
    }

    // 获取咨询信息
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      return reply.status(404).send({ error: 'Consultation not found' });
    }

    // 更新回答
    await prisma.consultationResearcher.update({
      where: { id: cr.id },
      data: {
        firstAnswer: answer,
        answeredAt: new Date(),
      },
    });

    // 检查响应时间
    const responseTime = (Date.now() - cr.notifiedAt.getTime()) / 1000;
    if (responseTime < 60) {
      await prisma.researcher.update({
        where: { id: researcher.id },
        data: { recommendScore: { increment: 1 } },
      });
    }

    // 直接咨询模式：状态已经是 IN_PROGRESS，研究员已被选中
    // 将回复作为消息发送，而不是等待用户选择
    if (consultation.status === 'IN_PROGRESS' && cr.isSelected) {
      // 创建消息记录
      const message = await prisma.message.create({
        data: {
          consultationId,
          senderType: 'RESEARCHER',
          senderId: researcher.id,
          content: answer,
        },
      });

      // 通知用户收到新消息
      io.to(`consultation:${consultationId}`).emit('new_message', {
        message,
      });

      console.log('[Direct Consultation] First answer sent as message');
      return { success: true, answeredCount: 1, isDirect: true };
    }

    // 普通模式：等待用户选择研究员
    const allCRs = await prisma.consultationResearcher.findMany({
      where: { consultationId },
    });

    const answeredCount = allCRs.filter((c) => c.firstAnswer).length;

    if (answeredCount >= 1) {
      await prisma.consultation.update({
        where: { id: consultationId },
        data: {
          status: 'WAITING_SELECT',
          timeoutAt: new Date(Date.now() + 3 * 60 * 1000),
        },
      });

      // 通知用户可以选择研究员
      io.to(`user:${consultation.userId}`).emit('answers_ready', {
        consultationId,
        answeredCount,
      });
    }

    return { success: true, answeredCount };
  });

  // 绑定钱包地址
  fastify.post<{
    Body: {
      tgUserId: string;
      walletAddress: string;
    };
  }>('/bind-wallet', async (request, reply) => {
    const { tgUserId, walletAddress } = request.body;

    const researcher = await prisma.researcher.update({
      where: { tgUserId },
      data: { walletAddress },
    });

    return { success: true, walletAddress: researcher.walletAddress };
  });

  // 获取研究员评价列表
  fastify.get<{
    Params: { researcherId: string };
    Querystring: { limit?: string };
  }>('/reviews/:researcherId', async (request, reply) => {
    const { researcherId } = request.params;
    const limit = parseInt(request.query.limit || '5', 10);

    const ratings = await prisma.rating.findMany({
      where: { researcherId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            walletAddress: true,
          },
        },
        consultation: {
          select: {
            question: true,
          },
        },
      },
    });

    // 隐藏用户钱包地址的中间部分
    const reviews = ratings.map((r) => ({
      id: r.id,
      score: r.score,
      comment: r.comment,
      createdAt: r.createdAt,
      userAddress: r.user.walletAddress.slice(0, 6) + '...' + r.user.walletAddress.slice(-4),
      questionPreview: r.consultation.question.slice(0, 50) + (r.consultation.question.length > 50 ? '...' : ''),
    }));

    // 获取评分统计
    const allRatings = await prisma.rating.findMany({
      where: { researcherId },
      select: { score: true },
    });

    const stats = {
      total: allRatings.length,
      average: allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length
        : 0,
      distribution: {
        5: allRatings.filter((r) => r.score === 5).length,
        4: allRatings.filter((r) => r.score === 4).length,
        3: allRatings.filter((r) => r.score === 3).length,
        2: allRatings.filter((r) => r.score === 2).length,
        1: allRatings.filter((r) => r.score === 1).length,
      },
    };

    return { reviews, stats };
  });

  // 获取所有在线研究员 (管理接口)
  fastify.get('/online', async (request, reply) => {
    const researchers = await prisma.researcher.findMany({
      where: { status: 'ONLINE' },
      select: {
        id: true,
        name: true,
        avatar: true,
        specialties: true,
        ratingScore: true,
        serviceCount: true,
      },
    });

    return { researchers };
  });

  // 删除研究员 (管理接口)
  fastify.delete<{
    Params: { id: string };
  }>('/delete/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      // 先删除关联数据
      await prisma.consultationResearcher.deleteMany({
        where: { researcherId: id },
      });
      await prisma.rating.deleteMany({
        where: { researcherId: id },
      });

      // 删除研究员
      await prisma.researcher.delete({
        where: { id },
      });

      return { success: true, message: `Researcher ${id} deleted` };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // 获取所有研究员列表 (管理接口)
  fastify.get('/all', async (request, reply) => {
    const researchers = await prisma.researcher.findMany({
      select: {
        id: true,
        name: true,
        tgUserId: true,
        tgChatId: true,
        status: true,
        ratingScore: true,
        serviceCount: true,
      },
    });

    return { researchers };
  });
}
