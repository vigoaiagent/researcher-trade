import type { User, Consultation, ResearcherAnswer, Message, Rating } from '../types';

// 生产环境使用相对路径（同源），开发环境使用localhost:3001
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// 用户相关
export const authApi = {
  login: (walletAddress: string) =>
    request<{ success: boolean; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    }),

  getUser: (walletAddress: string) =>
    request<User>(`/api/auth/user/${walletAddress}`),

  checkWhitelist: (walletAddress: string) =>
    request<{ isWhitelist: boolean }>(`/api/auth/whitelist/${walletAddress}`),
};

// 能量值相关
export const energyApi = {
  getBalance: (userId: string) =>
    request<{ balance: number }>(`/api/energy/balance/${userId}`),

  recharge: (userId: string, amount: number) =>
    request<{ success: boolean; newBalance: number }>('/api/energy/recharge', {
      method: 'POST',
      body: JSON.stringify({ userId, amount }),
    }),
};

// 咨询相关
export const consultationApi = {
  create: (userId: string, question: string, context?: string, targetResearcherId?: string, usingTrial?: boolean) =>
    request<{
      success: boolean;
      consultationId: string;
      researcherCount: number;
      isDirect?: boolean;
      targetResearcherId?: string | null;
    }>(
      '/api/consultation/create',
      {
        method: 'POST',
        body: JSON.stringify({ userId, question, context, targetResearcherId, usingTrial }),
      }
    ),

  getDetail: (id: string) =>
    request<Consultation & {
      consultationResearchers: ResearcherAnswer[];
      messages: Message[];
      rating?: Rating;
    }>(`/api/consultation/detail/${id}`),

  getAnswers: (id: string) =>
    request<{ answers: ResearcherAnswer[] }>(`/api/consultation/answers/${id}`),

  selectResearcher: (consultationId: string, researcherId: string) =>
    request<{ success: boolean }>('/api/consultation/select', {
      method: 'POST',
      body: JSON.stringify({ consultationId, researcherId }),
    }),

  sendMessage: (
    consultationId: string,
    senderType: 'USER' | 'RESEARCHER',
    senderId: string,
    content: string
  ) =>
    request<{ success: boolean; message: Message }>('/api/consultation/message', {
      method: 'POST',
      body: JSON.stringify({ consultationId, senderType, senderId, content }),
    }),

  complete: (consultationId: string) =>
    request<{ success: boolean }>('/api/consultation/complete', {
      method: 'POST',
      body: JSON.stringify({ consultationId }),
    }),

  rate: (consultationId: string, userId: string, score: number, comment?: string) =>
    request<{ success: boolean; rating: Rating }>('/api/consultation/rate', {
      method: 'POST',
      body: JSON.stringify({ consultationId, userId, score, comment }),
    }),

  getHistory: (userId: string, limit = 10) =>
    request<{ consultations: Consultation[] }>(
      `/api/consultation/history/${userId}?limit=${limit}`
    ),

  // 续费追问 - 消耗能量增加对话轮次
  extend: (consultationId: string, userId: string, additionalRounds = 3) =>
    request<{
      success: boolean;
      newMaxRounds: number;
      roundsUsed: number;
      roundsLeft: number;
      energyCost: number;
      newEnergyBalance: number;
    }>('/api/consultation/extend', {
      method: 'POST',
      body: JSON.stringify({ consultationId, userId, additionalRounds }),
    }),
};

// 研究员相关
export const researcherApi = {
  // 获取在线研究员列表
  getOnline: () =>
    request<{
      researchers: Array<{
        id: string;
        name: string;
        avatar: string | null;
        specialties: string;
        ratingScore: number;
        serviceCount: number;
      }>;
    }>('/api/researcher/online'),

  // 获取研究员评价列表
  getReviews: (researcherId: string, limit = 5) =>
    request<{
      reviews: Array<{
        id: string;
        score: number;
        comment: string | null;
        createdAt: string;
        userAddress: string;
        questionPreview: string;
      }>;
      stats: {
        total: number;
        average: number;
        distribution: Record<number, number>;
      };
    }>(`/api/researcher/reviews/${researcherId}?limit=${limit}`),
};

// 订阅研究员（按月计费）
export const favoriteApi = {
  // 获取用户订阅列表
  getList: (userId: string) =>
    request<{
      favorites: Array<{
        id: string;
        userId: string;
        researcherId: string;
        isActive: boolean;
        autoRenew: boolean;
        monthlyCost: number;
        subscribedAt: string;
        expiresAt: string;
        isExpired: boolean;
        researcher: {
          id: string;
          name: string;
          avatar: string | null;
          specialties: string;
          status: string;
          ratingScore: number;
          serviceCount: number;
        };
      }>;
    }>(`/api/favorite/list/${userId}`),

  // 检查是否已订阅
  check: (userId: string, researcherId: string) =>
    request<{
      isSubscribed: boolean;
      isActive?: boolean;
      autoRenew?: boolean;
      expiresAt?: string;
    }>(`/api/favorite/check/${userId}/${researcherId}`),

  // 订阅研究员
  add: (userId: string, researcherId: string) =>
    request<{
      success: boolean;
      subscription: any;
      monthlyCost: number;
      expiresAt: string;
      newBalance: number;
    }>('/api/favorite/add', {
      method: 'POST',
      body: JSON.stringify({ userId, researcherId }),
    }),

  // 取消自动续费
  cancel: (userId: string, researcherId: string) =>
    request<{
      success: boolean;
      message: string;
      expiresAt: string;
    }>('/api/favorite/cancel', {
      method: 'POST',
      body: JSON.stringify({ userId, researcherId }),
    }),

  // 恢复自动续费
  resume: (userId: string, researcherId: string) =>
    request<{
      success: boolean;
      message: string;
      expiresAt: string;
    }>('/api/favorite/resume', {
      method: 'POST',
      body: JSON.stringify({ userId, researcherId }),
    }),

  // 删除订阅
  remove: (userId: string, researcherId: string) =>
    request<{ success: boolean }>(`/api/favorite/remove/${userId}/${researcherId}`, {
      method: 'DELETE',
    }),

  // 获取订阅费用
  getCost: () => request<{ monthlyCost: number; subscriptionDays: number }>('/api/favorite/cost'),
};
