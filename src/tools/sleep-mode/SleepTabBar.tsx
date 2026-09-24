import { Icon, type IconName } from '../../components/Icon';
import { hapticSelect } from '../../haptics';
import './SleepMode.css';

export type SleepTab = 'main' | 'sleep-insights' | 'sleep-sounds' | 'ai';

const TABS: { id: SleepTab; label: string; icon: IconName }[] = [
  { id: 'main', label: 'Home', icon: 'home' },
  { id: 'sleep-insights', label: 'Insights', icon: 'trending-up' },
  { id: 'sleep-sounds', label: 'Sounds', icon: 'music' },
  { id: 'ai', label: 'AI', icon: 'cpu' },
];

interface SleepTabBarProps {
  active: SleepTab;
  onSelect: (tab: SleepTab) => void;
}

export function SleepTabBar({ active, onSelect }: SleepTabBarProps) {
  return (
    <nav className="sm__tabbar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`sm__tabbar-item${active === tab.id ? ' sm__tabbar-item--active' : ''}`}
          onClick={() => {
            hapticSelect();
            onSelect(tab.id);
          }}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <span className="sm__tabbar-icon-wrap">
            <Icon name={tab.icon} size={21} />
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
