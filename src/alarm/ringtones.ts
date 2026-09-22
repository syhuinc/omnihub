import { storageGet, storageSet, StorageKeys } from '../storage/db';
import type { RingtoneEntry } from './plugin';
import type { TimeCategory } from './types';

export function loadFavoriteUris(): string[] {
  return storageGet<string[]>(StorageKeys.alarmFavoriteSounds, []);
}

export function isFavorite(uri: string): boolean {
  return loadFavoriteUris().includes(uri);
}

export function toggleFavorite(uri: string): string[] {
  const current = loadFavoriteUris();
  const next = current.includes(uri) ? current.filter((u) => u !== uri) : [...current, uri];
  storageSet(StorageKeys.alarmFavoriteSounds, next);
  return next;
}

export function loadCustomSounds(): RingtoneEntry[] {
  return storageGet<RingtoneEntry[]>(StorageKeys.alarmCustomSounds, []);
}

export function addCustomSound(sound: RingtoneEntry): RingtoneEntry[] {
  const current = loadCustomSounds();
  const exists = current.some((s) => s.uri === sound.uri);
  const next = exists ? current : [...current, sound];
  storageSet(StorageKeys.alarmCustomSounds, next);
  return next;
}

export type CategoryDefaultSounds = Record<TimeCategory, RingtoneEntry | null>;

const EMPTY_CATEGORY_DEFAULTS: CategoryDefaultSounds = {
  morning: null,
  afternoon: null,
  evening: null,
  night: null,
};

export function loadCategoryDefaults(): CategoryDefaultSounds {
  const stored = storageGet<CategoryDefaultSounds | null>(StorageKeys.alarmCategoryDefaultSounds, null);
  return stored ? { ...EMPTY_CATEGORY_DEFAULTS, ...stored } : EMPTY_CATEGORY_DEFAULTS;
}

export function setCategoryDefault(category: TimeCategory, sound: RingtoneEntry | null): CategoryDefaultSounds {
  const next = { ...loadCategoryDefaults(), [category]: sound };
  storageSet(StorageKeys.alarmCategoryDefaultSounds, next);
  return next;
}
