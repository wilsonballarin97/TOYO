/* ==========================================================================
   FOTO DELLE CITTÀ
   Ogni viaggio prende le foto vere della sua meta da /api/foto (Wikipedia,
   Wikidata, Wikimedia Commons). Servono a tre cose:
   - la copertina nelle schede dei viaggi e nella testata (al posto della
     foto del tema, che resta come segnaposto e come ripiego offline);
   - una galleria nella scheda "La meta";
   - i crediti: sono foto con licenza libera e chiedono autore e licenza
     visibili, quindi ogni foto li porta con sé.
   Le risposte restano nel browser 14 giorni, così le copertine compaiono
   subito anche senza rete.
   ========================================================================== */
const FOTO_KEY = 'toyo.foto-citta';
const FOTO_GIORNI = 14, FOTO_MAX = 40;
const fotoInVolo = new Map();
let fotoMem = null;

const cittaDi = t => {
  const d = (t && t.dove || '').trim();
  if(d) return d.split(/[,–—(]/)[0].trim();
  const p = ((t && t.tappe) || []).find(x => x.dove);
  return p ? p.dove.split(',')[0].trim() : '';
};

function fotoTutte(){
  if(fotoMem) return fotoMem;
  try{ fotoMem = JSON.parse(localStorage.getItem(FOTO_KEY) || '{}') || {}; }catch(e){ fotoMem = {}; }
  return fotoMem;
}
function fotoInCache(citta){
  const v = fotoTutte()[String(citta).toLowerCase()];
  return v && (Date.now() - v.t) < FOTO_GIORNI * 864e5 ? v.d : null;
}
function fotoSalva(citta, d){
  const tutte = fotoTutte();
  tutte[String(citta).toLowerCase()] = {t: Date.now(), d: {titolo: d.titolo, foto: (d.foto || []).slice(0, 8), banner: d.banner || null}};
  const chiavi = Object.keys(tutte).sort((a, b) => tutte[b].t - tutte[a].t);
  chiavi.slice(FOTO_MAX).forEach(k => delete tutte[k]);
  try{ localStorage.setItem(FOTO_KEY, JSON.stringify(tutte)); }catch(e){}
}

function fotoCitta(citta){
  if(!citta) return Promise.resolve(null);
  const c = fotoInCache(citta);
  if(c) return Promise.resolve(c);
  const k = citta.toLowerCase();
  if(!fotoInVolo.has(k)){
    fotoInVolo.set(k, fetch('/api/foto?q=' + encodeURIComponent(citta))
      .then(r => r.ok ? r.json() : null)
      .then(d => { if(d && d.titolo) fotoSalva(citta, d); return d && d.titolo ? fotoInCache(citta) : null; })
      .catch(() => null)
      .finally(() => setTimeout(() => fotoInVolo.delete(k), 60000)));
  }
  return fotoInVolo.get(k);
}

/* Dopo ogni render: le copertine ancora col segnaposto chiedono la loro foto. */
function applicaFotoCitta(){
  document.querySelectorAll('img[data-citta]:not([data-ok])').forEach(img => {
    img.dataset.ok = '1';
    fotoCitta(img.dataset.citta).then(d => {
      const f = d && d.foto && d.foto[0];
      if(!f || !img.isConnected) return;
      const nuova = new Image();
      nuova.onload = () => { img.src = nuova.src; img.title = 'Foto: ' + f.autore + ' · ' + f.licenza; };
      nuova.src = img.dataset.grande ? f.url : f.mini;
    });
  });
  const cred = $('tvCred'), t = V.view === 'trip' && viaggio();
  if(cred && t) fotoCitta(cittaDi(t)).then(d => {
    const f = d && d.foto && d.foto[0];
    if(!f || !cred.isConnected) return;
    cred.href = f.pagina; cred.textContent = '© ' + f.autore + ' · ' + f.licenza; cred.hidden = false;
  });
}

/* Galleria nella scheda "La meta". */
function galleriaCitta(citta){
  const box = $('metaFoto'); if(!box || !citta) return;
  fotoCitta(citta).then(d => {
    const b = $('metaFoto');
    if(!b || !d || !d.foto || d.foto.length < 2) return;
    b.innerHTML = '<div class="meta-tit">Foto di ' + esc(d.titolo) + '</div><div class="galleria">' +
      d.foto.map(f => '<a class="gal-f" href="' + esc(f.pagina) + '" target="_blank" rel="noopener" title="' + esc(f.autore + ' · ' + f.licenza) + '">' +
        '<img src="' + esc(f.mini) + '" alt="" loading="lazy" decoding="async">' +
        '<span class="gal-c">© ' + esc(f.autore) + ' · ' + esc(f.licenza) + '</span></a>').join('') +
      '</div><div class="meta-nota">Foto da Wikimedia Commons con licenza libera: tocca una foto per autore e licenza completi.</div>';
    b.hidden = false;
  });
}
