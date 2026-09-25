import { ScreenHeader } from '../../../components/ScreenHeader';
import { Icon, type IconName } from '../../../components/Icon';
import { hapticTap } from '../../../haptics';
import type { VcApi, VcScreenName } from '../types';

const TILES: { id: VcScreenName; label: string; desc: string; icon: IconName; color: string }[] = [
  { id: 'effects', label: 'Voice Effects', desc: 'Fun & creative voices', icon: 'zap', color: '#3b82f6' },
  { id: 'autotune', label: 'Auto-Tune', desc: 'Pitch correction & singing', icon: 'music', color: '#ec4899' },
  { id: 'pitch-speed', label: 'Pitch & Speed', desc: 'Change pitch and speed', icon: 'sliders', color: '#14b8a6' },
  { id: 'echo-reverb', label: 'Echo & Reverb', desc: 'Studio effects', icon: 'repeat', color: '#8b5cf6' },
  { id: 'mixer', label: 'Voice Mixer', desc: 'Combine effects', icon: 'sliders', color: '#f97316' },
];

export function ToolsScreen({ api }: { api: VcApi }) {
  function openTile(id: VcScreenName) {
    hapticTap();
    if (!api.original) {
      api.setPendingScreen(id);
      api.goto('record');
      return;
    }
    api.goto(id);
  }

  return (
    <div className="screen">
      <ScreenHeader title="Tools" subtitle="Every way to transform your voice" onBack={api.popBack} />
      <div className="vch__body vch__body--with-tabbar">
        <div className="vch__tile-grid">
          {TILES.map((t) => (
            <button key={t.id} type="button" className="vch__tile" onClick={() => openTile(t.id)} style={{ '--tile-color': t.color } as React.CSSProperties}>
              <span className="vch__tile-icon">
                <Icon name={t.icon} size={20} />
              </span>
              <strong>{t.label}</strong>
              <small>{t.desc}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
