import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

// Set this to the URL printed by `firebase deploy --only functions` after the first deploy
// (functions/src/index.ts exports `generateSleepReminders`). It stays stable across redeploys of
// the same function, so this only needs to be set once.
const GENERATE_REMINDERS_URL = 'https://us-central1-omni-hub-b7396.cloudfunctions.net/generateSleepReminders';

export type SleepAiPersonality = 'gentle' | 'friendly' | 'teasing' | 'strict' | 'savage';

export class GenerateRemindersError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

/** Personal Mode details the AI may weave into lines (only sent when Personal Mode is on). */
export interface SleepAiDetails {
  name?: string | null;
  routine?: string | null;
  interests?: string | null;
  relationship?: string | null;
  notes?: string | null;
}

interface GenerateOptions {
  personality: SleepAiPersonality;
  details?: SleepAiDetails;
}

export interface ExtraClips {
  snooze: string | null;
  morning: (string | null)[];
  morningSnooze: string | null;
}

export interface GeneratedReminders {
  /** Raw `{"tiers", "snooze", "morning", "morningSnooze"}` JSON string, ready to hand straight to
   *  SleepModePlugin.setAiMessages. */
  tiersJson: string;
  /** One base64 WAV per tier (tier 0's first line only — see generateSleepReminders in
   *  functions/src/index.ts), null for any tier synthesis failed for. Hand straight to
   *  SleepModePlugin.setAiAudioClips. */
  audioClips: (string | null)[];
  /** Clips for line 0 of the snooze / morning lists — hand to SleepModePlugin.setAiExtraClips. */
  extraClips: ExtraClips | null;
}

export async function generateSleepReminders(options: GenerateOptions): Promise<GeneratedReminders> {
  const { token } = await FirebaseAuthentication.getIdToken();

  let res: Response;
  try {
    res = await fetch(GENERATE_REMINDERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ personality: options.personality, version: 2, details: options.details ?? {} }),
    });
  } catch {
    throw new GenerateRemindersError("Couldn't reach Sleep Mode AI. Check your connection and try again.");
  }

  const bodyText = await res.text();
  let data: {
    tiers?: unknown;
    snooze?: unknown;
    morning?: unknown;
    morningSnooze?: unknown;
    audioClips?: unknown;
    extraClips?: { snooze?: unknown; morning?: unknown; morningSnooze?: unknown };
    error?: string;
    code?: string;
  } | null = null;
  try {
    data = JSON.parse(bodyText);
  } catch {
    // handled below by the !res.ok / missing-tiers checks
  }

  if (!res.ok) {
    throw new GenerateRemindersError(data?.error ?? 'Something went wrong. Please try again.', data?.code);
  }
  if (!Array.isArray(data?.tiers)) {
    throw new GenerateRemindersError('Something went wrong. Please try again.');
  }
  const clip = (c: unknown) => (typeof c === 'string' ? c : null);
  const audioClips = Array.isArray(data.audioClips) ? data.audioClips.map(clip) : [];
  const extra = data.extraClips;
  const extraClips: ExtraClips | null = extra
    ? {
        snooze: clip(extra.snooze),
        morning: Array.isArray(extra.morning) ? extra.morning.map(clip) : [],
        morningSnooze: clip(extra.morningSnooze),
      }
    : null;
  const tiersJson = JSON.stringify({
    tiers: data.tiers,
    snooze: Array.isArray(data.snooze) ? data.snooze : [],
    morning: Array.isArray(data.morning) ? data.morning : [],
    morningSnooze: Array.isArray(data.morningSnooze) ? data.morningSnooze : [],
  });
  return { tiersJson, audioClips, extraClips };
}
