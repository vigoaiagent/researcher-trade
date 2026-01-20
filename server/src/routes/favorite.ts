import { FastifyInstance } from 'fastify';

const MONTHLY_COST = 50; // 月订阅费用（能量值）
const SUBSCRIPTION_DAYS = 30; // 订阅周期（天）

export async function favoriteRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // 获取用户的订阅研究员列表
  fastify.get<{
    Params: { userId: string };
  }>('/list/:userId', async (request, reply) => {
    const { userId } = request.params;

    const subscriptions = await prisma.userFavoriteResearcher.findMany({
      where: { userId },
    });

    // 获取研究员详情
    const researcherIds = subscriptions.map((s) => s.researcherId);
    const researchers = await prisma.researcher.findMany({
      where: { id: { in: researcherIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
        specialties: true,
        status: true,
        ratingScore: true,
        serviceCount: true,
      },
    });

    // 合并数据，检查是否过期
    const now = new Date();
    const result = subscriptions.map((sub) => {
      const isExpired = sub.expiresAt < now;
      return {
        ...sub,
        isExpired,
        // 如果过期且未自动续费，标记为非活跃
        isActive: sub.isActive && !isExpired,
        researcher: researchers.find((r) => r.id === sub.researcherId),
      };
    });

    return { favorites: result };
  });

  // 检查是否已订阅某研究员
  fastify.get<{
    Params: { userId: string; researcherId: string };
  }>('/check/:userId/:researcherId', async (request, reply) => {
    const { userId, researcherId } = request.params;

    try {
      const subscription = await prisma.userFavoriteResearcher.findFirst({
        where: { userId, researcherId },
      });

      if (!subscription) {
        return { isSubscribed: false };
      }

      const now = new Date();
      const isActive = subscription.isActive && subscription.expiresAt > now;

      return {
        isSubscribed: true,
        isActive,
        autoRenew: subscription.autoRenew,
        expiresAt: subscription.expiresAt,
      };
    } catch (error: any) {
      console.error('Check subscription error:', error);
      return { isSubscribed: false };
    }
  });

  // 订阅研究员
  fastify.post<{
    Body: {
      userId: string;
      researcherId: string;
    };
  }>('/add', async (request, reply) => {
    const { userId, researcherId } = request.body;

    // 检查是否已订阅
    const existing = await prisma.userFavoriteResearcher.findFirst({
      where: { userId, researcherId },
    });

    if (existing) {
      // 如果已存在但已过期或未激活，重新激活
      const now = new Date();
      if (!existing.isActive || existing.expiresAt < now) {
        // 需要重新付费
      } else {
        return reply.status(400).send({ error: '已经订阅过该研究员' });
      }
    }

    // 检查用户能量值
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(404).send({ error: '用户不存在' });
    }

    if (user.energyBalance < MONTHLY_COST) {
      return reply.status(400).send({
        error: '能量值不足',
        required: MONTHLY_COST,
        current: user.energyBalance,
      });
    }

    // 检查研究员是否存在
    const researcher = await prisma.researcher.findUnique({
      where: { id: researcherId },
    });

    if (!researcher) {
      return reply.status(404).send({ error: '研究员不存在' });
    }

    // 计算到期时间（30天后）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SUBSCRIPTION_DAYS);

    try {
      const subscription = await prisma.$transaction(async (tx) => {
        let sub;

        if (existing) {
          // 重新激活已有订阅
          sub = await tx.userFavoriteResearcher.update({
            where: { id: existing.id },
            data: {
              isActive: true,
              autoRenew: true,
              expiresAt,
              subscribedAt: new Date(),
            },
          });
        } else {
          // 创建新订阅
          sub = await tx.userFavoriteResearcher.create({
            data: {
              userId,
              researcherId,
              monthlyCost: MONTHLY_COST,
              expiresAt,
              isActive: true,
              autoRenew: true,
            },
          });
        }

        // 扣除能量值
        await tx.user.update({
          where: { id: userId },
          data: { energyBalance: { decrement: MONTHLY_COST } },
        });

        // 记录能量交易
        await tx.energyTransaction.create({
          data: {
            userId,
            amount: -MONTHLY_COST,
            type: 'SUBSCRIPTION',
            refId: researcherId,
            remark: `订阅研究员: ${researcher.name} (${SUBSCRIPTION_DAYS}天)`,
          },
        });

        return sub;
      });

      return {
        success: true,
        subscription,
        monthlyCost: MONTHLY_COST,
        expiresAt,
        newBalance: user.energyBalance - MONTHLY_COST,
      };
    } catch (error: any) {
      console.error('Subscription error:', error);
      return reply.status(500).send({ error: '订阅失败: ' + error.message });
    }
  });

  // 取消自动续费
  fastify.post<{
    Body: { userId: string; researcherId: string };
  }>('/cancel', async (request, reply) => {
    const { userId, researcherId } = request.body;

    try {
      const subscription = await prisma.userFavoriteResearcher.findFirst({
        where: { userId, researcherId },
      });

      if (!subscription) {
        return reply.status(404).send({ error: '未找到订阅记录' });
      }

      await prisma.userFavoriteResearcher.update({
        where: { id: subscription.id },
        data: { autoRenew: false },
      });

      return {
        success: true,
        message: '已取消自动续费，订阅将在到期后失效',
        expiresAt: subscription.expiresAt,
      };
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // 恢复自动续费
  fastify.post<{
    Body: { userId: string; researcherId: string };
  }>('/resume', async (request, reply) => {
    const { userId, researcherId } = request.body;

    try {
      const subscription = await prisma.userFavoriteResearcher.findFirst({
        where: { userId, researcherId },
      });

      if (!subscription) {
        return reply.status(404).send({ error: '未找到订阅记录' });
      }

      // 如果订阅已过期，需要重新付费
      const now = new Date();
      if (subscription.expiresAt < now) {
        return reply.status(400).send({
          error: '订阅已过期，请重新订阅',
          needResubscribe: true,
        });
      }

      await prisma.userFavoriteResearcher.update({
        where: { id: subscription.id },
        data: { autoRenew: true },
      });

      return {
        success: true,
        message: '已恢复自动续费',
        expiresAt: subscription.expiresAt,
      };
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // 删除订阅（彻底移除，不退款）
  fastify.delete<{
    Params: { userId: string; researcherId: string };
  }>('/remove/:userId/:researcherId', async (request, reply) => {
    const { userId, researcherId } = request.params;

    try {
      await prisma.userFavoriteResearcher.deleteMany({
        where: { userId, researcherId },
      });

      return { success: true };
    } catch (error) {
      return reply.status(404).send({ error: '未找到订阅记录' });
    }
  });

  // 获取订阅费用
  fastify.get('/cost', async (request, reply) => {
    return {
      monthlyCost: MONTHLY_COST,
      subscriptionDays: SUBSCRIPTION_DAYS,
    };
  });

  // 处理自动续费（由定时任务调用）
  fastify.post('/process-renewals', async (request, reply) => {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // 查找即将到期且开启自动续费的订阅
    const expiringSubscriptions = await prisma.userFavoriteResearcher.findMany({
      where: {
        isActive: true,
        autoRenew: true,
        expiresAt: {
          lte: threeDaysFromNow,
          gte: now,
        },
      },
    });

    const results = {
      processed: 0,
      renewed: 0,
      failed: 0,
      details: [] as any[],
    };

    for (const sub of expiringSubscriptions) {
      results.processed++;

      try {
        // 检查用户能量
        const user = await prisma.user.findUnique({
          where: { id: sub.userId },
        });

        if (!user || user.energyBalance < sub.monthlyCost) {
          // 能量不足，标记为待通知
          results.failed++;
          results.details.push({
            subscriptionId: sub.id,
            status: 'insufficient_balance',
          });
          continue;
        }

        // 计算新的到期时间
        const newExpiresAt = new Date(sub.expiresAt);
        newExpiresAt.setDate(newExpiresAt.getDate() + SUBSCRIPTION_DAYS);

        // 执行续费
        await prisma.$transaction(async (tx) => {
          await tx.userFavoriteResearcher.update({
            where: { id: sub.id },
            data: { expiresAt: newExpiresAt },
          });

          await tx.user.update({
            where: { id: sub.userId },
            data: { energyBalance: { decrement: sub.monthlyCost } },
          });

          await tx.energyTransaction.create({
            data: {
              userId: sub.userId,
              amount: -sub.monthlyCost,
              type: 'SUBSCRIPTION_RENEWAL',
              refId: sub.researcherId,
              remark: `自动续费订阅 (${SUBSCRIPTION_DAYS}天)`,
            },
          });
        });

        results.renewed++;
        results.details.push({
          subscriptionId: sub.id,
          status: 'renewed',
          newExpiresAt,
        });
      } catch (error: any) {
        results.failed++;
        results.details.push({
          subscriptionId: sub.id,
          status: 'error',
          error: error.message,
        });
      }
    }

    return results;
  });
}
