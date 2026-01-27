import type { CoinSentiment } from '../../types/community';

interface CoinSentimentBarProps {
  sentiment: CoinSentiment;
}

export function CoinSentimentBar({ sentiment }: CoinSentimentBarProps) {
  const { bullishPercent, neutralPercent, bearishPercent, mentionCount, topAvatars } = sentiment;

  return (
    <div className="px-4 py-3 bg-[var(--bg-surface)] border-t border-[var(--border-light)]">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium text-[var(--text-main)]">热门观点分析</span>
        <div className="flex items-center gap-1.5">
          {/* 头像组 */}
          <div className="flex -space-x-2">
            {topAvatars.slice(0, 3).map((avatar, index) => (
              <img
                key={index}
                src={avatar}
                alt=""
                className="w-5 h-5 rounded-full border border-[var(--bg-surface)]"
              />
            ))}
          </div>
          <span className="text-[12px] text-[var(--text-muted)]">
            {mentionCount.toLocaleString()} 提及过
          </span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="h-2 rounded-full overflow-hidden flex bg-[var(--bg-app)]">
        {/* 看涨 - 绿色 */}
        <div
          className="h-full bg-[#0ECB81] transition-all duration-300"
          style={{ width: `${bullishPercent}%` }}
        />
        {/* 中立 - 灰色 */}
        <div
          className="h-full bg-[#848E9C] transition-all duration-300"
          style={{ width: `${neutralPercent}%` }}
        />
        {/* 看跌 - 粉色 */}
        <div
          className="h-full bg-[#F6465D] transition-all duration-300"
          style={{ width: `${bearishPercent}%` }}
        />
      </div>

      {/* 比例文字 */}
      <div className="flex items-center gap-4 mt-2 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0ECB81]" />
          <span className="text-[var(--text-muted)]">{bullishPercent}% 看涨</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#848E9C]" />
          <span className="text-[var(--text-muted)]">{neutralPercent}% 中立</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#F6465D]" />
          <span className="text-[var(--text-muted)]">{bearishPercent}% 看跌</span>
        </div>
      </div>
    </div>
  );
}
