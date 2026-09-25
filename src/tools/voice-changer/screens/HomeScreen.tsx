import { useRef, useState } from 'react';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { Icon, type IconName } from '../../../components/Icon';
import { hapticTap, hapticWarning } from '../../../haptics';
import { decodeBlob } from '../playback';
import type { VcApi, VcScreenName } from '../types';

const TILES: { id: VcScreenName; label: string; desc: string; icon: IconName }[] = [
  { id: 'effects', label: 'Voice Effects', desc: 'Fun & creative voices', icon: 'zap' },
  { id: 'autotune', label: 'Auto-Tune', desc: 'Pitch correction & singing', icon: 'music' },
  { id: 'pitch-speed', label: 'Pitch & Speed', desc: 'Change pitch and speed', icon: 'sliders' },
  { id: 'echo-reverb', label: 'Echo & Reverb', desc: 'Studio effects', icon: 'repeat' },
  { id: 'mixer', label: 'Voice Mixer', desc: 'Combine effects', icon: 'sliders' },
  { id: 'history', label: 'History', desc: 'Your saved clips', icon: 'clock' },
];

export function HomeScreen({ api }: { api: VcApi }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function openTile(id: VcScreenName) {
    hapticTap();
    if (id === 'history') {
      api.goto('history');
      return;
    }
    if (!api.original) {
      api.setPendingScreen(id);
      api.goto('record');
      return;
    }
    api.goto(id);
  }

  function startRecording() {
    hapticTap();
    api.setPendingScreen('effects');
    api.goto('record');
  }

  function triggerImport() {
    hapticTap();
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError(null);
    try {
      const buffer = await decodeBlob(file);
      api.setOriginal(buffer);
      api.goto('effects');
    } catch {
      hapticWarning();
      setImportError("Couldn't read that file — try a different audio file.");
    }
  }

  return (
    <div className="screen">
      <ScreenHeader title="Voice Changer" subtitle="Transform your voice instantly" onBack={api.popBack} />

      <div className="vch__body">
        {importError && (
          <div className="vch__error">
            <Icon name="info" size={16} />
            <span>{importError}</span>
          </div>
        )}

        <div className="vch__hero">
          <span className="vch__hero-icon">
            <Icon name="mic" size={34} />
          </span>
          <p className="vch__hero-text">Record, transform, and share your voice</p>
        </div>

        <button type="button" className="vch__cta vch__cta--primary" onClick={startRecording}>
          <Icon name="mic" size={20} />
          <span>
            <strong>Record Voice</strong>
            <small>Tap to start recording</small>
          </span>
        </button>

        <button type="button" className="vch__cta vch__cta--secondary" onClick={triggerImport}>
          <Icon name="file" size={20} />
          <span>
            <strong>Import Audio</strong>
            <small>Choose from your device</small>
          </span>
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*" className="vch__file-input" onChange={(e) => void handleFileChange(e)} />

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
