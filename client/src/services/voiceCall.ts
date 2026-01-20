// WebRTC Voice Call Service with Recording
// 语音通话服务，带录音功能用于风控

// STUN/TURN服务器配置 (Metered.ca)
const ICE_SERVERS: RTCIceServer[] = [
  {
    urls: 'stun:stun.relay.metered.ca:80',
  },
  {
    urls: 'turn:global.relay.metered.ca:80',
    username: '273a4bfd469f8eb24cf0656e',
    credential: '1arp7CYEuR2CMT3l',
  },
  {
    urls: 'turn:global.relay.metered.ca:80?transport=tcp',
    username: '273a4bfd469f8eb24cf0656e',
    credential: '1arp7CYEuR2CMT3l',
  },
  {
    urls: 'turn:global.relay.metered.ca:443',
    username: '273a4bfd469f8eb24cf0656e',
    credential: '1arp7CYEuR2CMT3l',
  },
  {
    urls: 'turns:global.relay.metered.ca:443?transport=tcp',
    username: '273a4bfd469f8eb24cf0656e',
    credential: '1arp7CYEuR2CMT3l',
  },
];

export type CallStatus = 'idle' | 'requesting' | 'waiting' | 'connecting' | 'connected' | 'ended' | 'failed';

export interface CallState {
  status: CallStatus;
  roomId: string | null;
  isMuted: boolean;
  duration: number;
  error: string | null;
}

class VoiceCallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private durationTimer: ReturnType<typeof setInterval> | null = null;
  private duration: number = 0;

  // 状态变化回调
  private onStatusChange: ((status: CallStatus) => void) | null = null;
  private onDurationChange: ((duration: number) => void) | null = null;
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  // 设置回调
  setCallbacks(callbacks: {
    onStatusChange?: (status: CallStatus) => void;
    onDurationChange?: (duration: number) => void;
    onRemoteStream?: (stream: MediaStream) => void;
    onError?: (error: string) => void;
  }) {
    this.onStatusChange = callbacks.onStatusChange || null;
    this.onDurationChange = callbacks.onDurationChange || null;
    this.onRemoteStream = callbacks.onRemoteStream || null;
    this.onError = callbacks.onError || null;
  }

  // 获取本地音频流
  async getLocalStream(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false, // 只要音频
      });
      this.localStream = stream;
      return stream;
    } catch (error: any) {
      const errorMsg = error.name === 'NotAllowedError'
        ? '请允许麦克风访问权限'
        : '无法获取麦克风，请检查设备';
      this.onError?.(errorMsg);
      throw new Error(errorMsg);
    }
  }

  // 创建PeerConnection
  createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    // 添加本地音频轨道
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // 处理远程流
    pc.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.onRemoteStream?.(event.streams[0]);

      // 开始录音（录制远程和本地混合音频）
      this.startRecording();
    };

    // ICE连接状态
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);

      if (pc.iceConnectionState === 'connected') {
        this.onStatusChange?.('connected');
        this.startDurationTimer();
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        this.onStatusChange?.('failed');
        this.endCall();
      }
    };

    this.peerConnection = pc;
    return pc;
  }

  // 创建Offer (呼叫方)
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('PeerConnection not created');

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  // 创建Answer (接听方)
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('PeerConnection not created');

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  // 设置远程Answer
  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error('PeerConnection not created');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  // 添加ICE候选
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  // 获取本地ICE候选
  onIceCandidate(callback: (candidate: RTCIceCandidate) => void): void {
    if (!this.peerConnection) return;
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        callback(event.candidate);
      }
    };
  }

  // 开始录音（风控用）
  private startRecording(): void {
    try {
      // 创建混合音频流（本地+远程）
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // 添加本地音频
      if (this.localStream) {
        const localSource = audioContext.createMediaStreamSource(this.localStream);
        localSource.connect(destination);
      }

      // 添加远程音频
      if (this.remoteStream) {
        const remoteSource = audioContext.createMediaStreamSource(this.remoteStream);
        remoteSource.connect(destination);
      }

      // 开始录音
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // 每秒收集一次数据
      console.log('Recording started for risk control');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }

  // 停止录音并获取录音文件
  private stopRecording(): Blob | null {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.recordedChunks.length > 0) {
      const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
      console.log('Recording saved, size:', blob.size);
      return blob;
    }

    return null;
  }

  // 开始计时
  private startDurationTimer(): void {
    this.duration = 0;
    this.durationTimer = setInterval(() => {
      this.duration++;
      this.onDurationChange?.(this.duration);
    }, 1000);
  }

  // 停止计时
  private stopDurationTimer(): void {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  }

  // 静音/取消静音
  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // 返回是否静音
      }
    }
    return false;
  }

  // 结束通话
  async endCall(): Promise<{ recording: Blob | null; duration: number }> {
    this.stopDurationTimer();
    const recording = this.stopRecording();
    const finalDuration = this.duration;

    // 关闭本地流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // 关闭PeerConnection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.onStatusChange?.('ended');

    return { recording, duration: finalDuration };
  }

  // 上传录音到服务器
  async uploadRecording(
    recording: Blob,
    roomId: string,
    duration: number
  ): Promise<void> {
    const formData = new FormData();
    formData.append('recording', recording, `call-${roomId}-${Date.now()}.webm`);
    formData.append('roomId', roomId);
    formData.append('duration', duration.toString());
    formData.append('timestamp', new Date().toISOString());

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/call/recording`, {
        method: 'POST',
        body: formData,
      });
      console.log('Recording uploaded for risk control');
    } catch (error) {
      console.error('Failed to upload recording:', error);
      // 可以保存到本地作为备份
    }
  }

  // 格式化通话时长
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

// 单例导出
export const voiceCallService = new VoiceCallService();

// 导出类供静态方法使用
export { VoiceCallService };
