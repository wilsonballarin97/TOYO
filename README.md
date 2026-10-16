# TOYO · Travel on your own

App per organizzare i viaggi di gruppo: itinerario, prenotazioni, spese divise,
documenti, decisioni. Funziona offline ed è installabile sulla Home (PWA).
Ospitata su **Cloudflare Pages**, dati su **Supabase**.

## Struttura

```
src/
  index.html        scheletro della pagina
  css/NN-*.css      stili, uno per parte dell'interfaccia (uniti in ordine)
  js/NN-*.js        codice, una sezione per file (uniti in ordine, stesso scope)
  sw.js             service worker (versione e file da salvare li scrive la build)
public/             copiato così com'è: foto/, icone, manifest, _headers
functions/api/      Cloudflare Pages Functions
  geocode.js        GET /api/geocode?q=…  ricerca luoghi via Nominatim, con cache
  health.js         GET /api/health       stato del deploy e commit in linea
  info.js           GET /api/info?lat&lon&dal&al  meteo, paese, cambio, festività
  cambi.js          GET /api/cambi?a=CZK,USD      cambi BCE del giorno
  _middleware.js    errori in JSON, solo GET, intestazioni comuni
lib/                codice condiviso dalle Functions (cache, chiamate, schede paese)
build.mjs           build senza framework → dist/
```

Il numero davanti ai file decide l'ordine: `01-config.js` viene prima di tutto,
`30-rete-e-avvio.js` chiude e avvia l'app. Per aggiungere una sezione basta un
file nuovo col numero giusto.

## Comandi

```bash
npm install
npm run dev       # http://localhost:8788, ricostruisce a ogni salvataggio
npm run build     # produce dist/
npm run preview   # build + Cloudflare in locale (Functions comprese)
```

## Deploy (Cloudflare Pages)

Collegato al repo GitHub: ogni push su `main` va in produzione, ogni altro
ramo ha un'anteprima con il suo indirizzo.

| Impostazione        | Valore           |
|---------------------|------------------|
| Framework preset    | None             |
| Build command       | `npm run build`  |
| Output directory    | `dist`           |
| Variabile `NODE_VERSION` | `20`        |

Variabili facoltative (Settings → Variables and Secrets):
`SUPABASE_URL` e `SUPABASE_KEY` (la chiave **publishable**). Se mancano, resta
il progetto scritto in `src/js/01-config.js`.

Non serve più cambiare a mano `CACHE_VERSION`: i file escono con l'impronta
nel nome e il service worker cambia versione da solo a ogni build.

## Vecchio indirizzo (GitHub Pages)

`index.html` e `sw.js` nella radice del repo **non sono l'app**: restano su
`wilsonballarin97.github.io/TOYO` per chi aveva il vecchio indirizzo. La pagina
manda al nuovo sito e, se sul telefono ci sono viaggi salvati senza account, li
trasferisce con un tocco (postMessage verso `toyo-travel.pages.dev`, ricevuti
da `src/js/31-trasloco.js`) o li fa scaricare come backup. `sw.js` spegne il
vecchio service worker e svuota la sua cache.

## Automazioni su GitHub (Actions)

- `build`: a ogni push controlla che la build passi.
- `supabase-sveglia`: ogni 3 giorni una richiesta leggera, così il piano
  gratuito di Supabase non mette in pausa il progetto.
- `backup`: ogni domenica copia cifrata del database. Si attiva aggiungendo i
  segreti `SUPABASE_DB_URL` e `BACKUP_PASSPHRASE` (istruzioni nel file).

## Servizi esterni e licenze

| Servizio | Per cosa | Condizioni |
|---|---|---|
| OpenStreetMap / Nominatim | ricerca luoghi, paese | max 1 richiesta/s, niente autocompletamento, attribuzione ODbL |
| Open-Meteo | meteo e clima | gratis solo per uso non commerciale, CC BY 4.0 |
| Frankfurter (BCE) | cambi | gratis, senza chiave |
| Nager.Date | festività | gratis, senza chiave |

## Supabase

La chiave nel codice è quella pubblica, è normale che si veda. I dati li
proteggono le regole di Row Level Security su Supabase. La chiave
`service_role` / `sb_secret_…` non va mai nel codice: la build si ferma se la
trova.
