import type { UserLevel } from '../../types';

// 等级对应的猫颜色
const LEVEL_COLORS: Record<UserLevel, string> = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Diamond: '#b9f2ff',
};

interface RoboCatIconProps {
  size?: number;
  level?: UserLevel;
  animated?: boolean;
}

export function RoboCatIcon({ size = 40, level, animated = false }: RoboCatIconProps) {
  // 如果指定了 level，使用对应颜色；否则使用默认绿色
  const catColor = level ? LEVEL_COLORS[level] : 'var(--brand-green)';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`cat-avatar ${animated ? 'cat-animated' : ''}`}>
      {/* Glow */}
      <circle cx="50" cy="50" r="45" fill={catColor} opacity="0.2" />
      <circle cx="50" cy="50" r="35" fill="var(--bg-panel)" stroke={catColor} strokeWidth="3" />

      {/* Ears */}
      <path d="M30 35 L20 20 L40 28 Z" fill="var(--bg-panel)" stroke={catColor} strokeWidth="2" />
      <path d="M70 35 L80 20 L60 28 Z" fill="var(--bg-panel)" stroke={catColor} strokeWidth="2" />

      {/* Face Screen */}
      <rect x="30" y="40" width="40" height="25" rx="5" fill="#000" />

      {/* Eyes */}
      <g className="cat-eye">
        <rect x="35" y="48" width="10" height="8" rx="2" fill={catColor} />
        <rect x="55" y="48" width="10" height="8" rx="2" fill={catColor} />
      </g>

      {/* Mouth */}
      <path d="M45 58 Q50 62 55 58" stroke={catColor} strokeWidth="1.5" fill="none" opacity="0.8" />

      {/* Antenna */}
      <line x1="50" y1="20" x2="50" y2="10" stroke="var(--text-muted)" strokeWidth="2" />
      <circle cx="50" cy="10" r="3" fill="var(--brand-red)" className="status-dot-pulse" />
    </svg>
  );
}
