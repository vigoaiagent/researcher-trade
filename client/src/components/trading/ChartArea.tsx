import { useState, useEffect, useMemo } from 'react';
import { Activity, Maximize2, Layers } from 'lucide-react';

interface ChartAreaProps {
  price: number;
  symbol?: string;
}

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  id: number;
}

const fmt = (num: number, digits = 2) =>
  num.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const calculateMA = (data: Candle[], period: number): (number | null)[] => {
  return data.map((_, i, arr) => {
    if (i < period - 1) return null;
    const slice = arr.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    return sum / period;
  });
};

// 根据交易对获取基准价格
const getBasePrice = (sym: string): number => {
  const basePrices: Record<string, number> = {
    'BTC/USDT': 67240.50,
    'ETH/USDT': 3456.78,
    'SOL/USDT': 142.35,
    'ARB/USDT': 1.24,
    'BNB/USDT': 598.42,
    'XRP/USDT': 0.5234,
    'DOGE/USDT': 0.1245,
    'AVAX/USDT': 34.56,
    'LINK/USDT': 14.78,
    'OP/USDT': 2.34,
    'MATIC/USDT': 0.8765,
    'ATOM/USDT': 9.87,
  };
  return basePrices[sym] || 100;
};

// 生成K线数据
const generateCandles = (basePrice: number): Candle[] => {
  let p = basePrice;
  const data: Candle[] = [];
  const volatility = basePrice * 0.006; // 0.6% 波动率
  for (let i = 0; i < 60; i++) {
    const change = (Math.random() - 0.5) * volatility;
    const open = p;
    const close = p + change;
    const high = Math.max(open, close) + Math.random() * (volatility / 2);
    const low = Math.min(open, close) - Math.random() * (volatility / 2);
    const volume = Math.random() * 100;
    data.push({ open, close, high, low, volume, id: i });
    p = close;
  }
  return data;
};

export function ChartArea({ price, symbol = 'BTC/USDT' }: ChartAreaProps) {
  const basePrice = getBasePrice(symbol);

  // Generate realistic looking market data
  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(basePrice));

  // 当交易对改变时，重新生成K线数据
  useEffect(() => {
    const newBasePrice = getBasePrice(symbol);
    setCandles(generateCandles(newBasePrice));
  }, [symbol]);

  // Calculate MA Lines
  const ma7 = useMemo(() => calculateMA(candles, 7), [candles]);
  const ma25 = useMemo(() => calculateMA(candles, 25), [candles]);

  // Update last candle effect - scale price relative to symbol
  useEffect(() => {
    // 根据 BTC 价格变化比例来更新当前交易对的价格
    const btcBase = 67240.50;
    const priceRatio = price / btcBase;
    const scaledPrice = basePrice * priceRatio;

    setCandles((prev) => {
      const last = { ...prev[prev.length - 1] };
      // Smoothly move closing price towards current scaled price
      last.close = last.close + (scaledPrice - last.close) * 0.1;
      last.high = Math.max(last.high, last.close);
      last.low = Math.min(last.low, last.close);

      const newData = [...prev.slice(0, -1), last];

      // Randomly add new candle occasionally to simulate time passing
      if (Math.random() > 0.99) {
        return [
          ...newData.slice(1),
          {
            open: last.close,
            close: last.close,
            high: last.close,
            low: last.close,
            volume: Math.random() * 100,
            id: Date.now(),
          },
        ];
      }
      return newData;
    });
  }, [price, basePrice]);

  // 计算当前显示的价格（按比例缩放）
  const btcBase = 67240.50;
  const priceRatio = price / btcBase;
  const currentPrice = basePrice * priceRatio;

  // Chart Scaling
  const minPrice = Math.min(...candles.map((c) => c.low));
  const maxPrice = Math.max(...candles.map((c) => c.high));
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  const getY = (p: number) => {
    return 400 - ((p - (minPrice - padding)) / (priceRange + padding * 2)) * 400;
  };

  // Volume Scaling
  const maxVol = Math.max(...candles.map((c) => c.volume));

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-app)] relative crosshair">
      {/* Toolbar */}
      <div className="h-9 border-b border-[var(--border-light)] flex items-center px-4 justify-between bg-[var(--bg-app)]">
        <div className="flex gap-4 text-[12px] font-medium text-[var(--text-muted)]">
          <span className="text-[var(--text-main)]">Time</span>
          <span className="text-[var(--text-main)] cursor-pointer bg-[var(--bg-surface)] px-1 rounded">15m</span>
          <span className="hover:text-[var(--text-main)] cursor-pointer">1H</span>
          <span className="hover:text-[var(--text-main)] cursor-pointer">4H</span>
          <span className="hover:text-[var(--text-main)] cursor-pointer">1D</span>
          <div className="w-[1px] h-3 bg-[var(--border-light)] my-auto"></div>
          <span className="text-[var(--brand-yellow)] text-[10px] flex items-center gap-1">MA(7)</span>
          <span className="text-[var(--brand-blue)] text-[10px] flex items-center gap-1">MA(25)</span>
        </div>
        <div className="flex gap-3 text-[var(--text-muted)]">
          <Activity size={14} className="hover:text-[var(--text-main)] cursor-pointer" />
          <Maximize2 size={14} className="hover:text-[var(--text-main)] cursor-pointer" />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 500">
          {/* Grid */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={i * 70}
              x2="1000"
              y2={i * 70}
              stroke="var(--border-light)"
              strokeWidth="0.5"
              strokeOpacity="0.5"
            />
          ))}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <line
              key={`v-${i}`}
              x1={i * 120}
              y1="0"
              x2={i * 120}
              y2="500"
              stroke="var(--border-light)"
              strokeWidth="0.5"
              strokeOpacity="0.5"
            />
          ))}

          {/* Volume Bars (Bottom 100px) */}
          {candles.map((c, i) => {
            const x = i * 16 + 10;
            const isUp = c.close >= c.open;
            const h = (c.volume / maxVol) * 80;
            return (
              <rect
                key={`vol-${c.id}`}
                x={x}
                y={500 - h}
                width="10"
                height={h}
                fill={isUp ? 'var(--brand-green)' : 'var(--brand-red)'}
                opacity="0.3"
              />
            );
          })}

          {/* Candles */}
          {candles.map((c, i) => {
            const x = i * 16 + 10;
            const isUp = c.close >= c.open;
            const color = isUp ? 'var(--brand-green)' : 'var(--brand-red)';
            const yOpen = getY(c.open);
            const yClose = getY(c.close);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);
            const height = Math.max(1, Math.abs(yOpen - yClose));

            return (
              <g key={c.id}>
                {/* Wick */}
                <line x1={x + 5} y1={yHigh} x2={x + 5} y2={yLow} stroke={color} strokeWidth="1" />
                {/* Body */}
                <rect x={x} y={Math.min(yOpen, yClose)} width="10" height={height} fill={color} />
              </g>
            );
          })}

          {/* MA Lines */}
          <polyline
            points={ma7.map((v, i) => (v ? `${i * 16 + 15},${getY(v)}` : '')).join(' ')}
            fill="none"
            stroke="var(--brand-yellow)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <polyline
            points={ma25.map((v, i) => (v ? `${i * 16 + 15},${getY(v)}` : '')).join(' ')}
            fill="none"
            stroke="var(--brand-blue)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Current Price Line */}
          <line
            x1="0"
            y1={getY(currentPrice)}
            x2="1000"
            y2={getY(currentPrice)}
            stroke="var(--text-muted)"
            strokeWidth="0.8"
            strokeDasharray="4 2"
          />
          <rect
            x="930"
            y={getY(currentPrice) - 10}
            width="70"
            height="20"
            rx="2"
            fill="var(--bg-panel)"
            stroke="var(--border-light)"
          />
          <text
            x="935"
            y={getY(currentPrice) + 4}
            fill={candles[candles.length - 1].close >= candles[candles.length - 1].open ? 'var(--brand-green)' : 'var(--brand-red)'}
            fontSize="11"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {fmt(currentPrice)}
          </text>
        </svg>

        {/* Hover Crosshair Simulation */}
        <div className="absolute inset-0 crosshair-lines">
          <div className="absolute top-1/2 w-full h-[1px] bg-white opacity-20 border-t border-dashed border-white"></div>
          <div className="absolute left-1/2 h-full w-[1px] bg-white opacity-20 border-l border-dashed border-white"></div>
        </div>
      </div>

      {/* Positions Tab */}
      <div className="h-[250px] border-t border-[var(--border-light)] bg-[var(--bg-panel)] flex flex-col">
        <div className="flex border-b border-[var(--border-light)] bg-[var(--bg-panel)]">
          {['Positions (0)', 'Open Orders (0)', 'Order History', 'Trade History'].map((t, i) => (
            <div
              key={t}
              className={`px-4 py-2 text-[12px] font-bold cursor-pointer ${
                i === 0
                  ? 'text-[var(--brand-yellow)] border-t-2 border-[var(--brand-yellow)] bg-[var(--bg-surface)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {t}
            </div>
          ))}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
          <Layers size={32} opacity={0.2} />
          <span>No Open Positions</span>
        </div>
      </div>
    </div>
  );
}
