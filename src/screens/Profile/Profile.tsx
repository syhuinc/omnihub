import { useRouter } from '../../app/Router';
import { useIsLightTheme } from '../../theme/useTheme';
import { Icon, type IconName } from '../../components/Icon';
import heroDesk from '../../assets/profile/hero-desk.webp';
import heroDeskLight from '../../assets/profile/hero-desk-light.webp';
import './Profile.css';

interface NavItem {
  path: string;
  icon: IconName;
  color: string;
  filled?: boolean;
  title: string;
  subtitle: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/profile/account', icon: 'user', color: 'blue', filled: true, title: 'Profile', subtitle: 'Your account, devices and personal settings.' },
  { path: '/profile/settings', icon: 'settings', color: 'purple', title: 'Settings', subtitle: 'App preferences.' },
  { path: '/profile/appearance', icon: 'palette', color: 'pink', title: 'Appearance', subtitle: 'Theme & visual style.' },
  { path: '/profile/data-sync', icon: 'cloud', color: 'green', title: 'Data & Sync', subtitle: 'Backup & cloud storage.' },
  { path: '/profile/privacy', icon: 'shield', color: 'orange', title: 'Privacy & Security', subtitle: 'Permissions & security.' },
  { path: '/profile/about', icon: 'info', color: 'neutral', title: 'About Omni Hub', subtitle: 'Version, support and credits.' },
];

export function Profile() {
  const { navigate } = useRouter();
  const isLight = useIsLightTheme();

  return (
    <div className="screen">
      <div className="pf__hero" style={{ backgroundImage: `url(${isLight ? heroDeskLight : heroDesk})` }}>
        <div className="pf__hero-scrim" />
        <div className="pf__hero-text">
          <span className="pf__hero-eyebrow">OMNI HUB</span>
          <h1 className="pf__hero-title">Desk</h1>
          <p className="pf__hero-subtitle">
            Your space.
            <br />
            Your settings.
            <br />
            Your data.
          </p>
        </div>
      </div>

      <div className="pf__body pf__body--nav">
        <nav className="pf__nav-list">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className="pf__nav-row"
              onClick={() => navigate(item.path)}
            >
              <span
                className={`pf__nav-row-icon pf__nav-row-icon--${item.color}${item.filled ? ' pf__nav-row-icon--filled' : ''}`}
              >
                <Icon name={item.icon} size={27.5} strokeWidth={2.3} />
              </span>
              <span className="pf__nav-row-text">
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </span>
              <span className="pf__nav-row-chevron">
                <Icon name="chevron-right" size={16} strokeWidth={3} />
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
