# Definitieve bouwopdracht op basis van de ontvangen video

## Primaire bron en opdracht

Reconstructeer Freekick Battle op basis van de daadwerkelijk ontvangen TouchGameplay-video. De 13 ZIP-delen zijn gecontroleerd en samengevoegd tot 307.773.232 bytes met SHA-256 `68a71a62c5c6f89599ba688b8dfc0737f90a7a065d228daf9490876f04cd173d`. Het bronbestand is 1920×1080, circa 900,168 seconden lang en bevat 26.975 videoframes op 30000/1001 fps. Bewaar dit origineel ongewijzigd en buiten Git.

Voer deze prompt daadwerkelijk uit: analyseer de gehele tijdlijn, maak een brongebonden database, vervang de voorlopige spelpresentatie door een reconstructie van de zichtbare Training en test de echte app. Gebruik de bestaande werkmap en behoud het eerdere laboratorium en de onderzoekstools op afzonderlijke routes. Publiceer of push niets.

## Geobserveerde basis

De opname toont een logo-intro, een geel laadscherm, het Free Kick Battle-titelscherm, een notificatiedialoog, langdurige Training met opeenvolgende stages, schot-/keeperanimaties, doelpunt- en bonusfeedback, ranglijsten met sterren en kort een iTunes-scherm. Het speelbeeld staat binnen zwarte randen, ongeveer x=236, y=114, breedte=1448, hoogte=856. Negeer opname-overlays buiten het spel.

Het geobserveerde HUD heeft een zilvergrijze bovenbalk, groene BEST- en SCORE-velden, drie voetbalpogingen die bij missers rode kruisen worden, rechtsboven ronde pauze-/cameraknoppen, linksonder twee groene richtingspijlen en rechtsonder een grote bal voor SPIN met een schuin omlijnde krachtmeter erboven. Een gele/oranje richtpijl staat boven de echte bal. De afstand verschijnt onder de bal in meters.

De zichtbare speler heeft een groot hoofd, bruine paardenstaartjes, witte korte sportkleding met rode biezen en nummer 7, witte sokken en donkere rode schoenen. De keeper draagt zwart met witte details en handschoenen. Verdedigers vormen later een muur van één tot meerdere spelers. Het stadion heeft meerdere volle tribunerangen, reclamepanelen en een wit overkapt dak. Het veld is felgroen met brede maaistroken. De eerdere beige dashboardpresentatie en blokfiguren zijn geen visuele referentie voor deze bron.

## Analyse en bewijs

Indexeer alle 26.975 frame-timestamps en bereken technische beeldverschillen/overgangen. Bekijk overzichtsplaten van de hele 15 minuten en onderzoek volledige schotcycli dichter op de tijdlijn. Bewaar native beelden voor controlepunten en noteer de tijdstippen waarop inputfase, aanloop, balcontact, vlucht, redding/doelpunt, bonusregels en reset zichtbaar worden. Maak onderscheid tussen geobserveerde videoframerate en onbekende interne gameframerate. Gebruikerswachttijd en drukken op SKIP zijn geen vaste animatieduur.

Leg de geobserveerde posities, kleuren, teksten, spelersproporties, afstanden, verdedigers, bonussen en ranglijsten vast. Hergebruik kleine UI-/stadionuitsneden uit de aangeleverde referentie waar dat de getrouwheid helpt; documenteer hun herkomst. Gebruik geen opgenomen gameplayvideo als vervanging voor een echte interactieve simulatie. Bal, keeper, schutter, muur, regels en uitkomsten moeten zelfstandig draaien.

De bron toont onder andere Technique (+100 of +200), Combo X2 (+100), Combo X3 (+200), No Bounce (+100), Cross (+100), GOAL!!, WONDERFUL, TRY AGAIN, CHANCE/POWER SHOT en TRAINING RANKING met SCORE, GOLD, NEXT LEVEL, RETRY en MENU. Voorbeelden: 600 punten → één ster en 50 gold; 900 of 1100 punten → twee sterren en 100 gold. De precieze drempels voor drie sterren zijn niet uit die voorbeelden bewezen: maak die instelbaar en label de resterende aanname.

## Speelbare implementatie

Maak de visuele reconstructie de standaardgame. Ondersteun starten, trainingsstage kiezen, richten met pijlen/toetsen/touch, kracht opbouwen en vastzetten, spin op de grote bal kiezen, schieten, bewegende camera, keeperreactie, muur, bonusfeedback, drie missers (goals verbruiken geen leven), ranglijst, opnieuw proberen, volgende stage en menu. Houd een snelle muis-/touchbediening én toegankelijke toetsenbordbediening. Laat pauze en verborgen tabs de simulatie stilzetten. Een terugkijkfunctie gebruikt eigen opgeslagen schotdata en mag geen extra punten of gold geven.

Laat de afstand en het aantal verdedigers per stage toenemen zoals de waargenomen voorbeelden. Koppel puntentoekenning aan het werkelijke traject en resultaat. Een misser mag geen doelpuntbonus krijgen. Bij drie missers rondt Training af; bij Arcade moeten levens en voortgang kloppen. Houd de lokale AI-wedstrijd als aanvullende functie, maar presenteer deze niet als origineel online PvP.

Maak een bruikbare shop/inventaris met lokale opslag en echt uitrustbare kleding/ballen, maar markeer niet-geobserveerde namen/prijzen als reconstructiekeuzes. De trainingvideo opent geen volledige winkel. De tekstbron noemt piraat/samoerai/bunnygirl, maar levert geen complete itemlijst. Voeg de waargenomen witte/rode nummer-7-uitrusting toe als basis. Wijzig geen bestaande profieldata destructief; gebruik een versie en valideer invoer/eigendom.

## Timing en weergave

Gebruik een vaste physicsstap en tijdgebaseerde animatie. Bied 30/60/120 als renderbovengrens; een optie van 30 fps is een benadering van de 29,97 fps-opname, geen bewijs van identieke interne werking. Kalibreer aanloop/contact, vlucht en camerastand op gemeten controlepunten. Maak referentiebeelden en spelbeelden vergelijkbaar in dezelfde viewportverhouding. Vermeld waar de 3D-modellen, poses, geluiden en camera nog afwijken.

## Verificatie en afronding

Test volledige rondes, alle zichtbare knoppen, pauze, toetsenbord/touch, kracht-/spin-invoer, het einde van drie pogingen, scores/bonussen, stageprogressie, herstart/menu, kopen/uitrusten/herladen en een veilige fallback bij ontbrekend WebGL. Maak desktop-/mobiele screenshots en een functionele opname. Draai unit-/browsertests en productiebouw.

Werk het bronregister bij van ‘niet bekeken’ naar de daadwerkelijk bekeken scènes. De database bevat het volledige technische frame-index en aparte expliciete visuele observaties. Claim niet dat alle 26.975 frames inhoudelijk handmatig bekeken zijn. Lever een speelbare, aanzienlijk op de video afgestemde reconstructie en een eerlijk afwijkingenverslag op. Stel geen extra vragen zolang bruikbare keuzes uit de video of de bestaande code kunnen worden afgeleid.

## Uitvoeringsaanvulling na nader brononderzoek

De gelezen 148Apps-recensie bevestigt aanvullende winkelcategorieën: haar, schoenen met statbonussen, broeken, brillen, huidskleur en gratis geslachtskeuze. Implementeer die categorieën met expliciet lokale ontwerpen/prijzen/statwaarden. Nadere beelden rond 611–630s tonen PASS naar een medespeler, een timingcirkel, PERFECT-feedback, een omhaal en Technique/Cross-bonussen. Voeg deze echte interactieve schotvariant toe met een aparte timingfase en éénmalige beloning; een vroege of ontbrekende tap kost één leven. Originele meshes en exacte timingvensters blijven onbekend.
