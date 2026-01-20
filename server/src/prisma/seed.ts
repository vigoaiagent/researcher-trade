import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 创建测试用户
  const testUser = await prisma.user.upsert({
    where: { walletAddress: '0x1234567890abcdef1234567890abcdef12345678' },
    update: {},
    create: {
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      isWhitelist: true,
      energyBalance: 100,
    },
  });
  console.log('✅ Test user created:', testUser.walletAddress);

  // 创建 Demo 用户 (与前端 DEMO_USERS 对应)
  const demoUsers = [
    { id: 'demo_bronze', walletAddress: '0xBronze...demo', energyBalance: 50 },
    { id: 'demo_silver', walletAddress: '0xSilver...demo', energyBalance: 500 },
    { id: 'demo_gold', walletAddress: '0xGold...demo', energyBalance: 2500 },
    { id: 'demo_diamond', walletAddress: '0xDiamond...demo', energyBalance: 10000 },
  ];

  for (const demoUser of demoUsers) {
    await prisma.user.upsert({
      where: { id: demoUser.id },
      update: { energyBalance: demoUser.energyBalance }, // 更新能量值
      create: {
        id: demoUser.id,
        walletAddress: demoUser.walletAddress,
        isWhitelist: true,
        energyBalance: demoUser.energyBalance,
      },
    });
    console.log(`✅ Demo user created: ${demoUser.id} (${demoUser.energyBalance} energy)`);
  }

  // 检查是否有真实研究员（tgUserId 不是以 researcher_ 开头的）
  const realResearcherCount = await prisma.researcher.count({
    where: {
      NOT: {
        tgUserId: {
          startsWith: 'researcher_',
        },
      },
    },
  });

  // 只有在没有真实研究员时才创建测试研究员
  if (realResearcherCount === 0) {
    console.log('⚠️ No real researchers found, creating test researchers...');

    const researchers = [
      {
        tgUserId: 'researcher_1',
        tgChatId: '100001',
        name: 'BTC分析师小王',
        specialties: JSON.stringify(['BTC', '比特币', '链上数据']),
        status: 'ONLINE',
        recommendScore: 100,
      },
      {
        tgUserId: 'researcher_2',
        tgChatId: '100002',
        name: 'BTC研究员老张',
        specialties: JSON.stringify(['BTC', '比特币', '技术分析']),
        status: 'ONLINE',
        recommendScore: 95,
      },
      {
        tgUserId: 'researcher_3',
        tgChatId: '100003',
        name: '贵金属专家李教授',
        specialties: JSON.stringify(['贵金属', '黄金', '宏观经济']),
        status: 'ONLINE',
        recommendScore: 90,
      },
    ];

    for (const researcher of researchers) {
      await prisma.researcher.upsert({
        where: { tgUserId: researcher.tgUserId },
        update: {},
        create: researcher,
      });
      console.log('✅ Test researcher created:', researcher.name);
    }
  } else {
    console.log(`✅ Found ${realResearcherCount} real researcher(s), skipping test researchers`);
  }

  console.log('🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
