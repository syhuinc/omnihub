import { useEffect, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { hapticSelect, hapticTap, hapticWarning } from '../../haptics';
import { WheelTimePicker } from '../alarm/WheelTimePicker';
import {
  SleepModePlugin,
  DEFAULT_SLEEP_MODE_CONFIG,
  type SleepModeConfig,
  type SleepPersonality,
} from '../../sleep-mode/plugin';
import type { RelationshipStatus } from '../../sleep-mode/plugin';
import { PERSONALITY_META, RELATIONSHIP_OPTIONS, INTERVAL_OPTIONS_MIN } from './types';
import './SleepMode.css';

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minute.toString().padStart(2, '0')} ${period}`;
}

type TimeField = 'bedtime' | 'wake';

export function SleepMode() {
  const { back } = useRouter();
  const [config, setConfig] = useState<SleepModeConfig>(DEFAULT_SLEEP_MODE_CONFIG);
  const [timeSheet, setTimeSheet] = useState<TimeField | null>(null);
  const [sampleText, setSampleText] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [needsExactAlarmPermission, setNeedsExactAlarmPermission] = useState(false);

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

  function selectPersonality(id: SleepPersonality) {
    hapticSelect();
    persist({ ...config, personality: id });
  }

  function selectMode(mode: 'normal' | 'personal') {
    hapticSelect();
    persist({ ...config, mode });
  }

  function selectInterval(min: number) {
    hapticSelect();
    persist({ ...config, intervalMin: min });
  }

  function selectRelationship(id: RelationshipStatus) {
    hapticSelect();
    persist({ ...config, relationshipStatus: config.relationshipStatus === id ? null : id });
  }

  async function hearSample() {
    hapticTap();
    setSampleLoading(true);
    try {
      const { text } = await SleepModePlugin.previewMessage({
        personality: config.personality,
        callName: config.mode === 'personal' ? config.callName : null,
        hasWorkTomorrow: config.mode === 'personal' ? config.hasWorkTomorrow : false,
      });
      setSampleText(text);
      await SleepModePlugin.speakTest({ text });
    } catch {
      // web fallback / unsupported platform — nothing more we can do
    } finally {
      setSampleLoading(false);
    }
  }

  return (
    <div className="screen">
      <ScreenHeader title="Sleep Mode" subtitle="Your bedtime companion" onBack={back} />

      <div className="sm__body">
        <div className={`sm__hero${config.enabled ? ' sm__hero--active' : ''}`}>
          <span className="sm__hero-icon">
            <Icon name="moon" size={24} />
          </span>
          <div className="sm__hero-text">
            <strong>{config.enabled ? 'Sleep Mode is active' : 'Sleep Mode is off'}</strong>
            <span>
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
          <h2>Schedule</h2>
          <div className="sm__schedule-row">
            <button type="button" className="sm__time-btn" onClick={() => setTimeSheet('bedtime')}>
              <span className="sm__time-icon sm__time-icon--night">
                <Icon name="moon" size={16} />
              </span>
              <span className="sm__time-text">
                <span>Bedtime</span>
                <strong>{formatTime(config.bedtimeHour, config.bedtimeMinute)}</strong>
              </span>
            </button>
            <button type="button" className="sm__time-btn" onClick={() => setTimeSheet('wake')}>
              <span className="sm__time-icon sm__time-icon--day">
                <Icon name="sun" size={16} />
              </span>
              <span className="sm__time-text">
                <span>Wake time</span>
                <strong>{formatTime(config.wakeHour, config.wakeMinute)}</strong>
              </span>
            </button>
          </div>

          <div className="sm__interval-row">
            <span className="sm__interval-label">Check in every</span>
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
          <h2>Personality</h2>
          <div className="sm__personality-list">
            {PERSONALITY_META.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`sm__personality${config.personality === p.id ? ' sm__personality--active' : ''}`}
                onClick={() => selectPersonality(p.id)}
              >
                <span className="sm__personality-label">{p.label}</span>
                <span className="sm__personality-desc">{p.description}</span>
              </button>
            ))}
          </div>
          <button type="button" className="sm__sample-btn" onClick={hearSample} disabled={sampleLoading}>
            <Icon name="zap" size={16} />
            {sampleLoading ? 'Loading…' : 'Hear a sample'}
          </button>
          {sampleText && <p className="sm__sample-text">"{sampleText}"</p>}
        </section>

        <section className="sm__section">
          <h2>Personalization</h2>
          <div className="sm__mode-tabs">
            <button
              type="button"
              className={`sm__mode-tab${config.mode === 'normal' ? ' sm__mode-tab--active' : ''}`}
              onClick={() => selectMode('normal')}
            >
              Normal
            </button>
            <button
              type="button"
              className={`sm__mode-tab${config.mode === 'personal' ? ' sm__mode-tab--active' : ''}`}
              onClick={() => selectMode('personal')}
            >
              Personal
            </button>
          </div>
          <p className="sm__mode-hint">
            {config.mode === 'normal'
              ? "Normal Mode doesn't need any personal information — just general bedtime reminders."
              : 'Personal Mode is fully optional — fill in only what you want, skip the rest.'}
          </p>

          {config.mode === 'personal' && (
            <div className="sm__personal-fields">
              <label className="sm__field">
                <span>What should Sleep Mode call you?</span>
                <input
                  type="text"
                  placeholder="Optional"
                  value={config.callName ?? ''}
                  onChange={(e) => persist({ ...config, callName: e.target.value || null })}
                  maxLength={24}
                />
              </label>

              <div className="sm__field-row">
                <span>Work or school tomorrow?</span>
                <button
                  type="button"
                  className={`sm__switch sm__switch--small${config.hasWorkTomorrow ? ' sm__switch--on' : ''}`}
                  onClick={() => persist({ ...config, hasWorkTomorrow: !config.hasWorkTomorrow })}
                  aria-label="Toggle work or school tomorrow"
                >
                  <span className="sm__switch-knob" />
                </button>
              </div>

              <div className="sm__field">
                <span>Relationship status</span>
                <div className="sm__chip-row sm__chip-row--wrap">
                  {RELATIONSHIP_OPTIONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`sm__chip${config.relationshipStatus === r.id ? ' sm__chip--active' : ''}`}
                      onClick={() => selectRelationship(r.id)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
