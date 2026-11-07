import './style.css';
import { CATALOG, DT, freshProfile, validateProfile, purchase } from './game.js';
import { createSession, beginShot, advance, replayFrame } from './session.js';
import { createWorld } from './scene.js';

const $ = s => document.querySelector(s);
const storageKey = 'freekick-battle-profile-v1';
let profile;
try { profile = validateProfile(JSON.parse(localStorage.getItem(storageKey))); } catch { profile = freshProfile(); }
let storageWarning = false;
function save() { try { localStorage.setItem(storageKey, JSON.stringify(profile)); } catch { storageWarning = true; } }
const state = { ...createSession(), aim: { x: 2.8, y: 1.7 }, power: 0.65, curve: 0,
  fps: 60, muted: false, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches };
const replay = { active: false, index: 0, playing: false, elapsed: 0, speed: 0.25, data: null, wasPaused: false };
let audio;
function sound(type) {
  if (state.muted) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume().catch(() => {});
    const o = audio.createOscillator(), g = audio.createGain(); o.connect(g); g.connect(audio.destination);
    o.type = type === 'kick' ? 'triangle' : 'sine'; const t = audio.currentTime;
    o.frequency.setValueAtTime(type === 'goal' ? 523 : type === 'kick' ? 120 : 210, t);
    o.frequency.exponentialRampToValueAtTime(type === 'goal' ? 1046 : 60, t + 0.2);
    g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.start(t); o.stop(t + 0.31);
  } catch { /* Sound is optional; gameplay does not depend on audio availability. */ }
}

$('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="Freekick Battle beginscherm"><span class="brand-icon">↗</span><span>FREEKICK<span class="brand-light">BATTLE</span></span></a>
    <nav class="mainnav" aria-label="Hoofdnavigatie"><button class="active" id="play-nav">SPELEN</button><button id="shop-nav">KLEEDKAMER <span class="nav-dot"></span></button></nav>
    <div class="account"><span class="coin">✦</span><strong id="balance">250</strong><span class="account-divider"></span><span class="avatar">10</span><span class="account-name">Academy player<small>JOUW TRAINING BEGINT HIER</small></span></div>
  </header>
  <main>
    <section class="page-title"><div><div class="eyebrow"><span class="live-dot"></span> THE BEAUTIFUL GAME. ONE SHOT AT A TIME.</div><h1>Make it <em>count.</em></h1></div><button class="text-button" id="help-button">ⓘ &nbsp; Zo speel je</button></section>
    <section class="arena-shell">
      <div class="arena" id="arena">
        <canvas id="pitch" aria-label="3D-voetbalveld. Klik op het doel om te richten. Gebruik de richtknoppen als alternatief." tabindex="0"></canvas>
        <div class="arena-top"><span class="location"><span class="live-dot"></span> ACADEMY PARK <small>16:00 · HELDER</small></span><div class="arena-tools"><button id="mute" aria-label="Geluid uitschakelen" title="Geluid">♪</button><button id="pause" aria-label="Pauzeren" title="Pauzeren (P)">Ⅱ</button></div></div>
        <div class="scoreboard"><span id="mode-caption">TRAINING</span><div><strong id="score">000</strong><small id="score-unit">PUNTEN</small></div><span id="round-caption">POGING 1 / 10</span></div>
        <div class="wind"><span>↗</span><div>WIND<small>0.0 m/s</small></div></div>
        <div class="feedback" role="status" aria-live="polite"><span id="result-tag"></span><strong id="result-title"></strong><small id="result-detail"></small></div>
        <div class="pause-layer" hidden><span class="eyebrow">EVEN OP ADEM KOMEN</span><h2>Time out.</h2><button class="primary" id="resume">Verder spelen ↗</button></div>
        <div class="replay-controls" hidden aria-label="Schot terugkijken"><div class="replay-heading"><strong>TERUGKIJKEN <span>SIMULATIE · 120 Hz</span></strong><button id="replay-close" aria-label="Replay sluiten">✕</button></div><input id="replay-position" aria-label="Simulatiestap" type="range" min="0" max="1" value="0"/><div class="replay-actions"><button id="replay-prev" aria-label="Vorige simulatiestap">−1</button><button id="replay-play">Afspelen</button><button id="replay-next" aria-label="Volgende simulatiestap">+1</button><select id="replay-speed" aria-label="Replay snelheid"><option value="0.25">¼×</option><option value="0.5">½×</option><option value="1">1×</option></select><output id="replay-time"></output><button id="replay-export">Bewaar JSON</button></div></div>
        <div class="arena-bottom"><span class="camera-label">◉ &nbsp; TRAINING CAMERA</span><span class="aim-hint">KLIK OP HET DOEL OM TE RICHTEN <span>↗</span></span></div>
      </div>
      <aside class="control-panel">
        <div class="panel-top"><span class="eyebrow">KIES JE SPEL</span><span class="chapter">01 — 03</span></div>
        <div class="mode-tabs" role="group" aria-label="Spelmodus"><button data-mode="training" class="selected">Training</button><button data-mode="arcade">Arcade</button><button data-mode="match">Match</button></div>
        <div class="mode-description"><span id="mode-number">01 / VRIJE TRAPPEN</span><h2 id="mode-title">Practice makes<br>perfect.</h2><p id="mode-description">Tien ballen. Alle ruimte om te oefenen. Kies je hoek en vind jouw perfecte vrije trap.</p></div>
        <div class="session-stats"><div><small>DOELPUNTEN</small><strong id="goals">0<span> / 0</span></strong></div><div><small id="secondary-label">PERSOONLIJK BEST</small><strong id="secondary-value">0</strong></div></div>
        <div class="shot-controls">
          <div class="control-label"><label for="power">SCHOTKRACHT</label><output id="power-value">65<span>%</span></output></div><input id="power" type="range" min="15" max="100" value="65" />
          <div class="range-labels"><span>BEHEERST</span><span>VOLLE KRACHT</span></div>
          <div class="control-label curve-label"><label for="curve">EFFECT</label><output id="curve-value">RECHT</output></div><input id="curve" type="range" min="-100" max="100" value="0" /><div class="range-labels"><span>↶ LINKS</span><span>RECHTS ↷</span></div>
          <div class="aim-controls" aria-label="Richting aanpassen"><span>RICHTING</span><button data-aim="left" aria-label="Richt naar links">←</button><button data-aim="up" aria-label="Richt hoger">↑</button><button data-aim="down" aria-label="Richt lager">↓</button><button data-aim="right" aria-label="Richt naar rechts">→</button></div>
        </div>
        <button class="primary shoot" id="shoot"><span>Neem je schot</span><span>↗</span></button><div class="keyboard-hint">of druk op <kbd>SPATIE</kbd></div>
        <div class="session-actions"><button class="restart" id="restart">↻ &nbsp; Opnieuw beginnen</button><button class="restart" id="replay-open" disabled>Laatste schot terugkijken</button></div>
      </aside>
    </section>
    <section class="under-arena"><div><span class="tip-icon">↗</span><p><strong>Een hoek maakt het verschil.</strong><span>Richt buiten het bereik van de keeper. Voeg effect toe om de muur te omspelen.</span></p></div><button id="locker-cta"><span>MAAK HET JOUW SPEL</span>Kies je tenue <b>→</b></button></section>
    <footer><span>FREEKICK BATTLE <b> / </b> SPEELBARE RECONSTRUCTIE · EIGEN ASSETS · NOG NIET VISUEEL GEVERIFIEERD</span><label>RENDERLIMIET <select id="fps"><option value="30">30 FPS</option><option value="60" selected>60 FPS</option><option value="120">120 FPS</option></select></label></footer>
  </main>
  <dialog id="shop"><div class="dialog-header"><div><span class="eyebrow">JOUW STIJL. JOUW SPEL.</span><h2>De kleedkamer<span>.</span></h2></div><button class="close" aria-label="Kleedkamer sluiten">✕</button></div><p class="dialog-intro">Kies een tenue of een nieuwe wedstrijdbal. Je uitrusting en munten worden op dit apparaat bewaard.</p><div class="shop-toolbar"><div class="shop-filters"><button class="selected" data-category="kit">Tenues</button><button data-category="ball">Ballen</button></div><span class="shop-wallet">✦ <b id="shop-balance"></b></span></div><div id="shop-items"></div><p class="shop-note">Eigen ontwerpen en voorlopige prijzen. Deze catalogus is geen geverifieerde kopie van de originele shop. Geen echte betalingen.</p><p id="shop-message" role="status"></p></dialog>
  <dialog id="help"><div class="dialog-header"><h2>Jouw perfecte schot.</h2><button class="close" aria-label="Handleiding sluiten">✕</button></div><ol><li><strong>Richt op het doel.</strong> Klik of tik op het veld. Gebruik de pijltjesknoppen of pijltjestoetsen voor fijnere controle.</li><li><strong>Kies kracht en effect.</strong> Meer kracht geeft de keeper minder tijd. Effect verandert de eindpositie van je schot.</li><li><strong>Schiet.</strong> Druk op de schotknop of spatie. De keeper reageert op de balvlucht.</li></ol><p><b>Training:</b> 10 schoten. Een doelpunt levert 100 punten en 25 munten op, een bovenhoek 50 bonuspunten. <b>Arcade:</b> 5 levens. <b>Match:</b> 60 seconden tegen lokale AI en een verdedigingsmuur.</p><p><b>P</b> pauzeert. De renderlimiet verandert de simulatiesnelheid niet. De originele framerate en spelregels zijn nog niet geverifieerd. Dit is een lokale versie zonder online PvP.</p></dialog>
`.replaceAll('↗', '<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>')
  .replaceAll('←', '<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4m7-7-7 7 7 7"/></svg>')
  .replaceAll('→', '<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7"/></svg>')
  .replaceAll('↑', '<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V4m-7 7 7-7 7 7"/></svg>')
  .replaceAll('↓', '<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16m-7-7 7 7 7-7"/></svg>')
  .replaceAll('Ⅱ', '<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>');
let world;
try { world = createWorld($('#pitch')); } catch (e) {
  $('#pitch')?.remove();
  $('#arena').insertAdjacentHTML('afterbegin', '<div class="webgl-error"><h2>3D-weergave niet beschikbaar</h2><p>Schakel hardwareversnelling/WebGL in en herlaad deze pagina.</p></div>');
  $('#shoot').disabled = true; console.error(e);
}
function setAppearance() {
  const kit = CATALOG.find(i => i.id === profile.kit), ball = CATALOG.find(i => i.id === profile.ball);
  world?.appearance(kit.id, kit.color, ball.color);
}
setAppearance();
const descriptions = {
  training: ['01 / VRIJE TRAPPEN', 'Practice makes<br>perfect.', 'Tien ballen. Alle ruimte om te oefenen. Kies je hoek en vind jouw perfecte vrije trap.'],
  arcade: ['02 / BLIJF SCOREN', 'Keep the<br>streak alive.', 'Vijf levens. Een eindeloze uitdaging. Elke misser kost een leven; ieder doelpunt telt.'],
  match: ['03 / TEGEN DE KLOK', 'Beat the<br>pressure.', 'Zestig seconden tegen lokale AI. Omzeil de muur en eindig met de meeste doelpunten.'],
};
function hud() {
  $('#balance').textContent = profile.coins.toLocaleString('nl-NL');
  $('#score').textContent = state.mode === 'match' ? `${state.goals} : ${state.opponent}` : String(state.score).padStart(3, '0');
  $('#score-unit').textContent = state.mode === 'match' ? 'JIJ · LOKALE AI' : 'PUNTEN';
  $('#mode-caption').textContent = state.mode.toUpperCase();
  $('#round-caption').textContent = state.mode === 'training' ? `POGING ${Math.min(10, state.attempts + 1)} / 10` : state.mode === 'arcade' ? `${state.lives} LEVENS OVER` : `NOG ${Math.ceil(state.remaining)} SECONDEN`;
  $('#goals').innerHTML = `${state.goals}<span> / ${state.attempts}</span>`;
  $('#secondary-label').textContent = state.mode === 'match' ? 'TIJD OVER' : state.mode === 'arcade' ? 'LEVENS OVER' : 'PERSOONLIJK BEST';
  $('#secondary-value').textContent = state.mode === 'match' ? `${Math.ceil(state.remaining)}s` : state.mode === 'arcade' ? '♥'.repeat(state.lives) || '—' : profile.best;
  $('#shoot').disabled = !world || state.phase !== 'ready' || state.paused || state.ended;
  $('#replay-open').disabled = !state.lastReplay || replay.active;
  $('#shoot span').textContent = state.ended ? 'Sessie afgerond' : state.phase === 'ready' ? 'Neem je schot' : 'Bal in het spel…';
}
function feedback(tag = '', title = '', detail = '') { $('#result-tag').textContent = tag; $('#result-title').textContent = title; $('#result-detail').textContent = detail; $('.feedback').classList.toggle('visible', Boolean(title)); }
function reset(mode = state.mode) {
  closeReplay(); Object.assign(state, createSession(mode));
  world?.reset(); feedback(); $('.pause-layer').hidden = true; $('#pause').setAttribute('aria-label', 'Pauzeren');
  document.querySelectorAll('[data-mode]').forEach(b => { b.classList.toggle('selected', b.dataset.mode === mode); b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
  const d = descriptions[mode]; $('#mode-number').textContent = d[0]; $('#mode-title').innerHTML = d[1]; $('#mode-description').textContent = d[2]; hud();
}
function shoot() {
  if (!world || state.paused || state.ended || state.phase !== 'ready' || $('dialog[open]')) return;
  if (beginShot(state, { ...state.aim, power: state.power, curve: state.curve })) { feedback(); hud(); }
}
function finish() {
  state.ended = true; state.phase = 'ended'; state.phaseTime = 0;
  const title = state.mode === 'match' ? state.goals > state.opponent ? 'Gewonnen!' : state.goals === state.opponent ? 'Gelijkspel.' : 'Volgende keer beter.' : 'Goed getraind.';
  feedback('SESSIE AFGEROND', title, `${state.goals} doelpunten · ${state.score} punten — speel opnieuw voor een nieuwe ronde`); hud();
}
function resolve(event) {
  const s = state.shot;
  if (event.result === 'goal') {
    const corner = event.corner, pts = event.points;
    profile.coins += event.coins; profile.best = Math.max(profile.best, state.score); save();
    feedback(corner ? 'BOVENHOEK · PERFECT' : 'GOED GESCHOTEN', 'GOOOAL!', `+${pts} punten   ·   +25 munten`); sound('goal');
  } else {
    const labels = { saved: ['Gered.', 'De keeper was je voor. Probeer een hoek met meer kracht.'], wide: ['Net naast.', 'Houd je eindpunt binnen de palen en onder de lat.'], post: ['Op het hout!', 'Een paar centimeter maakt het verschil.'], blocked: ['Geblokkeerd.', 'Richt naast de muur of krul de bal eromheen.'] };
    const [title, detail] = labels[s.result] || labels.wide; feedback('NIEUWE KANS', title, detail); sound('miss');
  }
  hud();
}
function tick(dt) {
  for (const event of advance(state, dt)) {
    if (event.type === 'contact') sound('kick');
    if (event.type === 'result') resolve(event);
    if (event.type === 'reset') { world?.reset(); feedback(); hud(); }
    if (event.type === 'finished') finish();
  }
}
$('#shoot').addEventListener('click', shoot); $('#restart').addEventListener('click', () => reset());
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => reset(b.dataset.mode)));
$('#power').addEventListener('input', e => { state.power = +e.target.value / 100; $('#power-value').innerHTML = `${e.target.value}<span>%</span>`; });
$('#curve').addEventListener('input', e => { state.curve = +e.target.value / 100; $('#curve-value').textContent = state.curve === 0 ? 'RECHT' : `${Math.abs(+e.target.value)}% ${state.curve < 0 ? 'LINKS' : 'RECHTS'}`; });
$('#fps').addEventListener('change', e => { state.fps = +e.target.value; });
function aim(direction) {
  if (state.phase !== 'ready' || state.paused) return;
  if (direction === 'left') state.aim.x -= 0.2; if (direction === 'right') state.aim.x += 0.2;
  if (direction === 'up') state.aim.y += 0.15; if (direction === 'down') state.aim.y -= 0.15;
  state.aim.x = Math.max(-4.5, Math.min(4.5, state.aim.x)); state.aim.y = Math.max(0.3, Math.min(3.2, state.aim.y));
}
document.querySelectorAll('[data-aim]').forEach(b => b.addEventListener('click', () => aim(b.dataset.aim)));
$('#pitch')?.addEventListener('pointerdown', e => {
  if (state.phase !== 'ready' || state.paused || state.ended) return;
  const p = world?.pick(e.clientX, e.clientY); if (p) Object.assign(state.aim, p);
});
function pause(value = !state.paused) { state.paused = value; $('.pause-layer').hidden = !value; $('#pause').setAttribute('aria-label', value ? 'Hervatten' : 'Pauzeren'); hud(); }
$('#pause').addEventListener('click', () => { if (replay.active) closeReplay(); pause(); }); $('#resume').addEventListener('click', () => pause(false));
$('#mute').addEventListener('click', () => { state.muted = !state.muted; $('#mute').textContent = state.muted ? '♪̸' : '♪'; $('#mute').setAttribute('aria-label', state.muted ? 'Geluid inschakelen' : 'Geluid uitschakelen'); });
document.addEventListener('keydown', e => {
  if ($('dialog[open]')) return;
  if (e.key.toLowerCase() === 'p') { if (replay.active) closeReplay(); pause(); return; }
  if (e.key === 'Escape' && replay.active) { closeReplay(); return; }
  if (e.target.matches('input, select, button')) return;
  if (e.code === 'Space') { e.preventDefault(); shoot(); }
  const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
  if (dir) { e.preventDefault(); aim(dir); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });
let shopCategory = 'kit'; let pausedBeforeDialog = false;
function shopRender() {
  $('#shop-balance').textContent = profile.coins.toLocaleString('nl-NL');
  $('#shop-items').innerHTML = CATALOG.filter(i => i.category === shopCategory).map(i => {
    const owned = profile.owned.includes(i.id), equipped = profile[i.category] === i.id;
    return `<article class="shop-card"><div class="item-art ${i.category}" style="--item:${i.color}"><span>${i.category === 'ball' ? '⚽' : i.id === 'pirate' ? '♠' : i.id === 'samurai' ? '⚔' : i.id === 'bunny' ? '♧' : '10'}</span></div><div class="item-content"><h3>${i.name}</h3><p>${i.detail}</p><button data-buy="${i.id}" ${equipped ? 'disabled' : ''}>${equipped ? '✓ Uitgerust' : owned ? 'Uitrusten' : `✦ ${i.price} · Kopen`}</button></div></article>`;
  }).join('');
  document.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
    const r = purchase(profile, b.dataset.buy); $('#shop-message').textContent = r.ok ? `${CATALOG.find(i => i.id === b.dataset.buy).name} is uitgerust.` : r.reason;
    if (r.ok) { save(); setAppearance(); hud(); shopRender(); }
  }));
}
function openDialog(id) {
  if (replay.active) closeReplay();
  pausedBeforeDialog = state.paused; state.paused = true;
  if (id === 'shop') { shopRender(); $('#shop-message').textContent = storageWarning ? 'Lokale opslag is niet beschikbaar. Je voortgang blijft alleen deze sessie bewaard.' : ''; }
  $(`#${id}`).showModal(); hud();
}
['shop-nav', 'locker-cta'].forEach(id => $(`#${id}`).addEventListener('click', () => openDialog('shop')));
$('#help-button').addEventListener('click', () => openDialog('help'));
$('#play-nav').addEventListener('click', () => $('#pitch')?.focus()); $('.brand').addEventListener('click', e => { e.preventDefault(); reset(); });
document.querySelectorAll('dialog').forEach(d => {
  d.querySelector('.close').addEventListener('click', () => d.close());
  d.addEventListener('close', () => { state.paused = pausedBeforeDialog; hud(); });
});
document.querySelectorAll('[data-category]').forEach(b => b.addEventListener('click', () => {
  shopCategory = b.dataset.category; document.querySelectorAll('[data-category]').forEach(c => c.classList.toggle('selected', c === b)); shopRender();
}));
let replayFeedbackVisible = false;
function replayHud() {
  if (!replay.data) return;
  $('#replay-position').value = replay.index;
  $('#replay-time').textContent = `${replay.index} / ${replay.data.frames.length - 1} · ${replay.data.frames[replay.index].time.toFixed(3)} s`;
  $('#replay-play').textContent = replay.playing ? 'Pauzeren' : 'Afspelen';
  $('#replay-prev').disabled = replay.index === 0;
  $('#replay-next').disabled = replay.index === replay.data.frames.length - 1;
}
function openReplay() {
  if (!state.lastReplay || replay.active) return;
  Object.assign(replay, { active: true, index: 0, playing: false, elapsed: 0, data: state.lastReplay, wasPaused: state.paused });
  state.paused = true; replayFeedbackVisible = $('.feedback').classList.contains('visible'); $('.feedback').classList.remove('visible');
  $('.replay-controls').hidden = false; $('.pause-layer').hidden = true;
  $('#replay-position').max = replay.data.frames.length - 1; world?.reset(); replayHud(); hud(); $('#replay-next').focus();
}
function closeReplay() {
  if (!replay.active) return;
  replay.active = false; replay.playing = false; state.paused = replay.wasPaused;
  $('.replay-controls').hidden = true; $('.pause-layer').hidden = !state.paused;
  $('.feedback').classList.toggle('visible', replayFeedbackVisible); world?.reset(); hud();
}
$('#replay-open').addEventListener('click', openReplay); $('#replay-close').addEventListener('click', closeReplay);
function seekReplay(index) { replay.index = Math.max(0, Math.min(replay.data.frames.length - 1, index)); replay.playing = false; replayHud(); }
$('#replay-prev').addEventListener('click', () => seekReplay(replay.index - 1));
$('#replay-next').addEventListener('click', () => seekReplay(replay.index + 1));
$('#replay-position').addEventListener('input', e => seekReplay(+e.target.value));
$('#replay-speed').addEventListener('change', e => { replay.speed = +e.target.value; });
$('#replay-play').addEventListener('click', () => { if (replay.index >= replay.data.frames.length - 1) replay.index = 0; replay.playing = !replay.playing; replay.elapsed = 0; replayHud(); });
$('#replay-export').addEventListener('click', () => {
  if (!replay.data) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(replay.data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `freekick-${replay.data.mode}-shot.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
let last = performance.now(), accumulator = 0, lastRender = 0, lastHud = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = Math.min(0.1, (now - last) / 1000); last = now;
  if (!state.paused && !state.ended) {
    accumulator += elapsed;
    while (accumulator >= DT) { tick(DT); accumulator -= DT; }
  } else accumulator = 0;
  if (replay.active && replay.playing) {
    replay.elapsed += elapsed * replay.speed;
    const steps = Math.floor(replay.elapsed * replay.data.sampleRate);
    if (steps > 0) { replay.elapsed -= steps / replay.data.sampleRate; replay.index = Math.min(replay.data.frames.length - 1, replay.index + steps); if (replay.index === replay.data.frames.length - 1) replay.playing = false; replayHud(); }
  }
  if (now - lastHud > 100) { hud(); lastHud = now; }
  if (now - lastRender >= 1000 / state.fps - 0.5) {
    world?.update(replay.active ? { ...state, mode: replay.data.mode, phase: 'replay', shot: replayFrame(replay.data, replay.index), phaseTime: 0 } : state);
    world?.render(); lastRender = now;
  }
}
reset(); requestAnimationFrame(frame);
