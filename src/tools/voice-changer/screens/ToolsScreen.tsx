import { ScreenHeader } from '../../../components/ScreenHeader';
import { Icon, type IconName } from '../../../components/Icon';
import { hapticTap } from '../../../haptics';
import type { VcApi, VcScreenName } from '../types';

const TILES: { id: VcScreenName; label: string; desc: string; icon: IconName }[] = [
  { id: 'effects', label: 'Voice Effects', desc: 'Fun & creative voices', icon: 'zap' },
  { id: 'autotune', label: 'Auto-Tune', desc: 'Pitch correction & singing', icon: 'music' },
  { id: 'pitch-speed', label: 'Pitch & Speed', desc: 'Change pitch and speed', icon: 'sliders' },
  { id: 'echo-reverb', label: 'Echo & Reverb', desc: 'Studio effects', icon: 'repeat' },
  { id: 'mixer', label: 'Voice Mixer', desc: 'Combine effects', icon: 'sliders' },
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
            <button key={t.id} type="button" className="vch__tile" onClick={() => openTile(t.id)}>
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
