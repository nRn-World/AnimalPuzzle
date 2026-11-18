import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCustomPuzzleBoard, countCustomBoardItems, createStarterCustomPuzzle } from './customPuzzle';
import { findBestHint, findMatchGroups, hasValidMoves } from './engine';
import { Board } from './types';

const colorGrid = (board: Board): string =>
  board.map((row) => row.map((cell) => cell.gem?.color ?? '.').join('')).join('/');

test('a custom puzzle opens with at least one legal move', () => {
  const board = buildCustomPuzzleBoard(createStarterCustomPuzzle());
  assert.equal(hasValidMoves(board), true);
  assert.notEqual(findBestHint(board), null);
});

test('a custom puzzle never opens with a finished match', () => {
  const board = buildCustomPuzzleBoard(createStarterCustomPuzzle());
  assert.equal(findMatchGroups(board).length, 0);
});

test('painted ice, specials and colours survive the generator', () => {
  const spec = createStarterCustomPuzzle();
  spec.cells.push({ row: 6, col: 6, color: 'cobalt', ice: 2 });
  const board = buildCustomPuzzleBoard(spec);
  for (const p of spec.cells) {
    const cell = board[p.row][p.col];
    if (p.ice) assert.equal(cell.ice, p.ice);
    if (p.special && p.special !== 'none') assert.equal(cell.gem?.special, p.special);
    if (p.color) assert.equal(cell.gem?.color, p.color);
  }
});

test('the editor counts thick ice as two layers', () => {
  const spec = createStarterCustomPuzzle();
  spec.cells = [
    { row: 3, col: 3, ice: 2 },
    { row: 4, col: 4, ice: 2 },
  ];
  assert.equal(countCustomBoardItems(spec).ice, 4);
});

test('the same spec always builds the same board for sharing', () => {
  const spec = createStarterCustomPuzzle();
  assert.equal(colorGrid(buildCustomPuzzleBoard(spec)), colorGrid(buildCustomPuzzleBoard(spec)));
});
