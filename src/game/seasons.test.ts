import assert from 'node:assert/strict';
import test from 'node:test';
import { biomeOfChapter } from './biomes';
import { MUSIC_THEMES, planMusicBar } from './music';
import { applySeasonCollected, createInitialRewardState, seasonProgress } from './rewards';
import { forcedSeason, getActiveSeason, getNextSeason } from './seasons';

test('seasons are active inside their dates, including over New Year', () => {
  assert.equal(getActiveSeason(new Date(2026, 10, 15)), null);
  assert.equal(getActiveSeason(new Date(2026, 11, 1))?.key, 'jul-2026');
  assert.equal(getActiveSeason(new Date(2027, 0, 6))?.key, 'jul-2026');
  assert.equal(getActiveSeason(new Date(2027, 0, 6))?.daysLeft, 1);
  assert.equal(getActiveSeason(new Date(2027, 0, 7)), null);
  assert.equal(getActiveSeason(new Date(2027, 3, 1))?.season.id, 'pask');
  assert.equal(getActiveSeason(new Date(2027, 6, 1))?.season.id, 'sommar');
});

test('the next season and the days until it', () => {
  const next = getNextSeason(new Date(2026, 10, 15));
  assert.equal(next.season.id, 'jul');
  assert.equal(next.startsInDays, 16);
  assert.equal(getNextSeason(new Date(2026, 11, 20)).season.id, 'pask');
});

test('a season can be previewed from the address', () => {
  assert.equal(forcedSeason('?season=sommar', new Date(2026, 10, 15))?.key, 'sommar-2026');
  assert.equal(forcedSeason('?season=nope'), null);
});

test('a season completes once and starts over the next time it runs', () => {
  let state = createInitialRewardState();
  let step = applySeasonCollected(state, 1499, 'jul-2026', 1500);
  assert.equal(step.completed, false);
  step = applySeasonCollected(step.nextState, 5, 'jul-2026', 1500);
  assert.equal(step.completed, true);
  state = step.nextState;
  assert.equal(applySeasonCollected(state, 500, 'jul-2026', 1500).completed, false);
  assert.deepEqual(seasonProgress(state, 'jul-2027'), { progress: 0, claimed: false });
});

test('the landscape changes every ten chapters and loops', () => {
  assert.equal(biomeOfChapter(1), 'skargard');
  assert.equal(biomeOfChapter(10), 'skargard');
  assert.equal(biomeOfChapter(11), 'ang');
  assert.equal(biomeOfChapter(51), 'vulkan');
  assert.equal(biomeOfChapter(61), 'skargard');
});

test('every landscape has its own music that stays inside its scale', () => {
  for (const [id, theme] of Object.entries(MUSIC_THEMES)) {
    for (let bar = 0; bar < 8; bar++) {
      const plan = planMusicBar(bar, Math.random, theme);
      assert.equal(plan.pad.length, 4, id);
      for (const note of plan.melody) assert.ok(theme.scale.includes(note.freq), id);
    }
  }
});
