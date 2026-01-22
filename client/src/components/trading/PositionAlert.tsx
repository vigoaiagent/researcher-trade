import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, ChevronRight, AlertCircle, Newspaper } from 'lucide-react';
import { useTranslation } from '../../i18n';

// 模拟用户仓位数据
interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
}

// 模拟仓位数据
const mockPositions: Position[] = [
  { symbol: 'BTC/USDT', side: 'long', size: 0.5, entryPrice: 65000, leverage: 10, pnl: 1120, pnlPercent: 3.45 },
  { symbol: 'ETH/USDT', side: 'long', size: 5, entryPrice: 3300, leverage: 5, pnl: -234, pnlPercent: -1.42 },
  { symbol: 'SOL/USDT', side: 'short', size: 100, entryPrice: 150, leverage: 3, pnl: 380, pnlPercent: 2.53 },
];

// 模拟相关新闻数据
interface PositionNews {
  id: string;
  symbol: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  source: string;
  time: string;
  timeEn: string;
  isUrgent?: boolean;
}

const mockPositionNews: PositionNews[] = [
  {
    id: 'pn1',
    symbol: 'BTC/USDT',
    title: '美联储会议纪要显示鸽派信号',
    titleEn: 'Fed minutes show dovish signals',
    summary: '美联储最新会议纪要显示，多数委员支持在年内降息，风险资产或将受益。',
    summaryEn: 'Latest Fed minutes show most members favor rate cuts this year, benefiting risk assets.',
    sentiment: 'positive',
    impact: 'high',
    source: 'Reuters',
    time: '10分钟前',
    timeEn: '10 min ago',
    isUrgent: true,
  },
  {
    id: 'pn2',
    symbol: 'ETH/USDT',
    title: 'Vitalik 发布以太坊路线图更新',
    titleEn: 'Vitalik updates Ethereum roadmap',
    summary: 'Vitalik Buterin 详细介绍了以太坊未来两年的技术升级计划，包括 Danksharding 和账户抽象。',
    summaryEn: 'Vitalik Buterin detailed Ethereum’s next two-year upgrades, including Danksharding and account abstraction.',
    sentiment: 'positive',
    impact: 'medium',
    source: 'The Block',
    time: '25分钟前',
    timeEn: '25 min ago',
  },
  {
    id: 'pn3',
    symbol: 'SOL/USDT',
    title: 'Solana 网络出现短暂拥堵',
    titleEn: 'Solana sees brief network congestion',
    summary: 'Solana 网络在过去一小时内出现交易延迟，团队正在调查原因。',
    summaryEn: 'Solana saw transaction delays over the past hour; the team is investigating.',
    sentiment: 'negative',
    impact: 'high',
    source: 'CoinDesk',
    time: '5分钟前',
    timeEn: '5 min ago',
    isUrgent: true,
  },
  {
    id: 'pn4',
    symbol: 'BTC/USDT',
    title: '灰度 GBTC 净流入创新高',
    titleEn: 'Grayscale GBTC net inflows hit new high',
    summary: '灰度比特币信托基金连续第五天录得净流入，机构需求持续强劲。',
    summaryEn: 'Grayscale’s Bitcoin trust posted net inflows for a fifth straight day, showing strong institutional demand.',
    sentiment: 'positive',
    impact: 'medium',
    source: 'Bloomberg',
    time: '1小时前',
    timeEn: '1 hour ago',
  },
  {
    id: 'pn5',
    symbol: 'ETH/USDT',
    title: '某 DeFi 协议遭遇闪电贷攻击',
    titleEn: 'A DeFi protocol hit by a flash loan attack',
    summary: '一个以太坊上的 DeFi 协议遭遇闪电贷攻击，损失约 500 万美元。',
    summaryEn: 'An Ethereum DeFi protocol suffered a flash loan attack with about $5M in losses.',
    sentiment: 'negative',
    impact: 'medium',
    source: 'DeFi Llama',
    time: '45分钟前',
    timeEn: '45 min ago',
  },
];

interface PositionAlertProps {
  onOpenNews?: (newsId: string) => void;
}

export function PositionAlert({ onOpenNews }: PositionAlertProps) {
  const { t, language } = useTranslation();
  const [alerts, setAlerts] = useState<PositionNews[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  // 根据仓位筛选相关新闻
  useEffect(() => {
    const positionSymbols = mockPositions.map(p => p.symbol);
    const relevantNews = mockPositionNews.filter(news =>
      positionSymbols.includes(news.symbol) && !dismissedAlerts.has(news.id)
    );
    setAlerts(relevantNews);
  }, [dismissedAlerts]);

  const handleDismiss = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const handleDismissAll = () => {
    const allIds = alerts.map(a => a.id);
    setDismissedAlerts(prev => new Set([...prev, ...allIds]));
  };

  const getPosition = (symbol: string) => {
    return mockPositions.find(p => p.symbol === symbol);
  };

  const urgentAlerts = alerts.filter(a => a.isUrgent);
  const displayedAlerts = showAll ? alerts : alerts.slice(0, 3);
  const localizedTitle = (alert: PositionNews) => (language === 'zh' ? alert.title : alert.titleEn);
  const localizedSummary = (alert: PositionNews) => (language === 'zh' ? alert.summary : alert.summaryEn);
  const localizedTime = (alert: PositionNews) => (language === 'zh' ? alert.time : alert.timeEn);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 w-[360px] max-h-[70vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-panel)] border border-[var(--border-light)] border-b-0 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Newspaper size={18} className="text-[var(--brand-yellow)]" />
            {urgentAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--brand-red)] rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-[14px] font-medium text-[var(--text-main)]">
            {t('positionAlert.title')}
          </span>
          <span className="text-[12px] px-1.5 py-0.5 bg-[var(--bg-surface)] text-[var(--text-muted)] rounded">
            {alerts.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDismissAll}
            className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
          >
            {t('positionAlert.markAllRead')}
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-panel)] border-x border-[var(--border-light)]">
        {displayedAlerts.map((alert) => {
          const position = getPosition(alert.symbol);
          return (
            <div
              key={alert.id}
              onClick={() => onOpenNews?.(alert.id)}
              className={`relative p-4 border-b border-[var(--border-light)] cursor-pointer hover:bg-[var(--bg-surface)] transition ${
                alert.isUrgent ? 'bg-[var(--brand-yellow)]/5' : ''
              }`}
            >
              {/* Urgent Badge */}
              {alert.isUrgent && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-[var(--brand-yellow)]/20 rounded text-[10px] font-medium text-[var(--brand-yellow)]">
                  <AlertCircle size={10} />
                  {t('positionAlert.urgent')}
                </div>
              )}

              {/* Symbol & Position Info */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] font-bold px-1.5 py-0.5 bg-[var(--bg-surface)] text-[var(--text-main)] rounded">
                  {alert.symbol.split('/')[0]}
                </span>
                {position && (
                  <span className={`flex items-center gap-1 text-[11px] ${
                    position.side === 'long' ? 'text-[var(--brand-green)]' : 'text-[var(--brand-red)]'
                  }`}>
                    {position.side === 'long' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {t(`positionAlert.side.${position.side}`)} {position.leverage}x
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className="text-[14px] font-medium text-[var(--text-main)] leading-snug mb-1 pr-12">
                {localizedTitle(alert)}
              </h4>

              {/* Summary */}
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed line-clamp-2 mb-2">
                {localizedSummary(alert)}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between text-[11px] text-[var(--text-dim)]">
                <div className="flex items-center gap-2">
                  <span>{alert.source}</span>
                  <span>·</span>
                  <span>{localizedTime(alert)}</span>
                </div>
                <button
                  onClick={(e) => handleDismiss(alert.id, e)}
                  className="p-1 hover:bg-[var(--bg-highlight)] rounded transition"
                >
                  <X size={14} className="text-[var(--text-muted)]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {alerts.length > 3 && (
        <div className="px-4 py-3 bg-[var(--bg-panel)] border border-[var(--border-light)] border-t-0 rounded-b-xl">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full flex items-center justify-center gap-1 text-[13px] text-[var(--text-muted)] hover:text-[var(--brand-yellow)] transition"
          >
            {showAll
              ? t('positionAlert.collapse')
              : t('positionAlert.viewAll', { count: alerts.length })}
            <ChevronRight size={14} className={`transition-transform ${showAll ? 'rotate-90' : ''}`} />
          </button>
        </div>
      )}

      {alerts.length <= 3 && (
        <div className="h-3 bg-[var(--bg-panel)] border border-[var(--border-light)] border-t-0 rounded-b-xl" />
      )}
    </div>
  );
}

// 导出一个 hook 用于在 App 中控制显示
export function usePositionAlerts() {
  const [showAlerts, setShowAlerts] = useState(true);
  const [hasPositions] = useState(true); // 模拟有仓位

  const toggleAlerts = () => setShowAlerts(prev => !prev);
  const hideAlerts = () => setShowAlerts(false);

  return {
    showAlerts: showAlerts && hasPositions,
    toggleAlerts,
    hideAlerts,
  };
}
