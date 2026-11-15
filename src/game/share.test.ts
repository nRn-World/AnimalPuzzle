import assert from 'node:assert/strict';
import test from 'node:test';
import { setLanguage, loadLanguage } from '../i18n';
import { buildShareText } from './share';

// Dictionaries are separate files; fetch English before the tests run.
await loadLanguage('en');

const base = {
  won: true,
  levelNumber: 5,
  levelName: 'Skattkammaren',
  dateKey: '2026-11-14',
  stars: 2,
  score: 12400,
  maxCascade: 4,
  url: 'https://example.test/AnimalPuzzle/',
};

test('daily share text names the date and shows stars, score and chain', () => {
  setLanguage('sv');
  const text = buildShareText({ ...base, mode: 'daily' });
  const [title, stats, url] = text.split('\n');
  assert.equal(title, 'AnimalPuzzle · Dagens utmaning 2026-11-14');
  assert.ok(stats.startsWith('⭐⭐☆ · '));
  assert.match(stats, /12\s400 poäng/);
  assert.ok(stats.endsWith('kedja ×4'));
  assert.equal(url, base.url);
});

test('campaign share text is translated with the active language', () => {
  setLanguage('en');
  try {
    const text = buildShareText({ ...base, mode: 'campaign', stars: 3 });
    assert.ok(text.startsWith('AnimalPuzzle · Level 5: '));
    assert.ok(!text.includes('Skattkammaren'));
    assert.match(text, /⭐⭐⭐ · 12,400 points · chain ×4/);
  } finally {
    setLanguage('sv');
  }
});

test('an endless run has no stars and skips a chain of one', () => {
  setLanguage('sv');
  const text = buildShareText({ ...base, mode: 'endless', won: false, maxCascade: 1 });
  assert.ok(!text.includes('⭐') && !text.includes('☆'));
  assert.ok(!text.includes('kedja'));
});
