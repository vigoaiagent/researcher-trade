import { useState, useEffect } from 'react';
import { Send, Zap, TrendingUp, AlertTriangle, BarChart3, Heart, Star, MessageCircle, Calendar, RefreshCw, X, ExternalLink, Bell, BellOff, ChevronDown, ChevronUp, Settings, Phone } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useUserStore } from '../../stores/userStore';
import { favoriteApi } from '../../services/api';
import { hasTrialVoucher } from '../NewUserWelcomeModal';
import { AppointmentBooking } from '../AppointmentBooking';
import { useTranslation } from '../../i18n';

// 快捷提问模板 - will be generated with translations
const getQuickQuestions = (t: (key: string) => string) => [
  { icon: TrendingUp, label: t('chatPanel.trendAnalysis'), question: t('chatPanel.trendQuestion') },
  { icon: AlertTriangle, label: t('chatPanel.riskWarning'), question: t('chatPanel.riskQuestion') },
  { icon: BarChart3, label: t('chatPanel.entryPoint'), question: t('chatPanel.entryQuestion') },
];

interface SubscribedResearcher {
  id: string;
  researcherId: string;
  isActive: boolean;
  autoRenew: boolean;
  expiresAt: string;
  isExpired: boolean;
  researcher: {
    id: string;
    name: string;
    status: string;
    ratingScore: number;
    avatar?: string;
  };
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 计算剩余天数
function getDaysRemaining(dateStr: string): number {
  const expiry = new Date(dateStr);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function AskingPhase() {
  const [question, setQuestion] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [context, setContext] = useState('BTC/USDT');
  const [subscribedResearchers, setSubscribedResearchers] = useState<SubscribedResearcher[]>([]);
  const [directConsultResearcher, setDirectConsultResearcher] = useState<SubscribedResearcher | null>(null);
  const [showAllSubscriptions, setShowAllSubscriptions] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAppointmentBooking, setShowAppointmentBooking] = useState(false);
  const [appointmentResearcher, setAppointmentResearcher] = useState<SubscribedResearcher | null>(null);
  const { createConsultation, isLoading, error } = useChatStore();
  const { user, lockEnergy, syncEnergyBalance } = useUserStore();
  const { t } = useTranslation();
  const quickQuestions = getQuickQuestions(t);

  // 获取订阅的研究员列表 + 同步能量余额
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 同步服务器能量余额
        await syncEnergyBalance();
        // 获取订阅列表
        const { favorites } = await favoriteApi.getList(user.id);
        setSubscribedResearchers(favorites as SubscribedResearcher[]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [user?.id]);

  // 检查是否有未使用的体验券 (使用 localStorage)
  const hasUnusedTrial = hasTrialVoucher();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim() || !user) return;

    const energyAvailable = user.energyAvailable ?? 0;
    // 如果有体验券就使用体验券（优先），否则检查能量
    const usingTrial = hasUnusedTrial;

    // 如果没有体验券且能量不足，阻止提交
    if (!usingTrial && energyAvailable < 10) {
      alert(t('chatPanel.insufficientEnergy'));
      return;
    }

    // 如果不是使用体验券，需要锁定能量
    if (!usingTrial) {
      const locked = lockEnergy(10, 'Consultation service');
      if (!locked) {
        alert(t('chatPanel.energyLockFailed'));
        return;
      }
    }
    // 注意：体验券在咨询完成后才会标记为已使用（在 chatStore.submitRating 中）

    try {
      await createConsultation(
        user.id,
        question,
        showContext ? context : undefined,
        directConsultResearcher?.researcherId,
        usingTrial // 传递是否使用体验券的标记
      );
      setDirectConsultResearcher(null);
    } catch {
      // Error handled in store
    }
  };

  // 直接咨询 - 显示快捷问题选择器
  const [showQuickConsultModal, setShowQuickConsultModal] = useState(false);
  const [selectedQuickResearcher, setSelectedQuickResearcher] = useState<SubscribedResearcher | null>(null);

  const handleDirectConsult = (researcher: SubscribedResearcher) => {
    setSelectedQuickResearcher(researcher);
    setShowQuickConsultModal(true);
  };

  const handleQuickConsultSubmit = async (quickQuestion: string) => {
    if (!user || !selectedQuickResearcher) return;

    const energyAvailable = user.energyAvailable ?? 0;
    const usingTrial = hasUnusedTrial;

    if (!usingTrial && energyAvailable < 10) {
      alert(t('chatPanel.insufficientEnergy'));
      return;
    }

    if (!usingTrial) {
      const locked = lockEnergy(10, 'Consultation service');
      if (!locked) {
        alert(t('chatPanel.energyLockFailed'));
        return;
      }
    }

    try {
      await createConsultation(
        user.id,
        quickQuestion,
        context,
        selectedQuickResearcher.researcherId,
        usingTrial
      );
      setShowQuickConsultModal(false);
      setSelectedQuickResearcher(null);
    } catch {
      // Error handled in store
    }
  };

  const handleCancelDirectConsult = () => {
    setDirectConsultResearcher(null);
    setShowQuickConsultModal(false);
    setSelectedQuickResearcher(null);
  };

  const handleQuickQuestion = (q: string) => {
    setQuestion(q);
  };

  const handleToggleAutoRenew = async (sub: SubscribedResearcher) => {
    if (!user) return;
    try {
      if (sub.autoRenew) {
        await favoriteApi.cancel(user.id, sub.researcherId);
      } else {
        await favoriteApi.resume(user.id, sub.researcherId);
      }
      // Refresh subscription list
      const { favorites } = await favoriteApi.getList(user.id);
      setSubscribedResearchers(favorites as SubscribedResearcher[]);
    } catch (error) {
      console.error('Failed to toggle auto-renew:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activeSubscriptions = subscribedResearchers.filter(sub => sub.isActive);
  const displayedSubscriptions = showAllSubscriptions ? activeSubscriptions : activeSubscriptions.slice(0, 2);

  return (
    <div className="flex flex-col h-full p-3 md:p-4 bg-[var(--bg-panel)] overflow-y-auto">
      {/* Subscribed Researchers - Compact View */}
      {activeSubscriptions.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Heart size={14} className="text-[var(--brand-red)]" />
              <span className="text-[13px] text-[var(--text-muted)]">{t('chatPanel.mySubscriptions')}</span>
              <span className="text-[11px] text-[var(--brand-green)]">({activeSubscriptions.length})</span>
            </div>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--brand-yellow)] transition"
            >
              <Settings size={12} />
              {t('chatPanel.manage')}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {displayedSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className={`flex items-center gap-2.5 px-2.5 py-2 bg-[var(--bg-surface)] rounded-lg border ${
                  sub.isExpired ? 'border-[var(--brand-red)] opacity-60' : 'border-[var(--border-light)]'
                }`}
              >
                {sub.researcher.avatar ? (
                  <img src={sub.researcher.avatar} alt={sub.researcher.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[var(--brand-green)] flex items-center justify-center text-[13px] text-black font-bold">
                    {sub.researcher.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-[var(--text-main)]">{sub.researcher.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${sub.researcher.status === 'ONLINE' ? 'bg-[var(--brand-green)]' : 'bg-[var(--text-dim)]'}`} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <Star size={10} className="text-[var(--brand-yellow)] fill-[var(--brand-yellow)]" />
                    <span>{sub.researcher.ratingScore.toFixed(1)}</span>
                    <span>·</span>
                    <span className={getDaysRemaining(sub.expiresAt) <= 3 ? 'text-[var(--brand-red)]' : ''}>
                      {getDaysRemaining(sub.expiresAt)}{t('chatPanel.daysRemaining')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setAppointmentResearcher(sub);
                      setShowAppointmentBooking(true);
                    }}
                    disabled={sub.isExpired}
                    className={`p-1.5 rounded-lg transition ${
                      !sub.isExpired
                        ? 'bg-[var(--bg-app)] text-[var(--brand-green)] hover:bg-[var(--brand-green)] hover:text-black'
                        : 'bg-[var(--bg-app)] text-[var(--text-dim)] cursor-not-allowed'
                    }`}
                    title={t('chatPanel.bookCall')}
                  >
                    <Phone size={14} />
                  </button>
                  <button
                    onClick={() => handleDirectConsult(sub)}
                    disabled={sub.researcher.status !== 'ONLINE' || sub.isExpired}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition ${
                      sub.researcher.status === 'ONLINE' && !sub.isExpired
                        ? 'bg-[var(--brand-yellow)] text-black hover:opacity-90'
                        : 'bg-[var(--bg-app)] text-[var(--text-dim)] cursor-not-allowed'
                    }`}
                  >
                    {t('chatPanel.consult')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {activeSubscriptions.length > 2 && (
            <button
              onClick={() => setShowAllSubscriptions(!showAllSubscriptions)}
              className="w-full mt-1.5 py-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition flex items-center justify-center gap-1"
            >
              {showAllSubscriptions ? (
                <>{t('common.less')} <ChevronUp size={14} /></>
              ) : (
                <>{t('common.all')} <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* Quick Questions */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} className="text-[var(--brand-yellow)]" />
          <span className="text-[13px] text-[var(--text-muted)]">{t('chatPanel.quickQuestions')}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(item.question)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] transition hover:bg-[var(--bg-highlight)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              <item.icon size={12} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Question Input */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chatPanel.inputPlaceholder')}
          className="flex-1 p-3 rounded-lg resize-none text-[15px] leading-relaxed focus:outline-none focus:border-[var(--brand-yellow)] bg-[var(--bg-surface)] border border-[var(--border-light)] text-[var(--text-main)] placeholder:text-[var(--text-dim)] transition-colors min-h-[80px] max-h-[200px]"
          disabled={isLoading}
        />

        {/* Optional Context Toggle & Submit */}
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowContext(!showContext)}
              className={`text-[12px] px-2.5 py-1 rounded transition ${
                showContext
                  ? 'bg-[var(--brand-green)]/20 text-[var(--brand-green)]'
                  : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'
              }`}
            >
              {t('chatPanel.specifyPair')}
            </button>
            {showContext && (
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="px-2 py-1 rounded text-[12px] focus:outline-none bg-[var(--bg-surface)] border border-[var(--border-light)] text-[var(--text-main)]"
              >
                <optgroup label={t('chatPanel.popular')}>
                  <option value="BTC/USDT">BTC/USDT</option>
                  <option value="ETH/USDT">ETH/USDT</option>
                  <option value="SOL/USDT">SOL/USDT</option>
                </optgroup>
                <optgroup label={t('chatPanel.other')}>
                  <option value="ARB/USDT">ARB/USDT</option>
                  <option value="BNB/USDT">BNB/USDT</option>
                  <option value="DOGE/USDT">DOGE/USDT</option>
                  <option value="AVAX/USDT">AVAX/USDT</option>
                </optgroup>
              </select>
            )}
          </div>

          {error && (
            <p className="text-[12px] text-[var(--brand-red)]">{error}</p>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-light)]">
            <span className="text-[12px] text-[var(--text-dim)]">{t('chatPanel.tenRounds')}</span>
            <button
              type="submit"
              disabled={!question.trim() || isLoading || (!hasUnusedTrial && (user?.energyAvailable ?? 0) < 10)}
              className="px-4 py-2 rounded-lg font-bold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition hover:opacity-90 bg-[var(--brand-green)] text-black flex items-center gap-1.5"
            >
              {isLoading ? (
                t('chatPanel.sending')
              ) : hasUnusedTrial && (user?.energyAvailable ?? 0) < 10 ? (
                <>
                  <Send size={14} />
                  {t('chatPanel.useTrialVoucher')}
                </>
              ) : (
                <>
                  <Send size={14} />
                  {t('chatPanel.startConsult')}
                  <span className="text-[12px] opacity-80">{t('chatPanel.tenEnergy')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Subscription Management Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-panel)] rounded-xl w-full max-w-[480px] max-h-[80vh] mx-4 shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-light)]">
              <div className="flex items-center gap-2">
                <Heart size={20} className="text-[var(--brand-red)]" />
                <h3 className="text-[18px] font-bold text-[var(--text-main)]">{t('chatPanel.mySubscriptions')}</h3>
                <span className="text-[14px] text-[var(--text-muted)]">({activeSubscriptions.length})</span>
              </div>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="p-1 rounded hover:bg-[var(--bg-surface)] transition"
              >
                <X size={20} className="text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeSubscriptions.length === 0 ? (
                <div className="text-center py-10">
                  <Heart size={48} className="mx-auto mb-4 text-[var(--text-dim)]" />
                  <p className="text-[16px] text-[var(--text-muted)]">{t('chatPanel.noSubscriptions')}</p>
                  <p className="text-[14px] text-[var(--text-dim)] mt-1">{t('chatPanel.noSubscriptionsHint')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSubscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className={`p-4 bg-[var(--bg-surface)] rounded-xl border ${
                        sub.isExpired ? 'border-[var(--brand-red)]' : 'border-[var(--border-light)]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {sub.researcher.avatar ? (
                          <img src={sub.researcher.avatar} alt={sub.researcher.name} className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-[var(--brand-green)] flex items-center justify-center text-[18px] text-black font-bold">
                            {sub.researcher.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[16px] font-bold text-[var(--text-main)]">{sub.researcher.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              sub.researcher.status === 'ONLINE'
                                ? 'bg-[var(--brand-green)]/20 text-[var(--brand-green)]'
                                : 'bg-[var(--text-dim)]/20 text-[var(--text-dim)]'
                            }`}>
                              {sub.researcher.status === 'ONLINE' ? t('chatPanel.statusOnline') : t('chatPanel.statusOffline')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[14px] text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <Star size={14} className="text-[var(--brand-yellow)] fill-[var(--brand-yellow)]" />
                              {sub.researcher.ratingScore.toFixed(1)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(sub.expiresAt)} {t('chatPanel.expiresOn')}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="mt-2 flex items-center gap-2">
                            {sub.autoRenew ? (
                              <span className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--brand-green)]/10 text-[var(--brand-green)] text-[12px]">
                                <RefreshCw size={12} />
                                {t('chatPanel.autoRenew')}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--brand-red)]/10 text-[var(--brand-red)] text-[12px]">
                                {t('chatPanel.cancelledRenew')}
                              </span>
                            )}
                            {getDaysRemaining(sub.expiresAt) <= 3 && (
                              <span className="px-2 py-1 rounded bg-[var(--brand-yellow)]/10 text-[var(--brand-yellow)] text-[12px]">
                                {t('chatPanel.expiringSoon')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions - Row 1: 主要服务 */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            setShowSubscriptionModal(false);
                            handleDirectConsult(sub);
                          }}
                          disabled={sub.researcher.status !== 'ONLINE' || sub.isExpired}
                          className={`flex-1 py-2.5 rounded-lg text-[14px] font-medium transition flex items-center justify-center gap-1.5 ${
                            sub.researcher.status === 'ONLINE' && !sub.isExpired
                              ? 'bg-[var(--brand-yellow)] text-black hover:opacity-90'
                              : 'bg-[var(--bg-app)] text-[var(--text-dim)] cursor-not-allowed'
                          }`}
                        >
                          <MessageCircle size={14} />
                          {t('chatPanel.directConsult')}
                        </button>
                        <button
                          onClick={() => {
                            setAppointmentResearcher(sub);
                            setShowAppointmentBooking(true);
                          }}
                          disabled={sub.isExpired}
                          className={`flex-1 py-2.5 rounded-lg text-[14px] font-medium transition flex items-center justify-center gap-1.5 ${
                            !sub.isExpired
                              ? 'bg-[var(--brand-green)] text-black hover:opacity-90'
                              : 'bg-[var(--bg-app)] text-[var(--text-dim)] cursor-not-allowed'
                          }`}
                        >
                          <Phone size={14} />
                          {t('chatPanel.book1v1')}
                        </button>
                      </div>

                      {/* Actions - Row 2: 其他功能 */}
                      <div className="flex gap-2 mt-2">
                        <a
                          href="https://sosovalue.com/profile/index/1774072765580394497"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--brand-yellow)] transition"
                        >
                          <ExternalLink size={14} />
                          {t('chatPanel.homepage')}
                        </a>
                        <button
                          onClick={() => handleToggleAutoRenew(sub)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                        >
                          {sub.autoRenew ? <BellOff size={14} /> : <Bell size={14} />}
                          {sub.autoRenew ? t('chatPanel.cancelRenew') : t('chatPanel.resumeRenew')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border-light)]">
              <p className="text-[13px] text-[var(--text-dim)] text-center">
                {t('chatPanel.subscriptionFee')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 预约1v1弹窗 */}
      {appointmentResearcher && (
        <AppointmentBooking
          isOpen={showAppointmentBooking}
          onClose={() => {
            setShowAppointmentBooking(false);
            setAppointmentResearcher(null);
          }}
          researcher={{
            id: appointmentResearcher.researcherId,
            name: appointmentResearcher.researcher.name,
            avatar: appointmentResearcher.researcher.avatar,
            title: t('researcher.selectResearcher'),
            rating: appointmentResearcher.researcher.ratingScore,
            specialties: ['BTC', 'Technical Analysis'],
            voicePrice: 30,
            videoPrice: 50,
          }}
          onConfirm={(appointment) => {
            console.log('Appointment booked:', appointment);
            // TODO: 调用后端API创建预约
            setShowAppointmentBooking(false);
            setAppointmentResearcher(null);
          }}
        />
      )}

      {/* 快捷咨询弹窗 */}
      {showQuickConsultModal && selectedQuickResearcher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-panel)] rounded-xl w-full max-w-[400px] mx-4 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
              <div className="flex items-center gap-3">
                {selectedQuickResearcher.researcher.avatar ? (
                  <img
                    src={selectedQuickResearcher.researcher.avatar}
                    alt={selectedQuickResearcher.researcher.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-green)] flex items-center justify-center text-[14px] text-black font-bold">
                    {selectedQuickResearcher.researcher.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-[15px] font-bold text-[var(--text-main)]">
                    {t('chatPanel.consultWith')} {selectedQuickResearcher.researcher.name}
                  </div>
                  <div className="text-[12px] text-[var(--text-muted)]">
                    {t('chatPanel.selectOrCustom')}
                  </div>
                </div>
              </div>
              <button
                onClick={handleCancelDirectConsult}
                className="p-1.5 rounded hover:bg-[var(--bg-surface)] transition"
              >
                <X size={18} className="text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Quick Questions */}
            <div className="p-4 space-y-2">
              {quickQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickConsultSubmit(q.question)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 p-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] rounded-lg transition text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--brand-green)]/10 flex items-center justify-center group-hover:bg-[var(--brand-green)]/20 transition">
                    <q.icon size={16} className="text-[var(--brand-green)]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-[var(--text-main)]">{q.label}</div>
                    <div className="text-[12px] text-[var(--text-muted)] line-clamp-1">{q.question}</div>
                  </div>
                  <Send size={14} className="text-[var(--text-dim)] group-hover:text-[var(--brand-green)] transition" />
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="px-4 pb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && question.trim()) {
                      handleQuickConsultSubmit(question);
                    }
                  }}
                  placeholder={t('chatPanel.orCustomQuestion')}
                  className="flex-1 px-3 py-2.5 bg-[var(--bg-surface)] text-[var(--text-main)] text-[14px] rounded-lg border border-[var(--border-light)] focus:border-[var(--brand-yellow)] focus:outline-none"
                />
                <button
                  onClick={() => question.trim() && handleQuickConsultSubmit(question)}
                  disabled={!question.trim() || isLoading}
                  className="px-4 py-2.5 bg-[var(--brand-yellow)] text-black rounded-lg font-medium text-[14px] hover:opacity-90 disabled:opacity-50 transition"
                >
                  {isLoading ? '...' : t('chat.send')}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-center gap-2 text-[12px] text-[var(--text-muted)]">
                <Zap size={12} className="text-[var(--brand-yellow)]" />
                <span>{t('chatPanel.energyCost')} {user?.energyAvailable ?? 0} {t('chatPanel.energy')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
