import { create } from 'zustand';
import { useLanguage } from '../i18n';
import { persist } from 'zustand/middleware';
import type { User, UserLevel, TradeRecord, EnergyTransaction } from '../types';
import { LEVEL_CONFIG, FEE_RATES, getSoSoMultiplier, getSSIShieldAmount } from '../types';

// 30天毫秒数
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// 一周毫秒数
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// 创建能量交易记录
const createEnergyTransaction = (
  type: EnergyTransaction['type'],
  amount: number,
  balance: number,
  description: string,
  relatedId?: string
): EnergyTransaction => ({
  id: `energy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  amount,
  balance,
  timestamp: Date.now(),
  description,
  relatedId,
});

// 过滤30天内的能量记录
const filter30DayEnergyHistory = (history: EnergyTransaction[]): EnergyTransaction[] => {
  const thirtyDaysAgo = Date.now() - THIRTY_DAYS_MS;
  return history.filter(tx => tx.timestamp >= thirtyDaysAgo);
};

// 根据30天手续费计算等级
const calculateLevel = (fees30d: number): UserLevel => {
  if (fees30d >= 5000) return 'Diamond';
  if (fees30d >= 1000) return 'Gold';
  if (fees30d >= 200) return 'Silver';
  return 'Bronze';
};

// 计算30天内的手续费
const calculate30DayFees = (tradeHistory: TradeRecord[]): number => {
  const now = Date.now();
  const thirtyDaysAgo = now - THIRTY_DAYS_MS;
  return tradeHistory
    .filter(trade => trade.timestamp >= thirtyDaysAgo)
    .reduce((sum, trade) => sum + trade.fee, 0);
};

// 获取下一等级信息
export const getNextLevelInfo = (currentLevel: UserLevel, fees30d: number) => {
  const levels: UserLevel[] = ['Bronze', 'Silver', 'Gold', 'Diamond'];
  const currentIndex = levels.indexOf(currentLevel);

  if (currentIndex === levels.length - 1) {
    return { nextLevel: null, feesNeeded: 0, progress: 100 };
  }

  const nextLevel = levels[currentIndex + 1];
  const config = LEVEL_CONFIG[currentLevel];
  const nextConfig = LEVEL_CONFIG[nextLevel];

  const feesNeeded = Math.max(0, nextConfig.minFees - fees30d);
  const levelRange = config.maxFees - config.minFees;
  const progress = levelRange > 0
    ? Math.min(100, ((fees30d - config.minFees) / levelRange) * 100)
    : 100;

  return { nextLevel, feesNeeded, progress };
};

interface LevelUpgrade {
  previousLevel: UserLevel;
  newLevel: UserLevel;
}

// 预设演示用户
export interface DemoUser {
  id: string;
  name: string;
  level: UserLevel;
  fees30d: number;
  energyAvailable: number;
  sosoHolding: number;
  ssiStaked: number;
  walletAddress: string;
}

const DEMO_USERS_ZH: DemoUser[] = [
  {
    id: 'demo_bronze',
    name: '新手小白',
    level: 'Bronze',
    fees30d: 50,
    energyAvailable: 50,
    sosoHolding: 0,
    ssiStaked: 0,
    walletAddress: '0xBronze...demo',
  },
  {
    id: 'demo_silver',
    name: '进阶玩家',
    level: 'Silver',
    fees30d: 500,
    energyAvailable: 500,
    sosoHolding: 5000,
    ssiStaked: 0,
    walletAddress: '0xSilver...demo',
  },
  {
    id: 'demo_gold',
    name: 'VIP会员',
    level: 'Gold',
    fees30d: 2500,
    energyAvailable: 2500,
    sosoHolding: 25000,
    ssiStaked: 200000,
    walletAddress: '0xGold...demo',
  },
  {
    id: 'demo_diamond',
    name: '钻石大佬',
    level: 'Diamond',
    fees30d: 10000,
    energyAvailable: 10000,
    sosoHolding: 50000,
    ssiStaked: 1000000,
    walletAddress: '0xDiamond...demo',
  },
];

const DEMO_USERS_EN: DemoUser[] = [
  {
    id: 'demo_bronze',
    name: 'Beginner',
    level: 'Bronze',
    fees30d: 50,
    energyAvailable: 50,
    sosoHolding: 0,
    ssiStaked: 0,
    walletAddress: '0xBronze...demo',
  },
  {
    id: 'demo_silver',
    name: 'Intermediate',
    level: 'Silver',
    fees30d: 500,
    energyAvailable: 500,
    sosoHolding: 5000,
    ssiStaked: 0,
    walletAddress: '0xSilver...demo',
  },
  {
    id: 'demo_gold',
    name: 'VIP Member',
    level: 'Gold',
    fees30d: 2500,
    energyAvailable: 2500,
    sosoHolding: 25000,
    ssiStaked: 200000,
    walletAddress: '0xGold...demo',
  },
  {
    id: 'demo_diamond',
    name: 'Diamond Pro',
    level: 'Diamond',
    fees30d: 10000,
    energyAvailable: 10000,
    sosoHolding: 50000,
    ssiStaked: 1000000,
    walletAddress: '0xDiamond...demo',
  },
];

export const getDemoUsers = (language: 'zh' | 'en') => (
  language === 'zh' ? DEMO_USERS_ZH : DEMO_USERS_EN
);

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  levelUpgrade: LevelUpgrade | null;

  login: (walletAddress: string) => Promise<void>;
  loginAsDemo: (demoUser: DemoUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  syncEnergyBalance: () => Promise<void>;  // 从服务器同步能量余额
  clearLevelUpgrade: () => void;

  // 能量操作
  lockEnergy: (amount: number, description?: string) => boolean;
  unlockEnergy: (amount: number, description?: string) => void;
  spendEnergy: (amount: number, description?: string) => void;
  applyDecay: () => void;

  // 代币持有/质押模拟
  updateSoSoHolding: (amount: number) => void;
  updateSSIStaked: (amount: number) => void;

  // 交易模拟
  simulateTrade: (volume: number, type: 'spot' | 'futures', side: 'maker' | 'taker') => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      levelUpgrade: null,

      login: async (walletAddress: string) => {
        set({ isLoading: true, error: null });
        try {
          // 创建新用户（模拟）
          const now = Date.now();
          const user: User = {
            id: `user_${now}`,
            walletAddress,
            isWhitelist: true,

            // 能量系统 - 初始为0，需要交易产生
            energyAvailable: 0,
            energyLocked: 0,
            energySpent: 0,
            energyExpired: 0,
            lastDecayAt: now,

            // 代币持有/质押 - 模拟初始值
            sosoHolding: 0,
            ssiStaked: 0,

            // 等级系统
            level: 'Bronze',
            fees30d: 0,
            totalFees: 0,
            totalTrades: 0,

            tradeHistory: [],
            energyHistory: [],
            joinedAt: new Date().toISOString(),
          };

          set({ user, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loginAsDemo: (demoUser: DemoUser) => {
        const now = Date.now();
        const user: User = {
          id: demoUser.id,
          walletAddress: demoUser.walletAddress,
          isWhitelist: true,

          energyAvailable: demoUser.energyAvailable,
          energyLocked: 0,
          energySpent: 0,
          energyExpired: 0,
          lastDecayAt: now,

          sosoHolding: demoUser.sosoHolding,
          ssiStaked: demoUser.ssiStaked,

          level: demoUser.level,
          fees30d: demoUser.fees30d,
          totalFees: demoUser.fees30d,
          totalTrades: Math.floor(demoUser.fees30d / 10),

          tradeHistory: [],
          energyHistory: [],
          joinedAt: new Date().toISOString(),
        };

        set({ user, isLoading: false, error: null });
      },

      logout: () => {
        set({ user: null, error: null, levelUpgrade: null });
      },

      refreshUser: async () => {
        const { user } = get();
        if (!user) return;

        // 重新计算30天手续费和等级
        const fees30d = calculate30DayFees(user.tradeHistory);
        const newLevel = calculateLevel(fees30d);

        set({
          user: {
            ...user,
            fees30d,
            level: newLevel,
          }
        });
      },

      // 从服务器同步能量余额
      syncEnergyBalance: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const response = await fetch(`/api/energy/balance/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            set({
              user: {
                ...user,
                energyAvailable: data.balance,
              }
            });
          } else if (response.status === 404) {
            // 用户在服务器不存在（demo用户），保持本地mock数据
            console.log('User not found on server, keeping local energy value');
          }
        } catch (error) {
          console.error('Failed to sync energy balance:', error);
        }
      },

      clearLevelUpgrade: () => {
        set({ levelUpgrade: null });
      },

      // 锁定能量（服务预扣）
      lockEnergy: (amount: number, description) => {
        const t = useLanguage.getState().t;
        const finalDescription = description || t('energyHistory.locked');
        const { user } = get();
        if (!user || user.energyAvailable < amount) return false;

        const newAvailable = user.energyAvailable - amount;
        const tx = createEnergyTransaction('locked', amount, newAvailable, finalDescription);

        set({
          user: {
            ...user,
            energyAvailable: newAvailable,
            energyLocked: user.energyLocked + amount,
            energyHistory: filter30DayEnergyHistory([...user.energyHistory, tx]),
          }
        });
        return true;
      },

      // 解锁能量（服务取消/退回）
      unlockEnergy: (amount: number, description) => {
        const t = useLanguage.getState().t;
        const finalDescription = description || t('energyHistory.unlocked');
        const { user } = get();
        if (!user) return;

        const unlockAmount = Math.min(amount, user.energyLocked);
        const newAvailable = user.energyAvailable + unlockAmount;
        const tx = createEnergyTransaction('unlocked', unlockAmount, newAvailable, finalDescription);

        set({
          user: {
            ...user,
            energyAvailable: newAvailable,
            energyLocked: user.energyLocked - unlockAmount,
            energyHistory: filter30DayEnergyHistory([...user.energyHistory, tx]),
          }
        });
      },

      // 消耗能量（服务完成）
      spendEnergy: (amount: number, description) => {
        const t = useLanguage.getState().t;
        const finalDescription = description || t('energyHistory.spent');
        const { user } = get();
        if (!user) return;

        const spendAmount = Math.min(amount, user.energyLocked);
        const tx = createEnergyTransaction('spent', spendAmount, user.energyAvailable, finalDescription);

        set({
          user: {
            ...user,
            energyLocked: user.energyLocked - spendAmount,
            energySpent: user.energySpent + spendAmount,
            energyHistory: filter30DayEnergyHistory([...user.energyHistory, tx]),
          }
        });
      },

      // 应用能量衰减（每周）- SSI Shield 保护部分能量不衰减
      applyDecay: () => {
        const { user } = get();
        if (!user) return;

        const now = Date.now();
        const timeSinceLastDecay = now - user.lastDecayAt;

        // 如果距离上次衰减不足一周，不衰减
        if (timeSinceLastDecay < ONE_WEEK_MS) return;

        const config = LEVEL_CONFIG[user.level];
        // SSI Shield: 保护一定数量的能量不衰减
        const shieldAmount = getSSIShieldAmount(user.ssiStaked ?? 0);
        // 可参与衰减的能量 = 可用能量 - Shield保护量
        const decayableEnergy = Math.max(0, user.energyAvailable - shieldAmount);
        const decayAmount = Math.floor(decayableEnergy * config.decayRate);

        if (decayAmount > 0) {
          const newAvailable = user.energyAvailable - decayAmount;
          const t = useLanguage.getState().t;
          const rate = (config.decayRate * 100).toFixed(0);
          const description = shieldAmount > 0
            ? t('energyHistory.weeklyDecayWithShield')
              .replace('{rate}', rate)
              .replace('{shield}', shieldAmount.toFixed(0))
            : t('energyHistory.weeklyDecay').replace('{rate}', rate);
          const tx = createEnergyTransaction(
            'expired',
            decayAmount,
            newAvailable,
            description
          );

          set({
            user: {
              ...user,
              energyAvailable: newAvailable,
              energyExpired: user.energyExpired + decayAmount,
              lastDecayAt: now,
              energyHistory: filter30DayEnergyHistory([...user.energyHistory, tx]),
            }
          });
        } else {
          // 即使没有衰减，也更新时间戳
          set({
            user: {
              ...user,
              lastDecayAt: now,
            }
          });
        }
      },

      // 更新 SoSo 持有量
      updateSoSoHolding: (amount: number) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, sosoHolding: Math.max(0, amount) } });
      },

      // 更新 SSI 质押量
      updateSSIStaked: (amount: number) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, ssiStaked: Math.max(0, amount) } });
      },

      // 模拟交易
      simulateTrade: (volume: number, type: 'spot' | 'futures', side: 'maker' | 'taker') => {
        const { user } = get();
        if (!user || volume <= 0) return;

        const now = Date.now();

        // 计算手续费
        const feeRate = FEE_RATES[type][side];
        const fee = volume * feeRate;

        // SoSo 持有加成铸造倍率
        const sosoMultiplier = getSoSoMultiplier(user.sosoHolding ?? 0);
        const boost = sosoMultiplier - 1; // 0 ~ 0.10
        // 铸造能量 = 手续费 × SoSo倍率
        const energyMinted = fee * sosoMultiplier;

        // 创建交易记录
        const trade: TradeRecord = {
          id: `trade_${now}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          type,
          side,
          volume,
          fee,
          energyMinted,
        };

        // 添加到历史记录（保留最近30天）
        const thirtyDaysAgo = now - THIRTY_DAYS_MS;
        const updatedHistory = [...user.tradeHistory, trade]
          .filter(t => t.timestamp >= thirtyDaysAgo);

        // 累加手续费到现有的 fees30d（保留演示用户的初始值）
        const newFees30d = (user.fees30d ?? 0) + fee;
        const newLevel = calculateLevel(newFees30d);
        const levelChanged = newLevel !== user.level;
        const previousLevel = user.level;

        // 新的可用能量
        const newAvailable = user.energyAvailable + energyMinted;

        // 创建能量交易记录
        const t = useLanguage.getState().t;
        const typeLabel = type === 'spot' ? t('energyHistory.spot') : t('energyHistory.futures');
        const volumeLabel = volume >= 1000 ? `$${(volume / 1000).toFixed(0)}k` : `$${volume}`;
        const boostLabel = boost > 0 ? ` (+${(boost * 100).toFixed(0)}% Boost)` : '';
        const tx = createEnergyTransaction(
          'minted',
          energyMinted,
          newAvailable,
          t('energyHistory.tradeDesc').replace('{type}', typeLabel).replace('{volume}', volumeLabel).replace('{boost}', boostLabel),
          trade.id
        );

        set({
          user: {
            ...user,
            energyAvailable: newAvailable,
            fees30d: newFees30d,
            totalFees: user.totalFees + fee,
            totalTrades: user.totalTrades + 1,
            level: newLevel,
            tradeHistory: updatedHistory,
            energyHistory: filter30DayEnergyHistory([...user.energyHistory, tx]),
          },
          levelUpgrade: levelChanged ? { previousLevel, newLevel } : null,
        });
      },
    }),
    {
      name: 'user-storage-v4',
      // 迁移旧数据
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          const now = Date.now();
          // 确保新字段存在
          state.user = {
            ...state.user,
            energyAvailable: state.user.energyAvailable ?? 0,
            energyLocked: state.user.energyLocked ?? 0,
            energySpent: state.user.energySpent ?? 0,
            energyExpired: state.user.energyExpired ?? 0,
            lastDecayAt: state.user.lastDecayAt ?? now,
            sosoHolding: state.user.sosoHolding ?? 0,
            ssiStaked: state.user.ssiStaked ?? 0,
            fees30d: state.user.fees30d ?? 0,
            totalFees: state.user.totalFees ?? 0,
            tradeHistory: state.user.tradeHistory ?? [],
            energyHistory: state.user.energyHistory ?? [],
            level: state.user.level || 'Bronze',
          };

          // 重新计算30天手续费
          if (state.user.tradeHistory.length > 0) {
            state.user.fees30d = calculate30DayFees(state.user.tradeHistory);
            state.user.level = calculateLevel(state.user.fees30d);
          }

          // 清理过期的能量历史
          if (state.user.energyHistory.length > 0) {
            state.user.energyHistory = filter30DayEnergyHistory(state.user.energyHistory);
          }
        }
      },
    }
  )
);
