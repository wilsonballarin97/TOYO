/* ==========================================================================
   LA META · meteo, paese, cambio e festività nella panoramica del viaggio
   I dati arrivano da /api/info (Cloudflare), che mette insieme OpenStreetMap,
   Open-Meteo, BCE e Nager.Date. La scheda si disegna vuota insieme al resto
   e si riempie appena arriva la risposta; le risposte restano in memoria per
   la sessione, così cambiare scheda e tornare non rifà le domande.
   ========================================================================== */
const infoCache = new Map();

/* Dove guardare: il primo punto dell'itinerario che ha una posizione;
   se non ce n'è nessuno, si cerca il nome della meta del viaggio. */
function puntoMeta(t){
  const conPos = (t.tappe || []).filter(x => x.lat && x.lon)
    .sort((a, b) => (a.dal || '9999') < (b.dal || '9999') ? -1 : 1);
  return conPos[0] ? {lat:conPos[0].lat, lon:conPos[0].lon, nome:conPos[0].dove || conPos[0].nome} : null;
}

function cardMeta(t){
  if(!t.dove && !puntoMeta(t)) return '';
  return `<div class="card meta-card" id="metaCard">
    <div class="card-h"><div><h3>La meta</h3><div class="sub" id="metaSub">${esc(t.dove || '')}</div></div></div>
    <div class="card-b" id="metaBody"><div class="meta-wait">Guardo meteo e informazioni utili…</div></div>
  </div>`;
}

async function riempiMeta(t){
  const box = $('metaBody'); if(!box) return;
  try{
    let p = puntoMeta(t);
    if(!p && t.dove){
      const k = 'geo:' + t.dove;
      if(!infoCache.has(k)){
        const r = await fetch('/api/geocode?format=json&limit=1&accept-language=it&q=' + encodeURIComponent(t.dove));
        const j = r.ok ? await r.json() : [];
        infoCache.set(k, j[0] ? {lat:+j[0].lat, lon:+j[0].lon, nome:t.dove} : null);
      }
      p = infoCache.get(k);
    }
    if(!p){ box.innerHTML = '<div class="meta-wait">Non trovo la meta sulla mappa: aggiungi un punto all\'itinerario con la posizione.</div>'; return; }
    const q = 'lat=' + (+p.lat).toFixed(3) + '&lon=' + (+p.lon).toFixed(3) +
              (t.dal ? '&dal=' + t.dal + '&al=' + (t.al || t.dal) : '');
    if(!infoCache.has(q)){
      const r = await fetch('/api/info?' + q);
      if(!r.ok) throw new Error('info ' + r.status);
      infoCache.set(q, await r.json());
    }
    const b = $('metaBody'); if(!b) return;     // l'utente è già andato altrove
    b.innerHTML = htmlMeta(infoCache.get(q), t);
    const sub = $('metaSub'); if(sub && p.nome) sub.textContent = p.nome;
  }catch(e){
    const b = $('metaBody');
    if(b) b.innerHTML = '<div class="meta-wait">' + (navigator.onLine ? 'Le informazioni sulla meta non sono disponibili adesso.' : 'Senza rete: meteo e cambi tornano quando sei di nuovo online.') + '</div>';
  }
}

const METEO = [
  [0,'☀️','Sereno'],[1,'🌤️','Quasi sereno'],[2,'⛅','Poco nuvoloso'],[3,'☁️','Coperto'],
  [45,'🌫️','Nebbia'],[48,'🌫️','Nebbia'],[51,'🌦️','Pioviggine'],[53,'🌦️','Pioviggine'],[55,'🌦️','Pioviggine'],
  [61,'🌧️','Pioggia debole'],[63,'🌧️','Pioggia'],[65,'🌧️','Pioggia forte'],[66,'🌧️','Pioggia gelata'],[67,'🌧️','Pioggia gelata'],
  [71,'🌨️','Neve debole'],[73,'🌨️','Neve'],[75,'❄️','Neve forte'],[77,'🌨️','Nevischio'],
  [80,'🌦️','Rovesci'],[81,'🌧️','Rovesci'],[82,'⛈️','Rovesci forti'],[85,'🌨️','Rovesci di neve'],[86,'❄️','Rovesci di neve'],
  [95,'⛈️','Temporale'],[96,'⛈️','Temporale con grandine'],[99,'⛈️','Temporale con grandine']
];
const meteoDi = c => (METEO.find(x => x[0] === c) || [c,'🌡️','—']);
const giornoCorto = iso => new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', {weekday:'short', day:'numeric'});

function htmlMeta(d, t){
  const parti = [];
  const m = d.meteo;
  if(m && m.tipo === 'previsione' && m.giorni.length){
    parti.push('<div class="meta-sez"><div class="meta-tit">Previsioni</div><div class="meta-giorni">' +
      m.giorni.slice(0, 8).map(g => { const w = meteoDi(g.codice);
        return '<div class="meta-g" title="' + esc(w[2]) + '"><span class="d">' + esc(giornoCorto(g.data)) + '</span>' +
          '<span class="e" aria-label="' + esc(w[2]) + '">' + w[1] + '</span>' +
          '<span class="t"><b>' + g.max + '°</b> ' + g.min + '°</span>' +
          (g.pioggia >= 30 ? '<span class="p">' + g.pioggia + '%</span>' : '') + '</div>'; }).join('') +
      '</div>' + (m.giorni.length > 8 ? '<div class="meta-nota">Altri ' + (m.giorni.length - 8) + ' giorni nelle previsioni.</div>' : '') + '</div>');
  } else if(m && m.tipo === 'clima' && m.max != null){
    parti.push('<div class="meta-sez"><div class="meta-tit">Che tempo aspettarsi</div>' +
      '<div class="meta-clima"><b>' + m.max + '°</b> di giorno, <b>' + m.min + '°</b> di notte · ' +
      (m.giorniPioggia ? m.giorniPioggia + ' su ' + m.giorni + ' giorni di pioggia' : 'niente pioggia') + '</div>' +
      '<div class="meta-nota">Com\'era negli stessi giorni del ' + m.anno + '. Le previsioni vere arrivano 15 giorni prima della partenza.</div></div>');
  }
  if(d.festivita && d.festivita.length){
    parti.push('<div class="meta-sez"><div class="meta-tit">Festività durante il viaggio</div>' +
      d.festivita.map(f => '<div class="meta-riga"><span>' + esc(new Date(f.data + 'T12:00:00').toLocaleDateString('it-IT', {weekday:'short', day:'numeric', month:'short'})) + '</span><span>' + esc(f.locale || f.nome) +
        (f.locale && f.nome && f.locale !== f.nome ? ' <span class="meta-nota">(' + esc(f.nome) + ')</span>' : '') + '</span></div>').join('') +
      '<div class="meta-nota">Negozi, musei e trasporti possono avere orari ridotti.</div></div>');
  }
  const p = d.paese;
  if(p){
    const righe = [];
    if(p.valuta) righe.push(['Valuta', p.valuta === 'EUR' ? 'Euro, come a casa' :
      esc(p.valuta) + (d.cambio && d.cambio.eur ? ' · 1 € = ' + d.cambio.eur.toLocaleString('it-IT', {maximumFractionDigits: d.cambio.eur < 10 ? 3 : 1}) + ' ' + esc(p.valuta) : '')]);
    if(p.prese) righe.push(['Prese', 'tipo ' + esc(p.prese) + (p.volt ? ' · ' + p.volt + ' V' : '') +
      (/\b[CEFL]\b/.test(p.prese) ? '' : ' · <b>serve un adattatore</b>')]);
    if(p.guida === 'sx') righe.push(['Guida', '<b>a sinistra</b>']);
    if(p.emergenza) righe.push(['Emergenze', esc(p.emergenza)]);
    parti.push('<div class="meta-sez"><div class="meta-tit">' + esc(p.nome || p.cc) + '</div>' +
      righe.map(r => '<div class="meta-riga"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>').join('') +
      (p.cc !== 'IT' ? '<a class="meta-link" href="https://www.viaggiaresicuri.it/" target="_blank" rel="noopener">Avvisi della Farnesina su Viaggiare Sicuri ↗</a>' : '') +
      '</div>');
  }
  if(!parti.length) return '<div class="meta-wait">Nessuna informazione utile per queste date.</div>';
  return parti.join('') + '<div class="meta-fonti">Meteo Open-Meteo · cambi BCE · festività Nager.Date · © OpenStreetMap</div>';
}
