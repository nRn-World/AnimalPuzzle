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

export function planMusicBar(barIndex: number, rng: RngFn = Math.random): MusicBar {
  const safeIndex = Number.isFinite(barIndex) ? Math.max(0, Math.floor(barIndex)) : 0;
  const chord = MUSIC_CHORDS[safeIndex % MUSIC_CHORDS.length];

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
    if (rng() >= MELODY_NOTE_PROBABILITY) continue;
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
