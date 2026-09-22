import { storageGet, storageSet, StorageKeys } from '../storage/db';
import { DEFAULT_PRESETS, type AlarmPreset, type AlarmPresets, type TimeCategory } from './types';

export function loadPresets(): AlarmPresets {
  const stored = storageGet<AlarmPresets | null>(StorageKeys.alarmPresets, null);
  if (!stored) return DEFAULT_PRESETS;
  // merge so a future new category always has a value even for an older stored blob
  return { ...DEFAULT_PRESETS, ...stored };
}

export function savePresets(presets: AlarmPresets): void {
  storageSet(StorageKeys.alarmPresets, presets);
}

export function addPreset(category: TimeCategory, preset: AlarmPreset): AlarmPresets {
  const presets = loadPresets();
  const exists = presets[category].some((p) => p.hour === preset.hour && p.minute === preset.minute);
  const next: AlarmPresets = exists
    ? presets
    : {
        ...presets,
        [category]: [...presets[category], preset].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)),
      };
  savePresets(next);
  return next;
}

export function removePreset(category: TimeCategory, preset: AlarmPreset): AlarmPresets {
  const presets = loadPresets();
  const next: AlarmPresets = {
    ...presets,
    [category]: presets[category].filter((p) => !(p.hour === preset.hour && p.minute === preset.minute)),
  };
  savePresets(next);
  return next;
}

export function resetPresets(): AlarmPresets {
  savePresets(DEFAULT_PRESETS);
  return DEFAULT_PRESETS;
}
