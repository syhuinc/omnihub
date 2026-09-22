import { useEffect, useState } from 'react';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icon } from '../components/Icon';
import { useRouter } from '../app/Router';
import { storageGet, storageSet, storageRemove, StorageKeys } from '../storage/db';
import { hapticSuccess, hapticWarning } from '../haptics';
import { deriveVaultKey, encryptText, decryptText, randomSalt, type EncryptedPayload } from './crypto';
import { PinPad, PIN_LENGTH } from './PinPad';
import { VaultNoteEditor } from './VaultNoteEditor';
import type { VaultNote, VaultNoteRecord } from './types';
import './Vault.css';

const CANARY_TEXT = 'omni-hub-vault-ok';

type Status = 'loading' | 'setupPin' | 'confirmPin' | 'locked' | 'unlocked';

function newNote(): VaultNote {
  const now = Date.now();
  return { id: `${now}`, title: '', body: '', createdAt: now, updatedAt: now };
}

export function Vault() {
  const { back } = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [pinInput, setPinInput] = useState('');
  const [pendingPin, setPendingPin] = useState('');
  const [error, setError] = useState('');
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [notes, setNotes] = useState<VaultNote[]>([]);
  const [draft, setDraft] = useState<VaultNote | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    const salt = storageGet<string | null>(StorageKeys.vaultSalt, null);
    setStatus(salt ? 'locked' : 'setupPin');
  }, []);

  useEffect(() => {
    if (pinInput.length < PIN_LENGTH) return;
    if (status === 'setupPin') {
      setPendingPin(pinInput);
      setPinInput('');
      setStatus('confirmPin');
    } else if (status === 'confirmPin') {
      if (pinInput === pendingPin) {
        void completeSetup(pinInput);
      } else {
        setError("PINs don't match. Try again.");
        hapticWarning();
        setPinInput('');
        setPendingPin('');
        setStatus('setupPin');
      }
    } else if (status === 'locked') {
      void attemptUnlock(pinInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinInput]);

  async function completeSetup(pin: string) {
    const salt = randomSalt();
    const derivedKey = await deriveVaultKey(pin, salt);
    const canary = await encryptText(derivedKey, CANARY_TEXT);
    storageSet(StorageKeys.vaultSalt, salt);
    storageSet(StorageKeys.vaultCanary, canary);
    if (changingPin) {
      // Re-encrypt the existing notes with the new key rather than wiping them.
      await persistNotes(notes, derivedKey);
    } else {
      storageSet(StorageKeys.vaultNotes, []);
      setNotes([]);
    }
    setKey(derivedKey);
    setError('');
    setPinInput('');
    setPendingPin('');
    setChangingPin(false);
    hapticSuccess();
    setStatus('unlocked');
  }

  async function attemptUnlock(pin: string) {
    const salt = storageGet<string | null>(StorageKeys.vaultSalt, null);
    const canary = storageGet<EncryptedPayload | null>(StorageKeys.vaultCanary, null);
    if (!salt || !canary) return;

    const derivedKey = await deriveVaultKey(pin, salt);
    try {
      const plain = await decryptText(derivedKey, canary);
      if (plain !== CANARY_TEXT) throw new Error('mismatch');
    } catch {
      setError('Incorrect PIN');
      hapticWarning();
      setPinInput('');
      return;
    }

    const records = storageGet<VaultNoteRecord[]>(StorageKeys.vaultNotes, []);
    const decrypted = await Promise.all(
      records.map(async (r): Promise<VaultNote> => {
        try {
          const json = await decryptText(derivedKey, { iv: r.iv, data: r.data });
          const { title, body } = JSON.parse(json) as { title: string; body: string };
          return { id: r.id, title, body, createdAt: r.createdAt, updatedAt: r.updatedAt };
        } catch {
          return { id: r.id, title: 'Could not decrypt', body: '', createdAt: r.createdAt, updatedAt: r.updatedAt };
        }
      }),
    );

    setKey(derivedKey);
    setNotes(decrypted);
    setError('');
    setPinInput('');
    setStatus('unlocked');
  }

  async function persistNotes(next: VaultNote[], activeKey: CryptoKey) {
    setNotes(next);
    const records: VaultNoteRecord[] = await Promise.all(
      next.map(async (n) => {
        const { iv, data } = await encryptText(activeKey, JSON.stringify({ title: n.title, body: n.body }));
        return { id: n.id, iv, data, createdAt: n.createdAt, updatedAt: n.updatedAt };
      }),
    );
    storageSet(StorageKeys.vaultNotes, records);
  }

  function lock() {
    setKey(null);
    setNotes([]);
    setDraft(null);
    setEditingId(null);
    setSettingsOpen(false);
    setPinInput('');
    setError('');
    setStatus('locked');
  }

  function openNew() {
    const note = newNote();
    setDraft(note);
    setEditingId(note.id);
  }

  function openExisting(note: VaultNote) {
    setDraft(null);
    setEditingId(note.id);
  }

  function handleChange(updated: VaultNote) {
    if (draft?.id === updated.id) {
      setDraft(updated);
    } else if (key) {
      void persistNotes(
        notes.map((n) => (n.id === updated.id ? updated : n)),
        key,
      );
    }
  }

  function closeEditor() {
    if (draft && key) {
      const hasContent = draft.title.trim() || draft.body.trim();
      if (hasContent) {
        void persistNotes([draft, ...notes], key);
      }
      setDraft(null);
    }
    setEditingId(null);
  }

  function deleteEditing() {
    if (draft) {
      setDraft(null);
    } else if (editingId && key) {
      void persistNotes(
        notes.filter((n) => n.id !== editingId),
        key,
      );
    }
    setEditingId(null);
  }

  function startChangePin() {
    setSettingsOpen(false);
    setChangingPin(true);
    setPinInput('');
    setPendingPin('');
    setError('');
    setStatus('setupPin');
  }

  function resetVault() {
    hapticWarning();
    storageRemove(StorageKeys.vaultSalt);
    storageRemove(StorageKeys.vaultCanary);
    storageRemove(StorageKeys.vaultNotes);
    setKey(null);
    setNotes([]);
    setDraft(null);
    setEditingId(null);
    setSettingsOpen(false);
    setConfirmingReset(false);
    setPinInput('');
    setPendingPin('');
    setError('');
    setChangingPin(false);
    setStatus('setupPin');
  }

  const editingNote = editingId ? (draft?.id === editingId ? draft : notes.find((n) => n.id === editingId)) : null;

  if (status === 'loading') {
    return <div className="screen" />;
  }

  if (status === 'setupPin' && changingPin) {
    return (
      <div className="screen">
        <ScreenHeader title="Vault" onBack={() => setStatus('unlocked')} />
        <PinPad title="New PIN" subtitle="Choose a new 4-digit PIN" value={pinInput} onChange={setPinInput} error={error} />
      </div>
    );
  }

  if (status === 'setupPin' || status === 'confirmPin') {
    if (status === 'confirmPin' && changingPin) {
      return (
        <div className="screen">
          <ScreenHeader title="Vault" onBack={() => setStatus('unlocked')} />
          <PinPad title="Confirm New PIN" subtitle="Enter it again" value={pinInput} onChange={setPinInput} error={error} />
        </div>
      );
    }
    return (
      <div className="screen">
        <ScreenHeader title="Vault" onBack={back} />
        <PinPad
          title={status === 'setupPin' ? 'Set a PIN' : 'Confirm PIN'}
          subtitle={
            status === 'setupPin'
              ? 'Create a 4-digit PIN to lock your private notes'
              : 'Enter it again to confirm'
          }
          value={pinInput}
          onChange={setPinInput}
          error={error}
        />
      </div>
    );
  }

  if (status === 'locked') {
    return (
      <div className="screen">
        <ScreenHeader title="Vault" onBack={back} />
        <PinPad title="Enter PIN" subtitle="Unlock your private notes" value={pinInput} onChange={setPinInput} error={error} />
      </div>
    );
  }

  if (editingNote) {
    return (
      <VaultNoteEditor note={editingNote} onChange={handleChange} onDelete={deleteEditing} onClose={closeEditor} />
    );
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Vault"
        subtitle="Private, PIN-locked notes"
        onBack={back}
        action={
          <div className="vault__header-actions">
            <button type="button" className="vault-editor__icon-btn" onClick={lock} aria-label="Lock vault">
              <Icon name="lock" size={18} />
            </button>
            <button
              type="button"
              className="vault-editor__icon-btn"
              onClick={() => setSettingsOpen((v) => !v)}
              aria-label="Vault settings"
            >
              <Icon name="settings" size={18} />
            </button>
          </div>
        }
      />

      {settingsOpen && (
        <div className="vault__settings">
          <button type="button" className="vault__settings-row" onClick={startChangePin}>
            <Icon name="lock" size={16} />
            Change PIN
          </button>
          {!confirmingReset ? (
            <button
              type="button"
              className="vault__settings-row vault__settings-row--danger"
              onClick={() => setConfirmingReset(true)}
            >
              <Icon name="trash" size={16} />
              Reset Vault
            </button>
          ) : (
            <div className="vault__reset-confirm">
              <p>This deletes all private notes and your PIN. This can't be undone.</p>
              <div className="vault-editor__confirm-actions">
                <button type="button" onClick={() => setConfirmingReset(false)}>
                  Cancel
                </button>
                <button type="button" className="vault-editor__confirm-delete" onClick={resetVault}>
                  Delete Everything
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="vault__content">
        {notes.length === 0 ? (
          <p className="vault__empty">No private notes yet. Tap + to write your first one.</p>
        ) : (
          <ul className="vault__list">
            {[...notes]
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((note) => (
                <li key={note.id}>
                  <button type="button" className="vault__card" onClick={() => openExisting(note)}>
                    <span className="vault__card-title">{note.title || 'Untitled'}</span>
                    {note.body && <p className="vault__card-preview">{note.body.slice(0, 80)}</p>}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      <button type="button" className="vault__fab" onClick={openNew} aria-label="New private note">
        <Icon name="plus" size={24} />
      </button>
    </div>
  );
}
