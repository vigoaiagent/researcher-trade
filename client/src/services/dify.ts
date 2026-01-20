// Dify API 配置 - 通过后端代理调用
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface DifyChatResponse {
  answer: string;
  conversation_id: string;
  message_id: string;
}

// 会话ID存储
let conversationId: string | null = null;

export const difyApi = {
  // 始终返回true，因为API key在服务端配置
  isConfigured: () => true,

  // 发送消息 (通过后端代理)
  chat: async (message: string, userId: string): Promise<string> => {
    try {
      const url = `${API_URL}/api/ai/chat`;
      console.log('[Dify] Sending request via proxy:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          user: userId,
          conversation_id: conversationId || undefined,
        }),
      });

      console.log('[Dify] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Dify] API error response:', errorData);
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data: DifyChatResponse = await response.json();
      console.log('[Dify] Response received, answer length:', data.answer?.length);

      // 保存会话ID用于连续对话
      if (data.conversation_id) {
        conversationId = data.conversation_id;
      }

      return data.answer;
    } catch (error: any) {
      console.error('[Dify] API error:', error);
      throw error;
    }
  },

  // 重置会话
  resetConversation: () => {
    conversationId = null;
  },
};
