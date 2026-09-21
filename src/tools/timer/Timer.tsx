import { ScreenHeader } from '../../components/ScreenHeader';
import { useRouter } from '../../app/Router';
import { TimerView } from '../timer-stopwatch/TimerView';
import '../timer-stopwatch/TimerStopwatch.css';

export function Timer() {
  const { back } = useRouter();
  return (
    <div className="screen">
      <ScreenHeader title="Timer" onBack={back} />
      <TimerView />
    </div>
  );
}
