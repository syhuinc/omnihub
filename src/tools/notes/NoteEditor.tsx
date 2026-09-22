import { useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useBackHandler } from '../../app/useBackHandler';
import type { Note } from './types';

interface NoteEditorProps {
  note: Note;
  onChange: (note: Note) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function NoteEditor({ note, onChange, onDelete, onClose }: NoteEditorProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useBackHandler(() => {
    if (confirmingDelete) {
      setConfirmingDelete(false);
    } else {
      onClose();
    }
  }, true);

  function update(patch: Partial<Note>) {
    onChange({ ...note, ...patch, updatedAt: Date.now() });
  }

  return (
    <div className="screen">
      <ScreenHeader
        title={note.title ? 'Edit Note' : 'New Note'}
        onBack={onClose}
        action={
          <div className="note-editor__actions">
            <button
              type="button"
              className={`note-editor__icon-btn${note.pinned ? ' note-editor__icon-btn--active' : ''}`}
              onClick={() => update({ pinned: !note.pinned })}
              aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
            >
              <Icon name="pin" size={18} />
            </button>
            <button
              type="button"
              className="note-editor__icon-btn"
              onClick={() => setConfirmingDelete(true)}
              aria-label="Delete note"
            >
              <Icon name="trash" size={18} />
            </button>
          </div>
        }
      />

      {confirmingDelete && (
        <div className="note-editor__confirm">
          <p>Delete this note? This can't be undone.</p>
          <div className="note-editor__confirm-actions">
            <button type="button" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
            <button type="button" className="note-editor__confirm-delete" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="note-editor__body">
        <input
          className="note-editor__title"
          placeholder="Title"
          value={note.title}
          onChange={(e) => update({ title: e.target.value })}
          autoFocus={!note.title && !note.body}
        />
        <textarea
          className="note-editor__text"
          placeholder="Start writing..."
          value={note.body}
          onChange={(e) => update({ body: e.target.value })}
        />
      </div>
    </div>
  );
}
