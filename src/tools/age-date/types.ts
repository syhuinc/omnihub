export const RELATIONSHIPS = [
  'Parent',
  'Sibling',
  'Partner',
  'Child',
  'Friend',
  'Relative',
  'Colleague',
  'Pet',
  'Other',
] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

export const AVATAR_PRESETS = ['blue', 'pink', 'orange', 'green'] as const;
export type AvatarPreset = (typeof AVATAR_PRESETS)[number];

export interface Person {
  id: string;
  name: string;
  birthISO: string;
  relationship?: Relationship;
  avatar: AvatarPreset;
  photo?: string;
  reminderEnabled?: boolean;
  favorited?: boolean;
  createdAt: number;
  updatedAt: number;
}

export const ME_ID = 'me';
