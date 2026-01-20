import { useState } from 'react';
import { Gift, Sparkles, MessageCircle, ArrowRight, X, RotateCcw, CheckCircle } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';

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
                欢迎来到 SoDEX! 🎉
              </h2>
              <p className="text-[var(--text-muted)] text-base">
                感谢您加入我们的交易平台
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
                      新手专属福利
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      限时赠送
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--bg-app)] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[var(--text-main)] font-medium text-lg">
                        研究员咨询体验券
                      </p>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        免费体验 1 次专属研究员咨询 (10轮对话)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[var(--brand-green)]">免费</span>
                      <p className="text-xs text-[var(--text-dim)] line-through">10 能量</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleClaimCoupon}
                className="w-full py-4 bg-gradient-to-r from-[var(--brand-yellow)] to-[#FF9500] text-black rounded-xl font-bold text-lg hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                立即领取
                <ArrowRight size={20} />
              </button>

              <p className="text-center text-xs text-[var(--text-dim)] mt-4">
                体验券有效期 7 天，每位用户限领 1 次
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
                领取成功! 🎁
              </h2>
              <p className="text-[var(--text-muted)] text-base">
                体验券已存入您的账户
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
                    <p className="text-sm opacity-80">研究员咨询</p>
                    <p className="text-xl font-bold">体验券 × 1</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">10轮</p>
                    <p className="text-sm opacity-80">免费对话</p>
                  </div>
                </div>

                {/* Dashed line */}
                <div className="border-t border-dashed border-black/30 my-4" />

                <div className="flex items-center justify-between text-sm text-black/70">
                  <span>有效期：7 天</span>
                  <span>使用次数：1 次</span>
                </div>
              </div>

              {/* How to use */}
              <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-[var(--text-main)] mb-3">如何使用？</h4>
                <div className="space-y-2 text-sm text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-yellow)] text-black text-xs flex items-center justify-center font-bold">1</span>
                    <span>点击下方按钮进入咨询</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-yellow)] text-black text-xs flex items-center justify-center font-bold">2</span>
                    <span>输入您的交易问题</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-yellow)] text-black text-xs flex items-center justify-center font-bold">3</span>
                    <span>选择心仪的研究员开始对话</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-[var(--bg-surface)] text-[var(--text-muted)] rounded-xl font-medium hover:text-[var(--text-main)] transition"
                >
                  稍后使用
                </button>
                <button
                  onClick={handleStartExperience}
                  className="flex-1 py-3 bg-[var(--brand-green)] text-black rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  立即体验
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
                体验券已使用
              </h2>
              <p className="text-[var(--text-muted)] text-base">
                您的免费体验券已经用过了
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
                    <p className="text-sm opacity-80">研究员咨询</p>
                    <p className="text-xl font-bold">体验券 × 0</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold line-through">10轮</p>
                    <p className="text-sm opacity-80">已使用</p>
                  </div>
                </div>

                {/* Dashed line */}
                <div className="border-t border-dashed border-[var(--border-light)] my-4" />

                <div className="text-center text-sm text-[var(--text-dim)]">
                  体验券已于之前使用
                </div>
              </div>

              {/* Info */}
              <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-[var(--text-main)] mb-3">如何继续使用研究员服务？</h4>
                <div className="space-y-2 text-sm text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-green)]/20 text-[var(--brand-green)] text-xs flex items-center justify-center font-bold">1</span>
                    <span>交易获取能量（手续费=能量）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-green)]/20 text-[var(--brand-green)] text-xs flex items-center justify-center font-bold">2</span>
                    <span>使用 10 能量开始研究员咨询</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-green)]/20 text-[var(--brand-green)] text-xs flex items-center justify-center font-bold">3</span>
                    <span>升级到 Gold 等级解锁更多服务</span>
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
                  重新体验(演示)
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-[var(--brand-yellow)] text-black rounded-xl font-bold hover:opacity-90 transition"
                >
                  我知道了
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
