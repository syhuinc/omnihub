import { Icon, type IconName } from '../components/Icon';
import { useRouter } from './Router';
import './BottomNav.css';

const TABS: { path: string; label: string; icon: IconName }[] = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/tools', label: 'Tools', icon: 'grid' },
  { path: '/pro', label: 'Pro', icon: 'crown' },
  { path: '/profile', label: 'Profile', icon: 'user' },
];

export function BottomNav() {
  const { path, navigate } = useRouter();

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const active = tab.path === '/' ? path === '/' : path === tab.path || path.startsWith(`${tab.path}/`);
        return (
          <button
            key={tab.path}
            type="button"
            className={`bottom-nav__item${active ? ' bottom-nav__item--active' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="bottom-nav__icon-wrap">
              <Icon name={tab.icon} size={22} />
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
