import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyStartSpecials,
  canAffordRescue,
  createInitialWinStreak,
  defuseExplodedBombs,
  recordStreakWin,
  RESCUE_BASE_COST,
  RESCUE_MOVES,
  rescueCost,
  resetWinStreak,
  splitRescuePayment,
  winStreakSpecials,
} from './boosters';
import { createSeededRng } from './daily';
import { createBoard } from './engine';
import { CAMPAIGN_LEVELS } from './levels';

test('winStreakSpecials escalates cleanly up to tier 3 and resets on defeat', () => {
  let s = createInitialWinStreak();
  assert.deepEqual(winStreakSpecials(s.streak), []);

  s = recordStreakWin(s);
  assert.equal(s.streak, 1);
  assert.equal(s.bestStreak, 1);
  assert.deepEqual(winStreakSpecials(s.streak), ['beam_h']);

  s = recordStreakWin(s);
  assert.deepEqual(winStreakSpecials(s.streak), ['beam_h', 'nova']);

  s = recordStreakWin(s);
  assert.deepEqual(winStreakSpecials(s.streak), ['beam_h', 'nova', 'prism']);

  s = recordStreakWin(s);
  assert.equal(s.streak, 4);
  assert.deepEqual(winStreakSpecials(s.streak), ['beam_h', 'nova', 'prism']);

  const reset = resetWinStreak(s);
  assert.equal(reset.streak, 0);
  assert.equal(reset.bestStreak, 4);
});

test('applyStartSpecials plants requested specials onto safe plain cells only', () => {
  const board = createBoard(CAMPAIGN_LEVELS[0], createSeededRng('start-specials'));
  const { board: next, placed } = applyStartSpecials(
    board,
    ['beam_h', 'nova', 'prism'],
    createSeededRng('place-1')
  );
  assert.equal(placed.length, 3);
  for (const item of placed) {
    const cell = next[item.coord.row][item.coord.col];
    assert.equal(cell.crate, 0);
    assert.ok(cell.gem);
    assert.equal(cell.gem.special, item.special);
  }
});

test('rescue cost scales per use, splits bank/round energy and defuses exploded bombs', () => {
  assert.equal(rescueCost(0), RESCUE_BASE_COST);
  assert.equal(rescueCost(1), RESCUE_BASE_COST * 2);

  assert.equal(canAffordRescue('campaign', 0, 30, 15), true);
  assert.equal(canAffordRescue('campaign', 0, 20, 10), false);
  assert.equal(canAffordRescue('blitz', 0, 100, 100), false);
  assert.equal(canAffordRescue('campaign', 2, 200, 100), false);

  assert.deepEqual(splitRescuePayment(30, 25, 40), { nextBank: 0, nextRound: 15 });
  assert.deepEqual(splitRescuePayment(80, 25, 40), { nextBank: 40, nextRound: 25 });
  assert.equal(splitRescuePayment(10, 10, 40), null);

  const board = createBoard(CAMPAIGN_LEVELS[0], createSeededRng('bomb-defuse'));
  board[2][2].gem!.bomb = 0;
  board[3][3].gem!.bomb = 4;
  const defused = defuseExplodedBombs(board);
  assert.equal(defused[2][2].gem!.bomb, RESCUE_MOVES);
  assert.equal(defused[3][3].gem!.bomb, 4);
});
