import TelegramBot from 'node-telegram-bot-api';
import { api } from '../api.js';

// 存储申诉状态: chatId -> { ratingId, phase }
interface AppealState {
  ratingId: string;
  phase: 'waiting_reason';
}

const appealStates = new Map<number, AppealState>();

export function setAppealState(chatId: number, ratingId: string) {
  appealStates.set(chatId, { ratingId, phase: 'waiting_reason' });
}

export function getAppealState(chatId: number) {
  return appealStates.get(chatId);
}

export function clearAppealState(chatId: number) {
  appealStates.delete(chatId);
}

// /appeal 命令 - 查看可申诉的差评列表
export async function handleAppeal(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  apiUrl: string
) {
  const chatId = msg.chat.id;
  const tgUserId = msg.from?.id.toString();

  if (!tgUserId) {
    bot.sendMessage(chatId, '无法获取用户信息');
    return;
  }

  try {
    // 获取可申诉的差评
    const response = await api.get(`${apiUrl}/api/consultation/appeal/eligible/${tgUserId}`);
    const { ratings } = response.data;

    if (ratings.length === 0) {
      bot.sendMessage(
        chatId,
        '✅ 您目前没有可申诉的差评\n\n只有 1-2 星的评价才能提起申诉。'
      );
      return;
    }

    // 显示可申诉的评价列表
    let message = '📋 *可申诉的差评*\n\n';
    message += '只有 1-2 星评价可以申诉，以下是您可以申诉的差评：\n\n';

    ratings.forEach((r: any, index: number) => {
      const stars = '⭐'.repeat(r.score);
      const date = new Date(r.createdAt).toLocaleDateString('zh-CN');
      message += `${index + 1}. ${stars} (${r.score}星)\n`;
      message += `   用户: ${r.userAddress}\n`;
      message += `   问题: ${r.question}...\n`;
      if (r.comment) {
        message += `   评论: "${r.comment}"\n`;
      }
      message += `   日期: ${date}\n\n`;
    });

    message += '---\n';
    message += '发送 `/appeal_submit [序号] [申诉理由]` 提交申诉\n';
    message += '例如: `/appeal_submit 1 用户需求超出服务范围`';

    // 创建内联键盘
    const keyboard: TelegramBot.InlineKeyboardButton[][] = ratings.map((r: any, index: number) => [
      {
        text: `申诉 #${index + 1} (${r.score}星)`,
        callback_data: `appeal_${r.id}`,
      },
    ]);

    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } catch (error: any) {
    console.error('Appeal list error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      bot.sendMessage(chatId, '❌ 请先使用 /start 注册为研究员');
    } else {
      bot.sendMessage(chatId, '❌ 获取差评列表失败，请稍后重试');
    }
  }
}

// /appeal_submit 命令 - 直接提交申诉（带理由）
export async function handleAppealSubmit(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  match: RegExpExecArray | null,
  apiUrl: string
) {
  const chatId = msg.chat.id;
  const tgUserId = msg.from?.id.toString();

  if (!tgUserId || !match) {
    bot.sendMessage(chatId, '❌ 命令格式错误\n\n使用方法: `/appeal_submit [序号] [申诉理由]`', {
      parse_mode: 'Markdown',
    });
    return;
  }

  const args = match[1].trim().split(/\s+/);
  const index = parseInt(args[0], 10);
  const reason = args.slice(1).join(' ');

  if (isNaN(index) || index < 1) {
    bot.sendMessage(chatId, '❌ 请输入有效的序号');
    return;
  }

  if (!reason || reason.length < 5) {
    bot.sendMessage(chatId, '❌ 申诉理由不能少于5个字符');
    return;
  }

  try {
    // 获取可申诉列表以确定 ratingId
    const listRes = await api.get(`${apiUrl}/api/consultation/appeal/eligible/${tgUserId}`);
    const { ratings } = listRes.data;

    if (index > ratings.length) {
      bot.sendMessage(chatId, `❌ 序号超出范围，您有 ${ratings.length} 条可申诉的差评`);
      return;
    }

    const rating = ratings[index - 1];

    // 提交申诉
    const response = await api.post(`${apiUrl}/api/consultation/appeal/submit`, {
      tgUserId,
      ratingId: rating.id,
      reason,
    });

    if (response.data.success) {
      bot.sendMessage(
        chatId,
        `✅ 申诉已提交！\n\n` +
        `评价: ${'⭐'.repeat(rating.score)} (${rating.score}星)\n` +
        `申诉理由: ${reason}\n\n` +
        `管理员将在 24 小时内审核，结果会通知您。`
      );
    }
  } catch (error: any) {
    console.error('Appeal submit error:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.error;
    if (errorMsg === 'Only ratings with score 1-2 can be appealed') {
      bot.sendMessage(chatId, '❌ 只有 1-2 星的评价才能申诉');
    } else if (errorMsg === 'This rating has already been appealed') {
      bot.sendMessage(chatId, '❌ 该评价已经申诉过了');
    } else {
      bot.sendMessage(chatId, '❌ 申诉提交失败，请稍后重试');
    }
  }
}

// /appeal_status 命令 - 查看申诉状态
export async function handleAppealStatus(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  apiUrl: string
) {
  const chatId = msg.chat.id;
  const tgUserId = msg.from?.id.toString();

  if (!tgUserId) {
    bot.sendMessage(chatId, '无法获取用户信息');
    return;
  }

  try {
    const response = await api.get(`${apiUrl}/api/consultation/appeal/list/${tgUserId}`);
    const { appeals } = response.data;

    if (appeals.length === 0) {
      bot.sendMessage(chatId, '您还没有提交过申诉记录');
      return;
    }

    let message = '📋 *您的申诉记录*\n\n';

    appeals.forEach((a: any, index: number) => {
      const statusEmoji =
        a.status === 'PENDING' ? '⏳' :
        a.status === 'APPROVED' ? '✅' : '❌';
      const statusText =
        a.status === 'PENDING' ? '审核中' :
        a.status === 'APPROVED' ? '已通过' : '已驳回';

      const date = new Date(a.createdAt).toLocaleDateString('zh-CN');

      message += `${index + 1}. ${statusEmoji} ${statusText}\n`;
      message += `   评价: ${'⭐'.repeat(a.rating.score)} (${a.rating.score}星)\n`;
      message += `   申诉理由: ${a.reason}\n`;
      message += `   提交时间: ${date}\n`;
      if (a.adminNote) {
        message += `   管理员备注: ${a.adminNote}\n`;
      }
      if (a.resolvedAt) {
        message += `   处理时间: ${new Date(a.resolvedAt).toLocaleDateString('zh-CN')}\n`;
      }
      message += '\n';
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error: any) {
    console.error('Appeal status error:', error.response?.data || error.message);
    bot.sendMessage(chatId, '❌ 获取申诉状态失败，请稍后重试');
  }
}

// 处理内联键盘回调（点击"申诉"按钮）
export async function handleAppealCallback(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  apiUrl: string
) {
  const chatId = query.message?.chat.id;
  const tgUserId = query.from.id.toString();
  const data = query.data;

  if (!chatId || !data?.startsWith('appeal_')) return;

  const ratingId = data.replace('appeal_', '');

  // 设置申诉状态，等待用户输入理由
  setAppealState(chatId, ratingId);

  bot.answerCallbackQuery(query.id);
  bot.sendMessage(
    chatId,
    '📝 请输入申诉理由（不少于5个字符）：\n\n' +
    '例如：\n' +
    '- 用户需求超出服务范围\n' +
    '- 已按要求完成但用户期望不同\n' +
    '- 用户沟通过程中存在误解\n\n' +
    '直接回复此消息即可。发送 /cancel 取消申诉。'
  );
}

// 处理申诉理由输入
export async function handleAppealReasonInput(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  apiUrl: string
): Promise<boolean> {
  const chatId = msg.chat.id;
  const tgUserId = msg.from?.id.toString();
  const text = msg.text;

  if (!tgUserId || !text) return false;

  const state = getAppealState(chatId);
  if (!state) return false;

  // 取消申诉
  if (text === '/cancel') {
    clearAppealState(chatId);
    bot.sendMessage(chatId, '已取消申诉');
    return true;
  }

  // 检查理由长度
  if (text.length < 5) {
    bot.sendMessage(chatId, '❌ 申诉理由不能少于5个字符，请重新输入：');
    return true;
  }

  try {
    // 提交申诉
    const response = await api.post(`${apiUrl}/api/consultation/appeal/submit`, {
      tgUserId,
      ratingId: state.ratingId,
      reason: text,
    });

    clearAppealState(chatId);

    if (response.data.success) {
      bot.sendMessage(
        chatId,
        `✅ 申诉已提交！\n\n` +
        `申诉理由: ${text}\n\n` +
        `管理员将在 24 小时内审核，结果会通知您。\n\n` +
        `使用 /appeal_status 查看申诉状态。`
      );
    }
  } catch (error: any) {
    clearAppealState(chatId);
    console.error('Appeal submit error:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.error;
    if (errorMsg === 'This rating has already been appealed') {
      bot.sendMessage(chatId, '❌ 该评价已经申诉过了');
    } else {
      bot.sendMessage(chatId, '❌ 申诉提交失败，请稍后重试');
    }
  }

  return true;
}
