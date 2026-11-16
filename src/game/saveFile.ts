/**
 * Save file: everything the game keeps in the browser, as one JSON document
 * the player can download and load on another device.
 */
import { STORAGE_PREFIX, StorageLike } from './storage';

export const SAVE_FILE_APP = 'AnimalPuzzle';
export const SAVE_FILE_VERSION = 1;
export const SYNC_CODE_PREFIX = 'AP1:';
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

function encodeUtf8Base64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeUtf8Base64Url(code: string): string | null {
  try {
    const padded = code.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** Packs the current save into a compact copy-pasteable code for moving between phone and computer. */
export function exportSyncCode(storage: StorageLike | null = browserStorage(), now = new Date()): string {
  const payload = JSON.stringify(exportSave(storage, now));
  return `${SYNC_CODE_PREFIX}${encodeUtf8Base64Url(payload)}`;
}

/** Validates a sync code (or raw save JSON) and returns its key-value entries, or null if invalid. */
export function parseSyncCode(code: string): Record<string, string> | null {
  const trimmed = code.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith(SYNC_CODE_PREFIX)) {
    const decoded = decodeUtf8Base64Url(trimmed.slice(SYNC_CODE_PREFIX.length));
    if (!decoded) return null;
    return parseSave(decoded);
  }
  return parseSave(trimmed);
}

/** Imports a sync code into storage, replacing existing game keys. */
export function importSyncCode(code: string, storage: StorageLike | null = browserStorage()): boolean {
  const trimmed = code.trim();
  if (trimmed.startsWith(SYNC_CODE_PREFIX)) {
    const decoded = decodeUtf8Base64Url(trimmed.slice(SYNC_CODE_PREFIX.length));
    if (!decoded) return false;
    return importSave(decoded, storage);
  }
  return importSave(trimmed, storage);
}

