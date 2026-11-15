/**
 * Season pass: a reward ladder that everything you play fills up. It starts
 * over on the first day of every month.
 */
import { readJson, STORAGE_KEYS, writeJson } from './storage';

/** Points needed per step. */
export const PASS_STEP = 100;
/** Bonus energy per step; the last one is the big prize. */
export const PASS_REWARDS = [20, 25, 30, 35, 40, 50, 60, 70, 80, 150];
export const PASS_POINTS = { round: 10, win: 15, mission: 10 } as const;

export interface PassState {
  /** "2026-11": the month the points belong to. */
  monthKey: string;
  points: number;
  /** Steps already collected, counted from the first. */
  claimed: number;
}

export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function sanitizePass(raw: unknown, monthKey: string): PassState {
  if (raw && typeof raw === 'object') {
    const src = raw as Record<string, unknown>;
    if (src.monthKey === monthKey && typeof src.points === 'number' && typeof src.claimed === 'number') {
      const points = Math.max(0, Math.floor(src.points));
      return {
        monthKey,
        points,
        claimed: Math.max(0, Math.min(PASS_REWARDS.length, Math.floor(src.claimed), Math.floor(points / PASS_STEP))),
      };
    }
  }
  return { monthKey, points: 0, claimed: 0 };
}

/** Steps reached with the points so far. */
export function passReached(state: PassState): number {
  return Math.min(PASS_REWARDS.length, Math.floor(state.points / PASS_STEP));
}

export function addPassPoints(state: PassState, points: number): PassState {
  if (!(points > 0)) return state;
  return { ...state, points: Math.min(PASS_REWARDS.length * PASS_STEP, state.points + Math.floor(points)) };
}

/** Collects every reached step that has not been collected yet. */
export function claimPass(state: PassState): { nextState: PassState; energy: number } {
  const reached = passReached(state);
  if (reached <= state.claimed) return { nextState: state, energy: 0 };
  const energy = PASS_REWARDS.slice(state.claimed, reached).reduce((sum, reward) => sum + reward, 0);
  return { nextState: { ...state, claimed: reached }, energy };
}

export function readPass(monthKey: string): PassState {
  return sanitizePass(readJson(STORAGE_KEYS.seasonPass), monthKey);
}

export function writePass(state: PassState): void {
  writeJson(STORAGE_KEYS.seasonPass, state);
}
