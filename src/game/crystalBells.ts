export interface CrystalBellNote {
  freq: number;
  overtoneRatio: number;
  delay: number;
  duration: number;
  gain: number;
  pan: number;
}

// High-register crystalline lydian/pentatonic pitches (G6..G7)
export const CRYSTAL_BELL_FREQS = [
  1567.98, // G6
  1760.0,  // A6
  1975.53, // B6
  2093.0,  // C7
  2349.32, // D7
  2637.02, // E7
  2959.96, // F#7
  3135.96, // G7
] as const;

export const CRYSTAL_BELL_TRIGGER_PROBABILITY = 0.72;

export type RngFn = () => number;

/**
 * Plans discreet background crystal bell chimes when a cascade starts (cascadeIndex === 2).
 * Returns an empty array if this step is not the start of a cascade or if the random roll skips activation.
 */
export function planCrystalBellChimes(
  cascadeIndex: number,
  rng: RngFn = Math.random
): CrystalBellNote[] {
  // Only consider activation right when a chain reaction (cascade) starts
  if (cascadeIndex !== 2) {
    return [];
  }

  // Random activation gate
  if (rng() >= CRYSTAL_BELL_TRIGGER_PROBABILITY) {
    return [];
  }

  // Pick 2 to 4 delicate chimes
  const noteCount = 2 + Math.floor(rng() * 3);
  const notes: CrystalBellNote[] = [];

  let cursorDelay = 0.04 + rng() * 0.05;
  let lastFreqIdx = -1;

  for (let i = 0; i < noteCount; i++) {
    let freqIdx = Math.floor(rng() * CRYSTAL_BELL_FREQS.length);
    if (freqIdx === lastFreqIdx) {
      freqIdx = (freqIdx + 1 + Math.floor(rng() * 2)) % CRYSTAL_BELL_FREQS.length;
    }
    lastFreqIdx = freqIdx;

    // Subtle crystalline detune (+-1%) so repeated chimes stay organic
    const detune = 0.992 + rng() * 0.016;
    const freq = CRYSTAL_BELL_FREQS[freqIdx] * detune;

    // Classic glassy/bell vibrational partial (~2.756x, varied subtly)
    const overtoneRatio = 2.72 + rng() * 0.08;
    const duration = 0.85 + rng() * 0.45;
    // Discreet background gain ceiling
    const gain = 0.016 + rng() * 0.012;
    const pan = (rng() * 2 - 1) * 0.55;

    notes.push({
      freq,
      overtoneRatio,
      delay: cursorDelay,
      duration,
      gain,
      pan,
    });

    cursorDelay += 0.09 + rng() * 0.11;
  }

  return notes;
}
