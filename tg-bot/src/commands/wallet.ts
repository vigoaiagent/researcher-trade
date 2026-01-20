import TelegramBot from 'node-telegram-bot-api';
import { api } from '../api.js';

export async function handleBindWallet(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  match: RegExpMatchArray | null,
  apiUrl: string
) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString();
  const walletAddress = match?.[1]?.trim();

  if (!userId) return;

  if (!walletAddress) {
    bot.sendMessage(chatId, '❌ 请提供钱包地址\n用法：/bindwallet <钱包地址>');
    return;
  }

  // 简单验证钱包地址格式
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    bot.sendMessage(chatId, '❌ 钱包地址格式不正确\n请提供有效的以太坊地址');
    return;
  }

  try {
    await api.post(`${apiUrl}/api/researcher/bind-wallet`, {
      tgUserId: userId,
      walletAddress,
    });

    bot.sendMessage(chatId, `✅ 钱包绑定成功！\n\n地址：${walletAddress}`);
  } catch (error: any) {
    if (error.response?.status === 404) {
      bot.sendMessage(chatId, '❌ 请先使用 /start 命令绑定账号');
    } else {
      bot.sendMessage(chatId, '❌ 绑定失败，请稍后重试');
    }
  }
}
