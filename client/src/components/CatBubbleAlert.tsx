import { useAlertStore } from '../stores/alertStore';
import type { DoNotDisturbDuration } from '../stores/alertStore';
import { X, ThumbsUp, ThumbsDown, ChevronRight, Newspaper, Settings, Bell, BellOff, Clock } from 'lucide-react';

export function CatBubbleAlert() {
  const { currentAlert, showBubble, alerts, dismissedIds, setFeedback, openPanel, closeBubble, openSettings } = useAlertStore();

  // 计算未读数量
  const unreadCount = alerts.filter(a => !dismissedIds.has(a.id) && !a.feedback).length;

  if (!showBubble || !currentAlert) return null;

  return (
    <div data-alert-bubble className="fixed bottom-[180px] right-4 md:bottom-[160px] md:right-8 z-[99] animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* 气泡箭头 */}
      <div className="absolute -bottom-2 right-8 w-4 h-4 bg-[var(--bg-panel)] border-r border-b border-[var(--border-light)] rotate-45" />

      {/* 气泡内容 */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl shadow-2xl w-[300px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-surface)] border-b border-[var(--border-light)]">
          <div className="flex items-center gap-2">
            <Newspaper size={14} className="text-[var(--brand-yellow)]" />
            <span className="text-[12px] font-medium text-[var(--text-main)]">
              与你的持仓相关
            </span>
            {unreadCount > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-[var(--brand-yellow)]/20 text-[var(--brand-yellow)] rounded">
                +{unreadCount - 1}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openSettings();
              }}
              className="p-1 hover:bg-[var(--bg-highlight)] rounded transition"
              title="提醒设置"
            >
              <Settings size={14} className="text-[var(--text-muted)]" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeBubble();
              }}
              className="p-1 hover:bg-[var(--bg-highlight)] rounded transition"
            >
              <X size={14} className="text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Symbol */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold px-1.5 py-0.5 bg-[var(--bg-surface)] text-[var(--text-main)] rounded">
              {currentAlert.symbol.split('/')[0]}
            </span>
            {currentAlert.isUrgent && (
              <span className="text-[10px] px-1.5 py-0.5 bg-[var(--brand-yellow)]/20 text-[var(--brand-yellow)] rounded">
                重要
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-[13px] font-medium text-[var(--text-main)] leading-snug mb-1">
            {currentAlert.title}
          </h4>

          {/* Source & Time */}
          <p className="text-[11px] text-[var(--text-dim)] mb-3">
            {currentAlert.source} · {currentAlert.time}
          </p>

          {/* Feedback Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFeedback(currentAlert.id, 'useful');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[var(--brand-green)]/10 hover:bg-[var(--brand-green)]/20 text-[var(--brand-green)] rounded-lg text-[12px] font-medium transition"
            >
              <ThumbsUp size={14} />
              有用
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFeedback(currentAlert.id, 'not_useful');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] text-[var(--text-muted)] rounded-lg text-[12px] font-medium transition"
            >
              <ThumbsDown size={14} />
              无用
            </button>
          </div>
        </div>

        {/* Footer - View All */}
        {unreadCount > 1 && (
          <button
            onClick={openPanel}
            className="w-full flex items-center justify-center gap-1 py-2 border-t border-[var(--border-light)] text-[12px] text-[var(--text-muted)] hover:text-[var(--brand-yellow)] hover:bg-[var(--bg-surface)] transition"
          >
            查看全部 {unreadCount} 条
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// 全部 Alert 面板
export function AlertPanel() {
  const { alerts, dismissedIds, showPanel, closePanel, setFeedback, clearAll, openSettings } = useAlertStore();

  const activeAlerts = alerts.filter(a => !dismissedIds.has(a.id) && !a.feedback);

  if (!showPanel) return null;

  return (
    <div
      data-alert-panel
      className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4"
      onClick={(e) => {
        // 点击背景关闭面板
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          closePanel();
        }
      }}
    >
      <div
        className="bg-[var(--bg-panel)] rounded-xl w-full max-w-md max-h-[70vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-2">
            <Newspaper size={18} className="text-[var(--brand-yellow)]" />
            <span className="text-[15px] font-bold text-[var(--text-main)]">持仓相关资讯</span>
            <span className="text-[12px] px-1.5 py-0.5 bg-[var(--bg-surface)] text-[var(--text-muted)] rounded">
              {activeAlerts.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {activeAlerts.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
              >
                全部已读
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openSettings();
              }}
              className="p-1 hover:bg-[var(--bg-surface)] rounded"
              title="提醒设置"
            >
              <Settings size={16} className="text-[var(--text-muted)]" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closePanel();
              }}
              className="p-1 hover:bg-[var(--bg-surface)] rounded"
            >
              <X size={18} className="text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {activeAlerts.length === 0 ? (
            <div className="py-12 text-center">
              <Newspaper size={40} className="mx-auto mb-3 text-[var(--text-dim)]" />
              <p className="text-[14px] text-[var(--text-muted)]">暂无新资讯</p>
            </div>
          ) : (
            activeAlerts.map(alert => (
              <div key={alert.id} className="p-4 border-b border-[var(--border-light)]">
                {/* Symbol */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-bold px-1.5 py-0.5 bg-[var(--bg-surface)] text-[var(--text-main)] rounded">
                    {alert.symbol.split('/')[0]}
                  </span>
                  {alert.isUrgent && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-[var(--brand-yellow)]/20 text-[var(--brand-yellow)] rounded">
                      重要
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-[14px] font-medium text-[var(--text-main)] leading-snug mb-1">
                  {alert.title}
                </h4>

                {/* Summary */}
                <p className="text-[12px] text-[var(--text-muted)] leading-relaxed mb-2">
                  {alert.summary}
                </p>

                {/* Source & Time */}
                <p className="text-[11px] text-[var(--text-dim)] mb-3">
                  {alert.source} · {alert.time}
                </p>

                {/* Feedback */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFeedback(alert.id, 'useful')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand-green)]/10 hover:bg-[var(--brand-green)]/20 text-[var(--brand-green)] rounded-lg text-[12px] font-medium transition"
                  >
                    <ThumbsUp size={12} />
                    有用
                  </button>
                  <button
                    onClick={() => setFeedback(alert.id, 'not_useful')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] text-[var(--text-muted)] rounded-lg text-[12px] font-medium transition"
                  >
                    <ThumbsDown size={12} />
                    无用
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 免打扰时长选项
const doNotDisturbOptions: { duration: DoNotDisturbDuration; label: string }[] = [
  { duration: 30, label: '30 分钟' },
  { duration: 60, label: '1 小时' },
  { duration: 120, label: '2 小时' },
  { duration: 480, label: '8 小时' },
  { duration: 1440, label: '1 天' },
];

// 设置面板
export function AlertSettingsPanel() {
  const {
    showSettings,
    closeSettings,
    alertsEnabled,
    toggleAlertsEnabled,
    doNotDisturbUntil,
    setDoNotDisturb,
    clearDoNotDisturb,
    isInDoNotDisturb,
  } = useAlertStore();

  if (!showSettings) return null;

  const isDoNotDisturb = isInDoNotDisturb();
  const remainingTime = doNotDisturbUntil ? Math.max(0, doNotDisturbUntil - Date.now()) : 0;
  const remainingMinutes = Math.ceil(remainingTime / 60000);

  const formatRemaining = () => {
    if (remainingMinutes >= 60) {
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
    }
    return `${remainingMinutes}分钟`;
  };

  return (
    <div
      data-alert-settings
      className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          closeSettings();
        }
      }}
    >
      <div
        className="bg-[var(--bg-panel)] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-[var(--brand-yellow)]" />
            <span className="text-[15px] font-bold text-[var(--text-main)]">提醒设置</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeSettings();
            }}
            className="p-1 hover:bg-[var(--bg-surface)] rounded"
          >
            <X size={18} className="text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* 开启/关闭提醒 */}
          <div className="flex items-center justify-between p-3 bg-[var(--bg-surface)] rounded-lg">
            <div className="flex items-center gap-3">
              {alertsEnabled ? (
                <Bell size={20} className="text-[var(--brand-green)]" />
              ) : (
                <BellOff size={20} className="text-[var(--text-muted)]" />
              )}
              <div>
                <div className="text-[14px] font-medium text-[var(--text-main)]">
                  持仓资讯提醒
                </div>
                <div className="text-[12px] text-[var(--text-muted)]">
                  {alertsEnabled ? '开启中' : '已关闭'}
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleAlertsEnabled();
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                alertsEnabled ? 'bg-[var(--brand-green)]' : 'bg-[var(--bg-highlight)]'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  alertsEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 免打扰状态 */}
          {isDoNotDisturb && alertsEnabled && (
            <div className="flex items-center justify-between p-3 bg-[var(--brand-yellow)]/10 rounded-lg border border-[var(--brand-yellow)]/30">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[var(--brand-yellow)]" />
                <div>
                  <div className="text-[13px] font-medium text-[var(--brand-yellow)]">
                    免打扰中
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    剩余 {formatRemaining()}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearDoNotDisturb();
                }}
                className="px-3 py-1.5 text-[12px] text-[var(--brand-yellow)] border border-[var(--brand-yellow)]/50 rounded-lg hover:bg-[var(--brand-yellow)]/10 transition"
              >
                取消
              </button>
            </div>
          )}

          {/* 免打扰选项 */}
          {alertsEnabled && !isDoNotDisturb && (
            <div>
              <div className="text-[13px] font-medium text-[var(--text-main)] mb-2">
                暂时免打扰
              </div>
              <div className="grid grid-cols-3 gap-2">
                {doNotDisturbOptions.map((option) => (
                  <button
                    key={option.duration}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDoNotDisturb(option.duration);
                    }}
                    className="px-3 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] text-[12px] text-[var(--text-main)] rounded-lg transition"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <div className="text-[11px] text-[var(--text-dim)] leading-relaxed">
            持仓资讯提醒会在您持有的币种有重要新闻时通知您。您可以随时关闭或设置免打扰时间。
          </div>
        </div>
      </div>
    </div>
  );
}
