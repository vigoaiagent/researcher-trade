import { create } from 'zustand';
import type { ChatPhase, Consultation, ResearcherAnswer, Message, ResearcherBadge, ExpertiseArea } from '../types';
import { consultationApi } from '../services/api';
import { difyApi } from '../services/dify';
import { markTrialVoucherUsed } from '../components/NewUserWelcomeModal';
import { useLanguage } from '../i18n';

// Mock badges and expertise data for demo
const MOCK_RESEARCHER_ENHANCEMENTS: Record<string, {
  badges: ResearcherBadge[];
  expertiseAreas: ExpertiseArea[];
  expertiseAreasEn: ExpertiseArea[];
  bio: string;
  bioEn: string;
  successRate: number;
}> = {
  default_1: {
    badges: ['top_rated', 'expert', 'verified'],
    expertiseAreas: [
      { domain: 'BTC 趋势分析', yearsExp: 5, accuracy: 82 },
      { domain: '链上数据解读', yearsExp: 4, accuracy: 78 },
    ],
    expertiseAreasEn: [
      { domain: 'BTC Trend Analysis', yearsExp: 5, accuracy: 82 },
      { domain: 'On-chain Data Insights', yearsExp: 4, accuracy: 78 },
    ],
    bio: '前高盛量化分析师，专注加密货币市场研究',
    bioEn: 'Former Goldman Sachs quant analyst specializing in crypto market research.',
    successRate: 79,
  },
  default_2: {
    badges: ['hot', 'verified'],
    expertiseAreas: [
      { domain: 'DeFi 协议研究', yearsExp: 3, accuracy: 75 },
      { domain: 'ETH 生态分析', yearsExp: 4, accuracy: 80 },
    ],
    expertiseAreasEn: [
      { domain: 'DeFi Protocol Research', yearsExp: 3, accuracy: 75 },
      { domain: 'ETH Ecosystem Analysis', yearsExp: 4, accuracy: 80 },
    ],
    bio: '资深 DeFi 研究员，擅长协议机制分析',
    bioEn: 'Senior DeFi researcher focused on protocol mechanics.',
    successRate: 76,
  },
  default_3: {
    badges: ['rising_star', 'verified'],
    expertiseAreas: [
      { domain: 'Solana 生态', yearsExp: 2, accuracy: 71 },
      { domain: 'NFT 市场', yearsExp: 2 },
    ],
    expertiseAreasEn: [
      { domain: 'Solana Ecosystem', yearsExp: 2, accuracy: 71 },
      { domain: 'NFT Markets', yearsExp: 2 },
    ],
    bio: 'Solana 生态深耕者，新锐分析师',
    bioEn: 'Emerging analyst specializing in the Solana ecosystem.',
    successRate: 68,
  },
  default_4: {
    badges: ['veteran', 'expert', 'top_rated'],
    expertiseAreas: [
      { domain: '宏观经济分析', yearsExp: 8, accuracy: 85 },
      { domain: '市场周期研究', yearsExp: 7, accuracy: 83 },
    ],
    expertiseAreasEn: [
      { domain: 'Macro Economic Analysis', yearsExp: 8, accuracy: 85 },
      { domain: 'Market Cycle Research', yearsExp: 7, accuracy: 83 },
    ],
    bio: '10年+金融市场经验，宏观分析专家',
    bioEn: 'Macro analyst with 10+ years in financial markets.',
    successRate: 84,
  },
};

// 服务模式
export type ServiceMode = 'select' | 'ai' | 'researcher';

// AI对话消息
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatState {
  // UI状态
  isOpen: boolean;
  phase: ChatPhase;
  serviceMode: ServiceMode;

  // 咨询数据
  currentConsultation: Consultation | null;
  answers: ResearcherAnswer[];
  messages: Message[];
  selectedResearcher: ResearcherAnswer | null;

  // 续费相关
  roundsExhausted: boolean;
  extendCost: number;

  // AI客服数据
  aiMessages: AIMessage[];
  isAITyping: boolean;

  // 体验券状态
  isUsingTrialVoucher: boolean;

  // 加载状态
  isLoading: boolean;
  error: string | null;

  // Actions
  openChat: () => void;
  closeChat: () => void;
  setPhase: (phase: ChatPhase) => void;
  setServiceMode: (mode: ServiceMode) => void;

  // AI客服
  sendAIMessage: (content: string) => Promise<void>;
  clearAIMessages: () => void;

  // 咨询流程
  createConsultation: (userId: string, question: string, context?: string, targetResearcherId?: string, usingTrial?: boolean) => Promise<void>;
  fetchAnswers: () => Promise<void>;
  selectResearcher: (answer: ResearcherAnswer) => Promise<void>;
  skipSelection: () => void; // 跳过研究员选择，返回提问阶段
  sendMessage: (userId: string, content: string) => Promise<void>;
  extendConsultation: (userId: string) => Promise<{ success: boolean; newMaxRounds: number; roundsUsed: number; roundsLeft: number; energyCost: number; newEnergyBalance: number } | undefined>;
  completeConsultation: () => Promise<void>;
  submitRating: (userId: string, score: number, comment?: string) => Promise<void>;
  setRoundsExhausted: (exhausted: boolean, cost?: number) => void;

  // 重置
  reset: () => void;

  // 消息更新 (from socket)
  addMessage: (message: Message) => void;
  updateConsultationStatus: (status: string) => void;
}

const initialState = {
  isOpen: false,
  phase: 'idle' as ChatPhase,
  serviceMode: 'ai' as ServiceMode,
  currentConsultation: null,
  answers: [],
  messages: [],
  selectedResearcher: null,
  roundsExhausted: false,
  extendCost: 5,
  aiMessages: [] as AIMessage[],
  isAITyping: false,
  isUsingTrialVoucher: false,
  isLoading: false,
  error: null,
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,

  openChat: () => set({ isOpen: true, serviceMode: 'ai' }),
  closeChat: () => set({ isOpen: false }),
  setPhase: (phase) => set({ phase }),
  setServiceMode: (mode) => set({ serviceMode: mode }),

  // AI客服 - Dify API
  sendAIMessage: async (content) => {
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      aiMessages: [...state.aiMessages, userMessage],
      isAITyping: true,
    }));

    try {
      let responseText: string;

      // 检查Dify配置状态
      const isConfigured = difyApi.isConfigured();
      console.log('[AI Chat] Dify configured:', isConfigured);

      // 使用Dify API（如果已配置）
      if (isConfigured) {
        console.log('[AI Chat] Calling Dify API...');
        responseText = await difyApi.chat(content, 'user');
        console.log('[AI Chat] Dify response received');
      } else {
        // 未配置时使用模拟响应
        console.log('[AI Chat] Dify not configured, using mock response');
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
        responseText = getAIMockResponse(content);
      }

      const aiResponse: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        aiMessages: [...state.aiMessages, aiResponse],
        isAITyping: false,
      }));
    } catch (error: any) {
      console.error('[AI Chat] Dify API error:', error);
      // 如果Dify API失败，回退到模拟响应
      const aiResponse: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: getAIMockResponse(content),
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        aiMessages: [...state.aiMessages, aiResponse],
        isAITyping: false,
        error: null, // 不显示错误，静默回退
      }));
    }
  },

  clearAIMessages: () => {
    difyApi.resetConversation();
    set({ aiMessages: [] });
  },

  createConsultation: async (userId, question, context, targetResearcherId, usingTrial = false) => {
    set({ isLoading: true, error: null, isUsingTrialVoucher: usingTrial });
    try {
      const result = await consultationApi.create(userId, question, context, targetResearcherId, usingTrial);

      // 获取咨询详情
      const detail = await consultationApi.getDetail(result.consultationId);

      // 直接咨询模式：跳过等待，直接进入对话
      if (result.isDirect && result.targetResearcherId) {
        // 从 consultationResearchers 中找到被选中的研究员
        const selectedResearcher = detail.consultationResearchers?.find(
          (cr: any) => cr.researcherId === result.targetResearcherId
        );

        // 构建初始消息列表
        const messages = [
          {
            id: 'initial-question',
            consultationId: detail.id,
            senderType: 'USER' as const,
            senderId: userId,
            content: question,
            createdAt: detail.createdAt,
          },
        ];

        set({
          currentConsultation: detail,
          selectedResearcher: selectedResearcher || null,
          messages,
          phase: 'chatting',
          isLoading: false,
        });
      } else {
        // 普通模式：进入等待匹配
        set({
          currentConsultation: detail,
          phase: 'waiting',
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchAnswers: async () => {
    const { currentConsultation } = get();
    if (!currentConsultation) return;

    try {
      const { answers } = await consultationApi.getAnswers(currentConsultation.id);

      // Enrich researcher data with mock badges and expertise for demo
      const language = useLanguage.getState().language;
      const enrichedAnswers = answers.map((answer, index) => {
        const mockKey = `default_${(index % 4) + 1}`;
        const enhancement = MOCK_RESEARCHER_ENHANCEMENTS[mockKey];
        const expertiseAreas = enhancement
          ? (language === 'zh' ? enhancement.expertiseAreas : enhancement.expertiseAreasEn)
          : undefined;
        const bio = enhancement
          ? (language === 'zh' ? enhancement.bio : enhancement.bioEn)
          : undefined;
        return {
          ...answer,
          researcher: {
            ...answer.researcher,
            badges: answer.researcher.badges ?? enhancement?.badges,
            expertiseAreas: answer.researcher.expertiseAreas ?? expertiseAreas,
            bio: answer.researcher.bio ?? bio,
            successRate: answer.researcher.successRate ?? enhancement?.successRate,
          },
        };
      });

      set({ answers: enrichedAnswers, phase: 'selecting' });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  selectResearcher: async (answer) => {
    const { currentConsultation } = get();
    if (!currentConsultation) return;

    set({ isLoading: true });
    try {
      await consultationApi.selectResearcher(
        currentConsultation.id,
        answer.researcherId
      );

      // 添加首次问答作为消息
      const messages: Message[] = [
        {
          id: 'initial-question',
          consultationId: currentConsultation.id,
          senderType: 'USER',
          senderId: currentConsultation.userId,
          content: currentConsultation.question,
          createdAt: currentConsultation.createdAt,
        },
      ];

      if (answer.firstAnswer) {
        messages.push({
          id: 'first-answer',
          consultationId: currentConsultation.id,
          senderType: 'RESEARCHER',
          senderId: answer.researcherId,
          content: answer.firstAnswer,
          createdAt: answer.answeredAt || new Date().toISOString(),
        });
      }

      set({
        selectedResearcher: answer,
        messages,
        phase: 'chatting',
        isLoading: false,
        currentConsultation: {
          ...currentConsultation,
          status: 'IN_PROGRESS',
          roundsUsed: 0, // 从 0 开始，用户追问才计数
        },
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // 跳过研究员选择，返回提问阶段
  skipSelection: () => {
    set({
      phase: 'asking',
      currentConsultation: null,
      answers: [],
      error: null,
    });
  },

  sendMessage: async (userId, content) => {
    const { currentConsultation, selectedResearcher } = get();
    if (!currentConsultation || !selectedResearcher) return;

    try {
      const { message } = await consultationApi.sendMessage(
        currentConsultation.id,
        'USER',
        userId,
        content
      );

      set((state) => ({
        messages: [...state.messages, message],
        currentConsultation: state.currentConsultation
          ? {
              ...state.currentConsultation,
              roundsUsed: state.currentConsultation.roundsUsed + 1,
            }
          : null,
      }));

      // 注意：不再在这里自动跳转到rating
      // 轮次用完后会收到 rounds_exhausted 事件，由 socket 处理
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  extendConsultation: async (userId) => {
    const { currentConsultation } = get();
    if (!currentConsultation) return;

    set({ isLoading: true });
    try {
      const result = await consultationApi.extend(currentConsultation.id, userId);

      set((state) => ({
        isLoading: false,
        roundsExhausted: false,
        currentConsultation: state.currentConsultation
          ? {
              ...state.currentConsultation,
              maxRounds: result.newMaxRounds,
              roundsUsed: result.roundsUsed,
            }
          : null,
      }));

      return result;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  setRoundsExhausted: (exhausted, cost = 5) => {
    set({ roundsExhausted: exhausted, extendCost: cost });
  },

  completeConsultation: async () => {
    const { currentConsultation } = get();
    if (!currentConsultation) return;

    try {
      await consultationApi.complete(currentConsultation.id);
      set({ phase: 'rating' });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  submitRating: async (userId, score, comment) => {
    const { currentConsultation, isUsingTrialVoucher } = get();
    if (!currentConsultation) return;

    set({ isLoading: true });
    try {
      await consultationApi.rate(currentConsultation.id, userId, score, comment);

      // 只有在咨询完成后才标记体验券已使用
      if (isUsingTrialVoucher) {
        markTrialVoucherUsed();
      }

      set({ phase: 'completed', isLoading: false, isUsingTrialVoucher: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  reset: () => set(initialState),

  addMessage: (message) => {
    set((state) => {
      // 检查消息是否已存在，避免重复添加
      // 同时检查 id 和 content+senderType 组合
      const exists = state.messages.some((m) =>
        m.id === message.id ||
        (m.content === message.content &&
         m.senderType === message.senderType &&
         Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000)
      );
      if (exists) {
        console.log('[ChatStore] Duplicate message detected, skipping:', message.id);
        return state;
      }
      return {
        messages: [...state.messages, message],
      };
    });
  },

  updateConsultationStatus: (status) => {
    set((state) => ({
      currentConsultation: state.currentConsultation
        ? { ...state.currentConsultation, status: status as any }
        : null,
    }));
  },
}));

// AI模拟响应 (等待Dify API接入后替换)
function getAIMockResponse(_question: string): string {
  const language = useLanguage.getState().language;
  const responsesZh = [
    "您好！我是SoDEX AI研究员。关于您的问题，让我来为您解答。\n\n目前BTC市场呈现震荡走势，建议关注67,000-68,000区间的支撑和阻力位。如果您需要更专业的分析，可以升级到Gold等级解锁专属研究员1v1服务。",
    "感谢您的咨询！根据当前市场数据分析：\n\n1. BTC 24小时波动率：2.45%\n2. 多空比例：1.2:1\n3. 资金费率：0.01%\n\n建议保持适当仓位，设置好止损。如需深度分析，欢迎升级到Gold解锁专属研究员服务。",
    "您好！关于交易策略，我建议：\n\n• 短线：关注MA7和MA25的交叉信号\n• 中线：等待回调至支撑位再入场\n• 风控：单笔交易不超过总资金的5%\n\n更详细的策略分析可以升级到Gold解锁专属研究员服务。",
    "这是一个很好的问题！当前加密市场受宏观经济影响较大，美联储政策是关键因素。\n\n我们的研究团队每日发布市场分析报告，Gold及以上等级用户可以免费查看并获得专属研究员服务。",
  ];
  const responsesEn = [
    "Hi! I'm SoDEX AI researcher. Let me help with your question.\n\nBTC is currently range‑bound; watch the 67,000–68,000 zone for support and resistance. For deeper analysis, upgrade to Gold to unlock 1v1 researcher access.",
    "Thanks for reaching out! Current market stats:\n\n1. BTC 24h volatility: 2.45%\n2. Long/short ratio: 1.2:1\n3. Funding rate: 0.01%\n\nKeep position sizing prudent and use stops. For a deeper dive, upgrade to Gold for researcher support.",
    "On trading strategy, I suggest:\n\n• Short term: watch MA7/MA25 cross signals\n• Mid term: wait for pullbacks to support before entry\n• Risk: keep per‑trade risk below 5% of capital\n\nFor more detailed analysis, upgrade to Gold to unlock 1v1 researcher services.",
    "Great question! Crypto markets are highly sensitive to macro factors; Fed policy is a key driver.\n\nOur research team publishes daily market reports. Gold+ users can access them for free and get dedicated researcher support.",
  ];
  const responses = language === 'zh' ? responsesZh : responsesEn;
  return responses[Math.floor(Math.random() * responses.length)];
}
