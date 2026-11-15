import { AnimalSkinId } from './types';

export type SeasonId = 'jul' | 'pask' | 'sommar';

export interface SeasonDef {
  id: SeasonId;
  nameSv: string;
  skin: AnimalSkinId;
  /** [month, day], inclusive. A season may run over New Year. */
  from: [number, number];
  to: [number, number];
}

export const SEASONS: SeasonDef[] = [
  { id: 'pask', nameSv: 'Påskjakten', skin: 'easter', from: [3, 20], to: [4, 25] },
  { id: 'sommar', nameSv: 'Sommarlovet', skin: 'summer', from: [6, 15], to: [8, 15] },
  { id: 'jul', nameSv: 'Julfesten', skin: 'santa', from: [12, 1], to: [1, 6] },
];

/** Animals (of any kind) to collect during a season. */
export const SEASON_TARGET = 1500;
export const SEASON_REWARD_ENERGY = 150;

const DAY_MS = 86400000;
const dayStamp = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day);

function windowFor(season: SeasonDef, startYear: number): { start: number; end: number } {
  const wraps = season.to[0] < season.from[0];
  return {
    start: dayStamp(startYear, season.from[0], season.from[1]),
    end: dayStamp(startYear + (wraps ? 1 : 0), season.to[0], season.to[1]),
  };
}

export interface ActiveSeason {
  season: SeasonDef;
  /** Unique per occurrence, e.g. "jul-2026". */
  key: string;
  /** Days left including today. */
  daysLeft: number;
}

export function getActiveSeason(date: Date = new Date()): ActiveSeason | null {
  const today = dayStamp(date.getFullYear(), date.getMonth() + 1, date.getDate());
  for (const season of SEASONS) {
    for (const startYear of [date.getFullYear() - 1, date.getFullYear()]) {
      const { start, end } = windowFor(season, startYear);
      if (today >= start && today <= end) {
        return { season, key: `${season.id}-${startYear}`, daysLeft: Math.round((end - today) / DAY_MS) + 1 };
      }
    }
  }
  return null;
}

/** The season that starts next, and in how many days. */
export function getNextSeason(date: Date = new Date()): { season: SeasonDef; startsInDays: number } {
  const today = dayStamp(date.getFullYear(), date.getMonth() + 1, date.getDate());
  let best: { season: SeasonDef; startsInDays: number } | null = null;
  for (const season of SEASONS) {
    for (const startYear of [date.getFullYear(), date.getFullYear() + 1]) {
      const { start } = windowFor(season, startYear);
      if (start <= today) continue;
      const startsInDays = Math.round((start - today) / DAY_MS);
      if (!best || startsInDays < best.startsInDays) best = { season, startsInDays };
    }
  }
  return best!;
}

/** Lets a season be previewed with ?season=jul in the address. */
export function forcedSeason(search: string, date: Date = new Date()): ActiveSeason | null {
  const id = new URLSearchParams(search).get('season');
  const season = SEASONS.find((s) => s.id === id);
  return season ? { season, key: `${season.id}-${date.getFullYear()}`, daysLeft: 7 } : null;
}
