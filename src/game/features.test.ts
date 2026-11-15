import assert from 'node:assert/strict';
import test from 'node:test';
import { BIOMES } from './biomes';
import { BOSSES } from './bosses';
import {
  COMPANIONS,
  MAX_LEVEL,
  animalLevel,
  chargeFrom,
  chargeNeeded,
  isCompanionUnlocked,
  powerTargets,
  sanitizeCompanion,
} from './companions';
import { clearCells, createBoard, plantBeams, resolveSwap } from './engine';
import { BUILDINGS, build, starsAvailable, totalStars } from './island';
import { CAMPAIGN_LEVELS, LEVELS_PER_CHAPTER, getCampaignLevel } from './levels';
import { ALL_DONE_BONUS, applyMissionEvent, createMissionState, getDailyMissions, sanitizeMissionState } from './missions';
import { createInitialRewardState } from './rewards';
import { BLITZ_LIST_SIZE, addBlitzScore, addStats, createStats, sanitizeBlitz } from './stats';
import { STORY_PAGES, nextUnseenPage, pagesReached } from './story';
import { BOARD_SIZE, Board, GEM_COLORS_ORDER } from './types';

function rngFrom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const plainBoard = (): Board => createBoard({ ...CAMPAIGN_LEVELS[0], iceCells: [], crateCells: [], chainCells: [] }, rngFrom(7));

test('every animal is a companion with a power of its own', () => {
  assert.deepEqual(COMPANIONS.map((c) => c.color).sort(), [...GEM_COLORS_ORDER].sort());
  assert.equal(new Set(COMPANIONS.map((c) => c.power)).size, COMPANIONS.length);
  assert.equal(new Set(COMPANIONS.map((c) => c.powerSv)).size, COMPANIONS.length);
});

test('companions unlock by collecting, level up and charge faster', () => {
  const album = createInitialRewardState().album;
  assert.equal(isCompanionUnlocked('ruby', album), true);
  assert.equal(isCompanionUnlocked('amber', album), false);
  assert.equal(isCompanionUnlocked('amber', { ...album, amber: 60 }), true);

  assert.deepEqual(animalLevel(0), { level: 1, from: 0, next: 150 });
  assert.equal(animalLevel(150).level, 2);
  assert.equal(animalLevel(10 ** 9).level, MAX_LEVEL);
  assert.equal(animalLevel(10 ** 9).next, null);
  assert.ok(chargeNeeded(1) > chargeNeeded(5));
  assert.ok(chargeNeeded(MAX_LEVEL) >= 80);

  assert.equal(chargeFrom({ ruby: 4, amber: 3 }, 'ruby'), 15);
  assert.equal(sanitizeCompanion({ active: 'sky' }), 'sky');
  assert.equal(sanitizeCompanion({ active: 'dragon' }), 'ruby');
});

test('clearing powers hit cells on the board and never crash the engine', () => {
  for (const def of COMPANIONS) {
    const board = plainBoard();
    const targets = powerTargets(board, def.power, rngFrom(3));
    if (def.power === 'moves' || def.power === 'specials') {
      assert.equal(targets.length, 0);
      continue;
    }
    assert.ok(targets.length >= 4, def.power);
    for (const p of targets) assert.ok(p.row >= 0 && p.row < BOARD_SIZE && p.col >= 0 && p.col < BOARD_SIZE);
    const result = clearCells(board, targets, 5, rngFrom(5));
    assert.ok(result.valid);
    assert.ok(result.totalScore > 0, def.power);
    // The board is full again afterwards.
    assert.ok(result.finalBoard.flat().every((cell) => cell.gem !== null));
  }
  assert.equal(powerTargets(plainBoard(), 'row').length, BOARD_SIZE);
  assert.equal(powerTargets(plainBoard(), 'bottom').length, BOARD_SIZE * 2);
});

test('the rabbit turns three plain animals into beams', () => {
  const planted = plantBeams(plainBoard(), 3, rngFrom(2));
  assert.equal(planted.spots.length, 3);
  for (const spot of planted.spots) {
    assert.match(planted.board[spot.row][spot.col].gem!.special, /^beam_/);
  }
});

test('every landscape has a boss, and its finale levels use that boss', () => {
  for (const biome of BIOMES) assert.equal(BOSSES[biome.id].biome, biome.id);
  BIOMES.forEach((biome, i) => {
    const chapter = i * 10 + 6;
    const level = getCampaignLevel(chapter * LEVELS_PER_CHAPTER - 1);
    assert.ok(level.boss, biome.id);
    assert.equal(level.boss!.attack, BOSSES[biome.id].attack);
    assert.equal(level.objectives[0].label, BOSSES[biome.id].nameSv);
  });
});

test('boss attacks: crates bury animals, bombs get a timer, thieves take moves', () => {
  const base = getCampaignLevel(39);
  const swap = (boss: NonNullable<typeof base.boss>) => {
    const board = plainBoard();
    const moves = [
      [{ row: 0, col: 0 }, { row: 0, col: 1 }],
      [{ row: 0, col: 0 }, { row: 1, col: 0 }],
    ];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        moves.push([{ row: r, col: c }, { row: r, col: c + 1 }], [{ row: r, col: c }, { row: r + 1, col: c }]);
      }
    }
    for (const [a, b] of moves) {
      if (b.row >= BOARD_SIZE || b.col >= BOARD_SIZE) continue;
      const result = resolveSwap(board, a, b, 5, rngFrom(11), { level: { ...base, boss }, moveNumber: boss.every });
      if (result.valid) return result;
    }
    throw new Error('no valid move on the test board');
  };

  const crates = swap({ every: 4, count: 2, attack: 'crate' });
  if (!crates.reshuffled) {
    assert.equal(crates.bossAttack?.length, 2);
    for (const p of crates.bossAttack!) {
      assert.equal(crates.finalBoard[p.row][p.col].crate, 1);
      assert.equal(crates.finalBoard[p.row][p.col].gem, null);
    }
  }

  const bombs = swap({ every: 6, count: 1, attack: 'bomb', timer: 9 });
  if (!bombs.reshuffled) {
    const p = bombs.bossAttack![0];
    assert.equal(bombs.finalBoard[p.row][p.col].gem?.bomb, 9);
  }

  const thief = swap({ every: 6, count: 1, attack: 'steal' });
  assert.equal(thief.bossStole, 1);
  assert.deepEqual(thief.bossAttack, []);
});

test('daily missions are the same all day and pay out once', () => {
  const missions = getDailyMissions('2026-11-15');
  assert.deepEqual(missions, getDailyMissions('2026-11-15'));
  assert.equal(missions.length, 3);
  assert.equal(new Set(missions.map((m) => m.kind)).size, 3);

  const fixed = [
    { kind: 'animals' as const, target: 10, reward: 15 },
    { kind: 'wins' as const, target: 1, reward: 25 },
    { kind: 'specials' as const, target: 2, reward: 20 },
  ];
  let state = createMissionState('2026-11-15');
  let step = applyMissionEvent(state, fixed, { cleared: { ruby: 6 } });
  assert.equal(step.energy, 0);
  step = applyMissionEvent(step.nextState, fixed, { cleared: { amber: 9 }, specials: 1 });
  assert.equal(step.energy, 15);
  assert.deepEqual(step.nextState.progress, [10, 0, 1]);
  step = applyMissionEvent(step.nextState, fixed, { wins: 1, specials: 5 });
  assert.equal(step.energy, 25 + 20 + ALL_DONE_BONUS);
  state = step.nextState;
  const again = applyMissionEvent(state, fixed, { cleared: { ruby: 50 }, wins: 3 });
  assert.equal(again.energy, 0);
  assert.equal(again.nextState, state);

  // A new day starts from zero.
  assert.deepEqual(sanitizeMissionState(state, '2026-11-16'), createMissionState('2026-11-16'));
  assert.deepEqual(sanitizeMissionState(state, '2026-11-15'), state);
});

test('the island is built in order with the stars that are left', () => {
  const stars = totalStars({ 1: 3, 2: 2, 3: 9, 4: 0 });
  assert.equal(stars, 8);
  let state = { built: 0 };
  let step = build(state, stars);
  assert.equal(step.built?.id, BUILDINGS[0].id);
  state = step.nextState;
  assert.equal(starsAvailable(state, stars), 8 - BUILDINGS[0].cost);
  step = build(state, stars);
  assert.equal(step.built, null);
  assert.equal(build({ built: BUILDINGS.length }, 9999).built, null);
});

test('story pages unlock with the landscapes reached', () => {
  assert.deepEqual(pagesReached(1), ['intro']);
  assert.deepEqual(pagesReached(11), ['intro', 'ang']);
  assert.equal(pagesReached(61).at(-1), 'hem');
  assert.equal(pagesReached(61).length, STORY_PAGES.length);
  assert.equal(nextUnseenPage(11, [])?.id, 'intro');
  assert.equal(nextUnseenPage(11, ['intro'])?.id, 'ang');
  assert.equal(nextUnseenPage(11, ['intro', 'ang']), null);
});

test('the time mode keeps a weekly top five and an all-time best', () => {
  let state = sanitizeBlitz(null, '2026-W46');
  for (const score of [500, 900, 100, 700, 300, 800]) state = addBlitzScore(state, score).nextState;
  assert.deepEqual(state.week, [900, 800, 700, 500, 300]);
  assert.equal(state.week.length, BLITZ_LIST_SIZE);
  assert.equal(addBlitzScore(state, 1000).rank, 1);
  assert.equal(addBlitzScore(state, 50).rank, 0);
  const nextWeek = sanitizeBlitz(state, '2026-W47');
  assert.deepEqual(nextWeek.week, []);
  assert.equal(nextWeek.best, 900);
});

test('statistics add up and ignore bad values', () => {
  const stats = addStats(addStats(createStats(), { moves: 3, gamesPlayed: 1 }), { moves: 2, secondsPlayed: -5 });
  assert.equal(stats.moves, 5);
  assert.equal(stats.gamesPlayed, 1);
  assert.equal(stats.secondsPlayed, 0);
});
