/* ==========================================================================
   REPORT SPESE · una barra per categoria, divisa in pagato e da pagare
   Colori validati per daltonismo; ogni barra ha etichetta e importo scritti.
   ========================================================================== */
function legendaSpese(){
  return '<div class="replegend">' +
    '<span><i style="background:var(--chart-ok)"></i>pagato</span>' +
    '<span><i style="background:var(--chart-due)"></i>ancora da pagare</span>' +
    '</div>';
}
function barreCategorie(righe){
  const max = Math.max.apply(null, righe.map(r => r.tot));
  return '<div class="rep">' + righe.map(r => {
    const c = cat(r.cat);
    const wTot = max ? Math.max(4, Math.round(r.tot / max * 100)) : 0;
    const qPag = r.tot ? r.pagato / r.tot : 0;
    const wOk = Math.round(qPag * 100), wDue = 100 - wOk;
    const solo = wOk === 0 || wOk === 100;
    return '<div class="repline" title="' + esc(c.n) + ': ' + eur(r.tot) +
        ' · pagato ' + eur(r.pagato) + ' · da pagare ' + eur(r.tot - r.pagato) + '">' +
      '<div class="top"><span class="nm">' + c.ic + ' ' + esc(c.n) + '</span>' +
        '<span class="q">' + r.n + (r.n === 1 ? ' voce' : ' voci') + '</span>' +
        '<span class="rt">' + eur(r.tot) + '</span></div>' +
      '<div class="rbar"><div class="fill" style="width:' + wTot + '%">' +
        (wOk > 0 ? '<span class="seg ok ' + (solo ? 'solo' : '') + '" style="width:' + wOk + '%"></span>' : '') +
        (wDue > 0 ? '<span class="seg due ' + (solo ? 'solo' : '') + '" style="width:' + wDue + '%"></span>' : '') +
      '</div></div></div>';
  }).join('') + '</div>';
}
function reportSpese(t){
  const s = statoViaggio(t);
  const righe = perCategoria(s.voci);
  if(!righe.length) return `
    <div class="card">
      <div class="card-h"><div><h3>Report spese</h3><div class="sub">Ancora nessun costo inserito</div></div></div>
      <div class="card-b empty">Nessuna spesa ancora. Scrivi un costo su un punto dell'itinerario, su una prenotazione o qui fra le spese:
        il report e il bilancio si riempiono da soli.</div>
    </div>`;
  const perFonte = ['itinerario','prenotazione','spesa'].map(f => ({
    f, tot:s.voci.filter(x => x.fonte === f).reduce((n,x) => n + x.importo, 0)
  })).filter(x => x.tot > 0);
  const nomiFonte = {itinerario:'dall\'itinerario', prenotazione:'dalle prenotazioni', spesa:'aggiunte a mano'};
  return `
  <div class="card">
    <div class="card-h"><div><h3>Report spese</h3><div class="sub">Somma di itinerario, prenotazioni e spese · si aggiorna da solo</div></div></div>
    <div class="card-b">
      <div class="reptot">
        <span class="big">${eur(s.totSpese)}</span>
        <span class="m">in tutto · ${eur(s.speso)} già pagati · <b style="color:var(--terracotta)">${eur(s.daPagare)}</b> da pagare</span>
      </div>
      ${legendaSpese()}
      ${barreCategorie(righe)}
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line);font-size:11.5px;color:var(--ink-3)">
        Da dove arrivano: ${perFonte.map(x => eur(x.tot) + ' ' + nomiFonte[x.f]).join(' · ')}
      </div>
    </div>
  </div>`;
}
function reportGlobale(){
  const lista = mieiViaggi();
  const voci = [];
  lista.forEach(t => vociSpesa(t).forEach(v => voci.push(v)));
  if(!voci.length) return '';
  const righe = perCategoria(voci);
  const tot = voci.reduce((n,x) => n + x.importo, 0);
  const pag = voci.filter(x => x.pagato).reduce((n,x) => n + x.importo, 0);
  return `
  <div class="card">
    <div class="card-h"><div><h3>Report spese</h3>
      <div class="sub">Tutti i tuoi viaggi, per categoria</div></div>
      <div class="rt"><b class="num" style="font-size:17px">${eur(tot)}</b>
        <small style="display:block;font-size:10.5px;color:var(--ink-3);text-align:right">totale</small></div></div>
    <div class="card-b">
      <div class="reptot" style="padding-bottom:8px">
        <span class="m">${eur(pag)} già pagati · <b style="color:var(--terracotta)">${eur(tot - pag)}</b> ancora da pagare</span>
      </div>
      ${legendaSpese()}
      ${barreCategorie(righe)}
    </div>
  </div>`;
}
