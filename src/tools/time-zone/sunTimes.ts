// Standard low-precision solar position formulas (the same public astronomical
// algorithm family used for Compass's sun direction), extended to solve for
// sunrise/sunset — accurate to within a few minutes, plenty for a "day/night" hint.
const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397;

function toJulian(date: Date): number {
  return date.getTime() / DAY_MS - 0.5 + J1970;
}
function fromJulian(j: number): Date {
  return new Date((j + 0.5 - J1970) * DAY_MS);
}
function toDays(date: Date): number {
  return toJulian(date) - J2000;
}
function solarMeanAnomaly(d: number): number {
  return RAD * (357.5291 + 0.98560028 * d);
}
function eclipticLongitude(M: number): number {
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = RAD * 102.9372;
  return M + C + P + Math.PI;
}
function declination(l: number): number {
  return Math.asin(Math.sin(l) * Math.sin(OBLIQUITY));
}
function julianCycle(d: number, lw: number): number {
  return Math.round(d - 0.0009 - lw / (2 * Math.PI));
}
function approxTransit(ht: number, lw: number, n: number): number {
  return 0.0009 + (ht + lw) / (2 * Math.PI) + n;
}
function solarTransitJ(ds: number, M: number, L: number): number {
  return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
}
function hourAngle(h: number, phi: number, dec: number): number {
  return Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

/** Sunrise/sunset for a given date + coordinates. Returns null for polar day/night. */
export function getSunTimes(date: Date, lat: number, lon: number): SunTimes | null {
  const lw = RAD * -lon;
  const phi = RAD * lat;
  const d = toDays(date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L);
  const jNoon = solarTransitJ(ds, M, L);

  const h0 = RAD * -0.833; // standard horizon angle incl. atmospheric refraction
  const cosH = (Math.sin(h0) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (cosH < -1 || cosH > 1) return null; // sun never sets/rises here today

  const w = hourAngle(h0, phi, dec);
  const a = approxTransit(w, lw, n);
  const jSet = solarTransitJ(a, M, L);
  const jRise = jNoon - (jSet - jNoon);

  return { sunrise: fromJulian(jRise), sunset: fromJulian(jSet) };
}
