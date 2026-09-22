import { useRef, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { Icon } from './Icon';
import type { ToolMeta } from '../types';
import { TOOL_ICON_IMAGES } from '../assets/tool-icons';
import './ToolTile.css';

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10;

interface ToolTileProps {
  tool: ToolMeta;
  onClick: () => void;
  onRemove?: () => void;
  /** Long-press support (e.g. Tools screen's press-and-hold-to-pin). Omit to disable. */
  onLongPress?: () => void;
  showPinBadge?: boolean;
  pinned?: boolean;
  onTogglePin?: () => void;
}

export function ToolTile({ tool, onClick, onRemove, onLongPress, showPinBadge, pinned, onTogglePin }: ToolTileProps) {
  const image = TOOL_ICON_IMAGES[tool.id];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const suppressClickRef = useRef(false);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function handlePointerDown(e: PointerEvent) {
    if (!onLongPress) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      suppressClickRef.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!timerRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.abs(dx) > MOVE_CANCEL_PX || Math.abs(dy) > MOVE_CANCEL_PX) clearTimer();
  }

  function handleClickCapture(e: MouseEvent) {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  }

  return (
    <div
      className="tool-tile"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onClickCapture={handleClickCapture}
    >
      <button type="button" className="tool-tile__button" onClick={onClick}>
        {image ? (
          <span className="tool-tile__icon tool-tile__icon--image">
            <img src={image} alt="" className="tool-tile__icon-img" />
          </span>
        ) : (
          <span className="tool-tile__icon" style={{ '--tool-color': tool.color } as CSSProperties}>
            <span className="tool-tile__icon-gloss" />
            <Icon name={tool.icon} size={28} className="tool-tile__icon-svg" />
          </span>
        )}
        <span className="tool-tile__label">{tool.name}</span>
      </button>
      {onRemove && (
        <button
          type="button"
          className="tool-tile__remove"
          onClick={onRemove}
          aria-label={`Unpin ${tool.name}`}
        >
          <Icon name="x" size={12} strokeWidth={3} />
        </button>
      )}
      {showPinBadge && onTogglePin && (
        <button
          type="button"
          className={`tool-tile__pin-badge${pinned ? ' tool-tile__pin-badge--active' : ''}`}
          onClick={onTogglePin}
          aria-label={pinned ? `Unpin ${tool.name}` : `Pin ${tool.name}`}
        >
          <Icon name="pin" size={14} />
          {pinned ? 'Unpin' : 'Pin'}
        </button>
      )}
    </div>
  );
}
