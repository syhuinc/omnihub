import { useEffect, useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { useBackHandler } from '../../app/useBackHandler';
import { CITIES, getCityById } from '../time-zone/cities';
import { getOffsetMinutes } from '../time-zone/offset';
import './TimeDifference.css';

type PickerTarget = 'from' | 'to' | null;

function formatDiff(fromTimeZone: string, toTimeZone: string, now: Date): { amount: string; direction: 'ahead' | 'behind' | 'same' } {
  const diff = Math.round(getOffsetMinutes(toTimeZone, now) - getOffsetMinutes(fromTimeZone, now));
  if (diff === 0) return { amount: '', direction: 'same' };
  const hours = Math.floor(Math.abs(diff) / 60);
  const mins = Math.abs(diff) % 60;
  const amount = [hours ? `${hours}h` : '', mins ? `${mins}m` : ''].filter(Boolean).join(' ');
  return { amount, direction: diff > 0 ? 'ahead' : 'behind' };
}

export function TimeDifference() {
  const { back } = useRouter();
  const [fromId, setFromId] = useState('kuala-lumpur');
  const [toId, setToId] = useState('new-york');
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useBackHandler(() => setPicker(null), picker !== null);

  const fromCity = getCityById(fromId);
  const toCity = getCityById(toId);

  const diff = useMemo(() => {
    if (!fromCity || !toCity) return null;
    return formatDiff(fromCity.timeZone, toCity.timeZone, now);
  }, [fromCity, toCity, now]);

  function selectCity(id: string) {
    if (picker === 'from') setFromId(id);
    else if (picker === 'to') setToId(id);
    setPicker(null);
  }

  function swap() {
    setFromId(toId);
    setToId(fromId);
  }

  function renderCard(target: 'from' | 'to', city: ReturnType<typeof getCityById>) {
    const time = city
      ? now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: city.timeZone })
      : '--:--';
    const date = city
      ? now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: city.timeZone })
      : '';
    return (
      <button type="button" className="tdiff__card" onClick={() => setPicker(target)}>
        <span className="tdiff__card-label">{target === 'from' ? 'From' : 'To'}</span>
        <span className="tdiff__card-city">{city ? city.name : 'Choose a city'}</span>
        {city && <span className="tdiff__card-country">{city.country}</span>}
        <span className="tdiff__card-time">{time}</span>
        <span className="tdiff__card-date">{date}</span>
      </button>
    );
  }

  return (
    <div className="screen">
      <ScreenHeader title="Time Difference" onBack={back} />

      <div className="tdiff__body">
        <div className="tdiff__row">
          {renderCard('from', fromCity)}
          <button type="button" className="tdiff__swap" onClick={swap} aria-label="Swap cities">
            <Icon name="repeat" size={18} />
          </button>
          {renderCard('to', toCity)}
        </div>

        {fromCity && toCity && diff && (
          <div className="tdiff__result">
            {diff.direction === 'same' ? (
              <span className="tdiff__result-value">
                {toCity.name} and {fromCity.name} are the same time
              </span>
            ) : (
              <>
                <span className="tdiff__result-label">{toCity.name} is</span>
                <span className="tdiff__result-value">
                  {diff.amount} {diff.direction}
                </span>
                <span className="tdiff__result-label">
                  {diff.direction === 'ahead' ? `of ${fromCity.name}` : fromCity.name}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {picker && (
        <div className="tdiff__sheet" onClick={() => setPicker(null)}>
          <div className="tdiff__sheet-content" onClick={(e) => e.stopPropagation()}>
            <h2>Choose a City</h2>
            <ul className="tdiff__pick-list">
              {CITIES.map((city) => (
                <li key={city.id}>
                  <button type="button" className="tdiff__pick-item" onClick={() => selectCity(city.id)}>
                    <span>
                      <strong>{city.name}</strong>
                      <span className="tdiff__pick-country">{city.country}</span>
                    </span>
                    {(picker === 'from' ? fromId : toId) === city.id && <Icon name="check" size={16} />}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="tdiff__sheet-close" onClick={() => setPicker(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
