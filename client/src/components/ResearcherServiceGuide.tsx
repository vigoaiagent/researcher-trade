import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, MessageCircle, Zap, Crown, FileText, Phone, Gift, ArrowRight, CheckCircle } from 'lucide-react';

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

const guideSteps: GuideStep[] = [
  {
    id: 'intro',
    icon: <MessageCircle className="text-[var(--brand-green)]" size={28} />,
    title: '研究员咨询服务',
    description: '与专业加密货币分析师一对一交流，获取个性化的交易建议和市场分析。',
    action: { label: '了解更多', highlight: false },
  },
  {
    id: 'entry',
    icon: <ArrowRight className="text-[var(--brand-yellow)]" size={28} />,
    title: '如何进入',
    description: '点击右下角的猫咪图标，在弹出的面板中选择「研究员」标签页，即可开始咨询。',
    action: { label: '去试试', highlight: true },
  },
  {
    id: 'energy',
    icon: <Zap className="text-[var(--brand-yellow)]" size={28} />,
    title: '能量消耗',
    description: '每次咨询消耗 10 能量，可进行 10 轮对话。交易产生的手续费会自动转化为能量。',
  },
  {
    id: 'level',
    icon: <Crown className="text-[#FFD700]" size={28} />,
    title: '等级要求',
    description: 'Gold 及以上等级可使用研究员服务。等级由 30 天交易手续费决定，达到 $1,000 手续费即可升级到 Gold。',
  },
  {
    id: 'trial',
    icon: <Gift className="text-[var(--brand-green)]" size={28} />,
    title: '新手体验券',
    description: '新用户赠送一张免费体验券，无需 Gold 等级也可体验一次研究员咨询服务。点击顶部的票券图标领取。',
    action: { label: '去领取', highlight: true },
  },
  {
    id: 'reports',
    icon: <FileText className="text-[var(--brand-yellow)]" size={28} />,
    title: 'VIP 研报',
    description: '底部状态栏会滚动展示最新研报。点击可查看详情，Gold 会员可阅读完整内容并与研究员互动。',
  },
  {
    id: 'call',
    icon: <Phone className="text-[var(--brand-green)]" size={28} />,
    title: '预约通话',
    description: '在研报详情页可以预约与研究员的 1v1 语音/视频通话，获得更深入的分析服务。',
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
            <span className="text-[15px] font-bold text-[var(--text-main)]">研究员服务指南</span>
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
            上一步
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
                完成
              </>
            ) : (
              <>
                下一步
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
