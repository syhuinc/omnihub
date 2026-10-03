import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { useRouter } from './Router';
import markModel from '../assets/syxdi-ai/mark.glb?url';
import './BottomNav.css';

// A browser still fires a click after pointerup regardless of how far the
// pointer moved in between, so dragging the brand tab's model to rotate it
// would otherwise also navigate to the AI tab. Suppress the click once
// movement crosses this threshold, same pattern as ToolTile's long-press
// detection -- just distance-based instead of time-based.
const DRAG_CANCEL_PX = 6;

interface Tab {
  path: string;
  label: string;
  /** Flat Icon-set name. Unused (and omitted) for a `brand` tab, which renders its own image instead. */
  icon?: IconName;
  /** Rendered as its own image badge instead of the flat Icon set, with no text label. */
  brand?: boolean;
}

const TABS: Tab[] = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/tools', label: 'Hub', icon: 'grid' },
  { path: '/ai', label: '', brand: true },
  { path: '/craft', label: 'Craft', icon: 'flask' },
  { path: '/profile', label: 'Desk', icon: 'archive' },
];

export function BottomNav() {
  const { path, navigate } = useRouter();
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);

  function handleBrandPointerDown(e: PointerEvent) {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    draggedRef.current = false;
  }

  function handleBrandPointerMove(e: PointerEvent) {
    if (!dragStartRef.current || draggedRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > DRAG_CANCEL_PX || Math.abs(dy) > DRAG_CANCEL_PX) draggedRef.current = true;
  }

  function handleBrandClickCapture(e: MouseEvent) {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      draggedRef.current = false;
    }
  }

  useEffect(() => {
    // Dynamic import so the ~1MB model-viewer library is only fetched once
    // someone's actually on a screen with the bottom nav, not bundled into
    // the app's main chunk. Re-mounting the nav (leaving/returning to a top
    // -level tab) re-triggers this, but the module import is cached by the
    // browser so it's a no-op after the first load.
    import('@google/model-viewer');
  }, []);

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const active = tab.path === '/' ? path === '/' : path === tab.path || path.startsWith(`${tab.path}/`);
        return (
          <button
            key={tab.path}
            type="button"
            className={`bottom-nav__item${active ? ' bottom-nav__item--active' : ''}${tab.brand ? ' bottom-nav__item--brand' : ''}`}
            onClick={() => navigate(tab.path)}
            onPointerDown={tab.brand ? handleBrandPointerDown : undefined}
            onPointerMove={tab.brand ? handleBrandPointerMove : undefined}
            onClickCapture={tab.brand ? handleBrandClickCapture : undefined}
            aria-current={active ? 'page' : undefined}
            aria-label={tab.brand ? 'SYXDI AI' : undefined}
          >
            <span className="bottom-nav__icon-wrap">
              {tab.brand ? (
                <model-viewer
                  className="bottom-nav__brand-icon"
                  src={markModel}
                  alt=""
                  camera-controls
                  disable-zoom
                  environment-image="neutral"
                  exposure="1.1"
                  shadow-intensity="0"
                  camera-orbit="0deg 78deg 110%"
                  field-of-view="28deg"
                />
              ) : (
                <Icon name={tab.icon!} size={22} />
              )}
            </span>
            {tab.label && <span>{tab.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
