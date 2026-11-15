import assert from 'node:assert/strict';
import test from 'node:test';
import { BIOMES } from './biomes';
import { BOSSES } from './bosses';
import { COMPANIONS, TIER_EXTRA_CELLS, powerTargets, powerTier } from './companions';
import { bossEvery, createBoard } from './engine';
import { BUILDINGS, DAILY_GIFT_PER_BUILDING, canCollectGift, collectGift, dailyGift, sanitizeIsland } from './island';
import { CAMPAIGN_LEVELS } from './levels';
import { LIFE_REGEN_MS, MAX_LIVES } from './lives';
import { msToFullLives } from './reminders';
import { bossPage } from './story';
import { Board, GEM_COLORS_ORDER } from './types';
import { WEEKLY_LEVEL_ENERGY, getWeeklyLevel, sanitizeWeeklyLevel } from './weeklyLevel';

function rngFrom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const plainBoard = (): Board =>
  createBoard({ ...CAMPAIGN_LEVELS[0], iceCells: [], crateCells: [], chainCells: [] }, rngFrom(7));

test('an enraged boss attacks one move sooner, but never faster than every third', () => {
  assert.equal(bossEvery(6), 6);
  assert.equal(bossEvery(6, true), 5);
  assert.equal(bossEvery(4, true), 3);
  assert.equal(bossEvery(3, true), 3);
});

test('powers grow at level 5 and level 10', () => {
  assert.equal(powerTier(1), 1);
  assert.equal(powerTier(4), 1);
  assert.equal(powerTier(5), 2);
  assert.equal(powerTier(9), 2);
  assert.equal(powerTier(10), 3);
  for (const def of COMPANIONS) {
    if (def.power === 'moves' || def.power === 'specials') continue;
    const base = powerTargets(plainBoard(), def.power, rngFrom(3), 1);
    const top = powerTargets(plainBoard(), def.power, rngFrom(3), 3);
    if (base.length === 0) continue;
    assert.ok(top.length > base.length, def.power);
    assert.ok(top.length <= base.length + 2 * TIER_EXTRA_CELLS, def.power);
    const unique = new Set(top.map((p) => `${p.row},${p.col}`));
    assert.equal(unique.size, top.length, `${def.power} hits a cell twice`);
  }
});

test('every building houses a different animal and pays a daily gift once a day', () => {
  const residents = new Set(BUILDINGS.map((b) => b.resident));
  assert.equal(residents.size, BUILDINGS.length);
  for (const color of residents) assert.ok(GEM_COLORS_ORDER.includes(color));

  const empty = sanitizeIsland({ built: 0 });
  assert.equal(dailyGift(empty), 0);
  assert.equal(canCollectGift(empty, '2026-11-14'), false);

  const island = sanitizeIsland({ built: 4 });
  assert.equal(dailyGift(island), 4 * DAILY_GIFT_PER_BUILDING);
  assert.ok(canCollectGift(island, '2026-11-14'));
  const first = collectGift(island, '2026-11-14');
  assert.equal(first.energy, 4 * DAILY_GIFT_PER_BUILDING);
  assert.equal(canCollectGift(first.nextState, '2026-11-14'), false);
  assert.equal(collectGift(first.nextState, '2026-11-14').energy, 0);
  assert.ok(canCollectGift(first.nextState, '2026-11-15'));
  // The collected day survives a save and load.
  assert.equal(canCollectGift(sanitizeIsland(JSON.parse(JSON.stringify(first.nextState))), '2026-11-14'), false);
});

test('every boss has a story page of its own after the fight', () => {
  for (const biome of BIOMES) {
    const boss = BOSSES[biome.id];
    const page = bossPage(5, biome.id, boss.nameSv);
    assert.equal(page.id, 'boss-5');
    assert.equal(page.titleSv, boss.nameSv);
    assert.equal(page.panels.length, 1);
    assert.ok(page.panels[0].captionSv.length > 10);
    assert.ok(page.panels[0].cast.length > 0);
    // Two scenes per landscape, so a second visit tells something new.
    assert.notEqual(bossPage(6, biome.id, boss.nameSv).panels[0].captionSv, page.panels[0].captionSv);
  }
});

test('the weekly special level is the same all week, hard, and has no boss', () => {
  const a = getWeeklyLevel('2026-W46');
  const b = getWeeklyLevel('2026-W46');
  assert.deepEqual(a, b);
  assert.ok(WEEKLY_LEVEL_ENERGY > 0);
  const seeds = new Set<string>();
  for (let week = 1; week <= 52; week++) {
    const { level, seed } = getWeeklyLevel(`2026-W${String(week).padStart(2, '0')}`);
    seeds.add(seed);
    assert.equal(level.boss, undefined);
    assert.ok(level.moves >= 12);
    assert.ok(level.difficulty === 'hard' || level.difficulty === 'extreme', level.difficulty);
    assert.ok(level.objectives.length > 0);
  }
  assert.equal(seeds.size, 52);
});

test('weekly progress starts over in a new week', () => {
  const saved = { weekKey: '2026-W46', won: true, attempts: 3 };
  assert.deepEqual(sanitizeWeeklyLevel(saved, '2026-W46'), saved);
  assert.deepEqual(sanitizeWeeklyLevel(saved, '2026-W47'), { weekKey: '2026-W47', won: false, attempts: 0 });
  assert.deepEqual(sanitizeWeeklyLevel('rubbish', '2026-W47'), { weekKey: '2026-W47', won: false, attempts: 0 });
});

test('the reminder waits until every life is back', () => {
  const now = 1_000_000;
  assert.equal(msToFullLives({ lives: MAX_LIVES, since: 0 }, now), 0);
  assert.equal(msToFullLives({ lives: MAX_LIVES - 1, since: now }, now), LIFE_REGEN_MS);
  assert.equal(msToFullLives({ lives: 2, since: now }, now), 3 * LIFE_REGEN_MS);
  assert.equal(msToFullLives({ lives: 2, since: now - 60_000 }, now), 3 * LIFE_REGEN_MS - 60_000);
});
