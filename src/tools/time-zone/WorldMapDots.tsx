import { useMemo } from 'react';
import { WORLD_DOTS_FLAT, projectToPercent } from './worldMap';

interface WorldMapDotsProps {
  className?: string;
  dotRadius?: number;
  /** true stretches the 0-100 square to fill a wide container (flat map); false crops it (globe). */
  stretch?: boolean;
}

/** Renders the precomputed landmass dots as a decorative stippled world-map background, in a
 * shared 0-100 x/y percent space so callers can position their own overlays (pins, arcs) to match. */
export function WorldMapDots({ className, dotRadius = 0.85, stretch = false }: WorldMapDotsProps) {
  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < WORLD_DOTS_FLAT.length; i += 2) {
      const { xPct, yPct } = projectToPercent(WORLD_DOTS_FLAT[i], WORLD_DOTS_FLAT[i + 1]);
      pts.push({ x: xPct, y: yPct });
    }
    return pts;
  }, []);

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio={stretch ? 'none' : 'xMidYMid slice'}
      aria-hidden="true"
    >
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={dotRadius} />
      ))}
    </svg>
  );
}
