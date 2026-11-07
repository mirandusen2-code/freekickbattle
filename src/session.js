import { DT, createShot, stepShot, simulate } from './game.js';
import animation from '../data/animation-spec.json' with { type: 'json' };

export function createSession(mode = 'training') {
  if (!['training', 'arcade', 'match'].includes(mode)) throw new Error('Onbekende spelmodus');
  return { mode, phase: 'ready', phaseTime: 0, time: 0, shot: null, score: 0, goals: 0, attempts: 0, lives: 5,
    remaining: 60, opponent: 0, opponentAttempts: 0, paused: false, ended: false, shotOptions: null, recording: [], lastReplay: null };
}
export function beginShot(s, options) {
  if (s.paused || s.ended || s.phase !== 'ready' || (s.mode === 'match' && s.remaining <= 0)) return false;
  s.shotOptions = { ...options }; s.phase = 'runup'; s.phaseTime = 0; return true;
}
function finish(s) { s.ended = true; s.phase = 'ended'; s.phaseTime = 0; return { type: 'finished' }; }
export function advance(s, dt = DT) {
  if (!Number.isFinite(dt) || Math.abs(dt - DT) > 1e-10) throw new Error('Gebruik de vaste simulatiestap DT');
  if (s.paused || s.ended) return [];
  const events = [];
  s.time += dt; s.phaseTime += dt;
  if (s.mode === 'match') {
    s.remaining = Math.max(0, s.remaining - dt);
    const attempts = Math.floor((60 - s.remaining + 1e-8) / 9);
    if (attempts > s.opponentAttempts) {
      // Reproducible local rival: actual simulated shots, not an unconditional score timer.
      s.opponentAttempts = attempts;
      const shot = simulate({ x: attempts % 3 === 0 ? 0 : (attempts % 2 ? -3.1 : 3.1), y: 1.8, power: 0.85 });
      if (shot.result === 'goal') s.opponent++;
      events.push({ type: 'opponent', result: shot.result });
    }
    if (s.remaining <= 1e-8) {
      s.remaining = 0;
      if (!['runup', 'flight', 'result'].includes(s.phase)) { events.push(finish(s)); return events; }
    }
  }
  if (s.phase === 'runup' && s.phaseTime + 1e-9 >= animation.runupSeconds) {
    s.shot = createShot(s.shotOptions); s.recording = [{ ...s.shot }]; s.phase = 'flight'; s.phaseTime = 0; events.push({ type: 'contact' });
  }
  if (s.phase === 'flight') {
    stepShot(s.shot, dt, true, s.mode === 'match'); s.recording.push({ ...s.shot });
    if (s.shot.result) {
      s.attempts++;
      const goal = s.shot.result === 'goal', corner = goal && Math.abs(s.shot.x) > 2.5 && s.shot.y > 1.5;
      const points = goal ? corner ? 150 : 100 : 0;
      if (goal) { s.goals++; s.score += points; } else if (s.mode === 'arcade') s.lives--;
      s.lastReplay = { schemaVersion: 1, sampleRate: animation.simulationHz, mode: s.mode, options: { ...s.shotOptions }, result: s.shot.result, frames: s.recording.map(f => ({ ...f })) };
      s.phase = 'result'; s.phaseTime = 0;
      events.push({ type: 'result', result: s.shot.result, points, coins: goal ? 25 : 0, corner });
    }
  }
  if (s.phase === 'result' && s.phaseTime + 1e-9 >= animation.recoverySeconds) {
    if ((s.mode === 'training' && s.attempts >= 10) || (s.mode === 'arcade' && s.lives <= 0) || (s.mode === 'match' && s.remaining === 0)) events.push(finish(s));
    else { s.phase = 'ready'; s.phaseTime = 0; s.shot = null; events.push({ type: 'reset' }); }
  }
  return events;
}

export function replayFrame(replay, index) {
  if (!replay?.frames?.length) return null;
  return { ...replay.frames[Math.max(0, Math.min(replay.frames.length - 1, Math.trunc(index)))] };
}
