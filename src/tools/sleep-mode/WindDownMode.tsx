import { useEffect, useRef, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { hapticSelect, hapticTap, hapticSuccess } from '../../haptics';
import { WIND_DOWN_ACTIONS } from './types';
import './SleepMode.css';

interface WindDownModeProps {
  onBack: () => void;
  onOpenSounds: () => void;
}

const DURATION_MS = 30 * 60 * 1000;
const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;
const QUOTE = "Let's slow things down. 30 minutes to a better you.";

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function WindDownMode({ onBack, onOpenSounds }: WindDownModeProps) {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(DURATION_MS);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [dimOn, setDimOn] = useState(false);
  const [focusOn, setFocusOn] = useState(false);
  const endAtRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    endAtRef.current = Date.now() + remaining;
    const id = window.setInterval(() => {
      const left = endAtRef.current - Date.now();
      if (left <= 0) {
        setRemaining(0);
        setRunning(false);
        hapticSuccess();
        window.clearInterval(id);
      } else {
        setRemaining(left);
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function toggleRunning() {
    hapticTap();
    if (running) {
      setRunning(false);
    } else {
      if (remaining <= 0) setRemaining(DURATION_MS);
      setRunning(true);
    }
  }

  function handleAction(id: string) {
    hapticSelect();
    if (id === 'sounds') onOpenSounds();
    if (id === 'breathing') setBreathingOpen(true);
    if (id === 'dim') setDimOn(true);
    if (id === 'focus') setFocusOn((v) => !v);
  }

  const fraction = remaining / DURATION_MS;

  return (
    <div className="screen">
      <ScreenHeader title="Wind-Down Mode" subtitle="Time to relax and prepare for sleep" onBack={onBack} />

      <div className="sm__body sm__body--center">
        <div className="wd__ring-wrap">
          <svg className="wd__ring" viewBox="0 0 100 100">
            <circle className="wd__ring-track" cx="50" cy="50" r={RING_R} />
            <circle
              className="wd__ring-progress"
              cx="50"
              cy="50"
              r={RING_R}
              style={{ strokeDasharray: RING_C, strokeDashoffset: RING_C * (1 - fraction) }}
            />
          </svg>
          <div className="wd__ring-center">
            <Icon name="paw" size={22} />
            <strong>{formatClock(remaining)}</strong>
            <span>Wind-down</span>
          </div>
        </div>

        <div className="wd__quote">
          <p>"{QUOTE}"</p>
        </div>

        <div className="wd__actions">
          {WIND_DOWN_ACTIONS.map((a) => {
            const active = (a.id === 'dim' && dimOn) || (a.id === 'focus' && focusOn);
            return (
              <button
                key={a.id}
                type="button"
                className={`wd__action${active ? ' wd__action--active' : ''}`}
                onClick={() => handleAction(a.id)}
              >
                <Icon name={a.icon as never} size={18} />
                <span>{a.label}</span>
              </button>
            );
          })}
        </div>

        <button type="button" className="wd__start-btn" onClick={toggleRunning}>
          <Icon name={running ? 'stop' : 'play'} size={18} />
          {running ? 'Stop Wind-Down' : 'Start Wind-Down'}
        </button>
      </div>

      {breathingOpen && (
        <div className="wd__breathe-overlay" onClick={() => setBreathingOpen(false)}>
          <div className="wd__breathe-circle" aria-hidden="true" />
          <p className="wd__breathe-label">Breathe in… breathe out…</p>
          <span className="wd__breathe-hint">Tap anywhere to stop</span>
        </div>
      )}

      {dimOn && (
        <div className="wd__dim-overlay" onClick={() => setDimOn(false)}>
          <span>Screen dimmed — tap to undim</span>
        </div>
      )}
    </div>
  );
}
