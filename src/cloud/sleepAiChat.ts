import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

// Set this to the URL printed by `firebase deploy --only functions` after the first deploy
// (functions/src/index.ts exports `sleepAiChat`). It stays stable across redeploys of the same
// function, so this only needs to be set once.
const SLEEP_AI_CHAT_URL = 'https://us-central1-omni-hub-b7396.cloudfunctions.net/sleepAiChat';

export class SleepAiChatError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

export async function sendSleepAiMessage(message: string): Promise<string> {
  const { token } = await FirebaseAuthentication.getIdToken();

  let res: Response;
  try {
    res = await fetch(SLEEP_AI_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message }),
    });
  } catch {
    throw new SleepAiChatError("Couldn't reach Sleep Mode AI. Check your connection and try again.");
  }

  let data: { reply?: string; error?: string; code?: string } | null = null;
  try {
    data = await res.json();
  } catch {
    // fall through — handled by the !res.ok / missing-reply checks below
  }

  if (!res.ok) {
    throw new SleepAiChatError(data?.error ?? 'Something went wrong. Please try again.', data?.code);
  }
  if (!data?.reply) {
    throw new SleepAiChatError('Something went wrong. Please try again.');
  }
  return data.reply;
}
