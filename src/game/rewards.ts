/**
 * Long-term rewards outside a single level: the daily streak, the weekly
 * hunt, chapter chests, the animal album and the local top list.
 * Everything here is pure; reading and writing storage sits at the bottom.
 */
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import { AnimalSkinId, GameMode, GEM_COLORS_ORDER, GemColor } from './types';

export interface TopScore {
  score: number;
  mode: GameMode;
  /** Campaign level number; 0 for the other modes. */
  level: number;
  dateKey: string;
}

export interface RewardState {
  streak: number;
  bestStreak: number;
  lastDailyDate: string | null;
  /** Animals collected over all games, per kind. */
  album: Record<GemColor, number>;
  weekly: { weekKey: string; progress: number; claimed: boolean };
  /** Progress in the running seasonal event. */
  season: { key: string; progress: number; claimed: boolean };
  /** Chapter chests opened so far. */
  chests: number;
  topScores: TopScore[];
}

function emptyAlbum(): Record<GemColor, number> {
  const album = {} as Record<GemColor, number>;
  for (const color of GEM_COLORS_ORDER) album[color] = 0;
  return album;
}

export function createInitialRewardState(): RewardState {
  return {
    streak: 0,
    bestStreak: 0,
    lastDailyDate: null,
    album: emptyAlbum(),
    weekly: { weekKey: '', progress: 0, claimed: false },
    season: { key: '', progress: 0, claimed: false },
    chests: 0,
    topScores: [],
  };
}

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

const MODES: GameMode[] = ['campaign', 'daily', 'endless', 'blitz'];

/** Turns anything read from storage into a valid reward state. */
export function sanitizeRewardState(raw: unknown): RewardState {
  const state = createInitialRewardState();
  if (!raw || typeof raw !== 'object') return state;
  const data = raw as Record<string, unknown>;
  state.streak = count(data.streak);
  state.bestStreak = Math.max(state.streak, count(data.bestStreak));
  state.lastDailyDate = typeof data.lastDailyDate === 'string' ? data.lastDailyDate : null;
  state.chests = count(data.chests);
  if (data.album && typeof data.album === 'object') {
    const album = data.album as Record<string, unknown>;
    for (const color of GEM_COLORS_ORDER) state.album[color] = count(album[color]);
  }
  if (data.weekly && typeof data.weekly === 'object') {
    const weekly = data.weekly as Record<string, unknown>;
    state.weekly = {
      weekKey: typeof weekly.weekKey === 'string' ? weekly.weekKey : '',
      progress: count(weekly.progress),
      claimed: weekly.claimed === true,
    };
  }
  if (data.season && typeof data.season === 'object') {
    const season = data.season as Record<string, unknown>;
    state.season = {
      key: typeof season.key === 'string' ? season.key : '',
      progress: count(season.progress),
      claimed: season.claimed === true,
    };
  }
  if (Array.isArray(data.topScores)) {
    state.topScores = data.topScores
      .filter((entry): entry is TopScore => {
        if (!entry || typeof entry !== 'object') return false;
        const e = entry as Record<string, unknown>;
        return (
          count(e.score) > 0 && MODES.includes(e.mode as GameMode) && typeof e.dateKey === 'string'
        );
      })
      .map((e) => ({ score: count(e.score), mode: e.mode, level: count(e.level), dateKey: e.dateKey }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_LIST_SIZE);
  }
  return state;
}

// --- Daily streak -----------------------------------------------------------

export const STREAK_STEP_ENERGY = 10;
export const STREAK_MAX_STEPS = 6;

/** Extra energy on top of the daily reward for the given streak length. */
export function streakBonus(streak: number): number {
  return Math.min(STREAK_MAX_STEPS, Math.max(0, streak - 1)) * STREAK_STEP_ENERGY;
}

function dayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / 86400000);
}

/** The streak as it stands today: it lapses after a missed day. */
export function currentStreak(state: RewardState, todayKey: string): number {
  if (!state.lastDailyDate) return 0;
  return dayNumber(todayKey) - dayNumber(state.lastDailyDate) <= 1 ? state.streak : 0;
}

/** Registers a completed daily challenge. Completing twice a day changes nothing. */
export function registerDaily(state: RewardState, dateKey: string): RewardState {
  if (state.lastDailyDate === dateKey) return state;
  const gap = state.lastDailyDate ? dayNumber(dateKey) - dayNumber(state.lastDailyDate) : 0;
  const streak = state.lastDailyDate && gap === 1 ? state.streak + 1 : 1;
  return { ...state, streak, bestStreak: Math.max(state.bestStreak, streak), lastDailyDate: dateKey };
}

// --- Weekly hunt ------------------------------------------------------------

export const WEEKLY_REWARD_ENERGY = 80;
export const WEEKLY_SKIN: AnimalSkinId = 'party';

/** ISO week, e.g. "2026-W46". Weeks start on Monday. */
export function getWeekKey(date: Date = new Date()): string {
  const day = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((day.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export interface WeeklyQuest {
  weekKey: string;
  color: GemColor;
  target: number;
}

/** The same hunt for everyone in a given week. */
export function getWeeklyQuest(weekKey: string): WeeklyQuest {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < weekKey.length; i++) {
    h ^= weekKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  // The first five animals are in every level, so everyone can take part.
  return { weekKey, color: GEM_COLORS_ORDER[h % 5], target: 250 + ((h >>> 8) % 4) * 50 };
}

/** Weekly progress for this week (an older week's progress does not count). */
export function weeklyProgress(state: RewardState, weekKey: string): { progress: number; claimed: boolean } {
  return state.weekly.weekKey === weekKey
    ? { progress: state.weekly.progress, claimed: state.weekly.claimed }
    : { progress: 0, claimed: false };
}

/**
 * Adds the animals cleared by one move to the album and the weekly hunt.
 * `weeklyCompleted` is true exactly once per week: on the move that reaches
 * the target.
 */
export function applyCollected(
  state: RewardState,
  cleared: Partial<Record<GemColor, number>>,
  weekKey: string
): { nextState: RewardState; weeklyCompleted: boolean } {
  const album = { ...state.album };
  let any = false;
  for (const color of GEM_COLORS_ORDER) {
    const n = count(cleared[color]);
    if (n > 0) {
      album[color] += n;
      any = true;
    }
  }
  if (!any) return { nextState: state, weeklyCompleted: false };

  const quest = getWeeklyQuest(weekKey);
  const before = weeklyProgress(state, weekKey);
  const progress = before.progress + count(cleared[quest.color]);
  const weeklyCompleted = !before.claimed && progress >= quest.target;
  return {
    nextState: {
      ...state,
      album,
      weekly: { weekKey, progress, claimed: before.claimed || weeklyCompleted },
    },
    weeklyCompleted,
  };
}

// --- Seasonal events --------------------------------------------------------

export function seasonProgress(state: RewardState, key: string): { progress: number; claimed: boolean } {
  return state.season.key === key
    ? { progress: state.season.progress, claimed: state.season.claimed }
    : { progress: 0, claimed: false };
}

/** Counts animals towards the running season. `completed` is true once, on the move that reaches the target. */
export function applySeasonCollected(
  state: RewardState,
  collected: number,
  key: string,
  target: number
): { nextState: RewardState; completed: boolean } {
  const n = count(collected);
  if (n <= 0) return { nextState: state, completed: false };
  const before = seasonProgress(state, key);
  const progress = before.progress + n;
  const completed = !before.claimed && progress >= target;
  return {
    nextState: { ...state, season: { key, progress, claimed: before.claimed || completed } },
    completed,
  };
}

// --- Chapter chests ---------------------------------------------------------

export const CHEST_ENERGY = 60;
export const CHEST_SKIN: AnimalSkinId = 'explorer';
/** The explorer skin is in the third chest a player opens. */
export const CHEST_SKIN_AT = 3;

export function openChest(state: RewardState): { nextState: RewardState; skin: AnimalSkinId | null } {
  const chests = state.chests + 1;
  return { nextState: { ...state, chests }, skin: chests === CHEST_SKIN_AT ? CHEST_SKIN : null };
}

// --- Animal album -----------------------------------------------------------

export const ALBUM_TIERS = [
  { at: 50, nameSv: 'Brons' },
  { at: 250, nameSv: 'Silver' },
  { at: 1000, nameSv: 'Guld' },
  { at: 5000, nameSv: 'Diamant' },
] as const;

/** Tier reached (0 = none yet, 4 = diamond) and the next threshold, if any. */
export function albumTier(collected: number): { tier: number; next: number | null; from: number } {
  let tier = 0;
  while (tier < ALBUM_TIERS.length && collected >= ALBUM_TIERS[tier].at) tier++;
  return {
    tier,
    next: tier < ALBUM_TIERS.length ? ALBUM_TIERS[tier].at : null,
    from: tier > 0 ? ALBUM_TIERS[tier - 1].at : 0,
  };
}

// --- Top list ---------------------------------------------------------------

export const TOP_LIST_SIZE = 10;

export function addTopScore(state: RewardState, entry: TopScore): RewardState {
  if (entry.score <= 0) return state;
  const topScores = [...state.topScores, entry].sort((a, b) => b.score - a.score).slice(0, TOP_LIST_SIZE);
  return { ...state, topScores };
}

// --- Storage ----------------------------------------------------------------

export function readRewardState(): RewardState {
  return sanitizeRewardState(readJson(STORAGE_KEYS.rewards));
}

export function writeRewardState(state: RewardState): void {
  writeJson(STORAGE_KEYS.rewards, state);
}
