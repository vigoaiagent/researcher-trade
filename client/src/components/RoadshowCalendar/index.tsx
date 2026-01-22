import { useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Bell,
  BellOff,
  Video,
  Mic,
  ExternalLink,
  Lock,
  Crown,
  CalendarPlus,
} from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { useTranslation } from '../../i18n';
import { LEVEL_CONFIG } from '../../types';
import type { UserLevel } from '../../types';

// 路演类型
type RoadshowType = 'video' | 'audio' | 'ama';

// 路演状态
type RoadshowStatus = 'upcoming' | 'live' | 'ended' | 'cancelled';

// 路演数据接口
interface Roadshow {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  speaker: {
    id: string;
    name: string;
    avatar: string | null;
    title: string;
    nameEn?: string;
    titleEn?: string;
  };
  type: RoadshowType;
  status: RoadshowStatus;
  startTime: Date;
  endTime: Date;
  registeredCount: number;
  maxAttendees: number;
  requiredLevel: 'Gold' | 'Diamond';
  tags: string[];
  tagsEn?: string[];
  meetingUrl?: string;
}

// 模拟路演数据
const mockRoadshows: Roadshow[] = [
  {
    id: 'rs-001',
    title: 'BTC 2025年行情展望与策略分析',
    titleEn: 'BTC 2025 Outlook & Strategy',
    description: '深度解读比特币在2025年的宏观走势，以及如何在不同市场阶段制定交易策略。',
    descriptionEn: 'Deep dive into Bitcoin’s 2025 macro outlook and strategies for different market phases.',
    speaker: {
      id: 'spk-001',
      name: 'Alex Chen',
      avatar: null,
      title: '首席分析师',
      nameEn: 'Alex Chen',
      titleEn: 'Chief Analyst',
    },
    type: 'video',
    status: 'upcoming',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 90分钟
    registeredCount: 156,
    maxAttendees: 200,
    requiredLevel: 'Gold',
    tags: ['BTC', '宏观分析', '策略'],
    tagsEn: ['BTC', 'Macro', 'Strategy'],
  },
  {
    id: 'rs-002',
    title: 'DeFi 新趋势：RWA与链上金融',
    titleEn: 'DeFi Trends: RWA & On-chain Finance',
    description: '探讨 Real World Assets 如何改变 DeFi 生态，以及2025年值得关注的项目。',
    descriptionEn: 'Explore how Real World Assets reshape DeFi and the projects to watch in 2025.',
    speaker: {
      id: 'spk-002',
      name: '李明阳',
      avatar: null,
      title: '研究总监',
      nameEn: 'Leo Li',
      titleEn: 'Research Director',
    },
    type: 'video',
    status: 'upcoming',
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5天后
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 60分钟
    registeredCount: 89,
    maxAttendees: 150,
    requiredLevel: 'Gold',
    tags: ['DeFi', 'RWA', '项目分析'],
    tagsEn: ['DeFi', 'RWA', 'Project analysis'],
  },
  {
    id: 'rs-003',
    title: 'VIP 专属: 2025 Q1 投资组合配置',
    titleEn: 'VIP Exclusive: 2025 Q1 Portfolio Allocation',
    description: 'Diamond 会员专属路演，分享机构级投资组合配置策略与风险管理。',
    descriptionEn: 'Diamond member roadshow sharing institutional portfolio allocation and risk management.',
    speaker: {
      id: 'spk-003',
      name: 'Michael Liu',
      avatar: null,
      title: '高级策略师',
      nameEn: 'Michael Liu',
      titleEn: 'Senior Strategist',
    },
    type: 'video',
    status: 'upcoming',
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000), // 120分钟
    registeredCount: 23,
    maxAttendees: 50,
    requiredLevel: 'Diamond',
    tags: ['投资组合', '风险管理', 'VIP专属'],
    tagsEn: ['Portfolio', 'Risk management', 'VIP'],
  },
  {
    id: 'rs-004',
    title: 'AMA: Layer2 生态发展与机会',
    titleEn: 'AMA: Layer2 Ecosystem Opportunities',
    description: '与研究员实时互动，回答关于 Layer2 生态的所有问题。',
    descriptionEn: 'Live AMA with researchers to answer all your Layer2 questions.',
    speaker: {
      id: 'spk-004',
      name: 'Sarah Wang',
      avatar: null,
      title: '链上研究员',
      nameEn: 'Sarah Wang',
      titleEn: 'On-chain Researcher',
    },
    type: 'ama',
    status: 'upcoming',
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 60分钟
    registeredCount: 112,
    maxAttendees: 300,
    requiredLevel: 'Gold',
    tags: ['Layer2', 'AMA', '互动'],
    tagsEn: ['Layer2', 'AMA', 'Q&A'],
  },
  {
    id: 'rs-005',
    title: 'Meme币投资指南：如何识别机会与风险',
    titleEn: 'Meme Coin Investing: Opportunities & Risks',
    description: '分析 Meme 币市场的运作机制，以及如何在高波动中寻找机会。',
    descriptionEn: 'Analyze meme coin market mechanics and how to spot opportunities amid volatility.',
    speaker: {
      id: 'spk-005',
      name: '张晓风',
      avatar: null,
      title: '市场分析师',
      nameEn: 'Xiaofeng Zhang',
      titleEn: 'Market Analyst',
    },
    type: 'audio',
    status: 'upcoming',
    startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1天后
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45分钟
    registeredCount: 201,
    maxAttendees: 500,
    requiredLevel: 'Gold',
    tags: ['Meme', '短线', '风险'],
    tagsEn: ['Meme', 'Short-term', 'Risk'],
  },
];

interface RoadshowCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoadshowCalendar({ isOpen, onClose }: RoadshowCalendarProps) {
  const { user } = useUserStore();
  const { t, language } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [registeredRoadshows, setRegisteredRoadshows] = useState<string[]>([]);
  const [selectedRoadshow, setSelectedRoadshow] = useState<Roadshow | null>(null);

  const userLevel = (user?.level || 'Bronze') as UserLevel;
  const hasRoadshowAccess = user ? LEVEL_CONFIG[userLevel]?.hasRoadshowAccess : false;
  const getLocalizedTitle = (roadshow: Roadshow) => (language === 'zh' ? roadshow.title : (roadshow.titleEn || roadshow.title));
  const getLocalizedDescription = (roadshow: Roadshow) => (language === 'zh' ? roadshow.description : (roadshow.descriptionEn || roadshow.description));
  const getLocalizedSpeakerName = (roadshow: Roadshow) => (language === 'zh' ? roadshow.speaker.name : (roadshow.speaker.nameEn || roadshow.speaker.name));
  const getLocalizedSpeakerTitle = (roadshow: Roadshow) => (language === 'zh' ? roadshow.speaker.title : (roadshow.speaker.titleEn || roadshow.speaker.title));
  const getLocalizedTags = (roadshow: Roadshow) => (language === 'zh' ? roadshow.tags : (roadshow.tagsEn || roadshow.tags));

  // 检查用户等级是否满足路演要求
  const canAccessRoadshow = (requiredLevel: 'Gold' | 'Diamond') => {
    if (!hasRoadshowAccess) return false;
    if (requiredLevel === 'Diamond' && userLevel !== 'Diamond') return false;
    return true;
  };

  // 获取当月天数
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  // 获取某天的路演
  const getRoadshowsForDay = (day: number) => {
    return mockRoadshows.filter((rs) => {
      const rsDate = rs.startTime;
      return (
        rsDate.getFullYear() === selectedMonth.getFullYear() &&
        rsDate.getMonth() === selectedMonth.getMonth() &&
        rsDate.getDate() === day
      );
    });
  };

  // 切换月份
  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedMonth(newDate);
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric', weekday: 'short' });
  };

  // 获取路演类型图标
  const getTypeIcon = (type: RoadshowType) => {
    switch (type) {
      case 'video':
        return <Video size={14} />;
      case 'audio':
        return <Mic size={14} />;
      case 'ama':
        return <Users size={14} />;
    }
  };

  // 获取路演类型标签
  const getTypeLabel = (type: RoadshowType) => {
    switch (type) {
      case 'video':
        return t('roadshow.videoLive');
      case 'audio':
        return t('roadshow.audioLive');
      case 'ama':
        return t('roadshow.amaSession');
    }
  };

  // 显示日历选项的路演ID
  const [showCalendarOptions, setShowCalendarOptions] = useState<string | null>(null);

  // 注册路演
  const handleRegister = (roadshowId: string) => {
    if (registeredRoadshows.includes(roadshowId)) {
      setRegisteredRoadshows(registeredRoadshows.filter((id) => id !== roadshowId));
    } else {
      setRegisteredRoadshows([...registeredRoadshows, roadshowId]);
    }
  };

  // 生成 ICS 文件内容 (Apple Calendar / 本地日历)
  const generateICS = (roadshow: Roadshow) => {
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    const title = getLocalizedTitle(roadshow);
    const description = getLocalizedDescription(roadshow);
    const speakerName = getLocalizedSpeakerName(roadshow);
    const speakerTitle = getLocalizedSpeakerTitle(roadshow);
    const tags = getLocalizedTags(roadshow).join(', ');
    const summaryPrefix = language === 'zh' ? '【SoDEX路演】' : 'SoDEX Roadshow: ';
    const speakerLabel = language === 'zh' ? '讲师' : 'Speaker';
    const tagsLabel = language === 'zh' ? '标签' : 'Tags';
    const locationLabel = language === 'zh' ? 'SoDEX 在线直播' : 'SoDEX Live Stream';
    const reminderText = language === 'zh' ? 'SoDEX路演即将开始' : 'SoDEX roadshow starting soon';

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SoDEX//Roadshow Calendar//CN
BEGIN:VEVENT
UID:${roadshow.id}@sodex.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(roadshow.startTime)}
DTEND:${formatICSDate(roadshow.endTime)}
SUMMARY:${summaryPrefix}${title}
DESCRIPTION:${speakerLabel}: ${speakerName} (${speakerTitle})\\n\\n${description}\\n\\n${tagsLabel}: ${tags}
LOCATION:${locationLabel}
ORGANIZER;CN=${speakerName}:mailto:roadshow@sodex.com
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:${reminderText}
TRIGGER:-PT30M
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  };

  // 下载 ICS 文件
  const downloadICS = (roadshow: Roadshow) => {
    const icsContent = generateICS(roadshow);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sodex-roadshow-${roadshow.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 同时注册
    if (!registeredRoadshows.includes(roadshow.id)) {
      handleRegister(roadshow.id);
    }
    setShowCalendarOptions(null);
  };

  // 生成 Google Calendar URL
  const generateGoogleCalendarUrl = (roadshow: Roadshow) => {
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    const title = getLocalizedTitle(roadshow);
    const description = getLocalizedDescription(roadshow);
    const speakerName = getLocalizedSpeakerName(roadshow);
    const speakerTitle = getLocalizedSpeakerTitle(roadshow);
    const tags = getLocalizedTags(roadshow).join(', ');
    const summaryPrefix = language === 'zh' ? '【SoDEX路演】' : 'SoDEX Roadshow: ';
    const speakerLabel = language === 'zh' ? '讲师' : 'Speaker';
    const tagsLabel = language === 'zh' ? '标签' : 'Tags';
    const locationLabel = language === 'zh' ? 'SoDEX 在线直播' : 'SoDEX Live Stream';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${summaryPrefix}${title}`,
      dates: `${formatGoogleDate(roadshow.startTime)}/${formatGoogleDate(roadshow.endTime)}`,
      details: `${speakerLabel}: ${speakerName} (${speakerTitle})\n\n${description}\n\n${tagsLabel}: ${tags}`,
      location: locationLabel,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // 打开 Google Calendar
  const openGoogleCalendar = (roadshow: Roadshow) => {
    const url = generateGoogleCalendarUrl(roadshow);
    window.open(url, '_blank');

    // 同时注册
    if (!registeredRoadshows.includes(roadshow.id)) {
      handleRegister(roadshow.id);
    }
    setShowCalendarOptions(null);
  };

  // 计算倒计时
  const getCountdown = (startTime: Date) => {
    const now = new Date();
    const diff = startTime.getTime() - now.getTime();
    if (diff < 0) return t('roadshow.countdown.started');

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) return `${days}${t('roadshow.countdown.days')} ${hours}${t('roadshow.countdown.hours')}${t('roadshow.countdown.after')}`;
    if (hours > 0) return `${hours}${t('roadshow.countdown.hours')}${t('roadshow.countdown.after')}`;
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    return `${minutes}${t('roadshow.countdown.minutes')}${t('roadshow.countdown.after')}`;
  };

  if (!isOpen) return null;

  const { daysInMonth, startingDay } = getDaysInMonth(selectedMonth);
  const monthName = selectedMonth.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long' });

  // 获取即将到来的路演 (按时间排序)
  const upcomingRoadshows = [...mockRoadshows]
    .filter((rs) => rs.status === 'upcoming' && rs.startTime > new Date())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return (
    <>
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-panel)] rounded-2xl w-full max-w-[900px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-yellow)]/20 flex items-center justify-center">
              <Calendar size={22} className="text-[var(--brand-yellow)]" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[var(--text-main)]">{t('roadshow.title')}</h2>
              <p className="text-[13px] text-[var(--text-muted)]">
                {t('roadshow.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition"
          >
            <X size={20} className="text-[var(--text-muted)]" />
          </button>
        </div>

        {/* 日历内容 - 所有用户可见 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：日历 */}
          <div className="w-[320px] border-r border-[var(--border-light)] p-4 flex flex-col">
              {/* 月份导航 */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition"
                >
                  <ChevronLeft size={18} className="text-[var(--text-muted)]" />
                </button>
                <span className="text-[16px] font-medium text-[var(--text-main)]">{monthName}</span>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition"
                >
                  <ChevronRight size={18} className="text-[var(--text-muted)]" />
                </button>
              </div>

              {/* 星期标题 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {(language === 'zh' ? ['日', '一', '二', '三', '四', '五', '六'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day) => (
                  <div
                    key={day}
                    className="text-center text-[12px] text-[var(--text-dim)] py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 日历格子 */}
              <div className="grid grid-cols-7 gap-1 flex-1">
                {/* 填充空白 */}
                {Array.from({ length: startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {/* 日期 */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const roadshows = getRoadshowsForDay(day);
                  const isToday =
                    new Date().getDate() === day &&
                    new Date().getMonth() === selectedMonth.getMonth() &&
                    new Date().getFullYear() === selectedMonth.getFullYear();

                  return (
                    <button
                      key={day}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition ${
                        isToday
                          ? 'bg-[var(--brand-green)] text-black font-bold'
                          : 'hover:bg-[var(--bg-surface)]'
                      }`}
                    >
                      <span className={`text-[14px] ${isToday ? '' : 'text-[var(--text-main)]'}`}>
                        {day}
                      </span>
                      {roadshows.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {roadshows.slice(0, 3).map((rs, idx) => (
                            <span
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                rs.requiredLevel === 'Diamond'
                                  ? 'bg-[#b9f2ff]'
                                  : 'bg-[var(--brand-yellow)]'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 图例 */}
              <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
                <div className="flex items-center gap-4 text-[12px] text-[var(--text-muted)]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--brand-yellow)]" />
                    <span>{t('roadshow.goldRoadshow')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#b9f2ff]" />
                    <span>{t('roadshow.diamondExclusive')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：路演列表 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-light)]">
                <h3 className="text-[15px] font-medium text-[var(--text-main)]">
                  {t('roadshow.upcoming')}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {upcomingRoadshows.map((roadshow) => {
                  const isRegistered = registeredRoadshows.includes(roadshow.id);
                  const canAccess = canAccessRoadshow(roadshow.requiredLevel);

                  return (
                    <div
                      key={roadshow.id}
                      className={`p-4 rounded-xl border transition ${
                        canAccess
                          ? 'bg-[var(--bg-surface)] border-[var(--border-light)] hover:border-[var(--brand-yellow)]'
                          : 'bg-[var(--bg-surface)]/50 border-[var(--border-light)] opacity-60'
                      }`}
                    >
                      {/* 头部 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                                roadshow.type === 'video'
                                  ? 'bg-[var(--brand-green)]/20 text-[var(--brand-green)]'
                                  : roadshow.type === 'audio'
                                  ? 'bg-[var(--brand-yellow)]/20 text-[var(--brand-yellow)]'
                                  : 'bg-[var(--brand-red)]/20 text-[var(--brand-red)]'
                              }`}
                            >
                              {getTypeIcon(roadshow.type)}
                              {getTypeLabel(roadshow.type)}
                            </span>
                            {roadshow.requiredLevel === 'Diamond' && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#b9f2ff]/20 text-[#b9f2ff]">
                                <Crown size={11} />
                                {t('roadshow.diamondExclusive')}
                              </span>
                            )}
                          </div>
                          <h4 className="text-[15px] font-medium text-[var(--text-main)] line-clamp-1">
                            {getLocalizedTitle(roadshow)}
                          </h4>
                        </div>
                        {!canAccess && (
                          <Lock size={16} className="text-[var(--text-dim)] shrink-0 ml-2" />
                        )}
                      </div>

                      {/* 描述 */}
                      <p className="text-[13px] text-[var(--text-muted)] line-clamp-2 mb-3">
                        {getLocalizedDescription(roadshow)}
                      </p>

                      {/* 讲师信息 */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--brand-green)] flex items-center justify-center text-black text-[12px] font-bold">
                          {getLocalizedSpeakerName(roadshow).charAt(0)}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-[var(--text-main)]">
                            {getLocalizedSpeakerName(roadshow)}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {getLocalizedSpeakerTitle(roadshow)}
                          </div>
                        </div>
                      </div>

                      {/* 时间与人数 */}
                      <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)] mb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(roadshow.startTime)} {formatTime(roadshow.startTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {roadshow.registeredCount}/{roadshow.maxAttendees}
                          </span>
                        </div>
                        <span className="text-[var(--brand-yellow)] font-medium">
                          {getCountdown(roadshow.startTime)}
                        </span>
                      </div>

                      {/* 标签 */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {getLocalizedTags(roadshow).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[11px] rounded bg-[var(--bg-app)] text-[var(--text-muted)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* 操作按钮 */}
                      {canAccess && (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <button
                              onClick={() => {
                                if (isRegistered) {
                                  handleRegister(roadshow.id);
                                } else {
                                  setShowCalendarOptions(showCalendarOptions === roadshow.id ? null : roadshow.id);
                                }
                              }}
                              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-medium transition ${
                                isRegistered
                                  ? 'bg-[var(--brand-green)]/20 text-[var(--brand-green)]'
                                  : 'bg-[var(--brand-yellow)] text-black hover:opacity-90'
                              }`}
                            >
                              {isRegistered ? (
                                <>
                                  <BellOff size={16} />
                                  {t('roadshow.cancelRegister')}
                                </>
                              ) : (
                                <>
                                  <CalendarPlus size={16} />
                                  {t('roadshow.addToCalendar')}
                                </>
                              )}
                            </button>

                            {/* 日历选项下拉菜单 */}
                            {showCalendarOptions === roadshow.id && (
                              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl shadow-lg overflow-hidden z-10">
                                <button
                                  onClick={() => downloadICS(roadshow)}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-surface)] transition text-left"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-[#333] flex items-center justify-center">
                                    <Calendar size={16} className="text-white" />
                                  </div>
                                  <div>
                                    <div className="text-[14px] font-medium text-[var(--text-main)]">{t('roadshow.appleCalendar')}</div>
                                    <div className="text-[12px] text-[var(--text-muted)]">{t('roadshow.downloadIcs')}</div>
                                  </div>
                                </button>
                                <button
                                  onClick={() => openGoogleCalendar(roadshow)}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-surface)] transition text-left border-t border-[var(--border-light)]"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-[#4285f4] flex items-center justify-center">
                                    <Calendar size={16} className="text-white" />
                                  </div>
                                  <div>
                                    <div className="text-[14px] font-medium text-[var(--text-main)]">{t('roadshow.googleCalendar')}</div>
                                    <div className="text-[12px] text-[var(--text-muted)]">{t('roadshow.openInNewWindow')}</div>
                                  </div>
                                </button>
                                <button
                                  onClick={() => {
                                    handleRegister(roadshow.id);
                                    setShowCalendarOptions(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-surface)] transition text-left border-t border-[var(--border-light)]"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-[var(--brand-yellow)] flex items-center justify-center">
                                    <Bell size={16} className="text-black" />
                                  </div>
                                  <div>
                                    <div className="text-[14px] font-medium text-[var(--text-main)]">{t('roadshow.onlyReminder')}</div>
                                    <div className="text-[12px] text-[var(--text-muted)]">{t('roadshow.noAddToCalendar')}</div>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setSelectedRoadshow(roadshow)}
                            className="px-4 py-2.5 rounded-lg text-[14px] font-medium bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-highlight)] transition"
                          >
                            {t('roadshow.details')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {upcomingRoadshows.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar size={40} className="mx-auto text-[var(--text-dim)] mb-3" />
                    <p className="text-[14px] text-[var(--text-muted)]">{t('roadshow.noUpcoming')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    {/* 路演详情弹窗 */}
    {selectedRoadshow && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-[var(--bg-panel)] rounded-xl w-full max-w-[480px] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
              <h3 className="text-[18px] font-bold text-[var(--text-main)]">{t('roadshow.details')}</h3>
              <button
                onClick={() => setSelectedRoadshow(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] transition"
              >
                <X size={18} className="text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* 类型标签 */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[12px] font-medium ${
                    selectedRoadshow.type === 'video'
                      ? 'bg-[var(--brand-green)]/20 text-[var(--brand-green)]'
                      : selectedRoadshow.type === 'audio'
                      ? 'bg-[var(--brand-yellow)]/20 text-[var(--brand-yellow)]'
                      : 'bg-[var(--brand-red)]/20 text-[var(--brand-red)]'
                  }`}
                >
                  {getTypeIcon(selectedRoadshow.type)}
                  {getTypeLabel(selectedRoadshow.type)}
                </span>
                {selectedRoadshow.requiredLevel === 'Diamond' && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded text-[12px] font-medium bg-[#b9f2ff]/20 text-[#b9f2ff]">
                    <Crown size={12} />
                    {t('roadshow.diamondExclusive')}
                  </span>
                )}
              </div>

              {/* 标题 */}
              <h4 className="text-[17px] font-bold text-[var(--text-main)] mb-3">
                {getLocalizedTitle(selectedRoadshow)}
              </h4>

              {/* 描述 */}
              <p className="text-[14px] text-[var(--text-muted)] mb-4 leading-relaxed">
                {getLocalizedDescription(selectedRoadshow)}
              </p>

              {/* 讲师卡片 */}
              <div className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-lg mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--brand-green)] flex items-center justify-center text-black text-[16px] font-bold">
                  {getLocalizedSpeakerName(selectedRoadshow).charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-medium text-[var(--text-main)]">
                    {getLocalizedSpeakerName(selectedRoadshow)}
                  </div>
                  <div className="text-[13px] text-[var(--text-muted)]">
                    {getLocalizedSpeakerTitle(selectedRoadshow)}
                  </div>
                </div>
                <a
                  href="https://sosovalue.com/profile/index/1774072765580394497"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-[var(--bg-app)] transition"
                >
                  <ExternalLink size={16} className="text-[var(--text-muted)]" />
                </a>
              </div>

              {/* 时间信息 */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-[var(--text-muted)]">{t('roadshow.startTime')}</span>
                  <span className="text-[var(--text-main)]">
                    {formatDate(selectedRoadshow.startTime)} {formatTime(selectedRoadshow.startTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-[var(--text-muted)]">{t('roadshow.duration')}</span>
                  <span className="text-[var(--text-main)]">
                    {Math.round(
                      (selectedRoadshow.endTime.getTime() - selectedRoadshow.startTime.getTime()) /
                        (60 * 1000)
                    )}{' '}
                    {t('roadshow.minutes')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-[var(--text-muted)]">{t('roadshow.attendees')}</span>
                  <span className="text-[var(--text-main)]">
                    {selectedRoadshow.registeredCount} / {selectedRoadshow.maxAttendees}
                  </span>
                </div>
              </div>

              {/* 标签 */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {getLocalizedTags(selectedRoadshow).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-[12px] rounded-lg bg-[var(--brand-green-dim)] text-[var(--brand-green)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 操作按钮 */}
              {registeredRoadshows.includes(selectedRoadshow.id) ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedRoadshow(null)}
                    className="flex-1 py-3 rounded-lg text-[15px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                  >
                    {t('common.close')}
                  </button>
                  <button
                    onClick={() => {
                      handleRegister(selectedRoadshow.id);
                      setSelectedRoadshow(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[15px] font-bold bg-[var(--bg-surface)] text-[var(--brand-green)] transition"
                  >
                    <BellOff size={18} />
                    {t('roadshow.cancelRegister')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[13px] text-[var(--text-muted)] text-center">
                    {t('roadshow.selectAddMethod')}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        downloadICS(selectedRoadshow);
                        setSelectedRoadshow(null);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] transition border border-[var(--border-light)]"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#333] flex items-center justify-center">
                        <Calendar size={20} className="text-white" />
                      </div>
                      <span className="text-[14px] font-medium text-[var(--text-main)]">{t('roadshow.appleCalendar')}</span>
                    </button>
                    <button
                      onClick={() => {
                        openGoogleCalendar(selectedRoadshow);
                        setSelectedRoadshow(null);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] transition border border-[var(--border-light)]"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#4285f4] flex items-center justify-center">
                        <Calendar size={20} className="text-white" />
                      </div>
                      <span className="text-[14px] font-medium text-[var(--text-main)]">{t('roadshow.googleCalendar')}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      handleRegister(selectedRoadshow.id);
                      setSelectedRoadshow(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[14px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                  >
                    <Bell size={16} />
                    {t('roadshow.onlyReminder')} ({t('roadshow.noAddToCalendar')})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
