import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeBoardDimensions,
  MAX_LANDSCAPE_STRETCH,
  MAX_PORTRAIT_STRETCH,
} from './boardLayout';

test('computeBoardDimensions returns null for collapsed stages', () => {
  assert.equal(computeBoardDimensions(0, 500), null);
  assert.equal(computeBoardDimensions(500, 1), null);
});

test('computeBoardDimensions fills full width and stretches gracefully on portrait mobile screens', () => {
  // Tall phone (e.g. iPhone 14 portrait stage)
  const tall = computeBoardDimensions(382, 610);
  assert.deepEqual(tall, {
    width: 382,
    height: Math.floor(382 * MAX_PORTRAIT_STRETCH),
  });

  // Shorter phone (e.g. iPhone SE portrait stage): fills both width and height completely
  const compact = computeBoardDimensions(367, 435);
  assert.deepEqual(compact, { width: 367, height: 435 });
});

test('computeBoardDimensions fills full height on desktop and landscape screens', () => {
  // Desktop 1440x900 stage
  const desktop = computeBoardDimensions(1100, 884);
  assert.deepEqual(desktop, {
    width: Math.floor(884 * MAX_LANDSCAPE_STRETCH),
    height: 884,
  });

  // Mobile landscape stage
  const phoneLandscape = computeBoardDimensions(460, 374);
  assert.deepEqual(phoneLandscape, {
    width: Math.floor(374 * MAX_LANDSCAPE_STRETCH),
    height: 374,
  });

  // Narrow landscape stage where width limits horizontal stretch
  const narrowLandscape = computeBoardDimensions(720, 700);
  assert.deepEqual(narrowLandscape, { width: 720, height: 700 });
});
