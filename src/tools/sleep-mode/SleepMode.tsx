import { useEffect, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { hapticSelect, hapticWarning } from '../../haptics';
import { WheelTimePicker } from '../alarm/WheelTimePicker';
import { SleepModePlugin, DEFAULT_SLEEP_MODE_CONFIG, type SleepModeConfig } from '../../sleep-mode/plugin';
import { INTERVAL_OPTIONS_MIN } from './types';
import { AiPersonalityScreen } from './AiPersonalityScreen';
import { PersonalizationScreen } from './PersonalizationScreen';
import { ReminderExampleScreen } from './ReminderExampleScreen';
import { WindDownMode } from './WindDownMode';
import { SleepSounds } from './SleepSounds';
import { SleepInsights } from './SleepInsights';
import { SleepModePro } from './SleepModePro';
import './SleepMode.css';

// Fixed positions so the star field doesn't reshuffle on every re-render.
const BANNER_STARS = [
  { top: 18, left: 12, size: 3 },
  { top: 32, left: 28, size: 2 },
  { top: 14, left: 46, size: 2 },
  { top: 40, left: 58, size: 3 },
  { top: 22, left: 72, size: 2 },
  { top: 55, left: 20, size: 2 },
  { top: 60, left: 82, size: 3 },
  { top: 15, left: 88, size: 2 },
];

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minute.toString().padStart(2, '0')} ${period}`;
}

type TimeField = 'bedtime' | 'wake';
type SubScreen = 'main' | 'ai-personality' | 'personalization' | 'reminder-example' | 'wind-down' | 'sleep-sounds' | 'sleep-insights' | 'pro';

interface MenuRow {
  screen: SubScreen;
  icon: string;
  label: string;
  desc: string;
  badge?: 'pro';
}

const MENU_ROWS: MenuRow[] = [
  { screen: 'ai-personality', icon: 'user', label: 'AI Personality', desc: 'Choose how you want to be reminded' },
  { screen: 'personalization', icon: 'settings', label: 'Personalization', desc: 'Make your sleep companion more you' },
  { screen: 'reminder-example', icon: 'note', label: 'Reminder Example', desc: 'See different messages in action' },
  { screen: 'wind-down', icon: 'moon', label: 'Wind-Down Mode', desc: 'Relax before you get in bed' },
  { screen: 'sleep-sounds', icon: 'music', label: 'Sleep Sounds', desc: 'Ambient sounds to help you sleep' },
  { screen: 'sleep-insights', icon: 'trending-up', label: 'Sleep Insights', desc: 'Your real Sleep Mode history' },
  { screen: 'pro', icon: 'crown', label: 'Sleep Mode Pro', desc: 'Take it to the next level', badge: 'pro' },
];

export function SleepMode() {
  const { back } = useRouter();
  const [config, setConfig] = useState<SleepModeConfig>(DEFAULT_SLEEP_MODE_CONFIG);
  const [timeSheet, setTimeSheet] = useState<TimeField | null>(null);
  const [needsExactAlarmPermission, setNeedsExactAlarmPermission] = useState(false);
  const [screen, setScreen] = useState<SubScreen>('main');

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

  if (screen === 'ai-personality') {
    return <AiPersonalityScreen config={config} onBack={() => setScreen('main')} onPersist={persist} />;
  }
  if (screen === 'personalization') {
    return <PersonalizationScreen config={config} onBack={() => setScreen('main')} onPersist={persist} />;
  }
  if (screen === 'reminder-example') {
    return <ReminderExampleScreen onBack={() => setScreen('main')} />;
  }
  if (screen === 'wind-down') {
    return <WindDownMode onBack={() => setScreen('main')} onOpenSounds={() => setScreen('sleep-sounds')} />;
  }
  if (screen === 'sleep-sounds') {
    return <SleepSounds onBack={() => setScreen('main')} />;
  }
  if (screen === 'sleep-insights') {
    return <SleepInsights onBack={() => setScreen('main')} />;
  }
  if (screen === 'pro') {
    return <SleepModePro onBack={() => setScreen('main')} />;
  }

  return (
    <div className="screen">
      <ScreenHeader title="Sleep Mode" subtitle="Your bedtime companion" onBack={back} />

      <div className="sm__body">
        <div className="sm__banner">
          <span className="sm__banner-stars" aria-hidden="true">
            {BANNER_STARS.map((s, i) => (
              <span key={i} style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size }} />
            ))}
          </span>
          <span className="sm__banner-moon" aria-hidden="true" />
          <span className="sm__banner-cat" aria-hidden="true">
            <span className="sm__banner-cat-ear sm__banner-cat-ear--l" />
            <span className="sm__banner-cat-ear sm__banner-cat-ear--r" />
            <span className="sm__banner-cat-face">
              <span className="sm__banner-cat-eye sm__banner-cat-eye--l" />
              <span className="sm__banner-cat-eye sm__banner-cat-eye--r" />
            </span>
          </span>
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

        <section className="sm__section">
          <h2>More</h2>
          <div className="sm__menu-list">
            {MENU_ROWS.map((row) => (
              <button
                key={row.screen}
                type="button"
                className="sm__menu-row"
                onClick={() => {
                  hapticSelect();
                  setScreen(row.screen);
                }}
              >
                <span className="sm__menu-icon">
                  <Icon name={row.icon as never} size={17} />
                </span>
                <span className="sm__menu-text">
                  <span className="sm__menu-label-row">
                    <strong>{row.label}</strong>
                    {row.badge === 'pro' && <span className="sm__badge sm__badge--pro">PRO</span>}
                  </span>
                  <span>{row.desc}</span>
                </span>
                <Icon name="chevron-right" size={16} className="sm__time-chevron" />
              </button>
            ))}
          </div>
        </section>
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
