import { ArrowLeft, RefreshCw, X, ChevronDown } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { ResearcherCard } from '../ResearcherCard';
import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';

export function SelectingPhase() {
  const { answers, selectResearcher, skipSelection, isLoading, currentConsultation } = useChatStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 移动端半屏模态框
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-[var(--bg-panel)]">
        {/* 问题预览 - 缩略显示 */}
        {currentConsultation && (
          <div className="px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-light)]">
            <p className="text-[11px] text-[var(--text-muted)] mb-1">{t('chatPanel.yourQuestion')}</p>
            <p className="text-[14px] text-[var(--text-main)] line-clamp-1">
              {currentConsultation.question}
            </p>
          </div>
        )}

        {/* 半屏底部弹窗 */}
        <div
          className={`flex-1 flex flex-col bg-[var(--bg-panel)] rounded-t-3xl shadow-2xl transition-all duration-300 overflow-hidden ${
            isExpanded ? 'mt-0' : 'mt-auto'
          }`}
          style={{
            maxHeight: isExpanded ? '100%' : '60vh',
            minHeight: '50vh',
          }}
        >
          {/* 拖拽手柄 */}
          <div
            className="flex justify-center py-3 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="w-10 h-1 bg-[var(--border-light)] rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3">
            <div>
              <h3 className="font-bold text-[18px] text-[var(--text-main)]">
                {t('chatPanel.selectResearcher')}
              </h3>
              <p className="text-[13px] text-[var(--text-muted)]">
                {answers.length} {t('chatPanel.researchersResponded')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] transition"
              >
                <ChevronDown
                  size={18}
                  className={`text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={skipSelection}
                className="p-2 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] transition"
              >
                <X size={18} className="text-[var(--text-muted)]" />
              </button>
            </div>
          </div>

          {/* Researcher List - 横向滚动卡片 */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {answers.map((answer) => (
              <ResearcherCard
                key={answer.id}
                answer={answer}
                onSelect={() => selectResearcher(answer)}
                isLoading={isLoading}
              />
            ))}

            {answers.length === 0 && (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <p className="text-[16px]">{t('chatPanel.noResponse')}</p>
                <p className="text-[14px] mt-1">{t('chatPanel.pleaseWait')}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-light)] safe-area-bottom">
            <button
              onClick={skipSelection}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] text-[var(--text-muted)] bg-[var(--bg-app)] hover:bg-[var(--bg-highlight)] transition"
            >
              <RefreshCw size={16} />
              {t('chatPanel.notSuitable')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 桌面端 - 保持原有布局
  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)]">
      {/* Header */}
      <div className="p-3 md:p-4 bg-[var(--bg-surface)] border-b border-[var(--border-light)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[18px] md:text-[20px] text-[var(--text-main)]">
              {t('chatPanel.selectResearcher')}
            </h3>
            <p className="text-[13px] md:text-[15px] text-[var(--text-muted)] mt-0.5">
              {answers.length} {t('chatPanel.researchersResponded')}
            </p>
          </div>
          {/* Skip Button */}
          <button
            onClick={skipSelection}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition"
          >
            <ArrowLeft size={16} />
            <span className="hidden md:inline">{t('chatPanel.reaskQuestion')}</span>
          </button>
        </div>
      </div>

      {/* Question Review */}
      {currentConsultation && (
        <div className="px-3 md:px-4 py-2.5 bg-[var(--brand-green-dim)] border-b border-[var(--brand-green)]">
          <p className="text-[12px] text-[var(--brand-green)] mb-0.5">
            {t('chatPanel.yourQuestion')}
          </p>
          <p className="text-[14px] md:text-[16px] line-clamp-2 text-[var(--text-main)]">
            {currentConsultation.question}
          </p>
        </div>
      )}

      {/* Researcher List */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-[var(--bg-app)]">
        {answers.map((answer) => (
          <ResearcherCard
            key={answer.id}
            answer={answer}
            onSelect={() => selectResearcher(answer)}
            isLoading={isLoading}
          />
        ))}

        {answers.length === 0 && (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <p className="text-[16px]">{t('chatPanel.noResponse')}</p>
            <p className="text-[14px] mt-1">{t('chatPanel.pleaseWait')}</p>
          </div>
        )}
      </div>

      {/* Footer with Skip Option */}
      <div className="p-3 md:p-4 bg-[var(--bg-surface)] border-t border-[var(--border-light)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[12px] md:text-[14px] text-[var(--text-muted)]">
            {t('chatPanel.afterSelect')}
          </p>
          <button
            onClick={skipSelection}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] text-[var(--text-muted)] hover:text-[var(--brand-yellow)] bg-[var(--bg-app)] hover:bg-[var(--bg-highlight)] transition"
          >
            <RefreshCw size={14} />
            {t('chatPanel.notSuitable')}
          </button>
        </div>
      </div>
    </div>
  );
}
