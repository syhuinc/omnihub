import { ScreenHeader } from '../../components/ScreenHeader';
import { useRouter } from '../../app/Router';
import { TimerView } from '../timer-stopwatch/TimerView';
import '../timer-stopwatch/TimerStopwatch.css';

export function Timer() {
  const { navigate } = useRouter();
  return (
    <div className="screen">
      <ScreenHeader title="Timer" onBack={() => navigate('/tools')} />
      <TimerView />
    </div>
  );
}
