import { useState, useEffect } from 'react';
import { Star, CheckCircle, Heart, Zap, ExternalLink, FileText, MessageCircle, Bell, Clock, Gift, Users, ChevronRight, Lock, Phone, Calendar } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useUserStore } from '../../stores/userStore';
import { favoriteApi, researcherApi } from '../../services/api';
import { LEVEL_CONFIG } from '../../types';
import { useTranslation } from '../../i18n';

const SUBSCRIPTION_COST = 50;

// Get subscription benefits with translations
const getSubscriptionBenefits = (t: (key: string) => string) => [
  { icon: MessageCircle, text: t('chatPanel.subscriptionBenefit1') },
  { icon: Phone, text: t('chatPanel.subscriptionBenefit2') },
  { icon: Calendar, text: t('chatPanel.subscriptionBenefit3') },
  { icon: Bell, text: t('chatPanel.subscriptionBenefit4') },
  { icon: Clock, text: t('chatPanel.subscriptionBenefit5') },
  { icon: Gift, text: t('chatPanel.subscriptionBenefit6') },
];

interface RecommendedResearcher {
  id: string;
  name: string;
  nameEn?: string;
  avatar: string | null;
  ratingScore: number;
  serviceCount: number;
  specialties: string[];
  specialtiesEn?: string[];
}

// 模拟推荐研究员数据
const mockRecommendedResearchers: RecommendedResearcher[] = [
  {
    id: 'rec-001',
    name: 'Alex Chen',
    nameEn: 'Alex Chen',
    avatar: null,
    ratingScore: 4.9,
    serviceCount: 328,
    specialties: ['BTC', 'ETH', '链上数据分析'],
    specialtiesEn: ['BTC', 'ETH', 'On-chain analysis'],
  },
  {
    id: 'rec-002',
    name: '李明阳',
    nameEn: 'Leo Li',
    avatar: null,
    ratingScore: 4.8,
    serviceCount: 256,
    specialties: ['DeFi', 'Layer2', '项目基本面'],
    specialtiesEn: ['DeFi', 'Layer2', 'Fundamentals'],
  },
  {
    id: 'rec-003',
    name: 'Sarah Wang',
    nameEn: 'Sarah Wang',
    avatar: null,
    ratingScore: 4.7,
    serviceCount: 189,
    specialties: ['NFT', 'GameFi', '新兴赛道'],
    specialtiesEn: ['NFT', 'GameFi', 'Emerging sectors'],
  },
  {
    id: 'rec-004',
    name: '张晓风',
    nameEn: 'Xiaofeng Zhang',
    avatar: null,
    ratingScore: 4.9,
    serviceCount: 412,
    specialties: ['宏观分析', '市场情绪', '技术分析'],
    specialtiesEn: ['Macro analysis', 'Market sentiment', 'Technical analysis'],
  },
  {
    id: 'rec-005',
    name: 'Michael Liu',
    nameEn: 'Michael Liu',
    avatar: null,
    ratingScore: 4.6,
    serviceCount: 167,
    specialties: ['Solana生态', 'Meme币', '短线策略'],
    specialtiesEn: ['Solana ecosystem', 'Meme coins', 'Short-term strategies'],
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
  const { t, language } = useTranslation();
  const subscriptionBenefits = getSubscriptionBenefits(t);
  const localizedMockResearchers = mockRecommendedResearchers.map((researcher) => ({
    ...researcher,
    name: language === 'zh' ? researcher.name : (researcher.nameEn || researcher.name),
    specialties: language === 'zh'
      ? researcher.specialties
      : (researcher.specialtiesEn || researcher.specialties),
  }));

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
            const mockFiltered = localizedMockResearchers
              .filter(r => r.id !== selectedResearcher?.researcherId)
              .slice(0, 3);
            setRecommendedResearchers(mockFiltered);
          } else {
            setRecommendedResearchers(filtered);
          }
        })
        .catch(() => {
          // API 出错时使用模拟数据
          const mockFiltered = localizedMockResearchers
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
      alert(t('chatPanel.insufficientEnergySubscribe'));
      return;
    }

    setIsSubscribing(true);
    try {
      const result = await favoriteApi.add(user.id, selectedResearcher.researcherId);
      if (result.success) {
        setIsFavorite(true);
        spendEnergy(result.monthlyCost || SUBSCRIPTION_COST, t('chatPanel.subscribeEnergyDesc'));
        setShowSubscribeConfirm(false);
        // 订阅成功后再次同步余额
        await syncEnergyBalance();
      }
    } catch (error: any) {
      alert(error.message || t('chatPanel.subscribeFailed'));
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
      case 5: return t('chatPanel.verySatisfied');
      case 4: return t('chatPanel.satisfied');
      case 3: return t('chatPanel.average');
      case 2: return t('chatPanel.dissatisfied');
      case 1: return t('chatPanel.veryDissatisfied');
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
        <h3 className="text-[20px] font-bold text-[var(--text-main)] mb-2">{t('chatPanel.chatCompleted')}</h3>
        {selectedResearcher && (
          <p className="text-[15px] text-[var(--text-muted)]">
            {t('chatPanel.thankYouChat')} {selectedResearcher.researcher.name}
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
                {selectedResearcher.researcher.ratingScore.toFixed(1)} · {selectedResearcher.researcher.serviceCount} {t('chatPanel.services')}
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
                {t('chatPanel.tokenBarHomepage')}
              </a>
            )}
            <a
              href={`${tokenbarUrl}/reports`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--bg-app)] rounded-lg text-[14px] text-[var(--text-muted)] hover:text-[var(--brand-green)] hover:bg-[var(--bg-highlight)] transition"
            >
              <FileText size={16} />
              {t('chatPanel.historicalReports')}
            </a>
          </div>

          {/* Hot Reviews */}
          {hotReviews.length > 0 && (
            <div className="pt-3 border-t border-[var(--border-light)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle size={14} className="text-[var(--brand-yellow)]" />
                  <span className="text-[13px] font-medium text-[var(--text-main)]">{t('chatPanel.userReviews')}</span>
                </div>
                {reviewStats && (
                  <div className="flex items-center gap-1.5 text-[12px]">
                    <Star size={12} className="fill-[var(--brand-yellow)] text-[var(--brand-yellow)]" />
                    <span className="font-bold text-[var(--brand-yellow)]">{reviewStats.average.toFixed(1)}</span>
                    <span className="text-[var(--text-muted)]">({reviewStats.total} {t('chatPanel.reviews')})</span>
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
              <span className="text-[16px] font-bold text-[var(--text-main)]">{t('chatPanel.subscribeResearcher')}</span>
            </div>
            <button
              onClick={handleOpenSubscribeModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand-yellow)] text-black rounded-lg text-[15px] font-bold hover:opacity-90 transition"
            >
              <Zap size={16} />
              {SUBSCRIPTION_COST} {t('chatPanel.energy')}
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
              {t('chatPanel.subscribed')} {selectedResearcher.researcher.name}
            </span>
          </div>
        </div>
      )}

      {/* Star Rating */}
      <div className="mb-5 text-center">
        <p className="text-[15px] text-[var(--text-muted)] mb-3">{t('chatPanel.rateConsultation')}</p>
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
            <span className="text-[15px] font-medium text-[var(--text-main)]">{t('chatPanel.recommendOthers')}</span>
          </div>
          {loadingRecommended ? (
            <div className="text-center py-4 text-[14px] text-[var(--text-muted)]">{t('chatPanel.loadingText')}</div>
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
                        {researcher.serviceCount} {t('chatPanel.services')}
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
            <div className="text-center py-4 text-[14px] text-[var(--text-muted)]">{t('chatPanel.noRecommendation')}</div>
          )}
        </div>
      )}

      {/* Comment Input */}
      <div className="mb-5">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('chatPanel.leaveComment')}
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
          {t('chatPanel.skip')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 py-3 bg-[var(--brand-green)] text-black rounded-xl disabled:opacity-50 hover:opacity-90 transition font-bold text-[15px]"
        >
          {isLoading ? t('chatPanel.submitting') : t('chatPanel.submitRating')}
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
                    {t('chatPanel.levelInsufficient')}
                  </h3>
                  <p className="text-[15px] text-[var(--text-muted)]">
                    {t('chatPanel.subscriptionRequiresGold')}
                  </p>
                </div>

                <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] text-[var(--text-muted)]">{t('chat.currentLevel')}</span>
                    <span className="text-[14px] font-medium" style={{ color: LEVEL_CONFIG[user.level].color }}>
                      {user.level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[var(--text-muted)]">{t('chatPanel.needLevel')}</span>
                    <span className="text-[14px] font-medium text-[#ffd700]">Gold+</span>
                  </div>
                </div>

                <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-5">
                  <div className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                    {t('chatPanel.upgradeHint')}
                  </div>
                </div>

                <button
                  onClick={() => setShowSubscribeConfirm(false)}
                  className="w-full py-3 rounded-lg text-[16px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                >
                  {t('chatPanel.gotIt')}
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
                    {t('chatPanel.subscribeResearcherTitle')}
                  </h3>
                  <p className="text-[15px] text-[var(--text-muted)]">
                    {t('chatPanel.subscribe')} {selectedResearcher?.researcher.name}
                  </p>
                </div>

                {/* Benefits in Modal */}
                <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-4">
                  <div className="text-[14px] font-medium text-[var(--text-main)] mb-3">{t('chatPanel.subscriptionBenefits')}</div>
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
                    <span className="text-[var(--text-muted)]">{t('chatPanel.subscriptionCost')}</span>
                    <span className="text-[var(--brand-yellow)] font-medium">{SUBSCRIPTION_COST} {t('chatPanel.energy')}{t('chatPanel.perMonth')}</span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[var(--text-muted)]">{t('chatPanel.currentBalance')}</span>
                    <span className="text-[var(--text-main)]">{user?.energyAvailable || 0} {t('chatPanel.energy')}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSubscribeConfirm(false)}
                    className="flex-1 py-3 rounded-lg text-[16px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSubscribe}
                    disabled={isSubscribing || (user?.energyAvailable || 0) < SUBSCRIPTION_COST}
                    className="flex-1 py-3 rounded-lg text-[16px] font-medium bg-[var(--brand-yellow)] text-black hover:opacity-90 transition disabled:opacity-50"
                  >
                    {isSubscribing ? t('chatPanel.confirming') : t('chatPanel.confirmSubscribe')}
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
