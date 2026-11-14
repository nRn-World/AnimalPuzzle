import { allocGemId, findBestHint, findMatchGroups } from './engine';
import { BOARD_SIZE, Board, Cell, Coord, GameMode, GemColor } from './types';

export type TutorialStepId = 'step1' | 'step2' | 'done';

export interface TutorialPrompt {
  id: TutorialStepId;
  stepNumber: number;
  totalSteps: number;
  titleSv: string;
  instructionSv: string;
  from: Coord;
  to: Coord;
}

export const TUTORIAL_STORAGE_KEY = 'kromatik_tutorial_done';

export interface TutorialGateOptions {
  mode: GameMode;
  targetLevelIndex: number;
  tutorialDone: boolean;
  forceTutorial?: boolean;
  skipTutorial?: boolean;
}

/**
 * The interactive tutorial belongs to the first campaign level only. It may be
 * replayed explicitly with forceTutorial, but it must never replace another
 * level's board or restart after the player skips it.
 */
export function shouldRunTutorial({
  mode,
  targetLevelIndex,
  tutorialDone,
  forceTutorial = false,
  skipTutorial = false,
}: TutorialGateOptions): boolean {
  return (
    mode === 'campaign' &&
    targetLevelIndex === 0 &&
    !skipTutorial &&
    (forceTutorial || !tutorialDone)
  );
}

export const TUTORIAL_STEP1_PAIR: { from: Coord; to: Coord } = {
  from: { row: 1, col: 4 },
  to: { row: 1, col: 5 },
};

export const TUTORIAL_STEP2_PAIR: { from: Coord; to: Coord } = {
  from: { row: 5, col: 2 },
  to: { row: 5, col: 3 },
};

// Deterministic 8x8 color layout with 0 initial matches:
// - Step 1: swap (1,4) <-> (1,5) creates vertical ruby 3-match in col 5
// - Step 2: swap (5,2) <-> (5,3) clears 3 cobalts at row 5 (cols 0,1,2) and drops
//   two emeralds onto (5,3)-(5,4) for an automatic x2 cascade + Strale special!
const TUTORIAL_COLOR_MATRIX: GemColor[][] = [
  ['amber', 'emerald', 'amethyst', 'cobalt', 'amber', 'ruby', 'emerald', 'amethyst'],
  ['amethyst', 'ruby', 'amber', 'emerald', 'ruby', 'cobalt', 'amber', 'ruby'],
  ['emerald', 'cobalt', 'ruby', 'amethyst', 'cobalt', 'ruby', 'amethyst', 'amber'],
  ['amber', 'amethyst', 'ruby', 'amber', 'emerald', 'amber', 'cobalt', 'emerald'],
  ['ruby', 'emerald', 'emerald', 'amber', 'amethyst', 'ruby', 'amethyst', 'cobalt'],
  ['cobalt', 'cobalt', 'emerald', 'cobalt', 'emerald', 'amber', 'ruby', 'amethyst'],
  ['amber', 'ruby', 'amber', 'amethyst', 'amber', 'emerald', 'cobalt', 'ruby'],
  ['amethyst', 'amber', 'cobalt', 'ruby', 'cobalt', 'amethyst', 'amber', 'emerald'],
];

export function createTutorialBoard(): Board {
  const board: Board = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      row.push({
        row: r,
        col: c,
        ice: 0,
        crate: 0,
        gem: {
          id: allocGemId(),
          color: TUTORIAL_COLOR_MATRIX[r][c],
          special: 'none',
          chained: false,
        },
      });
    }
    board.push(row);
  }
  return board;
}

export function isMatchingTutorialSwap(
  a: Coord,
  b: Coord,
  targetFrom: Coord,
  targetTo: Coord
): boolean {
  return (
    (a.row === targetFrom.row &&
      a.col === targetFrom.col &&
      b.row === targetTo.row &&
      b.col === targetTo.col) ||
    (a.row === targetTo.row &&
      a.col === targetTo.col &&
      b.row === targetFrom.row &&
      b.col === targetFrom.col)
  );
}

export function resolveTutorialPrompt(
  step: TutorialStepId,
  board: Board
): TutorialPrompt | null {
  if (step === 'done') return null;

  if (step === 'step1') {
    return {
      id: 'step1',
      stepNumber: 1,
      totalSteps: 2,
      titleSv: 'Steg 1 av 2 · Grundläggande byte',
      instructionSv:
        'Peka och klicka på den utpekade räven och sedan på pingvinen bredvid (eller dra mellan dem) för att matcha 3 i rad.',
      from: TUTORIAL_STEP1_PAIR.from,
      to: TUTORIAL_STEP1_PAIR.to,
    };
  }

  const hasMatches = findMatchGroups(board).length > 0;
  const f = TUTORIAL_STEP2_PAIR.from;
  const t = TUTORIAL_STEP2_PAIR.to;
  const c0 = board[5]?.[0]?.gem?.color;
  const c1 = board[5]?.[1]?.gem?.color;
  const c2 = board[f.row]?.[f.col]?.gem?.color;
  const c3 = board[t.row]?.[t.col]?.gem?.color;

  if (!hasMatches && c0 === 'cobalt' && c1 === 'cobalt' && c3 === 'cobalt' && c2 === 'emerald') {
    return {
      id: 'step2',
      stepNumber: 2,
      totalSteps: 2,
      titleSv: 'Steg 2 av 2 · Kedjereaktion (Kaskad)',
      instructionSv:
        'Byt dessa två utpekade brickor så att fallande djur utlöser en automatisk kedjereaktion (×2+) och skapar en Stråle!',
      from: f,
      to: t,
    };
  }

  const hint = findBestHint(board);
  if (!hint) return null;
  return {
    id: 'step2',
    stepNumber: 2,
    totalSteps: 2,
    titleSv: 'Steg 2 av 2 · Kedjereaktion (Kaskad)',
    instructionSv:
      'Byt de två utpekade brickorna för att skapa en kedjereaktion och ladda dina taktiska verktyg!',
    from: hint.from,
    to: hint.to,
  };
}
