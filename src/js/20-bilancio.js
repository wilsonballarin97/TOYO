/* ==========================================================================
   BILANCIO · calcolato dai costi che inserisci, senza reinserire niente
   ========================================================================== */
function bilancioGlobale(){
  const lista = mieiViaggi();
  const b = {incassato:0, atteso:0, speso:0, daPagare:0, mioVersato:0, miaQuota:0, viaggi:[]};
  lista.forEach(t => {
    const s = statoViaggio(t);
    b.incassato += s.incassato; b.atteso += s.atteso;
    b.speso += s.speso; b.daPagare += s.daPagare;
    b.mioVersato += s.mioVersato; b.miaQuota += num(t.quota);
    b.viaggi.push({t, s});
  });
  b.cassa = b.incassato - b.speso;
  return b;
}
function cardBilancio(){
  const org = DB.ruolo === 'organizzatore';
  const b = bilancioGlobale();
  const conMovimenti = b.viaggi.filter(x => x.s.totSpese > 0 || x.s.incassato > 0 || x.s.mioVersato > 0);
  if(!conMovimenti.length) return '';

  if(org) return `
  <div class="card">
    <div class="card-h"><div><h3>Bilancio di tutti i tuoi viaggi</h3>
      <div class="sub">Calcolato da spese e quote che hai inserito · si aggiorna da solo</div></div>
      <div class="rt"><b class="num" style="font-size:17px;color:${b.cassa>=0?'var(--sage)':'var(--red)'}">${eur(b.cassa)}</b>
        <small style="display:block;font-size:10.5px;color:var(--ink-3);text-align:right">in cassa</small></div></div>
    <div class="card-b">
      <div class="rows">
        <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Quote incassate</span></span>
          <span class="rt"><span class="v num" style="color:var(--sage)">+ ${eur(b.incassato)}</span></span></div>
        <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Da incassare</span></span>
          <span class="rt"><span class="v num" style="color:var(--ink-3)">${eur(Math.max(0, b.atteso - b.incassato))}</span></span></div>
        <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Spese pagate</span></span>
          <span class="rt"><span class="v num" style="color:var(--terracotta)">− ${eur(Math.abs(b.speso))}</span></span></div>
        <div class="row" style="padding:8px 2px"><span class="tx"><span class="t">Spese ancora da pagare</span></span>
          <span class="rt"><span class="v num" style="color:var(--ink-3)">${eur(b.daPagare)}</span></span></div>
      </div>
      ${b.daPagare > b.cassa ? '<div style="margin-top:10px"><span class="pill warn">Devi ancora pagare più di quanto hai in cassa</span></div>' : ''}
      <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">
        ${conMovimenti.map(({t,s}) => {
          const pct = s.atteso ? Math.min(100, Math.round(s.incassato / s.atteso * 100)) : 0;
          return `<button style="width:100%;text-align:left" data-act="open-trip" data-id="${esc(t.id)}">
            <div style="display:flex;align-items:baseline;gap:8px;font-size:12.5px;margin-bottom:5px">
              <b style="font-weight:650">${esc(t.emoji)} ${esc(t.nome)}</b>
              <span style="margin-left:auto;color:var(--ink-3)">${eur(s.incassato)} incassati · ${eur(s.speso)} spesi</span></div>
            <span class="bar" style="display:block"><i class="${pct>=100?'sage':''}" style="width:${pct}%"></i></span>
          </button>`;
        }).join('')}
      </div>
    </div>
  </div>`;

  return `
  <div class="card">
    <div class="card-h"><div><h3>Quanto ti costano i viaggi</h3>
      <div class="sub">Somma delle quote che hai segnato</div></div>
      <div class="rt"><b class="num" style="font-size:17px">${eur(Math.max(0, b.miaQuota - b.mioVersato))}</b>
        <small style="display:block;font-size:10.5px;color:var(--ink-3);text-align:right">da versare</small></div></div>
    <div class="card-b"><div class="rows">
      ${conMovimenti.map(({t,s}) => {
        const q = num(t.quota), pct = q ? Math.min(100, Math.round(s.mioVersato / q * 100)) : 0;
        return `<div class="row" style="padding:9px 2px">
          <span class="tx"><span class="t">${esc(t.emoji)} ${esc(t.nome)}</span>
            <span class="m">${q ? eur(s.mioVersato) + ' su ' + eur(q) : 'quota non impostata'}</span></span>
          <span class="rt">${q ? '<span class="bar" style="width:70px;flex:0 0 70px"><i class="' + (pct>=100?'sage':'gold') + '" style="width:' + pct + '%"></i></span>' : ''}
            <span class="v num">${eur(Math.max(0, q - s.mioVersato))}</span></span></div>`;
      }).join('')}
    </div></div>
  </div>`;
}
