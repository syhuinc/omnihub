import { useEffect, useRef, useState } from 'react';
import { formatStopwatch } from './time';

interface Lap {
  id: string;
  lapMs: number;
  totalMs: number;
}

export function StopwatchView() {
  const [running, setRunning] = useState(false);
  const [accumulated, setAccumulated] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [, forceTick] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);
  const lastLapTotalRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => forceTick((t) => t + 1), 31);
    return () => clearInterval(interval);
  }, [running]);

  const elapsed = accumulated + (running && startedAt ? Date.now() - startedAt : 0);

  function start() {
    setStartedAt(Date.now());
    setRunning(true);
  }

  function stop() {
    if (startedAt) setAccumulated((a) => a + (Date.now() - startedAt));
    setStartedAt(null);
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setStartedAt(null);
    setAccumulated(0);
    setLaps([]);
    lastLapTotalRef.current = 0;
  }

  function addLap() {
    const total = elapsed;
    const lap: Lap = {
      id: `${Date.now()}`,
      lapMs: total - lastLapTotalRef.current,
      totalMs: total,
    };
    lastLapTotalRef.current = total;
    setLaps((prev) => [lap, ...prev]);
  }

  return (
    <div className="sw">
      <div className="sw__display">{formatStopwatch(elapsed)}</div>

      <div className="sw__controls">
        <button
          type="button"
          className="sw__btn sw__btn--secondary"
          onClick={running ? addLap : reset}
          disabled={!running && elapsed === 0}
        >
          {running ? 'Lap' : 'Reset'}
        </button>
        <button
          type="button"
          className={`sw__btn ${running ? 'sw__btn--stop' : 'sw__btn--start'}`}
          onClick={running ? stop : start}
        >
          {running ? 'Stop' : elapsed > 0 ? 'Resume' : 'Start'}
        </button>
      </div>

      {laps.length > 0 && (
        <ul className="sw__laps">
          {laps.map((lap, index) => (
            <li key={lap.id} className="sw__lap">
              <span>Lap {laps.length - index}</span>
              <span>{formatStopwatch(lap.lapMs)}</span>
              <span className="sw__lap-total">{formatStopwatch(lap.totalMs)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
