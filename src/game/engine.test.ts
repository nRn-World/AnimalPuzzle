import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocGemId,
  applyTool,
  areObjectivesComplete,
  canSwap,
  createBoard,
  createEmptyProgress,
  findBestHint,
  findMatchGroups,
  hasValidMoves,
  resolveSwap,
} from './engine';
import { CAMPAIGN_LEVELS } from './levels';
import { BOARD_SIZE, Board, GemColor } from './types';

function makeDeterministicRng(seed = 12345): () => number {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makePatternBoard(pattern: GemColor[][]): Board {
  return pattern.map((rowColors, row) =>
    rowColors.map((color, col) => ({
      row,
      col,
      ice: 0,
      crate: 0,
      gem: {
        id: allocGemId(),
        color,
        special: 'none',
        chained: false,
      },
    }))
  );
}

function makeCleanBoard(): Board {
  const colors: GemColor[] = ['ruby', 'amber', 'emerald', 'cobalt', 'amethyst', 'quartz'];
  const pattern: GemColor[][] = Array.from({ length: BOARD_SIZE }, (_, r) =>
    Array.from({ length: BOARD_SIZE }, (__, c) => colors[(r * 3 + c) % colors.length])
  );
  return makePatternBoard(pattern);
}

test('createBoard initializes 8x8 board with zero initial matches and valid moves', () => {
  const rng = makeDeterministicRng(42);
  for (const level of CAMPAIGN_LEVELS) {
    const board = createBoard(level, rng);
    assert.equal(board.length, BOARD_SIZE);
    assert.equal(board[0].length, BOARD_SIZE);
    assert.equal(findMatchGroups(board).length, 0, `Level ${level.id} had initial match`);
    assert.equal(hasValidMoves(board), true, `Level ${level.id} had no valid moves`);
  }
});

test('canSwap enforces adjacency and blocks chained gems and stone crates', () => {
  const board = makeCleanBoard();
  assert.equal(canSwap(board, { row: 0, col: 0 }, { row: 0, col: 1 }), true);
  assert.equal(canSwap(board, { row: 0, col: 0 }, { row: 1, col: 1 }), false);

  board[0][1].gem!.chained = true;
  assert.equal(canSwap(board, { row: 0, col: 0 }, { row: 0, col: 1 }), false);

  board[1][0].crate = 1;
  board[1][0].gem = null;
  assert.equal(canSwap(board, { row: 0, col: 0 }, { row: 1, col: 0 }), false);
});

test('match-4 creates beam special and match-5 creates prism special', () => {
  const rng = makeDeterministicRng(7);

  // Setup horizontal 4-match after swapping (2,3) and (1,3)
  const board4 = makeCleanBoard();
  board4[2][0].gem!.color = 'ruby';
  board4[2][1].gem!.color = 'ruby';
  board4[2][2].gem!.color = 'ruby';
  board4[2][3].gem!.color = 'amber';
  board4[2][4].gem!.color = 'cobalt';
  board4[1][3].gem!.color = 'ruby';
  // Avoid vertical accidental matches
  board4[0][3].gem!.color = 'emerald';
  board4[3][3].gem!.color = 'cobalt';

  const res4 = resolveSwap(board4, { row: 1, col: 3 }, { row: 2, col: 3 }, 5, rng);
  assert.equal(res4.valid, true);
  assert.equal(res4.steps[0].spawnedSpecials.length, 1);
  assert.equal(res4.steps[0].spawnedSpecials[0].special, 'beam_v');

  // Setup horizontal 5-match after swapping (4,2) and (3,2)
  const board5 = makeCleanBoard();
  board5[4][0].gem!.color = 'emerald';
  board5[4][1].gem!.color = 'emerald';
  board5[4][2].gem!.color = 'cobalt';
  board5[4][3].gem!.color = 'emerald';
  board5[4][4].gem!.color = 'emerald';
  board5[3][2].gem!.color = 'emerald';
  board5[2][2].gem!.color = 'amber';
  board5[5][2].gem!.color = 'ruby';

  const res5 = resolveSwap(board5, { row: 3, col: 2 }, { row: 4, col: 2 }, 5, rng);
  assert.equal(res5.valid, true);
  assert.equal(res5.steps[0].spawnedSpecials.length, 1);
  assert.equal(res5.steps[0].spawnedSpecials[0].special, 'prism');
});

test('L-shape intersecting match creates nova special', () => {
  const rng = makeDeterministicRng(99);
  const board = makeCleanBoard();
  // Create L shape around (3,3) when swapping (2,3) -> (3,3)
  board[3][1].gem!.color = 'cobalt';
  board[3][2].gem!.color = 'cobalt';
  board[3][3].gem!.color = 'amber';
  board[4][3].gem!.color = 'cobalt';
  board[5][3].gem!.color = 'cobalt';
  board[2][3].gem!.color = 'cobalt';
  board[1][3].gem!.color = 'ruby';

  const res = resolveSwap(board, { row: 2, col: 3 }, { row: 3, col: 3 }, 5, rng);
  assert.equal(res.valid, true);
  assert.equal(res.steps[0].spawnedSpecials[0].special, 'nova');
});

test('prism + regular gem clears all gems of target color', () => {
  const rng = makeDeterministicRng(101);
  const board = makeCleanBoard();
  board[3][3].gem!.special = 'prism';
  board[3][3].gem!.color = 'ruby';
  board[3][4].gem!.color = 'amber';

  let amberCountBefore = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].gem?.color === 'amber') amberCountBefore++;
    }
  }
  assert.ok(amberCountBefore > 0);

  const res = resolveSwap(board, { row: 3, col: 3 }, { row: 3, col: 4 }, 5, rng);
  assert.equal(res.valid, true);
  assert.ok(res.steps[0].deltaProgress.clearedColors.amber >= amberCountBefore);
});

test('matches thaw ice, crack adjacent crates, and break chains', () => {
  const rng = makeDeterministicRng(202);
  const board = makeCleanBoard();
  board[4][0].gem!.color = 'ruby';
  board[4][1].gem!.color = 'ruby';
  board[4][2].gem!.color = 'amber';
  board[3][2].gem!.color = 'ruby';
  board[2][2].gem!.color = 'cobalt';

  board[4][0].ice = 1;
  board[4][1].gem!.chained = true;
  board[5][1].crate = 1;
  board[5][1].gem = null;

  const res = resolveSwap(board, { row: 3, col: 2 }, { row: 4, col: 2 }, 5, rng);
  assert.equal(res.valid, true);
  assert.equal(res.steps[0].deltaProgress.clearedIce, 1);
  assert.equal(res.steps[0].deltaProgress.clearedChains, 1);
  assert.equal(res.steps[0].deltaProgress.clearedCrates, 1);
  assert.equal(res.finalBoard[5][1].crate, 0);
  assert.ok(res.finalBoard[5][1].gem !== null);
});

test('tactical tools hammer, pulse, and shuffle work cleanly', () => {
  const rng = makeDeterministicRng(303);
  const board = makeCleanBoard();
  board[2][2].crate = 2;
  board[2][2].gem = null;

  const hit1 = applyTool(board, 'hammer', { row: 2, col: 2 }, 5, rng);
  assert.equal(hit1.valid, true);
  assert.equal(hit1.finalBoard[2][2].crate, 1);

  const hit2 = applyTool(hit1.finalBoard, 'hammer', { row: 2, col: 2 }, 5, rng);
  assert.equal(hit2.valid, true);
  assert.equal(hit2.finalBoard[2][2].crate, 0);
  assert.ok(hit2.finalBoard[2][2].gem !== null);

  const pulseRes = applyTool(hit2.finalBoard, 'pulse', { row: 4, col: 4 }, 5, rng);
  assert.equal(pulseRes.valid, true);
  assert.ok(pulseRes.steps[0].clearedCoords.length >= 15);
});

test('special + special swaps are legal and carry a combo identity', () => {
  const rng = makeDeterministicRng(505);
  const beams = makeCleanBoard();
  beams[3][3].gem!.special = 'beam_h';
  beams[3][4].gem!.special = 'beam_v';
  const beamRes = resolveSwap(beams, { row: 3, col: 3 }, { row: 3, col: 4 }, 5, rng);
  assert.equal(beamRes.valid, true);
  assert.equal(beamRes.combo, 'crossbeam');
  assert.ok(beamRes.steps[0].stepScore > 0);

  const novas = makeCleanBoard();
  novas[4][3].gem!.special = 'nova';
  novas[4][4].gem!.special = 'nova';
  const novaRes = resolveSwap(novas, { row: 4, col: 3 }, { row: 4, col: 4 }, 5, rng);
  assert.equal(novaRes.valid, true);
  assert.equal(novaRes.combo, 'supernova');

  const prismBoard = makeCleanBoard();
  prismBoard[5][3].gem!.special = 'prism';
  const prismRes = resolveSwap(
    prismBoard,
    { row: 5, col: 3 },
    { row: 5, col: 4 },
    5,
    rng
  );
  assert.equal(prismRes.valid, true);
  assert.equal(prismRes.combo, 'prism');
});

test('findBestHint finds valid move and objective checker evaluates completion', () => {
  const rng = makeDeterministicRng(404);
  const board = createBoard(CAMPAIGN_LEVELS[0], rng);
  const hint = findBestHint(board);
  assert.ok(hint !== null);
  const swapCheck = resolveSwap(board, hint!.from, hint!.to, 5, rng);
  assert.equal(swapCheck.valid, true);

  const progress = createEmptyProgress();
  progress.clearedColors.ruby = 16;
  progress.clearedColors.cobalt = 15;
  assert.equal(areObjectivesComplete(CAMPAIGN_LEVELS[0].objectives, progress), false);
  progress.clearedColors.cobalt = 16;
  assert.equal(areObjectivesComplete(CAMPAIGN_LEVELS[0].objectives, progress), true);
});

test('four animals in a 2x2 square make a scout', () => {
  const board = makeCleanBoard();
  for (const [r, c] of [[3, 3], [3, 4], [4, 3], [4, 4]]) board[r][c].gem!.color = 'rose';
  const groups = findMatchGroups(board).filter((g) => g.color === 'rose');
  assert.equal(groups.length, 1);
  assert.equal(groups[0].special, 'scout');
  assert.equal(groups[0].cells.length, 4);
});

test('a scout flies to a crate before anything else', () => {
  const board = makeCleanBoard();
  board[7][7].crate = 1;
  board[7][7].gem = null;
  // Row 0: rose rose _ rose, with a scout among them once the gap is filled.
  board[0][0].gem!.color = 'rose';
  board[0][1].gem!.color = 'rose';
  board[0][1].gem!.special = 'scout';
  board[0][3].gem!.color = 'rose';
  board[0][2].gem!.color = 'mint';
  board[1][2].gem!.color = 'rose';
  const result = resolveSwap(board, { row: 1, col: 2 }, { row: 0, col: 2 }, 6, makeDeterministicRng(3));
  assert.equal(result.valid, true);
  const flight = result.steps[0].blasts.find((b) => b.type === 'scout');
  assert.ok(flight, 'the scout took off');
  assert.deepEqual([flight!.row, flight!.col], [7, 7]);
  assert.equal(result.steps[0].deltaProgress.clearedCrates, 1);
});

test('two scouts swapped together send out a flock of three', () => {
  const board = makeCleanBoard();
  board[4][4].gem!.special = 'scout';
  board[4][5].gem!.special = 'scout';
  const result = resolveSwap(board, { row: 4, col: 4 }, { row: 4, col: 5 }, 6, makeDeterministicRng(5));
  assert.equal(result.valid, true);
  assert.equal(result.combo, 'scout_flock');
  assert.equal(result.steps[0].blasts.filter((b) => b.type === 'scout').length, 3);
});
