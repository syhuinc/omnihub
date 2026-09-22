import { registerPlugin, WebPlugin } from '@capacitor/core';
import type { RepeatMode } from './types';

export const DEFAULT_BACKUP_OFFSETS_MIN = [5, 10, 30];
export const MAX_BACKUP_OFFSETS = 5;
export const MIN_BACKUP_OFFSET_MIN = 1;
export const MAX_BACKUP_OFFSET_MIN = 180;

export interface AlarmRecord {
  id: string;
  hour: number;
  minute: number;
  label: string;
  repeatMode: RepeatMode;
  enabled: boolean;
  soundUri: string | null;
  soundName: string | null;
  backupEnabled: boolean;
  backupOffsetsMin: number[];
  backupPersistOnDismiss: boolean;
  createdAt: number;
}

export interface ScheduleOptions {
  id?: string;
  hour: number;
  minute: number;
  label?: string;
  repeatMode: RepeatMode;
  enabled?: boolean;
  soundUri?: string | null;
  soundName?: string | null;
  backupEnabled?: boolean;
  backupOffsetsMin?: number[];
  backupPersistOnDismiss?: boolean;
}

export interface RingtoneEntry {
  uri: string;
  name: string;
  isDefault?: boolean;
}

export interface AlarmPluginInterface {
  schedule(options: ScheduleOptions): Promise<{ id: string; armed: boolean }>;
  cancel(options: { id: string }): Promise<void>;
  list(): Promise<{ alarms: AlarmRecord[] }>;
  checkNotificationPermission(): Promise<{ granted: boolean }>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  checkExactAlarmPermission(): Promise<{ granted: boolean }>;
  requestExactAlarmPermission(): Promise<void>;
  pickRingtone(): Promise<{ cancelled: boolean; uri?: string; name?: string }>;
  listRingtones(): Promise<{ sounds: RingtoneEntry[] }>;
  previewSound(options: { uri: string | null }): Promise<void>;
  stopPreview(): Promise<void>;
  importCustomAudio(): Promise<{ cancelled: boolean; uri?: string; name?: string }>;
  getCrashLog(): Promise<{ log: string }>;
  clearCrashLog(): Promise<void>;
}

class AlarmPluginWeb extends WebPlugin implements AlarmPluginInterface {
  private alarms = new Map<string, AlarmRecord>();

  async schedule(options: ScheduleOptions): Promise<{ id: string; armed: boolean }> {
    const id = options.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.alarms.set(id, {
      id,
      hour: options.hour,
      minute: options.minute,
      label: options.label ?? '',
      repeatMode: options.repeatMode,
      enabled: options.enabled ?? true,
      soundUri: options.soundUri ?? null,
      soundName: options.soundName ?? null,
      backupEnabled: options.backupEnabled ?? false,
      backupOffsetsMin: options.backupOffsetsMin?.length ? options.backupOffsetsMin : DEFAULT_BACKUP_OFFSETS_MIN,
      backupPersistOnDismiss: options.backupPersistOnDismiss ?? false,
      createdAt: Date.now(),
    });
    return { id, armed: true };
  }

  async cancel(options: { id: string }): Promise<void> {
    this.alarms.delete(options.id);
  }

  async list(): Promise<{ alarms: AlarmRecord[] }> {
    return { alarms: Array.from(this.alarms.values()) };
  }

  async checkNotificationPermission(): Promise<{ granted: boolean }> {
    return { granted: true };
  }

  async requestNotificationPermission(): Promise<{ granted: boolean }> {
    return { granted: true };
  }

  async checkExactAlarmPermission(): Promise<{ granted: boolean }> {
    return { granted: true };
  }

  async requestExactAlarmPermission(): Promise<void> {
    // no-op in browser
  }

  async pickRingtone(): Promise<{ cancelled: boolean; uri?: string; name?: string }> {
    return { cancelled: true };
  }

  async listRingtones(): Promise<{ sounds: RingtoneEntry[] }> {
    return {
      sounds: [
        { uri: 'web-default', name: 'Default Alarm', isDefault: true },
        { uri: 'web-chime', name: 'Chime' },
        { uri: 'web-bells', name: 'Bells' },
        { uri: 'web-classic', name: 'Classic Buzzer' },
      ],
    };
  }

  async previewSound(): Promise<void> {
    // no-op in browser
  }

  async stopPreview(): Promise<void> {
    // no-op in browser
  }

  async importCustomAudio(): Promise<{ cancelled: boolean; uri?: string; name?: string }> {
    return { cancelled: true };
  }

  async getCrashLog(): Promise<{ log: string }> {
    return { log: '' };
  }

  async clearCrashLog(): Promise<void> {
    // no-op in browser
  }
}

export const AlarmPlugin = registerPlugin<AlarmPluginInterface>('AlarmPlugin', {
  web: () => new AlarmPluginWeb(),
});
