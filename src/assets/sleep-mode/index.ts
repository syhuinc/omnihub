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
