import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon, type IconName } from '../../components/Icon';
import heroImg from '../../assets/syxdi-ai/hero.webp';
import './SyxdiAi.css';

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'chat', title: 'Natural Conversations', desc: 'Talk naturally, anytime.' },
  { icon: 'user', title: 'Understands You', desc: 'Learns your preferences.' },
  { icon: 'file', title: 'Personal News Feed', desc: 'Updates that matter to you.' },
  { icon: 'lightbulb', title: 'Smart Insights', desc: 'Helpful suggestions for a better day.' },
];

export function SyxdiAi() {
  return (
    <div className="screen">
      <ScreenHeader
        title={
          <>
            SYXDI <span className="syxdi__title-accent">AI</span>
          </>
        }
        subtitle="Your AI companion for Omni Hub."
      />

      <div className="syxdi__body">
        <div className="syxdi__hero">
          <img className="syxdi__hero-img" src={heroImg} alt="SYXDI AI — Your AI Companion, powered by SYHU" />
        </div>

        <div className="syxdi__headline">
          <span className="syxdi__headline-badge">
            <Icon name="clock" size={10} />
            Coming Soon
          </span>
          <h2 className="syxdi__headline-title">
            A Smarter Companion
            <br />
            Is On The Way.
          </h2>
          <p className="syxdi__headline-text">
            A smarter, more personal AI experience is coming to Omni Hub.
          </p>
        </div>

        <div className="syxdi__features">
          {FEATURES.map((f) => (
            <div key={f.title} className="syxdi__feature">
              <span className="syxdi__feature-icon-wrap">
                <Icon name={f.icon} size={18} />
              </span>
              <strong>{f.title}</strong>
              <span>{f.desc}</span>
            </div>
          ))}
        </div>

        <div className="syxdi__thanks">
          <span className="syxdi__thanks-bar" />
          <h2>
            Better days
            <br />
            <span className="syxdi__thanks-accent">are coming.</span>
          </h2>
          <p>Thank you for your support.</p>
        </div>
      </div>
    </div>
  );
}
