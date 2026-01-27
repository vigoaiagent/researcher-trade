import { useState } from 'react';
import { ArrowLeft, BadgeCheck, Phone, X, Crown } from 'lucide-react';
import type { User, Post } from '../../types/community';
import { PostCard } from './PostCard';

interface UserProfilePageProps {
  user: User;
  posts: Post[];
  isCurrentUser?: boolean;
  onClose: () => void;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onFollow: (userId: string) => void;
  onPostClick: (postId: string) => void;
}

export function UserProfilePage({
  user,
  posts,
  isCurrentUser = false,
  onClose,
  onLike,
  onComment,
  onShare,
  onFollow,
  onPostClick,
}: UserProfilePageProps) {
  const [showVipModal, setShowVipModal] = useState(false);

  // 筛选该用户的所有帖子
  const userPosts = posts.filter(post => post.user.id === user.id);

  // 从帖子中获取最新的关注状态（posts 是响应式的，user prop 可能是静态的）
  const latestUserFromPost = userPosts.length > 0 ? userPosts[0].user : user;
  const isFollowing = latestUserFromPost.isFollowing;
  const followerCount = latestUserFromPost.followerCount;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)]">
      {/* Header */}
      <div className="h-12 border-b border-[var(--border-light)] flex items-center px-4 shrink-0 bg-[var(--bg-panel)]">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-[var(--bg-surface)] rounded-lg transition"
        >
          <ArrowLeft size={18} className="text-[var(--text-main)]" />
        </button>
        <span className="ml-2 text-[14px] font-medium text-[var(--text-main)]">返回</span>
      </div>

      {/* Content - 可滚动 */}
      <div className="flex-1 overflow-y-auto">
        {/* 用户信息卡片 */}
        <div className="p-6 border-b border-[var(--border-light)] bg-[var(--bg-panel)]">
          <div className="flex flex-col items-center">
            {/* 头像 */}
            <div className="relative mb-4">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-24 h-24 rounded-full"
              />
              {user.isVerified && (
                <div className="absolute bottom-0 right-0 bg-[var(--bg-panel)] rounded-full p-1">
                  <BadgeCheck size={20} className="text-[var(--brand-yellow)]" />
                </div>
              )}
            </div>

            {/* 用户名 */}
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-[18px] font-bold text-[var(--text-main)]">
                {user.username}
              </h2>
              {user.isVerified && user.certificationLabel && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--brand-yellow)]/10 text-[var(--brand-yellow)] text-[11px] font-medium">
                  {user.certificationLabel}
                </span>
              )}
            </div>

            {/* 简介 */}
            <p className="text-[13px] text-[var(--text-muted)] text-center mb-4 max-w-[300px]">
              {user.bio}
            </p>

            {/* 统计数据 */}
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-[18px] font-bold text-[var(--text-main)]">
                  {(followerCount / 1000).toFixed(1)}k
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">粉丝</div>
              </div>
              <div className="w-px h-8 bg-[var(--border-light)]" />
              <div className="text-center">
                <div className="text-[18px] font-bold text-[var(--text-main)]">
                  {(user.followingCount / 1000).toFixed(1)}k
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">获赞</div>
              </div>
            </div>

            {/* 操作按钮 - 自己的主页不显示 */}
            {!isCurrentUser && (
              <div className="flex items-center gap-3 w-full max-w-[300px]">
                <button
                  onClick={() => onFollow(user.id)}
                  className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition ${
                    isFollowing
                      ? 'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--brand-yellow)] hover:opacity-80'
                      : 'bg-[var(--brand-yellow)] text-black hover:opacity-90'
                  }`}
                >
                  {isFollowing ? '✓ 已关注' : '+ 关注'}
                </button>
                <button
                  onClick={() => setShowVipModal(true)}
                  className="flex-1 py-2.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-app)] transition border border-[var(--border-light)] flex items-center justify-center gap-2"
                >
                  <Phone size={16} className="text-[var(--text-muted)]" />
                  <span className="text-[14px] text-[var(--text-muted)]">通话</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 动态标签 */}
        <div className="px-4 py-3 border-b border-[var(--border-light)] bg-[var(--bg-panel)]">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-[var(--text-main)] border-b-2 border-[var(--brand-yellow)] pb-2">
              动态
            </span>
            <span className="text-[12px] text-[var(--text-dim)]">
              ({userPosts.length})
            </span>
          </div>
        </div>

        {/* 用户帖子列表 */}
        <div className="bg-[var(--bg-app)]">
          {userPosts.length > 0 ? (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={onLike}
                onComment={onComment}
                onShare={onShare}
                onClick={onPostClick}
                onFollow={onFollow}
                hideFollowButton={true}
              />
            ))
          ) : (
            <div className="py-16 text-center">
              <p className="text-[var(--text-muted)] text-[14px]">暂无动态</p>
            </div>
          )}
        </div>
      </div>

      {/* VIP 弹窗 */}
      {showVipModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-panel)] rounded-2xl w-[320px] p-6 relative animate-in zoom-in-95 duration-200">
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowVipModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-[var(--bg-surface)] transition"
            >
              <X size={18} className="text-[var(--text-muted)]" />
            </button>

            {/* VIP 图标 */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                <Crown size={32} className="text-white" />
              </div>
            </div>

            {/* 标题 */}
            <h3 className="text-[18px] font-bold text-[var(--text-main)] text-center mb-2">
              VIP 专属服务
            </h3>

            {/* 描述 */}
            <p className="text-[14px] text-[var(--text-muted)] text-center mb-6">
              语音通话是 VIP 会员专属功能，升级 VIP 即可与研究员一对一语音沟通
            </p>

            {/* 功能列表 */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[var(--brand-yellow)]/20 flex items-center justify-center">
                  <span className="text-[var(--brand-yellow)] text-[12px]">✓</span>
                </div>
                <span className="text-[13px] text-[var(--text-main)]">与研究员一对一语音沟通</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[var(--brand-yellow)]/20 flex items-center justify-center">
                  <span className="text-[var(--brand-yellow)] text-[12px]">✓</span>
                </div>
                <span className="text-[13px] text-[var(--text-main)]">优先获取研报推送</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[var(--brand-yellow)]/20 flex items-center justify-center">
                  <span className="text-[var(--brand-yellow)] text-[12px]">✓</span>
                </div>
                <span className="text-[13px] text-[var(--text-main)]">专属 VIP 标识</span>
              </div>
            </div>

            {/* 按钮 */}
            <button
              onClick={() => setShowVipModal(false)}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold text-[14px] hover:opacity-90 transition"
            >
              了解 VIP 会员
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
