import { Icon, type IconName } from '../../components/Icon';
import { useIsLightTheme } from '../../theme/useTheme';
import heroNight from '../../assets/craft/hero-night.webp';
import heroDay from '../../assets/craft/hero-day.webp';
import bannerCooking from '../../assets/craft/banner-cooking.webp';
import featureCombine from '../../assets/craft/feature-combine.webp';
import featureWorkflow from '../../assets/craft/feature-workflow.webp';
import featurePossibilities from '../../assets/craft/feature-possibilities.webp';
import recipeFinance from '../../assets/craft/recipe-finance.webp';
import recipeDocument from '../../assets/craft/recipe-document.webp';
import recipeTravel from '../../assets/craft/recipe-travel.webp';
import './Craft.css';

const FEATURES = [featureCombine, featureWorkflow, featurePossibilities];

interface Recipe {
  image: string;
  name: string;
}

const RECIPES: Recipe[] = [
  { image: recipeFinance, name: 'Finance Manager' },
  { image: recipeDocument, name: 'Document Hub' },
  { image: recipeTravel, name: 'Travel Planner' },
];

export function Craft() {
  const isLight = useIsLightTheme();

  return (
    <div className="screen">
      <div className="craft__hero" style={{ backgroundImage: `url(${isLight ? heroDay : heroNight})` }}>
        <div className="craft__hero-scrim" />
        <div className="craft__hero-text">
          <span className="craft__hero-eyebrow">OMNI HUB</span>
          <h1 className="craft__hero-title">
            Crafting
            <br />
            <span className="craft__title-accent">Station</span>
          </h1>
          <p className="craft__hero-subtitle">
            Combine your favorite tools
            <br />
            to create more powerful tools.
          </p>
        </div>
      </div>

      <div className="craft__body">
        <div className="craft__features">
          {FEATURES.map((src) => (
            <img key={src} className="craft__feature" src={src} alt="" />
          ))}
        </div>

        <img className="craft__banner" src={bannerCooking} alt="Still Cooking — we're working hard to bring the Crafting Station to Omni Hub." />

        <div className="craft__section-head">
          <h2>
            Featured <span className="craft__title-accent">Recipes</span>
          </h2>
          <p>A sneak peek of what&rsquo;s coming.</p>
        </div>

        <div className="craft__recipes">
          {RECIPES.map((r) => (
            <div key={r.name} className="craft__recipe-card">
              <img className="craft__recipe-img" src={r.image} alt={r.name} />
              <span className="craft__recipe-soon">
                <Icon name={'lock' as IconName} size={9} />
                Coming Soon
              </span>
            </div>
          ))}
        </div>

        <div className="craft__thanks">
          <span className="craft__thanks-bar" />
          <h2>
            Better things
            <br />
            <span className="craft__thanks-accent">are coming.</span>
          </h2>
          <p>Thanks for being an early Omni Hub user.</p>
        </div>
      </div>
    </div>
  );
}
