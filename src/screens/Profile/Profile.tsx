import { useRouter } from '../../app/Router';
import { Icon } from '../../components/Icon';
import heroDesk from '../../assets/profile/hero-desk.webp';
import bannerProfile from '../../assets/profile/banner-profile.webp';
import bannerSettings from '../../assets/profile/banner-settings.webp';
import bannerAppearance from '../../assets/profile/banner-appearance.webp';
import bannerDataSync from '../../assets/profile/banner-datasync.webp';
import bannerPrivacy from '../../assets/profile/banner-privacy.webp';
import bannerAbout from '../../assets/profile/banner-about.webp';
import './Profile.css';

interface NavItem {
  path: string;
  banner: string;
  title: string;
  subtitle: string;
  wide?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/profile/account', banner: bannerProfile, title: 'Profile', subtitle: 'Your account, devices and personal settings.', wide: true },
  { path: '/profile/settings', banner: bannerSettings, title: 'Settings', subtitle: 'App preferences.' },
  { path: '/profile/appearance', banner: bannerAppearance, title: 'Appearance', subtitle: 'Theme and style.' },
  { path: '/profile/data-sync', banner: bannerDataSync, title: 'Data & Sync', subtitle: 'Backup and storage.' },
  { path: '/profile/privacy', banner: bannerPrivacy, title: 'Privacy', subtitle: 'Permissions & security.' },
  { path: '/profile/about', banner: bannerAbout, title: 'About Omni Hub', subtitle: 'Version, support and credits.', wide: true },
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
        <div className="pf__nav-bg" style={{ backgroundImage: `url(${heroDesk})` }} />
        <nav className="pf__nav-grid">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`pf__nav-banner${item.wide ? ' pf__nav-banner--wide' : ''}`}
              style={{ backgroundImage: `url(${item.banner})` }}
              onClick={() => navigate(item.path)}
            >
              <span className="pf__nav-banner-text">
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </span>
              <Icon name="chevron-right" size={18} className="pf__nav-banner-chevron" />
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
