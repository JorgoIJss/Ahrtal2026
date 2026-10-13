# BPC on Tour — architectuur

Status: gebaseerd op inspectie van de GitHub-repository `JorgoIJss/Ahrtal2026` op 13 oktober 2026. Dit beschrijft de **frontend-repository**. De implementatie, configuratie en deployment van de afzonderlijke fotoservice zijn niet in deze inspectie geverifieerd.

## 1. Doel en grenzen

BPC on Tour is een Nederlandstalige website voor clubuitjes, reisagenda, praktische informatie, stemlinks en fotoherinneringen. De site bevat statische pagina's met gedeelde CSS-/JavaScript-assets en paginaspecifieke inline code. Voor fotoalbums en foto's gebruikt zij een afzonderlijke HTTP-API.

## 2. Logische architectuur

```text
Browser
  |
  +-- BPC-webfrontend (statische HTML/CSS/vanilla JS)
  |     index.html                 agenda / homepage
  |     ahrtal.html                Ahrtal 2026
  |     selectiedag.html           selectiedag 2026
  |     ardennen.html              Ardennen 2027
  |     geschiedenis.html          reizen en historisch foto-overzicht
  |     fotoalbum.html             publiek lezen/bekijken
  |     fotobeheer.html            upload, beheer, albumcover, onderschrift
  |
  +-- HTTPS -> https://bpcphotos.84.86.158.39.sslip.io
        /api/albums              albumoverzicht en albumcreatie
        /api/photos              foto-overzicht en foto-upload
        /api/photos/:album/:file DELETE
        /api/photos/:album/:file/caption PUT
        /api/albums/:album/cover PUT
        foto-URL's vanuit de API
        |
        +-- persistente foto-opslag (afzonderlijke service;
            exacte backendopzet buiten deze repository)
```

## 3. Frontendstructuur

- **Technologie:** statische HTML, gedeelde bestanden in `assets/css/` en `assets/js/`, plus paginaspecifieke `<style>`- en `<script>`-blokken; Google Fonts (DM Sans, Playfair Display).
- **Navigatie:** pagina's linken rechtstreeks naar andere `.html`-bestanden. De styling en het gedrag van het zijmenu zijn gedeeld, maar de menu-items staan nog in de HTML van elke pagina; er is geen centrale templating- of buildpipeline vastgesteld.
- **Reislevenscyclus:** datums voor Ahrtal (11-10-2026), selectiedag (14-11-2026) en Ardennen (11-04-2027) staan in `assets/js/trip-history.js`. Aan de hand van de lokale datum in `Europe/Amsterdam` verschuiven afgelopen reizen uit de komende agenda naar historie, uitsluitend in de browserweergave.
- **Historie:** `geschiedenis.html` haalt album- en fotodata op uit de fotoservice.
- **Fotoalbum:** `fotoalbum.html` vraagt albums/foto's op, ondersteunt albumselectie, albumcovers en fullscreen foto bekijken, navigeren en downloaden.
- **Fotobeheer:** `fotobeheer.html` biedt albumcreatie, upload van meerdere afbeeldingen, verwijdering, captions en albumcover-instelling. De frontend ondersteunt maximaal 100 bestanden per selectie en controleert 15 MB per afbeelding; serverlimieten dienen afzonderlijk te worden gecontroleerd.
- **Stemmen:** de selectiedag gebruikt een WhatsApp-verzendactie; dit is geen automatische centrale stemmingentelling.

## 4. API en data

| Actie | Methode / pad | Client |
| --- | --- | --- |
| Albums lezen | `GET /api/albums` | Fotoalbum, beheer, geschiedenis |
| Foto's lezen | `GET /api/photos` | Fotoalbum, beheer, geschiedenis |
| Album creëren | `POST /api/albums` | Fotobeheer |
| Foto uploaden | `POST /api/photos` (FormData met `album`, `photo`) | Fotobeheer |
| Foto verwijderen | `DELETE /api/photos/:album/:filename` | Fotobeheer |
| Caption wijzigen | `PUT /api/photos/:album/:filename/caption` | Fotobeheer |
| Albumcover instellen | `PUT /api/albums/:album/cover` | Fotobeheer |

Schrijfacties verzenden `X-Upload-Password`. De correcte autorisatie en validatie moeten **server-side** plaatsvinden. De frontend maakt gebruik van onder meer album-id, titel, fotopad, `createdAt` en `caption`; een formeel API-schema ontbreekt in deze inspectie.

## 5. Hosting en persistentie

De frontend bevat een vaste cross-origin URL naar de foto-API. Volgens de frontendtekst draait deze op een aparte Coolify-fotoservice en worden foto's op de eigen server bewaard. De exacte reverse proxy, persistent-volume-mount, backupinrichting, CI/CD-hook en servercode zijn **niet vastgesteld** vanuit deze frontend-repository. Eerdere projectcontext noemt een persistent Docker-volume `bpc-photos-data`; controleer volume-naam en mounts in de actieve Coolify-service voordat je infrastructuur wijzigt.

**Cruciaal:** een nieuwe deployment mag foto-opslag of albummetadata nooit wissen. Maak vóór storage-migraties een geteste backup en herstelprocedure.

## 6. Architectuurrisico's / aandachtspunten

1. **Duplicatie:** de algemene stijlen en navigatiescripts zijn gedeeld, maar menu-items en paginaspecifieke inline code staan nog op meerdere pagina's. Een wijziging aan een gedeelde asset kan alle zeven pagina's raken.
2. **Grote bestanden:** met name `ahrtal.html` is zeer groot; wijzigingen klein houden en geen massale herschrijving zonder noodzaak.
3. **Statische reislinks:** de datumlogica is centraal, maar een nieuwe reis vereist ook aanpassingen aan HTML-menu-items, agenda en detailpagina's.
4. **API-koppeling:** hardcoded API-host; wijzigingen aan host/CORS/TLS kunnen fotoalbums op meerdere pagina's verbreken.
5. **Authenticatie/privacy:** een gedeeld wachtwoord voor schrijfacties; geen geheimen in Git, geen logging van wachtwoorden. Publieke foto's behoeven toestemming en verwijdermogelijkheid.
6. **Ontbrekende geautomatiseerde tests:** in de onderzochte rootpaden geen package-, Docker- of testmanifest gevonden; beschouw een testsuite niet als bestaand.
7. **Geen backend-audit:** voor de fotoservice zijn onder meer rate limiting, MIME-validatie, bestandsnaam-sanitatie, EXIF/privacy, backups en toegang tot storage nog te verifiëren.

## 7. Wijzigings- en acceptatieprocedure

1. Leg vast welke HTML-pagina's en foto-API-interacties geraakt worden.
2. Bewaar bestaande IDs, links, eventdatums, album-slugs, captions en uploadgedrag.
3. Controleer wijzigingen op mobiele en desktop-breedtes en zonder beschikbare foto-API.
4. Test navigatie, komende/afgelopen reizen, fotoweergave, fullscreen en toetsenbordbediening.
5. Test schrijfacties alleen met uitdrukkelijke toestemming en een veilige testomgeving; doe geen destructieve productieproeven.
6. Controleer na deployment de frontend én de fotoservice; bevestig dat bestaande albums en foto's intact zijn.

## 8. Nog te verifiëren

- Volledige repository-tree, branch/deploy-trigger en host van de statische frontend.
- Bronrepository, taal, frameworks en daadwerkelijke storage-layout van de foto-API.
- Backup- en restoreprocedure, CORS-configuratie en server-side uploadlimieten.
- Inrichting van een eenvoudige HTML/JS-check en een smoke-test in CI.

Dit document scheidt geverifieerde frontenddetails van aannames over de productie-infrastructuur.

## 9. Aanvullende infrastructuurcontrole — 13 oktober 2026

### Uitgevoerde verificatie

- De frontend verwijst expliciet naar `https://bpcphotos.84.86.158.39.sslip.io` voor fotoalbums en foto's.
- De zichtbare frontend gebruikt `GET /api/albums`, `GET /api/photos` en schrijfacties met `X-Upload-Password`.
- De twee publieke GET-endpoints en de gepubliceerde website zijn vanaf de beschikbare inspectieomgeving geprobeerd, maar konden daar niet worden bereikt. Dit is **geen bewijs van een storing** op de productieserver: de omgeving kon de bestemming niet bereiken/resolven.
- De gekoppelde GitHub-account toont de frontend-repository `JorgoIJss/Ahrtal2026`; een afzonderlijke BPC-fotoserverbronrepository is niet positief geïdentificeerd.
- Er is in deze inspectie **geen geauthenticeerde toegang tot Coolify, Docker of de server**. Daarom zijn container-image, mounts, restarts, reverse proxy, live geheugengebruik, logboeken, back-ups en restoreprocedure niet gecontroleerd.

### Benodigd bewijs voor een volledige productie-audit

Controleer in Coolify (zonder wachtwoorden of tokens te delen): servicebron en branch/commit, deploymenttype, container-mounts, domeinen en proxyconfiguratie, healthcheck, storagebackups, en de koppeling frontend→foto-API. Op de Dockerhost zijn read-only controles relevant, zoals `docker ps --format '{{.Names}} {{.Image}} {{.Status}}'`, `docker volume ls` en `docker inspect <container>` (let op: inspect-output kan secrets bevatten; redigeer deze voor delen). Toets daarna met een gecontroleerde restoretest of albumfoto's en metadata werkelijk te herstellen zijn.

**Auditstatus: gedeeltelijk voltooid; niet voldoende om veilige backups of correcte live deployment vast te stellen.**

## 10. Gedeelde frontend-assets en regressietests (13 oktober 2026)

De zeven gecontroleerde HTML-pagina's gebruiken nu vier gedeelde assets:

- `assets/css/base.css`: de acht voorheen identieke algemene style-blokken.
- `assets/css/sidebar.css`: de twee voorheen identieke sidebar-style-blokken.
- `assets/js/sidebar.js`: initialisatie van het bestaande zijmenu.
- `assets/js/trip-history.js`: de gedeelde datumafhankelijke reis-/historielogica.

De extractie is **gedragsbehoudend** ontworpen: de originele CSS-regels en JavaScript-inhoud zijn niet inhoudelijk herschreven, en verwijzingen vervangen de oorspronkelijke inline-blokken in hun bestaande volgorde. Paginaspecifieke scripts (weer, stemformulier, fotogalerij, upload, geschiedenis) zijn behouden. De grote HTML-bronbestanden zijn ongeveer 23 KB per pagina kleiner. De feitelijke reis-data staan op één locatie in `assets/js/trip-history.js`; statische HTML-links naar reizen blijven op de pagina's staan en hoeven bij een nieuwe reis nog apart aandacht.

### Uitgevoerde controles

- De zeven pagina's zijn opnieuw via GitHub gelezen en gecontroleerd op de vier assetverwijzingen.
- De twee gedeelde scripts zijn als JavaScript syntactisch gecompileerd zonder fout.
- De reis-einddatums zijn gecontroleerd: 2026-10-11, 2026-11-14, 2027-04-11.
- De assetbestanden zijn na commits opnieuw via GitHub gelezen.
- De script- en stylesheetextractie is vóór de commits gecontroleerd tegen identieke blokken op alle zeven pagina's.

### Nog niet bewezen

Een daadwerkelijke browser-/visuele regressietest en productie-smoketest zijn **niet voltooid**: de gepubliceerde site en foto-API zijn vanuit de beschikbare webomgeving niet toegankelijk. Daarmee is niet vastgesteld dat de statische host de nieuwe paden onder `/assets/` correct serveert, of dat de automatische Coolify-deployment al is bijgewerkt. Controleer in een echte browser de netwerkstatus van alle vier assets (HTTP 200), mobiele navigatie, geschiedenis en fotobeheer voordat deze release als volledig gevalideerd geldt.

Bij een server die HTML wel deployt maar nieuwe `assets/`-bestanden niet publiceert, vallen styling en navigatie weg. Controleer daarom ook het publicatiemechanisme en pas zo nodig de deployconfiguratie aan.

## 11. Fotoalbumweergave en browsercontrole (13 oktober 2026)

De publieke galerij is op `https://z0kp3vui4houqtn37bol1wl9.84.86.158.39.sslip.io/fotoalbum.html` in een echte browser geopend. Vóór de wijziging verschenen zeven albums en 131 foto's; Ahrtal 2026 bevatte 55 foto's. Albumselectie, fullscreen openen, volgende foto en sluiten met Escape werkten. De gedeelde stijlen en navigatie waren zichtbaar op deze pagina.

De galerij opent voortaan met albumcovers. Pas na keuze van een album of `Alle foto’s` worden de fotokaarten opgebouwd. Dit voorkomt dat op de openingsweergave meteen alle foto's als thumbnails worden geladen. De cover van het geselecteerde album krijgt `aria-pressed`. De datum uit `createdAt` wordt als **toevoegdatum** getoond; bij oude reisfoto's is dit niet automatisch de opnamedatum. Als albumtitels tijdelijk niet beschikbaar zijn, blijven albums uit de fotolijst zichtbaar. Foto- en albumgegevens blijven in de afzonderlijke fotoservice; de frontendwijziging raakt geen opslag of schrijfacties.

De gewijzigde HTML is lokaal geparseerd; de element-ID's zijn uniek, CSS-blokken hebben sluitende accolades en de inline JavaScript slaagt voor `node --check`. Een beperkte DOM-simulatie doorliep de openingsweergave, albumkeuze, toegevoegddatum, fullscreen vorige/volgende/terug, `Alle foto’s` en de fallback als albumtitels niet laden. Dit vervangt geen browsertest van de gepubliceerde versie. Een productie- of hersteltest van uploads, albumwijzigingen, verwijderacties of Docker-opslag is niet uitgevoerd.

### Deployblokkade

Commit `05b5045` met de fotoalbumwijziging staat op `main`, maar [GitHub Actions-run #53](https://github.com/JorgoIJss/Ahrtal2026/actions/runs/38447107027) faalde bij het aanroepen van de lokale Coolify-API vanaf de self-hosted runner. Het antwoord was HTTP 403 met `You are not allowed to access the API.` Ook eerdere automatische deploy-runs waren mislukt. Volgens de [Coolify-documentatie over API-fouten](https://coolify.io/docs/api/errors) past dit bij uitgeschakelde API-toegang of een IP-allowlist die de runner niet toelaat; controleer de concrete instelling in het lokale dashboard voordat je rechten of netwerktoegang wijzigt. De workflow gebruikt momenteel `GET /api/v1/deploy`, terwijl de actuele [endpointdocumentatie](https://coolify.io/docs/api/endpoints/deployments/deploy-by-tag-or-uuid) `POST` beschrijft. Controleer ook die methode tegen de geïnstalleerde Coolify-versie zodra de API-toegang werkt.

De beheerder heeft daarna handmatig `Redeploy` in Coolify uitgevoerd. De nieuwe live pagina is opnieuw geopend: zeven albumcovers en alle 131 eerder geziene foto's zijn aanwezig. De standaardweergave bouwt nul fotokaarten op; Ahrtal 2026 toont na selectie 55 kaarten met `toegevoegd op` als datumlabel. Fullscreen openen, volgende foto, terug naar album, `Alle foto’s` (131 kaarten) en terug naar `Albums` werkten. Beide gedeelde CSS-bestanden zijn als stylesheets geladen, de gedeelde scripts staan op de pagina, alle albumcovers hadden een geldige afbeelding en de browser meldde geen site-specifieke fouten of waarschuwingen. Dit bevestigt de read-flow op desktop; mobiel, schrijfacties, Docker-opslag en automatische deployments zijn hiermee niet gevalideerd.

