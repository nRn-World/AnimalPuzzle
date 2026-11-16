/**
 * First-time obstacle introductions: when a player meets a new mechanic
 * (frost, crates, chains, honey, eggs, bombs, belts, portals or a boss)
 * for the first time, show a quick one-tap card explaining how it works.
 */
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import { LevelConfig } from './types';

export type ObstacleIntroId =
  | 'ice'
  | 'crate'
  | 'chain'
  | 'honey'
  | 'egg'
  | 'bomb'
  | 'belt'
  | 'portal'
  | 'boss';

export interface ObstacleIntroDef {
  id: ObstacleIntroId;
  titleSv: string;
  descSv: string;
}

export const OBSTACLE_INTROS: Record<ObstacleIntroId, ObstacleIntroDef> = {
  ice: {
    id: 'ice',
    titleSv: 'Nytt hinder: Frost & Is',
    descSv: 'Matcha djur ovanpå isrutor för att tina bort frosten. Tjock is behöver två träffar!',
  },
  crate: {
    id: 'crate',
    titleSv: 'Nytt hinder: Trälådor',
    descSv: 'Gör matchningar precis intill en trälåda eller träffa den med en specialbricka för att spräcka den.',
  },
  chain: {
    id: 'chain',
    titleSv: 'Nytt hinder: Kedjor',
    descSv: 'Kedjade djur går inte att flytta, men matcha dem på plats för att slå sönder kedjan!',
  },
  honey: {
    id: 'honey',
    titleSv: 'Nytt hinder: Honung',
    descSv: 'Rensa honung genom att matcha intill den. Varje drag utan rensad honung låter den sprida sig en ruta!',
  },
  egg: {
    id: 'egg',
    titleSv: 'Nytt mål: Guldägg',
    descSv: 'Ägg kan inte matchas – rensa djuren under dem så att äggen faller hela vägen ner till botten!',
  },
  bomb: {
    id: 'bomb',
    titleSv: 'Varning: Tickande bomb',
    descSv: 'Bomben räknar ner ett steg varje drag. Matcha eller spräng djuret innan räknaren når noll!',
  },
  belt: {
    id: 'belt',
    titleSv: 'Ny mekanik: Rullband',
    descSv: 'Efter varje drag glider djuren på rullbandet ett steg i pilarnas riktning – utnyttja det för kedjor!',
  },
  portal: {
    id: 'portal',
    titleSv: 'Ny mekanik: Portaler',
    descSv: 'Portaler i samma färg byter djur med varandra efter varje drag.',
  },
  boss: {
    id: 'boss',
    titleSv: 'Bossstrid!',
    descSv: 'Varje rensat djur skadar bossen! Vid halva hälsan blir den rasande och attackerar oftare.',
  },
};

const INTRO_ORDER: readonly ObstacleIntroId[] = [
  'boss',
  'bomb',
  'honey',
  'egg',
  'portal',
  'belt',
  'chain',
  'crate',
  'ice',
];

export function levelHasObstacle(level: LevelConfig, id: ObstacleIntroId): boolean {
  switch (id) {
    case 'ice':
      return Boolean(level.iceCells?.length || level.objectives.some((o) => o.kind === 'ice'));
    case 'crate':
      return Boolean(level.crateCells?.length || level.objectives.some((o) => o.kind === 'crate'));
    case 'chain':
      return Boolean(level.chainCells?.length || level.objectives.some((o) => o.kind === 'chain'));
    case 'honey':
      return Boolean(level.honeyCells?.length || level.objectives.some((o) => o.kind === 'honey'));
    case 'egg':
      return Boolean(level.eggCells?.length || level.objectives.some((o) => o.kind === 'egg'));
    case 'bomb':
      return Boolean(level.bombCells?.length || level.bombEvery);
    case 'belt':
      return Boolean(level.beltRows?.length);
    case 'portal':
      return Boolean(level.portalPairs?.length);
    case 'boss':
      return Boolean(level.boss || level.objectives.some((o) => o.kind === 'boss'));
  }
}

/** Returns the first mechanic on `level` the player has not been introduced to yet. */
export function detectNewObstacle(
  level: LevelConfig,
  seen: readonly string[]
): ObstacleIntroDef | null {
  const seenSet = new Set(seen);
  for (const id of INTRO_ORDER) {
    if (!seenSet.has(id) && levelHasObstacle(level, id)) {
      return OBSTACLE_INTROS[id];
    }
  }
  return null;
}

export function sanitizeSeenObstacles(raw: unknown): ObstacleIntroId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(INTRO_ORDER);
  const out: ObstacleIntroId[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && valid.has(item) && !out.includes(item as ObstacleIntroId)) {
      out.push(item as ObstacleIntroId);
    }
  }
  return out;
}

export function readSeenObstacles(): ObstacleIntroId[] {
  return sanitizeSeenObstacles(readJson(STORAGE_KEYS.seenObstacles));
}

export function writeSeenObstacles(seen: readonly ObstacleIntroId[]): void {
  writeJson(STORAGE_KEYS.seenObstacles, [...seen]);
}
