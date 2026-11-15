/**
 * The player's own island. Stars earned in the campaign are spent on
 * buildings; every building pays a one-time gift of bonus energy.
 */
import { readJson, STORAGE_KEYS, writeJson } from './storage';

export type BuildingId =
  | 'fire'
  | 'tent'
  | 'garden'
  | 'hut'
  | 'dock'
  | 'well'
  | 'boat'
  | 'treehouse'
  | 'mill'
  | 'lighthouse'
  | 'tower'
  | 'statue';

export interface Building {
  id: BuildingId;
  nameSv: string;
  cost: number;
}

/** In building order: each one needs the one before it. */
export const BUILDINGS: Building[] = [
  { id: 'fire', nameSv: 'Lägereld', cost: 3 },
  { id: 'tent', nameSv: 'Tält', cost: 6 },
  { id: 'garden', nameSv: 'Morotsland', cost: 9 },
  { id: 'hut', nameSv: 'Stuga', cost: 12 },
  { id: 'dock', nameSv: 'Brygga', cost: 15 },
  { id: 'well', nameSv: 'Brunn', cost: 18 },
  { id: 'boat', nameSv: 'Segelbåt', cost: 22 },
  { id: 'treehouse', nameSv: 'Trädkoja', cost: 26 },
  { id: 'mill', nameSv: 'Väderkvarn', cost: 30 },
  { id: 'lighthouse', nameSv: 'Fyr', cost: 36 },
  { id: 'tower', nameSv: 'Utkikstorn', cost: 42 },
  { id: 'statue', nameSv: 'Gyllene staty', cost: 50 },
];

/** Bonus energy handed out when a building is finished. */
export const BUILD_GIFT = 25;

export interface IslandState {
  /** How many buildings stand, counted from the start of the list. */
  built: number;
}

export function sanitizeIsland(raw: unknown): IslandState {
  if (raw && typeof raw === 'object') {
    const built = (raw as Record<string, unknown>).built;
    if (typeof built === 'number' && Number.isFinite(built)) {
      return { built: Math.max(0, Math.min(BUILDINGS.length, Math.floor(built))) };
    }
  }
  return { built: 0 };
}

export function totalStars(bestStars: Record<number, number>): number {
  let total = 0;
  for (const value of Object.values(bestStars)) total += value > 0 ? Math.min(3, Math.floor(value)) : 0;
  return total;
}

export function starsSpent(state: IslandState): number {
  return BUILDINGS.slice(0, state.built).reduce((sum, building) => sum + building.cost, 0);
}

export function starsAvailable(state: IslandState, stars: number): number {
  return Math.max(0, stars - starsSpent(state));
}

export function nextBuilding(state: IslandState): Building | null {
  return BUILDINGS[state.built] ?? null;
}

/** Builds the next building if the stars are enough. */
export function build(state: IslandState, stars: number): { nextState: IslandState; built: Building | null } {
  const next = nextBuilding(state);
  if (!next || starsAvailable(state, stars) < next.cost) return { nextState: state, built: null };
  return { nextState: { built: state.built + 1 }, built: next };
}

export function readIsland(): IslandState {
  return sanitizeIsland(readJson(STORAGE_KEYS.island));
}

export function writeIsland(state: IslandState): void {
  writeJson(STORAGE_KEYS.island, state);
}
