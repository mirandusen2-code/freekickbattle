import { randomUUID, createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile, rename, statfs, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';
import { spawn } from 'node:child_process';
import { basename, join, resolve } from 'node:path';

const MiB = 1024 * 1024;
class RequestError extends Error { constructor(status, message) { super(message); this.status = status; } }
const requireValue = (ok, message, status = 400) => { if (!ok) throw new RequestError(status, message); };
const validId = id => /^[a-f0-9-]{36}$/.test(id || '');
const indexQueues = new Map();
function rebuildIndex(root) {
  const task = (indexQueues.get(root) || Promise.resolve()).catch(() => {}).then(() => new Promise((resolve, reject) => {
    const child = spawn('python', ['scripts/build-database.py'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] }); let error = '';
    child.stderr.on('data', b => { error = (error + b).slice(-1000); }); child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(error || 'Database-index mislukt')));
  })); indexQueues.set(root, task); return task;
}
export function createVideoImportService({ root = resolve(import.meta.dirname, '..'), importRoot = join(root, 'research/imports'), maxFileBytes = 1024 * MiB, chunkBytes = 4 * MiB } = {}) {
  const sessions = new Map(), children = new Set(), writes = new WeakMap();
  function persist(s) { const task = (writes.get(s) || Promise.resolve()).catch(() => {}).then(async () => { const path = join(importRoot, s.id, 'upload.json'); await writeFile(path + '.tmp', JSON.stringify(s, null, 2)); await rename(path + '.tmp', path); }); writes.set(s, task); return task; }
  async function load(id) {
    requireValue(validId(id), 'Ongeldige import-ID');
    if (sessions.has(id)) return sessions.get(id);
    let s; try { s = JSON.parse(await readFile(join(importRoot, id, 'upload.json'), 'utf8')); } catch { throw new RequestError(404, 'Import niet gevonden'); }
    s.busy = false;
    for (const j of s.jobs) if (j.status === 'running') { j.status = 'failed'; j.error = 'De server is opnieuw gestart. Start de analyse opnieuw.'; }
    sessions.set(id, s); return s;
  }
  function json(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); }
  async function jsonBody(req) { let data = ''; for await (const part of req) { data += part.toString('utf8'); requireValue(Buffer.byteLength(data) <= 16384, 'Aanvraag te groot', 413); } try { return JSON.parse(data || '{}'); } catch { throw new RequestError(400, 'Ongeldige JSON'); } }
  function publicState(s) { const { chunks, busy, ...rest } = s; return { ...rest, receivedChunks: chunks.length, receivedBytes: chunks.reduce((n, c) => n + c.size, 0) }; }
  async function handler(req, res, next = () => { res.writeHead(404); res.end(); }) {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (!path.startsWith('/api/video-import')) return next();
    try {
      if (req.method === 'POST') {
        requireValue(req.headers['x-freekick-import'] === '1', 'Gebruik de importpagina', 403);
        if (req.headers.origin) requireValue(new URL(req.headers.origin).host === req.headers.host, 'Alleen dezelfde oorsprong is toegestaan', 403);
      }
      const route = path.slice('/api/video-import'.length).split('/').filter(Boolean);
      if (req.method === 'GET' && route.length === 0) return json(res, 200, { available: true, chunkBytes, maxFileBytes, note: 'Ontwikkelserver. Limiet van deze importfunctie, niet van de chat.' });
      if (req.method === 'POST' && route.length === 0) {
        const body = await jsonBody(req);
        requireValue(typeof body.fileName === 'string' && /\.(mp4|m4v|mov|webm)$/i.test(body.fileName), 'Kies een MP4, MOV of WebM');
        requireValue(Number.isSafeInteger(body.size) && body.size > 0 && body.size <= maxFileBytes, 'Bestand te groot of leeg', 413);
        await mkdir(importRoot, { recursive: true });
        const disk = await statfs(importRoot); requireValue(disk.bavail * disk.bsize >= body.size * 2 + 256 * MiB, 'Onvoldoende vrije schijfruimte', 507);
        const s = { id: randomUUID(), fileName: basename(body.fileName).replace(/[^a-zA-Z0-9._ -]/g, '_').slice(-120), size: body.size,
          chunkBytes, chunkCount: Math.ceil(body.size / chunkBytes), chunks: [], completed: false, sha256: null, kind: body.kind === 'fixture' ? 'fixture' : 'reference', jobs: [], busy: false };
        await mkdir(join(importRoot, s.id)); await persist(s); sessions.set(s.id, s); return json(res, 201, publicState(s));
      }
      const s = await load(route[0]); const dir = join(importRoot, s.id);
      if (req.method === 'GET' && route.length === 1) return json(res, 200, publicState(s));
      if (req.method === 'POST' && route[1] === 'chunks' && route.length === 3) {
        requireValue(!s.completed && !s.busy, 'Import is voltooid of bezig', 409);
        const index = Number(route[2]), expectedHash = req.headers['x-chunk-sha256'];
        requireValue(Number.isSafeInteger(index) && index >= 0 && index < s.chunkCount && index <= s.chunks.length, 'Ongeldig chunknummer');
        requireValue(typeof expectedHash === 'string' && /^[a-f0-9]{64}$/.test(expectedHash), 'Checksum ontbreekt');
        const expectedSize = Math.min(chunkBytes, s.size - index * chunkBytes);
        s.busy = true; const temp = join(dir, `chunk-${index}.tmp`); let size = 0; const hash = createHash('sha256');
        try {
          const buffers = [];
          await pipeline(req, new Writable({ write(part, _, cb) { size += part.length; if (size > expectedSize) return cb(new RequestError(413, 'Chunk te groot')); hash.update(part); buffers.push(part); cb(); } }));
          const digest = hash.digest('hex');
          requireValue(size === expectedSize && digest === expectedHash, 'Checksum of bestandsgrootte wijkt af', 422);
          if (index < s.chunks.length) { requireValue(s.chunks[index].sha256 === digest, 'Dit deel is al met andere inhoud opgeslagen', 409); return json(res, 200, publicState(s)); }
          await writeFile(temp, Buffer.concat(buffers), { flag: 'wx' }); await rename(temp, join(dir, `chunk-${index}.part`));
          s.chunks.push({ size, sha256: digest }); await persist(s); return json(res, 200, publicState(s));
        } finally { s.busy = false; await rm(temp, { force: true }); }
      }
      if (req.method === 'POST' && route[1] === 'complete' && route.length === 2) {
        if (s.completed) return json(res, 200, publicState(s));
        requireValue(!s.busy && s.chunks.length === s.chunkCount, 'Niet alle delen zijn ontvangen', 409); s.busy = true;
        const target = join(dir, 'source' + s.fileName.slice(s.fileName.lastIndexOf('.')).toLowerCase()); const temp = target + '.tmp';
        const out = createWriteStream(temp, { flags: 'wx' }); const hash = createHash('sha256'); let size = 0;
        try {
          async function* parts() { for (let i = 0; i < s.chunkCount; i++) { const ch = createHash('sha256'); for await (const bytes of createReadStream(join(dir, `chunk-${i}.part`))) { ch.update(bytes); hash.update(bytes); size += bytes.length; yield bytes; } requireValue(ch.digest('hex') === s.chunks[i].sha256, 'Checksum van opgeslagen deel wijkt af', 422); } }
          await pipeline(parts(), out); requireValue(size === s.size, 'Totale bestandsgrootte wijkt af', 422); await rename(temp, target);
          s.sha256 = hash.digest('hex'); s.completed = true; s.videoPath = basename(target); await persist(s);
          for (let i = 0; i < s.chunkCount; i++) await rm(join(dir, `chunk-${i}.part`), { force: true });
          return json(res, 200, publicState(s));
        } finally { s.busy = false; await rm(temp, { force: true }); }
      }
      if (req.method === 'POST' && route[1] === 'analyze' && route.length === 2) {
        requireValue(s.completed, 'Rond eerst de upload af', 409);
        requireValue(!s.jobs.some(j => j.status === 'running'), 'Er loopt al een analyse', 409);
        const body = await jsonBody(req); const start = Number(body.start || 0), duration = body.duration == null ? null : Number(body.duration);
        requireValue(Number.isFinite(start) && start >= 0 && (duration === null || Number.isFinite(duration) && duration > 0 && duration <= 60), 'Ongeldig analysebereik');
        requireValue(!body.everyFrame || duration !== null && duration <= 10, 'Frame-voor-frame: kies maximaal 10 seconden');
        const job = { id: randomUUID(), status: 'running', frames: 0, error: null, indexStatus: s.kind === 'reference' ? 'pending' : 'not_applicable' }; s.jobs.push(job); await persist(s);
        const args = ['scripts/analyze-video.py', join(dir, s.videoPath), '--output', join(dir, job.id), '--source-id', `import-${s.id}`, '--kind', s.kind, '--start', String(start), '--max-frames', '10000'];
        if (duration !== null) args.push('--duration', String(duration)); if (body.everyFrame) args.push('--every-frame');
        const child = spawn('python', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }); children.add(child); let stderr = '';
        child.stdout.resume(); child.stderr.on('data', b => { stderr = (stderr + b.toString()).slice(-3000); });
        const timer = setTimeout(() => child.kill('SIGTERM'), 10 * 60 * 1000);
        let settled = false;
        const finish = async code => { if (settled) return; settled = true; clearTimeout(timer); children.delete(child); try { if (code !== 0) throw new Error(stderr || 'Analyseproces kon niet starten'); const m = JSON.parse(await readFile(join(dir, job.id, 'manifest.json'), 'utf8')); job.status = 'complete'; job.frames = m.selectedFrames.length; } catch (e) { job.status = 'failed'; job.error = e.message.slice(-1000); job.indexStatus = 'failed'; } try { await persist(s); if (job.status === 'complete' && s.kind === 'reference') { try { await rebuildIndex(root); job.indexStatus = 'complete'; } catch (e) { job.indexStatus = 'failed'; job.error = e.message; } await persist(s); } } catch (e) { console.error('Importstatus kon niet worden opgeslagen:', e.message); } };
        child.once('error', () => finish(-1)); child.once('exit', code => finish(code)); return json(res, 202, publicState(s));
      }
      if (req.method === 'GET' && route[1] === 'jobs' && validId(route[2])) {
        const job = s.jobs.find(j => j.id === route[2]); requireValue(job && job.status === 'complete', 'Analyse niet beschikbaar', 404);
        if (route.length === 3) return json(res, 200, JSON.parse(await readFile(join(dir, job.id, 'manifest.json'), 'utf8')));
        if (route.length === 4 && /^frame-\d{6}\.(jpg|png)$/.test(route[3])) { const bytes = await readFile(join(dir, job.id, route[3])); res.writeHead(200, { 'Content-Type': route[3].endsWith('.png') ? 'image/png' : 'image/jpeg', 'Cache-Control': 'private, max-age=3600' }); res.end(bytes); return; }
      }
      throw new RequestError(404, 'Onbekende importroute');
    } catch (error) { if (!res.headersSent) json(res, error.status || 500, { error: error.status ? error.message : 'Import mislukt. Controleer het bestand en de serverlog.' }); else res.destroy(); }
  }
  return { handler, close() { for (const c of children) c.kill('SIGTERM'); } };
}
