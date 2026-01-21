import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Crown, MessageCircle, Zap, FileText, Calendar, Gift, HelpCircle } from 'lucide-react';
import { useTranslation } from '../i18n';

interface OnboardingStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
  tip?: string;
  position?: 'topNav' | 'chat' | 'ticker' | 'center';
  hasDetailGuide?: boolean;
}

// 目标元素选择器映射
const targetSelectors: Record<string, string> = {
  level: '[data-onboarding="level"]',
  energy: '[data-onboarding="energy"]',
  'ai-chat': '[data-onboarding="chat"]',
  reports: '[data-onboarding="reports"]',
  roadshow: '[data-onboarding="roadshow"]',
};

// Steps will be generated dynamically with translations
const getSteps = (t: (key: string) => string): OnboardingStep[] => [
  {
    id: 'welcome',
    icon: <Gift className="text-[var(--brand-yellow)]" size={32} />,
    title: t('onboarding.welcome.title'),
    description: t('onboarding.welcome.description'),
    highlight: t('onboarding.welcome.highlight'),
    position: 'center',
  },
  {
    id: 'level',
    icon: <Crown className="text-[#FFD700]" size={32} />,
    title: t('onboarding.level.title'),
    description: t('onboarding.level.description'),
    tip: t('onboarding.level.tip'),
    highlight: t('onboarding.level.highlight'),
    position: 'topNav',
  },
  {
    id: 'energy',
    icon: <Zap className="text-[var(--brand-yellow)]" size={32} />,
    title: t('onboarding.energy.title'),
    description: t('onboarding.energy.description'),
    tip: t('onboarding.energy.tip'),
    highlight: t('onboarding.energy.highlight'),
    position: 'topNav',
  },
  {
    id: 'ai-chat',
    icon: <MessageCircle className="text-[var(--brand-green)]" size={32} />,
    title: t('onboarding.aiChat.title'),
    description: t('onboarding.aiChat.description'),
    tip: t('onboarding.aiChat.tip'),
    highlight: t('onboarding.aiChat.highlight'),
    position: 'chat',
    hasDetailGuide: true,
  },
  {
    id: 'reports',
    icon: <FileText className="text-[var(--brand-yellow)]" size={32} />,
    title: t('onboarding.reports.title'),
    description: t('onboarding.reports.description'),
    tip: t('onboarding.reports.tip'),
    highlight: t('onboarding.reports.highlight'),
    position: 'ticker',
  },
  {
    id: 'roadshow',
    icon: <Calendar className="text-[var(--brand-yellow)]" size={32} />,
    title: t('onboarding.roadshow.title'),
    description: t('onboarding.roadshow.description'),
    tip: t('onboarding.roadshow.tip'),
    highlight: t('onboarding.roadshow.highlight'),
    position: 'ticker',
  },
  {
    id: 'start',
    icon: <Sparkles className="text-[var(--brand-green)]" size={32} />,
    title: t('onboarding.ready.title'),
    description: t('onboarding.ready.description'),
    highlight: t('onboarding.ready.highlight'),
    position: 'center',
  },
];

const ONBOARDING_KEY = 'sodex_onboarding_completed';

export function useOnboardingGuide() {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // 延迟显示，等页面加载完成
      const timer = setTimeout(() => setShowGuide(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowGuide(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'skipped');
    setShowGuide(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowGuide(true);
  };

  return { showGuide, completeOnboarding, skipOnboarding, resetOnboarding };
}

// Spotlight 高亮框组件
interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function Spotlight({ targetSelector, isActive }: { targetSelector?: string; isActive: boolean }) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!targetSelector || !isActive) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const domRect = element.getBoundingClientRect();
        const padding = 8;
        setRect({
          top: domRect.top - padding,
          left: domRect.left - padding,
          width: domRect.width + padding * 2,
          height: domRect.height + padding * 2,
        });
      } else {
        setRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [targetSelector, isActive]);

  if (!rect) return null;

  return (
    <>
      {/* 四周遮罩 */}
      <div className="fixed inset-0 z-[299] pointer-events-none">
        {/* 上方遮罩 */}
        <div
          className="absolute bg-black/70 left-0 right-0 top-0"
          style={{ height: rect.top }}
        />
        {/* 下方遮罩 */}
        <div
          className="absolute bg-black/70 left-0 right-0 bottom-0"
          style={{ top: rect.top + rect.height }}
        />
        {/* 左侧遮罩 */}
        <div
          className="absolute bg-black/70 left-0"
          style={{
            top: rect.top,
            width: rect.left,
            height: rect.height
          }}
        />
        {/* 右侧遮罩 */}
        <div
          className="absolute bg-black/70 right-0"
          style={{
            top: rect.top,
            left: rect.left + rect.width,
            height: rect.height
          }}
        />
      </div>
      {/* 高亮框 */}
      <div
        className="fixed z-[299] pointer-events-none rounded-xl"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow: '0 0 0 4px var(--brand-yellow), 0 0 20px rgba(255, 200, 0, 0.5)',
        }}
      />
    </>
  );
}

interface OnboardingGuideProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onOpenResearcherGuide?: () => void;
}

export function OnboardingGuide({ isOpen, onComplete, onSkip, onOpenResearcherGuide }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Generate steps with translations
  const steps = getSteps(t);

  // 重置步骤当关闭后重新打开
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const targetSelector = targetSelectors[step.id];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  // 判断是否有高亮目标
  const hasSpotlight = !!targetSelector;

  return (
    <>
      {/* Spotlight 高亮遮罩 */}
      <Spotlight targetSelector={targetSelector} isActive={hasSpotlight} />

      {/* 无高亮时的背景遮罩 */}
      {!hasSpotlight && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[299]" />
      )}

      {/* 引导卡片 */}
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 pointer-events-none">
        <div ref={cardRef} className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
          {/* Step Indicators - Clickable */}
          <div className="flex items-center gap-1.5">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => handleStepClick(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 bg-[var(--brand-yellow)]'
                    : idx < currentStep
                    ? 'w-2 bg-[var(--brand-green)] hover:bg-[var(--brand-green)]/80'
                    : 'w-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)]'
                }`}
                title={s.title}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
          >
            {t('onboarding.skip')}
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] flex items-center justify-center mx-auto mb-5">
            {step.icon}
          </div>

          {/* Title */}
          <h2 className="text-[20px] font-bold text-[var(--text-main)] text-center mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-[14px] text-[var(--text-muted)] text-center leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Tip */}
          {step.tip && (
            <div className="flex items-start gap-2 p-3 bg-[var(--bg-surface)] rounded-lg mb-3">
              <HelpCircle size={16} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                {step.tip}
              </p>
            </div>
          )}

          {/* Highlight */}
          {step.highlight && (
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--brand-yellow)]/10 rounded-lg">
              <Sparkles size={14} className="text-[var(--brand-yellow)]" />
              <span className="text-[13px] text-[var(--brand-yellow)] font-medium">
                {step.highlight}
              </span>
            </div>
          )}

          {/* Detail Guide Button */}
          {step.hasDetailGuide && onOpenResearcherGuide && (
            <button
              onClick={() => {
                onComplete();
                onOpenResearcherGuide();
              }}
              className="mt-4 w-full py-2.5 bg-[var(--brand-green)] text-black rounded-lg text-[14px] font-medium hover:opacity-90 transition"
            >
              {t('onboarding.viewResearcherGuide')}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border-light)] bg-[var(--bg-surface)]">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-[14px] transition ${
              isFirstStep
                ? 'text-[var(--text-dim)] cursor-not-allowed'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-highlight)]'
            }`}
          >
            <ChevronLeft size={18} />
            {t('onboarding.prev')}
          </button>

          <span className="text-[13px] text-[var(--text-dim)]">
            {currentStep + 1} / {steps.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-5 py-2 rounded-lg text-[14px] font-medium bg-[var(--brand-yellow)] text-black hover:opacity-90 transition"
          >
            {isLastStep ? t('onboarding.start') : t('onboarding.next')}
            {!isLastStep && <ChevronRight size={18} />}
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
