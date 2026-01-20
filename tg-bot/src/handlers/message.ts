import TelegramBot from 'node-telegram-bot-api';
import { api } from '../api.js';

// 存储咨询阶段信息: chatId -> { consultationId, phase, researcherId }
interface PendingReply {
  consultationId: string;
  phase: 'first_answer' | 'chatting';
  researcherId?: string;
}

// 将简单的 Map<number, string> 扩展为支持阶段信息
const pendingReplyDetails = new Map<number, PendingReply>();

export function setPendingReply(chatId: number, consultationId: string, phase: 'first_answer' | 'chatting', researcherId?: string) {
  pendingReplyDetails.set(chatId, { consultationId, phase, researcherId });
}

export function clearPendingReply(chatId: number) {
  pendingReplyDetails.delete(chatId);
}

export function getPendingReply(chatId: number): PendingReply | undefined {
  return pendingReplyDetails.get(chatId);
}

export async function handleTextMessage(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  pendingReplies: Map<number, string>,
  apiUrl: string
) {
  const chatId = msg.chat.id;
  const tgUserId = msg.from?.id.toString();
  const text = msg.text;

  if (!tgUserId || !text) return;

  // 先检查新的详细状态
  const pendingDetail = getPendingReply(chatId);

  // 兼容旧的简单状态
  const consultationId = pendingDetail?.consultationId || pendingReplies.get(chatId);

  if (!consultationId) {
    // 没有待回复的咨询，忽略消息
    return;
  }

  try {
    // 获取研究员信息
    const researcherRes = await api.get(`${apiUrl}/api/researcher/info/${tgUserId}`);
    const researcherId = researcherRes.data.id;

    // 根据阶段决定使用哪个端点
    const phase = pendingDetail?.phase || 'first_answer';

    if (phase === 'first_answer') {
      // 首次回答阶段
      const response = await api.post(`${apiUrl}/api/researcher/answer`, {
        consultationId,
        tgUserId,
        answer: text,
      });

      if (response.data.success) {
        // 首次回答后，等待用户选择，清除状态
        clearPendingReply(chatId);
        pendingReplies.delete(chatId);

        bot.sendMessage(
          chatId,
          `✅ 回答已提交！\n\n等待用户选择...`
        );
      }
    } else {
      // 1v1 对话阶段
      const response = await api.post(`${apiUrl}/api/consultation/message`, {
        consultationId,
        senderType: 'RESEARCHER',
        senderId: researcherId,
        content: text,
      });

      if (response.data.success) {
        bot.sendMessage(chatId, `✅ 回复已发送`);
      }
    }
  } catch (error: any) {
    console.error('Message submission error:', error.response?.data || error.message);

    if (error.response?.data?.error === 'Already answered') {
      clearPendingReply(chatId);
      pendingReplies.delete(chatId);
      bot.sendMessage(chatId, '❌ 您已经回答过这个问题了');
    } else if (error.response?.data?.error === 'Not assigned to this consultation') {
      clearPendingReply(chatId);
      pendingReplies.delete(chatId);
      bot.sendMessage(chatId, '❌ 这个咨询不是分配给您的');
    } else if (error.response?.data?.error === 'Only selected researcher can send messages') {
      clearPendingReply(chatId);
      pendingReplies.delete(chatId);
      bot.sendMessage(chatId, '❌ 用户选择了其他研究员，您无法继续回复');
    } else if (error.response?.data?.error === 'Consultation not in progress') {
      clearPendingReply(chatId);
      pendingReplies.delete(chatId);
      bot.sendMessage(chatId, '❌ 该咨询已结束');
    } else {
      bot.sendMessage(chatId, '❌ 发送失败，请稍后重试');
    }
  }
}
