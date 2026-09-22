import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { Icon } from '../../components/Icon';
import { SwipeToDelete } from '../../components/SwipeToDelete';
import { useRouter } from '../../app/Router';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import { hapticWarning } from '../../haptics';
import { useCloudSync } from '../../cloud/useCloudSync';
import { NoteEditor } from './NoteEditor';
import type { Note } from './types';
import './Notes.css';

function newNote(): Note {
  const now = Date.now();
  return { id: `${now}`, title: '', body: '', pinned: false, createdAt: now, updatedAt: now };
}

function preview(body: string): string {
  const trimmed = body.trim();
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
}

export function Notes() {
  const { back } = useRouter();
  const [notes, setNotes] = useState<Note[]>(() => storageGet(StorageKeys.notes, []));
  const [draft, setDraft] = useState<Note | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

  function rawPersist(next: Note[]) {
    setNotes(next);
    storageSet(StorageKeys.notes, next);
  }

  const { persist } = useCloudSync('notes', notes, rawPersist);

  const visibleNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? notes.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
      : notes;
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, query]);

  const editingNote = editingId ? (draft?.id === editingId ? draft : notes.find((n) => n.id === editingId)) : null;

  function openNew() {
    const note = newNote();
    setDraft(note);
    setEditingId(note.id);
  }

  function openExisting(note: Note) {
    setDraft(null);
    setEditingId(note.id);
  }

  function handleChange(updated: Note) {
    if (draft?.id === updated.id) {
      setDraft(updated);
    } else {
      persist(notes.map((n) => (n.id === updated.id ? updated : n)));
    }
  }

  function closeEditor() {
    if (draft) {
      const hasContent = draft.title.trim() || draft.body.trim();
      if (hasContent) {
        persist([draft, ...notes]);
      }
      setDraft(null);
    }
    setEditingId(null);
  }

  function deleteEditing() {
    if (draft) {
      setDraft(null);
    } else if (editingId) {
      persist(notes.filter((n) => n.id !== editingId));
    }
    setEditingId(null);
  }

  function deleteNote(id: string) {
    hapticWarning();
    persist(notes.filter((n) => n.id !== id));
  }

  if (editingNote) {
    return (
      <NoteEditor note={editingNote} onChange={handleChange} onDelete={deleteEditing} onClose={closeEditor} />
    );
  }

  return (
    <div className="screen">
      <ScreenHeader title="Notes" onBack={back} />

      <div className="notes__search">
        <SearchBar value={query} onChange={setQuery} placeholder="Search notes..." />
      </div>

      <div className="notes__content">
        {visibleNotes.length === 0 ? (
          <p className="notes__empty">
            {query ? `No notes match "${query}".` : 'No notes yet. Tap + to write your first one.'}
          </p>
        ) : (
          <ul className="notes__list">
            {visibleNotes.map((note) => (
              <li key={note.id}>
                <SwipeToDelete
                  id={note.id}
                  openId={openSwipeId}
                  onOpenChange={setOpenSwipeId}
                  onDelete={() => deleteNote(note.id)}
                  deleteLabel="Delete"
                >
                  <button type="button" className="notes__card" onClick={() => openExisting(note)}>
                    <div className="notes__card-header">
                      <span className="notes__card-title">{note.title || 'Untitled'}</span>
                      {note.pinned && <Icon name="pin" size={14} className="notes__pin-icon" />}
                    </div>
                    {note.body && <p className="notes__card-preview">{preview(note.body)}</p>}
                  </button>
                </SwipeToDelete>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="button" className="notes__fab" onClick={openNew} aria-label="New note">
        <Icon name="plus" size={24} />
      </button>
    </div>
  );
}
