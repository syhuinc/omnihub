import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useRouter } from '../../app/Router';
import './TimeDifference.css';

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TimeDifference() {
  const { back } = useRouter();
  const now = useMemo(() => new Date(), []);
  const [startText, setStartText] = useState(toLocalInputValue(now));
  const [endText, setEndText] = useState(toLocalInputValue(new Date(now.getTime() + 60 * 60 * 1000)));

  const result = useMemo(() => {
    const start = new Date(startText);
    const end = new Date(endText);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

    const totalMs = end.getTime() - start.getTime();
    const past = totalMs < 0;
    const absMs = Math.abs(totalMs);

    const totalMinutes = Math.floor(absMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    return {
      past,
      days,
      hours,
      minutes,
      totalHours: absMs / 3600000,
      totalMinutes,
      totalDays: absMs / 86400000,
    };
  }, [startText, endText]);

  return (
    <div className="screen">
      <ScreenHeader title="Time Difference" onBack={back} />

      <div className="td__body">
        <div className="td__field">
          <label className="td__label">Start</label>
          <input
            className="td__input"
            type="datetime-local"
            value={startText}
            onChange={(e) => setStartText(e.target.value)}
          />
        </div>

        <div className="td__field">
          <label className="td__label">End</label>
          <input
            className="td__input"
            type="datetime-local"
            value={endText}
            onChange={(e) => setEndText(e.target.value)}
          />
        </div>

        {result && (
          <div className="td__result">
            {result.past && <p className="td__past-note">End is before Start — showing the time between them.</p>}
            <div className="td__breakdown">
              {result.days > 0 && (
                <div className="td__breakdown-item">
                  <strong>{result.days}</strong>
                  <span>{result.days === 1 ? 'day' : 'days'}</span>
                </div>
              )}
              <div className="td__breakdown-item">
                <strong>{result.hours}</strong>
                <span>{result.hours === 1 ? 'hour' : 'hours'}</span>
              </div>
              <div className="td__breakdown-item">
                <strong>{result.minutes}</strong>
                <span>{result.minutes === 1 ? 'min' : 'mins'}</span>
              </div>
            </div>
            <div className="td__totals">
              <div className="td__totals-row">
                <span>Total Days</span>
                <span>{result.totalDays.toFixed(2)}</span>
              </div>
              <div className="td__totals-row">
                <span>Total Hours</span>
                <span>{result.totalHours.toFixed(2)}</span>
              </div>
              <div className="td__totals-row">
                <span>Total Minutes</span>
                <span>{result.totalMinutes.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
