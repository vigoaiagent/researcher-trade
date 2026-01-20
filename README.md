# Sodex 研究员客服系统 MVP

## 项目结构

```
researcher_trade/
├── client/          # 前端 (React + TypeScript + Vite)
├── server/          # 后端 (Node.js + Fastify + Prisma)
├── tg-bot/          # Telegram Bot (研究员端)
└── docker-compose.yml
```

## 快速开始

### 1. 启动数据库

```bash
cd /Users/zhaoqi/Desktop/researcher_trade
docker-compose up -d
```

### 2. 初始化后端

```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run db:seed   # 创建测试数据
npm run dev
```

### 3. 启动前端

```bash
cd client
npm install
npm run dev
```

### 4. 启动 TG Bot (可选)

需要先在 Telegram @BotFather 创建 Bot 并获取 Token。

```bash
cd tg-bot
npm install
# 编辑 .env 填入 TG_BOT_TOKEN
npm run dev
```

## 访问地址

- 前端: http://localhost:5173
- 后端 API: http://localhost:3001
- TG Bot 通知服务: http://localhost:3002

## 测试账号

快速体验按钮使用测试账号:
- 钱包地址: `0x1234567890abcdef1234567890abcdef12345678`
- 初始能量值: 100

## 测试研究员

已预置 3 个测试研究员:
- BTC分析师小王 (BTC/比特币)
- BTC研究员老张 (BTC/技术分析)
- 贵金属专家李教授 (贵金属/黄金)

## 功能列表

### 已实现 (MVP)
- [x] 用户端：AI客服猫入口
- [x] 用户端：文字咨询完整流程
- [x] 研究员端：TG Bot 基础功能
- [x] 后端：咨询会话管理
- [x] 后端：研究员匹配
- [x] 后端：能量值基础扣费

### 待实现 (二期)
- [ ] 语音咨询 (ElevenLabs)
- [ ] 运营机制 (喜报/排行榜)
- [ ] 大户特权体系
