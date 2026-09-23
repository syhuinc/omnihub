import { WorldMapDots } from './WorldMapDots';
import { projectToPercent } from './worldMap';

interface EarthGlobeProps {
  lat: number;
  lon: number;
}

/** A stylized "globe" — the flat dot map clipped to a circle with sphere-style shading, plus a pin. */
export function EarthGlobe({ lat, lon }: EarthGlobeProps) {
  const { xPct, yPct } = projectToPercent(lon, lat);
  return (
    <div className="globe">
      <WorldMapDots className="globe__dots" dotRadius={1.1} />
      <span className="globe__shade" />
      <span className="globe__pin" style={{ left: `${xPct}%`, top: `${yPct}%` }}>
        <span className="globe__pin-pulse" />
        <span className="globe__pin-dot" />
      </span>
    </div>
  );
}
