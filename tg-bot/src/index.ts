import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import dotenv from 'dotenv';
import { handleStart } from './commands/start.js';
import { handleOnline, handleOffline, handleBusy } from './commands/status.js';
import { handleStatus } from './commands/stats.js';
import { handleBindWallet } from './commands/wallet.js';
import { handleAppeal, handleAppealSubmit, handleAppealStatus, handleAppealCallback, handleAppealReasonInput, getAppealState } from './commands/appeal.js';
import { handleTextMessage } from './handlers/message.js';
import { setupNotificationRoutes } from './handlers/notification.js';

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

// 创建 Bot 实例 (禁用代理)
const bot = new TelegramBot(BOT_TOKEN, {
  polling: true,
  request: {
    proxy: false,
  },
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
bot.onText(/\/bindwallet (.+)/, (msg, match) => handleBindWallet(bot, msg, match, API_URL));

// 申诉相关命令
bot.onText(/\/appeal$/, (msg) => handleAppeal(bot, msg, API_URL));
bot.onText(/\/appeal_submit (.+)/, (msg, match) => handleAppealSubmit(bot, msg, match, API_URL));
bot.onText(/\/appeal_status/, (msg) => handleAppealStatus(bot, msg, API_URL));

// 处理内联键盘回调
bot.on('callback_query', (query) => {
  if (query.data?.startsWith('appeal_')) {
    handleAppealCallback(bot, query, API_URL);
  }
});

// 处理普通文本消息 (回复咨询 或 申诉理由)
bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;

    // 先检查是否在申诉理由输入状态
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
