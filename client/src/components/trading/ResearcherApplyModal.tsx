import { useState, useRef, useEffect } from 'react';
import { X, GraduationCap, Check, Briefcase, LineChart, Users } from 'lucide-react';

interface ResearcherApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResearcherApplyModal({ isOpen, onClose }: ResearcherApplyModalProps) {
  const [step, setStep] = useState<'intro' | 'form' | 'success'>('intro');
  const [formData, setFormData] = useState({
    name: '',
    expertise: '',
    experience: '',
    socialLink: '',
  });
  const modalRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setStep('intro');
      setFormData({ name: '', expertise: '', experience: '', socialLink: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // 模拟提交
    setStep('success');
  };

  const benefits = [
    { icon: LineChart, title: '发布研报', desc: '分享您的市场分析和投资观点' },
    { icon: Users, title: '1v1 咨询', desc: '为用户提供专属付费咨询服务' },
    { icon: Briefcase, title: '路演直播', desc: '主持在线路演，扩大影响力' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl w-full max-w-md overflow-hidden"
      >
        {step === 'intro' && (
          <>
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#1a2a3a] to-[var(--bg-panel)] p-6 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg transition"
              >
                <X size={18} className="text-[var(--text-muted)]" />
              </button>

              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--brand-yellow)] to-[#FF9500] flex items-center justify-center">
                <GraduationCap size={32} className="text-black" />
              </div>

              <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">
                成为 SoDEX 研究员
              </h2>
              <p className="text-[14px] text-[var(--text-muted)]">
                分享您的专业知识，获得丰厚回报
              </p>
            </div>

            {/* Benefits */}
            <div className="p-5">
              <div className="space-y-3 mb-6">
                {benefits.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-3 bg-[var(--bg-surface)] rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-[var(--brand-yellow)]/20 flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-[var(--brand-yellow)]" />
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-[var(--text-main)]">{title}</div>
                      <div className="text-[12px] text-[var(--text-muted)]">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Requirements */}
              <div className="mb-6 p-4 bg-[var(--bg-surface)] rounded-lg">
                <div className="text-[13px] font-medium text-[var(--text-main)] mb-2">申请条件</div>
                <ul className="text-[12px] text-[var(--text-muted)] space-y-1">
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-[var(--brand-green)]" />
                    <span>2年以上加密货币研究/交易经验</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-[var(--brand-green)]" />
                    <span>有公开的分析作品或社交媒体账号</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-[var(--brand-green)]" />
                    <span>能够定期产出高质量内容</span>
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <button
                onClick={() => setStep('form')}
                className="w-full py-3 bg-gradient-to-r from-[var(--brand-yellow)] to-[#FF9500] text-black rounded-xl font-bold text-[15px] hover:opacity-90 transition"
              >
                开始申请
              </button>
            </div>
          </>
        )}

        {step === 'form' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
              <h2 className="text-[16px] font-bold text-[var(--text-main)]">填写申请信息</h2>
              <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg-surface)] rounded-lg transition">
                <X size={18} className="text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] text-[var(--text-muted)] mb-1.5">姓名/昵称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="您的称呼"
                  className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg text-[14px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--brand-yellow)]"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[var(--text-muted)] mb-1.5">专业领域 *</label>
                <select
                  value={formData.expertise}
                  onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg text-[14px] text-[var(--text-main)] focus:outline-none focus:border-[var(--brand-yellow)]"
                >
                  <option value="">请选择</option>
                  <option value="technical">技术分析</option>
                  <option value="fundamental">基本面分析</option>
                  <option value="defi">DeFi 研究</option>
                  <option value="macro">宏观经济</option>
                  <option value="onchain">链上数据分析</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] text-[var(--text-muted)] mb-1.5">从业经验 *</label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="简要介绍您的加密货币研究/交易经验..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg text-[14px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--brand-yellow)] resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[var(--text-muted)] mb-1.5">社交媒体/作品链接</label>
                <input
                  type="text"
                  value={formData.socialLink}
                  onChange={(e) => setFormData({ ...formData, socialLink: e.target.value })}
                  placeholder="Twitter/Medium/公众号等"
                  className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg text-[14px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--brand-yellow)]"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.expertise || !formData.experience}
                className="w-full py-3 bg-[var(--brand-green)] text-white rounded-xl font-bold text-[15px] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交申请
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            {/* Success */}
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--brand-green)] flex items-center justify-center">
                <Check size={40} className="text-white" />
              </div>

              <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">
                申请已提交！
              </h2>
              <p className="text-[14px] text-[var(--text-muted)] mb-6">
                我们会在 3 个工作日内通过 Telegram 联系您
              </p>

              <div className="p-4 bg-[var(--bg-surface)] rounded-lg mb-6">
                <div className="text-[13px] text-[var(--text-muted)]">
                  请确保您的 Telegram 账号 <span className="text-[var(--brand-yellow)]">@SoDEX</span> 可以正常接收消息
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-[var(--bg-surface)] text-[var(--text-main)] rounded-xl font-medium text-[15px] hover:bg-[var(--bg-highlight)] transition"
              >
                关闭
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
