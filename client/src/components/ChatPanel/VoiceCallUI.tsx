import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from 'lucide-react';
import { useCallStore } from '../../stores/callStore';
import { VoiceCallService } from '../../services/voiceCall';

// 格式化时长的辅助函数
const formatDuration = VoiceCallService.formatDuration;

interface VoiceCallUIProps {
  userId: string;
  researcherId: string;
  researcherName: string;
  consultationId: string;
}

export function VoiceCallUI({ userId, researcherId, researcherName, consultationId }: VoiceCallUIProps) {
  const {
    status,
    isMuted,
    duration,
    error,
    initiateCall,
    endCall,
    toggleMute,
    setRemoteAudioRef,
    reset,
  } = useCallStore();

  const audioRef = useRef<HTMLAudioElement>(null);

  // 设置音频元素引用
  useEffect(() => {
    if (audioRef.current) {
      setRemoteAudioRef(audioRef.current);
    }
    return () => {
      setRemoteAudioRef(null);
      reset();
    };
  }, []);

  const handleStartCall = () => {
    initiateCall(userId, researcherId, researcherName, consultationId);
  };

  const handleEndCall = () => {
    endCall();
  };

  // 空闲状态 - 显示发起通话按钮
  if (status === 'idle' || status === 'ended') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleStartCall}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--brand-green)] text-white text-[11px] rounded-lg hover:opacity-90 transition-opacity"
        >
          <Phone size={14} />
          语音通话
        </button>
        <audio ref={audioRef} autoPlay />
      </div>
    );
  }

  // 请求中/等待接听
  if (status === 'requesting' || status === 'waiting') {
    return (
      <div className="bg-[var(--bg-surface)] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[var(--brand-green)] bg-opacity-20 flex items-center justify-center">
              <Phone size={20} className="text-[var(--brand-green)] animate-pulse" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-[var(--text-main)]">
                {status === 'requesting' ? '正在请求通话...' : '等待研究员接听...'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">{researcherName}</div>
            </div>
          </div>
          <Loader2 size={20} className="text-[var(--brand-green)] animate-spin" />
        </div>

        <button
          onClick={handleEndCall}
          className="w-full py-2 bg-[var(--brand-red)] text-white text-[11px] rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <PhoneOff size={14} />
          取消
        </button>

        <div className="text-[9px] text-[var(--text-muted)] text-center mt-2">
          通话将被录音用于服务质量监控
        </div>

        <audio ref={audioRef} autoPlay />
      </div>
    );
  }

  // 连接中
  if (status === 'connecting') {
    return (
      <div className="bg-[var(--bg-surface)] rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Loader2 size={20} className="text-[var(--brand-green)] animate-spin" />
          <span className="text-[12px] text-[var(--text-main)]">正在建立连接...</span>
        </div>
        <audio ref={audioRef} autoPlay />
      </div>
    );
  }

  // 通话中
  if (status === 'connected') {
    return (
      <div className="bg-[var(--bg-surface)] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[var(--brand-green)] flex items-center justify-center">
              <Phone size={20} className="text-white" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-[var(--text-main)]">通话中</div>
              <div className="text-[10px] text-[var(--text-muted)]">{researcherName}</div>
            </div>
          </div>
          <div className="text-[16px] font-mono text-[var(--brand-green)]">
            {formatDuration(duration)}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          {/* 静音按钮 */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted
                ? 'bg-[var(--brand-red)] text-white'
                : 'bg-[var(--bg-app)] text-[var(--text-main)] hover:bg-[var(--bg-highlight)]'
            }`}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* 挂断按钮 */}
          <button
            onClick={handleEndCall}
            className="w-12 h-12 rounded-full bg-[var(--brand-red)] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <PhoneOff size={20} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 mt-3">
          <span className="w-2 h-2 bg-[var(--brand-red)] rounded-full animate-pulse"></span>
          <span className="text-[9px] text-[var(--text-muted)]">录音中</span>
        </div>

        <audio ref={audioRef} autoPlay />
      </div>
    );
  }

  // 失败状态
  if (status === 'failed') {
    return (
      <div className="bg-[var(--bg-surface)] rounded-lg p-4">
        <div className="text-center mb-3">
          <PhoneOff size={24} className="mx-auto text-[var(--brand-red)] mb-2" />
          <div className="text-[12px] text-[var(--brand-red)]">通话失败</div>
          {error && <div className="text-[10px] text-[var(--text-muted)] mt-1">{error}</div>}
        </div>

        <button
          onClick={reset}
          className="w-full py-2 bg-[var(--bg-app)] text-[var(--text-main)] text-[11px] rounded-lg hover:bg-[var(--bg-highlight)] transition-colors"
        >
          关闭
        </button>

        <audio ref={audioRef} autoPlay />
      </div>
    );
  }

  return <audio ref={audioRef} autoPlay />;
}
