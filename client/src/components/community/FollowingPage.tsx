import { useState } from 'react';
import { PostCard } from './PostCard';
import { PostDetailPage } from './PostDetailPage';
import type { Post } from '../../types/community';
import { Users } from 'lucide-react';

interface FollowingPageProps {
  posts: Post[];
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onFollow: (userId: string) => void;
}

export function FollowingPage({ posts, onLike, onComment, onShare, onFollow }: FollowingPageProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // 只显示已关注用户的帖子
  const followedPosts = posts.filter(post => post.user.isFollowing);

  const handlePostClick = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
    }
  };

  // 如果没有关注任何人，显示空状态
  if (followedPosts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Users size={64} className="text-[var(--text-dim)] mx-auto mb-4" />
          <p className="text-[var(--text-main)] font-medium mb-2">还没有关注任何人</p>
          <p className="text-[var(--text-muted)] text-sm">
            去主页关注你感兴趣的用户吧
          </p>
        </div>
      </div>
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

  // 显示关注用户的帖子列表
  return (
    <div className="flex-1 overflow-y-auto">
      {followedPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          onClick={handlePostClick}
          onFollow={onFollow}
          hideFollowButton={true}
        />
      ))}
    </div>
  );
}
