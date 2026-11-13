import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStars,
  getStarThresholds,
  mergeBestStars,
  nextStarGoal,
} from './mastery';

test('star thresholds scale with the level move budget', () => {
  assert.deepEqual(getStarThresholds(18), { two: 3, three: 6 });
  assert.deepEqual(getStarThresholds(20), { two: 3, three: 6 });
  assert.deepEqual(getStarThresholds(25), { two: 4, three: 8 });
});

test('computeStars gives one star for a win and rewards spare moves', () => {
  assert.equal(computeStars(0, 20), 1);
  assert.equal(computeStars(2, 20), 1);
  assert.equal(computeStars(3, 20), 2);
  assert.equal(computeStars(5, 20), 2);
  assert.equal(computeStars(6, 20), 3);
  assert.equal(computeStars(12, 20), 3);
});

test('mergeBestStars keeps the best result per level', () => {
  const first = mergeBestStars({}, 7, 2);
  assert.deepEqual(first, { 7: 2 });
  const lower = mergeBestStars(first, 7, 1);
  assert.deepEqual(lower, { 7: 2 });
  const higher = mergeBestStars(first, 7, 3);
  assert.deepEqual(higher, { 7: 3 });
  assert.equal(mergeBestStars(higher, 7, 9)[7], 3);
});

test('nextStarGoal tells the player what the next star needs', () => {
  assert.match(nextStarGoal(1, 20) ?? '', /2 stjärnor vid 3 drag kvar/);
  assert.match(nextStarGoal(3, 20) ?? '', /3 stjärnor vid 6 drag kvar/);
  assert.equal(nextStarGoal(6, 20), null);
});
