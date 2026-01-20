import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

export function setupSocket(io: Server, prisma: PrismaClient) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // 用户加入房间
    socket.on('join_user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined`);
    });

    // 研究员加入房间 (通过TG chatId)
    socket.on('join_researcher', (chatId: string) => {
      socket.join(`researcher:${chatId}`);
      console.log(`🔬 Researcher ${chatId} joined`);
    });

    // 加入咨询会话房间
    socket.on('join_consultation', (consultationId: string) => {
      socket.join(`consultation:${consultationId}`);
      console.log(`💬 Joined consultation ${consultationId}`);
    });

    // 离开咨询会话房间
    socket.on('leave_consultation', (consultationId: string) => {
      socket.leave(`consultation:${consultationId}`);
      console.log(`👋 Left consultation ${consultationId}`);
    });

    // 用户发送消息
    socket.on('send_message', async (data: {
      consultationId: string;
      userId: string;
      content: string;
    }) => {
      const { consultationId, userId, content } = data;

      try {
        // 创建消息
        const message = await prisma.message.create({
          data: {
            consultationId,
            senderType: 'USER',
            senderId: userId,
            content,
          },
        });

        // 更新会话轮次和超时时间
        const consultation = await prisma.consultation.update({
          where: { id: consultationId },
          data: {
            roundsUsed: { increment: 1 },
            timeoutAt: new Date(Date.now() + 10 * 60 * 1000),
          },
          include: {
            consultationResearchers: {
              where: { isSelected: true },
              include: { researcher: true },
            },
          },
        });

        // 广播消息到咨询房间
        io.to(`consultation:${consultationId}`).emit('new_message', {
          message,
          roundsLeft: consultation.maxRounds - consultation.roundsUsed,
        });

        // 通知研究员
        const selectedCR = consultation.consultationResearchers[0];
        if (selectedCR) {
          io.to(`researcher:${selectedCR.researcher.tgChatId}`).emit('user_message', {
            consultationId,
            content,
            roundsLeft: consultation.maxRounds - consultation.roundsUsed,
          });
        }

        // 检查是否达到最大轮次 - 不自动关闭，通知用户可以续费
        if (consultation.roundsUsed >= consultation.maxRounds) {
          io.to(`consultation:${consultationId}`).emit('rounds_exhausted', {
            consultationId,
            roundsUsed: consultation.roundsUsed,
            maxRounds: consultation.maxRounds,
            canExtend: true,
            extendCost: 5,
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // 用户输入中
    socket.on('typing', (data: { consultationId: string; userId: string }) => {
      socket.to(`consultation:${data.consultationId}`).emit('user_typing', {
        userId: data.userId,
      });
    });

    // =====================
    // 语音通话相关事件
    // =====================

    // 研究员加入通话房间
    socket.on('call:join-room', (data: { roomId: string; researcherId: string }) => {
      const { roomId, researcherId } = data;
      socket.join(`call:${roomId}`);
      console.log(`📞 Researcher ${researcherId} joined call room ${roomId}`);

      // 如果有等待中的 offer，发送给研究员
      const storedOffer = callOffers.get(roomId);
      if (storedOffer) {
        console.log(`📞 Sending stored offer to researcher`);
        socket.emit('call:offer', {
          offer: storedOffer.offer,
          userId: storedOffer.userId,
        });
      }
    });

    // 用户发起通话请求
    socket.on('call:request', async (data: {
      roomId: string;
      userId: string;
      researcherId: string;
      consultationId: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      const { roomId, userId, researcherId, consultationId, offer } = data;

      console.log(`📞 Call request from user ${userId} to researcher ${researcherId}`);

      // 加入通话房间
      socket.join(`call:${roomId}`);

      try {
        // 获取研究员信息
        const researcher = await prisma.researcher.findUnique({
          where: { id: researcherId },
        });

        if (!researcher) {
          socket.emit('call:error', { message: '研究员不存在' });
          return;
        }

        // 获取用户信息
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        // 获取咨询信息
        const consultation = await prisma.consultation.findUnique({
          where: { id: consultationId },
        });

        // 构建通话页面URL
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const callPageUrl = `${clientUrl}/call/${roomId}?researcherId=${researcherId}&userId=${userId}&question=${encodeURIComponent(consultation?.question || '')}&userName=${encodeURIComponent(user?.walletAddress?.slice(0, 8) || '用户')}`;

        // 通知TG Bot发送通话请求
        const tgBotUrl = process.env.TG_BOT_URL || 'http://localhost:3002';
        console.log(`📞 Sending voice call notification to TG Bot: ${tgBotUrl}/notify/voice-call`);
        console.log(`📞 Researcher chatId: ${researcher.tgChatId}, callPageUrl: ${callPageUrl}`);

        try {
          const tgResponse = await fetch(`${tgBotUrl}/notify/voice-call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: researcher.tgChatId,
              roomId,
              userId,
              userName: user?.walletAddress?.slice(0, 8) || '用户',
              question: consultation?.question || '',
              callPageUrl,
            }),
          });

          if (!tgResponse.ok) {
            const errorText = await tgResponse.text();
            console.error(`📞 TG Bot notification failed: ${tgResponse.status} - ${errorText}`);
          } else {
            console.log(`📞 TG Bot notification sent successfully`);
          }
        } catch (tgError) {
          console.error(`📞 Failed to send TG Bot notification:`, tgError);
        }

        // 存储offer，等待研究员接听
        callOffers.set(roomId, {
          offer,
          userId,
          researcherId,
          timestamp: Date.now(),
        });

        // 设置超时 (60秒)
        setTimeout(() => {
          const storedOffer = callOffers.get(roomId);
          if (storedOffer && storedOffer.timestamp === callOffers.get(roomId)?.timestamp) {
            callOffers.delete(roomId);
            socket.emit('call:timeout');
            io.to(`call:${roomId}`).emit('call:timeout');
          }
        }, 60000);

      } catch (error) {
        console.error('Call request error:', error);
        socket.emit('call:error', { message: '发起通话失败' });
      }
    });

    // 研究员收到offer后转发给用户
    socket.on('call:offer', (data: { offer: RTCSessionDescriptionInit; userId: string }) => {
      // 这个事件由服务器向研究员页面转发offer
      socket.to(`call:${data.userId}`).emit('call:offer', data);
    });

    // 研究员发送Answer
    socket.on('call:answer', async (data: { roomId: string; answer: RTCSessionDescriptionInit; researcherId?: string }) => {
      const { roomId, answer, researcherId } = data;
      console.log(`📞 Researcher answered call in room ${roomId}`);

      // 删除存储的offer
      const storedOffer = callOffers.get(roomId);
      callOffers.delete(roomId);

      // 设置研究员状态为 BUSY
      const rId = researcherId || storedOffer?.researcherId;
      if (rId) {
        await prisma.researcher.update({
          where: { id: rId },
          data: { status: 'BUSY' },
        });
        // 记录正在通话的研究员
        activeCallResearchers.set(roomId, rId);
        console.log(`📞 Researcher ${rId} status set to BUSY`);
      }

      // 转发answer给用户
      socket.to(`call:${roomId}`).emit('call:answered', { answer });
    });

    // 研究员拒绝通话
    socket.on('call:reject', (data: { roomId: string }) => {
      const { roomId } = data;
      console.log(`📞 Researcher rejected call in room ${roomId}`);

      callOffers.delete(roomId);
      socket.to(`call:${roomId}`).emit('call:rejected');
    });

    // ICE候选交换
    socket.on('call:ice-candidate', (data: { roomId: string; candidate: RTCIceCandidateInit }) => {
      const { roomId, candidate } = data;
      // 转发ICE候选给房间内的其他人
      socket.to(`call:${roomId}`).emit('call:ice-candidate', { candidate });
    });

    // 结束通话
    socket.on('call:end', async (data: { roomId: string }) => {
      const { roomId } = data;
      console.log(`📞 Call ended in room ${roomId}`);

      callOffers.delete(roomId);

      // 恢复研究员状态为 ONLINE
      const researcherId = activeCallResearchers.get(roomId);
      if (researcherId) {
        await prisma.researcher.update({
          where: { id: researcherId },
          data: { status: 'ONLINE' },
        });
        activeCallResearchers.delete(roomId);
        console.log(`📞 Researcher ${researcherId} status set back to ONLINE`);
      }

      socket.to(`call:${roomId}`).emit('call:ended');

      // 离开通话房间
      socket.leave(`call:${roomId}`);
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  console.log('🔌 Socket.IO setup complete');
}

// 存储通话offer (roomId -> offer info)
const callOffers = new Map<string, {
  offer: RTCSessionDescriptionInit;
  userId: string;
  researcherId: string;
  timestamp: number;
}>();

// 存储正在通话的研究员 (roomId -> researcherId)
const activeCallResearchers = new Map<string, string>();

// WebRTC类型声明
interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string;
}

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

// 工具函数：向指定用户发送通知
export function notifyUser(io: Server, userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data);
}

// 工具函数：向指定研究员发送通知
export function notifyResearcher(io: Server, chatId: string, event: string, data: any) {
  io.to(`researcher:${chatId}`).emit(event, data);
}

// 工具函数：向咨询房间广播
export function broadcastToConsultation(io: Server, consultationId: string, event: string, data: any) {
  io.to(`consultation:${consultationId}`).emit(event, data);
}
