import { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { storageGet, storageSet, StorageKeys, exportBackup, importBackup, clearAllData } from '../../storage/db';
import { clearAllFiles } from '../../vault/fileStore';
import { hapticWarning } from '../../haptics';
import { useAuth } from '../../cloud/AuthContext';
import { useSettings } from '../../settings/SettingsContext';
import './Profile.css';

type Theme = 'dark' | 'light';

export function ProfileAccount() {
  const { back, navigate } = useRouter();
  const {
    user,
    loading: authLoading,
    signingIn,
    deletingAccount,
    error: authError,
    signInWithGoogle,
    signOut,
    deleteAccount,
  } = useAuth();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [confirmingDeleteAccount, setConfirmingDeleteAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    hapticWarning();
    setDeleteAccountError(null);
    try {
      await deleteAccount();
      clearAllData();
      await clearAllFiles();
      window.location.reload();
    } catch (err) {
      setDeleteAccountError(err instanceof Error ? err.message : 'Could not delete your account. Please try again.');
    }
  }

  return (
    <div className="screen">
      <ScreenHeader title="Profile" subtitle="Your account, devices and personal settings." onBack={back} />
      <div className="pf__body">
        <section className="pf__section">
          <div className="pf__card">
            {authLoading ? (
              <div className="pf__row pf__row--static">
                <span className="pf__row-text">
                  <span>Checking sign-in status…</span>
                </span>
              </div>
            ) : user ? (
              <>
                <div className="pf__account">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="" className="pf__account-avatar" />
                  ) : (
                    <span className="pf__account-avatar pf__account-avatar--fallback">
                      <Icon name="user" size={20} />
                    </span>
                  )}
                  <span className="pf__account-text">
                    <strong>{user.displayName || 'Signed in'}</strong>
                    <span>{user.email}</span>
                  </span>
                </div>
                <div className="pf__divider" />
                {!confirmingSignOut ? (
                  <button type="button" className="pf__row pf__row--danger" onClick={() => setConfirmingSignOut(true)}>
                    <span className="pf__row-icon pf__row-icon--danger">
                      <Icon name="x" size={18} />
                    </span>
                    <span className="pf__row-text">
                      <strong>Sign Out</strong>
                    </span>
                  </button>
                ) : (
                  <div className="pf__confirm">
                    <p>Sign out of your Google account? Your data stays on this device, but it'll stop syncing until you sign back in.</p>
                    <div className="pf__confirm-actions">
                      <button type="button" onClick={() => setConfirmingSignOut(false)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="pf__confirm-delete"
                        onClick={() => {
                          setConfirmingSignOut(false);
                          signOut();
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
                <div className="pf__divider" />
                {!confirmingDeleteAccount ? (
                  <button
                    type="button"
                    className="pf__row pf__row--danger"
                    onClick={() => setConfirmingDeleteAccount(true)}
                  >
                    <span className="pf__row-icon pf__row-icon--danger">
                      <Icon name="trash" size={18} />
                    </span>
                    <span className="pf__row-text">
                      <strong>Delete My Account</strong>
                      <span>Permanently erase your synced data and account</span>
                    </span>
                  </button>
                ) : (
                  <div className="pf__confirm">
                    <p>
                      This permanently deletes everything synced to your account (notes, checklists, expenses,
                      budgets, subscriptions, debts, alarms, and Vault) from our servers, deletes your account
                      itself, and clears this device's local data too. This can't be undone.
                    </p>
                    <div className="pf__confirm-actions">
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteAccount(false)}
                        disabled={deletingAccount}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="pf__confirm-delete"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                      >
                        {deletingAccount ? 'Deleting…' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                )}
                {deleteAccountError && <p className="pf__status pf__status--error">{deleteAccountError}</p>}
              </>
            ) : (
              <button type="button" className="pf__row" onClick={signInWithGoogle} disabled={signingIn}>
                <span className="pf__row-icon pf__row-icon--blue">
                  <Icon name="user" size={18} />
                </span>
                <span className="pf__row-text">
                  <strong>{signingIn ? 'Signing in…' : 'Sign in with Google'}</strong>
                  <span>Optional — first step toward syncing your data across devices</span>
                </span>
                <Icon name="chevron-right" size={18} className="pf__row-chevron" />
              </button>
            )}
          </div>
          {authError && <p className="pf__status pf__status--error">{authError}</p>}
        </section>

        <section className="pf__section">
          <div className="pf__card">
            <button type="button" className="pf__row" onClick={() => navigate('/profile/privacy')}>
              <span className="pf__row-icon pf__row-icon--green">
                <Icon name="shield" size={18} />
              </span>
              <span className="pf__row-text">
                <strong>Privacy &amp; Security</strong>
                <span>See what signing in does and doesn't change</span>
              </span>
              <Icon name="chevron-right" size={18} className="pf__row-chevron" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ProfileSettings() {
  const { back } = useRouter();
  const { nav3dIconEnabled, setNav3dIconEnabled } = useSettings();

  return (
    <div className="screen">
      <ScreenHeader title="Settings" subtitle="App preferences and behavior." onBack={back} />
      <div className="pf__body">
        <section className="pf__section">
          <div className="pf__card">
            <div className="pf__row">
              <span className="pf__row-icon pf__row-icon--purple">
                <Icon name="zap" size={18} />
              </span>
              <span className="pf__row-text">
                <strong>3D Nav Icon</strong>
                <span>Swipeable 3D icon for the AI tab. Turn off to save battery.</span>
              </span>
              <button
                type="button"
                className={`pf__switch${nav3dIconEnabled ? ' pf__switch--on' : ''}`}
                onClick={() => setNav3dIconEnabled(!nav3dIconEnabled)}
                aria-label="Toggle 3D nav icon"
              >
                <span className="pf__switch-knob" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ProfileAppearance() {
  const { back } = useRouter();
  const [theme, setTheme] = useState<Theme>(() => storageGet(StorageKeys.theme, 'dark'));

  function applyTheme(next: Theme) {
    setTheme(next);
    storageSet(StorageKeys.theme, next);
    document.documentElement.dataset.theme = next;
  }

  return (
    <div className="screen">
      <ScreenHeader title="Appearance" subtitle="Theme, colors, and visual style." onBack={back} />
      <div className="pf__body">
        <section className="pf__section">
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
      </div>
    </div>
  );
}

export function ProfileDataSync() {
  const { back } = useRouter();
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const payload = exportBackup();
    const json = JSON.stringify(payload, null, 2);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `omni-hub-backup-${date}.json`;

    if (!Capacitor.isNativePlatform()) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    const sharedPath = `shared/${filename}`;
    try {
      await Filesystem.writeFile({ path: sharedPath, data: json, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
      const { uri } = await Filesystem.getUri({ path: sharedPath, directory: Directory.Cache });
      await Share.share({ title: 'Omni Hub Backup', url: uri, dialogTitle: 'Save your backup' });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (!/cancel/i.test(message)) {
        setImportStatus({ type: 'error', message: 'Could not export your backup. Please try again.' });
      }
    }
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
        setImportStatus({ type: 'success', message: `Restored ${imported} item${imported === 1 ? '' : 's'}. Reloading…` });
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        setImportStatus({ type: 'error', message: err instanceof Error ? err.message : 'Could not read that file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleClearData() {
    hapticWarning();
    clearAllData();
    await clearAllFiles();
    window.location.reload();
  }

  return (
    <div className="screen">
      <ScreenHeader title="Data & Sync" subtitle="Cloud sync, backup, and data management." onBack={back} />
      <div className="pf__body">
        <section className="pf__section">
          <h2 className="pf__section-title">Backup</h2>
          <div className="pf__card">
            <button type="button" className="pf__row" onClick={handleExport}>
              <span className="pf__row-icon pf__row-icon--blue">
                <Icon name="download" size={18} />
              </span>
              <span className="pf__row-text">
                <strong>Export Backup</strong>
                <span>Save your tool data as a JSON file (Vault files export separately, from inside Vault)</span>
              </span>
              <Icon name="chevron-right" size={18} className="pf__row-chevron" />
            </button>
            <div className="pf__divider" />
            <button type="button" className="pf__row" onClick={handleImportClick}>
              <span className="pf__row-icon pf__row-icon--purple">
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
                <p>
                  This will permanently delete everything stored on this device — notes, lists,
                  expenses, alarms, your Vault (including its PIN-locked photos and files), and
                  settings. This can't be undone.
                </p>
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
      </div>
    </div>
  );
}

export function ProfilePrivacy() {
  const { back, navigate } = useRouter();

  return (
    <div className="screen">
      <ScreenHeader title="Privacy & Security" subtitle="Permissions, data controls and security options." onBack={back} />
      <div className="pf__body">
        <section className="pf__section">
          <div className="pf__card">
            <div className="pf__privacy">
              <span className="pf__row-icon pf__row-icon--green pf__privacy-icon">
                <Icon name="shield" size={18} />
              </span>
              <p>
                No account is needed to use Omni Hub. Signing in is entirely optional and only
                used to sync your data across your own devices; nothing is shared, sold, or used for
                ads or analytics.
              </p>
            </div>
            <div className="pf__divider" />
            <button type="button" className="pf__row" onClick={() => navigate('/privacy-policy')}>
              <span className="pf__row-icon pf__row-icon--green">
                <Icon name="file" size={18} />
              </span>
              <span className="pf__row-text">
                <strong>Privacy Policy</strong>
                <span>Exactly what's collected, and when</span>
              </span>
              <Icon name="chevron-right" size={18} className="pf__row-chevron" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ProfileAbout() {
  const { back } = useRouter();

  return (
    <div className="screen">
      <ScreenHeader title="About Omni Hub" subtitle="Version, support and credits." onBack={back} />
      <div className="pf__body">
        <section className="pf__section">
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
              <span className="pf__row-value">1.0</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
