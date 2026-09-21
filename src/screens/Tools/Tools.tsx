import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { ToolTile } from '../../components/ToolTile';
import { useRouter } from '../../app/Router';
import { CATEGORY_LABELS, TOOLS } from '../../tools/registry';
import { searchTools } from '../../search/searchIndex';
import type { ToolCategory } from '../../types';
import './Tools.css';

type CategoryFilter = 'all' | ToolCategory;

const CATEGORIES: CategoryFilter[] = ['all', 'essentials', 'productivity', 'finance', 'more'];

export function Tools() {
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const visibleTools = useMemo(() => {
    if (query) {
      const results = searchTools(query, 20).map((r) => r.tool);
      return category === 'all' ? results : results.filter((t) => t.category === category);
    }
    return category === 'all' ? TOOLS : TOOLS.filter((t) => t.category === category);
  }, [query, category]);

  const openTool = (id: string) => navigate(`/tools/${id}`);

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
        {visibleTools.length === 0 ? (
          <p className="tools__empty">
            No tools found{query ? ` for "${query}"` : ''}. Try another category or search term.
          </p>
        ) : (
          <div className="tools__grid">
            {visibleTools.map((tool) => (
              <ToolTile key={tool.id} tool={tool} onClick={() => openTool(tool.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
