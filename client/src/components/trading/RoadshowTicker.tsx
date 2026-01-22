import { useState, useEffect } from 'react';
import { Calendar, Radio, Clock, Users, ChevronRight, Crown } from 'lucide-react';
import { useTranslation } from '../../i18n';

// 路演数据接口
export interface RoadshowEvent {
  id: string;
  title: string;
  speaker: string;
  startTime: Date;
  endTime: Date;
  isLive: boolean;
  type: 'video' | 'audio' | 'ama';
  requiredLevel: 'Gold' | 'Diamond';
  registeredCount: number;
}

// 模拟路演数据
const mockRoadshowEvents: RoadshowEvent[] = [
  {
    id: 'rs-live-001',
    title: 'BTC 实时行情解读',
    speaker: 'Alex Chen',
    startTime: new Date(Date.now() - 30 * 60 * 1000), // 30分钟前开始
    endTime: new Date(Date.now() + 30 * 60 * 1000), // 30分钟后结束
    isLive: true,
    type: 'video',
    requiredLevel: 'Gold',
    registeredCount: 89,
  },
  {
    id: 'rs-001',
    title: 'BTC 2025年行情展望与策略分析',
    speaker: 'Alex Chen',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
    isLive: false,
    type: 'video',
    requiredLevel: 'Gold',
    registeredCount: 156,
  },
  {
    id: 'rs-002',
    title: 'DeFi 新趋势：RWA与链上金融',
    speaker: '李明阳',
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    isLive: false,
    type: 'video',
    requiredLevel: 'Gold',
    registeredCount: 89,
  },
  {
    id: 'rs-003',
    title: 'VIP 专属: Q1 投资组合配置',
    speaker: 'Michael Liu',
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000),
    isLive: false,
    type: 'video',
    requiredLevel: 'Diamond',
    registeredCount: 23,
  },
  {
    id: 'rs-004',
    title: 'AMA: Layer2 生态发展与机会',
    speaker: 'Sarah Wang',
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    isLive: false,
    type: 'ama',
    requiredLevel: 'Gold',
    registeredCount: 112,
  },
];

interface RoadshowTickerProps {
  onOpenCalendar: () => void;
  onOpenLive?: (event: RoadshowEvent) => void;
}

export function RoadshowTicker({ onOpenCalendar, onOpenLive }: RoadshowTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { t, language } = useTranslation();

  // 获取正在进行的路演
  const liveEvent = mockRoadshowEvents.find(e => e.isLive);

  // 获取即将开始的路演
  const upcomingEvents = mockRoadshowEvents
    .filter(e => !e.isLive && e.startTime > new Date())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // 自动轮播
  useEffect(() => {
    if (isHovered || upcomingEvents.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % upcomingEvents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered, upcomingEvents.length]);

  // 计算倒计时
  const getCountdown = (startTime: Date) => {
    const now = new Date();
    const diff = startTime.getTime() - now.getTime();
    if (diff < 0) return t('roadshow.countdown.started');

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `${days}${t('roadshow.countdown.days')} ${hours}${t('roadshow.countdown.hours')}${t('roadshow.countdown.after')}`;
    if (hours > 0) return `${hours}${t('roadshow.countdown.hours')} ${minutes}${t('roadshow.countdown.minutes')}${t('roadshow.countdown.after')}`;
    return `${minutes}${t('roadshow.countdown.minutes')}${t('roadshow.countdown.after')}`;
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) + ' ' +
           date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const currentEvent = upcomingEvents[currentIndex];

  return (
    <div data-onboarding="roadshow" className="flex h-7 md:h-8 bg-gradient-to-r from-[var(--brand-yellow)]/10 via-[var(--bg-panel)] to-[var(--brand-yellow)]/10 border-b border-[var(--border-light)] items-center overflow-hidden">
      <div className="flex items-center w-full px-2 md:px-4">
        {/* Left: Calendar Icon & Label */}
        <button
          onClick={onOpenCalendar}
          className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 rounded-lg hover:bg-[var(--bg-surface)] transition shrink-0"
        >
          <Calendar size={12} className="md:hidden text-[var(--brand-yellow)]" />
          <Calendar size={14} className="hidden md:block text-[var(--brand-yellow)]" />
          <span className="text-[10px] md:text-[12px] font-medium text-[var(--brand-yellow)]">{t('roadshowTicker.roadshow')}</span>
        </button>

        <div className="w-px h-3 md:h-4 bg-[var(--border-light)] mx-1.5 md:mx-3" />

        {/* Live Event - If exists */}
        {liveEvent && (
          <>
            <div
              className="flex items-center gap-1.5 md:gap-3 px-2 md:px-3 py-0.5 md:py-1 bg-[var(--brand-red)]/10 rounded-lg cursor-pointer hover:bg-[var(--brand-red)]/20 transition shrink-0 animate-pulse"
              onClick={() => onOpenLive?.(liveEvent)}
            >
              <div className="flex items-center gap-1">
                <Radio size={10} className="md:hidden text-[var(--brand-red)]" />
                <Radio size={12} className="hidden md:block text-[var(--brand-red)]" />
                <span className="text-[9px] md:text-[11px] font-bold text-[var(--brand-red)]">LIVE</span>
              </div>
              <span className="text-[10px] md:text-[12px] text-[var(--text-main)] font-medium truncate max-w-[80px] md:max-w-none">
                {liveEvent.title}
              </span>
              <span className="hidden md:inline text-[11px] text-[var(--text-muted)]">
                by {liveEvent.speaker}
              </span>
              <div className="hidden md:flex items-center gap-1 text-[11px] text-[var(--brand-red)]">
                <Users size={10} />
                <span>{liveEvent.registeredCount} {t('roadshow.watching')}</span>
              </div>
            </div>
            <div className="w-px h-3 md:h-4 bg-[var(--border-light)] mx-1.5 md:mx-3" />
          </>
        )}

        {/* Upcoming Events Marquee */}
        <div
          className="flex-1 overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {currentEvent ? (
            <div
              className="flex items-center gap-2 md:gap-4 cursor-pointer hover:text-[var(--brand-yellow)] transition"
              onClick={onOpenCalendar}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <Clock size={10} className="md:hidden text-[var(--text-muted)]" />
                <Clock size={12} className="hidden md:block text-[var(--text-muted)]" />
                <span className="text-[10px] md:text-[12px] text-[var(--brand-yellow)] font-medium">
                  {getCountdown(currentEvent.startTime)}
                </span>
              </div>
              <span className="text-[10px] md:text-[12px] text-[var(--text-main)] truncate max-w-[100px] md:max-w-none">
                {currentEvent.title}
              </span>
              <span className="hidden md:inline text-[11px] text-[var(--text-muted)]">
                by {currentEvent.speaker}
              </span>
              {currentEvent.requiredLevel === 'Diamond' && (
                <span className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-[#b9f2ff]/20 text-[#b9f2ff]">
                  <Crown size={10} />
                  VIP
                </span>
              )}
              <span className="hidden md:inline text-[11px] text-[var(--text-dim)]">
                {formatTime(currentEvent.startTime)}
              </span>
              <div className="hidden md:flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                <Users size={10} />
                <span>{currentEvent.registeredCount}</span>
              </div>
            </div>
          ) : (
            <span className="text-[10px] md:text-[12px] text-[var(--text-muted)]">{t('roadshow.noUpcoming')}</span>
          )}
        </div>

        {/* Right: View All */}
        <button
          onClick={onOpenCalendar}
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--brand-yellow)] transition shrink-0"
        >
          <span>{t('roadshowTicker.viewAll')}</span>
          <ChevronRight size={12} />
        </button>

        {/* Pagination Dots */}
        {upcomingEvents.length > 1 && (
          <div className="flex items-center gap-1 ml-2">
            {upcomingEvents.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition ${
                  idx === currentIndex
                    ? 'bg-[var(--brand-yellow)]'
                    : 'bg-[var(--text-dim)] hover:bg-[var(--text-muted)]'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
