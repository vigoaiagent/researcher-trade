import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Phone, PhoneOff, Mic, MicOff, AlertCircle } from 'lucide-react';
import { voiceCallService, VoiceCallService } from '../services/voiceCall';
import type { CallStatus } from '../services/voiceCall';
import { connectSocket, getSocket } from '../services/socket';

// 研究员通话页面
// URL: /call/:roomId?researcherId=xxx&userId=xxx&question=xxx
export function ResearcherCallPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const researcherId = searchParams.get('researcherId') || '';
  const userId = searchParams.get('userId') || '';
  const question = searchParams.get('question') || '';
  const userName = searchParams.get('userName') || '用户';

  const [status, setStatus] = useState<CallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  // 连接Socket并监听通话请求
  useEffect(() => {
    if (!roomId || !researcherId) return;

    connectSocket();
    const socket = getSocket();

    // 加入通话房间
    socket.emit('call:join-room', { roomId, researcherId });

    // 监听用户的Offer
    socket.on('call:offer', (data: { offer: RTCSessionDescriptionInit; userId: string }) => {
      console.log('Received offer from user:', data.userId);
      setOffer(data.offer);
      setStatus('idle'); // 等待研究员点击接听
    });

    // 监听用户挂断
    socket.on('call:ended', () => {
      handleCallEnded('用户已挂断');
    });

    // 监听ICE候选
    socket.on('call:ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      await voiceCallService.addIceCandidate(data.candidate);
    });

    return () => {
      socket.off('call:offer');
      socket.off('call:ended');
      socket.off('call:ice-candidate');
    };
  }, [roomId, researcherId]);

  // 接听通话
  const handleAccept = async () => {
    if (!offer || !roomId) return;

    setStatus('connecting');
    setError(null);

    try {
      // 获取麦克风权限
      await voiceCallService.getLocalStream();

      // 设置回调
      voiceCallService.setCallbacks({
        onStatusChange: setStatus,
        onDurationChange: setDuration,
        onRemoteStream: (stream) => {
          if (audioRef.current) {
            audioRef.current.srcObject = stream;
            audioRef.current.play().catch(console.error);
          }
        },
        onError: (err) => {
          setError(err);
          setStatus('failed');
        },
      });

      // 创建PeerConnection
      voiceCallService.createPeerConnection();

      // 监听ICE候选
      voiceCallService.onIceCandidate((candidate) => {
        const socket = getSocket();
        socket.emit('call:ice-candidate', { roomId, candidate });
      });

      // 创建Answer
      const answer = await voiceCallService.createAnswer(offer);

      // 发送Answer给用户
      const socket = getSocket();
      socket.emit('call:answer', { roomId, answer });

    } catch (err: any) {
      setError(err.message);
      setStatus('failed');
    }
  };

  // 拒绝通话
  const handleReject = () => {
    const socket = getSocket();
    socket.emit('call:reject', { roomId });
    setStatus('ended');
  };

  // 挂断通话
  const handleHangup = async () => {
    const { recording, duration: finalDuration } = await voiceCallService.endCall();

    const socket = getSocket();
    socket.emit('call:end', { roomId });

    // 上传录音
    if (recording && roomId && finalDuration > 0) {
      await voiceCallService.uploadRecording(recording, roomId, finalDuration);
    }

    setStatus('ended');
  };

  // 通话结束处理
  const handleCallEnded = (message: string) => {
    voiceCallService.endCall();
    setStatus('ended');
    setError(message);
  };

  // 切换静音
  const handleToggleMute = () => {
    const muted = voiceCallService.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#181a20] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#2b3139] p-4 text-center">
          <img
            src="https://cdn.jsdelivr.net/gh/sevclub/publicimage@main/SoDEX(1).svg"
            alt="SoDEX"
            className="h-6 mx-auto mb-2"
          />
          <h1 className="text-white text-lg font-bold">语音通话</h1>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-[#0ecb81] bg-opacity-20 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl text-[#0ecb81]">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-white text-lg font-medium">{userName}</h2>
            <p className="text-[#848e9c] text-sm">用户ID: {userId.slice(0, 8)}...</p>
          </div>

          {/* Question Preview */}
          {question && (
            <div className="bg-[#2b3139] rounded-lg p-3 mb-6">
              <div className="text-[#848e9c] text-xs mb-1">咨询问题</div>
              <p className="text-white text-sm">{decodeURIComponent(question)}</p>
            </div>
          )}

          {/* Status Display */}
          {status === 'idle' && offer && (
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 text-[#0ecb81] mb-4">
                <Phone size={24} className="animate-pulse" />
                <span>用户正在呼叫...</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  className="flex-1 py-3 bg-[#f6465d] text-white rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <PhoneOff size={20} />
                  拒绝
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 py-3 bg-[#0ecb81] text-white rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Phone size={20} />
                  接听
                </button>
              </div>
            </div>
          )}

          {status === 'idle' && !offer && (
            <div className="text-center text-[#848e9c] py-8">
              <Phone size={32} className="mx-auto mb-3 opacity-50" />
              <p>等待用户发起通话...</p>
            </div>
          )}

          {status === 'connecting' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-[#0ecb81] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white">正在建立连接...</p>
            </div>
          )}

          {status === 'connected' && (
            <div className="text-center">
              {/* Duration */}
              <div className="text-4xl font-mono text-[#0ecb81] mb-6">
                {VoiceCallService.formatDuration(duration)}
              </div>

              {/* Recording Indicator */}
              <div className="flex items-center justify-center gap-2 text-[#f6465d] text-sm mb-6">
                <span className="w-2 h-2 bg-[#f6465d] rounded-full animate-pulse"></span>
                录音中
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={handleToggleMute}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    isMuted
                      ? 'bg-[#f6465d] text-white'
                      : 'bg-[#2b3139] text-white hover:bg-[#474d57]'
                  }`}
                >
                  {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                  onClick={handleHangup}
                  className="w-14 h-14 rounded-full bg-[#f6465d] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <PhoneOff size={24} />
                </button>
              </div>
            </div>
          )}

          {status === 'ended' && (
            <div className="text-center py-8">
              <PhoneOff size={32} className="mx-auto mb-3 text-[#848e9c]" />
              <p className="text-white mb-2">通话已结束</p>
              {duration > 0 && (
                <p className="text-[#848e9c] text-sm">
                  通话时长: {VoiceCallService.formatDuration(duration)}
                </p>
              )}
              {error && (
                <p className="text-[#848e9c] text-sm mt-2">{error}</p>
              )}
              <p className="text-[#848e9c] text-xs mt-4">可以关闭此页面</p>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center py-8">
              <AlertCircle size={32} className="mx-auto mb-3 text-[#f6465d]" />
              <p className="text-[#f6465d] mb-2">连接失败</p>
              {error && (
                <p className="text-[#848e9c] text-sm">{error}</p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-[#2b3139] text-white rounded-lg hover:bg-[#474d57] transition-colors"
              >
                重试
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#2b3139] px-4 py-3 text-center">
          <p className="text-[#848e9c] text-xs">
            通话将被录音用于服务质量监控
          </p>
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} autoPlay />
      </div>
    </div>
  );
}
