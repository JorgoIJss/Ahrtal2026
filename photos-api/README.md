# BPC foto-opslag op eigen server

De fotoservice draait los van de statische BPC-website. De **bestanden worden uitsluitend in `/data` op je eigen server bewaard**. GitHub bevat alleen code, geen foto’s.

## Coolify: nieuwe Dockerfile-app

- Repository: `JorgoIJss/Ahrtal2026`, branch `main`
- Nieuwe Resource → Application → Public Repository / GitHub repository → **Dockerfile**
- **Base directory:** `/`
- **Dockerfile location:** `/photos-api/Dockerfile`
- **Container port:** `3000`
- **Domain:** `https://bpcphotos.84.86.158.39.sslip.io` (alleen indien je server/proxy op dit publieke adres bereikbaar is, met geldig HTTPS)
- **Persistent storage:** bind mount of volume **naar containerpad `/data`**, bijvoorbeeld servermap `/data/bpc-photos`. Maak de map aan en zorg dat Docker daarin kan schrijven.
- **Environment variables:**
  - `UPLOAD_PASSWORD`: lang willekeurig geheim van minimaal 16 tekens. In Coolify als geheim instellen; nooit committen.
  - `CORS_ORIGIN`: `https://z0kp3vui4houqtn37bol1wl9.84.86.158.39.sslip.io` (exacte publieke websiteorigin, zonder afsluitende slash)
  - `DATA_DIR`: `/data` (standaard)
  - `PORT`: `3000` (standaard)
- Open **niet** poort 3000 op de router. Gebruik uitsluitend de bestaande HTTPS-proxy van Coolify.
- Controleer `https://bpcphotos.84.86.158.39.sslip.io/health` → `{"ok":true}`.

De website gebruikt de fotoservice via `window.BPC_PHOTO_API='https://bpcphotos.84.86.158.39.sslip.io'`. Wijzig dit in `index.html` als je een ander adres kiest.

## Foto's uploaden

Ga naar BPC → Fotoalbum, kies album en foto's, voer het groepswachtwoord in en upload. Het wachtwoord wordt niet opgeslagen op de website. Foto's worden geconverteerd naar WebP (incl. correct draaien) en metadata worden verwijderd.

## Beveiliging en onderhoud

- **Bekijken is publiek**, net als de BPC-site. Uploaden vereist wachtwoord.
- Wachtwoord is gedeeld: iedereen die het kent kan foto's plaatsen, dus regelmatig wijzigen.
- Foto's staan op een persistent volume; zorg voor **automatische back-ups van `/data`**, liefst ook offsite.
- Geen delete-/beheerfunctie voorzien; beheerbestanden op de server als dat nodig is.
- Bij een gescheiden website- en API-domein is HTTPS op beide vereist.
- API heeft limiet van 15 MB/foto, server-side beeldvalidatie en conversie, plus rate limits. Wees voorzichtig met het publiek delen van de uploadcode.
- De API retourneert alleen bestandsnamen en URL's; de bestanden zelf blijven buiten GitHub.
