/* ==========================================================================
   DECISIONI · sondaggi
   La parte che di solito si perde in un gruppo WhatsApp: dove andiamo, che
   date, quale casa. Chi organizza propone, tutti votano, il conto è visibile
   a tutti e chi non ha ancora votato si vede.
   ========================================================================== */
function tabDecisioni(t){
  const org = posso(t);
  const lista = t.sondaggi || [];
  return `
  <div class="sec-head"><h2>Decidere insieme</h2>
    <span class="sub">${lista.length ? lista.length + (lista.length === 1 ? ' domanda' : ' domande') : 'Mete, date, alloggio: si vota, non si discute all\'infinito'}</span>
    ${org ? '<span class="rt"><button class="btn btn-primary btn-sm" data-act="new-sondaggio">＋ Nuova domanda</button></span>' : ''}</div>

  ${lista.length ? lista.map(sd => {
    const n = conteggio(t, sd);
    const tot = Object.keys(n).reduce((a,k) => a + n[k], 0);
    const mio = mioVoto(t, sd);
    const max = Math.max(0, ...Object.keys(n).map(k => n[k]));
    return `
    <div class="card">
      <div class="card-h"><div><h3>${esc(sd.domanda)}</h3>
        <div class="sub">${sd.chiuso ? 'Votazione chiusa' : (tot ? tot + (tot === 1 ? ' voto' : ' voti') : 'Ancora nessun voto')}${
          mio ? ' · hai votato' : (sd.chiuso ? '' : ' · tocca la tua preferenza')}</div></div>
        ${org ? `<div class="rt"><span class="acts-row">
          <button class="ibtn" data-act="chiudi-sondaggio" data-id="${esc(sd.id)}" title="${sd.chiuso ? 'Riapri' : 'Chiudi'}">${sd.chiuso ? ico('chiave',16) : ico('lucchetto',16)}</button>
          <button class="ibtn del" data-act="del-sondaggio" data-id="${esc(sd.id)}" title="Elimina" aria-label="Elimina">${ico('cestino',16)}</button>
        </span></div>` : ''}</div>
      <div class="card-b tight">
        ${(sd.opzioni || []).map(o => {
          const v = n[o.id] || 0;
          const perc = tot ? Math.round(v / tot * 100) : 0;
          const vince = tot && v === max && v > 0;
          const scelto = mio === o.id;
          const chi = votiDi(t, sd).filter(x => x.opzione === o.id).map(x => '@' + x.nick).join(', ');
          return `
          <button class="row" style="width:100%;text-align:left;background:none;border:0;padding:10px 2px;cursor:${sd.chiuso ? 'default' : 'pointer'}"
            ${sd.chiuso ? '' : `data-act="vota" data-id="${esc(sd.id)}" data-v="${esc(o.id)}"`}>
            <span class="ic" style="${scelto ? 'background:var(--sage-soft);border-color:var(--sage-soft);color:var(--sage)' : ''}">${scelto ? '<svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>' : (vince ? '<svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.8l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 10l5.9-.8z"/></svg>' : '·')}</span>
            <span class="tx"><span class="t" style="${vince ? 'font-weight:650' : ''}">${esc(o.testo)}</span>
              ${chi ? '<span class="m">' + esc(chi) + '</span>' : '<span class="m">nessun voto</span>'}
              <span class="bar" style="max-width:220px;margin-top:6px"><i class="${vince ? 'sage' : 'gold'}" style="width:${perc}%"></i></span></span>
            <span class="rt"><span class="v num">${v}</span></span>
          </button>`;
        }).join('')}
      </div>
    </div>`;
  }).join('') : `
    <div class="card"><div class="card-b empty">
      ${org ? 'Nessuna domanda aperta. Proponi le mete o le date e lascia decidere al gruppo: chi partecipa vota dal suo TOYO, tu vedi il risultato aggiornarsi.'
            : 'Chi organizza non ha ancora chiesto niente. Quando arriverà una domanda, la voti da qui.'}
    </div></div>`}

  ${!sb || !utente ? `<div class="card"><div class="card-b" style="font-size:12.5px;color:var(--ink-3)">
    I sondaggi hanno bisogno degli account: i voti viaggiano sul server, non su questo dispositivo.
  </div></div>` : ''}`;
}

function tabDaFare(t){
  const aperti = t.todo.filter(x => !x.fatto);
  const fatti = t.todo.filter(x => x.fatto);
  return `
  <div class="sec-head"><h2>Da fare</h2><span class="sub">${aperti.length} aperte · ${fatti.length} fatte</span>
    ${posso(t) ? `<span class="rt" style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm" data-act="lista-pronta"><svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.8l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 10l5.9-.8z"/></svg> Lista pronta</button>
      <button class="btn btn-ghost btn-sm" data-act="lista-bagaglio">${ico('valigia',14)} Bagaglio</button>
      <button class="btn btn-primary btn-sm" data-act="new-todo">＋ Nuova cosa da fare</button></span>` : ''}</div>
  <div class="card">
    ${t.todo.length ? '<div class="card-b tight"><div class="rows">' +
      aperti.map(x => rigaTodo(t, x)).join('') + fatti.map(x => rigaTodo(t, x)).join('') + '</div></div>'
    : `<div class="card-b" style="text-align:center;padding:26px 16px">
        <div style="font-size:13px;color:var(--ink-3);max-width:400px;margin:0 auto 14px">
          Prenotare voli e alloggio, controllare i documenti, raccogliere le quote, fare il check-in:
          la lista pronta te le mette tutte, con le scadenze calcolate dalla data di partenza.</div>
        <button class="btn btn-primary btn-sm" data-act="lista-pronta"><svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.8l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 10l5.9-.8z"/></svg> Usa la lista pronta</button>
       </div>`}
  </div>`;
}
function rigaTodo(t, x){
  const gg = giorniA(x.scad);
  const late = !x.fatto && gg != null && gg < 0;
  return `
  <div class="row ${x.fatto ? 'done' : ''}">
    <button class="ic" ${posso(t) ? 'data-act="toggle-todo" data-id="' + esc(x.id) + '"' : ''} title="${x.fatto ? 'Fatta' : 'Da fare'}"
      style="${x.fatto ? '' : 'border-color:var(--line-strong)'}">${x.fatto ? '<svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>' : ''}</button>
    <span class="tx"><span class="t">${esc(x.t)}</span>
      ${(x.scad || x.per) ? '<span class="m">' + (x.per ? '' + ico('persona',15) + '' + esc(x.per) + (x.scad ? ' · ' : '') : '') +
        (x.scad ? (late ? 'era per il ' : 'entro il ') + fmtDate(x.scad) : '') + '</span>' : ''}</span>
    <span class="rt">
      ${late ? '<span class="pill red">in ritardo</span>' : (!x.fatto && gg != null && gg <= 3 ? '<span class="pill warn">tra ' + gg + 'g</span>' : '')}
      ${posso(t) ? `<span class="acts-row">
        <button class="ibtn" data-act="edit-todo" data-id="${esc(x.id)}" title="Modifica" aria-label="Modifica">${ico('matita',16)}</button>
        <button class="ibtn del" data-act="del-todo" data-id="${esc(x.id)}" title="Elimina" aria-label="Elimina">${ico('cestino',16)}</button>
      </span>` : ''}
    </span>
  </div>`;
}
