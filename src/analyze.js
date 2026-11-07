import './reference.css';
import './analyze.css';
const $ = s => document.querySelector(s);
const api = '/api/video-import';
let file, upload, currentJob, selectedFrame = 0, previewURL, busy = false;
$('#analysis').innerHTML = `<header><a href="/">← Terug naar het spel</a><a href="/reference.html">Referentiedatabase →</a></header><main><div class="intro"><div><p class="eyebrow">DE VOLLEDIGE VIDEO. RECHTSTREEKS NAAR DE WERKMAP.</p><h1>Van video naar bewijs<span>.</span></h1><p>Kies je originele MP4. Deze pagina verstuurt het bestand in kleine delen en bewaart het in de ontwikkelomgeving. Daarna kun je native frames met echte tijdstippen onderzoeken.</p></div></div><div class="notice" id="service-status">Importservice controleren…</div><section class="import-layout"><div><label class="file-drop" for="video-file"><span class="upload-symbol"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/></svg></span><strong>Kies je referentievideo</strong><span>MP4, MOV, M4V of WebM · maximaal 1 GiB via deze importfunctie</span><input id="video-file" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.m4v,.mov,.webm"/></label><p id="file-detail">Er is nog geen bestand gekozen.</p><video id="video-preview" controls preload="metadata" hidden></video><button id="upload-button" disabled>Video naar de werkmap versturen</button><progress id="upload-progress" max="1" value="0" aria-label="Uploadvoortgang"></progress><p id="upload-status" role="status" aria-live="polite"></p><p class="privacy-note">Je bestand gaat naar deze ontwikkelomgeving, niet naar een externe videoservice. Deze route gebruikt de downloadtool voor chatbijlagen niet. De 1 GiB-grens is een keuze van deze importfunctie; de beschikbare opslagruimte kan lager zijn.</p></div><aside class="analysis-steps"><span class="eyebrow">ZO WERKT HET</span><h2>Een bestand.<br>Geen knipwerk.</h2><ol><li><b>Kies het origineel.</b><span>Je hoeft je video niet te verkleinen.</span></li><li><b>Verstuur in delen.</b><span>Elk deel is maximaal 4 MiB en wordt op checksum gecontroleerd.</span></li><li><b>Bekijk de frames.</b><span>Eerst een overzicht, daarna alle frames van een gekozen fragment.</span></li></ol><p>Videoframerate is niet automatisch de framerate van het oorspronkelijke spel. Een uitgepakt frame is pas visueel geverifieerd nadat het daadwerkelijk is bekeken.</p></aside></section><section id="analysis-panel" hidden><div class="analysis-toolbar"><div><span class="eyebrow">ONDERZOEK HET ORIGINEEL</span><h2>Frames met tijdstippen.</h2></div><button id="overview-button">Overzicht van hele video</button></div><div class="segment-form"><label>Begin (seconden)<input id="segment-start" type="number" value="0" min="0" step="0.1"/></label><label>Duur (max. 10 seconden)<input id="segment-duration" type="number" value="3" min="0.1" max="10" step="0.1"/></label><button id="segment-button">Alle frames van dit fragment</button></div><p id="analysis-status" role="status" aria-live="polite"></p><div id="video-metadata"></div><div id="frame-viewer" hidden><div class="frame-stage"><img id="current-frame" alt="Geselecteerd frame uit de geïmporteerde video"/></div><div class="frame-toolbar"><button id="frame-prev">← Vorig frame</button><input id="frame-position" type="range" min="0" max="0" value="0" aria-label="Videoframe"/><button id="frame-next">Volgend frame →</button></div><p id="frame-caption"></p><div id="contact-sheet"></div><button id="manifest-export">Bewaar meetmanifest</button></div></section></main>`;
async function request(path, options = {}) {
  const r = await fetch(api + path, { ...options, headers: { ...(options.body instanceof Blob ? {} : { 'Content-Type': 'application/json' }), 'x-freekick-import': '1', ...options.headers } });
  let data; try { data = await r.json(); } catch { throw new Error('De importservice is niet beschikbaar. Start deze omgeving met npm run dev of npm run preview.'); }
  if (!r.ok) throw new Error(data.error || `Importfout (${r.status})`); return data;
}
function uploadState(message) { $('#upload-status').textContent = message; }
function analysisState(message) { $('#analysis-status').textContent = message; }
function setBusy(value) { busy = value; $('#upload-button').disabled = value || !file || Boolean(upload?.completed); $('#video-file').disabled = value; $('#overview-button').disabled = value || !upload?.completed; $('#segment-button').disabled = value || !upload?.completed; }
async function checkService() {
  try { const s = await request(''); $('#service-status').textContent = `Importservice actief · maximaal ${Math.round(s.maxFileBytes / 1024 ** 2)} MiB per bestand · delen van ${s.chunkBytes / 1024 ** 2} MiB`; return true; }
  catch (e) { $('#service-status').textContent = e.message; $('#upload-button').disabled = true; return false; }
}
const serviceAvailable = await checkService();
$('#video-file').addEventListener('change', () => {
  file = $('#video-file').files[0]; upload = null; currentJob = null;
  $('#analysis-panel').hidden = true; $('#frame-viewer').hidden = true; $('#upload-progress').value = 0; uploadState('');
  if (previewURL) URL.revokeObjectURL(previewURL);
  $('#video-preview').hidden = !file;
  if (file) { previewURL = URL.createObjectURL(file); $('#video-preview').src = previewURL; $('#file-detail').textContent = `${file.name} · ${(file.size / 1024 ** 2).toFixed(1)} MiB`; }
  $('#upload-button').disabled = !file || !serviceAvailable;
});
$('#upload-button').addEventListener('click', async () => {
  if (!file || busy) return;
  setBusy(true);
  try {
    if (!crypto.subtle) throw new Error('Open deze pagina via HTTPS of localhost voor checksumcontrole.');
    if (!upload) upload = await request('', { method: 'POST', body: JSON.stringify({ fileName: file.name, size: file.size }) });
    for (let index = upload.receivedChunks; index < upload.chunkCount; index++) {
      const chunk = file.slice(index * upload.chunkBytes, Math.min(file.size, (index + 1) * upload.chunkBytes));
      const digest = await crypto.subtle.digest('SHA-256', await chunk.arrayBuffer());
      const hash = [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, '0')).join('');
      uploadState(`Deel ${index + 1} van ${upload.chunkCount} versturen…`);
      upload = await request(`/${upload.id}/chunks/${index}`, { method: 'POST', body: chunk, headers: { 'x-chunk-sha256': hash, 'Content-Type': 'application/octet-stream' } });
      $('#upload-progress').value = upload.receivedBytes / file.size;
    }
    uploadState('Alle delen ontvangen. Bestand samenvoegen en controleren…');
    upload = await request(`/${upload.id}/complete`, { method: 'POST', body: '{}' });
    uploadState(`Volledig opgeslagen: ${upload.fileName}. SHA-256: ${upload.sha256}`); $('#analysis-panel').hidden = false;
    setBusy(false); await analyze(false);
  } catch (e) { uploadState(`${e.message} Je kunt opnieuw op versturen klikken om verder te gaan.`); }
  finally { setBusy(false); }
});
async function analyze(everyFrame) {
  if (!upload?.completed || busy) return;
  const start = everyFrame ? Number($('#segment-start').value) : 0, duration = everyFrame ? Number($('#segment-duration').value) : null;
  if (!Number.isFinite(start) || start < 0 || everyFrame && (!Number.isFinite(duration) || duration <= 0 || duration > 10)) { analysisState('Kies een geldig begin en een duur tussen 0 en 10 seconden.'); return; }
  setBusy(true); $('#frame-viewer').hidden = true; analysisState(everyFrame ? 'Alle native frames van het fragment uitpakken…' : 'Overzicht van de hele video uitpakken…');
  try {
    upload = await request(`/${upload.id}/analyze`, { method: 'POST', body: JSON.stringify({ start, duration, everyFrame }) });
    const jobId = upload.jobs.at(-1).id;
    for (;;) {
      await new Promise(resolve => setTimeout(resolve, 750)); upload = await request(`/${upload.id}`);
      const job = upload.jobs.find(j => j.id === jobId);
      if (job.status === 'failed') throw new Error(job.error);
      if (job.status === 'complete' && job.indexStatus !== 'pending') break;
    }
    const manifest = await request(`/${upload.id}/jobs/${jobId}`); currentJob = { id: jobId, manifest }; selectedFrame = 0;
    const stream = manifest.metadata.streams[0];
    $('#video-metadata').textContent = `${stream.width} × ${stream.height} · ${manifest.averageVideoFPS ?? 'onbekend'} videoframes/s · ${manifest.selectedFrames.length} uitgepakte frames · originele gameframerate onbekend`;
    $('#frame-position').max = manifest.selectedFrames.length - 1; $('#frame-viewer').hidden = false;
    $('#contact-sheet').replaceChildren();
    manifest.selectedFrames.forEach((f, i) => { const button = document.createElement('button'); const img = document.createElement('img'); img.src = `${api}/${upload.id}/jobs/${jobId}/${f.path}`; img.loading = 'lazy'; img.alt = `Frame ${f.frameIndex} op ${f.timestampSeconds.toFixed(3)} seconden`; const caption = document.createElement('span'); caption.textContent = `${f.frameIndex} · ${f.timestampSeconds.toFixed(3)} s`; button.append(img, caption); button.addEventListener('click', () => showFrame(i)); $('#contact-sheet').append(button); });
    showFrame(0); analysisState('Analysebestanden staan in de werkmap. De beelden zijn nog niet automatisch inhoudelijk beoordeeld.');
  } catch (e) { analysisState(e.message); }
  finally { setBusy(false); }
}
function showFrame(index) {
  if (!currentJob) return;
  selectedFrame = Math.max(0, Math.min(currentJob.manifest.selectedFrames.length - 1, index));
  const f = currentJob.manifest.selectedFrames[selectedFrame]; $('#current-frame').src = `${api}/${upload.id}/jobs/${currentJob.id}/${f.path}`;
  $('#frame-position').value = selectedFrame; $('#frame-caption').textContent = `Oorspronkelijk frame ${f.frameIndex} · ${f.timestampSeconds.toFixed(6)} seconden · ${selectedFrame + 1} / ${currentJob.manifest.selectedFrames.length}`;
  $('#frame-prev').disabled = selectedFrame === 0; $('#frame-next').disabled = selectedFrame === currentJob.manifest.selectedFrames.length - 1;
}
$('#overview-button').addEventListener('click', () => analyze(false)); $('#segment-button').addEventListener('click', () => analyze(true));
$('#frame-prev').addEventListener('click', () => showFrame(selectedFrame - 1)); $('#frame-next').addEventListener('click', () => showFrame(selectedFrame + 1)); $('#frame-position').addEventListener('input', e => showFrame(+e.target.value));
$('#manifest-export').addEventListener('click', () => { if (!currentJob) return; const u = URL.createObjectURL(new Blob([JSON.stringify(currentJob.manifest, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = u; a.download = 'video-frame-manifest.json'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); });
