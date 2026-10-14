import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useIsLightTheme } from '../../theme/useTheme';
import heroDark from '../../assets/craft/v2-hero-dark.webp';
import heroLight from '../../assets/craft/v2-hero-light.webp';
import cookingDark from '../../assets/craft/v2-cooking-dark.webp';
import cookingLight from '../../assets/craft/v2-cooking-light.webp';
import combineDark from '../../assets/craft/v2-feat-combine-dark.webp';
import combineLight from '../../assets/craft/v2-feat-combine-light.webp';
import workflowDark from '../../assets/craft/v2-feat-workflow-dark.webp';
import workflowLight from '../../assets/craft/v2-feat-workflow-light.webp';
import possibilitiesDark from '../../assets/craft/v2-feat-possibilities-dark.webp';
import possibilitiesLight from '../../assets/craft/v2-feat-possibilities-light.webp';
import financeDark from '../../assets/craft/v2-recipe-finance-dark.webp';
import financeLight from '../../assets/craft/v2-recipe-finance-light.webp';
import documentDark from '../../assets/craft/v2-recipe-document-dark.webp';
import documentLight from '../../assets/craft/v2-recipe-document-light.webp';
import travelDark from '../../assets/craft/v2-recipe-travel-dark.webp';
import travelLight from '../../assets/craft/v2-recipe-travel-light.webp';
import './Craft.css';

const FEATURES = [
  { key: 'combine', title: 'Combine Tools', desc: ['Turn multiple tools', 'into one powerful', 'solution.'], dark: combineDark, light: combineLight },
  { key: 'workflow', title: 'Smarter Workflow', desc: ['Save time with', 'all-in-one tools.'], dark: workflowDark, light: workflowLight },
  { key: 'possibilities', title: 'More Possibilities', desc: ['New tools and', 'combinations for', 'your needs.'], dark: possibilitiesDark, light: possibilitiesLight },
];

const RECIPES = [
  { key: 'finance', title: 'Finance Manager', desc: ['Budget + Debt + Loan', '+ Subscription'], dark: financeDark, light: financeLight },
  { key: 'document', title: 'Document Hub', desc: ['Scanner + OCR', '+ PDF + Notes'], dark: documentDark, light: documentLight },
  { key: 'travel', title: 'Travel Planner', desc: ['Time Zone + Time', 'Difference + Alarm'], dark: travelDark, light: travelLight },
];

export function Craft() {
  const isLight = useIsLightTheme();
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // Crafting isn't built yet, so every action explains that instead of doing nothing.
  function comingSoon() {
    setToast(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(false), 2200);
  }

  return (
    <div className="screen craft2">
      <img className="craft2__hero-img" src={isLight ? heroLight : heroDark} alt="" />

      <header className="craft2__hero">
        <span className="craft2__eyebrow">OMNI HUB</span>
        <h1 className="craft2__title">
          Crafting
          <br />
          <span className="craft2__title-accent">Station</span>
        </h1>
        <p className="craft2__subtitle">
          Combine your favorite tools
          <br />
          to create more powerful tools.
        </p>
      </header>

      <section className="craft2__start">
        <div className="craft2__start-text">
          <h2>Start Crafting</h2>
          <p>Mix existing tools to create new ones.</p>
        </div>
        <button type="button" className="craft2__create" onClick={comingSoon}>
          <span className="craft2__create-plus">
            <Icon name="plus" size={12} strokeWidth={3.2} />
          </span>
          <span className="craft2__create-label">Create Tool</span>
          <Icon name="chevron-right" size={13} strokeWidth={2.6} />
        </button>
      </section>

      <div className="craft2__features">
        {FEATURES.map((f) => (
          <button key={f.key} type="button" className={`craft2__feature craft2__feature--${f.key}`} onClick={comingSoon}>
            <img className="craft2__feature-icon" src={isLight ? f.light : f.dark} alt="" />
            <span className="craft2__feature-chevron">
              <Icon name="chevron-right" size={14} strokeWidth={2.4} />
            </span>
            <strong>{f.title}</strong>
            <span className="craft2__feature-desc">
              {f.desc.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </span>
          </button>
        ))}
      </div>

      <section className="craft2__cooking">
        <img className="craft2__cooking-img" src={isLight ? cookingLight : cookingDark} alt="" />
        <div className="craft2__cooking-text">
          <h2>Still Cooking…</h2>
          <p>
            We&rsquo;re working hard to bring the
            <br />
            Crafting Station to Omni Hub.
          </p>
          <div className="craft2__progress">
            <div className="craft2__progress-track">
              <div className="craft2__progress-fill" />
            </div>
            <span>70%</span>
          </div>
        </div>
      </section>

      <div className="craft2__section-head">
        <div>
          <h2>Featured Recipes</h2>
          <p>A sneak peek of what&rsquo;s coming.</p>
        </div>
        <button type="button" className="craft2__view-all" onClick={comingSoon}>
          View All
          <Icon name="chevron-right" size={12} strokeWidth={2.4} />
        </button>
      </div>

      <div className="craft2__recipes">
        {RECIPES.map((r) => (
          <div key={r.key} className="craft2__recipe">
            <div className="craft2__recipe-card">
              <div className="craft2__recipe-tile">
                <img src={isLight ? r.light : r.dark} alt="" />
              </div>
              <strong>{r.title}</strong>
              <span>
                {r.desc[0]}
                <br />
                {r.desc[1]}
              </span>
            </div>
            <span className="craft2__recipe-soon">
              <Icon name="lock" size={10} strokeWidth={2.4} />
              Coming Soon
            </span>
          </div>
        ))}
      </div>

      <div className={`craft2__toast${toast ? ' craft2__toast--show' : ''}`} role="status">
        The Crafting Station is coming soon.
      </div>
    </div>
  );
}
