import { useEffect, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { SwipeToDelete } from '../../components/SwipeToDelete';
import { useRouter } from '../../app/Router';
import { AlarmPlugin, type AlarmRecord } from '../../alarm/plugin';
import { formatTime, REPEAT_LABELS } from '../../alarm/types';
import { hapticSelect, hapticWarning } from '../../haptics';
import { AlarmEditor } from './AlarmEditor';
import { CrashLogView } from './CrashLogView';
import './Alarm.css';

export function Alarm() {
  const { back } = useRouter();
  const [alarms, setAlarms] = useState<AlarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [showCrashLog, setShowCrashLog] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

  async function refresh() {
    const { alarms: list } = await AlarmPlugin.list();
    setAlarms([...list].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggleEnabled(alarm: AlarmRecord) {
    hapticSelect();
    const turningOn = !alarm.enabled;
    if (turningOn) {
      try {
        const check = await AlarmPlugin.checkExactAlarmPermission();
        if (!check.granted) {
          hapticWarning();
          await AlarmPlugin.requestExactAlarmPermission();
          return;
        }
      } catch {
        // web fallback / unsupported platform — proceed anyway
      }
    }
    await AlarmPlugin.schedule({ ...alarm, enabled: turningOn });
    refresh();
  }

  async function handleDelete(id: string) {
    hapticWarning();
    await AlarmPlugin.cancel({ id });
    setCreatingNew(false);
    setEditingId(null);
    refresh();
  }

  if (creatingNew || editingId) {
    return (
      <AlarmEditor
        alarmId={editingId}
        onClose={() => {
          setCreatingNew(false);
          setEditingId(null);
          refresh();
        }}
        onDelete={editingId ? () => handleDelete(editingId) : undefined}
      />
    );
  }

  if (showCrashLog) {
    return <CrashLogView onClose={() => setShowCrashLog(false)} />;
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Alarm"
        subtitle="Wakes you even if the app is closed"
        onBack={back}
        action={
          <button
            type="button"
            className="alarm__debug-btn"
            onClick={() => setShowCrashLog(true)}
            aria-label="View crash log"
          >
            <Icon name="info" size={20} />
          </button>
        }
      />

      <div className="alarm__content">
        {loading ? null : alarms.length === 0 ? (
          <p className="alarm__empty">No alarms yet. Tap + to create one.</p>
        ) : (
          <ul className="alarm__list">
            {alarms.map((a) => (
              <li key={a.id}>
                <SwipeToDelete
                  id={a.id}
                  openId={openSwipeId}
                  onOpenChange={setOpenSwipeId}
                  onDelete={() => handleDelete(a.id)}
                  deleteLabel="Delete"
                >
                  <div className={`alarm__card${a.enabled ? '' : ' alarm__card--disabled'}`}>
                    <button type="button" className="alarm__card-main" onClick={() => setEditingId(a.id)}>
                      <span className="alarm__card-time">{formatTime(a.hour, a.minute)}</span>
                      <span className="alarm__card-meta">
                        {a.label ? `${a.label} · ` : ''}
                        {REPEAT_LABELS[a.repeatMode]}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`alarm__switch${a.enabled ? ' alarm__switch--on' : ''}`}
                      onClick={() => toggleEnabled(a)}
                      role="switch"
                      aria-checked={a.enabled}
                      aria-label={a.enabled ? 'Disable alarm' : 'Enable alarm'}
                    >
                      <span className="alarm__switch-knob" />
                    </button>
                  </div>
                </SwipeToDelete>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="button" className="alarm__fab" onClick={() => setCreatingNew(true)} aria-label="New alarm">
        <Icon name="plus" size={24} />
      </button>
    </div>
  );
}
