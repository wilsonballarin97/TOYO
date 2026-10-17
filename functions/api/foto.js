/* ==========================================================================
   GET /api/foto?q=Praga
   Fotografie vere di una città, da Wikipedia / Wikidata / Wikimedia Commons:
   - le immagini scelte da Wikidata per quel luogo (P18) vengono per prime;
   - poi le foto dell'articolo di Wikipedia, tenendo solo quelle orizzontali,
     grandi e che non sono mappe, bandiere, stemmi o loghi;
   - il banner di Wikivoyage (P948), largo e basso, a parte.
   Tutte hanno licenza libera (CC0, CC BY, CC BY-SA, pubblico dominio), che
   permette l'uso anche commerciale a patto di citare autore e licenza: per
   questo ogni foto arriva con `autore`, `licenza` e `pagina` (la scheda su
   Commons). La risposta resta in cache 30 giorni.
   ========================================================================== */
import { json, errore, prendi, conCache } from '../../lib/http.js';

const NO = /(map|mappa|karte|carte|plan\b|pianta|flag|bandiera|flagge|stemma|coat[_ ]of[_ ]arms|wappen|blason|logo|locator|location|lageplan|diagram|grafico|chart|svg|icon|signature|firma|seal)/i;

export async function onRequestGet({ request, waitUntil }) {
  const u = new URL(request.url);
  const q = (u.searchParams.get('q') || '').trim().replace(/\s+/g, ' ');
  if (!q || q.length > 80) return errore('q mancante o troppo lunga');
  const dati = await conCache({ waitUntil }, 'foto:' + q.toLowerCase(), 30 * 86400, () => cerca(q));
  return json(dati, 200, 'public, max-age=86400');
}

async function cerca(q) {
  let voce = null, lingua = 'it';
  for (const l of ['it', 'en']) {
    voce = await riassunto(l, q) || await riassunto(l, await primoRisultato(l, q));
    if (voce) { lingua = l; break; }
  }
  if (!voce) return { titolo: null, foto: [], banner: null };

  const [claims, articolo] = await Promise.all([
    voce.qid ? prendi(`https://www.wikidata.org/wiki/Special:EntityData/${voce.qid}.json`)
      .then(j => j.entities[voce.qid].claims).catch(() => ({})) : {},
    prendi(`https://${lingua}.wikipedia.org/w/api.php?action=query&format=json&generator=images&gimlimit=50` +
      `&titles=${encodeURIComponent(voce.titolo)}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1280` +
      `&iiextmetadatafilter=Artist|LicenseShortName`).then(j => Object.values((j.query && j.query.pages) || {})).catch(() => [])
  ]);
  const nomi = k => ((claims[k] || []).map(c => c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value).filter(Boolean));
  const p18 = nomi('P18').slice(0, 3), p948 = nomi('P948').slice(0, 1);
  const scelte = (p18.length || p948.length) ? await infoFile([...p18, ...p948]) : [];

  const foto = [], visti = new Set();
  const aggiungi = p => {
    const f = scheda(p);
    if (!f || visti.has(f.pagina) || foto.length >= 8) return;
    visti.add(f.pagina); foto.push(f);
  };
  scelte.filter(p => p18.includes(p.title.replace(/^File:/, ''))).forEach(p => aggiungi(p));
  articolo.filter(p => {
    const i = p.imageinfo && p.imageinfo[0];
    if (!i || i.mime !== 'image/jpeg' || NO.test(p.title) || i.width < 1000) return false;
    const r = i.width / i.height;
    return r >= 1.2 && r <= 2.4;
  }).forEach(aggiungi);
  const b = scelte.find(p => p948.includes(p.title.replace(/^File:/, '')));

  return { titolo: voce.titolo, wiki: `https://${lingua}.wikipedia.org/wiki/${encodeURIComponent(voce.titolo)}`,
    foto, banner: b ? scheda(b) : null };
}

async function riassunto(l, titolo) {
  if (!titolo) return null;
  try {
    const s = await prendi(`https://${l}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titolo)}`);
    if (s.type === 'disambiguation') return null;
    return { titolo: s.title, qid: s.wikibase_item };
  } catch { return null; }
}
async function primoRisultato(l, q) {
  try {
    const j = await prendi(`https://${l}.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=1&srsearch=${encodeURIComponent(q)}`);
    return j.query && j.query.search && j.query.search[0] && j.query.search[0].title;
  } catch { return null; }
}
async function infoFile(nomi) {
  const t = nomi.map(n => 'File:' + n).join('|');
  const j = await prendi(`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(t)}` +
    `&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1280&iiextmetadatafilter=Artist|LicenseShortName`).catch(() => null);
  return Object.values((j && j.query && j.query.pages) || {});
}

/* Una foto pronta per la pagina: indirizzi puliti, autore senza HTML. */
function scheda(p) {
  const i = p.imageinfo && p.imageinfo[0];
  if (!i || !i.thumburl) return null;
  const m = i.extmetadata || {};
  const pulisci = s => String(s || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 80);
  const via = s => s.split('?')[0];
  const url = via(i.thumburl);
  return {
    url, mini: url.replace(/\/(\d+)px-([^/]+)$/, '/640px-$2'),
    w: i.thumbwidth, h: i.thumbheight,
    autore: pulisci(m.Artist && m.Artist.value) || 'Autore sconosciuto',
    licenza: pulisci(m.LicenseShortName && m.LicenseShortName.value) || 'licenza libera',
    pagina: via(i.descriptionurl || '')
  };
}
