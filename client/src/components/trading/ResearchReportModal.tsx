import { useState, useEffect, useRef } from 'react';
import { X, Crown, TrendingUp, TrendingDown, Clock, Sparkles, Copy, Check, Bell, BellOff, ChevronDown, ChevronUp, Heart, MessageCircle, Send, Gift, MessageSquare, Zap, AlertCircle, ThumbsUp, Mail, CalendarClock, Lock } from 'lucide-react';
import { AppointmentBooking } from '../AppointmentBooking';
import { useUserStore } from '../../stores/userStore';
import { useChatStore } from '../../stores/chatStore';
import { LEVEL_CONFIG } from '../../types';

// 能量消耗配置
const ENERGY_COSTS = {
  privateMessage: 5,    // 私信消耗 5 能量
  oneOnOneChat: 50,     // 1v1 咨询消耗 50 能量（30分钟）
};

// 研报类型定义
export interface ResearchReport {
  id: string;
  title: string;
  symbol?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  researcher: {
    id: string;
    name: string;
    avatar?: string;
    title?: string;
  };
  publishedAt: string;
  requiredLevel: 'Gold' | 'Diamond';
  summary: string;
  content: string;
  tags: string[];
  readCount?: number;
  likeCount?: number;
}

// 评论类型
interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

// Mock 评论数据
const mockComments: Record<string, Comment[]> = {
  'r1': [
    { id: 'c1', userId: 'u1', userName: 'CryptoTrader', content: '分析很到位，$94,500 确实是关键支撑', createdAt: '30 min ago', likes: 12, isLiked: false },
    { id: 'c2', userId: 'u2', userName: 'BTC_Holder', content: '止损设在 $92,000 是不是太紧了？', createdAt: '1 hour ago', likes: 5, isLiked: true },
    { id: 'c3', userId: 'u3', userName: 'WhaleWatcher', content: '链上数据确实显示大户在增持，看多', createdAt: '2 hours ago', likes: 23, isLiked: false },
  ],
  'r2': [
    { id: 'c4', userId: 'u4', userName: 'DeFiDegen', content: 'Arbitrum 生态确实很强，ARB 目标 $2.5 合理', createdAt: '1 hour ago', likes: 8, isLiked: false },
    { id: 'c5', userId: 'u5', userName: 'L2Researcher', content: 'Base 的增长速度惊人，Coinbase 的支持很关键', createdAt: '2 hours ago', likes: 15, isLiked: false },
  ],
  'r3': [
    { id: 'c6', userId: 'u6', userName: 'SOLmaxi', content: 'SOL 网络稳定性问题解决了吗？', createdAt: '3 hours ago', likes: 7, isLiked: false },
  ],
  'r4': [
    { id: 'c7', userId: 'u7', userName: 'MacroAnalyst', content: '降息预期是否过于乐观？', createdAt: '4 hours ago', likes: 19, isLiked: false },
  ],
  'r5': [
    { id: 'c8', userId: 'u8', userName: 'YieldFarmer', content: 'Aerodrome 40% APY 风险如何？', createdAt: '6 hours ago', likes: 11, isLiked: false },
  ],
};

// Mock 研报详情数据
const mockReportDetails: Record<string, ResearchReport> = {
  'r1': {
    id: 'r1',
    title: 'BTC Technical Analysis: Key Support at $94,500',
    symbol: 'BTC',
    sentiment: 'bullish',
    researcher: {
      id: 'res1',
      name: 'Alex Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      title: 'Senior Crypto Analyst',
    },
    publishedAt: '2 hours ago',
    requiredLevel: 'Gold',
    summary: '比特币近期技术面显示强劲支撑位在 $94,500，多头趋势有望延续。',
    content: `## 核心观点

比特币目前处于明显的上升趋势中，$94,500 作为关键支撑位已经过多次验证。

### 技术分析

1. **支撑与阻力**
   - 强支撑: $94,500 (200日均线)
   - 次支撑: $92,000 (前高回踩位)
   - 短期阻力: $98,000
   - 中期目标: $105,000

2. **成交量分析**
   近期成交量稳步增加，显示买盘力量持续流入。OBV 指标创出新高，确认上涨趋势的有效性。

3. **RSI 指标**
   日线 RSI 目前在 62，仍有上升空间，未进入超买区域。

### 市场情绪

- Fear & Greed Index: 72 (Greed)
- 大户持仓: 持续增持
- 交易所余额: 持续下降 (积极信号)

### 操作建议

- 逢回调至 $94,500 附近可分批建仓
- 止损设置在 $92,000 下方
- 目标价位 $98,000 / $105,000

### 风险提示

- 宏观经济不确定性
- 监管政策变化
- 地缘政治风险`,
    tags: ['Technical Analysis', 'BTC', 'Support Level'],
    readCount: 1234,
    likeCount: 89,
  },
  'r2': {
    id: 'r2',
    title: 'ETH Layer 2 Ecosystem Deep Dive',
    symbol: 'ETH',
    sentiment: 'bullish',
    researcher: {
      id: 'res2',
      name: 'Sarah Wang',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      title: 'DeFi Research Lead',
    },
    publishedAt: '3 hours ago',
    requiredLevel: 'Gold',
    summary: '以太坊 L2 生态持续繁荣，Arbitrum 和 Base 领跑市场。',
    content: `## Layer 2 生态系统概览

以太坊 Layer 2 解决方案正在快速发展，TVL 已突破 $50B 大关。

### 主要 L2 对比

| L2 | TVL | TPS | 手续费 |
|---|---|---|---|
| Arbitrum | $18B | 40,000 | $0.01 |
| Base | $12B | 35,000 | $0.005 |
| Optimism | $8B | 25,000 | $0.02 |

### 投资机会

1. **Arbitrum (ARB)**
   - 生态最成熟
   - DeFi 项目最多
   - 目标价: $2.5

2. **Base**
   - Coinbase 支持
   - 增长最快
   - 关注其原生项目

### 风险因素

- 技术安全风险
- 竞争加剧
- 监管不确定性`,
    tags: ['Layer 2', 'ETH', 'DeFi'],
    readCount: 856,
    likeCount: 67,
  },
  'r3': {
    id: 'r3',
    title: 'SOL Network Activity Surging - Detailed Analysis',
    symbol: 'SOL',
    sentiment: 'bullish',
    researcher: {
      id: 'res3',
      name: 'Mike Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
      title: 'Blockchain Analyst',
    },
    publishedAt: '5 hours ago',
    requiredLevel: 'Diamond',
    summary: 'Solana 网络活动激增，日交易量创历史新高，生态发展势头强劲。',
    content: `## Solana 网络分析

Solana 近期网络活动显著增加，多项指标创下新高。

### 关键数据

- 日交易量: 5000万+
- 活跃地址: 200万+
- TVL: $8B
- DEX 交易量: $2B/日

### 生态亮点

1. **Jupiter** - DEX 聚合器龙头
2. **Marinade** - 质押协议
3. **Tensor** - NFT 市场

### 投资观点

SOL 目前处于价值洼地，生态发展超预期。

### 风险提示

- 网络稳定性历史问题
- 竞争加剧`,
    tags: ['SOL', 'Network', 'DeFi'],
    readCount: 623,
    likeCount: 45,
  },
  'r4': {
    id: 'r4',
    title: 'Macro Outlook: Fed Policy Impact on Crypto',
    symbol: 'MACRO',
    sentiment: 'neutral',
    researcher: {
      id: 'res4',
      name: 'Dr. James Lee',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
      title: 'Chief Economist',
    },
    publishedAt: '6 hours ago',
    requiredLevel: 'Diamond',
    summary: '美联储政策转向在即，对加密市场的影响分析。',
    content: `## 宏观经济展望

美联储政策变化将对加密市场产生重大影响。

### 关键判断

1. **降息预期**
   - Q2 可能开始降息
   - 全年预计降息 75-100bp

2. **流动性影响**
   - 降息利好风险资产
   - 美元走弱利好 BTC

3. **市场影响**
   - 短期波动加大
   - 中期看多

### 配置建议

- BTC: 50%
- ETH: 30%
- 山寨币: 20%`,
    tags: ['Macro', 'Fed', 'Policy'],
    readCount: 1102,
    likeCount: 78,
  },
  'r5': {
    id: 'r5',
    title: 'DeFi Yield Strategies Q1 2026 Report',
    symbol: 'DeFi',
    sentiment: 'bullish',
    researcher: {
      id: 'res5',
      name: 'VIP Research Team',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vip',
      title: 'Research Team',
    },
    publishedAt: '12 hours ago',
    requiredLevel: 'Diamond',
    summary: 'DeFi 收益策略深度报告，精选高收益低风险机会。',
    content: `## DeFi 收益策略报告

本期精选 Q1 2026 最佳 DeFi 收益机会。

### 推荐策略

1. **稳定币收益**
   - Aave USDC: 8% APY
   - Curve 3pool: 12% APY

2. **流动性挖矿**
   - Uniswap V3 ETH/USDC: 25% APY
   - Aerodrome Base: 40% APY

3. **质押收益**
   - ETH 质押: 4.5% APY
   - SOL 质押: 7% APY

### 风险提示

- 智能合约风险
- 无常损失
- 协议风险`,
    tags: ['DeFi', 'Yield', 'Strategy'],
    readCount: 892,
    likeCount: 56,
  },
};

// AI 解读模拟数据
const mockAIInterpretations: Record<string, string[]> = {
  'r1': [
    '这份研报看多 BTC，核心逻辑是技术面支撑有效。$94,500 是关键价位，跌破则看空。',
    '从链上数据看，交易所 BTC 余额持续下降是积极信号，说明长期持有者在增加。',
    '建议关注的操作策略：分批建仓，严格止损。风险收益比约 1:2。',
    '需要注意的风险：宏观环境仍有不确定性，建议仓位控制在 20% 以内。',
  ],
  'r2': [
    '研报主题是 L2 生态，核心观点是 Arbitrum 和 Base 是当前最值得关注的 L2。',
    'TVL 数据显示 L2 正在快速吸收流动性，这对 ETH 长期是利好。',
    '投资建议倾向于 ARB，目标价 $2.5。Base 暂无代币但值得关注其生态项目。',
    '风险提示：L2 技术仍在发展中，安全事件可能影响市场信心。',
  ],
  'r3': [
    '研报看多 SOL，核心逻辑是网络活动数据强劲，生态发展超预期。',
    '日交易量和活跃地址创新高，说明用户采用率在快速提升。',
    'Jupiter 作为 DEX 聚合器龙头值得重点关注，可能有空投机会。',
    '风险提示：Solana 历史上有网络中断问题，需关注网络稳定性。',
  ],
  'r4': [
    '这是一篇宏观分析报告，核心观点是美联储降息利好加密市场。',
    'Q2 降息预期较强，全年可能降息 75-100bp，流动性将改善。',
    '配置建议偏保守：BTC 50%、ETH 30%、山寨币 20%。',
    '短期可能波动加大，但中期看多，建议逢低布局。',
  ],
  'r5': [
    '这是一份 DeFi 收益策略报告，精选了低风险高收益机会。',
    '稳定币收益策略推荐 Aave 和 Curve，APY 8-12%，风险较低。',
    '流动性挖矿可关注 Uniswap V3 和 Aerodrome，收益更高但有无常损失风险。',
    '整体建议：根据风险偏好配置，稳健型选稳定币策略，激进型可尝试流动性挖矿。',
  ],
};

// 赞赏金额选项
const tipAmounts = [
  { amount: 5, label: '5 USDT' },
  { amount: 10, label: '10 USDT' },
  { amount: 50, label: '50 USDT' },
  { amount: 100, label: '100 USDT' },
];

interface ResearchReportModalProps {
  reportId: string | null;
  onClose: () => void;
}

export function ResearchReportModal({ reportId, onClose }: ResearchReportModalProps) {
  const { user, lockEnergy, spendEnergy } = useUserStore();
  const { openChat, createConsultation, setServiceMode } = useChatStore();
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiInterpretation, setAIInterpretation] = useState<string[]>([]);
  const [showAI, setShowAI] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  // 互动功能状态
  const [activeTab, setActiveTab] = useState<'content' | 'comments'>('content');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedTipAmount, setSelectedTipAmount] = useState<number | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [tipSuccess, setTipSuccess] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [insufficientEnergy, setInsufficientEnergy] = useState<{ action: string; required: number } | null>(null);
  const [showAppointment, setShowAppointment] = useState(false);

  const report = reportId ? mockReportDetails[reportId] : null;

  // 检查用户是否有权限查看
  const userLevel = user?.level || 'Bronze';
  const levelOrder = ['Bronze', 'Silver', 'Gold', 'Diamond'] as const;
  const userLevelIndex = levelOrder.indexOf(userLevel);
  const hasAccess = report && userLevelIndex >= levelOrder.indexOf(report.requiredLevel);

  // 加载评论
  useEffect(() => {
    if (reportId && mockComments[reportId]) {
      setComments(mockComments[reportId]);
    } else {
      setComments([]);
    }
  }, [reportId]);

  // 初始化点赞数
  useEffect(() => {
    if (report) {
      setLikeCount(report.likeCount || 0);
    }
  }, [report]);

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTipModal) {
          setShowTipModal(false);
        } else if (showMessageModal) {
          setShowMessageModal(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose, showTipModal, showMessageModal]);

  // 重置状态
  useEffect(() => {
    if (!reportId) {
      setActiveTab('content');
      setShowTipModal(false);
      setShowMessageModal(false);
      setAIInterpretation([]);
      setShowAI(false);
      setIsLiked(false);
    }
  }, [reportId]);

  if (!report || !reportId) return null;

  const handleAIInterpret = async () => {
    if (aiInterpretation.length > 0) {
      setShowAI(!showAI);
      return;
    }

    setIsAILoading(true);
    setShowAI(true);

    // 模拟 AI 逐条输出
    const interpretations = mockAIInterpretations[reportId] || [
      '正在分析研报内容...',
      '这是一份专业的市场分析报告。',
      '建议结合自身风险偏好做出决策。',
    ];

    for (let i = 0; i < interpretations.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAIInterpretation(prev => [...prev, interpretations[i]]);
    }

    setIsAILoading(false);
  };

  const handleCopy = async () => {
    const text = `${report.title}\n\n${report.summary}\n\n${report.content}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `c${Date.now()}`,
      userId: user?.id || 'guest',
      userName: user?.walletAddress?.slice(0, 8) || 'Guest',
      content: newComment,
      createdAt: 'Just now',
      likes: 0,
      isLiked: false,
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  const handleLikeComment = (commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          likes: c.isLiked ? c.likes - 1 : c.likes + 1,
          isLiked: !c.isLiked,
        };
      }
      return c;
    }));
  };

  const handleTip = () => {
    const amount = selectedTipAmount || Number(customTipAmount);
    if (!amount || amount <= 0) return;

    // 模拟赞赏成功
    setTipSuccess(true);
    setTimeout(() => {
      setTipSuccess(false);
      setShowTipModal(false);
      setSelectedTipAmount(null);
      setCustomTipAmount('');
    }, 2000);
  };

  const handleOpenMessage = () => {
    const energyAvailable = user?.energyAvailable || 0;
    if (energyAvailable < ENERGY_COSTS.privateMessage) {
      setInsufficientEnergy({ action: '私信', required: ENERGY_COSTS.privateMessage });
      return;
    }
    setShowMessageModal(true);
  };

  const handleSendMessage = () => {
    if (!messageContent.trim()) return;

    // 锁定并消费能量
    const success = lockEnergy(ENERGY_COSTS.privateMessage, `私信 ${report?.researcher.name}`);
    if (!success) {
      setInsufficientEnergy({ action: '私信', required: ENERGY_COSTS.privateMessage });
      return;
    }
    spendEnergy(ENERGY_COSTS.privateMessage, `私信 ${report?.researcher.name}`);

    // 模拟发送成功
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setShowMessageModal(false);
      setMessageContent('');
    }, 2000);
  };

  const handleStartChat = async () => {
    // 检查能量
    const energyAvailable = user?.energyAvailable || 0;
    if (energyAvailable < ENERGY_COSTS.oneOnOneChat) {
      setInsufficientEnergy({ action: '1v1 咨询', required: ENERGY_COSTS.oneOnOneChat });
      return;
    }

    // 锁定能量
    const success = lockEnergy(ENERGY_COSTS.oneOnOneChat, `1v1 咨询 ${report?.researcher.name}`);
    if (!success) {
      setInsufficientEnergy({ action: '1v1 咨询', required: ENERGY_COSTS.oneOnOneChat });
      return;
    }

    // 打开聊天面板，创建与研究员的咨询
    setServiceMode('researcher');
    openChat();

    // 创建一个针对该研究员的咨询
    if (user?.id && report) {
      try {
        await createConsultation(
          user.id,
          `关于研报《${report.title}》的咨询`,
          `研报标题：${report.title}\n研报摘要：${report.summary}`,
          report.researcher.id
        );
      } catch (error) {
        console.error('Failed to create consultation:', error);
      }
    }

    onClose();
  };

  const SentimentBadge = () => {
    if (!report.sentiment) return null;
    const config = {
      bullish: { icon: TrendingUp, color: 'var(--brand-green)', label: '看多' },
      bearish: { icon: TrendingDown, color: 'var(--brand-red)', label: '看空' },
      neutral: { icon: null, color: 'var(--text-muted)', label: '中性' },
    };
    const { icon: Icon, color, label } = config[report.sentiment];
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: `${color}20`, color }}>
        {Icon && <Icon size={12} />}
        {label}
      </span>
    );
  };

  // 处理背景点击关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    // 只有点击背景（不是内容区域）时才关闭
    if (e.target === e.currentTarget && !showTipModal && !showMessageModal && !insufficientEnergy && !showAppointment) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-[var(--border-light)]">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded text-[9px] font-bold text-black">
                <Crown size={10} />
                VIP
              </span>
              {report.symbol && (
                <span className="text-[11px] font-bold px-2 py-0.5 bg-[var(--bg-surface)] text-[var(--text-main)] rounded">
                  {report.symbol}
                </span>
              )}
              <SentimentBadge />
              <span
                className="text-[9px] px-1.5 py-0.5 rounded border"
                style={{
                  borderColor: LEVEL_CONFIG[report.requiredLevel].color,
                  color: LEVEL_CONFIG[report.requiredLevel].color,
                }}
              >
                {report.requiredLevel}+
              </span>
            </div>
            <h2 className="text-[16px] font-bold text-[var(--text-main)] leading-tight">
              {report.title}
            </h2>

            {/* 研究员信息 + 互动按钮 */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <img
                  src={report.researcher.avatar}
                  alt={report.researcher.name}
                  className="w-8 h-8 rounded-full bg-[var(--bg-surface)]"
                />
                <div>
                  <div className="text-[12px] font-medium text-[var(--text-main)]">
                    {report.researcher.name}
                  </div>
                  <div className="text-[10px] text-[var(--text-dim)]">
                    {report.researcher.title}
                  </div>
                </div>
              </div>

              {/* 快捷互动按钮 */}
              {hasAccess && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleOpenMessage}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] rounded transition"
                    title={`私信研究员 (${ENERGY_COSTS.privateMessage} 能量)`}
                  >
                    <Mail size={12} />
                    <span className="hidden sm:inline">私信</span>
                    <span className="text-[8px] text-[var(--brand-yellow)]">{ENERGY_COSTS.privateMessage}</span>
                  </button>
                  <button
                    onClick={handleStartChat}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-[var(--brand-green)] hover:bg-[var(--brand-green)]/10 rounded transition"
                    title={`1v1 咨询 (${ENERGY_COSTS.oneOnOneChat} 能量)`}
                  >
                    <MessageSquare size={12} />
                    <span className="hidden sm:inline">1v1</span>
                    <span className="text-[8px] text-[var(--brand-yellow)]">{ENERGY_COSTS.oneOnOneChat}</span>
                  </button>
                  <button
                    onClick={() => setShowAppointment(true)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-[var(--brand-yellow)] hover:bg-[var(--brand-yellow)]/10 rounded transition"
                    title="预约通话"
                  >
                    <CalendarClock size={12} />
                    <span className="hidden sm:inline">预约</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--text-muted)]">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{report.publishedAt}</span>
              </div>
              <span>{report.readCount?.toLocaleString()} 阅读</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--bg-surface)] rounded transition-colors"
          >
            <X size={18} className="text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Tab 切换 */}
        {hasAccess && (
          <div className="flex border-b border-[var(--border-light)]">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2.5 text-[13px] font-medium transition ${
                activeTab === 'content'
                  ? 'text-[var(--text-main)] border-b-2 border-[var(--brand-yellow)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              研报内容
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-2.5 text-[13px] font-medium transition flex items-center justify-center gap-1 ${
                activeTab === 'comments'
                  ? 'text-[var(--text-main)] border-b-2 border-[var(--brand-yellow)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <MessageCircle size={14} />
              评论 ({comments.length})
            </button>
          </div>
        )}

        {/* Content */}
        {hasAccess ? (
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'content' ? (
              <>
                {/* Summary */}
                <div className="p-4 bg-[var(--bg-surface)] border-b border-[var(--border-light)]">
                  <div className="text-[12px] text-[var(--text-muted)] mb-1">摘要</div>
                  <p className="text-[14px] text-[var(--text-main)] leading-relaxed">
                    {report.summary}
                  </p>
                </div>

                {/* AI Interpretation */}
                <div className="p-4 border-b border-[var(--border-light)]">
                  <button
                    onClick={handleAIInterpret}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#8b5cf6]/10 to-[#6366f1]/10 hover:from-[#8b5cf6]/20 hover:to-[#6366f1]/20 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#8b5cf6]" />
                      <span className="text-[13px] font-medium text-[var(--text-main)]">AI 智能解读</span>
                      {aiInterpretation.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#8b5cf6]/20 text-[#8b5cf6] rounded">
                          已生成
                        </span>
                      )}
                    </div>
                    {isAILoading ? (
                      <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
                    ) : showAI ? (
                      <ChevronUp size={16} className="text-[var(--text-muted)]" />
                    ) : (
                      <ChevronDown size={16} className="text-[var(--text-muted)]" />
                    )}
                  </button>

                  {showAI && aiInterpretation.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {aiInterpretation.map((text, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-3 bg-[var(--bg-surface)] rounded-lg animate-fadeIn"
                        >
                          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sparkles size={10} className="text-white" />
                          </div>
                          <p className="text-[12px] text-[var(--text-main)] leading-relaxed">
                            {text}
                          </p>
                        </div>
                      ))}
                      {isAILoading && (
                        <div className="flex items-center gap-2 p-3 bg-[var(--bg-surface)] rounded-lg">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] flex items-center justify-center flex-shrink-0">
                            <Sparkles size={10} className="text-white" />
                          </div>
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Full Content */}
                <div className="p-4">
                  <button
                    onClick={() => setShowContent(!showContent)}
                    className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] mb-3 hover:text-[var(--text-main)]"
                  >
                    {showContent ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{showContent ? '收起正文' : '展开正文'}</span>
                  </button>

                  {showContent && (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <div
                        className="text-[13px] text-[var(--text-main)] leading-relaxed whitespace-pre-wrap"
                        style={{ fontFamily: 'inherit' }}
                      >
                        {report.content.split('\n').map((line, i) => {
                          if (line.startsWith('## ')) {
                            return <h2 key={i} className="text-[15px] font-bold mt-4 mb-2 text-[var(--text-main)]">{line.replace('## ', '')}</h2>;
                          }
                          if (line.startsWith('### ')) {
                            return <h3 key={i} className="text-[14px] font-semibold mt-3 mb-1.5 text-[var(--text-main)]">{line.replace('### ', '')}</h3>;
                          }
                          if (line.startsWith('- ')) {
                            return <li key={i} className="ml-4 text-[var(--text-main)]">{line.replace('- ', '')}</li>;
                          }
                          if (line.startsWith('|')) {
                            return <div key={i} className="font-mono text-[11px] text-[var(--text-muted)]">{line}</div>;
                          }
                          if (line.match(/^\d+\./)) {
                            return <div key={i} className="ml-2 text-[var(--text-main)]">{line}</div>;
                          }
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <div key={i} className="font-semibold text-[var(--text-main)]">{line.replace(/\*\*/g, '')}</div>;
                          }
                          return line ? <p key={i} className="text-[var(--text-main)]">{line}</p> : <br key={i} />;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t border-[var(--border-light)]">
                    {report.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 bg-[var(--bg-surface)] text-[var(--text-muted)] rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* 评论区 */
              <div className="p-4">
                {/* 评论输入 */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="写下你的评论..."
                    className="flex-1 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg text-[13px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--brand-yellow)]"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-[var(--brand-yellow)] text-black rounded-lg text-[13px] font-medium disabled:opacity-50 hover:opacity-90 transition"
                  >
                    <Send size={16} />
                  </button>
                </div>

                {/* 评论列表 */}
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                      暂无评论，来抢沙发吧
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-[var(--bg-surface)] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[var(--bg-highlight)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)]">
                              {comment.userName.slice(0, 2)}
                            </div>
                            <span className="text-[12px] font-medium text-[var(--text-main)]">
                              {comment.userName}
                            </span>
                            <span className="text-[10px] text-[var(--text-dim)]">
                              {comment.createdAt}
                            </span>
                          </div>
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className={`flex items-center gap-1 text-[11px] transition ${
                              comment.isLiked ? 'text-[var(--brand-red)]' : 'text-[var(--text-muted)] hover:text-[var(--brand-red)]'
                            }`}
                          >
                            <ThumbsUp size={12} className={comment.isLiked ? 'fill-current' : ''} />
                            {comment.likes}
                          </button>
                        </div>
                        <p className="text-[13px] text-[var(--text-main)]">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Locked Content - Show Preview */
          <div className="flex-1 overflow-y-auto">
            {/* Full Summary Preview */}
            <div className="p-4 border-b border-[var(--border-light)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[13px] font-medium text-[var(--text-main)]">研报摘要</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-[var(--brand-yellow)]/20 text-[var(--brand-yellow)] rounded">免费预览</span>
              </div>
              <p className="text-[14px] text-[var(--text-main)] leading-[1.8]">
                {report.summary}
              </p>
            </div>

            {/* Locked Full Content */}
            <div className="relative">
              {/* Visible preview content - first paragraph */}
              <div className="p-4 pb-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[13px] font-medium text-[var(--text-main)]">详细分析</span>
                  <Lock size={12} className="text-[var(--text-dim)]" />
                </div>
                <div className="text-[13px] text-[var(--text-main)] leading-[1.8] whitespace-pre-line">
                  {report.content.split('\n\n')[0]}
                </div>
              </div>

              {/* Gradient fade to locked */}
              <div className="relative mt-4">
                {/* Blurred remaining content */}
                <div className="px-4 text-[13px] text-[var(--text-muted)] leading-[1.8] whitespace-pre-line blur-[6px] select-none pointer-events-none" style={{ maxHeight: '120px', overflow: 'hidden' }}>
                  {report.content.split('\n\n').slice(1).join('\n\n')}
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-panel)]/30 via-[var(--bg-panel)]/70 to-[var(--bg-panel)]" />
              </div>

              {/* Unlock CTA */}
              <div className="p-6 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/10 rounded-xl border border-[var(--brand-yellow)]/30">
                  <Crown size={24} className="text-[var(--brand-yellow)]" />
                  <div className="text-left">
                    <div className="text-[14px] font-medium text-[var(--text-main)]">
                      升级到 <span style={{ color: LEVEL_CONFIG[report.requiredLevel].color }}>{report.requiredLevel}</span> 解锁完整内容
                    </div>
                    <div className="text-[12px] text-[var(--text-muted)]">
                      当前等级: <span style={{ color: LEVEL_CONFIG[userLevel].color }}>{userLevel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer - 互动按钮 */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--border-light)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            {/* 点赞 */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition ${
                isLiked
                  ? 'bg-[var(--brand-red)]/20 text-[var(--brand-red)]'
                  : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Heart size={14} className={isLiked ? 'fill-current' : ''} />
              {likeCount}
            </button>

            {/* 赞赏 */}
            {hasAccess && (
              <button
                onClick={() => setShowTipModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 text-[#FFD700] rounded-lg text-[12px] font-medium hover:from-[#FFD700]/30 hover:to-[#FFA500]/30 transition"
              >
                <Gift size={14} />
                赞赏
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSubscribed(!isSubscribed)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
                isSubscribed
                  ? 'bg-[var(--brand-yellow)]/20 text-[var(--brand-yellow)]'
                  : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {isSubscribed ? <Bell size={14} /> : <BellOff size={14} />}
              {isSubscribed ? '已订阅' : '订阅'}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded text-[11px] font-medium transition-colors"
            >
              {copied ? <Check size={14} className="text-[var(--brand-green)]" /> : <Copy size={14} />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      </div>

      {/* 赞赏弹窗 */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setShowTipModal(false)}>
          <div
            className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {tipSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--brand-green)] flex items-center justify-center">
                  <Check size={32} className="text-white" />
                </div>
                <h3 className="text-[16px] font-bold text-[var(--text-main)]">赞赏成功！</h3>
                <p className="text-[13px] text-[var(--text-muted)] mt-2">
                  感谢您对 {report.researcher.name} 的支持
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <Gift size={32} className="text-[#FFD700] mx-auto mb-2" />
                  <h3 className="text-[16px] font-bold text-[var(--text-main)]">赞赏研究员</h3>
                  <p className="text-[12px] text-[var(--text-muted)] mt-1">
                    支持 {report.researcher.name} 创作更多优质内容
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {tipAmounts.map(({ amount, label }) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setSelectedTipAmount(amount);
                        setCustomTipAmount('');
                      }}
                      className={`py-3 rounded-lg text-[14px] font-medium transition ${
                        selectedTipAmount === amount
                          ? 'bg-[#FFD700] text-black'
                          : 'bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-highlight)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <input
                    type="number"
                    value={customTipAmount}
                    onChange={(e) => {
                      setCustomTipAmount(e.target.value);
                      setSelectedTipAmount(null);
                    }}
                    placeholder="自定义金额 (USDT)"
                    className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg text-[14px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--brand-yellow)]"
                  />
                </div>

                <button
                  onClick={handleTip}
                  disabled={!selectedTipAmount && !customTipAmount}
                  className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black rounded-lg font-bold text-[15px] disabled:opacity-50 hover:opacity-90 transition"
                >
                  确认赞赏
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 私信弹窗 */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setShowMessageModal(false)}>
          <div
            className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {messageSent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--brand-green)] flex items-center justify-center">
                  <Check size={32} className="text-white" />
                </div>
                <h3 className="text-[16px] font-bold text-[var(--text-main)]">发送成功！</h3>
                <p className="text-[13px] text-[var(--text-muted)] mt-2">
                  {report.researcher.name} 会尽快回复您
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={report.researcher.avatar}
                    alt={report.researcher.name}
                    className="w-10 h-10 rounded-full bg-[var(--bg-surface)]"
                  />
                  <div>
                    <div className="text-[14px] font-medium text-[var(--text-main)]">
                      私信 {report.researcher.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {report.researcher.title}
                    </div>
                  </div>
                </div>

                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="输入您想咨询的问题..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg text-[14px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--brand-yellow)] resize-none mb-4"
                />

                {/* 能量消耗提示 */}
                <div className="flex items-center justify-between mb-4 p-2 bg-[var(--bg-app)] rounded-lg">
                  <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
                    <Zap size={14} className="text-[var(--brand-yellow)]" />
                    <span>消耗 <span className="font-bold text-[var(--brand-yellow)]">{ENERGY_COSTS.privateMessage}</span> 能量</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-dim)]">
                    当前: {user?.energyAvailable?.toFixed(0) || 0}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="flex-1 py-2.5 bg-[var(--bg-surface)] text-[var(--text-muted)] rounded-lg font-medium text-[14px] hover:bg-[var(--bg-highlight)] transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim()}
                    className="flex-1 py-2.5 bg-[var(--brand-yellow)] text-black rounded-lg font-bold text-[14px] disabled:opacity-50 hover:opacity-90 transition"
                  >
                    发送
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 能量不足提示 */}
      {insufficientEnergy && (
        <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4" onClick={() => setInsufficientEnergy(null)}>
          <div
            className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[var(--brand-red)]/20 flex items-center justify-center">
                <AlertCircle size={32} className="text-[var(--brand-red)]" />
              </div>
              <h3 className="text-[16px] font-bold text-[var(--text-main)]">能量不足</h3>
              <p className="text-[13px] text-[var(--text-muted)] mt-2">
                {insufficientEnergy.action}需要 <span className="font-bold text-[var(--brand-yellow)]">{insufficientEnergy.required}</span> 能量
              </p>
              <p className="text-[12px] text-[var(--text-dim)] mt-1">
                当前能量: {user?.energyAvailable?.toFixed(0) || 0}
              </p>

              <div className="mt-4 p-3 bg-[var(--bg-surface)] rounded-lg text-left">
                <div className="text-[12px] text-[var(--text-muted)] mb-2">如何获取能量？</div>
                <ul className="text-[11px] text-[var(--text-main)] space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-green)]" />
                    交易产生手续费自动铸造能量
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-green)]" />
                    持有 SoSo 代币获得铸造加成
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-green)]" />
                    质押 SSI 代币保护能量不衰减
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setInsufficientEnergy(null)}
                className="w-full mt-4 py-2.5 bg-[var(--bg-surface)] text-[var(--text-main)] rounded-lg font-medium text-[14px] hover:bg-[var(--bg-highlight)] transition"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 预约通话弹窗 */}
      <AppointmentBooking
        isOpen={showAppointment}
        onClose={() => setShowAppointment(false)}
        researcher={report ? {
          id: report.researcher.id,
          name: report.researcher.name,
          avatar: report.researcher.avatar || '',
          title: report.researcher.title || '分析师',
          rating: 4.8,
          specialties: report.tags || [],
          voicePrice: 30,
          videoPrice: 50,
        } : undefined}
      />
    </div>
  );
}
