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
import sampleGentle from './sample-audio/sample-gentle.m4a';
import sampleFriendly from './sample-audio/sample-friendly.m4a';
import sampleTeasing from './sample-audio/sample-teasing.m4a';
import sampleStrict from './sample-audio/sample-strict.m4a';
import sampleSavage from './sample-audio/sample-savage.m4a';
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

/**
 * Real, pre-recorded voice samples (Gemini API TTS) for the "Hear a sample" preview — one fixed
 * line per personality, matching the character-art reference. Not used for the actual nightly nags,
 * which need live on-device TTS since their text is dynamic (name, wake time, interests).
 */
export const SAMPLE_AUDIO: Record<string, { audio: string; text: string }> = {
  gentle: { audio: sampleGentle, text: "Hey, it's getting late. Let's get some rest. You did great today." },
  friendly: { audio: sampleFriendly, text: "It's time to sleep. Good night!" },
  teasing: { audio: sampleTeasing, text: 'Still on your phone? Interesting strategy for being a morning person.' },
  strict: { audio: sampleStrict, text: "It's your bedtime. No more scrolling. Phone down. Now." },
  savage: { audio: sampleSavage, text: "It's 12:45 AM and you're still scrolling? At this point, your pillow has given up on you." },
};
