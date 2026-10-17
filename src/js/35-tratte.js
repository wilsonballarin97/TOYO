/* ==========================================================================
   ORARI DEI MEZZI FRA DUE PUNTI DELL'ITINERARIO
   Sotto ogni tratta c'è "orari": apre, lì sotto, le prossime soluzioni coi
   mezzi pubblici (linee, cambi, a che ora si parte) calcolate da Transitous
   tramite /api/tratta. L'orario di partenza è quello del punto da cui si
   parte, se ha data e ora; altrimenti adesso.
   Solo in modalità personale: Transitous non si può usare a fini commerciali.
   ========================================================================== */
const trattePerUso = () => TOYO_USO !== 'commerciale';
const trattaCache = new Map();

function quandoParti(a){
  const oggi = new Date();
  const pad = n => String(n).padStart(2, '0');
  const giorno = a.dal && a.dal >= oggi.toISOString().slice(0, 10) ? a.dal
    : oggi.getFullYear() + '-' + pad(oggi.getMonth() + 1) + '-' + pad(oggi.getDate());
  const ora = /^\d{2}:\d{2}$/.test(a.ora || '') ? a.ora
    : (giorno === a.dal ? '10:00' : pad(oggi.getHours()) + ':' + pad(oggi.getMinutes()));
  // Fuso: quello del telefono. Per un viaggio in un altro fuso gli orari si spostano di qualche ora.
  const m = -new Date(giorno + 'T' + ora).getTimezoneOffset();
  const fuso = (m >= 0 ? '+' : '-') + pad(Math.floor(Math.abs(m) / 60)) + ':' + pad(Math.abs(m) % 60);
  return {quando: giorno + 'T' + ora, fuso, etichetta: (giorno === a.dal ? fmtDate(giorno) + ' ' : 'oggi ') + 'dalle ' + ora};
}

function linkOrari(a, b){
  if(!trattePerUso() || !(a && b && a.lat && b.lat)) return '';
  return '<button type="button" class="orari-btn" data-orari="' + esc(a.id) + '|' + esc(b.id) + '">orari</button>';
}

document.addEventListener('click', async e => {
  const btn = e.target.closest('[data-orari]');
  if(!btn) return;
  e.preventDefault(); e.stopPropagation();
  const riga = btn.closest('.spost');
  const vecchio = riga && riga.nextElementSibling;
  if(vecchio && vecchio.classList.contains('orari-box')){ vecchio.remove(); return; }
  const t = viaggio(); if(!t) return;
  const [ida, idb] = btn.dataset.orari.split('|');
  const a = t.tappe.find(x => x.id === ida), b = t.tappe.find(x => x.id === idb);
  if(!a || !b) return;
  const box = document.createElement('div');
  box.className = 'orari-box';
  box.innerHTML = '<div class="meta-wait">Cerco i mezzi…</div>';
  riga.after(box);
  const q = quandoParti(a);
  const url = '/api/tratta?da=' + a.lat + ',' + a.lon + '&a=' + b.lat + ',' + b.lon +
              '&quando=' + q.quando + '&fuso=' + encodeURIComponent(q.fuso);
  try{
    if(!trattaCache.has(url)){
      const r = await fetch(url);
      if(!r.ok) throw new Error(r.status);
      trattaCache.set(url, await r.json());
    }
    box.innerHTML = htmlOrari(trattaCache.get(url), q, a, b);
  }catch(err){
    box.innerHTML = '<div class="meta-wait">' + (navigator.onLine ? 'Orari non disponibili adesso.' : 'Senza rete gli orari non arrivano.') +
      ' <a href="' + esc(gmTratta(a, b, 'transit')) + '" target="_blank" rel="noopener">Apri in Google Maps</a></div>';
  }
}, true);

function htmlOrari(d, q, a, b){
  const sol = (d && d.soluzioni) || [];
  if(!sol.length) return '<div class="meta-wait">Nessun mezzo pubblico utile ' + esc(q.etichetta) + ': meglio a piedi o in auto. ' +
    '<a href="' + esc(gmTratta(a, b, 'transit')) + '" target="_blank" rel="noopener">Controlla su Google Maps</a></div>';
  return '<div class="orari-tit">Coi mezzi, ' + esc(q.etichetta) + '</div>' +
    sol.map(s => '<div class="orari-sol">' +
      '<div class="orari-h"><b>' + esc(s.parte) + ' → ' + esc(s.arriva) + '</b><span>' + s.minuti + ' min' +
        (s.cambi ? ' · ' + s.cambi + (s.cambi === 1 ? ' cambio' : ' cambi') : ' · diretto') +
        (s.piedi ? ' · ' + s.piedi + ' min a piedi' : '') + '</span>' + (s.veloce ? '<span class="pill">più veloce</span>' : '') + '</div>' +
      '<div class="orari-tr">' + s.tratti.map(x =>
        '<span class="linea"' + (x.colore ? ' style="--c:' + esc(x.colore) + '"' : '') + ' title="' +
          esc(x.operatore + (x.verso ? ' · direzione ' + x.verso : '')) + '">' + esc(x.mezzo) + (x.linea ? ' <b>' + esc(x.linea) + '</b>' : '') + '</span>' +
        '<span class="fermata">' + esc(x.parte) + ' da ' + esc(x.da) + (x.verso ? ' → ' + esc(x.verso) : '') + '</span>').join('') +
      '</div></div>').join('') +
    '<div class="meta-fonti">Percorsi: <a href="' + esc(d.fonti) + '" target="_blank" rel="noopener">Transitous</a> · © OpenStreetMap · orari indicativi, verifica prima di partire</div>';
}
