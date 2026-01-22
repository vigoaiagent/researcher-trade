import { useState, useRef, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Clock, ExternalLink, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../i18n';

// 新闻详情数据
const newsDetails: Record<string, {
  id: string;
  title: string;
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  source: string;
  publishedAt: string;
  content: string;
  aiInterpretation: string[];
  aiInterpretationEn: string[];
}> = {
  'n1': {
    id: 'n1',
    title: 'BlackRock Bitcoin ETF sees record $500M inflows',
    symbol: 'BTC',
    sentiment: 'bullish',
    source: 'CoinDesk',
    publishedAt: '10 min ago',
    content: `BlackRock's iShares Bitcoin Trust (IBIT) recorded its largest single-day inflow since launch, with over $500 million flowing into the fund on Monday.

This marks a significant milestone for institutional Bitcoin adoption, as the total assets under management for IBIT now exceeds $25 billion.

Market analysts suggest this surge in institutional interest could be driven by:
- Increasing corporate treasury diversification
- Hedge funds seeking uncorrelated assets
- Growing acceptance of Bitcoin as "digital gold"

The inflow comes amid a broader trend of institutional adoption, with several major banks now offering Bitcoin custody services to their clients.`,
    aiInterpretation: [
      '这是一则重大利好消息。贝莱德ETF单日净流入5亿美元创历史新高，表明机构资金正在加速入场。',
      '从资金流向看，机构对BTC的配置需求持续增长，这为价格提供了强有力的支撑。',
      '建议关注：如果ETF持续大额流入，短期内BTC可能测试前高。可考虑逢低布局。',
      '风险提示：需注意ETF流入可能存在短期波动，不宜追高，建议分批建仓。',
    ],
    aiInterpretationEn: [
      'This is a strong bullish signal: BlackRock’s ETF logged a record $500M single‑day inflow, showing accelerating institutional demand.',
      'Flows indicate sustained allocation appetite for BTC, which provides meaningful price support.',
      'Watch for continued ETF inflows—BTC could retest recent highs; consider scaling in on dips.',
      'Risk note: ETF flows can be volatile in the short term; avoid chasing and build positions gradually.',
    ],
  },
  'n2': {
    id: 'n2',
    title: 'Ethereum gas fees drop to 6-month low',
    symbol: 'ETH',
    sentiment: 'bullish',
    source: 'The Block',
    publishedAt: '25 min ago',
    content: `Ethereum network gas fees have dropped to their lowest levels in six months, averaging just 8 gwei for standard transactions.

This decrease is attributed to:
- Successful Layer 2 adoption diverting transactions
- Improved network efficiency post-Dencun upgrade
- Reduced NFT trading activity

The lower fees are making Ethereum more accessible for DeFi users, potentially driving increased activity on the mainnet.

Several analysts note this could lead to renewed interest in Ethereum-based applications and protocols.`,
    aiInterpretation: [
      'Gas费下降是ETH生态的利好信号，说明L2扩容方案正在有效分流主网压力。',
      '低Gas费环境有利于DeFi用户活动增加，可能带动ETH生态整体活跃度提升。',
      '从技术面看，这意味着ETH网络正在变得更加高效和用户友好。',
      '投资建议：可关注ETH生态中的优质DeFi协议，低Gas费环境下用户体验将大幅改善。',
    ],
    aiInterpretationEn: [
      'Lower gas is bullish for ETH, signaling L2 scaling is effectively relieving mainnet congestion.',
      'Cheaper fees can boost DeFi activity and overall ecosystem engagement.',
      'From a tech perspective, ETH is becoming more efficient and user‑friendly.',
      'Idea: watch high‑quality DeFi protocols as lower fees can significantly improve UX.',
    ],
  },
  'n3': {
    id: 'n3',
    title: 'SEC approves first spot Solana ETF application',
    symbol: 'SOL',
    sentiment: 'bullish',
    source: 'Bloomberg',
    publishedAt: '35 min ago',
    content: `The U.S. Securities and Exchange Commission has approved the first spot Solana ETF application, marking a significant milestone for the altcoin market.

The approval follows months of deliberation and comes after the successful launch of Bitcoin and Ethereum ETFs earlier this year.

Key implications:
- Opens the door for institutional Solana investment
- Sets precedent for other altcoin ETF applications
- Could drive significant capital inflows to SOL

Market participants are now speculating on which cryptocurrency might be next in line for ETF approval.`,
    aiInterpretation: [
      '重磅利好！SOL ETF获批意味着美国监管对山寨币态度转变，机构资金通道打开。',
      '这可能引发"山寨ETF"申请潮，XRP、ADA等热门币种可能是下一批申请对象。',
      'SOL短期可能迎来一波拉升，但需注意获批后"卖事实"的风险。',
      '建议策略：可适当布局SOL，但仓位不宜过重。关注ETF正式上线后的资金流入情况。',
    ],
    aiInterpretationEn: [
      'Major bullish catalyst: SOL ETF approval signals a regulatory shift and opens an institutional channel.',
      'This could trigger a wave of altcoin ETF filings—XRP and ADA may be next.',
      'SOL could rally near‑term, but watch for “sell‑the‑news” risk after approval.',
      'Strategy: build a measured position and track inflows once the ETF goes live.',
    ],
  },
  'n4': {
    id: 'n4',
    title: 'Major exchange reports $100M outflow amid market uncertainty',
    symbol: 'BTC',
    sentiment: 'bearish',
    source: 'CryptoSlate',
    publishedAt: '40 min ago',
    content: `A major cryptocurrency exchange has reported significant outflows totaling over $100 million in the past 24 hours, raising concerns about market sentiment.

The outflows are primarily in Bitcoin and Ethereum, with users moving funds to self-custody solutions.

Analysts attribute this to:
- Growing concerns over exchange security
- Regulatory uncertainty in key markets
- Profit-taking after recent price gains

The exchange has assured users that operations remain normal and all withdrawals are being processed without delays.`,
    aiInterpretation: [
      '交易所大额资金流出可能是看空信号，显示部分投资者正在降低风险敞口。',
      '但也可以理解为用户安全意识提高，选择自托管而非担心市场走势。',
      '需要结合其他数据判断：如果多家交易所同时出现大额流出，需要提高警惕。',
      '建议：短期保持观望，关注后续市场动向。如果是获利了结导致，回调可能是布局机会。',
    ],
    aiInterpretationEn: [
      'Large exchange outflows can be a bearish signal, suggesting some investors are reducing exposure.',
      'It can also reflect better self‑custody habits rather than pure market concern.',
      'Context matters—if multiple exchanges see outflows, risk increases.',
      'Near term, stay cautious and watch follow‑through; profit‑taking dips can be entry opportunities.',
    ],
  },
  'n5': {
    id: 'n5',
    title: 'Whale alert: $500M BTC moved from unknown wallet',
    symbol: 'BTC',
    sentiment: 'neutral',
    source: 'Whale Alert',
    publishedAt: '45 min ago',
    content: `Blockchain analytics firm Whale Alert has detected a massive transfer of 5,200 BTC (approximately $500 million) from an unknown wallet.

The destination appears to be a new wallet with no prior transaction history, making it difficult to determine the purpose of the transfer.

Possible explanations include:
- Institutional repositioning
- OTC desk transaction
- Exchange cold wallet rotation
- Long-term holder consolidation

Market impact remains uncertain as the identity and intentions of the wallet owner are unknown.`,
    aiInterpretation: [
      '大额BTC转移需要关注但不必恐慌。转入新钱包可能是机构调仓或冷钱包管理。',
      '如果是转入交易所，可能预示抛售；如果是转出交易所，则是积累信号。',
      '目前目的地未知，建议持续关注后续资金动向。',
      '操作建议：暂不需要特别反应，保持现有仓位，等待更多信息明朗。',
    ],
    aiInterpretationEn: [
      'A large BTC transfer warrants attention but not panic; it could be institutional rebalancing or cold‑wallet management.',
      'If it’s moving to an exchange, it may hint at selling; if it’s leaving exchanges, it can be accumulation.',
      'Destination is unknown—keep monitoring follow‑up flows.',
      'No immediate action needed; hold positions and wait for more clarity.',
    ],
  },
};

interface NewsPreviewModalProps {
  newsId: string | null;
  onClose: () => void;
}

export function NewsPreviewModal({ newsId, onClose }: NewsPreviewModalProps) {
  const { t, language } = useTranslation();
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  const news = newsId ? newsDetails[newsId] : null;
  const localizedInterpretation = news ? (language === 'zh' ? news.aiInterpretation : news.aiInterpretationEn) : [];

  // 点击外部关闭
  useEffect(() => {
    if (!newsId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [newsId, onClose]);

  // ESC 关闭
  useEffect(() => {
    if (!newsId) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [newsId, onClose]);

  // 重置状态
  useEffect(() => {
    if (!newsId) {
      setShowAI(false);
      setAiMessages([]);
    }
  }, [newsId]);

  if (!news) return null;

  const handleAIInterpret = async () => {
    if (aiMessages.length > 0) {
      setShowAI(!showAI);
      return;
    }

    setAiLoading(true);
    setShowAI(true);

    // 模拟 AI 逐条输出
    for (let i = 0; i < localizedInterpretation.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setAiMessages(prev => [...prev, localizedInterpretation[i]]);
    }

    setAiLoading(false);
  };

  const SentimentBadge = () => {
    const config = {
      bullish: { icon: TrendingUp, color: 'var(--brand-green)', label: t('sentiment.bullish') },
      bearish: { icon: TrendingDown, color: 'var(--brand-red)', label: t('sentiment.bearish') },
      neutral: { icon: null, color: 'var(--text-muted)', label: t('sentiment.neutral') },
    };
    const { icon: Icon, color, label } = config[news.sentiment];
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: `${color}20`, color }}>
        {Icon && <Icon size={12} />}
        {label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-[var(--border-light)]">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                news.sentiment === 'bullish'
                  ? 'bg-[var(--brand-green-dim)] text-[var(--brand-green)]'
                  : news.sentiment === 'bearish'
                  ? 'bg-[var(--brand-red-dim)] text-[var(--brand-red)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
              }`}>
                {news.symbol}
              </span>
              <SentimentBadge />
            </div>
            <h2 className="text-[15px] font-bold text-[var(--text-main)] leading-tight">
              {news.title}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <ExternalLink size={12} />
                {news.source}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {news.publishedAt}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--bg-surface)] rounded transition-colors"
          >
            <X size={18} className="text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* News Content */}
          <div className="p-4 border-b border-[var(--border-light)]">
            <div className="text-[13px] text-[var(--text-main)] leading-relaxed whitespace-pre-line">
              {news.content}
            </div>
          </div>

          {/* AI Interpretation */}
          <div className="p-4">
            <button
              onClick={handleAIInterpret}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#8b5cf6]/10 to-[#6366f1]/10 hover:from-[#8b5cf6]/20 hover:to-[#6366f1]/20 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#8b5cf6]" />
                <span className="text-[13px] font-medium text-[var(--text-main)]">{t('newsPreviewModal.aiQuickBrief')}</span>
                {aiMessages.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#8b5cf6]/20 text-[#8b5cf6] rounded">
                    {t('newsPreviewModal.generated')}
                  </span>
                )}
              </div>
              {aiLoading ? (
                <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
              ) : showAI ? (
                <ChevronUp size={16} className="text-[var(--text-muted)]" />
              ) : (
                <ChevronDown size={16} className="text-[var(--text-muted)]" />
              )}
            </button>

            {showAI && aiMessages.length > 0 && (
              <div className="mt-3 space-y-2">
                {aiMessages.map((text, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-3 bg-[var(--bg-surface)] rounded-lg animate-fadeIn"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={10} className="text-white" />
                    </div>
                    <p className="text-[12px] text-[var(--text-main)] leading-relaxed">
                      {text}
                    </p>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex items-center gap-2 p-3 bg-[var(--bg-surface)] rounded-lg">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] flex items-center justify-center flex-shrink-0">
                      <Sparkles size={10} className="text-white" />
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--border-light)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-dim)]">
            <span>{t('newsPreviewModal.source', { source: news.source })}</span>
            <span>{t('newsPreviewModal.disclaimer')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
