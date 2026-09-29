import { useEffect, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { hapticSelect, hapticTap } from '../../haptics';
import { SLEEP_SOUNDS, SOUND_FILTERS } from './types';
import * as audioEngine from './audioEngine';
import './SleepMode.css';

interface SleepSoundsProps {
  onBack: () => void;
}

export function SleepSounds({ onBack }: SleepSoundsProps) {
  const [filter, setFilter] = useState<(typeof SOUND_FILTERS)[number]['id']>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => () => audioEngine.stopSound(), []);

  const visible = SLEEP_SOUNDS.filter((s) => filter === 'all' || s.category === filter);

  function togglePlay(id: string) {
    hapticTap();
    if (playingId === id) {
      audioEngine.stopSound();
      setPlayingId(null);
    } else {
      audioEngine.playSound(id as never, volume);
      setPlayingId(id);
    }
  }

  function handleVolume(v: number) {
    setVolume(v);
    audioEngine.setVolume(v);
  }

  return (
    <div className="screen">
      <ScreenHeader title="Sleep Sounds" subtitle="Relaxing sounds to help you sleep" onBack={onBack} />

      <div className="sm__body">
        <div className="sm__chip-row">
          {SOUND_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`sm__chip${filter === f.id ? ' sm__chip--active' : ''}`}
              onClick={() => {
                hapticSelect();
                setFilter(f.id);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ss__grid">
          {visible.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`ss__card${playingId === s.id ? ' ss__card--playing' : ''}`}
              onClick={() => togglePlay(s.id)}
            >
              <img className="ss__card-image" src={s.image} alt="" />
              <span className="ss__card-play">
                <Icon name={playingId === s.id ? 'pause' : 'play'} size={16} />
              </span>
              <span className="ss__card-label">{s.label}</span>
            </button>
          ))}
        </div>

        <p className="sm__pro-note">
          Looping ambient audio, bundled with the app and played entirely on your device.
        </p>

        <div className="ss__volume-row">
          <Icon name="volume" size={18} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => handleVolume(parseFloat(e.target.value))}
            className="ss__volume-slider"
          />
        </div>
      </div>
    </div>
  );
}
