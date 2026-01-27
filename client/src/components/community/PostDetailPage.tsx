import { ArrowLeft, Heart, MessageCircle, Share2, Eye, BadgeCheck } from 'lucide-react';
import type { Post } from '../../types/community';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PostDetailPageProps {
  post: Post;
  onClose: () => void;
  onLike?: (postId: string) => void;
  onFollow?: (userId: string) => void;
}

export function PostDetailPage({ post, onClose, onLike, onFollow }: PostDetailPageProps) {
  const {
    user,
    content,
    images = [],
    attachments = [],
    createdAt,
    viewCount,
    likeCount,
    commentCount,
    shareCount,
    isLiked,
    tags = [],
  } = post;

  const allMedia = [...images, ...attachments.map(a => a.preview || a.url || '')].filter(Boolean);

  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: zhCN,
  });

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)]">
      {/* Header */}
      <div className="h-14 border-b border-[var(--border-light)] flex items-center px-4 shrink-0">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-[var(--bg-surface)] rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-[var(--text-main)]" />
        </button>
        <span className="ml-2 text-[15px] font-medium text-[var(--text-main)]">帖子详情</span>
      </div>

      {/* Content - 可滚动 */}
      <div className="flex-1 overflow-y-auto">
        {/* 用户信息 */}
        <div className="p-4 border-b border-[var(--border-light)]">
          <div className="flex items-start gap-3">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-12 h-12 rounded-full shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-medium text-[var(--text-main)] text-[15px] truncate">
                  {user.username}
                </span>
                {user.isVerified && (
                  <BadgeCheck size={16} className="text-[var(--brand-yellow)] shrink-0" />
                )}
              </div>
              <div className="text-[13px] text-[var(--text-muted)]">
                {timeAgo}
              </div>
            </div>
            <button
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition shrink-0 ${
                user.isFollowing
                  ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-app)]'
                  : 'bg-[var(--brand-yellow)] text-black hover:opacity-90'
              }`}
              onClick={() => onFollow?.(user.id)}
            >
              {user.isFollowing ? '已关注' : '+关注'}
            </button>
          </div>
        </div>

        {/* 完整内容 */}
        <div className="p-4">
          <p className="text-[15px] text-[var(--text-main)] whitespace-pre-wrap break-words leading-relaxed">
            {content}
          </p>

          {/* 标签 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-[13px] text-[var(--brand-yellow)] hover:underline cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 图片 */}
          {allMedia.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {allMedia.map((img, index) => (
                <div
                  key={index}
                  className="rounded-lg overflow-hidden bg-[var(--bg-surface)] aspect-video"
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 互动统计 */}
        <div className="px-4 py-3 border-y border-[var(--border-light)] flex items-center gap-6 text-[13px] text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <Eye size={16} />
            <span>{formatCount(viewCount)} 浏览</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart size={16} />
            <span>{formatCount(likeCount)} 点赞</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle size={16} />
            <span>{formatCount(commentCount)} 评论</span>
          </div>
        </div>

        {/* 评论区占位 */}
        <div className="p-4">
          <div className="text-center py-8">
            <MessageCircle size={48} className="text-[var(--text-dim)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)] text-[14px]">评论功能开发中...</p>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="h-16 border-t border-[var(--border-light)] flex items-center px-4 gap-4 shrink-0">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition"
          onClick={() => onLike?.(post.id)}
        >
          <Heart
            size={20}
            className={isLiked ? 'fill-[var(--brand-yellow)] text-[var(--brand-yellow)]' : 'text-[var(--text-muted)]'}
          />
          <span className={`text-[14px] ${isLiked ? 'text-[var(--brand-yellow)]' : 'text-[var(--text-muted)]'}`}>
            {isLiked ? '已点赞' : '点赞'}
          </span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition">
          <MessageCircle size={20} className="text-[var(--text-muted)]" />
          <span className="text-[14px] text-[var(--text-muted)]">评论</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition">
          <Share2 size={20} className="text-[var(--text-muted)]" />
          <span className="text-[14px] text-[var(--text-muted)]">分享</span>
        </button>
      </div>
    </div>
  );
}
