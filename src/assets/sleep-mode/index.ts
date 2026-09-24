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
import sampleGentle from './sample-audio/sample-gentle.mp3';
import sampleFriendly from './sample-audio/sample-friendly.mp3';
import sampleTeasing from './sample-audio/sample-teasing.mp3';
import sampleStrict from './sample-audio/sample-strict.mp3';
import sampleSavage from './sample-audio/sample-savage.mp3';

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

/**
 * Real, pre-recorded voice samples (ElevenLabs) for the "Hear a sample" preview — one fixed line
 * per personality, matching the character-art reference. Not used for the actual nightly nags,
 * which need live on-device TTS since their text is dynamic (name, wake time, interests).
 */
export const SAMPLE_AUDIO: Record<string, { audio: string; text: string }> = {
  gentle: { audio: sampleGentle, text: "Hey, it's getting late. Let's get some rest. You did great today." },
  friendly: { audio: sampleFriendly, text: "Still awake, mate? Let's get some sleep! Your pillow is waiting." },
  teasing: { audio: sampleTeasing, text: 'Still on your phone? Interesting strategy for being a morning person.' },
  strict: { audio: sampleStrict, text: "It's your bedtime. No more scrolling. Phone down. Now." },
  savage: { audio: sampleSavage, text: "It's 12:45 AM and you're still scrolling? At this point, your pillow has given up on you." },
};
