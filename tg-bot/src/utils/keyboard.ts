import TelegramBot from 'node-telegram-bot-api';

// 按钮文本常量
export const BUTTON_TEXT = {
  ONLINE: '🟢 上线',
  OFFLINE: '📴 离线',
  BUSY: '🔴 忙碌',
  STATUS: '📊 状态',
  MORE: '📋 更多功能',
} as const;

// 回调数据常量
export const CALLBACK_DATA = {
  ONLINE: 'status_online',
  OFFLINE: 'status_offline',
  BUSY: 'status_busy',
  STATUS: 'menu_status',
  WALLET: 'menu_wallet',
  APPEAL: 'menu_appeal',
} as const;

/**
 * 获取主菜单持久化键盘 (Reply Keyboard)
 * 显示在聊天底部的固定按钮
 */
export function getMainMenuKeyboard(): TelegramBot.ReplyKeyboardMarkup {
  return {
    keyboard: [
      [{ text: BUTTON_TEXT.ONLINE }, { text: BUTTON_TEXT.OFFLINE }],
      [{ text: BUTTON_TEXT.BUSY }, { text: BUTTON_TEXT.STATUS }],
      [{ text: BUTTON_TEXT.MORE }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

/**
 * 获取状态切换内联键盘 (Inline Keyboard)
 * 显示在消息下方的快捷按钮
 */
export function getStatusInlineKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🟢 上线', callback_data: CALLBACK_DATA.ONLINE },
        { text: '📴 离线', callback_data: CALLBACK_DATA.OFFLINE },
        { text: '🔴 忙碌', callback_data: CALLBACK_DATA.BUSY },
      ],
    ],
  };
}

/**
 * 获取完整功能菜单内联键盘 (Inline Keyboard)
 * 用于 /menu 命令
 */
export function getMenuInlineKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🟢 上线', callback_data: CALLBACK_DATA.ONLINE },
        { text: '📴 离线', callback_data: CALLBACK_DATA.OFFLINE },
        { text: '🔴 忙碌', callback_data: CALLBACK_DATA.BUSY },
      ],
      [{ text: '📊 查看状态', callback_data: CALLBACK_DATA.STATUS }],
      [{ text: '💰 绑定钱包', callback_data: CALLBACK_DATA.WALLET }],
      [{ text: '📝 申诉管理', callback_data: CALLBACK_DATA.APPEAL }],
    ],
  };
}
