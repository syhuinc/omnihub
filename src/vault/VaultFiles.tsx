import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { encryptBytes, decryptBytes } from './crypto';
import { putFile, getAllFiles, deleteFile, type VaultFileRecord } from './fileStore';
import { hapticSuccess, hapticWarning } from '../haptics';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string): boolean {
  return mime.startsWith('image/');
}

interface VaultFilesProps {
  vaultKey: CryptoKey;
}

export function VaultFiles({ vaultKey }: VaultFilesProps) {
  const [files, setFiles] = useState<VaultFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    getAllFiles().then((records) => {
      if (!cancelled) {
        setFiles(records.sort((a, b) => b.createdAt - a.createdAt));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    for (const file of Array.from(fileList)) {
      const bytes = await file.arrayBuffer();
      const { iv, data } = await encryptBytes(vaultKey, bytes);
      const record: VaultFileRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        iv,
        data,
        createdAt: Date.now(),
      };
      await putFile(record);
      setFiles((prev) => [record, ...prev]);
    }
    setBusy(false);
    hapticSuccess();
    if (inputRef.current) inputRef.current.value = '';
  }

  async function openFile(record: VaultFileRecord) {
    setBusy(true);
    try {
      const plain = await decryptBytes(vaultKey, record.iv, record.data);
      const blob = new Blob([plain], { type: record.mime });
      const url = URL.createObjectURL(blob);
      if (isImage(record.mime)) {
        setPreview({ url, name: record.name });
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = record.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteFile(id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setConfirmingDeleteId(null);
    hapticWarning();
  }

  if (preview) {
    return (
      <div className="vault-preview">
        <button
          type="button"
          className="vault-preview__close"
          onClick={() => {
            URL.revokeObjectURL(preview.url);
            setPreview(null);
          }}
          aria-label="Close preview"
        >
          <Icon name="x" size={20} />
        </button>
        <img src={preview.url} alt={preview.name} className="vault-preview__img" />
        <p className="vault-preview__name">{preview.name}</p>
      </div>
    );
  }

  return (
    <div className="vault__content">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="vault-files__input"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {loading ? null : files.length === 0 ? (
        <p className="vault__empty">No private files yet. Tap + to add photos or files.</p>
      ) : (
        <ul className="vault-files__list">
          {files.map((f) => (
            <li key={f.id} className="vault-files__row">
              <button type="button" className="vault-files__item" onClick={() => openFile(f)}>
                <span className={`vault-files__icon${isImage(f.mime) ? ' vault-files__icon--image' : ''}`}>
                  <Icon name={isImage(f.mime) ? 'image' : 'file'} size={18} />
                </span>
                <span className="vault-files__meta">
                  <span className="vault-files__name">{f.name}</span>
                  <span className="vault-files__size">{formatSize(f.size)}</span>
                </span>
              </button>
              {confirmingDeleteId === f.id ? (
                <div className="vault-files__confirm">
                  <button type="button" onClick={() => setConfirmingDeleteId(null)} aria-label="Cancel">
                    <Icon name="x" size={16} />
                  </button>
                  <button type="button" className="vault-files__confirm-delete" onClick={() => handleDelete(f.id)} aria-label="Confirm delete">
                    <Icon name="check" size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="vault-files__delete"
                  onClick={() => setConfirmingDeleteId(f.id)}
                  aria-label={`Delete ${f.name}`}
                >
                  <Icon name="trash" size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className={`vault__fab${busy ? ' vault__fab--busy' : ''}`}
        onClick={() => inputRef.current?.click()}
        aria-label="Add photos or files"
        disabled={busy}
      >
        <Icon name="plus" size={24} />
      </button>
    </div>
  );
}
