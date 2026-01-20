import { create } from 'zustand';
import { voiceCallService } from '../services/voiceCall';
import type { CallStatus } from '../services/voiceCall';
import { getSocket } from '../services/socket';

interface CallStore {
  // 状态
  status: CallStatus;
  roomId: string | null;
  isMuted: boolean;
  duration: number;
  error: string | null;
  researcherId: string | null;
  researcherName: string | null;

  // 远程音频元素
  remoteAudioRef: HTMLAudioElement | null;

  // Actions
  setRemoteAudioRef: (ref: HTMLAudioElement | null) => void;
  initiateCall: (userId: string, researcherId: string, researcherName: string, consultationId: string) => Promise<void>;
  acceptCall: (roomId: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  reset: () => void;
}

const initialState = {
  status: 'idle' as CallStatus,
  roomId: null,
  isMuted: false,
  duration: 0,
  error: null,
  researcherId: null,
  researcherName: null,
  remoteAudioRef: null,
};

export const useCallStore = create<CallStore>((set, get) => ({
  ...initialState,

  setRemoteAudioRef: (ref) => set({ remoteAudioRef: ref }),

  // 用户发起通话
  initiateCall: async (userId, researcherId, researcherName, consultationId) => {
    set({
      status: 'requesting',
      researcherId,
      researcherName,
      error: null
    });

    try {
      // 获取麦克风权限
      await voiceCallService.getLocalStream();

      // 生成房间ID
      const roomId = `call-${consultationId}-${Date.now()}`;
      set({ roomId, status: 'waiting' });

      // 设置回调
      voiceCallService.setCallbacks({
        onStatusChange: (status) => set({ status }),
        onDurationChange: (duration) => set({ duration }),
        onRemoteStream: (stream) => {
          const { remoteAudioRef } = get();
          if (remoteAudioRef) {
            remoteAudioRef.srcObject = stream;
            remoteAudioRef.play().catch(console.error);
          }
        },
        onError: (error) => set({ error, status: 'failed' }),
      });

      // 创建PeerConnection
      voiceCallService.createPeerConnection();

      // 监听ICE候选
      voiceCallService.onIceCandidate((candidate) => {
        const socket = getSocket();
        socket.emit('call:ice-candidate', { roomId, candidate });
      });

      // 创建Offer
      const offer = await voiceCallService.createOffer();

      // 发送通话请求到服务器（会通知TG Bot）
      const socket = getSocket();
      socket.emit('call:request', {
        roomId,
        userId,
        researcherId,
        consultationId,
        offer,
      });

      // 监听研究员接听
      socket.on('call:answered', async (data: { answer: RTCSessionDescriptionInit }) => {
        set({ status: 'connecting' });
        await voiceCallService.setRemoteAnswer(data.answer);
      });

      // 监听ICE候选
      socket.on('call:ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
        await voiceCallService.addIceCandidate(data.candidate);
      });

      // 监听通话被拒绝
      socket.on('call:rejected', () => {
        set({ status: 'failed', error: '研究员拒绝了通话请求' });
        voiceCallService.endCall();
      });

      // 监听通话超时
      socket.on('call:timeout', () => {
        set({ status: 'failed', error: '通话请求超时，研究员未响应' });
        voiceCallService.endCall();
      });

      // 监听对方挂断
      socket.on('call:ended', () => {
        get().endCall();
      });

    } catch (error: any) {
      set({ status: 'failed', error: error.message });
    }
  },

  // 研究员接听通话（在研究员页面使用）
  acceptCall: async (roomId) => {
    set({ status: 'connecting', roomId });

    try {
      await voiceCallService.getLocalStream();

      voiceCallService.setCallbacks({
        onStatusChange: (status) => set({ status }),
        onDurationChange: (duration) => set({ duration }),
        onRemoteStream: (stream) => {
          const { remoteAudioRef } = get();
          if (remoteAudioRef) {
            remoteAudioRef.srcObject = stream;
            remoteAudioRef.play().catch(console.error);
          }
        },
        onError: (error) => set({ error, status: 'failed' }),
      });

      voiceCallService.createPeerConnection();

      voiceCallService.onIceCandidate((candidate) => {
        const socket = getSocket();
        socket.emit('call:ice-candidate', { roomId, candidate });
      });

      // 监听ICE候选
      const socket = getSocket();
      socket.on('call:ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
        await voiceCallService.addIceCandidate(data.candidate);
      });

      socket.on('call:ended', () => {
        get().endCall();
      });

    } catch (error: any) {
      set({ status: 'failed', error: error.message });
    }
  },

  // 结束通话
  endCall: async () => {
    const { roomId, status } = get();

    if (status === 'idle' || status === 'ended') return;

    const { recording, duration } = await voiceCallService.endCall();

    // 通知对方
    const socket = getSocket();
    if (roomId) {
      socket.emit('call:end', { roomId });

      // 上传录音（风控）
      if (recording && duration > 0) {
        await voiceCallService.uploadRecording(recording, roomId, duration);
      }
    }

    // 清理socket监听
    socket.off('call:answered');
    socket.off('call:ice-candidate');
    socket.off('call:rejected');
    socket.off('call:timeout');
    socket.off('call:ended');

    set({ status: 'ended' });
  },

  // 切换静音
  toggleMute: () => {
    const isMuted = voiceCallService.toggleMute();
    set({ isMuted });
  },

  // 重置状态
  reset: () => {
    set(initialState);
  },
}));
