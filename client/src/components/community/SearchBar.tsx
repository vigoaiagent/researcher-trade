import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = '搜索观点、研究员...' }: SearchBarProps) {
  return (
    <div className="px-4 py-3 border-b border-[var(--border-light)] bg-[var(--bg-panel)]">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] rounded-lg text-[14px] text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-yellow)] transition"
        />
      </div>
    </div>
  );
}
