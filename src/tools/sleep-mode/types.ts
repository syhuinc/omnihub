import type { SleepPersonality, RelationshipStatus } from '../../sleep-mode/plugin';
import { PERSONALITY_IMAGES, SOUND_IMAGES } from '../../assets/sleep-mode';

export interface PersonalityMeta {
  id: SleepPersonality;
  label: string;
  description: string;
  emoji: string;
  image: string;
  color: string;
  pro: boolean;
}

export const PERSONALITY_META: PersonalityMeta[] = [
  { id: 'gentle', label: 'Gentle', description: 'Soft, caring nudges', emoji: '🍃', image: PERSONALITY_IMAGES.gentle, color: 'var(--green)', pro: false },
  { id: 'friendly', label: 'Friendly', description: 'Casual, upbeat check-ins', emoji: '😊', image: PERSONALITY_IMAGES.friendly, color: 'var(--yellow)', pro: false },
  { id: 'teasing', label: 'Teasing', description: 'Playful ribbing', emoji: '😆', image: PERSONALITY_IMAGES.teasing, color: 'var(--orange)', pro: false },
  { id: 'strict', label: 'Strict', description: 'Firm, no-nonsense', emoji: '🛡️', image: PERSONALITY_IMAGES.strict, color: 'var(--blue)', pro: true },
  { id: 'savage', label: 'Savage', description: 'Sharp roasts, all in fun', emoji: '🔥', image: PERSONALITY_IMAGES.savage, color: 'var(--red)', pro: true },
];

export interface RelationshipOption {
  id: RelationshipStatus;
  label: string;
}

export const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  { id: 'single', label: 'Single' },
  { id: 'relationship', label: 'In a relationship' },
  { id: 'married', label: 'Married' },
  { id: 'prefer-not', label: 'Prefer not to say' },
];

export const INTERVAL_OPTIONS_MIN = [15, 20, 30, 45, 60];

export interface SoundMeta {
  id: string;
  label: string;
  category: 'nature' | 'rain' | 'ocean' | 'white-noise';
  emoji: string;
  image: string;
}

export const SLEEP_SOUNDS: SoundMeta[] = [
  { id: 'rain', label: 'Rain', category: 'rain', emoji: '🌧️', image: SOUND_IMAGES.rain },
  { id: 'forest', label: 'Forest', category: 'nature', emoji: '🌲', image: SOUND_IMAGES.forest },
  { id: 'ocean', label: 'Ocean', category: 'ocean', emoji: '🌊', image: SOUND_IMAGES.ocean },
  { id: 'night-ambience', label: 'Night Ambience', category: 'nature', emoji: '🌙', image: SOUND_IMAGES['night-ambience'] },
  { id: 'campfire', label: 'Campfire', category: 'white-noise', emoji: '🔥', image: SOUND_IMAGES.campfire },
  { id: 'cafe', label: 'Cafe', category: 'white-noise', emoji: '☕', image: SOUND_IMAGES.cafe },
];

export const SOUND_FILTERS: { id: 'all' | SoundMeta['category']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'nature', label: 'Nature' },
  { id: 'rain', label: 'Rain' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'white-noise', label: 'White Noise' },
];

export interface WindDownAction {
  id: string;
  label: string;
  icon: string;
}

export const WIND_DOWN_ACTIONS: WindDownAction[] = [
  { id: 'sounds', label: 'Relaxing Sounds', icon: 'music' },
  { id: 'breathing', label: 'Breathing Exercise', icon: 'activity' },
  { id: 'dim', label: 'Screen Dim', icon: 'sun' },
  { id: 'focus', label: 'Focus Mode', icon: 'moon' },
];
