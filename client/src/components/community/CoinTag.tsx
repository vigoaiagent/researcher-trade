import { TrendingUp, TrendingDown } from 'lucide-react';
import { mockCoinPrices } from '../../data/mockCommunity';

interface CoinTagProps {
  symbol: string; // BTC, ETH, SOL等
}

export function CoinTag({ symbol }: CoinTagProps) {
  const coinData = mockCoinPrices[symbol];

  if (!coinData) {
    // 如果不是代币，返回普通标签样式
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] text-[11px]">
        {symbol}
      </span>
    );
  }

  const isPositive = coinData.change24h >= 0;
  const changeColor = isPositive ? 'text-[#00C087]' : 'text-[#FF6B6B]';

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2A2A2A] text-[11px] font-medium">
      {/* 代币符号 */}
      <span className="text-[var(--text-main)]">{symbol}</span>

      {/* 涨跌幅 */}
      <span className={`flex items-center gap-0.5 ${changeColor}`}>
        {isPositive ? (
          <TrendingUp size={10} />
        ) : (
          <TrendingDown size={10} />
        )}
        {isPositive ? '+' : ''}{coinData.change24h.toFixed(2)}%
      </span>
    </span>
  );
}
