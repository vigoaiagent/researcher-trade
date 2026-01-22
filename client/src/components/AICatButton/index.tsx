import { useEffect, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useUserStore } from '../../stores/userStore';
import { RoboCatIcon } from '../trading/RoboCatIcon';
import { LEVEL_CONFIG } from '../../types';
import type { UserLevel } from '../../types';
import { Bot, Users, Sparkles } from 'lucide-react';
import { useTranslation } from '../../i18n';

export function AICatButton() {
  const { openChat, isOpen } = useChatStore();
  const { user, levelUpgrade } = useUserStore();
  const { t } = useTranslation();
  const [showUpgradeEffect, setShowUpgradeEffect] = useState(false);

  // 检测升级事件，显示升级特效
  useEffect(() => {
    if (levelUpgrade) {
      setShowUpgradeEffect(true);
      // 5秒后关闭特效
      const timer = setTimeout(() => {
        setShowUpgradeEffect(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [levelUpgrade]);

  // Only visible for whitelisted users
  if (!user?.isWhitelist) {
    return null;
  }

  if (isOpen) {
    return null;
  }

  const userLevel = (user?.level || 'Bronze') as UserLevel;
  const hasResearcherAccess = user && userLevel ? LEVEL_CONFIG[userLevel]?.hasResearcherAccess : false;
  const levelConfig = user && userLevel ? LEVEL_CONFIG[userLevel] : null;

  return (
    <div
      data-ai-cat-button
      data-onboarding="chat"
      className="fixed bottom-[100px] right-4 md:bottom-24 md:right-8 z-[100] cursor-pointer group"
      onClick={openChat}
    >
      {/* Enhanced Tooltip - 仅桌面端显示 */}
      <div className="hidden md:block absolute -top-16 left-1/2 -translate-x-1/2 bg-[var(--bg-panel)] text-[var(--text-main)] text-[11px] px-3 py-2 rounded-lg border border-[var(--border-light)] opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg pointer-events-none">
        {hasResearcherAccess ? (
          <>
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-[var(--brand-green)]" />
              <span className="font-bold text-[var(--brand-green)]">{t('aiCat.tooltip.researcherAccessTitle')}</span>
            </div>
            <div className="text-[var(--text-muted)] text-[10px]">{t('aiCat.tooltip.researcherAccessDesc')}</div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <Bot size={12} className="text-[var(--brand-yellow)]" />
              <span className="font-bold text-[var(--brand-yellow)]">{t('aiCat.tooltip.aiServiceTitle')}</span>
            </div>
            <div className="text-[var(--text-muted)] text-[10px]">{t('aiCat.tooltip.aiServiceDesc')}</div>
            <div className="text-[9px] text-[var(--brand-yellow)] mt-1 border-t border-[var(--border-light)] pt-1">
              {t('aiCat.tooltip.reachGoldHint')}
            </div>
          </>
        )}
        {/* Arrow */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--bg-panel)] border-r border-b border-[var(--border-light)] rotate-45"></div>
      </div>

      {/* Robo-Cat Icon Container */}
      <div className="relative hover:scale-110 transition-transform duration-300">
        {/* Upgrade Effect - Sparkles */}
        {showUpgradeEffect && (
          <>
            <div className="absolute -inset-6 z-10 pointer-events-none">
              {/* Animated sparkles */}
              <Sparkles
                size={24}
                className="absolute top-0 left-1/2 -translate-x-1/2 text-[var(--brand-yellow)] animate-bounce"
              />
              <Sparkles
                size={20}
                className="absolute top-1/4 -left-2 text-[var(--brand-yellow)] animate-pulse"
                style={{ animationDelay: '0.2s' }}
              />
              <Sparkles
                size={20}
                className="absolute top-1/4 -right-2 text-[var(--brand-yellow)] animate-pulse"
                style={{ animationDelay: '0.4s' }}
              />
              <Sparkles
                size={18}
                className="absolute bottom-0 left-1/4 text-[var(--brand-green)] animate-bounce"
                style={{ animationDelay: '0.3s' }}
              />
              <Sparkles
                size={18}
                className="absolute bottom-0 right-1/4 text-[var(--brand-green)] animate-bounce"
                style={{ animationDelay: '0.5s' }}
              />
            </div>
            {/* Upgrade banner */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[var(--brand-yellow)] to-[var(--brand-green)] text-black text-[13px] font-bold px-4 py-2 rounded-full whitespace-nowrap animate-bounce shadow-lg z-20">
              {t('aiCat.upgradeBanner')}
            </div>
            {/* Enhanced glow */}
            <div
              className="absolute -inset-3 rounded-full blur-2xl opacity-60 animate-pulse"
              style={{ backgroundColor: levelConfig?.color || 'var(--brand-yellow)' }}
            ></div>
          </>
        )}

        {/* Glow Effect */}
        <div
          className={`absolute inset-0 rounded-full blur-xl transition-opacity ${showUpgradeEffect ? 'opacity-70' : 'opacity-30 group-hover:opacity-50'}`}
          style={{ backgroundColor: hasResearcherAccess ? 'var(--brand-green)' : 'var(--brand-yellow)' }}
        ></div>

        {/* Icon */}
        <div className={`relative ${showUpgradeEffect ? 'animate-bounce' : ''}`}>
          <RoboCatIcon size={72} level={userLevel} />
        </div>

        {/* Service Type Badge */}
        <span
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[var(--bg-app)] flex items-center justify-center"
          style={{ backgroundColor: hasResearcherAccess ? 'var(--brand-green)' : 'var(--brand-yellow)' }}
        >
          {hasResearcherAccess ? (
            <Users size={12} className="text-white" />
          ) : (
            <Bot size={12} className="text-black" />
          )}
        </span>

        {/* Level indicator ring */}
        {levelConfig && (
          <div
            className={`absolute -inset-1 rounded-full border-2 ${showUpgradeEffect ? 'opacity-100 animate-ping' : 'opacity-50 animate-pulse'}`}
            style={{ borderColor: levelConfig.color }}
          ></div>
        )}
      </div>
    </div>
  );
}
