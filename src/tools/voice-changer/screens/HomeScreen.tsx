import { useRef, useState } from 'react';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { Icon } from '../../../components/Icon';
import { hapticTap, hapticWarning } from '../../../haptics';
import { decodeBlob } from '../playback';
import { heroMicrophone, TILE_IMAGES } from '../../../assets/voice-changer';
import { TILE_IMAGES_LIGHT } from '../../../assets/voice-changer/lightIndex';
import { useIsLightTheme } from '../../../theme/useTheme';
import type { VcApi, VcScreenName } from '../types';

const TILES: { id: VcScreenName; label: string; desc: string; color: string }[] = [
  { id: 'effects', label: 'Voice Effects', desc: 'Fun & creative voices', color: '#3b82f6' },
  { id: 'autotune', label: 'Auto-Tune', desc: 'Pitch correction & singing', color: '#ec4899' },
  { id: 'pitch-speed', label: 'Pitch & Speed', desc: 'Change pitch and speed', color: '#14b8a6' },
  { id: 'echo-reverb', label: 'Echo & Reverb', desc: 'Studio effects', color: '#8b5cf6' },
  { id: 'mixer', label: 'Voice Mixer', desc: 'Combine effects', color: '#f97316' },
  { id: 'tools', label: 'More Tools', desc: 'Browse everything', color: '#64748b' },
];

export function HomeScreen({ api }: { api: VcApi }) {
  const isLight = useIsLightTheme();
  const tileImages = isLight ? TILE_IMAGES_LIGHT : TILE_IMAGES;
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
      <ScreenHeader
        title={
          <>
            Voice <span className="vch__title-accent">Changer</span>
          </>
        }
        subtitle="Transform your voice instantly"
        onBack={api.popBack}
      />

      <div className="vch__body vch__body--with-tabbar">
        {importError && (
          <div className="vch__error">
            <Icon name="info" size={16} />
            <span>{importError}</span>
          </div>
        )}

        <div className="vch__hero">
          <div className="vch__hero-glow" />
          <img className="vch__hero-image" src={heroMicrophone} alt="" />
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
                <img src={tileImages[t.id]} alt="" />
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
