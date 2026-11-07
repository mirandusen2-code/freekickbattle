import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { BATTLE_CATALOG } from '../src/battle-engine.js';
import { CATALOG } from '../src/game.js';

const db = JSON.parse(readFileSync(new URL('../data/references.json', import.meta.url)));
test('all catalog entries have provenance and do not invent original prices or names', () => {
  assert.equal(new Set(CATALOG.map(i => i.id)).size, CATALOG.length);
  const sources = new Set(db.sources.map(s => s.id));
  for (const i of CATALOG) {
    assert.equal(i.originalName, null); assert.equal(i.originalPrice, null); assert.equal(i.priceStatus, 'implementation_choice');
    assert.ok(Number.isSafeInteger(i.price) && i.price >= 0); assert.ok(i.costumeSourceIds.every(s => sources.has(s)));
  }
});
test('facts and assets distinguish reviewed video evidence from unknown shop designs', () => {
  const ids = new Set(db.sources.map(s => s.id));
  assert.ok(db.facts.every(f => f.sourceIds.every(id => ids.has(id))));
  assert.ok(db.facts.filter(f => f.status === 'visually_verified').length >= 16);
  assert.equal(db.assets.filter(a => a.visuallyMatched).length, 12);
  assert.ok(db.assets.filter(a => a.visuallyMatched).every(a => a.sourceId === 'received-training-video'));
  assert.equal(db.features.find(f => f.id === 'real-pvp').implementation, 'not_implemented');
  assert.equal(db.features.find(f => f.id === 'original-frame-match').implementation, 'partial');
});
test('generated SQLite has foreign-key integrity, the full local catalog and no fictional original frames', () => {
  const result = JSON.parse(execFileSync('python', ['-c', `
import sqlite3,json
db=sqlite3.connect('file:data/references.sqlite?mode=ro',uri=True)
print(json.dumps({'integrity':db.execute('PRAGMA integrity_check').fetchone()[0], 'foreignKeys':db.execute('PRAGMA foreign_key_check').fetchall(),'items':db.execute('SELECT count(*) FROM items').fetchone()[0],'invalidFrames':db.execute("SELECT count(*) FROM video_frames f JOIN sources s ON s.id=f.source_id WHERE s.access <> 'imported_not_viewed' OR f.path NOT LIKE 'research/imports/%'").fetchone()[0]}))`], { encoding: 'utf8' }));
  assert.equal(result.integrity, 'ok'); assert.deepEqual(result.foreignKeys, []); assert.equal(result.items, BATTLE_CATALOG.length); assert.equal(result.invalidFrames, 0);
});
test('all 26,975 source frames and eight visually observed stages are indexed honestly', () => {
  const result=JSON.parse(execFileSync('python',['-c',`import sqlite3,json
db=sqlite3.connect('file:data/references.sqlite?mode=ro',uri=True)
print(json.dumps({'frames':db.execute('SELECT count(*) FROM frame_index').fetchone()[0],'observations':db.execute('SELECT count(*) FROM observations').fetchone()[0],'stages':db.execute('SELECT distance_metres,wall_players FROM stages ORDER BY stage').fetchall(),'manual':db.execute("SELECT value FROM metadata WHERE key='all_frames_manually_reviewed'").fetchone()[0]}))`],{encoding:'utf8'}));
  assert.equal(result.frames,26975);assert.equal(result.observations,19);assert.equal(result.manual,'false');assert.deepEqual(result.stages,[[21,0],[21,0],[27,2],[27,2],[42,2],[42,2],[37,3],[32,4]]);
});
test('video pipeline extracts native frame indices/timestamps from a synthetic fixture', () => {
  const path = mkdtempSync(join(tmpdir(), 'freekick-video-test-'));
  try {
    const video = join(path, 'fixture.mp4'), out = join(path, 'frames');
    execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=160x90:rate=30:duration=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', video]);
    execFileSync('python', ['scripts/analyze-video.py', video, '--output', out, '--source-id', 'synthetic-test', '--kind', 'fixture', '--start', '0.2', '--duration', '0.2', '--every-frame']);
    const manifest = JSON.parse(readFileSync(join(out, 'manifest.json')));
    assert.equal(manifest.kind, 'fixture'); assert.equal(manifest.averageVideoFPS, 30); assert.equal(manifest.originalGameFPS, null);
    assert.equal(manifest.pixelProcessing, 'native-png'); assert.equal(manifest.selectedFrames[0].sourceWidth, 160); assert.equal(manifest.selectedFrames[0].sourceHeight, 90);
    assert.equal(manifest.selectedFrames.length, 6); assert.equal(manifest.selectedFrames[0].frameIndex, 6);
    assert.equal(manifest.selectedFrames[0].timestampSeconds, 0.2);
    assert.ok(manifest.selectedFrames.every(f => f.sha256.length === 64));
  } finally { rmSync(path, { recursive: true, force: true }); }
});
