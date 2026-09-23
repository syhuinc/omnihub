import { useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { useBackHandler } from '../../app/useBackHandler';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import { hapticTap } from '../../haptics';
import { useGeolocation } from './useGeolocation';
import { CompassView } from './CompassView';
import { LevelView } from './LevelView';
import { DEFAULT_COMPASS_SETTINGS, type CompassSettings } from './types';
import './Compass.css';

type Tab = 'compass' | 'level';

export function Compass() {
  const { back, navigate } = useRouter();
  const [tab, setTab] = useState<Tab>('compass');
  const [showCalibrate, setShowCalibrate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [locked, setLocked] = useState(false);
  const [settings, setSettings] = useState<CompassSettings>(() =>
    storageGet(StorageKeys.compassSettings, DEFAULT_COMPASS_SETTINGS),
  );
  const geo = useGeolocation();

  useBackHandler(() => {
    if (showCalibrate) setShowCalibrate(false);
    else if (showSettings) setShowSettings(false);
  }, showCalibrate || showSettings);

  function updateSettings(patch: Partial<CompassSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    storageSet(StorageKeys.compassSettings, next);
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Compass"
        subtitle="Find your direction. Explore more."
        onBack={back}
        action={
          <>
            <button
              type="button"
              className="cp__header-btn"
              onClick={() => {
                hapticTap();
                setShowCalibrate(true);
              }}
              aria-label="Calibrate compass"
            >
              <Icon name="repeat" size={19} />
            </button>
            <button
              type="button"
              className="cp__header-btn"
              onClick={() => {
                hapticTap();
                geo.refresh();
              }}
              aria-label="Refresh location"
            >
              <Icon name="pin" size={19} />
            </button>
            <button
              type="button"
              className="cp__header-btn"
              onClick={() => {
                hapticTap();
                setShowSettings(true);
              }}
              aria-label="Compass settings"
            >
              <Icon name="settings" size={19} />
            </button>
          </>
        }
      />

      <div className="cp__tabs">
        <button
          type="button"
          className={`cp__tab${tab === 'compass' ? ' cp__tab--active' : ''}`}
          onClick={() => setTab('compass')}
        >
          <Icon name="compass" size={16} />
          Compass
        </button>
        <button
          type="button"
          className={`cp__tab${tab === 'level' ? ' cp__tab--active' : ''}`}
          onClick={() => setTab('level')}
        >
          <Icon name="level" size={16} />
          Level
        </button>
      </div>

      {tab === 'compass' ? <CompassView geo={geo} settings={settings} locked={locked} /> : <LevelView />}

      {tab === 'compass' && (
        <>
          <div className="cp__actions">
            <button
              type="button"
              className="cp__action"
              onClick={() => {
                hapticTap();
                setShowCalibrate(true);
              }}
            >
              <Icon name="repeat" size={20} />
              Calibrate
            </button>
            <button
              type="button"
              className={`cp__action${locked ? ' cp__action--active' : ''}`}
              onClick={() => {
                hapticTap();
                setLocked((v) => !v);
              }}
            >
              <Icon name={locked ? 'unlock' : 'lock'} size={20} />
              Lock Direction
              <em>{locked ? 'Tap to unlock' : 'Hold current'}</em>
            </button>
            <button type="button" className="cp__action cp__action--flashlight" onClick={() => navigate('/tools/flashlight')}>
              <Icon name="flashlight" size={20} />
              Flashlight
            </button>
            <button
              type="button"
              className="cp__action"
              onClick={() => {
                hapticTap();
                setShowSettings(true);
              }}
            >
              <Icon name="settings" size={20} />
              Settings
            </button>
          </div>
          <p className="cp__quote">"Not all who wander are lost."</p>
        </>
      )}

      {showCalibrate && (
        <div className="cp__sheet" onClick={() => setShowCalibrate(false)}>
          <div className="cp__sheet-content" onClick={(e) => e.stopPropagation()}>
            <div className="cp__calibrate-icon">
              <Icon name="repeat" size={32} />
            </div>
            <h2>Calibrate Compass</h2>
            <p>
              Move your phone in a figure-8 motion a few times. This helps the magnetometer clear
              any magnetic interference and read your heading more accurately.
            </p>
            <button type="button" className="cp__sheet-close" onClick={() => setShowCalibrate(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="cp__sheet" onClick={() => setShowSettings(false)}>
          <div className="cp__sheet-content" onClick={(e) => e.stopPropagation()}>
            <h2>Compass Settings</h2>

            <div className="cp__setting-row">
              <span className="cp__setting-text">
                <span className="cp__setting-title">Haptic Ticks</span>
                <span className="cp__setting-desc">Vibrate lightly when crossing N, NE, E, SE…</span>
              </span>
              <button
                type="button"
                className={`cp__switch${settings.hapticTicks ? ' cp__switch--on' : ''}`}
                onClick={() => updateSettings({ hapticTicks: !settings.hapticTicks })}
                role="switch"
                aria-checked={settings.hapticTicks}
                aria-label="Toggle haptic ticks"
              >
                <span className="cp__switch-knob" />
              </button>
            </div>

            <div className="cp__setting-row">
              <span className="cp__setting-text">
                <span className="cp__setting-title">Altitude Unit</span>
                <span className="cp__setting-desc">How altitude is displayed</span>
              </span>
              <div className="cp__unit-toggle">
                <button
                  type="button"
                  className={`cp__unit-chip${settings.altitudeUnit === 'm' ? ' cp__unit-chip--active' : ''}`}
                  onClick={() => updateSettings({ altitudeUnit: 'm' })}
                >
                  Meters
                </button>
                <button
                  type="button"
                  className={`cp__unit-chip${settings.altitudeUnit === 'ft' ? ' cp__unit-chip--active' : ''}`}
                  onClick={() => updateSettings({ altitudeUnit: 'ft' })}
                >
                  Feet
                </button>
              </div>
            </div>

            <button type="button" className="cp__sheet-close" onClick={() => setShowSettings(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
