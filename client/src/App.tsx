import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AICatButton } from './components/AICatButton';
import { ChatPanel } from './components/ChatPanel';
import { useUserStore, getDemoUsers } from './stores/userStore';
import { useTranslation } from './i18n';
import { TopNav, MarketTicker, OrderBook, ChartArea, TradePanel, MobileBottomBar } from './components/trading';
import { CatBubbleAlert, AlertPanel, AlertSettingsPanel } from './components/CatBubbleAlert';
import { useAlertStore } from './stores/alertStore';
import { ResearchReportsTicker } from './components/trading/ResearchReportsTicker';
import { RoadshowTicker, type RoadshowEvent } from './components/trading/RoadshowTicker';
import { RoadshowLiveModal, type RoadshowEvent as LiveEvent } from './components/trading/RoadshowLiveModal';
import { ResearchReportModal } from './components/trading/ResearchReportModal';
import { ResearchReportListModal } from './components/trading/ResearchReportListModal';
import { NewsPreviewModal } from './components/trading/NewsPreviewModal';
import { NewsListModal } from './components/trading/NewsListModal';
import { ResearcherApplyModal } from './components/trading/ResearcherApplyModal';
import { useReportNotifications } from './components/trading/ReportNotification';
import { LevelUpgradeModal } from './components/trading/LevelUpgradeModal';
import { NewUserWelcomeModal } from './components/NewUserWelcomeModal';
import { ResearcherCallPage } from './pages/ResearcherCallPage';
import { RoadshowCalendar } from './components/RoadshowCalendar';
import { OnboardingGuide, useOnboardingGuide } from './components/OnboardingGuide';
import { ResearcherServiceGuide, useResearcherGuide } from './components/ResearcherServiceGuide';
import { Globe, Check } from 'lucide-react';

const INITIAL_PRICE = 67240.50;

// Main Trading Page Component
// Level Icons
const levelIcons: Record<string, string> = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Diamond: '👑',
};

// Level Colors
const levelColors: Record<string, string> = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Diamond: '#B9F2FF',
};

function TradingPage() {
  const { user, login, loginAsDemo, isLoading, syncEnergyBalance } = useUserStore();
  const { language, setLanguage, t } = useTranslation();
  const [walletInput, setWalletInput] = useState('');
  const [price, setPrice] = useState(INITIAL_PRICE);
  const [prevPrice, setPrevPrice] = useState(INITIAL_PRICE);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [showRoadshowCalendar, setShowRoadshowCalendar] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // 直播窗口状态
  const [liveEvent, setLiveEvent] = useState<LiveEvent | null>(null);

  // 研报详情状态
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // 体验券弹窗状态
  const [showTrialVoucherModal, setShowTrialVoucherModal] = useState(false);

  // 研报列表弹窗状态
  const [showReportListModal, setShowReportListModal] = useState(false);

  // 新闻预览弹窗状态
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);

  // 新闻列表弹窗状态
  const [showNewsListModal, setShowNewsListModal] = useState(false);

  // 研究员申请弹窗状态
  const [showResearcherApply, setShowResearcherApply] = useState(false);

  // 新手引导
  const { showGuide, completeOnboarding, skipOnboarding } = useOnboardingGuide();

  // 研究员服务指南
  const { showGuide: showResearcherGuide, openGuide: openResearcherGuide, closeGuide: closeResearcherGuide, completeGuide: completeResearcherGuide } = useResearcherGuide();

  // 研报推送通知
  const { pushNotification, NotificationContainer } = useReportNotifications({
    onViewReport: (reportId) => setSelectedReportId(reportId),
  });

  // 个性化 Alert Store
  const { addAlert } = useAlertStore();

  // 用户登录后同步服务器能量余额
  useEffect(() => {
    if (user?.id) {
      syncEnergyBalance();
    }
  }, [user?.id]);

  // 模拟研报推送（登录后10秒推送一条）
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      pushNotification({
        id: `report-${Date.now()}`,
        title: 'BTC Technical Analysis: Key Support at $94,500',
        symbol: 'BTC',
        sentiment: 'bullish',
        researcher: 'Alex Chen',
        requiredLevel: 'Gold',
      });
    }, 10000);
    return () => clearTimeout(timer);
  }, [user]);

  // 模拟持仓相关快讯推送（登录后20秒开始，每30秒一条）
  useEffect(() => {
    if (!user) return;

    const mockAlerts = [
      {
        id: 'alert_1',
        symbol: 'BTC/USDT',
        title: t('mockAlerts.fedMinutes'),
        summary: t('mockAlerts.fedSummary'),
        source: 'Reuters',
        time: t('time.justNow'),
        isUrgent: true,
      },
      {
        id: 'alert_2',
        symbol: 'ETH/USDT',
        title: t('mockAlerts.vitalikRoadmap'),
        summary: t('mockAlerts.vitalikSummary'),
        source: 'The Block',
        time: `5 ${t('time.minutesAgo')}`,
      },
      {
        id: 'alert_3',
        symbol: 'SOL/USDT',
        title: t('mockAlerts.solanaTVL'),
        summary: t('mockAlerts.solanaSummary'),
        source: 'DefiLlama',
        time: `10 ${t('time.minutesAgo')}`,
        isUrgent: true,
      },
    ];

    // 20秒后推送第一条
    const timer1 = setTimeout(() => {
      addAlert(mockAlerts[0]);
    }, 20000);

    // 50秒后推送第二条
    const timer2 = setTimeout(() => {
      addAlert(mockAlerts[1]);
    }, 50000);

    // 80秒后推送第三条
    const timer3 = setTimeout(() => {
      addAlert(mockAlerts[2]);
    }, 80000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [user]);

  // 监听打开路演日历事件（从订阅研究员功能触发）
  useEffect(() => {
    const handleOpenRoadshowCalendar = () => {
      setShowRoadshowCalendar(true);
    };

    window.addEventListener('openRoadshowCalendar', handleOpenRoadshowCalendar);
    return () => {
      window.removeEventListener('openRoadshowCalendar', handleOpenRoadshowCalendar);
    };
  }, []);

  // 处理打开直播
  const handleOpenLive = (event: RoadshowEvent) => {
    // 转换为 LiveEvent 格式
    const liveEventData: LiveEvent = {
      id: event.id,
      title: event.title,
      researcher: {
        id: `researcher-${event.id}`,
        name: event.speaker,
        title: 'Senior Analyst',
      },
      topic: event.title,
      status: event.isLive ? 'live' : 'upcoming',
      scheduledAt: event.startTime.toISOString(),
      viewerCount: event.registeredCount,
      likeCount: Math.floor(event.registeredCount * 0.6),
      requiredLevel: event.requiredLevel,
    };
    setLiveEvent(liveEventData);
  };

  // Global Ticker Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPrevPrice(price);
      setPrice((p) => p + (Math.random() - 0.5) * 15);
    }, 1000);
    return () => clearInterval(interval);
  }, [price]);

  // Wallet connection handler
  const handleConnect = async () => {
    if (!walletInput.trim()) {
      alert(t('login.enterWalletAlert'));
      return;
    }
    try {
      await login(walletInput);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4 relative">
        {/* Language Switcher on Login Page */}
        <div className="absolute top-4 right-4">
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] transition-colors"
            >
              <Globe size={16} className="text-[var(--text-muted)]" />
              <span className="text-[13px] text-[var(--text-muted)] font-medium">
                {language === 'zh' ? t('language.zhShort') : t('language.enShort')}
              </span>
            </button>

            {showLanguageDropdown && (
              <>
                <div
                  className="fixed inset-0 z-[199]"
                  onClick={() => setShowLanguageDropdown(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-[140px] bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-lg shadow-xl z-[200] overflow-hidden">
                  <button
                    onClick={() => {
                      setLanguage('zh');
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-[14px] hover:bg-[var(--bg-surface)] transition ${
                      language === 'zh' ? 'text-[var(--brand-yellow)]' : 'text-[var(--text-main)]'
                    }`}
                  >
                    <span>{t('language.zhFull')}</span>
                    {language === 'zh' && <Check size={14} />}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-[14px] hover:bg-[var(--bg-surface)] transition ${
                      language === 'en' ? 'text-[var(--brand-yellow)]' : 'text-[var(--text-main)]'
                    }`}
                  >
                    <span>{t('language.enFull')}</span>
                    {language === 'en' && <Check size={14} />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            {/* SoDEX Logo */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <img
                src="https://cdn.jsdelivr.net/gh/sevclub/publicimage@main/SoDEX(1).svg"
                alt="SoDEX"
                className="h-10"
              />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] mt-4">
              {t('login.title')}
            </h1>
            <p className="text-[var(--text-muted)] mt-2">{t('login.subtitle')}</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              placeholder={t('login.walletPlaceholder')}
              className="form-input w-full p-3"
            />

            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full py-3 bg-[var(--brand-green)] text-black rounded-[4px] font-bold disabled:opacity-50 hover:opacity-90 transition"
            >
              {isLoading ? t('login.connecting') : t('login.connectWallet')}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-light)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--bg-panel)] text-[var(--text-muted)]">{t('login.quickDemo')}</span>
              </div>
            </div>

            {/* Demo Users Grid */}
            <div className="grid grid-cols-2 gap-3">
              {getDemoUsers(language).map((demoUser) => {
                // Map level to translation key
                const nameKey = `login.${demoUser.level.toLowerCase()}User` as const;
                return (
                  <button
                    key={demoUser.id}
                    onClick={() => loginAsDemo(demoUser)}
                    disabled={isLoading}
                    className="p-3 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg hover:border-[color:var(--level-color)] hover:bg-[var(--bg-highlight)] transition-all group"
                    style={{ '--level-color': levelColors[demoUser.level] } as React.CSSProperties}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{levelIcons[demoUser.level]}</span>
                      <span
                        className="text-[13px] font-bold"
                        style={{ color: levelColors[demoUser.level] }}
                      >
                        {demoUser.level}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-[12px] text-[var(--text-main)] font-medium">{t(nameKey)}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        ⚡ {demoUser.energyAvailable} {t('topNav.energy')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-xs text-[var(--text-dim)] mt-6">
            {t('login.whitelistOnly')}
          </p>
        </div>
      </div>
    );
  }

  // Main Trading Interface
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[var(--bg-app)] overflow-hidden">
      {/* Top Navigation */}
      <TopNav onOpenTrialVoucher={() => setShowTrialVoucherModal(true)} />

      {/* Roadshow Ticker - 路演跑马灯 */}
      <RoadshowTicker
        onOpenCalendar={() => setShowRoadshowCalendar(true)}
        onOpenLive={handleOpenLive}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Market Ticker */}
        <MarketTicker
          price={price}
          prevPrice={prevPrice}
          onSymbolChange={(symbol) => setSelectedSymbol(symbol)}
        />

        {/* Trading Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chart Area */}
          <div className="flex-1 flex flex-col min-w-0 md:border-r border-[var(--border-light)]">
            <ChartArea price={price} symbol={selectedSymbol} />
          </div>

          {/* Order Book - 移动端隐藏 */}
          <div className="hidden md:block">
            <OrderBook price={price} />
          </div>

          {/* Trade Panel - 移动端隐藏 */}
          <div className="hidden md:block">
            <TradePanel price={price} />
          </div>
        </div>
      </div>

      {/* Research Reports Ticker */}
      <ResearchReportsTicker
        onOpenCalendar={() => setShowRoadshowCalendar(true)}
        onOpenReport={(reportId) => setSelectedReportId(reportId)}
        onOpenReportList={() => setShowReportListModal(true)}
        onOpenNews={(newsId) => setSelectedNewsId(newsId)}
        onOpenNewsList={() => setShowNewsListModal(true)}
        currentSymbol={selectedSymbol}
      />

      {/* Mobile Bottom Bar - 移动端底部导航 */}
      <MobileBottomBar
        onOpenReportList={() => setShowReportListModal(true)}
        onOpenNewsList={() => setShowNewsListModal(true)}
        onOpenCalendar={() => setShowRoadshowCalendar(true)}
        hasLiveEvent={!!liveEvent}
        onOpenLive={() => liveEvent && setLiveEvent(liveEvent)}
        currentPrice={price}
      />

      {/* AI Copilot Components */}
      <AICatButton />
      <ChatPanel />

      {/* Roadshow Calendar Modal */}
      <RoadshowCalendar
        isOpen={showRoadshowCalendar}
        onClose={() => setShowRoadshowCalendar(false)}
      />

      {/* Level Upgrade Notification */}
      <LevelUpgradeModal />

      {/* Trial Voucher Modal - 通过 TopNav 触发 */}
      <NewUserWelcomeModal
        isOpen={showTrialVoucherModal}
        onClose={() => setShowTrialVoucherModal(false)}
      />

      {/* Live Roadshow Modal */}
      <RoadshowLiveModal
        event={liveEvent}
        onClose={() => setLiveEvent(null)}
      />

      {/* Research Report Detail Modal */}
      <ResearchReportModal
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
      />

      {/* Research Report List Modal */}
      <ResearchReportListModal
        isOpen={showReportListModal}
        onClose={() => setShowReportListModal(false)}
        onSelectReport={(reportId) => {
          setShowReportListModal(false);
          setSelectedReportId(reportId);
        }}
      />

      {/* News Preview Modal */}
      <NewsPreviewModal
        newsId={selectedNewsId}
        onClose={() => setSelectedNewsId(null)}
      />

      {/* News List Modal */}
      <NewsListModal
        isOpen={showNewsListModal}
        onClose={() => setShowNewsListModal(false)}
        onSelectNews={(newsId) => {
          setShowNewsListModal(false);
          setSelectedNewsId(newsId);
        }}
      />

      {/* Researcher Apply Modal */}
      <ResearcherApplyModal
        isOpen={showResearcherApply}
        onClose={() => setShowResearcherApply(false)}
      />

      {/* Report Push Notifications */}
      <NotificationContainer />

      {/* Cat Bubble Alert - 小猫气泡快讯 */}
      <CatBubbleAlert />
      <AlertPanel />
      <AlertSettingsPanel />

      {/* Onboarding Guide - 新手引导 */}
      <OnboardingGuide
        isOpen={showGuide}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
        onOpenResearcherGuide={openResearcherGuide}
      />

      {/* Researcher Service Guide - 研究员服务指南 */}
      <ResearcherServiceGuide
        isOpen={showResearcherGuide}
        onClose={closeResearcherGuide}
        onComplete={completeResearcherGuide}
        onAction={(actionId) => {
          if (actionId === 'trial') {
            setShowTrialVoucherModal(true);
          }
        }}
      />
    </div>
  );
}

// Root App with Router
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TradingPage />} />
        <Route path="/call/:roomId" element={<ResearcherCallPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
