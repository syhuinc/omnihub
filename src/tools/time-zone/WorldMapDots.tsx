import { useMemo } from 'react';
import { WORLD_DOTS_FLAT, projectToPercent } from './worldMap';

interface WorldMapDotsProps {
  className?: string;
  /** Dot diameter in real pixels — fixed size so dots stay circular no matter the container's aspect ratio. */
  dotSize?: number;
}

/** Renders the precomputed landmass dots as a decorative stippled world-map background. Uses
 * absolutely-positioned fixed-size elements (not SVG shapes) so a non-square container — the
 * flat Time Difference map, or the circular globe crop — never stretches a dot into an ellipse. */
export function WorldMapDots({ className, dotSize = 3 }: WorldMapDotsProps) {
  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < WORLD_DOTS_FLAT.length; i += 2) {
      const { xPct, yPct } = projectToPercent(WORLD_DOTS_FLAT[i], WORLD_DOTS_FLAT[i + 1]);
      pts.push({ x: xPct, y: yPct });
    }
    return pts;
  }, []);

  return (
    <div className={className} aria-hidden="true">
      {points.map((p, i) => (
        <span
          key={i}
          className="wmap-dot"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: dotSize, height: dotSize }}
        />
      ))}
    </div>
  );
}
