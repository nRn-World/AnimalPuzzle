/**
 * The player's own island. Stars earned in the campaign are spent on
 * buildings; every building pays a one-time gift of bonus energy.
 */
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import { GemColor } from './types';

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
  /** The animal that moves in when the building stands. */
  resident: GemColor;
}

/** In building order: each one needs the one before it. */
export const BUILDINGS: Building[] = [
  { id: 'fire', nameSv: 'Lägereld', cost: 3, resident: 'ruby' },
  { id: 'tent', nameSv: 'Tält', cost: 6, resident: 'amber' },
  { id: 'garden', nameSv: 'Morotsland', cost: 9, resident: 'amethyst' },
  { id: 'hut', nameSv: 'Stuga', cost: 12, resident: 'emerald' },
  { id: 'dock', nameSv: 'Brygga', cost: 15, resident: 'sky' },
  { id: 'well', nameSv: 'Brunn', cost: 18, resident: 'lime' },
  { id: 'boat', nameSv: 'Segelbåt', cost: 22, resident: 'cobalt' },
  { id: 'treehouse', nameSv: 'Trädkoja', cost: 26, resident: 'rose' },
  { id: 'mill', nameSv: 'Väderkvarn', cost: 30, resident: 'tangerine' },
  { id: 'lighthouse', nameSv: 'Fyr', cost: 36, resident: 'mint' },
  { id: 'tower', nameSv: 'Utkikstorn', cost: 42, resident: 'violet' },
  { id: 'statue', nameSv: 'Gyllene staty', cost: 50, resident: 'quartz' },
];

/** Bonus energy handed out when a building is finished. */
export const BUILD_GIFT = 25;

/** Bonus energy each standing building adds to the island's daily gift. */
export const DAILY_GIFT_PER_BUILDING = 3;

export interface IslandState {
  /** How many buildings stand, counted from the start of the list. */
  built: number;
  /** Date key of the last day the daily gift was collected. */
  lastGift?: string;
  /** How many buildings have been upgraded, counted from the start of the list. */
  upgraded?: number;
}

export function upgradedCount(state: IslandState): number {
  return Math.max(0, Math.min(state.built, state.upgraded ?? 0));
}

/** An upgraded building pays the daily gift twice. */
export function dailyGift(state: IslandState): number {
  return (state.built + upgradedCount(state)) * DAILY_GIFT_PER_BUILDING;
}

export function canCollectGift(state: IslandState, todayKey: string): boolean {
  return state.built > 0 && state.lastGift !== todayKey;
}

/** Collects today's gift. `energy` is 0 when there is nothing to collect. */
export function collectGift(state: IslandState, todayKey: string): { nextState: IslandState; energy: number } {
  if (!canCollectGift(state, todayKey)) return { nextState: state, energy: 0 };
  return { nextState: { ...state, lastGift: todayKey }, energy: dailyGift(state) };
}

export function sanitizeIsland(raw: unknown): IslandState {
  if (raw && typeof raw === 'object') {
    const built = (raw as Record<string, unknown>).built;
    if (typeof built === 'number' && Number.isFinite(built)) {
      const lastGift = (raw as Record<string, unknown>).lastGift;
      const upgraded = (raw as Record<string, unknown>).upgraded;
      return {
        built: Math.max(0, Math.min(BUILDINGS.length, Math.floor(built))),
        ...(typeof lastGift === 'string' ? { lastGift } : {}),
        ...(typeof upgraded === 'number' && upgraded > 0
          ? { upgraded: Math.min(BUILDINGS.length, Math.floor(built), Math.floor(upgraded)) }
          : {}),
      };
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
  const cost = (count: number) => BUILDINGS.slice(0, count).reduce((sum, building) => sum + building.cost, 0);
  return cost(state.built) + cost(upgradedCount(state));
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
  return { nextState: { ...state, built: state.built + 1 }, built: next };
}

/** The next building to upgrade: they are upgraded in the order they were built. */
export function nextUpgrade(state: IslandState): Building | null {
  const done = upgradedCount(state);
  return done < state.built ? BUILDINGS[done] : null;
}

/** Upgrades the next building if the stars are enough. It costs the same as building it did. */
export function upgrade(state: IslandState, stars: number): { nextState: IslandState; upgraded: Building | null } {
  const next = nextUpgrade(state);
  if (!next || starsAvailable(state, stars) < next.cost) return { nextState: state, upgraded: null };
  return { nextState: { ...state, upgraded: upgradedCount(state) + 1 }, upgraded: next };
}

export function readIsland(): IslandState {
  return sanitizeIsland(readJson(STORAGE_KEYS.island));
}

export function writeIsland(state: IslandState): void {
  writeJson(STORAGE_KEYS.island, state);
}
