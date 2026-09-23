import type { SleepPersonality, RelationshipStatus } from '../../sleep-mode/plugin';

export interface PersonalityMeta {
  id: SleepPersonality;
  label: string;
  description: string;
  emoji: string;
  color: string;
}

export const PERSONALITY_META: PersonalityMeta[] = [
  { id: 'gentle', label: 'Gentle', description: 'Soft, caring nudges', emoji: '🍃', color: 'var(--green)' },
  { id: 'friendly', label: 'Friendly', description: 'Casual, upbeat check-ins', emoji: '😊', color: 'var(--yellow)' },
  { id: 'teasing', label: 'Teasing', description: 'Playful ribbing', emoji: '😆', color: 'var(--orange)' },
  { id: 'strict', label: 'Strict', description: 'Firm, no-nonsense', emoji: '🛡️', color: 'var(--blue)' },
  { id: 'savage', label: 'Savage', description: 'Sharp roasts, all in fun', emoji: '🔥', color: 'var(--red)' },
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
