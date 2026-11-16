/**
 * Weekly League (Brons -> Silver -> Guld -> Kristall -> Legend).
 * Players earn star points from levels, daily challenges, puzzles and blitz
 * runs, competing in a 15-player weekly bracket with promotions, demotions
 * and weekly bonus-energy rewards.
 */
import { createSeededRng } from './daily';
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import { GEM_COLORS_ORDER, GemColor } from './types';

export type LeagueTierId = 'bronze' | 'silver' | 'gold' | 'crystal' | 'legend';

export interface LeagueTierDef {
  id: LeagueTierId;
  nameSv: string;
  accent: string;
  promoteTop: number;
  demoteBottom: number;
  topReward: number;
  promoteReward: number;
  /** Typical full-week rival ceiling in this tier. */
  rivalMax: number;
}

export const LEAGUE_TIERS: readonly LeagueTierDef[] = [
  {
    id: 'bronze',
    nameSv: 'Bronsligan',
    accent: '#CD7F32',
    promoteTop: 5,
    demoteBottom: 0,
    topReward: 40,
    promoteReward: 25,
    rivalMax: 240,
  },
  {
    id: 'silver',
    nameSv: 'Silverligan',
    accent: '#94A3B8',
    promoteTop: 5,
    demoteBottom: 3,
    topReward: 65,
    promoteReward: 40,
    rivalMax: 420,
  },
  {
    id: 'gold',
    nameSv: 'Guldligan',
    accent: '#F2CD1C',
    promoteTop: 5,
    demoteBottom: 3,
    topReward: 95,
    promoteReward: 60,
    rivalMax: 640,
  },
  {
    id: 'crystal',
    nameSv: 'Kristalligan',
    accent: '#27B8FF',
    promoteTop: 3,
    demoteBottom: 3,
    topReward: 130,
    promoteReward: 85,
    rivalMax: 880,
  },
  {
    id: 'legend',
    nameSv: 'Legendligan',
    accent: '#FF2E4D',
    promoteTop: 0,
    demoteBottom: 3,
    topReward: 180,
    promoteReward: 0,
    rivalMax: 1150,
  },
];

export const LEAGUE_SIZE = 15;

export interface LeaguePendingReward {
  fromWeek: string;
  fromTier: LeagueTierId;
  newTier: LeagueTierId;
  rank: number;
  energy: number;
  outcome: 'promoted' | 'stayed' | 'demoted';
}

export interface LeagueState {
  tier: LeagueTierId;
  weekKey: string;
  points: number;
  bestTier: LeagueTierId;
  trophies: number;
  pendingReward: LeaguePendingReward | null;
}

export interface LeagueStandingRow {
  id: string;
  handle: string;
  color: GemColor;
  points: number;
  rank: number;
  isPlayer: boolean;
  zone: 'promote' | 'stay' | 'demote';
}

const RIVAL_HANDLES = [
  'Alva',
  'Mio',
  'Nora',
  'Otto',
  'Vera',
  'Leo',
  'Freja',
  'Hugo',
  'Klara',
  'Elias',
  'Signe',
  'Arvid',
  'Astrid',
  'Felix',
  'Wilma',
  'Oskar',
  'Ebba',
  'Viggo',
  'Linnea',
  'Malte',
];

export function tierIndex(tier: LeagueTierId): number {
  const idx = LEAGUE_TIERS.findIndex((t) => t.id === tier);
  return idx >= 0 ? idx : 0;
}

export function getLeagueTier(tier: LeagueTierId): LeagueTierDef {
  return LEAGUE_TIERS[tierIndex(tier)];
}

export function createInitialLeagueState(weekKey = ''): LeagueState {
  return {
    tier: 'bronze',
    weekKey,
    points: 0,
    bestTier: 'bronze',
    trophies: 0,
    pendingReward: null,
  };
}

function validTier(value: unknown): LeagueTierId {
  return LEAGUE_TIERS.some((t) => t.id === value) ? (value as LeagueTierId) : 'bronze';
}

export function sanitizeLeagueState(raw: unknown): LeagueState {
  if (!raw || typeof raw !== 'object') return createInitialLeagueState();
  const obj = raw as Record<string, unknown>;
  const tier = validTier(obj.tier);
  const bestRaw = validTier(obj.bestTier);
  const bestTier = tierIndex(bestRaw) >= tierIndex(tier) ? bestRaw : tier;
  const weekKey = typeof obj.weekKey === 'string' ? obj.weekKey : '';
  const points =
    typeof obj.points === 'number' && Number.isFinite(obj.points)
      ? Math.max(0, Math.round(obj.points))
      : 0;
  const trophies =
    typeof obj.trophies === 'number' && Number.isFinite(obj.trophies)
      ? Math.max(0, Math.round(obj.trophies))
      : 0;

  let pendingReward: LeaguePendingReward | null = null;
  if (obj.pendingReward && typeof obj.pendingReward === 'object') {
    const p = obj.pendingReward as Record<string, unknown>;
    const outcome =
      p.outcome === 'promoted' || p.outcome === 'demoted' || p.outcome === 'stayed'
        ? p.outcome
        : null;
    if (
      outcome &&
      typeof p.fromWeek === 'string' &&
      typeof p.rank === 'number' &&
      typeof p.energy === 'number'
    ) {
      pendingReward = {
        fromWeek: p.fromWeek,
        fromTier: validTier(p.fromTier),
        newTier: validTier(p.newTier),
        rank: Math.max(1, Math.min(LEAGUE_SIZE, Math.round(p.rank))),
        energy: Math.max(0, Math.round(p.energy)),
        outcome,
      };
    }
  }

  return { tier, weekKey, points, bestTier, trophies, pendingReward };
}

/** Progress through the ISO week (Monday = ~0.18, Sunday night = 1.0). */
export function weekProgressFactor(now: Date = new Date()): number {
  const isoDay = (now.getDay() + 6) % 7; // 0 = Monday .. 6 = Sunday
  const hourShare = now.getHours() / 24;
  return Math.max(0.18, Math.min(1, (isoDay + hourShare + 0.35) / 7.35));
}

function generateRivals(
  weekKey: string,
  tier: LeagueTierId,
  progressFactor: number
): Array<{ id: string; handle: string; color: GemColor; points: number }> {
  const def = getLeagueTier(tier);
  const rng = createSeededRng(`animalpuzzle-league-${weekKey}-${tier}`);
  const pool = [...RIVAL_HANDLES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const rivals: Array<{ id: string; handle: string; color: GemColor; points: number }> = [];
  for (let i = 0; i < LEAGUE_SIZE - 1; i++) {
    // Spread rivals smoothly from casual to competitive across the bracket.
    const band = (i + 0.5) / (LEAGUE_SIZE - 1);
    const jitter = 0.8 + rng() * 0.4;
    const raw = def.rivalMax * Math.pow(band, 1.35) * jitter * progressFactor;
    const points = Math.max(10, Math.round(raw / 5) * 5);
    const color = GEM_COLORS_ORDER[Math.floor(rng() * GEM_COLORS_ORDER.length)];
    rivals.push({
      id: `rival-${i}`,
      handle: pool[i % pool.length],
      color,
      points,
    });
  }
  return rivals;
}

export function buildLeagueStandings(
  state: LeagueState,
  playerLabel: string,
  playerColor: GemColor,
  now: Date = new Date(),
  overrideProgress?: number
): LeagueStandingRow[] {
  const def = getLeagueTier(state.tier);
  const progress = overrideProgress ?? weekProgressFactor(now);
  const rivals = generateRivals(state.weekKey || 'default', state.tier, progress);

  const combined = [
    ...rivals.map((r) => ({ ...r, isPlayer: false })),
    {
      id: 'player',
      handle: playerLabel,
      color: playerColor,
      points: state.points,
      isPlayer: true,
    },
  ];

  combined.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    // Ties favour the player!
    if (a.isPlayer !== b.isPlayer) return a.isPlayer ? -1 : 1;
    return a.id.localeCompare(b.id);
  });

  return combined.map((entry, i) => {
    const rank = i + 1;
    let zone: 'promote' | 'stay' | 'demote' = 'stay';
    if (def.promoteTop > 0 && rank <= def.promoteTop) zone = 'promote';
    else if (def.demoteBottom > 0 && rank > LEAGUE_SIZE - def.demoteBottom) zone = 'demote';
    return { ...entry, rank, zone };
  });
}

/**
 * Transitions the league into `currentWeekKey`, calculating last week's final
 * placement, promotion/demotion and claimable reward if the player participated.
 */
export function settleLeagueWeek(state: LeagueState, currentWeekKey: string): LeagueState {
  if (!state.weekKey) {
    return { ...state, weekKey: currentWeekKey };
  }
  if (state.weekKey === currentWeekKey) return state;

  // If the player never played last week, simply roll over without penalising them.
  if (state.points <= 0) {
    return { ...state, weekKey: currentWeekKey };
  }

  const standings = buildLeagueStandings(state, 'Du', 'ruby', new Date(), 1);
  const me = standings.find((r) => r.isPlayer)!;
  const idx = tierIndex(state.tier);
  const def = LEAGUE_TIERS[idx];

  let nextIdx = idx;
  let outcome: 'promoted' | 'stayed' | 'demoted' = 'stayed';
  if (def.promoteTop > 0 && me.rank <= def.promoteTop && idx + 1 < LEAGUE_TIERS.length) {
    nextIdx = idx + 1;
    outcome = 'promoted';
  } else if (def.demoteBottom > 0 && me.rank > LEAGUE_SIZE - def.demoteBottom && idx > 0) {
    nextIdx = idx - 1;
    outcome = 'demoted';
  }

  let energy = 0;
  if (me.rank === 1) energy = def.topReward;
  else if (me.rank <= 3) energy = Math.round(def.topReward * 0.75);
  else if (outcome === 'promoted') energy = def.promoteReward;
  else if (outcome === 'stayed') energy = 15;

  const newTier = LEAGUE_TIERS[nextIdx].id;
  const bestTier = tierIndex(newTier) > tierIndex(state.bestTier) ? newTier : state.bestTier;
  const wonTrophy = me.rank === 1 || (state.tier === 'legend' && me.rank <= 3);

  return {
    tier: newTier,
    weekKey: currentWeekKey,
    points: 0,
    bestTier,
    trophies: state.trophies + (wonTrophy ? 1 : 0),
    pendingReward: {
      fromWeek: state.weekKey,
      fromTier: state.tier,
      newTier,
      rank: me.rank,
      energy,
      outcome,
    },
  };
}

export function addLeaguePoints(
  state: LeagueState,
  delta: number,
  currentWeekKey: string
): LeagueState {
  const settled = settleLeagueWeek(state, currentWeekKey);
  if (delta <= 0) return settled;
  return { ...settled, points: settled.points + Math.round(delta) };
}

export function claimLeagueReward(
  state: LeagueState
): { nextState: LeagueState; energy: number } {
  if (!state.pendingReward) return { nextState: state, energy: 0 };
  const energy = state.pendingReward.energy;
  return {
    energy,
    nextState: { ...state, pendingReward: null },
  };
}

export function readLeagueState(currentWeekKey: string): LeagueState {
  const raw = sanitizeLeagueState(readJson(STORAGE_KEYS.league));
  return settleLeagueWeek(raw, currentWeekKey);
}

export function writeLeagueState(state: LeagueState): void {
  writeJson(STORAGE_KEYS.league, state);
}
