import test from 'node:test';
import assert from 'node:assert/strict';
import {
  claimDailyReward,
  consumeBonusEnergy,
  createInitialDailyState,
  createSeededRng,
  DAILY_BONUS_ENERGY,
  equipAnimalSkin,
  EXCLUSIVE_DAILY_SKINS,
  getDailyChallenge,
  getDailyKey,
} from './daily';
import { areObjectivesComplete, createBoard, createEmptyProgress } from './engine';

test('getDailyKey formats local YYYY-MM-DD cleanly', () => {
  const d = new Date(2026, 10, 5); // Nov 5 2026
  assert.equal(getDailyKey(d), '2026-11-05');
});

test('getDailyChallenge is deterministic per date and produces valid playable boards', () => {
  const c1 = getDailyChallenge('2026-11-13');
  const c2 = getDailyChallenge('2026-11-13');
  assert.equal(c1.title, c2.title);
  assert.equal(c1.goalSummary, c2.goalSummary);
  assert.equal(c1.featuredSkin, c2.featuredSkin);
  assert.deepEqual(c1.level, c2.level);

  const board = createBoard(c1.level, createSeededRng(c1.seed));
  assert.equal(board.length, 8);
});

test('featured skin for a date stays fixed after its reward is claimed', () => {
  const dateKey = '2026-11-13';
  const before = getDailyChallenge(dateKey);
  assert.equal(EXCLUSIVE_DAILY_SKINS.includes(before.featuredSkin), true);

  const claim = claimDailyReward(
    createInitialDailyState(),
    dateKey,
    before.featuredSkin
  );
  assert.equal(claim.newlyCompleted, true);
  assert.equal(claim.unlockedNewSkin, before.featuredSkin);

  const after = getDailyChallenge(dateKey);
  assert.equal(after.featuredSkin, before.featuredSkin);
  assert.equal(after.title, before.title);
  assert.equal(after.level.name, before.level.name);
  assert.equal(after.goalSummary, before.goalSummary);
});

test('extended objectives specials and cascade3 evaluate correctly', () => {
  const progress = createEmptyProgress();
  const objectives = [
    { id: 'sp', kind: 'specials' as const, label: 'Specialare', target: 3 },
    { id: 'ca', kind: 'cascade3' as const, label: 'Kaskad ×3', target: 2 },
  ];
  assert.equal(areObjectivesComplete(objectives, progress), false);

  progress.specialsCreated = 3;
  progress.cascade3Count = 1;
  assert.equal(areObjectivesComplete(objectives, progress), false);

  progress.cascade3Count = 2;
  assert.equal(areObjectivesComplete(objectives, progress), true);
});

test('claimDailyReward grants bonus energy, unlocks exclusive skins, and blocks double claims', () => {
  let state = createInitialDailyState();
  assert.deepEqual(state.unlockedSkins, ['classic']);
  assert.equal(state.bonusEnergyBank, 0);

  const claim1 = claimDailyReward(state, '2026-11-13', 'royal');
  assert.equal(claim1.newlyCompleted, true);
  assert.equal(claim1.energyGranted, DAILY_BONUS_ENERGY);
  assert.equal(claim1.unlockedNewSkin, 'royal');
  state = claim1.nextState;
  assert.equal(state.bonusEnergyBank, DAILY_BONUS_ENERGY);
  assert.equal(state.unlockedSkins.includes('royal'), true);

  // Double-claim on same day must be ignored
  const duplicate = claimDailyReward(state, '2026-11-13', 'winter');
  assert.equal(duplicate.newlyCompleted, false);
  assert.equal(duplicate.energyGranted, 0);
  assert.equal(duplicate.unlockedNewSkin, null);
  assert.equal(duplicate.nextState.bonusEnergyBank, DAILY_BONUS_ENERGY);

  // Cannot equip locked skin, can equip unlocked skin
  const lockedTry = equipAnimalSkin(state, 'winter');
  assert.equal(lockedTry.equippedSkin, 'classic');

  const unlockedEquip = equipAnimalSkin(state, 'royal');
  assert.equal(unlockedEquip.equippedSkin, 'royal');

  // Consuming bonus energy loads into session cleanly
  const consumed = consumeBonusEnergy(unlockedEquip, 100);
  assert.equal(consumed.loadedEnergy, DAILY_BONUS_ENERGY);
  assert.equal(consumed.nextState.bonusEnergyBank, 0);
});
