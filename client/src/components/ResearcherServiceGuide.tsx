import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, MessageCircle, Zap, Crown, FileText, Phone, Gift, ArrowRight, CheckCircle } from 'lucide-react';
import { useTranslation } from '../i18n';

interface GuideStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    highlight?: boolean;
  };
  image?: string;
}

// Steps will be generated dynamically with translations
const getGuideSteps = (t: (key: string) => string): GuideStep[] => [
  {
    id: 'intro',
    icon: <MessageCircle className="text-[var(--brand-green)]" size={28} />,
    title: t('researcherGuide.intro.title'),
    description: t('researcherGuide.intro.description'),
    action: { label: t('researcherGuide.intro.action'), highlight: false },
  },
  {
    id: 'entry',
    icon: <ArrowRight className="text-[var(--brand-yellow)]" size={28} />,
    title: t('researcherGuide.entry.title'),
    description: t('researcherGuide.entry.description'),
    action: { label: t('researcherGuide.entry.action'), highlight: true },
  },
  {
    id: 'energy',
    icon: <Zap className="text-[var(--brand-yellow)]" size={28} />,
    title: t('researcherGuide.energy.title'),
    description: t('researcherGuide.energy.description'),
  },
  {
    id: 'level',
    icon: <Crown className="text-[#FFD700]" size={28} />,
    title: t('researcherGuide.level.title'),
    description: t('researcherGuide.level.description'),
  },
  {
    id: 'trial',
    icon: <Gift className="text-[var(--brand-green)]" size={28} />,
    title: t('researcherGuide.trial.title'),
    description: t('researcherGuide.trial.description'),
    action: { label: t('researcherGuide.trial.action'), highlight: true },
  },
  {
    id: 'reports',
    icon: <FileText className="text-[var(--brand-yellow)]" size={28} />,
    title: t('researcherGuide.reports.title'),
    description: t('researcherGuide.reports.description'),
  },
  {
    id: 'call',
    icon: <Phone className="text-[var(--brand-green)]" size={28} />,
    title: t('researcherGuide.call.title'),
    description: t('researcherGuide.call.description'),
  },
];

const GUIDE_KEY = 'sodex_researcher_guide_completed';

export function useResearcherGuide() {
  const [showGuide, setShowGuide] = useState(false);

  const openGuide = () => setShowGuide(true);
  const closeGuide = () => setShowGuide(false);

  const completeGuide = () => {
    localStorage.setItem(GUIDE_KEY, 'true');
    setShowGuide(false);
  };

  const hasCompletedGuide = () => {
    return localStorage.getItem(GUIDE_KEY) === 'true';
  };

  return { showGuide, openGuide, closeGuide, completeGuide, hasCompletedGuide };
}

interface ResearcherServiceGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  onAction?: (actionId: string) => void;
}

export function ResearcherServiceGuide({ isOpen, onClose, onComplete, onAction }: ResearcherServiceGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const { t } = useTranslation();

  // Generate steps with translations
  const guideSteps = getGuideSteps(t);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = guideSteps[currentStep];
  const isLastStep = currentStep === guideSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, step.id]));
    if (isLastStep) {
      onComplete?.();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  const handleAction = () => {
    onAction?.(step.id);
    handleNext();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)] bg-gradient-to-r from-[var(--brand-green)]/10 to-[var(--brand-yellow)]/10">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} className="text-[var(--brand-green)]" />
            <span className="text-[15px] font-bold text-[var(--text-main)]">{t('researcherGuide.title')}</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="px-5 py-3 border-b border-[var(--border-light)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-1">
            {guideSteps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => handleStepClick(idx)}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-[var(--brand-green)]'
                    : completedSteps.has(s.id)
                    ? 'bg-[var(--brand-green)]/50'
                    : 'bg-[var(--bg-highlight)]'
                }`}
                title={s.title}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center mx-auto mb-4">
            {step.icon}
          </div>

          {/* Title */}
          <h2 className="text-[18px] font-bold text-[var(--text-main)] text-center mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-[14px] text-[var(--text-muted)] text-center leading-relaxed">
            {step.description}
          </p>

          {/* Action Button (optional) */}
          {step.action && (
            <button
              onClick={handleAction}
              className={`mt-4 w-full py-2.5 rounded-lg text-[14px] font-medium transition ${
                step.action.highlight
                  ? 'bg-[var(--brand-green)] text-black hover:opacity-90'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {step.action.label}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border-light)] bg-[var(--bg-surface)]">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[14px] transition ${
              isFirstStep
                ? 'text-[var(--text-dim)] cursor-not-allowed'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-highlight)]'
            }`}
          >
            <ChevronLeft size={16} />
            {t('researcherGuide.prev')}
          </button>

          <span className="text-[12px] text-[var(--text-dim)]">
            {currentStep + 1} / {guideSteps.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-[14px] font-medium bg-[var(--brand-yellow)] text-black hover:opacity-90 transition"
          >
            {isLastStep ? (
              <>
                <CheckCircle size={16} />
                {t('researcherGuide.done')}
              </>
            ) : (
              <>
                {t('researcherGuide.next')}
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
