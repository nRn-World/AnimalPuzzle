/**
 * Player-made tactical puzzles: build 8x8 boards with specials & obstacles,
 * test-play them immediately, and share them via compact URL links (?pussel=APZ1:...).
 */
import { createBoard, hasValidMoves, shuffleBoard } from './engine';
import {
  BOARD_SIZE,
  Board,
  GEM_META,
  GemColor,
  HOLE_HP,
  LevelConfig,
  LevelObjective,
  SpecialType,
} from './types';

export const CUSTOM_PUZZLE_PREFIX = 'APZ1:';
export const CUSTOM_PUZZLE_PARAM = 'pussel';
const BASE_PALETTE: GemColor[] = ['ruby', 'amber', 'emerald', 'cobalt', 'amethyst'];

export interface CustomCellSpec {
  row: number;
  col: number;
  color?: GemColor;
  special?: SpecialType;
  ice?: number;
  crate?: number;
  chain?: boolean;
  honey?: boolean;
  egg?: boolean;
  hole?: boolean;
}

export type CustomGoalKind = 'ice' | 'crate' | 'chain' | 'honey' | 'egg' | 'color';

export interface CustomPuzzleSpec {
  /** Player-chosen puzzle title (max 32 chars). */
  heading: string;
  moves: number;
  goalKind: CustomGoalKind;
  goalColor?: GemColor;
  goalTarget: number;
  cells: CustomCellSpec[];
}

export function createStarterCustomPuzzle(): CustomPuzzleSpec {
  return {
    heading: 'Min taktikbana',
    moves: 3,
    goalKind: 'ice',
    goalTarget: 8,
    cells: [
      { row: 3, col: 1, ice: 1 },
      { row: 3, col: 2, ice: 1 },
      { row: 3, col: 5, ice: 1 },
      { row: 3, col: 6, ice: 1 },
      { row: 1, col: 3, ice: 1 },
      { row: 2, col: 3, ice: 1 },
      { row: 5, col: 3, ice: 1 },
      { row: 6, col: 3, ice: 1 },
      { row: 3, col: 3, special: 'beam_h', ice: 1 },
      { row: 3, col: 4, special: 'nova', ice: 1 },
    ],
  };
}

/** Counts obstacles on a custom puzzle so the editor can auto-suggest sensible targets. */
export function countCustomBoardItems(spec: CustomPuzzleSpec): Record<CustomGoalKind, number> {
  const counts: Record<CustomGoalKind, number> = {
    ice: 0,
    crate: 0,
    chain: 0,
    honey: 0,
    egg: 0,
    color: 10,
  };
  for (const c of spec.cells) {
    // Ice goals count broken layers, so a thick tile is worth two.
    if (c.ice && c.ice > 0) counts.ice += Math.min(2, c.ice);
    if (c.crate && c.crate > 0) counts.crate += 1;
    if (c.chain) counts.chain += 1;
    if (c.honey) counts.honey += 1;
    if (c.egg) counts.egg += 1;
  }
  return counts;
}

/** Fixed seed: a shared puzzle link must look the same for every player. */
function customBoardRng(): () => number {
  let state = 0x9e3779b9;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The generator only needs the board settings; the goals live in the spec. */
const CUSTOM_BOARD_NAME = 'custom';
const CUSTOM_BOARD_LEVEL: LevelConfig = {
  id: 999,
  name: CUSTOM_BOARD_NAME,
  subtitle: '',
  moves: 1,
  colorCount: BASE_PALETTE.length,
  palette: BASE_PALETTE,
  difficulty: 'hard',
  objectives: [],
};

export function buildCustomPuzzleBoard(spec: CustomPuzzleSpec): Board {
  // Start from the engine's generator: it never opens with a match and always
  // leaves at least one legal swap. The old fixed diagonal fill left every
  // custom puzzle deadlocked from move one.
  const board = createBoard(CUSTOM_BOARD_LEVEL, customBoardRng());

  for (const p of spec.cells) {
    if (p.row < 0 || p.row >= BOARD_SIZE || p.col < 0 || p.col >= BOARD_SIZE) continue;
    const cell = board[p.row][p.col];
    if (p.ice && p.ice > 0) cell.ice = Math.min(2, Math.round(p.ice));
    if (p.hole) {
      cell.block = 'hole';
      cell.crate = HOLE_HP;
      cell.gem = null;
      continue;
    }
    if (p.honey) {
      cell.block = 'honey';
      cell.crate = 1;
      cell.gem = null;
      continue;
    }
    if (p.crate && p.crate > 0) {
      cell.crate = Math.min(2, Math.round(p.crate));
      cell.gem = null;
      continue;
    }
    if (cell.gem) {
      if (p.color && BASE_PALETTE.includes(p.color)) cell.gem.color = p.color;
      if (p.special && p.special !== 'none') cell.gem.special = p.special;
      if (p.chain) cell.gem.chained = true;
      if (p.egg) cell.gem.egg = true;
    }
  }

  // Painted holes, crates and colours can still corner a board.
  return hasValidMoves(board) ? board : shuffleBoard(board, BASE_PALETTE, customBoardRng());
}

export function customPuzzleToLevel(spec: CustomPuzzleSpec): LevelConfig {
  const goalColor = spec.goalColor && BASE_PALETTE.includes(spec.goalColor) ? spec.goalColor : 'ruby';
  const target = Math.max(1, Math.min(50, Math.round(spec.goalTarget)));
  let obj: LevelObjective;
  switch (spec.goalKind) {
    case 'ice':
      obj = { id: 'c_ice', kind: 'ice', label: 'Tina is', target };
      break;
    case 'crate':
      obj = { id: 'c_crate', kind: 'crate', label: 'Krossa lådor', target };
      break;
    case 'chain':
      obj = { id: 'c_chain', kind: 'chain', label: 'Bryt kedjor', target };
      break;
    case 'honey':
      obj = { id: 'c_honey', kind: 'honey', label: 'Rensa honung', target };
      break;
    case 'egg':
      obj = { id: 'c_egg', kind: 'egg', label: 'Samla ägg', target };
      break;
    case 'color':
      obj = {
        id: 'c_color',
        kind: 'color',
        color: goalColor,
        label: GEM_META[goalColor].nameSv,
        target,
      };
      break;
  }

  return {
    id: 999,
    name: spec.heading.trim().slice(0, 32) || 'Egen bana',
    subtitle: 'Egen taktikbana',
    moves: Math.max(1, Math.min(15, Math.round(spec.moves))),
    colorCount: BASE_PALETTE.length,
    palette: BASE_PALETTE,
    difficulty: 'hard',
    objectives: [obj],
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 =
    typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(encoded: string): Uint8Array | null {
  try {
    const clean = encoded.trim().replace(/-/g, '+').replace(/_/g, '/');
    const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4);
    if (typeof atob === 'function') {
      const bin = atob(padded);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return new Uint8Array(Buffer.from(padded, 'base64'));
  } catch {
    return null;
  }
}

const VALID_SPECIALS: SpecialType[] = ['none', 'beam_h', 'beam_v', 'nova', 'scout', 'prism'];
const VALID_GOALS: CustomGoalKind[] = ['ice', 'crate', 'chain', 'honey', 'egg', 'color'];

export function encodeCustomPuzzle(spec: CustomPuzzleSpec): string {
  const compact = {
    h: spec.heading.trim().slice(0, 32) || 'Egen bana',
    m: Math.max(1, Math.min(15, Math.round(spec.moves))),
    g: spec.goalKind,
    ...(spec.goalKind === 'color' && spec.goalColor ? { gc: spec.goalColor } : {}),
    t: Math.max(1, Math.min(50, Math.round(spec.goalTarget))),
    c: spec.cells.map((cell) => {
      const out: Record<string, unknown> = { r: cell.row, c: cell.col };
      if (cell.color) out.k = cell.color;
      if (cell.special && cell.special !== 'none') out.s = cell.special;
      if (cell.ice) out.i = cell.ice;
      if (cell.crate) out.x = cell.crate;
      if (cell.chain) out.n = 1;
      if (cell.honey) out.y = 1;
      if (cell.egg) out.e = 1;
      if (cell.hole) out.o = 1;
      return out;
    }),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  return `${CUSTOM_PUZZLE_PREFIX}${toBase64Url(bytes)}`;
}

export function decodeCustomPuzzle(code: string): CustomPuzzleSpec | null {
  const trimmed = code.trim();
  if (!trimmed.startsWith(CUSTOM_PUZZLE_PREFIX)) return null;
  const bytes = fromBase64Url(trimmed.slice(CUSTOM_PUZZLE_PREFIX.length));
  if (!bytes) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!VALID_GOALS.includes(obj.g as CustomGoalKind)) return null;
  if (!Array.isArray(obj.c)) return null;

  const cells: CustomCellSpec[] = [];
  for (const item of obj.c) {
    if (!item || typeof item !== 'object') continue;
    const it = item as Record<string, unknown>;
    const row = typeof it.r === 'number' ? Math.round(it.r) : -1;
    const col = typeof it.c === 'number' ? Math.round(it.c) : -1;
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) continue;
    const spec: CustomCellSpec = { row, col };
    if (typeof it.k === 'string' && BASE_PALETTE.includes(it.k as GemColor)) {
      spec.color = it.k as GemColor;
    }
    if (typeof it.s === 'string' && VALID_SPECIALS.includes(it.s as SpecialType) && it.s !== 'none') {
      spec.special = it.s as SpecialType;
    }
    if (typeof it.i === 'number' && it.i > 0) spec.ice = Math.min(2, Math.round(it.i));
    if (typeof it.x === 'number' && it.x > 0) spec.crate = Math.min(2, Math.round(it.x));
    if (it.n) spec.chain = true;
    if (it.y) spec.honey = true;
    if (it.e) spec.egg = true;
    if (it.o) spec.hole = true;
    cells.push(spec);
  }

  return {
    heading: typeof obj.h === 'string' && obj.h.trim() ? obj.h.trim().slice(0, 32) : 'Egen bana',
    moves:
      typeof obj.m === 'number' && Number.isFinite(obj.m)
        ? Math.max(1, Math.min(15, Math.round(obj.m)))
        : 3,
    goalKind: obj.g as CustomGoalKind,
    goalColor:
      typeof obj.gc === 'string' && BASE_PALETTE.includes(obj.gc as GemColor)
        ? (obj.gc as GemColor)
        : undefined,
    goalTarget:
      typeof obj.t === 'number' && Number.isFinite(obj.t)
        ? Math.max(1, Math.min(50, Math.round(obj.t)))
        : 5,
    cells,
  };
}

export function customPuzzleUrl(baseUrl: string, spec: CustomPuzzleSpec): string {
  const url = new URL(baseUrl);
  url.searchParams.set(CUSTOM_PUZZLE_PARAM, encodeCustomPuzzle(spec));
  return url.toString();
}

export function parseCustomPuzzleFromSearch(search: string): CustomPuzzleSpec | null {
  try {
    const params = new URLSearchParams(search);
    const raw = params.get(CUSTOM_PUZZLE_PARAM);
    if (!raw) return null;
    return decodeCustomPuzzle(raw);
  } catch {
    return null;
  }
}
