import { useEffect, useState } from 'react';

/** The app has no theme context — Profile.tsx just writes document.documentElement.dataset.theme
 *  directly (see App.tsx/Profile.tsx) and CSS reacts via [data-theme] selectors. This hook gives
 *  components that need to pick different assets per theme (not just CSS) a reactive read of the
 *  same attribute, via a MutationObserver rather than polling. */
export function useIsLightTheme(): boolean {
  const [isLight, setIsLight] = useState(() => document.documentElement.dataset.theme === 'light');

  useEffect(() => {
    const target = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsLight(target.dataset.theme === 'light');
    });
    observer.observe(target, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return isLight;
}
