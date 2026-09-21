import { useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { RouterProvider, useRouter } from './Router';
import { Home } from '../screens/Home/Home';
import { Tools } from '../screens/Tools/Tools';
import { Pro } from '../screens/Pro/Pro';
import { Profile } from '../screens/Profile/Profile';
import { ToolRoute } from '../tools/ToolRoute';
import { storageGet, StorageKeys } from '../storage/db';
import './App.css';

const TOP_LEVEL_PATHS = new Set(['/', '/tools', '/pro', '/profile']);

function Screen() {
  const { path } = useRouter();

  if (path === '/') return <Home />;
  if (path === '/tools') return <Tools />;
  if (path === '/pro') return <Pro />;
  if (path === '/profile') return <Profile />;
  if (path.startsWith('/tools/')) {
    return <ToolRoute toolId={path.slice('/tools/'.length)} />;
  }
  return <Home />;
}

function Shell() {
  const { path } = useRouter();
  const showNav = TOP_LEVEL_PATHS.has(path);

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
  useEffect(() => {
    const theme = storageGet<'dark' | 'light'>(StorageKeys.theme, 'dark');
    document.documentElement.dataset.theme = theme;
  }, []);

  return (
    <RouterProvider>
      <Shell />
    </RouterProvider>
  );
}

export default App;
