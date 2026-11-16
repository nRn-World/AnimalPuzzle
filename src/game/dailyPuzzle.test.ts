import assert from 'node:assert/strict';
import test from 'node:test';
import { createSeededRng } from './daily';
import {
  buildPuzzleBoard,
  createInitialDailyPuzzleState,
  getDailyPuzzle,
  isDailyPuzzleSolved,
  markDailyPuzzleSolved,
  TACTICAL_PUZZLES,
} from './dailyPuzzle';
import {
  areObjectivesComplete,
  createEmptyProgress,
  findMatchGroups,
  levelColorPool,
  resolveSwap,
} from './engine';
import { addStepDelta } from './progress';

test('every handcrafted daily tactical puzzle starts match-free and solves within its move limit', () => {
  assert.ok(TACTICAL_PUZZLES.length >= 10);

  for (const spec of TACTICAL_PUZZLES) {
    let board = buildPuzzleBoard(spec);
    assert.equal(
      findMatchGroups(board).length,
      0,
      `puzzle ${spec.id} must start without accidental initial matches`
    );
    assert.ok(
      spec.solution.length > 0 && spec.solution.length <= spec.moves,
      `puzzle ${spec.id} solution exceeds move limit`
    );

    const rng = createSeededRng(`verify-${spec.id}`);
    const level = {
      id: 900,
      name: spec.nameSv,
      subtitle: spec.descSv,
      moves: spec.moves,
      colorCount: 5,
      objectives: spec.objectives,
    };
    let progress = createEmptyProgress();

    for (let i = 0; i < spec.solution.length; i++) {
      const [a, b] = spec.solution[i];
      const result = resolveSwap(board, a, b, levelColorPool(level), rng, {
        level,
        moveNumber: i + 1,
        enraged: false,
      });
      assert.equal(result.valid, true, `puzzle ${spec.id} move ${i + 1} should be valid`);
      for (const step of result.steps) {
        progress = addStepDelta(progress, step);
      }
      board = result.finalBoard;
    }

    assert.equal(
      areObjectivesComplete(spec.objectives, progress),
      true,
      `puzzle ${spec.id} should complete all objectives after its solution`
    );
  }
});

test('getDailyPuzzle is deterministic per date and tracks daily completion once', () => {
  const a = getDailyPuzzle('2026-11-16');
  const b = getDailyPuzzle('2026-11-16');
  assert.equal(a.spec.id, b.spec.id);

  let state = createInitialDailyPuzzleState();
  assert.equal(isDailyPuzzleSolved(state, '2026-11-16'), false);
  const first = markDailyPuzzleSolved(state, '2026-11-16');
  assert.equal(first.newlySolved, true);
  assert.equal(first.nextState.totalSolved, 1);
  state = first.nextState;

  const dup = markDailyPuzzleSolved(state, '2026-11-16');
  assert.equal(dup.newlySolved, false);
  assert.equal(dup.nextState.totalSolved, 1);
});
