import { useState, useEffect } from 'react';
import { Crown, X, TrendingUp, TrendingDown, Bell, ChevronRight } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { LEVEL_CONFIG } from '../../types';
import { useTranslation } from '../../i18n';

interface NotificationReport {
  id: string;
  title: string;
  symbol?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  researcher: string;
  requiredLevel: 'Gold' | 'Diamond';
}

interface ReportNotificationProps {
  report: NotificationReport;
  onView: (reportId: string) => void;
  onDismiss: () => void;
}

export function ReportNotification({ report, onView, onDismiss }: ReportNotificationProps) {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const userLevel = user?.level || 'Bronze';
  const levelOrder = ['Bronze', 'Silver', 'Gold', 'Diamond'] as const;
  const userLevelIndex = levelOrder.indexOf(userLevel);
  const hasAccess = userLevelIndex >= levelOrder.indexOf(report.requiredLevel);

  useEffect(() => {
    // 延迟显示动画
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    // 自动消失
    const hideTimer = setTimeout(() => handleDismiss(), 8000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  const handleView = () => {
    if (hasAccess) {
      onView(report.id);
      handleDismiss();
    }
  };

  const SentimentIcon = () => {
    if (report.sentiment === 'bullish') {
      return <TrendingUp size={14} className="text-[var(--brand-green)]" />;
    }
    if (report.sentiment === 'bearish') {
      return <TrendingDown size={14} className="text-[var(--brand-red)]" />;
    }
    return null;
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-80 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
        isVisible && !isExiting
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-8'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/10 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-[var(--brand-yellow)]" />
          <span className="text-[11px] font-medium text-[var(--brand-yellow)]">
            {t('reportNotification.title')}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-0.5 hover:bg-[var(--bg-surface)] rounded transition-colors"
        >
          <X size={14} className="text-[var(--text-muted)]" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded text-[8px] font-bold text-black shrink-0">
            <Crown size={8} />
            {t('reportNotification.vip')}
          </span>
          {report.symbol && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[var(--bg-surface)] text-[var(--text-main)] rounded shrink-0">
              {report.symbol}
            </span>
          )}
          <SentimentIcon />
        </div>

        <h4 className="text-[13px] font-medium text-[var(--text-main)] leading-tight mb-2 line-clamp-2">
          {report.title}
        </h4>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-muted)]">
            {t('reportNotification.by', { name: report.researcher })}
          </span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded border"
            style={{
              borderColor: LEVEL_CONFIG[report.requiredLevel].color,
              color: LEVEL_CONFIG[report.requiredLevel].color,
            }}
          >
            {report.requiredLevel}+
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="px-3 pb-3">
        {hasAccess ? (
          <button
            onClick={handleView}
            className="w-full flex items-center justify-center gap-1 py-2 bg-[var(--brand-yellow)] text-black text-[11px] font-medium rounded hover:opacity-90 transition-opacity"
          >
            {t('reportNotification.viewReport')}
            <ChevronRight size={14} />
          </button>
        ) : (
          <div className="text-center py-2 bg-[var(--bg-surface)] rounded">
            <div className="text-[11px] text-[var(--text-muted)]">
              {t('reportNotification.requiresLevel')}
              <span style={{ color: LEVEL_CONFIG[report.requiredLevel].color }}>{report.requiredLevel}</span>
              {t('reportNotification.levelSuffix')}
            </div>
            <div className="text-[10px] text-[var(--text-dim)]">
              {t('reportNotification.currentLevel', { level: userLevel })}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--bg-surface)]">
        <div
          className="h-full bg-[var(--brand-yellow)] transition-all duration-[8000ms] ease-linear"
          style={{ width: isVisible && !isExiting ? '0%' : '100%' }}
        />
      </div>
    </div>
  );
}

// 研报推送管理 Hook
interface UseReportNotificationsOptions {
  onViewReport: (reportId: string) => void;
}

export function useReportNotifications({ onViewReport }: UseReportNotificationsOptions) {
  const [notifications, setNotifications] = useState<NotificationReport[]>([]);

  const pushNotification = (report: NotificationReport) => {
    setNotifications(prev => [...prev, report]);
  };

  const dismissNotification = (reportId: string) => {
    setNotifications(prev => prev.filter(r => r.id !== reportId));
  };

  const NotificationContainer = () => (
    <>
      {notifications.slice(0, 3).map((report, index) => (
        <div
          key={report.id}
          style={{ transform: `translateY(${index * 8}px)`, zIndex: 50 - index }}
        >
          <ReportNotification
            report={report}
            onView={onViewReport}
            onDismiss={() => dismissNotification(report.id)}
          />
        </div>
      ))}
    </>
  );

  return {
    pushNotification,
    NotificationContainer,
    hasNotifications: notifications.length > 0,
  };
}
