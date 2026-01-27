// Community API Service
// 用于接入真实的 ETF 数据、热点话题、Polymarket 等 API

// ========== ETF 数据 API ==========
/**
 * 获取 SoSoValue ETF 数据
 * TODO: 接入真实 API
 */
export async function fetchETFData(chartType: 'btc-etf' | 'eth-etf' | 'fear-greed') {
  // TODO: 替换为真实 API 调用
  // const response = await fetch(`/api/etf/${chartType}`);
  // return response.json();

  // Mock 数据占位
  return {
    chartType,
    data: [],
    url: `/charts/${chartType}`,
  };
}

// ========== 热点话题 API ==========
/**
 * 获取自有新闻热点库
 * TODO: 接入真实数据库 API
 */
export async function fetchTrendingNews() {
  // TODO: 替换为真实 API 调用
  // const response = await fetch('/api/trending/news');
  // return response.json();

  // Mock 数据占位
  return [
    { id: '1', name: 'AI巨头集体入局创世纪计划！', type: 'news', heat: 98 },
    { id: '2', name: '存储概念狂飙！', type: 'news', heat: 95 },
    { id: '3', name: '格林兰岛事件对BTC的影响', type: 'news', heat: 92 },
    { id: '4', name: '电力设备', type: 'news', heat: 88 },
  ];
}

/**
 * 获取 Polymarket 热门话题
 * TODO: 接入 Polymarket API
 */
export async function fetchPolymarketTopics() {
  // TODO: 替换为真实 Polymarket API 调用
  // 参考文档: https://docs.polymarket.com/
  // const response = await fetch('https://api.polymarket.com/markets/trending');
  // return response.json();

  // Mock 数据占位
  return [
    {
      id: '1',
      name: 'Trump x Greenland deal',
      type: 'polymarket',
      volume: '$33k',
      endDate: '每月',
    },
    {
      id: '2',
      name: '特朗普会在2027年前收购格陵兰吗',
      type: 'polymarket',
      volume: '$12k',
      endDate: '每月',
    },
  ];
}

/**
 * 合并所有热点话题
 */
export async function fetchAllTrendingTopics() {
  const [news, polymarket] = await Promise.all([
    fetchTrendingNews(),
    fetchPolymarketTopics(),
  ]);

  return [...news, ...polymarket];
}

// ========== 代币数据 API ==========
/**
 * 获取支持的代币列表
 * TODO: 接入真实代币数据库
 */
export async function fetchSupportedCoins() {
  // TODO: 替换为真实 API 调用
  // const response = await fetch('/api/coins/supported');
  // return response.json();

  // Mock 数据占位
  return [
    'BTC', 'ETH', 'SOL', 'ARB', 'OP', 'BONK', 'JUP',
    'DOGE', 'SHIB', 'PEPE', 'AVAX', 'MATIC', 'DOT',
  ];
}

/**
 * 获取代币价格数据
 * TODO: 接入真实价格 API（如 CoinGecko、Binance 等）
 */
export async function fetchCoinPrice(symbol: string) {
  // TODO: 替换为真实 API 调用
  // const response = await fetch(`/api/coins/${symbol}/price`);
  // return response.json();

  // Mock 数据占位
  return {
    symbol,
    price: Math.random() * 1000,
    change24h: (Math.random() - 0.5) * 10,
  };
}

// ========== 文件上传 API ==========
/**
 * 上传图片到服务器/OSS
 * TODO: 接入真实上传服务（如阿里云 OSS、腾讯云 COS 等）
 */
export async function uploadImage(file: File): Promise<string> {
  // TODO: 替换为真实上传逻辑
  // const formData = new FormData();
  // formData.append('file', file);
  // const response = await fetch('/api/upload/image', {
  //   method: 'POST',
  //   body: formData,
  // });
  // const data = await response.json();
  // return data.url;

  // Mock 占位：返回本地 URL
  return URL.createObjectURL(file);
}

/**
 * 上传视频到服务器/OSS
 * TODO: 接入真实上传服务
 */
export async function uploadVideo(file: File): Promise<string> {
  // TODO: 替换为真实上传逻辑
  // const formData = new FormData();
  // formData.append('file', file);
  // const response = await fetch('/api/upload/video', {
  //   method: 'POST',
  //   body: formData,
  // });
  // const data = await response.json();
  // return data.url;

  // Mock 占位：返回本地 URL
  return URL.createObjectURL(file);
}

// ========== 发帖 API ==========
/**
 * 创建新帖子（完整流程）
 * TODO: 接入真实后端 API
 */
export async function createPost(postData: {
  title?: string;
  content: string;
  images: string[];
  videos: string[];
  tags: string[];
  chartUrl?: string;
  poll?: {
    question: string;
    options: string[];
    endDate: Date;
    type: 'single' | 'multiple';
  };
}) {
  // TODO: 替换为真实 API 调用
  // const response = await fetch('/api/posts', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${getAuthToken()}`,
  //   },
  //   body: JSON.stringify(postData),
  // });
  // return response.json();

  // Mock 占位：模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('创建帖子:', postData);

  return {
    success: true,
    postId: `post_${Date.now()}`,
    post: {
      id: `post_${Date.now()}`,
      ...postData,
      userId: 'current-user-id',
      createdAt: new Date(),
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      isLiked: false,
    },
  };
}

// ========== 配置说明 ==========
/**
 * API 接入配置说明：
 *
 * 1. ETF 数据接入：
 *    - 端点：需要提供 SoSoValue ETF 数据 API 端点
 *    - 认证：可能需要 API Key 或 Token
 *    - 返回格式：需要确认数据结构
 *
 * 2. 热点话题接入：
 *    - 新闻热点：需要提供内部新闻数据库 API
 *    - Polymarket：使用官方 API (https://api.polymarket.com)
 *
 * 3. 代币数据接入：
 *    - 可使用 CoinGecko API: https://www.coingecko.com/en/api
 *    - 或 Binance API: https://binance-docs.github.io/apidocs/
 *
 * 4. 文件上传接入：
 *    - 推荐使用 OSS 服务（阿里云、腾讯云、AWS S3）
 *    - 需要配置 bucket、region、credentials
 *
 * 5. 后端 API：
 *    - 需要提供完整的 RESTful API 文档
 *    - 包括认证方式（JWT、Session 等）
 */
