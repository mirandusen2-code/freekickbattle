import test from 'node:test';
import assert from 'node:assert/strict';
import { DT, CATALOG, freshProfile, purchase, simulate } from '../src/game.js';
import { createSession, beginShot, advance, replayFrame } from '../src/session.js';

const goal = { x: 3.1, y: 1.8, power: 0.9, curve: 0 };
const miss = { x: 4.4, y: 1.2, power: 0.9, curve: 0 };
function until(s, predicate, max = 1200) {
  const events = [];
  for (let i = 0; i < max && !predicate(s); i++) events.push(...advance(s));
  assert.ok(predicate(s), `Expected state, got ${s.phase}`); return events;
}
function attempt(s, options) { assert.ok(beginShot(s, options)); return until(s, a => a.phase === 'ready' || a.ended); }

test('training runs exactly ten attempts, grants each reward once, then forbids an eleventh', () => {
  const s = createSession(); const events = [];
  for (let i = 0; i < 10; i++) events.push(...attempt(s, goal));
  assert.equal(s.attempts, 10); assert.equal(s.goals, 10); assert.equal(s.score, 1500); assert.ok(s.ended);
  assert.equal(events.filter(e => e.type === 'finished').length, 1);
  assert.equal(events.filter(e => e.type === 'result').reduce((n, e) => n + e.coins, 0), 250);
  assert.equal(beginShot(s, goal), false); assert.deepEqual(advance(s), []);
});
test('arcade ends at exactly five misses and a goal does not consume a life', () => {
  const s = createSession('arcade'); attempt(s, goal); assert.equal(s.lives, 5);
  for (let i = 0; i < 5; i++) attempt(s, miss);
  assert.equal(s.lives, 0); assert.equal(s.attempts, 6); assert.ok(s.ended); assert.equal(beginShot(s, goal), false);
});
test('match clock ends an idle round, AI simulates both scoring and saved shots', () => {
  const s = createSession('match'); const events = until(s, a => a.ended, 7500);
  assert.equal(s.remaining, 0); assert.equal(s.opponentAttempts, 6); assert.equal(s.opponent, 4);
  assert.ok(events.some(e => e.type === 'opponent' && e.result === 'saved'));
  assert.ok(events.some(e => e.type === 'opponent' && e.result === 'goal'));
  assert.equal(beginShot(s, goal), false);
});
test('a shot initiated before the whistle completes and is rewarded once', () => {
  const s = createSession('match'); s.remaining = 0.2;
  assert.ok(beginShot(s, goal)); const events = until(s, a => a.ended, 700);
  assert.equal(s.attempts, 1); assert.equal(s.goals, 1); assert.equal(s.remaining, 0);
  assert.equal(events.filter(e => e.type === 'result').length, 1);
});
test('a running shot, match clock and all events freeze while paused', () => {
  const s = createSession('match'); beginShot(s, goal); until(s, a => a.phase === 'flight');
  s.paused = true; const before = structuredClone(s);
  for (let i = 0; i < 120; i++) assert.deepEqual(advance(s), []);
  assert.deepEqual(s, before); assert.equal(beginShot(s, goal), false);
  s.paused = false; until(s, a => a.attempts === 1); assert.equal(s.goals, 1);
});
test('shot options are locked at initiation and repeat firing cannot duplicate a shot', () => {
  const s = createSession(); const options = { ...goal }; beginShot(s, options); options.x = 0;
  assert.equal(beginShot(s, miss), false); until(s, a => a.attempts === 1);
  assert.equal(s.goals, 1); assert.equal(s.shotOptions.x, goal.x);
});
test('replays have continuous 120 Hz samples, reproduce the result, and cannot mutate the session', () => {
  const s = createSession(); attempt(s, goal); const replay = s.lastReplay;
  assert.equal(replay.sampleRate, 120); assert.equal(replay.frames[0].time, 0);
  for (let i = 1; i < replay.frames.length; i++) assert.ok(Math.abs(replay.frames[i].time - replay.frames[i - 1].time - DT) < 1e-10);
  const before = structuredClone(s);
  for (let i = 0; i < replay.frames.length; i++) { const f = replayFrame(replay, i); f.x = 999; }
  assert.deepEqual(s, before); assert.equal(replayFrame(replay, 9999).result, 'goal'); assert.equal(replayFrame(replay, -5).time, 0);
  assert.equal(replay.result, simulate(goal).result); assert.deepEqual(JSON.parse(JSON.stringify(replay)), replay);
});
test('new sessions fully reset rounds without reusing replay or recording data', () => {
  const s = createSession(); attempt(s, goal); const next = createSession(s.mode);
  assert.equal(next.attempts, 0); assert.equal(next.score, 0); assert.equal(next.lastReplay, null); assert.deepEqual(next.recording, []);
});
test('all catalog items support exact-balance purchases, free reequip and category isolation', () => {
  for (const item of CATALOG) {
    const p = freshProfile(); p.coins = item.price;
    const otherCategory = item.category === 'kit' ? 'ball' : 'kit', original = p[otherCategory];
    assert.equal(purchase(p, item.id).ok, true); assert.equal(p.coins, 0); assert.equal(p[item.category], item.id); assert.equal(p[otherCategory], original);
    assert.equal(purchase(p, item.id).ok, true); assert.equal(p.coins, 0);
    if (item.price > 0) { const poor = freshProfile(); poor.coins = item.price - 1; assert.equal(purchase(poor, item.id).ok, false); }
  }
});
test('extreme valid aiming, power and spin always terminate with finite trajectories', () => {
  for (const x of [-4.5, 0, 4.5]) for (const y of [0.3, 1.5, 3.2]) for (const power of [0.15, 1]) for (const curve of [-1, 0, 1]) {
    const s = simulate({ x, y, power, curve }, true, true);
    assert.ok(s.result); assert.ok([s.x, s.y, s.z, s.time].every(Number.isFinite));
  }
});
