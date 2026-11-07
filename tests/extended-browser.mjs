import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { BATTLE_CATALOG } from '../src/battle-engine.js';
import { CATALOG, freshProfile } from '../src/game.js';
import references from '../data/references.json' with { type: 'json' };

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
mkdirSync('test-results/catalog', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
async function newPage(profile, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1040 }, ...options });
  if (profile) await context.addInitScript(p => { if (!sessionStorage.getItem('test-seeded')) { localStorage.setItem('freekick-battle-profile-v1', JSON.stringify(p)); sessionStorage.setItem('test-seeded', '1'); } }, profile);
  const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.goto(`${base}/lab.html`,{waitUntil:'domcontentloaded'}); await p.locator('#shoot').waitFor(); return p;
}
try {
  const seed = freshProfile(); seed.coins = 5000;
  const page = await newPage(seed);
  await page.locator('#fps').selectOption('30');
  await page.locator('#shop-nav').click();
  let spent = 0;
  for (const item of CATALOG) {
    await page.locator(`[data-category="${item.category}"]`).click();
    const button = page.locator(`[data-buy="${item.id}"]`);
    if (await button.isEnabled()) await button.click();
    spent += item.price;
    assert.equal(await page.locator('#shop-balance').textContent(), (5000 - spent).toLocaleString('nl-NL'));
    assert.ok(await button.isDisabled());
  }
  const purchased = await page.evaluate(() => JSON.parse(localStorage.getItem('freekick-battle-profile-v1')));
  assert.equal(purchased.owned.length, CATALOG.length);
  assert.equal(purchased.coins, 3600);
  const cropHashes = new Set();
  for (const kit of CATALOG.filter(i => i.category === 'kit')) {
    await page.locator('[data-category="kit"]').click();
    const b = page.locator(`[data-buy="${kit.id}"]`); if (await b.isEnabled()) await b.click();
    for (const ball of CATALOG.filter(i => i.category === 'ball')) {
      await page.locator('[data-category="ball"]').click();
      const b = page.locator(`[data-buy="${ball.id}"]`); if (await b.isEnabled()) await b.click();
      await page.locator('#shop .close').click();
      await page.waitForTimeout(250);
      await page.locator('#pitch').screenshot({ path: `test-results/catalog/${kit.id}-${ball.id}.png` });
      if (ball.id === 'matchball') {
        const r = await page.locator('#pitch').boundingBox();
        // Exclude the goal marker/crowd; the lower left crop contains the actual 3D kicker.
        const png = await page.screenshot({ clip: { x: r.x + r.width * 0.12, y: r.y + r.height * 0.62, width: r.width * 0.28, height: r.height * 0.3 } });
        cropHashes.add(createHash('sha256').update(png).digest('hex'));
      }
      await page.locator('#shop-nav').click();
      assert.equal(await page.locator('#shop-balance').textContent(), '3.600');
    }
  }
  assert.equal(cropHashes.size, 5, 'the five equipped kits change the rendered kicker');
  await page.locator('#shop .close').click();
  await page.reload();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('freekick-battle-profile-v1')));
  assert.equal(restored.kit, 'bunny'); assert.equal(restored.ball, 'coral'); assert.equal(restored.coins, 3600);

  // A real UI shot is recorded and replayed without changing balance or round state.
  await page.locator('#power').fill('90'); await page.locator('#shoot').click();
  await page.waitForFunction(() => !document.querySelector('#replay-open').disabled);
  const balance = await page.locator('#balance').textContent(), goals = await page.locator('#goals').textContent();
  await page.locator('#replay-open').click();
  await page.locator('#replay-next').click(); assert.match(await page.locator('#replay-time').textContent(), /^1 \/ /);
  await page.locator('#replay-prev').click(); assert.match(await page.locator('#replay-time').textContent(), /^0 \/ /);
  const max = Number(await page.locator('#replay-position').getAttribute('max'));
  await page.locator('#replay-position').fill(String(Math.floor(max / 2)));
  assert.match(await page.locator('#replay-time').textContent(), new RegExp(`^${Math.floor(max / 2)} /`));
  await page.locator('#replay-speed').selectOption('0.5'); await page.locator('#replay-play').click();
  await page.waitForTimeout(500); await page.locator('#replay-play').click();
  const download = page.waitForEvent('download'); await page.locator('#replay-export').click();
  const file = await download; const data = JSON.parse(readFileSync(await file.path()));
  assert.equal(data.sampleRate, 120); assert.equal(data.result, 'goal'); assert.equal(data.frames.length, max + 1);
  assert.equal(await page.locator('#balance').textContent(), balance); assert.equal(await page.locator('#goals').textContent(), goals);
  await page.screenshot({ path: 'test-results/replay.png' });
  await page.locator('#replay-close').click();
  await page.waitForFunction(() => !document.querySelector('#shoot').disabled);
  await page.locator('#shoot').focus(); await page.keyboard.press('p');
  assert.equal(await page.locator('#resume').isVisible(), true); await page.keyboard.press('p'); assert.equal(await page.locator('#resume').isVisible(), false);
  for (const fps of ['30', '60', '120']) { await page.locator('#fps').selectOption(fps); assert.equal(await page.locator('#fps').inputValue(), fps); }
  await page.locator('#curve').fill('-80'); assert.match(await page.locator('#curve-value').textContent(), /80% LINKS/);
  await page.locator('#pitch').focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowUp');
  await page.locator('#help-button').click(); await page.keyboard.press('Escape');

  await page.goto(`${base}/reference.html`); // release the animated WebGL scene before opening more contexts
  // Corrupted storage falls back; denied localStorage does not crash gameplay.
  const corrupt = await newPage(null);
  await corrupt.evaluate(() => localStorage.setItem('freekick-battle-profile-v1', '{bad json'));
  await corrupt.reload(); assert.equal(await corrupt.locator('#balance').textContent(), '250'); await corrupt.context().close();
  const noStorageContext = await browser.newContext();
  await noStorageContext.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('disabled', 'SecurityError'); } }); });
  const noStorage = await noStorageContext.newPage(); noStorage.on('pageerror', e => errors.push(e.message)); await noStorage.goto(`${base}/lab.html`);
  await noStorage.locator('#shop-nav').click(); await noStorage.locator('[data-buy="sunset"]').click();
  assert.equal(await noStorage.locator('#shop-balance').textContent(), '130'); await noStorageContext.close();

  // The production fallback remains usable when WebGL cannot be created.
  const fallbackContext = await browser.newContext();
  await fallbackContext.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl/.test(type) ? null : original.call(this, type, ...args); }; });
  const fallback = await fallbackContext.newPage(); fallback.on('pageerror', e => errors.push(e.message)); await fallback.goto(`${base}/lab.html`);
  assert.match(await fallback.locator('.webgl-error').textContent(), /3D-weergave niet beschikbaar/); assert.equal(await fallback.locator('#shoot').isDisabled(), true); await fallbackContext.close();

  // Research dashboard is backed by the same canonical catalog and SQLite index.
  await page.goto(`${base}/reference.html`);
  assert.equal(await page.locator('#rows article').count(), references.features.length + BATTLE_CATALOG.length);
  await page.locator('[data-tab="items"]').click(); assert.equal(await page.locator('#rows article').count(), BATTLE_CATALOG.length);
  await page.locator('#search').fill('samurai'); assert.equal(await page.locator('#rows article').count(), 1);
  await page.locator('#search').fill(''); await page.locator('[data-tab="facts"]').click(); await page.locator('#filter').selectOption('unknown');
  assert.equal(await page.locator('#rows article').count(), references.facts.filter(f=>f.status==='unknown').length);
  await page.locator('[data-tab="sources"]').click(); await page.screenshot({ path: 'test-results/database.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  // Touch input and replay controls fit on a mobile device as well.
  const mobile = await newPage(null, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await mobile.locator('#pitch').tap({ position: { x: 200, y: 200 } });
  await mobile.locator('#shoot').scrollIntoViewIfNeeded(); await mobile.locator('#shoot').tap();
  await mobile.waitForFunction(() => !document.querySelector('#replay-open').disabled);
  await mobile.locator('#replay-open').tap(); await mobile.locator('#replay-next').tap();
  assert.match(await mobile.locator('#replay-time').textContent(), /^1 \/ /);
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobile.screenshot({ path: 'test-results/mobile-replay.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS extended browser: all 8 shop items, all 15 kit/ball combinations, visible kit changes, persistence, replay step/scrub/play/export/isolation, keyboard pause with button focus, FPS options, corrupt/denied storage, WebGL fallback, database filters and mobile touch/replay.');
} finally { await browser.close(); }
