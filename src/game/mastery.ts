import { t } from '../i18n';
import { STORAGE_KEYS } from './storage';

export const MAX_STARS = 3;
export type StarCount = 1 | 2 | 3;
export const STARS_STORAGE_KEY = STORAGE_KEYS.stars;

export interface StarThresholds {
  two: number;
  three: number;
}

/**
 * Stars reward efficiency rather than raw score, so every level can be
 * three-starred by planning instead of by grinding a lucky cascade.
 * 2 stars: 15% of the move budget left. 3 stars: 30% left.
 */
export function getStarThresholds(totalMoves: number): StarThresholds {
  const moves = Math.max(1, Math.round(totalMoves));
  return {
    two: Math.max(1, Math.ceil(moves * 0.15)),
    three: Math.max(2, Math.ceil(moves * 0.3)),
  };
}

export function computeStars(movesLeft: number, totalMoves: number): StarCount {
  const thresholds = getStarThresholds(totalMoves);
  if (movesLeft >= thresholds.three) return 3;
  if (movesLeft >= thresholds.two) return 2;
  return 1;
}

export function mergeBestStars(
  current: Record<number, number>,
  levelId: number,
  stars: number
): Record<number, number> {
  if (!Number.isFinite(levelId) || stars < 1) return current;
  const nextStars = Math.min(MAX_STARS, Math.max(1, Math.round(stars)));
  const previous = current[levelId] ?? 0;
  if (nextStars <= previous) return current;
  return { ...current, [levelId]: nextStars };
}

export function readBestStars(): Record<number, number> {
  try {
    const raw = localStorage.getItem(STARS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Record<number, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const levelId = Number(key);
      const stars = Number(value);
      if (Number.isInteger(levelId) && levelId > 0 && stars >= 1 && stars <= MAX_STARS) {
        result[levelId] = Math.round(stars);
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function writeBestStars(stars: Record<number, number>): void {
  try {
    localStorage.setItem(STARS_STORAGE_KEY, JSON.stringify(stars));
  } catch {
    // Storage can be unavailable in private mode; stars are cosmetic.
  }
}

export function nextStarGoal(movesLeft: number, totalMoves: number): string | null {
  const thresholds = getStarThresholds(totalMoves);
  if (movesLeft < thresholds.two) {
    return t('2 stjärnor vid {two} drag kvar · 3 vid {three}', {
      two: thresholds.two,
      three: thresholds.three,
    });
  }
  if (movesLeft < thresholds.three) {
    return t('3 stjärnor vid {three} drag kvar', { three: thresholds.three });
  }
  return null;
}
