import { useState, useEffect } from 'react';
import { Star, CheckCircle, Heart, Zap, ExternalLink, FileText, MessageCircle, Bell, Clock, Gift, Users, ChevronRight, Lock, Phone, Calendar } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useUserStore } from '../../stores/userStore';
import { favoriteApi, researcherApi } from '../../services/api';
import { LEVEL_CONFIG } from '../../types';

const SUBSCRIPTION_COST = 50;

// 订阅权益列表
const subscriptionBenefits = [
  { icon: MessageCircle, text: '直接发起咨询，无需等待匹配' },
  { icon: Phone, text: '预约 1v1 语音/视频咨询' },
  { icon: Calendar, text: '查看研究员路演日历' },
  { icon: Bell, text: '研究员新研报第一时间推送' },
  { icon: Clock, text: '优先响应，平均响应时间 <3分钟' },
  { icon: Gift, text: '专属折扣：咨询费用 9 折优惠' },
];

interface RecommendedResearcher {
  id: string;
  name: string;
  avatar: string | null;
  ratingScore: number;
  serviceCount: number;
  specialties: string[];
}

// 模拟推荐研究员数据
const mockRecommendedResearchers: RecommendedResearcher[] = [
  {
    id: 'rec-001',
    name: 'Alex Chen',
    avatar: null,
    ratingScore: 4.9,
    serviceCount: 328,
    specialties: ['BTC', 'ETH', '链上数据分析'],
  },
  {
    id: 'rec-002',
    name: '李明阳',
    avatar: null,
    ratingScore: 4.8,
    serviceCount: 256,
    specialties: ['DeFi', 'Layer2', '项目基本面'],
  },
  {
    id: 'rec-003',
    name: 'Sarah Wang',
    avatar: null,
    ratingScore: 4.7,
    serviceCount: 189,
    specialties: ['NFT', 'GameFi', '新兴赛道'],
  },
  {
    id: 'rec-004',
    name: '张晓风',
    avatar: null,
    ratingScore: 4.9,
    serviceCount: 412,
    specialties: ['宏观分析', '市场情绪', '技术分析'],
  },
  {
    id: 'rec-005',
    name: 'Michael Liu',
    avatar: null,
    ratingScore: 4.6,
    serviceCount: 167,
    specialties: ['Solana生态', 'Meme币', '短线策略'],
  },
];

interface HotReview {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  userAddress: string;
}

export function RatingPhase() {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showSubscribeConfirm, setShowSubscribeConfirm] = useState(false);
  const [recommendedResearchers, setRecommendedResearchers] = useState<RecommendedResearcher[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [hotReviews, setHotReviews] = useState<HotReview[]>([]);
  const [reviewStats, setReviewStats] = useState<{ total: number; average: number } | null>(null);
  const { selectedResearcher, submitRating, isLoading } = useChatStore();
  const { user, spendEnergy, syncEnergyBalance } = useUserStore();

  // 检查是否已收藏
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !selectedResearcher) return;
      try {
        const result = await favoriteApi.check(user.id, selectedResearcher.researcherId);
        setIsFavorite(result.isSubscribed);
      } catch (error) {
        console.error('Failed to check favorite:', error);
      }
    };
    checkFavorite();
  }, [user, selectedResearcher]);

  // 获取研究员的热门评价
  useEffect(() => {
    const fetchHotReviews = async () => {
      if (!selectedResearcher) return;
      try {
        const { reviews, stats } = await researcherApi.getReviews(selectedResearcher.researcherId);
        // 筛选有评论的高分评价
        const hot = reviews
          .filter((r: HotReview) => r.comment && r.score >= 4)
          .slice(0, 2);
        setHotReviews(hot);
        setReviewStats({ total: stats.total, average: stats.average });
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }
    };
    fetchHotReviews();
  }, [selectedResearcher]);

  // 当评分低于4分时，获取推荐研究员
  useEffect(() => {
    if (score <= 3 && recommendedResearchers.length === 0 && !loadingRecommended) {
      setLoadingRecommended(true);
      researcherApi.getOnline()
        .then(({ researchers }) => {
          // 过滤掉当前研究员，取前3个，并确保类型正确
          const filtered = researchers
            .filter((r: any) => r.id !== selectedResearcher?.researcherId)
            .slice(0, 3)
            .map((r: any): RecommendedResearcher => ({
              id: r.id,
              name: r.name,
              avatar: r.avatar || null,
              ratingScore: r.ratingScore || 4.5,
              serviceCount: r.serviceCount || 0,
              specialties: Array.isArray(r.specialties) ? r.specialties : (r.specialties ? [r.specialties] : []),
            }));
          // 如果API没有返回数据，使用模拟数据
          if (filtered.length === 0) {
            const mockFiltered = mockRecommendedResearchers
              .filter(r => r.id !== selectedResearcher?.researcherId)
              .slice(0, 3);
            setRecommendedResearchers(mockFiltered);
          } else {
            setRecommendedResearchers(filtered);
          }
        })
        .catch(() => {
          // API 出错时使用模拟数据
          const mockFiltered = mockRecommendedResearchers
            .filter(r => r.id !== selectedResearcher?.researcherId)
            .slice(0, 3);
          setRecommendedResearchers(mockFiltered);
        })
        .finally(() => setLoadingRecommended(false));
    }
  }, [score, selectedResearcher, recommendedResearchers.length, loadingRecommended]);

  // 打开订阅弹窗前先同步能量余额
  const handleOpenSubscribeModal = async () => {
    await syncEnergyBalance();
    setShowSubscribeConfirm(true);
  };

  const handleSubscribe = async () => {
    if (!user || !selectedResearcher) return;

    if (user.energyAvailable < SUBSCRIPTION_COST) {
      alert('能量值不足，无法订阅');
      return;
    }

    setIsSubscribing(true);
    try {
      const result = await favoriteApi.add(user.id, selectedResearcher.researcherId);
      if (result.success) {
        setIsFavorite(true);
        spendEnergy(result.monthlyCost || SUBSCRIPTION_COST, '订阅研究员');
        setShowSubscribeConfirm(false);
        // 订阅成功后再次同步余额
        await syncEnergyBalance();
      }
    } catch (error: any) {
      alert(error.message || '订阅失败');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    await submitRating(user.id, score, comment || undefined);
  };

  const handleSkip = async () => {
    if (!user) return;
    await submitRating(user.id, 5);
  };

  const getRatingText = (s: number) => {
    switch (s) {
      case 5: return '非常满意';
      case 4: return '满意';
      case 3: return '一般';
      case 2: return '不满意';
      case 1: return '非常不满意';
      default: return '';
    }
  };

  // tokenbar 主页链接
  const tokenbarUrl = 'https://sosovalue.com/profile/index/1774072765580394497';

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 bg-[var(--bg-panel)]">
      {/* Completion Icon */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 bg-[var(--brand-green-dim)] rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-[var(--brand-green)]" />
        </div>
        <h3 className="text-[20px] font-bold text-[var(--text-main)] mb-2">对话完成</h3>
        {selectedResearcher && (
          <p className="text-[15px] text-[var(--text-muted)]">
            感谢与 {selectedResearcher.researcher.name} 的对话
          </p>
        )}
      </div>

      {/* Researcher Profile Card with TokenBar Link */}
      {selectedResearcher && (
        <div className="mb-5 p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)]">
          <div className="flex items-center gap-4 mb-4">
            {selectedResearcher.researcher.avatar ? (
              <img
                src={selectedResearcher.researcher.avatar}
                alt={selectedResearcher.researcher.name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[var(--brand-green)] flex items-center justify-center text-black text-[18px] font-bold">
                {selectedResearcher.researcher.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <div className="text-[17px] font-bold text-[var(--text-main)]">
                {selectedResearcher.researcher.name}
              </div>
              <div className="flex items-center gap-2 text-[14px] text-[var(--text-muted)] mt-1">
                <Star size={14} className="text-[var(--brand-yellow)] fill-[var(--brand-yellow)]" />
                {selectedResearcher.researcher.ratingScore.toFixed(1)} · {selectedResearcher.researcher.serviceCount} 次服务
              </div>
            </div>
          </div>

          {/* TokenBar Links */}
          <div className="flex gap-2 mb-4">
            {tokenbarUrl && (
              <a
                href={tokenbarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--bg-app)] rounded-lg text-[14px] text-[var(--text-muted)] hover:text-[var(--brand-yellow)] hover:bg-[var(--bg-highlight)] transition"
              >
                <ExternalLink size={16} />
                TokenBar 主页
              </a>
            )}
            <a
              href={`${tokenbarUrl}/reports`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--bg-app)] rounded-lg text-[14px] text-[var(--text-muted)] hover:text-[var(--brand-green)] hover:bg-[var(--bg-highlight)] transition"
            >
              <FileText size={16} />
              历史研报
            </a>
          </div>

          {/* Hot Reviews - 热门评价直接显示 */}
          {hotReviews.length > 0 && (
            <div className="pt-3 border-t border-[var(--border-light)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle size={14} className="text-[var(--brand-yellow)]" />
                  <span className="text-[13px] font-medium text-[var(--text-main)]">用户好评</span>
                </div>
                {reviewStats && (
                  <div className="flex items-center gap-1.5 text-[12px]">
                    <Star size={12} className="fill-[var(--brand-yellow)] text-[var(--brand-yellow)]" />
                    <span className="font-bold text-[var(--brand-yellow)]">{reviewStats.average.toFixed(1)}</span>
                    <span className="text-[var(--text-muted)]">({reviewStats.total}条)</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {hotReviews.map((review) => (
                  <div
                    key={review.id}
                    className="px-3 py-2 rounded-lg bg-[var(--bg-app)] border-l-2 border-[var(--brand-green)]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            className={i < review.score
                              ? 'fill-[var(--brand-yellow)] text-[var(--brand-yellow)]'
                              : 'text-[var(--text-dim)]'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[var(--text-dim)]">
                        {review.userAddress} · {new Date(review.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[12px] text-[var(--text-main)] leading-relaxed">
                      "{review.comment}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subscription Option with Benefits */}
      {selectedResearcher && !isFavorite && (
        <div className="mb-5 p-4 bg-gradient-to-br from-[var(--brand-yellow)]/10 to-[var(--brand-green)]/10 rounded-xl border border-[var(--brand-yellow)]/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart size={20} className="text-[var(--brand-red)]" />
              <span className="text-[16px] font-bold text-[var(--text-main)]">订阅研究员</span>
            </div>
            <button
              onClick={handleOpenSubscribeModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand-yellow)] text-black rounded-lg text-[15px] font-bold hover:opacity-90 transition"
            >
              <Zap size={16} />
              {SUBSCRIPTION_COST} 能量
            </button>
          </div>

          {/* Benefits List */}
          <div className="space-y-2.5">
            {subscriptionBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-[14px]">
                <div className="w-7 h-7 rounded-full bg-[var(--brand-green)]/20 flex items-center justify-center">
                  <benefit.icon size={14} className="text-[var(--brand-green)]" />
                </div>
                <span className="text-[var(--text-main)]">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isFavorite && selectedResearcher && (
        <div className="mb-5 p-4 bg-[var(--brand-green-dim)] rounded-xl border border-[var(--brand-green)]">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-[var(--brand-green)] fill-[var(--brand-green)]" />
            <span className="text-[15px] text-[var(--brand-green)] font-medium">
              已订阅 {selectedResearcher.researcher.name}
            </span>
          </div>
        </div>
      )}

      {/* Star Rating */}
      <div className="mb-5 text-center">
        <p className="text-[15px] text-[var(--text-muted)] mb-3">为本次咨询评分</p>
        <div className="flex gap-2 justify-center mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setScore(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`${
                  star <= (hoveredStar || score)
                    ? 'fill-[var(--brand-yellow)] text-[var(--brand-yellow)]'
                    : 'text-[var(--text-dim)]'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-[15px] text-[var(--brand-yellow)] font-medium">
          {getRatingText(hoveredStar || score)}
        </p>
      </div>

      {/* Recommended Researchers - Show when rating <= 3 */}
      {score <= 3 && (
        <div className="mb-5 p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)]">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-[var(--brand-yellow)]" />
            <span className="text-[15px] font-medium text-[var(--text-main)]">为您推荐其他研究员</span>
          </div>
          {loadingRecommended ? (
            <div className="text-center py-4 text-[14px] text-[var(--text-muted)]">加载中...</div>
          ) : recommendedResearchers.length > 0 ? (
            <div className="space-y-3">
              {recommendedResearchers.map((researcher) => (
                <a
                  key={researcher.id}
                  href="https://sosovalue.com/profile/index/1774072765580394497"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-[var(--bg-app)] rounded-lg hover:bg-[var(--bg-highlight)] transition group"
                >
                  {researcher.avatar ? (
                    <img src={researcher.avatar} alt={researcher.name} className="w-11 h-11 rounded-full object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[var(--brand-green)] flex items-center justify-center text-black font-bold text-[16px]">
                      {researcher.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[15px] font-medium text-[var(--text-main)] group-hover:text-[var(--brand-yellow)]">
                        {researcher.name}
                      </span>
                      <div className="flex items-center gap-1 text-[13px] text-[var(--text-muted)]">
                        <Star size={12} className="text-[var(--brand-yellow)] fill-[var(--brand-yellow)]" />
                        {researcher.ratingScore.toFixed(1)}
                      </div>
                      <span className="text-[12px] text-[var(--text-dim)]">
                        {researcher.serviceCount} 服务
                      </span>
                    </div>
                    {researcher.specialties && researcher.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {researcher.specialties.slice(0, 3).map((specialty, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[11px] rounded-md bg-[var(--brand-green-dim)] text-[var(--brand-green)]"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-[var(--text-dim)] group-hover:text-[var(--brand-yellow)] shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-[14px] text-[var(--text-muted)]">暂无推荐</div>
          )}
        </div>
      )}

      {/* Comment Input */}
      <div className="mb-5">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="留下评价（可选）"
          rows={3}
          className="w-full p-4 rounded-xl resize-none text-[15px] focus:outline-none focus:border-[var(--brand-yellow)] bg-[var(--bg-surface)] border border-[var(--border-light)] text-[var(--text-main)] placeholder:text-[var(--text-dim)] transition-colors"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSkip}
          disabled={isLoading}
          className="flex-1 py-3 border border-[var(--border-light)] text-[var(--text-muted)] rounded-xl hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)] transition text-[15px]"
        >
          跳过
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 py-3 bg-[var(--brand-green)] text-black rounded-xl disabled:opacity-50 hover:opacity-90 transition font-bold text-[15px]"
        >
          {isLoading ? '提交中...' : '提交评价'}
        </button>
      </div>

      {/* Subscribe Confirmation Modal */}
      {showSubscribeConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-panel)] rounded-xl p-6 mx-4 max-w-[400px] w-full shadow-2xl">
            {/* Check if user has researcher access (Gold+ only) */}
            {user && !LEVEL_CONFIG[user.level].hasResearcherAccess ? (
              // Level requirement not met - show upgrade prompt
              <>
                <div className="text-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-[var(--brand-yellow)] bg-opacity-20 flex items-center justify-center mx-auto mb-4">
                    <Lock size={32} className="text-[var(--brand-yellow)]" />
                  </div>
                  <h3 className="text-[20px] font-bold text-[var(--text-main)] mb-2">
                    等级不足
                  </h3>
                  <p className="text-[15px] text-[var(--text-muted)]">
                    订阅研究员需要 <span className="text-[var(--brand-yellow)] font-medium">Gold</span> 或更高等级
                  </p>
                </div>

                <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] text-[var(--text-muted)]">当前等级</span>
                    <span className="text-[14px] font-medium" style={{ color: LEVEL_CONFIG[user.level].color }}>
                      {user.level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[var(--text-muted)]">需要等级</span>
                    <span className="text-[14px] font-medium text-[#ffd700]">Gold+</span>
                  </div>
                </div>

                <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-5">
                  <div className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                    提升等级：通过交易产生手续费来提升您的等级。30天内累计手续费达到 $1,000 即可升级到 Gold。
                  </div>
                </div>

                <button
                  onClick={() => setShowSubscribeConfirm(false)}
                  className="w-full py-3 rounded-lg text-[16px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                >
                  我知道了
                </button>
              </>
            ) : (
              // Has access - show normal subscription form
              <>
                <div className="text-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-[var(--brand-yellow)] bg-opacity-20 flex items-center justify-center mx-auto mb-4">
                    <Heart size={32} className="text-[var(--brand-yellow)]" />
                  </div>
                  <h3 className="text-[20px] font-bold text-[var(--text-main)] mb-2">
                    订阅研究员
                  </h3>
                  <p className="text-[15px] text-[var(--text-muted)]">
                    订阅 {selectedResearcher?.researcher.name}
                  </p>
                </div>

                {/* Benefits in Modal */}
                <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-4">
                  <div className="text-[14px] font-medium text-[var(--text-main)] mb-3">订阅权益</div>
                  <div className="space-y-2">
                    {subscriptionBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                        <benefit.icon size={14} className="text-[var(--brand-green)]" />
                        <span>{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-5">
                  <div className="flex justify-between text-[15px] mb-2">
                    <span className="text-[var(--text-muted)]">订阅费用</span>
                    <span className="text-[var(--brand-yellow)] font-medium">{SUBSCRIPTION_COST} 能量/月</span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[var(--text-muted)]">当前余额</span>
                    <span className="text-[var(--text-main)]">{user?.energyAvailable || 0} 能量</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSubscribeConfirm(false)}
                    className="flex-1 py-3 rounded-lg text-[16px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubscribe}
                    disabled={isSubscribing || (user?.energyAvailable || 0) < SUBSCRIPTION_COST}
                    className="flex-1 py-3 rounded-lg text-[16px] font-medium bg-[var(--brand-yellow)] text-black hover:opacity-90 transition disabled:opacity-50"
                  >
                    {isSubscribing ? '订阅中...' : '确认订阅'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
