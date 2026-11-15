/**
 * Companions: the player brings one animal along. Clearing animals charges
 * its power, and every animal has a power of its own. The more of an animal
 * that has been collected, the higher its level and the faster it charges.
 */
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import { BOARD_SIZE, Board, Coord, GEM_COLORS_ORDER, GemColor } from './types';

export type PowerKind =
  | 'row'
  | 'columns'
  | 'cross'
  | 'diagonals'
  | 'area'
  | 'scatter'
  | 'color'
  | 'bottom'
  | 'thaw'
  | 'smash'
  | 'specials'
  | 'moves';

export interface CompanionDef {
  color: GemColor;
  power: PowerKind;
  powerSv: string;
  descSv: string;
}

export const COMPANIONS: CompanionDef[] = [
  { color: 'ruby', power: 'row', powerSv: 'Rävsprång', descSv: 'Springer längs en hel rad och rensar den' },
  { color: 'amber', power: 'cross', powerSv: 'Lejonvrål', descSv: 'Vrålar bort en rad och en kolumn i ett kors' },
  { color: 'emerald', power: 'scatter', powerSv: 'Grodhopp', descSv: 'Hoppar runt och rensar tio rutor' },
  { color: 'cobalt', power: 'columns', powerSv: 'Isglid', descSv: 'Glider nerför två kolumner och rensar dem' },
  { color: 'amethyst', power: 'specials', powerSv: 'Morotsregn', descSv: 'Gör tre djur till strålar' },
  { color: 'quartz', power: 'thaw', powerSv: 'Vårvärme', descSv: 'Tinar upp till tolv isrutor' },
  { color: 'tangerine', power: 'diagonals', powerSv: 'Tigerklös', descSv: 'River bort brädets båda diagonaler' },
  { color: 'lime', power: 'moves', powerSv: 'Lugn och ro', descSv: 'Ger dig tre extra drag' },
  { color: 'sky', power: 'bottom', powerSv: 'Flodvåg', descSv: 'Sköljer bort de två nedersta raderna' },
  { color: 'violet', power: 'area', powerSv: 'Pandarull', descSv: 'Rullar över ett stort fält mitt på brädet' },
  { color: 'rose', power: 'color', powerSv: 'Skarpsyn', descSv: 'Samlar in alla djur av den vanligaste sorten' },
  { color: 'mint', power: 'smash', powerSv: 'Bollkonst', descSv: 'Slår sönder upp till åtta lådor, kedjor och honung' },
];

export function getCompanion(color: GemColor): CompanionDef {
  return COMPANIONS.find((c) => c.color === color) ?? COMPANIONS[0];
}

/** The fox comes along from the start; the others join once 60 of them are collected. */
export const UNLOCK_AT = 60;
export const STARTER: GemColor = 'ruby';

export function isCompanionUnlocked(color: GemColor, album: Record<GemColor, number>): boolean {
  return color === STARTER || (album[color] ?? 0) >= UNLOCK_AT;
}

/** Animals collected to reach level 2, 3, 4 ... */
export const LEVEL_STEPS = [150, 400, 900, 1800, 3500, 6000, 10000, 16000, 25000];
export const MAX_LEVEL = LEVEL_STEPS.length + 1;

export function animalLevel(collected: number): { level: number; from: number; next: number | null } {
  let level = 1;
  for (const step of LEVEL_STEPS) {
    if (collected >= step) level++;
    else break;
  }
  return {
    level,
    from: level === 1 ? 0 : LEVEL_STEPS[level - 2],
    next: level > LEVEL_STEPS.length ? null : LEVEL_STEPS[level - 1],
  };
}

/** Charge needed for the power: 120 at level 1, four less per level. */
export function chargeNeeded(level: number): number {
  return Math.max(80, 120 - (Math.max(1, level) - 1) * 4);
}

/** Every animal cleared gives one charge; the companion's own kind gives three. */
export function chargeFrom(cleared: Partial<Record<GemColor, number>>, companion: GemColor): number {
  let charge = 0;
  for (const color of GEM_COLORS_ORDER) {
    const n = cleared[color] ?? 0;
    charge += color === companion ? n * 3 : n;
  }
  return charge;
}

export function sanitizeCompanion(raw: unknown): GemColor {
  if (raw && typeof raw === 'object') {
    const active = (raw as Record<string, unknown>).active;
    if (typeof active === 'string' && GEM_COLORS_ORDER.includes(active as GemColor)) return active as GemColor;
  }
  return STARTER;
}

export function readCompanion(): GemColor {
  return sanitizeCompanion(readJson(STORAGE_KEYS.companion));
}

export function writeCompanion(active: GemColor): void {
  writeJson(STORAGE_KEYS.companion, { active });
}

// --- Where a power strikes ----------------------------------------------------

type Rng = () => number;

function pick<T>(list: T[], n: number, rng: Rng): T[] {
  const pool = [...list];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

/** How much a cell is worth hitting: blockers and ice count more than a plain animal. */
function worth(board: Board, row: number, col: number): number {
  const cell = board[row][col];
  if (cell.block === 'hole') return 0;
  if (cell.crate > 0) return 3;
  if (!cell.gem) return 0;
  if (cell.gem.egg) return 0;
  return 1 + (cell.ice > 0 ? 2 : 0) + (cell.gem.chained ? 2 : 0) + (cell.gem.bomb !== undefined ? 4 : 0);
}

function bestLine(board: Board, rows: boolean, skip = -1): number {
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (i === skip) continue;
    let score = 0;
    for (let j = 0; j < BOARD_SIZE; j++) score += rows ? worth(board, i, j) : worth(board, j, i);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

const all = (): Coord[] => {
  const cells: Coord[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) for (let col = 0; col < BOARD_SIZE; col++) cells.push({ row, col });
  return cells;
};

/**
 * The cells a clearing power hits on this board. Powers aim themselves at
 * the line or spot where they do the most good. `specials` and `moves` do
 * not clear anything and return an empty list.
 */
export function powerTargets(board: Board, power: PowerKind, rng: Rng = Math.random): Coord[] {
  const hittable = all().filter((p) => worth(board, p.row, p.col) > 0);
  const scatter = (n: number) => pick(hittable, n, rng);
  switch (power) {
    case 'row': {
      const row = bestLine(board, true);
      return all().filter((p) => p.row === row);
    }
    case 'columns': {
      const first = bestLine(board, false);
      const second = bestLine(board, false, first);
      return all().filter((p) => p.col === first || p.col === second);
    }
    case 'cross': {
      const row = bestLine(board, true);
      const col = bestLine(board, false);
      return all().filter((p) => p.row === row || p.col === col);
    }
    case 'diagonals':
      return all().filter((p) => p.row === p.col || p.row + p.col === BOARD_SIZE - 1);
    case 'area':
      return all().filter((p) => p.row >= 2 && p.row <= 5 && p.col >= 2 && p.col <= 5);
    case 'bottom':
      return all().filter((p) => p.row >= BOARD_SIZE - 2);
    case 'scatter':
      return scatter(10);
    case 'color': {
      const counts = new Map<GemColor, number>();
      for (const p of hittable) {
        const gem = board[p.row][p.col].gem;
        if (gem && board[p.row][p.col].crate === 0) counts.set(gem.color, (counts.get(gem.color) ?? 0) + 1);
      }
      let top: GemColor | null = null;
      for (const [color, n] of counts) if (top === null || n > (counts.get(top) ?? 0)) top = color;
      return hittable.filter((p) => board[p.row][p.col].crate === 0 && board[p.row][p.col].gem?.color === top);
    }
    case 'thaw': {
      const iced = hittable.filter((p) => board[p.row][p.col].ice > 0);
      const hits = pick(iced, 12, rng);
      // Nothing frozen: the warmth still clears a handful of animals.
      return hits.length >= 4 ? hits : [...hits, ...pick(hittable.filter((p) => !hits.includes(p)), 8 - hits.length, rng)];
    }
    case 'smash': {
      const blockers = hittable.filter((p) => {
        const cell = board[p.row][p.col];
        return cell.crate > 0 || cell.gem?.chained || cell.gem?.bomb !== undefined;
      });
      const hits = pick(blockers, 8, rng);
      return hits.length >= 4 ? hits : [...hits, ...pick(hittable.filter((p) => !hits.includes(p)), 8 - hits.length, rng)];
    }
    default:
      return [];
  }
}
