/**
 * Win streak rewards, pre-game starter boosters, and "Rescue the run" (+5 moves).
 * Everything here is pure; persistence sits at the bottom.
 */
import { cloneBoard, RngFn } from './engine';
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import { BOARD_SIZE, Board, Coord, GameMode, SpecialType } from './types';

export interface WinStreakState {
  streak: number;
  bestStreak: number;
}

export const MAX_STREAK_TIER = 3;

export type StarterId = 'beam' | 'nova' | 'prism';
export type PreGameStarter = 'none' | StarterId;

export interface StarterOption {
  id: StarterId;
  nameSv: string;
  descSv: string;
  cost: number;
  special: SpecialType;
}

export const STARTERS: readonly StarterOption[] = [
  { id: 'beam', nameSv: 'Stråle', descSv: 'Börjar nivån med en slumpmässig stråle på brädet.', cost: 35, special: 'beam_h' },
  { id: 'nova', nameSv: 'Nova', descSv: 'Börjar nivån med en 3×3-Nova färdig på brädet.', cost: 55, special: 'nova' },
  { id: 'prism', nameSv: 'Prisma', descSv: 'Börjar nivån med en Prisma som rensar en hel färg.', cost: 80, special: 'prism' },
];

export const STARTER_OPTIONS = STARTERS;

export function starterSelectionCost(
  ids: readonly StarterId[],
  freeInventory?: Partial<Record<StarterId, number>>
): number {
  let total = 0;
  for (const id of new Set(ids)) {
    if ((freeInventory?.[id] ?? 0) > 0) continue;
    const opt = STARTERS.find((s) => s.id === id);
    if (opt) total += opt.cost;
  }
  return total;
}

export type FreeStarters = Record<StarterId, number>;

export function createEmptyFreeStarters(): FreeStarters {
  return { beam: 0, nova: 0, prism: 0 };
}

export function sanitizeFreeStarters(raw: unknown): FreeStarters {
  if (!raw || typeof raw !== 'object') return createEmptyFreeStarters();
  const obj = raw as Record<string, unknown>;
  const clamp = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(99, Math.round(v))) : 0;
  return {
    beam: clamp(obj.beam),
    nova: clamp(obj.nova),
    prism: clamp(obj.prism),
  };
}

export function addFreeStarter(
  inv: FreeStarters,
  id: StarterId,
  count = 1
): FreeStarters {
  return { ...inv, [id]: Math.min(99, inv[id] + Math.max(0, count)) };
}

export function consumeFreeStarters(
  inv: FreeStarters,
  ids: readonly StarterId[]
): { nextInv: FreeStarters; paidIds: StarterId[] } {
  const nextInv = { ...inv };
  const paidIds: StarterId[] = [];
  for (const id of new Set(ids)) {
    if (nextInv[id] > 0) {
      nextInv[id] -= 1;
    } else {
      paidIds.push(id);
    }
  }
  return { nextInv, paidIds };
}

export function readFreeStarters(): FreeStarters {
  return sanitizeFreeStarters(readJson(STORAGE_KEYS.freeStarters));
}

export function writeFreeStarters(inv: FreeStarters): void {
  writeJson(STORAGE_KEYS.freeStarters, inv);
}

export const RESCUE_MOVES = 5;
export const RESCUE_BASE_COST = 40;
export const MAX_RESCUES_PER_RUN = 2;

export function createInitialWinStreak(): WinStreakState {
  return { streak: 0, bestStreak: 0 };
}

export function sanitizeWinStreak(raw: unknown): WinStreakState {
  if (!raw || typeof raw !== 'object') return createInitialWinStreak();
  const obj = raw as Record<string, unknown>;
  const streak =
    typeof obj.streak === 'number' && Number.isFinite(obj.streak)
      ? Math.max(0, Math.round(obj.streak))
      : 0;
  const bestRaw =
    typeof obj.bestStreak === 'number' && Number.isFinite(obj.bestStreak)
      ? Math.max(0, Math.round(obj.bestStreak))
      : 0;
  return { streak, bestStreak: Math.max(streak, bestRaw) };
}

export function recordStreakWin(state: WinStreakState): WinStreakState {
  const streak = state.streak + 1;
  return { streak, bestStreak: Math.max(state.bestStreak, streak) };
}

export function resetWinStreak(state: WinStreakState): WinStreakState {
  return { streak: 0, bestStreak: state.bestStreak };
}

export function winStreakTier(streak: number): number {
  return Math.max(0, Math.min(MAX_STREAK_TIER, Math.floor(streak)));
}

/** Special pieces automatically planted on the starting board for a campaign win streak. */
export function winStreakSpecials(streak: number): SpecialType[] {
  const tier = winStreakTier(streak);
  if (tier <= 0) return [];
  if (tier === 1) return ['beam_h'];
  if (tier === 2) return ['beam_h', 'nova'];
  return ['beam_h', 'nova', 'prism'];
}

export function getStarterOption(id: PreGameStarter): StarterOption | null {
  if (id === 'none') return null;
  return STARTER_OPTIONS.find((opt) => opt.id === id) ?? null;
}

/**
 * Places starting special pieces (from win streak and/or pre-game starter choice)
 * onto safe, ordinary animals on the opening board.
 */
export function applyStartSpecials(
  board: Board,
  specials: SpecialType[],
  rng: RngFn = Math.random
): { board: Board; placed: Array<{ coord: Coord; special: SpecialType }> } {
  const wanted = specials.filter((s) => s !== 'none');
  if (wanted.length === 0) return { board, placed: [] };

  const next = cloneBoard(board);
  const candidates: Coord[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = next[r][c];
      if (
        cell.crate === 0 &&
        cell.gem &&
        cell.gem.special === 'none' &&
        !cell.gem.chained &&
        !cell.gem.egg &&
        cell.gem.bomb === undefined
      ) {
        candidates.push({ row: r, col: c });
      }
    }
  }

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const placed: Array<{ coord: Coord; special: SpecialType }> = [];
  for (let i = 0; i < wanted.length && i < candidates.length; i++) {
    const coord = candidates[i];
    let special = wanted[i];
    if (special === 'beam_h' && rng() < 0.5) special = 'beam_v';
    next[coord.row][coord.col].gem!.special = special;
    placed.push({ coord, special });
  }

  return { board: next, placed };
}

export function rescueCost(rescuesUsed: number): number {
  return RESCUE_BASE_COST * (Math.max(0, Math.floor(rescuesUsed)) + 1);
}

export function isRescuableMode(mode: GameMode): boolean {
  return mode === 'campaign' || mode === 'daily' || mode === 'weekly';
}

export function canAffordRescue(
  mode: GameMode,
  rescuesUsed: number,
  bankEnergy: number,
  roundEnergy: number
): boolean {
  if (!isRescuableMode(mode)) return false;
  if (rescuesUsed >= MAX_RESCUES_PER_RUN) return false;
  const total = Math.max(0, bankEnergy) + Math.max(0, roundEnergy);
  return total >= rescueCost(rescuesUsed);
}

/** Spends banked bonus energy first so the player keeps their in-round tools charged. */
export function splitRescuePayment(
  bankEnergy: number,
  roundEnergy: number,
  cost: number
): { nextBank: number; nextRound: number } | null {
  const bank = Math.max(0, Math.round(bankEnergy));
  const round = Math.max(0, Math.round(roundEnergy));
  if (bank + round < cost) return null;
  const fromBank = Math.min(bank, cost);
  const fromRound = cost - fromBank;
  return {
    nextBank: bank - fromBank,
    nextRound: round - fromRound,
  };
}

/** Resets any exploded bomb back to a safe countdown when rescuing a round. */
export function defuseExplodedBombs(board: Board, countdown = RESCUE_MOVES): Board {
  const next = cloneBoard(board);
  for (const row of next) {
    for (const cell of row) {
      if (cell.gem?.bomb !== undefined && cell.gem.bomb <= 0) {
        cell.gem.bomb = countdown;
      }
    }
  }
  return next;
}

export function readWinStreak(): WinStreakState {
  return sanitizeWinStreak(readJson(STORAGE_KEYS.winStreak));
}

export function writeWinStreak(state: WinStreakState): void {
  writeJson(STORAGE_KEYS.winStreak, state);
}
