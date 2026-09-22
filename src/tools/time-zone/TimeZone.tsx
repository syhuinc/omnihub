import { useEffect, useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { SwipeToDelete } from '../../components/SwipeToDelete';
import { useRouter } from '../../app/Router';
import { useBackHandler } from '../../app/useBackHandler';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import { CITIES, getCityById } from './cities';
import './TimeZone.css';

const DEFAULT_CITY_IDS = ['new-york', 'london', 'kuala-lumpur', 'mumbai', 'tokyo'];

function getOffsetMinutes(timeZone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

function formatOffsetDiff(cityTimeZone: string, now: Date): string {
  const localOffset = -now.getTimezoneOffset();
  const cityOffset = getOffsetMinutes(cityTimeZone, now);
  const diff = Math.round(cityOffset - localOffset);
  if (diff === 0) return 'Same time as you';
  const hours = Math.floor(Math.abs(diff) / 60);
  const mins = Math.abs(diff) % 60;
  const sign = diff > 0 ? '+' : '-';
  const parts = [hours ? `${hours}h` : '', mins ? `${mins}m` : ''].filter(Boolean).join(' ');
  return `${sign}${parts} vs you`;
}

export function TimeZone() {
  const { back } = useRouter();
  const [cityIds, setCityIds] = useState<string[]>(() => storageGet(StorageKeys.timeZoneCities, DEFAULT_CITY_IDS));
  const [now, setNow] = useState(new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

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
    persist([...cityIds, id]);
    setAddOpen(false);
  }

  function removeCity(id: string) {
    persist(cityIds.filter((c) => c !== id));
  }

  const cities = useMemo(() => cityIds.map(getCityById).filter((c): c is NonNullable<typeof c> => !!c), [cityIds]);
  const addableCities = CITIES.filter((c) => !cityIds.includes(c.id));

  const localTime = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const localDate = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="screen">
      <ScreenHeader title="Time Zone" onBack={back} />

      <div className="tz__body">
        <div className="tz__local">
          <span className="tz__local-label">Your Time</span>
          <span className="tz__local-time">{localTime}</span>
          <span className="tz__local-date">{localDate}</span>
        </div>

        {cities.length === 0 ? (
          <p className="tz__empty">No cities added yet. Tap + to add one.</p>
        ) : (
          <ul className="tz__list">
            {cities.map((city) => {
              const time = now.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
                timeZone: city.timeZone,
              });
              const date = now.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                timeZone: city.timeZone,
              });
              return (
                <li key={city.id}>
                  <SwipeToDelete id={city.id} openId={openSwipeId} onOpenChange={setOpenSwipeId} onDelete={() => removeCity(city.id)}>
                    <div className="tz__row">
                      <span className="tz__row-info">
                        <span className="tz__row-name">{city.name}</span>
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

      <button type="button" className="tz__fab" onClick={() => setAddOpen(true)} aria-label="Add city">
        <Icon name="plus" size={24} />
      </button>

      {addOpen && (
        <div className="tz__sheet" onClick={() => setAddOpen(false)}>
          <div className="tz__sheet-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add a City</h2>
            {addableCities.length === 0 ? (
              <p className="tz__empty">All cities added.</p>
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
