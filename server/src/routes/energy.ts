import { FastifyInstance } from 'fastify';

export async function energyRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // 获取用户能量值
  fastify.get<{
    Params: { userId: string };
  }>('/balance/:userId', async (request, reply) => {
    const { userId } = request.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { energyBalance: true },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return { balance: user.energyBalance };
  });

  // 获取能量值变动记录
  fastify.get<{
    Params: { userId: string };
    Querystring: { limit?: string };
  }>('/transactions/:userId', async (request, reply) => {
    const { userId } = request.params;
    const limit = parseInt(request.query.limit || '20');

    const transactions = await prisma.energyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { transactions };
  });

  // 充值能量值 (模拟接口，实际需要支付回调)
  fastify.post<{
    Body: { userId: string; amount: number };
  }>('/recharge', async (request, reply) => {
    const { userId, amount } = request.body;

    if (amount <= 0) {
      return reply.status(400).send({ error: 'Amount must be positive' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        energyBalance: { increment: amount },
      },
    });

    await prisma.energyTransaction.create({
      data: {
        userId,
        amount,
        type: 'RECHARGE',
        remark: '能量值充值',
      },
    });

    return {
      success: true,
      newBalance: user.energyBalance,
    };
  });
}
