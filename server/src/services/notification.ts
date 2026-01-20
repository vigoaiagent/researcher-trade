import { Researcher, Consultation } from '@prisma/client';
import axios from 'axios';

const TG_BOT_API_URL = process.env.TG_BOT_URL || process.env.TG_BOT_API_URL || 'http://localhost:3002';

// 创建禁用代理的 axios 实例
const api = axios.create({
  proxy: false,
  timeout: 10000,
});

/**
 * 通知研究员有新咨询
 */
export async function notifyResearcherNewQuestion(
  researcher: Researcher,
  consultation: Consultation
): Promise<void> {
  try {
    await api.post(`${TG_BOT_API_URL}/notify/new-question`, {
      chatId: researcher.tgChatId,
      consultationId: consultation.id,
      context: consultation.context,
      question: consultation.question,
    });
  } catch (error) {
    console.error('Failed to notify researcher:', error);
  }
}

/**
 * 通知研究员被选中
 */
export async function notifyResearcherSelected(
  researcher: Researcher,
  consultation: Consultation
): Promise<void> {
  try {
    await api.post(`${TG_BOT_API_URL}/notify/selected`, {
      chatId: researcher.tgChatId,
      consultationId: consultation.id,
    });
  } catch (error) {
    console.error('Failed to notify researcher selected:', error);
  }
}

/**
 * 通知研究员用户追问
 */
export async function notifyResearcherFollowUp(
  researcher: Researcher,
  consultationId: string,
  message: string,
  roundsLeft: number
): Promise<void> {
  try {
    await api.post(`${TG_BOT_API_URL}/notify/follow-up`, {
      chatId: researcher.tgChatId,
      consultationId,
      message,
      roundsLeft,
    });
  } catch (error) {
    console.error('Failed to notify researcher follow up:', error);
  }
}

/**
 * 通知研究员对话结束
 */
export async function notifyResearcherCompleted(
  researcher: Researcher,
  consultationId: string,
  rating?: number
): Promise<void> {
  try {
    await api.post(`${TG_BOT_API_URL}/notify/completed`, {
      chatId: researcher.tgChatId,
      consultationId,
      rating,
    });
  } catch (error) {
    console.error('Failed to notify researcher completed:', error);
  }
}

/**
 * 通知研究员超时
 */
export async function notifyResearcherTimeout(
  researcher: Researcher,
  consultationId: string
): Promise<void> {
  try {
    await api.post(`${TG_BOT_API_URL}/notify/timeout`, {
      chatId: researcher.tgChatId,
      consultationId,
    });
  } catch (error) {
    console.error('Failed to notify researcher timeout:', error);
  }
}

/**
 * 通知研究员未被选中
 */
export async function notifyResearcherNotSelected(
  researcher: Researcher,
  consultation: Consultation
): Promise<void> {
  try {
    await api.post(`${TG_BOT_API_URL}/notify/not-selected`, {
      chatId: researcher.tgChatId,
      consultationId: consultation.id,
    });
  } catch (error) {
    console.error('Failed to notify researcher not selected:', error);
  }
}
