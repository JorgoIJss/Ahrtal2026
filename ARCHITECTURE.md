# BPC on Tour — architectuur

Status: gebaseerd op inspectie van de GitHub-repository `JorgoIJss/Ahrtal2026` op 13 oktober 2026. Dit beschrijft de **frontend-repository**. De implementatie, configuratie en deployment van de afzonderlijke fotoservice zijn niet in deze inspectie geverifieerd.

## 1. Doel en grenzen

BPC on Tour is een Nederlandstalige website voor clubuitjes, reisagenda, praktische informatie, stemlinks en fotoherinneringen. De site bevat statische pagina's met inline CSS en JavaScript en gebruikt een afzonderlijke HTTP-API voor fotoalbums en foto's.

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

- **Technologie:** statische HTML, CSS in `<style>`-tags, browser-JavaScript in `<script>`-tags; Google Fonts (DM Sans, Playfair Display).
- **Navigatie:** pagina's linken rechtstreeks naar andere `.html`-bestanden. Zijmenu en scripts komen op meerdere pagina's terug; er is geen in deze inspectie aangetroffen centrale templating- of buildpipeline.
- **Reislevenscyclus:** datums voor Ahrtal (11-10-2026), selectiedag (14-11-2026) en Ardennen (11-04-2027) zitten in een terugkerend `bpc-navigation-history-sync`-script. Aan de hand van de lokale datum in `Europe/Amsterdam` verschuiven afgelopen reizen uit de komende agenda naar historie, uitsluitend in de browserweergave.
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

1. **Duplicatie:** uitgebreide inline styles en navigatiescripts staan op verschillende pagina's. Een simpele wijziging kan onbedoeld inconsistent worden. Eerst per pagina vergelijken; daarna pas gefaseerd centraliseren.
2. **Grote bestanden:** met name `ahrtal.html` is zeer groot; wijzigingen klein houden en geen massale herschrijving zonder noodzaak.
3. **Gekopieerde datums:** het reisregister is statisch en op meerdere pagina's opgenomen. Nieuwe reizen vereisen consistente wijzigingen, inclusief geschiedenis.
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
