import { useState } from 'react';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { Icon, type IconName } from '../../../components/Icon';
import { hapticTap, hapticSuccess, hapticWarning } from '../../../haptics';
import { playBuffer, stopPlayback, decodeBlob } from '../playback';
import { deleteClip, renameClip } from '../clipStorage';
import type { VcApi } from '../types';

/** Quick-access tiles into the same share flow below — tapping any of them opens the one real
 *  share mechanism (the OS share sheet via handleShare), same as tapping "Share" itself. There's
 *  no reliable cross-platform way to deep-link a file share straight into one specific app, so
 *  these are a recognizable visual shortcut into that sheet rather than a guaranteed direct route
 *  — the sheet that opens will show WhatsApp/Telegram/Gmail/etc. if the device has them installed. */
const SHARE_TARGETS: { id: string; label: string; icon: IconName; background: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: 'chat', background: '#25D366' },
  { id: 'telegram', label: 'Telegram', icon: 'send', background: '#229ED9' },
  { id: 'instagram', label: 'Instagram', icon: 'camera', background: 'linear-gradient(135deg,#f58529,#dd2a7b 60%,#8134af)' },
  { id: 'tiktok', label: 'TikTok', icon: 'music', background: '#111318' },
  { id: 'youtube', label: 'YouTube', icon: 'play', background: '#FF0000' },
  { id: 'gmail', label: 'Gmail', icon: 'mail', background: '#EA4335' },
  { id: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth', background: '#0A84FF' },
  { id: 'more', label: 'More', icon: 'more-dots', background: '' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ShareScreen({ api }: { api: VcApi }) {
  const clip = api.shareClip;
  const [isPlaying, setIsPlaying] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(clip?.name ?? '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!clip) {
    return (
      <div className="screen">
        <ScreenHeader title="Share / Export" onBack={api.popBack} />
        <div className="vch__body vch__body--center">
          <p className="vch__hint">Nothing to share yet.</p>
        </div>
      </div>
    );
  }

  const isSaved = clip.id !== 'unsaved';

  async function handlePlay() {
    if (!clip) return;
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
      return;
    }
    try {
      const buffer = await decodeBlob(clip.blob);
      await playBuffer(buffer, () => setIsPlaying(false));
      setIsPlaying(true);
    } catch {
      setError("Couldn't play that clip.");
    }
  }

  async function handleShare() {
    if (!clip) return;
    hapticTap();
    setError(null);
    try {
      const file = new File([clip.blob], `${clip.name}.wav`, { type: 'audio/wav' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: clip.name });
        hapticSuccess();
      } else {
        const url = URL.createObjectURL(clip.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${clip.name}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        hapticSuccess();
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') {
        hapticWarning();
        setError("Couldn't share that clip — try again.");
      }
    }
  }

  async function handleRenameSave() {
    if (!clip || !isSaved) return;
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== clip.name) {
      await renameClip(clip.id, trimmed);
      api.setShareClip({ ...clip, name: trimmed });
      api.bumpHistoryToken();
    }
    setRenaming(false);
  }

  async function handleDelete() {
    if (!clip || !isSaved) return;
    hapticWarning();
    await deleteClip(clip.id);
    api.bumpHistoryToken();
    api.setShareClip(null);
    api.goto('home');
  }

  return (
    <div className="screen">
      <ScreenHeader title="Share / Export" onBack={api.popBack} />
      <div className="vch__body">
        <div className="vch__success-banner">
          <span className="vch__success-icon">
            <Icon name="check" size={18} />
          </span>
          <div>
            {/* isSaved only reflects whether it landed in History — this still shows for a clip
                that was saved to device but not history (or neither), since either way arriving
                here means Preview & Save's Save button already ran and something is ready to go. */}
            <strong>{isSaved ? 'Saved Successfully!' : 'Ready to Share'}</strong>
            <span>
              {clip.name}.wav · {formatDuration(clip.durationSeconds)} · {formatBytes(clip.blob.size)}
            </span>
          </div>
        </div>

        {error && (
          <div className="vch__error">
            <Icon name="info" size={16} />
            <span>{error}</span>
          </div>
        )}

        {!renaming && (
          <>
          <span className="vch__section-title">Share to</span>
          <div className="vch__share-grid">
            {SHARE_TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`vch__share-target${t.id === 'more' ? ' vch__share-target--more' : ''}`}
                onClick={() => void handleShare()}
              >
                <span className="vch__share-target-icon" style={t.background ? { background: t.background } : undefined}>
                  <Icon name={t.icon} size={20} />
                </span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
          </>
        )}

        {renaming ? (
          <div className="vch__field">
            <input
              type="text"
              className="vch__text-input"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={60}
              autoFocus
            />
            <div className="vch__actions">
              <button type="button" className="vch__action vch__action--secondary" onClick={() => setRenaming(false)}>
                Cancel
              </button>
              <button type="button" className="vch__action vch__action--primary" onClick={() => void handleRenameSave()}>
                Save Name
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="vch__action vch__action--primary vch__action--full" onClick={() => void handleShare()}>
            <Icon name="share" size={18} />
            Share
          </button>
        )}

        {!renaming && (
          <div className="vch__menu-list">
            <button type="button" className="vch__menu-row" onClick={() => void handlePlay()}>
              <Icon name={isPlaying ? 'stop' : 'play'} size={17} />
              <span>{isPlaying ? 'Stop' : 'Play'}</span>
            </button>
            {isSaved && (
              <button type="button" className="vch__menu-row" onClick={() => setRenaming(true)}>
                <Icon name="edit" size={17} />
                <span>Rename</span>
              </button>
            )}
            {isSaved && !confirmingDelete && (
              <button type="button" className="vch__menu-row vch__menu-row--danger" onClick={() => setConfirmingDelete(true)}>
                <Icon name="trash" size={17} />
                <span>Delete</span>
              </button>
            )}
            {isSaved && confirmingDelete && (
              <div className="vch__confirm">
                <p>Delete "{clip.name}"? This can't be undone.</p>
                <div className="vch__actions">
                  <button type="button" className="vch__action vch__action--secondary" onClick={() => setConfirmingDelete(false)}>
                    Cancel
                  </button>
                  <button type="button" className="vch__action vch__action--danger" onClick={() => void handleDelete()}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
