import { registerPlugin, WebPlugin } from '@capacitor/core';

export type SleepPersonality = 'gentle' | 'friendly' | 'teasing' | 'strict' | 'savage';
export type SleepModeMode = 'normal' | 'personal';
export type RelationshipStatus = 'single' | 'relationship' | 'married' | 'prefer-not';

export const PERSONALITIES: SleepPersonality[] = ['gentle', 'friendly', 'teasing', 'strict', 'savage'];
export const DEFAULT_INTERVAL_MIN = 30;

export interface SleepModeConfig {
  enabled: boolean;
  bedtimeHour: number;
  bedtimeMinute: number;
  wakeHour: number;
  wakeMinute: number;
  intervalMin: number;
  personality: SleepPersonality;
  mode: SleepModeMode;
  callName?: string | null;
  hasWorkTomorrow?: boolean;
  relationshipStatus?: RelationshipStatus | null;
}

export interface SleepModeStatus extends SleepModeConfig {
  sessionStartMillis: number;
  nagCount: number;
}

export interface SleepModePluginInterface {
  configure(options: SleepModeConfig): Promise<{ armed: boolean }>;
  status(): Promise<SleepModeStatus>;
  previewMessage(options: {
    personality: SleepPersonality;
    tier?: number;
    callName?: string | null;
    hasWorkTomorrow?: boolean;
  }): Promise<{ text: string }>;
  speakTest(options: { text: string }): Promise<void>;
  checkNotificationPermission(): Promise<{ granted: boolean }>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  checkExactAlarmPermission(): Promise<{ granted: boolean }>;
  requestExactAlarmPermission(): Promise<void>;
}

export const DEFAULT_SLEEP_MODE_CONFIG: SleepModeConfig = {
  enabled: false,
  bedtimeHour: 22,
  bedtimeMinute: 30,
  wakeHour: 7,
  wakeMinute: 0,
  intervalMin: DEFAULT_INTERVAL_MIN,
  personality: 'friendly',
  mode: 'normal',
  callName: null,
  hasWorkTomorrow: false,
  relationshipStatus: null,
};

// A handful of sample lines per personality, only for the web preview's "hear a sample" button —
// the real, much larger message bank lives natively (android/.../sleepmode/MessageBank.java) since
// it has to run without the webview alive. Not meant to match 1:1.
const WEB_PREVIEW_MESSAGES: Record<SleepPersonality, string[]> = {
  gentle: ["It's about time to rest. Good night.", 'A little more sleep would feel better than a little more scrolling.'],
  friendly: ["It's time to sleep. Good night!", 'You said one more minute about an hour ago.'],
  teasing: ["It's sleep o'clock. Don't test me.", 'Go sleep before I explode from overheating.'],
  strict: ["It's time to sleep. Put the phone down.", "It's getting late. This isn't a suggestion."],
  savage: ["It's bedtime. Don't make this weird.", 'Still up? Bold choice.'],
};

class SleepModePluginWeb extends WebPlugin implements SleepModePluginInterface {
  private state: SleepModeStatus = { ...DEFAULT_SLEEP_MODE_CONFIG, sessionStartMillis: 0, nagCount: 0 };

  async configure(options: SleepModeConfig): Promise<{ armed: boolean }> {
    this.state = { ...options, sessionStartMillis: 0, nagCount: 0 };
    return { armed: options.enabled };
  }

  async status(): Promise<SleepModeStatus> {
    return this.state;
  }

  async previewMessage(options: {
    personality: SleepPersonality;
    callName?: string | null;
  }): Promise<{ text: string }> {
    const pool = WEB_PREVIEW_MESSAGES[options.personality] ?? WEB_PREVIEW_MESSAGES.friendly;
    const text = pool[Math.floor(Math.random() * pool.length)];
    return { text: options.callName ? `${options.callName}, ${text.charAt(0).toLowerCase()}${text.slice(1)}` : text };
  }

  async speakTest(options: { text: string }): Promise<void> {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(options.text));
      }
    } catch {
      // speechSynthesis unsupported in this browser — silently no-op
    }
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
}

export const SleepModePlugin = registerPlugin<SleepModePluginInterface>('SleepModePlugin', {
  web: () => new SleepModePluginWeb(),
});
