import { registerPlugin, WebPlugin } from '@capacitor/core';

export interface DeviceStats {
  deviceModel: string;
  manufacturer: string;
  batteryPercent: number;
  isCharging: boolean;
  storageTotalBytes: number;
  storageFreeBytes: number;
  ramTotalBytes: number;
  ramAvailBytes: number;
  wifiConnected: boolean;
}

export interface DeviceStatsPluginInterface {
  getStats(): Promise<DeviceStats>;
}

// Best-effort browser equivalents, only for the web preview — real numbers come from the native
// plugin (android/.../devicestats/DeviceStatsPlugin.java) on-device. Several of these (deviceMemory,
// getBattery) are unavailable or approximate in most browsers, so this is never meant to be exact.
class DeviceStatsPluginWeb extends WebPlugin implements DeviceStatsPluginInterface {
  async getStats(): Promise<DeviceStats> {
    let batteryPercent = 100;
    let isCharging = false;
    try {
      const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
      if (nav.getBattery) {
        const battery = await nav.getBattery();
        batteryPercent = Math.round(battery.level * 100);
        isCharging = battery.charging;
      }
    } catch {
      // Battery Status API unsupported — keep the default
    }

    let storageTotalBytes = 0;
    let storageFreeBytes = 0;
    try {
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        storageTotalBytes = estimate.quota ?? 0;
        storageFreeBytes = (estimate.quota ?? 0) - (estimate.usage ?? 0);
      }
    } catch {
      // Storage Manager API unsupported — keep zeros
    }

    const ramGb = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

    return {
      deviceModel: 'Web Preview',
      manufacturer: 'Browser',
      batteryPercent,
      isCharging,
      storageTotalBytes,
      storageFreeBytes,
      ramTotalBytes: ramGb * 1024 * 1024 * 1024,
      ramAvailBytes: 0,
      wifiConnected: navigator.onLine,
    };
  }
}

export const DeviceStatsPlugin = registerPlugin<DeviceStatsPluginInterface>('DeviceStatsPlugin', {
  web: () => new DeviceStatsPluginWeb(),
});
