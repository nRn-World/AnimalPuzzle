import {
  BOARD_SIZE,
  BlastEvent,
  Board,
  CascadeStep,
  Cell,
  ComboType,
  Coord,
  GEM_COLORS_ORDER,
  Gem,
  GemColor,
  HintMove,
  LevelConfig,
  LevelObjective,
  LevelProgress,
  SpecialType,
  SwapResult,
  ToolType,
} from './types';

let nextGemId = 1;
export function allocGemId(): number {
  return nextGemId++;
}

export type RngFn = () => number;

export function cloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      gem: cell.gem ? { ...cell.gem } : null,
    }))
  );
}

export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function emptyColorCounts(): Record<GemColor, number> {
  const counts = {} as Record<GemColor, number>;
  for (const color of GEM_COLORS_ORDER) {
    counts[color] = 0;
  }
  return counts;
}

export type ColorPool = GemColor[];

/** The animal crew a level plays with. Levels without a palette use the classic six. */
export function levelColorPool(level: LevelConfig): ColorPool {
  const base = level.palette && level.palette.length > 0 ? level.palette : GEM_COLORS_ORDER;
  const pool = base.slice(0, Math.max(1, level.colorCount));
  return pool.length > 0 ? pool : GEM_COLORS_ORDER.slice(0, level.colorCount);
}

function resolveColorPool(colors: number | ColorPool): ColorPool {
  return typeof colors === 'number'
    ? GEM_COLORS_ORDER.slice(0, Math.max(1, colors))
    : colors;
}

function pickRandomColor(
  pool: ColorPool,
  rng: RngFn,
  exclude: Set<GemColor> = new Set()
): GemColor {
  const candidates = pool.filter((c) => !exclude.has(c));
  const finalPool = candidates.length > 0 ? candidates : pool;
  const idx = Math.floor(rng() * finalPool.length);
  return finalPool[Math.min(idx, finalPool.length - 1)];
}

export function createEmptyProgress(): LevelProgress {
  return {
    score: 0,
    clearedColors: emptyColorCounts(),
    clearedIce: 0,
    clearedCrates: 0,
    clearedChains: 0,
    specialsCreated: 0,
    cascade3Count: 0,
  };
}

export function createBoard(level: LevelConfig, rng: RngFn = Math.random): Board {
  const pool = levelColorPool(level);
  const board: Board = Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (__, col) => ({
      row,
      col,
      gem: null,
      ice: 0,
      crate: 0,
    }))
  );

  for (const ice of level.iceCells ?? []) {
    if (inBounds(ice.row, ice.col)) {
      board[ice.row][ice.col].ice = ice.hp;
    }
  }

  for (const crate of level.crateCells ?? []) {
    if (inBounds(crate.row, crate.col)) {
      board[crate.row][crate.col].crate = crate.hp;
      board[crate.row][crate.col].ice = 0;
    }
  }

  const chainSet = new Set<string>(
    (level.chainCells ?? []).map((c) => `${c.row},${c.col}`)
  );

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].crate > 0) continue;
      const excluded = new Set<GemColor>();
      if (
        c >= 2 &&
        board[r][c - 1].gem &&
        board[r][c - 2].gem &&
        board[r][c - 1].gem!.color === board[r][c - 2].gem!.color
      ) {
        excluded.add(board[r][c - 1].gem!.color);
      }
      if (
        r >= 2 &&
        board[r - 1][c].gem &&
        board[r - 2][c].gem &&
        board[r - 1][c].gem!.color === board[r - 2][c].gem!.color
      ) {
        excluded.add(board[r - 1][c].gem!.color);
      }
      if (
        r >= 1 &&
        c >= 1 &&
        board[r - 1][c].gem &&
        board[r][c - 1].gem &&
        board[r - 1][c - 1].gem &&
        board[r - 1][c].gem!.color === board[r][c - 1].gem!.color &&
        board[r - 1][c].gem!.color === board[r - 1][c - 1].gem!.color
      ) {
        excluded.add(board[r - 1][c].gem!.color);
      }

      const color = pickRandomColor(pool, rng, excluded);
      board[r][c].gem = {
        id: allocGemId(),
        color,
        special: 'none',
        chained: chainSet.has(`${r},${c}`),
      };
    }
  }

  if (!hasValidMoves(board)) {
    return shuffleBoard(board, pool, rng);
  }
  return board;
}

export function canSwap(board: Board, a: Coord, b: Coord): boolean {
  if (!inBounds(a.row, a.col) || !inBounds(b.row, b.col)) return false;
  const dist = Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
  if (dist !== 1) return false;
  const cellA = board[a.row][a.col];
  const cellB = board[b.row][b.col];
  if (cellA.crate > 0 || cellB.crate > 0) return false;
  if (!cellA.gem || !cellB.gem) return false;
  if (cellA.gem.chained || cellB.gem.chained) return false;
  return true;
}

export interface MatchGroup {
  cells: Coord[];
  color: GemColor;
  special: SpecialType;
  maxRunLen: number;
}

interface RunSegment {
  cells: Coord[];
  color: GemColor;
  orientation: 'h' | 'v' | 'sq';
}

export function findMatchGroups(board: Board): MatchGroup[] {
  const runs: RunSegment[] = [];

  // Horizontal runs
  for (let r = 0; r < BOARD_SIZE; r++) {
    let c = 0;
    while (c < BOARD_SIZE) {
      const gem = board[r][c].gem;
      if (!gem || board[r][c].crate > 0) {
        c++;
        continue;
      }
      const color = gem.color;
      const runCells: Coord[] = [{ row: r, col: c }];
      let k = c + 1;
      while (
        k < BOARD_SIZE &&
        board[r][k].crate === 0 &&
        board[r][k].gem &&
        board[r][k].gem!.color === color
      ) {
        runCells.push({ row: r, col: k });
        k++;
      }
      if (runCells.length >= 3) {
        runs.push({ cells: runCells, color, orientation: 'h' });
      }
      c = k;
    }
  }

  // Vertical runs
  for (let c = 0; c < BOARD_SIZE; c++) {
    let r = 0;
    while (r < BOARD_SIZE) {
      const gem = board[r][c].gem;
      if (!gem || board[r][c].crate > 0) {
        r++;
        continue;
      }
      const color = gem.color;
      const runCells: Coord[] = [{ row: r, col: c }];
      let k = r + 1;
      while (
        k < BOARD_SIZE &&
        board[k][c].crate === 0 &&
        board[k][c].gem &&
        board[k][c].gem!.color === color
      ) {
        runCells.push({ row: k, col: c });
        k++;
      }
      if (runCells.length >= 3) {
        runs.push({ cells: runCells, color, orientation: 'v' });
      }
      r = k;
    }
  }

  // 2x2 squares of one animal also count as a match (they create a scout)
  for (let r = 0; r + 1 < BOARD_SIZE; r++) {
    for (let c = 0; c + 1 < BOARD_SIZE; c++) {
      const quad = [board[r][c], board[r][c + 1], board[r + 1][c], board[r + 1][c + 1]];
      if (quad.some((cell) => !cell.gem || cell.crate > 0)) continue;
      const color = quad[0].gem!.color;
      if (quad.every((cell) => cell.gem!.color === color)) {
        runs.push({
          cells: quad.map((cell) => ({ row: cell.row, col: cell.col })),
          color,
          orientation: 'sq',
        });
      }
    }
  }

  if (runs.length === 0) return [];

  // Merge intersecting runs of the same color
  const visited = new Array(runs.length).fill(false);
  const runCoordSets = runs.map(
    (run) => new Set(run.cells.map((pt) => `${pt.row},${pt.col}`))
  );

  const groups: MatchGroup[] = [];

  for (let i = 0; i < runs.length; i++) {
    if (visited[i]) continue;
    visited[i] = true;
    const queue = [i];
    const groupRuns: RunSegment[] = [runs[i]];
    const color = runs[i].color;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (let j = 0; j < runs.length; j++) {
        if (visited[j] || runs[j].color !== color) continue;
        let overlaps = false;
        for (const key of runCoordSets[curr]) {
          if (runCoordSets[j].has(key)) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) {
          visited[j] = true;
          queue.push(j);
          groupRuns.push(runs[j]);
        }
      }
    }

    const coordMap = new Map<string, Coord>();
    let hasH = false;
    let hasV = false;
    let maxRunLen = 0;
    let maxOrientation: 'h' | 'v' = 'h';

    let hasSquare = false;

    for (const seg of groupRuns) {
      if (seg.orientation === 'h') hasH = true;
      if (seg.orientation === 'v') hasV = true;
      if (seg.orientation === 'sq') hasSquare = true;
      if (seg.orientation !== 'sq' && seg.cells.length > maxRunLen) {
        maxRunLen = seg.cells.length;
        maxOrientation = seg.orientation;
      }
      for (const pt of seg.cells) {
        coordMap.set(`${pt.row},${pt.col}`, pt);
      }
    }

    let special: SpecialType = 'none';
    if (maxRunLen >= 5) {
      special = 'prism';
    } else if (hasH && hasV) {
      special = 'nova';
    } else if (maxRunLen === 4) {
      special = maxOrientation === 'h' ? 'beam_v' : 'beam_h';
    } else if (hasSquare) {
      special = 'scout';
    }

    groups.push({
      cells: Array.from(coordMap.values()),
      color,
      special,
      maxRunLen,
    });
  }

  return groups;
}

function isImpassable(cell: Cell): boolean {
  return cell.crate > 0 || (cell.gem !== null && cell.gem.chained);
}

export function applyGravityAndRefill(
  board: Board,
  colors: number | ColorPool,
  rng: RngFn = Math.random
): Board {
  const pool = resolveColorPool(colors);
  const next = cloneBoard(board);

  let changed = true;
  let guard = 0;
  while (changed && guard < 32) {
    changed = false;
    guard++;

    // 1. Vertical fall
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = BOARD_SIZE - 1; r >= 1; r--) {
        if (next[r][c].crate === 0 && next[r][c].gem === null) {
          // Look upward for first movable gem before hitting an obstacle
          for (let above = r - 1; above >= 0; above--) {
            if (isImpassable(next[above][c])) {
              break;
            }
            if (next[above][c].gem !== null) {
              next[r][c].gem = next[above][c].gem;
              next[above][c].gem = null;
              changed = true;
              break;
            }
          }
        }
      }
    }

    // 2. Top-row spawn into open top cells (only cells not blocked by obstacles above)
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (next[0][c].crate === 0 && next[0][c].gem === null) {
        next[0][c].gem = {
          id: allocGemId(),
          color: pickRandomColor(pool, rng),
          special: 'none',
          chained: false,
        };
        changed = true;
      }
    }

    // 3. Diagonal slide into empty open cells beneath obstacles
    for (let r = BOARD_SIZE - 1; r >= 1; r--) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (next[r][c].crate === 0 && next[r][c].gem === null) {
          const leftDiag = c > 0 ? next[r - 1][c - 1] : null;
          const rightDiag = c < BOARD_SIZE - 1 ? next[r - 1][c + 1] : null;
          if (leftDiag && leftDiag.crate === 0 && leftDiag.gem && !leftDiag.gem.chained) {
            next[r][c].gem = leftDiag.gem;
            leftDiag.gem = null;
            changed = true;
          } else if (
            rightDiag &&
            rightDiag.crate === 0 &&
            rightDiag.gem &&
            !rightDiag.gem.chained
          ) {
            next[r][c].gem = rightDiag.gem;
            rightDiag.gem = null;
            changed = true;
          }
        }
      }
    }
  }

  return next;
}

/**
 * Where a scout flies: the most useful cell that is not already being
 * cleared. Crates first, then chained animals, then ice, then anything.
 */
function pickScoutTarget(
  board: Board,
  alreadyCleared: Set<string>,
  damagedCrates: Set<string>,
  rng: RngFn,
  origin: Coord
): Coord | null {
  const tiers: Coord[][] = [[], [], [], []];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (r === origin.row && c === origin.col) continue;
      const cellKey = `${r},${c}`;
      const cell = board[r][c];
      if (cell.crate > 0) {
        if (!damagedCrates.has(cellKey)) tiers[0].push({ row: r, col: c });
        continue;
      }
      if (!cell.gem || alreadyCleared.has(cellKey)) continue;
      if (cell.gem.chained) tiers[1].push({ row: r, col: c });
      else if (cell.ice > 0) tiers[2].push({ row: r, col: c });
      else tiers[3].push({ row: r, col: c });
    }
  }
  for (const tier of tiers) {
    if (tier.length > 0) return tier[Math.floor(rng() * tier.length)];
  }
  return null;
}

function executeClearPhase(
  board: Board,
  initialTargets: Coord[],
  adjacentMatchSources: Coord[],
  spawnedSpecials: Array<{ coord: Coord; special: SpecialType; color: GemColor }>,
  cascadeIndex: number,
  colors: number | ColorPool,
  rng: RngFn,
  directBlastHitCrates: boolean
): CascadeStep {
  const working = cloneBoard(board);
  const queue: Coord[] = [...initialTargets];
  const visitedClear = new Set<string>();
  const spawnedKeySet = new Set(
    spawnedSpecials.map((s) => `${s.coord.row},${s.coord.col}`)
  );

  const clearedCoords: Coord[] = [];
  const blasts: BlastEvent[] = [];
  const clearedColors = emptyColorCounts();
  let clearedIce = 0;
  let clearedCrates = 0;
  let clearedChains = 0;
  const damagedCratesThisStep = new Set<string>();

  const enqueueCoord = (pt: Coord) => {
    if (!inBounds(pt.row, pt.col)) return;
    const key = `${pt.row},${pt.col}`;
    if (!visitedClear.has(key)) {
      queue.push(pt);
    }
  };

  while (queue.length > 0) {
    const pt = queue.shift()!;
    const key = `${pt.row},${pt.col}`;
    if (visitedClear.has(key)) continue;
    visitedClear.add(key);

    const cell = working[pt.row][pt.col];

    // Crates only get damaged by blasts if directBlastHitCrates or enqueued by a blast
    if (cell.crate > 0) {
      if (directBlastHitCrates && !damagedCratesThisStep.has(key)) {
        damagedCratesThisStep.add(key);
        cell.crate -= 1;
        blasts.push({ type: 'crate', row: pt.row, col: pt.col });
        if (cell.crate <= 0) {
          cell.crate = 0;
          clearedCrates++;
        }
      }
      continue;
    }

    if (!cell.gem) continue;

    const gem = cell.gem;
    clearedCoords.push({ row: pt.row, col: pt.col });
    clearedColors[gem.color]++;

    if (gem.chained) {
      clearedChains++;
      blasts.push({ type: 'chain', row: pt.row, col: pt.col, color: gem.color });
    }

    if (cell.ice > 0) {
      cell.ice -= 1;
      clearedIce++;
      blasts.push({ type: 'ice', row: pt.row, col: pt.col });
    }

    // Trigger special gem effect unless this exact cell is receiving a newly spawned special
    if (gem.special !== 'none' && !spawnedKeySet.has(key)) {
      if (gem.special === 'beam_h') {
        blasts.push({ type: 'beam_h', row: pt.row, col: pt.col, color: gem.color });
        for (let cc = 0; cc < BOARD_SIZE; cc++) {
          const targetCell = working[pt.row][cc];
          if (targetCell.crate > 0 && !damagedCratesThisStep.has(`${pt.row},${cc}`)) {
            damagedCratesThisStep.add(`${pt.row},${cc}`);
            targetCell.crate -= 1;
            blasts.push({ type: 'crate', row: pt.row, col: cc });
            if (targetCell.crate <= 0) {
              targetCell.crate = 0;
              clearedCrates++;
            }
          } else {
            enqueueCoord({ row: pt.row, col: cc });
          }
        }
      } else if (gem.special === 'beam_v') {
        blasts.push({ type: 'beam_v', row: pt.row, col: pt.col, color: gem.color });
        for (let rr = 0; rr < BOARD_SIZE; rr++) {
          const targetCell = working[rr][pt.col];
          if (targetCell.crate > 0 && !damagedCratesThisStep.has(`${rr},${pt.col}`)) {
            damagedCratesThisStep.add(`${rr},${pt.col}`);
            targetCell.crate -= 1;
            blasts.push({ type: 'crate', row: rr, col: pt.col });
            if (targetCell.crate <= 0) {
              targetCell.crate = 0;
              clearedCrates++;
            }
          } else {
            enqueueCoord({ row: rr, col: pt.col });
          }
        }
      } else if (gem.special === 'nova') {
        blasts.push({ type: 'nova', row: pt.row, col: pt.col, color: gem.color });
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = pt.row + dr;
            const nc = pt.col + dc;
            if (!inBounds(nr, nc)) continue;
            const targetCell = working[nr][nc];
            if (targetCell.crate > 0 && !damagedCratesThisStep.has(`${nr},${nc}`)) {
              damagedCratesThisStep.add(`${nr},${nc}`);
              targetCell.crate -= 1;
              blasts.push({ type: 'crate', row: nr, col: nc });
              if (targetCell.crate <= 0) {
                targetCell.crate = 0;
                clearedCrates++;
              }
            } else {
              enqueueCoord({ row: nr, col: nc });
            }
          }
        }
      } else if (gem.special === 'scout') {
        const target = pickScoutTarget(working, visitedClear, damagedCratesThisStep, rng, pt);
        if (target) {
          blasts.push({ type: 'scout', row: target.row, col: target.col, color: gem.color, from: pt });
          const targetCell = working[target.row][target.col];
          if (targetCell.crate > 0) {
            damagedCratesThisStep.add(`${target.row},${target.col}`);
            targetCell.crate -= 1;
            blasts.push({ type: 'crate', row: target.row, col: target.col });
            if (targetCell.crate <= 0) {
              targetCell.crate = 0;
              clearedCrates++;
            }
          } else {
            enqueueCoord(target);
          }
        }
      } else if (gem.special === 'prism') {
        blasts.push({ type: 'prism', row: pt.row, col: pt.col, color: gem.color });
        for (let rr = 0; rr < BOARD_SIZE; rr++) {
          for (let cc = 0; cc < BOARD_SIZE; cc++) {
            if (working[rr][cc].gem && working[rr][cc].gem!.color === gem.color) {
              enqueueCoord({ row: rr, col: cc });
            }
          }
        }
      }
    } else {
      blasts.push({ type: 'match', row: pt.row, col: pt.col, color: gem.color });
    }

    cell.gem = null;
  }

  // Orthogonal crate damage from regular matched gems
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const src of adjacentMatchSources) {
    for (const [dr, dc] of dirs) {
      const nr = src.row + dr;
      const nc = src.col + dc;
      if (!inBounds(nr, nc)) continue;
      const key = `${nr},${nc}`;
      if (working[nr][nc].crate > 0 && !damagedCratesThisStep.has(key)) {
        damagedCratesThisStep.add(key);
        working[nr][nc].crate -= 1;
        blasts.push({ type: 'crate', row: nr, col: nc });
        if (working[nr][nc].crate <= 0) {
          working[nr][nc].crate = 0;
          clearedCrates++;
        }
      }
    }
  }

  // Place newly spawned specials
  for (const spawn of spawnedSpecials) {
    working[spawn.coord.row][spawn.coord.col].gem = {
      id: allocGemId(),
      color: spawn.color,
      special: spawn.special,
      chained: false,
    };
  }

  const basePoints =
    clearedCoords.length * 30 +
    clearedIce * 60 +
    clearedCrates * 90 +
    clearedChains * 50 +
    spawnedSpecials.length * 80;
  const stepScore = basePoints * cascadeIndex;
  const energyGained = Math.min(
    28,
    clearedCoords.length * 2 + (cascadeIndex - 1) * 4 + spawnedSpecials.length * 6
  );

  const boardAfterClear = cloneBoard(working);
  const boardAfterGravity = applyGravityAndRefill(boardAfterClear, colors, rng);

  return {
    boardAfterClear,
    boardAfterGravity,
    clearedCoords,
    spawnedSpecials,
    blasts,
    stepScore,
    cascadeIndex,
    energyGained,
    deltaProgress: {
      clearedColors,
      clearedIce,
      clearedCrates,
      clearedChains,
    },
  };
}

function runAutoCascades(
  startBoard: Board,
  initialStepIndex: number,
  colors: number | ColorPool,
  rng: RngFn
): { steps: CascadeStep[]; finalBoard: Board } {
  const steps: CascadeStep[] = [];
  let current = cloneBoard(startBoard);
  let cascadeIdx = initialStepIndex;

  while (cascadeIdx <= 24) {
    const groups = findMatchGroups(current);
    if (groups.length === 0) break;

    const allTargets: Coord[] = [];
    const spawned: Array<{ coord: Coord; special: SpecialType; color: GemColor }> = [];

    for (const g of groups) {
      allTargets.push(...g.cells);
      if (g.special !== 'none') {
        const spawnCoord = g.cells[Math.floor(g.cells.length / 2)];
        spawned.push({ coord: spawnCoord, special: g.special, color: g.color });
      }
    }

    const step = executeClearPhase(
      current,
      allTargets,
      allTargets,
      spawned,
      cascadeIdx,
      colors,
      rng,
      false
    );
    steps.push(step);
    current = step.boardAfterGravity;
    cascadeIdx++;
  }

  return { steps, finalBoard: current };
}

const COMBO_SCORE_MULTIPLIER: Record<ComboType, number> = {
  crossbeam: 1.4,
  supernova: 1.5,
  starburst: 1.6,
  prism: 1.3,
  prism_beam: 1.7,
  prism_nova: 1.8,
  prism_storm: 2.2,
  scout_flock: 1.3,
  scout_beam: 1.4,
  scout_nova: 1.5,
  prism_scout: 1.7,
};

export function resolveSwap(
  board: Board,
  a: Coord,
  b: Coord,
  colors: number | ColorPool,
  rng: RngFn = Math.random
): SwapResult {
  const pool = resolveColorPool(colors);
  if (!canSwap(board, a, b)) {
    const dist = Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    return {
      valid: false,
      reason: dist !== 1 ? 'not_adjacent' : 'blocked',
      steps: [],
      finalBoard: board,
      totalScore: 0,
      totalEnergy: 0,
      maxCascade: 0,
      reshuffled: false,
    };
  }

  const swapped = cloneBoard(board);
  const gemA = swapped[a.row][a.col].gem!;
  const gemB = swapped[b.row][b.col].gem!;
  swapped[a.row][a.col].gem = gemB;
  swapped[b.row][b.col].gem = gemA;

  const steps: CascadeStep[] = [];
  let currentBoard = swapped;

  // Check Special + Special or Prism + Any synergies
  const sA = gemA.special;
  const sB = gemB.special;
  let combo: ComboType | null = null;

  if (sA === 'prism' || sB === 'prism') {
    const prismCoord = sA === 'prism' ? b : a; // after swap, gemA is at b, gemB is at a
    const otherGem = sA === 'prism' ? gemB : gemA;
    const targets: Coord[] = [prismCoord];
    const extraBlasts: BlastEvent[] = [
      { type: 'prism', row: prismCoord.row, col: prismCoord.col, color: otherGem.color },
    ];

    if (otherGem.special === 'prism') {
      combo = 'prism_storm';
      // Prism + Prism = Full board sweep!
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          targets.push({ row: r, col: c });
        }
      }
    } else if (otherGem.special !== 'none') {
      combo =
        otherGem.special === 'nova'
          ? 'prism_nova'
          : otherGem.special === 'scout'
          ? 'prism_scout'
          : 'prism_beam';
      // Prism + Special = convert all gems of otherGem.color to that special and detonate
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const g = currentBoard[r][c].gem;
          if (g && g.color === otherGem.color) {
            g.special =
              otherGem.special === 'beam_h' || otherGem.special === 'beam_v'
                ? (r + c) % 2 === 0
                  ? 'beam_h'
                  : 'beam_v'
                : otherGem.special;
            targets.push({ row: r, col: c });
          }
        }
      }
    } else {
      combo = 'prism';
      // Prism + Normal Gem = clear all gems of otherGem.color
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const g = currentBoard[r][c].gem;
          if (g && g.color === otherGem.color) {
            targets.push({ row: r, col: c });
          }
        }
      }
    }

    const firstStep = executeClearPhase(
      currentBoard,
      targets,
      targets,
      [],
      1,
      pool,
      rng,
      otherGem.special === 'prism'
    );
    firstStep.stepScore = Math.round(firstStep.stepScore * (combo ? COMBO_SCORE_MULTIPLIER[combo] : 1));
    firstStep.blasts = [...extraBlasts, ...firstStep.blasts];
    steps.push(firstStep);
    currentBoard = firstStep.boardAfterGravity;
  } else if (sA !== 'none' && sB !== 'none') {
    // Two non-prism specials swapped together
    const targets: Coord[] = [];
    const extraBlasts: BlastEvent[] = [];
    const isBeamA = sA === 'beam_h' || sA === 'beam_v';
    const isBeamB = sB === 'beam_h' || sB === 'beam_v';

    const isScoutA = sA === 'scout';
    const isScoutB = sB === 'scout';

    if (isScoutA || isScoutB) {
      const other = isScoutA ? sB : sA;
      const busy = new Set<string>([`${a.row},${a.col}`, `${b.row},${b.col}`]);
      const landing = (): Coord | null => {
        const spot = pickScoutTarget(currentBoard, busy, busy, rng, b);
        if (spot) busy.add(`${spot.row},${spot.col}`);
        return spot;
      };
      targets.push({ row: a.row, col: a.col }, { row: b.row, col: b.col });
      if (other === 'scout') {
        combo = 'scout_flock';
        for (let i = 0; i < 3; i++) {
          const spot = landing();
          if (!spot) break;
          extraBlasts.push({ type: 'scout', row: spot.row, col: spot.col, color: gemA.color, from: b });
          targets.push(spot);
        }
      } else {
        combo = other === 'nova' ? 'scout_nova' : 'scout_beam';
        // The scout carries the other special to a useful cell and sets it off there.
        let spot = landing();
        while (spot && currentBoard[spot.row][spot.col].crate > 0) spot = landing();
        if (spot) {
          extraBlasts.push({ type: 'scout', row: spot.row, col: spot.col, color: gemA.color, from: b });
          currentBoard[spot.row][spot.col].gem!.special = other;
          targets.push(spot);
        }
      }
    } else if (isBeamA && isBeamB) {
      combo = 'crossbeam';
      extraBlasts.push({ type: 'beam_h', row: b.row, col: b.col, color: gemA.color });
      extraBlasts.push({ type: 'beam_v', row: b.row, col: b.col, color: gemB.color });
      for (let i = 0; i < BOARD_SIZE; i++) {
        targets.push({ row: b.row, col: i });
        targets.push({ row: i, col: b.col });
      }
    } else if (sA === 'nova' && sB === 'nova') {
      combo = 'supernova';
      extraBlasts.push({ type: 'nova', row: b.row, col: b.col, color: gemA.color });
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (inBounds(b.row + dr, b.col + dc)) {
            targets.push({ row: b.row + dr, col: b.col + dc });
          }
        }
      }
    } else {
      combo = 'starburst';
      // Nova + Beam = 3 rows + 3 cols!

      for (let d = -1; d <= 1; d++) {
        if (inBounds(b.row + d, 0)) {
          extraBlasts.push({ type: 'beam_h', row: b.row + d, col: b.col, color: gemA.color });
          for (let c = 0; c < BOARD_SIZE; c++) {
            targets.push({ row: b.row + d, col: c });
          }
        }
        if (inBounds(0, b.col + d)) {
          extraBlasts.push({ type: 'beam_v', row: b.row, col: b.col + d, color: gemB.color });
          for (let r = 0; r < BOARD_SIZE; r++) {
            targets.push({ row: r, col: b.col + d });
          }
        }
      }
    }

    // Clear the specials cleanly without double-recursing on a & b if already covered
    currentBoard[a.row][a.col].gem!.special = 'none';
    currentBoard[b.row][b.col].gem!.special = 'none';

    const firstStep = executeClearPhase(
      currentBoard,
      targets,
      targets,
      [],
      1,
      pool,
      rng,
      true
    );
    firstStep.stepScore = Math.round(firstStep.stepScore * (combo ? COMBO_SCORE_MULTIPLIER[combo] : 1));
    firstStep.blasts = [...extraBlasts, ...firstStep.blasts];
    steps.push(firstStep);
    currentBoard = firstStep.boardAfterGravity;
  } else {
    // Standard match check
    const groups = findMatchGroups(currentBoard);
    if (groups.length === 0) {
      return {
        valid: false,
        reason: 'no_match',
        steps: [],
        finalBoard: board,
        totalScore: 0,
        totalEnergy: 0,
        maxCascade: 0,
        reshuffled: false,
      };
    }

    const allTargets: Coord[] = [];
    const spawned: Array<{ coord: Coord; special: SpecialType; color: GemColor }> = [];
    for (const g of groups) {
      allTargets.push(...g.cells);
      if (g.special !== 'none') {
        const atB = g.cells.find((pt) => pt.row === b.row && pt.col === b.col);
        const atA = g.cells.find((pt) => pt.row === a.row && pt.col === a.col);
        const spawnCoord = atB ?? atA ?? g.cells[0];
        spawned.push({ coord: spawnCoord, special: g.special, color: g.color });
      }
    }

    const firstStep = executeClearPhase(
      currentBoard,
      allTargets,
      allTargets,
      spawned,
      1,
      pool,
      rng,
      false
    );
    steps.push(firstStep);
    currentBoard = firstStep.boardAfterGravity;
  }

  // Subsequent auto-cascades
  const cascade = runAutoCascades(currentBoard, 2, pool, rng);
  steps.push(...cascade.steps);
  currentBoard = cascade.finalBoard;

  let reshuffled = false;
  if (!hasValidMoves(currentBoard)) {
    currentBoard = shuffleBoard(currentBoard, pool, rng);
    reshuffled = true;
  }

  const totalScore = steps.reduce((acc, s) => acc + s.stepScore, 0);
  const totalEnergy = steps.reduce((acc, s) => acc + s.energyGained, 0);
  const maxCascade = steps.length;

  return {
    valid: true,
    steps,
    finalBoard: currentBoard,
    totalScore,
    totalEnergy,
    maxCascade,
    reshuffled,
    combo: combo ?? undefined,
  };
}

export function applyTool(
  board: Board,
  tool: ToolType,
  target: Coord | null,
  colors: number | ColorPool,
  rng: RngFn = Math.random
): SwapResult {
  const pool = resolveColorPool(colors);
  if (tool === 'shuffle') {
    const shuffled = shuffleBoard(board, pool, rng);
    return {
      valid: true,
      steps: [],
      finalBoard: shuffled,
      totalScore: 0,
      totalEnergy: 0,
      maxCascade: 0,
      reshuffled: true,
    };
  }

  if (!target || !inBounds(target.row, target.col)) {
    return {
      valid: false,
      reason: 'blocked',
      steps: [],
      finalBoard: board,
      totalScore: 0,
      totalEnergy: 0,
      maxCascade: 0,
      reshuffled: false,
    };
  }

  const targets: Coord[] = [];
  const extraBlasts: BlastEvent[] = [];

  if (tool === 'hammer') {
    const cell = board[target.row][target.col];
    if (cell.crate === 0 && !cell.gem) {
      return {
        valid: false,
        reason: 'blocked',
        steps: [],
        finalBoard: board,
        totalScore: 0,
        totalEnergy: 0,
        maxCascade: 0,
        reshuffled: false,
      };
    }
    targets.push(target);
  } else if (tool === 'pulse') {
    extraBlasts.push({ type: 'beam_h', row: target.row, col: target.col });
    extraBlasts.push({ type: 'beam_v', row: target.row, col: target.col });
    for (let i = 0; i < BOARD_SIZE; i++) {
      targets.push({ row: target.row, col: i });
      targets.push({ row: i, col: target.col });
    }
  }

  const firstStep = executeClearPhase(
    board,
    targets,
    [],
    [],
    1,
    pool,
    rng,
    true
  );
  firstStep.blasts = [...extraBlasts, ...firstStep.blasts];

  const cascade = runAutoCascades(firstStep.boardAfterGravity, 2, pool, rng);
  const steps = [firstStep, ...cascade.steps];
  let finalBoard = cascade.finalBoard;

  let reshuffled = false;
  if (!hasValidMoves(finalBoard)) {
    finalBoard = shuffleBoard(finalBoard, pool, rng);
    reshuffled = true;
  }

  return {
    valid: true,
    steps,
    finalBoard,
    totalScore: steps.reduce((acc, s) => acc + s.stepScore, 0),
    totalEnergy: 0,
    maxCascade: steps.length,
    reshuffled,
  };
}

export function findAllValidMoves(board: Board): HintMove[] {
  const hints: HintMove[] = [];
  const pairs: Array<[Coord, Coord]> = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (c + 1 < BOARD_SIZE) pairs.push([{ row: r, col: c }, { row: r, col: c + 1 }]);
      if (r + 1 < BOARD_SIZE) pairs.push([{ row: r, col: c }, { row: r + 1, col: c }]);
    }
  }

  for (const [a, b] of pairs) {
    if (!canSwap(board, a, b)) continue;
    const gemA = board[a.row][a.col].gem!;
    const gemB = board[b.row][b.col].gem!;

    if (gemA.special === 'prism' || gemB.special === 'prism') {
      hints.push({ from: a, to: b, score: 500, createsSpecial: 'prism' });
      continue;
    }
    if (gemA.special !== 'none' && gemB.special !== 'none') {
      hints.push({ from: a, to: b, score: 420, createsSpecial: 'nova' });
      continue;
    }

    const testBoard = cloneBoard(board);
    testBoard[a.row][a.col].gem = gemB;
    testBoard[b.row][b.col].gem = gemA;
    const groups = findMatchGroups(testBoard);
    if (groups.length > 0) {
      let score = 0;
      let bestSpecial: SpecialType = 'none';
      for (const g of groups) {
        score += g.cells.length * 25;
        if (g.special === 'prism') {
          score += 300;
          bestSpecial = 'prism';
        } else if (g.special === 'nova') {
          score += 180;
          if (bestSpecial === 'none') bestSpecial = 'nova';
        } else if (g.special === 'beam_h' || g.special === 'beam_v') {
          score += 110;
          if (bestSpecial === 'none') bestSpecial = g.special;
        } else if (g.special === 'scout') {
          score += 70;
          if (bestSpecial === 'none') bestSpecial = 'scout';
        }
        for (const pt of g.cells) {
          if (board[pt.row][pt.col].ice > 0) score += 35;
          if (board[pt.row][pt.col].gem?.chained) score += 45;
        }
      }
      hints.push({ from: a, to: b, score, createsSpecial: bestSpecial });
    }
  }

  hints.sort((x, y) => y.score - x.score);
  return hints;
}

export function hasValidMoves(board: Board): boolean {
  return findAllValidMoves(board).length > 0;
}

export function findBestHint(board: Board): HintMove | null {
  const all = findAllValidMoves(board);
  return all.length > 0 ? all[0] : null;
}

export function shuffleBoard(
  board: Board,
  colors: number | ColorPool,
  rng: RngFn = Math.random
): Board {
  const pool = resolveColorPool(colors);
  const next = cloneBoard(board);
  const movableCoords: Coord[] = [];
  const gems: Gem[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = next[r][c];
      if (cell.crate === 0 && cell.gem && !cell.gem.chained) {
        movableCoords.push({ row: r, col: c });
        gems.push(cell.gem);
      }
    }
  }

  for (let attempt = 0; attempt < 25; attempt++) {
    for (let i = gems.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [gems[i], gems[j]] = [gems[j], gems[i]];
    }
    movableCoords.forEach((pt, idx) => {
      next[pt.row][pt.col].gem = gems[idx];
    });
    if (findMatchGroups(next).length === 0 && hasValidMoves(next)) {
      return next;
    }
  }

  // Fallback: regenerate movable cells safely without initial matches
  for (const pt of movableCoords) {
    next[pt.row][pt.col].gem = null;
  }
  for (const pt of movableCoords) {
    const excluded = new Set<GemColor>();
    const { row: r, col: c } = pt;
    if (
      c >= 2 &&
      next[r][c - 1].gem &&
      next[r][c - 2].gem &&
      next[r][c - 1].gem!.color === next[r][c - 2].gem!.color
    ) {
      excluded.add(next[r][c - 1].gem!.color);
    }
    if (
      r >= 2 &&
      next[r - 1][c].gem &&
      next[r - 2][c].gem &&
      next[r - 1][c].gem!.color === next[r - 2][c].gem!.color
    ) {
      excluded.add(next[r - 1][c].gem!.color);
    }
    next[r][c].gem = {
      id: allocGemId(),
      color: pickRandomColor(pool, rng, excluded),
      special: 'none',
      chained: false,
    };
  }
  return next;
}

export function getObjectiveCurrent(
  objective: LevelObjective,
  progress: LevelProgress
): number {
  switch (objective.kind) {
    case 'color':
      return objective.color ? progress.clearedColors[objective.color] ?? 0 : 0;
    case 'ice':
      return progress.clearedIce;
    case 'crate':
      return progress.clearedCrates;
    case 'chain':
      return progress.clearedChains;
    case 'score':
      return progress.score;
    case 'specials':
      return progress.specialsCreated;
    case 'cascade3':
      return progress.cascade3Count;
  }
}

export function areObjectivesComplete(
  objectives: LevelObjective[],
  progress: LevelProgress
): boolean {
  return objectives.every((obj) => getObjectiveCurrent(obj, progress) >= obj.target);
}
