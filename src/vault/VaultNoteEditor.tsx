import { useState } from 'react';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icon } from '../components/Icon';
import { useBackHandler } from '../app/useBackHandler';
import type { VaultNote } from './types';

interface VaultNoteEditorProps {
  note: VaultNote;
  onChange: (note: VaultNote) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function VaultNoteEditor({ note, onChange, onDelete, onClose }: VaultNoteEditorProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useBackHandler(() => {
    if (confirmingDelete) {
      setConfirmingDelete(false);
    } else {
      onClose();
    }
  }, true);

  function update(patch: Partial<VaultNote>) {
    onChange({ ...note, ...patch, updatedAt: Date.now() });
  }

  return (
    <div className="screen">
      <ScreenHeader
        title={note.title ? 'Edit Note' : 'New Note'}
        onBack={onClose}
        action={
          <button
            type="button"
            className="vault-editor__icon-btn"
            onClick={() => setConfirmingDelete(true)}
            aria-label="Delete note"
          >
            <Icon name="trash" size={18} />
          </button>
        }
      />

      {confirmingDelete && (
        <div className="vault-editor__confirm">
          <p>Delete this note? This can't be undone.</p>
          <div className="vault-editor__confirm-actions">
            <button type="button" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
            <button type="button" className="vault-editor__confirm-delete" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="vault-editor__body">
        <input
          className="vault-editor__title"
          placeholder="Title"
          value={note.title}
          onChange={(e) => update({ title: e.target.value })}
          autoFocus={!note.title && !note.body}
        />
        <textarea
          className="vault-editor__text"
          placeholder="Start writing..."
          value={note.body}
          onChange={(e) => update({ body: e.target.value })}
        />
      </div>
    </div>
  );
}
