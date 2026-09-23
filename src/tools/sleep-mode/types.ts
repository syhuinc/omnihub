import type { SleepPersonality, RelationshipStatus } from '../../sleep-mode/plugin';

export interface PersonalityMeta {
  id: SleepPersonality;
  label: string;
  description: string;
  emoji: string;
  color: string;
  pro: boolean;
}

export const PERSONALITY_META: PersonalityMeta[] = [
  { id: 'gentle', label: 'Gentle', description: 'Soft, caring nudges', emoji: '🍃', color: 'var(--green)', pro: false },
  { id: 'friendly', label: 'Friendly', description: 'Casual, upbeat check-ins', emoji: '😊', color: 'var(--yellow)', pro: false },
  { id: 'teasing', label: 'Teasing', description: 'Playful ribbing', emoji: '😆', color: 'var(--orange)', pro: false },
  { id: 'strict', label: 'Strict', description: 'Firm, no-nonsense', emoji: '🛡️', color: 'var(--blue)', pro: true },
  { id: 'savage', label: 'Savage', description: 'Sharp roasts, all in fun', emoji: '🔥', color: 'var(--red)', pro: true },
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
}

export const SLEEP_SOUNDS: SoundMeta[] = [
  { id: 'rain', label: 'Rain', category: 'rain', emoji: '🌧️' },
  { id: 'forest', label: 'Forest', category: 'nature', emoji: '🌲' },
  { id: 'ocean', label: 'Ocean', category: 'ocean', emoji: '🌊' },
  { id: 'night-ambience', label: 'Night Ambience', category: 'nature', emoji: '🌙' },
  { id: 'campfire', label: 'Campfire', category: 'white-noise', emoji: '🔥' },
  { id: 'cafe', label: 'Cafe', category: 'white-noise', emoji: '☕' },
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
