import { useState, useEffect } from 'react';
import { Star, MessageSquare, ExternalLink, Award, Shield, Flame, TrendingUp, Clock, Target, Zap, Quote, X, ChevronRight } from 'lucide-react';
import type { ResearcherAnswer, ResearcherBadge } from '../../types';
import { researcherApi } from '../../services/api';

// SoSoValue 研究员主页 URL 模板
const PROFILE_URL = 'https://sosovalue.com/profile/index';

// 徽章配置
const badgeConfig: Record<ResearcherBadge, { icon: typeof Award; color: string; label: string; bgColor: string; description: string }> = {
  top_rated: { icon: Star, color: 'var(--brand-yellow)', bgColor: 'rgba(255, 193, 7, 0.15)', label: '好评之星', description: '用户好评率超过95%，深受用户信赖' },
  expert: { icon: Award, color: 'var(--brand-green)', bgColor: 'rgba(16, 185, 129, 0.15)', label: '专家认证', description: '经平台审核的行业专家，具备专业资质' },
  verified: { icon: Shield, color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)', label: '实名认证', description: '已完成身份实名认证，信息真实可靠' },
  hot: { icon: Flame, color: 'var(--brand-red)', bgColor: 'rgba(239, 68, 68, 0.15)', label: '人气研究员', description: '近期咨询量TOP10，热门研究员' },
  rising_star: { icon: TrendingUp, color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.15)', label: '新锐之星', description: '入驻90天内表现优异的新晋研究员' },
  veteran: { icon: Clock, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', label: '资深老将', description: '入驻超过2年，服务超过1000次' },
};

// 默认头像配置
const defaultAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=researcher1&backgroundColor=10b981',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=researcher2&backgroundColor=f59e0b',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=researcher3&backgroundColor=3b82f6',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=researcher4&backgroundColor=8b5cf6',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=researcher5&backgroundColor=ef4444',
];

// 根据研究员ID生成默认头像
const getDefaultAvatar = (id: string): string => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return defaultAvatars[hash % defaultAvatars.length];
};

interface Review {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  userAddress: string;
  questionPreview: string;
}

interface ReviewStats {
  total: number;
  average: number;
  distribution: Record<number, number>;
}

interface ResearcherCardProps {
  answer: ResearcherAnswer;
  onSelect: () => void;
  isLoading: boolean;
}

export function ResearcherCard({ answer, onSelect, isLoading }: ResearcherCardProps) {
  const { researcher, firstAnswer } = answer;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // 使用研究员实际徽章数据，如果没有则根据评分生成默认徽章
  const badges: ResearcherBadge[] = researcher.badges ?? (
    researcher.ratingScore >= 4.5 ? ['top_rated', 'verified'] :
    researcher.ratingScore >= 4.0 ? ['verified'] : []
  );

  // 研究员主页链接
  const profileUrl = `${PROFILE_URL}/${researcher.id}`;

  // 自动加载评价（组件挂载时）
  useEffect(() => {
    if (reviews.length === 0 && !loadingReviews) {
      setLoadingReviews(true);
      researcherApi.getReviews(researcher.id)
        .then(({ reviews, stats }) => {
          setReviews(reviews);
          setStats(stats);
        })
        .catch(console.error)
        .finally(() => setLoadingReviews(false));
    }
  }, [researcher.id]);

  // 筛选热门评价（有评论的高分评价优先）
  const hotReviews = reviews.filter(r => r.comment && r.score >= 4).slice(0, 5);

  // 动态轮播评价
  useEffect(() => {
    if (hotReviews.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentReviewIndex(prev => (prev + 1) % hotReviews.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [hotReviews.length]);

  // Render star rating
  const renderStars = (score: number, size = 16) => {
    const fullStars = Math.floor(score);
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={`${
          i < fullStars
            ? 'fill-[var(--brand-yellow)] text-[var(--brand-yellow)]'
            : 'text-[var(--text-dim)]'
        }`}
      />
    ));
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 当前显示的评价
  const currentReview = hotReviews[currentReviewIndex];

  return (
    <div className="rounded-xl p-3 md:p-5 transition hover:border-[var(--brand-green)] bg-[var(--bg-panel)] border border-[var(--border-light)]">
      {/* Top Section: Two-column layout on desktop */}
      <div className="flex flex-col md:flex-row md:gap-4 mb-3">
        {/* Left: Researcher Info */}
        <div className="flex-1 min-w-0">
          {/* Avatar + Name + Rating Row */}
          <div className="flex items-start gap-3 mb-2">
            {/* Avatar with badge indicator */}
            <div className="relative shrink-0">
              <img
                src={researcher.avatar || getDefaultAvatar(researcher.id)}
                alt={researcher.name}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-[var(--border-light)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getDefaultAvatar(researcher.id);
                }}
              />
              {badges.length > 0 && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-[var(--brand-yellow)] flex items-center justify-center text-[9px] md:text-[10px] font-bold text-black border-2 border-[var(--bg-panel)]">
                  {badges.length}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name + Profile Link */}
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-bold text-[16px] md:text-[17px] text-[var(--text-main)] truncate">
                  {researcher.name}
                </h4>
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[var(--text-muted)] hover:text-[var(--brand-yellow)] transition shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={12} />
                  <span className="hidden md:inline">主页</span>
                </a>
              </div>

              {/* Rating & Stats */}
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[11px] md:text-[12px] mb-1">
                <div className="flex items-center gap-0.5">
                  {renderStars(researcher.ratingScore, 11)}
                  <span className="text-[var(--brand-yellow)] font-bold ml-0.5">{researcher.ratingScore.toFixed(1)}</span>
                </div>
                <span className="text-[var(--text-dim)]">·</span>
                <span className="text-[var(--text-muted)]">{researcher.serviceCount} 服务</span>
                {researcher.successRate && (
                  <>
                    <span className="text-[var(--text-dim)]">·</span>
                    <span className="flex items-center gap-0.5 text-[var(--brand-green)]">
                      <Target size={10} />
                      {researcher.successRate}%
                    </span>
                  </>
                )}
              </div>

              {/* Bio */}
              {researcher.bio && (
                <p className="text-[11px] md:text-[12px] text-[var(--text-muted)] line-clamp-1">{researcher.bio}</p>
              )}
            </div>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {badges.map((badgeKey) => {
                const badge = badgeConfig[badgeKey];
                if (!badge) return null;
                const BadgeIcon = badge.icon;
                return (
                  <span
                    key={badgeKey}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] md:text-[11px] font-medium"
                    style={{ backgroundColor: badge.bgColor, color: badge.color }}
                    title={badge.description}
                  >
                    <BadgeIcon size={11} />
                    {badge.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Dynamic Reviews Carousel (Desktop only) */}
        <div className="hidden md:block w-[220px] shrink-0">
          {!loadingReviews && hotReviews.length > 0 && currentReview ? (
            <button
              onClick={() => setShowAllReviews(true)}
              className="h-full w-full p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-light)] hover:border-[var(--brand-yellow)]/50 relative overflow-hidden text-left transition-colors cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Quote size={12} className="text-[var(--brand-yellow)]" />
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">用户评价</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[var(--text-dim)]">
                  <span>{currentReviewIndex + 1}/{hotReviews.length}</span>
                  <ChevronRight size={12} />
                </div>
              </div>

              {/* Review Content with fade animation */}
              <div
                key={currentReview.id}
                className="animate-fadeIn"
              >
                <div className="flex items-center gap-1 mb-1.5">
                  {renderStars(currentReview.score, 10)}
                </div>
                <p className="text-[11px] text-[var(--text-main)] line-clamp-2 leading-relaxed italic">
                  "{currentReview.comment}"
                </p>
                <div className="mt-1.5 text-[9px] text-[var(--text-dim)]">
                  — {currentReview.userAddress} · {formatDate(currentReview.createdAt)}
                </div>
              </div>

              {/* Progress dots */}
              {hotReviews.length > 1 && (
                <div className="flex justify-center gap-1 mt-2">
                  {hotReviews.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === currentReviewIndex
                          ? 'bg-[var(--brand-yellow)] w-3'
                          : 'bg-[var(--text-dim)]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          ) : !loadingReviews && stats ? (
            <button
              onClick={() => reviews.length > 0 && setShowAllReviews(true)}
              className="h-full w-full p-3 rounded-lg bg-[var(--bg-surface)] hover:border-[var(--brand-yellow)]/50 border border-transparent flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              <MessageSquare size={20} className="text-[var(--text-dim)] mb-2" />
              <span className="text-[11px] text-[var(--text-muted)]">{stats.total} 条评价</span>
              <span className="text-[12px] font-bold text-[var(--brand-yellow)]">{stats.average.toFixed(1)} 分</span>
              {reviews.length > 0 && (
                <span className="text-[9px] text-[var(--text-dim)] mt-1 flex items-center gap-0.5">
                  点击查看 <ChevronRight size={10} />
                </span>
              )}
            </button>
          ) : loadingReviews ? (
            <div className="h-full p-3 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center">
              <span className="text-[11px] text-[var(--text-dim)]">加载中...</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Expertise Areas - Compact */}
      {researcher.expertiseAreas && researcher.expertiseAreas.length > 0 && (
        <div className="mb-2 p-2 rounded-lg bg-[var(--bg-surface)]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap size={12} className="text-[var(--brand-yellow)]" />
            <span className="text-[11px] font-medium text-[var(--text-main)]">擅长领域</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {researcher.expertiseAreas.map((area, index) => (
              <div key={index} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-panel)]">
                <span className="text-[11px] text-[var(--text-main)]">{area.domain}</span>
                <span className="text-[9px] text-[var(--text-muted)]">{area.yearsExp}年</span>
                {area.accuracy && (
                  <span className="text-[9px] px-1 rounded bg-[var(--brand-green)]/10 text-[var(--brand-green)]">
                    {area.accuracy}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* First Answer Preview */}
      {firstAnswer && (
        <div className="rounded-lg p-3 mb-2 bg-[var(--bg-surface)]">
          <p className="text-[12px] md:text-[13px] line-clamp-2 text-[var(--text-main)] leading-relaxed">
            {firstAnswer}
          </p>
        </div>
      )}

      {/* Mobile Reviews - Single line carousel (clickable) */}
      {!loadingReviews && hotReviews.length > 0 && currentReview && (
        <button
          onClick={() => setShowAllReviews(true)}
          className="md:hidden mb-2 px-2 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]/80 border border-transparent hover:border-[var(--brand-yellow)]/30 flex items-center gap-2 w-full text-left transition-colors cursor-pointer"
        >
          <Quote size={10} className="text-[var(--brand-yellow)] shrink-0" />
          <p className="text-[10px] text-[var(--text-muted)] truncate flex-1">
            "{currentReview.comment}"
          </p>
          <div className="flex items-center gap-0.5 shrink-0">
            <Star size={9} className="fill-[var(--brand-yellow)] text-[var(--brand-yellow)]" />
            <span className="text-[10px] text-[var(--brand-yellow)]">{currentReview.score}</span>
          </div>
          <ChevronRight size={12} className="text-[var(--text-dim)] shrink-0" />
        </button>
      )}

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex flex-wrap gap-1.5">
          {researcher.specialties.slice(0, 3).map((specialty, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-[10px] rounded bg-[var(--brand-green)]/10 text-[var(--brand-green)]"
            >
              {specialty}
            </span>
          ))}
        </div>
        {stats && (
          <button
            onClick={() => reviews.length > 0 && setShowAllReviews(true)}
            className={`flex items-center gap-1 text-[10px] text-[var(--text-muted)] ${reviews.length > 0 ? 'hover:text-[var(--brand-yellow)] cursor-pointer transition-colors' : ''}`}
          >
            <MessageSquare size={10} />
            <span>{stats.total} 条评价 · 平均 {stats.average.toFixed(1)} 分</span>
            {reviews.length > 0 && <ChevronRight size={10} />}
          </button>
        )}
      </div>

      {/* Select Button */}
      <button
        onClick={onSelect}
        disabled={isLoading}
        className="w-full py-2.5 md:py-3 rounded-lg font-bold text-[14px] md:text-[15px] disabled:opacity-50 transition hover:opacity-90 bg-[var(--brand-green)] text-black"
      >
        {isLoading ? '选择中...' : '选择该研究员'}
      </button>

      {/* All Reviews Modal */}
      {showAllReviews && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70"
          onClick={() => setShowAllReviews(false)}
        >
          <div
            className="bg-[var(--bg-panel)] rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)] shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={researcher.avatar || getDefaultAvatar(researcher.id)}
                  alt={researcher.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-[14px] font-bold text-[var(--text-main)]">{researcher.name} 的评价</div>
                  {stats && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <div className="flex items-center gap-0.5">
                        {renderStars(stats.average, 12)}
                        <span className="text-[var(--brand-yellow)] font-bold ml-1">{stats.average.toFixed(1)}</span>
                      </div>
                      <span className="text-[var(--text-dim)]">·</span>
                      <span className="text-[var(--text-muted)]">{stats.total} 条评价</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowAllReviews(false)}
                className="p-2 hover:bg-[var(--bg-surface)] rounded-lg transition"
              >
                <X size={18} className="text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Score Distribution */}
            {stats && (
              <div className="px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-light)] shrink-0">
                <div className="flex items-center gap-4">
                  {[5, 4, 3, 2, 1].map(score => {
                    const count = stats.distribution[score] || 0;
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={score} className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[10px] text-[var(--text-muted)]">{score}星</span>
                        </div>
                        <div className="h-1.5 bg-[var(--bg-panel)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--brand-yellow)] rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-[var(--text-dim)]">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div
                    key={review.id}
                    className="p-3 bg-[var(--bg-surface)] rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {renderStars(review.score, 12)}
                        </div>
                        <span className="text-[11px] text-[var(--text-dim)]">
                          {review.userAddress}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-dim)]">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    {review.questionPreview && (
                      <p className="text-[11px] text-[var(--text-dim)] mb-1.5 line-clamp-1">
                        问题：{review.questionPreview}
                      </p>
                    )}
                    {review.comment ? (
                      <p className="text-[13px] text-[var(--text-main)] leading-relaxed">
                        "{review.comment}"
                      </p>
                    ) : (
                      <p className="text-[12px] text-[var(--text-dim)] italic">未留下评论</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                  <p>暂无用户评价</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
