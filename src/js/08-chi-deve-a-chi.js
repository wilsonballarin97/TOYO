/* ==========================================================================
   CHI DEVE QUANTO A CHI
   Ogni spesa sa chi l'ha anticipata e fra chi va divisa. Da lì si ricava il
   saldo di ciascuno, e dai saldi il minor numero di bonifici che chiude tutto:
   se Anna deve 20 a Bruno e Bruno deve 20 a Carlo, si salta Bruno e Anna paga
   Carlo. È la stessa idea del "semplifica i debiti" di Splitwise: i totali di
   ognuno non cambiano, cambia solo il giro dei soldi.
   ========================================================================== */
/* Chi entra nel conto: chi organizza, i partecipanti che hanno accettato
   l'invito (arrivano dal server) e le persone segnate a mano nella scheda
   Persone, per chi non ha un account TOYO.
   L'organizzatore tiene l'identificativo 'org' anche adesso che si conosce il
   suo id vero: le spese già registrate lo usano, e cambiarlo le scollegherebbe. */
function rosterSpese(t){
  const nomeOrg = t.mio ? 'Tu' : (t.organizzatore ? '@' + t.organizzatore : 'Chi organizza');
  const out = [{id:'org', nome:nomeOrg}];

  (membri[t.id] || []).filter(m => m.stato === 'accettato').forEach(m => {
    const io = utente && m.utente === utente.id;
    out.push({id:m.utente, nome: io ? 'Tu' : ('@' + (m.nick || 'partecipante')), account:true});
  });

  (t.gente || []).forEach(p => out.push({id:p.id, nome:p.nome || 'Senza nome'}));
  return out;
}
function bilanci(t){
  const roster = rosterSpese(t), b = {};
  roster.forEach(p => b[p.id] = 0);
  tutteSpese(t).forEach(x => {
    const imp = num(x.importo);
    if(!imp) return;
    const chi = b[x.chiPaga] !== undefined ? x.chiPaga : 'org';
    let fra = Array.isArray(x.divisoTra) && x.divisoTra.length
      ? x.divisoTra.filter(id => b[id] !== undefined)
      : roster.map(p => p.id);
    if(!fra.length) fra = [chi];
    const quota = imp / fra.length;
    b[chi] += imp;
    fra.forEach(id => b[id] -= quota);
  });
  return {roster, b};
}
/* In centesimi: sommando divisioni per tre, in virgola mobile restano briciole
   che farebbero comparire bonifici da 0,00 €. */
function saldi(t){
  const {roster, b} = bilanci(t);
  const c = x => Math.round(x * 100);
  const deve = [], avanza = [];
  roster.forEach(p => {
    const v = c(b[p.id]);
    if(v < 0) deve.push({id:p.id, v:-v});
    else if(v > 0) avanza.push({id:p.id, v});
  });
  deve.sort((x,y) => y.v - x.v); avanza.sort((x,y) => y.v - x.v);
  const giri = [];
  let i = 0, j = 0;
  while(i < deve.length && j < avanza.length){
    const q = Math.min(deve[i].v, avanza[j].v);
    if(q > 0) giri.push({da:deve[i].id, a:avanza[j].id, q:q / 100});
    deve[i].v -= q; avanza[j].v -= q;
    if(!deve[i].v) i++;
    if(!avanza[j].v) j++;
  }
  return {roster, b, giri};
}
function cardSaldi(t){
  const conImporto = tutteSpese(t).some(x => num(x.importo));
  if(!conImporto) return '';
  const {roster, b, giri} = saldi(t);
  const nome = id => (roster.find(p => p.id === id) || {}).nome || '?';
  return `
  <div class="card">
    <div class="card-h"><div><h3>Chi deve quanto a chi</h3>
      <div class="sub">${giri.length
        ? giri.length + (giri.length === 1 ? ' bonifico e siete pari' : ' bonifici e siete pari')
        : 'Siete già pari: nessuno deve niente a nessuno'}</div></div></div>
    <div class="card-b tight">
      <div class="rows">
        ${roster.map(p => {
          const v = b[p.id];
          const stato = Math.abs(v) < 0.005 ? 'in pari' : (v > 0 ? 'gli spettano' : 'deve dare');
          const col = Math.abs(v) < 0.005 ? 'var(--ink-3)' : (v > 0 ? 'var(--sage)' : 'var(--terracotta)');
          return `<div class="row" style="padding:8px 2px">
            <span class="tx"><span class="t">${esc(p.nome)}</span><span class="m">${stato}</span></span>
            <span class="rt"><span class="v num" style="color:${col}">${eur(Math.abs(v))}</span></span></div>`;
        }).join('')}
      </div>
      ${giri.length ? `<div style="margin-top:13px;padding-top:13px;border-top:1px solid var(--line)">
        <div style="font-weight:650;font-size:13px;margin-bottom:9px">Per chiudere i conti</div>
        ${giri.map(g => `<div style="display:flex;align-items:center;gap:8px;font-size:13px;padding:5px 0;flex-wrap:wrap">
          <span style="font-weight:600">${esc(nome(g.da))}</span>
          <span style="color:var(--ink-3)">→</span>
          <span style="font-weight:600">${esc(nome(g.a))}</span>
          <span style="flex:1"></span>
          <span class="num" style="font-weight:650">${eur(g.q)}</span>
        </div>`).join('')}
      </div>` : ''}
      ${condivisiVecchi ? `<div style="font-size:12px;color:var(--terracotta);margin-top:11px;font-weight:500">
        Non sono riuscito a leggere le spese e i partecipanti dal server: questi numeri
        potrebbero essere incompleti. Ricarica quando torna la rete.</div>` : ''}
      <div style="font-size:11.5px;color:var(--ink-3);margin-top:11px">
        Contano solo le spese con un importo. Se non dici chi ha pagato e fra chi dividere,
        TOYO dà per scontato che abbia anticipato chi organizza e che si divida fra tutti.
      </div>
    </div>
  </div>`;
}

function tabSoldi(t, s){
  const org = t.mio;
  return `
  ${cardSaldi(t)}
  ${reportSpese(t)}
  <div class="split">
    <div class="col">
      ${(() => {
        /* Adesso la lista è di tutti: le voci di chi organizza e quelle
           registrate da chi parte. Ognuno tocca solo le proprie. */
        const spese = tutteSpese(t);
        const mie = spese.filter(x => !x.condivisa || miaSpesa(x)).length;
        return `
      <div class="sec-head"><h2>Altre spese</h2>
        <span class="sub">${spese.length
          ? spese.length + (spese.length === 1 ? ' voce' : ' voci') + (mie < spese.length ? ' · ' + (spese.length - mie) + ' da chi parte con te' : '')
          : 'Quelle che non stanno né in itinerario né in prenotazioni'}</span>
        <span class="rt"><button class="btn btn-primary btn-sm" data-act="new-spesa">＋ Nuova spesa</button></span></div>
      <div class="card">
        ${spese.length ? '<div class="card-b tight"><div class="rows">' + spese.map(x => {
          const mia = !x.condivisa || miaSpesa(x);
          const tocco = x.condivisa ? mia : posso(t);
          return `
          <div class="row ${x.pagato ? 'done' : ''}">
            <button class="ic" ${tocco ? `data-act="toggle-spesa" data-id="${esc(x.id)}"` : ''} title="${x.pagato ? 'Pagata' : 'Da pagare'}"
              style="${x.pagato ? 'background:var(--sage-soft);border-color:var(--sage-soft);color:var(--sage)' : 'color:var(--terracotta)'}">${x.pagato ? '<svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>' : '€'}</button>
            <span class="tx"><span class="t">${esc(x.voce)}</span>
              <span class="m">${x.condivisa && !mia ? 'registrata da @' + esc(x.daNick || 'chi parte') + ' · ' : ''}${
                x.fornitore ? esc(x.fornitore) + ' · ' : ''}${x.pagato ? 'pagata' : 'da pagare'}</span></span>
            <span class="rt"><span class="v num">${eur(x.importo)}</span>
              ${tocco ? `<span class="acts-row">
                <button class="ibtn" data-act="edit-spesa" data-id="${esc(x.id)}" title="Modifica" aria-label="Modifica">${ico('matita',16)}</button>
                <button class="ibtn del" data-act="del-spesa" data-id="${esc(x.id)}" title="Elimina" aria-label="Elimina">${ico('cestino',16)}</button>
              </span>` : ''}</span>
          </div>`;
        }).join('') + '</div></div>'
        : vuoto('euro','Nessuna spesa ancora','I costi di itinerario e prenotazioni entrano da soli. Qui aggiungi il resto: cassa comune, cene, mance, imprevisti.')}
      </div>`;
      })()}
    </div>

    <div class="col col-side">
      <div class="card">
        <div class="card-h"><div><h3>${org ? 'Bilancio' : 'La tua quota'}</h3><div class="sub">Aggiornato a ora</div></div></div>
        <div class="card-b">
          ${org ? `
          <div class="rows">
            <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Quota a persona</span></span>
              <span class="rt"><span class="v num">${num(t.quota) ? eur(t.quota) : '—'}</span></span></div>
            <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Quote incassate</span></span>
              <span class="rt"><span class="v num" style="color:var(--sage)">+ ${eur(s.incassato)}</span></span></div>
            <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Da incassare</span></span>
              <span class="rt"><span class="v num" style="color:var(--ink-3)">${eur(Math.max(0, s.atteso - s.incassato))}</span></span></div>
            <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Spese pagate</span></span>
              <span class="rt"><span class="v num" style="color:var(--terracotta)">− ${eur(Math.abs(s.speso))}</span></span></div>
            <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Spese da pagare</span></span>
              <span class="rt"><span class="v num" style="color:var(--ink-3)">${eur(s.daPagare)}</span></span></div>
            <div class="row" style="padding:11px 2px;border-top:2px solid var(--line-strong)">
              <span class="tx"><span class="t">In cassa adesso</span></span>
              <span class="rt"><span class="v num" style="font-size:17px;color:${s.cassa>=0?'var(--sage)':'var(--red)'}">${eur(s.cassa)}</span></span></div>
          </div>
          ${s.daPagare > s.cassa ? '<div style="margin-top:11px"><span class="pill warn">Da pagare più di quanto hai in cassa</span></div>' : ''}
          ${(() => {
            const n = t.gente.length || num(t.posti);
            if(!n || !s.totSpese) return '<button class="btn btn-ghost btn-full btn-sm" style="margin-top:12px" data-act="edit-trip" data-id="' + esc(t.id) + '">Imposta la quota a persona</button>';
            const sugg = Math.ceil(s.totSpese / n);
            const uguale = Math.abs(sugg - num(t.quota)) < 1;
            return `<div style="margin-top:13px;padding:12px;border-radius:var(--r-btn);background:var(--surface-2);border:1px solid var(--line)">
              <div style="font-size:12px;color:var(--ink-3)">Con ${eur(s.totSpese)} di spese e ${n} ${n===1?'persona':'persone'}, la quota sarebbe</div>
              <div style="display:flex;align-items:center;gap:10px;margin-top:4px;flex-wrap:wrap">
                <b class="num" style="font-size:21px;letter-spacing:-.03em">${eur(sugg)}</b>
                <span style="font-size:11.5px;color:var(--ink-3)">a testa</span>
                ${uguale ? '<span class="pill ok" style="margin-left:auto">è già quella impostata</span>'
                  : '<button class="btn btn-sage btn-sm" style="margin-left:auto" data-act="usa-quota" data-v="' + esc(sugg) + '">Usa questa quota</button>'}
              </div></div>`;
          })()}`
          : `
          <div style="text-align:center;padding:4px 0 12px">
            <div class="num" style="font-size:32px;font-weight:700;letter-spacing:-.035em">${eur(Math.max(0, num(t.quota) - s.mioVersato))}</div>
            <div style="font-size:12.5px;color:var(--ink-3);margin-top:3px">${num(t.quota) ? 'ti resta da versare · quota ' + eur(t.quota) : 'imposta la quota dal pulsante Modifica viaggio'}</div>
          </div>
          <div class="rows">
            <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Hai versato</span></span>
              <span class="rt"><span class="v num" style="color:var(--sage)">${eur(s.mioVersato)}</span></span></div>
            <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Quota totale</span></span>
              <span class="rt"><span class="v num">${num(t.quota) ? eur(t.quota) : '—'}</span></span></div>
          </div>
          <button class="btn btn-primary btn-full btn-sm" style="margin-top:12px" data-act="mia-quota">Aggiorna quanto hai versato</button>`}
        </div>
      </div>

      ${org && t.gente.length ? `
      <div class="card">
        <div class="card-h"><div><h3>Chi ha versato</h3><div class="sub">${t.gente.filter(p => num(p.versato) >= num(t.quota) && num(t.quota) > 0).length} in regola su ${t.gente.length}</div></div></div>
        <div class="card-b tight"><div class="rows">
          ${t.gente.map(p => {
            const q = num(t.quota), v = num(p.versato);
            const pct = q ? Math.min(100, Math.round(v / q * 100)) : 0;
            return `<div class="row">
              <span class="av" style="background:${colorFor(p.nome)};width:28px;height:28px;flex:0 0 28px;font-size:10.5px">${iniz(p.nome, p.nome.split(' ')[1])}</span>
              <span class="tx"><span class="t" style="font-size:13px">${esc(p.nome)}</span></span>
              <span class="rt">
                ${q ? '<span class="bar" style="width:56px;flex:0 0 56px"><i class="' + (pct>=100?'sage':'gold') + '" style="width:' + pct + '%"></i></span>' : ''}
                <span class="v num" style="font-size:12.5px">${eur(v)}</span>
                <span class="acts-row"><button class="ibtn" data-act="edit-persona" data-id="${esc(p.id)}" title="Aggiorna"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10.5-10.5a2.4 2.4 0 0 0-3.4-3.4L4.6 16.6z"/><path d="M14.5 7.5l2 2"/></svg></button></span>
              </span></div>`;
          }).join('')}
        </div></div>
      </div>` : ''}
    </div>
  </div>`;
}

/* ---------- DOCUMENTI VIAGGIO ---------- */
function tabDocumenti(t){
  const org = t.mio;
  const mieiN = (t.mieiDocs || []).length;
  const conDoc = t.gente.filter(p => (p.docs||[]).length).length;
  return `
  <div class="sec-head"><h2>Documenti del viaggio</h2>
    <span class="sub">Biglietti, prenotazioni, voucher, polizze</span>
    ${posso(t) ? '<span class="rt"><button class="btn btn-primary btn-sm" data-act="new-doc-trip">＋ Allega documento</button></span>' : ''}</div>

  ${posso(t) ? `<button class="drop" data-act="new-doc-trip">
    <span class="ic"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5l-8.2 8.2a4.6 4.6 0 0 1-6.5-6.5L14 4.5a3.1 3.1 0 0 1 4.3 4.3l-8.6 8.6a1.5 1.5 0 0 1-2.2-2.2l8-8"/></svg></span>
    <span><span class="t">Allega un file</span><span class="m">${storageAttivo() ? 'PDF o immagine fino a 10 MB, nel tuo archivio privato online.' : 'PDF o immagine, fino a 3 MB. Resta su questo dispositivo.'}</span></span>
  </button>` : ''}

  <div class="card">
    ${t.docs.length ? '<div class="card-b tight">' + t.docs.map(d => rigaDoc(d, 'trip')).join('') + '</div>'
      : vuoto('archivio','Nessun documento','Biglietti, prenotazioni e polizze di questo viaggio restano qui, anche offline.')}
  </div>

  ${org ? `
  <div class="sec-head" style="margin-top:6px"><h2>Documenti delle persone</h2>
    <span class="sub">Carta d'identità e passaporto di chi parte · ${conDoc} su ${t.gente.length || 0} raccolti</span></div>
  <div class="card">
    ${t.gente.length ? '<div class="card-b tight"><div class="rows">' + t.gente.map(p => {
      const nd = (p.docs || []).length;
      return `<div class="row">
        <span class="av" style="background:${colorFor(p.nome)}">${iniz(p.nome, p.nome.split(' ')[1])}</span>
        <span class="tx"><span class="t">${esc(p.nome)}</span>
          <span class="m">${nd ? (p.docs.map(d => esc(nomeTipo(d.tipo).n)).join(' · ')) : 'nessun documento caricato'}</span></span>
        <span class="rt">
          ${nd ? '<span class="pill ok">' + nd + (nd === 1 ? ' file' : ' file') + '</span>' : '<span class="pill warn">manca</span>'}
          <button class="docbtn" data-act="lista-doc" data-scope="p:${p.id}">${ico('tessera',15)}${nd ? 'Apri' : 'Carica'}</button>
        </span></div>`;
    }).join('') + '</div></div>'
    : vuoto('persone','Nessuna persona','Aggiungi prima chi parte con te, poi potrai caricare i loro documenti.')}
  </div>`
  : `
  <div class="sec-head" style="margin-top:6px"><h2>I tuoi documenti per questo viaggio</h2>
    <span class="sub">${mieiN ? mieiN + (mieiN === 1 ? ' caricato' : ' caricati') : "Carta d'identità o passaporto"}</span>
    <span class="rt"><button class="btn btn-ghost btn-sm" data-act="lista-doc" data-scope="mie">${mieiN ? 'Gestisci' : '＋ Carica'}</button></span></div>
  <div class="card">
    ${mieiN ? '<div class="card-b tight">' + t.mieiDocs.map(d => rigaDoc(d, 'mie')).join('') + '</div>'
      : vuoto('tessera','Nessun documento','Caricane uno: l\'organizzatore te lo chieder\u00e0 per prenotare voli e alloggi.')}
  </div>`}`;
}

/* ---------- DA FARE ---------- */
