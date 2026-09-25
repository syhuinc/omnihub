import { Icon, type IconName } from '../../components/Icon';
import { hapticSelect } from '../../haptics';
import type { VcScreenName } from './types';

export type VcTab = Extract<VcScreenName, 'home' | 'tools' | 'history' | 'saved'>;

const TABS: { id: VcTab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'tools', label: 'Tools', icon: 'sliders' },
  { id: 'history', label: 'History', icon: 'clock' },
  { id: 'saved', label: 'Saved', icon: 'bookmark' },
];

export function VoiceChangerTabBar({ active, onSelect }: { active: VcTab; onSelect: (tab: VcTab) => void }) {
  return (
    <nav className="vch__tabbar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`vch__tabbar-item${active === tab.id ? ' vch__tabbar-item--active' : ''}`}
          onClick={() => {
            hapticSelect();
            onSelect(tab.id);
          }}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <span className="vch__tabbar-icon-wrap">
            <Icon name={tab.icon} size={21} />
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
