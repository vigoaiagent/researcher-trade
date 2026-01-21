import { useState, useEffect } from 'react';
import { PartyPopper, ExternalLink, Star, Heart, Check, Loader2, Lock } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useUserStore } from '../../stores/userStore';
import { favoriteApi } from '../../services/api';
import { LEVEL_CONFIG } from '../../types';
import { useTranslation } from '../../i18n';

// SoSoValue 研究员主页 URL 模板
const PROFILE_URL = 'https://sosovalue.com/profile/index';

export function CompletedPhase() {
  const { reset, closeChat, selectedResearcher } = useChatStore();
  const { user } = useUserStore();
  const { t } = useTranslation();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  // 检查是否已订阅
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !selectedResearcher) {
        setCheckingSubscription(false);
        return;
      }
      try {
        const result = await favoriteApi.check(user.id, selectedResearcher.researcherId);
        setIsSubscribed(result.isSubscribed && (result.isActive ?? false));
      } catch (error) {
        console.error('Failed to check subscription:', error);
      } finally {
        setCheckingSubscription(false);
      }
    };
    checkSubscription();
  }, [user, selectedResearcher]);

  const handleNewConsultation = () => {
    reset();
  };

  const handleClose = () => {
    closeChat();
    reset();
  };

  const handleSubscribe = async () => {
    if (!user || !selectedResearcher || isLoading) return;

    setIsLoading(true);
    try {
      await favoriteApi.add(user.id, selectedResearcher.researcherId);
      setIsSubscribed(true);
    } catch (error: any) {
      alert(error.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // 构建研究员 SoSoValue 主页链接
  const researcherProfileUrl = selectedResearcher
    ? `${PROFILE_URL}/${selectedResearcher.researcherId}`
    : null;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-[var(--bg-panel)]">
      {/* Completion Icon */}
      <div className="mb-5">
        <div className="w-24 h-24 bg-[var(--brand-green-dim)] rounded-full flex items-center justify-center">
          <PartyPopper size={48} className="text-[var(--brand-green)]" />
        </div>
      </div>

      <h3 className="text-[22px] font-bold text-[var(--text-main)] mb-3">{t('chatPanel.thankYouRating')}</h3>

      <p className="text-[15px] text-[var(--text-muted)] text-center mb-5">
        {t('chatPanel.weWillImprove')}
      </p>

      {/* Researcher Profile Card */}
      {selectedResearcher && (
        <div className="w-full max-w-sm mb-5 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-light)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-[var(--brand-green)] flex items-center justify-center text-black text-[18px] font-bold">
              {selectedResearcher.researcher.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="text-[17px] font-medium text-[var(--text-main)]">
                {selectedResearcher.researcher.name}
              </div>
              <div className="flex items-center gap-2 text-[14px] text-[var(--text-muted)] mt-1">
                <Star size={14} className="text-[var(--brand-yellow)] fill-[var(--brand-yellow)]" />
                {selectedResearcher.researcher.ratingScore.toFixed(1)} · {selectedResearcher.researcher.serviceCount} {t('chatPanel.services')}
              </div>
            </div>
          </div>

          {/* Subscribe Button */}
          {!checkingSubscription && (
            user && !LEVEL_CONFIG[user.level].hasResearcherAccess ? (
              // Level requirement not met - show locked state
              <div className="w-full py-3 mb-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-light)]">
                <div className="flex items-center justify-center gap-2 text-[var(--text-muted)]">
                  <Lock size={16} />
                  <span className="text-[14px]">{t('chatPanel.subscriptionRequiresGoldLevel')}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={isSubscribed || isLoading}
                className={`flex items-center justify-center gap-2 w-full py-3 mb-3 rounded-lg text-[15px] font-medium transition ${
                  isSubscribed
                    ? 'bg-[var(--brand-green-dim)] text-[var(--brand-green)] cursor-default'
                    : 'bg-[var(--brand-red)] text-white hover:opacity-90'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isSubscribed ? (
                  <>
                    <Check size={18} />
                    {t('chatPanel.subscribed')}
                  </>
                ) : (
                  <>
                    <Heart size={18} />
                    {t('chatPanel.subscribeResearcher')}
                  </>
                )}
              </button>
            )
          )}

          {researcherProfileUrl && (
            <a
              href={researcherProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--bg-app)] rounded-lg text-[14px] text-[var(--text-muted)] hover:text-[var(--brand-yellow)] hover:bg-[var(--bg-highlight)] transition"
            >
              <ExternalLink size={16} />
              {t('chatPanel.viewResearcherProfile')}
            </a>
          )}
        </div>
      )}

      {/* Subscription Hint */}
      {selectedResearcher && !isSubscribed && !checkingSubscription && user && LEVEL_CONFIG[user.level].hasResearcherAccess && (
        <p className="text-[14px] text-[var(--text-muted)] text-center mb-4 max-w-sm">
          {t('chatPanel.subscribeHint')}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={handleNewConsultation}
          className="w-full py-3 bg-[var(--brand-green)] text-black rounded-lg font-bold hover:opacity-90 transition text-[16px]"
        >
          {t('chatPanel.newConsultation')}
        </button>
        <button
          onClick={handleClose}
          className="w-full py-3 border border-[var(--border-light)] text-[var(--text-muted)] rounded-lg hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)] transition text-[16px]"
        >
          {t('chatPanel.closeWindow')}
        </button>
      </div>

      {/* Hint */}
      <p className="mt-5 text-[13px] text-[var(--text-dim)] text-center">
        {t('chatPanel.welcomeBack')}
      </p>
    </div>
  );
}
