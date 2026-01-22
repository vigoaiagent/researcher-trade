import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Phone, PhoneOff, Mic, MicOff, AlertCircle } from 'lucide-react';
import { voiceCallService, VoiceCallService } from '../services/voiceCall';
import type { CallStatus } from '../services/voiceCall';
import { connectSocket, getSocket } from '../services/socket';
import { useTranslation } from '../i18n';

// 研究员通话页面
// URL: /call/:roomId?researcherId=xxx&userId=xxx&question=xxx
export function ResearcherCallPage() {
  const { t } = useTranslation();
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const researcherId = searchParams.get('researcherId') || '';
  const userId = searchParams.get('userId') || '';
  const question = searchParams.get('question') || '';
  const userName = searchParams.get('userName') || t('researcherCall.defaultUserName');

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
    console.log('📞 Researcher joining room:', roomId, 'socket connected:', socket.connected);
    socket.emit('call:join-room', { roomId, researcherId });

    // 确认 socket 连接状态
    socket.on('connect', () => {
      console.log('📞 Socket connected, rejoining room');
      socket.emit('call:join-room', { roomId, researcherId });
    });

    // 页面关闭时发送结束通话
    const handleBeforeUnload = () => {
      if (status === 'connected' || status === 'connecting') {
        socket.emit('call:end', { roomId });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 监听用户的Offer
    socket.on('call:offer', (data: { offer: RTCSessionDescriptionInit; userId: string }) => {
      console.log('📞 Received offer from user:', data.userId, 'offer type:', data.offer?.type);
      if (data.offer) {
        setOffer(data.offer);
        setStatus('idle'); // 等待研究员点击接听
        console.log('📞 Offer set, ready to accept');
      } else {
        console.error('📞 Received empty offer!');
      }
    });

    // 监听用户挂断
    socket.on('call:ended', () => {
      handleCallEnded(t('researcherCall.userHangup'));
    });

    // 监听ICE候选
    socket.on('call:ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      console.log('📞 Researcher received ICE candidate from user');
      await voiceCallService.addIceCandidate(data.candidate);
    });

    return () => {
      socket.off('call:offer');
      socket.off('call:ended');
      socket.off('call:ice-candidate');
      socket.off('connect');
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, researcherId, status]);

  // 接听通话
  const handleAccept = async () => {
    console.log('📞 handleAccept called, offer:', !!offer, 'roomId:', roomId);
    if (!offer || !roomId) {
      console.log('📞 Missing offer or roomId, cannot accept');
      return;
    }

    console.log('📞 Researcher accepting call in room:', roomId);
    setStatus('connecting');
    setError(null);

    try {
      // 获取麦克风权限
      console.log('📞 Researcher getting local stream...');
      await voiceCallService.getLocalStream();
      console.log('📞 Researcher local stream acquired');

      // 设置回调
      voiceCallService.setCallbacks({
        onStatusChange: (s) => {
          console.log('📞 Researcher status change:', s);
          setStatus(s);
        },
        onDurationChange: setDuration,
        onRemoteStream: (stream) => {
          console.log('📞 Researcher received remote stream');
          if (audioRef.current) {
            audioRef.current.srcObject = stream;
            audioRef.current.play().catch(console.error);
          }
        },
        onError: (err) => {
          console.log('📞 Researcher error:', err);
          setError(err);
          setStatus('failed');
        },
      });

      // 创建PeerConnection
      voiceCallService.createPeerConnection();

      // 监听ICE候选
      voiceCallService.onIceCandidate((candidate) => {
        console.log('📞 Researcher sending ICE candidate');
        const socket = getSocket();
        socket.emit('call:ice-candidate', { roomId, candidate });
      });

      // 创建Answer
      const answer = await voiceCallService.createAnswer(offer);

      // 发送Answer给用户
      console.log('📞 Researcher sending answer');
      const socket = getSocket();
      socket.emit('call:answer', { roomId, answer, researcherId });

    } catch (err: any) {
      console.error('📞 Researcher accept error:', err);
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
          <h1 className="text-white text-lg font-bold">{t('researcherCall.title')}</h1>
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
            <p className="text-[#848e9c] text-sm">{t('researcherCall.userId').replace('{id}', userId.slice(0, 8))}</p>
          </div>

          {/* Question Preview */}
          {question && (
            <div className="bg-[#2b3139] rounded-lg p-3 mb-6">
              <div className="text-[#848e9c] text-xs mb-1">{t('researcherCall.questionLabel')}</div>
              <p className="text-white text-sm">{decodeURIComponent(question)}</p>
            </div>
          )}

          {/* Status Display */}
          {status === 'idle' && offer && (
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 text-[#0ecb81] mb-4">
                <Phone size={24} className="animate-pulse" />
                <span>{t('researcherCall.userCalling')}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  className="flex-1 py-3 bg-[#f6465d] text-white rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <PhoneOff size={20} />
                  {t('researcherCall.reject')}
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 py-3 bg-[#0ecb81] text-white rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Phone size={20} />
                  {t('researcherCall.accept')}
                </button>
              </div>
            </div>
          )}

          {status === 'idle' && !offer && (
            <div className="text-center text-[#848e9c] py-8">
              <Phone size={32} className="mx-auto mb-3 opacity-50" />
              <p>{t('researcherCall.waitingForUser')}</p>
              <p className="text-xs mt-2">{t('researcherCall.roomLabel').replace('{id}', (roomId?.slice(0, 20) || ''))}</p>
            </div>
          )}

          {status === 'connecting' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-[#0ecb81] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white">{t('researcherCall.connecting')}</p>
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
                {t('researcherCall.recording')}
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
              <p className="text-white mb-2">{t('researcherCall.ended')}</p>
              {duration > 0 && (
                <p className="text-[#848e9c] text-sm">
                  {t('researcherCall.duration').replace('{duration}', VoiceCallService.formatDuration(duration))}
                </p>
              )}
              {error && (
                <p className="text-[#848e9c] text-sm mt-2">{error}</p>
              )}
              <p className="text-[#848e9c] text-xs mt-4">{t('researcherCall.closePageHint')}</p>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center py-8">
              <AlertCircle size={32} className="mx-auto mb-3 text-[#f6465d]" />
              <p className="text-[#f6465d] mb-2">{t('researcherCall.connectionFailed')}</p>
              {error && (
                <p className="text-[#848e9c] text-sm">{error}</p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-[#2b3139] text-white rounded-lg hover:bg-[#474d57] transition-colors"
              >
                {t('researcherCall.retry')}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#2b3139] px-4 py-3 text-center">
          <p className="text-[#848e9c] text-xs">
            {t('researcherCall.recordingNotice')}
          </p>
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} autoPlay />
      </div>
    </div>
  );
}
