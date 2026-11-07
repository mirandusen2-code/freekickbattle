import test from 'node:test';
import assert from 'node:assert/strict';
import { DT, createShot, stepShot, simulate, freshProfile, validateProfile, purchase } from '../src/game.js';

test('a precise fast corner shot beats the keeper; a central shot is saved', () => {
  assert.equal(simulate({ x: 3.1, y: 1.8, power: 0.9 }).result, 'goal');
  assert.equal(simulate({ x: 0, y: 1.2 }).result, 'saved');
});
test('wide, crossbar and wall collisions are resolved from the trajectory', () => {
  assert.equal(simulate({ x: 4.4, y: 1.5 }).result, 'wide');
  assert.equal(simulate({ x: 0, y: 2.44 }, false).result, 'post');
  assert.equal(simulate({ x: 3.66, y: 1.2 }, false).result, 'post');
  assert.equal(simulate({ x: 0, y: 0.3, power: 1 }, true, true).result, 'blocked');
});
test('spin changes the flight; a resolved shot cannot be resolved twice', () => {
  const straight = simulate({ x: 2.2 }, false), curved = simulate({ x: 2.2, curve: 0.8 }, false);
  assert.ok(curved.x > straight.x + 1);
  const before = { ...curved }; stepShot(curved); assert.deepEqual(curved, before);
});
test('30, 60 and 120 Hz rendering produce identical fixed-step shot outcomes', () => {
  const runs = [30, 60, 120].map(hz => {
    const s = createShot({ x: 2.7, y: 1.6, power: 0.73, curve: 0.1 }); let acc = 0;
    for (let frame = 0; frame < hz * 4 && !s.result; frame++) {
      acc += 1 / hz;
      while (acc + 1e-10 >= DT && !s.result) { stepShot(s); acc -= DT; }
    }
    return s;
  });
  assert.deepEqual(runs[0], runs[1]); assert.deepEqual(runs[1], runs[2]);
});
test('purchases debit exactly once and owned items can be equipped for free', () => {
  const p = freshProfile(); assert.equal(purchase(p, 'sunset').ok, true); assert.equal(p.coins, 130); assert.equal(p.kit, 'sunset');
  purchase(p, 'classic'); purchase(p, 'sunset'); assert.equal(p.coins, 130); assert.equal(p.owned.filter(id => id === 'sunset').length, 1);
});
test('insufficient balance and invalid catalog IDs cannot change a profile', () => {
  const p = freshProfile(), before = structuredClone(p);
  assert.equal(purchase(p, 'samurai').ok, false); assert.equal(purchase(p, 'nonexistent').ok, false); assert.deepEqual(p, before);
});
test('stored profiles are validated and equipment ownership is enforced', () => {
  assert.deepEqual(validateProfile({ coins: -1 }), freshProfile());
  const p = validateProfile({ version: 1, coins: 120, owned: ['sunset', 'unknown'], kit: 'samurai', ball: 'sunset', best: 300 });
  assert.equal(p.kit, 'classic'); assert.equal(p.ball, 'matchball'); assert.ok(!p.owned.includes('unknown')); assert.equal(p.best, 300);
});
