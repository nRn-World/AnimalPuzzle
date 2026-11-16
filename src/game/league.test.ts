import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addLeaguePoints,
  buildLeagueStandings,
  claimLeagueReward,
  createInitialLeagueState,
  LEAGUE_SIZE,
  LeagueState,
  settleLeagueWeek,
} from './league';

test('weekly league builds deterministic 15-player standings and promotes top finishers', () => {
  let state = createInitialLeagueState('2026-W46');
  state = addLeaguePoints(state, 500, '2026-W46');

  const standings = buildLeagueStandings(state, 'Du', 'ruby', new Date('2026-11-16T12:00:00Z'));
  assert.equal(standings.length, LEAGUE_SIZE);
  const me = standings.find((r) => r.isPlayer)!;
  assert.equal(me.rank, 1);
  assert.equal(me.zone, 'promote');

  const nextWeek = settleLeagueWeek(state, '2026-W47');
  assert.equal(nextWeek.tier, 'silver');
  assert.equal(nextWeek.bestTier, 'silver');
  assert.equal(nextWeek.points, 0);
  assert.equal(nextWeek.trophies, 1);
  assert.ok(nextWeek.pendingReward);
  assert.equal(nextWeek.pendingReward!.outcome, 'promoted');
  assert.equal(nextWeek.pendingReward!.rank, 1);
  assert.ok(nextWeek.pendingReward!.energy > 0);

  const claimed = claimLeagueReward(nextWeek);
  assert.equal(claimed.energy, nextWeek.pendingReward!.energy);
  assert.equal(claimed.nextState.pendingReward, null);
});

test('weekly league demotes bottom finishers in higher tiers but never below bronze', () => {
  let bronze = createInitialLeagueState('2026-W46');
  bronze = addLeaguePoints(bronze, 5, '2026-W46');
  const nextBronze = settleLeagueWeek(bronze, '2026-W47');
  assert.equal(nextBronze.tier, 'bronze');

  let silver: LeagueState = { ...createInitialLeagueState('2026-W46'), tier: 'silver', bestTier: 'silver' };
  silver = addLeaguePoints(silver, 5, '2026-W46');
  const nextSilver = settleLeagueWeek(silver, '2026-W47');
  assert.equal(nextSilver.tier, 'bronze');
  assert.equal(nextSilver.pendingReward?.outcome, 'demoted');
});
