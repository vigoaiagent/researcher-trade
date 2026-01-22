// 用户等级 (映射到 Tier 0/1/2/3)
export type UserLevel = 'Bronze' | 'Silver' | 'Gold' | 'Diamond';

// 手续费费率
export const FEE_RATES = {
  spot: { maker: 0.0004, taker: 0.0007 },      // 0.04% / 0.07%
  futures: { maker: 0.00015, taker: 0.00045 }, // 0.015% / 0.045%
};

// 等级配置 (基于30天手续费贡献)
export const LEVEL_CONFIG: Record<UserLevel, {
  tier: number;           // Tier 等级
  minFees: number;        // 30天最低手续费贡献 (USD)
  maxFees: number;        // 30天最高手续费贡献 (USD)
  decayRate: number;      // 周衰减率
  energyCap: number;      // 能量上限倍数 (基于30天平均周铸造)
  color: string;
  benefits: string[];
  hasResearcherAccess: boolean;  // 是否解锁专属顾问
  hasPhoneAccess: boolean;       // 是否解锁电话
  hasRoadshowAccess: boolean;    // 是否解锁路演日历
}> = {
  Bronze: {
    tier: 0,
    minFees: 0,
    maxFees: 200,
    decayRate: 0.20,      // 20%/周
    energyCap: 1,
    color: '#cd7f32',
    benefits: ['levelBenefits.aiSupport', 'levelBenefits.basicMarket'],
    hasResearcherAccess: false,
    hasPhoneAccess: false,
    hasRoadshowAccess: false,
  },
  Silver: {
    tier: 1,
    minFees: 200,
    maxFees: 1000,
    decayRate: 0.15,      // 15%/周
    energyCap: 2,
    color: '#c0c0c0',
    benefits: ['levelBenefits.aiResearcher', 'levelBenefits.deepAnalysis'],
    hasResearcherAccess: false,
    hasPhoneAccess: false,
    hasRoadshowAccess: false,
  },
  Gold: {
    tier: 2,
    minFees: 1000,
    maxFees: 5000,
    decayRate: 0.10,      // 10%/周
    energyCap: 3,
    color: '#ffd700',
    benefits: ['levelBenefits.exclusiveResearcher', 'levelBenefits.exclusiveReports', 'levelBenefits.community', 'levelBenefits.roadshowCalendar'],
    hasResearcherAccess: true,
    hasPhoneAccess: false,
    hasRoadshowAccess: true,
  },
  Diamond: {
    tier: 3,
    minFees: 5000,
    maxFees: Infinity,
    decayRate: 0.05,      // 5%/周
    energyCap: 5,
    color: '#b9f2ff',
    benefits: ['levelBenefits.vipResearcher', 'levelBenefits.phoneConsult', 'levelBenefits.privateChannel', 'levelBenefits.roadshowCalendar'],
    hasResearcherAccess: true,
    hasPhoneAccess: true,
    hasRoadshowAccess: true,
  },
};

// SoSo 持有 → 能量 Boost (最高 10% 加成)
// 注：SoSo 不直接铸造能量，只提供小幅加成
export const SOSO_BOOST_CONFIG = {
  maxBoost: 0.10,        // 最高 10% 加成
  threshold: 1000,       // 最低持有量才有加成
  maxHolding: 50000,     // 达到此持有量获得满额加成
};

// SSI 质押 → Energy Shield (能量护盾，保护不衰减)
// Shield 机制：按 SSI 贡献收益的 10% 计算，另有保底
export const SSI_SHIELD_CONFIG = {
  ratePerWeek: 0.00007,  // SSI 质押价值 × 此比例 = 每周 ShieldBase
  // Floor 保底（每周受保护能量）
  floors: {
    none: 0,              // 无质押
    normal: 50,           // 普通质押 (< $200k)
    core: 150,            // Core SSI ($200k+)
    vip: 500,             // VIP SSI ($1M+)
  },
  // SSI 质押门槛 (USD)
  tiers: {
    core: 200000,         // Core SSI: $200k+，解锁电话服务
    vip: 1000000,         // VIP SSI: $1M+
  },
};

// 获取 SoSo Boost 加成比例 (0 ~ 0.10)
export const getSoSoBoost = (sosoHolding: number): number => {
  if (sosoHolding < SOSO_BOOST_CONFIG.threshold) return 0;
  const ratio = Math.min(sosoHolding / SOSO_BOOST_CONFIG.maxHolding, 1);
  return ratio * SOSO_BOOST_CONFIG.maxBoost;
};

// 获取 SSI Shield 等级
export type SSITier = 'none' | 'normal' | 'core' | 'vip';
export const getSSITier = (ssiStakedUSD: number): SSITier => {
  if (ssiStakedUSD >= SSI_SHIELD_CONFIG.tiers.vip) return 'vip';
  if (ssiStakedUSD >= SSI_SHIELD_CONFIG.tiers.core) return 'core';
  if (ssiStakedUSD > 0) return 'normal';
  return 'none';
};

// 获取 SSI Shield 每周受保护能量
export const getSSIShieldAmount = (ssiStakedUSD: number): number => {
  const tier = getSSITier(ssiStakedUSD);
  const floor = SSI_SHIELD_CONFIG.floors[tier];
  const calculated = ssiStakedUSD * SSI_SHIELD_CONFIG.ratePerWeek;
  return Math.max(floor, calculated);
};

// 是否有电话服务权限 (仅 Core SSI / VIP SSI)
export const hasPhoneServiceAccess = (ssiStakedUSD: number): boolean => {
  return ssiStakedUSD >= SSI_SHIELD_CONFIG.tiers.core;
};

// 兼容旧代码 - 保留但标记废弃
/** @deprecated 使用 getSoSoBoost */
export const getSoSoMultiplier = (sosoHolding: number): number => {
  return 1 + getSoSoBoost(sosoHolding);
};

/** @deprecated 使用 getSSIShieldAmount */
export const getSSIDecayReduction = (ssiStaked: number): number => {
  // 转换为简单的比例（用于向后兼容）
  const shield = getSSIShieldAmount(ssiStaked);
  return Math.min(shield / 500, 0.20); // 简化转换
};

// 能量状态
export type EnergyState = 'available' | 'locked' | 'spent' | 'expired';

// 能量交易类型
export type EnergyTransactionType =
  | 'minted'    // 铸造 (交易产生)
  | 'spent'     // 消耗 (咨询服务)
  | 'expired'   // 衰减 (每周衰减)
  | 'locked'    // 锁定 (服务预扣)
  | 'unlocked'; // 解锁 (服务取消/退回)

// 能量交易记录
export interface EnergyTransaction {
  id: string;
  type: EnergyTransactionType;
  amount: number;           // 正数
  balance: number;          // 交易后可用余额
  timestamp: number;
  description: string;      // 描述，如 "现货交易 $10,000"
  relatedId?: string;       // 关联ID (如交易ID、咨询ID)
}

// 交易记录 (用于计算30天手续费)
export interface TradeRecord {
  id: string;
  timestamp: number;
  type: 'spot' | 'futures';
  side: 'maker' | 'taker';
  volume: number;       // 成交金额 (USDT)
  fee: number;          // 手续费 (USDT)
  energyMinted: number; // 铸造的能量
}

// 用户
export interface User {
  id: string;
  walletAddress: string;
  isWhitelist: boolean;

  // 能量系统
  energyAvailable: number;    // 可用能量
  energyLocked: number;       // 锁定能量 (服务预扣)
  energySpent: number;        // 已消耗能量 (本周)
  energyExpired: number;      // 已衰减能量 (累计)
  lastDecayAt: number;        // 上次衰减时间戳

  // 代币持有/质押
  sosoHolding: number;        // SoSo 持有量 → 影响铸造倍率
  ssiStaked: number;          // SSI 质押量 → 影响衰减减免

  // 等级系统 (基于30天手续费)
  level: UserLevel;
  fees30d: number;            // 近30天手续费贡献 (USD)
  totalFees: number;          // 累计手续费贡献 (USD)
  totalTrades: number;        // 总交易次数

  // 交易记录 (用于滚动计算30天)
  tradeHistory: TradeRecord[];

  // 能量交易历史 (用于展示)
  energyHistory: EnergyTransaction[];

  // 体验券系统
  hasTrialVoucher?: boolean;  // 是否有体验券
  trialUsed?: boolean;        // 是否已使用体验券

  joinedAt: string;           // 注册时间
}

// 研究员徽章类型
export type ResearcherBadge = 'top_rated' | 'expert' | 'verified' | 'hot' | 'rising_star' | 'veteran';

// 研究员擅长领域
export interface ExpertiseArea {
  domain: string;       // 领域名称，如 "BTC分析"、"DeFi研究"
  yearsExp: number;     // 经验年数
  accuracy?: number;    // 准确率（可选）
}

// 研究员
export interface Researcher {
  id: string;
  name: string;
  avatar?: string;
  specialties: string[];
  ratingScore: number;
  serviceCount: number;
  responseTimeAvg: number;
  // 新增字段
  badges?: ResearcherBadge[];        // 徽章列表
  expertiseAreas?: ExpertiseArea[];  // 擅长领域详情
  bio?: string;                       // 个人简介
  successRate?: number;               // 成功率/命中率
}

// 咨询状态
export type ConsultationStatus =
  | 'PENDING'
  | 'WAITING_SELECT'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'TIMEOUT'
  | 'CANCELLED';

// 咨询会话
export interface Consultation {
  id: string;
  userId: string;
  context?: string;
  question: string;
  status: ConsultationStatus;
  energyCost: number;
  roundsUsed: number;
  maxRounds: number;
  createdAt: string;
  closedAt?: string;
}

// 研究员回答
export interface ResearcherAnswer {
  id: string;
  consultationId: string;
  researcherId: string;
  firstAnswer?: string;
  isSelected: boolean;
  answeredAt?: string;
  researcher: Researcher;
}

// 消息
export interface Message {
  id: string;
  consultationId: string;
  senderType: 'USER' | 'RESEARCHER';
  senderId: string;
  content: string;
  createdAt: string;
}

// 评价
export interface Rating {
  id: string;
  consultationId: string;
  researcherId: string;
  userId: string;
  score: number;
  comment?: string;
}

// 聊天面板阶段
export type ChatPhase =
  | 'idle'           // 初始状态
  | 'asking'         // 输入问题
  | 'waiting'        // 等待研究员回答
  | 'selecting'      // 选择研究员
  | 'chatting'       // 1v1对话
  | 'rating'         // 评价
  | 'completed';     // 完成
