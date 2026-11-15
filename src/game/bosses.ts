/** Every landscape has its own boss, with a name, a look and a way of fighting back. */
import { BiomeId } from './biomes';

export type BossAttack = 'chain' | 'crate' | 'bomb' | 'steal';

export interface BossDef {
  biome: BiomeId;
  nameSv: string;
  attack: BossAttack;
  /** Moves between attacks on normal levels (one less on the hardest). */
  every: number;
  /** Animals hit per attack (moves taken, for `steal`). */
  count: number;
  /** Countdown of a planted bomb. */
  timer?: number;
  attackSv: string;
  introSv: string;
}

export const BOSSES: Record<BiomeId, BossDef> = {
  skargard: {
    biome: 'skargard',
    nameSv: 'Kapten Krake',
    attack: 'chain',
    every: 4,
    count: 2,
    attackSv: 'Kapten Krake kedjar fast djur!',
    introSv: 'Kedjar fast två djur var fjärde drag',
  },
  ang: {
    biome: 'ang',
    nameSv: 'Getingdrottningen',
    attack: 'bomb',
    every: 6,
    count: 1,
    timer: 9,
    attackSv: 'Getingdrottningen lägger en bomb!',
    introSv: 'Lägger en bomb med nedräkning var sjätte drag',
  },
  oken: {
    biome: 'oken',
    nameSv: 'Sandormen',
    attack: 'crate',
    every: 4,
    count: 2,
    attackSv: 'Sandormen begraver djur i lådor!',
    introSv: 'Begraver två djur i lådor var fjärde drag',
  },
  vinter: {
    biome: 'vinter',
    nameSv: 'Isdraken',
    attack: 'chain',
    every: 5,
    count: 4,
    attackSv: 'Isdraken fryser fast djur!',
    introSv: 'Fryser fast fyra djur var femte drag',
  },
  rymden: {
    biome: 'rymden',
    nameSv: 'Kapten Blip',
    attack: 'steal',
    every: 6,
    count: 1,
    attackSv: 'Kapten Blip stal ett drag!',
    introSv: 'Stjäl ett drag var sjätte drag',
  },
  vulkan: {
    biome: 'vulkan',
    nameSv: 'Lavadraken',
    attack: 'bomb',
    every: 6,
    count: 1,
    timer: 12,
    attackSv: 'Lavadraken spottar en bomb!',
    introSv: 'Spottar en bomb med nedräkning var sjätte drag',
  },
};
