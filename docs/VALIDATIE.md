# Uitvoering en validatie

Dit is het verslag van de eerste bouwronde. Het actuele vervolgverslag met 21 tests, uitgebreide shopcontrole, database en replay staat in [VERVOLGRESULTATEN.md](VERVOLGRESULTATEN.md).

Datum: 7 november 2026.

## Opgeleverd

De opdracht staat in `BOUWPROMPT.md` en is uitgevoerd tot een speelbare lokale reconstructie met eigen assets: een 3D-stadion, richtmarkering, vaste-stap-balphysics, keeperreacties, schutteranimaties, geluiden, training, arcade, getimede wedstrijden tegen lokale AI, score/beloningen, pauze, cosmeticashop en opgeslagen voortgang. De shop bevat 5 zelfgemaakte tenues en 3 ballen. De renderlimiet is instelbaar op 30, 60 of 120 fps; de simulatiestap is 120 Hz.

## Uitgevoerde controles

- `npm test`: 7 tests geslaagd, 0 mislukt, 0 overgeslagen. Getest: hoekschot versus keeper, redding in het midden, uit/lat/paal/muur, kromming, onveranderlijke afgehandelde schoten, identieke physics bij 30/60/120 Hz rendercadans, eenmalige betaling, eigendom/uitrusting, onvoldoende saldo en profielvalidatie.
- `npm run build`: geslaagd. Three.js veroorzaakt een niet-blokkerende bundlegroottewaarschuwing; de totale JavaScriptbundel is ongeveer 514 kB, circa 134 kB gzip. Er is geen netwerk-CDN nodig tijdens het spelen.
- `npm run test:browser`: geslaagd in Chromium via Playwright. WebGL2-context aangemaakt; een schot via de zichtbare bediening werd een doelpunt en leverde punten/munten op; pauze blokkeerde schieten; een tenue werd gekocht en bleef na herladen uitgerust; een te dure aankoop werd geweigerd; de Match-klok liep en bleef tijdens pauze gelijk; Arcade/reset, de handleiding en mobiele schotbediening werkten. Geen JavaScript-pageerrors.
- Screenshots gemaakt en visueel bekeken: desktop, doelpunt, shop en mobiel. Mobiel viewport 390 × 844, desktop 1440 × 1040. Geen horizontale overflow op mobiel. Ontbrekende pijl/pauzeglyphs zijn vervangen door SVG-iconen en daarna is de browsertest opnieuw succesvol uitgevoerd.

De browsercontrole gebruikt softwarematige WebGL-rendering op de cloudmachine. Deze controle bewijst dat de game werkt, niet dat op ieder apparaat een stabiele 60 of 120 fps wordt gehaald. Werkelijke GPU-performance is niet gebenchmarkt. Geluiden zijn geïmplementeerd, maar niet auditief met de originele game vergeleken. Complete rondes en iedere combinatie van kleding/accessoires zijn niet afzonderlijk via de browser doorlopen.

## Referentieonderzoek en ontbrekend bewijs

De Pocket Gamer-gamepagina en het artikel van Matthew Diener van 9 augustus 2012 konden worden geraadpleegd. De gebruikte feiten en lokale bronkopieën staan onder `research/`.

De YouTube-video `MSTnwRicRSw` gaf bij de nieuwe controle nog een proxyfout (CONNECT 403). De eerder gevonden alternatieve trailer, screenshotserver en thumbnails waren evenmin beschikbaar bij de uitgevoerde controles. Er zijn geen oorspronkelijke videoframes geanalyseerd. Het aangeleverde chatbestand overschrijdt de limiet van de beschikbare bijlage-downloadtool. Dat beperkt bestandstoegang, niet de grootte van de gemaakte game.

Daarom zijn exacte camera, oorspronkelijke framerate, animatiecurves, volledige itemcatalogus/prijzen en pixelnauwkeurige UI niet vastgesteld. De huidige camera, geometrie, kleuren, timerwaarden, AI, beloningen en prijzen zijn eigen voorlopige keuzes. De beweging is fysisch gesimuleerd maar niet gekalibreerd op de referentievideo. Synchrone online PvP uit het artikel is niet gebouwd; Match gebruikt expliciet lokale AI.

## Wat nodig is voor de exacte vervolgstap

Zodra de referentiebeelden leesbaar zijn, voer de videoanalyse uit volgens `BOUWPROMPT.md`, leg tijdcodes en metingen vast en vervang de voorlopige keuzes. Gebruik vergelijkbare controleframes voor de camera/UI/animaties. Tot die vergelijking is afgerond mag deze versie niet als exacte kopie worden gepresenteerd.

Er is niets gepusht of gepubliceerd en tijdens deze bouwopdracht is de cloudconfiguratie niet gewijzigd. De ontwikkelserver is gestart op poort 5173; die moet in een volgende sessie opnieuw worden gestart.
