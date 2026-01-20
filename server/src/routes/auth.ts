import { FastifyInstance } from 'fastify';

export async function authRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;

  // 用户登录/注册 (通过钱包地址)
  fastify.post<{
    Body: { walletAddress: string };
  }>('/login', async (request, reply) => {
    const { walletAddress } = request.body;

    if (!walletAddress) {
      return reply.status(400).send({ error: 'Wallet address is required' });
    }

    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          isWhitelist: true, // MVP阶段默认白名单
          energyBalance: 100, // 初始能量值
        },
      });
    }

    return {
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        isWhitelist: user.isWhitelist,
        energyBalance: user.energyBalance,
      },
    };
  });

  // 获取用户信息
  fastify.get<{
    Params: { walletAddress: string };
  }>('/user/:walletAddress', async (request, reply) => {
    const { walletAddress } = request.params;

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return {
      id: user.id,
      walletAddress: user.walletAddress,
      isWhitelist: user.isWhitelist,
      energyBalance: user.energyBalance,
    };
  });

  // 检查白名单状态
  fastify.get<{
    Params: { walletAddress: string };
  }>('/whitelist/:walletAddress', async (request, reply) => {
    const { walletAddress } = request.params;

    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: { isWhitelist: true },
    });

    return {
      isWhitelist: user?.isWhitelist ?? false,
    };
  });
}
