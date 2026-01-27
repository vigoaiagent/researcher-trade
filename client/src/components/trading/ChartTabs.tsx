interface ChartTabsProps {
  activeTab: 'chart' | 'info' | 'community';
  onTabChange: (tab: 'chart' | 'info' | 'community') => void;
}

export function ChartTabs({ activeTab, onTabChange }: ChartTabsProps) {
  const tabs = [
    { id: 'chart' as const, label: 'Chart' },
    { id: 'info' as const, label: 'Info' },
    { id: 'community' as const, label: 'Community' },
  ];

  return (
    <div className="h-10 border-b border-[var(--border-light)] flex items-center px-4 bg-[var(--bg-app)]">
      <div className="flex gap-6 text-[13px] font-medium">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-2 -mb-[1px] transition-colors ${
              activeTab === tab.id
                ? 'text-[var(--text-main)] border-b-2 border-[var(--brand-yellow)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
