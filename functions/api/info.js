/* ==========================================================================
   GET /api/info?lat=50.08&lon=14.42&dal=2026-11-01&al=2026-11-05
   Tutto quello che serve sapere sulla meta di un viaggio, in una risposta:
   - paese (da OpenStreetMap) con valuta, prese, guida, numeri d'emergenza;
   - cambio euro → valuta locale (BCE, via Frankfurter);
   - meteo: previsioni se si parte entro 15 giorni, altrimenti com'era il
     tempo negli stessi giorni dell'anno scorso (Open-Meteo);
   - festività nazionali che cadono durante il viaggio (Nager.Date).
   Ogni pezzo è facoltativo: se un servizio non risponde, gli altri arrivano lo stesso.

   ⚠️ Open-Meteo è gratis solo per uso non commerciale. Se TOYO un giorno ha
   abbonamenti o pubblicità, serve il loro piano a pagamento (o MET Norway).
   ========================================================================== */
import { json, errore, prendi, conCache, isoValida, oggiISO, piuGiorni, giorniTra } from '../../lib/http.js';
import { PAESI } from '../../lib/paesi.js';

// Valute che la BCE pubblica (Frankfurter): per le altre si mostra solo il nome.
const BCE = new Set(['USD','JPY','BGN','CZK','DKK','GBP','HUF','PLN','RON','SEK','CHF','ISK','NOK','TRY','AUD','BRL',
  'CAD','CNY','HKD','IDR','ILS','INR','KRW','MXN','MYR','NZD','PHP','SGD','THB','ZAR']);

export async function onRequestGet({ request, waitUntil }) {
  const u = new URL(request.url);
  const lat = Number(u.searchParams.get('lat')), lon = Number(u.searchParams.get('lon'));
  let dal = u.searchParams.get('dal') || '', al = u.searchParams.get('al') || '';
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return errore('lat/lon non validi');
  if (dal && !isoValida(dal)) return errore('dal non valido');
  if (al && !isoValida(al)) return errore('al non valido');
  if (dal && !al) al = dal;
  if (dal && al < dal) [dal, al] = [al, dal];
  const ctx = { waitUntil };
  const la = lat.toFixed(2), lo = lon.toFixed(2);   // ~1 km: basta per meteo e paese, e aiuta la cache

  const [paese, meteo] = await Promise.all([
    trovaPaese(ctx, la, lo).catch(() => null),
    dal ? trovaMeteo(ctx, la, lo, dal, al).catch(() => null) : null
  ]);

  const cc = paese && paese.cc;
  const scheda = cc && PAESI[cc] ? { cc, ...PAESI[cc] } : (cc ? { cc, nome: paese.nome } : null);
  const [cambio, festivita] = await Promise.all([
    scheda && scheda.valuta && scheda.valuta !== 'EUR' && BCE.has(scheda.valuta)
      ? trovaCambio(ctx, scheda.valuta).catch(() => null) : null,
    cc && dal ? trovaFestivita(ctx, cc, dal, al).catch(() => null) : null
  ]);

  return json({
    paese: scheda, cambio, meteo, festivita,
    fonti: ['OpenStreetMap (ODbL)', 'Open-Meteo (CC BY 4.0)', 'BCE via Frankfurter', 'Nager.Date']
  }, 200, 'public, max-age=1800');
}

async function trovaPaese(ctx, la, lo) {
  return conCache(ctx, `paese:${la},${lo}`, 30 * 86400, async () => {
    const j = await prendi(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=3&accept-language=it&lat=${la}&lon=${lo}`);
    const a = j.address || {};
    return { cc: (a.country_code || '').toUpperCase() || null, nome: a.country || null };
  });
}

async function trovaCambio(ctx, valuta) {
  return conCache(ctx, `cambio:${valuta}:${oggiISO()}`, 6 * 3600, async () => {
    const j = await prendi(`https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${valuta}`);
    return { valuta, eur: j.rates && j.rates[valuta], data: j.date };
  });
}

async function trovaFestivita(ctx, cc, dal, al) {
  const anni = [...new Set([dal.slice(0, 4), al.slice(0, 4)])];
  const liste = await Promise.all(anni.map(a => conCache(ctx, `feste:${cc}:${a}`, 7 * 86400,
    () => prendi(`https://date.nager.at/api/v3/PublicHolidays/${a}/${cc}`))));
  return liste.flat()
    .filter(f => f.date >= dal && f.date <= al && f.global !== false)
    .map(f => ({ data: f.date, nome: f.name, locale: f.localName }));
}

async function trovaMeteo(ctx, la, lo, dal, al) {
  const oggi = oggiISO();
  if (al < oggi) return null;                                    // viaggio finito
  const limite = piuGiorni(oggi, 15);
  if (dal <= limite) {
    const da = dal < oggi ? oggi : dal, a = al > limite ? limite : al;
    return conCache(ctx, `prev:${la},${lo}:${da}:${a}:${oggi}`, 3 * 3600, async () => {
      const j = await prendi(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto` +
        `&start_date=${da}&end_date=${a}`);
      const d = j.daily || {};
      return { tipo: 'previsione', giorni: (d.time || []).map((t, i) => ({
        data: t, codice: d.weather_code[i], max: tondo(d.temperature_2m_max[i]),
        min: tondo(d.temperature_2m_min[i]), pioggia: d.precipitation_probability_max[i]
      })) };
    });
  }
  // Troppo presto per le previsioni: gli stessi giorni dell'anno scorso (al massimo 14).
  const indietro = s => (Number(s.slice(0, 4)) - 1) + s.slice(4);
  const da = indietro(dal), a = indietro(giorniTra(dal, al) > 13 ? piuGiorni(dal, 13) : al);
  return conCache(ctx, `clima:${la},${lo}:${da}:${a}`, 30 * 86400, async () => {
    const j = await prendi(`https://archive-api.open-meteo.com/v1/archive?latitude=${la}&longitude=${lo}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date=${da}&end_date=${a}`);
    const d = j.daily || {};
    const media = v => v && v.length ? tondo(v.reduce((s, x) => s + (x || 0), 0) / v.length) : null;
    return { tipo: 'clima', anno: Number(da.slice(0, 4)), giorni: (d.time || []).length,
      max: media(d.temperature_2m_max), min: media(d.temperature_2m_min),
      giorniPioggia: (d.precipitation_sum || []).filter(x => x >= 1).length };
  });
}

const tondo = x => x == null ? null : Math.round(x);
