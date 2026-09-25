import { useRef, useState } from 'react';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { Icon, type IconName } from '../../../components/Icon';
import { hapticTap, hapticWarning } from '../../../haptics';
import { decodeBlob } from '../playback';
import { HeroMic } from '../HeroMic';
import type { VcApi, VcScreenName } from '../types';

/** Blue -> purple -> pink across the bar count, so the continuous waveform reads as one smooth
 *  gradient sweep rather than repeating three flat colors. */
function waveBarColor(i: number, count: number): string {
  const t = i / (count - 1);
  return t < 0.5
    ? `color-mix(in srgb, var(--purple) ${Math.round(t * 200)}%, var(--blue))`
    : `color-mix(in srgb, var(--pink) ${Math.round((t - 0.5) * 200)}%, var(--purple))`;
}

const WAVE_BAR_COUNT = 22;
const WAVE_HEIGHTS = [0.3, 0.55, 0.8, 0.5, 0.9, 0.35, 0.7, 1, 0.45, 0.85, 0.6, 0.6, 0.85, 0.45, 1, 0.7, 0.35, 0.9, 0.5, 0.8, 0.55, 0.3];

const TILES: { id: VcScreenName; label: string; desc: string; icon: IconName; color: string }[] = [
  { id: 'effects', label: 'Voice Effects', desc: 'Fun & creative voices', icon: 'zap', color: '#3b82f6' },
  { id: 'autotune', label: 'Auto-Tune', desc: 'Pitch correction & singing', icon: 'music', color: '#ec4899' },
  { id: 'pitch-speed', label: 'Pitch & Speed', desc: 'Change pitch and speed', icon: 'sliders', color: '#14b8a6' },
  { id: 'echo-reverb', label: 'Echo & Reverb', desc: 'Studio effects', icon: 'repeat', color: '#8b5cf6' },
  { id: 'mixer', label: 'Voice Mixer', desc: 'Combine effects', icon: 'sliders', color: '#f97316' },
  { id: 'tools', label: 'More Tools', desc: 'Browse everything', icon: 'more-dots', color: '#64748b' },
];

export function HomeScreen({ api }: { api: VcApi }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function openTile(id: VcScreenName) {
    hapticTap();
    if (id === 'tools') {
      api.goto('tools');
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

      <div className="vch__body vch__body--with-tabbar">
        {importError && (
          <div className="vch__error">
            <Icon name="info" size={16} />
            <span>{importError}</span>
          </div>
        )}

        <div className="vch__hero">
          <div className="vch__hero-glow" />
          <div className="vch__hero-visual">
            <div className="vch__hero-wave" aria-hidden="true">
              {WAVE_HEIGHTS.map((peak, i) => (
                <span
                  key={i}
                  style={
                    {
                      '--d': `${(i * 0.9) % 1.6}s`,
                      '--peak': `${Math.round(peak * 100)}%`,
                      '--bar-color': waveBarColor(i, WAVE_BAR_COUNT),
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
            <div className="vch__hero-mic-wrap">
              <div className="vch__hero-mic-circle">
                <HeroMic size={52} />
              </div>
            </div>
          </div>
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
