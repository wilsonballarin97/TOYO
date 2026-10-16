/* ==========================================================================
   GET /api/geocode?q=Lisbona   (Cloudflare Pages Function)
   Fa da tramite verso Nominatim (OpenStreetMap). Serve per due motivi:
   - Nominatim chiede un User-Agent che identifichi l'app: dal browser non si
     può impostare, da qui sì;
   - la stessa ricerca fatta da più persone esce dalla cache di Cloudflare
     invece di ripartire ogni volta (Nominatim permette 1 richiesta al secondo).
   ========================================================================== */
const PERMESSI = ['format', 'limit', 'accept-language', 'q'];

export async function onRequestGet({ request, waitUntil }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q || q.length > 200) return json({ errore: 'q mancante o troppo lunga' }, 400);

  const fuori = new URL('https://nominatim.openstreetmap.org/search');
  for (const k of PERMESSI) if (url.searchParams.has(k)) fuori.searchParams.set(k, url.searchParams.get(k));
  fuori.searchParams.set('format', 'json');
  fuori.searchParams.set('limit', String(Math.min(10, Number(url.searchParams.get('limit')) || 5)));

  const cache = caches.default;
  const chiave = new Request(fuori.toString());
  const inCache = await cache.match(chiave);
  if (inCache) return inCache;

  const r = await fetch(fuori, {
    headers: { 'User-Agent': 'TOYO-travel-app/1.0 (+https://github.com/wilsonballarin97/TOYO)', 'Accept': 'application/json' }
  });
  if (!r.ok) return json({ errore: 'nominatim ' + r.status }, 502);

  const risposta = new Response(await r.text(), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=86400' }
  });
  waitUntil(cache.put(chiave, risposta.clone()));
  return risposta;
}

function json(dati, stato) {
  return new Response(JSON.stringify(dati), {
    status: stato, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
