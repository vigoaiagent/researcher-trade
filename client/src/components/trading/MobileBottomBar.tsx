import { useState, useEffect } from 'react';
import { Newspaper, Calendar, FileText, Radio, ChevronUp, TrendingUp, TrendingDown, Crown, X, Zap } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { FEE_RATES, getSoSoMultiplier } from '../../types';
import { useTranslation } from '../../i18n';

// 简化的新闻数据
const mobileTickerItems: Array<{
  id: string;
  title: string;
  symbol: string;
  sentiment?: 'bullish' | 'bearish';
  isVip?: boolean;
}> = [
  { id: 'n1', title: 'BlackRock Bitcoin ETF sees record $500M inflows', symbol: 'BTC', sentiment: 'bullish' },
  { id: 'n2', title: 'Ethereum gas fees drop to 6-month low', symbol: 'ETH', sentiment: 'bullish' },
  { id: 'r1', title: 'BTC Technical Analysis: Key Support at $94,500', symbol: 'BTC', isVip: true },
  { id: 'n3', title: 'SEC approves first spot Solana ETF application', symbol: 'SOL', sentiment: 'bullish' },
  { id: 'n4', title: 'Major exchange reports $100M outflow', symbol: 'BTC', sentiment: 'bearish' },
  { id: 'r2', title: 'ETH Layer 2 Ecosystem Deep Dive', symbol: 'ETH', isVip: true },
];

interface MobileBottomBarProps {
  onOpenReportList: () => void;
  onOpenNewsList: () => void;
  onOpenCalendar: () => void;
  hasLiveEvent?: boolean;
  onOpenLive?: () => void;
  currentPrice?: number;
}

export function MobileBottomBar({
  onOpenReportList,
  onOpenNewsList,
  onOpenCalendar,
  hasLiveEvent,
  onOpenLive,
  currentPrice = 67240.50,
}: MobileBottomBarProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('1000');
  const [isBuy, setIsBuy] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user, simulateTrade } = useUserStore();

  // 自动轮播新闻
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mobileTickerItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentItem = mobileTickerItems[currentIndex];

  // 计算模拟交易费用 (使用永续合约 taker 费率)
  const feeRate = FEE_RATES.futures.taker; // 0.045%
  const amount = parseFloat(tradeAmount) || 0;
  const estimatedFee = amount * feeRate;
  // SoSo 持有加成
  const sosoMultiplier = getSoSoMultiplier(user?.sosoHolding ?? 0);
  const energyMinted = estimatedFee * sosoMultiplier;

  const handleTrade = () => {
    if (amount > 0) {
      // simulateTrade(volume, type, side)
      simulateTrade(amount, 'futures', 'taker');
      setShowTradePanel(false);
      setTradeAmount('1000');
      // 显示成功提示
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[90]">
      {/* 交易成功提示 */}
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[600] animate-in fade-in slide-in-from-top duration-300">
          <div className="bg-[var(--brand-green)] text-black px-6 py-3 rounded-xl font-bold text-[14px] shadow-lg flex items-center gap-2">
            <Zap size={18} />
            {t('mobileTrade.successToast')}
          </div>
        </div>
      )}

      {/* 移动端交易面板 - z-index 高于猫按钮 */}
      {showTradePanel && (
        <div className="fixed inset-0 bg-black/70 z-[500] flex items-end justify-center" onClick={() => setShowTradePanel(false)}>
          <div className="w-full bg-[var(--bg-panel)] rounded-t-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
              <span className="text-[16px] font-bold text-[var(--text-main)]">{t('tradePanel.demoTrading')}</span>
              <button onClick={() => setShowTradePanel(false)} className="p-1">
                <X size={20} className="text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* 当前价格 */}
              <div className="flex items-center justify-between p-3 bg-[var(--bg-surface)] rounded-lg">
                <span className="text-[13px] text-[var(--text-muted)]">{t('mobileTrade.currentPrice')}</span>
                <span className="text-[18px] font-bold text-[var(--brand-green)]">${currentPrice.toFixed(2)}</span>
              </div>

              {/* Buy/Sell Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBuy(true)}
                  className={`flex-1 py-3 rounded-lg font-bold text-[15px] transition ${
                    isBuy ? 'bg-[var(--brand-green)] text-black' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                  }`}
                >
                  {t('mobileTrade.buyLong')}
                </button>
                <button
                  onClick={() => setIsBuy(false)}
                  className={`flex-1 py-3 rounded-lg font-bold text-[15px] transition ${
                    !isBuy ? 'bg-[var(--brand-red)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                  }`}
                >
                  {t('mobileTrade.sellShort')}
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-[12px] text-[var(--text-muted)] mb-2 block">{t('mobileTrade.amountLabel')}</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg text-[16px] text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-yellow)]"
                  placeholder={t('mobileTrade.amountPlaceholder')}
                />
                {/* Quick Amount Buttons */}
                <div className="flex gap-2 mt-2">
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTradeAmount(String(amt))}
                      className="flex-1 py-2 text-[12px] bg-[var(--bg-surface)] text-[var(--text-muted)] rounded-lg hover:bg-[var(--bg-highlight)]"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Info */}
              <div className="p-3 bg-[var(--bg-surface)] rounded-lg space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[var(--text-muted)]">{t('mobileTrade.feeRate')}</span>
                  <span className="text-[var(--text-main)]">{(feeRate * 100).toFixed(3)}%</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[var(--text-muted)]">{t('mobileTrade.estimatedFee')}</span>
                  <span className="text-[var(--brand-yellow)]">${estimatedFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[var(--text-muted)]">{t('mobileTrade.sosoBoost')}</span>
                  <span className="text-[var(--text-main)]">x{sosoMultiplier.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[var(--text-muted)]">{t('mobileTrade.energyMinted')}</span>
                  <span className="text-[var(--brand-green)] flex items-center gap-1">
                    <Zap size={12} />+{energyMinted.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleTrade}
                disabled={amount <= 0}
                className={`w-full py-4 rounded-lg font-bold text-[16px] disabled:opacity-50 transition ${
                  isBuy ? 'bg-[var(--brand-green)] text-black' : 'bg-[var(--brand-red)] text-white'
                }`}
              >
                {isBuy ? t('mobileTrade.buyLong') : t('mobileTrade.sellShort')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 滚动新闻条 */}
      <div
        className="bg-[var(--bg-app)] border-t border-[var(--border-light)] px-3 py-2 flex items-center gap-2 overflow-hidden"
        onClick={currentItem.isVip ? onOpenReportList : onOpenNewsList}
      >
        {currentItem.isVip ? (
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded text-[8px] font-bold text-black shrink-0">
            <Crown size={8} />
            {t('mobileTrade.vipTag')}
          </span>
        ) : (
          <Newspaper size={12} className="text-[var(--text-muted)] shrink-0" />
        )}
        {currentItem.sentiment === 'bullish' && <TrendingUp size={10} className="text-[var(--brand-green)] shrink-0" />}
        {currentItem.sentiment === 'bearish' && <TrendingDown size={10} className="text-[var(--brand-red)] shrink-0" />}
        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[var(--bg-surface)] text-[var(--text-main)] rounded shrink-0">
          {currentItem.symbol}
        </span>
        <span className="text-[11px] text-[var(--text-main)] truncate flex-1">
          {currentItem.title}
        </span>
        <span className="text-[10px] text-[var(--text-dim)] shrink-0">{currentIndex + 1}/{mobileTickerItems.length}</span>
      </div>

      {/* 展开的面板 */}
      {isExpanded && (
        <div className="bg-[var(--bg-panel)] border-t border-[var(--border-light)] p-4 animate-in slide-in-from-bottom duration-200">
          <div className="grid grid-cols-2 gap-3">
            {/* 新闻快讯 */}
            <button
              onClick={() => {
                onOpenNewsList();
                setIsExpanded(false);
              }}
              className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-xl hover:bg-[var(--bg-highlight)] transition"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--brand-yellow)]/20 flex items-center justify-center">
                <Newspaper size={20} className="text-[var(--brand-yellow)]" />
              </div>
              <div className="text-left">
                <div className="text-[14px] font-medium text-[var(--text-main)]">{t('mobileTrade.newsBrief')}</div>
                <div className="text-[11px] text-[var(--text-muted)]">{t('mobileTrade.marketUpdates')}</div>
              </div>
            </button>

            {/* VIP研报 */}
            <button
              onClick={() => {
                onOpenReportList();
                setIsExpanded(false);
              }}
              className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-xl hover:bg-[var(--bg-highlight)] transition"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--brand-green)]/20 flex items-center justify-center">
                <FileText size={20} className="text-[var(--brand-green)]" />
              </div>
              <div className="text-left">
                <div className="text-[14px] font-medium text-[var(--text-main)]">{t('mobileTrade.vipReports')}</div>
                <div className="text-[11px] text-[var(--text-muted)]">{t('mobileTrade.exclusiveAnalysis')}</div>
              </div>
            </button>

            {/* 路演日历 */}
            <button
              onClick={() => {
                onOpenCalendar();
                setIsExpanded(false);
              }}
              className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-xl hover:bg-[var(--bg-highlight)] transition"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--brand-yellow)]/20 flex items-center justify-center">
                <Calendar size={20} className="text-[var(--brand-yellow)]" />
              </div>
              <div className="text-left">
                <div className="text-[14px] font-medium text-[var(--text-main)]">{t('mobileTrade.roadshowCalendar')}</div>
                <div className="text-[11px] text-[var(--text-muted)]">{t('mobileTrade.livePreview')}</div>
              </div>
            </button>

            {/* 正在直播 */}
            {hasLiveEvent && onOpenLive && (
              <button
                onClick={() => {
                  onOpenLive();
                  setIsExpanded(false);
                }}
                className="flex items-center gap-3 p-3 bg-[var(--brand-red)]/10 rounded-xl hover:bg-[var(--brand-red)]/20 transition animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--brand-red)]/20 flex items-center justify-center">
                  <Radio size={20} className="text-[var(--brand-red)]" />
                </div>
                <div className="text-left">
                  <div className="text-[14px] font-medium text-[var(--brand-red)]">{t('mobileTrade.liveNow')}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{t('mobileTrade.clickToEnter')}</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 底部栏 */}
      <div className="bg-[var(--bg-panel)] border-t border-[var(--border-light)] px-3 py-2 flex items-center justify-between gap-2">
        {/* 左侧快捷按钮 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenNewsList}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--bg-surface)] rounded-lg text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
          >
            <Newspaper size={12} />
            <span>{t('mobileTrade.shortNews')}</span>
          </button>
          <button
            onClick={onOpenReportList}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--bg-surface)] rounded-lg text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
          >
            <FileText size={12} />
            <span>{t('mobileTrade.shortReports')}</span>
          </button>
          {hasLiveEvent && (
            <button
              onClick={onOpenLive}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--brand-red)]/10 rounded-lg text-[11px] text-[var(--brand-red)] animate-pulse"
            >
              <Radio size={12} />
              <span>{t('mobileTrade.shortLive')}</span>
            </button>
          )}
        </div>

        {/* 交易按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsBuy(true); setShowTradePanel(true); }}
            className="px-4 py-2 bg-[var(--brand-green)] text-black rounded-lg text-[12px] font-bold"
          >
            {t('mobileTrade.buy')}
          </button>
          <button
            onClick={() => { setIsBuy(false); setShowTradePanel(true); }}
            className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[12px] font-bold"
          >
            {t('mobileTrade.sell')}
          </button>
        </div>

        {/* 右侧展开按钮 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1.5 rounded-lg bg-[var(--bg-surface)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          <ChevronUp size={16} className="text-[var(--text-muted)]" />
        </button>
      </div>
    </div>
  );
}
