import { registerPlugin, WebPlugin } from '@capacitor/core';

export interface SetAsRingtoneResult {
  success: boolean;
  needsPermission?: boolean;
}

export interface RingtonePluginInterface {
  checkWriteSettingsPermission(): Promise<{ granted: boolean }>;
  requestWriteSettingsPermission(): Promise<void>;
  setAsRingtone(options: { base64: string; fileName: string; mimeType: string }): Promise<SetAsRingtoneResult>;
}

class RingtonePluginWeb extends WebPlugin implements RingtonePluginInterface {
  async checkWriteSettingsPermission(): Promise<{ granted: boolean }> {
    return { granted: false };
  }

  async requestWriteSettingsPermission(): Promise<void> {
    // no-op in browser — there's no OS Settings screen to send the user to
  }

  async setAsRingtone(): Promise<SetAsRingtoneResult> {
    throw this.unimplemented('Setting a ringtone is only available in the Android app.');
  }
}

export const RingtonePlugin = registerPlugin<RingtonePluginInterface>('RingtonePlugin', {
  web: () => new RingtonePluginWeb(),
});
