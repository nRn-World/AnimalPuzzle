/**
 * Master Mode: replay any cleared campaign level with tighter moves and higher
 * objective targets to earn permanent Golden Crowns, 2× League points and bonus
 * energy on first clear.
 */
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import { LevelConfig } from './types';

export const MASTER_FIRST_CLEAR_ENERGY = 25;
export const MASTER_LEAGUE_MULTIPLIER = 2;

export type MasterCrownsMap = Record<number, number>;

export function canPlayMasterMode(
  bestStars: Record<number, number>,
  levelId: number
): boolean {
  return (bestStars[levelId] ?? 0) >= 1;
}

/** Transforms a standard campaign level into its tougher Master Mode variant. */
export function applyMasterMode(level: LevelConfig): LevelConfig {
  const moves = Math.max(10, Math.round(level.moves * 0.78));
  const objectives = level.objectives.map((obj) => {
    if (
      obj.kind === 'egg' ||
      obj.kind === 'ice' ||
      obj.kind === 'crate' ||
      obj.kind === 'chain' ||
      obj.kind === 'honey'
    ) {
      // Board-placed obstacle counts cannot exceed physical items placed on the board.
      return obj;
    }
    if (obj.kind === 'boss') {
      return { ...obj, target: Math.round(obj.target * 1.25) };
    }
    return { ...obj, target: Math.max(obj.target + 2, Math.round(obj.target * 1.2)) };
  });

  return {
    ...level,
    moves,
    difficulty: 'extreme',
    objectives,
  };
}

export function sanitizeMasterCrowns(raw: unknown): MasterCrownsMap {
  if (!raw || typeof raw !== 'object') return {};
  const out: MasterCrownsMap = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const id = Number(k);
    if (Number.isInteger(id) && id > 0 && typeof v === 'number' && Number.isFinite(v)) {
      const stars = Math.max(1, Math.min(3, Math.round(v)));
      out[id] = stars;
    }
  }
  return out;
}

export function recordMasterClear(
  crowns: MasterCrownsMap,
  levelId: number,
  stars: number
): { nextCrowns: MasterCrownsMap; firstClear: boolean } {
  const prev = crowns[levelId] ?? 0;
  const clamped = Math.max(1, Math.min(3, Math.round(stars)));
  const next = Math.max(prev, clamped);
  if (next === prev) return { nextCrowns: crowns, firstClear: false };
  return {
    firstClear: prev === 0,
    nextCrowns: { ...crowns, [levelId]: next },
  };
}

export function totalMasterCrowns(crowns: MasterCrownsMap): number {
  return Object.keys(crowns).length;
}

export function readMasterCrowns(): MasterCrownsMap {
  return sanitizeMasterCrowns(readJson(STORAGE_KEYS.masterMode));
}

export function writeMasterCrowns(crowns: MasterCrownsMap): void {
  writeJson(STORAGE_KEYS.masterMode, crowns);
}
