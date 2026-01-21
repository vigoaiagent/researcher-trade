import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import dotenv from 'dotenv';
import { handleStart } from './commands/start.js';
import { handleOnline, handleOffline, handleBusy } from './commands/status.js';
import { handleStatus } from './commands/stats.js';
import { handleBindWallet } from './commands/wallet.js';
import { handleMenu } from './commands/menu.js';
import { handleAppeal, handleAppealSubmit, handleAppealStatus, handleAppealCallback, handleAppealReasonInput, getAppealState } from './commands/appeal.js';
import { handleTextMessage } from './handlers/message.js';
import { setupNotificationRoutes } from './handlers/notification.js';
import { BUTTON_TEXT, CALLBACK_DATA } from './utils/keyboard.js';

// 禁用代理
process.env.HTTP_PROXY = '';
process.env.HTTPS_PROXY = '';
process.env.http_proxy = '';
process.env.https_proxy = '';
process.env.NO_PROXY = '*';

dotenv.config();

const BOT_TOKEN = process.env.TG_BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:3001';
const PORT = parseInt(process.env.PORT || '3002');

if (!BOT_TOKEN) {
  console.error('❌ TG_BOT_TOKEN is required');
  console.log('请在 .env 文件中配置 TG_BOT_TOKEN');
  console.log('获取方式：在 Telegram 中联系 @BotFather 创建 Bot');
  process.exit(1);
}

// 创建 Bot 实例
const bot = new TelegramBot(BOT_TOKEN, {
  polling: true,
});

// 创建 Express 服务器 (用于接收后端通知)
const app = express();
app.use(express.json());

// 存储待回复的咨询 (chatId -> consultationId)
const pendingReplies = new Map<number, string>();

// 注册命令处理器
bot.onText(/\/start/, (msg) => handleStart(bot, msg, API_URL));
bot.onText(/\/online/, (msg) => handleOnline(bot, msg, API_URL));
bot.onText(/\/offline/, (msg) => handleOffline(bot, msg, API_URL));
bot.onText(/\/busy/, (msg) => handleBusy(bot, msg, API_URL));
bot.onText(/\/status/, (msg) => handleStatus(bot, msg, API_URL));
bot.onText(/\/menu/, (msg) => handleMenu(bot, msg));
bot.onText(/\/bindwallet (.+)/, (msg, match) => handleBindWallet(bot, msg, match, API_URL));

// 申诉相关命令
bot.onText(/\/appeal$/, (msg) => handleAppeal(bot, msg, API_URL));
bot.onText(/\/appeal_submit (.+)/, (msg, match) => handleAppealSubmit(bot, msg, match, API_URL));
bot.onText(/\/appeal_status/, (msg) => handleAppealStatus(bot, msg, API_URL));

// 处理内联键盘回调
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  const userId = query.from?.id.toString();
  const data = query.data;

  if (!chatId || !userId || !data) return;

  // 处理申诉回调
  if (data.startsWith('appeal_')) {
    handleAppealCallback(bot, query, API_URL);
    return;
  }

  // 处理状态切换回调
  if (data === CALLBACK_DATA.ONLINE || data === CALLBACK_DATA.OFFLINE || data === CALLBACK_DATA.BUSY) {
    const statusMap: Record<string, string> = {
      [CALLBACK_DATA.ONLINE]: 'ONLINE',
      [CALLBACK_DATA.OFFLINE]: 'OFFLINE',
      [CALLBACK_DATA.BUSY]: 'BUSY',
    };
    const messageMap: Record<string, string> = {
      [CALLBACK_DATA.ONLINE]: '✅ 您已上线！现在可以接收咨询了。',
      [CALLBACK_DATA.OFFLINE]: '📴 您已离线，不会收到新的咨询。',
      [CALLBACK_DATA.BUSY]: '🔴 您已设为忙碌状态，暂时不接新单。',
    };

    try {
      const { api } = await import('./api.js');
      await api.post(`${API_URL}/api/researcher/status`, {
        tgUserId: userId,
        status: statusMap[data],
      });
      await bot.answerCallbackQuery(query.id, { text: messageMap[data] });
      await bot.sendMessage(chatId, messageMap[data]);
    } catch (error: any) {
      if (error.response?.status === 404) {
        await bot.answerCallbackQuery(query.id, { text: '请先使用 /start 绑定账号' });
      } else {
        await bot.answerCallbackQuery(query.id, { text: '操作失败，请稍后重试' });
      }
    }
    return;
  }

  // 处理菜单功能回调
  if (data === CALLBACK_DATA.STATUS) {
    await bot.answerCallbackQuery(query.id);
    // 创建虚拟消息对象来调用 handleStatus
    const virtualMsg = { chat: { id: chatId }, from: { id: parseInt(userId) } } as TelegramBot.Message;
    handleStatus(bot, virtualMsg, API_URL);
    return;
  }

  if (data === CALLBACK_DATA.WALLET) {
    await bot.answerCallbackQuery(query.id);
    await bot.sendMessage(chatId, '💰 绑定钱包\n\n请使用命令格式：\n/bindwallet <您的钱包地址>\n\n例如：\n/bindwallet 0x1234...abcd');
    return;
  }

  if (data === CALLBACK_DATA.APPEAL) {
    await bot.answerCallbackQuery(query.id);
    // 创建虚拟消息对象来调用 handleAppeal
    const virtualMsg = { chat: { id: chatId }, from: { id: parseInt(userId) } } as TelegramBot.Message;
    handleAppeal(bot, virtualMsg, API_URL);
    return;
  }
});

// 处理普通文本消息 (回复咨询 或 申诉理由 或 菜单按钮)
bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;
    const text = msg.text;

    // 先检查是否是持久化菜单按钮点击
    if (text === BUTTON_TEXT.ONLINE) {
      handleOnline(bot, msg, API_URL);
      return;
    }
    if (text === BUTTON_TEXT.OFFLINE) {
      handleOffline(bot, msg, API_URL);
      return;
    }
    if (text === BUTTON_TEXT.BUSY) {
      handleBusy(bot, msg, API_URL);
      return;
    }
    if (text === BUTTON_TEXT.STATUS) {
      handleStatus(bot, msg, API_URL);
      return;
    }
    if (text === BUTTON_TEXT.MORE) {
      handleMenu(bot, msg);
      return;
    }

    // 检查是否在申诉理由输入状态
    if (getAppealState(chatId)) {
      await handleAppealReasonInput(bot, msg, API_URL);
      return;
    }

    // 否则处理咨询回复
    handleTextMessage(bot, msg, pendingReplies, API_URL);
  }
});

// 设置通知路由
setupNotificationRoutes(app, bot, pendingReplies);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', bot: 'running' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🤖 TG Bot is running`);
  console.log(`📡 Notification server listening on port ${PORT}`);
  console.log(`🔗 Backend API: ${API_URL}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  bot.stopPolling();
  process.exit(0);
});

export { bot, pendingReplies };
