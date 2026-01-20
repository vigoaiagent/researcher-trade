import { create } from 'zustand';

export interface AlertItem {
  id: string;
  symbol: string;
  title: string;
  summary: string;
  source: string;
  time: string;
  isUrgent?: boolean;
  feedback?: 'useful' | 'not_useful';
}

// 免打扰时长选项（分钟）
export type DoNotDisturbDuration = 30 | 60 | 120 | 480 | 1440; // 30分钟, 1小时, 2小时, 8小时, 1天

interface AlertState {
  alerts: AlertItem[];
  currentAlert: AlertItem | null;
  showBubble: boolean;
  showPanel: boolean;
  showSettings: boolean;
  dismissedIds: Set<string>;

  // 免打扰设置
  doNotDisturbUntil: number | null; // 时间戳，null 表示不在免打扰状态
  alertsEnabled: boolean; // 是否启用提醒

  // Actions
  addAlert: (alert: AlertItem) => void;
  dismissAlert: (id: string) => void;
  setFeedback: (id: string, feedback: 'useful' | 'not_useful') => void;
  showNextAlert: () => void;
  closeBubble: () => void;
  openPanel: () => void;
  closePanel: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  clearAll: () => void;

  // 设置操作
  setDoNotDisturb: (durationMinutes: DoNotDisturbDuration) => void;
  clearDoNotDisturb: () => void;
  toggleAlertsEnabled: () => void;
  isInDoNotDisturb: () => boolean;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  currentAlert: null,
  showBubble: false,
  showPanel: false,
  showSettings: false,
  dismissedIds: new Set(),
  doNotDisturbUntil: null,
  alertsEnabled: true,

  isInDoNotDisturb: () => {
    const { doNotDisturbUntil, alertsEnabled } = get();
    if (!alertsEnabled) return true;
    if (!doNotDisturbUntil) return false;
    return Date.now() < doNotDisturbUntil;
  },

  addAlert: (alert) => {
    const { alerts, dismissedIds, currentAlert, isInDoNotDisturb } = get();
    if (dismissedIds.has(alert.id)) return;

    // 如果在免打扰状态，只添加到列表但不显示气泡
    const newAlerts = [...alerts.filter(a => a.id !== alert.id), alert];

    if (isInDoNotDisturb()) {
      set({ alerts: newAlerts });
      return;
    }

    // 如果没有当前显示的 alert，设置为当前
    if (!currentAlert) {
      set({
        alerts: newAlerts,
        currentAlert: alert,
        showBubble: true
      });
    } else {
      set({ alerts: newAlerts });
    }
  },

  dismissAlert: (id) => {
    const { alerts, currentAlert, dismissedIds } = get();
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);

    const newAlerts = alerts.filter(a => a.id !== id);

    // 如果关闭的是当前显示的，显示下一个
    if (currentAlert?.id === id) {
      const nextAlert = newAlerts.find(a => !newDismissed.has(a.id));
      set({
        alerts: newAlerts,
        dismissedIds: newDismissed,
        currentAlert: nextAlert || null,
        showBubble: !!nextAlert,
      });
    } else {
      set({ alerts: newAlerts, dismissedIds: newDismissed });
    }
  },

  setFeedback: (id, feedback) => {
    const { alerts } = get();
    set({
      alerts: alerts.map(a => a.id === id ? { ...a, feedback } : a)
    });
    // 给了反馈就关掉这条
    get().dismissAlert(id);
  },

  showNextAlert: () => {
    const { alerts, dismissedIds } = get();
    const nextAlert = alerts.find(a => !dismissedIds.has(a.id) && !a.feedback);
    set({
      currentAlert: nextAlert || null,
      showBubble: !!nextAlert,
    });
  },

  closeBubble: () => set({ showBubble: false }),

  openPanel: () => set({ showPanel: true, showBubble: false }),

  closePanel: () => set({ showPanel: false }),

  clearAll: () => {
    const { alerts } = get();
    const allIds = new Set(alerts.map(a => a.id));
    set({
      dismissedIds: allIds,
      currentAlert: null,
      showBubble: false,
    });
  },

  // 设置相关
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),

  setDoNotDisturb: (durationMinutes) => {
    set({
      doNotDisturbUntil: Date.now() + durationMinutes * 60 * 1000,
      showBubble: false,
    });
  },

  clearDoNotDisturb: () => set({ doNotDisturbUntil: null }),

  toggleAlertsEnabled: () => {
    const { alertsEnabled } = get();
    set({
      alertsEnabled: !alertsEnabled,
      showBubble: !alertsEnabled ? false : get().showBubble,
    });
  },
}));
