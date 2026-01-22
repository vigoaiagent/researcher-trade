import { useState, useRef, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, ExternalLink, Bell, BellOff, Search } from 'lucide-react';
import { useTranslation } from '../../i18n';

// 新闻源
const newsSources = [
  { id: 'coindesk', name: 'CoinDesk', logo: '📰' },
  { id: 'theblock', name: 'The Block', logo: '📊' },
  { id: 'bloomberg', name: 'Bloomberg Crypto', logo: '💹' },
  { id: 'cryptoslate', name: 'CryptoSlate', logo: '🔷' },
  { id: 'whalealert', name: 'Whale Alert', logo: '🐋' },
  { id: 'cointelegraph', name: 'Cointelegraph', logo: '📡' },
];

// 所有新闻数据
const allNews = [
  {
    id: 'n1',
    title: 'BlackRock Bitcoin ETF sees record $500M inflows',
    symbol: 'BTC',
    sentiment: 'bullish' as const,
    source: 'coindesk',
    sourceName: 'CoinDesk',
    publishedAt: '10 min ago',
    summary: 'BlackRock iShares Bitcoin Trust 创下单日最大流入记录。',
    summaryEn: 'BlackRock iShares Bitcoin Trust logged its largest single-day inflow on record.',
  },
  {
    id: 'n2',
    title: 'Ethereum gas fees drop to 6-month low',
    symbol: 'ETH',
    sentiment: 'bullish' as const,
    source: 'theblock',
    sourceName: 'The Block',
    publishedAt: '25 min ago',
    summary: '以太坊网络 Gas 费降至六个月低点，利好 DeFi 用户。',
    summaryEn: 'Ethereum gas fees fell to a six-month low, benefiting DeFi users.',
  },
  {
    id: 'n3',
    title: 'SEC approves first spot Solana ETF application',
    symbol: 'SOL',
    sentiment: 'bullish' as const,
    source: 'bloomberg',
    sourceName: 'Bloomberg',
    publishedAt: '35 min ago',
    summary: 'SEC 批准首个 Solana 现货 ETF 申请，山寨币市场迎来利好。',
    summaryEn: 'The SEC approved the first spot Solana ETF application, boosting altcoin sentiment.',
  },
  {
    id: 'n4',
    title: 'Major exchange reports $100M outflow amid market uncertainty',
    symbol: 'BTC',
    sentiment: 'bearish' as const,
    source: 'cryptoslate',
    sourceName: 'CryptoSlate',
    publishedAt: '40 min ago',
    summary: '大型交易所报告 1 亿美元资金流出，市场不确定性增加。',
    summaryEn: 'A major exchange reported a $100M outflow, adding to market uncertainty.',
  },
  {
    id: 'n5',
    title: 'Whale alert: $500M BTC moved from unknown wallet',
    symbol: 'BTC',
    sentiment: 'neutral' as const,
    source: 'whalealert',
    sourceName: 'Whale Alert',
    publishedAt: '45 min ago',
    summary: '巨鲸警报：5 亿美元 BTC 从未知钱包转出。',
    summaryEn: 'Whale alert: $500M BTC moved from an unknown wallet.',
  },
  {
    id: 'n6',
    title: 'Bitcoin mining difficulty reaches all-time high',
    symbol: 'BTC',
    sentiment: 'neutral' as const,
    source: 'cointelegraph',
    sourceName: 'Cointelegraph',
    publishedAt: '1 hour ago',
    summary: '比特币挖矿难度创历史新高，算力持续增长。',
    summaryEn: 'Bitcoin mining difficulty hit an all-time high as hashrate keeps rising.',
  },
  {
    id: 'n7',
    title: 'Ethereum Foundation announces major protocol upgrade',
    symbol: 'ETH',
    sentiment: 'bullish' as const,
    source: 'coindesk',
    sourceName: 'CoinDesk',
    publishedAt: '2 hours ago',
    summary: '以太坊基金会宣布重大协议升级计划。',
    summaryEn: 'The Ethereum Foundation announced a major protocol upgrade plan.',
  },
  {
    id: 'n8',
    title: 'Solana DEX volume surpasses Ethereum for first time',
    symbol: 'SOL',
    sentiment: 'bullish' as const,
    source: 'theblock',
    sourceName: 'The Block',
    publishedAt: '3 hours ago',
    summary: 'Solana DEX 交易量首次超越以太坊。',
    summaryEn: 'Solana DEX volume surpassed Ethereum for the first time.',
  },
];

const SentimentBadge = ({ sentiment }: { sentiment: 'bullish' | 'bearish' | 'neutral' }) => {
  const { t } = useTranslation();
  const config = {
    bullish: { icon: TrendingUp, color: 'var(--brand-green)', label: t('sentiment.bullish') },
    bearish: { icon: TrendingDown, color: 'var(--brand-red)', label: t('sentiment.bearish') },
    neutral: { icon: null, color: 'var(--text-muted)', label: t('sentiment.neutral') },
  };
  const { icon: Icon, color, label } = config[sentiment];
  return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: `${color}20`, color }}>
      {Icon && <Icon size={10} />}
      {label}
    </span>
  );
};

interface NewsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNews: (newsId: string) => void;
  currentSymbol?: string;
}

export function NewsListModal({ isOpen, onClose, onSelectNews, currentSymbol = 'BTC' }: NewsListModalProps) {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'related' | 'subscribed'>('related');
  const [subscribedSources, setSubscribedSources] = useState<Set<string>>(new Set(['coindesk', 'whalealert']));
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleSource = (sourceId: string) => {
    setSubscribedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  };

  // 筛选新闻
  const filteredNews = allNews.filter(news => {
    // 搜索过滤
    if (searchQuery && !news.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (activeTab === 'related') {
      // 相关新闻：按当前交易对筛选
      return news.symbol === currentSymbol;
    } else {
      // 订阅新闻：按订阅的新闻源筛选
      return subscribedSources.has(news.source);
    }
  });

  const handleSelectNews = (newsId: string) => {
    onSelectNews(newsId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-light)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-[var(--text-main)]">{t('newsListModal.title')}</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--bg-surface)] rounded-lg transition-colors"
            >
              <X size={18} className="text-[var(--text-muted)]" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[var(--bg-surface)] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('related')}
              className={`flex-1 py-2 px-3 rounded-md text-[13px] font-medium transition-colors ${
                activeTab === 'related'
                  ? 'bg-[var(--bg-panel)] text-[var(--text-main)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {t('newsListModal.relatedTab', { symbol: currentSymbol })}
            </button>
            <button
              onClick={() => setActiveTab('subscribed')}
              className={`flex-1 py-2 px-3 rounded-md text-[13px] font-medium transition-colors ${
                activeTab === 'subscribed'
                  ? 'bg-[var(--bg-panel)] text-[var(--text-main)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {t('newsListModal.subscribedTab')}
            </button>
          </div>

          {/* Search */}
          <div className="mt-3 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('newsListModal.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg text-[13px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'subscribed' && (
            /* 订阅的新闻源 */
            <div className="p-4 border-b border-[var(--border-light)] bg-[var(--bg-surface)]">
              <div className="text-[12px] text-[var(--text-muted)] mb-2">{t('newsListModal.subscribedSources')}</div>
              <div className="flex flex-wrap gap-2">
                {newsSources.map(source => (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors ${
                      subscribedSources.has(source.id)
                        ? 'bg-[var(--brand-yellow)]/20 text-[var(--brand-yellow)] border border-[var(--brand-yellow)]/30'
                        : 'bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-light)] hover:border-[var(--brand-yellow)]/50'
                    }`}
                  >
                    <span>{source.logo}</span>
                    <span>{source.name}</span>
                    {subscribedSources.has(source.id) ? (
                      <Bell size={12} />
                    ) : (
                      <BellOff size={12} className="opacity-50" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* News List */}
          <div className="p-4 space-y-3">
            {filteredNews.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">
                {activeTab === 'related'
                  ? t('newsListModal.emptyRelated', { symbol: currentSymbol })
                  : t('newsListModal.emptySubscribed')}
              </div>
            ) : (
              filteredNews.map(news => (
                <div
                  key={news.id}
                  onClick={() => handleSelectNews(news.id)}
                  className="p-3 bg-[var(--bg-surface)] rounded-lg hover:bg-[var(--bg-highlight)] transition-colors cursor-pointer"
                >
                  {/* Top Row */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      news.sentiment === 'bullish'
                        ? 'bg-[var(--brand-green-dim)] text-[var(--brand-green)]'
                        : news.sentiment === 'bearish'
                        ? 'bg-[var(--brand-red-dim)] text-[var(--brand-red)]'
                        : 'bg-[var(--bg-app)] text-[var(--text-muted)]'
                    }`}>
                      {news.symbol}
                    </span>
                    <SentimentBadge sentiment={news.sentiment} />
                    <span className="text-[10px] text-[var(--text-dim)] ml-auto">{news.publishedAt}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[13px] font-medium text-[var(--text-main)] mb-1.5 line-clamp-2">
                    {news.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-[12px] text-[var(--text-muted)] mb-2 line-clamp-1">
                    {language === 'zh' ? news.summary : news.summaryEn}
                  </p>

                  {/* Source */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-dim)]">
                    <ExternalLink size={10} />
                    <span>{news.sourceName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--border-light)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-dim)]">
            <span>{t('newsListModal.footerCount', { count: filteredNews.length })}</span>
            <span>{t('newsListModal.footerHint')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
