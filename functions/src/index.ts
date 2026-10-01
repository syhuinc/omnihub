import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI, Type } from '@google/genai';

initializeApp();

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const DAILY_GENERATION_CAP = 10;
const LINES_PER_TIER = 8;
const MODEL = 'gemini-3.1-flash-lite';

type Personality = 'gentle' | 'friendly';

const PERSONALITY_VOICE: Record<Personality, string> = {
  gentle: 'Soft, warm, caring — like a close friend gently checking in. Never harsh, never guilt-trippy.',
  friendly: 'Casual, upbeat, a little playful — like a buddy texting you, not a parent lecturing you.',
};

const TIER_GUIDANCE = [
  'Tier 0 (right at bedtime): a light, first nudge. Calm, no urgency yet.',
  "Tier 1 (a bit later): slightly more persistent. Acknowledge they're still up, gently push a bit harder.",
  'Tier 2 (later still): noticeably more insistent, but still in-character and never mean. Real concern shows.',
  "Tier 3 (most persistent): the strongest version of this personality's voice, still true to their character (gentle stays caring even at its most insistent; friendly stays warm even when exasperated). Never actually angry or cruel.",
];

interface GenerateRequestBody {
  personality?: unknown;
  displayName?: unknown;
  workSchoolRoutine?: unknown;
  interests?: unknown;
}

function isPersonality(value: unknown): value is Personality {
  return value === 'gentle' || value === 'friendly';
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const generateSleepReminders = onRequest(
  { secrets: [geminiApiKey], cors: true, region: 'us-central1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const authHeader = req.headers.authorization ?? '';
    const match = /^Bearer (.+)$/.exec(authHeader);
    if (!match) {
      res.status(401).json({ error: 'Missing Authorization header' });
      return;
    }

    let uid: string;
    try {
      const decoded = await getAuth().verifyIdToken(match[1]);
      uid = decoded.uid;
    } catch (err) {
      logger.warn('Invalid ID token', err);
      res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
      return;
    }

    const body = req.body as GenerateRequestBody;
    if (!isPersonality(body.personality)) {
      res.status(400).json({ error: 'personality must be "gentle" or "friendly".' });
      return;
    }
    const personality = body.personality;
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 60) : '';
    const workSchoolRoutine = typeof body.workSchoolRoutine === 'string' ? body.workSchoolRoutine.trim().slice(0, 200) : '';
    const interests = typeof body.interests === 'string' ? body.interests.trim().slice(0, 200) : '';

    const db = getFirestore();

    // Sleep Mode AI is a Pro feature. isPro is never client-writable (see firestore.rules) —
    // this is the authoritative check; the client also checks it to avoid a wasted round trip.
    try {
      const userSnap = await db.doc(`users/${uid}`).get();
      if (userSnap.data()?.isPro !== true) {
        res.status(403).json({ error: 'Sleep Mode AI is a Pro feature.', code: 'pro_required' });
        return;
      }
    } catch (err) {
      logger.error('Pro status check failed', err);
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
      return;
    }

    const usageRef = db.doc(`users/${uid}/sleepAiMeta/generationUsage`);

    try {
      const capReached = await db.runTransaction(async (tx) => {
        const snap = await tx.get(usageRef);
        const data = snap.exists ? snap.data() : null;
        const today = todayKey();
        const count = data && data.date === today ? (data.count as number) : 0;
        if (count >= DAILY_GENERATION_CAP) return true;
        tx.set(usageRef, { date: today, count: count + 1 }, { merge: true });
        return false;
      });

      if (capReached) {
        res.status(429).json({
          error: "You've reached today's reminder-generation limit. Try again tomorrow.",
          code: 'rate_limited',
        });
        return;
      }
    } catch (err) {
      logger.error('Rate limit check failed', err);
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
      return;
    }

    const personalization: string[] = [];
    if (displayName) {
      personalization.push(`Their name is "${displayName}" — you may address them by name in some (not all) lines, naturally.`);
    }
    if (workSchoolRoutine) {
      personalization.push(`They have this routine tomorrow: "${workSchoolRoutine}" — you may reference it in a couple of lines for tier 1+.`);
    }
    if (interests) {
      personalization.push(`They're into: "${interests}" — you may reference it playfully in a couple of lines for tier 1+.`);
    }

    const prompt = `Write bedtime reminder lines for the "${personality}" personality of Sleep Mode, a
feature that nudges someone to stop using their phone and go to sleep.

Voice: ${PERSONALITY_VOICE[personality]}

${personalization.length ? personalization.join('\n') : 'No personal details are available — keep every line generic (no name, no specific references).'}

Write exactly ${LINES_PER_TIER} distinct lines for EACH of these 4 escalation tiers:
${TIER_GUIDANCE.join('\n')}

Rules for every line:
- One short sentence, occasionally two. Never more.
- No emoji, no hashtags, no quotation marks around the line itself.
- Never mention AI, apps, notifications, or that this is generated — it should read like a real person texting.
- Each line must stand completely alone (the user only ever sees one line at a time).
- Lines within the same tier must all be meaningfully different from each other — vary sentence structure and wording, not just swap one word.`;

    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    let tiers: string[][];
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tiers: {
                type: Type.ARRAY,
                items: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
            },
            required: ['tiers'],
          },
        },
      });
      const raw = (response.text ?? '').trim();
      const parsed = JSON.parse(raw) as { tiers?: unknown };
      if (!Array.isArray(parsed.tiers) || parsed.tiers.length !== 4) {
        throw new Error('Malformed tiers shape from model');
      }
      tiers = parsed.tiers.map((tier) =>
        Array.isArray(tier) ? tier.filter((l): l is string => typeof l === 'string' && l.trim().length > 0) : [],
      );
      if (tiers.some((t) => t.length === 0)) throw new Error('One or more tiers came back empty');
    } catch (err) {
      logger.error('Gemini generation failed', err);
      res.status(502).json({ error: "Couldn't generate reminders right now. Please try again." });
      return;
    }

    res.status(200).json({ tiers, generatedAt: Date.now() });
  },
);
