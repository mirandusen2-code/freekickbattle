import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm, stat, open, mkdir, copyFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createVideoImportService } from '../scripts/video-import-service.mjs';

test('a >32 MiB MP4 imports in bounded chunks with checksums, resume, assembly and native-frame analysis', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'freekick-large-import-'));
  const service = createVideoImportService({ root: resolve('.'), importRoot: join(dir, 'imports') });
  const server = createServer(service.handler); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/video-import`;
  const request = async (path = '', options = {}) => {
    const response = await fetch(base + path, { ...options, headers: { 'x-freekick-import': '1', ...options.headers } });
    return { status: response.status, body: await response.json() };
  };
  let file;
  try {
    const video = join(dir, 'large-fixture.mp4');
    execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=160x90:rate=30:duration=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', video]);
    // A legal MP4 'free' box pads this synthetic fixture beyond the chat tool's limit.
    file = await open(video, 'r+'); const original = await file.stat(); const padding = 36 * 1024 * 1024;
    const header = Buffer.alloc(8); header.writeUInt32BE(padding + 8); header.write('free', 4);
    await file.write(header, 0, 8, original.size); await file.truncate(original.size + padding + 8);
    const size = (await stat(video)).size; assert.ok(size > 32 * 1024 * 1024);
    const denied = await request('', { method: 'POST', headers: { Origin: 'https://unrelated.example' }, body: JSON.stringify({ fileName: 'test.mp4', size }) }); assert.equal(denied.status, 403);
    const oversized = await request('', { method: 'POST', body: JSON.stringify({ fileName: 'x.mp4', size: 2 ** 31 }) }); assert.equal(oversized.status, 413);
    const created = await request('', { method: 'POST', body: JSON.stringify({ fileName: 'large-fixture.mp4', size, kind: 'fixture' }) });
    assert.equal(created.status, 201); const s = created.body;
    assert.equal(s.chunkBytes, 4 * 1024 * 1024); assert.ok(s.chunkCount >= 9);
    assert.equal((await request(`/${s.id}/complete`, { method: 'POST' })).status, 409);
    for (let index = 0; index < s.chunkCount; index++) {
      const bytes = Buffer.alloc(Math.min(s.chunkBytes, size - index * s.chunkBytes)); await file.read(bytes, 0, bytes.length, index * s.chunkBytes);
      const hash = createHash('sha256').update(bytes).digest('hex');
      if (index === 0) assert.equal((await request(`/${s.id}/chunks/0`, { method: 'POST', body: bytes, headers: { 'x-chunk-sha256': '0'.repeat(64) } })).status, 422);
      const r = await request(`/${s.id}/chunks/${index}`, { method: 'POST', body: bytes, headers: { 'x-chunk-sha256': hash } }); assert.equal(r.status, 200); assert.equal(r.body.receivedChunks, index + 1);
      if (index === 0) { const again = await request(`/${s.id}/chunks/0`, { method: 'POST', body: bytes, headers: { 'x-chunk-sha256': hash } }); assert.equal(again.status, 200); assert.equal(again.body.receivedChunks, 1); }
    }
    const completed = await request(`/${s.id}/complete`, { method: 'POST' }); assert.equal(completed.status, 200); assert.ok(completed.body.completed);
    const hash = createHash('sha256'); for await (const b of createReadStream(video)) hash.update(b); assert.equal(completed.body.sha256, hash.digest('hex'));
    assert.equal((await request(`/${s.id}/complete`, { method: 'POST' })).body.sha256, completed.body.sha256);
    const invalid = await request(`/${s.id}/analyze`, { method: 'POST', body: JSON.stringify({ start: 0, duration: 20, everyFrame: true }) }); assert.equal(invalid.status, 400);
    const analyzed = await request(`/${s.id}/analyze`, { method: 'POST', body: JSON.stringify({ start: 0.2, duration: 0.2, everyFrame: true }) }); assert.equal(analyzed.status, 202);
    const jobId = analyzed.body.jobs.at(-1).id;
    let status;
    for (let i = 0; i < 150; i++) { const r = await request(`/${s.id}`); status = r.body.jobs.find(j => j.id === jobId); if (status.status !== 'running') break; await delay(100); }
    assert.equal(status.status, 'complete', status.error);
    const manifest = (await request(`/${s.id}/jobs/${jobId}`)).body;
    assert.equal(manifest.kind, 'fixture'); assert.equal(manifest.selectedFrames.length, 6); assert.equal(manifest.selectedFrames[0].frameIndex, 6); assert.equal(manifest.originalGameFPS, null);
    const image = await fetch(`${base}/${s.id}/jobs/${jobId}/${manifest.selectedFrames[0].path}`);
    assert.equal(image.status, 200); assert.equal(image.headers.get('Content-Type'), 'image/png'); assert.equal(manifest.pixelProcessing, 'native-png');
  } finally { await file?.close(); service.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true, force: true }); }
});

test('a user-designated reference is indexed with native frames and remains visually unverified', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'freekick-reference-index-'));
  await mkdir(join(dir, 'scripts')); await mkdir(join(dir, 'data'));
  for (const name of ['analyze-video.py', 'build-database.py']) await copyFile(`scripts/${name}`, join(dir, 'scripts', name));
  for (const name of ['references.json', 'catalog.json', 'animation-spec.json', 'battle-catalog.json', 'video-analysis.json', 'frame-index.json', 'reference-assets.json']) await copyFile(`data/${name}`, join(dir, 'data', name));
  const service = createVideoImportService({ root: dir }); const server = createServer(service.handler); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/video-import`;
  const request = async (path, body, headers = {}) => { const r = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'x-freekick-import': '1', ...headers }, body: body === undefined ? undefined : Buffer.isBuffer(body) ? body : JSON.stringify(body) }); assert.ok(r.ok, await r.clone().text()); return r.json(); };
  try {
    const video = join(dir, 'fixture-reference.mp4'); execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=160x90:rate=30:duration=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', video]);
    const bytes = await readFile(video); const hash = createHash('sha256').update(bytes).digest('hex');
    const s = await request('', { fileName: 'fixture-reference.mp4', size: bytes.length, kind: 'reference' });
    await request(`/${s.id}/chunks/0`, bytes, { 'x-chunk-sha256': hash }); await request(`/${s.id}/complete`, {});
    const analysis = await request(`/${s.id}/analyze`, { start: 0.2, duration: 0.2, everyFrame: true }); const jobId = analysis.jobs.at(-1).id;
    let job;
    for (let i = 0; i < 200; i++) { job = (await request(`/${s.id}`)).jobs.find(j => j.id === jobId); if (job.status === 'failed' || job.indexStatus === 'complete' || job.indexStatus === 'failed') break; await delay(100); }
    assert.equal(job.status, 'complete', job.error); assert.equal(job.indexStatus, 'complete', job.error);
    const data = JSON.parse(await readFile(join(dir, 'data/reference-index.json'), 'utf8'));
    assert.equal(data.imports.length, 1); assert.equal(data.imports[0].visually_reviewed, 0); assert.equal(data.video_frames.length, 6);
    assert.equal(data.sources.find(s => s.id === `import-${analysis.id}`).access, 'imported_not_viewed');
    assert.equal(data.video_frames[0].frame_index, 6); assert.equal(data.video_frames[0].timestamp_seconds, 0.2);
  } finally { service.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true, force: true }); }
});
