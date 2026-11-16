/**
 * Fever (Frenzy) Mode: chaining cascades and special combos charges a meter
 * up to 100%, igniting 3 blazing moves of ×2 score with golden board energy.
 */
import { ComboType } from './types';

export const FEVER_MAX_CHARGE = 100;
export const FEVER_DURATION_MOVES = 3;
export const FEVER_SCORE_MULTIPLIER = 2;

export interface FeverState {
  charge: number;
  movesLeft: number;
}

export function createInitialFever(): FeverState {
  return { charge: 0, movesLeft: 0 };
}

export function isFeverActive(state: FeverState): boolean {
  return state.movesLeft > 0;
}

export function feverMultiplier(state: FeverState): number {
  return state.movesLeft > 0 ? FEVER_SCORE_MULTIPLIER : 1;
}

export interface FeverMoveInput {
  peakCascade: number;
  specialsCreated: number;
  combo: ComboType | null;
}

/**
 * Computes the next Fever state after one resolved move.
 * - While inactive, cascades/specials/combos charge the meter; hitting 100
 *   immediately ignites Fever Mode for `FEVER_DURATION_MOVES` upcoming moves.
 * - While active, each move consumes 1 fever move (a huge ×3+ cascade or combo
 *   extends it by +1 up to `FEVER_DURATION_MOVES` so great play feels unstoppable!).
 */
export function advanceFever(
  state: FeverState,
  input: FeverMoveInput
): { nextState: FeverState; triggered: boolean; bonusCharge: number } {
  if (state.movesLeft > 0) {
    const extend = input.combo !== null || input.peakCascade >= 3 ? 1 : 0;
    const remaining = Math.min(FEVER_DURATION_MOVES, Math.max(0, state.movesLeft - 1 + extend));
    return {
      nextState: { charge: remaining > 0 ? FEVER_MAX_CHARGE : 0, movesLeft: remaining },
      triggered: false,
      bonusCharge: 0,
    };
  }

  let gain = 6;
  if (input.peakCascade >= 2) gain += (input.peakCascade - 1) * 18;
  gain += input.specialsCreated * 16;
  if (input.combo) gain += 30;

  const total = state.charge + gain;
  if (total >= FEVER_MAX_CHARGE) {
    return {
      nextState: { charge: FEVER_MAX_CHARGE, movesLeft: FEVER_DURATION_MOVES },
      triggered: true,
      bonusCharge: gain,
    };
  }

  return {
    nextState: { charge: total, movesLeft: 0 },
    triggered: false,
    bonusCharge: gain,
  };
}
