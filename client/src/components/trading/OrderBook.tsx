import { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, ArrowUp, ArrowDown } from 'lucide-react';

interface OrderBookProps {
  price: number;
}

interface OrderLevel {
  p: number;
  q: string;
  total: string;
}

interface Trade {
  price: number;
  size: string;
  time: string;
  isBuy: boolean;
}

const fmt = (num: number, digits = 2) =>
  num.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function OrderBook({ price }: OrderBookProps) {
  const [asks, setAsks] = useState<OrderLevel[]>([]);
  const [bids, setBids] = useState<OrderLevel[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up');
  const prevPriceRef = useRef(price);

  // Track price direction
  useEffect(() => {
    if (price > prevPriceRef.current) {
      setPriceDirection('up');
    } else if (price < prevPriceRef.current) {
      setPriceDirection('down');
    }
    prevPriceRef.current = price;
  }, [price]);

  // Generate order book data
  useEffect(() => {
    const generateAsks = (basePrice: number): OrderLevel[] => {
      let cumTotal = 0;
      return Array.from({ length: 12 }).map((_, i) => {
        const qty = Math.random() * 0.8 + 0.01;
        cumTotal += qty;
        return {
          p: basePrice + (i + 1) * (0.5 + Math.random() * 0.3),
          q: qty.toFixed(3),
          total: cumTotal.toFixed(3),
        };
      }).reverse(); // Reverse so highest ask is at top
    };

    const generateBids = (basePrice: number): OrderLevel[] => {
      let cumTotal = 0;
      return Array.from({ length: 12 }).map((_, i) => {
        const qty = Math.random() * 0.8 + 0.01;
        cumTotal += qty;
        return {
          p: basePrice - (i + 1) * (0.5 + Math.random() * 0.3),
          q: qty.toFixed(3),
          total: cumTotal.toFixed(3),
        };
      });
    };

    const interval = setInterval(() => {
      setAsks(generateAsks(price));
      setBids(generateBids(price));
    }, 1000);

    // Initial generation
    setAsks(generateAsks(price));
    setBids(generateBids(price));

    return () => clearInterval(interval);
  }, [price]);

  // Generate recent trades with realistic timestamps
  useEffect(() => {
    const generateTrade = (): Trade => {
      const now = new Date();
      const secondsAgo = Math.floor(Math.random() * 5);
      now.setSeconds(now.getSeconds() - secondsAgo);

      return {
        price: price + (Math.random() - 0.5) * 5,
        size: (Math.random() * 0.15 + 0.001).toFixed(4),
        time: now.toLocaleTimeString('en-US', { hour12: false }),
        isBuy: Math.random() > 0.5,
      };
    };

    // Initialize with varied timestamps
    const initialTrades: Trade[] = [];
    const now = new Date();
    for (let i = 0; i < 10; i++) {
      const tradeTime = new Date(now.getTime() - i * 2000 - Math.random() * 1000);
      initialTrades.push({
        price: price + (Math.random() - 0.5) * 8,
        size: (Math.random() * 0.15 + 0.001).toFixed(4),
        time: tradeTime.toLocaleTimeString('en-US', { hour12: false }),
        isBuy: Math.random() > 0.5,
      });
    }
    setTrades(initialTrades);

    // Add new trades periodically
    const interval = setInterval(() => {
      setTrades(prev => [generateTrade(), ...prev.slice(0, 9)]);
    }, 1500 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, [price]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-panel)] border-l border-r border-[var(--border-light)] w-[260px] shrink-0">
      {/* Header */}
      <div className="h-8 px-3 flex items-center justify-between border-b border-[var(--border-light)]">
        <span className="text-[12px] font-bold text-[var(--text-main)]">Order Book</span>
        <MoreHorizontal size={14} className="text-[var(--text-muted)] cursor-pointer" />
      </div>

      {/* Column Headers */}
      <div className="flex px-3 py-1 text-[10px] text-[var(--text-muted)]">
        <span className="flex-1">Price(USDT)</span>
        <span className="flex-1 text-right">Size(BTC)</span>
        <span className="flex-1 text-right">Sum(BTC)</span>
      </div>

      {/* Asks (Sell Orders) - Red */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end">
        {asks.map((a, i) => (
          <div
            key={`ask-${i}`}
            className="flex px-3 py-[1px] text-[11px] font-mono-num relative hover:bg-[var(--bg-surface)] cursor-pointer"
          >
            <div
              className="absolute top-0 right-0 bottom-0 bg-[var(--brand-red-dim)] z-0"
              style={{ width: `${Math.min(parseFloat(a.q) * 120, 100)}%` }}
            />
            <span className="flex-1 text-[var(--brand-red)] z-10">{fmt(a.p, 1)}</span>
            <span className="flex-1 text-right text-[var(--text-main)] z-10">{a.q}</span>
            <span className="flex-1 text-right text-[var(--text-muted)] z-10">{a.total}</span>
          </div>
        ))}
      </div>

      {/* Current Price - Center */}
      <div className="py-2 px-3 border-y border-[var(--border-light)] flex items-center gap-2 bg-[var(--bg-app)]">
        <span className={`text-[16px] font-bold font-mono-num ${priceDirection === 'up' ? 'text-green' : 'text-red'}`}>
          {fmt(price, 1)}
        </span>
        {priceDirection === 'up' ? (
          <ArrowUp size={14} className="text-green" />
        ) : (
          <ArrowDown size={14} className="text-red" />
        )}
        <span className="text-[11px] text-[var(--text-muted)]">${fmt(price, 2)}</span>
      </div>

      {/* Bids (Buy Orders) - Green */}
      <div className="flex-1 overflow-hidden">
        {bids.map((b, i) => (
          <div
            key={`bid-${i}`}
            className="flex px-3 py-[1px] text-[11px] font-mono-num relative hover:bg-[var(--bg-surface)] cursor-pointer"
          >
            <div
              className="absolute top-0 right-0 bottom-0 bg-[var(--brand-green-dim)] z-0"
              style={{ width: `${Math.min(parseFloat(b.q) * 120, 100)}%` }}
            />
            <span className="flex-1 text-[var(--brand-green)] z-10">{fmt(b.p, 1)}</span>
            <span className="flex-1 text-right text-[var(--text-main)] z-10">{b.q}</span>
            <span className="flex-1 text-right text-[var(--text-muted)] z-10">{b.total}</span>
          </div>
        ))}
      </div>

      {/* Recent Trades */}
      <div className="h-[180px] border-t border-[var(--border-light)] flex flex-col">
        <div className="px-3 py-1 text-[12px] font-bold text-[var(--text-main)] border-b border-[var(--border-light)] bg-[var(--bg-surface)]">
          Recent Trades
        </div>
        <div className="px-3 py-1 flex text-[10px] text-[var(--text-muted)]">
          <span className="flex-1">Price</span>
          <span className="flex-1 text-right">Size</span>
          <span className="flex-1 text-right">Time</span>
        </div>
        <div className="flex-1 overflow-hidden">
          {trades.map((trade, i) => (
            <div key={i} className="flex px-3 py-[1px] text-[11px] font-mono-num">
              <span className={`flex-1 ${trade.isBuy ? 'text-green' : 'text-red'}`}>
                {fmt(trade.price, 1)}
              </span>
              <span className="flex-1 text-right text-[var(--text-muted)]">
                {trade.size}
              </span>
              <span className="flex-1 text-right text-[var(--text-muted)]">
                {trade.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
