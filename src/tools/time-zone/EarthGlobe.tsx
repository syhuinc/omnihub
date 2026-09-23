import { WorldMapDots } from './WorldMapDots';
import { projectToPercent } from './worldMap';

interface EarthGlobeProps {
  lat: number;
  lon: number;
}

/** A stylized "globe" — the flat dot map clipped to a circle with sphere-style shading, plus a pin. */
export function EarthGlobe({ lat, lon }: EarthGlobeProps) {
  const { xPct, yPct } = projectToPercent(lon, lat);
  // Anchor the label to whichever side has room, so it never gets clipped by the hero card's edge.
  const labelAlign = xPct > 65 ? 'right' : xPct < 35 ? 'left' : 'center';
  return (
    <div className="globe">
      <WorldMapDots className="globe__dots" dotSize={2.4} />
      <span className="globe__shade" />
      <span className="globe__pin" style={{ left: `${xPct}%`, top: `${yPct}%` }}>
        <span className="globe__pin-pulse" />
        <span className="globe__pin-dot" />
        <span className={`globe__pin-label globe__pin-label--${labelAlign}`}>You are here</span>
      </span>
    </div>
  );
}
