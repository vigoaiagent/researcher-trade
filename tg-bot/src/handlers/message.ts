import TelegramBot from 'node-telegram-bot-api';
import { api } from '../api.js';

// 存储咨询阶段信息: chatId -> { consultationId, phase, researcherId }
interface PendingReply {
  consultationId: string;
  phase: 'first_answer' | 'chatting';
  researcherId?: string;
  messageId?: number; // 通知消息的ID，用于回复匹配
}

// 支持多个并发咨询: chatId -> Map<messageId, PendingReply>
const pendingRepliesByMessage = new Map<number, Map<number, PendingReply>>();

// 兼容旧的单咨询模式 (最后一个咨询)
const pendingReplyDetails = new Map<number, PendingReply>();

export function setPendingReply(chatId: number, consultationId: string, phase: 'first_answer' | 'chatting', researcherId?: string, messageId?: number) {
  const pending: PendingReply = { consultationId, phase, researcherId, messageId };

  // 存储到单咨询 Map（兼容）
  pendingReplyDetails.set(chatId, pending);

  // 如果有 messageId，也存储到多咨询 Map
  if (messageId) {
    if (!pendingRepliesByMessage.has(chatId)) {
      pendingRepliesByMessage.set(chatId, new Map());
    }
    pendingRepliesByMessage.get(chatId)!.set(messageId, pending);
  }
}

export function clearPendingReply(chatId: number, messageId?: number) {
  if (messageId) {
    pendingRepliesByMessage.get(chatId)?.delete(messageId);
  }
  // 如果清除的是当前活跃的咨询，也清除单咨询状态
  const current = pendingReplyDetails.get(chatId);
  if (current && (!messageId || current.messageId === messageId)) {
    pendingReplyDetails.delete(chatId);
  }
}

export function getPendingReply(chatId: number): PendingReply | undefined {
  return pendingReplyDetails.get(chatId);
}

// 根据回复的消息ID获取对应的咨询
export function getPendingReplyByMessageId(chatId: number, replyToMessageId: number): PendingReply | undefined {
  return pendingRepliesByMessage.get(chatId)?.get(replyToMessageId);
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

  let pendingDetail: PendingReply | undefined;

  // 优先检查是否是回复特定消息（支持多咨询并发）
  if (msg.reply_to_message?.message_id) {
    pendingDetail = getPendingReplyByMessageId(chatId, msg.reply_to_message.message_id);
  }

  // 如果不是回复，或回复的消息没有对应咨询，使用最后一个咨询
  if (!pendingDetail) {
    pendingDetail = getPendingReply(chatId);
  }

  // 兼容旧的简单状态
  const consultationId = pendingDetail?.consultationId || pendingReplies.get(chatId);

  if (!consultationId) {
    // 没有待回复的咨询
    bot.sendMessage(chatId, '💡 提示：请直接「回复」咨询通知消息来回答问题');
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
