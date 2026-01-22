import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Lock, Crown, Newspaper, Calendar } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { useTranslation } from '../../i18n';
import { LEVEL_CONFIG } from '../../types';

// 内容类型：新闻 或 研究员报告
type TickerItemType = 'news' | 'report';

interface TickerItem {
  id: string;
  type: TickerItemType;
  title: string;
  symbol?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  researcher?: string; // 研究员报告才有
  source?: string; // 新闻来源
  publishedAt: string;
  requiredLevel?: 'Gold' | 'Diamond'; // 报告才有等级要求
}

// Mock data: 新闻 + 研究员报告
const mockTickerItems: TickerItem[] = [
  // 新闻
  {
    id: 'n1',
    type: 'news',
    title: 'BlackRock Bitcoin ETF sees record $500M inflows',
    symbol: 'BTC',
    sentiment: 'bullish',
    source: 'CoinDesk',
    publishedAt: '10 min ago',
  },
  // 研究员报告 (VIP)
  {
    id: 'r1',
    type: 'report',
    title: 'BTC Technical Analysis: Key Support at $94,500',
    symbol: 'BTC',
    sentiment: 'bullish',
    researcher: 'Alex Chen',
    publishedAt: '2 hours ago',
    requiredLevel: 'Gold',
  },
  // 新闻
  {
    id: 'n2',
    type: 'news',
    title: 'Ethereum gas fees drop to 6-month low',
    symbol: 'ETH',
    sentiment: 'bullish',
    source: 'The Block',
    publishedAt: '25 min ago',
  },
  // 研究员报告 (VIP)
  {
    id: 'r2',
    type: 'report',
    title: 'ETH Layer 2 Ecosystem Deep Dive',
    symbol: 'ETH',
    sentiment: 'bullish',
    researcher: 'Sarah Wang',
    publishedAt: '3 hours ago',
    requiredLevel: 'Gold',
  },
  // 新闻
  {
    id: 'n3',
    type: 'news',
    title: 'SEC approves first spot Solana ETF application',
    symbol: 'SOL',
    sentiment: 'bullish',
    source: 'Bloomberg',
    publishedAt: '35 min ago',
  },
  // 研究员报告 (VIP)
  {
    id: 'r3',
    type: 'report',
    title: 'SOL Network Activity Surging - Detailed Analysis',
    symbol: 'SOL',
    sentiment: 'bullish',
    researcher: 'Mike Johnson',
    publishedAt: '5 hours ago',
    requiredLevel: 'Diamond',
  },
  // 新闻
  {
    id: 'n4',
    type: 'news',
    title: 'Major exchange reports $100M outflow amid market uncertainty',
    symbol: 'BTC',
    sentiment: 'bearish',
    source: 'CryptoSlate',
    publishedAt: '40 min ago',
  },
  // 研究员报告 (VIP)
  {
    id: 'r4',
    type: 'report',
    title: 'Macro Outlook: Fed Policy Impact on Crypto',
    symbol: 'MACRO',
    sentiment: 'neutral',
    researcher: 'Dr. James Lee',
    publishedAt: '6 hours ago',
    requiredLevel: 'Diamond',
  },
  // 新闻
  {
    id: 'n5',
    type: 'news',
    title: 'Whale alert: $500M BTC moved from unknown wallet',
    symbol: 'BTC',
    sentiment: 'neutral',
    source: 'Whale Alert',
    publishedAt: '45 min ago',
  },
  // 研究员报告 (VIP)
  {
    id: 'r5',
    type: 'report',
    title: 'DeFi Yield Strategies Q1 2026 Report',
    symbol: 'DeFi',
    sentiment: 'bullish',
    researcher: 'VIP Research Team',
    publishedAt: '12 hours ago',
    requiredLevel: 'Diamond',
  },
];

const SentimentIcon = ({ sentiment }: { sentiment?: 'bullish' | 'bearish' | 'neutral' }) => {
  switch (sentiment) {
    case 'bullish':
      return <TrendingUp size={12} className="text-[var(--brand-green)]" />;
    case 'bearish':
      return <TrendingDown size={12} className="text-[var(--brand-red)]" />;
    default:
      return <span className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />;
  }
};

const levelOrder = ['Bronze', 'Silver', 'Gold', 'Diamond'] as const;

interface ResearchReportsTickerProps {
  onOpenCalendar?: () => void;
  onOpenReport?: (reportId: string) => void;
  onOpenReportList?: () => void;
  onOpenNews?: (newsId: string) => void;
  onOpenNewsList?: () => void;
  currentSymbol?: string; // 当前交易对，用于筛选相关新闻/研报
}

export function ResearchReportsTicker({ onOpenCalendar, onOpenReport, onOpenReportList, onOpenNews, onOpenNewsList, currentSymbol }: ResearchReportsTickerProps) {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const tickerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [offset, setOffset] = useState(0);

  const userLevel = user?.level || 'Bronze';
  const userLevelIndex = user ? levelOrder.indexOf(userLevel) : -1;
  const hasResearcherAccess = user && userLevel ? LEVEL_CONFIG[userLevel]?.hasResearcherAccess : false;

  // 根据当前交易对筛选相关内容（优先显示相关的，其他的也显示）
  const filteredItems = currentSymbol
    ? [
        // 先显示与当前交易对相关的内容
        ...mockTickerItems.filter(item => {
          const symbolBase = currentSymbol.split('/')[0]; // 'BTC/USDT' -> 'BTC'
          return item.symbol === symbolBase;
        }),
        // 再显示其他内容
        ...mockTickerItems.filter(item => {
          const symbolBase = currentSymbol.split('/')[0];
          return item.symbol !== symbolBase;
        }),
      ]
    : mockTickerItems;

  const canAccessItem = (item: TickerItem) => {
    // 新闻对所有人可见
    if (item.type === 'news') return true;
    // 研究员报告需要等级
    if (!item.requiredLevel) return true;
    const requiredIndex = levelOrder.indexOf(item.requiredLevel);
    return userLevelIndex >= requiredIndex;
  };

  // Auto-scroll animation
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setOffset((prev) => prev + 1);
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Reset offset when it gets too large
  useEffect(() => {
    const contentWidth = tickerRef.current?.scrollWidth || 0;
    if (offset > contentWidth / 2) {
      setOffset(0);
    }
  }, [offset]);

  if (!user) return null;

  return (
    <div data-onboarding="reports" className="hidden md:flex h-10 md:h-12 bg-[var(--bg-panel)] border-t border-[var(--border-light)] items-center overflow-hidden">
      {/* VIP Lock Notice for non-Gold+ users - 简化版 */}
      {!hasResearcherAccess && (
        <div className="flex items-center gap-2 px-3 text-[11px] shrink-0 border-r border-[var(--border-light)] h-full bg-[var(--bg-surface)]">
          <Crown size={14} className="text-[var(--brand-yellow)]" />
          <span className="text-[var(--brand-yellow)] font-medium">{t('reports.upgradeToGold')}</span>
        </div>
      )}

      {/* Scrolling Ticker */}
      <div
        className="flex-1 overflow-hidden relative h-full flex items-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={tickerRef}
          className="flex items-center gap-6 whitespace-nowrap"
          style={{
            transform: `translateX(-${offset}px)`,
            willChange: 'transform',
          }}
        >
          {/* Duplicate items for seamless loop */}
          {[...filteredItems, ...filteredItems].map((item, index) => {
            const isLocked = !canAccessItem(item);
            const isReport = item.type === 'report';

            return (
              <div
                key={`${item.id}-${index}`}
                onClick={() => {
                  if (isReport && onOpenReport) {
                    // VIP 研报无论是否锁定都可以点击查看（锁定时会显示升级提示）
                    onOpenReport(item.id);
                  } else if (!isReport && onOpenNews) {
                    // 新闻点击预览
                    onOpenNews(item.id);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors cursor-pointer hover:bg-[var(--bg-surface)] hover:scale-[1.02] ${isLocked ? 'opacity-70' : ''}`}
              >
                {/* VIP Badge for Research Reports */}
                {isReport && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded text-[9px] font-bold text-black">
                    <Crown size={10} />
                    VIP
                  </span>
                )}

                {/* News Icon */}
                {!isReport && (
                  <Newspaper size={12} className="text-[var(--text-muted)]" />
                )}

                {/* Lock or Sentiment Icon */}
                {isLocked ? (
                  <Lock size={10} className="text-[var(--text-muted)]" />
                ) : (
                  <SentimentIcon sentiment={item.sentiment} />
                )}

                {/* Symbol Badge */}
                {item.symbol && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.sentiment === 'bullish'
                        ? 'bg-[var(--brand-green-dim)] text-[var(--brand-green)]'
                        : item.sentiment === 'bearish'
                        ? 'bg-[var(--brand-red-dim)] text-[var(--brand-red)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    }`}
                  >
                    {item.symbol}
                  </span>
                )}

                {/* Title */}
                <span className={`text-[12px] ${isLocked ? 'text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>
                  {isLocked ? '🔒 ' : ''}{item.title}
                </span>

                {/* Source/Author */}
                <span className="text-[10px] text-[var(--text-muted)]">
                  {isReport ? `by ${item.researcher}` : item.source}
                </span>

                {/* Time */}
                <span className="text-[10px] text-[var(--text-dim)]">
                  • {item.publishedAt}
                </span>

                {/* Level Badge for Reports */}
                {isReport && !isLocked && item.requiredLevel && (
                  <span
                    className="text-[8px] px-1 py-0.5 rounded border"
                    style={{
                      borderColor: LEVEL_CONFIG[item.requiredLevel].color,
                      color: LEVEL_CONFIG[item.requiredLevel].color,
                    }}
                  >
                    {item.requiredLevel}+
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center h-full shrink-0 border-l border-[var(--border-light)]">
        {/* 新闻按钮 */}
        <button
          onClick={onOpenNewsList}
          className="flex items-center gap-1.5 px-3 h-full hover:bg-[var(--bg-surface)] transition"
          title={t('reports.viewAllNews')}
        >
          <Newspaper size={14} className="text-[var(--text-muted)]" />
          <span className="text-[12px] text-[var(--text-muted)]">{t('reports.news')}</span>
          <span className="text-[12px] font-bold text-[var(--text-main)] bg-[var(--bg-app)] px-1.5 rounded">24</span>
        </button>

        {/* VIP研报按钮 */}
        <button
          onClick={onOpenReportList}
          className="flex items-center gap-1.5 px-3 h-full hover:bg-[var(--bg-surface)] transition border-l border-[var(--border-light)]"
          title={t('reports.viewAllReports')}
        >
          <Crown size={14} className="text-[var(--brand-yellow)]" />
          <span className="text-[12px] text-[var(--brand-yellow)]">VIP</span>
          <span className="text-[12px] font-bold text-[var(--brand-yellow)] bg-[var(--brand-yellow)]/10 px-1.5 rounded">5</span>
        </button>

        {/* 日历按钮 */}
        {onOpenCalendar && (
          <button
            onClick={onOpenCalendar}
            className="flex items-center gap-1.5 px-3 h-full hover:bg-[var(--bg-surface)] transition border-l border-[var(--border-light)]"
            title={t('calendar.viewCalendar')}
          >
            <Calendar size={14} className="text-[var(--brand-yellow)]" />
            <span className="text-[12px] text-[var(--text-muted)]">{t('calendar.title')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
