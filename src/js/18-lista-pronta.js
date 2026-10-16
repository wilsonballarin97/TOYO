/* ==========================================================================
   LISTA PRONTA · le cose che servono quasi sempre
   Le scadenze si calcolano da sole, contando indietro dalla partenza.
   ========================================================================== */
const TODO_PRONTE = [
  {t:'Prenotare i voli',                         g:60, on:true},
  {t:'Prenotare l\'alloggio',                    g:55, on:true},
  {t:'Controllare scadenza di documenti e passaporti', g:50, on:true},
  {t:'Raccogliere i documenti del gruppo',       g:40, on:true},
  {t:'Assicurazione di viaggio',                 g:30, on:true},
  {t:'Raccogliere le quote',                     g:25, on:true},
  {t:'Trasferimenti aeroporto ↔ alloggio',       g:21, on:false},
  {t:'Noleggio auto o mezzi sul posto',          g:21, on:false},
  {t:'Prenotare musei, tour o ristoranti',       g:14, on:false},
  {t:'Vaccinazioni o farmaci necessari',         g:40, on:false},
  {t:'Contanti e valuta locale',                 g:7,  on:false},
  {t:'eSIM o roaming per il telefono',           g:7,  on:false},
  {t:'Check-in online',                          g:2,  on:true},
  {t:'Lista di cosa mettere in valigia',         g:3,  on:false},
  {t:'Condividere itinerario e contatti col gruppo', g:5, on:false}
];
/* le date dei punti e delle prenotazioni restano dentro il viaggio */
function attrDate(){
  const t = viaggio();
  if(!t) return '';
  return (t.dal ? ' min="' + t.dal + '"' : '') + (t.al ? ' max="' + t.al + '"' : '');
}
function notaDate(){
  const t = viaggio();
  if(!t || (!t.dal && !t.al)) return '';
  return '<div style="font-size:11.5px;color:var(--ink-3);margin-top:-4px;margin-bottom:12px">' +
    '' + ico('calendario',15) + 'Puoi scegliere solo fra il ' + fmtDate(t.dal) + ' e il ' + fmtDate(t.al) + ', le date del viaggio.</div>';
}
function dentroViaggio(d){
  const t = viaggio();
  if(!d || !t) return true;
  if(t.dal && d < t.dal) return false;
  if(t.al && d > t.al) return false;
  return true;
}
function dataMeno(giorni){
  const t = viaggio();
  if(!t || !t.dal) return '';
  const d = new Date(t.dal + 'T12:00:00');
  d.setDate(d.getDate() - giorni);
  const oggi = new Date(); oggi.setHours(12,0,0,0);
  if(d < oggi) return '';           /* già passata: meglio nessuna scadenza che una in rosso */
  return d.toISOString().slice(0,10);
}
function formListaPronta(){
  const t = viaggio();
  const gia = t.todo.map(x => x.t.toLowerCase());
  const voci = TODO_PRONTE.filter(x => gia.indexOf(x.t.toLowerCase()) < 0);
  if(!voci.length){ toast('Le hai già tutte nella lista'); return; }
  modal(mHead('Lista pronta', 'Le cose che servono quasi sempre. Togli quelle che non ti riguardano.') +
    '<div class="modal-b">' +
      (t.dal ? '<p style="margin:0 0 12px;font-size:12.5px;color:var(--ink-3)">Le scadenze le calcolo da sole partendo dal ' +
        fmtDate(t.dal) + '.</p>' : '<p style="margin:0 0 12px;font-size:12.5px;color:var(--ink-3)">Senza date di partenza le aggiungo senza scadenza.</p>') +
      '<div class="card"><div class="card-b" style="display:flex;flex-direction:column;gap:11px">' +
        voci.map((x,i) => '<label class="check"><input type="checkbox" data-lista="' + i + '" ' + (x.on ? 'checked' : '') + '>' +
          '<span><span style="font-weight:600">' + esc(x.t) + '</span>' +
          (dataMeno(x.g) ? '<span style="display:block;font-size:11.5px;color:var(--ink-3)">entro il ' + fmtDate(dataMeno(x.g)) + '</span>' : '') +
          '</span></label>').join('') +
      '</div></div>' +
    '</div>' +
    '<div class="modal-f"><span class="hint">Poi le modifichi come vuoi</span><span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
      '<button class="btn btn-primary" data-act="salva-lista">Aggiungi le selezionate</button></div>');
  $('modal').dataset.voci = JSON.stringify(voci);
}
function salvaListaPronta(){
  const t = viaggio();
  const voci = JSON.parse($('modal').dataset.voci || '[]');
  let n = 0;
  document.querySelectorAll('#modal input[data-lista]').forEach(inp => {
    if(!inp.checked) return;
    const v = voci[+inp.dataset.lista];
    if(!v) return;
    t.todo.push({id:uid(), t:v.t, scad:dataMeno(v.g), per:'', fatto:false});
    n++;
  });
  save(); closeModal(); V.tab = 'dafare'; render();
  toast(n ? n + (n === 1 ? ' cosa aggiunta' : ' cose aggiunte') : 'Nessuna selezione');
}

/* --- lista del bagaglio: la stessa lista condivisa, con voci diverse --- */
const BAGAGLIO_PRONTO = [
  'Documento d\'identità e passaporto', 'Carte di pagamento e un po\' di contanti',
  'Caricabatterie e power bank', 'Adattatore per le prese', 'Farmaci e piccola farmacia',
  'Occhiali da sole e crema solare', 'Spazzolino e necessaire', 'Cambio per ogni giorno',
  'Una felpa o giacca leggera', 'Scarpe comode per camminare', 'Costume e telo',
  'Borraccia', 'Cuffie', 'Ombrello o k-way'
];
function formBagaglio(){
  const t = viaggio();
  const gia = t.todo.map(x => x.t.toLowerCase());
  const voci = BAGAGLIO_PRONTO.filter(x => gia.indexOf(x.toLowerCase()) < 0);
  if(!voci.length){ toast('Il bagaglio è già tutto in lista'); return; }
  modal(mHead('Cosa mettere in valigia', 'Spunta quello che ti serve: finisce nella lista condivisa del viaggio.') +
    '<div class="modal-b"><div class="card"><div class="card-b" style="display:flex;flex-direction:column;gap:11px">' +
      voci.map((x,i) => '<label class="check"><input type="checkbox" data-bag="' + i + '" checked>' +
        '<span style="font-weight:600">' + esc(x) + '</span></label>').join('') +
    '</div></div></div>' +
    '<div class="modal-f"><span class="hint">Le puoi spuntare mentre prepari</span><span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
      '<button class="btn btn-primary" data-act="salva-bagaglio">Aggiungi alla lista</button></div>');
  $('modal').dataset.bagaglio = JSON.stringify(voci);
}
function salvaBagaglio(){
  const t = viaggio();
  const voci = JSON.parse($('modal').dataset.bagaglio || '[]');
  let n = 0;
  document.querySelectorAll('#modal input[data-bag]').forEach(inp => {
    if(!inp.checked) return;
    const v = voci[+inp.dataset.bag];
    if(v == null) return;
    t.todo.push({id:uid(), t:v, scad:dataMeno(2), per:'', fatto:false, bagaglio:true});
    n++;
  });
  save(); closeModal(); V.tab = 'dafare'; render();
  toast(n ? n + (n === 1 ? ' cosa in valigia' : ' cose in valigia') : 'Nessuna selezione');
}
