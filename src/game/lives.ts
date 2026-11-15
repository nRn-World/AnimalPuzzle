import { readJson, STORAGE_KEYS, writeJson } from './storage';

export const MAX_LIVES = 5;
/** A lost life comes back after this long. */
export const LIFE_REGEN_MS = 20 * 60 * 1000;
/** Bonus energy it costs to refill all lives at once. */
export const REFILL_COST = 40;

export interface LivesState {
  lives: number;
  /** When the life currently regenerating started to. Only matters below the maximum. */
  since: number;
}

export function createFullLives(): LivesState {
  return { lives: MAX_LIVES, since: 0 };
}

export function sanitizeLives(raw: unknown): LivesState {
  if (!raw || typeof raw !== 'object') return createFullLives();
  const data = raw as Record<string, unknown>;
  const lives = typeof data.lives === 'number' && Number.isFinite(data.lives) ? Math.round(data.lives) : MAX_LIVES;
  const since = typeof data.since === 'number' && Number.isFinite(data.since) && data.since > 0 ? data.since : 0;
  return { lives: Math.min(MAX_LIVES, Math.max(0, lives)), since };
}

/** Adds the lives that came back while the player was away. */
export function settleLives(state: LivesState, now: number): LivesState {
  if (state.lives >= MAX_LIVES) return state.since === 0 ? state : { lives: MAX_LIVES, since: 0 };
  // A clock set backwards must not hand out lives or lock the player out.
  const since = state.since > now || state.since === 0 ? now : state.since;
  const gained = Math.floor((now - since) / LIFE_REGEN_MS);
  if (gained <= 0) return since === state.since ? state : { lives: state.lives, since };
  const lives = Math.min(MAX_LIVES, state.lives + gained);
  return { lives, since: lives >= MAX_LIVES ? 0 : since + gained * LIFE_REGEN_MS };
}

/** Milliseconds until the next life, or 0 with full lives. */
export function msToNextLife(state: LivesState, now: number): number {
  const settled = settleLives(state, now);
  if (settled.lives >= MAX_LIVES) return 0;
  return Math.max(0, settled.since + LIFE_REGEN_MS - now);
}

export function loseLife(state: LivesState, now: number): LivesState {
  const settled = settleLives(state, now);
  if (settled.lives <= 0) return settled;
  return { lives: settled.lives - 1, since: settled.lives >= MAX_LIVES ? now : settled.since };
}

export function refillLives(): LivesState {
  return createFullLives();
}

/** "12:05" style countdown. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function readLives(): LivesState {
  return sanitizeLives(readJson(STORAGE_KEYS.lives));
}

export function writeLives(state: LivesState): void {
  writeJson(STORAGE_KEYS.lives, state);
}
