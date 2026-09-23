import { useEffect, useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { SearchBar } from '../../components/SearchBar';
import { useRouter } from '../../app/Router';
import { useBackHandler } from '../../app/useBackHandler';
import { hapticSelect, hapticTap } from '../../haptics';
import { CITIES, getCityById } from '../time-zone/cities';
import { dayOffsetLabel, getOffsetMinutes, hourInZone, instantAtHourInZone } from '../time-zone/offset';
import './TimeDifference.css';

type PickerTarget = 'from' | 'to' | null;
type Overlap = 'good' | 'ok' | 'poor';

const WAKING_START = 8;
const WAKING_END = 21;

function formatDiff(fromTimeZone: string, toTimeZone: string, now: Date): { amount: string; direction: 'ahead' | 'behind' | 'same' } {
  const diff = Math.round(getOffsetMinutes(toTimeZone, now) - getOffsetMinutes(fromTimeZone, now));
  if (diff === 0) return { amount: '', direction: 'same' };
  const hours = Math.floor(Math.abs(diff) / 60);
  const mins = Math.abs(diff) % 60;
  const amount = [hours ? `${hours}h` : '', mins ? `${mins}m` : ''].filter(Boolean).join(' ');
  return { amount, direction: diff > 0 ? 'ahead' : 'behind' };
}

function formatHour12(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function TimeDifference() {
  const { back } = useRouter();
  const [fromId, setFromId] = useState('kuala-lumpur');
  const [toId, setToId] = useState('new-york');
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [pickerSearch, setPickerSearch] = useState('');
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

  const overlap = useMemo(() => {
    if (!fromCity || !toCity) return null;
    const hours: { hour: number; state: Overlap }[] = [];
    for (let h = 0; h < 24; h++) {
      const instant = instantAtHourInZone(fromCity.timeZone, h, now);
      const toHour = hourInZone(toCity.timeZone, instant);
      const fromAwake = h >= WAKING_START && h < WAKING_END;
      const toAwake = toHour >= WAKING_START && toHour < WAKING_END;
      hours.push({ hour: h, state: fromAwake && toAwake ? 'good' : fromAwake || toAwake ? 'ok' : 'poor' });
    }
    // Longest contiguous "good" run.
    let bestStart = -1;
    let bestLen = 0;
    let curStart = -1;
    let curLen = 0;
    for (let i = 0; i < hours.length; i++) {
      if (hours[i].state === 'good') {
        if (curLen === 0) curStart = i;
        curLen++;
        if (curLen > bestLen) {
          bestLen = curLen;
          bestStart = curStart;
        }
      } else {
        curLen = 0;
      }
    }
    const currentHour = hourInZone(fromCity.timeZone, now);
    return { hours, bestStart, bestLen, currentHour };
  }, [fromCity, toCity, now]);

  const pickList = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q));
  }, [pickerSearch]);

  function selectCity(id: string) {
    hapticSelect();
    if (picker === 'from') setFromId(id);
    else if (picker === 'to') setToId(id);
    setPicker(null);
    setPickerSearch('');
  }

  function swap() {
    hapticTap();
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
    const dayLabel = city ? dayOffsetLabel(city.timeZone, now) : null;
    return (
      <button type="button" className="tdiff__card" onClick={() => setPicker(target)}>
        <span className="tdiff__card-label">{target === 'from' ? 'From' : 'To'}</span>
        {city && <span className="tdiff__card-flag">{city.flag}</span>}
        <span className="tdiff__card-city">{city ? city.name : 'Choose a city'}</span>
        {city && <span className="tdiff__card-country">{city.country}</span>}
        <span className="tdiff__card-time">{time}</span>
        <span className="tdiff__card-date">
          {date}
          {dayLabel && <em className="tdiff__card-day-badge">{dayLabel}</em>}
        </span>
      </button>
    );
  }

  return (
    <div className="screen">
      <ScreenHeader title="Time Difference" subtitle="Compare two places at a glance" onBack={back} />

      <div className="tdiff__body">
        <div className="tdiff__row">
          {renderCard('from', fromCity)}
          <div className="tdiff__connector">
            <span className="tdiff__connector-line" />
            <button type="button" className="tdiff__swap" onClick={swap} aria-label="Swap cities">
              <Icon name="repeat" size={18} />
            </button>
          </div>
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

        {fromCity && toCity && overlap && (
          <div className="tdiff__overlap">
            <div className="tdiff__overlap-head">
              <span className="tdiff__overlap-icon">
                <Icon name="clock" size={16} />
              </span>
              <div>
                <strong>Best Time to Connect</strong>
                <span>Waking hours (8 AM – 9 PM) in both places</span>
              </div>
            </div>

            <div className="tdiff__bar">
              {overlap.hours.map(({ hour, state }) => (
                <span
                  key={hour}
                  className={`tdiff__seg tdiff__seg--${state}${hour === overlap.currentHour ? ' tdiff__seg--now' : ''}`}
                />
              ))}
            </div>
            <div className="tdiff__bar-labels">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>12 AM</span>
            </div>

            <div className="tdiff__legend">
              <span>
                <i className="tdiff__legend-dot tdiff__legend-dot--good" /> Good for both
              </span>
              <span>
                <i className="tdiff__legend-dot tdiff__legend-dot--ok" /> One is asleep
              </span>
              <span>
                <i className="tdiff__legend-dot tdiff__legend-dot--now" /> Now
              </span>
            </div>

            <p className="tdiff__overlap-note">
              {overlap.bestLen > 0 ? (
                <>
                  <strong>
                    {formatHour12(overlap.bestStart)} – {formatHour12((overlap.bestStart + overlap.bestLen) % 24)}
                  </strong>{' '}
                  in {fromCity.name} works well for both of you.
                </>
              ) : (
                <>No overlapping waking hours — this pair is best for async messages.</>
              )}
            </p>
          </div>
        )}
      </div>

      {picker && (
        <div className="tdiff__sheet" onClick={() => setPicker(null)}>
          <div className="tdiff__sheet-content" onClick={(e) => e.stopPropagation()}>
            <h2>Choose a City</h2>
            <SearchBar value={pickerSearch} onChange={setPickerSearch} placeholder="Search cities or countries..." autoFocus />
            <ul className="tdiff__pick-list">
              {pickList.map((city) => (
                <li key={city.id}>
                  <button type="button" className="tdiff__pick-item" onClick={() => selectCity(city.id)}>
                    <span className="tdiff__pick-flag">{city.flag}</span>
                    <span className="tdiff__pick-info">
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
