import type { CSSProperties } from 'react';
import { Icon } from './Icon';
import type { ToolMeta } from '../types';
import { TOOL_ICON_IMAGES } from '../assets/tool-icons';
import './ToolTile.css';

interface ToolTileProps {
  tool: ToolMeta;
  onClick: () => void;
  onRemove?: () => void;
}

export function ToolTile({ tool, onClick, onRemove }: ToolTileProps) {
  const image = TOOL_ICON_IMAGES[tool.id];

  return (
    <div className="tool-tile">
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
    </div>
  );
}
