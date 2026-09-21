import { useRef, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { storageGet, storageSet, StorageKeys, exportBackup, importBackup, clearAllData } from '../../storage/db';
import { hapticWarning } from '../../haptics';
import './Profile.css';

type Theme = 'dark' | 'light';

export function Profile() {
  const [theme, setTheme] = useState<Theme>(() => storageGet(StorageKeys.theme, 'dark'));
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function applyTheme(next: Theme) {
    setTheme(next);
    storageSet(StorageKeys.theme, next);
    document.documentElement.dataset.theme = next;
  }

  function handleExport() {
    const payload = exportBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `omni-hub-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    setImportStatus(null);
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result));
        const { imported } = importBackup(json);
        setImportStatus({ type: 'success', message: `Restored ${imported} item${imported === 1 ? '' : 's'}. Reload to see your data.` });
      } catch (err) {
        setImportStatus({ type: 'error', message: err instanceof Error ? err.message : 'Could not read that file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleClearData() {
    hapticWarning();
    clearAllData();
    window.location.reload();
  }

  return (
    <div className="screen">
      <ScreenHeader title="Profile" subtitle="Manage your app and data." />

      <div className="pf__body">
        <section className="pf__section">
          <h2 className="pf__section-title">Appearance</h2>
          <div className="pf__theme-toggle">
            <button
              type="button"
              className={`pf__theme-btn${theme === 'dark' ? ' pf__theme-btn--active' : ''}`}
              onClick={() => applyTheme('dark')}
            >
              <Icon name="moon" size={18} />
              Dark
            </button>
            <button
              type="button"
              className={`pf__theme-btn${theme === 'light' ? ' pf__theme-btn--active' : ''}`}
              onClick={() => applyTheme('light')}
            >
              <Icon name="sun" size={18} />
              Light
            </button>
          </div>
        </section>

        <section className="pf__section">
          <h2 className="pf__section-title">Backup</h2>
          <div className="pf__card">
            <button type="button" className="pf__row" onClick={handleExport}>
              <span className="pf__row-icon">
                <Icon name="download" size={18} />
              </span>
              <span className="pf__row-text">
                <strong>Export Backup</strong>
                <span>Save all your data as a JSON file</span>
              </span>
              <Icon name="chevron-right" size={18} className="pf__row-chevron" />
            </button>
            <div className="pf__divider" />
            <button type="button" className="pf__row" onClick={handleImportClick}>
              <span className="pf__row-icon">
                <Icon name="upload" size={18} />
              </span>
              <span className="pf__row-text">
                <strong>Import Backup</strong>
                <span>Restore data from a JSON file</span>
              </span>
              <Icon name="chevron-right" size={18} className="pf__row-chevron" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="pf__file-input"
              onChange={handleFileChange}
            />
          </div>
          {importStatus && (
            <p className={`pf__status pf__status--${importStatus.type}`}>{importStatus.message}</p>
          )}
        </section>

        <section className="pf__section">
          <h2 className="pf__section-title">Data</h2>
          <div className="pf__card">
            {!confirmingClear ? (
              <button type="button" className="pf__row pf__row--danger" onClick={() => setConfirmingClear(true)}>
                <span className="pf__row-icon pf__row-icon--danger">
                  <Icon name="trash" size={18} />
                </span>
                <span className="pf__row-text">
                  <strong>Clear All Data</strong>
                  <span>Delete everything stored on this device</span>
                </span>
              </button>
            ) : (
              <div className="pf__confirm">
                <p>This will permanently delete all notes, lists, expenses and settings. This can't be undone.</p>
                <div className="pf__confirm-actions">
                  <button type="button" onClick={() => setConfirmingClear(false)}>
                    Cancel
                  </button>
                  <button type="button" className="pf__confirm-delete" onClick={handleClearData}>
                    Delete Everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="pf__section">
          <h2 className="pf__section-title">Privacy</h2>
          <div className="pf__card pf__privacy">
            <Icon name="shield" size={20} className="pf__privacy-icon" />
            <p>
              Omni Hub collects no data. There are no accounts, no network requests, no analytics and no ads.
              Everything you create stays only in this app, on this device.
            </p>
          </div>
        </section>

        <section className="pf__section">
          <h2 className="pf__section-title">About</h2>
          <div className="pf__card">
            <div className="pf__row pf__row--static">
              <span className="pf__row-text">
                <strong>Omni Hub</strong>
                <span>Everything you need. One place.</span>
              </span>
            </div>
            <div className="pf__divider" />
            <div className="pf__row pf__row--static">
              <span className="pf__row-text">
                <strong>Version</strong>
              </span>
              <span className="pf__row-value">1.0.0</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
