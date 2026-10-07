import heroScene from '../../assets/syxdi-ai/hero.webp';
import bgSceneDark from '../../assets/syxdi-ai/hero-dark.webp';
import bgSceneLight from '../../assets/syxdi-ai/hero-light.webp';
import closingScene from '../../assets/syxdi-ai/closing-scene.webp';
import iconChat from '../../assets/syxdi-ai/icon-chat.webp';
import iconUser from '../../assets/syxdi-ai/icon-user.webp';
import iconFeed from '../../assets/syxdi-ai/icon-feed.webp';
import iconBulb from '../../assets/syxdi-ai/icon-bulb.webp';
import { useIsLightTheme } from '../../theme/useTheme';
import './SyxdiAi.css';

const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: iconChat, title: 'Natural Conversations', desc: 'Talk naturally, anytime.' },
  { icon: iconUser, title: 'Understands You', desc: 'Learns your preferences.' },
  { icon: iconFeed, title: 'Personal News Feed', desc: 'Updates that matter to you.' },
  { icon: iconBulb, title: 'Smart Insights', desc: 'Helpful suggestions for a better day.' },
];

export function SyxdiAi() {
  const isLight = useIsLightTheme();
  const bgScene = isLight ? bgSceneLight : bgSceneDark;

  return (
    <>
      {/* Fixed full-viewport layer, kept as a sibling of .screen (not a descendant) so the
          screen's entrance animation never gives it a transformed containing block. */}
      <div className="syxdi__bg" style={{ backgroundImage: `url(${bgScene})` }} />

      <div className="screen syxdi__screen">
        <div className="syxdi__page-header">
          <h1 className="syxdi__page-title">
            SYXDI <span className="syxdi__title-accent">AI</span>
          </h1>
          <p className="syxdi__page-subtitle">Your AI companion for Omni Hub.</p>
        </div>

        <div className="syxdi__body">
          <div className="syxdi__hero-card" style={{ backgroundImage: `url(${heroScene})` }} />

          <div className="syxdi__headline">
            <span className="syxdi__headline-eyebrow">SYXDI AI</span>
            <h2 className="syxdi__headline-title">COMING SOON</h2>
            <p className="syxdi__headline-text">
              A smarter, more personal AI experience is on the way.
            </p>
          </div>

          <div className="syxdi__features">
            {FEATURES.map((f) => (
              <div key={f.title} className="syxdi__feature">
                <img className="syxdi__feature-icon" src={f.icon} alt="" />
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </div>
            ))}
          </div>

          {/* The art itself already has "Better days are coming / Thank you for your
              support" baked in, so this is just the image -- no HTML text on top. */}
          <div className="syxdi__thanks" style={{ backgroundImage: `url(${closingScene})` }} />
        </div>
      </div>
    </>
  );
}
