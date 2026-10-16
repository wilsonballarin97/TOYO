/* ==========================================================================
   DOCUMENTI PERSONALI
   ========================================================================== */
function rigaDoc(d, scope){
  const f = d.file;
  const isImg = f && /^image\//.test(f.mime);
  const cls = f ? (isImg ? 'img' : (/pdf/.test(f.mime) ? 'pdf' : '')) : '';
  const tag = f ? (isImg ? 'IMG' : (/pdf/.test(f.mime) ? 'PDF' : 'FILE')) : '—';
  const gg = giorniA(d.scad);
  const badge = d.scad
    ? (gg < 0 ? '<span class="pill red">scaduto</span>'
      : gg <= 60 ? '<span class="pill warn">scade tra ' + gg + 'g</span>'
      : '<span class="pill ok">valido</span>')
    : '';
  const tipi = scope === 'trip' ? TIPI_DOC_V : TIPI_DOC;
  return `
  <div class="doc">
    <span class="fic ${cls}">${tag}</span>
    <span class="tx" ${f ? 'data-act="view-doc" data-id="' + esc(d.id) + '" data-scope="' + esc(scope) + '" style="cursor:pointer"' : ''}>
      <span class="t">${esc(d.nome)}</span>
      <span class="m">${esc(nomeTipo(d.tipo, tipi).n)}${d.numero ? ' · n. ' + esc(d.numero) : ''}${
        d.scad ? ' · scade il ' + fmtDate(d.scad) : ''}${f ? ' · ' + kb(f.size) : ' · nessun file allegato'}</span>
    </span>
    <span class="rt" style="display:flex;align-items:center;gap:6px">
      ${badge}
      <span class="acts-row">
        ${f ? '<button class="ibtn" data-act="dl-doc" data-id="' + esc(d.id) + '" data-scope="' + esc(scope) + '" title="Scarica"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M6 13l6 6 6-6"/></svg></button>' : ''}
        <button class="ibtn" data-act="edit-doc" data-id="${esc(d.id)}" data-scope="${esc(scope)}" title="Modifica" aria-label="Modifica">${ico('matita',16)}</button>
        <button class="ibtn del" data-act="del-doc" data-id="${esc(d.id)}" data-scope="${esc(scope)}" title="Elimina" aria-label="Elimina">${ico('cestino',16)}</button>
      </span>
    </span>
  </div>`;
}

function viewDocs(){
  const scaduti = DB.docs.filter(d => d.scad && giorniA(d.scad) < 0).length;
  const inScadenza = DB.docs.filter(d => d.scad && giorniA(d.scad) >= 0 && giorniA(d.scad) <= 60).length;
  return `
  <button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-act="nav" data-view="hub">← Tutti i viaggi</button>

  <div class="sec-head"><h2>I tuoi documenti</h2>
    <span class="sub">Carta d'identità, patente, passaporto: sempre a portata di mano</span>
    <span class="rt"><button class="btn btn-primary btn-sm" data-act="new-doc-me">＋ Aggiungi documento</button></span></div>

  ${scaduti || inScadenza ? `
    <div class="card" style="border-left:3px solid ${scaduti ? 'var(--red)' : 'var(--terracotta)'}">
      <div class="card-b" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span style="font-size:20px">${scaduti ? '' : '<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h10M7 20.5h10"/><path d="M7.5 3.5c0 4.3 4.5 5.3 4.5 8.5s-4.5 4.2-4.5 8.5M16.5 3.5c0 4.3-4.5 5.3-4.5 8.5s4.5 4.2 4.5 8.5"/></svg>'}</span>
        <div style="flex:1;min-width:200px">
          <div style="font-weight:650;font-size:13.5px">${scaduti ? scaduti + (scaduti===1?' documento scaduto':' documenti scaduti') : inScadenza + (inScadenza===1?' documento in scadenza':' documenti in scadenza')}</div>
          <div style="font-size:12px;color:var(--ink-3)">Rinnovalo prima di partire, o rischi di restare a terra.</div>
        </div>
      </div>
    </div>` : ''}

  <button class="drop" data-act="new-doc-me">
    <span class="ic">${ico('tessera',18)}</span>
    <span><span class="t">Allega un documento</span><span class="m">${storageAttivo() ? 'Foto o PDF fino a 10 MB. Vanno nel tuo archivio privato: li apri solo tu.' : 'Foto o PDF fino a 3 MB. Restano su questo dispositivo, non li vede nessun altro.'}</span></span>
  </button>

  <div class="card">
    ${DB.docs.length ? '<div class="card-b tight">' + DB.docs.map(d => rigaDoc(d, 'me')).join('') + '</div>'
      : vuoto('tessera','Nessun documento','Carta d\'identità o patente: caricali una volta e li ritrovi in ogni viaggio.')}
  </div>

  <div class="card">
    <div class="card-h"><div><h3>Documenti nei viaggi</h3><div class="sub">Biglietti e prenotazioni allegati ai singoli viaggi</div></div></div>
    ${DB.viaggi.some(t => t.docs.length) ? '<div class="card-b tight">' + DB.viaggi.filter(t => t.docs.length).map(t => `
      <button class="doc" data-act="open-trip" data-id="${esc(t.id)}">
        <span class="fic" style="background:var(--surface-2);color:var(--ink-2);border:1px solid var(--line);font-size:14px">${esc(t.emoji)}</span>
        <span class="tx"><span class="t">${esc(t.nome)}</span><span class="m">${t.docs.length} ${t.docs.length===1?'documento':'documenti'}</span></span>
        <span class="rt" style="font-size:12px;font-weight:650;color:var(--terracotta)">Apri →</span>
      </button>`).join('') + '</div>'
    : vuoto('archivio','Nessun allegato','Qui finiscono i documenti che carichi dentro ai singoli viaggi.')}
  </div>`;
}
