import { useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useRouter } from '../../app/Router';
import { TimerView } from './TimerView';
import { StopwatchView } from './StopwatchView';
import './TimerStopwatch.css';

type Mode = 'timer' | 'stopwatch';

export function TimerStopwatch() {
  const { navigate } = useRouter();
  const [mode, setMode] = useState<Mode>('timer');

  return (
    <div className="screen">
      <ScreenHeader title="Timer & Stopwatch" onBack={() => navigate('/tools')} />

      <div className="tsw__switch">
        <button
          type="button"
          className={`tsw__switch-btn${mode === 'timer' ? ' tsw__switch-btn--active' : ''}`}
          onClick={() => setMode('timer')}
        >
          Timer
        </button>
        <button
          type="button"
          className={`tsw__switch-btn${mode === 'stopwatch' ? ' tsw__switch-btn--active' : ''}`}
          onClick={() => setMode('stopwatch')}
        >
          Stopwatch
        </button>
      </div>

      {mode === 'timer' ? <TimerView /> : <StopwatchView />}
    </div>
  );
}
