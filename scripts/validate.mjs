import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

mkdirSync('test-results/validation', { recursive: true });
const checks = [];
function run(id, command, args, env = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', env: { ...process.env, ...env }, timeout: 600000, maxBuffer: 10 * 1024 * 1024 });
  const output = `${result.stdout || ''}${result.stderr || ''}${result.error ? result.error.message : ''}`;
  writeFileSync(`test-results/validation/${id}.log`, output);
  const check = { id, status: result.status === 0 ? 'passed' : 'failed', command: [command, ...args].join(' '), exitCode: result.status ?? -1, completedAt: new Date().toISOString() };
  checks.push(check); console.log(output); if (check.status === 'failed') throw new Error(`${id} failed`);
}
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5175', '--strictPort'], { stdio: 'ignore' });
try {
  run('database', 'python', ['scripts/build-database.py']);
  let ready = false;
  for (let i = 0; i < 80; i++) { try { const r = await fetch('http://127.0.0.1:5175'); if (r.ok) { ready = true; break; } } catch {} await delay(250); }
  if (!ready) throw new Error('Validation server did not become ready');
  run('unit', 'npm', ['test']);
  run('reference-game-browser', process.execPath, ['tests/battle-browser.mjs'], { TEST_URL: 'http://127.0.0.1:5175' });
  run('battle-scenes',process.execPath,['tests/battle-scenes.mjs'],{TEST_URL:'http://127.0.0.1:5175'});
  run('browser', 'npm', ['run', 'test:browser'], { TEST_URL: 'http://127.0.0.1:5175' });
  run('extended-browser', process.execPath, ['tests/extended-browser.mjs'], { TEST_URL: 'http://127.0.0.1:5175' });
  run('import-browser', process.execPath, ['tests/import-browser.mjs'], { TEST_URL: 'http://127.0.0.1:5175' });
  run('build', 'npm', ['run', 'build']);
  run('standalone-package',process.execPath,['scripts/package-game.mjs']);
  run('standalone-browser',process.execPath,['tests/standalone-browser.mjs']);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally {
  server.kill('SIGTERM');
  writeFileSync('data/validation.json', JSON.stringify({ status: process.exitCode ? 'failed' : 'passed', generatedAt: new Date().toISOString(), checks }, null, 2) + '\n');
  const db = spawnSync('python', ['scripts/build-database.py'], { encoding: 'utf8' }); console.log(db.stdout); if (db.status !== 0) process.exitCode = 1;
  if (!process.exitCode) {
    // Rebuild the reference page with the completed validation index included.
    const built = spawnSync('npm', ['run', 'build'], { encoding: 'utf8' }); console.log(built.stdout); if (built.status !== 0) { console.error(built.stderr); process.exitCode = 1; }
  }
}
