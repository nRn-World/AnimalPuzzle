export const BOARD_SIZE = 8;

export type GemColor =
  | 'ruby'
  | 'amber'
  | 'emerald'
  | 'cobalt'
  | 'amethyst'
  | 'quartz'
  | 'tangerine'
  | 'lime'
  | 'sky'
  | 'violet'
  | 'rose'
  | 'mint';

export type SpecialType = 'none' | 'beam_h' | 'beam_v' | 'nova' | 'scout' | 'prism';

export type ComboType =
  | 'crossbeam'
  | 'supernova'
  | 'starburst'
  | 'prism'
  | 'prism_beam'
  | 'prism_nova'
  | 'prism_storm'
  | 'scout_flock'
  | 'scout_beam'
  | 'scout_nova'
  | 'prism_scout';

export interface Gem {
  id: number;
  color: GemColor;
  special: SpecialType;
  chained: boolean;
  /** An egg never matches; it has to be brought down to the bottom row. */
  egg?: boolean;
  /** Moves left before this animal's bomb goes off. Matching it defuses it. */
  bomb?: number;
}

export interface Cell {
  row: number;
  col: number;
  gem: Gem | null;
  ice: number; // 0 = clear, 1 = thin frost, 2 = deep permafrost
  crate: number; // 0 = open, 1 = cracked geode, 2 = solid basalt geode
  /**
   * What kind of blocker a cell with crate > 0 is. Unset = wooden crate.
   * 'hole' is a gap in the board that can never be opened; 'honey' breaks
   * in one hit but spreads on every move that clears none of it.
   */
  block?: 'hole' | 'honey';
  /** Conveyor belt: after every move the animals on it slide one step (1 = right, -1 = left). */
  belt?: 1 | -1;
  /** Portal pair number: after every move the two cells of a pair trade animals. */
  portal?: number;
}

/** `crate` value of a hole: high enough that nothing ever wears it down. */
export const HOLE_HP = 9;

export type Board = Cell[][];

export interface Coord {
  row: number;
  col: number;
}

export type GameMode = 'campaign' | 'endless' | 'daily';

export type AnimalSkinId =
  | 'classic'
  | 'royal'
  | 'winter'
  | 'starlight'
  | 'party'
  | 'explorer'
  | 'santa'
  | 'easter'
  | 'summer';

export interface AnimalSkinMeta {
  id: AnimalSkinId;
  nameSv: string;
  descSv: string;
}

export type GamePhase =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'VICTORY'
  | 'GAME_OVER';

export type ToolType = 'hammer' | 'pulse' | 'shuffle';

export type ObjectiveKind =
  | 'color'
  | 'ice'
  | 'crate'
  | 'chain'
  | 'honey'
  | 'egg'
  | 'boss'
  | 'score'
  | 'specials'
  | 'cascade3';

export interface LevelObjective {
  id: string;
  kind: ObjectiveKind;
  color?: GemColor;
  label: string;
  target: number;
}

export interface LevelProgress {
  score: number;
  clearedColors: Record<GemColor, number>;
  clearedIce: number;
  clearedCrates: number;
  clearedChains: number;
  clearedHoney: number;
  collectedEggs: number;
  specialsCreated: number;
  cascade3Count: number;
}

export type LevelDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  moves: number;
  colorCount: number; // 5 or 6
  /** Optional animal crew for this level. Defaults to the first colorCount colors. */
  palette?: GemColor[];
  /** Campaign chapter (1-4). Omitted for daily/endless configs. */
  chapter?: number;
  difficulty?: LevelDifficulty;
  objectives: LevelObjective[];
  iceCells?: Array<{ row: number; col: number; hp: number }>;
  crateCells?: Array<{ row: number; col: number; hp: number }>;
  chainCells?: Array<{ row: number; col: number }>;
  /** Gaps that shape the board. */
  holeCells?: Array<{ row: number; col: number }>;
  honeyCells?: Array<{ row: number; col: number }>;
  eggCells?: Array<{ row: number; col: number }>;
  /** Animals that start with a ticking bomb. */
  bombCells?: Array<{ row: number; col: number; timer: number }>;
  /** A new bomb appears every this many moves, with `bombTimer` moves on the clock. */
  bombEvery?: number;
  bombTimer?: number;
  /** Rows that work as conveyor belts. */
  beltRows?: Array<{ row: number; dir: 1 | -1 }>;
  /** Pairs of portal cells that trade animals after every move. */
  portalPairs?: Array<[Coord, Coord]>;
  /** Boss level: every `every` moves the boss chains `count` animals. */
  boss?: { every: number; count: number };
}

export interface BlastEvent {
  type:
    | 'beam_h'
    | 'beam_v'
    | 'nova'
    | 'prism'
    | 'scout'
    | 'ice'
    | 'crate'
    | 'chain'
    | 'honey'
    | 'egg'
    | 'match';
  row: number;
  col: number;
  color?: GemColor;
  /** For a scout: the cell it took off from (row/col is where it lands). */
  from?: Coord;
}

export interface CascadeStep {
  boardAfterClear: Board;
  boardAfterGravity: Board;
  clearedCoords: Coord[];
  spawnedSpecials: Array<{ coord: Coord; special: SpecialType; color: GemColor }>;
  blasts: BlastEvent[];
  stepScore: number;
  cascadeIndex: number; // 1-based
  energyGained: number;
  deltaProgress: {
    clearedColors: Record<GemColor, number>;
    clearedIce: number;
    clearedCrates: number;
    clearedChains: number;
    clearedHoney: number;
    collectedEggs: number;
  };
}

export interface SwapResult {
  valid: boolean;
  reason?: 'not_adjacent' | 'blocked' | 'no_match';
  steps: CascadeStep[];
  finalBoard: Board;
  totalScore: number;
  totalEnergy: number;
  maxCascade: number;
  reshuffled: boolean;
  /** Set when two specials (or a prism and a normal gem) are combined. */
  combo?: ComboType;
  /** Cell the honey crept into because the move cleared none of it. */
  honeySpread?: Coord;
  /** A bomb ran out of time: the level is lost. */
  bombExploded?: Coord;
  /** Animals that got a new bomb this move. */
  bombsPlanted?: Coord[];
  /** Animals the boss chained this move. */
  bossAttack?: Coord[];
}

/** What the engine needs to know about the level to run end-of-move events. */
export interface TurnContext {
  level: LevelConfig;
  /** 1-based number of the move being played. */
  moveNumber: number;
}

export interface HintMove {
  from: Coord;
  to: Coord;
  score: number;
  createsSpecial: SpecialType;
}

export const GEM_COLORS_ORDER: GemColor[] = [
  'ruby',
  'amber',
  'emerald',
  'cobalt',
  'amethyst',
  'quartz',
  'tangerine',
  'lime',
  'sky',
  'violet',
  'rose',
  'mint',
];

export const GEM_META: Record<
  GemColor,
  { nameSv: string; hex: string; lightHex: string; darkHex: string }
> = {
  ruby: {
    nameSv: 'Räv',
    hex: '#E94E65',
    lightHex: '#FF8A9B',
    darkHex: '#9E1F34',
  },
  amber: {
    nameSv: 'Lejon',
    hex: '#F59E0B',
    lightHex: '#FDE047',
    darkHex: '#B45309',
  },
  emerald: {
    nameSv: 'Groda',
    hex: '#19B87A',
    lightHex: '#6EE7B7',
    darkHex: '#047857',
  },
  cobalt: {
    nameSv: 'Pingvin',
    hex: '#3B82F6',
    lightHex: '#93C5FD',
    darkHex: '#1D4ED8',
  },
  amethyst: {
    nameSv: 'Kanin',
    hex: '#A855F7',
    lightHex: '#D8B4FE',
    darkHex: '#6B21A8',
  },
  quartz: {
    nameSv: 'Isbjörn',
    hex: '#E8EFFA',
    lightHex: '#FFFFFF',
    darkHex: '#94A3B8',
  },
  tangerine: {
    nameSv: 'Tiger',
    hex: '#FB923C',
    lightHex: '#FDBA74',
    darkHex: '#C2410C',
  },
  lime: {
    nameSv: 'Sköldpadda',
    hex: '#84CC16',
    lightHex: '#BEF264',
    darkHex: '#4D7C0F',
  },
  sky: {
    nameSv: 'Delfin',
    hex: '#38BDF8',
    lightHex: '#7DD3FC',
    darkHex: '#0369A1',
  },
  violet: {
    nameSv: 'Panda',
    hex: '#8B5CF6',
    lightHex: '#C4B5FD',
    darkHex: '#5B21B6',
  },
  rose: {
    nameSv: 'Uggla',
    hex: '#F472B6',
    lightHex: '#F9A8D4',
    darkHex: '#9D174D',
  },
  mint: {
    nameSv: 'Säl',
    hex: '#2DD4BF',
    lightHex: '#5EEAD4',
    darkHex: '#0F766E',
  },
};

export const TOOL_COSTS: Record<ToolType, number> = {
  hammer: 30,
  pulse: 55,
  shuffle: 20,
};
