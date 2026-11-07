import catalog from '../data/catalog.json' with { type: 'json' };
import animation from '../data/animation-spec.json' with { type: 'json' };
export const DT = 1 / animation.simulationHz;
export const GOAL = { z: -20, half: 3.66, height: 2.44, radius: 0.15 };
export const CATALOG = catalog;

export function freshProfile() { return { version: 1, coins: 250, owned: ['classic', 'matchball'], kit: 'classic', ball: 'matchball', best: 0 }; }
export function validateProfile(p) {
  if (!p || p.version !== 1 || !Number.isSafeInteger(p.coins) || p.coins < 0 || !Array.isArray(p.owned)) return freshProfile();
  const owned = [...new Set(['classic', 'matchball', ...p.owned.filter(id => CATALOG.some(i => i.id === id))])];
  const equipped = (id, category, fallback) => owned.includes(id) && CATALOG.some(i => i.id === id && i.category === category) ? id : fallback;
  return { version: 1, coins: p.coins, owned, kit: equipped(p.kit, 'kit', 'classic'), ball: equipped(p.ball, 'ball', 'matchball'), best: Number.isSafeInteger(p.best) && p.best >= 0 ? p.best : 0 };
}
export function purchase(profile, id) {
  const item = CATALOG.find(i => i.id === id);
  if (!item) return { ok: false, reason: 'Onbekend item' };
  if (!profile.owned.includes(id)) {
    if (profile.coins < item.price) return { ok: false, reason: 'Niet genoeg munten' };
    profile.coins -= item.price; profile.owned.push(id);
  }
  profile[item.category] = id;
  return { ok: true };
}
export function createShot({ x = 2.8, y = 1.7, power = 0.65, curve = 0, wind = 0, distance = 21, originX = 0, originY = 0.15 } = {}) {
  const duration = (animation.flightBaseSeconds - Math.max(0, Math.min(1, power)) * animation.flightPowerReductionSeconds) * Math.sqrt(distance / 21);
  // Solve ballistic travel time to the goal plane. Curve deliberately changes the landing point.
  return { x: originX, y: originY, z: GOAL.z + distance, vx: (x-originX) / duration, vy: (y - originY + 4.905 * duration ** 2) / duration,
    vz: -distance / duration, curve, wind, time: 0, result: null, crossed: false };
}
export function keeperX(time, target, reaction = animation.keeperReactionSeconds, speed = animation.keeperSpeedMetresPerSecond) {
  return Math.sign(target) * Math.min(Math.abs(target), Math.max(0, time - reaction) * speed);
}
export function stepShot(s, dt = DT, keeper = true, wall = false, wallZ = -9) {
  if (s.result) return s;
  const prev = { x: s.x, y: s.y, z: s.z };
  s.time += dt;
  s.vx += (s.curve * 3.6 + s.wind) * dt;
  s.vy -= 9.81 * dt;
  s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
  if (s.y < GOAL.radius) { s.bounced = true; s.y = GOAL.radius; s.vy = Math.abs(s.vy) * 0.48; s.vx *= 0.88; }
  const wallHalf = typeof wall === 'number' ? wall * .315 : 1.35;
  if (wall && prev.z > wallZ && s.z <= wallZ && Math.abs(s.x) < wallHalf && s.y < 2.1) s.result = 'blocked';
  if (!s.result && prev.z > GOAL.z && s.z <= GOAL.z) {
    const t = (GOAL.z - prev.z) / (s.z - prev.z);
    s.x = prev.x + (s.x - prev.x) * t; s.y = prev.y + (s.y - prev.y) * t; s.z = GOAL.z;
    s.crossed = true;
    const post = Math.abs(Math.abs(s.x) - GOAL.half) < 0.16 && s.y < GOAL.height + 0.16;
    const bar = Math.abs(s.y - GOAL.height) < 0.16 && Math.abs(s.x) < GOAL.half + 0.16;
    if (post || bar) s.result = 'post';
    else if (Math.abs(s.x) > GOAL.half - GOAL.radius || s.y > GOAL.height - GOAL.radius) s.result = 'wide';
    else if (keeper && Math.abs(s.x - keeperX(s.time, s.x)) < 0.72 && s.y < 2.15) s.result = 'saved';
    else s.result = 'goal';
  }
  if (!s.result && s.time > 4) s.result = 'wide';
  return s;
}
export function simulate(options, keeper = true, wall = false, wallZ = -9) {
  const s = createShot(options);
  for (let i = 0; i < 600 && !s.result; i++) stepShot(s, DT, keeper, wall, wallZ);
  return s;
}
