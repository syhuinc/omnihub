import { useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { hapticSelect, hapticSuccess } from '../../haptics';
import { useBackHandler } from '../../app/useBackHandler';
import type { Checklist, ChecklistItem } from './types';

interface ChecklistDetailProps {
  list: Checklist;
  onChange: (list: Checklist) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ChecklistDetail({ list, onChange, onDelete, onClose }: ChecklistDetailProps) {
  const [newItemText, setNewItemText] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useBackHandler(() => {
    if (confirmingDelete) {
      setConfirmingDelete(false);
    } else {
      onClose();
    }
  }, true);

  function update(patch: Partial<Checklist>) {
    onChange({ ...list, ...patch, updatedAt: Date.now() });
  }

  function addItem() {
    const text = newItemText.trim();
    if (!text) return;
    const item: ChecklistItem = { id: `${Date.now()}`, text, checked: false };
    update({ items: [...list.items, item] });
    setNewItemText('');
  }

  function toggleItem(id: string) {
    const items = list.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
    update({ items });
    if (items.length > 0 && items.every((i) => i.checked)) {
      hapticSuccess();
    } else {
      hapticSelect();
    }
  }

  function removeItem(id: string) {
    update({ items: list.items.filter((i) => i.id !== id) });
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.items.length) return;
    const items = [...list.items];
    [items[index], items[target]] = [items[target], items[index]];
    update({ items });
  }

  const doneCount = list.items.filter((i) => i.checked).length;

  return (
    <div className="screen">
      <ScreenHeader
        title={list.name || 'Checklist'}
        subtitle={list.items.length ? `${doneCount} of ${list.items.length} done` : undefined}
        onBack={onClose}
        action={
          <button
            type="button"
            className="cl-detail__icon-btn"
            onClick={() => setConfirmingDelete(true)}
            aria-label="Delete list"
          >
            <Icon name="trash" size={18} />
          </button>
        }
      />

      {confirmingDelete && (
        <div className="cl-detail__confirm">
          <p>Delete "{list.name || 'this list'}"? This can't be undone.</p>
          <div className="cl-detail__confirm-actions">
            <button type="button" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
            <button type="button" className="cl-detail__confirm-delete" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="cl-detail__name-row">
        <input
          className="cl-detail__name"
          value={list.name}
          placeholder="List name"
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>

      <div className="cl-detail__add-row">
        <input
          className="cl-detail__add-input"
          value={newItemText}
          placeholder="Add an item..."
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addItem();
          }}
        />
        <button type="button" className="cl-detail__add-btn" onClick={addItem} aria-label="Add item">
          <Icon name="plus" size={18} />
        </button>
      </div>

      {list.items.length === 0 ? (
        <p className="cl-detail__empty">No items yet. Add your first one above.</p>
      ) : (
        <ul className="cl-detail__items">
          {list.items.map((item, index) => (
            <li key={item.id} className="cl-detail__item">
              <button
                type="button"
                className={`cl-detail__checkbox${item.checked ? ' cl-detail__checkbox--checked' : ''}`}
                onClick={() => toggleItem(item.id)}
                aria-label={item.checked ? 'Mark as not done' : 'Mark as done'}
              >
                {item.checked && <Icon name="check" size={14} strokeWidth={3} />}
              </button>
              <span className={`cl-detail__item-text${item.checked ? ' cl-detail__item-text--checked' : ''}`}>
                {item.text}
              </span>
              <div className="cl-detail__item-actions">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                  aria-label="Move up"
                >
                  <Icon name="chevron-right" size={14} className="cl-detail__chevron-up" />
                </button>
                <button
                  type="button"
                  disabled={index === list.items.length - 1}
                  onClick={() => moveItem(index, 1)}
                  aria-label="Move down"
                >
                  <Icon name="chevron-right" size={14} className="cl-detail__chevron-down" />
                </button>
                <button type="button" onClick={() => removeItem(item.id)} aria-label="Remove item">
                  <Icon name="x" size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
