import { getSettings } from './settings';

export type HapticKind =
  | 'tap'
  | 'swap'
  | 'invalid'
  | 'match'
  | 'special'
  | 'blast'
  | 'starstorm'
  | 'victory'
  | 'defeat';

/**
 * Vibration patterns in milliseconds (vibrate, pause, vibrate, ...).
 * Matches get slightly stronger the deeper the cascade goes.
 */
export function hapticPattern(kind: HapticKind, cascadeIndex = 1): number[] {
  switch (kind) {
    case 'tap':
      return [8];
    case 'swap':
      return [12];
    case 'invalid':
      return [30, 40, 30];
    case 'match': {
      const depth = Math.min(5, Math.max(1, Math.round(cascadeIndex)));
      return [10 + depth * 6];
    }
    case 'special':
      return [18, 30, 28];
    case 'blast':
      return [45];
    case 'starstorm':
      return [60, 50, 90, 50, 140];
    case 'victory':
      return [30, 60, 30, 60, 90];
    case 'defeat':
      return [120];
  }
}

export function isHapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function vibrate(kind: HapticKind, cascadeIndex = 1): void {
  if (!getSettings().haptics || !isHapticsSupported()) return;
  try {
    navigator.vibrate(hapticPattern(kind, cascadeIndex));
  } catch {
    // Some browsers throw when vibration is blocked by policy.
  }
}
