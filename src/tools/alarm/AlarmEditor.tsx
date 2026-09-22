import { useEffect, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon, type IconName } from '../../components/Icon';
import {
  AlarmPlugin,
  type AlarmRecord,
  DEFAULT_BACKUP_OFFSETS_MIN,
  MAX_BACKUP_OFFSETS,
  MIN_BACKUP_OFFSET_MIN,
  MAX_BACKUP_OFFSET_MIN,
} from '../../alarm/plugin';
import { formatTime, type RepeatMode, type TimeCategory, REPEAT_LABELS } from '../../alarm/types';
import { loadPresets, addPreset, removePreset } from '../../alarm/presets';
import { loadCategoryDefaults } from '../../alarm/ringtones';
import { hapticSelect, hapticSuccess, hapticWarning } from '../../haptics';
import { useBackHandler } from '../../app/useBackHandler';
import { RingtonePicker } from './RingtonePicker';
import './Alarm.css';

const CATEGORIES: { id: TimeCategory; label: string; icon: IconName }[] = [
  { id: 'morning', label: 'Morning', icon: 'sunrise' },
  { id: 'afternoon', label: 'Afternoon', icon: 'sun' },
  { id: 'evening', label: 'Evening', icon: 'sunset' },
  { id: 'night', label: 'Night', icon: 'moon' },
];

const REPEAT_MODES: RepeatMode[] = ['today', 'daily', 'weekend', 'weekdays'];

function to24HourInputValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

interface AlarmEditorProps {
  alarmId: string | null;
  onClose: () => void;
  onDelete?: () => void;
}

export function AlarmEditor({ alarmId, onClose, onDelete }: AlarmEditorProps) {
  const [loaded, setLoaded] = useState(alarmId === null);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [label, setLabel] = useState('');
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('today');
  const [soundUri, setSoundUri] = useState<string | null>(null);
  const [soundName, setSoundName] = useState<string | null>(null);
  const [backupEnabled, setBackupEnabled] = useState(false);
  const [backupOffsets, setBackupOffsets] = useState<number[]>(DEFAULT_BACKUP_OFFSETS_MIN);
  const [openCategory, setOpenCategory] = useState<TimeCategory | null>(null);
  const [editingPresets, setEditingPresets] = useState(false);
  const [presets, setPresets] = useState(loadPresets());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [needsExactAlarmPermission, setNeedsExactAlarmPermission] = useState(false);
  const [showRingtonePicker, setShowRingtonePicker] = useState(false);

  useBackHandler(() => {
    if (confirmingDelete) {
      setConfirmingDelete(false);
    } else {
      onClose();
    }
  }, !showRingtonePicker);

  useEffect(() => {
    if (alarmId === null) return;
    AlarmPlugin.list().then(({ alarms }) => {
      const existing = alarms.find((a: AlarmRecord) => a.id === alarmId);
      if (existing) {
        setHour(existing.hour);
        setMinute(existing.minute);
        setLabel(existing.label);
        setRepeatMode(existing.repeatMode);
        setSoundUri(existing.soundUri);
        setSoundName(existing.soundName);
        setBackupEnabled(existing.backupEnabled);
        setBackupOffsets(existing.backupOffsetsMin?.length ? existing.backupOffsetsMin : DEFAULT_BACKUP_OFFSETS_MIN);
      }
      setLoaded(true);
    });
  }, [alarmId]);

  function pickPreset(category: TimeCategory, h: number, m: number) {
    hapticSelect();
    setHour(h);
    setMinute(m);
    setOpenCategory(category);

    // Apply the category's default sound, but only if the user hasn't already picked one
    // explicitly - a category tap shouldn't clobber a sound they chose themselves.
    if (soundUri === null) {
      const categoryDefault = loadCategoryDefaults()[category];
      if (categoryDefault) {
        setSoundUri(categoryDefault.uri);
        setSoundName(categoryDefault.name);
      }
    }
  }

  function handleCustomTimeChange(value: string) {
    const [h, m] = value.split(':').map((n) => parseInt(n, 10));
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      setHour(h);
      setMinute(m);
    }
  }

  function handleAddCurrentAsPreset(category: TimeCategory) {
    const next = addPreset(category, { hour, minute });
    setPresets(next);
    hapticSuccess();
  }

  function handleRemovePreset(category: TimeCategory, h: number, m: number) {
    const next = removePreset(category, { hour: h, minute: m });
    setPresets(next);
    hapticWarning();
  }

  function handleBackupOffsetChange(index: number, value: string) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return;
    const clamped = Math.max(MIN_BACKUP_OFFSET_MIN, Math.min(MAX_BACKUP_OFFSET_MIN, n));
    setBackupOffsets((prev) => prev.map((v, i) => (i === index ? clamped : v)));
  }

  function handleRemoveBackupOffset(index: number) {
    hapticWarning();
    setBackupOffsets((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddBackupOffset() {
    hapticSelect();
    setBackupOffsets((prev) => {
      const last = prev[prev.length - 1] ?? 5;
      return [...prev, Math.min(MAX_BACKUP_OFFSET_MIN, last + 10)];
    });
  }

  async function handleSave() {
    try {
      const check = await AlarmPlugin.checkNotificationPermission();
      if (!check.granted) {
        await AlarmPlugin.requestNotificationPermission();
      }
    } catch {
      // web fallback / unsupported platform — proceed anyway
    }

    try {
      const check = await AlarmPlugin.checkExactAlarmPermission();
      if (!check.granted) {
        hapticWarning();
        setNeedsExactAlarmPermission(true);
        await AlarmPlugin.requestExactAlarmPermission();
        return;
      }
    } catch {
      // web fallback / unsupported platform — proceed anyway
    }

    const { armed } = await AlarmPlugin.schedule({
      id: alarmId ?? undefined,
      hour,
      minute,
      label: label.trim(),
      repeatMode,
      enabled: true,
      soundUri,
      soundName,
      backupEnabled,
      backupOffsetsMin: [...backupOffsets].sort((a, b) => a - b),
    });

    if (!armed) {
      hapticWarning();
      setNeedsExactAlarmPermission(true);
      return;
    }

    setNeedsExactAlarmPermission(false);
    hapticSuccess();
    onClose();
  }

  if (!loaded) {
    return <div className="screen" />;
  }

  if (showRingtonePicker) {
    return (
      <RingtonePicker
        excludeAlarmId={alarmId}
        onClose={() => setShowRingtonePicker(false)}
        onSelect={(sound) => {
          setSoundUri(sound.uri);
          setSoundName(sound.name);
          setShowRingtonePicker(false);
        }}
      />
    );
  }

  return (
    <div className="screen">
      <ScreenHeader
        title={alarmId ? 'Edit Alarm' : 'New Alarm'}
        onBack={onClose}
        action={
          onDelete && (
            <button
              type="button"
              className="alarm-editor__icon-btn"
              onClick={() => setConfirmingDelete(true)}
              aria-label="Delete alarm"
            >
              <Icon name="trash" size={18} />
            </button>
          )
        }
      />

      {needsExactAlarmPermission && (
        <div className="alarm-editor__confirm">
          <p>
            Omni Hub needs the "Alarms &amp; reminders" permission to schedule alarms. Turn it on
            in the Settings screen that just opened, then come back and tap Save again.
          </p>
          <div className="alarm-editor__confirm-actions">
            <button type="button" onClick={() => AlarmPlugin.requestExactAlarmPermission()}>
              Open Settings
            </button>
          </div>
        </div>
      )}

      {confirmingDelete && (
        <div className="alarm-editor__confirm">
          <p>Delete this alarm? This can't be undone.</p>
          <div className="alarm-editor__confirm-actions">
            <button type="button" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="alarm-editor__confirm-delete"
              onClick={() => onDelete && onDelete()}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="alarm-editor__body">
        <div className="alarm-editor__time-display">{formatTime(hour, minute)}</div>
        <input
          type="time"
          className="alarm-editor__time-input"
          value={to24HourInputValue(hour, minute)}
          onChange={(e) => handleCustomTimeChange(e.target.value)}
        />

        <div className="alarm-editor__section-header">
          <h2>Quick Pick</h2>
          <button
            type="button"
            className="alarm-editor__edit-presets"
            onClick={() => setEditingPresets((v) => !v)}
          >
            {editingPresets ? 'Done' : 'Edit'}
          </button>
        </div>

        <div className="alarm-editor__categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`alarm-editor__category${openCategory === cat.id ? ' alarm-editor__category--open' : ''}`}
              onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
            >
              <Icon name={cat.icon} size={22} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {openCategory && (
          <div className="alarm-editor__presets">
            {presets[openCategory].map((p) => (
              <div key={`${p.hour}:${p.minute}`} className="alarm-editor__preset-chip-wrap">
                <button
                  type="button"
                  className={`alarm-editor__preset-chip${hour === p.hour && minute === p.minute ? ' alarm-editor__preset-chip--active' : ''}`}
                  onClick={() => pickPreset(openCategory, p.hour, p.minute)}
                >
                  {formatTime(p.hour, p.minute)}
                </button>
                {editingPresets && (
                  <button
                    type="button"
                    className="alarm-editor__preset-remove"
                    onClick={() => handleRemovePreset(openCategory, p.hour, p.minute)}
                    aria-label={`Remove ${formatTime(p.hour, p.minute)} preset`}
                  >
                    <Icon name="x" size={11} strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}
            {editingPresets && (
              <button
                type="button"
                className="alarm-editor__preset-chip alarm-editor__preset-chip--add"
                onClick={() => handleAddCurrentAsPreset(openCategory)}
              >
                <Icon name="plus" size={13} /> Add {formatTime(hour, minute)}
              </button>
            )}
          </div>
        )}

        <h2 className="alarm-editor__section-title">Repeat</h2>
        <div className="alarm-editor__repeat-row">
          {REPEAT_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`alarm-editor__repeat-chip${repeatMode === mode ? ' alarm-editor__repeat-chip--active' : ''}`}
              onClick={() => {
                hapticSelect();
                setRepeatMode(mode);
              }}
            >
              {REPEAT_LABELS[mode]}
            </button>
          ))}
        </div>

        <h2 className="alarm-editor__section-title">Label</h2>
        <input
          type="text"
          className="alarm-editor__label-input"
          placeholder="Alarm"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />

        <h2 className="alarm-editor__section-title">Sound</h2>
        <button type="button" className="alarm-editor__sound-row" onClick={() => setShowRingtonePicker(true)}>
          <span>{soundName || 'Default Alarm'}</span>
          <Icon name="chevron-right" size={18} />
        </button>

        <h2 className="alarm-editor__section-title">Backup Alarms</h2>
        <div className="alarm-editor__backup-row">
          <div className="alarm-editor__backup-text">
            <span>Ring again if ignored</span>
            <p>If you don't dismiss or snooze, we'll ring again after each of these.</p>
          </div>
          <button
            type="button"
            className={`alarm__switch${backupEnabled ? ' alarm__switch--on' : ''}`}
            onClick={() => {
              hapticSelect();
              setBackupEnabled((v) => !v);
            }}
            role="switch"
            aria-checked={backupEnabled}
            aria-label="Toggle backup alarms"
          >
            <span className="alarm__switch-knob" />
          </button>
        </div>

        {backupEnabled && (
          <div className="alarm-editor__backup-offsets">
            {backupOffsets.map((offset, index) => (
              <div key={index} className="alarm-editor__backup-offset-chip">
                <input
                  type="number"
                  inputMode="numeric"
                  min={MIN_BACKUP_OFFSET_MIN}
                  max={MAX_BACKUP_OFFSET_MIN}
                  value={offset}
                  onChange={(e) => handleBackupOffsetChange(index, e.target.value)}
                />
                <span>min</span>
                {backupOffsets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBackupOffset(index)}
                    aria-label={`Remove ${offset} minute backup`}
                  >
                    <Icon name="x" size={11} strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}
            {backupOffsets.length < MAX_BACKUP_OFFSETS && (
              <button
                type="button"
                className="alarm-editor__backup-offset-add"
                onClick={handleAddBackupOffset}
              >
                <Icon name="plus" size={13} /> Add
              </button>
            )}
          </div>
        )}

        <button type="button" className="alarm-editor__save" onClick={handleSave}>
          Save Alarm
        </button>
      </div>
    </div>
  );
}
