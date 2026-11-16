/**
 * Fast, bite-sized mini-events:
 *  1. Stjärnracet (Star Race): 30-minute 5-player sprint to 15 stars.
 *  2. Lavastigen (Lava Trail): win 5 campaign levels in a row without defeat
 *     for a grand jackpot.
 */
import { StarterId } from './boosters';
import { createSeededRng } from './daily';
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import { GEM_COLORS_ORDER, GemColor } from './types';

export const STAR_RACE_GOAL = 15;
export const STAR_RACE_DURATION_MS = 30 * 60 * 1000;
export const LAVA_TRAIL_GOAL = 5;

export interface StarRaceState {
  id: number;
  startedAt: number;
  endsAt: number;
  playerStars: number;
  claimed: boolean;
}

export interface LavaTrailState {
  active: boolean;
  wins: number;
  completedCount: number;
  rewardPending: boolean;
}

export interface MiniEventsState {
  race: StarRaceState | null;
  racesCompleted: number;
  lava: LavaTrailState;
}

export interface RaceRow {
  id: string;
  handle: string;
  color: GemColor;
  stars: number;
  isPlayer: boolean;
  rank: number;
}

export interface MiniEventReward {
  energy: number;
  starters: StarterId[];
  rank?: number;
}

const RACER_HANDLES = ['Nova', 'Freja', 'Leo', 'Alva', 'Mio', 'Hugo', 'Vera', 'Otto', 'Klara', 'Elias'];

export function createInitialMiniEvents(): MiniEventsState {
  return {
    race: null,
    racesCompleted: 0,
    lava: { active: false, wins: 0, completedCount: 0, rewardPending: false },
  };
}

export function sanitizeMiniEvents(raw: unknown): MiniEventsState {
  if (!raw || typeof raw !== 'object') return createInitialMiniEvents();
  const obj = raw as Record<string, unknown>;
  const num = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;

  let race: StarRaceState | null = null;
  if (obj.race && typeof obj.race === 'object') {
    const r = obj.race as Record<string, unknown>;
    const startedAt = num(r.startedAt);
    const endsAt = num(r.endsAt);
    if (startedAt > 0 && endsAt > startedAt) {
      race = {
        id: Math.max(1, num(r.id)),
        startedAt,
        endsAt,
        playerStars: Math.min(STAR_RACE_GOAL, num(r.playerStars)),
        claimed: r.claimed === true,
      };
    }
  }

  const l = obj.lava && typeof obj.lava === 'object' ? (obj.lava as Record<string, unknown>) : {};
  return {
    race,
    racesCompleted: num(obj.racesCompleted),
    lava: {
      active: l.active === true,
      wins: Math.min(LAVA_TRAIL_GOAL, num(l.wins)),
      completedCount: num(l.completedCount),
      rewardPending: l.rewardPending === true,
    },
  };
}

// --- Star Race -------------------------------------------------------------

export function startStarRace(state: MiniEventsState, now: number): MiniEventsState {
  const nextId = state.racesCompleted + 1;
  return {
    ...state,
    race: {
      id: nextId,
      startedAt: now,
      endsAt: now + STAR_RACE_DURATION_MS,
      playerStars: 0,
      claimed: false,
    },
  };
}

export function isStarRaceFinished(race: StarRaceState | null, now: number): boolean {
  if (!race) return false;
  return race.playerStars >= STAR_RACE_GOAL || now >= race.endsAt;
}

export function buildStarRaceStandings(
  race: StarRaceState,
  playerLabel: string,
  playerColor: GemColor,
  now: number
): RaceRow[] {
  const elapsedShare = Math.max(
    0,
    Math.min(1, (now - race.startedAt) / Math.max(1, race.endsAt - race.startedAt))
  );
  const rng = createSeededRng(`animalpuzzle-race-${race.id}-${race.startedAt}`);
  const pool = [...RACER_HANDLES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // 4 rivals with varied speeds so a motivated player can finish #1 cleanly.
  const speeds = [0.65, 0.85, 1.02, 1.15];
  const entries = speeds.map((speed, idx) => {
    const raw = STAR_RACE_GOAL * elapsedShare * speed * (0.92 + rng() * 0.16);
    const stars = Math.min(STAR_RACE_GOAL, Math.floor(raw));
    const color = GEM_COLORS_ORDER[Math.floor(rng() * GEM_COLORS_ORDER.length)];
    return {
      id: `racer-${idx}`,
      handle: pool[idx % pool.length],
      color,
      stars,
      isPlayer: false,
    };
  });

  entries.push({
    id: 'player',
    handle: playerLabel,
    color: playerColor,
    stars: Math.min(STAR_RACE_GOAL, race.playerStars),
    isPlayer: true,
  });

  entries.sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    if (a.isPlayer !== b.isPlayer) return a.isPlayer ? -1 : 1;
    return a.id.localeCompare(b.id);
  });

  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}

export function addStarRaceStars(
  state: MiniEventsState,
  stars: number,
  now: number
): MiniEventsState {
  if (!state.race || state.race.claimed || stars <= 0) return state;
  if (isStarRaceFinished(state.race, now)) return state;
  return {
    ...state,
    race: {
      ...state.race,
      playerStars: Math.min(STAR_RACE_GOAL, state.race.playerStars + Math.round(stars)),
    },
  };
}

export function claimStarRaceReward(
  state: MiniEventsState,
  now: number
): { nextState: MiniEventsState; reward: MiniEventReward | null } {
  if (!state.race || state.race.claimed || !isStarRaceFinished(state.race, now)) {
    return { nextState: state, reward: null };
  }
  const standings = buildStarRaceStandings(state.race, 'Du', 'ruby', now);
  const me = standings.find((r) => r.isPlayer)!;
  let reward: MiniEventReward;
  if (me.rank === 1) {
    reward = { energy: 80, starters: ['prism'], rank: 1 };
  } else if (me.rank === 2) {
    reward = { energy: 45, starters: ['nova'], rank: 2 };
  } else if (me.rank === 3) {
    reward = { energy: 25, starters: [], rank: 3 };
  } else {
    reward = { energy: 10, starters: [], rank: me.rank };
  }

  return {
    reward,
    nextState: {
      ...state,
      race: null,
      racesCompleted: state.racesCompleted + 1,
    },
  };
}

// --- Lava Trail (5-win survival streak) ------------------------------------

export function startLavaTrail(state: MiniEventsState): MiniEventsState {
  return {
    ...state,
    lava: {
      ...state.lava,
      active: true,
      wins: 0,
      rewardPending: false,
    },
  };
}

export function recordLavaTrailWin(state: MiniEventsState): MiniEventsState {
  if (!state.lava.active || state.lava.rewardPending) return state;
  const nextWins = Math.min(LAVA_TRAIL_GOAL, state.lava.wins + 1);
  const done = nextWins >= LAVA_TRAIL_GOAL;
  return {
    ...state,
    lava: {
      active: !done,
      wins: nextWins,
      completedCount: state.lava.completedCount + (done ? 1 : 0),
      rewardPending: done,
    },
  };
}

export function failLavaTrail(state: MiniEventsState): MiniEventsState {
  if (!state.lava.active || state.lava.rewardPending) return state;
  return {
    ...state,
    lava: { ...state.lava, active: false, wins: 0 },
  };
}

export function claimLavaTrailReward(
  state: MiniEventsState
): { nextState: MiniEventsState; reward: MiniEventReward | null } {
  if (!state.lava.rewardPending) return { nextState: state, reward: null };
  return {
    reward: { energy: 100, starters: ['nova', 'prism'] },
    nextState: {
      ...state,
      lava: { ...state.lava, active: false, wins: 0, rewardPending: false },
    },
  };
}

export function readMiniEvents(): MiniEventsState {
  return sanitizeMiniEvents(readJson(STORAGE_KEYS.miniEvents));
}

export function writeMiniEvents(state: MiniEventsState): void {
  writeJson(STORAGE_KEYS.miniEvents, state);
}
