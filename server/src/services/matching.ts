import { PrismaClient, Researcher } from '@prisma/client';

// 交易上下文到研究员领域的映射
const CONTEXT_TO_SPECIALTY: Record<string, string[]> = {
  'BTC': ['BTC', '比特币'],
  'BTCUSD': ['BTC', '比特币'],
  'BTCUSDT': ['BTC', '比特币'],
  'ETH': ['BTC', '比特币', 'DeFi'], // ETH也可以归到BTC组
  'GOLD': ['贵金属', '黄金'],
  'XAUUSD': ['贵金属', '黄金'],
  'SILVER': ['贵金属', '白银'],
  'XAGUSD': ['贵金属', '白银'],
  'PERP': ['Perpdex', 'DeFi'],
};

/**
 * 根据交易上下文匹配研究员
 * @param prisma Prisma客户端
 * @param context 交易上下文 (如 "BTC/USDT")
 * @param count 需要匹配的研究员数量
 * @returns 匹配的研究员列表
 */
export async function matchResearchers(
  prisma: PrismaClient,
  context: string | null,
  count: number = 3
): Promise<Researcher[]> {
  // 解析上下文获取对应的领域
  const specialties = getSpecialtiesFromContext(context);

  // 获取所有在线研究员（排除测试数据）
  const onlineResearchers = await prisma.researcher.findMany({
    where: {
      status: 'ONLINE',
      // 排除测试研究员（ID 以 test- 开头的）
      NOT: {
        id: {
          startsWith: 'test-',
        },
      },
    },
    orderBy: {
      recommendScore: 'desc',
    },
  });

  if (onlineResearchers.length === 0) {
    return [];
  }

  // 按领域匹配度和推荐分排序
  const scoredResearchers = onlineResearchers.map((researcher) => {
    const researcherSpecialties = JSON.parse(researcher.specialties) as string[];
    const matchScore = calculateMatchScore(researcherSpecialties, specialties);
    return {
      researcher,
      totalScore: matchScore * 100 + researcher.recommendScore,
    };
  });

  // 按总分排序并取前N个
  scoredResearchers.sort((a, b) => b.totalScore - a.totalScore);

  return scoredResearchers.slice(0, count).map((s) => s.researcher);
}

/**
 * 从交易上下文解析对应的研究领域
 */
function getSpecialtiesFromContext(context: string | null): string[] {
  if (!context) {
    return []; // 无上下文时返回空，将匹配所有研究员
  }

  // 尝试匹配上下文
  const upperContext = context.toUpperCase().replace('/', '');

  for (const [key, specialties] of Object.entries(CONTEXT_TO_SPECIALTY)) {
    if (upperContext.includes(key)) {
      return specialties;
    }
  }

  return [];
}

/**
 * 计算领域匹配度
 */
function calculateMatchScore(
  researcherSpecialties: string[],
  targetSpecialties: string[]
): number {
  if (targetSpecialties.length === 0) {
    return 0.5; // 无目标领域时给基础分
  }

  const matches = researcherSpecialties.filter((s) =>
    targetSpecialties.some((t) => s.includes(t) || t.includes(s))
  );

  return matches.length / targetSpecialties.length;
}

/**
 * 更新研究员推荐分
 */
export async function updateRecommendScore(
  prisma: PrismaClient,
  researcherId: string,
  delta: number
): Promise<void> {
  await prisma.researcher.update({
    where: { id: researcherId },
    data: {
      recommendScore: {
        increment: delta,
      },
    },
  });
}

// 推荐分变动规则
export const SCORE_RULES = {
  SELECTED: 5,           // 被用户选中
  GOOD_RATING: 3,        // 获得好评 (4-5星)
  FAST_RESPONSE: 1,      // 响应速度快 (<1分钟)
  TIMEOUT: -10,          // 超时未回答
  BAD_RATING: -5,        // 获得差评 (1-2星)
  REJECT: -3,            // 主动拒单
};
