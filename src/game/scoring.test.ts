import assert from 'node:assert/strict';
import test from 'node:test';
import { createBoard } from './engine';
import { CAMPAIGN_LEVELS } from './levels';
import {
  applyEndlessMilestones,
  cascadeCheer,
  computeVictoryBonus,
  ENDLESS_MILESTONE_STEP,
} from './scoring';

test('victory bonus pays for unused moves and leftover specials', () => {
  const board = createBoard(CAMPAIGN_LEVELS[0]);
  const gems = board.flat().filter((cell) => cell.gem);
  gems[0].gem!.special = 'nova';
  gems[1].gem!.special = 'beam_h';

  const result = computeVictoryBonus(board, 6, 20);
  assert.equal(result.leftoverSpecials, 2);
  assert.equal(result.specialBonus, 300);
  assert.equal(result.bonus, 6 * 120 + 300);
  assert.equal(result.stars, 3);
});

test('winning on the last move still earns one star and no move bonus', () => {
  const result = computeVictoryBonus(createBoard(CAMPAIGN_LEVELS[0]), 0, 20);
  assert.equal(result.bonus, 0);
  assert.equal(result.stars, 1);
});

test('endless milestones grant five moves each, several at a time if needed', () => {
  assert.deepEqual(applyEndlessMilestones(2499, 3, ENDLESS_MILESTONE_STEP), {
    movesLeft: 3,
    nextMilestone: 2500,
  });
  assert.deepEqual(applyEndlessMilestones(2500, 3, ENDLESS_MILESTONE_STEP), {
    movesLeft: 8,
    nextMilestone: 5000,
  });
  assert.deepEqual(applyEndlessMilestones(7600, 0, ENDLESS_MILESTONE_STEP), {
    movesLeft: 15,
    nextMilestone: 10000,
  });
});

test('cheers escalate with the cascade depth', () => {
  assert.equal(cascadeCheer(1), '');
  assert.equal(cascadeCheer(2), 'KASKAD!');
  assert.equal(cascadeCheer(3), 'SUPER!');
  assert.equal(cascadeCheer(4), 'MAGISKT!');
  assert.equal(cascadeCheer(9), 'OTROLIGT!');
});
