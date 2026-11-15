import { STORAGE_KEYS } from './storage';
import { CascadeStep } from './types';

export type AchievementId =
  | 'first_win'
  | 'cascade_5'
  | 'ice_100'
  | 'crates_50'
  | 'chains_30'
  | 'specials_25'
  | 'score_10k'
  | 'daily_3'
  | 'wins_25'
  | 'wins_100'
  | 'wins_500'
  | 'cascade_7'
  | 'ice_500'
  | 'crates_250'
  | 'chains_150'
  | 'specials_150'
  | 'specials_500'
  | 'score_100k'
  | 'score_1m'
  | 'daily_10'
  | 'daily_30';

export type AchievementIconKind =
  | 'trophy'
  | 'cascade'
  | 'ice'
  | 'crate'
  | 'chain'
  | 'special'
  | 'score'
  | 'daily';

export interface AchievementDef {
  id: AchievementId;
  titleSv: string;
  descSv: string;
  target: number;
  rewardEnergy: number;
  icon: AchievementIconKind;
  statKey: keyof AchievementStats;
}

export interface AchievementStats {
  levelsWon: number;
  bestCascade: number;
  totalIceCleared: number;
  totalCratesCleared: number;
  totalChainsCleared: number;
  totalSpecialsCreated: number;
  totalScore: number;
  dailyCompletedCount: number;
}

export interface AchievementSaveState {
  stats: AchievementStats;
  unlockedIds: AchievementId[];
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'cascade_5',
    titleSv: '5 kaskader i rad',
    descSv: 'Utlös en kedjereaktion på minst ×5 i ett enda drag.',
    target: 5,
    rewardEnergy: 20,
    icon: 'cascade',
    statKey: 'bestCascade',
  },
  {
    id: 'ice_100',
    titleSv: 'Rensa 100 isblock',
    descSv: 'Tina sammanlagt 100 frostade isrutor under dina partier.',
    target: 100,
    rewardEnergy: 25,
    icon: 'ice',
    statKey: 'totalIceCleared',
  },
  {
    id: 'first_win',
    titleSv: 'Första segern',
    descSv: 'Klara din första nivå i kampanjläget.',
    target: 1,
    rewardEnergy: 15,
    icon: 'trophy',
    statKey: 'levelsWon',
  },
  {
    id: 'specials_25',
    titleSv: 'Kristallalkemist',
    descSv: 'Skapa 25 specialbrickor (Stråle, Nova eller Prisma).',
    target: 25,
    rewardEnergy: 20,
    icon: 'special',
    statKey: 'totalSpecialsCreated',
  },
  {
    id: 'crates_50',
    titleSv: 'Skattletare',
    descSv: 'Spräck sammanlagt 50 trälådor bredvid dina matchningar.',
    target: 50,
    rewardEnergy: 20,
    icon: 'crate',
    statKey: 'totalCratesCleared',
  },
  {
    id: 'chains_30',
    titleSv: 'Kedjebrytare',
    descSv: 'Befria 30 fastkedjade djur genom taktiska kombinationer.',
    target: 30,
    rewardEnergy: 20,
    icon: 'chain',
    statKey: 'totalChainsCleared',
  },
  {
    id: 'score_10k',
    titleSv: 'Poängsamlare',
    descSv: 'Samla ihop 10 000 poäng totalt i valfria spellägen.',
    target: 10000,
    rewardEnergy: 25,
    icon: 'score',
    statKey: 'totalScore',
  },
  {
    id: 'daily_3',
    titleSv: 'Daglig hjälte',
    descSv: 'Slutför 3 dagliga utmaningar för exklusiva belöningar.',
    target: 3,
    rewardEnergy: 30,
    icon: 'daily',
    statKey: 'dailyCompletedCount',
  },
  // Long-term goals for players who have finished the first set.
  {
    id: 'wins_25',
    titleSv: 'Nivåjägare',
    descSv: 'Klara 25 nivåer i kampanjläget.',
    target: 25,
    rewardEnergy: 40,
    icon: 'trophy',
    statKey: 'levelsWon',
  },
  {
    id: 'wins_100',
    titleSv: 'Äventyrare',
    descSv: 'Klara 100 nivåer i kampanjläget.',
    target: 100,
    rewardEnergy: 80,
    icon: 'trophy',
    statKey: 'levelsWon',
  },
  {
    id: 'wins_500',
    titleSv: 'Legend',
    descSv: 'Klara 500 nivåer i kampanjläget.',
    target: 500,
    rewardEnergy: 200,
    icon: 'trophy',
    statKey: 'levelsWon',
  },
  {
    id: 'cascade_7',
    titleSv: 'Kedjemästare',
    descSv: 'Utlös en kedjereaktion på minst ×7 i ett enda drag.',
    target: 7,
    rewardEnergy: 50,
    icon: 'cascade',
    statKey: 'bestCascade',
  },
  {
    id: 'ice_500',
    titleSv: 'Isbrytare',
    descSv: 'Tina sammanlagt 500 isrutor.',
    target: 500,
    rewardEnergy: 60,
    icon: 'ice',
    statKey: 'totalIceCleared',
  },
  {
    id: 'crates_250',
    titleSv: 'Lådkrossare',
    descSv: 'Spräck sammanlagt 250 trälådor.',
    target: 250,
    rewardEnergy: 60,
    icon: 'crate',
    statKey: 'totalCratesCleared',
  },
  {
    id: 'chains_150',
    titleSv: 'Befriare',
    descSv: 'Befria sammanlagt 150 fastkedjade djur.',
    target: 150,
    rewardEnergy: 60,
    icon: 'chain',
    statKey: 'totalChainsCleared',
  },
  {
    id: 'specials_150',
    titleSv: 'Stråltrollare',
    descSv: 'Skapa 150 specialbrickor.',
    target: 150,
    rewardEnergy: 50,
    icon: 'special',
    statKey: 'totalSpecialsCreated',
  },
  {
    id: 'specials_500',
    titleSv: 'Novamästare',
    descSv: 'Skapa 500 specialbrickor.',
    target: 500,
    rewardEnergy: 120,
    icon: 'special',
    statKey: 'totalSpecialsCreated',
  },
  {
    id: 'score_100k',
    titleSv: 'Poängjägare',
    descSv: 'Samla ihop 100 000 poäng totalt.',
    target: 100000,
    rewardEnergy: 60,
    icon: 'score',
    statKey: 'totalScore',
  },
  {
    id: 'score_1m',
    titleSv: 'Poängmiljonär',
    descSv: 'Samla ihop 1 000 000 poäng totalt.',
    target: 1000000,
    rewardEnergy: 200,
    icon: 'score',
    statKey: 'totalScore',
  },
  {
    id: 'daily_10',
    titleSv: 'Daglig mästare',
    descSv: 'Slutför 10 dagliga utmaningar.',
    target: 10,
    rewardEnergy: 60,
    icon: 'daily',
    statKey: 'dailyCompletedCount',
  },
  {
    id: 'daily_30',
    titleSv: 'Daglig legend',
    descSv: 'Slutför 30 dagliga utmaningar.',
    target: 30,
    rewardEnergy: 150,
    icon: 'daily',
    statKey: 'dailyCompletedCount',
  },
];

export const ACHIEVEMENTS_STORAGE_KEY = STORAGE_KEYS.achievements;

export function createInitialAchievementState(): AchievementSaveState {
  return {
    stats: {
      levelsWon: 0,
      bestCascade: 0,
      totalIceCleared: 0,
      totalCratesCleared: 0,
      totalChainsCleared: 0,
      totalSpecialsCreated: 0,
      totalScore: 0,
      dailyCompletedCount: 0,
    },
    unlockedIds: [],
  };
}

export function getAchievementProgress(
  def: AchievementDef,
  state: AchievementSaveState
): { current: number; target: number; pct: number; unlocked: boolean } {
  const raw = state.stats[def.statKey] ?? 0;
  const unlocked = state.unlockedIds.includes(def.id) || raw >= def.target;
  const current = unlocked ? def.target : Math.min(def.target, Math.max(0, raw));
  const pct = Math.min(100, Math.round((current / def.target) * 100));
  return { current, target: def.target, pct, unlocked };
}

function evaluateUnlocks(
  stats: AchievementStats,
  existingUnlocked: AchievementId[]
): { unlockedIds: AchievementId[]; newlyUnlocked: AchievementDef[] } {
  const nextUnlocked = [...existingUnlocked];
  const newlyUnlocked: AchievementDef[] = [];

  for (const def of ACHIEVEMENTS) {
    if (nextUnlocked.includes(def.id)) continue;
    if ((stats[def.statKey] ?? 0) >= def.target) {
      nextUnlocked.push(def.id);
      newlyUnlocked.push(def);
    }
  }

  return { unlockedIds: nextUnlocked, newlyUnlocked };
}

export function applyStepToAchievements(
  state: AchievementSaveState,
  step: CascadeStep
): { nextState: AchievementSaveState; newlyUnlocked: AchievementDef[] } {
  const nextStats: AchievementStats = {
    ...state.stats,
    bestCascade: Math.max(state.stats.bestCascade, step.cascadeIndex),
    totalIceCleared: state.stats.totalIceCleared + step.deltaProgress.clearedIce,
    totalCratesCleared: state.stats.totalCratesCleared + step.deltaProgress.clearedCrates,
    totalChainsCleared: state.stats.totalChainsCleared + step.deltaProgress.clearedChains,
    totalSpecialsCreated: state.stats.totalSpecialsCreated + step.spawnedSpecials.length,
    totalScore: state.stats.totalScore + step.stepScore,
  };

  const { unlockedIds, newlyUnlocked } = evaluateUnlocks(nextStats, state.unlockedIds);
  return {
    nextState: {
      stats: nextStats,
      unlockedIds,
    },
    newlyUnlocked,
  };
}

export function applyRunEndToAchievements(
  state: AchievementSaveState,
  opts: { wonCampaign: boolean; dailyCompletedCount: number; bonusScore?: number }
): { nextState: AchievementSaveState; newlyUnlocked: AchievementDef[] } {
  const nextStats: AchievementStats = {
    ...state.stats,
    levelsWon: state.stats.levelsWon + (opts.wonCampaign ? 1 : 0),
    dailyCompletedCount: Math.max(state.stats.dailyCompletedCount, opts.dailyCompletedCount),
    totalScore: state.stats.totalScore + (opts.bonusScore ?? 0),
  };

  const { unlockedIds, newlyUnlocked } = evaluateUnlocks(nextStats, state.unlockedIds);
  return {
    nextState: {
      stats: nextStats,
      unlockedIds,
    },
    newlyUnlocked,
  };
}

export function readAchievementState(initialDailyCount = 0): AchievementSaveState {
  const fallback = createInitialAchievementState();
  fallback.stats.dailyCompletedCount = initialDailyCount;
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AchievementSaveState>;
    const stats: AchievementStats = {
      ...fallback.stats,
      ...(parsed.stats ?? {}),
      dailyCompletedCount: Math.max(
        initialDailyCount,
        Number(parsed.stats?.dailyCompletedCount ?? 0)
      ),
    };
    const validIds = new Set<AchievementId>(ACHIEVEMENTS.map((a) => a.id));
    const unlockedIds: AchievementId[] = Array.isArray(parsed.unlockedIds)
      ? parsed.unlockedIds.filter((id): id is AchievementId => validIds.has(id as AchievementId))
      : [];
    const evaluated = evaluateUnlocks(stats, unlockedIds);
    return {
      stats,
      unlockedIds: evaluated.unlockedIds,
    };
  } catch {
    return fallback;
  }
}

export function writeAchievementState(state: AchievementSaveState): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota restrictions
  }
}
