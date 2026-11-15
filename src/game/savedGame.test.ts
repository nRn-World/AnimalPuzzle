import assert from 'node:assert/strict';
import test from 'node:test';
import { createBoard, createEmptyProgress } from './engine';
import { CAMPAIGN_LEVELS } from './levels';
import { isSavedGameResumable, parseSavedGame, SAVED_GAME_VERSION } from './savedGame';
import { Cell } from './types';

function sampleSave(levelIdx = 4) {
  return {
    version: SAVED_GAME_VERSION,
    mode: 'campaign',
    levelIdx,
    dailyKey: null,
    board: createBoard(CAMPAIGN_LEVELS[levelIdx]),
    movesLeft: 11,
    progress: { ...createEmptyProgress(), score: 1840, clearedIce: 3 },
    energy: 45,
    maxCascade: 3,
    endlessTarget: 2500,
    savedAt: 1_700_000_000_000,
  };
}

test('a saved game survives a JSON round trip', () => {
  const save = sampleSave();
  const parsed = parseSavedGame(JSON.parse(JSON.stringify(save)));
  assert.ok(parsed);
  assert.equal(parsed.mode, 'campaign');
  assert.equal(parsed.levelIdx, 4);
  assert.equal(parsed.movesLeft, 11);
  assert.equal(parsed.energy, 45);
  assert.equal(parsed.progress.score, 1840);
  assert.equal(parsed.progress.clearedIce, 3);

  // Same layout: colours, specials, ice and crates all match cell by cell.
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const before: Cell = save.board[r][c];
      const after: Cell = parsed.board[r][c];
      assert.equal(after.ice, before.ice);
      assert.equal(after.crate, before.crate);
      assert.equal(after.gem?.color, before.gem?.color);
      assert.equal(after.gem?.special, before.gem?.special);
      assert.equal(after.gem?.chained, before.gem?.chained);
    }
  }
});

test('restored gems get fresh unique ids', () => {
  const save = sampleSave();
  const parsed = parseSavedGame(JSON.parse(JSON.stringify(save)));
  assert.ok(parsed);
  const oldIds = new Set(save.board.flat().map((cell) => cell.gem?.id).filter(Boolean));
  const newIds = parsed.board.flat().map((cell) => cell.gem?.id).filter(Boolean);
  assert.equal(new Set(newIds).size, newIds.length);
  for (const id of newIds) assert.ok(!oldIds.has(id));
});

test('corrupt or outdated saves are rejected instead of crashing the game', () => {
  const good = () => JSON.parse(JSON.stringify(sampleSave()));

  assert.equal(parseSavedGame(null), null);
  assert.equal(parseSavedGame('nope'), null);
  assert.equal(parseSavedGame({ ...good(), version: 0 }), null);
  assert.equal(parseSavedGame({ ...good(), mode: 'arcade' }), null);
  assert.equal(parseSavedGame({ ...good(), movesLeft: 0 }), null);
  assert.equal(parseSavedGame({ ...good(), movesLeft: 'many' }), null);
  assert.equal(parseSavedGame({ ...good(), progress: null }), null);
  assert.equal(parseSavedGame({ ...good(), mode: 'daily', dailyKey: null }), null);

  const shortBoard = good();
  shortBoard.board.pop();
  assert.equal(parseSavedGame(shortBoard), null);

  const badColor = good();
  const gemCell = badColor.board.flat().find((cell: { gem: unknown }) => cell.gem);
  gemCell.gem.color = 'plaid';
  assert.equal(parseSavedGame(badColor), null);

  const gemInCrate = good();
  const anyGem = gemInCrate.board.flat().find((cell: { gem: unknown }) => cell.gem);
  anyGem.crate = 2;
  assert.equal(parseSavedGame(gemInCrate), null);
});

test('only saves that can still be played are offered', () => {
  const ctx = { levelCount: 32, highestUnlockedIdx: 5, todayKey: '2026-11-14' };
  const campaign = parseSavedGame(JSON.parse(JSON.stringify(sampleSave(4))));
  assert.ok(campaign);
  assert.equal(isSavedGameResumable(campaign, ctx), true);
  assert.equal(isSavedGameResumable({ ...campaign, levelIdx: 6 }, ctx), false);
  assert.equal(isSavedGameResumable({ ...campaign, levelIdx: 40 }, ctx), false);

  const daily = { ...campaign, mode: 'daily' as const, dailyKey: '2026-11-14' };
  assert.equal(isSavedGameResumable(daily, ctx), true);
  assert.equal(isSavedGameResumable({ ...daily, dailyKey: '2026-11-13' }, ctx), false);

  assert.equal(isSavedGameResumable({ ...campaign, mode: 'endless' as const }, ctx), true);
});
