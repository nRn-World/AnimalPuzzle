import assert from 'node:assert/strict';
import test from 'node:test';
import { migrateLegacyStorage, StorageLike } from './storage';

function fakeStorage(initial: Record<string, string>): StorageLike & { dump(): Record<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    dump: () => Object.fromEntries(map),
  };
}

test('legacy kromatik keys move to the animalpuzzle prefix', () => {
  const storage = fakeStorage({
    kromatik_unlocked: '7',
    kromatik_stars_v1: '{"1":3}',
    unrelated: 'keep',
  });
  assert.equal(migrateLegacyStorage(storage), 2);
  assert.deepEqual(storage.dump(), {
    animalpuzzle_unlocked: '7',
    animalpuzzle_stars_v1: '{"1":3}',
    unrelated: 'keep',
  });
});

test('migration never overwrites newer data and is safe to repeat', () => {
  const storage = fakeStorage({
    kromatik_unlocked: '2',
    animalpuzzle_unlocked: '9',
  });
  assert.equal(migrateLegacyStorage(storage), 0);
  assert.deepEqual(storage.dump(), { animalpuzzle_unlocked: '9' });
  assert.equal(migrateLegacyStorage(storage), 0);
});

test('migration tolerates missing or throwing storage', () => {
  assert.equal(migrateLegacyStorage(null), 0);
  const broken: StorageLike = {
    length: 1,
    key: () => 'kromatik_x',
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {},
    removeItem: () => {},
  };
  assert.equal(migrateLegacyStorage(broken), 0);
});
