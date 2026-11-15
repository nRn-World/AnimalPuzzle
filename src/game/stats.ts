/** Lifetime play statistics and the weekly list of the time mode. */
import { readJson, STORAGE_KEYS, writeJson } from './storage';

export interface PlayStats {
  gamesPlayed: number;
  gamesWon: number;
  secondsPlayed: number;
  powersUsed: number;
  bossesBeaten: number;
  missionsDone: number;
  moves: number;
}

export function createStats(): PlayStats {
  return { gamesPlayed: 0, gamesWon: 0, secondsPlayed: 0, powersUsed: 0, bossesBeaten: 0, missionsDone: 0, moves: 0 };
}

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

export function sanitizeStats(raw: unknown): PlayStats {
  const stats = createStats();
  if (!raw || typeof raw !== 'object') return stats;
  const data = raw as Record<string, unknown>;
  for (const key of Object.keys(stats) as Array<keyof PlayStats>) stats[key] = count(data[key]);
  return stats;
}

export function addStats(stats: PlayStats, add: Partial<PlayStats>): PlayStats {
  const next = { ...stats };
  for (const key of Object.keys(add) as Array<keyof PlayStats>) next[key] += count(add[key]);
  return next;
}

export function readStats(): PlayStats {
  return sanitizeStats(readJson(STORAGE_KEYS.stats));
}

export function writeStats(stats: PlayStats): void {
  writeJson(STORAGE_KEYS.stats, stats);
}

/** "1 h 05 min" / "12 min". */
export function formatPlayTime(seconds: number): { hours: number; minutes: number } {
  const minutes = Math.floor(seconds / 60);
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

// --- Time mode ----------------------------------------------------------------

export const BLITZ_SECONDS = 60;
export const BLITZ_LIST_SIZE = 5;

export interface BlitzState {
  best: number;
  weekKey: string;
  /** This week's best rounds, highest first. */
  week: number[];
}

export function sanitizeBlitz(raw: unknown, weekKey: string): BlitzState {
  const state: BlitzState = { best: 0, weekKey, week: [] };
  if (!raw || typeof raw !== 'object') return state;
  const data = raw as Record<string, unknown>;
  state.best = count(data.best);
  if (data.weekKey === weekKey && Array.isArray(data.week)) {
    state.week = data.week
      .map(count)
      .filter((n) => n > 0)
      .sort((a, b) => b - a)
      .slice(0, BLITZ_LIST_SIZE);
  }
  return state;
}

/** Adds a finished round. `rank` is its place on this week's list (1-based), or 0 if it missed it. */
export function addBlitzScore(state: BlitzState, score: number): { nextState: BlitzState; rank: number } {
  const value = count(score);
  if (value <= 0) return { nextState: state, rank: 0 };
  const week = [...state.week, value].sort((a, b) => b - a).slice(0, BLITZ_LIST_SIZE);
  const rank = week.indexOf(value) + 1;
  return { nextState: { ...state, best: Math.max(state.best, value), week }, rank };
}

export function readBlitz(weekKey: string): BlitzState {
  return sanitizeBlitz(readJson(STORAGE_KEYS.blitz), weekKey);
}

export function writeBlitz(state: BlitzState): void {
  writeJson(STORAGE_KEYS.blitz, state);
}
