import { useMemo } from 'react';
import { WORLD_DOTS_FLAT, projectToPercent } from './worldMap';

interface WorldMapDotsProps {
  className?: string;
  dotRadius?: number;
}

/** Renders the precomputed landmass dots as a decorative stippled world-map background. */
export function WorldMapDots({ className, dotRadius = 0.85 }: WorldMapDotsProps) {
  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < WORLD_DOTS_FLAT.length; i += 2) {
      const { xPct, yPct } = projectToPercent(WORLD_DOTS_FLAT[i], WORLD_DOTS_FLAT[i + 1]);
      pts.push({ x: xPct, y: yPct });
    }
    return pts;
  }, []);

  return (
    <svg className={className} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={dotRadius} />
      ))}
    </svg>
  );
}
