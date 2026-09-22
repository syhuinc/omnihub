import { useMemo, useState, type CSSProperties } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { ToolTile } from '../../components/ToolTile';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { CATEGORY_LABELS, TOOLS } from '../../tools/registry';
import { searchTools } from '../../search/searchIndex';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import { hapticSelect, hapticSuccess } from '../../haptics';
import type { ToolCategory } from '../../types';
import type { IconName } from '../../components/Icon';
import './Tools.css';

type CategoryFilter = 'all' | ToolCategory;

const CATEGORIES: CategoryFilter[] = ['all', 'essentials', 'productivity', 'finance', 'more'];

const FEATURED_ICONS: { icon: IconName; color: string }[] = [
  { icon: 'calculator', color: 'var(--green)' },
  { icon: 'timer', color: 'var(--purple)' },
  { icon: 'checklist', color: 'var(--yellow)' },
];

export function Tools() {
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sortAlpha, setSortAlpha] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestText, setSuggestText] = useState('');
  const [suggestSent, setSuggestSent] = useState(false);

  const visibleTools = useMemo(() => {
    const base = query
      ? searchTools(query, 20)
          .map((r) => r.tool)
          .filter((t) => category === 'all' || t.category === category)
      : category === 'all'
        ? TOOLS
        : TOOLS.filter((t) => t.category === category);
    return sortAlpha ? [...base].sort((a, b) => a.name.localeCompare(b.name)) : base;
  }, [query, category, sortAlpha]);

  const openTool = (id: string) => navigate(`/tools/${id}`);

  function toggleSort() {
    hapticSelect();
    setSortAlpha((v) => !v);
  }

  function handleSuggestSubmit() {
    const text = suggestText.trim();
    if (!text) return;
    const existing = storageGet<string[]>(StorageKeys.toolSuggestions, []);
    storageSet(StorageKeys.toolSuggestions, [...existing, text]);
    hapticSuccess();
    setSuggestText('');
    setSuggestOpen(false);
    setSuggestSent(true);
    setTimeout(() => setSuggestSent(false), 2500);
  }

  return (
    <div className="screen">
      <ScreenHeader title="Tools" subtitle="All tools in one place." />

      <div className="tools__search">
        <SearchBar value={query} onChange={setQuery} placeholder="Search tools..." />
      </div>

      <div className="tools__tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`tools__tab${category === cat ? ' tools__tab--active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="tools__content">
        <div className="tools__featured">
          <div className="tools__featured-glow" />
          <div className="tools__featured-icons">
            {FEATURED_ICONS.map((f, i) => (
              <span
                key={f.icon}
                className="tools__featured-chip"
                style={{ '--tool-color': f.color, '--i': i } as CSSProperties}
              >
                <Icon name={f.icon} size={16} />
              </span>
            ))}
          </div>
          <span className="tools__featured-badge">Featured</span>
          <h2 className="tools__featured-title">
            Productivity
            <br />
            Starts Here.
          </h2>
          <p className="tools__featured-text">Tools to make your everyday life easier.</p>
        </div>

        {visibleTools.length === 0 ? (
          <p className="tools__empty">
            No tools found{query ? ` for "${query}"` : ''}. Try another category or search term.
          </p>
        ) : (
          <>
            <div className="tools__section-header">
              <h2>All Tools</h2>
              <button type="button" className="tools__sort-btn" onClick={toggleSort}>
                <Icon name="sort" size={14} />
                {sortAlpha ? 'A–Z' : 'Sort'}
              </button>
            </div>
            <div className="tools__grid">
              {visibleTools.map((tool) => (
                <ToolTile key={tool.id} tool={tool} onClick={() => openTool(tool.id)} />
              ))}
            </div>
          </>
        )}

        <div className="tools__suggest">
          <span className="tools__suggest-icon">
            <Icon name="lightbulb" size={20} />
          </span>
          <div className="tools__suggest-text">
            <strong>Have an idea for a new tool?</strong>
            <p>We're always adding new tools to make your life easier.</p>
          </div>
          <button type="button" className="tools__suggest-btn" onClick={() => setSuggestOpen(true)}>
            Suggest
            <Icon name="chevron-right" size={14} />
          </button>
        </div>

        {suggestSent && <p className="tools__suggest-thanks">Thanks! We saved your idea.</p>}
      </div>

      {suggestOpen && (
        <div className="tools__suggest-sheet" onClick={() => setSuggestOpen(false)}>
          <div className="tools__suggest-form" onClick={(e) => e.stopPropagation()}>
            <h2>Suggest a tool</h2>
            <textarea
              placeholder="What tool would make your day easier?"
              value={suggestText}
              onChange={(e) => setSuggestText(e.target.value)}
              autoFocus
            />
            <div className="tools__suggest-form-actions">
              <button type="button" onClick={() => setSuggestOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="tools__suggest-form-send"
                onClick={handleSuggestSubmit}
                disabled={!suggestText.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
