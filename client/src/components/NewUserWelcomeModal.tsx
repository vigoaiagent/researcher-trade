import { useState } from 'react';
import { Gift, Sparkles, MessageCircle, ArrowRight, X, RotateCcw, CheckCircle } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { useTranslation } from '../i18n';

export const TRIAL_VOUCHER_KEY = 'sodex_trial_voucher_used';

// 检查体验券是否可用
export function hasTrialVoucher(): boolean {
  return localStorage.getItem(TRIAL_VOUCHER_KEY) !== 'true';
}

// 标记体验券已使用
export function markTrialVoucherUsed(): void {
  localStorage.setItem(TRIAL_VOUCHER_KEY, 'true');
}

// 重置体验券（用于演示）
export function resetTrialVoucher(): void {
  localStorage.removeItem(TRIAL_VOUCHER_KEY);
}

interface NewUserWelcomeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function NewUserWelcomeModal({ isOpen: externalOpen, onClose: externalClose }: NewUserWelcomeModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState<'welcome' | 'coupon' | 'used'>('welcome');
  const { openChat, setServiceMode, setPhase } = useChatStore();
  const [voucherAvailable, setVoucherAvailable] = useState(hasTrialVoucher());
  const { t } = useTranslation();

  const isOpen = externalOpen ?? internalOpen;

  const handleClose = () => {
    if (externalClose) {
      externalClose();
    } else {
      setInternalOpen(false);
    }
    // 重置步骤
    setStep(hasTrialVoucher() ? 'welcome' : 'used');
  };

  const handleClaimCoupon = () => {
    setStep('coupon');
  };

  const handleStartExperience = () => {
    // 注意：不在这里标记体验券已使用，而是在咨询完成后标记
    // markTrialVoucherUsed() 会在 chatStore.submitRating 中调用
    handleClose();
    // 打开聊天面板，直接进入研究员咨询
    openChat();
    setServiceMode('researcher');
    setPhase('asking');
  };

  const handleResetVoucher = () => {
    resetTrialVoucher();
    setVoucherAvailable(true);
    setStep('welcome');
  };

  // 根据体验券状态设置初始步骤
  const currentStep = !voucherAvailable ? 'used' : step;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
      <div
        className="bg-[var(--bg-panel)] rounded-2xl w-full max-w-[420px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {currentStep === 'welcome' ? (
          <>
            {/* Welcome Step */}
            <div className="relative bg-gradient-to-br from-[#1a3a2a] via-[var(--bg-panel)] to-[#2a2a1a] p-8 text-center">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition"
              >
                <X size={20} className="text-[var(--text-muted)]" />
              </button>

              {/* Sparkle Animation */}
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--brand-yellow)] to-[#FF9500] flex items-center justify-center">
                  <Gift size={40} className="text-black" />
                </div>
                <Sparkles
                  size={24}
                  className="absolute -top-2 -right-2 text-[var(--brand-yellow)] animate-pulse"
                />
              </div>

              <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">
                {t('welcome.title')}
              </h2>
              <p className="text-[var(--text-muted)] text-base">
                {t('welcome.subtitle')}
              </p>
            </div>

            <div className="p-6">
              {/* Gift Box */}
              <div className="bg-gradient-to-r from-[var(--brand-yellow)]/10 to-[var(--brand-green)]/10 border border-[var(--brand-yellow)]/30 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-yellow)] flex items-center justify-center">
                    <MessageCircle size={20} className="text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--brand-yellow)]">
                      {t('welcome.newUserBenefit')}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      {t('welcome.limitedOffer')}
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--bg-app)] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[var(--text-main)] font-medium text-lg">
                        {t('welcome.researcherVoucher')}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        {t('welcome.voucherDesc')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[var(--brand-green)]">{t('welcome.free')}</span>
                      <p className="text-xs text-[var(--text-dim)] line-through">10 {t('topNav.energy')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleClaimCoupon}
                className="w-full py-4 bg-gradient-to-r from-[var(--brand-yellow)] to-[#FF9500] text-black rounded-xl font-bold text-lg hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                {t('welcome.claimNow')}
                <ArrowRight size={20} />
              </button>

              <p className="text-center text-xs text-[var(--text-dim)] mt-4">
                {t('welcome.voucherValidity')}
              </p>
            </div>
          </>
        ) : currentStep === 'coupon' ? (
          <>
            {/* Coupon Claimed Step */}
            <div className="relative bg-gradient-to-br from-[var(--brand-green)]/20 via-[var(--bg-panel)] to-[var(--brand-yellow)]/10 p-8 text-center">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition"
              >
                <X size={20} className="text-[var(--text-muted)]" />
              </button>

              {/* Success Icon */}
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 rounded-full bg-[var(--brand-green)] flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <Sparkles
                  size={24}
                  className="absolute -top-2 -right-2 text-[var(--brand-green)] animate-pulse"
                />
              </div>

              <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">
                {t('welcome.claimSuccess')}
              </h2>
              <p className="text-[var(--text-muted)] text-base">
                {t('welcome.voucherAdded')}
              </p>
            </div>

            <div className="p-6">
              {/* Coupon Card */}
              <div className="relative bg-gradient-to-r from-[var(--brand-green)] to-[#00a86b] rounded-xl p-5 mb-6 overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--bg-panel)]" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--bg-panel)]" />

                <div className="flex items-center justify-between text-black">
                  <div>
                    <p className="text-sm opacity-80">{t('welcome.researcherConsult')}</p>
                    <p className="text-xl font-bold">{t('welcome.voucherCount')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{t('welcome.freeRounds')}</p>
                    <p className="text-sm opacity-80">{t('welcome.freeChat')}</p>
                  </div>
                </div>

                {/* Dashed line */}
                <div className="border-t border-dashed border-black/30 my-4" />

                <div className="flex items-center justify-between text-sm text-black/70">
                  <span>{t('welcome.validity')}</span>
                  <span>{t('welcome.useCount')}</span>
                </div>
              </div>

              {/* How to use */}
              <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-[var(--text-main)] mb-3">{t('welcome.howToUse')}</h4>
                <div className="space-y-2 text-sm text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-yellow)] text-black text-xs flex items-center justify-center font-bold">1</span>
                    <span>{t('welcome.step1')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-yellow)] text-black text-xs flex items-center justify-center font-bold">2</span>
                    <span>{t('welcome.step2')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-yellow)] text-black text-xs flex items-center justify-center font-bold">3</span>
                    <span>{t('welcome.step3')}</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-[var(--bg-surface)] text-[var(--text-muted)] rounded-xl font-medium hover:text-[var(--text-main)] transition"
                >
                  {t('welcome.useLater')}
                </button>
                <button
                  onClick={handleStartExperience}
                  className="flex-1 py-3 bg-[var(--brand-green)] text-black rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  {t('welcome.startNow')}
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Voucher Already Used Step */}
            <div className="relative bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-panel)] to-[var(--bg-surface)] p-8 text-center">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition"
              >
                <X size={20} className="text-[var(--text-muted)]" />
              </button>

              {/* Used Icon */}
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--border-light)] flex items-center justify-center">
                  <CheckCircle size={40} className="text-[var(--text-dim)]" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">
                {t('welcome.voucherUsed')}
              </h2>
              <p className="text-[var(--text-muted)] text-base">
                {t('welcome.voucherUsedDesc')}
              </p>
            </div>

            <div className="p-6">
              {/* Used Coupon Card */}
              <div className="relative bg-[var(--bg-surface)] rounded-xl p-5 mb-6 overflow-hidden opacity-60">
                {/* Decorative circles */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--bg-panel)]" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--bg-panel)]" />

                <div className="flex items-center justify-between text-[var(--text-muted)]">
                  <div>
                    <p className="text-sm opacity-80">{t('welcome.researcherConsult')}</p>
                    <p className="text-xl font-bold">{t('welcome.voucherZero')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold line-through">{t('welcome.freeRounds')}</p>
                    <p className="text-sm opacity-80">{t('welcome.alreadyUsed')}</p>
                  </div>
                </div>

                {/* Dashed line */}
                <div className="border-t border-dashed border-[var(--border-light)] my-4" />

                <div className="text-center text-sm text-[var(--text-dim)]">
                  {t('welcome.voucherUsedBefore')}
                </div>
              </div>

              {/* Info */}
              <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-[var(--text-main)] mb-3">{t('welcome.howToContinue')}</h4>
                <div className="space-y-2 text-sm text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-green)]/20 text-[var(--brand-green)] text-xs flex items-center justify-center font-bold">1</span>
                    <span>{t('welcome.earnEnergy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-green)]/20 text-[var(--brand-green)] text-xs flex items-center justify-center font-bold">2</span>
                    <span>{t('welcome.useEnergy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-green)]/20 text-[var(--brand-green)] text-xs flex items-center justify-center font-bold">3</span>
                    <span>{t('welcome.upgradeGold')}</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleResetVoucher}
                  className="flex-1 py-3 bg-[var(--bg-surface)] text-[var(--text-muted)] rounded-xl font-medium hover:text-[var(--text-main)] transition flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  {t('welcome.resetDemo')}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-[var(--brand-yellow)] text-black rounded-xl font-bold hover:opacity-90 transition"
                >
                  {t('welcome.gotIt')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
