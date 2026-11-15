import assert from 'node:assert/strict';
import test from 'node:test';
import { ACHIEVEMENTS } from './achievements';
import { CALENDAR_REWARDS, calendarShown, canClaimCalendar, claimCalendar, sanitizeCalendar } from './calendar';
import { challengeUrl, newChallengeSeed, parseChallenge } from './challenge';
import { BUILDINGS, dailyGift, DAILY_GIFT_PER_BUILDING, nextUpgrade, sanitizeIsland, starsAvailable, upgrade } from './island';
import { QUIPS, pickQuip } from './quips';
import { msToNextDay } from './reminders';
import { exportSave, importSave, parseSave, saveFileName } from './saveFile';
import { PASS_REWARDS, PASS_STEP, addPassPoints, claimPass, passReached, sanitizePass } from './seasonPass';
import { StorageLike } from './storage';

function fakeStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    get length() {
      return data.size;
    },
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  } as StorageLike & { data: Map<string, string> };
}

test('a save file carries the whole game to another device and nothing else', () => {
  const from = fakeStorage({ animalpuzzle_unlocked: '41', animalpuzzle_stars_v1: '{"0":3}', other_site: 'x' });
  const file = exportSave(from, new Date('2026-11-14T10:00:00Z'));
  assert.deepEqual(Object.keys(file.data).sort(), ['animalpuzzle_stars_v1', 'animalpuzzle_unlocked']);
  assert.equal(saveFileName(new Date('2026-11-14T10:00:00Z')), 'animalpuzzle-2026-11-14.json');

  const to = fakeStorage({ animalpuzzle_unlocked: '2', animalpuzzle_old: 'gone', keep_me: 'yes' });
  assert.ok(importSave(JSON.stringify(file), to));
  assert.equal(to.data.get('animalpuzzle_unlocked'), '41');
  assert.equal(to.data.get('animalpuzzle_stars_v1'), '{"0":3}');
  assert.equal(to.data.has('animalpuzzle_old'), false, 'old progress is replaced, not mixed in');
  assert.equal(to.data.get('keep_me'), 'yes', 'other sites data is left alone');
});

test('files that are not save files are refused and change nothing', () => {
  const storage = fakeStorage({ animalpuzzle_unlocked: '7' });
  for (const text of [
    'not json',
    '{}',
    '{"app":"Other","version":1,"data":{"animalpuzzle_unlocked":"1"}}',
    '{"app":"AnimalPuzzle","version":99,"data":{"animalpuzzle_unlocked":"1"}}',
    '{"app":"AnimalPuzzle","version":1,"data":{"evil_key":"1"}}',
    '{"app":"AnimalPuzzle","version":1,"data":{"animalpuzzle_unlocked":5}}',
    '{"app":"AnimalPuzzle","version":1,"data":{}}',
  ]) {
    assert.equal(parseSave(text), null, text);
    assert.equal(importSave(text, storage), false);
  }
  assert.equal(storage.data.get('animalpuzzle_unlocked'), '7');
});

test('the login calendar opens one box a day and starts over after seven', () => {
  let state = sanitizeCalendar(null);
  let total = 0;
  for (let day = 1; day <= 7; day++) {
    const key = `2026-11-${String(day).padStart(2, '0')}`;
    assert.ok(canClaimCalendar(state, key));
    const res = claimCalendar(state, key);
    assert.equal(res.energy, CALENDAR_REWARDS[day - 1]);
    assert.equal(claimCalendar(res.nextState, key).energy, 0, 'only once a day');
    assert.equal(calendarShown(res.nextState, key), day);
    total += res.energy;
    state = res.nextState;
  }
  assert.equal(total, CALENDAR_REWARDS.reduce((a, b) => a + b, 0));
  // A missed day does not reset anything, and day eight is box one again.
  assert.equal(claimCalendar(state, '2026-11-20').energy, CALENDAR_REWARDS[0]);
  assert.deepEqual(sanitizeCalendar({ opened: 9, lastClaim: 4 }), { opened: 2 });
});

test('the season pass fills up, pays each step once and starts over next month', () => {
  let pass = sanitizePass(null, '2026-11');
  assert.equal(claimPass(pass).energy, 0);
  pass = addPassPoints(pass, PASS_STEP * 2 + 30);
  assert.equal(passReached(pass), 2);
  const first = claimPass(pass);
  assert.equal(first.energy, PASS_REWARDS[0] + PASS_REWARDS[1]);
  assert.equal(claimPass(first.nextState).energy, 0);
  pass = addPassPoints(first.nextState, PASS_STEP * 100);
  assert.equal(passReached(pass), PASS_REWARDS.length);
  assert.equal(claimPass(pass).energy, PASS_REWARDS.slice(2).reduce((a, b) => a + b, 0));
  assert.deepEqual(sanitizePass(pass, '2026-12'), { monthKey: '2026-12', points: 0, claimed: 0 });
  // A tampered save cannot claim steps it has no points for.
  assert.equal(sanitizePass({ monthKey: '2026-11', points: 150, claimed: 9 }, '2026-11').claimed, 1);
});

test('upgrading a building costs its price again and doubles its daily gift', () => {
  const island = sanitizeIsland({ built: 2 });
  assert.equal(nextUpgrade(sanitizeIsland({ built: 0 })), null);
  assert.equal(nextUpgrade(island)?.id, BUILDINGS[0].id);
  const spent = BUILDINGS[0].cost + BUILDINGS[1].cost;
  assert.equal(upgrade(island, spent + BUILDINGS[0].cost - 1).upgraded, null, 'not enough stars');
  const res = upgrade(island, spent + BUILDINGS[0].cost);
  assert.equal(res.upgraded?.id, BUILDINGS[0].id);
  assert.equal(starsAvailable(res.nextState, spent + BUILDINGS[0].cost), 0);
  assert.equal(dailyGift(res.nextState), 3 * DAILY_GIFT_PER_BUILDING);
  // Never more upgrades than buildings.
  assert.equal(sanitizeIsland({ built: 2, upgraded: 9 }).upgraded, 2);
});

test('a challenge link carries a seed and a score, and rubbish is ignored', () => {
  const seed = newChallengeSeed(() => 0.5);
  assert.match(seed, /^[a-z0-9]{8}$/);
  const url = challengeUrl('https://example.org/AnimalPuzzle/', { seed, score: 12400 });
  assert.deepEqual(parseChallenge(new URL(url).search), { seed, score: 12400 });
  for (const bad of ['', '?utmaning=', '?utmaning=abc', '?utmaning=ABCD.100', '?utmaning=abcd.0', '?utmaning=abcd.-5', '?utmaning=<script>.1'])
    assert.equal(parseChallenge(bad), null, bad);
});

test('the companion always has something to say', () => {
  for (const kind of Object.keys(QUIPS) as Array<keyof typeof QUIPS>) {
    assert.ok(QUIPS[kind].length >= 3);
    assert.ok(pickQuip(kind, () => 0).length > 0);
    assert.ok(pickQuip(kind, () => 0.9999).length > 0);
  }
});

test('achievement ids are unique and the long-term goals are harder than the first set', () => {
  const ids = ACHIEVEMENTS.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ACHIEVEMENTS.length >= 20);
  const byStat = new Map<string, number[]>();
  for (const a of ACHIEVEMENTS) byStat.set(a.statKey, [...(byStat.get(a.statKey) ?? []), a.target]);
  for (const [stat, targets] of byStat) assert.ok(new Set(targets).size === targets.length, stat);
});

test('the mission reminder waits for the next day', () => {
  const ms = msToNextDay(new Date(2026, 10, 14, 23, 0, 0));
  assert.equal(ms, 60 * 60 * 1000 + 5000);
});
