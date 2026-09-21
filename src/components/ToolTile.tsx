import { Icon } from './Icon';
import type { ToolMeta } from '../types';
import './ToolTile.css';

interface ToolTileProps {
  tool: ToolMeta;
  onClick: () => void;
  onRemove?: () => void;
}

export function ToolTile({ tool, onClick, onRemove }: ToolTileProps) {
  return (
    <div className="tool-tile">
      <button type="button" className="tool-tile__button" onClick={onClick}>
        <span
          className="tool-tile__icon"
          style={{ background: `color-mix(in srgb, ${tool.color} 18%, transparent)`, color: tool.color }}
        >
          <Icon name={tool.icon} size={22} />
        </span>
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
    </div>
  );
}
