import { useRouter } from '../../app/Router';
import { Icon } from '../../components/Icon';
import heroDesk from '../../assets/profile/hero-desk.webp';
import iconProfile from '../../assets/profile/icon-profile.webp';
import iconGear from '../../assets/profile/icon-gear.webp';
import iconPalette from '../../assets/profile/icon-palette.webp';
import iconCloud from '../../assets/profile/icon-cloud.webp';
import iconShield from '../../assets/profile/icon-shield.webp';
import iconInfo from '../../assets/profile/icon-info.webp';
import './Profile.css';

interface NavItem {
  path: string;
  icon: string;
  title: string;
  subtitle: string;
  wide?: boolean;
  accent: 'blue' | 'purple' | 'teal' | 'green' | 'yellow';
}

const NAV_ITEMS: NavItem[] = [
  { path: '/profile/account', icon: iconProfile, title: 'Profile', subtitle: 'Your account, devices and personal settings.', wide: true, accent: 'blue' },
  { path: '/profile/settings', icon: iconGear, title: 'Settings', subtitle: 'App preferences.', accent: 'blue' },
  { path: '/profile/appearance', icon: iconPalette, title: 'Appearance', subtitle: 'Theme and style.', accent: 'purple' },
  { path: '/profile/data-sync', icon: iconCloud, title: 'Data & Sync', subtitle: 'Backup and storage.', accent: 'teal' },
  { path: '/profile/privacy', icon: iconShield, title: 'Privacy', subtitle: 'Permissions and security.', accent: 'green' },
  { path: '/profile/about', icon: iconInfo, title: 'About Omni Hub', subtitle: 'Version, support and credits.', wide: true, accent: 'yellow' },
];

export function Profile() {
  const { navigate } = useRouter();

  return (
    <div className="screen">
      <div className="pf__hero" style={{ backgroundImage: `url(${heroDesk})` }}>
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
        <nav className="pf__nav-grid">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`pf__nav-tile pf__nav-tile--${item.accent}${item.wide ? ' pf__nav-tile--wide' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="pf__nav-tile-icon">
                <img src={item.icon} alt="" />
              </span>
              <span className="pf__nav-tile-text">
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </span>
              <Icon name="chevron-right" size={16} className="pf__nav-tile-chevron" />
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
