import { useState, useRef, useEffect } from 'react';
import { useUserStore, getNextLevelInfo } from '../../stores/userStore';
import { useTranslation } from '../../i18n';
import { Settings, Globe, Layout, LogOut, ChevronDown, Zap, Shield, Rocket, Plus, Clock, TrendingUp, TrendingDown, Lock, Unlock, Check, Ticket } from 'lucide-react';
import { LEVEL_CONFIG, getSoSoBoost, getSSIShieldAmount, getSSITier, SOSO_BOOST_CONFIG } from '../../types';
import type { UserLevel, EnergyTransaction } from '../../types';
import { hasTrialVoucher } from '../NewUserWelcomeModal';

// SoDEX Logo Component
const SoDEXLogo = ({ className = '' }: { className?: string }) => (
  <img
    src="https://cdn.jsdelivr.net/gh/sevclub/publicimage@main/SoDEX(1).svg"
    alt="SoDEX"
    className={className}
  />
);

// Level Icons
const levelIcons: Record<UserLevel, string> = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Diamond: '👑',
};

// Format number
const fmt = (num: number) =>
  num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDecimal = (num: number) =>
  num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Format timestamp - uses translation function passed as parameter
const formatTimeWithT = (timestamp: number, t: (key: string) => string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('time.justNow');
  if (diffMins < 60) return `${diffMins} ${t('time.minutesAgo')}`;
  if (diffHours < 24) return `${diffHours} ${t('time.hoursAgo')}`;
  if (diffDays < 7) return `${diffDays} ${t('time.daysAgo')}`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// Transaction type config
const txTypeConfig: Record<EnergyTransaction['type'], { icon: typeof TrendingUp; color: string; prefix: string }> = {
  minted: { icon: TrendingUp, color: 'var(--brand-green)', prefix: '+' },
  spent: { icon: TrendingDown, color: 'var(--brand-red)', prefix: '-' },
  expired: { icon: Clock, color: 'var(--text-dim)', prefix: '-' },
  locked: { icon: Lock, color: 'var(--brand-yellow)', prefix: '-' },
  unlocked: { icon: Unlock, color: 'var(--brand-green)', prefix: '+' },
};

type DropdownTab = 'overview' | 'history';

interface TopNavProps {
  onOpenTrialVoucher?: () => void;
}

export function TopNav({ onOpenTrialVoucher }: TopNavProps) {
  const { user, logout } = useUserStore();
  const { language, setLanguage, t } = useTranslation();
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [dropdownTab, setDropdownTab] = useState<DropdownTab>('overview');
  const [showBoostGuide, setShowBoostGuide] = useState(false);
  const [showShieldGuide, setShowShieldGuide] = useState(false);
  const [showEnergyGuide, setShowEnergyGuide] = useState(false);
  const [showBoostTooltip, setShowBoostTooltip] = useState(false);
  const [showShieldTooltip, setShowShieldTooltip] = useState(false);

  const levelDropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭等级下拉菜单
  useEffect(() => {
    if (!showLevelDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target as Node)) {
        setShowLevelDropdown(false);
        setShowBoostGuide(false);
        setShowShieldGuide(false);
      }
    };

    // 延迟添加事件监听器，避免打开时立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLevelDropdown]);

  return (
    <header className="h-[50px] bg-[var(--bg-panel)] flex items-center justify-between px-4 z-50 shrink-0 border-b border-[#000]">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <SoDEXLogo className="h-6" />
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-[14px] font-medium text-[var(--text-muted)]">
          <div className="flex items-center gap-1 hover:text-[var(--text-main)] cursor-pointer">
            <Layout size={16} />
          </div>
          <span className="text-[var(--text-main)] cursor-pointer">Markets</span>
          <span className="hover:text-[var(--text-main)] cursor-pointer transition-colors">Trade</span>
          <span className="hover:text-[var(--text-main)] cursor-pointer transition-colors">Derivatives</span>
          <span className="hover:text-[var(--text-main)] cursor-pointer transition-colors">Copy Trading</span>
          <span className="hover:text-[var(--text-main)] cursor-pointer transition-colors">Earn</span>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* Level Badge with Dropdown */}
            {(() => {
              const userLevel = user.level || 'Bronze';
              const config = LEVEL_CONFIG[userLevel];
              const { nextLevel, progress } = getNextLevelInfo(userLevel, user.fees30d ?? 0);
              const sosoBoost = getSoSoBoost(user.sosoHolding ?? 0);
              const ssiTier = getSSITier(user.ssiStaked ?? 0);
              const shieldAmount = getSSIShieldAmount(user.ssiStaked ?? 0);

              return (
                <div className="relative" ref={levelDropdownRef} data-onboarding="level">
                  {/* Desktop Level Badge */}
                  <div
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-surface)] rounded cursor-pointer hover:bg-[var(--bg-highlight)] transition-colors"
                    onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                  >
                    <span className="text-[14px]">{levelIcons[userLevel]}</span>
                    <span className="text-[12px] font-bold" style={{ color: config.color }}>
                      {userLevel}
                    </span>
                    {/* Mini Progress Bar */}
                    <div className="w-16 h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: config.color }}
                      />
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-[var(--text-muted)] transition-transform ${showLevelDropdown ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {/* Mobile Level Badge */}
                  <div
                    className="flex md:hidden items-center gap-1.5 px-2 py-1 bg-[var(--bg-surface)] rounded cursor-pointer"
                    onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                  >
                    <span className="text-[12px]">{levelIcons[userLevel]}</span>
                    <span className="text-[11px] font-bold" style={{ color: config.color }}>
                      {userLevel}
                    </span>
                    <ChevronDown
                      size={12}
                      className={`text-[var(--text-muted)] transition-transform ${showLevelDropdown ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* Dropdown Panel - 移动端全屏，桌面端下拉 */}
                  {showLevelDropdown && (
                    <>
                      {/* Mobile Backdrop */}
                      <div className="fixed inset-0 bg-black/50 z-[199] md:hidden" onClick={() => setShowLevelDropdown(false)} />
                      <div className="fixed inset-0 md:absolute md:inset-auto md:top-full md:right-0 md:mt-2 w-full h-full md:w-[480px] md:h-auto md:max-h-[85vh] bg-[var(--bg-panel)] md:border md:border-[var(--border-light)] md:rounded-xl shadow-xl z-[200] flex flex-col overflow-hidden">
                      {/* Mobile Header */}
                      <div className="flex md:hidden items-center justify-between p-4 border-b border-[var(--border-light)]">
                        <span className="text-[16px] font-bold text-[var(--text-main)]">{t('levelDropdown.myLevel')}</span>
                        <button
                          onClick={() => setShowLevelDropdown(false)}
                          className="p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors"
                        >
                          <ChevronDown size={20} className="text-[var(--text-muted)] rotate-180" />
                        </button>
                      </div>

                      {/* Scrollable Content */}
                      <div className="flex-1 overflow-y-auto">
                      {/* Header - 等级 + 权益 + 能量 */}
                      <div className="p-4 md:p-5 border-b border-[var(--border-light)]">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 mb-4">
                          <div className="flex items-center gap-3 md:gap-4">
                            <span className="text-[28px] md:text-[32px]">{levelIcons[userLevel]}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[18px] md:text-[22px]" style={{ color: config.color }}>
                                  {userLevel}
                                </span>
                                <span className="text-[12px] md:text-[14px] px-2 md:px-2.5 py-0.5 md:py-1 bg-[var(--bg-surface)] text-[var(--text-muted)] rounded">
                                  Tier {config.tier}
                                </span>
                              </div>
                              {/* 权益标签 */}
                              <div className="flex flex-wrap gap-1 mt-1.5 md:mt-2">
                                {config.benefits.map((benefit: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-[13px] md:text-[15px] text-[var(--text-muted)]"
                                  >
                                    {t(benefit)}{i < config.benefits.length - 1 ? ' · ' : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div
                            className="text-left md:text-right relative cursor-pointer w-full md:w-auto"
                            onMouseEnter={() => setShowEnergyGuide(true)}
                            onMouseLeave={() => setShowEnergyGuide(false)}
                          >
                            <div className="text-[14px] md:text-[16px] text-[var(--text-muted)] hover:text-[var(--brand-green)] transition">
                              {t('levelDropdown.availableEnergy')} <span className="text-[12px]">ⓘ</span>
                            </div>
                            <div className="text-[22px] md:text-[26px] font-bold text-[var(--brand-green)]">
                              ⚡ {fmtDecimal(user.energyAvailable ?? 0)}
                            </div>

                            {/* Energy Guide Tooltip */}
                            {showEnergyGuide && (
                              <div className="absolute right-0 top-full mt-2 w-[320px] p-4 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl shadow-xl z-[300] text-left">
                                <div className="flex items-center gap-2 mb-3">
                                  <Zap size={20} className="text-[var(--brand-green)]" />
                                  <span className="text-[16px] font-bold text-[var(--text-main)]">{t('topNav.energyTooltip.title')}</span>
                                </div>
                                <div className="space-y-3 text-[14px] text-[var(--text-muted)]">
                                  <p>
                                    {t('topNav.energyTooltip.description')}
                                  </p>
                                  <div>
                                    <div className="font-medium text-[var(--text-main)] mb-1">{t('topNav.energyTooltip.howToGet')}</div>
                                    <ul className="space-y-1 ml-2">
                                      <li className="flex items-start gap-2">
                                        <span className="text-[var(--brand-green)]">•</span>
                                        <span>{t('topNav.energyTooltip.method1')}</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <span className="text-[var(--brand-green)]">•</span>
                                        <span>{t('topNav.energyTooltip.method2')}</span>
                                      </li>
                                    </ul>
                                  </div>
                                  <div>
                                    <p>
                                      {t('topNav.energyTooltip.decay')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Boost/Shield 标签 - 始终显示 */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0 mb-2">
                          <span className="text-[14px] md:text-[16px] text-[var(--text-muted)]">
                            {nextLevel ? t('levelDropdown.upgradeProgress') : t('levelDropdown.maxLevel')}
                          </span>
                          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                            {/* Boost Tag */}
                            <div
                              className={`relative flex items-center gap-1.5 px-3 py-1 rounded cursor-pointer transition-colors ${
                                sosoBoost > 0 ? 'bg-[var(--brand-yellow)]/20' : 'bg-[var(--bg-surface)]'
                              }`}
                              onClick={(e) => { e.stopPropagation(); setShowBoostGuide(!showBoostGuide); setShowShieldGuide(false); }}
                              onMouseEnter={() => setShowBoostTooltip(true)}
                              onMouseLeave={() => setShowBoostTooltip(false)}
                            >
                              <Rocket size={16} className={sosoBoost > 0 ? 'text-[var(--brand-yellow)]' : 'text-[var(--text-dim)]'} />
                              <span className={`text-[14px] font-medium ${sosoBoost > 0 ? 'text-[var(--brand-yellow)]' : 'text-[var(--text-dim)]'}`}>
                                {sosoBoost > 0 ? `+${(sosoBoost * 100).toFixed(0)}%` : 'Boost'}
                              </span>
                              {/* Boost Hover Tooltip - 桌面端显示 */}
                              {showBoostTooltip && (
                                <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] p-4 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl shadow-xl z-[300] text-left">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Rocket size={18} className="text-[var(--brand-yellow)]" />
                                    <span className="text-[14px] font-bold text-[var(--text-main)]">{t('boost.title')}</span>
                                  </div>
                                  <div className="space-y-2 text-[13px] text-[var(--text-muted)]">
                                    <p>{t('boost.description')}</p>
                                    <p>• {t('boost.minHold')}: {fmt(SOSO_BOOST_CONFIG.threshold)} SoSo</p>
                                    <p>• {t('boost.maxHold')}: {fmt(SOSO_BOOST_CONFIG.maxHolding)} SoSo</p>
                                    <p className="text-[12px] text-[var(--text-dim)] mt-2">{t('boost.example')}</p>
                                  </div>
                                  <div className="text-[12px] text-[var(--brand-yellow)] mt-2">{t('boost.clickDetails')}</div>
                                </div>
                              )}
                            </div>
                            {/* Shield Tag */}
                            <div
                              className={`relative flex items-center gap-1.5 px-3 py-1 rounded cursor-pointer transition-colors ${
                                shieldAmount > 0 ? 'bg-[var(--brand-green)]/20' : 'bg-[var(--bg-surface)]'
                              }`}
                              onClick={(e) => { e.stopPropagation(); setShowShieldGuide(!showShieldGuide); setShowBoostGuide(false); }}
                              onMouseEnter={() => setShowShieldTooltip(true)}
                              onMouseLeave={() => setShowShieldTooltip(false)}
                            >
                              <Shield size={16} className={shieldAmount > 0 ? 'text-[var(--brand-green)]' : 'text-[var(--text-dim)]'} />
                              <span className={`text-[14px] font-medium ${shieldAmount > 0 ? 'text-[var(--brand-green)]' : 'text-[var(--text-dim)]'}`}>
                                {shieldAmount > 0 ? shieldAmount.toFixed(0) : 'Shield'}
                              </span>
                              {/* Shield Hover Tooltip - 桌面端显示 */}
                              {showShieldTooltip && (
                                <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] p-4 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl shadow-xl z-[300] text-left">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Shield size={18} className="text-[var(--brand-green)]" />
                                    <span className="text-[14px] font-bold text-[var(--text-main)]">{t('shield.title')}</span>
                                  </div>
                                  <div className="space-y-2 text-[13px] text-[var(--text-muted)]">
                                    <p>{t('shield.description')}</p>
                                    <p className="font-medium text-[var(--text-main)]">{t('shield.shieldAmount')}:</p>
                                    <p>• {t('shield.normalStake')}</p>
                                    <p>• {t('shield.coreSSI')}</p>
                                    <p>• {t('shield.vipSSI')}</p>
                                    <p className="text-[12px] text-[var(--text-dim)] mt-2">{t('shield.coreUnlock')}</p>
                                  </div>
                                  <div className="text-[12px] text-[var(--brand-green)] mt-2">{t('shield.clickDetails')}</div>
                                </div>
                              )}
                            </div>
                            {nextLevel && (
                              <span className="text-[14px] md:text-[16px] text-[var(--text-muted)]">{progress.toFixed(0)}% → {nextLevel}</span>
                            )}
                          </div>
                        </div>

                        {/* 升级进度条 - 只有未达到最高等级时显示 */}
                        {nextLevel && (
                          <>
                            <div className="h-3 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${progress}%`, backgroundColor: config.color }}
                              />
                            </div>
                            {/* 显示升级目标 */}
                            <div className="flex items-center justify-end mt-2 text-[12px]">
                              <span className="text-[var(--brand-yellow)]">
                                {t('levelDropdown.upgradeTo').replace('{level}', nextLevel).replace('{amount}', fmt(Math.ceil((LEVEL_CONFIG[nextLevel].minFees - (user.fees30d ?? 0)) / 0.0007)))}
                              </span>
                            </div>
                          </>
                        )}

                        {/* Boost Guide Popup */}
                        {showBoostGuide && (
                          <div className="mt-4 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--brand-yellow)]/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Rocket size={20} className="text-[var(--brand-yellow)]" />
                                <span className="text-[18px] font-bold text-[var(--text-main)]">{t('boost.energyBoost')}</span>
                              </div>
                              <button
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--brand-yellow)] hover:opacity-80 transition"
                              >
                                <Plus size={16} className="text-black" />
                                <span className="text-[14px] font-bold text-black">{t('boost.buySoSo')}</span>
                              </button>
                            </div>
                            <div className="text-[16px] text-[var(--text-muted)]">
                              {t('boost.holdSoSo')}
                            </div>
                            <div className="text-[14px] text-[var(--text-dim)] mt-2">
                              {t('boost.currentHold')}: {fmt(user.sosoHolding ?? 0)} SoSo
                              {sosoBoost === 0 && ` ${t('boost.needToActivate').replace('{amount}', fmt(SOSO_BOOST_CONFIG.threshold))}`}
                            </div>
                          </div>
                        )}

                        {/* Shield Guide Popup */}
                        {showShieldGuide && (
                          <div className="mt-4 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--brand-green)]/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Shield size={20} className="text-[var(--brand-green)]" />
                                <span className="text-[18px] font-bold text-[var(--text-main)]">{t('shield.energyShield')}</span>
                              </div>
                              <button
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--brand-green)] hover:opacity-80 transition"
                              >
                                <Plus size={16} className="text-black" />
                                <span className="text-[14px] font-bold text-black">{t('shield.stakeSSIBtn')}</span>
                              </button>
                            </div>
                            <div className="text-[16px] text-[var(--text-muted)]">
                              {t('shield.stakeSSI').replace('{amount}', shieldAmount > 0 ? shieldAmount.toFixed(0) : '?')}
                            </div>
                            <div className="text-[14px] text-[var(--text-dim)] mt-2">
                              {t('shield.currentStake')}: ${fmt(user.ssiStaked ?? 0)} SSI
                              {ssiTier !== 'none' && (
                                <span className="ml-1 text-[var(--brand-green)]">
                                  ({ssiTier === 'vip' ? 'VIP' : ssiTier === 'core' ? 'Core' : t('shield.normal')})
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tab Switcher */}
                      <div className="flex border-b border-[var(--border-light)] sticky top-0 bg-[var(--bg-panel)] z-10">
                        <button
                          className={`flex-1 py-2.5 md:py-3 text-[15px] md:text-[18px] font-medium transition-colors ${
                            dropdownTab === 'overview'
                              ? 'text-[var(--text-main)] border-b-2 border-[var(--brand-yellow)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                          onClick={() => setDropdownTab('overview')}
                        >
                          {t('levelDropdown.overview')}
                        </button>
                        <button
                          className={`flex-1 py-2.5 md:py-3 text-[15px] md:text-[18px] font-medium transition-colors ${
                            dropdownTab === 'history'
                              ? 'text-[var(--text-main)] border-b-2 border-[var(--brand-yellow)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                          onClick={() => setDropdownTab('history')}
                        >
                          {t('levelDropdown.history')}
                        </button>
                      </div>

                      {/* Tab Content */}
                      {dropdownTab === 'overview' ? (
                        <>
                          {/* Level Milestones - Simplified */}
                          <div className="p-4 md:p-5 border-b border-[var(--border-light)]">
                            <div className="text-[14px] md:text-[16px] text-[var(--text-muted)] mb-3">{t('levelDropdown.levelBenefits')}</div>
                            <div className="space-y-2 md:space-y-3">
                              {(Object.keys(LEVEL_CONFIG) as UserLevel[]).map((level) => {
                                const levelConfig = LEVEL_CONFIG[level];
                                const isCurrentLevel = level === userLevel;
                                const isUnlocked = (user.fees30d ?? 0) >= levelConfig.minFees;

                                return (
                                  <div
                                    key={level}
                                    className={`flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg ${
                                      isCurrentLevel ? 'bg-[var(--bg-surface)]' : ''
                                    }`}
                                  >
                                    <div
                                      className={`w-3 h-3 md:w-4 md:h-4 rounded-full shrink-0 ${
                                        isCurrentLevel
                                          ? 'bg-[var(--brand-yellow)]'
                                          : isUnlocked
                                            ? 'bg-[var(--brand-green)]'
                                            : 'bg-[var(--text-dim)]'
                                      }`}
                                    />
                                    <span className="text-[16px] md:text-[20px]">{levelIcons[level]}</span>
                                    <span
                                      className="text-[14px] md:text-[18px] font-bold min-w-[60px] md:min-w-[90px]"
                                      style={{ color: isCurrentLevel || isUnlocked ? levelConfig.color : 'var(--text-dim)' }}
                                    >
                                      {level}
                                    </span>
                                    <span className={`flex-1 text-[12px] md:text-[15px] ${
                                      isCurrentLevel || isUnlocked ? 'text-[var(--text-muted)]' : 'text-[var(--text-dim)]'
                                    }`}>
                                      {levelConfig.hasResearcherAccess && '★ '}
                                      {levelConfig.benefits.map((benefit) => t(benefit)).join(' · ')}
                                    </span>
                                    {isCurrentLevel && (
                                      <span className="text-[11px] md:text-[13px] px-2 md:px-3 py-1 md:py-1.5 bg-[var(--brand-yellow)] text-black rounded font-bold shrink-0">
                                        {t('levelDropdown.current')}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </>
                      ) : (
                        /* History Tab */
                        <div className="p-4 md:p-5">
                          {(user.energyHistory?.length ?? 0) === 0 ? (
                            <div className="text-center py-8 md:py-10 text-[var(--text-dim)]">
                              <Clock size={40} className="mx-auto mb-3 opacity-50 md:w-12 md:h-12" />
                              <div className="text-[16px] md:text-[18px]">{t('levelDropdown.noHistory')}</div>
                              <div className="text-[13px] md:text-[15px] mt-2">{t('levelDropdown.tradeToSee')}</div>
                            </div>
                          ) : (
                            <div className="space-y-2 md:space-y-3">
                              {[...(user.energyHistory ?? [])]
                                .sort((a, b) => b.timestamp - a.timestamp)
                                .map((tx) => {
                                  const typeInfo = txTypeConfig[tx.type];
                                  const Icon = typeInfo.icon;

                                  return (
                                    <div
                                      key={tx.id}
                                      className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[var(--bg-surface)] rounded-lg"
                                    >
                                      <div
                                        className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: `${typeInfo.color}20` }}
                                      >
                                        <Icon size={20} className="md:w-6 md:h-6" style={{ color: typeInfo.color }} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[14px] md:text-[17px] text-[var(--text-main)] truncate">
                                          {tx.description}
                                        </div>
                                        <div className="text-[12px] md:text-[14px] text-[var(--text-dim)] mt-0.5 md:mt-1">
                                          {formatTimeWithT(tx.timestamp, t)} · {t('levelDropdown.balance')} {fmtDecimal(tx.balance)}
                                        </div>
                                      </div>
                                      <div
                                        className="text-[16px] md:text-[20px] font-bold whitespace-nowrap"
                                        style={{ color: typeInfo.color }}
                                      >
                                        {typeInfo.prefix}{fmtDecimal(tx.amount)}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      )}
                      </div>{/* End Scrollable Content */}
                    </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Trial Voucher Button - 始终显示，不同状态不同样式 */}
            {onOpenTrialVoucher && (
              <button
                onClick={onOpenTrialVoucher}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:opacity-90 transition-opacity ${
                  hasTrialVoucher()
                    ? 'bg-gradient-to-r from-[var(--brand-yellow)] to-[#FF9500] animate-pulse'
                    : 'bg-[var(--bg-surface)]'
                }`}
                title={hasTrialVoucher() ? t('trialVoucher.freeTrialBtn') : t('trialVoucher.usedBtn')}
              >
                <Ticket size={14} className={hasTrialVoucher() ? 'text-black' : 'text-[var(--text-dim)]'} />
                <span className={`text-[11px] font-bold hidden sm:inline ${hasTrialVoucher() ? 'text-black' : 'text-[var(--text-dim)]'}`}>
                  {hasTrialVoucher() ? t('trialVoucher.freeTrialBtn') : t('trialVoucher.usedBtn')}
                </span>
              </button>
            )}

            {/* Energy Display */}
            <div className="hidden md:flex items-center gap-2 text-[13px]" data-onboarding="energy">
              <Zap size={14} className="text-[var(--brand-yellow)]" />
              <span className="text-[var(--brand-green)] font-bold">{fmtDecimal(user.energyAvailable ?? 0)}</span>
            </div>

            {/* Wallet Address */}
            <div className="hidden md:flex items-center gap-2 text-[13px] bg-[var(--bg-surface)] px-3 py-1 rounded">
              <div className="w-2 h-2 bg-[var(--brand-green)] rounded-full"></div>
              <span className="text-[var(--text-main)]">
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 hover:bg-[var(--bg-surface)] rounded transition-colors"
              title="Logout"
            >
              <LogOut size={18} className="text-[var(--text-muted)] hover:text-[var(--text-main)]" />
            </button>
          </>
        ) : (
          <div className="hidden md:flex items-center gap-4 text-[13px] text-[var(--text-main)]">
            <span className="cursor-pointer hover:text-[var(--brand-yellow)]">Log In</span>
            <button className="bg-[var(--brand-yellow)] text-black px-4 py-1.5 rounded-[4px] font-bold hover:opacity-90 transition-opacity">
              Register
            </button>
          </div>
        )}

        <div className="w-[1px] h-4 bg-[var(--border-light)] hidden md:block"></div>
        <Settings size={18} className="text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)]" />

        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center gap-1.5 p-1.5 rounded hover:bg-[var(--bg-surface)] transition-colors"
          >
            <Globe size={18} className="text-[var(--text-muted)] hover:text-[var(--text-main)]" />
            <span className="text-[12px] text-[var(--text-muted)] font-medium">
              {language === 'zh' ? t('language.zhShort') : t('language.enShort')}
            </span>
          </button>

          {showLanguageDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-[199]"
                onClick={() => setShowLanguageDropdown(false)}
              />
              {/* Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-[140px] bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-lg shadow-xl z-[200] overflow-hidden">
                <button
                  onClick={() => {
                    setLanguage('zh');
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-[14px] hover:bg-[var(--bg-surface)] transition ${
                    language === 'zh' ? 'text-[var(--brand-yellow)]' : 'text-[var(--text-main)]'
                  }`}
                >
                  <span>{t('language.zhFull')}</span>
                  {language === 'zh' && <Check size={14} />}
                </button>
                <button
                  onClick={() => {
                    setLanguage('en');
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-[14px] hover:bg-[var(--bg-surface)] transition ${
                    language === 'en' ? 'text-[var(--brand-yellow)]' : 'text-[var(--text-main)]'
                  }`}
                >
                  <span>{t('language.enFull')}</span>
                  {language === 'en' && <Check size={14} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
