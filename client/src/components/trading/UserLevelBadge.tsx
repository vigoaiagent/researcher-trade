import { useState } from 'react';
import { ChevronUp, ChevronDown, Zap, TrendingUp, Award, AlertTriangle, Rocket, Shield } from 'lucide-react';
import { useUserStore, getNextLevelInfo } from '../../stores/userStore';
import { LEVEL_CONFIG, FEE_RATES, getSoSoBoost, getSSIShieldAmount, getSSITier, SOSO_BOOST_CONFIG } from '../../types';
import type { UserLevel, SSITier } from '../../types';
import { useTranslation } from '../../i18n';

const fmt = (num: number) =>
  num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDecimal = (num: number) =>
  num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const LevelIcon = ({ level }: { level: UserLevel }) => {
  const icons: Record<UserLevel, string> = {
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Diamond: '👑',
  };
  return <span className="text-[16px]">{icons[level]}</span>;
};

const SSI_TIER_COLORS: Record<SSITier, string> = {
  none: 'var(--text-muted)',
  normal: '#c0c0c0',
  core: '#ffd700',
  vip: '#b9f2ff',
};

// Tooltip 组件
function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-lg p-3 shadow-xl min-w-[200px] max-w-[280px]">
            {content}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-[var(--bg-panel)] border-r border-b border-[var(--border-light)] transform rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}

// Boost & Shield 状态组件
function BoostShieldStatus({
  sosoHolding,
  ssiStaked,
  onUpdateSoSo,
  onUpdateSSI,
}: {
  sosoHolding: number;
  ssiStaked: number;
  onUpdateSoSo: (amount: number) => void;
  onUpdateSSI: (amount: number) => void;
}) {
  const { t } = useTranslation();
  const [showSimulator, setShowSimulator] = useState(false);
  const [tempSoSo, setTempSoSo] = useState(sosoHolding.toString());
  const [tempSSI, setTempSSI] = useState(ssiStaked.toString());

  const boostPercent = getSoSoBoost(sosoHolding) * 100;
  const shieldAmount = getSSIShieldAmount(ssiStaked);
  const ssiTier = getSSITier(ssiStaked);
  const tierColor = SSI_TIER_COLORS[ssiTier];

  const handleApply = () => {
    const sosoValue = parseFloat(tempSoSo) || 0;
    const ssiValue = parseFloat(tempSSI) || 0;
    onUpdateSoSo(sosoValue);
    onUpdateSSI(ssiValue);
    setShowSimulator(false);
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-lg p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-[var(--text-muted)]">{t('userLevelBadge.tokenBoost')}</div>
        <button
          onClick={() => setShowSimulator(!showSimulator)}
          className="text-[9px] text-[var(--brand-yellow)] hover:underline"
        >
          {showSimulator ? t('userLevelBadge.collapse') : t('userLevelBadge.simulatorLabel')}
        </button>
      </div>

      {/* Boost & Shield 状态显示 */}
      <div className="grid grid-cols-2 gap-2">
        {/* SoSo Boost */}
        <Tooltip
          content={
            <div className="text-[11px]">
              <div className="font-bold text-[#ff6b35] mb-2">{t('userLevelBadge.boost.title')}</div>
              <div className="text-[var(--text-muted)] space-y-1.5">
                <p>{t('userLevelBadge.boost.description', { maxBoost: '+10%' })}</p>
                <p>{t('userLevelBadge.boost.minHolding', { amount: fmt(SOSO_BOOST_CONFIG.threshold) })}</p>
                <p>{t('userLevelBadge.boost.maxHolding', { amount: fmt(SOSO_BOOST_CONFIG.maxHolding) })}</p>
                <p className="text-[var(--text-dim)] mt-2">{t('userLevelBadge.boost.example')}</p>
              </div>
            </div>
          }
        >
          <div className="bg-[var(--bg-app)] rounded p-2 cursor-help hover:bg-[var(--bg-surface)] transition-colors">
            <div className="flex items-center gap-1 mb-1">
              <Rocket size={12} className="text-[#ff6b35]" />
              <span className="text-[10px] font-medium text-[var(--text-main)]">Boost</span>
            </div>
            <div className="text-[13px] font-bold" style={{ color: boostPercent > 0 ? '#ff6b35' : 'var(--text-dim)' }}>
              +{boostPercent.toFixed(1)}%
            </div>
            <div className="text-[9px] text-[var(--text-muted)]">
              SoSo: {fmt(sosoHolding)}
            </div>
            {boostPercent === 0 && sosoHolding < SOSO_BOOST_CONFIG.threshold && (
              <div className="text-[8px] text-[var(--text-dim)] mt-1">
                {t('userLevelBadge.boost.unlockHint', { amount: fmt(SOSO_BOOST_CONFIG.threshold) })}
              </div>
            )}
            {boostPercent > 0 && boostPercent < SOSO_BOOST_CONFIG.maxBoost * 100 && (
              <div className="mt-1 h-1 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff6b35] rounded-full"
                  style={{ width: `${(boostPercent / (SOSO_BOOST_CONFIG.maxBoost * 100)) * 100}%` }}
                />
              </div>
            )}
          </div>
        </Tooltip>

        {/* SSI Shield */}
        <Tooltip
          content={
            <div className="text-[11px]">
              <div className="font-bold text-[#4dabf7] mb-2">{t('userLevelBadge.shield.title')}</div>
              <div className="text-[var(--text-muted)] space-y-1.5">
                <p>{t('userLevelBadge.shield.description')}</p>
                <p className="font-medium mt-2">{t('userLevelBadge.shield.floorTitle')}</p>
                <p>{t('userLevelBadge.shield.floor.normal')}</p>
                <p>{t('userLevelBadge.shield.floor.core')}</p>
                <p>{t('userLevelBadge.shield.floor.vip')}</p>
                <p className="text-[var(--text-dim)] mt-2">{t('userLevelBadge.shield.phoneAccess')}</p>
              </div>
            </div>
          }
        >
          <div className="bg-[var(--bg-app)] rounded p-2 cursor-help hover:bg-[var(--bg-surface)] transition-colors">
            <div className="flex items-center gap-1 mb-1">
              <Shield size={12} className="text-[#4dabf7]" />
              <span className="text-[10px] font-medium text-[var(--text-main)]">Shield</span>
              {ssiTier !== 'none' && (
                <span
                  className="text-[8px] px-1 rounded"
                  style={{ backgroundColor: `${tierColor}20`, color: tierColor }}
                >
                  {t(`userLevelBadge.ssiTier.${ssiTier}`)}
                </span>
              )}
            </div>
            <div className="text-[13px] font-bold" style={{ color: shieldAmount > 0 ? '#4dabf7' : 'var(--text-dim)' }}>
              {shieldAmount > 0 ? fmtDecimal(shieldAmount) : '0'}
            </div>
            <div className="text-[9px] text-[var(--text-muted)]">
              SSI: ${fmt(ssiStaked)}
            </div>
            {shieldAmount > 0 && (
              <div className="text-[8px] text-[#4dabf7] mt-1">
                {t('userLevelBadge.shield.weeklyProtected', { amount: fmtDecimal(shieldAmount) })}
              </div>
            )}
            {ssiStaked === 0 && (
              <div className="text-[8px] text-[var(--text-dim)] mt-1">
                {t('userLevelBadge.shield.stakeHint')}
              </div>
            )}
          </div>
        </Tooltip>
      </div>

      {/* 模拟器 */}
      {showSimulator && (
        <div className="mt-2 pt-2 border-t border-[var(--border-light)]">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[9px] text-[var(--text-muted)] block mb-1">{t('userLevelBadge.simulator.sosoHolding')}</label>
              <input
                type="number"
                value={tempSoSo}
                onChange={(e) => setTempSoSo(e.target.value)}
                className="w-full bg-[var(--bg-app)] text-[var(--text-main)] text-[11px] px-2 py-1 rounded border border-transparent focus:border-[#ff6b35] focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-[9px] text-[var(--text-muted)] block mb-1">{t('userLevelBadge.simulator.ssiStaked')}</label>
              <input
                type="number"
                value={tempSSI}
                onChange={(e) => setTempSSI(e.target.value)}
                className="w-full bg-[var(--bg-app)] text-[var(--text-main)] text-[11px] px-2 py-1 rounded border border-transparent focus:border-[#4dabf7] focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setTempSoSo('10000'); setTempSSI('50000'); }}
              className="flex-1 py-1 text-[9px] bg-[var(--bg-app)] text-[var(--text-main)] rounded hover:bg-[var(--brand-yellow)]/20"
            >
              {t('userLevelBadge.simulator.presets.normal')}
            </button>
            <button
              onClick={() => { setTempSoSo('30000'); setTempSSI('200000'); }}
              className="flex-1 py-1 text-[9px] bg-[var(--bg-app)] text-[var(--text-main)] rounded hover:bg-[var(--brand-yellow)]/20"
            >
              {t('userLevelBadge.simulator.presets.core')}
            </button>
            <button
              onClick={() => { setTempSoSo('50000'); setTempSSI('1000000'); }}
              className="flex-1 py-1 text-[9px] bg-[var(--bg-app)] text-[var(--text-main)] rounded hover:bg-[var(--brand-yellow)]/20"
            >
              {t('userLevelBadge.simulator.presets.vip')}
            </button>
          </div>
          <button
            onClick={handleApply}
            className="w-full mt-2 py-1.5 text-[10px] bg-[var(--brand-green)] text-white rounded hover:opacity-90 font-medium"
          >
            {t('userLevelBadge.simulator.apply')}
          </button>
        </div>
      )}
    </div>
  );
}

export function UserLevelBadge() {
  const { t } = useTranslation();
  const { user, simulateTrade } = useUserStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [tradeVolume, setTradeVolume] = useState('');
  const [tradeType, setTradeType] = useState<'spot' | 'futures'>('spot');
  const [tradeSide, setTradeSide] = useState<'maker' | 'taker'>('taker');

  if (!user) return null;

  const userLevel = user.level || 'Bronze';
  const config = LEVEL_CONFIG[userLevel];
  const { nextLevel, progress } = getNextLevelInfo(userLevel, user.fees30d ?? 0);

  const handleSimulateTrade = () => {
    const volume = parseFloat(tradeVolume);
    if (volume > 0) {
      simulateTrade(volume, tradeType, tradeSide);
      setTradeVolume('');
    }
  };

  const quickTradeAmounts = [10000, 50000, 100000, 500000];

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-lg overflow-hidden">
      {/* Collapsed Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <LevelIcon level={userLevel} />
          <span
            className="font-bold text-[13px]"
            style={{ color: config.color }}
          >
            {userLevel}
          </span>
          <span className="text-[9px] px-1 py-0.5 bg-[var(--bg-surface)] text-[var(--text-muted)] rounded">
            T{config.tier}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] text-[var(--text-muted)]">{t('userLevelBadge.energyAvailable')}</div>
            <div className="text-[11px] font-mono-num text-[var(--brand-green)]">
              ⚡ {fmtDecimal(user.energyAvailable ?? 0)}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp size={14} className="text-[var(--text-muted)]" />
          ) : (
            <ChevronDown size={14} className="text-[var(--text-muted)]" />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-3 pb-2">
        <div className="h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: config.color,
            }}
          />
        </div>
        {nextLevel && (
          <div className="flex justify-between mt-1 text-[9px] text-[var(--text-muted)]">
            <span>{userLevel}</span>
            <span>{t('userLevelBadge.progress', { progress: progress.toFixed(0), nextLevel })}</span>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[var(--border-light)] p-3 space-y-3">
          {/* Energy Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[var(--bg-surface)] rounded p-2 text-center">
              <Zap size={12} className="mx-auto text-[var(--brand-green)] mb-1" />
              <div className="text-[9px] text-[var(--text-muted)]">{t('userLevelBadge.stats.available')}</div>
              <div className="text-[11px] font-bold text-[var(--brand-green)]">
                {fmtDecimal(user.energyAvailable ?? 0)}
              </div>
            </div>
            <div className="bg-[var(--bg-surface)] rounded p-2 text-center">
              <TrendingUp size={12} className="mx-auto text-[var(--text-muted)] mb-1" />
              <div className="text-[9px] text-[var(--text-muted)]">{t('userLevelBadge.stats.spent')}</div>
              <div className="text-[11px] font-bold">{fmtDecimal(user.energySpent ?? 0)}</div>
            </div>
            <div className="bg-[var(--bg-surface)] rounded p-2 text-center">
              <Award size={12} className="mx-auto text-[var(--brand-yellow)] mb-1" />
              <div className="text-[9px] text-[var(--text-muted)]">{t('userLevelBadge.stats.trades')}</div>
              <div className="text-[11px] font-bold">{user.totalTrades ?? 0}</div>
            </div>
            <div className="bg-[var(--bg-surface)] rounded p-2 text-center">
              <AlertTriangle size={12} className="mx-auto text-[var(--brand-red)] mb-1" />
              <div className="text-[9px] text-[var(--text-muted)]">{t('userLevelBadge.stats.decay')}</div>
              <div className="text-[11px] font-bold text-[var(--text-dim)]">
                {(config.decayRate * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Boost & Shield Status */}
          <BoostShieldStatus
            sosoHolding={user.sosoHolding ?? 0}
            ssiStaked={user.ssiStaked ?? 0}
            onUpdateSoSo={(amount) => useUserStore.getState().updateSoSoHolding(amount)}
            onUpdateSSI={(amount) => useUserStore.getState().updateSSIStaked(amount)}
          />

          {/* Benefits */}
          <div>
            <div className="text-[10px] text-[var(--text-muted)] mb-1">{t('userLevelBadge.currentBenefits')}</div>
            <div className="flex flex-wrap gap-1">
              {config.benefits.map((benefit, i) => (
                <span
                  key={i}
                  className="text-[9px] px-2 py-0.5 bg-[var(--bg-surface)] text-[var(--text-main)] rounded"
                >
                  {t(benefit)}
                </span>
              ))}
            </div>
          </div>

          {/* Next Level Preview */}
          {nextLevel && (
            <div className="bg-[var(--bg-surface)] rounded p-2">
              <div className="text-[10px] text-[var(--text-muted)] mb-1">
                {t('userLevelBadge.nextBenefits', { level: nextLevel })}
              </div>
              <div className="flex flex-wrap gap-1">
                {LEVEL_CONFIG[nextLevel].benefits.map((benefit, i) => (
                  <span
                    key={i}
                    className="text-[9px] px-2 py-0.5 border border-dashed border-[var(--brand-yellow)] text-[var(--brand-yellow)] rounded"
                  >
                    {t(benefit)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Simulate Trade */}
          <div className="border-t border-[var(--border-light)] pt-3">
            <div className="text-[10px] text-[var(--text-muted)] mb-2">{t('userLevelBadge.simulateTrade')}</div>

            {/* Trade Type & Side */}
            <div className="flex gap-2 mb-2">
              <select
                value={tradeType}
                onChange={(e) => setTradeType(e.target.value as 'spot' | 'futures')}
                className="flex-1 text-[9px] bg-[var(--bg-surface)] text-[var(--text-main)] rounded px-2 py-1 border-none focus:outline-none"
              >
                <option value="spot">{t('userLevelBadge.tradeType.spot')}</option>
                <option value="futures">{t('userLevelBadge.tradeType.futures')}</option>
              </select>
              <select
                value={tradeSide}
                onChange={(e) => setTradeSide(e.target.value as 'maker' | 'taker')}
                className="flex-1 text-[9px] bg-[var(--bg-surface)] text-[var(--text-main)] rounded px-2 py-1 border-none focus:outline-none"
              >
                <option value="taker">Taker</option>
                <option value="maker">Maker</option>
              </select>
            </div>

            <div className="flex gap-1 mb-2">
              {quickTradeAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => simulateTrade(amount, tradeType, tradeSide)}
                  className="flex-1 py-1 text-[9px] bg-[var(--bg-surface)] text-[var(--text-main)] rounded hover:bg-[var(--brand-green)] hover:text-white transition-colors"
                >
                  ${amount >= 1000 ? `${amount / 1000}k` : amount}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={tradeVolume}
                onChange={(e) => setTradeVolume(e.target.value)}
                placeholder={t('userLevelBadge.tradeAmount')}
                className="flex-1 bg-[var(--bg-surface)] text-[var(--text-main)] text-[11px] px-2 py-1.5 rounded border border-transparent focus:border-[var(--brand-yellow)] focus:outline-none"
              />
              <button
                onClick={handleSimulateTrade}
                className="px-3 py-1.5 text-[10px] bg-[var(--brand-green)] text-white rounded hover:opacity-90 transition-opacity font-medium"
              >
                {t('userLevelBadge.trade')}
              </button>
            </div>

            {/* Fee Preview */}
            {tradeVolume && parseFloat(tradeVolume) > 0 && (
              <div className="mt-2 text-[9px] text-[var(--text-muted)] bg-[var(--bg-app)] rounded p-2">
                <div className="flex justify-between">
                  <span>{t('userLevelBadge.fee')}</span>
                  <span className="text-[var(--brand-yellow)]">
                    ${fmtDecimal(parseFloat(tradeVolume) * FEE_RATES[tradeType][tradeSide])}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('userLevelBadge.energyEarned')}</span>
                  <span className="text-[var(--brand-green)]">
                    +{fmtDecimal(parseFloat(tradeVolume) * FEE_RATES[tradeType][tradeSide])}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
