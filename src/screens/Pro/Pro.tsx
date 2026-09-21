import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon } from '../../components/Icon';
import './Pro.css';

const FEATURES = [
  { icon: 'grid' as const, title: 'More Tools', desc: 'Even more utilities, all offline.' },
  { icon: 'sun' as const, title: 'Premium Themes', desc: 'Personalize how Omni Hub looks.' },
  { icon: 'pin' as const, title: 'Unlimited Pins & Lists', desc: 'No limits on what you can save.' },
  { icon: 'info' as const, title: 'Priority Support', desc: "We'll be here when you need help." },
];

export function Pro() {
  return (
    <div className="screen">
      <ScreenHeader title="Go Pro" subtitle="Unlock your full potential." />

      <div className="pro__body">
        <div className="pro__hero">
          <span className="pro__hero-badge">
            <Icon name="crown" size={14} />
            Coming Soon
          </span>
          <h2>More Power.{'\n'}More Freedom.{'\n'}A Better You.</h2>
        </div>

        <ul className="pro__features">
          {FEATURES.map((f) => (
            <li key={f.title} className="pro__feature">
              <span className="pro__feature-icon">
                <Icon name={f.icon} size={18} />
              </span>
              <span className="pro__feature-text">
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="pro__coming-soon-card">
          <Icon name="crown" size={28} className="pro__coming-soon-icon" />
          <h3>Omni Hub Pro is on its way</h3>
          <p>We're putting the finishing touches on Pro. No purchases are available yet — everything in v1.0 stays free and offline.</p>
        </div>
      </div>
    </div>
  );
}
