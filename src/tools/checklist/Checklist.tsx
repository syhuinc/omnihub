import { useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import { useCloudSync } from '../../cloud/useCloudSync';
import { ChecklistDetail } from './ChecklistDetail';
import type { Checklist as ChecklistType } from './types';
import './Checklist.css';

function newList(): ChecklistType {
  const now = Date.now();
  return { id: `${now}`, name: '', items: [], createdAt: now, updatedAt: now };
}

export function Checklist() {
  const { back } = useRouter();
  const [lists, setLists] = useState<ChecklistType[]>(() => storageGet(StorageKeys.checklists, []));
  const [draft, setDraft] = useState<ChecklistType | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  function rawPersist(next: ChecklistType[]) {
    setLists(next);
    storageSet(StorageKeys.checklists, next);
  }

  const { persist } = useCloudSync('checklists', lists, rawPersist);

  const sortedLists = [...lists].sort((a, b) => b.updatedAt - a.updatedAt);
  const openList = openId ? (draft?.id === openId ? draft : lists.find((l) => l.id === openId)) : null;

  function createList() {
    const list = newList();
    setDraft(list);
    setOpenId(list.id);
  }

  function handleChange(updated: ChecklistType) {
    if (draft?.id === updated.id) {
      setDraft(updated);
    } else {
      persist(lists.map((l) => (l.id === updated.id ? updated : l)));
    }
  }

  function closeDetail() {
    if (draft) {
      if (draft.name.trim() || draft.items.length > 0) {
        persist([draft, ...lists]);
      }
      setDraft(null);
    }
    setOpenId(null);
  }

  function deleteOpen() {
    if (draft) {
      setDraft(null);
    } else if (openId) {
      persist(lists.filter((l) => l.id !== openId));
    }
    setOpenId(null);
  }

  if (openList) {
    return (
      <ChecklistDetail list={openList} onChange={handleChange} onDelete={deleteOpen} onClose={closeDetail} />
    );
  }

  return (
    <div className="screen">
      <ScreenHeader title="Checklist" onBack={back} />

      <div className="cl__content">
        {sortedLists.length === 0 ? (
          <p className="cl__empty">No lists yet. Tap + to create your first checklist.</p>
        ) : (
          <ul className="cl__list">
            {sortedLists.map((list) => {
              const done = list.items.filter((i) => i.checked).length;
              return (
                <li key={list.id}>
                  <button type="button" className="cl__card" onClick={() => setOpenId(list.id)}>
                    <span className="cl__card-name">{list.name || 'Untitled List'}</span>
                    <span className="cl__card-progress">
                      {list.items.length ? `${done}/${list.items.length}` : 'Empty'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button type="button" className="cl__fab" onClick={createList} aria-label="New list">
        <Icon name="plus" size={24} />
      </button>
    </div>
  );
}
