import { useState } from 'react';
import type { PKData } from '../../types/community';

interface PKWidgetProps {
  pk: PKData;
  onVote?: (side: 'left' | 'right') => void;
}

export function PKWidget({ pk, onVote }: PKWidgetProps) {
  const [localVotedSide, setLocalVotedSide] = useState(pk.votedSide);
  const { question, leftOption, rightOption, totalVotes, endTime } = pk;
  const votedSide = localVotedSide;

  const formatTimeLeft = () => {
    if (!endTime) return '';
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    if (diff <= 0) return '已结束';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `剩余${days}天`;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `剩余${hours}小时`;

    const minutes = Math.floor(diff / (1000 * 60));
    return `剩余${minutes}分钟`;
  };

  const handleVote = (side: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!votedSide) {
      setLocalVotedSide(side);
      onVote?.(side);
    }
  };

  return (
    <div
      className="mt-3 rounded-xl p-4"
      style={{ backgroundColor: 'var(--bg-app)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 问题标题 - 醒目的红橙色 */}
      <h4 className="text-[15px] font-bold leading-snug mb-4" style={{ color: '#E8533F' }}>
        {question}
      </h4>

      {/* 百分比进度条 */}
      <div className="mb-4">
        {/* 百分比数字 */}
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[13px] font-bold" style={{ color: '#4A9EFF' }}>
            {leftOption.percentage}%
          </span>
          <span className="text-[13px] font-bold" style={{ color: '#FF8A00' }}>
            {rightOption.percentage}%
          </span>
        </div>
        {/* 进度条 */}
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          <div
            className="rounded-full transition-all duration-500"
            style={{
              width: `${leftOption.percentage}%`,
              backgroundColor: '#4A9EFF',
            }}
          />
          <div
            className="rounded-full transition-all duration-500"
            style={{
              width: `${rightOption.percentage}%`,
              backgroundColor: '#FF8A00',
            }}
          />
        </div>
      </div>

      {/* 选项按钮 */}
      <div className="flex gap-3 mb-3">
        {/* 左侧选项 - 蓝色 */}
        <button
          onClick={(e) => handleVote('left', e)}
          disabled={!!votedSide}
          className={`flex-1 py-3 px-4 rounded-full text-[14px] font-medium transition-all truncate ${
            votedSide === 'left'
              ? 'ring-2 ring-white/30 scale-[1.02]'
              : votedSide
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:opacity-90 hover:scale-[1.02] active:scale-95'
          }`}
          style={{
            backgroundColor: '#4A9EFF',
            color: '#fff',
          }}
        >
          {leftOption.text}
        </button>

        {/* 右侧选项 - 橙色 */}
        <button
          onClick={(e) => handleVote('right', e)}
          disabled={!!votedSide}
          className={`flex-1 py-3 px-4 rounded-full text-[14px] font-medium transition-all truncate ${
            votedSide === 'right'
              ? 'ring-2 ring-white/30 scale-[1.02]'
              : votedSide
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:opacity-90 hover:scale-[1.02] active:scale-95'
          }`}
          style={{
            backgroundColor: '#FF8A00',
            color: '#fff',
          }}
        >
          {rightOption.text}
        </button>
      </div>

      {/* 统计信息 */}
      <div className="text-[12px] text-[var(--text-muted)]">
        {totalVotes} 人参与 · {formatTimeLeft()}
      </div>
    </div>
  );
}
