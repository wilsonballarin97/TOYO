/* ==========================================================================
   ▼▼▼  CONFIGURAZIONE — METTI QUI I DATI DEL TUO PROGETTO SUPABASE  ▼▼▼

   Compilando queste due righe, chiunque apra l'app trova già gli account
   attivi: non deve incollare niente. Se le lasci vuote, TOYO funziona in
   locale e la configurazione si può mettere da Impostazioni → Account.

   La chiave da mettere qui è la PUBBLICA (publishable / anon): è fatta per
   stare nel browser, la vedono tutti ed è normale così. A proteggere i dati
   sono le regole (Row Level Security) che hai lanciato con l'SQL.
   La chiave SECRET / service_role non va MAI messa qui.
   ========================================================================== */
/* Su Cloudflare Pages i valori arrivano dalle variabili d'ambiente
   SUPABASE_URL e SUPABASE_KEY (Settings → Variables): la build li scrive qui
   al posto dei segnaposto. Se non sono impostate restano questi predefiniti. */
const TOYO_CONFIG = {
  url:    '__SUPABASE_URL__' || 'https://qelakwrbfujneufktfzr.supabase.co',
  chiave: '__SUPABASE_KEY__' || 'sb_publishable_hfHVCtPyizdZRX_s3oZr8Q_g6RtLytl'
};
/* Codici di affiliazione dei partner (Booking via Awin, GetYourGuide, Viator…).
   Arrivano dalla variabile TOYO_PARTNER su Cloudflare, scritta dalla build:
   finché è vuota i link funzionano uguale, solo senza commissione.
   Formato e esempi nel README, sezione "Affiliazioni". */
const TOYO_PARTNER = {} /*@PARTNER*/;
/* "personale" (predefinito, TOYO non guadagna) o "commerciale": decide quali
   servizi si possono usare (Open-Meteo e Transitous solo in personale).
   Arriva dalla variabile TOYO_USO su Cloudflare, scritta dalla build. */
const TOYO_USO = '__TOYO_USO__' || 'personale';
/* Scritto dalla build: data e commit da cui è stata generata questa versione. */
const TOYO_BUILD = '__BUILD__';
/* ▲▲▲  fine configurazione  ▲▲▲ */
