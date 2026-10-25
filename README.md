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
  foto.js           GET /api/foto?q=Praga         foto della città con autore e licenza
  tratta.js         GET /api/tratta?da&a&quando   mezzi pubblici fra due punti (Transitous)
  _middleware.js    errori in JSON, solo GET, intestazioni comuni
lib/                codice condiviso dalle Functions (cache, chiamate, schede paese)
build.mjs           build senza framework → dist/
```

Il numero davanti ai file decide l'ordine: `01-config.js` viene prima di tutto,
`98-avvio.js` avvia l'app. Per aggiungere una sezione basta un
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
| Open-Meteo | previsioni a 16 giorni, clima medio degli ultimi 5 anni (modalità personale) | gratis solo per uso non commerciale, CC BY 4.0 |
| MET Norway + NASA POWER | meteo in modalità commerciale | gratis anche commerciale |
| Wikipedia / Wikidata / Wikimedia Commons | foto delle città (`/api/foto`) | licenze libere, uso commerciale ok citando autore e licenza (l'app li mostra) |
| Transitous | orari dei mezzi fra due punti (`/api/tratta`) | solo progetti non commerciali e open source, uso leggero; spento con `TOYO_USO=commerciale` |
| Google Maps (link) | come arrivare fra due punti (mezzi, piedi, auto) | solo link, nessuna API né costo |
| Frankfurter (BCE) | cambi | gratis, senza chiave |
| Nager.Date | festività | gratis, senza chiave |

### Modalità: personale o commerciale

Finché TOYO non guadagna (niente pubblicità, abbonamenti o commissioni) usa i
servizi gratuiti "solo non commerciali", che sono i più precisi. Il giorno che
si attivano affiliazioni o abbonamenti, su Cloudflare si imposta la variabile
`TOYO_USO=commerciale` e TOYO passa da solo alle fonti che lo permettono
(oggi: il meteo da Open-Meteo a MET Norway + NASA POWER, e gli orari dei
mezzi di Transitous si spengono).
**Attenzione:** i codici in `TOYO_PARTNER` sono già un uso commerciale.

## Affiliazioni

I link di "Cerca e prenota" funzionano sempre. Per guadagnare una commissione
basta dare a Cloudflare i codici partner, senza toccare il codice:
Cloudflare → toyo-travel → Settings → Variables and Secrets → aggiungi
`TOYO_PARTNER` (tipo testo, ambiente Production), poi rifai il deploy.

Il valore è un JSON `{ "marca": "modello" }`. Il modello può essere:
- un indirizzo con `{url}` dentro, dove TOYO mette il link originale
  (così funzionano Awin, CJ, Travelpayouts…);
- dei parametri da aggiungere al link, che iniziano con `&`.

```json
{
  "booking": "https://www.awin1.com/cread.php?awinmid=MID_BOOKING&awinaffid=TUO_ID&ued={url}",
  "getyourguide": "&partner_id=TUO_PARTNER_ID",
  "viator": "&pid=P00XXXXX&mcid=42383&medium=link"
}
```

Marche disponibili: `ryanair`, `skyscanner`, `booking`, `airbnb`,
`hostelworld`, `getyourguide`, `viator`, `tiqets`, `trainline`, `omio`,
`flixbus`, `trenitalia`, `rentalcars`, `discovercars`, `hertz`, `airalo`,
`heymondo`. Una marca senza codice resta un link normale. Quando c'è almeno un
codice, sotto i link compare la frase che dichiara l'affiliazione, e i link
affiliati hanno `rel="sponsored"`. Un valore scritto male ferma la build.

## Licenza

TOYO è software libero: [GNU AGPL-3.0 o successiva](LICENSE). Chiunque può
leggere, usare e modificare il codice; chi ne fa girare una versione modificata
come servizio online deve pubblicare anche le sue modifiche. Nell'app, in
Impostazioni, c'è il link al codice sorgente (lo chiede la licenza).

Copyright (C) 2026 wilsonballarin97.

## Accesso con email e codice

Oltre a Google ci si registra con la propria email (file `src/js/37-email.js`):
si scrive l'indirizzo, arriva un **codice di 6 cifre**, lo si inserisce e si è
dentro. Al primo accesso si sceglie il nome utente e, se si vuole, una password
per entrare la volta dopo con email e password. Lo stesso codice serve per
entrare quando la password non la si ricorda. Gli account vecchi con nome utente
e password continuano a funzionare (si entra scrivendo il nome utente).

Da fare una volta sola su **Supabase**:

1. **Authentication → Emails → Templates**: nei modelli *Magic link* e
   *Confirm signup* mettere il codice al posto del link, per esempio
   `<h2>Il tuo codice TOYO</h2><p>Scrivi questo codice nell'app: <b>{{ .Token }}</b></p><p>Scade fra un'ora.</p>`
   (oggetto: `Il tuo codice TOYO`).
2. **Authentication → Emails → SMTP Settings**: attivare un server di posta
   proprio. Quello di prova di Supabase scrive **solo agli indirizzi del team
   del progetto** (e poche volte all'ora): senza SMTP gli altri ricevono
   l'errore "Email address not authorized". Va bene la casella del dominio
   (es. Aruba: `smtps.aruba.it`, porta 465) oppure un servizio come Resend o
   Brevo con il dominio verificato.
3. **Authentication → Rate Limits**: alzare "emails per hour" a quanto serve.
4. **Sign In / Providers → Email**: "Confirm email" resta **spento** (serve agli
   account vecchi con nome utente); l'email la conferma già il codice.

## Accesso con Google

Nell'app c'è "Continua con Google" (file `src/js/36-google.js`, flusso PKCE).
Al primo accesso si sceglie il nome utente; l'email di Google resta privata.
Per attivarlo, una volta sola:

1. **Google Cloud Console** → APIs & Services → OAuth consent screen: app
   esterna, nome "TOYO", email di supporto, dominio `toyo-travel.pages.dev`.
   Ambiti: solo `openid`, `email`, `profile` (nessuna verifica Google necessaria).
2. **Credentials → Create credentials → OAuth client ID** → Web application.
   - Authorized JavaScript origins: `https://toyo-travel.pages.dev`
   - Authorized redirect URIs: `https://qelakwrbfujneufktfzr.supabase.co/auth/v1/callback`
3. **Supabase** → Authentication → Sign In / Providers → Google: attiva,
   incolla Client ID e Client Secret, salva.
4. **Supabase** → Authentication → URL Configuration:
   Site URL `https://toyo-travel.pages.dev`, e in Redirect URLs aggiungi
   `https://toyo-travel.pages.dev/**`.

Il Client Secret si incolla solo su Supabase: non va mai nel codice né su GitHub.

## Supabase

La chiave nel codice è quella pubblica, è normale che si veda. I dati li
proteggono le regole di Row Level Security su Supabase. La chiave
`service_role` / `sb_secret_…` non va mai nel codice: la build si ferma se la
trova.
