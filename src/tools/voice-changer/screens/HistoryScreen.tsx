import { useEffect, useState } from 'react';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { Icon } from '../../../components/Icon';
import { hapticTap } from '../../../haptics';
import { listClips, type SavedClip } from '../clipStorage';
import type { VcApi } from '../types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function HistoryScreen({ api }: { api: VcApi }) {
  const [clips, setClips] = useState<SavedClip[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listClips()
      .then((c) => {
        if (!cancelled) setClips(c);
      })
      .catch(() => {
        if (!cancelled) setClips([]);
      });
    return () => {
      cancelled = true;
    };
  }, [api.refreshHistoryToken]);

  function openClip(clip: SavedClip) {
    hapticTap();
    api.setShareClip(clip);
    api.goto('share');
  }

  return (
    <div className="screen">
      <ScreenHeader title="History" subtitle="Your saved voice clips" onBack={api.popBack} />
      <div className="vch__body">
        {clips === null && <p className="vch__hint">Loading…</p>}
        {clips !== null && clips.length === 0 && (
          <div className="vch__empty">
            <Icon name="clock" size={32} />
            <p>No saved clips yet — record something and save it to see it here.</p>
          </div>
        )}
        {clips !== null && clips.length > 0 && (
          <div className="vch__history-list">
            {clips.map((clip) => (
              <button key={clip.id} type="button" className="vch__history-row" onClick={() => openClip(clip)}>
                <span className="vch__history-icon">
                  <Icon name="mic" size={18} />
                </span>
                <span className="vch__history-info">
                  <strong>{clip.name}</strong>
                  <span>
                    {clip.effectLabel} · {formatDuration(clip.durationSeconds)} · {formatDate(clip.createdAt)}
                  </span>
                </span>
                <Icon name="chevron-right" size={16} className="vch__history-chevron" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
