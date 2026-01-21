import { useState, useMemo } from 'react';
import { X, Calendar, Clock, Phone, Video, ChevronLeft, ChevronRight, Check, Zap, Star, AlertCircle, Mail, Download } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useTranslation, useLanguage } from '../i18n';

// Google Calendar icon component
const GoogleCalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M18 4H17V2H15V4H9V2H7V4H6C4.9 4 4 4.9 4 6V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V6C20 4.9 19.1 4 18 4Z" fill="#4285F4"/>
    <path d="M6 9H18V20H6V9Z" fill="white"/>
    <path d="M8 13H10V15H8V13Z" fill="#EA4335"/>
    <path d="M11 13H13V15H11V13Z" fill="#FBBC04"/>
    <path d="M14 13H16V15H14V13Z" fill="#34A853"/>
    <path d="M8 16H10V18H8V16Z" fill="#4285F4"/>
    <path d="M11 16H13V18H11V16Z" fill="#EA4335"/>
    <path d="M14 16H16V18H14V16Z" fill="#FBBC04"/>
  </svg>
);

// Apple Calendar icon component
const AppleCalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" fill="#FF3B30"/>
    <rect x="3" y="4" width="18" height="5" fill="#FF6961"/>
    <text x="12" y="17" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">31</text>
  </svg>
);

// 预约类型
type AppointmentType = 'voice' | 'video';

// 时间段
interface TimeSlot {
  time: string;
  available: boolean;
}

// 研究员信息
interface ResearcherInfo {
  id: string;
  name: string;
  avatar?: string;
  title: string;
  rating: number;
  specialties: string[];
  voicePrice: number; // 语音通话价格（能量）
  videoPrice: number; // 视频通话价格（能量）
}

// 预约信息
interface AppointmentData {
  researcherId: string;
  date: Date;
  time: string;
  type: AppointmentType;
  topic: string;
}

// Mock 研究员数据
const mockResearcher: ResearcherInfo = {
  id: 'r1',
  name: 'Alex Chen',
  avatar: undefined,
  title: '高级分析师',
  rating: 4.8,
  specialties: ['BTC', '技术分析', '量化策略'],
  voicePrice: 30,
  videoPrice: 50,
};

// 生成可用时间段
const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const currentHour = now.getHours();

  for (let hour = 9; hour <= 21; hour++) {
    // 如果是今天，过去的时间不可用
    const available = !isToday || hour > currentHour;
    // 随机设置一些时间段不可用（模拟已被预约）
    const randomUnavailable = Math.random() > 0.7;

    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      available: available && !randomUnavailable,
    });
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:30`,
      available: available && !randomUnavailable && Math.random() > 0.3,
    });
  }
  return slots;
};

// 获取本月日历数据
const getCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days: (number | null)[] = [];

  // 填充月初空白
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // 填充日期
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
};

interface AppointmentBookingProps {
  isOpen: boolean;
  onClose: () => void;
  researcher?: ResearcherInfo;
  onConfirm?: (appointment: AppointmentData) => void;
}

// 生成 Google Calendar URL
const generateGoogleCalendarUrl = (
  title: string,
  description: string,
  startDate: Date,
  startTime: string,
  durationMinutes: number = 30
): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const start = new Date(startDate);
  start.setHours(hours, minutes, 0, 0);

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    dates: `${formatDate(start)}/${formatDate(end)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// 生成 ICS 文件内容（用于 Apple Calendar 等）
const generateICSContent = (
  title: string,
  description: string,
  startDate: Date,
  startTime: string,
  durationMinutes: number = 30
): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const start = new Date(startDate);
  start.setHours(hours, minutes, 0, 0);

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SoDEX//Appointment//CN
BEGIN:VEVENT
UID:${Date.now()}@sodex.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${title}
DESCRIPTION:${description}
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Reminder: ${title}
END:VALARM
END:VEVENT
END:VCALENDAR`;
};

// 下载 ICS 文件
const downloadICSFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function AppointmentBooking({
  isOpen,
  onClose,
  researcher = mockResearcher,
  onConfirm
}: AppointmentBookingProps) {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const [step, setStep] = useState<'date' | 'time' | 'confirm' | 'success'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('voice');
  const [topic, setTopic] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    return getCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth]);

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlots(selectedDate);
  }, [selectedDate]);

  const price = appointmentType === 'voice' ? researcher.voicePrice : researcher.videoPrice;
  const energyAvailable = user?.energyAvailable || 0;
  const canAfford = energyAvailable >= price;

  if (!isOpen) return null;

  const handleDateSelect = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date >= today) {
      setSelectedDate(date);
      setSelectedTime(null);
      setStep('time');
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;

    const appointment: AppointmentData = {
      researcherId: researcher.id,
      date: selectedDate,
      time: selectedTime,
      type: appointmentType,
      topic,
    };

    onConfirm?.(appointment);
    setStep('success');
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const weekDays = t('booking.weekdays') as unknown as string[];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-3">
            {step !== 'date' && step !== 'success' && (
              <button
                onClick={() => setStep(step === 'confirm' ? 'time' : 'date')}
                className="p-1 hover:bg-[var(--bg-surface)] rounded-lg transition"
              >
                <ChevronLeft size={20} className="text-[var(--text-muted)]" />
              </button>
            )}
            <div>
              <h2 className="text-[16px] font-bold text-[var(--text-main)]">
                {step === 'success' ? t('booking.appointmentSuccess') : t('booking.book1v1')}
              </h2>
              <p className="text-[12px] text-[var(--text-muted)]">
                {step === 'date' && t('booking.selectDate')}
                {step === 'time' && t('booking.selectTime')}
                {step === 'confirm' && t('booking.confirmAppointment')}
                {step === 'success' && t('booking.requestSent')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-surface)] rounded-lg transition"
          >
            <X size={18} className="text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Researcher Info */}
        {step !== 'success' && (
          <div className="px-5 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-light)]">
            <div className="flex items-center gap-3">
              {researcher.avatar ? (
                <img src={researcher.avatar} alt={researcher.name} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--brand-yellow)] flex items-center justify-center text-black font-bold">
                  {researcher.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-[var(--text-main)]">{researcher.name}</span>
                  <span className="text-[12px] text-[var(--text-muted)]">{researcher.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Star size={12} className="text-[var(--brand-yellow)] fill-[var(--brand-yellow)]" />
                  <span className="text-[12px] text-[var(--text-muted)]">{researcher.rating}</span>
                  <span className="text-[12px] text-[var(--text-dim)]">·</span>
                  <span className="text-[12px] text-[var(--text-dim)]">{researcher.specialties.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Date Selection */}
          {step === 'date' && (
            <div>
              {/* Type Selection */}
              <div className="mb-5">
                <label className="text-[13px] text-[var(--text-muted)] mb-2 block">{t('booking.consultationType')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAppointmentType('voice')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${
                      appointmentType === 'voice'
                        ? 'border-[var(--brand-yellow)] bg-[var(--brand-yellow)]/10'
                        : 'border-[var(--border-light)] hover:border-[var(--text-dim)]'
                    }`}
                  >
                    <Phone size={18} className={appointmentType === 'voice' ? 'text-[var(--brand-yellow)]' : 'text-[var(--text-muted)]'} />
                    <div className="text-left">
                      <div className={`text-[14px] font-medium ${appointmentType === 'voice' ? 'text-[var(--brand-yellow)]' : 'text-[var(--text-main)]'}`}>
                        {t('booking.voiceCall')}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)] flex items-center gap-1">
                        <Zap size={10} />
                        {researcher.voicePrice} {t('booking.energyPer30min')}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setAppointmentType('video')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${
                      appointmentType === 'video'
                        ? 'border-[var(--brand-yellow)] bg-[var(--brand-yellow)]/10'
                        : 'border-[var(--border-light)] hover:border-[var(--text-dim)]'
                    }`}
                  >
                    <Video size={18} className={appointmentType === 'video' ? 'text-[var(--brand-yellow)]' : 'text-[var(--text-muted)]'} />
                    <div className="text-left">
                      <div className={`text-[14px] font-medium ${appointmentType === 'video' ? 'text-[var(--brand-yellow)]' : 'text-[var(--text-main)]'}`}>
                        {t('booking.videoCall')}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)] flex items-center gap-1">
                        <Zap size={10} />
                        {researcher.videoPrice} {t('booking.energyPer30min')}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Calendar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-[var(--bg-surface)] rounded transition"
                  >
                    <ChevronLeft size={18} className="text-[var(--text-muted)]" />
                  </button>
                  <span className="text-[14px] font-medium text-[var(--text-main)]">
                    {currentMonth.toLocaleDateString(locale, { year: 'numeric', month: 'long' })}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-[var(--bg-surface)] rounded transition"
                  >
                    <ChevronRight size={18} className="text-[var(--text-muted)]" />
                  </button>
                </div>

                {/* Week days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-[12px] text-[var(--text-dim)] py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => day && !isDateDisabled(day) && handleDateSelect(day)}
                      disabled={!day || isDateDisabled(day)}
                      className={`aspect-square flex items-center justify-center rounded-lg text-[13px] transition ${
                        !day
                          ? ''
                          : isDateDisabled(day)
                          ? 'text-[var(--text-dim)] cursor-not-allowed'
                          : selectedDate?.getDate() === day &&
                            selectedDate?.getMonth() === currentMonth.getMonth()
                          ? 'bg-[var(--brand-yellow)] text-black font-bold'
                          : 'text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Time Selection */}
          {step === 'time' && selectedDate && (
            <div>
              <div className="mb-4 p-3 bg-[var(--bg-surface)] rounded-lg">
                <div className="flex items-center gap-2 text-[13px]">
                  <Calendar size={14} className="text-[var(--brand-yellow)]" />
                  <span className="text-[var(--text-main)]">{formatDate(selectedDate)}</span>
                </div>
              </div>

              <label className="text-[13px] text-[var(--text-muted)] mb-3 block">{t('booking.selectTime')}</label>

              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                    className={`py-2.5 rounded-lg text-[13px] transition ${
                      !slot.available
                        ? 'bg-[var(--bg-surface)] text-[var(--text-dim)] cursor-not-allowed line-through'
                        : selectedTime === slot.time
                        ? 'bg-[var(--brand-yellow)] text-black font-medium'
                        : 'bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-highlight)]'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>

              {selectedTime && (
                <button
                  onClick={() => setStep('confirm')}
                  className="w-full mt-5 py-3 rounded-xl bg-[var(--brand-yellow)] text-black font-bold hover:opacity-90 transition"
                >
                  {t('common.next')}
                </button>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirm' && selectedDate && selectedTime && (
            <div>
              {/* Summary */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between p-3 bg-[var(--bg-surface)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[var(--text-muted)]" />
                    <span className="text-[13px] text-[var(--text-muted)]">{t('booking.date')}</span>
                  </div>
                  <span className="text-[14px] text-[var(--text-main)]">
                    {selectedDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', weekday: 'short' })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--bg-surface)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[var(--text-muted)]" />
                    <span className="text-[13px] text-[var(--text-muted)]">{t('booking.time')}</span>
                  </div>
                  <span className="text-[14px] text-[var(--text-main)]">{selectedTime}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--bg-surface)] rounded-lg">
                  <div className="flex items-center gap-2">
                    {appointmentType === 'voice' ? (
                      <Phone size={16} className="text-[var(--text-muted)]" />
                    ) : (
                      <Video size={16} className="text-[var(--text-muted)]" />
                    )}
                    <span className="text-[13px] text-[var(--text-muted)]">{t('booking.method')}</span>
                  </div>
                  <span className="text-[14px] text-[var(--text-main)]">
                    {appointmentType === 'voice' ? t('booking.voiceCall') : t('booking.videoCall')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--bg-surface)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-[var(--brand-yellow)]" />
                    <span className="text-[13px] text-[var(--text-muted)]">{t('booking.cost')}</span>
                  </div>
                  <span className="text-[14px] text-[var(--brand-yellow)] font-bold">{price} {t('booking.energy')}</span>
                </div>
              </div>

              {/* Topic */}
              <div className="mb-5">
                <label className="text-[13px] text-[var(--text-muted)] mb-2 block">
                  {t('booking.topic')} <span className="text-[var(--text-dim)]">({t('booking.optional')})</span>
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t('booking.topicPlaceholder')}
                  className="w-full p-3 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg text-[14px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] resize-none h-20 focus:outline-none focus:border-[var(--brand-yellow)]"
                />
              </div>

              {/* Energy Warning */}
              {!canAfford && (
                <div className="mb-4 p-3 bg-[var(--brand-red)]/10 border border-[var(--brand-red)]/30 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-[var(--brand-red)] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] text-[var(--brand-red)] font-medium">{t('booking.insufficientEnergy')}</div>
                    <div className="text-[12px] text-[var(--text-muted)]">
                      {t('booking.currentEnergy')} {energyAvailable}, {t('booking.need')} {price} {t('booking.energy')}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={!canAfford}
                className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                  canAfford
                    ? 'bg-[var(--brand-yellow)] text-black hover:opacity-90'
                    : 'bg-[var(--bg-surface)] text-[var(--text-dim)] cursor-not-allowed'
                }`}
              >
                <Check size={18} />
                {t('booking.confirmAppointment')}
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && selectedDate && selectedTime && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[var(--brand-green)]/20 flex items-center justify-center mx-auto mb-3">
                <Check size={28} className="text-[var(--brand-green)]" />
              </div>
              <h3 className="text-[17px] font-bold text-[var(--text-main)] mb-1">{t('booking.requestSent')}</h3>
              <p className="text-[13px] text-[var(--text-muted)] mb-4">
                {t('booking.waitingConfirmation')}
              </p>

              {/* 预约详情 */}
              <div className="p-3 bg-[var(--bg-surface)] rounded-xl mb-4">
                <div className="text-[12px] text-[var(--text-muted)] mb-1">{t('booking.appointmentDetails')}</div>
                <div className="text-[15px] text-[var(--text-main)] font-medium">
                  {selectedDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} {selectedTime}
                </div>
                <div className="text-[12px] text-[var(--text-muted)]">
                  {t('booking.callWith')} {researcher.name} · {appointmentType === 'voice' ? t('booking.voice') : t('booking.video')} · 30{t('booking.minutes')}
                </div>
              </div>

              {/* 添加到日历 */}
              <div className="mb-4">
                <div className="text-[12px] text-[var(--text-muted)] mb-2">{t('booking.addToCalendar')}</div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Google Calendar */}
                  <a
                    href={generateGoogleCalendarUrl(
                      `SoDEX: ${researcher.name}`,
                      `${t('booking.callWith')} ${researcher.name} · ${appointmentType === 'voice' ? t('booking.voice') : t('booking.video')}\n${t('booking.topic')}: ${topic || t('booking.notSpecified')}`,
                      selectedDate,
                      selectedTime
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] border border-[var(--border-light)] transition"
                  >
                    <GoogleCalendarIcon />
                    <span className="text-[12px] text-[var(--text-main)]">{t('booking.googleCalendar')}</span>
                  </a>

                  {/* Apple Calendar (ICS Download) */}
                  <button
                    onClick={() => {
                      const icsContent = generateICSContent(
                        `SoDEX: ${researcher.name}`,
                        `${t('booking.callWith')} ${researcher.name} · ${appointmentType === 'voice' ? t('booking.voice') : t('booking.video')}. ${t('booking.topic')}: ${topic || t('booking.notSpecified')}`,
                        selectedDate,
                        selectedTime
                      );
                      downloadICSFile(icsContent, `sodex-appointment-${researcher.name}.ics`);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-highlight)] border border-[var(--border-light)] transition"
                  >
                    <AppleCalendarIcon />
                    <span className="text-[12px] text-[var(--text-main)]">{t('booking.appleCalendar')}</span>
                  </button>
                </div>

                {/* 下载 ICS 文件 */}
                <button
                  onClick={() => {
                    const icsContent = generateICSContent(
                      `SoDEX: ${researcher.name}`,
                      `${t('booking.callWith')} ${researcher.name} · ${appointmentType === 'voice' ? t('booking.voice') : t('booking.video')}. ${t('booking.topic')}: ${topic || t('booking.notSpecified')}`,
                      selectedDate,
                      selectedTime
                    );
                    downloadICSFile(icsContent, `sodex-appointment-${researcher.name}.ics`);
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
                >
                  <Download size={14} />
                  {t('booking.downloadIcs')}
                </button>
              </div>

              {/* 邮件提醒 */}
              <div className="p-3 bg-[var(--bg-surface)] rounded-xl mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-[var(--brand-yellow)]" />
                    <div className="text-left">
                      <div className="text-[13px] text-[var(--text-main)]">{t('booking.emailReminder')}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{t('booking.emailReminderDesc')}</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-[var(--bg-highlight)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--brand-green)]"></div>
                  </label>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[var(--brand-yellow)] text-black font-bold hover:opacity-90 transition"
              >
                {t('booking.done')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
