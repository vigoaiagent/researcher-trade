import { useEffect, useState, useRef } from 'react';
import { X, Lock, Zap, Crown, Maximize2, Minimize2 } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useUserStore } from '../../stores/userStore';
import { useTranslation } from '../../i18n';
import { RoboCatIcon } from '../trading/RoboCatIcon';
import { AIChat } from './AIChat';
import { AskingPhase } from './AskingPhase';
import { WaitingPhase } from './WaitingPhase';
import { SelectingPhase } from './SelectingPhase';
import { ChattingPhase } from './ChattingPhase';
import { RatingPhase } from './RatingPhase';
import { CompletedPhase } from './CompletedPhase';
import { LEVEL_CONFIG } from '../../types';
import type { UserLevel } from '../../types';
import {
  connectSocket,
  getSocket,
  joinUserRoom,
  joinConsultationRoom,
} from '../../services/socket';
import { researcherApi } from '../../services/api';
import { hasTrialVoucher } from '../NewUserWelcomeModal';

// 等级进度弹窗 - 居中弹窗
function LevelProgressModal({ onClose, user, onUseTrial }: { onClose: () => void; user: any; onUseTrial?: () => void }) {
  const { t } = useTranslation();
  const currentLevel = (user?.level || 'Bronze') as UserLevel;
  const currentEnergy = user?.energyAvailable || 0;
  const goldMinFees = LEVEL_CONFIG.Gold.minFees;
  const currentFees = user?.fees30d || 0;
  const progress = Math.min((currentFees / goldMinFees) * 100, 100);

  // 使用统一的体验券判断
  const hasVoucher = hasTrialVoucher();

  const handleUseTrial = () => {
    // 注意：体验券在咨询完成后才会标记为已使用（在 chatStore.submitRating 中）
    if (onUseTrial) {
      onUseTrial();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-panel)] rounded-2xl w-[360px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--brand-yellow)] to-[#FF9500] px-5 py-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Crown size={22} className="text-white" />
            <h3 className="text-[18px] font-bold text-white">{t('chat.unlockResearcher')}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Trial Voucher Banner - 体验券 */}
          {hasVoucher && (
            <div className="mb-4 p-4 bg-gradient-to-r from-[var(--brand-green)]/20 to-[var(--brand-yellow)]/20 rounded-xl border border-[var(--brand-green)]/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--brand-green)] flex items-center justify-center shrink-0">
                  <span className="text-[20px]">🎁</span>
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-[var(--brand-green)] mb-1">
                    {t('chat.trialBanner.title')}
                  </div>
                  <div className="text-[13px] text-[var(--text-muted)]">
                    {t('chat.trialBanner.description')}
                  </div>
                </div>
              </div>
              <button
                onClick={handleUseTrial}
                className="w-full mt-3 py-2.5 rounded-lg text-[15px] font-bold bg-[var(--brand-green)] text-black hover:opacity-90 transition"
              >
                {t('chat.trialBanner.useNow')}
              </button>
            </div>
          )}

          {/* Status Row */}
          <div className="flex items-center justify-between text-[15px] mb-4">
            <span className="text-[var(--text-muted)]">{t('chat.currentLevel')}</span>
            <span className="font-bold" style={{ color: LEVEL_CONFIG[currentLevel].color }}>
              {currentLevel}
            </span>
          </div>

          {/* Energy Display */}
          <div className="flex items-center justify-between text-[15px] mb-4">
            <span className="text-[var(--text-muted)]">{t('chat.currentEnergy')}</span>
            <span className="font-bold text-[var(--brand-yellow)]">
              ⚡ {currentEnergy.toFixed(2)}
            </span>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-[14px] mb-2">
              <span className="text-[var(--text-muted)]">{t('chat.upgradeProgress')}</span>
              <span className="text-[var(--brand-yellow)] font-medium">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-yellow)] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[12px] text-[var(--text-dim)] mt-1">
              <span>$0</span>
              <span>$1,000 (Gold)</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-[var(--bg-surface)] rounded-xl p-4 mb-4">
            <div className="text-[14px] font-bold text-[var(--text-main)] mb-3">{t('chat.goldBenefits')}</div>
            <div className="text-[14px] text-[var(--text-muted)] space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[var(--brand-green)]">✓</span>
                <span>{t('chat.benefit1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--brand-green)]">✓</span>
                <span>{t('chat.benefit2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--brand-green)]">✓</span>
                <span>{t('chat.benefit3')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--brand-green)]">✓</span>
                <span>{t('chat.benefit4')}</span>
              </div>
            </div>
          </div>

          {/* How to Upgrade */}
          <div className="bg-[var(--bg-surface)] rounded-xl p-4 mb-4">
            <div className="text-[14px] font-bold text-[var(--text-main)] mb-2">{t('chat.howToUpgrade')}</div>
            <div className="text-[13px] text-[var(--text-muted)] leading-relaxed">
              {t('chat.upgradeHint')}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-[16px] font-bold bg-[var(--brand-yellow)] text-black hover:opacity-90 transition"
          >
            {t('chat.tradeForEnergy')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { isOpen, closeChat, phase, reset, currentConsultation, serviceMode, setServiceMode, clearAIMessages, setPhase } =
    useChatStore();
  const { user } = useUserStore();
  const { t } = useTranslation();
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showEnergyTooltip, setShowEnergyTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const userLevel = (user?.level || 'Bronze') as UserLevel;
  const hasResearcherAccess = user ? LEVEL_CONFIG[userLevel]?.hasResearcherAccess : false;

  // 点击外部关闭面板
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // 检查是否点击在面板外部
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // 如果有弹窗打开，不关闭面板
        if (showLevelModal) return;

        const target = event.target as HTMLElement;

        // 如果点击的是 AI 猫按钮，让按钮自己处理
        if (target.closest('[data-ai-cat-button]')) return;

        // 检查是否点击在任何模态框/弹窗内（通过检查 z-index >= 90 的 fixed 元素）
        const isInsideModal = target.closest('[class*="fixed"][class*="z-["]') ||
          target.closest('[data-alert-bubble]') ||
          target.closest('[data-alert-panel]') ||
          target.closest('[data-alert-settings]') ||
          target.closest('[role="dialog"]');

        if (isInsideModal) return;

        // 关闭面板
        closeChat();
      }
    };

    // 延迟添加事件监听器，避免打开时立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeChat, showLevelModal]);

  // 获取在线研究员数量
  useEffect(() => {
    if (!isOpen) return;

    const fetchOnlineCount = async () => {
      try {
        const { researchers } = await researcherApi.getOnline();
        setOnlineCount(researchers.length);
      } catch (error) {
        console.error('Failed to fetch online researchers:', error);
      }
    };

    fetchOnlineCount();
    // 每30秒刷新一次
    const interval = setInterval(fetchOnlineCount, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // 打开时默认进入 AI 模式
  useEffect(() => {
    if (isOpen && serviceMode === 'select') {
      setServiceMode('ai');
    }
  }, [isOpen]);

  // Socket connection management
  useEffect(() => {
    if (!isOpen || !user) return;

    connectSocket();
    joinUserRoom(user.id);

    const socket = getSocket();

    socket.off('answers_ready');
    socket.off('new_message');
    socket.off('consultation_completed');
    socket.off('consultation_refunded');
    socket.off('rounds_exhausted');

    const handleAnswersReady = (data: { consultationId: string }) => {
      const { currentConsultation, phase, selectedResearcher } = useChatStore.getState();
      if (data.consultationId === currentConsultation?.id) {
        // 直接咨询模式：已经在chatting阶段且已选中研究员，不需要再选择
        // 研究员的回复会通过 new_message 事件接收
        if (phase === 'chatting' && selectedResearcher) {
          console.log('[Socket] Direct consultation mode - skip selecting phase');
          return;
        }
        useChatStore.getState().fetchAnswers();
      }
    };

    const handleNewMessage = (data: { message: any }) => {
      if (data.message.senderType === 'RESEARCHER') {
        useChatStore.getState().addMessage(data.message);
      }
    };

    const handleCompleted = () => {
      useChatStore.getState().setPhase('rating');
    };

    const handleRefunded = () => {
      alert(t('chatPanel.consultationTimeout'));
      useChatStore.getState().reset();
    };

    const handleRoundsExhausted = (data: { consultationId: string; extendCost?: number }) => {
      const { currentConsultation } = useChatStore.getState();
      if (data.consultationId === currentConsultation?.id) {
        useChatStore.getState().setRoundsExhausted(true, data.extendCost || 5);
      }
    };

    socket.on('answers_ready', handleAnswersReady);
    socket.on('new_message', handleNewMessage);
    socket.on('consultation_completed', handleCompleted);
    socket.on('consultation_refunded', handleRefunded);
    socket.on('rounds_exhausted', handleRoundsExhausted);

    return () => {
      socket.off('answers_ready', handleAnswersReady);
      socket.off('new_message', handleNewMessage);
      socket.off('consultation_completed', handleCompleted);
      socket.off('consultation_refunded', handleRefunded);
      socket.off('rounds_exhausted', handleRoundsExhausted);
    };
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (currentConsultation?.id) {
      joinConsultationRoom(currentConsultation.id);
    }
  }, [currentConsultation?.id]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (phase === 'chatting' || (serviceMode === 'ai' && useChatStore.getState().aiMessages.length > 0)) {
      if (!confirm(t('chatPanel.closeConfirm'))) return;
    }
    closeChat();
    clearAIMessages();
    setServiceMode('select');
    if (phase === 'completed' || phase === 'idle') {
      reset();
    }
  };

  const handleTabClick = (mode: 'ai' | 'researcher') => {
    if (mode === 'researcher') {
      // 如果已经在研究员流程中（chatting/waiting/selecting/rating），切换回去时保持状态
      // 即使用户没有永久权限（使用体验券的情况），也应该允许他们返回
      if (phase === 'waiting' || phase === 'selecting' || phase === 'chatting' || phase === 'rating') {
        setServiceMode('researcher');
        return;
      }

      // 如果不在流程中，需要检查权限
      if (!hasResearcherAccess) {
        setShowLevelModal(true);
        return;
      }

      setServiceMode('researcher');
      setPhase('asking');
    } else {
      // 允许切换到 AI Tab，研究员对话状态会保留
      setServiceMode('ai');
    }
  };

  const renderContent = () => {
    if (serviceMode === 'ai') {
      return <AIChat />;
    }

    // Researcher Service flow
    switch (phase) {
      case 'idle':
      case 'asking':
        return <AskingPhase />;
      case 'waiting':
        return <WaitingPhase />;
      case 'selecting':
        return <SelectingPhase />;
      case 'chatting':
        return <ChattingPhase />;
      case 'rating':
        return <RatingPhase />;
      case 'completed':
        return <CompletedPhase />;
      default:
        return <AskingPhase />;
    }
  };

  // 判断是否在研究员对话进行中 (不论当前tab)
  const hasActiveResearcherSession = phase === 'waiting' || phase === 'selecting' || phase === 'chatting';

  // 检查是否有体验券且未使用 (使用统一的 localStorage 函数)
  const hasUnusedTrial = !hasResearcherAccess && hasTrialVoucher();

  return (
    <>
      {/* Level Progress Modal - 移到顶层，确保正确居中 */}
      {showLevelModal && (
        <LevelProgressModal
          onClose={() => setShowLevelModal(false)}
          user={user}
          onUseTrial={() => {
            // 使用体验券，直接进入研究员服务
            setServiceMode('researcher');
            setPhase('asking');
          }}
        />
      )}

      {/* Mobile: fullscreen overlay, Desktop: positioned panel */}
      <div ref={panelRef} className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-[300]">
        {/* 新用户体验券横幅 - 仅桌面端显示 */}
        {hasUnusedTrial && showTrialBanner && serviceMode === 'ai' && (
        <div className="hidden md:block absolute -top-16 right-0 w-full animate-in slide-in-from-top duration-300">
          <div
            className="bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-yellow)] text-black px-4 py-2.5 rounded-xl flex items-center justify-between gap-3 shadow-lg cursor-pointer hover:opacity-95 transition"
            onClick={() => {
              setShowTrialBanner(false);
              setShowLevelModal(true);
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🎁</span>
              <span className="text-[13px] font-bold">{t('chat.newUserTrial')}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTrialBanner(false);
              }}
              className="text-black/60 hover:text-black p-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div
        className={`flex flex-col glass-panel overflow-hidden transition-all duration-300
          w-full h-full
          md:rounded-2xl md:w-[520px] md:h-[720px] md:origin-bottom-right
          ${isExpanded ? 'md:w-[680px] md:h-[860px]' : ''}
          ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}
        `}
      >
        {/* Header with Tabs */}
        <div className="bg-[var(--bg-panel)] border-b border-[var(--border-light)]">
          {/* Title Bar */}
          <div className="h-12 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <RoboCatIcon size={28} level={userLevel} />
              <span className="text-[13px] font-bold text-[var(--text-main)]">SoDEX</span>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <div
                  className="relative flex items-center gap-1.5 text-[14px] font-medium text-[var(--text-muted)] bg-[var(--bg-surface)] px-3 py-1.5 rounded-full cursor-help"
                  onMouseEnter={() => setShowEnergyTooltip(true)}
                  onMouseLeave={() => setShowEnergyTooltip(false)}
                >
                  <Zap size={14} className="text-[var(--brand-yellow)]" />
                  <span>{(user.energyAvailable ?? 0).toFixed(2)}</span>
                  {showEnergyTooltip && (
                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-lg px-3 py-2 whitespace-nowrap z-50 shadow-lg">
                      <span className="text-[14px] text-[var(--text-main)]">{t('topNav.availableEnergy')}</span>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg transition hover:bg-[var(--bg-surface)]"
                title={isExpanded ? t('chatPanel.shrinkBtn') : t('chatPanel.expandBtn')}
              >
                {isExpanded ? (
                  <Minimize2 size={16} className="text-[var(--text-muted)] hover:text-[var(--text-main)]" />
                ) : (
                  <Maximize2 size={16} className="text-[var(--text-muted)] hover:text-[var(--text-main)]" />
                )}
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg transition hover:bg-[var(--bg-surface)]"
              >
                <X size={16} className="text-[var(--text-muted)] hover:text-[var(--text-main)]" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-4 gap-1">
            {/* AI Tab */}
            <button
              onClick={() => handleTabClick('ai')}
              className={`flex-1 py-2.5 text-[12px] font-medium rounded-t-lg transition relative ${
                serviceMode === 'ai'
                  ? 'bg-[var(--bg-app)] text-[var(--brand-yellow)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              {t('chat.aiResearcher')}
              {serviceMode === 'ai' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--brand-yellow)] rounded-full" />
              )}
            </button>

            {/* Researcher Tab - VIP Gold Style */}
            <button
              onClick={() => handleTabClick('researcher')}
              className={`flex-1 py-2.5 text-[12px] font-medium rounded-t-lg transition relative flex items-center justify-center gap-1.5 ${
                serviceMode === 'researcher'
                  ? 'bg-[var(--bg-app)] text-[var(--brand-yellow)]'
                  : !hasResearcherAccess
                    ? 'text-[var(--text-dim)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              {!hasResearcherAccess && <Lock size={11} />}
              {t('chat.exclusiveResearcher')}
              <Crown size={12} className="text-[var(--brand-yellow)]" />
              {hasResearcherAccess && (
                <span className="text-[9px] text-[var(--text-muted)]">
                  · {onlineCount} {t('chat.online')}
                </span>
              )}
              {/* 体验券指示 - 非Gold用户且有体验券时显示 */}
              {!hasResearcherAccess && hasTrialVoucher() && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-[var(--brand-green)] text-black rounded-full animate-pulse">
                  {t('chat.trialVoucher')}
                </span>
              )}
              {/* 进行中的对话指示器 - 用户在AI tab但研究员对话进行中 */}
              {hasActiveResearcherSession && serviceMode === 'ai' && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-[var(--brand-green)] rounded-full animate-pulse" />
              )}
              {serviceMode === 'researcher' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--brand-yellow)] rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-[var(--bg-app)]">
          {renderContent()}
        </div>
      </div>
    </div>
    </>
  );
}
