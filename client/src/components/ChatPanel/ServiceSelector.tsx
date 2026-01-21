import { Lock, Sparkles, Zap, ChevronRight } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useUserStore } from '../../stores/userStore';
import { LEVEL_CONFIG } from '../../types';
import { useTranslation } from '../../i18n';

// AI 助手头像 - 使用 SVG 机器人猫
function AIAvatar() {
  return (
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD93D] to-[#FF9500] p-0.5 shadow-lg shadow-[rgba(255,217,61,0.3)]">
      <div className="w-full h-full rounded-2xl bg-[var(--bg-panel)] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="8" width="24" height="18" rx="4" fill="#FFD93D"/>
          <rect x="8" y="12" width="5" height="5" rx="1" fill="#0b0e11"/>
          <rect x="19" y="12" width="5" height="5" rx="1" fill="#0b0e11"/>
          <path d="M12 20h8" stroke="#0b0e11" strokeWidth="2" strokeLinecap="round"/>
          <rect x="14" y="4" width="4" height="4" rx="2" fill="#FFD93D"/>
        </svg>
      </div>
    </div>
  );
}

// 研究员头像 - 专业感
function ResearcherAvatar() {
  return (
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0ECB81] to-[#00A86B] p-0.5 shadow-lg shadow-[rgba(14,203,129,0.3)]">
      <div className="w-full h-full rounded-2xl bg-[var(--bg-panel)] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="12" r="6" fill="#0ECB81"/>
          <path d="M8 26c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#0ECB81" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="22" cy="8" r="3" fill="#FFD93D"/>
          <path d="M21 8l2 0" stroke="#0b0e11" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}

export function ServiceSelector() {
  const { setServiceMode, setPhase } = useChatStore();
  const { user } = useUserStore();
  const { t } = useTranslation();

  const userLevel = user?.level || 'Bronze';
  const hasResearcherAccess = user ? LEVEL_CONFIG[userLevel]?.hasResearcherAccess : false;

  const handleSelectAI = () => {
    setServiceMode('ai');
  };

  const handleSelectResearcher = () => {
    if (!hasResearcherAccess) return;
    setServiceMode('researcher');
    setPhase('asking');
  };

  return (
    <div className="flex flex-col h-full p-4 bg-[var(--bg-panel)]">
      {/* Welcome Message */}
      <div className="text-center mb-5 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface)] mb-3">
          <Sparkles size={12} className="text-[var(--brand-yellow)]" />
          <span className="text-[10px] text-[var(--text-muted)]">{t('chatPanel.onlineService')}</span>
        </div>
        <h3 className="text-[15px] font-bold text-[var(--text-main)] mb-1">
          {t('chatPanel.howCanIHelp')}
        </h3>
        <p className="text-[11px] text-[var(--text-muted)]">
          {t('chatPanel.selectService')}
        </p>
      </div>

      {/* Service Options */}
      <div className="flex-1 flex flex-col gap-3">
        {/* AI Customer Service */}
        <button
          onClick={handleSelectAI}
          className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-transparent hover:border-[var(--brand-yellow)] transition-all group text-left active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <AIAvatar />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[14px] font-bold text-[var(--text-main)] group-hover:text-[var(--brand-yellow)] transition-colors">
                  {t('chatPanel.aiResearcherLabel')}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-[var(--brand-green)] bg-opacity-20 text-[var(--brand-green)] rounded-full font-medium">
                  {t('chatPanel.freeLabel')}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                {t('chatPanel.aiResearcherDesc')}
              </p>
            </div>
            <ChevronRight size={18} className="text-[var(--text-dim)] group-hover:text-[var(--brand-yellow)] transition-colors" />
          </div>
        </button>

        {/* Researcher Service */}
        <button
          onClick={handleSelectResearcher}
          disabled={!hasResearcherAccess}
          className={`p-4 rounded-2xl border transition-all group text-left relative overflow-hidden active:scale-[0.98] ${
            hasResearcherAccess
              ? 'bg-[var(--bg-surface)] border-transparent hover:border-[var(--brand-green)]'
              : 'bg-[var(--bg-app)] border-[var(--border-light)]'
          }`}
        >
          {/* Lock Overlay */}
          {!hasResearcherAccess && (
            <div className="absolute inset-0 bg-[rgba(11,14,17,0.7)] backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--brand-yellow)] bg-opacity-20 flex items-center justify-center mx-auto mb-2">
                  <Lock size={18} className="text-[var(--brand-yellow)]" />
                </div>
                <span className="text-[11px] text-[var(--text-main)] font-medium block">
                  {t('chatPanel.upgradeToGoldUnlock')}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {t('chatPanel.tradeToUpgrade')}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <ResearcherAvatar />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[14px] font-bold transition-colors ${
                  hasResearcherAccess
                    ? 'text-[var(--text-main)] group-hover:text-[var(--brand-green)]'
                    : 'text-[var(--text-muted)]'
                }`}>
                  {t('chatPanel.exclusiveResearcherLabel')}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-[var(--brand-green)] text-white rounded-full font-medium">
                  {t('chatPanel.oneOnOne')}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                {t('chatPanel.exclusiveResearcherDesc')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-[10px] text-[var(--brand-yellow)]">
                <Zap size={10} />
                <span>10</span>
              </div>
              <ChevronRight size={18} className="text-[var(--text-dim)] group-hover:text-[var(--brand-green)] transition-colors" />
            </div>
          </div>
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-[var(--border-light)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasResearcherAccess ? 'bg-[var(--brand-green)]' : 'bg-[var(--text-dim)]'}`} />
            <span className="text-[10px] text-[var(--text-muted)]">
              {t('chatPanel.currentLevelLabel')} <span className={`font-medium ${hasResearcherAccess ? 'text-[var(--brand-green)]' : 'text-[var(--brand-yellow)]'}`}>{userLevel}</span>
            </span>
          </div>
          {user && (
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <Zap size={10} className="text-[var(--brand-yellow)]" />
              <span>{user.energyAvailable} {t('chatPanel.energyLabel')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
