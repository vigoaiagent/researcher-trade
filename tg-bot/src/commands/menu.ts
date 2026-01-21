import TelegramBot from 'node-telegram-bot-api';
import { getMenuInlineKeyboard } from '../utils/keyboard.js';

export async function handleMenu(
  bot: TelegramBot,
  msg: TelegramBot.Message
) {
  const chatId = msg.chat.id;

  const message = `
📋 功能菜单

请选择操作：
  `.trim();

  await bot.sendMessage(chatId, message, {
    reply_markup: getMenuInlineKeyboard(),
  });
}
