import { createContext, useContext, useState, type ReactNode } from 'react';
import { storageGet, storageSet, StorageKeys } from '../storage/db';

interface SettingsContextValue {
  /** Live, swipe-to-rotate 3D render for the AI tab's nav icon vs. a static image. */
  nav3dIconEnabled: boolean;
  setNav3dIconEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [nav3dIconEnabled, setNav3dIconEnabledState] = useState(() =>
    storageGet(StorageKeys.nav3dIconEnabled, true),
  );

  function setNav3dIconEnabled(enabled: boolean) {
    setNav3dIconEnabledState(enabled);
    storageSet(StorageKeys.nav3dIconEnabled, enabled);
  }

  return (
    <SettingsContext.Provider value={{ nav3dIconEnabled, setNav3dIconEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
