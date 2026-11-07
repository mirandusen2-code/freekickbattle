# Vervolgopdracht: brontoegang herstellen en echte referentie importeren

Ga verder met de bestaande reconstructie en de eerder vastgelegde bewijsstandaard. De gebruiker heeft expliciet toestemming gegeven voor de besproken registratie van de bestaande cloudproxy-CA in Chromiums certificaatopslag. Behoud TLS-controle, gebruik de normale platformproxy en omzeil geen netwerkweigeringen of menselijke verificatie.

Controleer daadwerkelijk of de browser de referentiebeelden kan lezen. Scheid een werkende TLS-verbinding, een geladen webpagina, een robotcontrole en echt bekeken gamebeelden. Noteer actuele bevindingen; laat verouderde fouten niet als huidige stand gelden.

Als externe toegang geblokkeerd blijft, bouw en test een eigen directe video-import naast de onderzoeksinterface. Die moet een volledige video groter dan 32 MiB kunnen ontvangen via begrensde kleine verzoeken, met checksums en gecontroleerde samenvoeging. Het bronbestand blijft intact. Gebruik de echte frame-extractiecode om een overzicht en native frame-reeksen met originele timestamps te maken. Integreer de resultaten automatisch in de referentiedatabase zonder ze als visueel beoordeeld te markeren.

Maak de import werkelijk bruikbaar: eigen bestandskiezer, lokale videopreview, voortgang, foutmeldingen, hervatten van dezelfde open verzending, analysebereik, frameknoppen, tijdlijn en meetmanifest. Bewaar nauwkeurige fragmenten als native PNG en beperk resampling tot duidelijk benoemde overzichtsbeelden. Bewaak bestandsgrootte, vrije ruimte en schone uitvoermappen. Voer geen ontvangen bestandsinhoud als code uit.

Test een echte HTTP- en browseroverdracht met een geldige synthetische MP4 groter dan 32 MiB. Test verkeerde checksums, herhaalde delen, te vroege samenvoeging, een te groot bestand, een andere aanvraag-oorsprong, correcte uiteindelijke hash, frame-extractie en automatische databasekoppeling. Houd deze fixtures buiten de echte bronverzameling. Verifieer desktop/mobiel en de bestaande gamefuncties na de middlewarewijziging.

Gebruik pas na het ontvangen van de daadwerkelijke oorspronkelijke video de frames voor expertanalyse en kalibratie van camera, animaties, UI en items. Claim niet dat het origineel exact is nagemaakt zolang de oorspronkelijke beelden en volledige shop niet vergeleken zijn. Publiceer niets. Rond de onafhankelijke technische werkzaamheden af en benoem de concrete ontbrekende bron wanneer die nog verdere reconstructie blokkeert.
