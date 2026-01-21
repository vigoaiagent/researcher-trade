import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { RoboCatIcon } from '../trading/RoboCatIcon';
import { useTranslation } from '../../i18n';

export function WaitingPhase() {
  const { currentConsultation } = useChatStore();
  const [onlineCount, setOnlineCount] = useState(0);
  const { t } = useTranslation();

  // 模拟获取在线研究员数量
  useEffect(() => {
    // 初始设置一个随机数（12-28之间）
    const randomCount = Math.floor(Math.random() * 17) + 12;
    setOnlineCount(randomCount);

    // 每隔一段时间轻微变动（模拟实时更新）
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(8, Math.min(35, prev + change));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-6 text-center bg-[var(--bg-panel)]">
      {/* Online Researchers Count */}
      <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-[var(--brand-green)]/10 border border-[var(--brand-green)]/30">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-green)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--brand-green)]"></span>
        </span>
        <Users size={16} className="text-[var(--brand-green)]" />
        <span className="text-[14px] font-medium text-[var(--brand-green)]">
          {onlineCount} {t('chatPanel.researchersOnline')}
        </span>
      </div>

      {/* Loading Animation */}
      <div className="relative mb-6 md:mb-8">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full animate-pulse bg-[var(--brand-green-dim)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="md:hidden">
            <RoboCatIcon size={48} />
          </div>
          <div className="hidden md:block">
            <RoboCatIcon size={56} />
          </div>
        </div>
      </div>

      <h3 className="text-[18px] md:text-[22px] font-bold mb-2 md:mb-3 text-[var(--text-main)]">
        {t('chatPanel.matchingResearcher')}
      </h3>

      <p className="text-[14px] md:text-[16px] mb-4 md:mb-5 text-[var(--text-muted)]">
        {t('chatPanel.questionSent')}
      </p>

      {currentConsultation && (
        <div className="rounded-lg p-3 md:p-5 w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-light)]">
          <p className="text-[12px] md:text-[14px] mb-1.5 md:mb-2 text-[var(--text-muted)]">
            {t('chatPanel.yourQuestion')}
          </p>
          <p className="text-[14px] md:text-[18px] text-[var(--text-main)] leading-relaxed line-clamp-3">
            {currentConsultation.question}
          </p>
        </div>
      )}

      <div className="mt-6 md:mt-8 flex items-center gap-2 md:gap-3 text-[14px] md:text-[16px] text-[var(--text-muted)]">
        <svg className="w-4 h-4 md:w-5 md:h-5 animate-spin" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>{t('chatPanel.waitingResponse')}</span>
      </div>

      <p className="mt-4 md:mt-5 text-[12px] md:text-[14px] text-[var(--brand-yellow)]">
        {t('chatPanel.responseTimeout')}
      </p>
    </div>
  );
}
