import TelegramBot from 'node-telegram-bot-api';
import { api } from '../api.js';
import { getMainMenuKeyboard } from '../utils/keyboard.js';

export async function handleOnline(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  apiUrl: string
) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString();

  if (!userId) return;

  try {
    await api.post(`${apiUrl}/api/researcher/status`, {
      tgUserId: userId,
      status: 'ONLINE',
    });

    await bot.sendMessage(chatId, '✅ 您已上线！现在可以接收咨询了。', {
      reply_markup: getMainMenuKeyboard(),
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      bot.sendMessage(chatId, '❌ 请先使用 /start 命令绑定账号');
    } else {
      bot.sendMessage(chatId, '❌ 操作失败，请稍后重试');
    }
  }
}

export async function handleOffline(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  apiUrl: string
) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString();

  if (!userId) return;

  try {
    await api.post(`${apiUrl}/api/researcher/status`, {
      tgUserId: userId,
      status: 'OFFLINE',
    });

    await bot.sendMessage(chatId, '📴 您已离线，不会收到新的咨询。', {
      reply_markup: getMainMenuKeyboard(),
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      bot.sendMessage(chatId, '❌ 请先使用 /start 命令绑定账号');
    } else {
      bot.sendMessage(chatId, '❌ 操作失败，请稍后重试');
    }
  }
}

export async function handleBusy(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  apiUrl: string
) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id.toString();

  if (!userId) return;

  try {
    await api.post(`${apiUrl}/api/researcher/status`, {
      tgUserId: userId,
      status: 'BUSY',
    });

    await bot.sendMessage(chatId, '🔴 您已设为忙碌状态，暂时不接新单。', {
      reply_markup: getMainMenuKeyboard(),
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      bot.sendMessage(chatId, '❌ 请先使用 /start 命令绑定账号');
    } else {
      bot.sendMessage(chatId, '❌ 操作失败，请稍后重试');
    }
  }
}
