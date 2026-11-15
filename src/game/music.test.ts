import assert from 'node:assert/strict';
import test from 'node:test';
import { createSeededRng } from './daily';
import {
  MAX_MELODY_NOTES_PER_BAR,
  MELODY_NOTE_GAIN,
  MELODY_SCALE,
  MUSIC_BAR_SECONDS,
  MUSIC_CHORDS,
  PAD_NOTE_GAIN,
  planMusicBar,
} from './music';

test('each bar plays the next chord of the looping progression', () => {
  for (let bar = 0; bar < MUSIC_CHORDS.length * 2; bar++) {
    const plan = planMusicBar(bar, () => 0.99);
    assert.deepEqual(
      plan.pad.map((n) => n.freq),
      [...MUSIC_CHORDS[bar % MUSIC_CHORDS.length]]
    );
  }
});

test('melody stays in scale, inside the bar and at a gentle volume', () => {
  const rng = createSeededRng('music-test');
  let total = 0;
  for (let bar = 0; bar < 200; bar++) {
    const { pad, melody } = planMusicBar(bar, rng);
    assert.ok(melody.length <= MAX_MELODY_NOTES_PER_BAR);
    total += melody.length;
    for (const note of melody) {
      assert.ok(MELODY_SCALE.includes(note.freq));
      assert.ok(note.start >= 0 && note.start < MUSIC_BAR_SECONDS);
      assert.ok(note.gain > 0 && note.gain <= MELODY_NOTE_GAIN);
      assert.ok(note.duration > 0);
    }
    for (const note of pad) {
      assert.ok(note.gain <= PAD_NOTE_GAIN * 1.2);
    }
  }
  // Sparse but never silent for long: roughly 1–4 notes per bar on average.
  assert.ok(total > 200 && total < 800, `unexpected melody density: ${total}`);
});

test('the plan is deterministic for a given random source', () => {
  const a = planMusicBar(3, createSeededRng('same'));
  const b = planMusicBar(3, createSeededRng('same'));
  assert.deepEqual(a, b);
});

test('odd bar indexes fall back to the first chord instead of throwing', () => {
  assert.deepEqual(
    planMusicBar(Number.NaN, () => 0.99).pad.map((n) => n.freq),
    [...MUSIC_CHORDS[0]]
  );
  assert.deepEqual(
    planMusicBar(-4, () => 0.99).pad.map((n) => n.freq),
    [...MUSIC_CHORDS[0]]
  );
});
