import { Heart, MessageCircle, Share2, Eye, BadgeCheck } from 'lucide-react';
import type { Post } from '../../types/community';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CoinTag } from './CoinTag';
import { PollWidget } from './PollWidget';
import { PKWidget } from './PKWidget';
import { mockCoinPrices } from '../../data/mockCommunity';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onClick?: (postId: string) => void;
  onFollow?: (userId: string) => void;
  onUserClick?: (userId: string) => void;
  hideFollowButton?: boolean;
}

export function PostCard({ post, onLike, onComment, onShare, onClick, onFollow, onUserClick, hideFollowButton = false }: PostCardProps) {
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

  // 截断长文本到200字
  const MAX_CONTENT_LENGTH = 200;
  const displayContent = content.length > MAX_CONTENT_LENGTH
    ? content.slice(0, MAX_CONTENT_LENGTH) + '...'
    : content;
  const isContentTruncated = content.length > MAX_CONTENT_LENGTH;

  // 分离投票和PK组件
  const pollAttachment = attachments.find(a => a.type === 'poll');
  const pkAttachment = attachments.find(a => a.type === 'pk');

  // 计算显示的图片(最多4张,考虑8张的情况)
  const MAX_DISPLAY_IMAGES = 4;
  const imageAttachments = attachments.filter(a => a.type === 'image').map(a => a.preview || a.url || '');
  const allMedia = [...images, ...imageAttachments].filter(Boolean);
  const displayImages = allMedia.slice(0, MAX_DISPLAY_IMAGES);
  const remainingCount = allMedia.length - MAX_DISPLAY_IMAGES;

  // 格式化时间
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: zhCN,
  });

  // 格式化数字(1000 -> 1k)
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  // 分离代币标签和话题标签
  const coinTags = tags.filter(tag => mockCoinPrices[tag]);
  const topicTags = tags.filter(tag => !mockCoinPrices[tag]);

  return (
    <div
      className="bg-[var(--bg-panel)] border-b border-[var(--border-light)] p-4 hover:bg-[var(--bg-surface)] transition cursor-pointer"
      onClick={() => onClick?.(post.id)}
    >
      {/* 用户信息 */}
      <div className="flex items-start gap-3 mb-3">
        <img
          src={user.avatar}
          alt={user.username}
          className="w-10 h-10 rounded-full shrink-0 hover:ring-2 hover:ring-[var(--brand-yellow)] transition cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onUserClick?.(user.id);
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="font-medium text-[var(--text-main)] text-[14px] truncate hover:text-[var(--brand-yellow)] transition cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onUserClick?.(user.id);
              }}
            >
              {user.username}
            </span>
            {user.isVerified && (
              <BadgeCheck size={14} className="text-[var(--brand-yellow)] shrink-0" />
            )}
          </div>
          <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
            {timeAgo}
          </div>
        </div>
        {!hideFollowButton && (
          <button
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition shrink-0 ${
              user.isFollowing
                ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-app)]'
                : 'bg-[var(--brand-yellow)] text-black hover:opacity-90'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onFollow?.(user.id);
            }}
          >
            {user.isFollowing ? '已关注' : '+关注'}
          </button>
        )}
      </div>

      {/* 帖子内容 */}
      <div className="mb-3">
        <p className="text-[14px] text-[var(--text-main)] whitespace-pre-wrap break-words">
          {displayContent}
        </p>
        {isContentTruncated && (
          <button className="text-[13px] text-[var(--brand-yellow)] hover:underline mt-1">
            查看更多
          </button>
        )}
      </div>

      {/* 标签 - 分两行展示 */}
      {(coinTags.length > 0 || topicTags.length > 0) && (
        <div className="mb-3 space-y-2">
          {/* 第一行：代币标签 */}
          {coinTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {coinTags.map((tag, index) => (
                <span
                  key={index}
                  onClick={(e) => e.stopPropagation()}
                >
                  <CoinTag symbol={tag} />
                </span>
              ))}
            </div>
          )}

          {/* 第二行：话题标签 */}
          {topicTags.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {topicTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center text-[13px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[#FF8A00] mr-0.5">#</span>
                  <span className="text-[var(--text-main)]">{tag.replace(/^#/, '')}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 图片网格 */}
      {displayImages.length > 0 && (
        <div
          className={`grid gap-2 mb-3 ${
            displayImages.length === 1
              ? 'grid-cols-1'
              : displayImages.length === 2
                ? 'grid-cols-2'
                : displayImages.length === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-2'
          }`}
        >
          {displayImages.map((img, index) => (
            <div
              key={index}
              className="relative rounded-lg overflow-hidden bg-[var(--bg-surface)] aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
              {/* 剩余图片数量标记 */}
              {index === MAX_DISPLAY_IMAGES - 1 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white text-[24px] font-bold">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 投票组件 */}
      {pollAttachment && pollAttachment.poll && (
        <PollWidget
          poll={pollAttachment.poll}
          onVote={(optionId) => {
            // 实际应用中应该调用 API 更新投票
            // 这里只是模拟前端状态更新
            console.log('Voted:', optionId);
          }}
        />
      )}

      {/* PK组件 */}
      {pkAttachment && pkAttachment.pk && (
        <PKWidget
          pk={pkAttachment.pk}
          onVote={(side) => {
            // 实际应用中应该调用 API 更新PK投票
            // 这里只是模拟前端状态更新
            console.log('PK Voted:', side);
          }}
        />
      )}

      {/* 互动栏 */}
      <div className="flex items-center justify-between text-[13px] text-[var(--text-muted)] mt-3">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-1.5 hover:text-[var(--brand-yellow)] transition"
            onClick={(e) => {
              e.stopPropagation();
              onLike?.(post.id);
            }}
          >
            <Heart
              size={16}
              className={isLiked ? 'fill-[var(--brand-yellow)] text-[var(--brand-yellow)]' : ''}
            />
            <span>{formatCount(likeCount)}</span>
          </button>

          <button
            className="flex items-center gap-1.5 hover:text-[var(--text-main)] transition"
            onClick={(e) => {
              e.stopPropagation();
              onComment?.(post.id);
            }}
          >
            <MessageCircle size={16} />
            <span>{formatCount(commentCount)}</span>
          </button>

          <button
            className="flex items-center gap-1.5 hover:text-[var(--text-main)] transition"
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(post.id);
            }}
          >
            <Share2 size={16} />
            <span>{formatCount(shareCount)}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <Eye size={16} />
            <span>{formatCount(viewCount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
