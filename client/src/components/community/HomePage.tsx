import { useState } from 'react';
import { PostCard } from './PostCard';
import { PostDetailPage } from './PostDetailPage';
import { UserProfilePage } from './UserProfilePage';
import { SearchBar } from './SearchBar';
import { NewResearchersCarousel } from './NewResearchersCarousel';
import { mockUsers, mockCurrentUser } from '../../data/mockCommunity';
import type { FeedFilter, Post, User } from '../../types/community';

interface HomePageProps {
  posts: Post[];
  currentSymbol?: string;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onFollow: (userId: string) => void;
}

export function HomePage({ posts, currentSymbol, onLike, onComment, onShare, onFollow }: HomePageProps) {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('latest');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤和排序帖子 - 加入搜索和代币相关性排序
  const filteredPosts = (() => {
    let sorted: Post[] = [];

    switch (activeFilter) {
      case 'featured':
        // 编辑精选：按点赞数排序
        sorted = [...posts].sort((a, b) => b.likeCount - a.likeCount);
        break;
      case 'hot':
        // 最热：按综合热度(点赞+评论+分享)排序
        sorted = [...posts].sort((a, b) => {
          const heatA = a.likeCount + a.commentCount * 2 + a.shareCount * 3;
          const heatB = b.likeCount + b.commentCount * 2 + b.shareCount * 3;
          return heatB - heatA;
        });
        break;
      case 'latest':
      default:
        // 最新：按时间排序
        sorted = [...posts].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      sorted = sorted.filter(post =>
        post.content.toLowerCase().includes(query) ||
        post.user.username.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 如果有当前交易代币，将相关帖子排在前面
    if (currentSymbol && !searchQuery.trim()) {
      // 从 "BTC/USDT" 格式提取代币符号 "BTC"
      const coinSymbol = currentSymbol.split('/')[0];

      const relevantPosts = sorted.filter(post =>
        post.tags?.includes(coinSymbol)
      );
      const otherPosts = sorted.filter(post =>
        !post.tags?.includes(coinSymbol)
      );
      return [...relevantPosts, ...otherPosts];
    }

    return sorted;
  })();

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
    // 从最新的posts中找到对应的post，确保数据是最新的
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

  // 否则显示帖子列表
  return (
    <>
      {/* 搜索栏 */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Feed 筛选 Tabs */}
      <div className="h-11 border-b border-[var(--border-light)] flex items-center px-4 bg-[var(--bg-panel)] shrink-0">
        <div className="flex gap-6 text-[13px] font-medium">
          <button
            onClick={() => setActiveFilter('featured')}
            className={`pb-2 transition-colors ${
              activeFilter === 'featured'
                ? 'text-[var(--brand-yellow)] border-b-2 border-[var(--brand-yellow)] -mb-[1px]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            编辑精选
          </button>
          <button
            onClick={() => setActiveFilter('hot')}
            className={`pb-2 transition-colors ${
              activeFilter === 'hot'
                ? 'text-[var(--brand-yellow)] border-b-2 border-[var(--brand-yellow)] -mb-[1px]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            最热
          </button>
          <button
            onClick={() => setActiveFilter('latest')}
            className={`pb-2 transition-colors ${
              activeFilter === 'latest'
                ? 'text-[var(--brand-yellow)] border-b-2 border-[var(--brand-yellow)] -mb-[1px]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            最新
          </button>
        </div>
      </div>

      {/* PostList - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto">
        {/* 新晋研究员卡片 - 插入在feed流顶部 */}
        <NewResearchersCarousel onUserClick={handleUserClick} />

        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onClick={handlePostClick}
              onFollow={onFollow}
              onUserClick={handleUserClick}
            />
          ))
        ) : (
          <div className="py-16 text-center">
            <p className="text-[var(--text-muted)] text-[14px]">暂无相关内容</p>
          </div>
        )}
      </div>
    </>
  );
}
