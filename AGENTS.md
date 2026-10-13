# AGENTS.md — instructies voor AI-codeagents

## Project

Dit is **BPC on Tour**, een Nederlandstalige statische website met reisagenda, historie, fotoalbum en fotobeheer. Lees voor wijzigingen eerst [ARCHITECTURE.md](ARCHITECTURE.md). Repository: `JorgoIJss/Ahrtal2026`.

## Werkafspraken

1. **Inspecteer eerst.** Lees de relevante HTML-pagina's en zoek naar duplicaten van navigatie, CSS en JavaScript. Doe geen aannames over frameworks of backendcode.
2. **Wijzig alleen de gevraagde scope.** Geen brede formattering, complete HTML-hergeneratie, refactor of dependency-migratie tenzij gevraagd. Bewaar bestaande content en visuele stijl.
3. **Behoud compatibiliteit.** Geen bestaande links, element-IDs, album-slugs, API-routes, query/fragment-links, captions of foto-URLs breken.
4. **Reislogica consistent houden.** Reisdata werken met Nederlandse tijdzone `Europe/Amsterdam`. Voltooide reizen verdwijnen uit de komende agenda en verschijnen in geschiedenis. Controleer het gedeelde `bpc-navigation-history-sync`-script op **alle betrokken pagina's**. Voeg nieuwe reizen aan elk relevant register toe.
5. **Fotoservice is apart.** De frontend gebruikt `https://bpcphotos.84.86.158.39.sslip.io` en `/api/albums` en `/api/photos`. Verander endpoints, payloads, headers en de host niet zonder expliciete opdracht en afgestemde backendwijziging.
6. **Nooit data verliezen.** Foto's en albummetadata zijn persistent en geen wegwerp-buildartefacten. Geen Docker-volumes verwijderen, resetten, herinitialiseren of wijzigen zonder expliciete toestemming, backup en herstelplan. Git-commits mogen geen uploads verwijderen.
7. **Veilige schrijfacties.** Respecteer de bestaande header `X-Upload-Password` voor write operations. Schrijf nooit wachtwoorden, tokens, cookies of andere secrets naar source, logs of documentatie. Vertrouw client-side controles niet als securitygrens.
8. **Privacy.** Publiceer geen privéfoto's, persoonsgegevens of verborgen credentials zonder toestemming. Toon onbetrouwbare captions met `textContent`, niet `innerHTML`.
9. **UX-behoud.** Foto's moeten in fullscreen geopend kunnen worden en vorige/volgende/terug ondersteunen. Houd albumcover, onderschrift, bulk-upload en bekijken/beheren als gescheiden stromen intact. Werking moet ook op mobiel duidelijk zijn.
10. **Geen verzonnen verificaties.** Rapporteer welke bestanden je echt inspecteerde, welke controles je echt uitvoerde en welke backend-/deployaspecten niet toegankelijk waren.

## Belangrijke pagina's

| Bestand | Verantwoordelijkheid |
| --- | --- |
| `index.html` | Homepage, agenda en automatische historie |
| `ahrtal.html` | Ahrtalreis 2026 |
| `selectiedag.html` | Selectiedag en WhatsApp-stemactie |
| `ardennen.html` | Ardennenreis 2027 |
| `geschiedenis.html` | Afgelopen reizen en herinneringen |
| `fotoalbum.html` | Publieke fotogalerij |
| `fotobeheer.html` | Albums, uploads, captions, covers en verwijderen |

## Werkprocedure voor elke taak

1. **Analyse:** benoem betrokken pagina's, API-contracten, edgecases en eventueel risico op bestaande foto's.
2. **Plan:** kies de kleinst mogelijke wijziging; zeg expliciet als backend of persistentie buiten deze repository valt.
3. **Implementatie:** pas gerichte bestanden aan. Hergebruik bestaande classes en semantiek; schrijf leesbare vanilla JS. Escapen/encoden van dynamische URL-segmenten verplicht.
4. **Validatie:** controleer HTML/JS-syntax en de relevante handmatige scenario's. Bij navigatiewijzigingen elke pagina nalopen; bij foto's de read-flow controleren en schrijfacties uitsluitend veilig testen.
5. **Afronding:** geef kort gewijzigde bestanden, gedrag, eventuele tests, open risico's en deploymentimpact. Claim geen geslaagde productie-deployment zonder bewijs.

## Minimale regressiechecks

- Homepage opent en navigatie tussen alle genoemde pagina's werkt, ook op mobiel.
- Na de einddatum verschijnen reizen onder geschiedenis en niet onder aankomend.
- `GET /api/albums` en `GET /api/photos` leveren bij bereikbaarheid de galerij; netwerkfouten worden begrijpelijk weergegeven.
- Albumkeuze, fullscreen vorige/volgende, terug, caption en cover blijven werken.
- Beheerfuncties vereisen het groepswachtwoord en tonen duidelijke foutmeldingen.
- Geen productiebeelden of albummetadata verloren na deployment.

## Escaleren vóór uitvoering

Vraag expliciete goedkeuring voor: verwijderen van bestanden/foto's/albums, storage-migraties, aanpassen van securitybeleid, veranderen van API-host, wijzigen van deploymentconfiguratie en elke actie die persistent data kan raken.

## Niet aannemen

De backendbroncode, Coolify-configuratie, opslagvolume, build- of CI-toolchain zijn niet door dit AGENTS.md geverifieerd. Inspecteer de betreffende infrastructuur voordat je wijzigingen voorstelt of uitvoert.
