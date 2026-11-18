import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LIFE_REGEN_MS,
  MAX_LIVES,
  createFullLives,
  formatCountdown,
  loseLife,
  msToNextLife,
  sanitizeLives,
  settleLives,
} from './lives';

const T0 = 1_800_000_000_000;

test('losing a life starts the clock and it comes back after the regeneration time', () => {
  let state = loseLife(createFullLives(), T0);
  assert.equal(state.lives, MAX_LIVES - 1);
  assert.equal(msToNextLife(state, T0), LIFE_REGEN_MS);
  assert.equal(settleLives(state, T0 + LIFE_REGEN_MS - 1).lives, MAX_LIVES - 1);
  state = settleLives(state, T0 + LIFE_REGEN_MS);
  assert.equal(state.lives, MAX_LIVES);
  assert.equal(msToNextLife(state, T0 + LIFE_REGEN_MS), 0);
});

test('a second lost life does not restart the running countdown', () => {
  const elapsed = Math.floor(LIFE_REGEN_MS / 4);
  let state = loseLife(createFullLives(), T0);
  state = loseLife(state, T0 + elapsed);
  assert.equal(state.lives, MAX_LIVES - 2);
  assert.equal(msToNextLife(state, T0 + elapsed), LIFE_REGEN_MS - elapsed);
});

test('lives regained while away are capped at the maximum', () => {
  let state = createFullLives();
  for (let i = 0; i < 7; i++) state = loseLife(state, T0);
  assert.equal(state.lives, 0);
  assert.equal(settleLives(state, T0 + 2.5 * LIFE_REGEN_MS).lives, 2);
  assert.equal(settleLives(state, T0 + 99 * LIFE_REGEN_MS).lives, MAX_LIVES);
});

test('a clock set backwards neither grants lives nor locks the player out', () => {
  const state = { lives: 1, since: T0 + 10 * LIFE_REGEN_MS };
  const settled = settleLives(state, T0);
  assert.equal(settled.lives, 1);
  assert.equal(msToNextLife(settled, T0), LIFE_REGEN_MS);
});

test('stored lives are sanitised', () => {
  assert.deepEqual(sanitizeLives(null), createFullLives());
  assert.equal(sanitizeLives({ lives: 99 }).lives, MAX_LIVES);
  assert.equal(sanitizeLives({ lives: -3 }).lives, 0);
  assert.equal(formatCountdown(125_000), '2:05');
});
