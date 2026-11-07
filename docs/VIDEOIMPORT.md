# De originele video rechtstreeks importeren

De app heeft nu een eigen bestandskiezer. Deze gebruikt niet de chatbijlage-downloadtool en heeft geen Files-paneel van Codex nodig.

## In de draaiende app

1. Open de referentiedatabase van de app, op de route `/reference.html`.
2. Klik bovenaan op **Video importeren**. Dit opent `/analyze.html` op dezelfde server.
3. Klik op **Kies je referentievideo** en selecteer de originele MP4 op je eigen apparaat.
4. Klik op **Video naar de werkmap versturen**.
5. Wacht op **Volledig opgeslagen**. Het overzicht van de hele video wordt vervolgens automatisch uitgepakt.
6. Kies een begin en een duur van maximaal 10 seconden voor **Alle frames van dit fragment**. Gebruik daarna Vorig frame, Volgend frame of de tijdlijn.

De invoer is een gewone bestandskiezer binnen onze app, niet een uploadknop in de cloudomgevingsinstellingen. De browser kan de gekozen video meteen lokaal afspelen. Alleen na het klikken op versturen gaat hij naar de ontwikkelserver van dit project.

## Server starten

De service draait bij `npm run dev` en `npm run preview`, op dezelfde poort als de app. Een statische host die uitsluitend `dist/` serveert heeft deze Node-service niet. De pagina meldt zelf wanneer de service ontbreekt.

```sh
cd /workspace/freekickbattle
npm run dev -- --port 5173
```

Dit document veronderstelt toegang tot de draaiende app. Het doet geen uitspraak over welke previewknoppen de chatinterface aanbiedt. De bereikbaarheid via een externe platformpreview is niet apart geverifieerd; de browser- en HTTP-tests zijn tegen de lokale ontwikkelserver uitgevoerd.

## Limieten en integriteit

- Maximaal **1 GiB per bestand** via deze projectservice; dit is geen algemene platformlimiet.
- Elk HTTP-deel is maximaal **4 MiB**. De browser en server vergelijken een SHA-256-checksum.
- Ontvangen delen mogen veilig opnieuw worden verstuurd. Op dezelfde open pagina kan een onderbroken verzending met dezelfde knop worden vervolgd.
- Samenvoeging controleert alle opgeslagen delen en de totale grootte. De uiteindelijke bestandshash wordt bewaard.
- Voor de tijdelijke delen en het samengevoegde bestand moet voldoende vrije schijfruimte beschikbaar zijn. Anders weigert de service de import.
- Het origineel wordt opgeslagen onder `research/imports/<id>/source.<ext>`. Analyses staan in aparte submappen per job; eerdere uitvoer wordt niet overschreven.
- `research/imports/` is uitgesloten van Git en van de ontwikkelserver-watcher. Een import publiceert of pusht niets.

## Framekwaliteit en database

Het overzicht gebruikt JPEG-voorbeelden van maximaal 960 pixels breed zonder kleine bronnen op te schalen. Een frame-voor-framefragment bewaart de geselecteerde native frames als **PNG op oorspronkelijke resolutie**. De selectie verandert de framerate of frame-indexen niet. Het manifest bevat de oorspronkelijke timestamps, dimensies, bronhash en hashes van de uitgepakte frames.

Bij een geslaagde referentieanalyse wordt de SQLite-index automatisch vernieuwd. Het bestand en de frames worden geregistreerd als **geïmporteerd, niet beoordeeld**. Extractie is geen bewijs van een inhoudelijke vergelijking met het spel. Synthetische testfixtures worden niet aan de echte referentiedatabase toegevoegd.

## Wat daadwerkelijk is getest

Een geldige synthetische MP4 van ruim 36 MiB is zowel via de HTTP-service als via de browser in delen ontvangen en correct samengevoegd. De browserpreview, het overzicht, native frames 6 tot en met 11 binnen een gekozen fragment, navigatie, tijdlijn en manifestdownload werkten. In een geïsoleerde database zijn zes frames met correcte indexen/timestamps geregistreerd, met visuele beoordeling op nul. Desktop en mobiel zijn gecontroleerd. Dit bewijst de importfunctie; het is geen analyse van de originele Freekick Battle-video.
