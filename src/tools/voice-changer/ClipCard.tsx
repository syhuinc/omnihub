import { Icon } from '../../components/Icon';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** A deterministic pseudo-waveform (not read from real sample data) — cheap and stable across
 *  re-renders, and visually indistinguishable from a real one at this bar count/size. */
export function WaveformBars({ seed, className }: { seed: string; className?: string }) {
  return (
    <div className={`vch__waveform${className ? ` ${className}` : ''}`} aria-hidden="true">
      {Array.from({ length: 28 }).map((_, i) => (
        <span key={i} style={{ '--h': `${20 + Math.abs(Math.sin(i * 1.7 + seed.length)) * 80}%` } as React.CSSProperties} />
      ))}
    </div>
  );
}

export function ClipCard({
  label,
  durationSeconds,
  seed,
  isPlaying,
  onPlay,
}: {
  label: string;
  durationSeconds: number;
  seed: string;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <div className="vch__clip-row">
      <button type="button" className="vch__clip-play" onClick={onPlay}>
        <Icon name={isPlaying ? 'stop' : 'play'} size={16} />
      </button>
      <div className="vch__clip-info">
        <strong>{label}</strong>
        <WaveformBars seed={seed} />
        <span className="vch__clip-duration">00:00 · {formatDuration(durationSeconds)}</span>
      </div>
    </div>
  );
}
