/**
 * Daily missions: three small goals that change every day. They fill up in
 * any game mode and pay out bonus energy the moment they are reached.
 */
import { createSeededRng } from './daily';
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import { GEM_COLORS_ORDER, GemColor } from './types';

export type MissionKind = 'animals' | 'color' | 'specials' | 'cascades' | 'score' | 'wins' | 'powers' | 'blockers';

export interface Mission {
  kind: MissionKind;
  target: number;
  reward: number;
  color?: GemColor;
}

/** Finishing all three gives this on top. */
export const ALL_DONE_BONUS = 30;

const POOL: Array<{ kind: MissionKind; targets: number[]; reward: number }> = [
  { kind: 'animals', targets: [200, 300, 400], reward: 15 },
  { kind: 'color', targets: [50, 70, 90], reward: 15 },
  { kind: 'specials', targets: [6, 9, 12], reward: 20 },
  { kind: 'cascades', targets: [3, 5, 7], reward: 20 },
  { kind: 'score', targets: [20000, 30000, 45000], reward: 15 },
  { kind: 'wins', targets: [2, 3, 4], reward: 25 },
  { kind: 'powers', targets: [1, 2, 3], reward: 20 },
  { kind: 'blockers', targets: [15, 25, 35], reward: 20 },
];

/** The three missions of a day. The same date always gives the same three. */
export function getDailyMissions(dateKey: string): Mission[] {
  const rng = createSeededRng(`animalpuzzle-missions-${dateKey}`);
  const pool = [...POOL];
  const missions: Mission[] = [];
  while (missions.length < 3) {
    const def = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    const mission: Mission = {
      kind: def.kind,
      target: def.targets[Math.floor(rng() * def.targets.length)],
      reward: def.reward,
    };
    // Only animals that are in every level.
    if (def.kind === 'color') mission.color = GEM_COLORS_ORDER[Math.floor(rng() * 5)];
    missions.push(mission);
  }
  return missions;
}

export interface MissionState {
  dateKey: string;
  progress: number[];
  bonusPaid: boolean;
}

export function createMissionState(dateKey: string): MissionState {
  return { dateKey, progress: [0, 0, 0], bonusPaid: false };
}

export function sanitizeMissionState(raw: unknown, dateKey: string): MissionState {
  const fresh = createMissionState(dateKey);
  if (!raw || typeof raw !== 'object') return fresh;
  const data = raw as Record<string, unknown>;
  if (data.dateKey !== dateKey || !Array.isArray(data.progress)) return fresh;
  return {
    dateKey,
    progress: fresh.progress.map((_, i) => {
      const value = (data.progress as unknown[])[i];
      return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    }),
    bonusPaid: data.bonusPaid === true,
  };
}

/** What happened in the game since the last update. */
export interface MissionEvent {
  cleared?: Partial<Record<GemColor, number>>;
  specials?: number;
  cascades?: number;
  score?: number;
  wins?: number;
  powers?: number;
  blockers?: number;
}

function gain(mission: Mission, event: MissionEvent): number {
  switch (mission.kind) {
    case 'animals': {
      let total = 0;
      for (const color of GEM_COLORS_ORDER) total += event.cleared?.[color] ?? 0;
      return total;
    }
    case 'color':
      return mission.color ? event.cleared?.[mission.color] ?? 0 : 0;
    case 'specials':
      return event.specials ?? 0;
    case 'cascades':
      return event.cascades ?? 0;
    case 'score':
      return event.score ?? 0;
    case 'wins':
      return event.wins ?? 0;
    case 'powers':
      return event.powers ?? 0;
    case 'blockers':
      return event.blockers ?? 0;
  }
}

/**
 * Adds an event to today's missions. `completed` lists the missions that
 * were reached by exactly this event, and `energy` is what they pay out
 * (including the bonus for finishing all three).
 */
export function applyMissionEvent(
  state: MissionState,
  missions: Mission[],
  event: MissionEvent
): { nextState: MissionState; completed: Mission[]; energy: number } {
  const progress = [...state.progress];
  const completed: Mission[] = [];
  let energy = 0;
  let changed = false;
  missions.forEach((mission, i) => {
    const before = progress[i] ?? 0;
    if (before >= mission.target) return;
    const add = gain(mission, event);
    if (add <= 0) return;
    progress[i] = Math.min(mission.target, before + add);
    changed = true;
    if (progress[i] >= mission.target) {
      completed.push(mission);
      energy += mission.reward;
    }
  });
  if (!changed) return { nextState: state, completed, energy };
  let bonusPaid = state.bonusPaid;
  if (!bonusPaid && missions.every((mission, i) => (progress[i] ?? 0) >= mission.target)) {
    bonusPaid = true;
    energy += ALL_DONE_BONUS;
  }
  return { nextState: { ...state, progress, bonusPaid }, completed, energy };
}

export function missionsDone(state: MissionState, missions: Mission[]): number {
  return missions.filter((mission, i) => (state.progress[i] ?? 0) >= mission.target).length;
}

export function readMissionState(dateKey: string): MissionState {
  return sanitizeMissionState(readJson(STORAGE_KEYS.missions), dateKey);
}

export function writeMissionState(state: MissionState): void {
  writeJson(STORAGE_KEYS.missions, state);
}
