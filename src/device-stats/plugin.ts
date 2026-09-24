import { registerPlugin, WebPlugin } from '@capacitor/core';

export interface DeviceStats {
  deviceModel: string;
  manufacturer: string;
  batteryPercent: number;
  isCharging: boolean;
  batteryTempC: number;
  storageTotalBytes: number;
  storageFreeBytes: number;
  ramTotalBytes: number;
  ramAvailBytes: number;
  wifiConnected: boolean;
  ipAddress: string;
  wifiRxMbps: number;
  wifiTxMbps: number;
}

export interface DeviceInfo {
  deviceModel: string;
  manufacturer: string;
  androidVersion: string;
  buildNumber: string;
  socManufacturer: string;
  socModel: string;
  screenWidthPx: number;
  screenHeightPx: number;
  refreshRateHz: number;
  screenSizeInches: number;
  ramTotalBytes: number;
  storageTotalBytes: number;
  uptimeMillis: number;
}

export interface DeviceStatsPluginInterface {
  getStats(): Promise<DeviceStats>;
  getDeviceInfo(): Promise<DeviceInfo>;
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
      batteryTempC: 0,
      storageTotalBytes,
      storageFreeBytes,
      ramTotalBytes: ramGb * 1024 * 1024 * 1024,
      ramAvailBytes: 0,
      wifiConnected: navigator.onLine,
      ipAddress: '',
      wifiRxMbps: 0,
      wifiTxMbps: 0,
    };
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    const ramGb = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    let storageTotalBytes = 0;
    try {
      if (navigator.storage?.estimate) {
        storageTotalBytes = (await navigator.storage.estimate()).quota ?? 0;
      }
    } catch {
      // Storage Manager API unsupported — keep zero
    }

    return {
      deviceModel: 'Web Preview',
      manufacturer: 'Browser',
      androidVersion: '—',
      buildNumber: navigator.userAgent.slice(0, 40),
      socManufacturer: '',
      socModel: '',
      screenWidthPx: window.screen.width,
      screenHeightPx: window.screen.height,
      refreshRateHz: 60,
      screenSizeInches: 0,
      ramTotalBytes: ramGb * 1024 * 1024 * 1024,
      storageTotalBytes,
      uptimeMillis: performance.now(),
    };
  }
}

export const DeviceStatsPlugin = registerPlugin<DeviceStatsPluginInterface>('DeviceStatsPlugin', {
  web: () => new DeviceStatsPluginWeb(),
});
