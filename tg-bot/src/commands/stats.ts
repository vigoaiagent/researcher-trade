import TelegramBot from 'node-telegram-bot-api';
import { api } from '../api.js';

export async function handleStatus(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  apiUrl: string
) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString();

  if (!userId) return;

  try {
    const response = await api.get(`${apiUrl}/api/researcher/stats/${userId}`);
    const data = response.data;

    const statusEmoji: Record<string, string> = {
      ONLINE: '🟢',
      OFFLINE: '⚫',
      BUSY: '🔴',
    };

    const message = `
📊 您的状态

${statusEmoji[data.researcher.status]} 当前状态：${data.researcher.status}
👤 昵称：${data.researcher.name}
⭐ 评分：${data.researcher.ratingScore.toFixed(1)}
🏆 推荐分：${data.researcher.recommendScore}
📈 总服务次数：${data.researcher.serviceCount}
💰 累计收入：${data.researcher.totalEarnings || 0} 能量

📅 本月统计
├ 服务次数：${data.monthly.services}
├ 收到评价：${data.monthly.ratings}
└ 平均评分：${data.monthly.avgRating}
    `.trim();

    bot.sendMessage(chatId, message);
  } catch (error: any) {
    if (error.response?.status === 404) {
      bot.sendMessage(chatId, '❌ 请先使用 /start 命令绑定账号');
    } else {
      bot.sendMessage(chatId, '❌ 获取数据失败，请稍后重试');
    }
  }
}
