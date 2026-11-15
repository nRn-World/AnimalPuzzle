import { computeStars, StarCount } from './mastery';
import { Board } from './types';

export const MOVE_BONUS_POINTS = 120;
export const SPECIAL_BONUS_POINTS = 150;
export const ENDLESS_MILESTONE_STEP = 2500;
export const ENDLESS_MILESTONE_BONUS_MOVES = 5;

export interface VictoryBonus {
  leftoverSpecials: number;
  /** Points for special pieces still on the board. */
  specialBonus: number;
  /** Total "Harvest" bonus: unused moves plus leftover specials. */
  bonus: number;
  stars: StarCount;
}

/** The end-of-level bonus: every unused move and every saved special pays out. */
export function computeVictoryBonus(
  finalBoard: Board,
  movesLeft: number,
  totalMoves: number
): VictoryBonus {
  let leftoverSpecials = 0;
  for (const row of finalBoard) {
    for (const cell of row) {
      if (cell.gem && cell.gem.special !== 'none') leftoverSpecials++;
    }
  }
  const specialBonus = leftoverSpecials * SPECIAL_BONUS_POINTS;
  return {
    leftoverSpecials,
    specialBonus,
    bonus: Math.max(0, movesLeft) * MOVE_BONUS_POINTS + specialBonus,
    stars: computeStars(movesLeft, totalMoves),
  };
}

/**
 * Endless mode grants bonus moves each time the score passes a milestone.
 * One big cascade can pass several milestones at once.
 */
export function applyEndlessMilestones(
  score: number,
  movesLeft: number,
  nextMilestone: number
): { movesLeft: number; nextMilestone: number } {
  let moves = movesLeft;
  let milestone = Math.max(1, nextMilestone);
  while (score >= milestone) {
    moves += ENDLESS_MILESTONE_BONUS_MOVES;
    milestone += ENDLESS_MILESTONE_STEP;
  }
  return { movesLeft: moves, nextMilestone: milestone };
}

/** Swedish source string for the cheer shown after a cascade, or '' for none. */
export function cascadeCheer(peakCascade: number): string {
  if (peakCascade >= 5) return 'OTROLIGT!';
  if (peakCascade === 4) return 'MAGISKT!';
  if (peakCascade === 3) return 'SUPER!';
  if (peakCascade === 2) return 'KASKAD!';
  return '';
}
