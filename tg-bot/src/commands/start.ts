import TelegramBot from 'node-telegram-bot-api';
import { api } from '../api.js';
import { getMainMenuKeyboard } from '../utils/keyboard.js';

// 获取用户头像 URL
async function getUserAvatarUrl(bot: TelegramBot, userId: number): Promise<string | null> {
  try {
    const photos = await bot.getUserProfilePhotos(userId, { limit: 1 });
    if (photos.total_count > 0 && photos.photos[0]?.[0]) {
      // 获取最小尺寸的头像（通常足够用于头像显示）
      const fileId = photos.photos[0][0].file_id;
      const file = await bot.getFile(fileId);
      if (file.file_path) {
        // 构建 TG 文件下载 URL
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
  const userIdNum = msg.from?.id;
  const userName = msg.from?.first_name || '研究员';

  if (!userId || !userIdNum) {
    bot.sendMessage(chatId, '❌ 无法获取您的用户信息');
    return;
  }

  try {
    // 获取用户头像
    const avatarUrl = await getUserAvatarUrl(bot, userIdNum);

    // 注册/更新研究员信息
    const response = await api.post(`${apiUrl}/api/researcher/register`, {
      tgUserId: userId,
      tgChatId: chatId.toString(),
      name: userName,
      specialties: [],
      avatar: avatarUrl,
    });

    if (response.data.success) {
      const message = `
🎉 欢迎使用 Sodex 研究员客服系统！

您的账号已成功绑定。

📊 当前状态：离线

👇 点击下方按钮快速操作，或使用 /menu 查看更多功能
      `.trim();

      await bot.sendMessage(chatId, message, {
        reply_markup: getMainMenuKeyboard(),
      });
    }
  } catch (error: any) {
    console.error('Start error:', error.message);
    bot.sendMessage(chatId, '❌ 绑定失败，请稍后重试');
  }
}
