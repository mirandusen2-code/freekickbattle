# Spelen op je telefoon

**De site is gepubliceerd: https://mirandusen2-code.github.io/freekickbattle/**

GitHub bevestigt een geslaagde Pages-deployment. De onderstaande instelstappen zijn alleen nodig bij opnieuw instellen; voor spelen hoef je niets aan te zetten.

De map `site/` is de geteste mobiele webversie. Zij bevat het hele spel, een webappmanifest, appiconen en een serviceworker voor offline spelen na het eerste bezoek. Er is geen backend of download van de originele referentievideo nodig.

Publicatie gebruikt de aparte branch `gh-pages`, met alleen de bestanden uit `site/`. De broncode blijft op `main`.

Eenmalig inschakelen bij GitHub:

1. Open https://github.com/mirandusen2-code/freekickbattle/settings/pages.
2. Kies bij **Source**: **Deploy from a branch**.
3. Kies **gh-pages**, map **/(root)**, en druk op **Save**.
4. Wacht tot GitHub op die pagina de gepubliceerde site vermeldt.

Het verwachte webadres na een geslaagde publicatie is https://mirandusen2-code.github.io/freekickbattle/. Dat adres is pas bruikbaar nadat Pages is ingeschakeld en de deployment geslaagd is.

Open de werkende link in Safari op iPhone of Chrome op Android. Draai je telefoon voor een groter speelveld. Op iPhone kun je via **Deel → Zet op beginscherm** een appicoon toevoegen. Voortgang blijft lokaal op dat apparaat opgeslagen.

Voor ontwikkelaars: na wijzigingen genereert `python scripts/build-mobile-site.py` opnieuw de map `site/` vanuit `artifacts/Freekick-Battle.html`. Werk daarna de `gh-pages`-branch bij vanuit `site/`. De aanvullende workflow `deploy-mobile.yml` is uitsluitend handmatig te starten en is bedoeld voor een eventuele alternatieve GitHub Actions-publicatie.

## Opstartcontrole

Na een melding van een zwart scherm op iPhone/Safari is de spelverpakking omgezet naar een klassiek ES2018-script. Een zelfstandige laadstatus en foutmelding blijven zichtbaar als de spelcode niet start. Oudere Safari-versies krijgen ook alternatieven voor nieuwere CSS-eenheden en verhoudingen. De browserworkflow controleert Chromium en WebKit, zowel lokaal als op de gepubliceerde website. Een cacheprobleem mag een geslaagde netwerkreactie niet blokkeren.

De Safari-controle vond vervolgens de concrete verpakkingsfout: relatieve CSS-afbeeldingspaden werden gedeeltelijk vervangen, waardoor ongeldige `..data:image`-adressen ontstonden. Dat is hersteld. De controle decodeert nu ook daadwerkelijk de titel- en menuafbeeldingen. De laadstatus verdwijnt pas nadat het titelbeeld is geladen. `open.html` kan een oude spelcache vernieuwen zonder voortgang te wissen.
