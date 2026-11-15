import { CascadeStep, GEM_COLORS_ORDER, LevelProgress } from './types';

/** Adds the result of one cascade step to the running level progress. */
export function addStepDelta(prev: LevelProgress, step: CascadeStep): LevelProgress {
  const nextColors = { ...prev.clearedColors };
  for (const color of GEM_COLORS_ORDER) {
    nextColors[color] = (nextColors[color] ?? 0) + (step.deltaProgress.clearedColors[color] ?? 0);
  }
  return {
    score: prev.score + step.stepScore,
    clearedColors: nextColors,
    clearedIce: prev.clearedIce + step.deltaProgress.clearedIce,
    clearedCrates: prev.clearedCrates + step.deltaProgress.clearedCrates,
    clearedChains: prev.clearedChains + step.deltaProgress.clearedChains,
    clearedHoney: prev.clearedHoney + step.deltaProgress.clearedHoney,
    collectedEggs: prev.collectedEggs + step.deltaProgress.collectedEggs,
    specialsCreated: prev.specialsCreated + step.spawnedSpecials.length,
    cascade3Count: prev.cascade3Count + (step.cascadeIndex === 3 ? 1 : 0),
  };
}
