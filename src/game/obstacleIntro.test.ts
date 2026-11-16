import assert from 'node:assert/strict';
import test from 'node:test';
import { bossAttackInterval, movesUntilBossAttack } from './bosses';
import { detectNewObstacle, sanitizeSeenObstacles } from './obstacleIntro';
import { exportSyncCode, importSyncCode, parseSyncCode } from './saveFile';
import { STORAGE_PREFIX, StorageLike } from './storage';
import { LevelConfig } from './types';

function fakeStorage(initial: Record<string, string> = {}): StorageLike & { dump(): Record<string, string> } {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
    dump: () => Object.fromEntries(map.entries()),
  };
}

test('detectNewObstacle introduces each mechanic once and skips seen ones', () => {
  const level: LevelConfig = {
    id: 50,
    name: 'Test',
    subtitle: 'Test',
    moves: 20,
    colorCount: 5,
    objectives: [{ id: 'ice', kind: 'ice', label: 'Tina is', target: 4 }],
    iceCells: [{ row: 1, col: 1, hp: 1 }],
    honeyCells: [{ row: 2, col: 2 }],
  };

  const first = detectNewObstacle(level, []);
  assert.equal(first?.id, 'honey');
  const second = detectNewObstacle(level, ['honey']);
  assert.equal(second?.id, 'ice');
  const none = detectNewObstacle(level, ['honey', 'ice']);
  assert.equal(none, null);

  assert.deepEqual(sanitizeSeenObstacles(['ice', 'invalid', 'ice', 'boss']), ['ice', 'boss']);
});

test('boss attack countdown tracks normal and enraged intervals', () => {
  assert.equal(bossAttackInterval(4, false), 4);
  assert.equal(bossAttackInterval(4, true), 3);
  assert.equal(bossAttackInterval(3, true), 3);

  assert.equal(movesUntilBossAttack(4, 0, false), 4);
  assert.equal(movesUntilBossAttack(4, 1, false), 3);
  assert.equal(movesUntilBossAttack(4, 3, false), 1);
  assert.equal(movesUntilBossAttack(4, 4, false), 4);
  assert.equal(movesUntilBossAttack(4, 2, true), 1);
});

test('sync code round-trips game storage cleanly across devices', () => {
  const source = fakeStorage({
    [`${STORAGE_PREFIX}unlocked`]: '12',
    [`${STORAGE_PREFIX}settings_v1`]: '{"language":"sv"}',
    unrelated_key: 'keep-out',
  });
  const code = exportSyncCode(source);
  assert.ok(code.startsWith('AP1:'));

  const parsed = parseSyncCode(code);
  assert.deepEqual(parsed, {
    [`${STORAGE_PREFIX}unlocked`]: '12',
    [`${STORAGE_PREFIX}settings_v1`]: '{"language":"sv"}',
  });

  const target = fakeStorage({ [`${STORAGE_PREFIX}unlocked`]: '1' });
  assert.equal(importSyncCode(code, target), true);
  assert.equal(target.getItem(`${STORAGE_PREFIX}unlocked`), '12');
  assert.equal(parseSyncCode('AP1:not-valid-base64!!!'), null);
});
