# Brontoegang en directe video-import — resultaat

Uitgevoerd op 7 november 2026, na expliciete toestemming van de gebruiker om verder te gaan met de eerder besproken certificaatwijziging.

## Externe beelden

De bestaande omgevingsproxy-CA is opnieuw geregistreerd in Chromiums gebruikerscertificaatopslag. De officiële Chromium-documentatie is geraadpleegd. Binnen de commandsandbox bleef een certificaatfout optreden; buiten de sandbox werkte de browserverbinding met TLS-controle. Google Afbeeldingen toonde vervolgens een pagina voor ongebruikelijk verkeer/menselijke verificatie. Er zijn geen gamebeelden ontvangen. De pagina en screenshot zijn opgeslagen onder `research/raw/google-images-browser.*`; het bronregister vermeldt nu `robot_check` in plaats van alleen de eerdere certificaatfout.

De controle is niet omzeild en TLS-verificatie is niet uitgeschakeld. De eerder waargenomen YouTube-proxyweigering is niet opgelost door de browsercertificaatwijziging. Een werkende TLS-verbinding of een Google-controlepagina is geen bekeken gameplay.

## Werkende nieuwe ingang voor de oorspronkelijke video

De app heeft een eigen importpagina op `/analyze.html`, bereikbaar via **Video importeren** in de kop van de referentiedatabase. Dit is een echte bestandskiezer in de app; een uploadfunctie van het Codex-bestandenpaneel is niet nodig.

De Node-service ontvangt een bestand tot 1 GiB in delen van maximaal 4 MiB. Elk deel wordt tussen browser en server met SHA-256 gecontroleerd. Opgeslagen delen kunnen veilig opnieuw worden verstuurd. Samenvoegen controleert de onderdelen, totale grootte en eindhash. De service schrijft rechtstreeks in `research/imports/<id>/`, met een apart outputpad per analyse. Er wordt niets extern gepubliceerd.

Na de upload maakt de pagina automatisch een overzicht. Een gekozen fragment kan volledig per native frame worden uitgepakt, doorlopen en als manifest bewaard. Fragmentframes behouden hun oorspronkelijke pixelafmetingen en worden als PNG opgeslagen; overzichtsplaatjes gebruiken JPEG tot maximaal 960 pixels breed. Frame-indexen en timestamps blijven aan het bronbestand gekoppeld. Deze waarden worden niet als gameframerate of gemeten originele animatietiming gepresenteerd.

Na een geslaagde echte referentie-import wordt de SQLite-database automatisch opnieuw opgebouwd. De bron en frames blijven `imported_not_viewed`, met visuele beoordeling op nul. De service controleert checksums bij het indexeren. Testfixtures worden apart gehouden. De workflow en grenzen staan in `VIDEOIMPORT.md`.

## Validatie

- **23 tests geslaagd**, 0 mislukt en 0 overgeslagen.
- **Drie browsertests geslaagd**: de bestaande game, de uitgebreide shop/replay/foutpaden en de nieuwe video-import.
- Een geldige synthetische MP4 van ruim **36 MiB** is via de HTTP-service en via de browser in delen ontvangen. De limiet van de chatbijlage-tool is hierbij niet gebruikt.
- Verkeerde checksum, herhaalde delen, te vroege samenvoeging, een te groot bestand en een schrijfactie van een andere oorsprong zijn gecontroleerd. Correcte eindhash en behouden bronbestand zijn geverifieerd.
- Een fragment van 0,2 tot 0,4 seconde uit een synthetische 30 fps-clip leverde native frames 6–11 op, met PNG-uitvoer op de bronresolutie en correcte timestamps. Browserknoppen, tijdlijn en meetmanifest werkten.
- Automatische registratie van zes frames is getest in een geïsoleerde testdatabase. Deze testdata is verwijderd en niet in de echte bronverzameling terechtgekomen.
- Desktop en mobiel zijn gecontroleerd; screenshots staan onder `test-results/import-desktop.png` en `test-results/import-mobile.png`. Die screenshots tonen nadrukkelijk een synthetische testclip, niet Freekick Battle.
- De referentiepagina is na de laatste inventarisuitbreiding apart gecontroleerd: **42 functies**, waarvan 9 nieuwe importfuncties, plus een werkelijk gedownloade geldige SQLite-database.
- Productiebouw voor game, referentiedatabase en analysepagina slaagt. De service is actief bij Vite dev en preview; een losse statische host bevat geen Node-backend. Externe platformpreview-toegang is niet apart getest.

Na de volledige regressieronde zijn de 23 tests en de importbrowsertest opnieuw uitgevoerd voor de native-PNG-wijziging. `data/validation.json` bevat de volledige regressie-uitkomsten en deze aanvullende verificatie. De reeds gecontroleerde gamefuncties zijn door de laatste frame-exportwijziging niet aangepast.

## Wat nog ontbreekt voor de exacte reconstructie

Op het afrondmoment zijn **nul echte referentievideo's geïmporteerd en nul oorspronkelijke gameplayframes inhoudelijk bekeken**. Er is daarom geen nieuwe claim over exacte camera, UI, framerate, animaties of volledige originele shop gerechtvaardigd. De huidige game is niet alsnog als exacte kopie aangemerkt.

De onafhankelijke technische werkzaamheden zijn afgerond. De noodzakelijke externe stap is nu het eenmaal selecteren van de originele MP4 via de nieuwe importpagina. Zodra die in de werkmap staat, zijn daadwerkelijke frameanalyse en kalibratie mogelijk. Die stap kan niet namens de gebruiker worden uitgevoerd op een bestand dat alleen op diens apparaat staat en via de bestaande chatbijlage-tool niet bereikbaar is.

Er zijn geen wijzigingen gepusht of gepubliceerd en er zijn geen nieuwe netwerkinstellingen aangevraagd.
