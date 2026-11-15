import assert from 'node:assert/strict';
import test from 'node:test';
import { createBoard, findMatchGroups, hasValidMoves, landedEggs } from './engine';
import {
  CAMPAIGN_CHAPTER_COUNT,
  CAMPAIGN_LEVELS,
  CAMPAIGN_LEVEL_COUNT,
  FIRST_CHAPTER,
  LEVELS_PER_CHAPTER,
  chapterOfLevelIdx,
  getCampaignLevel,
  getChapter,
} from './levels';
import { setLanguage, t, loadLanguage } from '../i18n';

// Dictionaries are separate files; fetch English before the tests run.
await loadLanguage('en');

// Every 97th level plus both ends: a spread over the whole campaign.
const SAMPLE: number[] = [];
for (let idx = 0; idx < CAMPAIGN_LEVEL_COUNT; idx += 97) SAMPLE.push(idx);
SAMPLE.push(32, 33, 39, CAMPAIGN_LEVEL_COUNT - 1);

test('the campaign has thousands of levels in equally sized chapters', () => {
  assert.equal(CAMPAIGN_LEVEL_COUNT, CAMPAIGN_CHAPTER_COUNT * LEVELS_PER_CHAPTER);
  assert.ok(CAMPAIGN_LEVEL_COUNT >= 20000);
  assert.equal(CAMPAIGN_LEVELS.length % LEVELS_PER_CHAPTER, 0);
  CAMPAIGN_LEVELS.forEach((level, idx) => {
    assert.equal(level.id, idx + 1);
    assert.equal(level.chapter, chapterOfLevelIdx(idx));
    assert.equal(getCampaignLevel(idx), level);
  });
});

test('generated levels are deterministic and well formed', () => {
  for (const idx of SAMPLE) {
    const level = getCampaignLevel(idx);
    assert.deepEqual(level, getCampaignLevel(idx));
    assert.equal(level.id, idx + 1);
    assert.equal(level.chapter, chapterOfLevelIdx(idx));
    assert.ok(level.moves >= 12 && level.moves <= 42, `moves of level ${level.id}`);
    assert.ok(level.objectives.length >= 1 && level.objectives.length <= 3);
    assert.equal(new Set(level.objectives.map((o) => o.id)).size, level.objectives.length);
    const crew = (level.palette ?? []).slice(0, level.colorCount);
    if (idx >= CAMPAIGN_LEVELS.length) {
      assert.equal(new Set(crew).size, level.colorCount, `crew of level ${level.id}`);
    }
    for (const objective of level.objectives) {
      assert.ok(objective.target > 0);
      if (objective.kind === 'color' && idx >= CAMPAIGN_LEVELS.length) {
        assert.ok(crew.includes(objective.color!), `level ${level.id} asks for an absent animal`);
      }
      if (objective.kind === 'ice') {
        const hp = (level.iceCells ?? []).reduce((sum, c) => sum + c.hp, 0);
        assert.ok(objective.target <= hp, `level ${level.id} wants more ice than exists`);
      }
      if (objective.kind === 'crate') {
        assert.ok(objective.target <= (level.crateCells ?? []).length);
      }
      if (objective.kind === 'chain') {
        assert.ok(objective.target <= (level.chainCells ?? []).length);
      }
      if (objective.kind === 'honey') {
        assert.equal(objective.target, (level.honeyCells ?? []).length);
      }
      if (objective.kind === 'egg') {
        assert.equal(objective.target, (level.eggCells ?? []).length);
        assert.ok(objective.target > 0);
      }
    }
  }
});

test('generated levels start on a playable board without ready-made matches', () => {
  let seed = 7;
  const rng = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (const idx of SAMPLE) {
    const level = getCampaignLevel(idx);
    const board = createBoard(level, rng);
    assert.equal(findMatchGroups(board).length, 0, `level ${level.id} starts with a match`);
    for (const cell of board.flat()) {
      assert.ok(cell.crate > 0 || cell.gem, `level ${level.id} has an empty cell at ${cell.row},${cell.col}`);
    }
    assert.equal(landedEggs(board).length, 0, `level ${level.id} starts with a landed egg`);
    assert.equal(hasValidMoves(board), true, `level ${level.id} has no move`);
  }
});

test('holes, honey and eggs arrive later in the saga and do appear', () => {
  const seen = { holes: 0, honey: 0, eggs: 0 };
  for (let idx = CAMPAIGN_LEVELS.length; idx < 1200; idx++) {
    const level = getCampaignLevel(idx);
    const chapter = chapterOfLevelIdx(idx);
    if (level.holeCells) {
      seen.holes++;
      assert.ok(chapter >= FIRST_CHAPTER.holes);
    }
    if (level.honeyCells) {
      seen.honey++;
      assert.ok(chapter >= FIRST_CHAPTER.honey);
    }
    if (level.eggCells) {
      seen.eggs++;
      assert.ok(chapter >= FIRST_CHAPTER.eggs);
      for (const egg of level.eggCells) assert.ok(egg.row <= 1);
    }
  }
  assert.ok(seen.holes > 100 && seen.honey > 40 && seen.eggs > 40, JSON.stringify(seen));
});

test('every chapter has its own name, also in English', () => {
  const names = new Set<string>();
  for (let id = 1; id <= CAMPAIGN_CHAPTER_COUNT; id++) names.add(getChapter(id).nameSv);
  assert.equal(names.size, CAMPAIGN_CHAPTER_COUNT);
  setLanguage('en');
  try {
    for (const id of [5, 6, 700, CAMPAIGN_CHAPTER_COUNT]) {
      const name = getChapter(id).nameSv;
      assert.notEqual(t(name), name, `chapter ${id} is not translated`);
    }
  } finally {
    setLanguage('sv');
  }
});
