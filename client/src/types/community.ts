// 社区相关的 TypeScript 类型定义

export interface User {
  id: string;
  username: string;
  avatar: string;
  bio?: string;
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isResearcher?: boolean; // 是否是研究员
  isVerified?: boolean; // 平台认证
  certificationLabel?: string; // 认证标签
  isNew?: boolean; // 是否是新晋研究员
}

export interface Attachment {
  id: string;
  type: 'chart' | 'economic_data' | 'image' | 'poll' | 'pk'; // 附件类型
  url?: string; // 图片URL或数据引用
  title?: string; // 附件标题
  preview?: string; // 预览图
  poll?: PollData; // 投票数据
  pk?: PKData; // PK数据
}

// 投票选项
export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

// 投票数据
export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endTime?: Date;
  votedOptionId?: string; // 用户已投票的选项ID
  pollType: 'single' | 'yesno'; // 单选 | 是否投票
}

// PK数据
export interface PKData {
  id: string;
  question: string;
  leftOption: {
    text: string;
    votes: number;
    percentage: number;
  };
  rightOption: {
    text: string;
    votes: number;
    percentage: number;
  };
  totalVotes: number;
  endTime?: Date;
  votedSide?: 'left' | 'right'; // 用户已投票的一方
}

// 代币价格数据
export interface CoinPriceData {
  symbol: string; // BTC, ETH, SOL
  price: number;
  change24h: number; // 24小时涨跌幅
  icon?: string; // 代币图标
}

export interface Post {
  id: string;
  userId: string;
  user: User; // 关联用户信息
  content: string; // 富文本内容
  images?: string[]; // 图片 URLs
  attachments?: Attachment[]; // 交易图表、经济数据等组件
  createdAt: Date;
  viewCount: number; // 浏览量
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  type: 'feed' | 'position_report'; // 帖子类型
  tags?: string[]; // 标签
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: Date;
  likeCount: number;
  isLiked: boolean;
  replyTo?: string; // 回复的评论 ID
}

export interface Researcher {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  followerCount: number;
  postCount: number;
  isFollowing: boolean;
  isVerified: boolean; // 平台认证
  certificationLabel: string; // 认证标签
  isNew?: boolean; // 是否是新晋研究员
}

export type FeedFilter = 'featured' | 'hot' | 'latest'; // 编辑精选 | 最热 | 最新

// 代币情绪分析数据
export interface CoinSentiment {
  symbol: string; // 代币符号 BTC, ETH, SOL
  bullishPercent: number; // 看涨百分比
  neutralPercent: number; // 中立百分比
  bearishPercent: number; // 看跌百分比
  mentionCount: number; // 提及次数
  topAvatars: string[]; // 参与讨论的用户头像（最多显示3个）
}
