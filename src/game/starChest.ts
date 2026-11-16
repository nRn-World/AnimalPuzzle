/**
 * Star Chest (0/15 stars -> energy + free starter booster) and the Daily Lucky
 * Wheel (1 free spin per day across 8 exciting slices).
 */
import { StarterId } from './boosters';
import { createSeededRng } from './daily';
import { readJson, STORAGE_KEYS, writeJson } from './storage';

export const STAR_CHEST_GOAL = 15;

export interface StarChestState {
  /** Stars accumulated toward chests (multiple chests can queue cleanly). */
  stars: number;
  opened: number;
  lastWheelDate: string | null;
  totalSpins: number;
}

export interface StarChestReward {
  energy: number;
  starter: StarterId;
}

export type WheelPrizeKind = 'energy' | 'starter' | 'lives';

export interface WheelSlice {
  id: string;
  labelSv: string;
  accent: string;
  kind: WheelPrizeKind;
  energy?: number;
  starter?: StarterId;
}

export const WHEEL_SLICES: readonly WheelSlice[] = [
  { id: 'e25', labelSv: '+25 energi', accent: '#6FE65E', kind: 'energy', energy: 25 },
  { id: 'beam', labelSv: 'Gratis Stråle', accent: '#27B8FF', kind: 'starter', starter: 'beam' },
  { id: 'e40', labelSv: '+40 energi', accent: '#F2CD1C', kind: 'energy', energy: 40 },
  { id: 'lives', labelSv: 'Fulla liv!', accent: '#FF8AD1', kind: 'lives' },
  { id: 'e60', labelSv: '+60 energi', accent: '#F97316', kind: 'energy', energy: 60 },
  { id: 'nova', labelSv: 'Gratis Nova', accent: '#A855F7', kind: 'starter', starter: 'nova' },
  { id: 'prism', labelSv: 'Gratis Prisma', accent: '#14B8A6', kind: 'starter', starter: 'prism' },
  { id: 'jackpot', labelSv: '+100 energi!', accent: '#FF2E4D', kind: 'energy', energy: 100 },
];

export function createInitialStarChestState(): StarChestState {
  return { stars: 0, opened: 0, lastWheelDate: null, totalSpins: 0 };
}

export function sanitizeStarChestState(raw: unknown): StarChestState {
  if (!raw || typeof raw !== 'object') return createInitialStarChestState();
  const obj = raw as Record<string, unknown>;
  const num = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
  return {
    stars: num(obj.stars),
    opened: num(obj.opened),
    lastWheelDate: typeof obj.lastWheelDate === 'string' ? obj.lastWheelDate : null,
    totalSpins: num(obj.totalSpins),
  };
}

export function addChestStars(state: StarChestState, earned: number): StarChestState {
  if (earned <= 0) return state;
  return { ...state, stars: state.stars + Math.round(earned) };
}

export function readyChestCount(state: StarChestState): number {
  return Math.floor(state.stars / STAR_CHEST_GOAL);
}

export function chestProgressDisplay(state: StarChestState): number {
  if (state.stars >= STAR_CHEST_GOAL) return STAR_CHEST_GOAL;
  return state.stars;
}

export function openStarChest(
  state: StarChestState
): { nextState: StarChestState; reward: StarChestReward | null } {
  if (state.stars < STAR_CHEST_GOAL) return { nextState: state, reward: null };
  const idx = state.opened;
  const starterCycle: StarterId[] = ['beam', 'nova', 'prism'];
  const energyTable = [45, 55, 70];
  const reward: StarChestReward = {
    energy: energyTable[idx % energyTable.length],
    starter: starterCycle[idx % starterCycle.length],
  };
  return {
    reward,
    nextState: {
      ...state,
      stars: state.stars - STAR_CHEST_GOAL,
      opened: state.opened + 1,
    },
  };
}

export function canSpinWheel(state: StarChestState, todayKey: string): boolean {
  return state.lastWheelDate !== todayKey;
}

/** Deterministic daily spin index (weights Jackpot slightly rarer than normal slices). */
export function spinDailyWheel(
  state: StarChestState,
  todayKey: string,
  rng: () => number = Math.random
): { nextState: StarChestState; sliceIndex: number; slice: WheelSlice } | null {
  if (!canSpinWheel(state, todayKey)) return null;
  const weights = [20, 14, 18, 12, 12, 10, 8, 6];
  const total = weights.reduce((s, w) => s + w, 0);
  const seeded = createSeededRng(`animalpuzzle-wheel-${todayKey}-${state.totalSpins}`);
  const roll = ((rng() + seeded()) / 2) * total;
  let acc = 0;
  let sliceIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (roll <= acc) {
      sliceIndex = i;
      break;
    }
  }
  const slice = WHEEL_SLICES[sliceIndex];
  return {
    sliceIndex,
    slice,
    nextState: {
      ...state,
      lastWheelDate: todayKey,
      totalSpins: state.totalSpins + 1,
    },
  };
}

export function readStarChestState(): StarChestState {
  return sanitizeStarChestState(readJson(STORAGE_KEYS.starChest));
}

export function writeStarChestState(state: StarChestState): void {
  writeJson(STORAGE_KEYS.starChest, state);
}
