import type { SleepPersonality, RelationshipStatus } from '../../sleep-mode/plugin';
import { PERSONALITY_IMAGES, SOUND_IMAGES } from '../../assets/sleep-mode';

export interface PersonalityMeta {
  id: SleepPersonality | 'custom';
  label: string;
  description: string;
  emoji: string;
  image?: string;
  icon?: string;
  color: string;
  /** 'normal' personalities are free and selectable today; 'ai' ones are shown but locked until Sleep Mode AI exists. */
  tier: 'normal' | 'ai';
  /** True once this personality has a real, live AI chat backend — see SleepModeAiChat. */
  chatEnabled?: boolean;
}

export const PERSONALITY_META: PersonalityMeta[] = [
  { id: 'gentle', label: 'Gentle', description: 'Soft, caring nudges', emoji: '🍃', image: PERSONALITY_IMAGES.gentle, color: 'var(--green)', tier: 'normal', chatEnabled: true },
  { id: 'friendly', label: 'Friendly', description: 'Casual, upbeat check-ins', emoji: '😊', image: PERSONALITY_IMAGES.friendly, color: 'var(--yellow)', tier: 'normal' },
  { id: 'teasing', label: 'Teasing', description: 'Playful ribbing', emoji: '😆', image: PERSONALITY_IMAGES.teasing, color: 'var(--orange)', tier: 'ai' },
  { id: 'strict', label: 'Strict', description: 'Firm, no-nonsense', emoji: '🛡️', image: PERSONALITY_IMAGES.strict, color: 'var(--blue)', tier: 'ai' },
  { id: 'savage', label: 'Savage', description: 'Sharp roasts, all in fun', emoji: '🔥', image: PERSONALITY_IMAGES.savage, color: 'var(--red)', tier: 'ai' },
  { id: 'custom', label: 'Custom', description: 'Create your own AI personality', emoji: '🎨', icon: 'palette', color: 'var(--purple)', tier: 'ai' },
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
  shortLabel: string;
  icon: string;
}

export const WIND_DOWN_ACTIONS: WindDownAction[] = [
  { id: 'sounds', label: 'Relaxing Sounds', shortLabel: 'Sounds', icon: 'music' },
  { id: 'breathing', label: 'Breathing Exercise', shortLabel: 'Breathing', icon: 'activity' },
  { id: 'dim', label: 'Screen Dim', shortLabel: 'Screen Dim', icon: 'sun' },
  { id: 'focus', label: 'Focus Mode', shortLabel: 'Focus Mode', icon: 'moon' },
];
