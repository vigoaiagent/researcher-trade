import { useState, useRef, useEffect } from 'react';
import { X, Crown, TrendingUp, TrendingDown, Lock, Clock, User, Bell, BellOff, Search } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { LEVEL_CONFIG } from '../../types';
import type { UserLevel } from '../../types';
import { useTranslation } from '../../i18n';

// 研究员数据
const researchers = [
  { id: 'alex', name: 'Alex Chen', nameEn: 'Alex Chen', avatar: '👨‍💼', specialty: '技术分析', specialtyEn: 'Technical Analysis' },
  { id: 'sarah', name: 'Sarah Wang', nameEn: 'Sarah Wang', avatar: '👩‍💻', specialty: 'L2 生态', specialtyEn: 'L2 Ecosystem' },
  { id: 'mike', name: 'Mike Johnson', nameEn: 'Mike Johnson', avatar: '👨‍🔬', specialty: 'Solana 生态', specialtyEn: 'Solana Ecosystem' },
  { id: 'james', name: 'Dr. James Lee', nameEn: 'Dr. James Lee', avatar: '👨‍🎓', specialty: '宏观经济', specialtyEn: 'Macro Economy' },
  { id: 'team', name: 'VIP Research Team', nameEn: 'VIP Research Team', avatar: '🏆', specialty: 'DeFi 策略', specialtyEn: 'DeFi Strategies' },
];

// 研报数据
type Sentiment = 'bullish' | 'bearish' | 'neutral';

const allReports: Array<{
  id: string;
  title: string;
  symbol: string;
  sentiment: Sentiment;
  researcher: string;
  researcherId: string;
  publishedAt: string;
  requiredLevel: 'Gold' | 'Diamond';
  summary: string;
  summaryEn: string;
  isRecommended: boolean;
}> = [
  {
    id: 'r1',
    title: 'BTC Technical Analysis: Key Support at $94,500',
    symbol: 'BTC',
    sentiment: 'bullish',
    researcher: 'Alex Chen',
    researcherId: 'alex',
    publishedAt: '2 hours ago',
    requiredLevel: 'Gold' as const,
    summary: '比特币近期技术面显示强劲支撑位在 $94,500，多头趋势有望延续。',
    summaryEn: 'BTC’s technicals show strong support around $94,500, with the uptrend likely intact.',
    isRecommended: true,
  },
  {
    id: 'r2',
    title: 'ETH Layer 2 Ecosystem Deep Dive',
    symbol: 'ETH',
    sentiment: 'bullish',
    researcher: 'Sarah Wang',
    researcherId: 'sarah',
    publishedAt: '3 hours ago',
    requiredLevel: 'Gold' as const,
    summary: '以太坊 L2 生态持续繁荣，Arbitrum 和 Base 领跑市场。',
    summaryEn: 'Ethereum L2s continue to thrive, with Arbitrum and Base leading the market.',
    isRecommended: true,
  },
  {
    id: 'r3',
    title: 'SOL Network Activity Surging - Detailed Analysis',
    symbol: 'SOL',
    sentiment: 'bullish',
    researcher: 'Mike Johnson',
    researcherId: 'mike',
    publishedAt: '5 hours ago',
    requiredLevel: 'Diamond' as const,
    summary: 'Solana 网络活动激增，日交易量创历史新高，生态发展势头强劲。',
    summaryEn: 'Solana activity is surging with record daily volume, signaling strong ecosystem momentum.',
    isRecommended: false,
  },
  {
    id: 'r4',
    title: 'Macro Outlook: Fed Policy Impact on Crypto',
    symbol: 'MACRO',
    sentiment: 'neutral',
    researcher: 'Dr. James Lee',
    researcherId: 'james',
    publishedAt: '6 hours ago',
    requiredLevel: 'Diamond' as const,
    summary: '美联储政策转向在即，对加密市场的影响分析。',
    summaryEn: 'Analysis of how a Fed policy pivot could impact crypto markets.',
    isRecommended: true,
  },
  {
    id: 'r5',
    title: 'DeFi Yield Strategies Q1 2026 Report',
    symbol: 'DeFi',
    sentiment: 'bullish',
    researcher: 'VIP Research Team',
    researcherId: 'team',
    publishedAt: '12 hours ago',
    requiredLevel: 'Diamond' as const,
    summary: 'DeFi 收益策略深度报告，精选高收益低风险机会。',
    summaryEn: 'A deep dive into DeFi yield strategies highlighting high‑return, lower‑risk setups.',
    isRecommended: false,
  },
];

const SentimentIcon = ({ sentiment }: { sentiment: 'bullish' | 'bearish' | 'neutral' }) => {
  switch (sentiment) {
    case 'bullish':
      return <TrendingUp size={14} className="text-[var(--brand-green)]" />;
    case 'bearish':
      return <TrendingDown size={14} className="text-[var(--brand-red)]" />;
    default:
      return <span className="w-3 h-3 rounded-full bg-[var(--text-muted)]" />;
  }
};

interface ResearchReportListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (reportId: string) => void;
}

export function ResearchReportListModal({ isOpen, onClose, onSelectReport }: ResearchReportListModalProps) {
  const { t, language } = useTranslation();
  const { user } = useUserStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'recommended' | 'subscribed'>('recommended');
  const [subscribedResearchers, setSubscribedResearchers] = useState<Set<string>>(new Set(['alex', 'james']));
  const [searchQuery, setSearchQuery] = useState('');

  const userLevel = (user?.level || 'Bronze') as UserLevel;
  const levelOrder = ['Bronze', 'Silver', 'Gold', 'Diamond'] as const;
  const userLevelIndex = levelOrder.indexOf(userLevel);

  const canAccess = (requiredLevel: 'Gold' | 'Diamond') => {
    return userLevelIndex >= levelOrder.indexOf(requiredLevel);
  };

  const toggleResearcher = (researcherId: string) => {
    setSubscribedResearchers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(researcherId)) {
        newSet.delete(researcherId);
      } else {
        newSet.add(researcherId);
      }
      return newSet;
    });
  };

  // 筛选研报
  const filteredReports = allReports.filter(report => {
    // 搜索过滤
    if (searchQuery && !report.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (activeTab === 'recommended') {
      return report.isRecommended;
    } else {
      return subscribedResearchers.has(report.researcherId);
    }
  });

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

  const handleSelectReport = (reportId: string) => {
    onSelectReport(reportId);
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
            <div className="flex items-center gap-2">
              <Crown size={20} className="text-[var(--brand-yellow)]" />
              <h2 className="text-[16px] font-bold text-[var(--text-main)]">{t('reportListModal.title')}</h2>
            </div>
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
              onClick={() => setActiveTab('recommended')}
              className={`flex-1 py-2 px-3 rounded-md text-[13px] font-medium transition-colors ${
                activeTab === 'recommended'
                  ? 'bg-[var(--bg-panel)] text-[var(--text-main)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {t('reportListModal.recommended')}
            </button>
            <button
              onClick={() => setActiveTab('subscribed')}
              className={`flex-1 py-2 px-3 rounded-md text-[13px] font-medium transition-colors ${
                activeTab === 'subscribed'
                  ? 'bg-[var(--bg-panel)] text-[var(--text-main)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {t('reportListModal.subscribed')}
            </button>
          </div>

          {/* Search */}
          <div className="mt-3 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('reportListModal.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg text-[13px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--brand-yellow)]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'subscribed' && (
            /* 订阅的研究员 */
            <div className="p-4 border-b border-[var(--border-light)] bg-[var(--bg-surface)]">
              <div className="text-[12px] text-[var(--text-muted)] mb-2">{t('reportListModal.subscribedResearchers')}</div>
              <div className="flex flex-wrap gap-2">
                {researchers.map(researcher => (
                  <button
                    key={researcher.id}
                    onClick={() => toggleResearcher(researcher.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors ${
                      subscribedResearchers.has(researcher.id)
                        ? 'bg-[var(--brand-yellow)]/20 text-[var(--brand-yellow)] border border-[var(--brand-yellow)]/30'
                        : 'bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-light)] hover:border-[var(--brand-yellow)]/50'
                    }`}
                  >
                    <span>{researcher.avatar}</span>
                    <span>{language === 'zh' ? researcher.name : (researcher.nameEn || researcher.name)}</span>
                    {subscribedResearchers.has(researcher.id) ? (
                      <Bell size={12} />
                    ) : (
                      <BellOff size={12} className="opacity-50" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Report List */}
          <div className="p-4 space-y-3">
            {filteredReports.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">
                {activeTab === 'recommended'
                  ? t('reportListModal.emptyRecommended')
                  : t('reportListModal.emptySubscribed')}
              </div>
            ) : (
              filteredReports.map((report) => {
                const isLocked = !canAccess(report.requiredLevel);

                return (
                  <div
                    key={report.id}
                    onClick={() => handleSelectReport(report.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isLocked
                        ? 'border-[var(--border-light)] bg-[var(--bg-surface)] opacity-80 hover:opacity-100'
                        : 'border-[var(--brand-yellow)]/30 bg-gradient-to-r from-[var(--brand-yellow)]/5 to-transparent hover:from-[var(--brand-yellow)]/10'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded text-[9px] font-bold text-black">
                        <Crown size={10} />
                        {t('reportListModal.vipLabel')}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        report.sentiment === 'bullish'
                          ? 'bg-[var(--brand-green-dim)] text-[var(--brand-green)]'
                          : report.sentiment === 'bearish'
                          ? 'bg-[var(--brand-red-dim)] text-[var(--brand-red)]'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                      }`}>
                        {report.symbol}
                      </span>
                      <SentimentIcon sentiment={report.sentiment} />
                      {isLocked && <Lock size={12} className="text-[var(--text-muted)] ml-auto" />}
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded border ml-auto"
                        style={{
                          borderColor: LEVEL_CONFIG[report.requiredLevel].color,
                          color: LEVEL_CONFIG[report.requiredLevel].color,
                        }}
                      >
                        {report.requiredLevel}+
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-[14px] font-medium text-[var(--text-main)] mb-2 line-clamp-2">
                      {report.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-[12px] text-[var(--text-muted)] mb-3 line-clamp-2">
                      {language === 'zh' ? report.summary : report.summaryEn}
                    </p>

                    {/* Bottom Row */}
                    <div className="flex items-center gap-3 text-[11px] text-[var(--text-dim)]">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {report.researcher}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {report.publishedAt}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--border-light)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">
              {t('reportListModal.footerCount', { count: filteredReports.length })}
            </span>
            <span className="text-[var(--text-dim)]">
              {t('reportListModal.currentLevel')}
              <span style={{ color: LEVEL_CONFIG[userLevel].color }}>{userLevel}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
