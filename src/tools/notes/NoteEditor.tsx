import { useRef, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useBackHandler } from '../../app/useBackHandler';
import { hapticSelect, hapticTap } from '../../haptics';
import { NOTE_CATEGORIES, NOTE_COLORS, type Note, type NoteCategory, type NoteColor } from './types';

const MAX_BODY = 10000;

interface NoteEditorProps {
  note: Note;
  onChange: (note: Note) => void;
  onDelete: () => void;
  onClose: () => void;
  onTogglePinned: () => void;
  onToggleFavorite: () => void;
}

export function NoteEditor({ note, onChange, onDelete, onClose, onTogglePinned, onToggleFavorite }: NoteEditorProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useBackHandler(() => {
    if (confirmingDelete) setConfirmingDelete(false);
    else if (showMenu) setShowMenu(false);
    else if (showCategorySheet) setShowCategorySheet(false);
    else onClose();
  }, true);

  function update(patch: Partial<Note>) {
    onChange({ ...note, ...patch, updatedAt: Date.now() });
  }

  function wrapSelection(prefix: string, suffix: string = prefix) {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const selected = note.body.slice(s, e) || 'text';
    const next = `${note.body.slice(0, s)}${prefix}${selected}${suffix}${note.body.slice(e)}`.slice(0, MAX_BODY);
    update({ body: next });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + prefix.length, s + prefix.length + selected.length);
    });
  }

  function prefixLines(linePrefix: (i: number) => string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const selected = note.body.slice(s, e) || 'List item';
    const transformed = selected
      .split('\n')
      .map((line, i) => `${linePrefix(i)}${line}`)
      .join('\n');
    const next = `${note.body.slice(0, s)}${transformed}${note.body.slice(e)}`.slice(0, MAX_BODY);
    update({ body: next });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s, s + transformed.length);
    });
  }

  function insertLink() {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const selected = note.body.slice(s, e) || 'link text';
    const next = `${note.body.slice(0, s)}[${selected}](url)${note.body.slice(e)}`.slice(0, MAX_BODY);
    update({ body: next });
    requestAnimationFrame(() => {
      ta.focus();
      const urlStart = s + selected.length + 3;
      ta.setSelectionRange(urlStart, urlStart + 3);
    });
  }

  return (
    <div className="screen">
      <ScreenHeader
        title={note.title ? 'Edit Note' : 'New Note'}
        subtitle="Make it yours"
        onBack={onClose}
        action={
          <div className="note-editor__actions">
            <button
              type="button"
              className="note-editor__icon-btn"
              onClick={() => setConfirmingDelete(true)}
              aria-label="Delete note"
            >
              <Icon name="trash" size={18} />
            </button>
            <button
              type="button"
              className="note-editor__icon-btn"
              onClick={() => {
                hapticTap();
                setShowMenu(true);
              }}
              aria-label="More options"
            >
              <Icon name="more-dots" size={18} />
            </button>
          </div>
        }
      />

      {confirmingDelete && (
        <div className="note-editor__confirm">
          <p>Move this note to Trash?</p>
          <div className="note-editor__confirm-actions">
            <button type="button" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
            <button type="button" className="note-editor__confirm-delete" onClick={onDelete}>
              Move to Trash
            </button>
          </div>
        </div>
      )}

      <div className="note-editor__body">
        <div className="note-editor__title-row">
          <input
            className="note-editor__title"
            placeholder="Title"
            value={note.title}
            onChange={(e) => update({ title: e.target.value })}
            autoFocus={!note.title && !note.body}
          />
          {note.title && (
            <button type="button" className="note-editor__title-clear" onClick={() => update({ title: '' })} aria-label="Clear title">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        <div className="note-editor__toolbar">
          <button type="button" onClick={() => wrapSelection('**')} aria-label="Bold">
            <strong>B</strong>
          </button>
          <button type="button" onClick={() => wrapSelection('_')} aria-label="Italic">
            <em>I</em>
          </button>
          <button type="button" onClick={() => wrapSelection('__')} aria-label="Underline">
            <span style={{ textDecoration: 'underline' }}>U</span>
          </button>
          <button type="button" onClick={() => prefixLines(() => '- ')} aria-label="Bulleted list">
            <Icon name="checklist" size={16} />
          </button>
          <button type="button" onClick={() => prefixLines((i) => `${i + 1}. `)} aria-label="Numbered list">
            <Icon name="sort" size={16} />
          </button>
          <button type="button" onClick={insertLink} aria-label="Insert link">
            <Icon name="globe" size={16} />
          </button>
        </div>

        <div className="note-editor__text-wrap">
          <textarea
            ref={textareaRef}
            className="note-editor__text"
            placeholder="Start writing..."
            value={note.body}
            maxLength={MAX_BODY}
            onChange={(e) => update({ body: e.target.value })}
          />
          <span className="note-editor__char-count">
            {note.body.length}/{MAX_BODY}
          </span>
        </div>

        <button type="button" className="note-editor__row" onClick={() => setShowCategorySheet(true)}>
          <span className="note-editor__row-icon note-editor__row-icon--category">
            <Icon name="tag" size={18} />
          </span>
          <span className="note-editor__row-text">
            <strong>Category</strong>
            <span>{note.category ?? 'Uncategorized'}</span>
          </span>
          <Icon name="chevron-right" size={18} />
        </button>

        <div className="note-editor__row note-editor__row--color">
          <span className="note-editor__row-icon note-editor__row-icon--palette">
            <Icon name="palette" size={18} />
          </span>
          <span className="note-editor__row-text">
            <strong>Color</strong>
          </span>
          <span className="note-editor__swatches">
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`note-editor__swatch note-editor__swatch--${c}${(note.color ?? 'blue') === c ? ' note-editor__swatch--active' : ''}`}
                onClick={() => {
                  hapticSelect();
                  update({ color: c as NoteColor });
                }}
                aria-label={`Set color ${c}`}
              />
            ))}
          </span>
        </div>

        <button type="button" className="note-editor__save" onClick={onClose}>
          <Icon name="check" size={18} strokeWidth={3} />
          Save Note
        </button>
      </div>

      {showCategorySheet && (
        <div className="note-editor__sheet-overlay" onClick={() => setShowCategorySheet(false)}>
          <div className="note-editor__sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Category</h2>
            {NOTE_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`note-editor__sheet-item${(note.category ?? 'Uncategorized') === c ? ' note-editor__sheet-item--active' : ''}`}
                onClick={() => {
                  hapticSelect();
                  update({ category: c as NoteCategory });
                  setShowCategorySheet(false);
                }}
              >
                {c}
                {(note.category ?? 'Uncategorized') === c && <Icon name="check" size={16} strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {showMenu && (
        <div className="note-editor__sheet-overlay" onClick={() => setShowMenu(false)}>
          <div className="note-editor__sheet" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="note-editor__sheet-item"
              onClick={() => {
                onTogglePinned();
                setShowMenu(false);
              }}
            >
              <Icon name="pin" size={17} />
              {note.pinned ? 'Unpin' : 'Pin to Top'}
            </button>
            <button
              type="button"
              className="note-editor__sheet-item"
              onClick={() => {
                onToggleFavorite();
                setShowMenu(false);
              }}
            >
              <Icon name="star" size={17} />
              {note.favorited ? 'Remove Favorite' : 'Add to Favorites'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
