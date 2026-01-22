import { useState, useEffect, useRef } from 'react';
import {
  X, Minimize2, Maximize2, Heart, MessageCircle, Gift, Send, Users,
  Volume2, VolumeX, Play, Pause, Crown
} from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { useTranslation } from '../../i18n';

// 路演活动类型
export interface RoadshowEvent {
  id: string;
  title: string;
  researcher: {
    id: string;
    name: string;
    avatar?: string;
    title?: string;
  };
  topic: string;
  status: 'upcoming' | 'live' | 'ended';
  scheduledAt: string;
  viewerCount?: number;
  likeCount?: number;
  requiredLevel?: 'Gold' | 'Diamond';
}

// Mock 礼物配置
const GIFTS = [
  { id: 'like', icon: '👍', cost: 0, isBig: false },
  { id: 'rocket', icon: '🚀', cost: 10, isBig: false },
  { id: 'diamond', icon: '💎', cost: 50, isBig: true },
  { id: 'crown', icon: '👑', cost: 100, isBig: true },
  { id: 'lambo', icon: '🏎️', cost: 500, isBig: true },
  { id: 'spaceship', icon: '🛸', cost: 1000, isBig: true },
];


interface RoadshowLiveModalProps {
  event: RoadshowEvent | null;
  onClose: () => void;
}

// 火箭动画类型
interface RocketAnimation {
  id: number;
  x: number;
  delay: number;
}

// 全局礼物广播类型
interface GlobalGiftBroadcast {
  id: number;
  user: string;
  gift: typeof GIFTS[0];
}

export function RoadshowLiveModal({ event, onClose }: RoadshowLiveModalProps) {
  const { t, language } = useTranslation();
  const { user } = useUserStore();
  const giftName = (gift: typeof GIFTS[0]) => t(`roadshowLive.gifts.${gift.id}`);
  const initialComments = language === 'zh'
    ? [
      { id: 1, user: 'Trader_王', content: '这个分析太到位了！', isVip: true },
      { id: 2, user: 'Crypto_李', content: 'BTC 目标价多少？', isVip: false },
      { id: 3, user: 'DeFi_张', content: '支持！', isVip: true },
      { id: 4, user: '新手小白', content: '学到了', isVip: false },
    ]
    : [
      { id: 1, user: 'Trader_A', content: 'Great analysis!', isVip: true },
      { id: 2, user: 'Crypto_B', content: 'What is BTC target price?', isVip: false },
      { id: 3, user: 'DeFi_C', content: 'Support!', isVip: true },
      { id: 4, user: 'Newbie', content: 'Learned a lot', isVip: false },
    ];
  const simulatedComments = language === 'zh'
    ? [
      '666',
      '太强了！',
      '感谢分享',
      '老师说得对',
      '学到了',
      '冲冲冲',
      '有道理',
      '干货满满',
      '这波分析绝了',
      '支持！',
      '第一次看就被圈粉',
      '啥时候抄底？',
      '目标价多少？',
      '这轮牛市还能持续吗',
      '怎么看ETH？',
      '老师威武',
      '关注了',
      '讲得真好',
      'WAGMI',
      'To the moon!',
    ]
    : [
      'Nice!',
      'Great insights!',
      'Thanks for sharing',
      'Spot on',
      'Learned a lot',
      'Let’s go',
      'Makes sense',
      'Solid alpha',
      'Brilliant analysis',
      'Support!',
      'Big fan already',
      'When to buy the dip?',
      'Target price?',
      'Will this bull run continue?',
      'Thoughts on ETH?',
      'Awesome',
      'Following',
      'Excellent talk',
      'WAGMI',
      'To the moon!',
    ];
  const simulatedUsernames = language === 'zh'
    ? [
      'Crypto_大师', 'BTC_holder', '韭菜小白', 'DeFi_农民', '合约战神',
      '现货党', '梭哈王', '稳健投资', '新手一枚', '老韭菜',
      '逢低买入', '止损专家', '满仓干', 'ETH_信仰', 'Sol_冲浪者',
    ]
    : [
      'Crypto_Pro', 'BTC_holder', 'Alt_Fan', 'DeFi_Farmer', 'Futures_Star',
      'Spot_Only', 'YOLO_King', 'Steady_Investor', 'Newbie_01', 'Old_Timer',
      'Buy_The_Dip', 'StopLoss_Guru', 'AllIn_Mode', 'ETH_Believer', 'Sol_Surfer',
    ];
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [viewerCount, setViewerCount] = useState(event?.viewerCount || 1234);
  const [likeCount, setLikeCount] = useState(event?.likeCount || 567);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [giftAnimation, setGiftAnimation] = useState<{ icon: string; id: number } | null>(null);
  const [rocketAnimations, setRocketAnimations] = useState<RocketAnimation[]>([]);
  const [globalBroadcast, setGlobalBroadcast] = useState<GlobalGiftBroadcast | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // 模拟观看人数变化
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setComments(initialComments);
  }, [language]);

  // 模拟实时评论
  useEffect(() => {
    if (!event) return;
    const interval = setInterval(() => {
      // 随机添加一条评论
      if (Math.random() > 0.4) {
        const randomComment = simulatedComments[Math.floor(Math.random() * simulatedComments.length)];
        const randomUser = simulatedUsernames[Math.floor(Math.random() * simulatedUsernames.length)];
        const isVip = Math.random() > 0.7;
        setComments(prev => [...prev.slice(-50), {
          id: Date.now(),
          user: randomUser,
          content: randomComment,
          isVip,
        }]);
      }
      // 随机刷礼物
      if (Math.random() > 0.85) {
        const randomUser = simulatedUsernames[Math.floor(Math.random() * simulatedUsernames.length)];
        const giftIndex = Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 2);
        const gift = GIFTS[giftIndex];
        handleSimulatedGift(randomUser, gift);
      }
    }, 2000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [event]);

  // 模拟礼物
  const handleSimulatedGift = (userName: string, gift: typeof GIFTS[0]) => {
    // 添加评论
    setComments(prev => [...prev.slice(-50), {
      id: Date.now(),
      user: userName,
      content: t('roadshowLive.sentGiftComment')
        .replace('{icon}', gift.icon)
        .replace('{gift}', giftName(gift)),
      isVip: true,
    }]);

    // 显示动画
    if (gift.id === 'rocket') {
      triggerRocketAnimation();
    } else if (gift.isBig) {
      // 大额礼物全局广播
      setGlobalBroadcast({ id: Date.now(), user: userName, gift });
      setTimeout(() => setGlobalBroadcast(null), 4000);
    } else {
      handleGiftAnimation(gift.icon);
    }
  };

  // 自动滚动到最新评论
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // 点击外部关闭（仅在非最小化状态）
  useEffect(() => {
    if (isMinimized) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, isMinimized]);

  if (!event) return null;

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: Date.now(),
      user: user?.walletAddress?.slice(0, 8) || t('roadshowLive.anonymousUser'),
      content: newComment,
      isVip: (user?.level === 'Gold' || user?.level === 'Diamond'),
    };
    setComments(prev => [...prev.slice(-50), comment]);
    setNewComment('');
  };

  const handleLike = () => {
    setLikeCount(prev => prev + 1);
    // 添加浮动表情
    const id = Date.now();
    const x = Math.random() * 60 + 20; // 20-80%
    setFloatingEmojis(prev => [...prev, { id, emoji: '❤️', x }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2000);
  };

  // 触发火箭动画
  const triggerRocketAnimation = () => {
    const count = 5 + Math.floor(Math.random() * 5); // 5-10个火箭
    const rockets: RocketAnimation[] = [];
    for (let i = 0; i < count; i++) {
      rockets.push({
        id: Date.now() + i,
        x: Math.random() * 80 + 10, // 10-90%
        delay: Math.random() * 500,
      });
    }
    setRocketAnimations(rockets);
    setTimeout(() => setRocketAnimations([]), 3000);
  };

  const handleSendGift = (gift: typeof GIFTS[0]) => {
    if (gift.cost > 0 && (user?.energyAvailable || 0) < gift.cost) {
      return; // 能量不足
    }

    const userName = user?.walletAddress?.slice(0, 8) || t('roadshowLive.meUser');

    // 添加评论
    setComments(prev => [...prev.slice(-50), {
      id: Date.now(),
      user: userName,
      content: t('roadshowLive.sentGiftComment')
        .replace('{icon}', gift.icon)
        .replace('{gift}', giftName(gift)),
      isVip: true,
    }]);

    // 根据礼物类型显示不同动画
    if (gift.id === 'rocket') {
      triggerRocketAnimation();
    } else if (gift.isBig) {
      // 大额礼物全局广播
      setGlobalBroadcast({ id: Date.now(), user: userName, gift });
      setTimeout(() => setGlobalBroadcast(null), 4000);
    } else {
      handleGiftAnimation(gift.icon);
    }

    setShowGiftPanel(false);
  };

  const handleGiftAnimation = (icon: string) => {
    const id = Date.now();
    setGiftAnimation({ icon, id });
    setTimeout(() => setGiftAnimation(null), 1500);
  };

  // 最小化视图
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-40 w-72 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-lg shadow-2xl overflow-hidden cursor-pointer group"
        onClick={() => setIsMinimized(false)}
      >
        {/* 迷你视频区域 */}
        <div className="relative h-40 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]">
          {/* 模拟视频播放 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[40px] animate-pulse">📺</div>
          </div>

          {/* Live 标签 */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-[var(--brand-red)] rounded text-[10px] font-bold text-white">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            {t('roadshowLive.liveBadge')}
          </div>

          {/* 观看人数 */}
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/50 rounded text-[10px] text-white">
            <Users size={10} />
            {viewerCount.toLocaleString()}
          </div>

          {/* 展开按钮 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <Maximize2 size={24} className="text-white" />
          </div>
        </div>

        {/* 迷你信息栏 */}
        <div className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-[var(--text-main)] truncate">
                {event.title}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] truncate">
                {event.researcher.name}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 hover:bg-[var(--bg-surface)] rounded transition-colors"
            >
              <X size={14} className="text-[var(--text-muted)]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 完整视图
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
      <div
        ref={modalRef}
        className="bg-[var(--bg-panel)] border-0 md:border border-[var(--border-light)] md:rounded-xl w-full h-full md:h-[600px] md:max-h-[80vh] md:max-w-4xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-0.5 md:py-1 bg-[var(--brand-red)] rounded text-[10px] md:text-[11px] font-bold text-white shrink-0">
              <span className="w-1.5 md:w-2 h-1.5 md:h-2 bg-white rounded-full animate-pulse" />
              {t('roadshowLive.liveBadge')}
            </div>
            <div className="min-w-0">
              <h2 className="text-[13px] md:text-[14px] font-bold text-[var(--text-main)] truncate">
                {event.title}
              </h2>
              <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-[11px] text-[var(--text-muted)]">
                <span>{event.researcher.name}</span>
                {event.researcher.title && (
                  <>
                    <span className="hidden md:inline">·</span>
                    <span className="hidden md:inline">{event.researcher.title}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="hidden md:block p-1.5 hover:bg-[var(--bg-surface)] rounded transition-colors"
              title={t('roadshowLive.minimizeHint')}
            >
              <Minimize2 size={16} className="text-[var(--text-muted)]" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--bg-surface)] rounded transition-colors"
            >
              <X size={16} className="text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Main Content - 移动端纵向排列 */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Video Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Video Player */}
            <div className="relative flex-1 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] min-h-[200px] md:min-h-[300px] overflow-hidden">
              {/* 模拟视频 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-[80px] mb-4">📺</div>
                  <div className="text-[14px] text-[var(--text-muted)]">
                    {t('roadshowLive.liveScene')}
                  </div>
                </div>
              </div>

              {/* 礼物动画 */}
              {giftAnimation && (
                <div
                  key={giftAnimation.id}
                  className="absolute left-1/2 bottom-1/2 text-[60px] animate-bounce"
                  style={{
                    animation: 'giftFloat 1.5s ease-out forwards',
                  }}
                >
                  {giftAnimation.icon}
                </div>
              )}

              {/* 火箭动画 */}
              {rocketAnimations.map(rocket => (
                <div
                  key={rocket.id}
                  className="absolute bottom-0 text-[40px]"
                  style={{
                    left: `${rocket.x}%`,
                    animation: `rocketLaunch 2s ease-out forwards`,
                    animationDelay: `${rocket.delay}ms`,
                  }}
                >
                  🚀
                </div>
              ))}

              {/* 浮动爱心 */}
              {floatingEmojis.map(emoji => (
                <div
                  key={emoji.id}
                  className="absolute bottom-20 text-[30px] pointer-events-none"
                  style={{
                    left: `${emoji.x}%`,
                    animation: 'floatUp 2s ease-out forwards',
                  }}
                >
                  {emoji.emoji}
                </div>
              ))}

              {/* 控制条 */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      {isPlaying ? (
                        <Pause size={20} className="text-white" />
                      ) : (
                        <Play size={20} className="text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX size={20} className="text-white" />
                      ) : (
                        <Volume2 size={20} className="text-white" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-white">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{viewerCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={14} className="text-[var(--brand-red)]" />
                      <span>{likeCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interaction Bar */}
            <div className="shrink-0 p-3 border-t border-[var(--border-light)] bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2">
                {/* 点赞 */}
                <button
                  onClick={handleLike}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[var(--brand-red)]/10 hover:bg-[var(--brand-red)]/20 text-[var(--brand-red)] rounded-lg transition-colors"
                >
                  <Heart size={16} />
                  <span className="text-[12px] font-medium">{t('roadshowLive.like')}</span>
                </button>

                {/* 礼物 */}
                <div className="relative">
                  <button
                    onClick={() => setShowGiftPanel(!showGiftPanel)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[var(--brand-yellow)]/10 hover:bg-[var(--brand-yellow)]/20 text-[var(--brand-yellow)] rounded-lg transition-colors"
                  >
                    <Gift size={16} />
                    <span className="text-[12px] font-medium">{t('roadshowLive.gift')}</span>
                  </button>

                  {/* 礼物面板 */}
                  {showGiftPanel && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-lg shadow-xl">
                      <div className="grid grid-cols-4 gap-2 min-w-[200px]">
                        {GIFTS.map(gift => (
                          <button
                            key={gift.id}
                            onClick={() => handleSendGift(gift)}
                            className="flex flex-col items-center gap-1 p-2 hover:bg-[var(--bg-surface)] rounded transition-colors"
                          >
                            <span className="text-[24px]">{gift.icon}</span>
                            <span className="text-[9px] text-[var(--text-muted)]">{giftName(gift)}</span>
                            {gift.cost > 0 && (
                              <span className="text-[8px] text-[var(--brand-yellow)]">
                                ⚡{gift.cost}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 快速反应 */}
                <div className="flex items-center gap-1">
                  {['🔥', '👏', '💯', '🎉'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleGiftAnimation(emoji)}
                      className="p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors text-[18px]"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area - 移动端下方显示，桌面端右侧 - 固定高度，评论区滚动 */}
          <div className="w-full md:w-80 h-[200px] md:h-full border-t md:border-t-0 md:border-l border-[var(--border-light)] flex flex-col bg-[var(--bg-surface)] overflow-hidden">
            {/* Chat Header */}
            <div className="shrink-0 px-3 py-2 border-b border-[var(--border-light)]">
              <div className="flex items-center gap-2">
                <MessageCircle size={14} className="text-[var(--text-muted)]" />
                <span className="text-[12px] font-medium text-[var(--text-main)]">{t('roadshowLive.liveComments')}</span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {t('roadshowLive.commentCount').replace('{count}', String(comments.length))}
                </span>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 md:space-y-2">
              {comments.map(comment => (
                <div key={comment.id} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`text-[11px] font-medium ${
                        comment.isVip ? 'text-[var(--brand-yellow)]' : 'text-[var(--text-muted)]'
                      }`}>
                        {comment.user}
                      </span>
                      {comment.isVip && (
                        <Crown size={10} className="text-[var(--brand-yellow)]" />
                      )}
                    </div>
                    <p className="text-[12px] text-[var(--text-main)] break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Input */}
            <div className="shrink-0 p-2 border-t border-[var(--border-light)]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                  placeholder={t('roadshowLive.commentPlaceholder')}
                  className="flex-1 bg-[var(--bg-app)] text-[var(--text-main)] text-[12px] px-3 py-2 rounded-lg border border-transparent focus:border-[var(--brand-yellow)] focus:outline-none"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!newComment.trim()}
                  className="p-2 bg-[var(--brand-yellow)] text-black rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 全局礼物广播 */}
      {globalBroadcast && (
        <div
          key={globalBroadcast.id}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top duration-500"
        >
          <div className="bg-gradient-to-r from-[#ff6b35] via-[#ffc107] to-[#ff6b35] px-8 py-4 rounded-2xl shadow-2xl border-2 border-white/30">
            <div className="flex items-center gap-4">
              <div className="text-[60px] animate-bounce">{globalBroadcast.gift.icon}</div>
              <div className="text-center">
                <div className="text-white text-[18px] font-bold drop-shadow-lg">
                  {globalBroadcast.user}
                </div>
                <div className="text-white/90 text-[14px]">
                  {t('roadshowLive.sentGiftBroadcast').replace('{gift}', giftName(globalBroadcast.gift))}
                </div>
                <div className="text-[#ffd700] text-[12px] mt-1">
                  ⚡ {globalBroadcast.gift.cost} {t('roadshowLive.energyUnit')}
                </div>
              </div>
              <div className="text-[60px] animate-bounce" style={{ animationDelay: '0.1s' }}>
                {globalBroadcast.gift.icon}
              </div>
            </div>
            {/* 闪光效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse rounded-2xl" />
          </div>
        </div>
      )}

      {/* CSS for gift animation */}
      <style>{`
        @keyframes giftFloat {
          0% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -100px) scale(1.5);
          }
        }
        @keyframes rocketLaunch {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: translateY(-200px) rotate(-10deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-400px) rotate(-20deg);
          }
        }
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-150px) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}
