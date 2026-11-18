/**
 * Render smoke tests for the board. The engine is covered move by move in
 * `src/game`, but nothing used to check that the React tree around it still
 * renders a full grid, its accessibility metadata and the egg lane.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSeededRng } from '../game/daily';
import { createBoard } from '../game/engine';
import { CAMPAIGN_LEVELS } from '../game/levels';
import { Board } from '../game/types';
import { GameBoard } from './GameBoard';

const baseBoard = createBoard(CAMPAIGN_LEVELS[0], createSeededRng('board-smoke'));

function render(overrides: { board?: Board } = {}): string {
  return renderToStaticMarkup(
    <GameBoard
      board={overrides.board ?? baseBoard}
      transitionMode="none"
      skin="classic"
      selected={null}
      hintPair={null}
      clearingKeys={new Set()}
      invalidPair={null}
      activeTool={null}
      shaking={false}
      busy={false}
      fxRef={{ current: null }}
      onCellClick={() => {}}
      onSwipeSwap={() => {}}
    />
  );
}

test('the board renders a full 8×8 grid with row/column metadata', () => {
  const html = render();
  assert.match(html, /data-testid="game-board"/);
  assert.match(html, /aria-rowcount="8"/);
  assert.match(html, /aria-colcount="8"/);
  assert.equal((html.match(/<button/g) ?? []).length, 64);
});

test('an egg gets a visible drop lane at the bottom of its column', () => {
  const withEgg: Board = baseBoard.map((row) =>
    row.map((cell) => ({ ...cell, gem: cell.gem ? { ...cell.gem } : null }))
  );
  withEgg[1][3].gem!.egg = true;
  const html = render({ board: withEgg });
  assert.match(html, /data-testid="egg-lane"/);
});

test('holes render as disabled cells without an animal', () => {
  const withHole: Board = baseBoard.map((row) =>
    row.map((cell) => ({ ...cell, gem: cell.gem ? { ...cell.gem } : null }))
  );
  withHole[0][0] = { ...withHole[0][0], gem: null, crate: 9, block: 'hole' };
  const html = render({ board: withHole });
  assert.match(html, /disabled=""/);
  assert.equal((html.match(/<button/g) ?? []).length, 64);
});
