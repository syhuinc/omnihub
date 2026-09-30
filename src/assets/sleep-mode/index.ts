import heroBanner from './hero-banner.webp';
import personalityGentle from './personality-gentle.webp';
import personalityFriendly from './personality-friendly.webp';
import personalityTeasing from './personality-teasing.webp';
import personalityStrict from './personality-strict.webp';
import personalitySavage from './personality-savage.webp';
import soundRain from './sound-rain.webp';
import soundForest from './sound-forest.webp';
import soundOcean from './sound-ocean.webp';
import soundNightAmbience from './sound-night-ambience.webp';
import soundCampfire from './sound-campfire.webp';
import soundCafe from './sound-cafe.webp';
import sampleGentleBedtime from './sample-audio/sample-gentle-bedtime.m4a';
import sampleGentleSnooze from './sample-audio/sample-gentle-snooze.m4a';
import sampleGentleWake from './sample-audio/sample-gentle-wake.m4a';
import sampleFriendlyBedtime from './sample-audio/sample-friendly-bedtime.m4a';
import sampleFriendlySnooze from './sample-audio/sample-friendly-snooze.m4a';
import sampleFriendlyWake from './sample-audio/sample-friendly-wake.m4a';
import sampleTeasingBedtime from './sample-audio/sample-teasing-bedtime.m4a';
import sampleTeasingSnooze from './sample-audio/sample-teasing-snooze.m4a';
import sampleTeasingWake from './sample-audio/sample-teasing-wake.m4a';
import sampleStrictBedtime from './sample-audio/sample-strict-bedtime.m4a';
import sampleStrictSnooze from './sample-audio/sample-strict-snooze.m4a';
import sampleStrictWake from './sample-audio/sample-strict-wake.m4a';
import sampleSavageBedtime from './sample-audio/sample-savage-bedtime.m4a';
import sampleSavageSnooze from './sample-audio/sample-savage-snooze.m4a';
import sampleSavageWake from './sample-audio/sample-savage-wake.m4a';
import audioRain from './sound-audio/rain.mp3';
import audioForest from './sound-audio/forest.mp3';
import audioOcean from './sound-audio/ocean.mp3';
import audioNightAmbience from './sound-audio/night-ambience.mp3';
import audioCampfire from './sound-audio/campfire.mp3';
import audioCafe from './sound-audio/cafe.mp3';

export { heroBanner };

export const PERSONALITY_IMAGES: Record<string, string> = {
  gentle: personalityGentle,
  friendly: personalityFriendly,
  teasing: personalityTeasing,
  strict: personalityStrict,
  savage: personalitySavage,
};

export const SOUND_IMAGES: Record<string, string> = {
  rain: soundRain,
  forest: soundForest,
  ocean: soundOcean,
  'night-ambience': soundNightAmbience,
  campfire: soundCampfire,
  cafe: soundCafe,
};

/** Looping ambient audio beds (60s loops) for Sleep Sounds — bundled with the app, played on-device. */
export const SOUND_AUDIO: Record<string, string> = {
  rain: audioRain,
  forest: audioForest,
  ocean: audioOcean,
  'night-ambience': audioNightAmbience,
  campfire: audioCampfire,
  cafe: audioCafe,
};

export type PreviewPhase = 'bedtime' | 'snooze' | 'wake';

export interface PreviewSample {
  phase: PreviewPhase;
  text: string;
  audio: string;
}

/**
 * Real, pre-recorded voice samples (Gemini API TTS) for the AI tab's "Hear a Preview" player —
 * 3 lines per personality, one for each moment Sleep Mode AI actually speaks: the bedtime nudge,
 * a snooze reaction, and the wake-up greeting. Not used for the actual nightly nags, which need
 * live on-device TTS since their text is dynamic (name, wake time, interests).
 */
export const PREVIEW_SAMPLES: Record<string, PreviewSample[]> = {
  gentle: [
    { phase: 'bedtime', text: "Hey... you've had a long day. Come on, let's call it a night.", audio: sampleGentleBedtime },
    { phase: 'snooze', text: "You can have your five minutes. Then we're going to bed, okay?", audio: sampleGentleSnooze },
    { phase: 'wake', text: "Good morning. No rush. Just sit up first. We'll take it from there.", audio: sampleGentleWake },
  ],
  friendly: [
    { phase: 'bedtime', text: "Hey mate, bedtime. Come on, let's get you off that phone.", audio: sampleFriendlyBedtime },
    { phase: 'snooze', text: "You really want another five minutes? Fine. I'll be back.", audio: sampleFriendlySnooze },
    { phase: 'wake', text: "Morning! You're up! Come on, let's get this day started.", audio: sampleFriendlyWake },
  ],
  teasing: [
    { phase: 'bedtime', text: "Ohhh, look who's still awake. Weren't you supposed to be sleeping?", audio: sampleTeasingBedtime },
    { phase: 'snooze', text: 'Snooze? Of course. I totally saw that coming.', audio: sampleTeasingSnooze },
    { phase: 'wake', text: 'Good morning, sleepyhead. Did you actually sleep, or were you negotiating with me all night?', audio: sampleTeasingWake },
  ],
  strict: [
    { phase: 'bedtime', text: "It's bedtime. Phone down. We're done for tonight.", audio: sampleStrictBedtime },
    { phase: 'snooze', text: "You chose snooze. Five minutes. After that, you're getting up.", audio: sampleStrictSnooze },
    { phase: 'wake', text: 'Alarm dismissed. Feet on the floor. Start your morning.', audio: sampleStrictWake },
  ],
  savage: [
    { phase: 'bedtime', text: "You're still awake? At this point, sleep isn't the problem. You are.", audio: sampleSavageBedtime },
    { phase: 'snooze', text: 'Snooze again? Incredible. Your commitment to avoiding responsibility is impressive.', audio: sampleSavageSnooze },
    { phase: 'wake', text: "My job is done. If you crawl back into that bed, that's between you and tomorrow.", audio: sampleSavageWake },
  ],
};
