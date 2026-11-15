import { allocGemId, createEmptyProgress } from './engine';
import { readJson, removeKey, STORAGE_KEYS, writeJson } from './storage';
import {
  BOARD_SIZE,
  Board,
  Cell,
  GEM_COLORS_ORDER,
  GameMode,
  GemColor,
  LevelProgress,
  HOLE_HP,
  SpecialType,
} from './types';

export const SAVED_GAME_VERSION = 1;

/** A run in progress, written after every completed move. */
export interface SavedGame {
  version: number;
  mode: GameMode;
  /** Campaign level index. Ignored for daily and endless. */
  levelIdx: number;
  /** Date key of the daily challenge the board belongs to (daily mode only). */
  dailyKey: string | null;
  board: Board;
  movesLeft: number;
  progress: LevelProgress;
  energy: number;
  maxCascade: number;
  endlessTarget: number;
  savedAt: number;
}

const MODES: GameMode[] = ['campaign', 'endless', 'daily'];
const SPECIALS: SpecialType[] = ['none', 'beam_h', 'beam_v', 'nova', 'scout', 'prism'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function nonNegInt(value: unknown, max = Number.MAX_SAFE_INTEGER): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.min(max, Math.round(value));
}

/**
 * Rebuilds a board from stored JSON. Gems get fresh ids from the engine so
 * they can never collide with gems created after the reload.
 */
export function reviveBoard(raw: unknown): Board | null {
  if (!Array.isArray(raw) || raw.length !== BOARD_SIZE) return null;
  const board: Board = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const rawRow: unknown = raw[r];
    if (!Array.isArray(rawRow) || rawRow.length !== BOARD_SIZE) return null;
    const row: Cell[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      const rawCell: unknown = rawRow[c];
      if (!isObject(rawCell)) return null;
      const ice = nonNegInt(rawCell.ice, 2);
      const block =
        rawCell.block === 'hole' || rawCell.block === 'honey' ? rawCell.block : undefined;
      const crate = block === 'hole' ? HOLE_HP : nonNegInt(rawCell.crate, block === 'honey' ? 1 : 2);
      if (ice === null || crate === null) return null;
      if (block === 'honey' && crate === 0) return null;

      let gem: Cell['gem'] = null;
      if (rawCell.gem !== null && rawCell.gem !== undefined) {
        const rawGem = rawCell.gem;
        if (!isObject(rawGem)) return null;
        if (!GEM_COLORS_ORDER.includes(rawGem.color as GemColor)) return null;
        if (!SPECIALS.includes(rawGem.special as SpecialType)) return null;
        gem = {
          id: allocGemId(),
          color: rawGem.color as GemColor,
          special: rawGem.special as SpecialType,
          chained: rawGem.chained === true,
        };
        if (rawGem.egg === true) gem.egg = true;
        const bomb = nonNegInt(rawGem.bomb, 99);
        if (bomb !== null && bomb > 0) gem.bomb = bomb;
      }
      // A crate never holds an animal. (An open cell may legitimately be empty
      // when crates above it block the refill.)
      if (crate > 0 && gem !== null) return null;
      const cell: Cell = block ? { row: r, col: c, gem, ice, crate, block } : { row: r, col: c, gem, ice, crate };
      if (rawCell.belt === 1 || rawCell.belt === -1) cell.belt = rawCell.belt;
      const portal = nonNegInt(rawCell.portal, 9);
      if (portal !== null && portal > 0) cell.portal = portal;
      row.push(cell);
    }
    board.push(row);
  }
  return board;
}

function reviveProgress(raw: unknown): LevelProgress | null {
  if (!isObject(raw)) return null;
  const base = createEmptyProgress();
  const score = nonNegInt(raw.score);
  const clearedIce = nonNegInt(raw.clearedIce);
  const clearedCrates = nonNegInt(raw.clearedCrates);
  const clearedChains = nonNegInt(raw.clearedChains);
  const specialsCreated = nonNegInt(raw.specialsCreated);
  const cascade3Count = nonNegInt(raw.cascade3Count);
  if (
    score === null ||
    clearedIce === null ||
    clearedCrates === null ||
    clearedChains === null ||
    specialsCreated === null ||
    cascade3Count === null
  ) {
    return null;
  }
  const colors = isObject(raw.clearedColors) ? raw.clearedColors : {};
  const clearedColors = { ...base.clearedColors };
  for (const color of GEM_COLORS_ORDER) {
    clearedColors[color] = nonNegInt(colors[color]) ?? 0;
  }
  return {
    score,
    clearedColors,
    clearedIce,
    clearedCrates,
    clearedChains,
    // Saves from before honey and eggs existed simply have none.
    clearedHoney: nonNegInt(raw.clearedHoney) ?? 0,
    collectedEggs: nonNegInt(raw.collectedEggs) ?? 0,
    specialsCreated,
    cascade3Count,
  };
}

/** Validates stored JSON. Returns null for anything missing, outdated or corrupt. */
export function parseSavedGame(raw: unknown): SavedGame | null {
  if (!isObject(raw)) return null;
  if (raw.version !== SAVED_GAME_VERSION) return null;
  if (!MODES.includes(raw.mode as GameMode)) return null;
  const mode = raw.mode as GameMode;

  const levelIdx = nonNegInt(raw.levelIdx);
  const movesLeft = nonNegInt(raw.movesLeft, 999);
  const energy = nonNegInt(raw.energy, 100);
  const maxCascade = nonNegInt(raw.maxCascade, 999);
  const endlessTarget = nonNegInt(raw.endlessTarget);
  if (
    levelIdx === null ||
    movesLeft === null ||
    movesLeft < 1 ||
    energy === null ||
    maxCascade === null ||
    endlessTarget === null
  ) {
    return null;
  }

  const dailyKey = typeof raw.dailyKey === 'string' ? raw.dailyKey : null;
  if (mode === 'daily' && !dailyKey) return null;

  const progress = reviveProgress(raw.progress);
  const board = reviveBoard(raw.board);
  if (!progress || !board) return null;

  return {
    version: SAVED_GAME_VERSION,
    mode,
    levelIdx,
    dailyKey,
    board,
    movesLeft,
    progress,
    energy,
    maxCascade: Math.max(1, maxCascade),
    endlessTarget: Math.max(1, endlessTarget),
    savedAt: nonNegInt(raw.savedAt) ?? 0,
  };
}

/**
 * A save is only offered when it can still be played: the campaign level must
 * exist and be unlocked, and a daily board must belong to today's challenge.
 */
export function isSavedGameResumable(
  save: SavedGame,
  ctx: { levelCount: number; highestUnlockedIdx: number; todayKey: string }
): boolean {
  if (save.mode === 'campaign') {
    return save.levelIdx < ctx.levelCount && save.levelIdx <= ctx.highestUnlockedIdx;
  }
  if (save.mode === 'daily') {
    return save.dailyKey === ctx.todayKey;
  }
  return true;
}

export function readSavedGame(): SavedGame | null {
  return parseSavedGame(readJson(STORAGE_KEYS.savedGame));
}

export function writeSavedGame(save: Omit<SavedGame, 'version' | 'savedAt'>): void {
  writeJson(STORAGE_KEYS.savedGame, {
    ...save,
    version: SAVED_GAME_VERSION,
    savedAt: Date.now(),
  });
}

export function clearSavedGame(): void {
  removeKey(STORAGE_KEYS.savedGame);
}
