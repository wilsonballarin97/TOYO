/* ==========================================================================
   VIAGGIO
   ========================================================================== */
const TABS = [
  {id:'panoramica',   n:'Panoramica'},
  {id:'itinerario',   n:'Itinerario'},
  {id:'prenotazioni', n:'Prenotazioni'},
  {id:'persone',    n:'Persone'},
  {id:'soldi',      n:'Spese e quote'},
  {id:'decisioni',  n:'Decisioni'},
  {id:'documenti',  n:'Documenti'},
  {id:'dafare',     n:'Da fare'}
];

function viewTrip(t){
  const s = statoViaggio(t);
  const gg = giorniA(t.dal);
  const d = durata(t.dal, t.al);
  const body = {
    panoramica: tabPanoramica, itinerario: tabItinerario, prenotazioni: tabPrenotazioni,
    persone: tabPersone, soldi: tabSoldi, decisioni: tabDecisioni,
    documenti: tabDocumenti, dafare: tabDaFare
  }[V.tab] || tabPanoramica;

  return `
  <button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-act="nav" data-view="hub">← Tutti i viaggi</button>

  <!-- La testata del viaggio, rifatta come la scheda di un soggiorno su
       Airbnb: immagine in cima, titolo, una riga di contesto, un filetto, e
       in fondo CHI c'e' insieme a te e l'azione principale.
       Prima era una fascia scura con dentro quattro numeri e quattro
       pulsanti tutti uguali: diceva molto e non guidava a niente. Qui il
       primo sguardo cade sul nome del viaggio, il secondo sulle facce. -->
  <section class="tviaggio">
    <div class="tv-img">${scenaViaggio(t.tema)}
      ${gg != null && gg >= 0 ? '<span class="tv-gg"><b class="num">' + gg + '</b>' + (gg === 1 ? 'giorno' : 'giorni') + '</span>' : ''}
    </div>
    <div class="tv-tx">
      <h1>${esc(t.emoji)} ${esc(t.nome)}</h1>
      <div class="tv-meta">${fmtRange(t.dal, t.al)}${t.dove ? ' · ' + esc(t.dove) : ''} · ${t.mio ? 'Organizzi tu' : 'Organizza @' + esc(t.organizzatore || 'chi ti ha invitato')}</div>
      <div class="tv-num">
        <span><b class="num">${t.tappe.length}</b> ${t.tappe.length === 1 ? 'punto' : 'punti'}</span>
        <span><b class="num">${(t.prenotazioni||[]).length}</b> ${(t.prenotazioni||[]).length === 1 ? 'prenotazione' : 'prenotazioni'}</span>
        ${s.totSpese ? '<span><b class="num">' + eur(s.totSpese) + '</b> di spese</span>' : ''}
        ${s.todoAperti ? '<span class="urg"><b class="num">' + s.todoAperti + '</b> da fare</span>' : ''}
      </div>
    </div>
    <div class="tv-piede">
      ${(() => {
        const teste = rosterSpese(t).filter(x => x.id !== 'org').slice(0, 4);
        const extra = Math.max(0, t.gente.length - teste.length);
        return teste.length
          ? '<span class="teste">' + teste.map(x =>
              '<span class="testa" style="background:' + coloreDa(x.nome) + '">' + esc(iniz(x.nome, '')) + '</span>').join('') +
            (extra ? '<span class="testa piu">+' + extra + '</span>' : '') + '</span>'
          : '<span class="tv-soli">Ancora nessuno</span>';
      })()}
      <span class="tv-az">
        ${posso(t)
          ? '<button class="btn btn-ghost btn-sm" data-act="edit-trip" data-id="' + esc(t.id) + '">Modifica</button>' +
            '<button class="btn btn-primary btn-sm" data-act="invita">' + ico('personaPiu',16) + '<span>Invita</span></button>'
          : '<button class="btn btn-primary btn-sm" data-act="tab" data-tab="documenti">' + ico('tessera',16) + '<span>I tuoi documenti</span></button>'}
      </span>
    </div>
  </section>

  ${!posso(t) ? `
  <div class="card" style="border-left:3px solid var(--blue)">
    <div class="card-b" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:13px 15px">
      <span>${ico('lente',19)}</span>
      <div style="flex:1;min-width:220px">
        <div style="font-weight:650;font-size:13.5px">Stai guardando un viaggio organizzato da altri</div>
        <div style="font-size:12px;color:var(--ink-3)">Puoi consultare tutto. Quello che gestisci tu: i tuoi documenti e la tua quota.</div>
      </div>
      <button class="btn btn-ghost btn-sm" data-act="tab" data-tab="documenti">I tuoi documenti</button>
    </div>
  </div>` : ''}
  ${archiviato(t) ? `
  <div class="card" style="border-left:3px solid var(--ink-3)">
    <div class="card-b" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:13px 15px">
      <span style="font-size:19px"><svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.6L12 3.4l8.5 4.2v8.8L12 20.6l-8.5-4.2z"/><path d="M3.5 7.6L12 11.8l8.5-4.2M12 11.8v8.8"/></svg></span>
      <div style="flex:1;min-width:200px">
        <div style="font-weight:650;font-size:13.5px">Viaggio in archivio</div>
        <div style="font-size:12px;color:var(--ink-3)">${t.al && giorniA(t.al) < 0 ? 'Archiviato da solo perché è finito il ' + fmtDate(t.al) + '.' : 'L\'hai messo da parte tu.'} Resta tutto consultabile.</div>
      </div>
      ${posso(t) ? '<button class="btn btn-ghost btn-sm" data-act="ripristina" data-id="' + esc(t.id) + '">Riprendilo</button>' : ''}
    </div>
  </div>` : ''}

  <div class="tabs">
    ${TABS.map(x => `<button class="${V.tab === x.id ? 'on' : ''}" data-act="tab" data-tab="${esc(x.id)}">${x.n}${
      x.id === 'dafare' && s.todoAperti ? '<span class="b">' + s.todoAperti + '</span>' : ''}${
      x.id === 'prenotazioni' && s.prenAperte ? '<span class="b">' + s.prenAperte + '</span>' : ''}</button>`).join('')}
  </div>

  ${body(t, s)}`;
}

/* ---------- PANORAMICA ---------- */
function tabPanoramica(t, s){
  const prossime = t.tappe.slice().sort((a,b) => (a.dal||'9999') < (b.dal||'9999') ? -1 : 1).slice(0,4);
  const todo = t.todo.filter(x => !x.fatto).slice(0,4);
  const org = t.mio;
  return `
  <div class="split">
    <div class="col">
      <div class="card">
        <div class="card-h"><div><h3>Cosa manca</h3><div class="sub">${t.todo.length ? s.todoAperti + ' aperte su ' + t.todo.length : 'Le cose da non dimenticare'}</div></div>
          ${posso(t) ? `<div class="rt"><button class="btn btn-ghost btn-sm" data-act="lista-pronta"><svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.8l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 10l5.9-.8z"/></svg> Lista pronta</button>
            <button class="btn btn-ghost btn-sm" data-act="new-todo">＋ Aggiungi</button></div>` : ''}</div>
        ${todo.length ? '<div class="card-b tight"><div class="rows">' + todo.map(x => rigaTodo(t, x)).join('') + '</div></div>'
          : `<div class="card-b" style="text-align:center;padding:20px 16px">
              <div style="font-size:12.5px;color:var(--ink-3);max-width:360px;margin:0 auto 12px">
                ${t.todo.length ? 'Tutto fatto: non è rimasto niente in sospeso.' : 'Parti dalla lista pronta — voli, alloggio, documenti, assicurazione, quote, check-in — e togli quello che non ti serve.'}</div>
              ${t.todo.length ? '' : '<button class="btn btn-primary btn-sm" data-act="lista-pronta"><svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.8l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 10l5.9-.8z"/></svg> Usa la lista pronta</button>'}
             </div>`}
      </div>

      <div class="card">
        <div class="card-h"><div><h3>Itinerario</h3><div class="sub">${t.tappe.length ? t.tappe.length + (t.tappe.length===1?' punto':' punti') : 'Ancora nessun punto'}</div></div>
          ${posso(t) ? '<div class="rt"><button class="btn btn-ghost btn-sm" data-act="new-tappa">＋ Punto</button></div>' : ''}</div>
        ${prossime.length ? `<div class="card-b"><div class="tl">${prossime.map((x,i) => {
          const tp = tipoTappa(x.tipo);
          return `<div class="tle ${i===0?'next':''}">
            <div class="d">${x.dal ? fmtRange(x.dal, x.al || x.dal) : 'data da definire'}</div>
            <div class="t">${tp.ic} ${esc(x.dove || x.nome)}</div>
            <div class="m">${tp.n}${x.lat ? ' · <a href="' + gmDir(x) + '" target="_blank" rel="noopener" style="color:var(--terracotta);font-weight:650">indicazioni</a>' : ''}</div>
          </div>`;
        }).join('')}</div></div>`
        : vuoto('mappa','Itinerario ancora vuoto','Aggiungi hotel, aeroporti e tappe: li vedi sulla mappa uniti in un percorso.')}
      </div>
    </div>

    <div class="col col-side">
      <div class="card">
        <div class="card-h"><div><h3>${org ? 'Come vanno i soldi' : 'La tua quota'}</h3></div></div>
        <div class="card-b">
          ${org ? `
            <div class="rows">
              <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Quote incassate</span></span>
                <span class="rt"><span class="v num" style="color:var(--sage)">${eur(s.incassato)}</span></span></div>
              <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Ancora da incassare</span></span>
                <span class="rt"><span class="v num">${eur(Math.max(0, s.atteso - s.incassato))}</span></span></div>
              <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Speso finora</span></span>
                <span class="rt"><span class="v num" style="color:var(--terracotta)">${eur(s.speso)}</span></span></div>
              <div class="row" style="padding:10px 2px;border-top:2px solid var(--line-strong)">
                <span class="tx"><span class="t">In cassa adesso</span></span>
                <span class="rt"><span class="v num" style="font-size:16px;color:${s.cassa>=0?'var(--sage)':'var(--red)'}">${eur(s.cassa)}</span></span></div>
            </div>`
          : `
            <div style="text-align:center;padding:6px 0 10px">
              <div style="font-size:30px;font-weight:700;letter-spacing:-.035em" class="num">${eur(Math.max(0, num(t.quota) - s.mioVersato))}</div>
              <div style="font-size:12px;color:var(--ink-3);margin-top:3px">${num(t.quota) ? 'da versare su ' + eur(t.quota) : 'quota non impostata'}</div>
            </div>
            <button class="btn btn-ghost btn-full btn-sm" data-act="mia-quota">Aggiorna quanto hai versato</button>`}
        </div>
      </div>

      <div class="card">
        <div class="card-h"><div><h3>Documenti del viaggio</h3><div class="sub">${t.docs.length ? t.docs.length + ' allegati' : 'Nessun allegato'}</div></div>
          <div class="rt"><button class="btn btn-ghost btn-sm" data-act="tab" data-tab="documenti">Apri</button></div></div>
        ${t.docs.length ? '<div class="card-b tight">' + t.docs.slice(0,3).map(d => rigaDoc(d, 'trip')).join('') + '</div>'
          : vuoto('graffetta','Nessun allegato','Biglietti, prenotazioni, polizze: tienili qui, li ritrovi anche offline.')}
      </div>

      ${t.note ? `<div class="card"><div class="card-h"><div><h3>Note</h3></div></div>
        <div class="card-b" style="font-size:13px;color:var(--ink-2);white-space:pre-wrap">${esc(t.note)}</div></div>` : ''}

      <!-- Il viaggio deve esistere anche fuori dall'app: su carta e nel
           calendario del telefono, che funzionano sempre. -->
      <div class="card">
        <div class="card-h"><div><h3>Porta il viaggio con te</h3>
          <div class="sub">Una copia da stampare e le date nel calendario</div></div></div>
        <div class="card-b" style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" data-act="stampa-viaggio">${ico('fatture',15)} Stampa o salva in PDF</button>
          <button class="btn btn-ghost btn-sm" data-act="ics-viaggio">${ico('calendario',15)} Aggiungi al calendario</button>
        </div>
      </div>


      ${posso(t) ? `
      <!-- ⚠️ Eliminare un viaggio si poteva già, ma il pulsante stava in fondo
           alla finestra "Modifica viaggio": nessuno lo trovava, e archiviare
           sembrava l'unico modo di far sparire qualcosa. Le due cose sono
           diverse e vanno dette insieme, con la differenza scritta. -->
      <div class="card" style="border-color:var(--line-strong)">
        <div class="card-h"><div><h3>Chiudere questo viaggio</h3>
          <div class="sub">Due strade, e non sono la stessa cosa</div></div></div>
        <div class="card-b tight"><div class="rows">
          <div class="row" style="padding:12px 8px">
            <span class="ic">${ico('archivio',15)}</span>
            <span class="tx"><span class="t">${archiviato(t) ? 'Riprendi dall\'archivio' : 'Metti in archivio'}</span>
              <span class="m">${archiviato(t) ? 'Torna fra i viaggi in corso.' : 'Esce dall\'elenco ma resta tutto: tappe, spese, documenti. Si può riprendere quando vuoi.'}</span></span>
            <span class="rt"><button class="btn btn-ghost btn-sm" data-act="${archiviato(t) ? 'ripristina' : 'archivia'}" data-id="${esc(t.id)}">
              ${archiviato(t) ? 'Riprendi' : 'Archivia'}</button></span>
          </div>
          <div class="row" style="padding:12px 8px">
            <span class="ic" style="background:var(--red-soft);border-color:var(--red-soft);color:var(--red)">${ico('cestino',15)}</span>
            <span class="tx"><span class="t">Elimina il viaggio</span>
              <span class="m">Spariscono tappe, prenotazioni, spese e documenti allegati${t.condiviso || t.coorg ? ', anche per chi partecipa' : ''}. Non si torna indietro.</span></span>
            <span class="rt"><button class="btn btn-danger btn-sm" data-act="del-trip" data-id="${esc(t.id)}">Elimina</button></span>
          </div>
        </div></div>
      </div>` : ''}
    </div>
  </div>`;
}

/* ---------- ITINERARIO ----------
   Le tappe non sono più un elenco unico: si leggono per giornata
   ("Giorno 1 · sab 12 lug"), in ordine di orario, con lo spostamento
   stimato fra un punto e il successivo. */
function cmpTappa(a, b){
  const k = x => (x.dal || '9999-99-99') + '|' + String(x.ord != null ? 100 + Number(x.ord) : 999) +
                 '|' + (x.ora || '99:99');
  return k(a) < k(b) ? -1 : (k(a) > k(b) ? 1 : 0);
}
/* distanza in chilometri fra due punti con coordinate (formula dell'emisenoverso) */
function kmFra(a, b){
  if(!a || !b || !a.lat || !b.lat) return null;
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const s = Math.sin(dLat/2) ** 2 +
            Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon/2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}
/* stima onesta e dichiarata: a piedi sotto il chilometro e mezzo, altrimenti su strada */
function spostamento(a, b){
  const km = kmFra(a, b);
  if(km == null || km < 0.05) return null;
  const piedi = km < 1.5;
  const min = Math.round(piedi ? (km / 4.8) * 60 : (km / 45) * 60 * 1.25);
  const dist = km < 10 ? (Math.round(km * 10) / 10).toString().replace('.', ',') + ' km' : Math.round(km) + ' km';
  const tempo = min < 60 ? min + ' min' : Math.floor(min/60) + ' h' + (min % 60 ? ' ' + (min % 60) : '');
  return {km, dist, tempo, come: piedi ? 'a piedi' : 'in auto', ico: piedi ? 'persone' : 'auto'};
}
/* raggruppa le tappe per data: [{data, n, lista}], senza data in coda */
function tappePerGiorno(t){
  const arr = (t.tappe || []).slice().sort(cmpTappa);
  const gruppi = [];
  arr.forEach(x => {
    const k = x.dal || '';
    let g = gruppi.find(y => y.data === k);
    if(!g){ g = {data:k, lista:[]}; gruppi.push(g); }
    g.lista.push(x);
  });
  gruppi.sort((a,b) => (a.data || '9999') < (b.data || '9999') ? -1 : 1);
  gruppi.forEach(g => {
    if(g.data && t.dal){
      const d1 = new Date(t.dal + 'T12:00:00'), d2 = new Date(g.data + 'T12:00:00');
      g.n = Math.round((d2 - d1) / 86400000) + 1;
      if(g.n < 1) g.n = null;
    }
  });
  return gruppi;
}
/* rimette in fila le tappe di una giornata cercando il giro più corto (dal primo punto) */
function ottimizzaGiorno(t, data){
  const g = tappePerGiorno(t).find(x => x.data === data);
  if(!g) return 0;
  const con = g.lista.filter(x => x.lat && x.lon);
  const senza = g.lista.filter(x => !(x.lat && x.lon));
  if(con.length < 3) return 0;
  const resto = con.slice(1), giro = [con[0]];
  while(resto.length){
    let i = 0, best = Infinity;
    resto.forEach((x, j) => { const d = kmFra(giro[giro.length-1], x); if(d != null && d < best){ best = d; i = j; } });
    giro.push(resto.splice(i,1)[0]);
  }
  giro.concat(senza).forEach((x, i) => {
    const orig = t.tappe.find(y => y.id === x.id);
    if(orig){ orig.ord = i; }
  });
  return giro.length;
}
function tabItinerario(t){
  const gruppi = tappePerGiorno(t);
  const punti = puntiDi(t);
  const sel = puntoScelto(t);
  const offline = (typeof navigator.onLine === 'boolean') && !navigator.onLine;

  const rigaTappa = (x) => {
    const tp = tipoTappa(x.tipo);
    const np = prenDiTappa(t, x).length, na = attivitaDiTappa(t, x).length;
    const n = punti.findIndex(pp => pp.id === x.id);
    const attivo = sel && sel.id === x.id;
    return `
      <div class="row ${attivo ? 'sel' : ''}" ${x.lat ? 'data-act="punto-sel" data-id="' + esc(x.id) + '" style="cursor:pointer"' : ''}>
        <span class="ic" style="background:${x.lat ? tp.c : 'var(--surface-2)'};border-color:${x.lat ? tp.c : 'var(--line)'};color:${x.lat ? '#fff' : 'var(--ink-3)'};font-weight:700">${x.lat ? (n + 1) : tp.ic}</span>
        <span class="tx"><span class="t">${x.ora ? '<b class="num" style="margin-right:7px">' + esc(x.ora) + '</b>' : ''}${esc(x.dove || x.nome)}</span>
          <span class="m">${tp.n}${x.al && x.al !== x.dal ? ' · fino al ' + fmtDate(x.al) : ''}${
            np ? ' · ' + np + (np === 1 ? ' prenotazione' : ' prenotazioni') : ''}${na ? ' · ' + na + ' attività' : ''}</span></span>
        <span class="rt">
          ${num(x.costo) ? '<span class="v num" style="color:' + (x.pagato ? 'var(--chart-ok)' : 'var(--ink)') + '">' + eur(x.costo) + '</span>' : ''}
          ${posso(t) ? `<span class="acts-row">
            <button class="ibtn" data-act="edit-tappa" data-id="${esc(x.id)}" title="Modifica" aria-label="Modifica">${ico('matita',16)}</button>
            <button class="ibtn del" data-act="del-tappa" data-id="${esc(x.id)}" title="Elimina" aria-label="Elimina">${ico('cestino',16)}</button>
          </span>` : ''}
        </span>
      </div>`;
  };

  const bloccoGiorno = (g) => {
    const righe = [];
    g.lista.forEach((x, i) => {
      righe.push(rigaTappa(x));
      const sp = i < g.lista.length - 1 ? spostamento(x, g.lista[i+1]) : null;
      if(sp) righe.push(`<div class="spost">${ico(sp.ico,13)}<span>${sp.tempo} ${sp.come} · ${sp.dist}</span></div>`);
    });
    const ottimizzabile = posso(t) && g.data && g.lista.filter(x => x.lat && x.lon).length >= 3;
    return `
      <div class="giorno">
        <div class="giorno-h">
          <span class="gn">${g.data ? (g.n ? 'Giorno ' + g.n : fmtDate(g.data)) : 'Senza data'}</span>
          <span class="gd">${g.data ? fmtDate(g.data) : 'Da mettere in calendario'} · ${g.lista.length} ${g.lista.length === 1 ? 'punto' : 'punti'}</span>
          ${ottimizzabile ? `<button class="btn btn-ghost btn-sm" data-act="ott-giorno" data-v="${esc(g.data)}">${ico('mappa',14)} Ottimizza</button>` : ''}
        </div>
        <div class="card"><div class="card-b tight"><div class="rows">${righe.join('')}</div></div></div>
      </div>`;
  };

  return `
  <div class="split-it">
    <div class="col">
      <div class="sec-head" style="margin-top:0"><h2>Le tappe</h2><span class="sub">Giorno per giorno · tocca per vederle sulla mappa</span>
        ${posso(t) ? '<span class="rt"><button class="btn btn-primary btn-sm" data-act="new-tappa">＋ Punto</button></span>' : ''}</div>
      ${gruppi.length ? gruppi.map(bloccoGiorno).join('')
        : `<div class="card">${posso(t) ? vuoto('luogo','Nessun punto ancora',"Aggiungi il primo: l'hotel, l'aeroporto di arrivo, la città.")
            : '<div class="card-b">Chi organizza non ha ancora aggiunto le tappe.</div>'}</div>`}
    </div>


    <div class="col col-side">
      <div class="card mapcard">
        <div class="card-h"><div><h3>Dove si va</h3>
          <div class="sub">${punti.length ? punti.length + (punti.length === 1 ? ' punto' : ' punti') +
            (punti.filter(x => x.src === 'prenotazione').length ? ' · itinerario e prenotazioni' : '') : 'Nessun punto localizzato'}</div></div>
          ${punti.length > 1 ? '<div class="rt"><a class="btn btn-ghost btn-sm" href="' + gmPercorso(t) + '" target="_blank" rel="noopener">' + ico('mappa',15) + 'Percorso</a></div>' : ''}</div>

        ${punti.length ? `
          <div class="mapwrap">
            ${offline ? miniMappa(punti)
              : (DB.gmapsKey ? '<div id="gmap" style="position:absolute;inset:0"></div>'
                : `<iframe id="gframe" title="Mappa Google delle tappe del viaggio" loading="lazy" allowfullscreen
                     referrerpolicy="no-referrer-when-downgrade" src="${(punti.length > 1 && V.mapVista !== 'punto') ? gmEmbedPercorso(punti) : gmEmbed(sel)}"></iframe>`)}
          </div>
          ${punti.length > 1 ? `<div class="puntichips">
            <button class="pchip ${V.mapVista !== 'punto' ? 'on' : ''}" data-act="punto-tutti">${ico('mappa',14)} Tutto il percorso</button>
            ${punti.map((x,i) => `
            <button class="pchip ${V.mapVista === 'punto' && sel && sel.id === x.id ? 'on' : ''}" data-act="punto-sel" data-id="${esc(x.id)}">
              <span class="n" style="background:${x.tp.c}">${i+1}</span>${x.tp.ic} ${esc(x.etichetta)}</button>`).join('')}</div>` : ''}
          <div class="mapinfo" id="mapBar">${barraPunto(t)}</div>`
        : vuoto('luogo','Nessun punto sulla mappa','Aggiungi una tappa e cerca il luogo: compare qui, collegato alle altre.')}
      </div>

      ${sel ? schedaTappa(t, sel) : ''}
    </div>
  </div>`;
}

/* scheda del punto scelto: cosa c'è, cosa è prenotato, cosa si fa */
function schedaTappa(t, sel){
  const orig = (t.tappe || []).find(x => x.id === sel.id);
  const tp = sel.tp || tipoTappa(sel.tipo);
  const pren = orig ? prenDiTappa(t, orig) : [];
  const att  = orig ? attivitaDiTappa(t, orig) : [];
  const costo = orig ? num(orig.costo) : num(sel.costo);
  const totPren = pren.reduce((n,x) => n + num(x.costo), 0);

  return `
  <div class="card">
    <div class="card-h">
      <span class="ic" style="width:34px;height:34px;flex:0 0 34px;border-radius:var(--r-btn);display:grid;place-items:center;
        background:${tp.c};color:#fff;font-size:15px">${tp.ic}</span>
      <div><h3>${esc(sel.etichetta || sel.dove)}</h3>
        <div class="sub">${tp.n}${sel.src === 'prenotazione' ? ' · prenotazione' : ''}${
          sel.dal ? ' · ' + fmtRange(sel.dal, sel.al || sel.dal) : ''}</div></div>
      <div class="rt"><a class="btn btn-primary btn-sm" href="${gmDir(sel)}" target="_blank" rel="noopener">${ico('bussola',16)}<span>Indicazioni</span></a></div>
    </div>
    <div class="card-b">
      ${(sel.note || costo) ? `<div class="rows" style="margin-bottom:${(pren.length || att.length) ? '12px' : '0'}">
        ${sel.note ? '<div class="row" style="padding:8px 2px"><span class="tx"><span class="m" style="font-size:12.5px;color:var(--ink-2)">' + esc(sel.note) + '</span></span></div>' : ''}
        ${costo ? '<div class="row" style="padding:8px 2px"><span class="tx"><span class="t" style="font-weight:500;color:var(--ink-3);font-size:12.5px">Costo del punto</span></span>' +
          '<span class="rt"><span class="v num" style="color:' + ((orig && orig.pagato) ? 'var(--chart-ok)' : 'var(--ink)') + '">' + eur(costo) +
          '</span><span class="k">' + ((orig && orig.pagato) ? 'pagato' : 'da pagare') + '</span></span></div>' : ''}
      </div>` : ''}

      <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);font-weight:700;margin-bottom:8px">
        Prenotazioni di questa tappa</div>
      ${pren.length ? `<div class="rows">${pren.map(x => {
        const pt = tipoPren(x.tipo);
        const st = STATI_PREN[x.stato] || STATI_PREN.pren;
        return `<div class="row" style="padding:9px 2px">
          <span class="ic" style="background:${pt.c};border-color:${pt.c};color:#fff">${pt.ic}</span>
          <span class="tx"><span class="t" style="font-size:13px">${esc(x.titolo || pt.n)}</span>
            <span class="m">${pt.n}${x.fornitore ? ' · ' + esc(x.fornitore) : ''}${x.codice ? ' · cod. ' + esc(x.codice) : ''}${
              x.ora ? ' · ore ' + esc(x.ora) : ''}</span></span>
          <span class="rt">${num(x.costo) ? '<span class="v num" style="font-size:12.5px">' + eur(x.costo) + '</span>' : ''}
            <span class="pill ${st[0]}">${st[1]}</span></span></div>`;
      }).join('')}</div>
      ${totPren ? '<div style="font-size:11.5px;color:var(--ink-3);margin-top:8px;text-align:right">Prenotato qui: <b>' + eur(totPren) + '</b></div>' : ''}`
      : `<div style="font-size:12.5px;color:var(--ink-3);padding:2px 0 4px">
          Nessuna prenotazione collegata.${posso(t) ? ' Aggiungine una dalla scheda Prenotazioni: se le date coincidono la trovi qui da sola.' : ''}</div>
        ${posso(t) ? '<button class="btn btn-ghost btn-sm btn-full" style="margin-top:9px" data-act="new-pren">＋ Prenota qualcosa per questa tappa</button>' : ''}`}

      ${att.length ? `
      <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);font-weight:700;margin:16px 0 8px">
        Attività in questi giorni</div>
      <div class="rows">${att.map(x => `
        <div class="row" style="padding:9px 2px" ${x.lat ? 'data-act="punto-sel" data-id="' + esc(x.id) + '" style="cursor:pointer;padding:9px 2px"' : ''}>
          <span class="ic" style="background:var(--gold-soft);border-color:var(--gold-soft)"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5V6.6a1.6 1.6 0 0 1 1.6-1.6h13.8a1.6 1.6 0 0 1 1.6 1.6v1.9a2.8 2.8 0 0 0 0 7v1.9a1.6 1.6 0 0 1-1.6 1.6H5.1a1.6 1.6 0 0 1-1.6-1.6v-1.9a2.8 2.8 0 0 0 0-7z"/><path d="M13.5 5v2M13.5 11v2M13.5 17v2"/></svg></span>
          <span class="tx"><span class="t" style="font-size:13px">${esc(x.dove || x.nome)}</span>
            <span class="m">${x.dal ? fmtDate(x.dal) : ''}${x.note ? ' · ' + esc(x.note) : ''}</span></span>
          <span class="rt">${num(x.costo) ? '<span class="v num" style="font-size:12.5px">' + eur(x.costo) + '</span>' : ''}</span>
        </div>`).join('')}</div>` : ''}
    </div>
  </div>`;
}

/* prenotazioni collegate a una tappa: o l'hai detto tu, o si sovrappongono le date */
function prenDiTappa(t, tp){
  return (t.prenotazioni || []).filter(p => {
    if(p.tappaId) return p.tappaId === tp.id;
    if(!tp.dal || !p.dal) return false;
    const a = tp.dal, b = tp.al || tp.dal, pa = p.dal, pb = p.al || p.dal;
    return pa <= b && pb >= a;
  });
}
/* attività: i punti "da vedere" che cadono negli stessi giorni della tappa */
function attivitaDiTappa(t, tp){
  if(!tp.dal) return [];
  const a = tp.dal, b = tp.al || tp.dal;
  return (t.tappe || []).filter(x => x.id !== tp.id && x.tipo === 'attivita' && x.dal && x.dal >= a && x.dal <= b);
}

/* ---------- PRENOTAZIONI ---------- */
/* ---------- CERCA E PRENOTA (link ai servizi esterni) ----------
   Non gestiamo noi la prenotazione: apriamo il servizio giusto con
   destinazione e date gia' compilate, cosi' l'utente finisce il lavoro la'. */
function linkPrenota(t){
  const dove = (t.dove || t.nome || '').trim();
  const q  = encodeURIComponent(dove);
  const dal = t.dal || '', al = t.al || t.dal || '';
  const voli = [
    ['Ryanair',   'https://www.ryanair.com/it/it/cheap-flights?dateOut=' + encodeURIComponent(dal)],
    ['Skyscanner','https://www.skyscanner.it/trasporti/voli/?destination=' + q + (dal ? '&oym=' + dal.slice(0,4) + dal.slice(5,7) : '')],
    ['Google Voli','https://www.google.com/travel/flights?q=' + encodeURIComponent('Voli per ' + dove + (dal ? ' il ' + dal : ''))]
  ];
  const hotel = [
    ['Booking.com','https://www.booking.com/searchresults.it.html?ss=' + q +
      (dal ? '&checkin=' + dal + '&checkout=' + (al || dal) : '')],
    ['Airbnb', 'https://www.airbnb.it/s/' + q + '/homes' + (dal ? '?checkin=' + dal + '&checkout=' + (al || dal) : '')]
  ];
  const auto = [
    ['Hertz', 'https://www.hertz.it/rentacar/reservation/?pickupLocation=' + q +
      (dal ? '&pickupDate=' + dal + '&returnDate=' + (al || dal) : '')],
    ['Rentalcars','https://www.rentalcars.com/it/search?location=' + q]
  ];
  const grp = (tit, ic, arr, primo) => `
    <div class="prenota-g">
      <div class="prenota-t">${ic}<span>${tit}</span></div>
      <div class="prenota-l">${arr.map((v,i) =>
        '<a class="btn ' + (i === 0 && primo ? 'btn-primary' : 'btn-ghost') + ' btn-sm" target="_blank" rel="noopener noreferrer" href="' +
        v[1] + '">' + esc(v[0]) + ' ↗</a>').join('')}</div>
    </div>`;
  return `
  <div class="card">
    <div class="card-h"><div><h3>Cerca e prenota</h3>
      <div class="sub">${dove ? 'Apri il servizio con “' + esc(dove) + '”' + (dal ? ' e le tue date' : '') + ' già compilati'
        : 'Apri i servizi di ricerca'}</div></div></div>
    <div class="card-b prenota-b">
      ${grp('Voli', '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 3.4a1.6 1.6 0 0 1 2.8 0l2 6.2 6.1 2a.9.9 0 0 1 0 1.7l-6.1 2-2 6.2a1.6 1.6 0 0 1-2.8 0l-2-6.2-6.1-2a.9.9 0 0 1 0-1.7l6.1-2z" opacity="0"/><path d="M21 15.5L13.6 12V5.6a1.6 1.6 0 0 0-3.2 0V12L3 15.5v2.2l7.4-2.2v3l-2.2 1.5v1.3l3.8-1 3.8 1v-1.3L13.6 20.5v-3L21 17.7z"/></svg>', voli, true)}
      ${grp('Alloggio', '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19V7M3 11.5h18V19M3 15.5h18"/><path d="M21 19v-3.5"/><circle cx="7.5" cy="9.2" r="1.9"/><path d="M10.5 11.5V10a1.8 1.8 0 0 1 1.8-1.8h5.4A1.8 1.8 0 0 1 19.5 10v1.5"/></svg>', hotel, true)}
      ${grp('Auto', '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16.5v-3l1.9-4.4A2 2 0 0 1 7.7 8h8.6a2 2 0 0 1 1.8 1.1L20 13.5v3"/><path d="M4 13.5h16M5.5 16.5v2.2M18.5 16.5v2.2"/><circle cx="8" cy="16.6" r="0" /><path d="M7 15.5h1.6M15.4 15.5H17"/></svg>', auto, true)}
    </div>
  </div>`;
}

function tabPrenotazioni(t){

  const lista = (t.prenotazioni || []).slice().sort((a,b) => (a.dal||'9999') < (b.dal||'9999') ? -1 : 1);
  const tot = lista.reduce((n,x) => n + num(x.costo), 0);
  const pagate = lista.filter(x => x.stato === 'pagata').reduce((n,x) => n + num(x.costo), 0);
  const daFare = lista.filter(x => x.stato === 'daPren').length;
  const suMappa = lista.filter(x => x.lat && x.lon).length;

  return `
  <div class="sec-head"><h2>Prenotazioni</h2>
    <span class="sub">${lista.length ? lista.length + (lista.length === 1 ? ' prenotazione' : ' prenotazioni') +
      ' · ' + eur(tot) + (suMappa ? ' · ' + suMappa + ' sulla mappa' : '') : 'Voli, treni, alloggi, auto: tutto quello che hai bloccato'}</span>
    ${posso(t) ? '<span class="rt"><button class="btn btn-primary btn-sm" data-act="new-pren">＋ Nuova prenotazione</button></span>' : ''}</div>

  ${linkPrenota(t)}

  ${lista.length ? `
  <div class="card">
    <div class="card-b" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <div><div style="font-size:20px;font-weight:700;letter-spacing:-.03em" class="num">${eur(tot)}</div>
        <div style="font-size:11.5px;color:var(--ink-3)">totale prenotato</div></div>
      <div class="vdiv" style="background:var(--line);height:30px"></div>
      <div><div style="font-size:20px;font-weight:700;letter-spacing:-.03em;color:var(--chart-ok)" class="num">${eur(pagate)}</div>
        <div style="font-size:11.5px;color:var(--ink-3)">già pagato</div></div>
      <div class="vdiv" style="background:var(--line);height:30px"></div>
      <div><div style="font-size:20px;font-weight:700;letter-spacing:-.03em;color:var(--terracotta)" class="num">${eur(tot - pagate)}</div>
        <div style="font-size:11.5px;color:var(--ink-3)">ancora da pagare</div></div>
      ${daFare ? '<span class="pill warn" style="margin-left:auto">' + daFare + (daFare === 1 ? ' ancora da prenotare' : ' ancora da prenotare') + '</span>' : '<span class="pill ok" style="margin-left:auto">tutto prenotato</span>'}
    </div>
  </div>` : ''}

  <div class="card">
    ${lista.length ? '<div class="card-b tight"><div class="rows">' + lista.map(x => {
      const tp = tipoPren(x.tipo);
      const st = STATI_PREN[x.stato] || STATI_PREN.pren;
      return `
      <div class="row">
        <span class="ic" style="background:${tp.c};border-color:${tp.c};color:#fff">${tp.ic}</span>
        <span class="tx"><span class="t">${esc(x.titolo || tp.n)}</span>
          <span class="m">${tp.n}${x.fornitore ? ' · ' + esc(x.fornitore) : ''}${
            x.dal ? ' · ' + fmtRange(x.dal, x.al || x.dal) : ''}${x.ora ? ' ore ' + esc(x.ora) : ''}${
            x.codice ? ' · cod. ' + esc(x.codice) : ''}${x.dove ? ' · ' + ico('luogo',15) + '' + esc(x.dove) : ''}</span></span>
        <span class="rt">
          ${num(x.costo) ? '<span class="v num">' + eur(x.costo) + '</span>' : ''}
          <span class="pill ${st[0]}">${st[1]}</span>
          ${x.lat ? '<a class="docbtn" href="' + gmDir(x) + '" target="_blank" rel="noopener" title="Indicazioni" aria-label="Indicazioni">' + ico('bussola',16) + '</a>' : ''}
          ${posso(t) ? `<span class="acts-row">
            <button class="ibtn" data-act="edit-pren" data-id="${esc(x.id)}" title="Modifica" aria-label="Modifica">${ico('matita',16)}</button>
            <button class="ibtn del" data-act="del-pren" data-id="${esc(x.id)}" title="Elimina" aria-label="Elimina">${ico('cestino',16)}</button>
          </span>` : ''}</span>
      </div>`;
    }).join('') + '</div></div>'
    : `<div class="card-b" style="text-align:center;padding:26px 16px">
        <div style="font-size:13px;color:var(--ink-3);max-width:420px;margin:0 auto 14px">
          Aggiungi il volo, l'hotel, il treno o l'auto a noleggio: ognuna con codice, orario e costo.
          Se metti anche il luogo, finisce sulla mappa dell'itinerario insieme alle tappe.</div>
        <button class="btn btn-primary btn-sm" data-act="new-pren">＋ Aggiungi la prima</button>
       </div>`}
  </div>`;
}

function formPren(x){
  const nuovo = !x;
  x = x || {tipo:'alloggio', titolo:'', fornitore:'', codice:'', dal:'', al:'', ora:'',
            dove:'', lat:null, lon:null, gpid:'', costo:'', stato:'pren', note:''};
  tmpLat = x.lat || null; tmpLon = x.lon || null; tmpPid = x.gpid || ''; tmpTipoP = x.tipo || 'alloggio';
  modal(mHead(nuovo ? 'Nuova prenotazione' : 'Modifica prenotazione',
      'Volo, treno, alloggio, auto: con codice, costo e luogo') +
    '<div class="modal-b">' +
      '<div class="field"><label>Che cosa hai prenotato</label><div class="chips" id="pTipo">' +
        TIPI_PREN.map(v => '<button class="chip ' + (v.id === tmpTipoP ? 'on' : '') + '" type="button" data-act="pick-tipop" data-v="' + esc(v.id) + '">' +
          v.ic + ' ' + v.n + '</button>').join('') + '</div></div>' +
      '<div class="field"><label>Nome</label><input class="inp" id="bTitolo" placeholder="Es. Hotel Attalos · Volo AZ 8592" value="' + esc(x.titolo) + '"></div>' +
      ((viaggio() && viaggio().tappe.length) ?
        '<div class="field"><label>Collegata a quale tappa <span class="opt">(facoltativo)</span></label>' +
          '<select class="inp" id="bTappa"><option value="">— la collego dalle date —</option>' +
          viaggio().tappe.map(tt => '<option value="' + tt.id + '"' + (x.tappaId === tt.id ? ' selected' : '') + '>' +
            esc(tipoTappa(tt.tipo).n + ' · ' + (tt.dove || tt.nome)) + '</option>').join('') +
          '</select></div>' : '') +
      '<div class="two">' +
        '<div class="field"><label>Con chi <span class="opt">(compagnia, struttura)</span></label>' +
          '<input class="inp" id="bForn" placeholder="ITA Airways, Booking…" value="' + esc(x.fornitore) + '"></div>' +
        '<div class="field"><label>Codice prenotazione</label>' +
          '<input class="inp" id="bCod" placeholder="QK7T2M" value="' + esc(x.codice) + '"></div>' +
      '</div>' +
      '<div class="field"><label>Dove <span class="opt">(per metterla sulla mappa)</span></label>' +
        '<input class="inp" id="tDove" placeholder="Hotel Attalos, Atene · Aeroporto di Napoli" value="' + esc(x.dove) + '">' +
        '<div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap">' +
          '<button class="btn btn-ghost btn-sm" type="button" data-act="cerca-luogo">' + ico('lente',15) + 'Cerca su Google</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" data-act="mia-posizione">' + ico('luogo',15) + 'La mia posizione</button>' +
        '</div><div id="geoBox"></div></div>' +
      '<div class="three">' +
        '<div class="field"><label>Dal</label><input class="inp" type="date" id="bDal"' + attrDate() + ' value="' + esc(x.dal) + '"></div>' +
        '<div class="field"><label>Al</label><input class="inp" type="date" id="bAl"' + attrDate() + ' value="' + esc(x.al) + '"></div>' +
        '<div class="field"><label>Ora <span class="opt">(fac.)</span></label><input class="inp" type="time" id="bOra" value="' + esc(x.ora) + '"></div>' +
      '</div>' +
      notaDate() +
      '<div class="two">' +
        '<div class="field"><label>Quanto costa <span class="opt">(€)</span></label>' +
          '<input class="inp" id="bCosto" inputmode="decimal" placeholder="0" value="' + esc(x.costo) + '"></div>' +
        '<div class="field"><label>A che punto sei</label><div class="chips" id="bStato">' +
          Object.keys(STATI_PREN).map(k => '<button class="chip ' + (x.stato === k ? 'on' : '') + '" type="button" data-act="pick-statop" data-v="' + esc(k) + '">' +
            STATI_PREN[k][1] + '</button>').join('') + '</div></div>' +
      '</div>' +
      '<div class="field" style="margin-bottom:0"><label>Note <span class="opt">(facoltativo)</span></label>' +
        '<input class="inp" id="bNote" placeholder="Colazione inclusa, bagaglio 20kg…" value="' + esc(x.note) + '"></div>' +
      '<div class="err hide" id="bErr">Dai un nome alla prenotazione.</div>' +
    '</div>' + mFoot(nuovo ? 'save-pren' : 'update-pren', 'Salva'));
  if(tmpLat != null) segnaLuogo(tmpLat, tmpLon, x.dove || x.titolo, tmpPid);
  setTimeout(()=>$('bTitolo') && $('bTitolo').focus(), 60);
}
let tmpTipoP = 'alloggio';

/* ---------- PERSONE ---------- */
/* I partecipanti con un account TOYO: sono un'altra cosa rispetto alle persone
   segnate a mano nella lista sotto. Questi vedono il viaggio dal loro telefono,
   votano e possono registrare le proprie spese. */
function cardPartecipanti(t){
  const lista = membri[t.id] || [];
  if(!lista.length) return '';
  const dentro  = lista.filter(m => m.stato === 'accettato');
  const attesa  = lista.filter(m => m.stato === 'invitato');
  const et = {organizzatore:[ico('bussola',18),'co-organizza'], viaggiatore:[ico('valigia',18),'partecipa']};
  return `
  <div class="card">
    <div class="card-h"><div><h3>Su TOYO con te</h3>
      <div class="sub">${dentro.length ? dentro.length + (dentro.length === 1 ? ' persona dentro' : ' persone dentro') : 'Nessuno ha ancora accettato'}${
        attesa.length ? ' · ' + attesa.length + ' in attesa di rispondere' : ''}</div></div>
      ${posso(t) ? '<div class="rt"><button class="btn btn-ghost btn-sm" data-act="invita">' + ico('busta',16) + '<span>Invita</span></button></div>' : ''}</div>
    <div class="card-b tight"><div class="rows">
      ${lista.map(m => {
        const e = et[m.ruolo] || et.viaggiatore;
        const io = utente && m.utente === utente.id;
        return `<div class="row" style="padding:9px 2px">
          <span class="ic">${e[0]}</span>
          <span class="tx"><span class="t">@${esc(m.nick || 'partecipante')}${io ? ' · tu' : ''}</span>
            <span class="m">${e[1]}</span></span>
          <span class="rt"><span class="pill ${m.stato === 'accettato' ? 'ok' : (m.stato === 'rifiutato' ? '' : 'gold')}">${
            m.stato === 'accettato' ? 'dentro' : (m.stato === 'rifiutato' ? 'ha rifiutato' : 'in attesa')}</span>
          ${posso(t) && !io ? `<span class="acts-row"><button class="ibtn del" data-act="togli-membro" data-id="${esc(m.utente)}" title="Togli dal viaggio"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9.5 7V5.2A1.7 1.7 0 0 1 11.2 3.5h1.6A1.7 1.7 0 0 1 14.5 5.2V7"/><path d="M6.5 7l.9 12a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7"/><path d="M10.5 11v6M13.5 11v6"/></svg></button></span>` : ''}</span>
        </div>`;
      }).join('')}
    </div>
    <div style="font-size:11.5px;color:var(--ink-3);margin-top:11px">
      Chi è dentro entra anche nella divisione delle spese e può registrare le proprie.
      Le persone qui sotto, quelle segnate a mano, sono per chi non ha un account TOYO.
    </div></div>
  </div>`;
}

function tabPersone(t, s){
  const org = t.mio;
  const STATI = {confermato:['ok','Confermato'], forse:['gold','In forse'], invitato:['info','Invitato']};
  const conDoc = t.gente.filter(p => (p.docs||[]).length).length;
  const mieiN = (t.mieiDocs||[]).length;

  return `
  ${!org ? `
  <div class="card" style="border-left:3px solid ${mieiN ? 'var(--sage)' : 'var(--terracotta)'}">
    <div class="card-h"><div><h3>I tuoi documenti per questo viaggio</h3>
      <div class="sub">${mieiN ? mieiN + (mieiN === 1 ? ' documento caricato' : ' documenti caricati') : "Carta d'identità o passaporto: caricali qui, l'organizzatore te li chiederà"}</div></div>
      <div class="rt"><button class="btn ${mieiN ? 'btn-ghost' : 'btn-primary'} btn-sm" data-act="lista-doc" data-scope="mie">${mieiN ? 'Gestisci' : '＋ Carica il tuo documento'}</button></div></div>
    ${mieiN ? '<div class="card-b tight">' + t.mieiDocs.map(d => rigaDoc(d, 'mie')).join('') + '</div>' : ''}
  </div>` : ''}

  ${cardPartecipanti(t)}

  <div class="sec-head"><h2>${org ? 'Persone' : 'Chi altro viene'}</h2>
    <span class="sub">${t.gente.length ? s.confermati + ' confermate su ' + t.gente.length : 'Ancora nessuno'}${
      t.posti ? ' · ' + t.posti + ' posti' : ''}${org && t.gente.length ? ' · documenti: ' + conDoc + ' su ' + t.gente.length : ''}</span>
    ${posso(t) ? `<span class="rt" style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm" data-act="invita">${ico('busta',16)}<span>Invita</span></button>
      <button class="btn btn-primary btn-sm" data-act="new-persona">＋ Aggiungi persona</button></span>` : ''}</div>

  <div class="card">
    ${t.gente.length ? '<div class="card-b tight"><div class="rows">' + t.gente.map(p => {
      const st = STATI[p.stato] || STATI.invitato;
      const q = num(t.quota), v = num(p.versato);
      const pct = q ? Math.min(100, Math.round(v / q * 100)) : 0;
      const nd = (p.docs || []).length;
      return `
      <div class="row">
        <span class="av" style="background:${colorFor(p.nome)}">${iniz(p.nome, p.nome.split(' ')[1])}</span>
        <span class="tx"><span class="t">${esc(p.nome)}</span>
          <span class="m">${p.email ? esc(p.email) : 'nessun contatto'}${q ? ' · versato ' + eur(v) + ' su ' + eur(q) : ''}</span></span>
        <span class="rt">
          <button class="docbtn ${nd ? 'ok' : 'miss'}" data-act="lista-doc" data-scope="p:${p.id}"
            title="Documenti di ${esc(p.nome)}">${ico('tessera',15)}${nd ? nd : 'documenti'}</button>
          ${q ? '<span class="bar" style="width:70px;flex:0 0 70px"><i class="' + (pct>=100?'sage':'gold') + '" style="width:' + pct + '%"></i></span>' : ''}
          <span class="pill ${st[0]}">${st[1]}</span>
          ${posso(t) ? `<span class="acts-row">
            <button class="ibtn" data-act="invita" data-id="${esc(p.id)}" title="Invita ${esc(p.nome)}"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3 7l9 6 9-6"/></svg></button>
            <button class="ibtn" data-act="edit-persona" data-id="${esc(p.id)}" title="Modifica" aria-label="Modifica">${ico('matita',16)}</button>
            <button class="ibtn del" data-act="del-persona" data-id="${esc(p.id)}" title="Elimina" aria-label="Elimina">${ico('cestino',16)}</button>
          </span>` : ''}
        </span>
      </div>`;
    }).join('') + '</div></div>'
    : `${org ? vuoto('persone','Nessuna persona','Aggiungi chi parte con te: nome, contatto, quanto ha versato e i suoi documenti.') : vuoto('persone','Nessuna persona','Segna chi altro partecipa, se ti serve tenerne traccia.')}`}
  </div>

  ${org && t.gente.length ? `
  <div class="card">
    <div class="card-b" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span>${ico('tessera',19)}</span>
      <div style="flex:1;min-width:200px">
        <div style="font-weight:650;font-size:13.5px">Documenti dei partecipanti</div>
        <div style="font-size:12px;color:var(--ink-3)">${conDoc === t.gente.length
          ? 'Li hai raccolti tutti: sei pronto per prenotazioni e check-in.'
          : 'Mancano ' + (t.gente.length - conDoc) + ' su ' + t.gente.length + '. Toccando ' + ico('tessera',15) + 'accanto a una persona carichi il suo documento.'}</div>
      </div>
      <span class="bar" style="max-width:160px"><i class="${conDoc === t.gente.length ? 'sage' : 'gold'}" style="width:${Math.round(conDoc / t.gente.length * 100)}%"></i></span>
    </div>
  </div>` : ''}`;
}

/* ---------- SOLDI ---------- */
