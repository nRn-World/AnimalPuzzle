import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addFreeStarter,
  consumeFreeStarters,
  createEmptyFreeStarters,
  starterSelectionCost,
} from './boosters';
import {
  fetchGlobalLeaderboard,
  isCloudConfigured,
  pushCloudSave,
  submitGlobalScore,
} from './cloudSync';
import {
  buildCustomPuzzleBoard,
  createStarterCustomPuzzle,
  customPuzzleToLevel,
  customPuzzleUrl,
  decodeCustomPuzzle,
  encodeCustomPuzzle,
  parseCustomPuzzleFromSearch,
} from './customPuzzle';
import { createSeededRng } from './daily';
import { areObjectivesComplete, createEmptyProgress, levelColorPool, resolveSwap } from './engine';
import {
  advanceFever,
  createInitialFever,
  FEVER_DURATION_MOVES,
  FEVER_SCORE_MULTIPLIER,
  feverMultiplier,
  isFeverActive,
} from './fever';
import {
  applyMasterMode,
  canPlayMasterMode,
  recordMasterClear,
  totalMasterCrowns,
} from './masterMode';
import {
  addStarRaceStars,
  buildStarRaceStandings,
  claimLavaTrailReward,
  claimStarRaceReward,
  createInitialMiniEvents,
  failLavaTrail,
  LAVA_TRAIL_GOAL,
  recordLavaTrailWin,
  STAR_RACE_GOAL,
  startLavaTrail,
  startStarRace,
} from './miniEvents';
import { CAMPAIGN_LEVELS } from './levels';
import { addStepDelta } from './progress';
import {
  addChestStars,
  canSpinWheel,
  createInitialStarChestState,
  openStarChest,
  readyChestCount,
  spinDailyWheel,
  STAR_CHEST_GOAL,
} from './starChest';

test('fever mode charges from cascades/combos, ignites ×2 for 3 moves and expires cleanly', () => {
  let fever = createInitialFever();
  assert.equal(isFeverActive(fever), false);
  assert.equal(feverMultiplier(fever), 1);

  const step1 = advanceFever(fever, { peakCascade: 3, specialsCreated: 1, combo: null });
  assert.equal(step1.triggered, false);
  assert.ok(step1.nextState.charge > 50);
  fever = step1.nextState;

  const step2 = advanceFever(fever, { peakCascade: 2, specialsCreated: 1, combo: 'crossbeam' });
  assert.equal(step2.triggered, true);
  fever = step2.nextState;
  assert.equal(isFeverActive(fever), true);
  assert.equal(fever.movesLeft, FEVER_DURATION_MOVES);
  assert.equal(feverMultiplier(fever), FEVER_SCORE_MULTIPLIER);

  // Plain moves tick Fever down to 0
  fever = advanceFever(fever, { peakCascade: 1, specialsCreated: 0, combo: null }).nextState;
  assert.equal(fever.movesLeft, 2);
  fever = advanceFever(fever, { peakCascade: 1, specialsCreated: 0, combo: null }).nextState;
  assert.equal(fever.movesLeft, 1);
  fever = advanceFever(fever, { peakCascade: 1, specialsCreated: 0, combo: null }).nextState;
  assert.equal(isFeverActive(fever), false);
  assert.equal(fever.charge, 0);
});

test('star chest queues rewards every 15 stars and daily wheel allows one spin per day', () => {
  let state = createInitialStarChestState();
  state = addChestStars(state, STAR_CHEST_GOAL + 4);
  assert.equal(readyChestCount(state), 1);

  const opened = openStarChest(state);
  assert.ok(opened.reward);
  assert.ok(opened.reward!.energy >= 45);
  assert.equal(opened.nextState.stars, 4);
  assert.equal(opened.nextState.opened, 1);
  state = opened.nextState;

  assert.equal(canSpinWheel(state, '2026-11-16'), true);
  const spun = spinDailyWheel(state, '2026-11-16', () => 0.4);
  assert.ok(spun);
  assert.equal(canSpinWheel(spun!.nextState, '2026-11-16'), false);
  assert.equal(spinDailyWheel(spun!.nextState, '2026-11-16'), null);
  assert.equal(canSpinWheel(spun!.nextState, '2026-11-17'), true);

  // Free starter tokens zero out starter selection cost cleanly
  let inv = createEmptyFreeStarters();
  inv = addFreeStarter(inv, 'nova', 1);
  assert.equal(starterSelectionCost(['nova'], inv), 0);
  assert.equal(starterSelectionCost(['nova', 'beam'], inv), 35);
  const used = consumeFreeStarters(inv, ['nova', 'beam']);
  assert.equal(used.nextInv.nova, 0);
  assert.deepEqual(used.paidIds, ['beam']);
});

test('Star Race sprint and Lava Trail 5-win survival award expected rewards', () => {
  const t0 = 1_700_000_000_000;
  let ev = createInitialMiniEvents();
  ev = startStarRace(ev, t0);
  ev = addStarRaceStars(ev, STAR_RACE_GOAL, t0 + 60_000);
  const rows = buildStarRaceStandings(ev.race!, 'Du', 'ruby', t0 + 60_000);
  assert.equal(rows.length, 5);
  assert.equal(rows[0].isPlayer, true);

  const claimed = claimStarRaceReward(ev, t0 + 60_000);
  assert.ok(claimed.reward);
  assert.equal(claimed.reward!.rank, 1);
  assert.equal(claimed.reward!.energy, 80);
  assert.deepEqual(claimed.reward!.starters, ['prism']);
  ev = claimed.nextState;
  assert.equal(ev.race, null);

  ev = startLavaTrail(ev);
  ev = recordLavaTrailWin(ev);
  ev = failLavaTrail(ev);
  assert.equal(ev.lava.active, false);
  assert.equal(ev.lava.wins, 0);

  ev = startLavaTrail(ev);
  for (let i = 0; i < LAVA_TRAIL_GOAL; i++) ev = recordLavaTrailWin(ev);
  assert.equal(ev.lava.rewardPending, true);
  const lavaPrize = claimLavaTrailReward(ev);
  assert.ok(lavaPrize.reward);
  assert.equal(lavaPrize.reward!.energy, 100);
  assert.deepEqual(lavaPrize.reward!.starters, ['nova', 'prism']);
});

test('Master Mode tightens moves, preserves physical obstacle limits and tracks golden crowns', () => {
  assert.equal(canPlayMasterMode({ 1: 2 }, 1), true);
  assert.equal(canPlayMasterMode({ 1: 2 }, 2), false);

  const base = CAMPAIGN_LEVELS[0];
  const master = applyMasterMode(base);
  assert.ok(master.moves < base.moves);
  assert.equal(master.difficulty, 'extreme');

  const first = recordMasterClear({}, 1, 2);
  assert.equal(first.firstClear, true);
  assert.equal(totalMasterCrowns(first.nextCrowns), 1);

  const improved = recordMasterClear(first.nextCrowns, 1, 3);
  assert.equal(improved.firstClear, false);
  assert.equal(improved.nextCrowns[1], 3);
});

test('custom tactical puzzles encode/decode in shareable URLs and solve through the real engine', () => {
  const starter = createStarterCustomPuzzle();
  const code = encodeCustomPuzzle(starter);
  assert.ok(code.startsWith('APZ1:'));

  const url = customPuzzleUrl('https://animalpuzzle.example/', starter);
  const parsed = parseCustomPuzzleFromSearch(new URL(url).search);
  assert.ok(parsed);
  assert.equal(parsed!.heading, starter.heading);
  assert.equal(parsed!.moves, starter.moves);
  assert.equal(parsed!.cells.length, starter.cells.length);
  assert.equal(decodeCustomPuzzle('APZ1:broken!!!'), null);

  // Starter custom puzzle solves cleanly in 1 combo swap: (3,3) beam_h + (3,4) nova!
  const board = buildCustomPuzzleBoard(parsed!);
  const level = customPuzzleToLevel(parsed!);
  const res = resolveSwap(
    board,
    { row: 3, col: 3 },
    { row: 3, col: 4 },
    levelColorPool(level),
    createSeededRng('custom-solve'),
    { level, moveNumber: 1, enraged: false }
  );
  assert.equal(res.valid, true);
  let prog = createEmptyProgress();
  for (const step of res.steps) prog = addStepDelta(prog, step);
  assert.equal(areObjectivesComplete(level.objectives, prog), true);
});

test('cloud sync client handles unconfigured state and Supabase REST calls cleanly', async () => {
  assert.equal(isCloudConfigured({ url: '', anonKey: '' }), false);
  const unconf = await pushCloudSave({ url: '', anonKey: '' }, { playerId: 'ap_123456', handle: 'Test', lastSyncedAt: null });
  assert.equal(unconf.ok, false);

  const cfg = { url: 'https://demo.supabase.co', anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' };
  assert.equal(isCloudConfigured(cfg), true);

  const calls: Array<{ url: string; method: string }> = [];
  const fakeFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, method: init?.method ?? 'GET' });
    if (url.includes('leaderboard_entries') && (init?.method ?? 'GET') === 'GET') {
      return new Response(
        JSON.stringify([
          { player_id: 'ap_top1', handle: 'Freja', color: 'emerald', score: 920 },
          { player_id: 'ap_me', handle: 'Jag', color: 'ruby', score: 610 },
        ]),
        { status: 200 }
      );
    }
    return new Response('', { status: 201 });
  }) as typeof fetch;

  const submitted = await submitGlobalScore(
    cfg,
    { board: 'league', periodKey: '2026-W47', playerId: 'ap_me', handle: 'Jag', color: 'ruby', score: 610 },
    fakeFetch
  );
  assert.equal(submitted, true);

  const board = await fetchGlobalLeaderboard(cfg, 'league', '2026-W47', 'ap_me', fakeFetch);
  assert.ok(board);
  assert.equal(board!.length, 2);
  assert.equal(board![0].rank, 1);
  assert.equal(board![1].isPlayer, true);
  assert.equal(calls.length, 2);
});
