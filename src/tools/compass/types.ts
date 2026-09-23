export interface CompassSettings {
  hapticTicks: boolean;
  altitudeUnit: 'm' | 'ft';
}

export const DEFAULT_COMPASS_SETTINGS: CompassSettings = {
  hapticTicks: true,
  altitudeUnit: 'm',
};
