import { useState, useRef, useEffect } from 'react';
import { Send, Phone, PhoneOff, Zap, X, Mic, MicOff, Loader2, ExternalLink, Star, MoreVertical, Flag, Headphones, ShieldAlert } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useUserStore } from '../../stores/userStore';
import { useCallStore } from '../../stores/callStore';
import { MessageBubble } from '../Messages/MessageBubble';
import { VoiceCallService } from '../../services/voiceCall';

export function ChattingPhase() {
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showCallConfirm, setShowCallConfirm] = useState(false);
  // 更逼真的输入状态
  const [typingPhase, setTypingPhase] = useState<'hidden' | 'reading' | 'typing'>('hidden');
  const [lastUserMsgTime, setLastUserMsgTime] = useState<number>(0);
  // 超时提示
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  // 风险提示 banner
  const [showRiskWarning, setShowRiskWarning] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    messages,
    selectedResearcher,
    currentConsultation,
    sendMessage,
    completeConsultation,
    roundsExhausted,
    extendCost,
    extendConsultation,
    setPhase,
  } = useChatStore();
  const { user, spendEnergy } = useUserStore();
  const {
    status: callStatus,
    isMuted,
    duration,
    error: callError,
    initiateCall,
    endCall,
    toggleMute,
    setRemoteAudioRef,
    reset: resetCall,
  } = useCallStore();

  // 设置音频引用
  useEffect(() => {
    if (audioRef.current) {
      setRemoteAudioRef(audioRef.current);
    }
    return () => {
      setRemoteAudioRef(null);
      resetCall();
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 更逼真的输入状态模拟
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];

    // 只有当最后一条消息是用户发送的才显示输入状态
    if (lastMsg.senderType === 'USER') {
      const msgTime = new Date(lastMsg.createdAt || Date.now()).getTime();

      // 如果是新消息（不是之前的）
      if (msgTime > lastUserMsgTime) {
        setLastUserMsgTime(msgTime);
        setTypingPhase('hidden');
        setShowTimeoutWarning(false);
        setWaitingSeconds(0);

        // 随机延迟1-2秒后显示"查看中"
        const readingDelay = 1000 + Math.random() * 1000;
        const readingTimer = setTimeout(() => {
          setTypingPhase('reading');
        }, readingDelay);

        // 再过1.5-3秒后显示"正在输入"
        const typingDelay = readingDelay + 1500 + Math.random() * 1500;
        const typingTimer = setTimeout(() => {
          setTypingPhase('typing');
        }, typingDelay);

        // 等待计时器
        const countInterval = setInterval(() => {
          setWaitingSeconds(prev => prev + 1);
        }, 1000);

        // 60秒后显示超时提示
        const timeoutTimer = setTimeout(() => {
          setShowTimeoutWarning(true);
        }, 60000);

        return () => {
          clearTimeout(readingTimer);
          clearTimeout(typingTimer);
          clearTimeout(timeoutTimer);
          clearInterval(countInterval);
        };
      }
    } else {
      // 研究员回复后隐藏
      setTypingPhase('hidden');
      setShowTimeoutWarning(false);
      setWaitingSeconds(0);
    }
  }, [messages, lastUserMsgTime]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const content = input;
    setInput('');

    await sendMessage(user.id, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const roundsLeft = currentConsultation
    ? currentConsultation.maxRounds - currentConsultation.roundsUsed
    : 0;

  const isInCall = callStatus !== 'idle' && callStatus !== 'ended';

  const handlePhoneClick = () => {
    if (isInCall) {
      // 已在通话中，点击挂断
      endCall();
    } else {
      // 显示确认弹窗
      setShowCallConfirm(true);
    }
  };

  const handleConfirmCall = () => {
    if (!user || !selectedResearcher || !currentConsultation) return;
    setShowCallConfirm(false);
    initiateCall(user.id, selectedResearcher.researcherId, selectedResearcher.researcher.name, currentConsultation.id);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)]">
      {/* 隐藏的音频元素 */}
      <audio ref={audioRef} autoPlay className="hidden" />

      {/* Researcher Info Bar - Redesigned */}
      {selectedResearcher && (
        <div className="bg-[var(--bg-surface)] border-b border-[var(--border-light)]">
          {/* Main Info Row */}
          <div className="flex items-center gap-3 p-3">
            {/* Avatar - Clickable to profile */}
            <a
              href={`https://sosovalue.com/profile/index/1774072765580394497`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative group"
            >
              {selectedResearcher.researcher.avatar ? (
                <img
                  src={selectedResearcher.researcher.avatar}
                  alt={selectedResearcher.researcher.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[var(--brand-green)] transition"
                />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-[var(--brand-green)] text-black text-lg group-hover:ring-2 group-hover:ring-[var(--brand-yellow)] transition">
                  {selectedResearcher.researcher.name.charAt(0)}
                </div>
              )}
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--brand-green)] rounded-full border-2 border-[var(--bg-surface)]" />
            </a>

            {/* Name & Rating - Clickable */}
            <div className="flex-1 min-w-0">
              <a
                href={`https://sosovalue.com/profile/index/1774072765580394497`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 group"
              >
                <h4 className="font-bold text-[18px] text-[var(--text-main)] group-hover:text-[var(--brand-green)] transition truncate">
                  {selectedResearcher.researcher.name}
                </h4>
                <ExternalLink size={14} className="text-[var(--text-dim)] group-hover:text-[var(--brand-green)] transition shrink-0" />
              </a>
              <div className="flex items-center gap-3 text-[14px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Star size={14} className="text-[var(--brand-yellow)] fill-[var(--brand-yellow)]" />
                  {selectedResearcher.researcher.ratingScore.toFixed(1)}
                </span>
                <span>·</span>
                <span>响应 {selectedResearcher.researcher.responseTimeAvg || '<1'}min</span>
              </div>
            </div>

            {/* Voice Call Button - Moved left, separated from end button */}
            <button
              onClick={handlePhoneClick}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isInCall
                  ? 'bg-[var(--brand-red)] text-white animate-pulse'
                  : 'bg-[var(--brand-green)]/10 text-[var(--brand-green)] hover:bg-[var(--brand-green)]/20'
              }`}
              title={isInCall ? '挂断通话' : '语音通话'}
            >
              {isInCall ? <PhoneOff size={18} /> : <Phone size={18} />}
              <span className="text-[14px] font-medium">{isInCall ? '挂断' : '语音'}</span>
            </button>

            {/* Report Button - 显眼的举报按钮 */}
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10 transition"
              title="投诉举报"
            >
              <Flag size={16} />
              <span className="text-[13px]">举报</span>
            </button>

            {/* More Options Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-[var(--bg-app)] transition"
              >
                <MoreVertical size={18} className="text-[var(--text-muted)]" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-lg shadow-xl z-50 py-1 min-w-[160px]">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        useChatStore.getState().setServiceMode('ai');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
                    >
                      <Headphones size={16} className="text-[var(--brand-yellow)]" />
                      联系AI客服
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowReportModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
                    >
                      <Flag size={16} className="text-[var(--brand-red)]" />
                      投诉举报
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Rounds Progress Bar */}
          <div className="px-3 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] text-[var(--text-muted)]">对话进度</span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[var(--text-main)]">
                  {currentConsultation?.roundsUsed || 0} / {currentConsultation?.maxRounds || 10} 轮
                </span>
                <button
                  onClick={completeConsultation}
                  className="text-[13px] text-[var(--text-dim)] hover:text-[var(--brand-red)] transition"
                >
                  结束对话
                </button>
              </div>
            </div>
            <div className="h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--brand-green)] rounded-full transition-all duration-300"
                style={{ width: `${((currentConsultation?.roundsUsed || 0) / (currentConsultation?.maxRounds || 10)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 语音通话确认弹窗 */}
      {showCallConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-panel)] rounded-xl p-6 mx-4 max-w-[360px] w-full shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-[var(--brand-green)] bg-opacity-20 flex items-center justify-center mx-auto mb-4">
                <Phone size={32} className="text-[var(--brand-green)]" />
              </div>
              <h3 className="text-[20px] font-bold text-[var(--text-main)] mb-2">
                发起语音通话
              </h3>
              <p className="text-[16px] text-[var(--text-muted)]">
                与 {selectedResearcher?.researcher.name} 进行语音通话
              </p>
              {/* 语音咨询统计 */}
              <p className="text-[14px] text-[var(--brand-green)] mt-2">
                已有 {Math.floor(Math.random() * 50 + 10)} 人进行过语音咨询
              </p>
            </div>
            <div className="bg-[var(--bg-surface)] rounded-lg p-4 mb-5">
              <div className="flex justify-between text-[16px] mb-2">
                <span className="text-[var(--text-muted)]">通话费用</span>
                <span className="text-[var(--brand-yellow)] font-medium">5 能量/分钟</span>
              </div>
              <div className="flex justify-between text-[16px]">
                <span className="text-[var(--text-muted)]">当前余额</span>
                <span className="text-[var(--text-main)]">{user?.energyAvailable || 0} 能量</span>
              </div>
            </div>
            <p className="text-[13px] text-[var(--text-dim)] text-center mb-5">
              通话将被录音用于服务质量监控
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCallConfirm(false)}
                className="flex-1 py-3 rounded-lg text-[16px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
              >
                取消
              </button>
              <button
                onClick={handleConfirmCall}
                disabled={(user?.energyAvailable || 0) < 5}
                className="flex-1 py-3 rounded-lg text-[16px] font-medium bg-[var(--brand-green)] text-black hover:opacity-90 transition disabled:opacity-50"
              >
                确认通话
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 投诉举报弹窗 */}
      {showReportModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-panel)] rounded-xl p-6 mx-4 max-w-[400px] w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[20px] font-bold text-[var(--text-main)]">
                投诉举报
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded hover:bg-[var(--bg-surface)] transition"
              >
                <X size={20} className="text-[var(--text-muted)]" />
              </button>
            </div>
            <p className="text-[14px] text-[var(--text-muted)] mb-4">
              举报研究员 <span className="text-[var(--text-main)] font-medium">{selectedResearcher?.researcher.name}</span> 的不当行为
            </p>
            <div className="space-y-2 mb-5">
              {['服务态度差', '回复不专业', '诱导投资', '恶意欺诈', '其他原因'].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                    reportReason === reason
                      ? 'bg-[var(--brand-red)]/10 border border-[var(--brand-red)]'
                      : 'bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border-light)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="hidden"
                  />
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    reportReason === reason ? 'border-[var(--brand-red)]' : 'border-[var(--text-dim)]'
                  }`}>
                    {reportReason === reason && (
                      <span className="w-2 h-2 rounded-full bg-[var(--brand-red)]" />
                    )}
                  </span>
                  <span className="text-[15px] text-[var(--text-main)]">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-3 rounded-lg text-[16px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!reportReason) {
                    alert('请选择举报原因');
                    return;
                  }
                  alert('举报已提交，我们会尽快处理');
                  setShowReportModal(false);
                  setReportReason('');
                }}
                disabled={!reportReason}
                className="flex-1 py-3 rounded-lg text-[16px] font-medium bg-[var(--brand-red)] text-white hover:opacity-90 transition disabled:opacity-50"
              >
                提交举报
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 通话状态条 */}
      {isInCall && (
        <div className="bg-[var(--brand-green)] bg-opacity-10 border-b border-[var(--brand-green)] px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {callStatus === 'requesting' || callStatus === 'waiting' ? (
                <>
                  <Loader2 size={14} className="text-[var(--brand-green)] animate-spin" />
                  <span className="text-[11px] text-[var(--brand-green)]">
                    {callStatus === 'requesting' ? '请求中...' : '等待接听...'}
                  </span>
                </>
              ) : callStatus === 'connecting' ? (
                <>
                  <Loader2 size={14} className="text-[var(--brand-green)] animate-spin" />
                  <span className="text-[11px] text-[var(--brand-green)]">连接中...</span>
                </>
              ) : callStatus === 'connected' ? (
                <>
                  <span className="w-2 h-2 bg-[var(--brand-red)] rounded-full animate-pulse" />
                  <span className="text-[11px] text-[var(--brand-green)]">通话中</span>
                  <span className="text-[11px] text-[var(--brand-green)] font-mono">
                    {VoiceCallService.formatDuration(duration)}
                  </span>
                </>
              ) : callStatus === 'failed' ? (
                <span className="text-[11px] text-[var(--brand-red)]">
                  通话失败: {callError || '未知错误'}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {callStatus === 'connected' && (
                <button
                  onClick={toggleMute}
                  className={`p-1.5 rounded transition ${
                    isMuted ? 'bg-[var(--brand-red)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                  }`}
                >
                  {isMuted ? <MicOff size={12} /> : <Mic size={12} />}
                </button>
              )}
              <button
                onClick={endCall}
                className="p-1.5 rounded bg-[var(--brand-red)] text-white hover:opacity-90 transition"
              >
                <PhoneOff size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-app)]">
        {/* Crypto 风险提示 Banner */}
        {showRiskWarning && (
          <div className="bg-[var(--brand-red)]/10 border border-[var(--brand-red)]/30 rounded-xl p-4 animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--brand-red)]/20 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} className="text-[var(--brand-red)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[15px] font-bold text-[var(--brand-red)]">
                    安全提示
                  </h4>
                  <button
                    onClick={() => setShowRiskWarning(false)}
                    className="p-1 rounded hover:bg-[var(--bg-surface)] transition"
                  >
                    <X size={16} className="text-[var(--text-dim)]" />
                  </button>
                </div>
                <ul className="text-[14px] text-[var(--text-main)] space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--brand-red)]">•</span>
                    <span>请勿私下添加好友或转移到其他平台交流</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--brand-red)]">•</span>
                    <span>不要下载任何不明链接或安装未知软件</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--brand-red)]">•</span>
                    <span>研究员不会索要您的私钥、助记词或密码</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--brand-red)]">•</span>
                    <span>投资有风险，研究员观点仅供参考，不构成投资建议</span>
                  </li>
                </ul>
                <p className="text-[13px] text-[var(--text-muted)] mt-2">
                  如遇可疑行为，请点击「举报」按钮
                </p>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <MessageBubble
            key={`${msg.id}-${index}`}
            message={msg}
            isUser={msg.senderType === 'USER'}
            researcherName={selectedResearcher?.researcher.name}
            researcherAvatar={selectedResearcher?.researcher.avatar}
          />
        ))}

        {/* Typing Indicator - 更逼真的多阶段动画 */}
        {typingPhase !== 'hidden' && (
          <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Researcher Avatar */}
            {selectedResearcher?.researcher.avatar ? (
              <img
                src={selectedResearcher.researcher.avatar}
                alt={selectedResearcher.researcher.name}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold bg-[var(--brand-green)] text-black shrink-0">
                {selectedResearcher?.researcher.name?.charAt(0) || 'R'}
              </div>
            )}
            {/* Typing Animation */}
            <div className="bg-[var(--bg-surface)] rounded-2xl rounded-tl-sm px-4 py-3">
              {typingPhase === 'reading' ? (
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-[var(--text-muted)]">
                    {selectedResearcher?.researcher.name} 正在查看消息
                  </span>
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-[var(--text-dim)] rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[var(--text-dim)] rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                    <span className="w-1.5 h-1.5 bg-[var(--text-dim)] rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-[var(--brand-green)] rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                    <span className="w-2.5 h-2.5 bg-[var(--brand-green)] rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                    <span className="w-2.5 h-2.5 bg-[var(--brand-green)] rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
                  </div>
                  <span className="text-[14px] text-[var(--brand-green)] font-medium ml-1">
                    {selectedResearcher?.researcher.name} 正在输入...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeout Warning - 超时提示 */}
        {showTimeoutWarning && (
          <div className="mx-4 mb-3 p-4 bg-[var(--brand-yellow)]/10 border border-[var(--brand-yellow)]/30 rounded-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--brand-yellow)]/20 flex items-center justify-center shrink-0">
                <Loader2 size={16} className="text-[var(--brand-yellow)] animate-spin" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] text-[var(--text-main)] font-medium mb-1">
                  研究员暂时繁忙
                </p>
                <p className="text-[13px] text-[var(--text-muted)] mb-3">
                  已等待 {Math.floor(waitingSeconds / 60)}分{waitingSeconds % 60}秒，研究员可能正在处理其他咨询
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      useChatStore.getState().setServiceMode('ai');
                    }}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-medium bg-[var(--brand-yellow)] text-black hover:opacity-90 transition"
                  >
                    先问AI客服
                  </button>
                  <button
                    onClick={() => setShowTimeoutWarning(false)}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                  >
                    继续等待
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定要结束本次咨询吗？能量将按使用轮次退还')) {
                        completeConsultation();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10 transition"
                  >
                    结束咨询
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Rounds Warning */}
      {roundsLeft <= 1 && !roundsExhausted && (
        <div className="px-4 py-3 bg-[rgba(240,185,11,0.1)] border-t border-[var(--brand-yellow)]">
          <p className="text-[15px] text-center text-[var(--brand-yellow)] font-medium">
            还剩 {roundsLeft} 轮对话
          </p>
        </div>
      )}

      {/* Rounds Exhausted - Extend Option */}
      {roundsExhausted && (
        <div className="px-5 py-4 bg-[rgba(240,185,11,0.15)] border-t border-[var(--brand-yellow)]">
          <div className="text-center">
            <p className="text-[18px] text-[var(--brand-yellow)] font-bold mb-2">
              对话轮次已用完
            </p>
            <p className="text-[15px] text-[var(--text-muted)] mb-4">
              如需继续追问，可消耗 {extendCost} 能量值增加 10 轮对话
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={async () => {
                  if (!user) return;
                  if (user.energyAvailable < extendCost) {
                    alert('能量值不足，请充值');
                    return;
                  }
                  try {
                    await extendConsultation(user.id);
                    spendEnergy(extendCost, '续费追问');
                  } catch {
                    // Error handled in store
                  }
                }}
                disabled={(user?.energyAvailable || 0) < extendCost}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[16px] font-bold transition hover:opacity-90 disabled:opacity-50 bg-[var(--brand-yellow)] text-black"
              >
                <Zap size={18} />
                续费追问 ({extendCost} 能量)
              </button>
              <button
                onClick={() => setPhase('rating')}
                className="px-5 py-2.5 rounded-lg text-[16px] font-bold transition hover:opacity-80 text-[var(--text-muted)] bg-[var(--bg-surface)]"
              >
                结束对话
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-[var(--bg-panel)] border-t border-[var(--border-light)]">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={roundsExhausted ? '请续费后继续追问...' : 'Type your follow-up question...'}
            rows={2}
            className="flex-1 p-3 rounded-[4px] resize-none text-[20px] leading-relaxed focus:outline-none focus:border-[var(--brand-yellow)] bg-[var(--bg-app)] text-[var(--text-main)] border border-[var(--border-light)] placeholder:text-[var(--text-dim)] transition-colors"
            disabled={roundsLeft <= 0 || roundsExhausted}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || roundsLeft <= 0 || roundsExhausted}
            className="p-3 rounded-[4px] disabled:opacity-50 transition hover:opacity-90 bg-[var(--brand-yellow)]"
          >
            <Send size={16} className="text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
