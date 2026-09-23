import { WorldMapDots } from '../time-zone/WorldMapDots';
import { projectToPercent } from '../time-zone/worldMap';

interface WorldMapArcProps {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
}

/** The flat dotted world map with a curved arc connecting two cities' pins. All positions share
 * the same 0-100 percent space as WorldMapDots, so the arc and pins line up with the landmass. */
export function WorldMapArc({ fromLat, fromLon, toLat, toLon }: WorldMapArcProps) {
  const from = projectToPercent(fromLon, fromLat);
  const to = projectToPercent(toLon, toLat);
  const midX = (from.xPct + to.xPct) / 2;
  const midY = Math.min(from.yPct, to.yPct) - 16;
  const path = `M ${from.xPct} ${from.yPct} Q ${midX} ${midY} ${to.xPct} ${to.yPct}`;

  return (
    <div className="wmarc">
      <WorldMapDots className="wmarc__dots" dotSize={2.2} />
      <svg className="wmarc__arc" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="wmarcGradient" x1={from.xPct} y1="0" x2={to.xPct} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--yellow)" />
            <stop offset="100%" stopColor="var(--blue)" />
          </linearGradient>
        </defs>
        <path d={path} stroke="url(#wmarcGradient)" />
      </svg>
      <span className="wmarc__pin wmarc__pin--from" style={{ left: `${from.xPct}%`, top: `${from.yPct}%` }} />
      <span className="wmarc__pin wmarc__pin--to" style={{ left: `${to.xPct}%`, top: `${to.yPct}%` }} />
    </div>
  );
}
