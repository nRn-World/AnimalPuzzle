import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addTopScore,
  albumTier,
  applyCollected,
  CHEST_SKIN,
  createInitialRewardState,
  currentStreak,
  getWeekKey,
  getWeeklyQuest,
  openChest,
  registerDaily,
  sanitizeRewardState,
  streakBonus,
  TOP_LIST_SIZE,
  weeklyProgress,
} from './rewards';

test('a daily streak grows day by day and restarts after a missed day', () => {
  let state = createInitialRewardState();
  state = registerDaily(state, '2026-11-10');
  state = registerDaily(state, '2026-11-11');
  state = registerDaily(state, '2026-11-11');
  state = registerDaily(state, '2026-11-12');
  assert.equal(state.streak, 3);
  assert.equal(currentStreak(state, '2026-11-13'), 3);
  assert.equal(currentStreak(state, '2026-11-14'), 0);

  state = registerDaily(state, '2026-11-14');
  assert.equal(state.streak, 1);
  assert.equal(state.bestStreak, 3);
});

test('streaks survive a month change', () => {
  let state = registerDaily(createInitialRewardState(), '2026-11-30');
  state = registerDaily(state, '2026-12-01');
  assert.equal(state.streak, 2);
});

test('the streak bonus starts on day two and is capped', () => {
  assert.equal(streakBonus(0), 0);
  assert.equal(streakBonus(1), 0);
  assert.equal(streakBonus(2), 10);
  assert.equal(streakBonus(7), 60);
  assert.equal(streakBonus(40), 60);
});

test('week keys follow ISO weeks starting on Monday', () => {
  assert.equal(getWeekKey(new Date(2026, 10, 14)), '2026-W46');
  assert.equal(getWeekKey(new Date(2026, 10, 15)), '2026-W46');
  assert.equal(getWeekKey(new Date(2026, 10, 16)), '2026-W47');
  assert.equal(getWeekKey(new Date(2027, 0, 1)), '2026-W53');
});

test('the weekly hunt is the same for everyone and completes only once', () => {
  const week = '2026-W46';
  const quest = getWeeklyQuest(week);
  assert.deepEqual(quest, getWeeklyQuest(week));
  assert.ok(quest.target >= 250 && quest.target <= 400);

  let state = createInitialRewardState();
  let step = applyCollected(state, { [quest.color]: quest.target - 1 }, week);
  assert.equal(step.weeklyCompleted, false);
  state = step.nextState;
  step = applyCollected(state, { [quest.color]: 5 }, week);
  assert.equal(step.weeklyCompleted, true);
  state = step.nextState;
  step = applyCollected(state, { [quest.color]: 500 }, week);
  assert.equal(step.weeklyCompleted, false);
  assert.equal(weeklyProgress(step.nextState, week).claimed, true);
  assert.equal(step.nextState.album[quest.color], quest.target + 504);

  // A new week starts from zero.
  assert.deepEqual(weeklyProgress(step.nextState, '2026-W47'), { progress: 0, claimed: false });
});

test('the third chapter chest holds the explorer skin', () => {
  let state = createInitialRewardState();
  const skins: (string | null)[] = [];
  for (let i = 0; i < 4; i++) {
    const opened = openChest(state);
    state = opened.nextState;
    skins.push(opened.skin);
  }
  assert.deepEqual(skins, [null, null, CHEST_SKIN, null]);
});

test('album cards climb through the tiers', () => {
  assert.equal(albumTier(0).tier, 0);
  assert.deepEqual(albumTier(50), { tier: 1, next: 250, from: 50 });
  assert.equal(albumTier(5000).next, null);
});

test('the top list keeps the ten best scores in order', () => {
  let state = createInitialRewardState();
  for (let i = 1; i <= 14; i++) {
    state = addTopScore(state, { score: i * 100, mode: 'campaign', level: i, dateKey: '2026-11-14' });
  }
  state = addTopScore(state, { score: 0, mode: 'endless', level: 0, dateKey: '2026-11-14' });
  assert.equal(state.topScores.length, TOP_LIST_SIZE);
  assert.equal(state.topScores[0].score, 1400);
  assert.equal(state.topScores[9].score, 500);
});

test('broken saved rewards fall back to safe values', () => {
  const state = sanitizeRewardState({ streak: -4, album: { ruby: 'x' }, topScores: [{ score: 'no' }, 3], chests: 2.7 });
  assert.equal(state.streak, 0);
  assert.equal(state.album.ruby, 0);
  assert.equal(state.topScores.length, 0);
  assert.ok(Number.isInteger(state.chests));
});
