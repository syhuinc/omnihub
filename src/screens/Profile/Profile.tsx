import { useRouter } from '../../app/Router';
import { useIsLightTheme } from '../../theme/useTheme';
import { Icon } from '../../components/Icon';
import heroDesk from '../../assets/profile/hero-desk.webp';
import heroDeskLight from '../../assets/profile/hero-desk-light.webp';
import iconProfile from '../../assets/profile/icon-profile.webp';
import iconSettings from '../../assets/profile/icon-settings.webp';
import iconAppearance from '../../assets/profile/icon-appearance.webp';
import iconDataSync from '../../assets/profile/icon-datasync.webp';
import iconPrivacy from '../../assets/profile/icon-privacy.webp';
import iconAbout from '../../assets/profile/icon-about.webp';
import './Profile.css';

interface NavItem {
  path: string;
  icon: string;
  title: string;
  subtitle: string;
  wide?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/profile/account', icon: iconProfile, title: 'Profile', subtitle: 'Your account, devices and personal settings.', wide: true },
  { path: '/profile/settings', icon: iconSettings, title: 'Settings', subtitle: 'App preferences.' },
  { path: '/profile/appearance', icon: iconAppearance, title: 'Appearance', subtitle: 'Theme & visual style.' },
  { path: '/profile/data-sync', icon: iconDataSync, title: 'Data & Sync', subtitle: 'Backup & cloud storage.' },
  { path: '/profile/privacy', icon: iconPrivacy, title: 'Privacy & Security', subtitle: 'Permissions & security.' },
  { path: '/profile/about', icon: iconAbout, title: 'About Omni Hub', subtitle: 'Version, support and credits.', wide: true },
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
            Your space, your settings.
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
              className={`pf__nav-card${item.wide ? ' pf__nav-card--wide' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <img className="pf__nav-card-icon" src={item.icon} alt="" />
              <span className="pf__nav-card-text">
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </span>
              <span className="pf__nav-card-chevron">
                <Icon name="chevron-right" size={14} />
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
