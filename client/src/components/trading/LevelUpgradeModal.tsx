import { useEffect, useState } from 'react';
import { Crown, Sparkles, Zap, Users, FileText, Star, X } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { LEVEL_CONFIG } from '../../types';
import type { UserLevel } from '../../types';
import { useTranslation } from '../../i18n';

const LEVEL_BENEFITS: Record<UserLevel, { icon: typeof Crown; titleKey: string; descriptionKey: string }[]> = {
  Bronze: [
    { icon: Zap, titleKey: 'levelUpgrade.benefits.aiSupport.title', descriptionKey: 'levelUpgrade.benefits.aiSupport.description' },
  ],
  Silver: [
    { icon: Sparkles, titleKey: 'levelUpgrade.benefits.aiResearcher.title', descriptionKey: 'levelUpgrade.benefits.aiResearcher.description' },
  ],
  Gold: [
    { icon: Crown, titleKey: 'levelUpgrade.benefits.exclusiveResearcher.title', descriptionKey: 'levelUpgrade.benefits.exclusiveResearcher.description' },
    { icon: FileText, titleKey: 'levelUpgrade.benefits.exclusiveReports.title', descriptionKey: 'levelUpgrade.benefits.exclusiveReports.description' },
    { icon: Users, titleKey: 'levelUpgrade.benefits.community.title', descriptionKey: 'levelUpgrade.benefits.community.description' },
  ],
  Diamond: [
    { icon: Crown, titleKey: 'levelUpgrade.benefits.vipResearcher.title', descriptionKey: 'levelUpgrade.benefits.vipResearcher.description' },
    { icon: Zap, titleKey: 'levelUpgrade.benefits.phoneConsult.title', descriptionKey: 'levelUpgrade.benefits.phoneConsult.description' },
    { icon: Star, titleKey: 'levelUpgrade.benefits.privateChannel.title', descriptionKey: 'levelUpgrade.benefits.privateChannel.description' },
  ],
};

export function LevelUpgradeModal() {
  const { t } = useTranslation();
  const { levelUpgrade, clearLevelUpgrade } = useUserStore();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (levelUpgrade) {
      setIsAnimating(true);
    }
  }, [levelUpgrade]);

  if (!levelUpgrade) return null;

  const { previousLevel, newLevel } = levelUpgrade;
  const newLevelConfig = LEVEL_CONFIG[newLevel];
  const benefits = LEVEL_BENEFITS[newLevel];

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      clearLevelUpgrade();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-center justify-center z-[200] transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-[400px] overflow-hidden rounded-2xl shadow-2xl transition-all duration-500 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(180deg, ${newLevelConfig.color}15 0%, var(--bg-panel) 30%)`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition z-10"
        >
          <X size={20} className="text-[var(--text-muted)]" />
        </button>

        {/* Sparkle Animation Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-8 animate-pulse">
            <Sparkles size={20} style={{ color: newLevelConfig.color }} className="opacity-60" />
          </div>
          <div className="absolute top-12 right-12 animate-pulse delay-300">
            <Sparkles size={16} style={{ color: newLevelConfig.color }} className="opacity-40" />
          </div>
          <div className="absolute top-20 left-16 animate-pulse delay-500">
            <Sparkles size={14} style={{ color: newLevelConfig.color }} className="opacity-50" />
          </div>
        </div>

        {/* Header */}
        <div className="pt-10 pb-5 text-center relative">
          {/* Crown Icon with Glow */}
          <div
            className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-5"
            style={{
              background: `linear-gradient(135deg, ${newLevelConfig.color}40, ${newLevelConfig.color}10)`,
              boxShadow: `0 0 40px ${newLevelConfig.color}40`,
            }}
          >
            <Crown size={48} style={{ color: newLevelConfig.color }} />
          </div>

          {/* Title */}
          <h2 className="text-[24px] font-bold text-[var(--text-main)] mb-2">
            {t('level.congratsUpgrade')}
          </h2>
          <div className="flex items-center justify-center gap-3 text-[18px]">
            <span className="text-[var(--text-muted)]">{previousLevel}</span>
            <span className="text-[var(--text-muted)]">→</span>
            <span className="font-bold" style={{ color: newLevelConfig.color }}>
              {newLevel}
            </span>
          </div>
        </div>

        {/* Benefits List */}
        <div className="px-6 pb-5">
          <div className="text-[14px] text-[var(--text-muted)] mb-4 text-center">
            {t('level.unlockedBenefits')}
          </div>
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-light)]"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${newLevelConfig.color}20` }}
                >
                  <benefit.icon size={22} style={{ color: newLevelConfig.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-bold text-[var(--text-main)]">
                    {t(benefit.titleKey)}
                  </div>
                  <div className="text-[14px] text-[var(--text-muted)]">
                    {t(benefit.descriptionKey)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Energy Bonus */}
        <div className="px-6 pb-5">
          <div className="flex items-center justify-center gap-2.5 py-3 rounded-xl bg-[var(--brand-yellow)]/10 border border-[var(--brand-yellow)]/30">
            <Zap size={18} className="text-[var(--brand-yellow)]" />
            <span className="text-[14px] text-[var(--brand-yellow)] font-medium">
              {t('level.energyBonus')}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-7">
          <button
            onClick={handleClose}
            className="w-full py-3.5 rounded-xl font-bold text-[16px] text-white transition hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${newLevelConfig.color}, ${newLevelConfig.color}cc)`,
              boxShadow: `0 4px 15px ${newLevelConfig.color}40`,
            }}
          >
            开始体验
          </button>
        </div>
      </div>
    </div>
  );
}
