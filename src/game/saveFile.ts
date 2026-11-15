/**
 * Save file: everything the game keeps in the browser, as one JSON document
 * the player can download and load on another device.
 */
import { STORAGE_PREFIX, StorageLike } from './storage';

export const SAVE_FILE_APP = 'AnimalPuzzle';
export const SAVE_FILE_VERSION = 1;
/** A save is a few kilobytes; anything far bigger is not one of ours. */
const MAX_VALUE_LENGTH = 2_000_000;

export interface SaveFile {
  app: typeof SAVE_FILE_APP;
  version: number;
  exportedAt: string;
  data: Record<string, string>;
}

function browserStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Collects every value the game has stored. */
export function exportSave(storage: StorageLike | null = browserStorage(), now = new Date()): SaveFile {
  const data: Record<string, string> = {};
  if (storage) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const value = storage.getItem(key);
      if (typeof value === 'string') data[key] = value;
    }
  }
  return { app: SAVE_FILE_APP, version: SAVE_FILE_VERSION, exportedAt: now.toISOString(), data };
}

/** Checks a parsed file. Returns the entries to restore, or null if it is not a save file. */
export function parseSave(text: string): Record<string, string> | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const file = raw as Record<string, unknown>;
  if (file.app !== SAVE_FILE_APP || typeof file.version !== 'number' || file.version > SAVE_FILE_VERSION) return null;
  if (!file.data || typeof file.data !== 'object' || Array.isArray(file.data)) return null;
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(file.data as Record<string, unknown>)) {
    if (!key.startsWith(STORAGE_PREFIX) || typeof value !== 'string' || value.length > MAX_VALUE_LENGTH) return null;
    data[key] = value;
  }
  return Object.keys(data).length > 0 ? data : null;
}

/** Replaces the stored game with the entries of a save file. Returns false if nothing was written. */
export function importSave(text: string, storage: StorageLike | null = browserStorage()): boolean {
  const data = parseSave(text);
  if (!data || !storage) return false;
  try {
    const old: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) old.push(key);
    }
    for (const key of old) storage.removeItem(key);
    for (const [key, value] of Object.entries(data)) storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function saveFileName(now = new Date()): string {
  return `animalpuzzle-${now.toISOString().slice(0, 10)}.json`;
}

/** Hands the save file to the browser as a download. */
export function downloadSave(): void {
  const blob = new Blob([JSON.stringify(exportSave(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = saveFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
