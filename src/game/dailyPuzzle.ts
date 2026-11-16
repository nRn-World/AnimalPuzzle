/**
 * Daily 2–3 move tactical puzzles: zero-luck, handcrafted boards where
 * clever special-piece combos solve every objective within a tight move limit.
 */
import { createSeededRng } from './daily';
import { allocGemId } from './engine';
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import {
  BOARD_SIZE,
  Board,
  Cell,
  Coord,
  GemColor,
  HOLE_HP,
  LevelConfig,
  SpecialType,
} from './types';

export const DAILY_PUZZLE_REWARD_ENERGY = 35;

export interface PuzzleCellPatch {
  row: number;
  col: number;
  color?: GemColor;
  special?: SpecialType;
  ice?: number;
  crate?: number;
  block?: 'hole' | 'honey';
  chained?: boolean;
  egg?: boolean;
  bomb?: number;
}

export interface TacticalPuzzleSpec {
  id: string;
  nameSv: string;
  descSv: string;
  moves: number;
  objectives: LevelConfig['objectives'];
  patches: PuzzleCellPatch[];
  /** Verified sequence of swaps that solves the puzzle. */
  solution: Array<[Coord, Coord]>;
}

export interface DailyPuzzleInstance {
  dateKey: string;
  spec: TacticalPuzzleSpec;
  level: LevelConfig;
  seed: string;
}

export interface DailyPuzzleSaveState {
  solvedDates: string[];
  totalSolved: number;
}

const BASE_PALETTE: GemColor[] = ['ruby', 'amber', 'emerald', 'cobalt', 'amethyst'];

/**
 * Builds an 8x8 board guaranteed to have zero accidental matches before
 * puzzle-specific patches are applied.
 */
export function buildPuzzleBoard(spec: TacticalPuzzleSpec): Board {
  const board: Board = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      const color = BASE_PALETTE[(r * 2 + c) % BASE_PALETTE.length];
      row.push({
        row: r,
        col: c,
        gem: {
          id: allocGemId(),
          color,
          special: 'none',
          chained: false,
        },
        ice: 0,
        crate: 0,
      });
    }
    board.push(row);
  }

  for (const p of spec.patches) {
    const cell = board[p.row][p.col];
    if (p.ice !== undefined) cell.ice = p.ice;
    if (p.block === 'hole') {
      cell.block = 'hole';
      cell.crate = HOLE_HP;
      cell.gem = null;
      continue;
    }
    if (p.block === 'honey') {
      cell.block = 'honey';
      cell.crate = 1;
      cell.gem = null;
      continue;
    }
    if (p.crate !== undefined && p.crate > 0) {
      cell.crate = p.crate;
      cell.gem = null;
      continue;
    }
    if (cell.gem) {
      if (p.color) cell.gem.color = p.color;
      if (p.special) cell.gem.special = p.special;
      if (p.chained) cell.gem.chained = true;
      if (p.egg) cell.gem.egg = true;
      if (p.bomb !== undefined) cell.gem.bomb = p.bomb;
    }
  }

  return board;
}

export const TACTICAL_PUZZLES: readonly TacticalPuzzleSpec[] = [
  {
    id: 'crossfire',
    nameSv: 'Korseld',
    descSv: 'Kombinera två strålar i mitten för att rensa hela korset av is!',
    moves: 2,
    objectives: [{ id: 'p_ice', kind: 'ice', label: 'Tina is', target: 10 }],
    patches: [
      // Cross of 11 ice cells along row 4 and col 4
      { row: 4, col: 0, ice: 1 },
      { row: 4, col: 1, ice: 1 },
      { row: 4, col: 2, ice: 1 },
      { row: 4, col: 3, ice: 1 },
      { row: 4, col: 5, ice: 1 },
      { row: 4, col: 6, ice: 1 },
      { row: 4, col: 7, ice: 1 },
      { row: 1, col: 4, ice: 1 },
      { row: 2, col: 4, ice: 1 },
      { row: 6, col: 4, ice: 1 },
      { row: 7, col: 4, ice: 1 },
      // Two beams right next to each other at (4,3) and (4,4)
      { row: 4, col: 3, special: 'beam_h', ice: 1 },
      { row: 4, col: 4, special: 'beam_v', ice: 1 },
    ],
    solution: [[{ row: 4, col: 3 }, { row: 4, col: 4 }]],
  },
  {
    id: 'supernova-vault',
    nameSv: 'Supernovavalvet',
    descSv: 'Slå ihop två Novor för en 5×5-explosion mitt i isfästningen!',
    moves: 2,
    objectives: [{ id: 'p_ice', kind: 'ice', label: 'Tina is', target: 16 }],
    patches: [
      // 5x5 ice block centered around (3,3)
      ...Array.from({ length: 5 }, (_, dr) =>
        Array.from({ length: 5 }, (_, dc) => ({
          row: 1 + dr,
          col: 1 + dc,
          ice: 1,
        }))
      ).flat(),
      { row: 3, col: 3, special: 'nova', ice: 1 },
      { row: 3, col: 4, special: 'nova', ice: 1 },
    ],
    solution: [[{ row: 3, col: 3 }, { row: 3, col: 4 }]],
  },
  {
    id: 'egg-express',
    nameSv: 'Äggexpressen',
    descSv: 'Rensa kolumnen under guldäggen med en lodrät stråle!',
    moves: 2,
    objectives: [{ id: 'p_egg', kind: 'egg', label: 'Samla ägg', target: 2 }],
    patches: [
      // Two eggs stacked in column 3, plus vertical beam + horizontal beam at bottom
      { row: 4, col: 3, egg: true },
      { row: 5, col: 3, egg: true },
      { row: 6, col: 3, special: 'beam_v' },
      { row: 6, col: 4, special: 'beam_h' },
      { row: 7, col: 3, color: 'ruby' },
    ],
    solution: [[{ row: 6, col: 4 }, { row: 6, col: 3 }]],
  },
  {
    id: 'chain-breaker',
    nameSv: 'Kedjebrytaren',
    descSv: 'Skapa en stråle eller kombinera specialbrickor för att krossa alla kedjor i ett drag!',
    moves: 2,
    objectives: [{ id: 'p_chain', kind: 'chain', label: 'Bryt kedjor', target: 6 }],
    patches: [
      { row: 4, col: 0, chained: true },
      { row: 4, col: 1, chained: true },
      { row: 4, col: 2, chained: true },
      { row: 4, col: 5, chained: true },
      { row: 4, col: 6, chained: true },
      { row: 4, col: 7, chained: true },
      { row: 4, col: 3, special: 'beam_h' },
      { row: 4, col: 4, special: 'nova' },
    ],
    solution: [[{ row: 4, col: 3 }, { row: 4, col: 4 }]],
  },
  {
    id: 'honey-starburst',
    nameSv: 'Honungsstjärnan',
    descSv: 'Utlös Stjärnfall (Nova + Stråle) för att rensa all honung innan den sprider sig!',
    moves: 2,
    objectives: [{ id: 'p_honey', kind: 'honey', label: 'Rensa honung', target: 8 }],
    patches: [
      { row: 3, col: 1, block: 'honey' },
      { row: 3, col: 6, block: 'honey' },
      { row: 4, col: 1, block: 'honey' },
      { row: 4, col: 6, block: 'honey' },
      { row: 1, col: 3, block: 'honey' },
      { row: 1, col: 4, block: 'honey' },
      { row: 6, col: 3, block: 'honey' },
      { row: 6, col: 4, block: 'honey' },
      { row: 4, col: 3, special: 'nova' },
      { row: 4, col: 4, special: 'beam_h' },
    ],
    solution: [[{ row: 4, col: 3 }, { row: 4, col: 4 }]],
  },
  {
    id: 'scout-snipers',
    nameSv: 'Flygarflocken',
    descSv: 'Byt två flygare med varandra så jagar tre flygare upp lådorna i hörnen!',
    moves: 2,
    objectives: [{ id: 'p_crate', kind: 'crate', label: 'Krossa lådor', target: 3 }],
    patches: [
      { row: 0, col: 0, crate: 1 },
      { row: 0, col: 7, crate: 1 },
      { row: 7, col: 7, crate: 1 },
      { row: 4, col: 3, special: 'scout' },
      { row: 4, col: 4, special: 'scout' },
    ],
    solution: [[{ row: 4, col: 3 }, { row: 4, col: 4 }]],
  },
  {
    id: 'prism-storm',
    nameSv: 'Prismastormen',
    descSv: 'Rensa bort hindret mellan prismorna eller kombinera dem direkt för total rensning!',
    moves: 2,
    objectives: [
      { id: 'p_ice', kind: 'ice', label: 'Tina is', target: 8 },
      { id: 'p_crate', kind: 'crate', label: 'Krossa lådor', target: 4 },
    ],
    patches: [
      { row: 0, col: 0, crate: 1 },
      { row: 0, col: 7, crate: 1 },
      { row: 7, col: 0, crate: 1 },
      { row: 7, col: 7, crate: 1 },
      { row: 1, col: 2, ice: 1 },
      { row: 1, col: 5, ice: 1 },
      { row: 2, col: 2, ice: 1 },
      { row: 2, col: 5, ice: 1 },
      { row: 5, col: 2, ice: 1 },
      { row: 5, col: 5, ice: 1 },
      { row: 6, col: 2, ice: 1 },
      { row: 6, col: 5, ice: 1 },
      // Match three rubies at (4,3),(4,4),(4,5) by moving (3,4) down? Better: prism at (4,3) and prism at (4,4)
      { row: 4, col: 3, special: 'prism' },
      { row: 4, col: 4, special: 'prism' },
    ],
    solution: [[{ row: 4, col: 3 }, { row: 4, col: 4 }]],
  },
  {
    id: 'twin-drop',
    nameSv: 'Tvåstegs-raketen',
    descSv: 'Gör först en matchning som flyttar strålen i läge, och kombinera den sedan med Novan!',
    moves: 3,
    objectives: [{ id: 'p_ice', kind: 'ice', label: 'Tina is', target: 12 }],
    patches: [
      // Ice across rows 3, 4, 5 and cols 3, 4, 5 (14 cells)
      { row: 3, col: 0, ice: 1 },
      { row: 3, col: 1, ice: 1 },
      { row: 3, col: 2, ice: 1 },
      { row: 4, col: 0, ice: 1 },
      { row: 4, col: 1, ice: 1 },
      { row: 4, col: 6, ice: 1 },
      { row: 4, col: 7, ice: 1 },
      { row: 5, col: 0, ice: 1 },
      { row: 5, col: 1, ice: 1 },
      { row: 5, col: 6, ice: 1 },
      { row: 5, col: 7, ice: 1 },
      { row: 0, col: 4, ice: 1 },
      { row: 1, col: 4, ice: 1 },
      { row: 7, col: 4, ice: 1 },
      { row: 3, col: 3, special: 'beam_h', color: 'amethyst' },
      { row: 4, col: 4, special: 'nova', color: 'emerald' },
      // Swap (4,3) cobalt with (5,3) amber -> horizontal 3-amber at (4,1),(4,2),(4,3).
      // Clears 1 cell in col 3 -> (3,3) beam_h falls 1 row to (4,3), right next to (4,4) nova!
      { row: 4, col: 1, color: 'amber', ice: 1 },
      { row: 4, col: 2, color: 'amber' },
      { row: 4, col: 3, color: 'cobalt' },
      { row: 5, col: 3, color: 'amber' },
      { row: 4, col: 0, color: 'emerald', ice: 1 },
      { row: 3, col: 1, color: 'cobalt', ice: 1 },
      { row: 3, col: 2, color: 'ruby', ice: 1 },
      { row: 5, col: 1, color: 'ruby', ice: 1 },
      { row: 5, col: 2, color: 'cobalt' },
      { row: 5, col: 4, color: 'ruby' },
      { row: 6, col: 3, color: 'emerald' },
    ],
    solution: [
      [{ row: 4, col: 3 }, { row: 5, col: 3 }],
      [{ row: 4, col: 3 }, { row: 4, col: 4 }],
    ],
  },
  {
    id: 'bomb-defusal',
    nameSv: 'Desarmeringen',
    descSv: 'Kombinera Prisma med rävarnas färg för att desarmera alla bomber på en gång!',
    moves: 2,
    objectives: [
      { id: 'p_ruby', kind: 'color', color: 'ruby', label: 'Samla Rävar', target: 9 },
    ],
    patches: [
      { row: 0, col: 1, color: 'ruby', bomb: 2 },
      { row: 0, col: 6, color: 'ruby', bomb: 2 },
      { row: 7, col: 1, color: 'ruby', bomb: 2 },
      { row: 7, col: 6, color: 'ruby', bomb: 2 },
      { row: 2, col: 3, color: 'ruby' },
      { row: 2, col: 5, color: 'ruby' },
      { row: 5, col: 2, color: 'ruby' },
      { row: 5, col: 5, color: 'ruby' },
      { row: 4, col: 3, special: 'prism', color: 'amethyst' },
      { row: 4, col: 4, color: 'ruby' },
    ],
    solution: [[{ row: 4, col: 3 }, { row: 4, col: 4 }]],
  },
  {
    id: 'prism-beam-sweep',
    nameSv: 'Strålregnet',
    descSv: 'Para ihop Prismat med en Stråle – varje djur i färgen förvandlas till en egen stråle!',
    moves: 2,
    objectives: [{ id: 'p_crate', kind: 'crate', label: 'Krossa lådor', target: 6 }],
    patches: [
      { row: 1, col: 1, crate: 1 },
      { row: 1, col: 6, crate: 1 },
      { row: 3, col: 1, crate: 1 },
      { row: 3, col: 6, crate: 1 },
      { row: 6, col: 1, crate: 1 },
      { row: 6, col: 6, crate: 1 },
      // Place cobalt gems spaced out on rows 1, 3, 6 so prism + cobalt beam hits every crate!
      { row: 1, col: 2, color: 'cobalt' },
      { row: 1, col: 5, color: 'cobalt' },
      { row: 2, col: 4, color: 'ruby' },
      { row: 3, col: 2, color: 'cobalt' },
      { row: 3, col: 5, color: 'cobalt' },
      { row: 4, col: 5, color: 'emerald' },
      { row: 6, col: 2, color: 'cobalt' },
      { row: 6, col: 5, color: 'cobalt' },
      { row: 4, col: 3, special: 'prism', color: 'amethyst' },
      { row: 4, col: 4, special: 'beam_h', color: 'cobalt' },
    ],
    solution: [[{ row: 4, col: 3 }, { row: 4, col: 4 }]],
  },
];

export function getDailyPuzzle(dateKey: string): DailyPuzzleInstance {
  const rng = createSeededRng(`animalpuzzle-puzzle-${dateKey}`);
  const idx = Math.floor(rng() * TACTICAL_PUZZLES.length);
  const spec = TACTICAL_PUZZLES[idx];
  const level: LevelConfig = {
    id: 900 + idx,
    name: spec.nameSv,
    subtitle: spec.descSv,
    moves: spec.moves,
    colorCount: BASE_PALETTE.length,
    palette: BASE_PALETTE,
    difficulty: 'hard',
    objectives: spec.objectives,
  };
  return {
    dateKey,
    spec,
    level,
    seed: `animalpuzzle-puzzle-play-${dateKey}`,
  };
}

export function createInitialDailyPuzzleState(): DailyPuzzleSaveState {
  return { solvedDates: [], totalSolved: 0 };
}

export function sanitizeDailyPuzzleState(raw: unknown): DailyPuzzleSaveState {
  if (!raw || typeof raw !== 'object') return createInitialDailyPuzzleState();
  const obj = raw as Record<string, unknown>;
  const solvedDates = Array.isArray(obj.solvedDates)
    ? Array.from(new Set(obj.solvedDates.filter((d): d is string => typeof d === 'string'))).slice(-90)
    : [];
  const totalSolved =
    typeof obj.totalSolved === 'number' && Number.isFinite(obj.totalSolved)
      ? Math.max(solvedDates.length, Math.round(obj.totalSolved))
      : solvedDates.length;
  return { solvedDates, totalSolved };
}

export function isDailyPuzzleSolved(state: DailyPuzzleSaveState, dateKey: string): boolean {
  return state.solvedDates.includes(dateKey);
}

export function markDailyPuzzleSolved(
  state: DailyPuzzleSaveState,
  dateKey: string
): { nextState: DailyPuzzleSaveState; newlySolved: boolean } {
  if (state.solvedDates.includes(dateKey)) {
    return { nextState: state, newlySolved: false };
  }
  return {
    newlySolved: true,
    nextState: {
      solvedDates: [...state.solvedDates, dateKey].slice(-90),
      totalSolved: state.totalSolved + 1,
    },
  };
}

export function readDailyPuzzleState(): DailyPuzzleSaveState {
  return sanitizeDailyPuzzleState(readJson(STORAGE_KEYS.dailyPuzzle));
}

export function writeDailyPuzzleState(state: DailyPuzzleSaveState): void {
  writeJson(STORAGE_KEYS.dailyPuzzle, state);
}
