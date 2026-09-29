import { storageGet, storageSet, StorageKeys } from '../storage/db';

export const DEFAULT_PINNED_TOOL_IDS = ['calculator', 'unit-converter', 'notes', 'timer'];
export const MAX_PINNED_TOOLS = 8;

export function loadPinnedToolIds(): string[] {
  return storageGet(StorageKeys.pinnedTools, DEFAULT_PINNED_TOOL_IDS);
}

export function savePinnedToolIds(ids: string[]): void {
  storageSet(StorageKeys.pinnedTools, ids);
}
