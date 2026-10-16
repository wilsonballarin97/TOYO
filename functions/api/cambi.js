/* GET /api/cambi?a=CZK,USD  → { base:'EUR', data, tassi:{CZK:24.3,...} }
   Cambi ufficiali BCE del giorno (via Frankfurter), in cache 6 ore.
   Pronti per le spese in più valute. */
import { json, errore, prendi, conCache, oggiISO } from '../../lib/http.js';

export async function onRequestGet({ request, waitUntil }) {
  const a = (new URL(request.url).searchParams.get('a') || '').toUpperCase();
  if (!/^[A-Z]{3}(,[A-Z]{3}){0,29}$/.test(a)) return errore('a= serve una lista di codici valuta, es. a=CZK,USD');
  const dati = await conCache({ waitUntil }, `cambi:${a}:${oggiISO()}`, 6 * 3600, async () => {
    const j = await prendi(`https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${a}`);
    return { base: 'EUR', data: j.date, tassi: j.rates || {} };
  });
  return json(dati, 200, 'public, max-age=3600');
}
