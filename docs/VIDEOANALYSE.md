# Onderzoek en oplevering van de ontvangen Training-opname

Dit is het actuele verslag. De eerdere beperking is opgelost door de dertien aangeleverde ZIP-bestanden te downloaden, te controleren en samen te voegen. De opdracht uit [VIDEOBOUWPROMPT.md](VIDEOBOUWPROMPT.md) is uitgevoerd in de bestaande werkmap.

## Integriteit en technische analyse

| Eigenschap | Vastgesteld |
| --- | --- |
| Ontvangen delen | 13 van 13; ZIP/CRC, omvang, volgorde en offsets gecontroleerd |
| Samengevoegde omvang | 307.773.232 bytes |
| SHA-256 | `68a71a62c5c6f89599ba688b8dfc0737f90a7a065d228daf9490876f04cd173d` — gelijk aan gebruikersmanifest |
| Resolutie / codecs | 1920×1080, H.264, AAC |
| Duur | circa 900,168 seconden |
| Videocadans | 30000/1001 = 29,97003 fps |
| Frames | 26.975; laatste PTS 900,032467s |
| Spelvenster in de opname | circa x=236, y=114, breedte=1448, hoogte=856 |
| Technische verwerking | Alle frames gedecodeerd; timestamp, I/P/B-type, keyframe, beeldverschil en beeldhash geïndexeerd |

De beeldhash is een SHA-256-prefix over een verkleinde grijswaardenversie van het spelvenster. Dit is een kenmerk voor beeldvergelijking, niet een vervanging voor de volledige bestandschecksum. Er zijn 727 verschillen boven de gekozen technische drempel; camerabeweging kan zo'n verschil veroorzaken, dus dit zijn geen 727 bewezen scèneovergangen.

De technische index bewijst geen inhoudelijke beoordeling van ieder frame. Voor visuele analyse zijn overzichtsplaten van de hele vijftien minuten bekeken, met 61 controlebeelden op vijftiensecondenstappen, een dichte openingsreeks, aanvullende stage-1-beelden, de eerste schotcyclus op 10 fps, 36 opeenvolgende native contactframes en detailbeelden van HUD, menu, stages en ranglijsten. Negentien expliciete observaties staan afzonderlijk in de database. De originele video en native PNG's zijn in de werkmap bewaard.

## Wat de video bevestigt

De opening bevat logo's, laden, het titelscherm en een dialoog; het hoofdmenu is kort zichtbaar rond 25s. Daar staan PLAY/SHOP/PROFILE/OPTION en MATCH PLAY/ARCADE/TRAINING/CREDIT. De rest van de opname toont vrijwel geheel Training, met opnieuw proberen en doorgaan naar volgende stages.

**BEST wordt per trainingsstage bijgehouden:** nieuwe stages beginnen in de bron op 0, ook nadat een vorige stage punten heeft opgeleverd. De game bewaart daarom een aparte bestscore per stage naast een algemene profielstatistiek.

**Training werkt met drie missers.** Goals verbruiken geen leven. Dat is zichtbaar in de eerste ronde: een goal geeft 100 punten met drie voetballen; na een misser wordt één bal een rood kruis; een volgend doelpunt brengt de score op 400 met nog steeds één kruis; na een tweede misser blijven twee kruisen staan; een volgend doelpunt geeft Technique en No Bounce. De derde misser brengt de speler naar de ranglijst. Het eerdere tien-schotslaboratorium staat apart op `/lab.html` en geldt niet als reconstructie van deze regels.

| Stage | Afstand bij controlepunt | Muur | Controlepunt |
| --- | ---: | ---: | ---: |
| 1 | 21m | 0 | 30s |
| 2 | 21m | 0 | 134s |
| 3 | 27m | 2 | 197s |
| 4 | 27m | 2 | 265s |
| 5 | 42m | 2 | 421s |
| 6 | 42m | 2 | 611s |
| 7 | 37m | 3 | 780s |
| 8 | 32m | 4 | 871s |

Dit zijn geobserveerde startsituaties, geen bewijs dat een stage altijd op dezelfde afstand blijft. De video toont ook andere afstanden en CHANCE/POWER SHOT. De reconstructie bevat daarom afstandsvariatie en kansschoten, maar hun precieze frequentie is een lokale keuze.

De HUD bestaat uit een zilveren bovenbalk, groene BEST- en SCORE-velden, drie levensballen met rode kruisen, ronde pauze-/cameraknoppen, groene richtingspijlen linksonder, een afstand onder de echte bal, een gele/oranje richtpijl en rechtsonder een grote SPIN-bal met schuine krachtmeter. De UI-posities zijn naar het spelvenster genormaliseerd: BEST begint rond 11% breedte, SCORE rond 39,3%, levens rond 69,6%, en de SPIN-bediening ligt ongeveer tussen 68% en 93% breedte.

De zichtbare uitrusting is wit/rood met nummer 7, bruine staartjes en een kuif. De keeper draagt donker/zwart met witte handschoenen. Verdedigers hebben witte bovenkleding en donkere shorts. Het stadion bevat volle tribunes, reclamepanelen, brede veldstrepen en een overkapping. Statische UI-/publieks-/reclame-uitsneden zijn met tijdstip, bronrechthoek en hash in `data/reference-assets.json` vastgelegd. De spelwereld, beweging en uitslagen zijn echte onafhankelijke 3D-simulatie.

## Scoring en timing

Zichtbare teksten zijn onder meer Technique +100/+200, Combo X2 +100, Combo X3 +200, No Bounce +100, Cross +100, GOAL!!, WONDERFUL, TRY AGAIN en CHANCE/POWER SHOT. Waargenomen ranglijsten laten bijvoorbeeld 600 punten met één ster/50 gold en 900 of 1100 met twee sterren/100 gold zien. De reconstructie gebruikt drempels 1, 800 en 1500 punten voor één, twee en drie sterren. Deze exacte grenzen zijn niet uit de voorbeelden bewezen.

Het eerste balcontact is visueel begrensd rond frames 1058–1061, circa 35,30–35,40s. Doelpuntfeedback verschijnt rond 36,3s: ongeveer 0,9–1,0s later. De onzekerheid bij contact is ongeveer 0,1s; de gebruikte videobins en het verborgen inputmoment laten geen exact oorspronkelijke aanloopduur toe. De muurplaatsing is visueel bijgesteld naar circa elf meter vóór de bal, met een aanpassing voor heel korte afstanden; dit is een reconstructieparameter. De botsingsberekening gebruikt dezelfde positie. De lokale aanloop van 0,7s en resultaatfase van 4,2s zijn benaderingen. SKIP en gebruikerswachttijd in de opname zijn geen vaste animatietimings.

De nieuwe game heeft een tijdgestuurde aanloop, been-/knie-/armbeweging, balrotatie en -effect, keeperduik, bewegende camera, bonus- en resultaatfeedback, doelnetreactie en een viering. Physics en schotreplay gebruiken 120 Hz; renderopties begrenzen op 30/60/120 fps. De 29,97 fps van de opname zegt niets definitiefs over de interne oorspronkelijke gameframerate. Een browserinstelling van 120 fps garandeert geen 120 werkelijke frames op ieder apparaat.

## Passen, timing en omhaal

Aanvullende beelden op éénsecondenstappen van 611–630s tonen bij stage 6 een PASS-ballon bij een medespeler. Na de pas verschijnt rond 619s een timingcirkel; PERFECT-feedback wordt gevolgd door een omhaal rond 621–623s en een goal met Technique +100 / Cross +100. Dit verduidelijkt dat Cross bij deze geobserveerde voorzet hoort, niet eenvoudig bij een gebogen schot.

De game bevat nu een selecteerbare pas in stages 6 en 7, een echte gebogen balvlucht naar een medespeler, een timingactie, een procedurele omhaal en een apart gesimuleerd afwerkingsschot. Te vroeg of niet tikken kost precies één leven. Perfecte timing zet de keeper op het verkeerde been; beloningen worden alleen bij een werkelijke goal toegekend. De lokale pasduur (2,4s), timingvenster (2,8s; ideaal rond 1,4s) en omhaalduur (0,8s) zijn reconstructiekeuzes, geen exact gemeten originele waarden. Replay bewaart het uiteindelijke afwerkingsschot.

## Winkel en online onderzoek

Pocket Gamer bevestigt GAMEVIL/COCOSOFT, tap-to-kick, Arcade, Match, AI/online PvP en kostuumtypen piraat, samoerai en bunnygirl. Die artikeltekst is lokaal opgeslagen en geregistreerd. Een aanvullende, daadwerkelijk gelezen recensie van Jordan Minor op 148Apps (12 april 2012) bevestigt kapsels, statverhogende schoenen, broeken, brillen, betaalde huidskleur en gratis geslachtskeuze. De gekoppelde screenshot geeft 403 en is niet als bekeken beeld gebruikt. Pogingen om YouTube en de gekoppelde screenshot rechtstreeks op te halen waren geblokkeerd; Google Afbeeldingen toonde een controle op ongebruikelijk verkeer. Er zijn daardoor geen ongeziene Google-beelden als bewijs gebruikt. De nu ontvangen video is de primaire visuele bron.

**De video opent de shop niet.** De complete oorspronkelijke catalogus, alle prijzen, categorieën, statistieken en exacte kostuumontwerpen zijn niet vast te stellen. De gebouwde winkel heeft 25 lokale keuzes in acht categorieën (outfits, ballen, haar, schoenen, broeken, brillen, huidskleur en geslacht), echte aanschaf-/uitrustlogica, saldo, eigendom, onvoldoende-saldofeedback en opslag na herladen. De basis is op de witte/rode nummer-7-uitrusting geïnspireerd. De overige ontwerpen en alle prijzen zijn expliciet lokale keuzes. Geslachtskeuze is gratis, conform de recensie. De twee verbeterde schoenen voegen lokaal 3% of 6% kracht toe, begrensd op het maximum; de oorspronkelijke statwaarden zijn onbekend. Alle kleding-/uiterlijkcategorieën veranderen het zichtbare 3D-model. Er zijn geen echte aankopen. Het oude lab heeft zijn eigen apart gehouden catalogus en profiel.

## Gebouwd en gecontroleerd

De standaardgame bevat titel/menu, stagekeuze en ontgrendeling, acht stageconfiguraties, richten, tweestaps krachtbediening, sleepbare spin/hoogte, echte balvlucht, keeper/muur, doelen/missers/paal/lat, bonussen/combo, levens, ranglijst, sterren/gold, opnieuw/volgende/menu, pauze, eigen schotreplay, profiel en shop. Arcade en een lokale AI-wedstrijd zijn extra speelbare modi. Ontbrekende opslag en WebGL hebben een afhandeling. De game past in portret en liggend mobiel scherm.

De onderzoekspagina biedt SQLite/JSON, bronnen, geobserveerde scènes en stages. De videopagina speelt het volledige ontvangen bestand vanuit de werkmap af, ondersteunt browserstappen en springt naar controlepunten. Er is ook een zelfstandig HTML-spelpakket zonder serverinstallatie. De oorspronkelijke bronvideo blijft apart en wordt niet in dat kleine spelbestand ingebakken.

De actuele resultaten staan in `data/validation.json`, met logboeken in `test-results/validation/`. Er zijn unitcontroles voor physics, Training, Arcade, AI-klok, profielen, winkels, replay, videodelen en de brondatabase. Browsertests bedienen de app met echte invoer, controleren doelpunt/missers/ranglijst, alle 25 items en herladen, menu/pauze/replay, mobiele aanrakingen, liggende indeling, de bronvideospeler en byte-range-toegang. Er zijn desktop-/mobiele screenshots en een spelopname. De cloudbrowser blokkeert file:// via beheersbeleid; het zelfstandige spel wordt daarom als complete HTML in een browserdocument zonder server/oorsprong getest. Gewone desktopbrowsers kunnen het HTML-bestand rechtstreeks openen.

## Resterende afwijkingen

| Onderdeel | Huidige grens |
| --- | --- |
| 3D-karakters | Eigen procedurele modellen en rig; niet de oorspronkelijke meshes, verhoudingen, kledingtextures of exacte gezichtsanimatie |
| Camera en beweging | Op referentiebeelden afgestemd, maar geen per-frame identieke camerabaan, keeperreactie of voetcontactpose |
| Physics en punten | Werkende onafhankelijke simulatie; oorspronkelijke interne parameters en volledige scoreformule onbekend |
| Winkel | Werkende lokale catalogus; geen gevalideerde volledige oorspronkelijke inventaris of prijsstructuur |
| Arcade/Match | Aanvullende lokale regels en AI; ongeziene oorspronkelijke schermen/regels niet exact geverifieerd |
| Netwerk en aankopen | Geen online PvP, originele servers, accounts, premiumaankopen of werkende energie-economie |
| Geluid en opening | Eigen gesynthetiseerde effecten; originele muziek, volledige logo-/laad-/dialoogcyclus niet nagemaakt |
| Lettertype en overlays | Gedocumenteerde bronuitsneden plus HTML/CSS; niet ieder gegenereerd woord heeft het oorspronkelijke lettertype |

Deze versie is een speelbare, op de daadwerkelijk ontvangen opname afgestemde reconstructie. ‘Alles exact frame voor frame’ is niet bewezen en wordt niet als voltooid voorgesteld. De eerste oplevering was lokaal. Na expliciete aanvullende toestemming is de mobiele webversie gepubliceerd op https://mirandusen2-code.github.io/freekickbattle/. GitHub bevestigt een geslaagde publicatie.
