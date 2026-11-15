/**
 * The weekly special level: one extra hard level per week, the same for the
 * whole week. Winning it for the first time that week pays a big reward.
 */
import { createSeededRng } from './daily';
import { LEVELS_PER_CHAPTER, getCampaignLevel } from './levels';
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import { LevelConfig } from './types';

export const WEEKLY_LEVEL_ENERGY = 100;

/** Levels are drawn from chapters 25 to 250, where every obstacle is in play. */
const FIRST_INDEX = 24 * LEVELS_PER_CHAPTER;
const LAST_INDEX = 250 * LEVELS_PER_CHAPTER;

export function getWeeklyLevel(weekKey: string): { level: LevelConfig; seed: string } {
  const seed = `animalpuzzle-weekly-level-${weekKey}`;
  const rng = createSeededRng(seed);
  let picked = getCampaignLevel(FIRST_INDEX);
  // Look for a hard or extreme level that is not a boss fight.
  for (let tries = 0; tries < 60; tries++) {
    const index = FIRST_INDEX + Math.floor(rng() * (LAST_INDEX - FIRST_INDEX));
    const candidate = getCampaignLevel(index);
    if (candidate.boss) continue;
    picked = candidate;
    if (candidate.difficulty === 'hard' || candidate.difficulty === 'extreme') break;
  }
  return {
    seed,
    level: {
      ...picked,
      name: 'Veckans specialnivå',
      // Five moves fewer than in the campaign makes it a real test.
      moves: Math.max(12, picked.moves - 5),
      chapter: undefined,
      difficulty: 'extreme',
    },
  };
}

export interface WeeklyLevelState {
  weekKey: string;
  won: boolean;
  attempts: number;
}

export function sanitizeWeeklyLevel(raw: unknown, weekKey: string): WeeklyLevelState {
  const fresh: WeeklyLevelState = { weekKey, won: false, attempts: 0 };
  if (!raw || typeof raw !== 'object') return fresh;
  const data = raw as Record<string, unknown>;
  if (data.weekKey !== weekKey) return fresh;
  const attempts = typeof data.attempts === 'number' && data.attempts > 0 ? Math.floor(data.attempts) : 0;
  return { weekKey, won: data.won === true, attempts };
}

export function readWeeklyLevel(weekKey: string): WeeklyLevelState {
  return sanitizeWeeklyLevel(readJson(STORAGE_KEYS.weeklyLevel), weekKey);
}

export function writeWeeklyLevel(state: WeeklyLevelState): void {
  writeJson(STORAGE_KEYS.weeklyLevel, state);
}
