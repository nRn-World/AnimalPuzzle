import { formatNumber, t } from '../i18n';
import { GameMode } from './types';

export interface ShareResultInput {
  mode: GameMode;
  /** True for a cleared level or daily challenge, false for a finished endless run. */
  won: boolean;
  levelNumber: number;
  levelName: string;
  dateKey: string;
  stars: number;
  score: number;
  maxCascade: number;
  url: string;
}

/** Builds the spoiler-free result text that gets shared or copied. */
export function buildShareText(input: ShareResultInput): string {
  const title =
    input.mode === 'daily'
      ? t('AnimalPuzzle · Dagens utmaning {date}', { date: input.dateKey })
      : input.mode === 'puzzle'
      ? t('AnimalPuzzle · Dagens pussel {date}', { date: input.dateKey })
      : input.mode === 'custom'
      ? t('AnimalPuzzle · Egen bana: {name}', { name: input.levelName })
      : input.mode === 'endless'
      ? t('AnimalPuzzle · Oändligt läge')
      : input.mode === 'blitz'
      ? t('AnimalPuzzle · Kan du slå mig på 60 sekunder?')
      : t('AnimalPuzzle · Nivå {n}: {name}', {
          n: input.levelNumber,
          name: t(input.levelName),
        });

  const parts: string[] = [];
  if (input.won) {
    const stars = Math.max(0, Math.min(3, Math.round(input.stars)));
    parts.push('⭐'.repeat(stars) + '☆'.repeat(3 - stars));
  }
  parts.push(t('{score} poäng', { score: formatNumber(input.score) }));
  if (input.maxCascade > 1) {
    parts.push(t('kedja ×{n}', { n: Math.round(input.maxCascade) }));
  }

  return [title, parts.join(' · '), input.url].filter(Boolean).join('\n');
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Uses the native share sheet when there is one, otherwise copies to the clipboard. */
export async function shareText(text: string): Promise<ShareOutcome> {
  if (typeof navigator === 'undefined') return 'failed';

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (err) {
      // Closing the share sheet is not an error worth a fallback.
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return 'copied';
    }
  } catch {
    // Clipboard access denied: fall through.
  }
  return 'failed';
}

/** Address of the game itself, without query string or hash. */
export function getShareUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}`;
}
