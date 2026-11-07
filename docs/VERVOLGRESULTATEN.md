# Vervolgresultaten — database, validatie en replay

Uitgevoerd op 7 november 2026 volgens `VERVOLGPROMPT.md`.

## Concrete oplevering

De bestaande lokale game is verder ontwikkeld. De rondecyclus staat in `src/session.js` en wordt door zowel de echte interface als de rondetests gebruikt. De shop gebruikt nu rechtstreeks de centrale catalogus in `data/catalog.json`. De animatie- en simulatieparameters staan in `data/animation-spec.json` en worden door physics, rondecyclus en 3D-animaties ingelezen.

Nieuw is een replay van de balvlucht van het laatste schot, met één opgenomen toestand per 1/120 seconde. De gebruiker kan per stap vooruit/terug, scrubben, vertraagd afspelen en als JSON downloaden. Replay bevriest de ronde en geeft geen extra munten of punten. Dit zijn opnamen van onze eigen simulatie, geen frames van de originele video en geen opname van de volledige aanloop.

De lokale AI simuleert nu daadwerkelijk schoten; een poging kan scoren of worden gered. Eerder werd automatisch iedere elf seconden een punt toegekend. Andere verbeteringen: schotinstellingen worden bij het inzetten vastgezet, pauze werkt ook bij knopfocus, audio start op balcontact, audiopromises worden afgehandeld, en de WebGL-foutmelding laat de overige interface intact. Een gerichte browsercontrole bevestigde dat de kleedkamer ook zonder WebGL toegankelijk blijft.

Schaduwen worden niet meer onnodig volledig herberekend op een stilstaande scène. Software-rendering gebruikt een kleinere schaduwkaart en begrensde pixeldichtheid. De op screenshots gevonden schaduwstrepen op het gras zijn verholpen. Het normale spel blijft hardware-afhankelijk; er is geen vaste werkelijke 60/120 fps gegarandeerd.

## Database

`data/references.sqlite` is reproduceerbaar met `npm run database`. De leesbare brondata en export staan ernaast. De database bevat:

| Onderdeel | Aantal | Betekenis |
|---|---:|---|
| Bronnen | 7 | Inclusief gelezen, geblokkeerde en niet-bekeken bronnen |
| Feiten/aannames | 12 | 6 tekstueel onderbouwd, 3 lokale keuzes, 3 onbekend |
| Shopitems | 8 | Alle huidige lokale items; originele namen/prijzen blijven onbekend |
| Functies | 33 | 30 gebouwd, online PvP niet gebouwd, 2 originele vergelijkingen geblokkeerd |
| Assetgroepen | 6 | Eigen assets en een onbereikbare externe beeldverwijzing |
| Timingparameters | 7 | Lokale waarden, geen originele metingen |
| Validatiegroepen | 5 | Database, tests, twee browsertests en productiebouw |
| Originele videoframes | 0 | Geen fictieve frames of metingen toegevoegd |

Tabellen bevatten stabiele sleutels, foreign keys en statussen. Opgeslagen bronbestanden hebben SHA-256-hashes. `PRAGMA integrity_check` en `foreign_key_check` slagen. De aparte pagina `reference.html` biedt tabellen, zoeken, filters en downloads van SQLite/JSON. Productiebouw neemt deze pagina en database mee.

## Uitgevoerde verificatie

`npm run validate` is succesvol afgerond. Alle vijf geregistreerde controles hebben exitcode 0; de uitkomsten staan in `data/validation.json` en de logs onder `test-results/validation/`.

- **21 tests geslaagd, 0 mislukt, 0 overgeslagen.** Getest zijn onder andere tien volledige trainingspogingen en de geblokkeerde elfde, vijf arcade-missers en levensbehoud bij een doelpunt, de wedstrijdklok, AI-resultaten, een laatste schot voor de eindtijd, pauze tijdens een vlucht, dubbele invoer, eenmalige beloningen, physics bij verschillende rendercadansen en extreme geldige invoerwaarden.
- **Alle 8 shopitems:** aankoop met exact voldoende saldo, onvoldoende saldo, opnieuw uitrusten zonder extra kosten en onafhankelijke tenue-/balcategorieën. De browsertest koopt alle items met een expliciet testprofiel van 5.000 munten en controleert het resterende saldo van 3.600.
- **Alle 15 tenue/bal-combinaties:** via de echte interface uitgerust en afzonderlijk gerenderd. De vijf tenues veranderen het beeld van de schutter. Eigendom en laatste uitrusting blijven na herladen behouden. De screenshots zijn van onze eigen game, niet van Google of het origineel.
- **Replay:** werkelijk schot via de interface, stap vooruit/terug, tijdlijn, afspeelsnelheid, JSON-download en onveranderd saldo/aantal pogingen. De ronde-enginecontrole bevestigt continue 120 Hz-samples en dat opgehaalde replaytoestanden de ronde niet kunnen wijzigen.
- **Desktop/mobiel:** WebGL-context, schieten, beloning, pauze, klok, Arcade/reset, handleiding, toetsenbord, alle FPS-opties, echte touch-events en replay zonder horizontale overflow.
- **Foutpaden:** beschadigde opgeslagen JSON, geweigerde localStorage en ontbrekend WebGL. Geen ongehanteerde JavaScript-pageerrors in de succesvolle browsertests.
- **Productiebouw:** geslaagd met aparte game-, referentie- en Three.js-bundels. De inconsistentie in JSON-importattributen is na de volledige suite gecorrigeerd; de productiebouw is daarna opnieuw succesvol uitgevoerd zonder die waarschuwing. De wijziging betrof uitsluitend equivalente importsyntax.

## Frame-extractie

`scripts/analyze-video.py` kan een bereikbaar lokaal videobestand uitlezen met ffprobe en native frames selecteren op oorspronkelijke index en timestamp. Een overzicht per twee seconden en volledige frame-reeksen binnen een tijdvenster worden ondersteund. Het manifest bevat videometadata en SHA-256-hashes, maar leidt geen originele gameframerate af uit de videoframerate.

Deze pipeline is getest met een synthetische 30 fps-testclip: het venster van 0,2 tot 0,4 seconde leverde precies zes native frames op, beginnend bij frame-index 6 op 0,2 seconde. Die fixture is uitsluitend testmateriaal en is niet als origineel bewijs in de database opgenomen.

## Beperkingen en externe blokkade

Pocket Gamer-tekstbronnen zijn daadwerkelijk gelezen. Google Afbeeldingen gaf via curl HTTP 200 maar alleen een JavaScript-doorverwijzing; dat telt niet als bekeken zoekresultaten. Chromium strandde op `ERR_CERT_AUTHORITY_INVALID`. YouTube en de Pocket Gamer-afbeeldingsserver gaven nog proxy-CONNECT 403. De trainingvideo, alternatieve trailer en originele screenshots zijn dus niet visueel vergeleken.

De automatische veiligheidscontrole heeft een poging geweigerd om de bestaande cloudproxy-CA aan Chromiums permanente gebruikerscertificaatopslag toe te voegen. Als reden werd genoemd dat dit het TLS-vertrouwen voor toekomstige browserverbindingen blijvend zou uitbreiden en daarvoor expliciete toestemming ontbreekt. De geweigerde wijziging is niet uitgevoerd; TLS-controle is niet uitgeschakeld. Een controle van de publieke certificaatmetadata bevestigde wel dat curl de reeds geïnstalleerde omgevings-CA gebruikt. Dat bewijst geen browsertoegang en geen toegang tot YouTube.

De volledige originele shop, animaties, camerastand en framerate blijven onbekend. De huidige versie is daarom technisch veel uitgebreider gevalideerd, maar geen bewezen exacte reproductie. De openstaande stap is het daadwerkelijk verkrijgen en bekijken van de referentiebeelden, gevolgd door kalibratie aan die beelden. Online PvP blijft niet geïmplementeerd.

Er is niets gepusht of gepubliceerd. De cloudconfiguratie is niet gewijzigd.
