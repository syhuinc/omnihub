import { useEffect } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import markModel from '../../assets/syxdi-ai/mark.glb?url';
import closingScene from '../../assets/syxdi-ai/closing-scene.webp';
import iconChat from '../../assets/syxdi-ai/icon-chat.webp';
import iconUser from '../../assets/syxdi-ai/icon-user.webp';
import iconFeed from '../../assets/syxdi-ai/icon-feed.webp';
import iconBulb from '../../assets/syxdi-ai/icon-bulb.webp';
import './SyxdiAi.css';

const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: iconChat, title: 'Natural Conversations', desc: 'Talk naturally, anytime.' },
  { icon: iconUser, title: 'Understands You', desc: 'Learns your preferences.' },
  { icon: iconFeed, title: 'Personal News Feed', desc: 'Updates that matter to you.' },
  { icon: iconBulb, title: 'Smart Insights', desc: 'Helpful suggestions for a better day.' },
];

export function SyxdiAi() {
  useEffect(() => {
    // Dynamically imported so the ~1MB model-viewer library only loads for
    // someone who actually opens this tab, instead of bloating every screen.
    import('@google/model-viewer');
  }, []);

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
          <model-viewer
            className="syxdi__hero-model"
            src={markModel}
            alt="The SYXDI AI mark — swipe to rotate"
            camera-controls
            disable-zoom
            auto-rotate
            rotation-per-second="18deg"
            environment-image="neutral"
            exposure="1.1"
            shadow-intensity="0"
            camera-orbit="0deg 78deg 110%"
            field-of-view="28deg"
          />
          <span className="syxdi__hero-hint">Swipe to rotate</span>
        </div>

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

        <div className="syxdi__thanks" style={{ backgroundImage: `url(${closingScene})` }}>
          <div className="syxdi__thanks-overlay">
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
    </div>
  );
}
