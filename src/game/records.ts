import { GameMode } from './types';

export type BestScoreMode = 'campaign' | 'daily' | 'endless';

export interface BestScores {
  campaign: number;
  daily: number;
  endless: number;
}

export const BEST_SCORE_STORAGE_KEYS: Record<BestScoreMode, string> = {
  campaign: 'kromatik_best_campaign',
  daily: 'kromatik_best_daily',
  endless: 'kromatik_best_endless',
};

export function bestScoreModeFor(mode: GameMode): BestScoreMode {
  return mode === 'daily' ? 'daily' : mode === 'endless' ? 'endless' : 'campaign';
}

export function nextBestScore(
  scores: BestScores,
  mode: GameMode,
  score: number
): { mode: BestScoreMode; previous: number; best: number; improved: boolean } {
  const target = bestScoreModeFor(mode);
  const previous = Number.isFinite(scores[target])
    ? Math.max(0, Math.round(scores[target]))
    : 0;
  const normalized = Number.isFinite(score) ? Math.max(0, Math.round(score)) : 0;
  const best = Math.max(previous, normalized);

  return {
    mode: target,
    previous,
    best,
    improved: best > previous,
  };
}
