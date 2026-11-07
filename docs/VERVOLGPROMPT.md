# Professionele vervolgopdracht: bronregister, volledige spelvalidatie en replay

## Doel

Werk de bestaande reconstructie verder af op basis van controleerbare referenties. Lever niet alleen een plan op: voer bronnenonderzoek uit, bouw een bevraagbare database, onderzoek fouten, verbeter de game en voer relevante tests uit. De primaire referentie is de door de gebruiker aangeleverde trainingvideo, met YouTube-ID `MSTnwRicRSw`. Raadpleeg Google Afbeeldingen, gepubliceerde screenshots en andere gameplayvideo's via de beschikbare toegestane netwerktoegang.

## Bewijs en database

Leg bronnen, netwerkresultaten, feiten, assets, catalogusitems, spelmechanieken, aannames en verificaties gestructureerd vast. Gebruik leesbare JSON-bestanden als bron en een reproduceerbaar gegenereerde SQLite-database als zoekbare afgeleide. Geef iedere rij een stabiele sleutel. Gebruik foreign keys, een schemaversie en integriteitscontroles.

Een bronvermelding bevat URL, titel, geraadpleegde datum, toegangstoestand, lokaal bestand indien aanwezig en SHA-256 van opgeslagen inhoud. Een feit verwijst naar de bron die het daadwerkelijk onderbouwt. Onderscheid `source_documented`, `visually_verified`, `implementation_choice` en `unknown`. Een gelinkte maar ongelezen afbeelding is geen visueel bewijs. Een HTTP 200 met alleen een JavaScript-doorverwijzing is geen geslaagde beeldzoekopdracht.

De itemdatabase bevat voor elk geïmplementeerd item categorie, lokale naam, kleur, prijs, eigendoms-/uitrustingsregels, herkomst van het ontwerp en eventueel de originele naam/prijs. Onbekende originele namen en prijzen moeten `null` blijven. Drie kostuumtypen worden tekstueel door Pocket Gamer genoemd; de exacte lokale vormgeving en prijzen zijn daarmee niet bewezen. Noem deze database geen complete originele spelcatalogus zolang die niet is waargenomen.

Sla geen credentials op. Handhaaf TLS-controle en netwerkbeleid. Gebruik geen omweg rond expliciet geweigerde toegang. Een niet-toegankelijke referentie blokkeert de bewijsclaim, maar niet de onafhankelijke technische verbeteringen.

## Volledige functionele validatie

Inventariseer de zichtbare functies en toets iedere functie aan een concrete verwachte uitkomst. Test niet alleen losse helpers: de daadwerkelijke spelcyclus moet aantoonbaar worden doorlopen.

- Shop: ieder item, iedere categorie, nieuwe aankoop, saldo exact genoeg, onvoldoende saldo, herhaald klikken, gratis opnieuw uitrusten, visuele uitrusting en ballen, herladen, ongeldige opgeslagen data, ontbrekende opslag en combinatie van alle cosmetica.
- Training: tien volledige pogingen, score/beloning, afronding, blokkeren van een elfde poging en opnieuw starten.
- Arcade: vijf missers beëindigen de ronde, doelpunten verbruiken geen leven, reset werkt.
- Match: klok, AI-tegenstander, muur, pauze, laatste schot voor de eindtijd, geen nieuw schot na de eindtijd, resultaat en herstart.
- Fysica: doelpunt, redding, uit, paal, lat, muur, stuiter, effect, lage/hoge kracht en identieke uitkomst bij verschillende renderfrequenties.
- Invoer: klikken/tikken, knoppen, toetsenbord, pauze met focus op een knop, dialogen, tabwisselingen en mobiel zonder horizontale overflow.
- Rendering: daadwerkelijke WebGL-context, zichtbare scène, uitrusting, canvasresizing, alle renderlimietopties en foutmelding als WebGL ontbreekt. Maak geen performanceclaim op basis van alleen een ingesteld FPS-getal.

Verplaats de rondecyclus naar een onafhankelijk testbare engine waar dat nodig is. Koppel de UI aan diezelfde engine; een losse nep-engine die alleen tests laat slagen is niet toegestaan. Geef geluid pas op daadwerkelijk balcontact en voorkom ongehanteerde audiopromises.

## Frame-voor-framewerk

Zodra de originele video bereikbaar is: bewaar de originele bestandshash; lees duur, dimensies, fps en frame-timestamps met ffprobe; extraheer contactbladen en complete schotcycli. Registreer per frame/interval input, aanloop, balcontact, baan, keeperreactie, botsingen, net, score en reset. Kalibreer camera, modellen en animaties aan die waarnemingen. Noteer onzekerheid en monteer-/compressieartefacten. Rapporteer afwijkingen per onderdeel; claim geen exacte match zonder vergelijking.

Als de referentievideo onbereikbaar blijft, voeg dan een echte replayfunctie aan de huidige game toe. Neem alle simulatiestappen van een schot op en laat de gebruiker per stap terug/vooruit, scrubben, vertraagd afspelen en de baan als JSON bewaren. Benoem deze stappen als 120 Hz-simulatiestappen, niet als originele videoframes. Replay mag geen munten uitkeren, levens verbruiken, klok laten verlopen of het bestaande schot muteren. Gebruik de eigen scène en speldata; genereer geen fictieve videometingen.

## Op te leveren bestanden en afrondingscriteria

1. Deze prompt en een uitgevoerd vervolgverslag.
2. JSON-data en een SQLite-database met bronverwijzingen en statusvelden.
3. Een herhaalbaar databasescript en een afzonderlijke lokale referentiepagina om de database-inhoud te doorzoeken.
4. Verbeterde spelcode, volledige rondetests, uitgebreide shop/browsertests en replaytests.
5. Actuele screenshots, gecontroleerde build en exact benoemde testresultaten.

Het werk is technisch gereed wanneer de gekozen lokale functies werken en de controles zijn afgerond. De reconstructie is pas visueel exact wanneer de originele beelden daadwerkelijk zijn vergeleken. Onbereikbare beeldbronnen en ontbrekende PvP mogen niet stilzwijgend als afgevinkt worden gepresenteerd. Publiceer niets en verander geen cloudconfiguratie tijdens deze opdracht.
