import { useEffect, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { SwipeToDelete } from '../../components/SwipeToDelete';
import { useRouter } from '../../app/Router';
import { useBackHandler } from '../../app/useBackHandler';
import { useAuth } from '../../cloud/AuthContext';
import { startAlarmSync, stopAlarmSync, scheduleAlarmSynced, cancelAlarmSynced } from '../../cloud/alarmSync';
import { AlarmPlugin, type AlarmRecord } from '../../alarm/plugin';
import { formatTime, REPEAT_LABELS } from '../../alarm/types';
import { hapticSelect, hapticWarning } from '../../haptics';
import { AlarmEditor } from './AlarmEditor';
import { CrashLogView } from './CrashLogView';
import { RingtonePicker } from './RingtonePicker';
import './Alarm.css';

export function Alarm() {
  const { back } = useRouter();
  const { user } = useAuth();
  const [alarms, setAlarms] = useState<AlarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [showCrashLog, setShowCrashLog] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkSound, setShowBulkSound] = useState(false);

  async function refresh() {
    const { alarms: list } = await AlarmPlugin.list();
    setAlarms([...list].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!user) return;
    startAlarmSync(user.uid, refresh);
    return () => {
      stopAlarmSync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  function exitSelecting() {
    setSelecting(false);
    setSelectedIds(new Set());
  }

  useBackHandler(exitSelecting, selecting);

  function toggleSelected(id: string) {
    hapticSelect();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
    await scheduleAlarmSynced({ ...alarm, enabled: turningOn });
    refresh();
  }

  async function handleDelete(id: string) {
    hapticWarning();
    await cancelAlarmSynced(id);
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

  if (showBulkSound) {
    return (
      <RingtonePicker
        mode="bulk"
        alarmIds={[...selectedIds]}
        onSelect={() => {
          setShowBulkSound(false);
          exitSelecting();
          refresh();
        }}
        onClose={() => setShowBulkSound(false)}
      />
    );
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Alarm"
        subtitle={selecting ? `${selectedIds.size} selected` : 'Wakes you even if the app is closed'}
        onBack={selecting ? exitSelecting : back}
        action={
          selecting ? (
            <>
              {selectedIds.size > 0 && (
                <button type="button" className="alarm__header-btn" onClick={() => setShowBulkSound(true)}>
                  Change Sound
                </button>
              )}
              <button type="button" className="alarm__header-btn" onClick={exitSelecting}>
                Cancel
              </button>
            </>
          ) : (
            <>
              {alarms.length > 0 && (
                <button type="button" className="alarm__header-btn" onClick={() => setSelecting(true)}>
                  Select
                </button>
              )}
              <button
                type="button"
                className="alarm__debug-btn"
                onClick={() => setShowCrashLog(true)}
                aria-label="View crash log"
              >
                <Icon name="info" size={20} />
              </button>
            </>
          )
        }
      />

      <div className="alarm__content">
        {loading ? null : alarms.length === 0 ? (
          <p className="alarm__empty">No alarms yet. Tap + to create one.</p>
        ) : (
          <ul className="alarm__list">
            {alarms.map((a) => {
              const card = (
                <div className={`alarm__card${a.enabled ? '' : ' alarm__card--disabled'}`}>
                  <button
                    type="button"
                    className="alarm__card-main"
                    onClick={() => (selecting ? toggleSelected(a.id) : setEditingId(a.id))}
                  >
                    <span className="alarm__card-time">{formatTime(a.hour, a.minute)}</span>
                    <span className="alarm__card-meta">
                      {a.label ? `${a.label} · ` : ''}
                      {REPEAT_LABELS[a.repeatMode]}
                      {a.backupEnabled ? ' · Backup' : ''}
                    </span>
                  </button>
                  {selecting ? (
                    <button
                      type="button"
                      className={`alarm__checkbox${selectedIds.has(a.id) ? ' alarm__checkbox--checked' : ''}`}
                      onClick={() => toggleSelected(a.id)}
                      aria-label={selectedIds.has(a.id) ? 'Deselect alarm' : 'Select alarm'}
                    >
                      {selectedIds.has(a.id) && <Icon name="check" size={14} strokeWidth={3} />}
                    </button>
                  ) : (
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
                  )}
                </div>
              );

              return (
                <li key={a.id}>
                  {selecting ? (
                    card
                  ) : (
                    <SwipeToDelete
                      id={a.id}
                      openId={openSwipeId}
                      onOpenChange={setOpenSwipeId}
                      onDelete={() => handleDelete(a.id)}
                      deleteLabel="Delete"
                    >
                      {card}
                    </SwipeToDelete>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!selecting && (
        <button type="button" className="alarm__fab" onClick={() => setCreatingNew(true)} aria-label="New alarm">
          <Icon name="plus" size={24} />
        </button>
      )}
    </div>
  );
}
