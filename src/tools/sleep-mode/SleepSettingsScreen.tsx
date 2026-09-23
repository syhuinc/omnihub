import type { CSSProperties } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { hapticSelect } from '../../haptics';

export type SettingsDestination = 'ai-personality' | 'personalization' | 'reminder-example' | 'sleep-mode-ai';

interface MenuRow {
  screen: SettingsDestination;
  icon: string;
  label: string;
  desc: string;
  color: string;
  badge?: 'pro';
}

const MENU_ROWS: MenuRow[] = [
  { screen: 'ai-personality', icon: 'user', label: 'AI Personality', desc: 'Choose how you want to be reminded', color: 'var(--purple)' },
  { screen: 'personalization', icon: 'settings', label: 'Personalization', desc: 'Make your sleep companion more you', color: 'var(--pink)' },
  { screen: 'reminder-example', icon: 'note', label: 'Reminder Example', desc: 'See different messages in action', color: 'var(--blue)' },
  { screen: 'sleep-mode-ai', icon: 'crown', label: 'Sleep Mode AI', desc: 'Take it to the next level', color: '#f6c453', badge: 'pro' },
];

interface SleepSettingsScreenProps {
  onBack: () => void;
  onNavigate: (screen: SettingsDestination) => void;
}

export function SleepSettingsScreen({ onBack, onNavigate }: SleepSettingsScreenProps) {
  return (
    <div className="screen">
      <ScreenHeader title="Settings" subtitle="Sleep Mode preferences" onBack={onBack} />

      <div className="sm__body">
        <div className="sm__menu-list">
          {MENU_ROWS.map((row) => (
            <button
              key={row.screen}
              type="button"
              className="sm__menu-row"
              onClick={() => {
                hapticSelect();
                onNavigate(row.screen);
              }}
            >
              <span className="sm__menu-icon" style={{ '--menu-color': row.color } as CSSProperties}>
                <Icon name={row.icon as never} size={17} />
              </span>
              <span className="sm__menu-text">
                <span className="sm__menu-label-row">
                  <strong>{row.label}</strong>
                  {row.badge === 'pro' && <span className="sm__badge sm__badge--pro">PRO</span>}
                </span>
                <span>{row.desc}</span>
              </span>
              <Icon name="chevron-right" size={16} className="sm__time-chevron" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
