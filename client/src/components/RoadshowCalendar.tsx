import { useState } from 'react';
import { X, Calendar, Globe2, Radio, Clock, Users, Play, Bell, BellOff, Crown, ChevronLeft, ChevronRight, Check, Download } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import type { UserLevel } from '../types';
import { useTranslation } from '../i18n';

// Google Calendar icon component
const GoogleCalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M18 4H17V2H15V4H9V2H7V4H6C4.9 4 4 4.9 4 6V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V6C20 4.9 19.1 4 18 4Z" fill="#4285F4"/>
    <path d="M6 9H18V20H6V9Z" fill="white"/>
    <path d="M8 13H10V15H8V13Z" fill="#EA4335"/>
    <path d="M11 13H13V15H11V13Z" fill="#FBBC04"/>
    <path d="M14 13H16V15H14V13Z" fill="#34A853"/>
  </svg>
);

// Apple Calendar icon component
const AppleCalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" fill="#FF3B30"/>
    <rect x="3" y="4" width="18" height="5" fill="#FF6961"/>
    <text x="12" y="17" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">31</text>
  </svg>
);

// 生成 Google Calendar URL
const generateGoogleCalendarUrl = (
  title: string,
  description: string,
  startDate: Date,
  endDate: Date,
): string => {
  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// 生成 ICS 文件内容
const generateICSContent = (
  title: string,
  description: string,
  startDate: Date,
  endDate: Date,
  reminderDescription: string,
): string => {
  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SoDEX//Roadshow//CN
BEGIN:VEVENT
UID:${Date.now()}@sodex.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description}
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:${reminderDescription}
END:VALARM
END:VEVENT
END:VCALENDAR`;
};

// 下载 ICS 文件
const downloadICSFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 宏观日历事件类型
export interface MacroEvent {
  id: string;
  title: string;
  titleEn: string;
  date: Date;
  time: string;
  importance: 'high' | 'medium' | 'low';
  category: 'fed' | 'economic' | 'earnings' | 'crypto' | 'geopolitical';
  country: string;
  previous?: string;
  forecast?: string;
  actual?: string;
  hasLiveStream?: boolean;
  liveStreamId?: string;
  description?: string;
  descriptionEn?: string;
}

// 路演事件类型
export interface RoadshowEvent {
  id: string;
  title: string;
  titleEn: string;
  speaker: string;
  speakerTitle: string;
  startTime: Date;
  endTime: Date;
  isLive: boolean;
  type: 'video' | 'audio' | 'ama';
  requiredLevel: 'Gold' | 'Diamond';
  registeredCount: number;
  description?: string;
  descriptionEn?: string;
}

// 资产特定事件类型
export interface AssetEvent {
  id: string;
  title: string;
  titleEn: string;
  date: Date;
  time: string;
  importance: 'high' | 'medium' | 'low';
  asset: string; // BTC, ETH, SOL 等
  category: 'unlock' | 'upgrade' | 'halving' | 'fork' | 'listing' | 'airdrop' | 'governance';
  description?: string;
  descriptionEn?: string;
  hasLiveStream?: boolean;
}

// BTC 特定事件
const btcEvents: AssetEvent[] = [
  {
    id: 'btc-1',
    title: 'BTC 减半倒计时',
    titleEn: 'Bitcoin Halving Countdown',
    date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    time: '00:00',
    importance: 'high',
    asset: 'BTC',
    category: 'halving',
    description: '比特币区块奖励将从6.25 BTC减半至3.125 BTC，历史上减半后价格通常上涨。',
    descriptionEn: 'Bitcoin block rewards will halve from 6.25 BTC to 3.125 BTC; historically prices often rise after halvings.',
    hasLiveStream: true,
  },
  {
    id: 'btc-2',
    title: 'Grayscale GBTC 解锁',
    titleEn: 'GBTC Unlock',
    date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    time: '09:00',
    importance: 'medium',
    asset: 'BTC',
    category: 'unlock',
    description: '约 $500M GBTC 份额解锁，可能带来卖压。',
    descriptionEn: 'About $500M in GBTC shares unlock, potentially adding selling pressure.',
  },
];

// ETH 特定事件
const ethEvents: AssetEvent[] = [
  {
    id: 'eth-1',
    title: 'Dencun 升级',
    titleEn: 'Dencun Upgrade',
    date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    time: '12:00',
    importance: 'high',
    asset: 'ETH',
    category: 'upgrade',
    description: '以太坊Dencun升级，引入Proto-Danksharding，大幅降低L2 Gas费用。',
    descriptionEn: 'Ethereum Dencun upgrade introduces Proto-Danksharding, significantly reducing L2 gas fees.',
    hasLiveStream: true,
  },
  {
    id: 'eth-2',
    title: 'ETH Staking 解锁',
    titleEn: 'ETH Staking Unlock',
    date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    time: '00:00',
    importance: 'medium',
    asset: 'ETH',
    category: 'unlock',
    description: '大量ETH质押解锁，预计约 120,000 ETH 进入流通。',
    descriptionEn: 'Large ETH staking unlocks, with ~120,000 ETH expected to enter circulation.',
  },
];

// SOL 特定事件
const solEvents: AssetEvent[] = [
  {
    id: 'sol-1',
    title: 'Solana Breakpoint 大会',
    titleEn: 'Solana Breakpoint',
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    time: '09:00',
    importance: 'high',
    asset: 'SOL',
    category: 'governance',
    description: 'Solana 年度开发者大会，预计发布重要技术更新和生态合作。',
    descriptionEn: 'Solana annual developer conference; major tech updates and ecosystem partnerships expected.',
    hasLiveStream: true,
  },
  {
    id: 'sol-2',
    title: 'Jupiter 空投快照',
    titleEn: 'Jupiter Airdrop Snapshot',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    time: '00:00',
    importance: 'medium',
    asset: 'SOL',
    category: 'airdrop',
    description: 'Jupiter DEX 第二轮空投快照，持有SOL和使用Jupiter的用户可能获得JUP代币。',
    descriptionEn: 'Second Jupiter DEX airdrop snapshot; SOL holders and Jupiter users may receive JUP tokens.',
  },
];

// 获取资产特定事件
export function getAssetEvents(asset: string): AssetEvent[] {
  switch (asset.toUpperCase()) {
    case 'BTC':
    case 'BITCOIN':
      return btcEvents;
    case 'ETH':
    case 'ETHEREUM':
      return ethEvents;
    case 'SOL':
    case 'SOLANA':
      return solEvents;
    default:
      return [];
  }
}

const getLocalizedTitle = (
  event: { title: string; titleEn?: string },
  language: 'zh' | 'en',
) => (language === 'zh' ? event.title : (event.titleEn || event.title));

const getLocalizedDescription = (
  event: { description?: string; descriptionEn?: string },
  language: 'zh' | 'en',
) => (language === 'zh' ? event.description : (event.descriptionEn || event.description));

// 模拟宏观日历数据 - 增强版
const mockMacroEvents: MacroEvent[] = [
  // 央行决议
  {
    id: 'macro-1',
    title: '美联储利率决议',
    titleEn: 'FOMC Rate Decision',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    time: '02:00',
    importance: 'high',
    category: 'fed',
    country: 'US',
    previous: '5.50%',
    forecast: '5.50%',
    hasLiveStream: true,
    liveStreamId: 'live-fomc-1',
    description: '美联储公开市场委员会将公布最新利率决议，市场预计维持利率不变。',
    descriptionEn: 'The FOMC will announce its latest rate decision; markets expect rates to remain unchanged.',
  },
  {
    id: 'macro-5',
    title: '英国央行利率决议',
    titleEn: 'BoE Rate Decision',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    time: '19:00',
    importance: 'medium',
    category: 'fed',
    country: 'UK',
    previous: '5.25%',
    forecast: '5.25%',
    description: '英国央行公布最新利率决议。',
    descriptionEn: 'The Bank of England announces its latest rate decision.',
  },
  {
    id: 'macro-ecb',
    title: '欧洲央行利率决议',
    titleEn: 'ECB Rate Decision',
    date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    time: '19:45',
    importance: 'high',
    category: 'fed',
    country: 'EU',
    previous: '4.50%',
    forecast: '4.50%',
    hasLiveStream: true,
    description: '欧洲央行货币政策会议，关注通胀前景和降息预期。',
    descriptionEn: 'ECB policy meeting focusing on inflation outlook and rate-cut expectations.',
  },
  {
    id: 'macro-boj',
    title: '日本央行利率决议',
    titleEn: 'BoJ Rate Decision',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    time: '11:00',
    importance: 'high',
    category: 'fed',
    country: 'JP',
    previous: '-0.10%',
    forecast: '0.00%',
    hasLiveStream: true,
    description: '日本央行可能结束负利率政策，对全球资金流动产生重大影响。',
    descriptionEn: 'The BoJ may end negative rates, impacting global capital flows.',
  },
  // 经济数据
  {
    id: 'macro-2',
    title: '美国CPI数据',
    titleEn: 'US CPI YoY',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    time: '20:30',
    importance: 'high',
    category: 'economic',
    country: 'US',
    previous: '3.4%',
    forecast: '3.2%',
    hasLiveStream: true,
    liveStreamId: 'live-cpi-1',
    description: '美国消费者物价指数年率，对通胀预期有重要影响。',
    descriptionEn: 'US CPI YoY, key for inflation expectations.',
  },
  {
    id: 'macro-3',
    title: '中国GDP季度数据',
    titleEn: 'China GDP QoQ',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    time: '10:00',
    importance: 'high',
    category: 'economic',
    country: 'CN',
    previous: '4.9%',
    forecast: '5.2%',
    description: '中国第四季度GDP增速数据。',
    descriptionEn: 'China Q4 GDP growth data.',
  },
  {
    id: 'macro-6',
    title: '非农就业数据',
    titleEn: 'US Non-Farm Payrolls',
    date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    time: '20:30',
    importance: 'high',
    category: 'economic',
    country: 'US',
    previous: '199K',
    forecast: '180K',
    hasLiveStream: true,
    liveStreamId: 'live-nfp',
    description: '美国非农就业人数，对美元和风险资产影响重大。',
    descriptionEn: 'US non-farm payrolls, a major driver for USD and risk assets.',
  },
  {
    id: 'macro-7',
    title: 'NVIDIA财报',
    titleEn: 'NVIDIA Earnings',
    date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    time: '05:00',
    importance: 'medium',
    category: 'earnings',
    country: 'US',
    description: 'NVIDIA Q4财报，AI概念股风向标。',
    descriptionEn: 'NVIDIA Q4 earnings, a bellwether for AI stocks.',
  },
];

// 模拟路演数据
const mockRoadshowEvents: RoadshowEvent[] = [
  {
    id: 'rs-live-001',
    title: 'BTC 实时行情解读',
    titleEn: 'BTC Live Market Briefing',
    speaker: 'Alex Chen',
    speakerTitle: 'Senior Analyst',
    startTime: new Date(Date.now() - 30 * 60 * 1000),
    endTime: new Date(Date.now() + 30 * 60 * 1000),
    isLive: true,
    type: 'video',
    requiredLevel: 'Gold',
    registeredCount: 89,
    description: '实时分析BTC市场动态，解读关键技术指标和市场情绪。',
    descriptionEn: 'Real-time analysis of BTC market dynamics, key technical levels, and sentiment.',
  },
  {
    id: 'rs-001',
    title: 'BTC 2025年行情展望与策略分析',
    titleEn: 'BTC 2025 Outlook & Strategy',
    speaker: 'Alex Chen',
    speakerTitle: 'Senior Analyst',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
    isLive: false,
    type: 'video',
    requiredLevel: 'Gold',
    registeredCount: 156,
    description: '深度分析2025年BTC价格走势，提供中长期投资策略建议。',
    descriptionEn: 'Deep dive into the 2025 BTC outlook with mid-to-long term strategy guidance.',
  },
  {
    id: 'rs-002',
    title: 'DeFi 新趋势：RWA与链上金融',
    titleEn: 'DeFi Trends: RWA & On-chain Finance',
    speaker: '李明阳',
    speakerTitle: 'DeFi Researcher',
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    isLive: false,
    type: 'video',
    requiredLevel: 'Gold',
    registeredCount: 89,
    description: '探讨RWA（真实世界资产）代币化趋势及投资机会。',
    descriptionEn: 'Explore RWA tokenization trends and on-chain finance opportunities.',
  },
  {
    id: 'rs-003',
    title: 'VIP 专属: Q1 投资组合配置',
    titleEn: 'VIP Exclusive: Q1 Portfolio Allocation',
    speaker: 'Michael Liu',
    speakerTitle: 'Chief Strategist',
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000),
    isLive: false,
    type: 'video',
    requiredLevel: 'Diamond',
    registeredCount: 23,
    description: 'Diamond专属：2025年Q1最优投资组合策略，包含具体配置比例。',
    descriptionEn: 'Diamond exclusive: optimal Q1 2025 portfolio allocation with specific weights.',
  },
  {
    id: 'rs-004',
    title: 'AMA: Layer2 生态发展与机会',
    titleEn: 'AMA: Layer2 Ecosystem Opportunities',
    speaker: 'Sarah Wang',
    speakerTitle: 'L2 Specialist',
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    isLive: false,
    type: 'ama',
    requiredLevel: 'Gold',
    registeredCount: 112,
    description: 'AMA互动问答：Layer2生态分析与投资机会探讨。',
    descriptionEn: 'AMA on Layer2 ecosystem analysis and investment opportunities.',
  },
];

// 日历类型
type CalendarTab = 'macro' | 'roadshow';

// 重要性颜色配置
const importanceColors = {
  high: { bg: 'rgba(234, 57, 67, 0.2)', text: '#ea3943' },
  medium: { bg: 'rgba(247, 147, 26, 0.2)', text: '#f7931a' },
  low: { bg: 'rgba(22, 199, 132, 0.2)', text: '#16c784' },
};

// 类别配置
const categoryConfig = {
  fed: { icon: '🏛️' },
  economic: { icon: '📊' },
  earnings: { icon: '📈' },
  crypto: { icon: '₿' },
  geopolitical: { icon: '🌍' },
};

// 国家旗帜
const countryFlags: Record<string, string> = {
  US: '🇺🇸',
  CN: '🇨🇳',
  UK: '🇬🇧',
  EU: '🇪🇺',
  JP: '🇯🇵',
};

interface RoadshowCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoadshowCalendar({ isOpen, onClose }: RoadshowCalendarProps) {
  const { t, language } = useTranslation();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<CalendarTab>('macro');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showLiveStreams, setShowLiveStreams] = useState(true);
  const [notifications, setNotifications] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';

  const userLevel = (user?.level || 'Bronze') as UserLevel;

  // 日历级别检查
  const levelOrder: UserLevel[] = ['Bronze', 'Silver', 'Gold', 'Diamond'];
  const canAccessLevel = (requiredLevel: 'Gold' | 'Diamond') => {
    const userIndex = levelOrder.indexOf(userLevel);
    const requiredIndex = levelOrder.indexOf(requiredLevel);
    return userIndex >= requiredIndex;
  };

  // 切换通知
  const toggleNotification = (eventId: string) => {
    setNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // 获取当月日期
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // 填充前面的空白
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // 填充日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, { month: 'long', day: 'numeric', weekday: 'short' });
  };

  // 获取某天的事件
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    if (activeTab === 'macro') {
      return mockMacroEvents.filter(e => e.date.toDateString() === dateStr);
    } else {
      return mockRoadshowEvents.filter(e => e.startTime.toDateString() === dateStr);
    }
  };

  // 检查某天是否有事件
  const hasEventsOnDate = (date: Date) => {
    const dateStr = date.toDateString();
    if (activeTab === 'macro') {
      return mockMacroEvents.some(e => e.date.toDateString() === dateStr);
    } else {
      return mockRoadshowEvents.some(e => e.startTime.toDateString() === dateStr);
    }
  };

  // 检查某天是否有高重要性事件
  const hasHighImportanceOnDate = (date: Date) => {
    const dateStr = date.toDateString();
    if (activeTab === 'macro') {
      return mockMacroEvents.some(e => e.date.toDateString() === dateStr && e.importance === 'high');
    } else {
      return mockRoadshowEvents.some(e => e.startTime.toDateString() === dateStr && e.isLive);
    }
  };

  // 获取所有事件（用于列表显示）
  const getAllEvents = () => {
    if (activeTab === 'macro') {
      return mockMacroEvents
        .filter(e => e.date >= new Date())
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    } else {
      return mockRoadshowEvents
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
  };

  if (!isOpen) return null;

  const days = getDaysInMonth(currentMonth);
  const weekDays = language === 'zh'
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal - 移动端全屏，桌面端居中 */}
      <div className="relative w-full h-full md:h-auto md:max-w-[1000px] md:max-h-[90vh] bg-[var(--bg-panel)] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 md:p-4 border-b border-[var(--border-light)] gap-3">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2 md:gap-4">
              <Calendar size={20} className="text-[var(--brand-yellow)] md:w-6 md:h-6" />
              <h2 className="text-lg md:text-xl font-bold text-[var(--text-main)]">{t('roadshowCalendar.title')}</h2>
            </div>
            {/* 移动端关闭按钮 */}
            <button
              onClick={onClose}
              className="md:hidden p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors"
            >
              <X size={20} className="text-[var(--text-muted)]" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-[var(--bg-surface)] rounded-lg p-1 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('macro')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
                activeTab === 'macro'
                  ? 'bg-[var(--brand-yellow)] text-black'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Globe2 size={14} className="md:w-4 md:h-4" />
              {t('roadshowCalendar.tabMacro')}
            </button>
            <button
              onClick={() => setActiveTab('roadshow')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
                activeTab === 'roadshow'
                  ? 'bg-[var(--brand-yellow)] text-black'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Radio size={16} />
              {t('roadshowCalendar.tabRoadshow')}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {/* Show/Hide Live Streams Toggle */}
            <button
              onClick={() => setShowLiveStreams(!showLiveStreams)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showLiveStreams
                  ? 'bg-[var(--brand-red)]/20 text-[var(--brand-red)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
              }`}
            >
              <Radio size={14} />
              {showLiveStreams ? t('roadshowCalendar.showLive') : t('roadshowCalendar.hideLive')}
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors"
            >
              <X size={20} className="text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Content - 移动端纵向排列，桌面端横向 */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Calendar Grid - 移动端隐藏日历，显示事件列表 */}
          <div className="hidden md:block w-[360px] border-r border-[var(--border-light)] p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-1 hover:bg-[var(--bg-surface)] rounded transition-colors"
              >
                <ChevronLeft size={20} className="text-[var(--text-muted)]" />
              </button>
              <span className="text-lg font-medium text-[var(--text-main)]">
                {currentMonth.toLocaleDateString(locale, { year: 'numeric', month: 'long' })}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-1 hover:bg-[var(--bg-surface)] rounded transition-colors"
              >
                <ChevronRight size={20} className="text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs text-[var(--text-muted)] py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === day.toDateString();
                const hasEvents = hasEventsOnDate(day);
                const hasHighImportance = hasHighImportanceOnDate(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all relative ${
                      isSelected
                        ? 'bg-[var(--brand-yellow)] text-black'
                        : isToday
                          ? 'bg-[var(--bg-surface)] text-[var(--text-main)] ring-2 ring-[var(--brand-yellow)]'
                          : hasEvents
                            ? 'bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-highlight)]'
                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
                    }`}
                  >
                    <span className={isSelected ? 'font-bold' : ''}>{day.getDate()}</span>
                    {hasEvents && !isSelected && (
                      <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                        hasHighImportance ? 'bg-[var(--brand-red)]' : 'bg-[var(--brand-green)]'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
              <div className="text-xs text-[var(--text-muted)] mb-2">{t('roadshowCalendar.legend')}</div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[var(--brand-red)]" />
                  <span className="text-[var(--text-muted)]">
                    {activeTab === 'macro' ? t('roadshowCalendar.legendHighImportance') : t('roadshowCalendar.legendLive')}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[var(--brand-green)]" />
                  <span className="text-[var(--text-muted)]">{t('roadshowCalendar.legendHasEvents')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedDate ? (
              /* Selected Date Events */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-[var(--text-main)]">
                    {formatDate(selectedDate)}
                  </h3>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-sm text-[var(--brand-yellow)] hover:underline"
                  >
                    {t('roadshowCalendar.viewAll')}
                  </button>
                </div>
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).length > 0 ? (
                    getEventsForDate(selectedDate).map(event => (
                      activeTab === 'macro' ? (
                        <MacroEventCard
                          key={event.id}
                          event={event as MacroEvent}
                          showLiveStreams={showLiveStreams}
                          isNotified={notifications.has(event.id)}
                          onToggleNotification={() => toggleNotification(event.id)}
                        />
                      ) : (
                        <RoadshowEventCard
                          key={event.id}
                          event={event as RoadshowEvent}
                          canAccess={canAccessLevel((event as RoadshowEvent).requiredLevel)}
                          isNotified={notifications.has(event.id)}
                          onToggleNotification={() => toggleNotification(event.id)}
                        />
                      )
                    ))
                  ) : (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                      <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                      <div>{t('roadshowCalendar.noEvents')}</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* All Upcoming Events */
              <div>
                <h3 className="text-lg font-medium text-[var(--text-main)] mb-4">
                  {activeTab === 'macro' ? t('roadshowCalendar.upcomingMacro') : t('roadshowCalendar.upcomingRoadshow')}
                </h3>
                <div className="space-y-3">
                  {getAllEvents().map(event => (
                    activeTab === 'macro' ? (
                      <MacroEventCard
                        key={event.id}
                        event={event as MacroEvent}
                        showLiveStreams={showLiveStreams}
                        isNotified={notifications.has(event.id)}
                        onToggleNotification={() => toggleNotification(event.id)}
                      />
                    ) : (
                      <RoadshowEventCard
                        key={event.id}
                        event={event as RoadshowEvent}
                        canAccess={canAccessLevel((event as RoadshowEvent).requiredLevel)}
                        isNotified={notifications.has(event.id)}
                        onToggleNotification={() => toggleNotification(event.id)}
                      />
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 宏观事件卡片
function MacroEventCard({
  event,
  showLiveStreams,
  isNotified,
  onToggleNotification,
}: {
  event: MacroEvent;
  showLiveStreams: boolean;
  isNotified: boolean;
  onToggleNotification: () => void;
}) {
  const { t, language } = useTranslation();
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const importance = importanceColors[event.importance];
  const category = categoryConfig[event.category];
  const title = getLocalizedTitle(event, language);
  const altTitle = language === 'zh' ? event.titleEn : event.title;
  const description = getLocalizedDescription(event, language);
  const importanceLabelMap = {
    high: t('roadshowCalendar.importance.high'),
    medium: t('roadshowCalendar.importance.medium'),
    low: t('roadshowCalendar.importance.low'),
  };
  const importanceLabel = importanceLabelMap[event.importance];

  return (
    <div className="bg-[var(--bg-surface)] rounded-lg p-4 hover:bg-[var(--bg-highlight)] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{countryFlags[event.country] || '🌍'}</span>
          <span className="text-lg">{category.icon}</span>
          <div>
            <div className="font-medium text-[var(--text-main)]">{title}</div>
            {altTitle && altTitle !== title && (
              <div className="text-xs text-[var(--text-muted)]">{altTitle}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.hasLiveStream && showLiveStreams && (
            <span className="flex items-center gap-1 px-2 py-1 bg-[var(--brand-red)]/20 text-[var(--brand-red)] rounded text-xs">
              <Radio size={10} />
              {t('roadshowCalendar.liveTag')}
            </span>
          )}
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: importance.bg, color: importance.text }}
          >
            {importanceLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-3">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{event.date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} {event.time}</span>
        </div>
        <span className="text-[var(--brand-yellow)]">{getCountdown(event.date, t)}</span>
      </div>

      {/* Data Preview */}
      {(event.previous || event.forecast) && (
        <div className="flex items-center gap-4 text-sm mb-3">
          {event.previous && (
            <div>
              <span className="text-[var(--text-muted)]">{t('roadshowCalendar.previous')}: </span>
              <span className="text-[var(--text-main)] font-medium">{event.previous}</span>
            </div>
          )}
          {event.forecast && (
            <div>
              <span className="text-[var(--text-muted)]">{t('roadshowCalendar.forecast')}: </span>
              <span className="text-[var(--brand-yellow)] font-medium">{event.forecast}</span>
            </div>
          )}
          {event.actual && (
            <div>
              <span className="text-[var(--text-muted)]">{t('roadshowCalendar.actual')}: </span>
              <span className="text-[var(--brand-green)] font-medium">{event.actual}</span>
            </div>
          )}
        </div>
      )}

      {description && (
        <p className="text-sm text-[var(--text-muted)] mb-3">{description}</p>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onToggleNotification}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
            isNotified
              ? 'bg-[var(--brand-yellow)]/20 text-[var(--brand-yellow)]'
              : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          {isNotified ? <Bell size={14} /> : <BellOff size={14} />}
          {isNotified ? t('roadshowCalendar.reminderSet') : t('roadshowCalendar.setReminder')}
        </button>

        {event.hasLiveStream && showLiveStreams && (
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand-red)] text-white rounded text-sm hover:opacity-90 transition-opacity">
            <Play size={14} />
            {t('roadshowCalendar.watchLive')}
          </button>
        )}
      </div>
    </div>
  );
}

// 路演事件卡片
function RoadshowEventCard({
  event,
  canAccess,
  isNotified,
  onToggleNotification,
  onJoinLive,
}: {
  event: RoadshowEvent;
  canAccess: boolean;
  isNotified: boolean;
  onToggleNotification: () => void;
  onJoinLive?: (event: RoadshowEvent) => void;
}) {
  const { t, language } = useTranslation();
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const [registered, setRegistered] = useState(false);
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);
  const title = getLocalizedTitle(event, language);
  const description = getLocalizedDescription(event, language) || '';

  const handleRegister = () => {
    if (event.isLive && onJoinLive) {
      onJoinLive(event);
    } else {
      setRegistered(true);
      setShowCalendarOptions(true);
      // 同时设置提醒
      if (!isNotified) {
        onToggleNotification();
      }
    }
  };

  const eventTitle = t('roadshowCalendar.calendarEventTitle').replace('{title}', title);
  const eventDescription = t('roadshowCalendar.calendarEventDescription')
    .replace('{speaker}', event.speaker)
    .replace('{speakerTitle}', event.speakerTitle)
    .replace('{description}', description);
  const reminderDescription = t('roadshowCalendar.icsReminder').replace('{title}', title);

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(eventTitle, eventDescription, event.startTime, event.endTime);
    window.open(url, '_blank');
  };

  const handleAppleCalendar = () => {
    const icsContent = generateICSContent(eventTitle, eventDescription, event.startTime, event.endTime, reminderDescription);
    downloadICSFile(icsContent, `sodex-roadshow-${event.id}.ics`);
  };

  return (
    <div className={`bg-[var(--bg-surface)] rounded-lg p-4 hover:bg-[var(--bg-highlight)] transition-colors ${
      !canAccess ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {event.isLive && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[var(--brand-red)] text-white rounded text-xs animate-pulse">
                <Radio size={10} />
                {t('roadshowCalendar.liveBadge')}
              </span>
            )}
            {event.requiredLevel === 'Diamond' && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 bg-[#b9f2ff]/20 text-[#b9f2ff] rounded text-xs">
                <Crown size={10} />
                {t('roadshowCalendar.vipBadge')}
              </span>
            )}
          </div>
          <div className="font-medium text-[var(--text-main)]">{title}</div>
          <div className="text-sm text-[var(--text-muted)]">
            {event.speaker} · {event.speakerTitle}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-[var(--brand-yellow)]">
            {event.isLive ? t('roadshowCalendar.inProgress') : getCountdown(event.startTime, t)}
          </div>
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <Users size={10} />
            <span>{t('roadshowCalendar.registeredCount').replace('{count}', String(event.registeredCount))}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-3">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>
            {event.startTime.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} {formatTime(event.startTime, locale)}
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 bg-[var(--bg-app)] rounded">
          {event.type === 'video'
            ? t('roadshowCalendar.eventType.video')
            : event.type === 'audio'
              ? t('roadshowCalendar.eventType.audio')
              : t('roadshowCalendar.eventType.ama')}
        </span>
      </div>

      {description && (
        <p className="text-sm text-[var(--text-muted)] mb-3">{description}</p>
      )}

      {/* 日历导出选项 - 报名后显示 */}
      {registered && showCalendarOptions && !event.isLive && (
        <div className="mb-3 p-3 bg-[var(--bg-app)] rounded-lg border border-[var(--brand-green)]/30">
          <div className="flex items-center gap-2 mb-2">
            <Check size={14} className="text-[var(--brand-green)]" />
            <span className="text-[13px] text-[var(--brand-green)] font-medium">{t('roadshowCalendar.registerSuccess')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoogleCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] rounded text-xs transition-colors"
            >
              <GoogleCalendarIcon />
              <span className="text-[var(--text-main)]">Google</span>
            </button>
            <button
              onClick={handleAppleCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] rounded text-xs transition-colors"
            >
              <AppleCalendarIcon />
              <span className="text-[var(--text-main)]">Apple</span>
            </button>
            <button
              onClick={handleAppleCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] rounded text-xs transition-colors"
            >
              <Download size={12} className="text-[var(--text-muted)]" />
              <span className="text-[var(--text-main)]">.ics</span>
            </button>
            <button
              onClick={() => setShowCalendarOptions(false)}
              className="ml-auto text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)]"
            >
              {t('roadshowCalendar.collapse')}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {canAccess ? (
          <>
            <button
              onClick={onToggleNotification}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                isNotified
                  ? 'bg-[var(--brand-yellow)]/20 text-[var(--brand-yellow)]'
                  : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {isNotified ? <Bell size={14} /> : <BellOff size={14} />}
              {isNotified ? t('roadshowCalendar.reminderSet') : t('roadshowCalendar.setReminder')}
            </button>

            {event.isLive ? (
              <button
                onClick={handleRegister}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm bg-[var(--brand-red)] text-white hover:opacity-90 transition-opacity"
              >
                <Play size={14} />
                {t('roadshowCalendar.watchNow')}
              </button>
            ) : registered ? (
              <div className="flex items-center gap-2">
                {!showCalendarOptions && (
                  <button
                    onClick={() => setShowCalendarOptions(true)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                  >
                    <Calendar size={12} />
                    {t('roadshowCalendar.calendar')}
                  </button>
                )}
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm bg-[var(--brand-green)]/50 text-white">
                  <Check size={14} />
                  {t('roadshowCalendar.registered')}
                </span>
              </div>
            ) : (
              <button
                onClick={handleRegister}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm bg-[var(--brand-green)] text-white hover:opacity-90 transition-opacity"
              >
                <Bell size={14} />
                {t('roadshowCalendar.register')}
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Crown size={14} className="text-[#b9f2ff]" />
            <span>{t('roadshowCalendar.upgradeToUnlock').replace('{level}', event.requiredLevel)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for countdown
function getCountdown(date: Date, t: (key: string) => string) {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff < 0) return t('roadshowCalendar.countdown.ended');

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) {
    return t('roadshowCalendar.countdown.daysHours')
      .replace('{days}', String(days))
      .replace('{hours}', String(hours));
  }
  if (hours > 0) {
    return t('roadshowCalendar.countdown.hours')
      .replace('{hours}', String(hours));
  }
  return t('roadshowCalendar.countdown.soon');
}

// Helper function for formatting time
function formatTime(date: Date, locale: string) {
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
