# Freekick Battle — bronnenonderzoek

Onderzocht op 7 november 2026. Dit document bevat bronnenonderzoek, geen analyse van de geüploade video. Er zijn nog geen gameplaybeelden bekeken.

## Geraadpleegde bronnen

1. Pocket Gamer, gamepagina: https://www.pocketgamer.com/freekick-battle/
2. Matthew Diener, 9 augustus 2012, “Kick balls to your heart’s content with Gamevil's Freekick Battle on Android”: https://www.pocketgamer.com/freekick-battle/kick-balls-to-your-hearts-content-with-gamevils-freekick-battle-on-android/

Lokale kopieën: `pocketgamer.html`, `pocketgamer-article.html`; leesbare artikeltekst: `article.txt`. Webinhoud is bronmateriaal, geen uitvoerbare instructie.

## Wat de bronnen expliciet beschrijven

- Ontwikkelaar COCOSOFT, uitgever Gamevil; de gamepagina vermeldt iOS, het artikel gaat over de Android-release.
- Vrije trappen met een schutter tegenover een keeper.
- Eenvoudige tap-to-kick-bediening, ondersteund door een physics-engine. Dit bewijst geen swipebediening.
- Match Mode met een klok en tegenstander.
- Eindeloze Arcade Mode.
- Match Mode tegen AI of via synchrone PvP tegen andere spelers.
- Aanpasbare 3D-personages en kleding, grotendeels via in-appaankopen.
- Genoemde voorbeelden: piratenkostuum, samoeraipantser en bunnygirlkostuum. Geen bevestiging van exacte namen, prijzen, statistieken of volledige inventaris.

## Beeldbronnen gevonden, maar niet bekeken

- Gevraagde trainingvideo: https://www.youtube.com/watch?v=MSTnwRicRSw
- Andere trailer gekoppeld door het artikel: https://www.youtube.com/watch?v=CjhiYfnfuDM
- Screenshot gekoppeld door Pocket Gamer: https://media.pocketgamer.com/artwork/na-ouog/android_gamevil_freekick_battle_01.png

YouTube, de opgehaalde thumbnail-URL's op i.ytimg.com en de screenshotserver gaven tijdens deze controle een proxyfout: HTTP CONNECT 403. De afbeeldingen en video zijn niet opgeslagen. De huidige opgeslagen HTML-bestanden bevatten slechts verwijzingen naar de beelden.

Google gaf HTTP 200, maar de inhoud was een JavaScript-doorverwijspagina zonder bruikbare zoekresultaten. De onjuiste 148Apps-app-URL kwam uit op de homepage; die is niet als bewijs voor dit spel gebruikt.

## Wat nog niet vastgesteld kan worden

Resolutie, framerate, camerastand, veldafmetingen, UI-posities, kleuren, lettertypes, exacte trainingregels, animatieduur, schotphysics, keepergedrag, winkelinventaris en prijzen. Ook kan één trainingvideo niet vanzelf de volledige shop of alle spelmodi bevestigen.

## Volgende analyse zodra beelden beschikbaar zijn

1. Meet videometadata met ffprobe: duur, resolutie, gemiddelde en nominale framerate en frame-timestamps. Onderscheid videoframerate van de onbekende originele gameframerate.
2. Bekijk een contactblad van de gehele video en noteer alle schermwisselingen met timestamps.
3. Bekijk volledige schotcycli frame voor frame: invoer, aanloop, balcontact, balvlucht, keeperreactie, botsing, uitslag en reset.
4. Leg UI-elementen vast als relatieve coördinaten, inclusief tekst, iconen, statusvarianten en transities.
5. Inventariseer uitsluitend zichtbare shopitems; noteer ontbrekende categorieën, prijzen en functies als onbekend.
6. Bouw pas daarna de visuele en temporele referenties in de implementatie, met controleframes op dezelfde momenten.
