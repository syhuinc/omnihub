import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon, type IconName } from '../../components/Icon';
import './Craft.css';

const INGREDIENT_ICONS: IconName[] = ['calculator', 'coins', 'calendar', 'note', 'clock'];

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'layers', title: 'Combine Tools', desc: 'Turn multiple tools into one powerful solution.' },
  { icon: 'zap', title: 'Smarter Workflow', desc: 'Save time with all-in-one tools.' },
  { icon: 'star', title: 'More Possibilities', desc: 'New tools and combos designed for your needs.' },
];

interface Recipe {
  icons: IconName[];
  name: string;
  ingredients: string;
}

const RECIPES: Recipe[] = [
  { icons: ['wallet', 'coins', 'note'], name: 'Finance Manager', ingredients: 'Budget + Debt + Loan + Subscriptions' },
  { icons: ['scan', 'file'], name: 'Document Manager', ingredients: 'Scanner + OCR + PDF + Notes' },
  { icons: ['globe', 'clock', 'bell'], name: 'Travel Planner', ingredients: 'Time Zone + Time Difference + Alarm' },
];

export function Craft() {
  return (
    <div className="screen">
      <ScreenHeader
        title={
          <>
            <span className="craft__title-accent">Crafting</span> Station
          </>
        }
        subtitle="Combine your favorite tools to create more powerful tools."
      />

      <div className="craft__body">
        <div className="craft__hero">
          <div className="craft__ingredients-row">
            {INGREDIENT_ICONS.map((icon, i) => (
              <span key={i} className="craft__ingredient-icon">
                <Icon name={icon} size={18} />
              </span>
            ))}
          </div>
          <Icon name="chevron-down" size={16} className="craft__hero-arrow" />
          <div className="craft__box">
            <span className="craft__box-glow" aria-hidden="true" />
            <Icon name="wrench" size={26} />
          </div>
        </div>

        <div className="craft__coming-soon">
          <Icon name="chef-hat" size={28} className="craft__coming-soon-icon" />
          <h3>Still Cooking&hellip;</h3>
          <p>We&rsquo;re working hard to bring the Crafting Station to Omni Hub.</p>
        </div>

        <div className="craft__features">
          {FEATURES.map((f) => (
            <div key={f.title} className="craft__feature">
              <span className="craft__feature-icon">
                <Icon name={f.icon} size={18} />
              </span>
              <strong>{f.title}</strong>
              <span>{f.desc}</span>
            </div>
          ))}
        </div>

        <div className="craft__section-head">
          <h2>Featured Recipes</h2>
          <p>A sneak peek of what&rsquo;s coming.</p>
        </div>

        <div className="craft__recipes">
          {RECIPES.map((r) => (
            <div key={r.name} className="craft__recipe-card">
              <div className="craft__recipe-icons">
                {r.icons.map((icon, i) => (
                  <span key={i} className="craft__recipe-icon">
                    <Icon name={icon} size={15} />
                  </span>
                ))}
                <span className="craft__recipe-lock">
                  <Icon name="lock" size={9} />
                </span>
              </div>
              <strong>{r.name}</strong>
              <span className="craft__recipe-ingredients">{r.ingredients}</span>
              <span className="craft__recipe-soon">Coming Soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
