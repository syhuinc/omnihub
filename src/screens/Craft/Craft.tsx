import { ScreenHeader } from '../../components/ScreenHeader';
import { Icon, type IconName } from '../../components/Icon';
import heroCrafting from '../../assets/craft/hero-crafting.webp';
import chefHat from '../../assets/craft/chef-hat.webp';
import featureLayers from '../../assets/craft/feature-layers.webp';
import featureWorkflow from '../../assets/craft/feature-workflow.webp';
import featurePossibilities from '../../assets/craft/feature-possibilities.webp';
import recipeFinance from '../../assets/craft/recipe-finance.webp';
import recipeDocument from '../../assets/craft/recipe-document.webp';
import recipeTravel from '../../assets/craft/recipe-travel.webp';
import './Craft.css';

const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: featureLayers, title: 'Combine Tools', desc: 'Turn multiple tools into one powerful solution.' },
  { icon: featureWorkflow, title: 'Smarter Workflow', desc: 'Save time with all-in-one tools.' },
  { icon: featurePossibilities, title: 'More Possibilities', desc: 'New tools and combos designed for your needs.' },
];

interface Recipe {
  image: string;
  name: string;
  ingredients: string;
}

const RECIPES: Recipe[] = [
  { image: recipeFinance, name: 'Finance Manager', ingredients: 'Budget + Debt + Loan + Subscriptions' },
  { image: recipeDocument, name: 'Document Manager', ingredients: 'Scanner + OCR + PDF + Notes' },
  { image: recipeTravel, name: 'Travel Planner', ingredients: 'Time Zone + Time Difference + Alarm' },
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
          <img className="craft__hero-img" src={heroCrafting} alt="Crafting Station" />
        </div>

        <div className="craft__coming-soon">
          <img className="craft__coming-soon-img" src={chefHat} alt="" />
          <h3>Still Cooking&hellip;</h3>
          <p>We&rsquo;re working hard to bring the Crafting Station to Omni Hub.</p>
        </div>

        <div className="craft__features">
          {FEATURES.map((f) => (
            <div key={f.title} className="craft__feature">
              <img className="craft__feature-icon" src={f.icon} alt="" />
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
              <div className="craft__recipe-img-wrap">
                <img className="craft__recipe-img" src={r.image} alt="" />
                <span className="craft__recipe-lock">
                  <Icon name={'lock' as IconName} size={9} />
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
