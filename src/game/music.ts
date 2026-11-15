/**
 * Planner for the generative background music: a slow four-chord pad with a
 * sparse pentatonic melody on top. It is pure data (no Web Audio) so the
 * shape of the music can be unit tested; `audio.ts` turns the plan into sound.
 */

export interface MusicNote {
  freq: number;
  /** Seconds from the start of the bar. */
  start: number;
  duration: number;
  /** Peak gain before the music bus volume is applied. */
  gain: number;
}

export interface MusicBar {
  pad: MusicNote[];
  melody: MusicNote[];
}

export type RngFn = () => number;

export const MUSIC_BAR_SECONDS = 6;
export const MELODY_SLOTS_PER_BAR = 8;
export const MAX_MELODY_NOTES_PER_BAR = 4;
export const MELODY_NOTE_PROBABILITY = 0.34;
export const PAD_NOTE_GAIN = 0.032;
export const MELODY_NOTE_GAIN = 0.045;

// Am9 → Fmaj7 → Cmaj7 → G6: calm, unresolved, loops without a hard cadence.
export const MUSIC_CHORDS: ReadonlyArray<ReadonlyArray<number>> = [
  [110.0, 164.81, 261.63, 392.0],
  [87.31, 130.81, 220.0, 329.63],
  [130.81, 196.0, 246.94, 329.63],
  [98.0, 146.83, 246.94, 329.63],
];

// C major pentatonic, C5..C6: every note fits every chord above.
export const MELODY_SCALE: ReadonlyArray<number> = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

export interface MusicTheme {
  chords: ReadonlyArray<ReadonlyArray<number>>;
  scale: ReadonlyArray<number>;
  /** Chance that a melody slot gets a note: higher = busier. */
  noteProbability: number;
}

export type MusicThemeId = 'skargard' | 'ang' | 'oken' | 'vinter' | 'rymden' | 'vulkan';

/** One mood per landscape. Every scale note fits every chord of its theme. */
export const MUSIC_THEMES: Record<MusicThemeId, MusicTheme> = {
  // The original calm tune: menus and the archipelago.
  skargard: { chords: MUSIC_CHORDS, scale: MELODY_SCALE, noteProbability: MELODY_NOTE_PROBABILITY },
  // Bright and busy: C – G – Am – F.
  ang: {
    chords: [
      [130.81, 196.0, 261.63, 329.63],
      [98.0, 146.83, 246.94, 392.0],
      [110.0, 164.81, 261.63, 329.63],
      [87.31, 130.81, 220.0, 349.23],
    ],
    scale: [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5],
    noteProbability: 0.46,
  },
  // Open fifths under a double harmonic scale.
  oken: {
    chords: [
      [82.41, 123.47, 164.81, 246.94],
      [87.31, 130.81, 174.61, 261.63],
      [82.41, 123.47, 164.81, 246.94],
      [110.0, 164.81, 220.0, 329.63],
    ],
    scale: [329.63, 349.23, 415.3, 440.0, 493.88, 523.25, 659.25],
    noteProbability: 0.38,
  },
  // High, glassy and sparse: Dmaj7 – Bm7 – Gmaj7 – A.
  vinter: {
    chords: [
      [146.83, 220.0, 277.18, 369.99],
      [123.47, 185.0, 293.66, 440.0],
      [98.0, 146.83, 246.94, 369.99],
      [110.0, 164.81, 277.18, 329.63],
    ],
    scale: [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66],
    noteProbability: 0.26,
  },
  // Deep suspended chords with a few floating notes.
  rymden: {
    chords: [
      [65.41, 130.81, 196.0, 293.66],
      [73.42, 146.83, 220.0, 329.63],
      [58.27, 116.54, 174.61, 261.63],
      [65.41, 130.81, 196.0, 293.66],
    ],
    scale: [392.0, 523.25, 587.33, 783.99, 1046.5],
    noteProbability: 0.2,
  },
  // Minor and restless: Dm – Bb – Gm – A.
  vulkan: {
    chords: [
      [73.42, 146.83, 220.0, 349.23],
      [58.27, 116.54, 174.61, 293.66],
      [98.0, 146.83, 233.08, 293.66],
      [110.0, 164.81, 220.0, 329.63],
    ],
    scale: [293.66, 349.23, 440.0, 523.25, 587.33],
    noteProbability: 0.5,
  },
};

export function planMusicBar(
  barIndex: number,
  rng: RngFn = Math.random,
  theme: MusicTheme = MUSIC_THEMES.skargard
): MusicBar {
  const safeIndex = Number.isFinite(barIndex) ? Math.max(0, Math.floor(barIndex)) : 0;
  const chord = theme.chords[safeIndex % theme.chords.length];
  const MELODY_SCALE = theme.scale;

  // Pad notes ring two seconds into the next bar so chords cross-fade.
  const pad: MusicNote[] = chord.map((freq, i) => ({
    freq,
    start: i * 0.06,
    duration: MUSIC_BAR_SECONDS + 2,
    gain: PAD_NOTE_GAIN * (i === 0 ? 1.15 : 1),
  }));

  const melody: MusicNote[] = [];
  const slot = MUSIC_BAR_SECONDS / MELODY_SLOTS_PER_BAR;
  let scaleIdx = Math.floor(rng() * MELODY_SCALE.length);
  for (let s = 0; s < MELODY_SLOTS_PER_BAR; s++) {
    if (melody.length >= MAX_MELODY_NOTES_PER_BAR) break;
    if (rng() >= theme.noteProbability) continue;
    // Move by at most two scale steps so the line sounds sung, not random.
    const step = Math.floor(rng() * 5) - 2;
    scaleIdx = Math.min(MELODY_SCALE.length - 1, Math.max(0, scaleIdx + step));
    melody.push({
      freq: MELODY_SCALE[scaleIdx],
      start: s * slot,
      duration: 1.6 + rng() * 0.8,
      gain: MELODY_NOTE_GAIN * (0.7 + rng() * 0.3),
    });
  }

  return { pad, melody };
}
