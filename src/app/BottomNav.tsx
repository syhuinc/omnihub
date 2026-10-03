import { Icon, type IconName } from '../components/Icon';
import { useRouter } from './Router';
import { useIsLightTheme } from '../theme/useTheme';
import navIconDark from '../assets/syxdi-ai/nav-icon-dark.webp';
import navIconLight from '../assets/syxdi-ai/nav-icon-light.webp';
import './BottomNav.css';

interface Tab {
  path: string;
  label: string;
  /** Flat Icon-set name. Unused (and omitted) for a `brand` tab, which renders its own image instead. */
  icon?: IconName;
  /** Rendered as its own image badge instead of the flat Icon set, with no text label. */
  brand?: boolean;
}

const TABS: Tab[] = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/tools', label: 'Tools', icon: 'grid' },
  { path: '/ai', label: '', brand: true },
  { path: '/craft', label: 'Craft', icon: 'wrench' },
  { path: '/profile', label: 'Profile', icon: 'user' },
];

export function BottomNav() {
  const { path, navigate } = useRouter();
  const isLight = useIsLightTheme();

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const active = tab.path === '/' ? path === '/' : path === tab.path || path.startsWith(`${tab.path}/`);
        return (
          <button
            key={tab.path}
            type="button"
            className={`bottom-nav__item${active ? ' bottom-nav__item--active' : ''}${tab.brand ? ' bottom-nav__item--brand' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-current={active ? 'page' : undefined}
            aria-label={tab.brand ? 'SYXDI AI' : undefined}
          >
            <span className="bottom-nav__icon-wrap">
              {tab.brand ? (
                <img
                  src={isLight ? navIconLight : navIconDark}
                  alt=""
                  className="bottom-nav__brand-icon"
                />
              ) : (
                <Icon name={tab.icon!} size={22} />
              )}
            </span>
            {tab.label && <span>{tab.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
