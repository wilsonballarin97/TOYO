/* ==========================================================================
   PRENOTAZIONI E DOCUMENTI · una sezione sola
   Prima erano due schede: le prenotazioni da una parte, i biglietti e i
   voucher dall'altra, e per trovare la carta d'imbarco del volo bisognava
   ricordarsi dove l'avevi messa. Ora ogni prenotazione ha sotto i suoi file,
   raggruppate come in una cartellina di viaggio: voli, alloggi, treni, auto.
   Costo e stato si cambiano direttamente qui, senza aprire niente, e il
   report delle spese li legge da qui: si aggiorna da solo.
   ========================================================================== */
const GRUPPI_PREN = [
  {id:'voli',     n:'Voli',                   tipi:['volo'],                   ic:'aereo',     nuovo:'volo'},
  {id:'alloggi',  n:'Alloggi',                tipi:['alloggio'],               ic:'letto',     nuovo:'alloggio'},
  {id:'mezzi',    n:'Treni, bus e traghetti', tipi:['treno','bus','traghetto'], ic:'treno',    nuovo:'treno'},
  {id:'auto',     n:'Auto',                   tipi:['auto'],                   ic:'auto',      nuovo:'auto'},
  {id:'attivita', n:'Attività e biglietti',   tipi:['attivita'],               ic:'biglietto', nuovo:'attivita'},
  {id:'altro',    n:'Altro',                  tipi:['altro'],                  ic:'altro',     nuovo:'altro'}
];
let tmpPrenDoc = '';   /* la prenotazione a cui si sta allegando un file */

const docsDiPren = (t, p) => (t.docs || []).filter(d => d.prenId === p.id);
function docsLiberi(t){
  const ids = new Set((t.prenotazioni || []).map(p => p.id));
  return (t.docs || []).filter(d => !d.prenId || !ids.has(d.prenId));
}

function cardPren(t, x){
  const tp = tipoPren(x.tipo);
  const st = STATI_PREN[x.stato] || STATI_PREN.pren;
  const docs = docsDiPren(t, x);
  const io = posso(t);
  const quando = x.dal ? fmtRange(x.dal, x.al || x.dal) + (x.ora ? ' · ore ' + esc(x.ora) : '') : (x.ora ? 'ore ' + esc(x.ora) : 'data da definire');
  return `
  <div class="pcard st-${esc(x.stato || 'pren')}">
    <div class="pc-top">
      <span class="pc-ic">${tp.ic}</span>
      <div class="pc-tx">
        <div class="t">${esc(x.titolo || tp.n)}</div>
        <div class="m">${quando}${x.fornitore ? ' · ' + esc(x.fornitore) : ''}</div>
        ${x.codice || x.dove || x.note ? '<div class="m">' + [
            x.codice ? 'Codice <b class="num">' + esc(x.codice) + '</b>' : '',
            x.dove ? esc(x.dove) : '', x.note ? esc(x.note) : ''].filter(Boolean).join(' · ') + '</div>' : ''}
      </div>
      <span class="pc-az">
        ${x.lat ? '<a class="ibtn" href="' + gmDir(x) + '" target="_blank" rel="noopener" title="Indicazioni" aria-label="Indicazioni">' + ico('bussola',16) + '</a>' : ''}
        ${io ? `<button class="ibtn" data-act="edit-pren" data-id="${esc(x.id)}" title="Modifica tutti i dati" aria-label="Modifica">${ico('matita',16)}</button>
          <button class="ibtn del" data-act="del-pren" data-id="${esc(x.id)}" title="Elimina" aria-label="Elimina">${ico('cestino',16)}</button>` : ''}
      </span>
    </div>

    ${io ? `
    <div class="pc-soldi">
      <label class="pc-costo"><span>Costo</span>
        <span class="pc-eur">€<input class="inp num" data-costo-pren="${esc(x.id)}" inputmode="decimal" placeholder="0"
          value="${esc(x.costo || '')}" aria-label="Costo di ${esc(x.titolo || tp.n)} in euro" enterkeyhint="done"></span></label>
      <div class="pc-stati" role="group" aria-label="Stato">
        ${Object.keys(STATI_PREN).map(k => `<button class="chip ${x.stato === k || (!x.stato && k === 'pren') ? 'on' : ''}" data-act="stato-pren" data-id="${esc(x.id)}" data-v="${esc(k)}">${STATI_PREN[k][1]}</button>`).join('')}
      </div>
    </div>` : `
    <div class="pc-soldi sola">
      ${num(x.costo) ? '<span class="v num">' + eur(x.costo) + '</span>' : '<span class="tiny">costo non indicato</span>'}
      <span class="pill ${st[0]}">${st[1]}</span>
    </div>`}

    ${docs.length || io ? `<div class="pc-docs">
      ${docs.map(d => rigaDoc(d, 'trip')).join('')}
      ${io ? `<button class="pc-allega" data-act="doc-pren" data-id="${esc(x.id)}">${ico('graffetta',15)}<span>${docs.length ? 'Allega un altro file' : 'Allega biglietto o conferma'}</span></button>` : ''}
    </div>` : ''}
  </div>`;
}

function riepilogoPren(t){
  const lista = t.prenotazioni || [];
  const tot = lista.reduce((n,x) => n + num(x.costo), 0);
  const pag = lista.filter(x => x.stato === 'pagata').reduce((n,x) => n + num(x.costo), 0);
  const daPren = lista.filter(x => x.stato === 'daPren').length;
  const pct = tot ? Math.round(pag / tot * 100) : 0;
  return `
  <div class="card riep-pren">
    <div class="card-b">
      <div class="rp-num">
        <div><b class="num">${eur(tot)}</b><span>totale prenotato</span></div>
        <div><b class="num ok">${eur(pag)}</b><span>pagato</span></div>
        <div><b class="num due">${eur(tot - pag)}</b><span>da pagare</span></div>
      </div>
      <span class="bar" style="margin-top:12px"><i class="sage" style="width:${pct}%"></i></span>
      <div class="rp-piede">
        ${daPren ? '<span class="pill warn">' + daPren + ' ancora da prenotare</span>' : (lista.length ? '<span class="pill ok">tutto prenotato</span>' : '')}
        <button class="lnk" data-act="tab" data-tab="soldi">Vedi il report delle spese →</button>
      </div>
      <div class="tiny" style="margin-top:8px">Cambia costo o stato qui sotto: il report e il bilancio si aggiornano da soli.</div>
    </div>
  </div>`;
}

function tabPrenDoc(t){
  const io = posso(t);
  const lista = (t.prenotazioni || []).slice().sort((a,b) =>
    ((a.dal || '9999') + (a.ora || '')) < ((b.dal || '9999') + (b.ora || '')) ? -1 : 1);
  const liberi = docsLiberi(t);
  const gruppi = GRUPPI_PREN.map(g => ({g, lista: lista.filter(x => g.tipi.indexOf(x.tipo) >= 0 ||
    (g.id === 'altro' && !TIPI_PREN.some(tp => tp.id === x.tipo)))})).filter(x => x.lista.length);

  return `
  ${titSez('Prenotazioni e documenti',
    lista.length ? lista.length + (lista.length === 1 ? ' prenotazione' : ' prenotazioni') + (t.docs.length ? ' · ' + t.docs.length + (t.docs.length === 1 ? ' file' : ' file') : '')
                 : 'Voli, alloggi, treni, auto: ognuno con il suo codice, il costo e i biglietti allegati',
    io ? '<button class="btn btn-primary btn-sm" data-act="new-pren">＋ Prenotazione</button>' : '')}

  ${lista.length ? riepilogoPren(t) : ''}

  ${io ? `<div class="pren-rapide">
    ${GRUPPI_PREN.slice(0, 5).map(g => `<button class="chip" data-act="new-pren" data-v="${esc(g.nuovo)}">${ico(g.ic,15)} ${g.id === 'voli' ? 'Volo' : g.id === 'alloggi' ? 'Alloggio' : g.id === 'mezzi' ? 'Treno o bus' : g.id === 'auto' ? 'Auto' : 'Attività'}</button>`).join('')}
  </div>` : ''}

  ${gruppi.length ? gruppi.map(({g, lista}) => `
    <div class="pgruppo">
      <h3 class="pg-h">${ico(g.ic,17)}<span>${g.n}</span><span class="pg-n num">${eur(lista.reduce((n,x) => n + num(x.costo), 0))}</span></h3>
      ${lista.map(x => cardPren(t, x)).join('')}
    </div>`).join('')
  : `<div class="card"><div class="card-b" style="text-align:center;padding:24px 16px">
      <div style="font-size:13px;color:var(--ink-3);max-width:420px;margin:0 auto">
        ${io ? 'Aggiungi il volo, l\'hotel, il treno o l\'auto: ognuno con codice, orario e costo, e sotto i biglietti. Se metti il luogo finisce anche sulla mappa.'
             : 'Chi organizza non ha ancora aggiunto prenotazioni.'}</div>
    </div></div>`}

  <div class="pgruppo">
    <h3 class="pg-h">${ico('graffetta',17)}<span>Altri documenti del viaggio</span></h3>
    <div class="card">
      ${liberi.length ? '<div class="card-b tight">' + liberi.map(d => rigaDoc(d, 'trip')).join('') + '</div>'
        : '<div class="card-b tiny">Polizze, voucher, ricevute: quello che non appartiene a una prenotazione.</div>'}
      ${io ? `<div class="card-b" style="padding-top:0"><button class="pc-allega" data-act="new-doc-trip">${ico('graffetta',15)}<span>Allega un documento</span></button></div>` : ''}
    </div>
  </div>

  ${docPersone(t)}

  <details class="cerca-pren">
    <summary>${ico('lente',16)}<span>Cerca e prenota online</span><span class="tiny">voli, alloggi, treni, auto, attività</span></summary>
    ${linkPrenota(t)}
  </details>`;
}

/* I documenti d'identità di chi parte (chi organizza li raccoglie tutti, chi
   partecipa vede solo i suoi). */
function docPersone(t){
  const org = t.mio;
  const mieiN = (t.mieiDocs || []).length;
  const conDoc = t.gente.filter(p => (p.docs||[]).length).length;
  if(org){
    return `
    <div class="pgruppo">
      <h3 class="pg-h">${ico('tessera',17)}<span>Documenti delle persone</span><span class="pg-n">${conDoc} su ${t.gente.length || 0}</span></h3>
      <div class="card">
        ${t.gente.length ? '<div class="card-b tight"><div class="rows">' + t.gente.map(p => {
          const nd = (p.docs || []).length;
          return `<div class="row">
            <span class="av" style="background:${colorFor(p.nome)}">${iniz(p.nome, p.nome.split(' ')[1])}</span>
            <span class="tx"><span class="t">${esc(p.nome)}</span>
              <span class="m">${nd ? (p.docs.map(d => esc(nomeTipo(d.tipo).n)).join(' · ')) : 'nessun documento caricato'}</span></span>
            <span class="rt">
              ${nd ? '<span class="pill ok">' + nd + ' file</span>' : '<span class="pill warn">manca</span>'}
              <button class="docbtn" data-act="lista-doc" data-scope="p:${p.id}">${ico('tessera',15)}${nd ? 'Apri' : 'Carica'}</button>
            </span></div>`;
        }).join('') + '</div></div>'
        : '<div class="card-b tiny">Aggiungi chi parte con te nella sezione Persone: qui raccogli carta d\'identità e passaporto di ognuno.</div>'}
      </div>
    </div>`;
  }
  return `
  <div class="pgruppo">
    <h3 class="pg-h">${ico('tessera',17)}<span>I tuoi documenti per questo viaggio</span></h3>
    <div class="card">
      ${mieiN ? '<div class="card-b tight">' + t.mieiDocs.map(d => rigaDoc(d, 'mie')).join('') + '</div>'
        : '<div class="card-b tiny">Carta d\'identità o passaporto: l\'organizzatore te li chiederà per prenotare.</div>'}
      <div class="card-b" style="padding-top:0"><button class="pc-allega" data-act="lista-doc" data-scope="mie">${ico('tessera',15)}<span>${mieiN ? 'Gestisci i tuoi documenti' : 'Carica il tuo documento'}</span></button></div>
    </div>
  </div>`;
}

/* ---- azioni di questa sezione ----
   Girano prima del grande switch delle azioni (fase di cattura): alcune si
   limitano a preparare un valore e lasciano proseguire il click. */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if(!el) return;
  const a = el.dataset.act;
  if(a === 'new-pren' && el.dataset.v){ V.nuovoTipo = el.dataset.v; return; }
  if(a === 'new-tappa'){ V.nuovaData = el.dataset.v || ''; return; }
  if(a === 'new-doc-trip'){ tmpPrenDoc = ''; return; }
  if(a !== 'stato-pren' && a !== 'doc-pren') return;
  e.preventDefault(); e.stopPropagation();
  const t = viaggio();
  if(!t || !posso(t)){ toast('Questo viaggio lo gestisce chi lo organizza'); return; }
  const p = (t.prenotazioni || []).find(x => x.id === el.dataset.id);
  if(!p) return;
  viaggioInAzione = t;
  if(a === 'stato-pren'){
    if(p.stato === el.dataset.v) return;
    p.stato = el.dataset.v;
    save(); render();
    toast(p.stato === 'pagata' ? 'Segnata come pagata · report aggiornato' : 'Stato aggiornato');
  } else {
    tmpPrenDoc = p.id;
    formDoc('trip');
    const n = $('docNome'); if(n && !n.value) n.value = (p.titolo || tipoPren(p.tipo).n);
  }
}, true);

/* Il costo si scrive direttamente nella scheda: si salva quando si esce dal
   campo o si preme Invio, e il ridisegno porta il nuovo totale ovunque. */
document.addEventListener('change', e => {
  const inp = e.target.closest && e.target.closest('[data-costo-pren]');
  if(!inp) return;
  const t = viaggio();
  if(!t || !posso(t)) return;
  const p = (t.prenotazioni || []).find(x => x.id === inp.dataset.costoPren);
  if(!p) return;
  const grezzo = inp.value.trim().replace(/[€\s]/g, '');
  if(grezzo && isNaN(parseFloat(grezzo.replace(/\./g, '').replace(',', '.')))){
    toast('Scrivi un numero, es. 120 o 89,50'); inp.value = p.costo || ''; return;
  }
  /* "1.250,50" → 1250.50; "89,5" → 89.5; "120" resta 120 */
  const norm = (grezzo.indexOf(',') >= 0 || /^\d{1,3}(\.\d{3})+$/.test(grezzo)) ? grezzo.replace(/\./g, '').replace(',', '.') : grezzo;
  const nuovo = norm ? String(Math.round(parseFloat(norm) * 100) / 100) : '';
  if(nuovo === String(p.costo || '')) return;
  p.costo = nuovo;
  viaggioInAzione = t;
  save();
  const y = window.scrollY;
  render(); window.scrollTo(0, y);
  toast('Costo aggiornato · report e bilancio aggiornati');
});
document.addEventListener('keydown', e => {
  if(e.key === 'Enter' && e.target.matches && e.target.matches('[data-costo-pren]')) e.target.blur();
});

/* Nel modulo del viaggio il ritorno segue la partenza: scelta la partenza, il
   calendario del ritorno parte da lì. */
document.addEventListener('input', e => {
  if(!e.target || e.target.id !== 'vDal') return;
  const al = $('vAl'); if(!al) return;
  al.min = e.target.value || oggiIso();
  if(al.value && e.target.value && al.value < e.target.value) al.value = e.target.value;
});
