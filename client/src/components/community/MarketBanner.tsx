import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { mockCoinPrices } from '../../data/mockCommunity';

interface MarketBannerProps {
  currentSymbol?: string;
}

export function MarketBanner({ currentSymbol }: MarketBannerProps) {
  if (!currentSymbol) return null;

  // 从 "BTC/USDT" 格式提取代币符号 "BTC"
  const coinSymbol = currentSymbol.split('/')[0];
  const coinData = mockCoinPrices[coinSymbol];

  if (!coinData) return null;

  const isPositive = coinData.change24h >= 0;
  const changeColor = isPositive ? 'text-[#00C087]' : 'text-[#FF6B6B]';
  const bgGradient = isPositive
    ? 'from-[#00C087]/10 to-transparent'
    : 'from-[#FF6B6B]/10 to-transparent';

  return (
    <div className={`px-4 py-3 bg-gradient-to-r ${bgGradient} border-b border-[var(--border-light)]`}>
      {/* 顶部：图标 + 标题 */}
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 size={16} className="text-[var(--brand-yellow)]" />
        <span className="text-[13px] font-bold text-[var(--text-main)]">
          今日持仓币市场动态已更新
        </span>
      </div>

      {/* 副标题 */}
      <p className="text-[11px] text-[var(--text-muted)] mb-3">
        根据您的持仓推送相关市场热门观点
      </p>

      {/* 价格卡片 */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-light)]">
        {/* 左侧：交易对 */}
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-bold text-[var(--text-main)]">
            {currentSymbol}
          </span>
        </div>

        {/* 右侧：价格 + 涨跌幅 */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[16px] font-bold text-[var(--text-main)]">
              ${coinData.price.toLocaleString()}
            </div>
            <div className={`flex items-center justify-end gap-1 text-[12px] font-medium ${changeColor}`}>
              {isPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>
                {isPositive ? '+' : ''}{coinData.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
