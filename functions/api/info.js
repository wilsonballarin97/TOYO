/* ==========================================================================
   GET /api/info?lat=50.08&lon=14.42&dal=2026-11-01&al=2026-11-05
   Tutto quello che serve sapere sulla meta di un viaggio, in una risposta:
   - paese (da OpenStreetMap) con valuta, prese, guida, numeri d'emergenza;
   - cambio euro → valuta locale (BCE, via Frankfurter);
   - meteo: previsioni se si parte entro 9 giorni (MET Norway), altrimenti
     com'era il tempo negli stessi giorni dell'anno scorso (NASA POWER);
   - festività nazionali che cadono durante il viaggio (Nager.Date).
   Ogni pezzo è facoltativo: se un servizio non risponde, gli altri arrivano lo stesso.

   Due modalità, scelte con la variabile TOYO_USO su Cloudflare:
   - "personale" (predefinita, TOYO non guadagna): Open-Meteo, più preciso —
     16 giorni di previsioni con probabilità di pioggia, vento, UV, alba e
     tramonto; e il clima come media degli stessi giorni negli ultimi 5 anni.
     Gratis solo per uso non commerciale (niente pubblicità né abbonamenti).
   - "commerciale" (quando TOYO avrà affiliazioni o abbonamenti): MET Norway
     e NASA POWER, che permettono l'uso commerciale.
   ========================================================================== */
import { json, errore, prendi, conCache, isoValida, oggiISO, piuGiorni, giorniTra } from '../../lib/http.js';
import { PAESI } from '../../lib/paesi.js';

// Valute che la BCE pubblica (Frankfurter): per le altre si mostra solo il nome.
const BCE = new Set(['USD','JPY','BGN','CZK','DKK','GBP','HUF','PLN','RON','SEK','CHF','ISK','NOK','TRY','AUD','BRL',
  'CAD','CNY','HKD','IDR','ILS','INR','KRW','MXN','MYR','NZD','PHP','SGD','THB','ZAR']);

export async function onRequestGet({ request, waitUntil, env }) {
  const personale = (env && env.TOYO_USO || 'personale') !== 'commerciale';
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
    dal ? (personale ? meteoOpenMeteo(ctx, la, lo, dal, al) : trovaMeteo(ctx, la, lo, dal, al)).catch(() => null) : null
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
    fonti: ['OpenStreetMap (ODbL)', personale ? 'Open-Meteo.com (CC BY 4.0)' : 'MET Norway (CC BY 4.0) · NASA POWER', 'BCE via Frankfurter', 'Nager.Date'],
    meteoDa: personale ? 'open-meteo' : 'met-nasa'
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
  const limite = piuGiorni(oggi, 9);                             // MET Norway arriva a ~9-10 giorni
  if (dal <= limite) {
    const da = dal < oggi ? oggi : dal, a = al > limite ? limite : al;
    const tutti = await conCache(ctx, `met:${la},${lo}:${oggi}:${new Date().getUTCHours() >> 2}`, 3 * 3600, () => previsioniMet(la, lo));
    const giorni = tutti.filter(g => g.data >= da && g.data <= a);
    return giorni.length ? { tipo: 'previsione', giorni } : null;
  }
  // Troppo presto per le previsioni: gli stessi giorni dell'anno scorso (al massimo 14), da NASA POWER.
  const indietro = s => (Number(s.slice(0, 4)) - 1) + s.slice(4);
  const da = indietro(dal), a = indietro(giorniTra(dal, al) > 13 ? piuGiorni(dal, 13) : al);
  return conCache(ctx, `clima:${la},${lo}:${da}:${a}`, 30 * 86400, async () => {
    const j = await prendi(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN,PRECTOTCORR` +
      `&community=RE&latitude=${la}&longitude=${lo}&start=${da.replaceAll('-', '')}&end=${a.replaceAll('-', '')}&format=JSON`, { ms: 9000 });
    const p = (j.properties && j.properties.parameter) || {};
    const valori = k => Object.values(p[k] || {}).filter(x => x != null && x > -900);
    const media = v => v.length ? tondo(v.reduce((s, x) => s + x, 0) / v.length) : null;
    const pioggia = valori('PRECTOTCORR');
    return { tipo: 'clima', anno: Number(da.slice(0, 4)), giorni: pioggia.length,
      max: media(valori('T2M_MAX')), min: media(valori('T2M_MIN')),
      giorniPioggia: pioggia.filter(x => x >= 1).length };
  });
}

/* MET Norway (Istituto meteorologico norvegese): gratis anche per uso
   commerciale, licenza CC BY 4.0, chiede un User-Agent riconoscibile e di
   non interrogarlo più del necessario (per questo la cache di 3 ore).
   Restituisce dati ora per ora: qui diventano giorni con massima, minima,
   pioggia totale e il simbolo di metà giornata. */
async function previsioniMet(la, lo) {
  const j = await prendi(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${la}&lon=${lo}`);
  const fuso = Math.round(Number(lo) / 15);                      // ora locale approssimata
  const giorni = new Map();
  for (const x of (j.properties && j.properties.timeseries) || []) {
    const ora = new Date(Date.parse(x.time) + fuso * 3600e3);
    const data = ora.toISOString().slice(0, 10), h = ora.getUTCHours();
    const g = giorni.get(data) || { data, temp: [], mm: 0, simbolo: null, distanza: 99 };
    const d = x.data || {};
    const t = d.instant && d.instant.details && d.instant.details.air_temperature;
    if (t != null) g.temp.push(t);
    const p1 = d.next_1_hours, p6 = d.next_6_hours;
    if (p1) g.mm += (p1.details && p1.details.precipitation_amount) || 0;
    else if (p6) g.mm += (p6.details && p6.details.precipitation_amount) || 0;
    const sim = (p6 || p1) && (p6 || p1).summary && (p6 || p1).summary.symbol_code;
    if (sim && Math.abs(h - 12) < g.distanza) { g.simbolo = sim; g.distanza = Math.abs(h - 12); }
    giorni.set(data, g);
  }
  return [...giorni.values()].filter(g => g.temp.length >= 3).map(g => ({
    data: g.data, simbolo: g.simbolo, max: tondo(Math.max(...g.temp)), min: tondo(Math.min(...g.temp)),
    mm: Math.round(g.mm * 10) / 10
  }));
}

/* ---- Open-Meteo (modalità personale) ---- */
async function meteoOpenMeteo(ctx, la, lo, dal, al) {
  const oggi = oggiISO();
  if (al < oggi) return null;
  const limite = piuGiorni(oggi, 15);
  if (dal <= limite) {
    const da = dal < oggi ? oggi : dal, a = al > limite ? limite : al;
    return conCache(ctx, `om-prev:${la},${lo}:${da}:${a}:${oggi}:${new Date().getUTCHours() >> 2}`, 3 * 3600, async () => {
      const j = await prendi(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&timezone=auto` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,` +
        `wind_speed_10m_max,uv_index_max,sunrise,sunset&start_date=${da}&end_date=${a}`);
      const d = j.daily || {};
      const ora = s => s ? s.slice(11, 16) : null;
      return { tipo: 'previsione', fonte: 'open-meteo', giorni: (d.time || []).map((t, i) => ({
        data: t, codice: d.weather_code[i], max: tondo(d.temperature_2m_max[i]), min: tondo(d.temperature_2m_min[i]),
        pioggia: d.precipitation_probability_max[i], mm: d.precipitation_sum[i] == null ? null : Math.round(d.precipitation_sum[i] * 10) / 10,
        vento: tondo(d.wind_speed_10m_max[i]), uv: d.uv_index_max[i] == null ? null : Math.round(d.uv_index_max[i]),
        alba: ora(d.sunrise[i]), tramonto: ora(d.sunset[i])
      })) };
    });
  }
  // Più in là: media degli stessi giorni negli ultimi 5 anni (rianalisi ERA5).
  const lun = Math.min(giorniTra(dal, al), 13);
  const anni = [1, 2, 3, 4, 5].map(n => {
    const s = (Number(dal.slice(0, 4)) - n) + dal.slice(4);
    return [s, piuGiorni(s, lun)];
  });
  return conCache(ctx, `om-clima:${la},${lo}:${dal.slice(5)}:${lun}:${anni[0][0].slice(0, 4)}`, 30 * 86400, async () => {
    const serie = await Promise.all(anni.map(([da, a]) => prendi(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${la}&longitude=${lo}&timezone=auto` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&start_date=${da}&end_date=${a}`, { ms: 9000 })
      .then(j => j.daily || {}).catch(() => null)));
    const ok = serie.filter(Boolean);
    if (!ok.length) return null;
    const tutti = k => ok.flatMap(d => (d[k] || []).filter(x => x != null));
    const media = v => v.length ? tondo(v.reduce((s, x) => s + x, 0) / v.length) : null;
    const max = tutti('temperature_2m_max'), min = tutti('temperature_2m_min');
    const giorni = lun + 1;
    const pioggiaPerAnno = ok.map(d => (d.precipitation_sum || []).filter(x => x >= 1).length);
    return { tipo: 'clima', fonte: 'open-meteo', anni: ok.length, giorni,
      max: media(max), min: media(min), record: { max: tondo(Math.max(...max)), min: tondo(Math.min(...min)) },
      giorniPioggia: Math.round(pioggiaPerAnno.reduce((s, x) => s + x, 0) / ok.length) };
  });
}

const tondo = x => x == null ? null : Math.round(x);
