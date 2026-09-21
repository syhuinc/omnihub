import { ScreenHeader } from '../../components/ScreenHeader';
import { useRouter } from '../../app/Router';
import { StopwatchView } from '../timer-stopwatch/StopwatchView';
import '../timer-stopwatch/TimerStopwatch.css';

export function Stopwatch() {
  const { navigate } = useRouter();
  return (
    <div className="screen">
      <ScreenHeader title="Stopwatch" onBack={() => navigate('/tools')} />
      <StopwatchView />
    </div>
  );
}
