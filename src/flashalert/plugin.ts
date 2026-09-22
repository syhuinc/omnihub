import { registerPlugin, WebPlugin } from '@capacitor/core';

export interface FlashAlertSettings {
  notificationEnabled: boolean;
  callEnabled: boolean;
  alarmEnabled: boolean;
  notificationAccessGranted: boolean;
  callPermissionGranted: boolean;
}

export interface FlashAlertPluginInterface {
  getSettings(): Promise<FlashAlertSettings>;
  setNotificationEnabled(options: { enabled: boolean }): Promise<FlashAlertSettings>;
  setCallEnabled(options: { enabled: boolean }): Promise<FlashAlertSettings>;
  setAlarmEnabled(options: { enabled: boolean }): Promise<FlashAlertSettings>;
  openNotificationAccessSettings(): Promise<void>;
  requestCallPermission(): Promise<FlashAlertSettings>;
}

const DEFAULT_SETTINGS: FlashAlertSettings = {
  notificationEnabled: false,
  callEnabled: false,
  alarmEnabled: false,
  notificationAccessGranted: false,
  callPermissionGranted: false,
};

class FlashAlertPluginWeb extends WebPlugin implements FlashAlertPluginInterface {
  private settings: FlashAlertSettings = { ...DEFAULT_SETTINGS };

  async getSettings(): Promise<FlashAlertSettings> {
    return this.settings;
  }

  async setNotificationEnabled(options: { enabled: boolean }): Promise<FlashAlertSettings> {
    this.settings = { ...this.settings, notificationEnabled: options.enabled };
    return this.settings;
  }

  async setCallEnabled(options: { enabled: boolean }): Promise<FlashAlertSettings> {
    this.settings = { ...this.settings, callEnabled: options.enabled };
    return this.settings;
  }

  async setAlarmEnabled(options: { enabled: boolean }): Promise<FlashAlertSettings> {
    this.settings = { ...this.settings, alarmEnabled: options.enabled };
    return this.settings;
  }

  async openNotificationAccessSettings(): Promise<void> {
    // no-op in browser
  }

  async requestCallPermission(): Promise<FlashAlertSettings> {
    return this.settings;
  }
}

export const FlashAlertPlugin = registerPlugin<FlashAlertPluginInterface>('FlashAlertPlugin', {
  web: () => new FlashAlertPluginWeb(),
});
