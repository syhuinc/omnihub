import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface RouterContextValue {
  path: string;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  back: () => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

function currentPath(): string {
  return window.location.hash.slice(1) || '/';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '#/';
    }
    const onHashChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (nextPath: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      const url = new URL(window.location.href);
      url.hash = `#${nextPath}`;
      window.location.replace(url.toString());
      setPath(nextPath);
    } else {
      window.location.hash = `#${nextPath}`;
    }
  };

  const back = () => window.history.back();

  return (
    <RouterContext.Provider value={{ path, navigate, back }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
