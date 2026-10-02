import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

// Set this to the URL printed by `firebase deploy --only functions` after the first deploy
// (functions/src/index.ts exports `generateSleepReminders`). It stays stable across redeploys of
// the same function, so this only needs to be set once.
const GENERATE_REMINDERS_URL = 'https://us-central1-omni-hub-b7396.cloudfunctions.net/generateSleepReminders';

export type SleepAiPersonality = 'gentle' | 'friendly';

export class GenerateRemindersError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

interface GenerateOptions {
  personality: SleepAiPersonality;
  displayName?: string | null;
  workSchoolRoutine?: string | null;
  interests?: string | null;
}

export interface GeneratedReminders {
  /** Raw `{"tiers": [...]}` JSON string, ready to hand straight to SleepModePlugin.setAiMessages. */
  tiersJson: string;
  /** One base64 WAV per tier (tier 0's first line only — see generateSleepReminders in
   *  functions/src/index.ts), null for any tier synthesis failed for. Hand straight to
   *  SleepModePlugin.setAiAudioClips. */
  audioClips: (string | null)[];
}

export async function generateSleepReminders(options: GenerateOptions): Promise<GeneratedReminders> {
  const { token } = await FirebaseAuthentication.getIdToken();

  let res: Response;
  try {
    res = await fetch(GENERATE_REMINDERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        personality: options.personality,
        displayName: options.displayName ?? undefined,
        workSchoolRoutine: options.workSchoolRoutine ?? undefined,
        interests: options.interests ?? undefined,
      }),
    });
  } catch {
    throw new GenerateRemindersError("Couldn't reach Sleep Mode AI. Check your connection and try again.");
  }

  const bodyText = await res.text();
  let data: { tiers?: unknown; audioClips?: unknown; error?: string; code?: string } | null = null;
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
  const audioClips = Array.isArray(data.audioClips)
    ? data.audioClips.map((c) => (typeof c === 'string' ? c : null))
    : [];
  return { tiersJson: JSON.stringify({ tiers: data.tiers }), audioClips };
}
