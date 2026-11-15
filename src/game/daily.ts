import { t } from '../i18n';
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import {
  AnimalSkinId,
  AnimalSkinMeta,
  GEM_COLORS_ORDER,
  GEM_META,
  LevelConfig,
} from './types';

export const DAILY_BONUS_ENERGY = 40;
export const MAX_ENERGY_BANK = 200;

export const ANIMAL_SKINS: AnimalSkinMeta[] = [
  {
    id: 'classic',
    nameSv: 'Skogens Vänner',
    descSv: 'Klassiska söta djur',
  },
  {
    id: 'royal',
    nameSv: 'Kungliga Kronor',
    descSv: 'Gyllene kungakronor (Daglig utmaning)',
  },
  {
    id: 'winter',
    nameSv: 'Vintermys',
    descSv: 'Stickade vintermössor (Daglig utmaning)',
  },
  {
    id: 'starlight',
    nameSv: 'Stjärnnatt',
    descSv: 'Glittrande stjärndiadem (Daglig utmaning)',
  },
  {
    id: 'party',
    nameSv: 'Kalashattar',
    descSv: 'Randiga partyhattar (Veckans jakt)',
  },
  {
    id: 'explorer',
    nameSv: 'Upptäckare',
    descSv: 'Upptäckarhattar (Kapitelkistor)',
  },
];

/** Where each skin comes from, shown on locked skins. */
export const SKIN_SOURCE: Record<AnimalSkinId, { text: string }> = {
  classic: { text: 'Upplåst' },
  royal: { text: 'Lås upp i daglig' },
  winter: { text: 'Lås upp i daglig' },
  starlight: { text: 'Lås upp i daglig' },
  party: { text: 'Veckans jakt' },
  explorer: { text: 'Tredje kapitelkistan' },
};

/** Adds a skin and energy to the save (used by weekly hunt and chapter chests). */
export function grantReward(
  state: DailySaveState,
  energy: number,
  skin: AnimalSkinId | null
): { nextState: DailySaveState; unlockedNewSkin: AnimalSkinId | null } {
  const isNew = skin !== null && !state.unlockedSkins.includes(skin);
  return {
    nextState: {
      ...state,
      bonusEnergyBank: Math.min(MAX_ENERGY_BANK, state.bonusEnergyBank + Math.max(0, energy)),
      unlockedSkins: isNew ? [...state.unlockedSkins, skin] : state.unlockedSkins,
    },
    unlockedNewSkin: isNew ? skin : null,
  };
}

export const EXCLUSIVE_DAILY_SKINS: AnimalSkinId[] = ['royal', 'winter', 'starlight'];

export interface DailyChallenge {
  dateKey: string;
  title: string;
  goalSummary: string;
  rewardEnergy: number;
  featuredSkin: AnimalSkinId;
  seed: string;
  level: LevelConfig;
}

export interface DailySaveState {
  completedDates: string[];
  bonusEnergyBank: number;
  unlockedSkins: AnimalSkinId[];
  equippedSkin: AnimalSkinId;
}

export function createInitialDailyState(): DailySaveState {
  return {
    completedDates: [],
    bonusEnergyBank: 0,
    unlockedSkins: ['classic'],
    equippedSkin: 'classic',
  };
}

const VALID_SKINS: AnimalSkinId[] = ['classic', 'royal', 'winter', 'starlight', 'party', 'explorer'];

/** Turns anything read from storage into a valid daily save state. */
export function sanitizeDailyState(raw: unknown): DailySaveState {
  const initial = createInitialDailyState();
  if (!raw || typeof raw !== 'object') return initial;
  const parsed = raw as Partial<Record<keyof DailySaveState, unknown>>;

  const unlocked: AnimalSkinId[] = Array.isArray(parsed.unlockedSkins)
    ? parsed.unlockedSkins.filter((s): s is AnimalSkinId => VALID_SKINS.includes(s as AnimalSkinId))
    : ['classic'];
  if (!unlocked.includes('classic')) unlocked.unshift('classic');

  const equipped = unlocked.includes(parsed.equippedSkin as AnimalSkinId)
    ? (parsed.equippedSkin as AnimalSkinId)
    : 'classic';

  return {
    completedDates: Array.isArray(parsed.completedDates)
      ? parsed.completedDates.filter((d): d is string => typeof d === 'string')
      : [],
    bonusEnergyBank:
      typeof parsed.bonusEnergyBank === 'number' && Number.isFinite(parsed.bonusEnergyBank)
        ? Math.max(0, Math.round(parsed.bonusEnergyBank))
        : 0,
    unlockedSkins: unlocked,
    equippedSkin: equipped,
  };
}

export function readDailyState(): DailySaveState {
  return sanitizeDailyState(readJson(STORAGE_KEYS.daily));
}

export function writeDailyState(state: DailySaveState): void {
  writeJson(STORAGE_KEYS.daily, state);
}

export function getDailyKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createSeededRng(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface DailyTemplate {
  title: string;
  build: (rng: () => number, dateKey: string) => {
    goalSummary: string;
    level: LevelConfig;
  };
}

const DAILY_TEMPLATES: DailyTemplate[] = [
  {
    title: 'Djurkalas',
    build: (rng) => {
      const colorCount = rng() > 0.45 ? 6 : 5;
      const idx1 = Math.floor(rng() * colorCount);
      const idx2 = (idx1 + 2) % colorCount;
      const c1 = GEM_COLORS_ORDER[idx1];
      const c2 = GEM_COLORS_ORDER[idx2];
      const t1 = 18 + Math.floor(rng() * 5);
      const t2 = 16 + Math.floor(rng() * 5);
      return {
        goalSummary: t('Samla {a} {x} och {b} {y} på 20 drag', {
          a: t1,
          x: t(GEM_META[c1].nameSv),
          b: t2,
          y: t(GEM_META[c2].nameSv),
        }),
        level: {
          id: 100,
          name: 'Djurkalas',
          subtitle: t('Samla {a} {x} och {b} {y}', {
            a: t1,
            x: t(GEM_META[c1].nameSv),
            b: t2,
            y: t(GEM_META[c2].nameSv),
          }),
          moves: 20,
          colorCount,
          objectives: [
            { id: 'd-c1', kind: 'color', color: c1, label: GEM_META[c1].nameSv, target: t1 },
            { id: 'd-c2', kind: 'color', color: c2, label: GEM_META[c2].nameSv, target: t2 },
          ],
        },
      };
    },
  },
  {
    title: 'Frostens Väktare',
    build: (rng) => {
      const iceCells: Array<{ row: number; col: number; hp: number }> = [];
      for (let r = 2; r <= 5; r++) {
        for (let c = 2; c <= 5; c++) {
          if ((r + c) % 2 === 0 || rng() > 0.4) {
            iceCells.push({ row: r, col: c, hp: r === 3 || r === 4 ? 2 : 1 });
          }
        }
      }
      const target = Math.min(14, iceCells.length);
      return {
        goalSummary: t('Tina {n} isrutor på 22 drag', { n: target }),
        level: {
          id: 101,
          name: 'Frostens Väktare',
          subtitle: t('Tina minst {n} frostade rutor', { n: target }),
          moves: 22,
          colorCount: 5,
          objectives: [{ id: 'd-ice', kind: 'ice', label: 'Isrutor', target }],
          iceCells,
        },
      };
    },
  },
  {
    title: 'Stjärnsmide',
    build: () => {
      return {
        goalSummary: 'Skapa 4 specialdjur (Stråle, Nova eller Prisma) på 20 drag',
        level: {
          id: 102,
          name: 'Stjärnsmide',
          subtitle: 'Matcha 4+ eller T/L-form för att smida 4 specialare',
          moves: 20,
          colorCount: 5,
          objectives: [
            { id: 'd-spec', kind: 'specials', label: 'Specialare skapade', target: 4 },
            { id: 'd-score', kind: 'score', label: 'Poäng', target: 1600 },
          ],
        },
      };
    },
  },
  {
    title: 'Kaskadmästare',
    build: () => {
      return {
        goalSummary: 'Uppnå 2 kedjereaktioner på minst ×3 och 2 200 poäng',
        level: {
          id: 103,
          name: 'Kaskadmästare',
          subtitle: 'Bygg minst 2 stycken ×3-kaskader',
          moves: 22,
          colorCount: 5,
          objectives: [
            { id: 'd-casc', kind: 'cascade3', label: 'Kaskad ×3+', target: 2 },
            { id: 'd-score', kind: 'score', label: 'Poäng', target: 2200 },
          ],
        },
      };
    },
  },
  {
    title: 'Trälåda-jakt',
    build: () => {
      const crateCells = [
        { row: 2, col: 2, hp: 1 },
        { row: 2, col: 5, hp: 1 },
        { row: 3, col: 3, hp: 2 },
        { row: 3, col: 4, hp: 2 },
        { row: 4, col: 3, hp: 2 },
        { row: 4, col: 4, hp: 2 },
        { row: 5, col: 2, hp: 1 },
        { row: 5, col: 5, hp: 1 },
      ];
      return {
        goalSummary: 'Spräck alla 8 trälådor på 22 drag',
        level: {
          id: 104,
          name: 'Trälåda-jakt',
          subtitle: 'Matcha bredvid lådorna för att spräcka dem',
          moves: 22,
          colorCount: 5,
          objectives: [{ id: 'd-crate', kind: 'crate', label: 'Trälådor', target: 8 }],
          crateCells,
        },
      };
    },
  },
];

export function getDailyChallenge(dateKey: string): DailyChallenge {
  // The seed strings predate the game's final name. They must never change:
  // they decide which challenge and board every player gets on a given date.
  const rng = createSeededRng(`kromatik-daily-${dateKey}`);
  const tplIdx = Math.floor(rng() * DAILY_TEMPLATES.length);
  const template = DAILY_TEMPLATES[tplIdx];
  const { goalSummary, level } = template.build(rng, dateKey);

  // The featured skin belongs to the date, not to the current save. It must not
  // change when claiming the reward unlocks a skin and triggers a re-render.
  const featuredSkin = EXCLUSIVE_DAILY_SKINS[Math.floor(rng() * EXCLUSIVE_DAILY_SKINS.length)];

  return {
    dateKey,
    title: template.title,
    goalSummary,
    rewardEnergy: DAILY_BONUS_ENERGY,
    featuredSkin,
    seed: `kromatik-board-${dateKey}`,
    level,
  };
}

export function getSkinMeta(id: AnimalSkinId): AnimalSkinMeta {
  return ANIMAL_SKINS.find((s) => s.id === id) ?? ANIMAL_SKINS[0];
}

export function claimDailyReward(
  state: DailySaveState,
  dateKey: string,
  rewardSkin: AnimalSkinId,
  rewardEnergy: number = DAILY_BONUS_ENERGY
): {
  nextState: DailySaveState;
  newlyCompleted: boolean;
  unlockedNewSkin: AnimalSkinId | null;
  energyGranted: number;
} {
  if (state.completedDates.includes(dateKey)) {
    return {
      nextState: state,
      newlyCompleted: false,
      unlockedNewSkin: null,
      energyGranted: 0,
    };
  }

  let unlockedNewSkin: AnimalSkinId | null = null;
  const nextSkins = [...state.unlockedSkins];
  if (!nextSkins.includes(rewardSkin)) {
    nextSkins.push(rewardSkin);
    unlockedNewSkin = rewardSkin;
  } else {
    const nextUnowned = EXCLUSIVE_DAILY_SKINS.find((s) => !nextSkins.includes(s));
    if (nextUnowned) {
      nextSkins.push(nextUnowned);
      unlockedNewSkin = nextUnowned;
    }
  }

  const nextBank = Math.min(MAX_ENERGY_BANK, state.bonusEnergyBank + rewardEnergy);

  return {
    nextState: {
      ...state,
      completedDates: [...state.completedDates, dateKey],
      bonusEnergyBank: nextBank,
      unlockedSkins: nextSkins,
    },
    newlyCompleted: true,
    unlockedNewSkin,
    energyGranted: rewardEnergy,
  };
}

export function equipAnimalSkin(
  state: DailySaveState,
  skinId: AnimalSkinId
): DailySaveState {
  if (!state.unlockedSkins.includes(skinId)) {
    return state;
  }
  return {
    ...state,
    equippedSkin: skinId,
  };
}

export function consumeBonusEnergy(
  state: DailySaveState,
  maxToLoad: number
): { nextState: DailySaveState; loadedEnergy: number } {
  const loadedEnergy = Math.min(state.bonusEnergyBank, maxToLoad);
  if (loadedEnergy <= 0) {
    return { nextState: state, loadedEnergy: 0 };
  }
  return {
    nextState: {
      ...state,
      bonusEnergyBank: state.bonusEnergyBank - loadedEnergy,
    },
    loadedEnergy,
  };
}
