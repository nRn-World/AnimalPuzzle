/**
 * Thin, failure-tolerant wrapper around localStorage.
 *
 * All save data lives under the `animalpuzzle_` prefix. Earlier builds used
 * the working title "kromatik"; those keys are moved over once on startup so
 * existing players keep their progress.
 */

export const STORAGE_PREFIX = 'animalpuzzle_';
export const LEGACY_STORAGE_PREFIX = 'kromatik_';

export const STORAGE_KEYS = {
  unlocked: `${STORAGE_PREFIX}unlocked`,
  daily: `${STORAGE_PREFIX}daily_state`,
  tutorialDone: `${STORAGE_PREFIX}tutorial_done`,
  introGuideSeen: `${STORAGE_PREFIX}intro_guide_seen_v1`,
  stars: `${STORAGE_PREFIX}stars_v1`,
  achievements: `${STORAGE_PREFIX}achievements_v1`,
  bestCampaign: `${STORAGE_PREFIX}best_campaign`,
  bestDaily: `${STORAGE_PREFIX}best_daily`,
  bestEndless: `${STORAGE_PREFIX}best_endless`,
  /** Written by builds before the settings object existed. Read-only now. */
  legacyMuted: `${STORAGE_PREFIX}muted`,
  settings: `${STORAGE_PREFIX}settings_v1`,
  savedGame: `${STORAGE_PREFIX}saved_game_v1`,
  rewards: `${STORAGE_PREFIX}rewards_v1`,
  lives: `${STORAGE_PREFIX}lives_v1`,
  companion: `${STORAGE_PREFIX}companion_v1`,
  missions: `${STORAGE_PREFIX}missions_v1`,
  island: `${STORAGE_PREFIX}island_v1`,
  story: `${STORAGE_PREFIX}story_v1`,
  stats: `${STORAGE_PREFIX}stats_v1`,
  blitz: `${STORAGE_PREFIX}blitz_v1`,
  weeklyLevel: `${STORAGE_PREFIX}weekly_level_v1`,
  calendar: `${STORAGE_PREFIX}calendar_v1`,
  seasonPass: `${STORAGE_PREFIX}season_pass_v1`,
  winStreak: `${STORAGE_PREFIX}win_streak_v1`,
  seenObstacles: `${STORAGE_PREFIX}seen_obstacles_v1`,
  dailyPuzzle: `${STORAGE_PREFIX}daily_puzzle_v1`,
  league: `${STORAGE_PREFIX}league_v1`,
} as const;

/** The subset of the Storage API this module relies on (easy to fake in tests). */
export interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    // Access itself can throw when cookies/storage are blocked.
    return null;
  }
}

/**
 * Moves every `kromatik_*` key to `animalpuzzle_*`. A value already stored
 * under the new name always wins, so running this twice is harmless.
 * Returns the number of keys that were moved.
 */
export function migrateLegacyStorage(storage: StorageLike | null = getStorage()): number {
  if (!storage) return 0;
  let moved = 0;
  try {
    const legacyKeys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(LEGACY_STORAGE_PREFIX)) legacyKeys.push(key);
    }
    for (const oldKey of legacyKeys) {
      const newKey = STORAGE_PREFIX + oldKey.slice(LEGACY_STORAGE_PREFIX.length);
      const value = storage.getItem(oldKey);
      if (value !== null && storage.getItem(newKey) === null) {
        storage.setItem(newKey, value);
        moved++;
      }
      // Only drop the old key once the value is safely readable under the new one.
      if (storage.getItem(newKey) !== null) storage.removeItem(oldKey);
    }
  } catch {
    // Quota or privacy errors: keep the legacy keys and try again next launch.
  }
  return moved;
}

export function readString(key: string): string | null {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    getStorage()?.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

export function readInt(key: string, fallback: number): number {
  const raw = readString(key);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function writeInt(key: string, value: number): void {
  writeString(key, String(Math.round(value)));
}

export function readFlag(key: string): boolean {
  return readString(key) === '1';
}

export function writeFlag(key: string, on: boolean): void {
  if (on) writeString(key, '1');
  else removeKey(key);
}

/** Returns the parsed JSON value, or null when missing or corrupt. */
export function readJson(key: string): unknown {
  const raw = readString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    return writeString(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

// Run before any other module reads its save data.
migrateLegacyStorage();
