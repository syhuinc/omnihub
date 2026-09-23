import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { hapticSelect, hapticTap, hapticWarning } from '../../haptics';
import { WheelTimePicker } from '../alarm/WheelTimePicker';
import { SleepModePlugin, DEFAULT_SLEEP_MODE_CONFIG, type SleepModeConfig } from '../../sleep-mode/plugin';
import { INTERVAL_OPTIONS_MIN, WIND_DOWN_ACTIONS } from './types';
import { AiPersonalityScreen } from './AiPersonalityScreen';
import { PersonalizationScreen } from './PersonalizationScreen';
import { ReminderExampleScreen } from './ReminderExampleScreen';
import { WindDownMode } from './WindDownMode';
import { SleepSounds } from './SleepSounds';
import { SleepInsights } from './SleepInsights';
import { SleepModeAI } from './SleepModeAI';
import { SleepSettingsScreen, type SettingsDestination } from './SleepSettingsScreen';
import { SleepTabBar, type SleepTab } from './SleepTabBar';
import { heroBanner } from '../../assets/sleep-mode';
import './SleepMode.css';

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minute.toString().padStart(2, '0')} ${period}`;
}

type TimeField = 'bedtime' | 'wake';
type SubScreen = SleepTab | 'wind-down' | SettingsDestination;

const TAB_SCREENS = new Set<SubScreen>(['main', 'sleep-insights', 'sleep-sounds', 'settings']);

export function SleepMode() {
  const { back } = useRouter();
  const [config, setConfig] = useState<SleepModeConfig>(DEFAULT_SLEEP_MODE_CONFIG);
  const [timeSheet, setTimeSheet] = useState<TimeField | null>(null);
  const [needsExactAlarmPermission, setNeedsExactAlarmPermission] = useState(false);
  const [screen, setScreen] = useState<SubScreen>('main');
  const [windDownAutoStart, setWindDownAutoStart] = useState(false);
  const [windDownInitialAction, setWindDownInitialAction] = useState<string | undefined>(undefined);

  useEffect(() => {
    SleepModePlugin.status()
      .then(setConfig)
      .catch(() => {
        // web fallback / unsupported platform — keep the default config
      });
  }, []);

  async function persist(next: SleepModeConfig) {
    setConfig(next);
    try {
      await SleepModePlugin.configure(next);
    } catch {
      // web fallback / unsupported platform — local state still reflects the change
    }
  }

  async function handleToggleEnabled() {
    hapticSelect();
    if (config.enabled) {
      await persist({ ...config, enabled: false });
      return;
    }

    try {
      const notif = await SleepModePlugin.checkNotificationPermission();
      if (!notif.granted) await SleepModePlugin.requestNotificationPermission();
    } catch {
      // web fallback / unsupported platform — proceed anyway
    }

    try {
      const exact = await SleepModePlugin.checkExactAlarmPermission();
      if (!exact.granted) {
        hapticWarning();
        setNeedsExactAlarmPermission(true);
        await SleepModePlugin.requestExactAlarmPermission();
        return; // user needs to grant it in Settings, then toggle Sleep Mode on again
      }
    } catch {
      // web fallback / unsupported platform — proceed anyway
    }

    setNeedsExactAlarmPermission(false);
    await persist({ ...config, enabled: true });
  }

  function updateTime(field: TimeField, hour: number, minute: number) {
    persist(
      field === 'bedtime'
        ? { ...config, bedtimeHour: hour, bedtimeMinute: minute }
        : { ...config, wakeHour: hour, wakeMinute: minute },
    );
  }

  function selectInterval(min: number) {
    hapticSelect();
    persist({ ...config, intervalMin: min });
  }

  function openWindDown(opts?: { autoStart?: boolean; action?: string }) {
    hapticTap();
    setWindDownAutoStart(!!opts?.autoStart);
    setWindDownInitialAction(opts?.action);
    setScreen('wind-down');
  }

  function selectTab(tab: SleepTab) {
    setScreen(tab);
  }

  if (screen === 'ai-personality') {
    return <AiPersonalityScreen config={config} onBack={() => setScreen('settings')} onPersist={persist} />;
  }
  if (screen === 'personalization') {
    return <PersonalizationScreen config={config} onBack={() => setScreen('settings')} onPersist={persist} />;
  }
  if (screen === 'reminder-example') {
    return <ReminderExampleScreen onBack={() => setScreen('settings')} />;
  }
  if (screen === 'sleep-mode-ai') {
    return <SleepModeAI onBack={() => setScreen('settings')} />;
  }
  if (screen === 'wind-down') {
    return (
      <WindDownMode
        onBack={() => setScreen('main')}
        autoStart={windDownAutoStart}
        initialAction={windDownInitialAction}
      />
    );
  }
  const showTabBar = TAB_SCREENS.has(screen);

  let body: ReactNode;
  if (screen === 'sleep-insights') {
    body = <SleepInsights onBack={() => setScreen('main')} />;
  } else if (screen === 'sleep-sounds') {
    body = <SleepSounds onBack={() => setScreen('main')} />;
  } else if (screen === 'settings') {
    body = <SleepSettingsScreen onBack={() => setScreen('main')} onNavigate={(dest) => setScreen(dest)} />;
  } else {
    body = (
      <div className="screen">
        <ScreenHeader
          title="Sleep Mode"
          subtitle="Your bedtime companion"
          onBack={back}
          action={
            <button type="button" className="sm__header-gear" onClick={() => setScreen('settings')} aria-label="Settings">
              <Icon name="settings" size={19} />
            </button>
          }
        />

        <div className="sm__body">
          <div className="sm__banner">
            <img className="sm__banner-image" src={heroBanner} alt="" />
            <p className="sm__banner-tagline">Better sleep. Brighter days.</p>
          </div>

          <div className={`sm__hero${config.enabled ? ' sm__hero--active' : ''}`}>
            <span className="sm__hero-icon">
              <Icon name="moon" size={26} />
              <span className="sm__hero-zzz">Zz</span>
            </span>
            <Icon name="star" size={9} className="sm__hero-sparkle sm__hero-sparkle--1" />
            <Icon name="star" size={7} className="sm__hero-sparkle sm__hero-sparkle--2" />
            <div className="sm__hero-text">
              <span className="sm__hero-eyebrow">Sleep Mode</span>
              <strong>{config.enabled ? 'Active' : 'Off'}</strong>
              <span className="sm__hero-desc">
                {config.enabled
                  ? `Nagging you between ${formatTime(config.bedtimeHour, config.bedtimeMinute)} and ${formatTime(config.wakeHour, config.wakeMinute)}`
                  : 'Turn it on to get talked into sleeping on time.'}
              </span>
            </div>
            <button
              type="button"
              className={`sm__switch${config.enabled ? ' sm__switch--on' : ''}`}
              onClick={handleToggleEnabled}
              aria-label="Toggle Sleep Mode"
            >
              <span className="sm__switch-knob" />
            </button>
          </div>

          {needsExactAlarmPermission && (
            <div className="sm__warning">
              <Icon name="info" size={16} />
              <span>Sleep Mode needs the "Alarms &amp; reminders" permission. Grant it in Settings, then turn Sleep Mode on again.</span>
            </div>
          )}

          <section className="sm__section">
            <h2>
              <Icon name="calendar" size={13} />
              Schedule
            </h2>
            <div className="sm__schedule-row">
              <button type="button" className="sm__time-btn" onClick={() => setTimeSheet('bedtime')}>
                <span className="sm__time-icon sm__time-icon--night">
                  <Icon name="moon" size={16} />
                </span>
                <span className="sm__time-text">
                  <span>Bedtime</span>
                  <strong>{formatTime(config.bedtimeHour, config.bedtimeMinute)}</strong>
                </span>
                <Icon name="chevron-right" size={16} className="sm__time-chevron" />
              </button>
              <button type="button" className="sm__time-btn" onClick={() => setTimeSheet('wake')}>
                <span className="sm__time-icon sm__time-icon--day">
                  <Icon name="sun" size={16} />
                </span>
                <span className="sm__time-text">
                  <span>Wake time</span>
                  <strong>{formatTime(config.wakeHour, config.wakeMinute)}</strong>
                </span>
                <Icon name="chevron-right" size={16} className="sm__time-chevron" />
              </button>
            </div>

            <div className="sm__interval-row">
              <span className="sm__interval-label">
                <Icon name="clock" size={13} />
                Check in every
              </span>
              <div className="sm__chip-row">
                {INTERVAL_OPTIONS_MIN.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`sm__chip${config.intervalMin === m ? ' sm__chip--active' : ''}`}
                    onClick={() => selectInterval(m)}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </section>

          <button type="button" className="sm__start-btn" onClick={() => openWindDown({ autoStart: true })}>
            <Icon name="play" size={17} />
            Start Sleep Mode
          </button>

          <button type="button" className="sm__menu-row" onClick={() => openWindDown()}>
            <span className="sm__menu-icon" style={{ '--menu-color': 'var(--teal)' } as CSSProperties}>
              <Icon name="moon" size={17} />
            </span>
            <span className="sm__menu-text">
              <strong>Wind-Down</strong>
              <span>30 minutes before bedtime</span>
            </span>
            <Icon name="chevron-right" size={16} className="sm__time-chevron" />
          </button>

          <div className="sm__quick-grid">
            {WIND_DOWN_ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                className="sm__quick-item"
                onClick={() => (a.id === 'sounds' ? setScreen('sleep-sounds') : openWindDown({ action: a.id }))}
              >
                <Icon name={a.icon as never} size={18} />
                <span>{a.shortLabel}</span>
              </button>
            ))}
          </div>

          <button type="button" className="sm__menu-row" onClick={() => setScreen('sleep-insights')}>
            <span className="sm__menu-icon" style={{ '--menu-color': 'var(--orange)' } as CSSProperties}>
              <Icon name="trending-up" size={17} />
            </span>
            <span className="sm__menu-text">
              <strong>Sleep Tracking</strong>
              <span>Track your sleep time and build better habits</span>
            </span>
            <Icon name="chevron-right" size={16} className="sm__time-chevron" />
          </button>
        </div>

        {timeSheet && (
          <div className="sm__sheet" onClick={() => setTimeSheet(null)}>
            <div className="sm__sheet-content" onClick={(e) => e.stopPropagation()}>
              <h2>{timeSheet === 'bedtime' ? 'Bedtime' : 'Wake time'}</h2>
              <WheelTimePicker
                hour={timeSheet === 'bedtime' ? config.bedtimeHour : config.wakeHour}
                minute={timeSheet === 'bedtime' ? config.bedtimeMinute : config.wakeMinute}
                onChange={(h, m) => updateTime(timeSheet, h, m)}
              />
              <button type="button" className="sm__sheet-close" onClick={() => setTimeSheet(null)}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {body}
      {showTabBar && <SleepTabBar active={screen as SleepTab} onSelect={selectTab} />}
    </>
  );
}
