import { useState } from 'react';

// 交易对数据
interface TradingPair {
  symbol: string;
  name: string;
  basePrice: number;
  type: 'perp' | 'spot';
  isFavorite?: boolean;
  change24h?: number;
}

const tradingPairs: TradingPair[] = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', basePrice: 67240.50, type: 'perp', change24h: 2.45 },
  { symbol: 'ETH/USDT', name: 'Ethereum', basePrice: 3456.78, type: 'perp', change24h: 1.82 },
  { symbol: 'SOL/USDT', name: 'Solana', basePrice: 142.35, type: 'perp', change24h: 5.21 },
  { symbol: 'ARB/USDT', name: 'Arbitrum', basePrice: 1.24, type: 'perp', change24h: -2.15 },
  { symbol: 'BNB/USDT', name: 'BNB', basePrice: 598.42, type: 'perp', change24h: 0.87 },
  { symbol: 'XRP/USDT', name: 'Ripple', basePrice: 0.5234, type: 'perp', change24h: -1.23 },
  { symbol: 'DOGE/USDT', name: 'Dogecoin', basePrice: 0.1245, type: 'perp', change24h: 8.45 },
  { symbol: 'AVAX/USDT', name: 'Avalanche', basePrice: 34.56, type: 'perp', change24h: 3.21 },
  { symbol: 'LINK/USDT', name: 'Chainlink', basePrice: 14.78, type: 'perp', change24h: -0.45 },
  { symbol: 'OP/USDT', name: 'Optimism', basePrice: 2.34, type: 'perp', change24h: 4.12 },
  { symbol: 'MATIC/USDT', name: 'Polygon', basePrice: 0.8765, type: 'perp', change24h: -3.21 },
  { symbol: 'ATOM/USDT', name: 'Cosmos', basePrice: 9.87, type: 'perp', change24h: 1.56 },
];

interface MarketTickerProps {
  price: number;
  prevPrice: number;
  onSymbolChange?: (symbol: string) => void;
}

const fmt = (num: number, digits = 2) =>
  num.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const fmtPrice = (num: number) => {
  if (num >= 1000) return fmt(num, 2);
  if (num >= 1) return fmt(num, 4);
  return fmt(num, 6);
};

export function MarketTicker({ price, prevPrice, onSymbolChange }: MarketTickerProps) {
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);

  // 计算实际价格（基于选中的交易对）
  const priceRatio = price / 67240.50; // 相对于 BTC 基准价格的比例
  const actualPrice = selectedPair.basePrice * priceRatio;
  const actualPrevPrice = selectedPair.basePrice * (prevPrice / 67240.50);

  const handleSelectPair = (pair: TradingPair) => {
    setSelectedPair(pair);
    onSymbolChange?.(pair.symbol);
  };

  // 快速切换的交易对 - 只显示主要的三个
  const quickPairs = tradingPairs.filter(p => ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'].includes(p.symbol));

  return (
    <div className="h-[44px] bg-[var(--bg-app)] border-b border-[var(--border-light)] flex items-center px-4 gap-4 shrink-0 overflow-hidden">
      {/* Quick Tabs - BTC/ETH/SOL */}
      <div className="flex items-center gap-1">
        {quickPairs.map(pair => (
          <button
            key={pair.symbol}
            onClick={() => handleSelectPair(pair)}
            className={`px-2.5 py-1 rounded text-[13px] font-medium transition-all ${
              selectedPair.symbol === pair.symbol
                ? 'bg-[var(--brand-yellow)] text-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
            }`}
          >
            {pair.symbol.split('/')[0]}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-[var(--border-light)]" />

      {/* Current Symbol Display - 只显示当前选中的交易对，不可下拉 */}
      <div className="flex items-center gap-2">
        <h1 className="text-[18px] font-bold text-[var(--text-main)] leading-none">{selectedPair.symbol}</h1>
        <span className="text-[11px] bg-[var(--bg-surface)] text-[var(--brand-yellow)] px-1 rounded">
          {selectedPair.type === 'perp' ? 'Perp' : 'Spot'}
        </span>
      </div>

      {/* Market Data */}
      <div className="flex items-center gap-6 text-xs font-mono-num">
        {/* Current Price */}
        <div className={`flex flex-col leading-tight ${actualPrice >= actualPrevPrice ? 'text-green' : 'text-red'}`}>
          <span className="text-[16px] font-bold">{fmtPrice(actualPrice)}</span>
          <span className="text-[11px]">${fmtPrice(actualPrice)}</span>
        </div>

        {/* 24h Change */}
        <div className="hidden md:flex flex-col leading-tight">
          <span className="text-[var(--text-muted)] text-[10px]">24h Change</span>
          <span className={(selectedPair.change24h ?? 0) >= 0 ? 'text-green' : 'text-red'}>
            {(selectedPair.change24h ?? 0) >= 0 ? '+' : ''}{selectedPair.change24h?.toFixed(2)}%
          </span>
        </div>

        {/* 24h High */}
        <div className="hidden md:flex flex-col leading-tight">
          <span className="text-[var(--text-muted)] text-[10px]">24h High</span>
          <span className="text-[var(--text-main)]">{fmtPrice(selectedPair.basePrice * 1.025)}</span>
        </div>

        {/* 24h Low */}
        <div className="hidden md:flex flex-col leading-tight">
          <span className="text-[var(--text-muted)] text-[10px]">24h Low</span>
          <span className="text-[var(--text-main)]">{fmtPrice(selectedPair.basePrice * 0.968)}</span>
        </div>

        {/* 24h Volume */}
        <div className="hidden lg:flex flex-col leading-tight">
          <span className="text-[var(--text-muted)] text-[10px]">24h Volume({selectedPair.symbol.split('/')[0]})</span>
          <span className="text-[var(--text-main)]">{fmt(Math.random() * 50000 + 10000, 2)}</span>
        </div>

        {/* Funding Rate */}
        <div className="hidden lg:flex flex-col leading-tight">
          <span className="text-[var(--text-muted)] text-[10px]">Funding / Countdown</span>
          <span className="text-[var(--brand-yellow)]">0.0100% <span className="text-[var(--text-muted)]">02:14:59</span></span>
        </div>
      </div>
    </div>
  );
}
