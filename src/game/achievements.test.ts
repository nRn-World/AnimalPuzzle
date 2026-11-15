import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACHIEVEMENTS,
  applyRunEndToAchievements,
  applyStepToAchievements,
  createInitialAchievementState,
  getAchievementProgress,
} from './achievements';
import { CascadeStep } from './types';

function makeDummyStep(overrides: Partial<CascadeStep> = {}): CascadeStep {
  return {
    boardAfterClear: [],
    boardAfterGravity: [],
    clearedCoords: [],
    spawnedSpecials: [],
    blasts: [],
    stepScore: 120,
    cascadeIndex: 1,
    energyGained: 5,
    deltaProgress: {
      clearedColors: {
        ruby: 3,
        amber: 0,
        emerald: 0,
        cobalt: 0,
        amethyst: 0,
        quartz: 0,
        tangerine: 0,
        lime: 0,
        sky: 0,
        violet: 0,
        rose: 0,
        mint: 0,
      },
      clearedIce: 0,
      clearedCrates: 0,
      clearedChains: 0, clearedHoney: 0, collectedEggs: 0,
    },
    ...overrides,
  };
}

test('applyStepToAchievements unlocks 5 kaskader i rad at cascadeIndex 5 without duplicate unlocks', () => {
  let state = createInitialAchievementState();
  const step4 = makeDummyStep({ cascadeIndex: 4 });
  const r1 = applyStepToAchievements(state, step4);
  assert.equal(r1.newlyUnlocked.some((a) => a.id === 'cascade_5'), false);

  const step5 = makeDummyStep({ cascadeIndex: 5 });
  const r2 = applyStepToAchievements(r1.nextState, step5);
  assert.equal(r2.newlyUnlocked.some((a) => a.id === 'cascade_5'), true);
  assert.equal(r2.nextState.unlockedIds.includes('cascade_5'), true);

  // Subsequent cascade >= 5 does not re-emit unlock
  const r3 = applyStepToAchievements(r2.nextState, step5);
  assert.equal(r3.newlyUnlocked.some((a) => a.id === 'cascade_5'), false);
});

test('applyStepToAchievements accumulates ice blocks across steps until 100 is reached', () => {
  let state = createInitialAchievementState();
  const iceDef = ACHIEVEMENTS.find((a) => a.id === 'ice_100')!;

  state = applyStepToAchievements(
    state,
    makeDummyStep({
      deltaProgress: {
        clearedColors: {
          ruby: 0,
          amber: 0,
          emerald: 0,
          cobalt: 0,
          amethyst: 0,
          quartz: 0,
          tangerine: 0,
          lime: 0,
          sky: 0,
          violet: 0,
          rose: 0,
          mint: 0,
        },
        clearedIce: 64,
        clearedCrates: 0,
        clearedChains: 0, clearedHoney: 0, collectedEggs: 0,
      },
    })
  ).nextState;

  const mid = getAchievementProgress(iceDef, state);
  assert.equal(mid.current, 64);
  assert.equal(mid.pct, 64);
  assert.equal(mid.unlocked, false);

  const fin = applyStepToAchievements(
    state,
    makeDummyStep({
      deltaProgress: {
        clearedColors: {
          ruby: 0,
          amber: 0,
          emerald: 0,
          cobalt: 0,
          amethyst: 0,
          quartz: 0,
          tangerine: 0,
          lime: 0,
          sky: 0,
          violet: 0,
          rose: 0,
          mint: 0,
        },
        clearedIce: 40,
        clearedCrates: 0,
        clearedChains: 0, clearedHoney: 0, collectedEggs: 0,
      },
    })
  );

  assert.equal(fin.newlyUnlocked.some((a) => a.id === 'ice_100'), true);
  const done = getAchievementProgress(iceDef, fin.nextState);
  assert.equal(done.current, 100);
  assert.equal(done.pct, 100);
  assert.equal(done.unlocked, true);
});

test('applyRunEndToAchievements unlocks first_win and daily_3 cleanly', () => {
  const initial = createInitialAchievementState();
  const afterWin = applyRunEndToAchievements(initial, {
    wonCampaign: true,
    dailyCompletedCount: 3,
    bonusScore: 500,
  });

  assert.equal(afterWin.newlyUnlocked.some((a) => a.id === 'first_win'), true);
  assert.equal(afterWin.newlyUnlocked.some((a) => a.id === 'daily_3'), true);
  assert.equal(afterWin.nextState.stats.totalScore, 500);
});
