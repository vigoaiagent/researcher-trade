import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { PostDetailPage } from './PostDetailPage';
import { UserProfilePage } from './UserProfilePage';
import { CoinPositionCard } from './CoinPositionCard';
import { mockUsers, mockCoinPrices, mockCurrentUser } from '../../data/mockCommunity';
import type { Post, User } from '../../types/community';

interface PositionsPageProps {
  posts: Post[];
  currentSymbol?: string;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onFollow: (userId: string) => void;
}

// 用户持仓的代币列表（Mock数据，实际应从用户数据获取）
const USER_HOLDINGS = ['BTC', 'ETH', 'SOL'];

export function PositionsPage({ posts, currentSymbol: _currentSymbol, onLike, onComment, onShare, onFollow }: PositionsPageProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 按代币聚合帖子
  const postsBySymbol = useMemo(() => {
    const result: Record<string, Post[]> = {};

    // 初始化持仓代币的帖子数组
    USER_HOLDINGS.forEach(symbol => {
      result[symbol] = [];
    });

    // 遍历所有帖子，按 tags 分组
    posts.forEach(post => {
      if (!post.tags) return;

      post.tags.forEach(tag => {
        // 检查 tag 是否是持仓代币（去除 # 前缀）
        const cleanTag = tag.replace(/^#/, '');
        if (USER_HOLDINGS.includes(cleanTag) && mockCoinPrices[cleanTag]) {
          if (!result[cleanTag]) {
            result[cleanTag] = [];
          }
          // 避免重复添加
          if (!result[cleanTag].find(p => p.id === post.id)) {
            result[cleanTag].push(post);
          }
        }
      });
    });

    // 每个代币的帖子按时间排序
    Object.keys(result).forEach(symbol => {
      result[symbol].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return result;
  }, [posts]);

  const handlePostClick = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
    }
  };

  const handleUserClick = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
    }
  };

  // 如果选中了用户，显示用户主页
  if (selectedUser) {
    const isCurrentUser = selectedUser.id === mockCurrentUser.id;
    return (
      <UserProfilePage
        user={selectedUser}
        posts={posts}
        isCurrentUser={isCurrentUser}
        onClose={() => setSelectedUser(null)}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onFollow={onFollow}
        onPostClick={handlePostClick}
      />
    );
  }

  // 如果选中了帖子，显示详情页
  if (selectedPost) {
    const updatedPost = posts.find(p => p.id === selectedPost.id) || selectedPost;
    return (
      <PostDetailPage
        post={updatedPost}
        onClose={() => setSelectedPost(null)}
        onLike={onLike}
        onFollow={onFollow}
      />
    );
  }

  // 显示持仓日报
  return (
    <div className="flex flex-col h-full">
      {/* 顶部标题 */}
      <div className="px-4 py-3 bg-[var(--bg-panel)] border-b border-[var(--border-light)] shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-[var(--brand-yellow)]" />
          <span className="text-[14px] font-medium text-[var(--brand-yellow)]">
            今日持仓币市场动态已更新
          </span>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] mt-1">
          根据您的持仓推送相关市场热门观点
        </p>
      </div>

      {/* 代币卡片列表 */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-app)]">
        {USER_HOLDINGS.map(symbol => (
          <CoinPositionCard
            key={symbol}
            symbol={symbol}
            posts={postsBySymbol[symbol] || []}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onFollow={onFollow}
            onPostClick={handlePostClick}
            onUserClick={handleUserClick}
          />
        ))}

        {USER_HOLDINGS.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[var(--text-muted)] text-[14px]">
              暂无持仓数据
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
