import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { PostCard } from './PostCard';
import { CoinSentimentBar } from './CoinSentimentBar';
import { mockCoinPrices, mockCoinSentiments } from '../../data/mockCommunity';
import type { Post, CoinSentiment } from '../../types/community';

// 代币图标映射 (使用 CoinGecko CDN)
const COIN_ICONS: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  ARB: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  OP: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
  BONK: 'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg',
  JUP: 'https://assets.coingecko.com/coins/images/34188/small/jup.png',
};

interface CoinPositionCardProps {
  symbol: string;
  posts: Post[];
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onFollow: (userId: string) => void;
  onPostClick: (postId: string) => void;
  onUserClick: (userId: string) => void;
}

export function CoinPositionCard({
  symbol,
  posts,
  onLike,
  onComment,
  onShare,
  onFollow,
  onPostClick,
  onUserClick,
}: CoinPositionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const coinPrice = mockCoinPrices[symbol];
  const sentiment = mockCoinSentiments[symbol];

  if (!coinPrice) return null;

  // 格式化价格
  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  // 格式化涨跌幅
  const formatChange = (change: number): string => {
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(2)}%`;
  };

  const isPositive = coinPrice.change24h >= 0;

  return (
    <div className="bg-[var(--bg-panel)] border-b border-[var(--border-light)] overflow-hidden">
      {/* 头部 - 始终显示 */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg-surface)] transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* 代币图标 */}
          <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden">
            <img
              src={COIN_ICONS[symbol] || `https://api.dicebear.com/7.x/shapes/svg?seed=${symbol}`}
              alt={symbol}
              className="w-7 h-7"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${symbol}`;
              }}
            />
          </div>

          {/* 代币信息 */}
          <div>
            <div className="text-[15px] font-semibold text-[var(--text-main)]">{symbol}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[14px] text-[var(--text-main)]">
                {formatPrice(coinPrice.price)}
              </span>
              <span
                className={`text-[13px] ${
                  isPositive ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                }`}
              >
                {formatChange(coinPrice.change24h)}
              </span>
            </div>
          </div>
        </div>

        {/* 展开/折叠按钮 */}
        <button
          className="p-2 rounded-lg hover:bg-[var(--bg-app)] transition"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <ChevronUp size={20} className="text-[var(--text-muted)]" />
          ) : (
            <ChevronDown size={20} className="text-[var(--text-muted)]" />
          )}
        </button>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {/* 情绪分析条 */}
          {sentiment && <CoinSentimentBar sentiment={sentiment} />}

          {/* 关联帖子列表 */}
          <div className="border-t border-[var(--border-light)]">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={onLike}
                  onComment={onComment}
                  onShare={onShare}
                  onClick={onPostClick}
                  onFollow={onFollow}
                  onUserClick={onUserClick}
                />
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-[var(--text-muted)] text-[13px]">暂无 {symbol} 相关内容</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
