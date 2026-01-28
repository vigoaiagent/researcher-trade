import { useState } from 'react';
import { ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import { mockUsers } from '../../data/mockCommunity';

interface NewResearchersCarouselProps {
  onUserClick: (userId: string) => void;
}

export function NewResearchersCarousel({ onUserClick }: NewResearchersCarouselProps) {
  const [startIndex, setStartIndex] = useState(0);

  // 筛选新晋研究员
  const newResearchers = mockUsers.filter(user => user.isNew && user.isResearcher);

  // 每次显示3个
  const visibleCount = 3;
  const canGoLeft = startIndex > 0;
  const canGoRight = startIndex + visibleCount < newResearchers.length;

  const handlePrev = () => {
    if (canGoLeft) {
      setStartIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (canGoRight) {
      setStartIndex(prev => prev + 1);
    }
  };

  const visibleResearchers = newResearchers.slice(startIndex, startIndex + visibleCount);

  if (newResearchers.length === 0) return null;

  return (
    <div className="px-4 py-4 border-b border-[var(--border-light)] bg-[var(--bg-panel)]">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-[var(--brand-yellow)]">💡</span>
          <span className="text-[13px] font-bold text-[var(--text-main)]">新晋研究员</span>
        </div>

        {/* 翻页按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            disabled={!canGoLeft}
            className={`p-1.5 rounded-lg transition ${
              canGoLeft
                ? 'hover:bg-[var(--bg-surface)] text-[var(--text-main)]'
                : 'text-[var(--text-dim)] cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoRight}
            className={`p-1.5 rounded-lg transition ${
              canGoRight
                ? 'hover:bg-[var(--bg-surface)] text-[var(--text-main)]'
                : 'text-[var(--text-dim)] cursor-not-allowed'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 研究员卡片 */}
      <div className="grid grid-cols-3 gap-3">
        {visibleResearchers.map((researcher) => (
          <button
            key={researcher.id}
            onClick={() => onUserClick(researcher.id)}
            className="flex flex-col items-center p-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-app)] transition border border-[var(--border-light)] hover:border-[var(--brand-yellow)] text-left"
          >
            {/* 头像 */}
            <div className="relative mb-2">
              <img
                src={researcher.avatar}
                alt={researcher.username}
                className="w-12 h-12 rounded-full"
              />
              {researcher.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-[var(--bg-panel)] rounded-full p-0.5">
                  <BadgeCheck size={14} className="text-[var(--brand-yellow)]" />
                </div>
              )}
            </div>

            {/* 用户名 */}
            <span className="text-[12px] font-medium text-[var(--text-main)] truncate w-full text-center mb-1">
              {researcher.username}
            </span>

            {/* 认证标签 */}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--brand-yellow)]/10 text-[var(--brand-yellow)] truncate w-full text-center">
              {researcher.certificationLabel || '研究员'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
