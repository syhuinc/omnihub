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
  /** 0-100. Reminders always play on the device's alarm stream (same as any alarm clock —
   *  bypasses ringer/silent/DND) at this level, independent of the phone's own notification or
   *  media volume. */
  volumePercent: number;
  personality: SleepPersonality;
  mode: SleepModeMode;
  callName?: string | null;
  workSchoolRoutine?: string | null;
  relationshipStatus?: RelationshipStatus | null;
  interests?: string | null;
  customNotes?: string | null;
}

export interface SleepModeStatus extends SleepModeConfig {
  sessionStartMillis: number;
  nagCount: number;
  /** 0 if not muted — set by tapping "Snooze" or "Stop for tonight" on the reminder notification. */
  mutedUntilMillis: number;
}

/** One completed night. Real, measured data only — never fabricated. */
export interface SleepSession {
  bedtimeScheduledMillis: number;
  wakeScheduledMillis: number;
  /** 0 if the screen was never caught on — the honest reading is "never nagged." */
  lastNagMillis: number;
  nagCount: number;
}

export interface SleepModePluginInterface {
  configure(options: SleepModeConfig): Promise<{ armed: boolean }>;
  status(): Promise<SleepModeStatus>;
  previewMessage(options: {
    personality: SleepPersonality;
    tier?: number;
    callName?: string | null;
    workSchoolRoutine?: string | null;
    interests?: string | null;
  }): Promise<{ text: string }>;
  speakTest(options: { text: string }): Promise<void>;
  getHistory(): Promise<{ sessions: SleepSession[] }>;
  checkNotificationPermission(): Promise<{ granted: boolean }>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  checkExactAlarmPermission(): Promise<{ granted: boolean }>;
  requestExactAlarmPermission(): Promise<void>;
  checkFullScreenIntentPermission(): Promise<{ granted: boolean }>;
  requestFullScreenIntentPermission(): Promise<void>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<void>;
  /** Caches a freshly-generated AI reminder pool (from generateSleepReminders) for offline use by the nag path. */
  setAiMessages(options: { personality: SleepPersonality; tiersJson: string }): Promise<void>;
  /** 0 if no AI pool is cached for this personality yet. */
  getAiMessagesInfo(options: { personality: SleepPersonality }): Promise<{ generatedAt: number }>;
  /** Caches the real-voice (Gemini TTS) clips generated alongside the AI pool — one base64 WAV
   *  per tier (null for any tier synthesis failed for), index-aligned with the tiers array. */
  setAiAudioClips(options: { personality: SleepPersonality; clips: (string | null)[] }): Promise<void>;
}

export const DEFAULT_SLEEP_MODE_CONFIG: SleepModeConfig = {
  enabled: false,
  bedtimeHour: 22,
  bedtimeMinute: 30,
  wakeHour: 7,
  wakeMinute: 0,
  intervalMin: DEFAULT_INTERVAL_MIN,
  volumePercent: 85,
  personality: 'friendly',
  mode: 'normal',
  callName: null,
  workSchoolRoutine: null,
  relationshipStatus: null,
  interests: null,
  customNotes: null,
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

// Deterministic sample history, only so the web preview has something to render — the real device
// path (SleepModeStore.loadHistory) starts empty and only ever holds genuinely completed nights.
function buildWebPreviewHistory(): SleepSession[] {
  const sessions: SleepSession[] = [];
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const bedtime = now - i * 86_400_000 - 6 * 3_600_000;
    const nagCount = i % 3;
    sessions.push({
      bedtimeScheduledMillis: bedtime,
      wakeScheduledMillis: bedtime + 8.5 * 3_600_000,
      lastNagMillis: nagCount > 0 ? bedtime + nagCount * 20 * 60_000 : 0,
      nagCount,
    });
  }
  return sessions;
}

class SleepModePluginWeb extends WebPlugin implements SleepModePluginInterface {
  private state: SleepModeStatus = { ...DEFAULT_SLEEP_MODE_CONFIG, sessionStartMillis: 0, nagCount: 0, mutedUntilMillis: 0 };
  private history: SleepSession[] = buildWebPreviewHistory();

  async configure(options: SleepModeConfig): Promise<{ armed: boolean }> {
    this.state = { ...options, sessionStartMillis: 0, nagCount: 0, mutedUntilMillis: 0 };
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

  async getHistory(): Promise<{ sessions: SleepSession[] }> {
    return { sessions: this.history };
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

  async checkFullScreenIntentPermission(): Promise<{ granted: boolean }> {
    return { granted: true };
  }

  async requestFullScreenIntentPermission(): Promise<void> {
    // no-op in browser
  }

  async checkOverlayPermission(): Promise<{ granted: boolean }> {
    return { granted: true };
  }

  async requestOverlayPermission(): Promise<void> {
    // no-op in browser
  }

  async setAiMessages(): Promise<void> {
    // no-op in the web preview — the real nag path (and its cache) only exists natively
  }

  async getAiMessagesInfo(): Promise<{ generatedAt: number }> {
    return { generatedAt: 0 };
  }

  async setAiAudioClips(): Promise<void> {
    // no-op in the web preview — same as setAiMessages, only the native nag path consumes this
  }
}

export const SleepModePlugin = registerPlugin<SleepModePluginInterface>('SleepModePlugin', {
  web: () => new SleepModePluginWeb(),
});
