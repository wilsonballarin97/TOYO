/* ==========================================================================
   GET /api/tratta?da=41.9029,12.4964&a=41.8902,12.4922&quando=2026-10-20T10:00&fuso=%2B02:00
   Come andare da un punto all'altro coi mezzi pubblici, con linee e orari
   veri: lo calcola Transitous (transitous.org), il motore di percorsi aperto
   che copre i trasporti pubblici di tutta Europa e oltre.

   Condizioni d'uso di Transitous: solo progetti non commerciali e open
   source, uso leggero, User-Agent riconoscibile, citare la fonte. Per questo:
   - con TOYO_USO=commerciale questa API risponde 403 e l'app non la mostra;
   - le risposte restano in cache 15 minuti, così lo stesso tragitto chiesto
     da tutto il gruppo esce una volta sola;
   - l'app mostra "Percorsi: Transitous" con il link alle fonti.
   ========================================================================== */
import { json, errore, prendi, conCache } from '../../lib/http.js';

const COORD = /^-?\d{1,2}(\.\d+)?,-?\d{1,3}(\.\d+)?$/;
const MEZZO = { BUS: 'bus', COACH: 'pullman', TRAM: 'tram', SUBWAY: 'metro', METRO: 'metro', RAIL: 'treno',
  REGIONAL_RAIL: 'treno', REGIONAL_FAST_RAIL: 'treno', HIGHSPEED_RAIL: 'alta velocità', LONG_DISTANCE: 'treno',
  NIGHT_RAIL: 'treno notte', SUBURBAN: 'treno suburbano', FERRY: 'traghetto', AIRPLANE: 'aereo',
  FUNICULAR: 'funicolare', AERIAL_LIFT: 'funivia', CABLE_CAR: 'funivia', ODM: 'a chiamata', OTHER: 'mezzo' };

export async function onRequestGet({ request, waitUntil, env }) {
  if ((env && env.TOYO_USO) === 'commerciale') return errore('Percorsi coi mezzi non disponibili in questa versione', 403);
  const u = new URL(request.url);
  const da = u.searchParams.get('da') || '', a = u.searchParams.get('a') || '';
  const quando = u.searchParams.get('quando') || '';
  const fuso = u.searchParams.get('fuso') || '+00:00';
  if (!COORD.test(da) || !COORD.test(a)) return errore('da/a devono essere "lat,lon"');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(quando)) return errore('quando deve essere AAAA-MM-GGThh:mm');
  if (!/^[+-]\d{2}:\d{2}$/.test(fuso)) return errore('fuso non valido');

  const tondo = s => s.split(',').map(x => Number(x).toFixed(4)).join(',');
  const ora = new Date(quando + ':00' + fuso);
  if (isNaN(ora)) return errore('data non valida');
  const blocco = Math.floor(ora.getTime() / 9e5);   // finestre di 15 minuti per la cache
  const dati = await conCache({ waitUntil }, `tratta:${tondo(da)}:${tondo(a)}:${blocco}`, 900, async () => {
    const j = await prendi(`https://api.transitous.org/api/v5/plan?fromPlace=${tondo(da)}&toPlace=${tondo(a)}` +
      `&time=${encodeURIComponent(new Date(blocco * 9e5).toISOString())}`, { ms: 9000 });
    return riassumi(j);
  });
  return json(dati, 200, 'public, max-age=300');
}

/* Da centinaia di righe di Transitous a quello che serve per decidere:
   le prime 3 soluzioni con partenza, arrivo, durata, cambi e le linee. */
function riassumi(j) {
  const its = (j.itineraries || []).slice(0, 6);
  const tz = its.flatMap(i => i.legs || []).map(l => l.from && l.from.tz).find(Boolean) || 'UTC';
  const hm = iso => new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date(iso));
  const soluzioni = its.map(i => {
    const legs = i.legs || [];
    const mezzi = legs.filter(l => l.mode !== 'WALK');
    return {
      parte: hm(i.startTime), arriva: hm(i.endTime), minuti: Math.round(i.duration / 60), cambi: i.transfers || 0,
      piedi: Math.round(legs.filter(l => l.mode === 'WALK').reduce((s, l) => s + (l.duration || 0), 0) / 60),
      tratti: mezzi.map(l => ({
        mezzo: MEZZO[l.mode] || 'mezzo', linea: l.routeShortName || l.routeLongName || '',
        colore: /^[0-9a-f]{6}$/i.test(l.routeColor || '') ? '#' + l.routeColor : null,
        verso: l.headsign || '', da: (l.from && l.from.name) || '', a: (l.to && l.to.name) || '',
        parte: hm(l.startTime), operatore: l.agencyName || ''
      }))
    };
  }).filter(s => s.tratti.length);
  // Le 3 che partono prima, con segnata la più veloce.
  const scelte = soluzioni.slice(0, 3);
  const minimo = Math.min(...scelte.map(s => s.minuti));
  scelte.forEach(s => { s.veloce = s.minuti === minimo && scelte.length > 1; });
  return { soluzioni: scelte, fuso: tz, fonte: 'Transitous', fonti: 'https://transitous.org/sources/' };
}
