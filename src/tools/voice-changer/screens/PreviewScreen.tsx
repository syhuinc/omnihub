import { useState } from 'react';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { Icon } from '../../../components/Icon';
import { hapticTap, hapticSuccess } from '../../../haptics';
import { audioBufferToWav } from '../audioEffects';
import { playBuffer, stopPlayback } from '../playback';
import { saveClip, type SavedClip } from '../clipStorage';
import type { VcApi } from '../types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ClipRow({ label, buffer, playingId, id, onPlay }: { label: string; buffer: AudioBuffer; playingId: string | null; id: string; onPlay: (id: string, buffer: AudioBuffer) => void }) {
  const isPlaying = playingId === id;
  return (
    <div className="vch__clip-row">
      <button type="button" className="vch__clip-play" onClick={() => onPlay(id, buffer)}>
        <Icon name={isPlaying ? 'stop' : 'play'} size={16} />
      </button>
      <div className="vch__clip-info">
        <strong>{label}</strong>
        <div className="vch__waveform" aria-hidden="true">
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} style={{ '--h': `${20 + Math.abs(Math.sin(i * 1.7 + id.length)) * 80}%` } as React.CSSProperties} />
          ))}
        </div>
        <span className="vch__clip-duration">00:00 · {formatDuration(buffer.duration)}</span>
      </div>
    </div>
  );
}

export function PreviewScreen({ api }: { api: VcApi }) {
  const [fileName, setFileName] = useState('My Voice');
  const [saveToDevice, setSaveToDevice] = useState(true);
  const [addToHistory, setAddToHistory] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handlePlay(id: string, buffer: AudioBuffer) {
    if (playingId === id) {
      stopPlayback();
      setPlayingId(null);
      return;
    }
    await playBuffer(buffer, () => setPlayingId(null));
    setPlayingId(id);
  }

  async function handleSave() {
    if (!api.original || !api.processed) return;
    hapticTap();
    stopPlayback();
    setIsBusy(true);
    try {
      const wav = audioBufferToWav(api.processed);
      const name = fileName.trim() || 'My Voice';
      const safeName = `${name}.wav`;

      if (addToHistory) {
        const clip: SavedClip = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name,
          createdAt: Date.now(),
          durationSeconds: api.processed.duration,
          effectLabel: api.processedLabel,
          blob: wav,
        };
        await saveClip(clip);
        api.bumpHistoryToken();
        api.setShareClip(clip);
      } else {
        api.setShareClip({
          id: 'unsaved',
          name,
          createdAt: Date.now(),
          durationSeconds: api.processed.duration,
          effectLabel: api.processedLabel,
          blob: wav,
        });
      }

      if (saveToDevice) {
        const url = URL.createObjectURL(wav);
        const a = document.createElement('a');
        a.href = url;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      hapticSuccess();
      api.replace('share');
    } finally {
      setIsBusy(false);
    }
  }

  if (!api.original || !api.processed) {
    return (
      <div className="screen">
        <ScreenHeader title="Preview & Save" onBack={api.popBack} />
        <div className="vch__body vch__body--center">
          <p className="vch__hint">Nothing to preview yet — record or import audio first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <ScreenHeader title="Preview & Save" onBack={api.popBack} />
      <div className="vch__body">
        <ClipRow label="Original Voice" buffer={api.original} id="original" playingId={playingId} onPlay={handlePlay} />
        <ClipRow label={`With Effect (${api.processedLabel})`} buffer={api.processed} id="processed" playingId={playingId} onPlay={handlePlay} />

        <div className="vch__field">
          <label className="vch__label" htmlFor="vch-filename">
            File Name
          </label>
          <input id="vch-filename" type="text" className="vch__text-input" value={fileName} onChange={(e) => setFileName(e.target.value)} maxLength={60} />
        </div>

        <div className="vch__field">
          <span className="vch__label">Format</span>
          <div className="vch__select vch__select--static">WAV (High Quality)</div>
        </div>

        <label className="vch__switch-row">
          <span>
            <Icon name="download" size={16} />
            Save to Device
          </span>
          <input type="checkbox" checked={saveToDevice} onChange={(e) => setSaveToDevice(e.target.checked)} />
          <span className="vch__toggle-track" />
        </label>

        <label className="vch__switch-row">
          <span>
            <Icon name="history" size={16} />
            Add to History
          </span>
          <input type="checkbox" checked={addToHistory} onChange={(e) => setAddToHistory(e.target.checked)} />
          <span className="vch__toggle-track" />
        </label>

        <button type="button" className="vch__action vch__action--primary vch__action--full" onClick={() => void handleSave()} disabled={isBusy}>
          <Icon name="download" size={17} />
          {isBusy ? 'Saving…' : 'Save Audio'}
        </button>
      </div>
    </div>
  );
}
