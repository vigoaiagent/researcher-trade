import { io, Socket } from 'socket.io-client';

// 生产环境使用相对路径（同源），开发环境使用localhost:3001
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// 加入用户房间
export function joinUserRoom(userId: string): void {
  getSocket().emit('join_user', userId);
}

// 加入咨询房间
export function joinConsultationRoom(consultationId: string): void {
  getSocket().emit('join_consultation', consultationId);
}

// 离开咨询房间
export function leaveConsultationRoom(consultationId: string): void {
  getSocket().emit('leave_consultation', consultationId);
}

// 发送消息
export function sendMessage(
  consultationId: string,
  userId: string,
  content: string
): void {
  getSocket().emit('send_message', { consultationId, userId, content });
}

// 发送输入中状态
export function sendTyping(consultationId: string, userId: string): void {
  getSocket().emit('typing', { consultationId, userId });
}
