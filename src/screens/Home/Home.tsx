import { useMemo, useState } from 'react';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { ToolTile } from '../../components/ToolTile';
import { Icon } from '../../components/Icon';
import { useRouter } from '../../app/Router';
import { TOOLS, getToolById } from '../../tools/registry';
import { searchTools } from '../../search/searchIndex';
import { storageGet, storageSet, StorageKeys } from '../../storage/db';
import type { ToolMeta } from '../../types';
import './Home.css';

const DEFAULT_PINNED = ['calculator', 'unit-converter', 'notes', 'timer'];

const QUICK_ACTIONS: { label: string; toolId: string; icon: ToolMeta['icon'] }[] = [
  { label: 'New Note', toolId: 'notes', icon: 'note' },
  { label: 'Add Expense', toolId: 'expense-tracker', icon: 'wallet' },
  { label: 'Start Timer', toolId: 'timer', icon: 'timer' },
  { label: 'Split Bill', toolId: 'split-bill', icon: 'receipt' },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

interface HomeSections {
  recommended: boolean;
  quickActions: boolean;
}

const DEFAULT_SECTIONS: HomeSections = { recommended: true, quickActions: true };

export function Home() {
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const [pinnedIds, setPinnedIds] = useState<string[]>(() =>
    storageGet(StorageKeys.pinnedTools, DEFAULT_PINNED),
  );
  const [editingPinned, setEditingPinned] = useState(false);
  const [sections, setSections] = useState<HomeSections>(() =>
    storageGet(StorageKeys.homeSections, DEFAULT_SECTIONS),
  );

  function hideSection(key: keyof HomeSections) {
    const next = { ...sections, [key]: false };
    setSections(next);
    storageSet(StorageKeys.homeSections, next);
  }

  function restoreSections() {
    setSections(DEFAULT_SECTIONS);
    storageSet(StorageKeys.homeSections, DEFAULT_SECTIONS);
  }

  const hasHiddenSections = !sections.recommended || !sections.quickActions;

  const pinnedTools = pinnedIds.map(getToolById).filter((t): t is ToolMeta => !!t);
  const recommended = TOOLS.filter((tool) => !pinnedIds.includes(tool.id)).slice(0, 4);
  const results = useMemo(() => searchTools(query), [query]);

  const openTool = (id: string) => navigate(`/tools/${id}`);

  function updatePinned(next: string[]) {
    setPinnedIds(next);
    storageSet(StorageKeys.pinnedTools, next);
  }

  function unpin(id: string) {
    updatePinned(pinnedIds.filter((toolId) => toolId !== id));
  }

  function pin(id: string) {
    if (pinnedIds.includes(id)) return;
    updatePinned([...pinnedIds, id]);
  }

  const pinnableTools = TOOLS.filter((tool) => !pinnedIds.includes(tool.id));

  return (
    <div className="screen home">
      <ScreenHeader title={`${greeting()} \u{1F44B}`} subtitle="What do you need today?" />

      <div className="home__search">
        <SearchBar value={query} onChange={setQuery} placeholder="Search tools, or anything..." />
      </div>

      {query ? (
        <div className="home__section">
          {results.length === 0 ? (
            <p className="home__empty">
              No tools found for "{query}". Try a different word, like "split bill" or "convert".
            </p>
          ) : (
            <ul className="home__results">
              {results.map(({ tool }) => (
                <li key={tool.id}>
                  <button type="button" className="home__result" onClick={() => openTool(tool.id)}>
                    <span
                      className="home__result-icon"
                      style={{
                        background: `color-mix(in srgb, ${tool.color} 18%, transparent)`,
                        color: tool.color,
                      }}
                    >
                      <Icon name={tool.icon} size={18} />
                    </span>
                    <span className="home__result-text">
                      <strong>{tool.name}</strong>
                      <span>{tool.shortDescription}</span>
                    </span>
                    <Icon name="chevron-right" size={18} className="home__result-chevron" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div className="home__section">
            <div className="home__section-header">
              <h2>Pinned Tools</h2>
              <button type="button" className="home__link" onClick={() => setEditingPinned((v) => !v)}>
                {editingPinned ? 'Done' : 'Edit'}
              </button>
            </div>
            {pinnedTools.length === 0 ? (
              <p className="home__empty">No pinned tools yet. Tap Edit to add some.</p>
            ) : (
              <div className="home__grid">
                {pinnedTools.map((tool) => (
                  <ToolTile
                    key={tool.id}
                    tool={tool}
                    onClick={() => (editingPinned ? undefined : openTool(tool.id))}
                    onRemove={editingPinned ? () => unpin(tool.id) : undefined}
                  />
                ))}
              </div>
            )}
            {editingPinned && pinnableTools.length > 0 && (
              <div className="home__pin-picker">
                <p>Add a tool</p>
                <div className="home__pin-picker-list">
                  {pinnableTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      className="home__pin-picker-item"
                      onClick={() => pin(tool.id)}
                    >
                      <Icon name={tool.icon} size={14} />
                      {tool.name}
                      <Icon name="plus" size={14} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {sections.recommended && (
            <div className="home__section">
              <div className="home__section-header">
                <h2>Recommended for You</h2>
                <button
                  type="button"
                  className="home__section-close"
                  onClick={() => hideSection('recommended')}
                  aria-label="Hide Recommended for You"
                >
                  <Icon name="x" size={14} strokeWidth={2.5} />
                </button>
              </div>
              <div className="home__grid">
                {recommended.map((tool) => (
                  <ToolTile key={tool.id} tool={tool} onClick={() => openTool(tool.id)} />
                ))}
              </div>
            </div>
          )}

          {sections.quickActions && (
            <div className="home__section">
              <div className="home__section-header">
                <h2>Quick Actions</h2>
                <button
                  type="button"
                  className="home__section-close"
                  onClick={() => hideSection('quickActions')}
                  aria-label="Hide Quick Actions"
                >
                  <Icon name="x" size={14} strokeWidth={2.5} />
                </button>
              </div>
              <div className="home__quick-actions">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="home__quick-action"
                    onClick={() => openTool(action.toolId)}
                  >
                    <Icon name={action.icon} size={18} />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasHiddenSections && (
            <button type="button" className="home__restore-sections" onClick={restoreSections}>
              Show hidden sections
            </button>
          )}
        </>
      )}
    </div>
  );
}
