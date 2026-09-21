import { useEffect, useRef, useState } from 'react';
import { formatClock, pad, playBeep } from './time';
import { hapticSuccess } from '../../haptics';

type Status = 'idle' | 'running' | 'paused' | 'finished';

export function TimerView() {
  const [hoursInput, setHoursInput] = useState('0');
  const [minutesInput, setMinutesInput] = useState('5');
  const [secondsInput, setSecondsInput] = useState('0');

  const [status, setStatus] = useState<Status>('idle');
  const [remainingAtPause, setRemainingAtPause] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [, forceTick] = useState(0);
  const beepedRef = useRef(false);

  const setDurationMs =
    (Math.max(0, parseInt(hoursInput || '0', 10)) * 3600 +
      Math.max(0, parseInt(minutesInput || '0', 10)) * 60 +
      Math.max(0, parseInt(secondsInput || '0', 10))) *
    1000;

  const remaining =
    status === 'running' && startedAt
      ? Math.max(0, remainingAtPause - (Date.now() - startedAt))
      : status === 'idle'
        ? setDurationMs
        : remainingAtPause;

  useEffect(() => {
    if (status !== 'running') return;
    const interval = setInterval(() => forceTick((t) => t + 1), 200);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status === 'running' && remaining <= 0 && !beepedRef.current) {
      beepedRef.current = true;
      setStatus('finished');
      setRemainingAtPause(0);
      playBeep();
      hapticSuccess();
    }
  }, [status, remaining]);

  function start() {
    beepedRef.current = false;
    setRemainingAtPause(setDurationMs);
    setStartedAt(Date.now());
    setStatus('running');
  }

  function pause() {
    setRemainingAtPause(remaining);
    setStartedAt(null);
    setStatus('paused');
  }

  function resume() {
    setStartedAt(Date.now());
    setStatus('running');
  }

  function reset() {
    beepedRef.current = false;
    setStatus('idle');
    setStartedAt(null);
    setRemainingAtPause(0);
  }

  const isEditing = status === 'idle';

  return (
    <div className="tm">
      {isEditing ? (
        <div className="tm__picker">
          <TimeField label="hr" value={hoursInput} onChange={setHoursInput} max={99} />
          <span className="tm__colon">:</span>
          <TimeField label="min" value={minutesInput} onChange={setMinutesInput} max={59} />
          <span className="tm__colon">:</span>
          <TimeField label="sec" value={secondsInput} onChange={setSecondsInput} max={59} />
        </div>
      ) : (
        <div className={`tm__display${status === 'finished' ? ' tm__display--finished' : ''}`}>
          {formatClock(remaining, parseInt(hoursInput || '0', 10) > 0)}
        </div>
      )}

      {status === 'finished' && <p className="tm__finished-label">Time's up!</p>}

      <div className="tm__controls">
        {status === 'idle' && (
          <button type="button" className="tm__btn tm__btn--start" onClick={start} disabled={setDurationMs <= 0}>
            Start
          </button>
        )}
        {status === 'running' && (
          <>
            <button type="button" className="tm__btn tm__btn--secondary" onClick={reset}>
              Reset
            </button>
            <button type="button" className="tm__btn tm__btn--stop" onClick={pause}>
              Pause
            </button>
          </>
        )}
        {status === 'paused' && (
          <>
            <button type="button" className="tm__btn tm__btn--secondary" onClick={reset}>
              Reset
            </button>
            <button type="button" className="tm__btn tm__btn--start" onClick={resume}>
              Resume
            </button>
          </>
        )}
        {status === 'finished' && (
          <button type="button" className="tm__btn tm__btn--start" onClick={reset}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
}) {
  return (
    <div className="tm__field">
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const num = parseInt(e.target.value, 10);
          if (e.target.value === '') onChange('');
          else if (!Number.isNaN(num)) onChange(pad(Math.min(Math.max(num, 0), max)));
        }}
        onBlur={() => {
          if (value === '') onChange('0');
        }}
      />
      <span>{label}</span>
    </div>
  );
}
