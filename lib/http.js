/* ==========================================================================
   Attrezzi comuni alle Functions in functions/api/.
   (Questa cartella sta fuori da functions/ apposta: Cloudflare trasforma in
   indirizzo ogni file lì dentro, qui invece ci sono solo funzioni da importare.)
   ========================================================================== */
export const UA = 'TOYO-travel-app/1.0 (+https://github.com/wilsonballarin97/TOYO)';

export function json(dati, stato = 200, cache = 'no-store') {
  return new Response(JSON.stringify(dati), {
    status: stato,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache }
  });
}

export const errore = (msg, stato = 400) => json({ errore: msg }, stato);

/* Chiede a un servizio esterno, con un tempo massimo: un servizio lento non
   deve bloccare tutta la scheda. */
export async function prendi(url, { ms = 6000, testo = false } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (!r.ok) throw new Error(new URL(url).host + ' ' + r.status);
    return testo ? await r.text() : await r.json();
  } finally { clearTimeout(t); }
}

/* Cache della rete di Cloudflare: la stessa domanda fatta da più persone (o
   dalla stessa persona più volte) esce da qui invece di ripartire verso il
   servizio esterno. `chiave` è una stringa qualsiasi che identifica la domanda. */
export async function conCache(ctx, chiave, secondi, produci) {
  const cache = caches.default;
  const req = new Request('https://cache.toyo.internal/' + encodeURIComponent(chiave));
  const hit = await cache.match(req);
  if (hit) return hit.json();
  const dati = await produci();
  const r = new Response(JSON.stringify(dati), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=' + secondi }
  });
  ctx.waitUntil(cache.put(req, r));
  return dati;
}

/* Date ISO yyyy-mm-dd, controllate. */
export const isoValida = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(Date.parse(s));
export const oggiISO = () => new Date().toISOString().slice(0, 10);
export function piuGiorni(iso, n) {
  const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const giorniTra = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
