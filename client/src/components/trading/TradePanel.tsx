import { useState } from 'react';
import { HelpCircle, Zap, Rocket } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { FEE_RATES, getSoSoBoost } from '../../types';

interface TradePanelProps {
  price: number;
}

const fmt = (num: number, digits = 2) =>
  num.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function TradePanel({ price }: TradePanelProps) {
  const { user, simulateTrade } = useUserStore();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market' | 'stop'>('limit');
  const [sliderValue, setSliderValue] = useState(0);

  // 模拟交易状态
  const [simTradeType, setSimTradeType] = useState<'spot' | 'futures'>('spot');
  const [simTradeSide, setSimTradeSide] = useState<'maker' | 'taker'>('taker');
  const [simTradeVolume, setSimTradeVolume] = useState('');

  const handleQuickSimTrade = (volume: number) => {
    simulateTrade(volume, simTradeType, simTradeSide);
  };

  const handleCustomSimTrade = () => {
    const volume = parseFloat(simTradeVolume);
    if (volume > 0) {
      simulateTrade(volume, simTradeType, simTradeSide);
      setSimTradeVolume('');
    }
  };

  const isBuy = side === 'buy';
  const accentColor = isBuy ? 'var(--brand-green)' : 'var(--brand-red)';

  return (
    <div className="w-[300px] bg-[var(--bg-panel)] flex flex-col shrink-0 border-r border-[var(--border-light)]">
      {/* Buy/Sell Tabs */}
      <div className="flex p-3 gap-2">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-2 rounded-[4px] font-bold text-[13px] transition-all ${
            isBuy
              ? 'bg-[var(--brand-green)] text-white'
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 py-2 rounded-[4px] font-bold text-[13px] transition-all ${
            !isBuy
              ? 'bg-[var(--brand-red)] text-white'
              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Order Type */}
      <div className="px-3 flex items-center gap-3 text-[11px] text-[var(--text-muted)] mb-3">
        {(['limit', 'market', 'stop'] as const).map((type) => (
          <span
            key={type}
            onClick={() => setOrderType(type)}
            className={`px-2 py-1 rounded cursor-pointer transition-colors capitalize ${
              orderType === type
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)]'
                : 'hover:text-[var(--text-main)]'
            }`}
          >
            {type === 'stop' ? 'Stop Limit' : type}
          </span>
        ))}
        <HelpCircle size={12} className="ml-auto" />
      </div>

      {/* Form */}
      <div className="px-3 space-y-3 flex-1">
        {/* Available Balance */}
        <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
          <span>Avail</span>
          <span className="text-[var(--text-value)] font-mono-num">
            {fmt(100000)} USDT
          </span>
        </div>

        {/* Price Input */}
        <div className="bg-[var(--bg-surface)] rounded-[4px] flex items-center px-2 py-2 border border-transparent focus-within:border-[var(--brand-yellow)] transition-colors">
          <span className="text-[var(--text-muted)] text-[12px] w-12">Price</span>
          <input
            type="text"
            defaultValue={fmt(price)}
            className="bg-transparent flex-1 text-right text-[var(--text-value)] font-mono-num focus:outline-none text-[13px]"
          />
          <span className="text-[var(--text-muted)] text-[12px] ml-2">USDT</span>
        </div>

        {/* Size Input */}
        <div className="bg-[var(--bg-surface)] rounded-[4px] flex items-center px-2 py-2 border border-transparent focus-within:border-[var(--brand-yellow)] transition-colors">
          <span className="text-[var(--text-muted)] text-[12px] w-12">Size</span>
          <input
            type="text"
            placeholder="0.00"
            className="bg-transparent flex-1 text-right text-[var(--text-value)] font-mono-num focus:outline-none text-[13px] placeholder:text-[var(--text-dim)]"
          />
          <span className="text-[var(--text-muted)] text-[12px] ml-2">BTC</span>
        </div>

        {/* Slider */}
        <div className="pt-1 pb-1">
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full h-1 bg-[var(--bg-surface)] rounded appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${sliderValue}%, var(--bg-surface) ${sliderValue}%, var(--bg-surface) 100%)`,
            }}
          />
          <div className="flex justify-between mt-1 text-[10px] text-[var(--text-muted)]">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* TP/SL Toggle */}
        <div className="flex justify-between text-[11px] text-[var(--text-muted)] items-center">
          <span>TP/SL</span>
          <div className="w-8 h-4 bg-[var(--bg-surface)] rounded-full relative cursor-pointer">
            <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-[var(--text-muted)] rounded-full transition-transform"></div>
          </div>
        </div>

        {/* Action Button */}
        <button
          className="w-full py-3 font-bold rounded-[4px] text-[14px] hover:opacity-90 transition-opacity text-white"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 4px 15px ${isBuy ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)'}`,
          }}
        >
          {isBuy ? 'Buy' : 'Sell'} BTC
        </button>

        {/* Order Info */}
        <div className="space-y-1 pt-2 border-t border-[var(--border-light)]">
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">Cost</span>
            <span className="text-[var(--text-value)] font-mono-num">0.00 USDT</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">Max</span>
            <span className="text-[var(--text-value)] font-mono-num">{fmt(100000 / price, 4)} BTC</span>
          </div>
        </div>
      </div>

      {/* Trade Simulation Section */}
      {user && (
        <div className="mt-auto border-t border-[var(--border-light)] p-3 bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 mb-3">
            <Rocket size={14} className="text-[var(--brand-yellow)]" />
            <span className="text-[12px] font-bold text-[var(--text-main)]">模拟交易</span>
            <span className="text-[10px] text-[var(--text-muted)]">获取能量</span>
          </div>

          {/* Trade Type & Side */}
          <div className="flex gap-2 mb-2">
            <select
              value={simTradeType}
              onChange={(e) => setSimTradeType(e.target.value as 'spot' | 'futures')}
              className="flex-1 text-[11px] bg-[var(--bg-panel)] text-[var(--text-main)] rounded px-2 py-1.5 border-none focus:outline-none"
            >
              <option value="spot">现货 ({(FEE_RATES.spot.taker * 100).toFixed(2)}%)</option>
              <option value="futures">合约 ({(FEE_RATES.futures.taker * 100).toFixed(3)}%)</option>
            </select>
            <select
              value={simTradeSide}
              onChange={(e) => setSimTradeSide(e.target.value as 'maker' | 'taker')}
              className="flex-1 text-[11px] bg-[var(--bg-panel)] text-[var(--text-main)] rounded px-2 py-1.5 border-none focus:outline-none"
            >
              <option value="taker">Taker</option>
              <option value="maker">Maker</option>
            </select>
          </div>

          {/* Quick Trade Buttons */}
          <div className="flex gap-1.5 mb-2">
            {[10000, 50000, 100000].map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickSimTrade(amount)}
                className="flex-1 py-1.5 text-[11px] bg-[var(--bg-panel)] text-[var(--text-main)] rounded hover:bg-[var(--brand-green)] hover:text-white transition-colors font-medium"
              >
                ${amount >= 1000 ? `${amount / 1000}k` : amount}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="flex gap-2">
            <input
              type="number"
              value={simTradeVolume}
              onChange={(e) => setSimTradeVolume(e.target.value)}
              placeholder="自定义 (USDT)"
              className="flex-1 bg-[var(--bg-panel)] text-[var(--text-main)] text-[11px] px-2 py-1.5 rounded border border-transparent focus:border-[var(--brand-yellow)] focus:outline-none"
            />
            <button
              onClick={handleCustomSimTrade}
              className="px-3 py-1.5 text-[11px] bg-[var(--brand-green)] text-white rounded hover:opacity-90 transition-opacity font-bold"
            >
              交易
            </button>
          </div>

          {/* Preview */}
          {simTradeVolume && parseFloat(simTradeVolume) > 0 && (() => {
            const volume = parseFloat(simTradeVolume);
            const fee = volume * FEE_RATES[simTradeType][simTradeSide];
            const boost = getSoSoBoost(user.sosoHolding ?? 0);
            const energyMinted = fee * (1 + boost);

            return (
              <div className="mt-2 text-[10px] text-[var(--text-muted)] bg-[var(--bg-panel)] rounded p-2">
                <div className="flex justify-between">
                  <span>预计手续费</span>
                  <span className="text-[var(--brand-yellow)]">${fmt(fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>预计能量</span>
                  <span className="text-[var(--brand-green)] font-bold flex items-center gap-1">
                    <Zap size={10} />+{fmt(energyMinted)}
                    {boost > 0 && <span className="text-[var(--brand-yellow)]">(+{(boost * 100).toFixed(0)}%)</span>}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
