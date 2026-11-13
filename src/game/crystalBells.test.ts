import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CRYSTAL_BELL_FREQS,
  CRYSTAL_BELL_TRIGGER_PROBABILITY,
  planCrystalBellChimes,
} from './crystalBells';

function createSequenceRng(values: number[]): () => number {
  let idx = 0;
  return () => {
    const val = values[idx % values.length];
    idx += 1;
    return val;
  };
}

test('planCrystalBellChimes only triggers when a cascade starts (cascadeIndex === 2)', () => {
  const alwaysLow = () => 0.1;
  assert.deepEqual(planCrystalBellChimes(1, alwaysLow), []);
  assert.deepEqual(planCrystalBellChimes(3, alwaysLow), []);
  assert.deepEqual(planCrystalBellChimes(5, alwaysLow), []);

  const triggered = planCrystalBellChimes(2, alwaysLow);
  assert.ok(triggered.length >= 2 && triggered.length <= 4);
});

test('planCrystalBellChimes respects random activation probability gate', () => {
  const skipped = planCrystalBellChimes(2, () => CRYSTAL_BELL_TRIGGER_PROBABILITY);
  assert.deepEqual(skipped, []);

  const skippedHigh = planCrystalBellChimes(2, () => 0.99);
  assert.deepEqual(skippedHigh, []);

  const activated = planCrystalBellChimes(2, () => CRYSTAL_BELL_TRIGGER_PROBABILITY - 0.01);
  assert.ok(activated.length >= 2);
});

test('planCrystalBellChimes produces discreet crystal frequencies, staggered delays, and bounded gain/pan', () => {
  const rng = createSequenceRng([0.2, 0.85, 0.3, 0.1, 0.5, 0.7, 0.4, 0.9, 0.25]);
  const chimes = planCrystalBellChimes(2, rng);

  assert.ok(chimes.length >= 2 && chimes.length <= 4);
  const minFreq = Math.min(...CRYSTAL_BELL_FREQS) * 0.98;
  const maxFreq = Math.max(...CRYSTAL_BELL_FREQS) * 1.02;

  let prevDelay = -1;
  for (const chime of chimes) {
    assert.ok(chime.freq >= minFreq && chime.freq <= maxFreq);
    assert.ok(chime.gain > 0 && chime.gain <= 0.032, `Expected discreet gain, got ${chime.gain}`);
    assert.ok(chime.duration >= 0.8 && chime.duration <= 1.4);
    assert.ok(chime.overtoneRatio >= 2.7 && chime.overtoneRatio <= 2.85);
    assert.ok(chime.pan >= -1 && chime.pan <= 1);
    assert.ok(chime.delay > prevDelay, 'Chimes should be staggered over time');
    prevDelay = chime.delay;
  }
});
