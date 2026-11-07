# Spelen op je telefoon

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
