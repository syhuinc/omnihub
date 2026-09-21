import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useRouter } from '../../app/Router';
import { addDays, ageBreakdown, daysBetween, parseISODate, toISODate } from './dateMath';
import './AgeDate.css';

type Mode = 'difference' | 'shift';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatFriendly(date: Date): string {
  return `${WEEKDAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function DateCalculator() {
  const { navigate } = useRouter();
  const [mode, setMode] = useState<Mode>('difference');
  const today = useMemo(() => new Date(), []);

  const [dateAISO, setDateAISO] = useState(toISODate(today));
  const [dateBISO, setDateBISO] = useState('');

  const [shiftDateISO, setShiftDateISO] = useState(toISODate(today));
  const [shiftAmount, setShiftAmount] = useState('7');
  const [shiftDirection, setShiftDirection] = useState<1 | -1>(1);

  const dateA = parseISODate(dateAISO);
  const dateB = parseISODate(dateBISO);

  const diffResult = useMemo(() => {
    if (!dateA || !dateB) return null;
    const [earlier, later] = dateA.getTime() <= dateB.getTime() ? [dateA, dateB] : [dateB, dateA];
    const totalDays = daysBetween(earlier, later);
    const breakdown = ageBreakdown(earlier, later);
    return { totalDays, breakdown, sameDate: totalDays === 0 };
  }, [dateA, dateB]);

  const shiftDate = parseISODate(shiftDateISO);
  const shiftResult = useMemo(() => {
    if (!shiftDate) return null;
    const amount = parseInt(shiftAmount, 10) || 0;
    return addDays(shiftDate, amount * shiftDirection);
  }, [shiftDate, shiftAmount, shiftDirection]);

  return (
    <div className="screen">
      <ScreenHeader title="Date Calculator" onBack={() => navigate('/tools')} />

      <div className="ad__switch">
        <button
          type="button"
          className={`ad__switch-btn${mode === 'difference' ? ' ad__switch-btn--active' : ''}`}
          onClick={() => setMode('difference')}
        >
          Difference
        </button>
        <button
          type="button"
          className={`ad__switch-btn${mode === 'shift' ? ' ad__switch-btn--active' : ''}`}
          onClick={() => setMode('shift')}
        >
          Add / Subtract
        </button>
      </div>

      {mode === 'difference' ? (
        <div className="ad__body">
          <div className="ad__field">
            <label className="ad__label">From</label>
            <input className="ad__date-input" type="date" value={dateAISO} onChange={(e) => setDateAISO(e.target.value)} />
          </div>
          <div className="ad__field">
            <label className="ad__label">To</label>
            <input className="ad__date-input" type="date" value={dateBISO} onChange={(e) => setDateBISO(e.target.value)} />
          </div>

          {!dateBISO && <p className="ad__empty">Pick both dates to see the difference.</p>}

          {diffResult && (
            <div className="ad__result">
              <div className="ad__result-highlight">
                {diffResult.sameDate ? 'Same day' : `${diffResult.totalDays.toLocaleString()} days`}
              </div>
              {!diffResult.sameDate && (
                <div className="ad__result-row">
                  <span>Breakdown</span>
                  <span>
                    {diffResult.breakdown.years}y {diffResult.breakdown.months}m {diffResult.breakdown.days}d
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="ad__body">
          <div className="ad__field">
            <label className="ad__label">Start Date</label>
            <input className="ad__date-input" type="date" value={shiftDateISO} onChange={(e) => setShiftDateISO(e.target.value)} />
          </div>

          <div className="ad__field">
            <label className="ad__label">Days</label>
            <div className="ad__shift-row">
              <button
                type="button"
                className={`ad__shift-toggle${shiftDirection === -1 ? ' ad__shift-toggle--active' : ''}`}
                onClick={() => setShiftDirection(-1)}
              >
                Subtract
              </button>
              <input
                className="ad__shift-input"
                type="number"
                inputMode="numeric"
                min={0}
                value={shiftAmount}
                onChange={(e) => setShiftAmount(e.target.value)}
              />
              <button
                type="button"
                className={`ad__shift-toggle${shiftDirection === 1 ? ' ad__shift-toggle--active' : ''}`}
                onClick={() => setShiftDirection(1)}
              >
                Add
              </button>
            </div>
          </div>

          {shiftResult && (
            <div className="ad__result">
              <div className="ad__result-highlight ad__result-highlight--small">{formatFriendly(shiftResult)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
