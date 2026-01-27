import { useState } from 'react';
import { Check } from 'lucide-react';
import type { PollData } from '../../types/community';

interface PollWidgetProps {
  poll: PollData;
  onVote?: (optionId: string) => void;
}

export function PollWidget({ poll, onVote }: PollWidgetProps) {
  const [localVotedOptionId, setLocalVotedOptionId] = useState(poll.votedOptionId);
  const { question, options, totalVotes, endTime, pollType } = poll;
  const votedOptionId = localVotedOptionId;

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

  // Yes/No 类型投票
  if (pollType === 'yesno') {
    const yesOption = options[0];
    const noOption = options[1];
    const yesPercentage = yesOption.percentage;
    const noPercentage = noOption.percentage;

    return (
      <div className="mt-3 p-4 rounded-lg bg-[var(--bg-app)] border border-[var(--border-light)]">
        <h4 className="text-[var(--text-main)] font-medium text-[14px] mb-3">{question}</h4>

        {/* 进度条 */}
        <div className="flex h-2 mb-3 rounded-full overflow-hidden">
          <div
            className="bg-[#4A9EFF]"
            style={{ width: `${yesPercentage}%` }}
          />
          <div
            className="bg-[#FF9966]"
            style={{ width: `${noPercentage}%` }}
          />
        </div>

        {/* YES/NO 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!votedOptionId) {
                setLocalVotedOptionId(yesOption.id);
                onVote?.(yesOption.id);
              }
            }}
            disabled={!!votedOptionId}
            className={`flex-1 py-3 rounded-lg font-medium text-[14px] transition ${
              votedOptionId === yesOption.id
                ? 'bg-[#4A9EFF] text-white'
                : votedOptionId
                ? 'bg-[#2A2A2A] text-[var(--text-dim)] cursor-not-allowed'
                : 'bg-[#4A9EFF] text-white hover:opacity-90'
            }`}
          >
            <div>YES</div>
            <div className="text-[12px] mt-1">{yesPercentage}%</div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!votedOptionId) {
                setLocalVotedOptionId(noOption.id);
                onVote?.(noOption.id);
              }
            }}
            disabled={!!votedOptionId}
            className={`flex-1 py-3 rounded-lg font-medium text-[14px] transition ${
              votedOptionId === noOption.id
                ? 'bg-[#FF9966] text-white'
                : votedOptionId
                ? 'bg-[#2A2A2A] text-[var(--text-dim)] cursor-not-allowed'
                : 'bg-[#FF9966] text-white hover:opacity-90'
            }`}
          >
            <div>NO</div>
            <div className="text-[12px] mt-1">{noPercentage}%</div>
          </button>
        </div>

        {/* 统计信息 */}
        <div className="mt-3 text-[var(--text-muted)] text-[12px]">
          {totalVotes} 人参与 · {formatTimeLeft()}
        </div>
      </div>
    );
  }

  // 单选类型投票
  return (
    <div className="mt-3 p-4 rounded-lg bg-[var(--bg-app)] border border-[var(--border-light)]">
      <h4 className="text-[var(--text-main)] font-medium text-[14px] mb-3">{question}</h4>

      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={(e) => {
              e.stopPropagation();
              if (!votedOptionId) {
                setLocalVotedOptionId(option.id);
                onVote?.(option.id);
              }
            }}
            disabled={!!votedOptionId}
            className={`w-full px-4 py-3 rounded-lg text-left transition ${
              votedOptionId === option.id
                ? 'bg-[#4A9EFF] bg-opacity-20 border border-[#4A9EFF]'
                : votedOptionId
                ? 'bg-[var(--bg-surface)] cursor-not-allowed'
                : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {votedOptionId === option.id && (
                  <Check size={14} className="text-[#4A9EFF]" />
                )}
                <span className="text-[var(--text-main)] text-[13px]">{option.text}</span>
              </div>
              <span className="text-[var(--text-main)] text-[13px] font-medium">
                {option.percentage}%
              </span>
            </div>
            {/* 进度条 */}
            {votedOptionId && (
              <div className="h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4A9EFF] rounded-full transition-all"
                  style={{ width: `${option.percentage}%` }}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 统计信息 */}
      <div className="mt-3 text-[var(--text-muted)] text-[12px]">
        {totalVotes} 人参与 · {formatTimeLeft()}
      </div>
    </div>
  );
}
