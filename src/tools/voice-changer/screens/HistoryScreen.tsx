import { useEffect, useState } from 'react';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { Icon } from '../../../components/Icon';
import { hapticTap, hapticSelect } from '../../../haptics';
import { listClips, setFavorite, type SavedClip } from '../clipStorage';
import type { VcApi } from '../types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function HistoryScreen({ api, favoritesOnly = false }: { api: VcApi; favoritesOnly?: boolean }) {
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

  async function toggleFavorite(e: React.MouseEvent, clip: SavedClip) {
    e.stopPropagation();
    hapticSelect();
    const next = !clip.favorite;
    setClips((cs) => cs?.map((c) => (c.id === clip.id ? { ...c, favorite: next } : c)) ?? cs);
    await setFavorite(clip.id, next);
  }

  const visible = favoritesOnly ? clips?.filter((c) => c.favorite) ?? null : clips;

  return (
    <div className="screen">
      <ScreenHeader
        title={favoritesOnly ? 'Saved' : 'History'}
        subtitle={favoritesOnly ? 'Clips you’ve bookmarked' : 'Your saved voice clips'}
        onBack={api.popBack}
      />
      <div className="vch__body vch__body--with-tabbar">
        {visible === null && <p className="vch__hint">Loading…</p>}
        {visible !== null && visible.length === 0 && (
          <div className="vch__empty">
            <Icon name={favoritesOnly ? 'bookmark' : 'clock'} size={32} />
            <p>
              {favoritesOnly
                ? 'Nothing saved yet — tap the bookmark on a clip to keep it here.'
                : 'No saved clips yet — record something and save it to see it here.'}
            </p>
          </div>
        )}
        {visible !== null && visible.length > 0 && (
          <div className="vch__history-list">
            {visible.map((clip) => (
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
                <span
                  role="button"
                  tabIndex={0}
                  className={`vch__history-fav${clip.favorite ? ' vch__history-fav--active' : ''}`}
                  onClick={(e) => void toggleFavorite(e, clip)}
                  aria-label={clip.favorite ? 'Remove from Saved' : 'Add to Saved'}
                >
                  <Icon name="bookmark" size={16} style={clip.favorite ? { fill: 'currentColor' } : undefined} />
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
