import { generateSleepReminders, GenerateRemindersError, type SleepAiDetails } from '../../cloud/generateSleepReminders';
import { SleepModePlugin, type SleepModeConfig, type SleepPersonality } from '../../sleep-mode/plugin';
import { storageGet, storageSet } from '../../storage/db';

/** AI lines are refreshed at most once a day, or right away when what they're based on changes. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** Bumped when the generated shape changes (2 = snooze replies + morning wake-up lines), so a pool
 *  from an older app version is replaced on the next refresh. */
const POOL_VERSION = 2;

interface PoolMeta {
  signature: string;
  at: number;
}

const metaKey = (p: SleepPersonality) => `omnihub:sleepmode.aiPool.${p}`;

/** Personal Mode details the AI may use — none at all unless Personal Mode is on. */
export function aiDetailsFor(config: SleepModeConfig): SleepAiDetails {
  if (config.mode !== 'personal') return {};
  return {
    name: config.callName,
    routine: config.workSchoolRoutine,
    interests: config.interests,
    relationship: config.relationshipStatus === 'prefer-not' ? null : config.relationshipStatus,
    notes: config.customNotes,
  };
}

function signatureFor(config: SleepModeConfig): string {
  return JSON.stringify({ v: POOL_VERSION, d: aiDetailsFor(config) });
}

export function aiPoolUpdatedAt(personality: SleepPersonality): number {
  return storageGet<PoolMeta | null>(metaKey(personality), null)?.at ?? 0;
}

/**
 * Fetches a fresh AI pool for the configured personality and caches it natively (text + voice
 * clips) for the offline nightly path. Skips the network when the cached pool is recent and was
 * written for the same details, unless `force`. Throws GenerateRemindersError on failure.
 */
export async function refreshAiReminders(config: SleepModeConfig, force = false): Promise<'fresh' | 'updated'> {
  const personality = config.personality;
  const signature = signatureFor(config);
  const meta = storageGet<PoolMeta | null>(metaKey(personality), null);
  if (!force && meta && meta.signature === signature && Date.now() - meta.at < MAX_AGE_MS) {
    const info = await SleepModePlugin.getAiMessagesInfo({ personality }).catch(() => ({ generatedAt: 0 }));
    if (info.generatedAt > 0) return 'fresh';
  }

  const { tiersJson, audioClips, extraClips } = await generateSleepReminders({
    personality,
    details: aiDetailsFor(config),
  });
  await SleepModePlugin.setAiMessages({ personality, tiersJson });
  if (audioClips.length) await SleepModePlugin.setAiAudioClips({ personality, clips: audioClips });
  if (extraClips) await SleepModePlugin.setAiExtraClips({ personality, ...extraClips });
  storageSet(metaKey(personality), { signature, at: Date.now() } satisfies PoolMeta);
  return 'updated';
}

export { GenerateRemindersError };
