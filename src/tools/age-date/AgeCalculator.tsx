import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useRouter } from '../../app/Router';
import { ageBreakdown, nextBirthday, parseISODate, toISODate } from './dateMath';
import './AgeDate.css';

export function AgeCalculator() {
  const { navigate } = useRouter();
  const [birthISO, setBirthISO] = useState('');
  const today = useMemo(() => new Date(), []);

  const birth = parseISODate(birthISO);
  const isFuture = birth && birth.getTime() > today.getTime();
  const valid = birth && !isFuture;

  const breakdown = valid ? ageBreakdown(birth, today) : null;
  const next = valid ? nextBirthday(birth, today) : null;

  return (
    <div className="screen">
      <ScreenHeader title="Age Calculator" onBack={() => navigate('/tools')} />

      <div className="ad__body">
        <div className="ad__field">
          <label className="ad__label">Date of Birth</label>
          <input
            className="ad__date-input"
            type="date"
            value={birthISO}
            max={toISODate(today)}
            onChange={(e) => setBirthISO(e.target.value)}
          />
        </div>

        {isFuture && <p className="ad__error">Date of birth can't be in the future.</p>}

        {breakdown && (
          <>
            <div className="ad__age-display">
              <div className="ad__age-unit">
                <strong>{breakdown.years}</strong>
                <span>years</span>
              </div>
              <div className="ad__age-unit">
                <strong>{breakdown.months}</strong>
                <span>months</span>
              </div>
              <div className="ad__age-unit">
                <strong>{breakdown.days}</strong>
                <span>days</span>
              </div>
            </div>

            <div className="ad__result">
              <div className="ad__result-row">
                <span>Total days lived</span>
                <span>{breakdown.totalDays.toLocaleString()}</span>
              </div>
              {next && (
                <div className="ad__result-row">
                  <span>Next birthday</span>
                  <span>{next.daysUntil === 0 ? 'Today! \u{1F389}' : `In ${next.daysUntil} days`}</span>
                </div>
              )}
            </div>
          </>
        )}

        {!birthISO && <p className="ad__empty">Pick a date of birth to see the breakdown.</p>}
      </div>
    </div>
  );
}
