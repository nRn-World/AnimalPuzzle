/**
 * Plays generated campaign levels with a simple bot and reports how often it
 * wins, per difficulty. Used to tune MOVE_SLACK in src/game/levels.ts.
 *
 *   bun tools/simulateLevels.ts [levels=240] [gamesPerLevel=4] [startIdx=32]
 *
 * The bot looks one move ahead and picks the move that advances the
 * objectives the most. It never uses tools, so a human does a bit better.
 */
import {
  areObjectivesComplete,
  createBoard,
  createEmptyProgress,
  findAllValidMoves,
  getObjectiveCurrent,
  levelColorPool,
  resolveSwap,
} from '../src/game/engine';
import { CAMPAIGN_LEVEL_COUNT, getCampaignLevel } from '../src/game/levels';
import { addStepDelta } from '../src/game/progress';
import { LevelConfig, LevelProgress } from '../src/game/types';

function rngFrom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function remaining(level: LevelConfig, progress: LevelProgress): number {
  // Sum of "fraction still to do" over objectives
  return level.objectives.reduce(
    (sum, o) => sum + Math.max(0, 1 - getObjectiveCurrent(o, progress) / o.target),
    0
  );
}

function play(level: LevelConfig, seed: number): { won: boolean; used: number } {
  const rng = rngFrom(seed);
  const pool = levelColorPool(level);
  let board = createBoard(level, rng);
  let progress = createEmptyProgress();
  for (let move = 1; move <= level.moves; move++) {
    const moves = findAllValidMoves(board).slice(0, 14);
    if (moves.length === 0) return { won: false, used: move };
    let best = null as null | { board: typeof board; progress: LevelProgress; value: number; exploded: boolean; stole: number };
    for (const m of moves) {
      const res = resolveSwap(board, m.from, m.to, pool, rngFrom(seed * 31 + move), {
        level,
        moveNumber: move,
        enraged: !!level.boss && remaining(level, progress) <= 0.5,
      });
      if (!res.valid) continue;
      let p = progress;
      for (const step of res.steps) p = addStepDelta(p, step);
      // Eggs only count once they land, so reward every row they sink.
      let eggRows = 0;
      for (const row of res.finalBoard) for (const cell of row) if (cell.gem?.egg) eggRows += 7 - cell.row;
      // Bombs close to zero are urgent; an explosion is the worst outcome.
      let bombRisk = res.bombExploded ? 1e6 : 0;
      for (const row of res.finalBoard) for (const cell of row) if (cell.gem?.bomb !== undefined) bombRisk += 400 / cell.gem.bomb;
      const value = -remaining(level, p) * 1000 - eggRows * 25 - bombRisk + res.totalScore / 100 + rng() * 2;
      if (!best || value > best.value) best = { board: res.finalBoard, progress: p, value, exploded: !!res.bombExploded, stole: res.bossStole ?? 0 };
    }
    if (!best) return { won: false, used: move };
    board = best.board;
    progress = best.progress;
    if (areObjectivesComplete(level.objectives, progress)) return { won: true, used: move };
    if (best.exploded) return { won: false, used: move };
    // A boss that steals moves makes the count jump, just as in the game.
    move += best.stole;
  }
  return { won: false, used: level.moves };
}

const levels = Number(process.argv[2] ?? 240);
const games = Number(process.argv[3] ?? 4);
const start = Number(process.argv[4] ?? 32);
const stride = Math.max(1, Math.floor((CAMPAIGN_LEVEL_COUNT - start) / levels));

const stats: Record<string, { games: number; wins: number; usedShare: number; never: number; levels: number }> = {};
// FEATURE=honey|egg|holes plays only levels that have that ingredient.
const feature = process.env.FEATURE;
const hasFeature = (level: LevelConfig) =>
  !feature ||
  (feature === 'honey' && !!level.honeyCells) ||
  (feature === 'egg' && !!level.eggCells) ||
  (feature === 'holes' && !!level.holeCells) ||
  (feature === 'boss' && !!level.boss) ||
  (feature === 'bombs' && !!level.bombEvery) ||
  (feature === 'belts' && !!level.beltRows) ||
  (feature === 'portals' && !!level.portalPairs);
let cursor = start;
for (let i = 0; i < levels; i++) {
  // Mix of consecutive early levels and levels spread over the whole campaign
  let idx = process.env.CONSECUTIVE ? start + i : start + Math.floor(i / 8) * stride * 8 + (i % 8);
  if (feature) {
    while (cursor < CAMPAIGN_LEVEL_COUNT && !hasFeature(getCampaignLevel(cursor))) cursor++;
    if (cursor >= CAMPAIGN_LEVEL_COUNT) break;
    idx = cursor++;
  }
  const level = getCampaignLevel(idx);
  const d = level.difficulty ?? 'medium';
  const s = (stats[d] ??= { games: 0, wins: 0, usedShare: 0, never: 0, levels: 0 });
  let wins = 0;
  const used: number[] = [];
  for (let g = 0; g < games; g++) {
    const r = play(level, idx * 977 + g * 131 + 7);
    s.games++;
    used.push(r.used);
    if (r.won) {
      wins++;
      s.wins++;
      s.usedShare += r.used / level.moves;
    }
  }
  s.levels++;
  if (wins === 0) s.never++;
  if (process.env.DETAIL) {
    console.log(idx + 1, d, 'moves', level.moves, 'colors', level.colorCount, level.objectives.map((o) => `${o.kind}:${o.target}`).join(' '), 'wins', wins, 'used', used.join(','), 'share', (used.reduce((x, y) => x + y, 0) / used.length / level.moves).toFixed(2));
  }
}
for (const [d, s] of Object.entries(stats)) {
  console.log(
    `${d.padEnd(8)} levels ${String(s.levels).padStart(4)}  win ${((100 * s.wins) / s.games).toFixed(0).padStart(3)}%  ` +
      `moves used when winning ${((100 * s.usedShare) / Math.max(1, s.wins)).toFixed(0)}%  never won ${s.never}`
  );
}
