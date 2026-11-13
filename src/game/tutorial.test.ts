import assert from 'node:assert/strict';
import test from 'node:test';
import { findMatchGroups, resolveSwap } from './engine';
import {
  createTutorialBoard,
  isMatchingTutorialSwap,
  resolveTutorialPrompt,
  TUTORIAL_STEP1_PAIR,
  TUTORIAL_STEP2_PAIR,
} from './tutorial';

test('createTutorialBoard starts with zero matches and valid step 1 swap', () => {
  const board = createTutorialBoard();
  assert.equal(findMatchGroups(board).length, 0);

  const p1 = resolveTutorialPrompt('step1', board);
  assert.ok(p1);
  assert.equal(p1.stepNumber, 1);

  const res1 = resolveSwap(board, TUTORIAL_STEP1_PAIR.from, TUTORIAL_STEP1_PAIR.to, 5);
  assert.equal(res1.valid, true);
  assert.ok(res1.steps.length >= 1);
  assert.ok(res1.steps[0].clearedCoords.length >= 3);
});

test('tutorial step 2 swap triggers a guaranteed multi-step cascade and special creation', () => {
  const board = createTutorialBoard();
  const res1 = resolveSwap(board, TUTORIAL_STEP1_PAIR.from, TUTORIAL_STEP1_PAIR.to, 5);
  assert.equal(res1.valid, true);

  const boardAfterStep1 = res1.finalBoard;
  const p2 = resolveTutorialPrompt('step2', boardAfterStep1);
  assert.ok(p2);
  assert.equal(p2.stepNumber, 2);

  const res2 = resolveSwap(boardAfterStep1, p2.from, p2.to, 5);
  assert.equal(res2.valid, true);
  assert.ok(res2.steps.length >= 2, `Expected cascade >= 2 steps, got ${res2.steps.length}`);
  assert.ok(res2.maxCascade >= 2, `Expected maxCascade >= 2, got ${res2.maxCascade}`);
  const totalSpecials = res2.steps.reduce((acc, s) => acc + s.spawnedSpecials.length, 0);
  assert.ok(totalSpecials >= 1, 'Expected step 2 cascade to forge a Strale special');
});

test('isMatchingTutorialSwap accepts target pair in either order and rejects unrelated swaps', () => {
  const { from, to } = TUTORIAL_STEP1_PAIR;
  assert.equal(isMatchingTutorialSwap(from, to, from, to), true);
  assert.equal(isMatchingTutorialSwap(to, from, from, to), true);
  assert.equal(
    isMatchingTutorialSwap({ row: 0, col: 0 }, { row: 0, col: 1 }, from, to),
    false
  );
  assert.equal(
    isMatchingTutorialSwap(TUTORIAL_STEP2_PAIR.from, TUTORIAL_STEP2_PAIR.to, from, to),
    false
  );
});
