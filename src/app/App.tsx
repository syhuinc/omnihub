import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { BottomNav } from './BottomNav';
import { RouterProvider, useRouter } from './Router';
import { runTopBackHandler } from './useBackHandler';
import { Home } from '../screens/Home/Home';
import { Tools } from '../screens/Tools/Tools';
import { Pro } from '../screens/Pro/Pro';
import { Profile } from '../screens/Profile/Profile';
import { ToolRoute } from '../tools/ToolRoute';
import { PhoneCenter } from '../screens/PhoneCenter/PhoneCenter';
import { DeviceInfo } from '../screens/PhoneCenter/DeviceInfo';
import { StorageDetails } from '../screens/PhoneCenter/StorageDetails';
import { HealthCheck } from '../screens/PhoneCenter/HealthCheck';
import { storageGet, StorageKeys } from '../storage/db';
import { hapticTap } from '../haptics';
import { AuthProvider } from '../cloud/AuthContext';
import { useIsLightTheme } from '../theme/useTheme';
import { setStatusBarStyle, initStatusBarOverlay } from '../theme/statusBar';
import './App.css';

const TOP_LEVEL_PATHS = new Set(['/', '/tools', '/pro', '/profile']);

function Screen() {
  const { path } = useRouter();

  if (path === '/') return <Home />;
  if (path === '/tools') return <Tools />;
  if (path === '/pro') return <Pro />;
  if (path === '/profile') return <Profile />;
  if (path === '/phone-center') return <PhoneCenter />;
  if (path === '/device-info') return <DeviceInfo />;
  if (path === '/storage-details') return <StorageDetails />;
  if (path === '/health-check') return <HealthCheck />;
  if (path.startsWith('/tools/')) {
    return <ToolRoute toolId={path.slice('/tools/'.length)} />;
  }
  return <Home />;
}

function Shell() {
  const { path, navigate, back } = useRouter();
  const showNav = TOP_LEVEL_PATHS.has(path);

  useEffect(() => {
    const listener = CapacitorApp.addListener('backButton', () => {
      if (runTopBackHandler()) return;
      if (!TOP_LEVEL_PATHS.has(path)) {
        back();
      } else if (path !== '/') {
        navigate('/', { replace: true });
      } else {
        CapacitorApp.exitApp();
      }
    });
    return () => {
      listener.then((l) => l.remove());
    };
  }, [path, navigate, back]);

  return (
    <div className="app-shell">
      <div className="app-shell__content">
        <Screen />
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}

function App() {
  const isLight = useIsLightTheme();

  useEffect(() => {
    const theme = storageGet<'dark' | 'light'>(StorageKeys.theme, 'dark');
    document.documentElement.dataset.theme = theme;
    initStatusBarOverlay();
  }, []);

  useEffect(() => {
    setStatusBarStyle(isLight);
  }, [isLight]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      if (button && !button.disabled) hapticTap();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <AuthProvider>
      <RouterProvider>
        <Shell />
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
