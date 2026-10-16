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

## Supabase

La chiave nel codice è quella pubblica, è normale che si veda. I dati li
proteggono le regole di Row Level Security su Supabase. La chiave
`service_role` / `sb_secret_…` non va mai nel codice: la build si ferma se la
trova.
