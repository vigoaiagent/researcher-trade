import TelegramBot from 'node-telegram-bot-api';
import { api } from '../api.js';
import { getMainMenuKeyboard, getWelcomeKeyboard } from '../utils/keyboard.js';

// 获取用户头像 URL
export async function getUserAvatarUrl(bot: TelegramBot, userId: number): Promise<string | null> {
  try {
    const photos = await bot.getUserProfilePhotos(userId, { limit: 1 });
    if (photos.total_count > 0 && photos.photos[0]?.[0]) {
      const fileId = photos.photos[0][0].file_id;
      const file = await bot.getFile(fileId);
      if (file.file_path) {
        const token = process.env.TG_BOT_TOKEN;
        return `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      }
    }
  } catch (error) {
    console.error('Failed to get user avatar:', error);
  }
  return null;
}

export async function handleStart(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  apiUrl: string
) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString();

  if (!userId) {
    bot.sendMessage(chatId, '❌ 无法获取您的用户信息');
    return;
  }

  try {
    // 先检查用户是否已注册
    const checkResponse = await api.get(`${apiUrl}/api/researcher/stats/${userId}`);

    // 已注册用户，显示欢迎回来消息 + 菜单
    const data = checkResponse.data;
    const statusEmoji: Record<string, string> = {
      ONLINE: '🟢',
      OFFLINE: '⚫',
      BUSY: '🔴',
    };

    const message = `
👋 欢迎回来，${data.researcher.name}！

${statusEmoji[data.researcher.status]} 当前状态：${data.researcher.status}

👇 点击下方按钮快速操作，或使用 /menu 查看更多功能
    `.trim();

    await bot.sendMessage(chatId, message, {
      reply_markup: getMainMenuKeyboard(),
    });
  } catch (error: any) {
    // 404 表示用户未注册，显示欢迎介绍
    if (error.response?.status === 404) {
      const welcomeMessage = `
👋 欢迎来到 Sodex 研究员助手！

这是 Sodex 平台的研究员客服系统。

📋 成为研究员后，您可以：
• 接收用户咨询并提供专业解答
• 灵活管理在线状态
• 获得服务报酬

👇 点击下方按钮申请成为研究员
      `.trim();

      await bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: getWelcomeKeyboard(),
      });
    } else {
      console.error('Start error:', error.message);
      bot.sendMessage(chatId, '❌ 服务异常，请稍后重试');
    }
  }
}

// 处理注册逻辑（由 callback 调用）
export async function handleRegister(
  bot: TelegramBot,
  chatId: number,
  userId: string,
  userName: string,
  apiUrl: string
): Promise<boolean> {
  try {
    // 检查白名单
    const whitelist = process.env.WHITELIST_TG_IDS;
    if (whitelist) {
      const allowedIds = whitelist.split(',').map(id => id.trim());
      if (!allowedIds.includes(userId)) {
        await bot.sendMessage(chatId, `
⚠️ 暂未开放注册

目前研究员注册采用邀请制，如需加入请联系管理员。

您的 ID：${userId}
        `.trim());
        return false;
      }
    }

    // 获取用户头像
    const avatarUrl = await getUserAvatarUrl(bot, parseInt(userId));

    // 注册研究员
    const response = await api.post(`${apiUrl}/api/researcher/register`, {
      tgUserId: userId,
      tgChatId: chatId.toString(),
      name: userName,
      specialties: [],
      avatar: avatarUrl,
    });

    if (response.data.success) {
      const message = `
🎉 注册成功！

欢迎加入 Sodex 研究员团队，${userName}！

📊 当前状态：离线

👇 点击下方按钮开始接单
      `.trim();

      await bot.sendMessage(chatId, message, {
        reply_markup: getMainMenuKeyboard(),
      });
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('Register error:', error.message);
    await bot.sendMessage(chatId, '❌ 注册失败，请稍后重试');
    return false;
  }
}
