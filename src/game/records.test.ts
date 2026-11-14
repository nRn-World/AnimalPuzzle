import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BEST_SCORE_STORAGE_KEYS,
  bestScoreModeFor,
  nextBestScore,
} from './records';

test('daily records are stored separately from campaign and endless records', () => {
  const scores = { campaign: 500, daily: 200, endless: 100 };
  const update = nextBestScore(scores, 'daily', 900);

  assert.equal(update.mode, 'daily');
  assert.equal(update.best, 900);
  assert.equal(update.improved, true);
  assert.deepEqual(scores, { campaign: 500, daily: 200, endless: 100 });
  assert.equal(BEST_SCORE_STORAGE_KEYS.daily, 'kromatik_best_daily');
  assert.notEqual(BEST_SCORE_STORAGE_KEYS.daily, BEST_SCORE_STORAGE_KEYS.campaign);
});

test('each game mode maps to exactly one best-score bucket', () => {
  assert.equal(bestScoreModeFor('campaign'), 'campaign');
  assert.equal(bestScoreModeFor('daily'), 'daily');
  assert.equal(bestScoreModeFor('endless'), 'endless');

  assert.equal(nextBestScore({ campaign: 10, daily: 20, endless: 30 }, 'campaign', 99).best, 99);
  assert.equal(nextBestScore({ campaign: 10, daily: 20, endless: 30 }, 'daily', 99).best, 99);
  assert.equal(nextBestScore({ campaign: 10, daily: 20, endless: 30 }, 'endless', 99).best, 99);
});

test('a lower score never replaces a higher record', () => {
  const scores = { campaign: 1000, daily: 800, endless: 600 };

  for (const mode of ['campaign', 'daily', 'endless'] as const) {
    const update = nextBestScore(scores, mode, 10);
    assert.equal(update.best, scores[mode]);
    assert.equal(update.improved, false);
  }
});

test('best scores are finite, non-negative and rounded', () => {
  const scores = { campaign: Number.NaN, daily: -5, endless: 12 };
  assert.equal(nextBestScore(scores, 'campaign', Number.POSITIVE_INFINITY).best, 0);
  assert.equal(nextBestScore(scores, 'daily', 7.6).best, 8);
  assert.equal(nextBestScore(scores, 'endless', 11.4).best, 12);
});
