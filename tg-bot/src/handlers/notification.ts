import { Express } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { setPendingReply, clearPendingReply } from './message.js';

export function setupNotificationRoutes(
  app: Express,
  bot: TelegramBot,
  pendingReplies: Map<number, string>
) {
  // 新咨询通知
  app.post('/notify/new-question', async (req, res) => {
    const { chatId, consultationId, context, question } = req.body;

    try {
      const message = `
🔔 新咨询！

📊 交易上下文：${context || '通用问题'}
❓ 问题：${question}

⏱ 请在2分钟内回复
直接回复本消息即可
      `.trim();

      await bot.sendMessage(chatId, message);

      // 设置待回复状态 - 首次回答阶段
      setPendingReply(parseInt(chatId), consultationId, 'first_answer');
      pendingReplies.set(parseInt(chatId), consultationId);

      res.json({ success: true });
    } catch (error) {
      console.error('Notification error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // 被选中通知
  app.post('/notify/selected', async (req, res) => {
    const { chatId, consultationId } = req.body;

    try {
      const message = `
✅ 用户选择了您！

进入1v1对话，剩余2轮交流机会。
用户的追问会直接发送给您，请注意查收。

💡 提示：优质的服务可以获得更高评分和推荐权重
      `.trim();

      await bot.sendMessage(chatId, message);

      // 更新待回复状态 - 进入1v1对话阶段
      setPendingReply(parseInt(chatId), consultationId, 'chatting');
      pendingReplies.set(parseInt(chatId), consultationId);

      res.json({ success: true });
    } catch (error) {
      console.error('Selected notification error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // 用户追问通知
  app.post('/notify/follow-up', async (req, res) => {
    const { chatId, consultationId, message, roundsLeft } = req.body;

    try {
      const notification = `
💬 用户追问：

${message}

📝 剩余对话轮次：${roundsLeft}
⏱ 请在10分钟内回复
直接回复本消息即可
      `.trim();

      await bot.sendMessage(chatId, notification);

      // 设置待回复状态 - 1v1对话阶段
      setPendingReply(parseInt(chatId), consultationId, 'chatting');
      pendingReplies.set(parseInt(chatId), consultationId);

      res.json({ success: true });
    } catch (error) {
      console.error('Follow-up notification error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // 对话结束通知
  app.post('/notify/completed', async (req, res) => {
    const { chatId, consultationId, rating } = req.body;

    try {
      let ratingText = '';
      if (rating) {
        ratingText = `\n用户评价：${'⭐'.repeat(rating)}`;
      }

      const message = `
✅ 对话结束${ratingText}

感谢您的专业服务！
继续保持在线状态接收新咨询。
      `.trim();

      await bot.sendMessage(chatId, message);

      // 清除待回复状态
      clearPendingReply(parseInt(chatId));
      pendingReplies.delete(parseInt(chatId));

      res.json({ success: true });
    } catch (error) {
      console.error('Completed notification error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // 超时通知
  app.post('/notify/timeout', async (req, res) => {
    const { chatId, consultationId } = req.body;

    try {
      const message = `
⚠️ 您未及时回复

该问题已转给其他研究员处理。
推荐分 -10

💡 建议：如果暂时无法接单，请使用 /busy 命令设置为忙碌状态
      `.trim();

      await bot.sendMessage(chatId, message);

      // 清除待回复状态
      clearPendingReply(parseInt(chatId));
      pendingReplies.delete(parseInt(chatId));

      res.json({ success: true });
    } catch (error) {
      console.error('Timeout notification error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // 未被选中通知
  app.post('/notify/not-selected', async (req, res) => {
    const { chatId, consultationId } = req.body;

    try {
      const message = `
📋 该咨询已结束

用户选择了其他研究员。
继续保持在线，等待下一个咨询！
      `.trim();

      await bot.sendMessage(chatId, message);

      // 清除待回复状态
      clearPendingReply(parseInt(chatId));
      pendingReplies.delete(parseInt(chatId));

      res.json({ success: true });
    } catch (error) {
      console.error('Not selected notification error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // 语音通话请求通知
  app.post('/notify/voice-call', async (req, res) => {
    const { chatId, userName, question, callPageUrl } = req.body;

    try {
      const message = `
📞 用户请求语音通话！

👤 用户：${userName || '用户'}
❓ 咨询问题：${question || '未指定'}

点击下方链接接听通话：
${callPageUrl}

⏱ 通话请求将在60秒后超时
💡 提示：通话将被录音用于服务质量监控
      `.trim();

      // 发送带有内联按钮的消息
      await bot.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📞 接听通话',
                url: callPageUrl,
              },
            ],
          ],
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Voice call notification error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // 语音通话结束通知
  app.post('/notify/call-ended', async (req, res) => {
    const { chatId, duration, endedBy } = req.body;

    try {
      const durationStr = formatDuration(duration || 0);
      const message = `
📞 通话已结束

⏱ 通话时长：${durationStr}
${endedBy === 'user' ? '用户已挂断' : ''}

感谢您的服务！
      `.trim();

      await bot.sendMessage(chatId, message);

      res.json({ success: true });
    } catch (error) {
      console.error('Call ended notification error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // 语音通话被拒绝/超时通知
  app.post('/notify/call-missed', async (req, res) => {
    const { chatId, reason } = req.body;

    try {
      const reasonText = reason === 'timeout' ? '未在规定时间内接听' : '研究员拒绝了通话';
      const message = `
📞 语音通话未接通

原因：${reasonText}

用户将收到相应提示。
      `.trim();

      await bot.sendMessage(chatId, message);

      res.json({ success: true });
    } catch (error) {
      console.error('Call missed notification error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });
}

// 格式化通话时长
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
