# Freekick Battle — reconstructie op basis van de ontvangen video

De standaardpagina is nu de speelbare 3D-reconstructie van de Training-opname. De 13 ZIP-delen zijn volledig samengevoegd en hun gezamenlijke SHA-256 klopt met het aangeleverde manifest. Alle **26.975 frames** zijn technisch geïndexeerd. Overzichtsplaten over de hele video, dichte schotreeksen en native detailbeelden zijn visueel onderzocht.

**Dit is geen pixelidentieke kopie.** De interface gebruikt gedocumenteerde uitsneden uit de aangeleverde video; de 3D-modellen, balphysics, poses, camera en geluiden zijn zelfstandig gemaakt. De opname opent de oorspronkelijke shop niet. Extra ontwerpen, prijzen, sommige bonusregels en Arcade/Match-details zijn eigen keuzes. Online PvP ontbreekt. Zie [het volledige analyse- en afwijkingenverslag](docs/VIDEOANALYSE.md).

## Meteen spelen

De oplevering bevat `artifacts/Freekick-Battle.html`: een zelfstandig spelbestand dat je lokaal in Chrome, Edge of Safari kunt openen. Het heeft geen installatie of internetverbinding nodig. De volledige referentievideo en onderzoekstools staan apart in de ontwikkelversie.

## Ontwikkelversie starten

Node.js 22.12+ (hier getest met Node 24):

```sh
npm ci --no-audit --no-fund
npm run dev -- --port 5173
```

Open `http://localhost:5173`. De server luistert ook op andere netwerkinterfaces. Voor gewoon spelen is Python/ffmpeg niet nodig; die zijn nodig voor aanvullende videoanalyse en de volledige ontwikkeltests.

Routes:

| Route | Inhoud |
| --- | --- |
| `/` | De nieuwe videogebaseerde game |
| `/review.html` | Volledige ontvangen video, tijdlijn en onderzochte controlebeelden |
| `/reference.html` | Doorzoekbare bron-, functie-, catalogus- en validatiedatabase |
| `/analyze.html` | Extra video importeren/analyseren |
| `/lab.html` | Eerder physicslaboratorium; eigen proefregels, apart van de videogame |

## Spelen

1. **START → TRAINING → Stage 1.** Een ster ontgrendelt de volgende stage.
2. Richt met de groene pijlen, de pijltjestoetsen of door op het doel te klikken/tikken.
3. Tik op de grote voetbal rechtsonder of druk **spatie**. De krachtmeter gaat lopen.
4. Tik of druk nogmaals om de kracht vast te zetten en te schieten. Sleep op de grote bal om effect en hoogte te kiezen.
5. **Drie missers** beëindigen Training. Doelpunten behouden je levens. Bonussen leveren punten op; de ranglijst kent sterren en gold toe.
6. In stages 6 en 7 kun je **PASS** kiezen. Na de voorzet tik je op de bal wanneer de timingringen samenvallen: een geslaagde timing start een omhaal; een te vroege of ontbrekende tap kost een leven.
7. **SKIP** versnelt de resultaatfase. **P** of de pauzeknop pauzeert. REPLAY in het pauzemenu bekijkt het laatste schot in eigen simulatiestappen.
8. SHOP bevat 25 keuzes in acht categorieën: outfits, ballen, haar, schoenen, broeken, brillen, huidskleur en geslacht. Wisselen van geslacht is gratis; twee schoenontwerpen voegen lokaal 3% of 6% schotkracht toe. Die statwaarden zijn eigen keuzes. Kopen/uitrusten en voortgang worden lokaal bewaard. De catalogus en prijzen zijn als reconstructiekeuzes gemarkeerd.

Arcade gaat door tot drie missers en verhoogt de stage na elke drie goals. Match is een lokale wedstrijd van 60 seconden tegen een rivaal met gesimuleerde schoten. Dit zijn aanvullende spelmodi, geen gevalideerde kopieën van ongeziene originele modi. Er zijn geen accounts of betalingen. Energie/premium in het menu zijn visuele reconstructies; er geldt geen energielimiet.

Profielsleutel: `freekick-reference-profile-v2`. Het eerdere labprofiel blijft apart behouden. Bij ontbrekende lokale opslag werkt het spel verder in het geheugen.

## Framerate en bron

De opname is **1920×1080, 900,168 seconden, 30000/1001 ≈ 29,97003 fps**. De interne framerate van de oorspronkelijke game is onbekend. Onze physics gebruikt vaste stappen van 1/120 seconde; OPTION biedt renderbovengrenzen van 30/60/120 fps. Werkelijke prestaties hangen af van de hardware. Zeer lange frame-intervallen worden begrensd; bij zware belasting kan de simulatie achterlopen op de wandklok.

Het originele bestand staat lokaal in `research/original/training.mp4` en blijft buiten Git en het spelpakket. Het wordt via een alleen-lezen endpoint met byte-range-ondersteuning afgespeeld. Een installatie zonder dat bestand toont nog steeds de inbegrepen controlebeelden.

## Verificatie en database

```sh
npm test
npm run database
npm run build
npm run validate
node scripts/package-game.mjs
```

De volledige validatie gebruikt Python 3, ffmpeg/ffprobe, Playwright en Chromium. Standaard browserpad: `/usr/bin/chromium`; overschrijven met `CHROMIUM_PATH`. Voor de opname wordt de geïnstalleerde ffmpeg via een projectlokale Playwright-cache gebruikt (`FFMPEG_PATH` kan het pad wijzigen). Screenshots, logboeken en opnamen staan in `test-results/`.

De database bevat 26.975 technische framerecords, 19 expliciete visuele controlepunten, acht stages, twaalf bronuitsneden, tekstbronnen, de lokale catalogus en testuitkomsten. Een technische framedecode is geen handmatige inhoudelijke beoordeling. De volledige frame-index zit in SQLite en `data/frame-index.json`; de browserlaadbare export bevat alleen de samenvatting.

## Belangrijkste bestanden

- [Uitgevoerde professionele bouwprompt](docs/VIDEOBOUWPROMPT.md).
- [Actuele analyse, tijdlijn, meetpunten en resterende afwijkingen](docs/VIDEOANALYSE.md).
- `src/battle.js`, `battle-engine.js`, `battle-world.js`, `battle.css`: standaardgame, regels, 3D en interface.
- `data/battle-catalog.json`: daadwerkelijk gebruikte nieuwe winkelcatalogus; `data/catalog.json` hoort bij het aparte lab.
- `data/video-analysis.json`, `reference-assets.json`, `frame-index.json`: brongebonden analyse.
- `data/references.sqlite`, `reference-index.json`, `validation.json`: database, export en daadwerkelijke laatste validatie.
- `scripts/reassemble-video.py`, `index-reference-video.py`, `extract-reference-assets.py`, `generate-video-analysis.py`: reproduceerbare bronverwerking.

Oudere verslagen zoals `TOEGANGSRESULTATEN.md` beschrijven eerdere pogingen vóór de succesvolle ZIP-aanlevering. Hun toenmalige conclusie ‘video niet bekeken’ geldt niet voor deze versie. Er is niets gepubliceerd of gepusht.
