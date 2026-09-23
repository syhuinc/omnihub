import { useEffect, useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { SearchBar } from '../../components/SearchBar';
import { SwipeToDelete } from '../../components/SwipeToDelete';
import { WheelTimePicker } from '../alarm/WheelTimePicker';
import { useRouter } from '../../app/Router';
import { useBackHandler } from '../../app/useBackHandler';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import { hapticSelect } from '../../haptics';
import { CITIES, getCityById } from './cities';
import { dayOffsetLabel, dayPeriod, formatOffsetDiff, offsetHoursForSort } from './offset';
import './TimeZone.css';

const DEFAULT_CITY_IDS = ['new-york', 'london', 'kuala-lumpur', 'mumbai', 'tokyo'];
type Tab = 'clock' | 'converter';
type SortMode = 'added' | 'offset' | 'name';

export function TimeZone() {
  const { back } = useRouter();
  const [cityIds, setCityIds] = useState<string[]>(() => storageGet(StorageKeys.timeZoneCities, DEFAULT_CITY_IDS));
  const [now, setNow] = useState(new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('clock');
  const [sortMode, setSortMode] = useState<SortMode>('added');
  const [convHour, setConvHour] = useState(now.getHours());
  const [convMinute, setConvMinute] = useState(now.getMinutes());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useBackHandler(() => setAddOpen(false), addOpen);

  function persist(next: string[]) {
    setCityIds(next);
    storageSet(StorageKeys.timeZoneCities, next);
  }

  function addCity(id: string) {
    if (cityIds.includes(id)) return;
    hapticSelect();
    persist([...cityIds, id]);
    setAddOpen(false);
    setAddSearch('');
  }

  function removeCity(id: string) {
    persist(cityIds.filter((c) => c !== id));
  }

  const cities = useMemo(() => cityIds.map(getCityById).filter((c): c is NonNullable<typeof c> => !!c), [cityIds]);

  const sortedCities = useMemo(() => {
    if (sortMode === 'name') return [...cities].sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === 'offset') return [...cities].sort((a, b) => offsetHoursForSort(a.timeZone, now) - offsetHoursForSort(b.timeZone, now));
    return cities;
  }, [cities, sortMode, now]);

  const addableCities = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    return CITIES.filter((c) => !cityIds.includes(c.id)).filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q),
    );
  }, [cityIds, addSearch]);

  const localTime = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const localDate = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const localPeriod = dayPeriod(Intl.DateTimeFormat().resolvedOptions().timeZone, now);

  const convertBase = useMemo(() => {
    const base = new Date(now);
    base.setHours(convHour, convMinute, 0, 0);
    return base;
  }, [convHour, convMinute, now]);

  return (
    <div className="screen">
      <ScreenHeader title="Time Zone" subtitle="Your world, right on time" onBack={back} />

      <div className="tz__tabs">
        <button type="button" className={`tz__tab${tab === 'clock' ? ' tz__tab--active' : ''}`} onClick={() => setTab('clock')}>
          <Icon name="globe" size={15} /> World Clock
        </button>
        <button type="button" className={`tz__tab${tab === 'converter' ? ' tz__tab--active' : ''}`} onClick={() => setTab('converter')}>
          <Icon name="repeat" size={15} /> Converter
        </button>
      </div>

      {tab === 'clock' ? (
        <div className="tz__body">
          <div className="tz__local">
            <Icon name={localPeriod} size={22} className="tz__local-icon" />
            <span className="tz__local-label">Your Time</span>
            <span className="tz__local-time">{localTime}</span>
            <span className="tz__local-date">{localDate}</span>
          </div>

          {cities.length > 0 && (
            <div className="tz__list-header">
              <strong>World Clock ({cities.length})</strong>
              <button
                type="button"
                className="tz__sort-btn"
                onClick={() => {
                  hapticSelect();
                  setSortMode((m) => (m === 'added' ? 'offset' : m === 'offset' ? 'name' : 'added'));
                }}
              >
                <Icon name="sort" size={13} />
                Sort: {sortMode === 'added' ? 'Added' : sortMode === 'offset' ? 'Time' : 'Name'}
              </button>
            </div>
          )}

          {cities.length === 0 ? (
            <p className="tz__empty">No cities added yet. Tap + to add one.</p>
          ) : (
            <ul className="tz__list">
              {sortedCities.map((city) => {
                const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: city.timeZone });
                const date = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: city.timeZone });
                const dayLabel = dayOffsetLabel(city.timeZone, now);
                const period = dayPeriod(city.timeZone, now);
                return (
                  <li key={city.id}>
                    <SwipeToDelete id={city.id} openId={openSwipeId} onOpenChange={setOpenSwipeId} onDelete={() => removeCity(city.id)}>
                      <div className="tz__row">
                        <span className={`tz__row-period tz__row-period--${period}`}>
                          <Icon name={period} size={18} />
                        </span>
                        <span className="tz__row-info">
                          <span className="tz__row-name">
                            {city.name}
                            {dayLabel && <em className="tz__row-day-badge">{dayLabel}</em>}
                          </span>
                          <span className="tz__row-diff">{formatOffsetDiff(city.timeZone, now)}</span>
                        </span>
                        <span className="tz__row-time-block">
                          <span className="tz__row-time">{time}</span>
                          <span className="tz__row-date">{date}</span>
                        </span>
                      </div>
                    </SwipeToDelete>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="tz__body">
          <div className="tz__conv-hint">
            <Icon name="info" size={16} />
            <span>Pick a time in your local zone to see what it is everywhere else.</span>
          </div>

          <WheelTimePicker hour={convHour} minute={convMinute} onChange={(h, m) => { setConvHour(h); setConvMinute(m); }} />

          {cities.length === 0 ? (
            <p className="tz__empty">Add a city on the World Clock tab to convert times.</p>
          ) : (
            <ul className="tz__list">
              {cities.map((city) => {
                const time = convertBase.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: city.timeZone });
                const dayLabel = dayOffsetLabel(city.timeZone, convertBase);
                const period = dayPeriod(city.timeZone, convertBase);
                return (
                  <li key={city.id}>
                    <div className="tz__row">
                      <span className={`tz__row-period tz__row-period--${period}`}>
                        <Icon name={period} size={18} />
                      </span>
                      <span className="tz__row-info">
                        <span className="tz__row-name">
                          {city.name}
                          {dayLabel && <em className="tz__row-day-badge">{dayLabel}</em>}
                        </span>
                        <span className="tz__row-diff">{city.country}</span>
                      </span>
                      <span className="tz__row-time-block">
                        <span className="tz__row-time">{time}</span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <button type="button" className="tz__fab" onClick={() => setAddOpen(true)} aria-label="Add city">
        <Icon name="plus" size={24} />
      </button>

      {addOpen && (
        <div className="tz__sheet" onClick={() => setAddOpen(false)}>
          <div className="tz__sheet-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add a City</h2>
            <SearchBar value={addSearch} onChange={setAddSearch} placeholder="Search cities or countries..." autoFocus />
            {addableCities.length === 0 ? (
              <p className="tz__empty">{addSearch ? 'No matches.' : 'All cities added.'}</p>
            ) : (
              <ul className="tz__pick-list">
                {addableCities.map((city) => (
                  <li key={city.id}>
                    <button type="button" className="tz__pick-item" onClick={() => addCity(city.id)}>
                      <span>
                        <strong>{city.name}</strong>
                        <span className="tz__pick-country">{city.country}</span>
                      </span>
                      <Icon name="plus" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="tz__sheet-close" onClick={() => setAddOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
