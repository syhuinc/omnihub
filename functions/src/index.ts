import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import { buildReminders, GenerationError, isPersonality, parseDetails, PERSONALITIES } from './reminders';

initializeApp();

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const DAILY_GENERATION_CAP = 10;

interface GenerateRequestBody {
  personality?: unknown;
  version?: unknown;
  details?: unknown;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const generateSleepReminders = onRequest(
  // v2 requests synthesize 9 clips in parallel, so allow well past the 60s default.
  { secrets: [geminiApiKey], cors: true, region: 'us-central1', timeoutSeconds: 180, memory: '512MiB' },
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
      res.status(400).json({ error: `personality must be one of: ${PERSONALITIES.join(', ')}.` });
      return;
    }
    const personality = body.personality;
    // v1 (app builds before snooze/morning existed) only reads `tiers` + `audioClips`; v2 also gets
    // snooze reactions, the morning wake-up pool and their clips, plus personal details.
    const v2 = body.version === 2;
    const details = v2 ? parseDetails(body.details) : {};

    const db = getFirestore();

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

    try {
      const payload = await buildReminders(new GoogleGenAI({ apiKey: geminiApiKey.value() }), personality, v2, details);
      res.status(200).json(payload);
    } catch (err) {
      if (!(err instanceof GenerationError)) logger.error('Reminder generation failed', err);
      res.status(502).json({ error: "Couldn't generate reminders right now. Please try again." });
    }
  },
);
