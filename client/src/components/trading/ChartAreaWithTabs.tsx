import { useState } from 'react';
import { ChartArea } from './ChartArea';
import { ChartTabs } from './ChartTabs';
import { CommunityPanel } from '../community';

interface ChartAreaWithTabsProps {
  price: number;
  symbol?: string;
}

export function ChartAreaWithTabs({ price, symbol }: ChartAreaWithTabsProps) {
  const [activeTab, setActiveTab] = useState<'chart' | 'info' | 'community'>('chart');
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);

  const handleTabChange = (tab: 'chart' | 'info' | 'community') => {
    if (tab === 'community') {
      // 点击 Community Tab 时打开浮动面板
      setIsCommunityOpen(true);
      // 不改变 activeTab，保持在 chart
    } else {
      setActiveTab(tab);
      setIsCommunityOpen(false);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-[var(--bg-app)] relative">
        {/* Tab Navigation */}
        <ChartTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Tab Content - Chart 始终可见 */}
        {activeTab === 'chart' && (
          <ChartArea price={price} symbol={symbol} />
        )}

        {activeTab === 'info' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[var(--text-muted)] text-sm">Info Coming Soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Community 浮动面板 */}
      <CommunityPanel
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
        currentSymbol={symbol}
      />
    </>
  );
}
