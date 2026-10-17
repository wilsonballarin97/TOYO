/* ==========================================================================
   HUB
   ========================================================================== */
/* Le richieste ricevute stanno in cima all'hub: è la prima cosa che si vede
   entrando, e non c'è nessun link da andare a cercare nei messaggi. */
function cardInviti(){
  if(!invitiAperti.length) return '';
  return `
  <div class="card" style="border:1px solid var(--gold);border-left-width:3px">
    <div class="card-h"><div>
      <h3>${ico('bustaGiu',15)}${invitiAperti.length === 1 ? 'Ti hanno invitato a un viaggio' : 'Hai ' + invitiAperti.length + ' inviti'}</h3>
      <div class="sub">Accettando lo vedi sempre aggiornato da chi lo organizza</div></div></div>
    <div class="card-b tight"><div class="rows">
      ${invitiAperti.map(m => `
      <div class="row" style="padding:11px 2px">
        <span class="tx"><span class="t">${esc(m.titolo || 'Un viaggio')}</span>
          <span class="m">da @${esc(m.da_nick || 'chi organizza')}</span></span>
        <span class="rt" style="display:flex;gap:7px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" data-act="rifiuta-invito" data-v="${esc(m.viaggio)}">Rifiuta</button>
          <button class="btn btn-primary btn-sm" data-act="accetta-invito" data-v="${esc(m.viaggio)}">Accetta</button>
        </span>
      </div>`).join('')}
    </div></div>
  </div>`;
}

function scheletroHub(){
  return `<div class="grid">${[0,1,2].map(() => '<div class="skel skel-card"></div>').join('')}</div>`;
}

function viewHub(){
  const org = DB.ruolo === 'organizzatore';
  /* Dispositivo nuovo, account con viaggi: c'è un'attesa vera prima che
     scendano. Lì lo scheletro dice "sta arrivando" invece di far credere che
     non ci sia niente. */
  if(!DB.viaggi.length && sincronizzando && utente) return scheletroHub();
  const vivi = viaggiVivi().slice().sort((a,b) => (a.dal||'9999') < (b.dal||'9999') ? -1 : 1);
  const arch = viaggiArch().slice().sort((a,b) => (a.al||'') > (b.al||'') ? -1 : 1);

  if(!vivi.length && !arch.length){
    return cardInviti() + (org ? `
      <div class="empty-big">
        <div class="ic">${ico('bussola',22)}</div>
        <h2>Nessun viaggio, per ora</h2>
        <p>Crea il primo: dagli un nome e delle date, poi aggiungi punti, prenotazioni, persone e spese mano a mano. Puoi partire anche solo con il nome.</p>
        <div class="acts">
          <button class="btn btn-primary" data-act="new-trip">＋ Crea il primo viaggio</button>
          <button class="btn btn-ghost" data-act="set-role" data-role="viaggiatore">Partecipo e basta</button>
        </div>
      </div>
      ${sezioneIdee()}` : `
      <div class="empty-big">
        <div class="ic"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3 7l9 6 9-6"/></svg></div>
        <h2>Aspetti un invito</h2>
        <p>Come viaggiatore i viaggi non li crei: li ricevi. Quando chi organizza ti invita col tuo nome utente, la richiesta compare qui — non devi cercare nessun link.</p>
        <div class="acts">
          <button class="btn btn-primary" data-act="apri-invito">${ico('bustaGiu',16)}<span>Ho un link di invito</span></button>
        </div>
      </div>
      ${sezioneIdee()}`);
  }

  const prossimo = vivi[0];
  return `
  ${cardInviti()}
  ${prossimo ? heroProssimo(prossimo, org) : ''}
  ${cardBilancio()}
  ${org ? reportGlobale() : ''}
  <div class="sec-head">
    <h2>${org ? 'Viaggi che gestisci' : 'I viaggi a cui partecipi'}</h2>
    <span class="sub">${vivi.length ? vivi.length + ' in corso' : 'nessuno in corso'}${arch.length ? ' · ' + arch.length + ' in archivio' : ''}</span>
    <span class="rt">${org
      ? '<button class="btn btn-ghost btn-sm" data-act="new-trip">＋ Nuovo viaggio</button>'
      : '<button class="btn btn-ghost btn-sm" data-act="apri-invito">' + ico('bustaGiu',16) + '<span>Ho un invito</span></button>'}</span></div>

  ${vivi.length ? `<div class="grid">
    ${vivi.map(cardViaggio).join('')}
    ${org ? `<button class="addcard" data-act="new-trip">
      <div class="ic">${ico('piu',20)}</div><h3>Crea un nuovo viaggio</h3><p>Nome e date bastano per iniziare.</p></button>` : ''}
  </div>`
  : `<div class="card"><div class="card-b empty">${org
      ? 'Nessun viaggio in corso: quelli passati sono qui sotto, in archivio.'
      : 'Nessun viaggio in corso. Quelli conclusi restano in archivio qui sotto.'}</div></div>`}

  ${sezioneIdee()}

  ${arch.length ? `
  <div class="sec-head" style="margin-top:8px"><h2>Archivio</h2>
    <span class="sub">Viaggi conclusi o messi da parte · restano consultabili</span>
    <span class="rt"><button class="btn btn-ghost btn-sm" data-act="toggle-arch">${V.mostraArch ? 'Nascondi' : 'Mostra i ' + arch.length}</button></span></div>
  ${V.mostraArch ? `<div class="grid">${arch.map(cardViaggio).join('')}</div>` : ''}` : ''}`;
}

function heroProssimo(t, org){
  const gg = giorniA(t.dal);
  const s = statoViaggio(t);
  return `
  <section class="hero">
    ${scenaViaggio(t.tema, cittaDi(t), true)}
    <div class="hero-top">
      <div>
        <div class="kick">Ciao ${esc(DB.profilo.nome)}, il prossimo viaggio</div>
        <h1>${esc(t.emoji)} ${esc(t.nome)}</h1>
        <div class="hero-meta">
          ${t.dove ? '<span>' + ico('luogo',14) + esc(t.dove) + '</span>' : ''}
          <span>${ico('calendario',14)}${fmtRange(t.dal, t.al)}</span>
          ${t.gente.length ? '<span>' + ico('persone',14) + t.gente.length + (t.gente.length===1?' persona':' persone') + '</span>' : ''}
        </div>
      </div>
      ${gg != null && gg >= 0 ? `<div class="countdown"><div class="n num">${gg}</div><div class="l">${gg === 1 ? 'giorno' : 'giorni'}</div></div>` : ''}
    </div>
    <div class="hero-bar">
      <div class="stat"><div class="v num">${s.todoAperti}</div><div class="k">cose da fare</div></div>
      <div class="vdiv"></div>
      <div class="stat"><div class="v num">${org ? eur(s.incassato) : eur(s.mioVersato)}</div><div class="k">${org ? 'incassato' : 'hai versato'}</div></div>
      <div class="vdiv"></div>
      <div class="stat"><div class="v num">${t.docs.length}</div><div class="k">documenti</div></div>
      <button class="btn btn-sm" style="margin-left:auto;background:#fff;color:var(--terracotta)" data-act="open-trip" data-id="${esc(t.id)}">Apri →</button>
    </div>
  </section>`;
}

/* Tutti i costi del viaggio in un elenco solo: quelli scritti nei punti
   dell'itinerario, quelli delle prenotazioni e le spese aggiunte a mano.
   Il bilancio e il report leggono da qui, così non si inserisce niente due volte. */
function vociSpesa(t){
  const v = [];
  (t.tappe || []).forEach(x => {
    if(num(x.costo) > 0) v.push({fonte:'itinerario', id:x.id, nome:x.dove || x.nome,
      cat:tipoTappa(x.tipo).cat, importo:num(x.costo), pagato:!!x.pagato});
  });
  (t.prenotazioni || []).forEach(x => {
    if(num(x.costo) > 0) v.push({fonte:'prenotazione', id:x.id, nome:x.titolo || tipoPren(x.tipo).n,
      cat:tipoPren(x.tipo).cat, importo:num(x.costo), pagato:x.stato === 'pagata'});
  });
  tutteSpese(t).forEach(x => {
    if(num(x.importo) > 0) v.push({fonte:'spesa', id:x.id, nome:x.voce,
      cat:x.cat || 'altro', importo:num(x.importo), pagato:!!x.pagato});
  });
  return v;
}
function perCategoria(voci){
  const m = {};
  voci.forEach(x => {
    const k = x.cat || 'altro';
    if(!m[k]) m[k] = {cat:k, tot:0, pagato:0, n:0};
    m[k].tot += x.importo; m[k].n++;
    if(x.pagato) m[k].pagato += x.importo;
  });
  return Object.values(m).sort((a,b) => b.tot - a.tot);
}
function statoViaggio(t){
  const todoAperti = t.todo.filter(x => !x.fatto).length;
  const incassato = t.gente.reduce((n,p) => n + num(p.versato), 0);
  const atteso = t.gente.reduce((n,p) => n + num(t.quota), 0);
  const voci = vociSpesa(t);
  const speso = voci.filter(x => x.pagato).reduce((n,x) => n + x.importo, 0);
  const totSpese = voci.reduce((n,x) => n + x.importo, 0);
  return {
    todoAperti, incassato, atteso, speso, voci,
    daPagare: totSpese - speso,
    totSpese,
    cassa: incassato - speso,
    mioVersato: num(t.mioVersato),
    confermati: t.gente.filter(p => p.stato === 'confermato').length,
    prenAperte: (t.prenotazioni || []).filter(x => x.stato === 'daPren').length
  };
}

function cardViaggio(t){
  const s = statoViaggio(t);
  const gg = giorniA(t.dal);
  const fine = giorniA(t.al);
  const inArchivio = archiviato(t);
  const badge = inArchivio ? 'In archivio'
    : (fine != null && fine < 0) ? 'Concluso'
    : (gg != null && gg >= 0 ? (gg === 0 ? 'Si parte oggi' : 'tra ' + gg + (gg === 1 ? ' giorno' : ' giorni'))
    : 'Da programmare');
  const org = t.mio;
  const pct = org
    ? (s.atteso ? Math.min(100, Math.round(s.incassato / s.atteso * 100)) : 0)
    : (num(t.quota) ? Math.min(100, Math.round(s.mioVersato / num(t.quota) * 100)) : 0);
  const mostraSoldi = org ? (s.atteso > 0) : (num(t.quota) > 0);
  /* Le facce prima dei numeri: tre iniziali sovrapposte dicono «siete in tre»
     più in fretta della parola «tre». */
  const teste = rosterSpese(t).filter(x => x.id !== 'org').slice(0, 3);
  const extra = Math.max(0, (t.gente.length + (membri[t.id] || []).filter(m => m.stato === 'accettato').length) - teste.length);
  const totSpese = tutteSpese(t).reduce((n, x) => n + num(x.importo), 0);

  return `
  <button class="tcard ${inArchivio ? 'past' : ''}" data-act="open-trip" data-id="${esc(t.id)}">
    <div class="top">
      ${scenaViaggio(t.tema, cittaDi(t))}
      <span class="fl">${esc(t.emoji)}</span>
      <span class="badge">${badge}</span>
      <div class="tt">
        ${t.dove ? '<div class="dove">' + esc(t.dove) + '</div>' : ''}
        <h3>${esc(t.nome)}</h3>
        <div class="dt">${fmtRange(t.dal, t.al)}</div>
      </div>
    </div>

    <div class="bd">
      <div class="teste-riga">
        ${teste.length ? '<span class="teste">' + teste.map(x =>
            '<span class="testa" style="background:' + coloreDa(x.nome) + '">' + esc(iniz(x.nome, '')) + '</span>').join('') +
            (extra ? '<span class="testa piu">+' + extra + '</span>' : '') + '</span>'
          : '<span class="vuoto">Ancora nessuno</span>'}
        ${s.todoAperti ? '<span class="pill warn">' + s.todoAperti + ' da fare</span>'
                       : (t.todo.length ? '<span class="pill ok">tutto fatto</span>' : '')}
        ${t.docs.length ? '<span class="pill info">' + ico('graffetta',13) + t.docs.length + '</span>' : ''}
      </div>

      ${mostraSoldi ? `
        <div class="quotina">
          <div class="et"><span>${org ? 'Quote incassate' : 'La tua quota'}</span>
            <span class="num">${org ? eur(s.incassato) + ' / ' + eur(s.atteso) : pct + '%'}</span></div>
          <span class="bar"><i class="${pct >= 100 ? 'sage' : ''}" style="width:${pct}%"></i></span>
        </div>` : ''}
    </div>

    <div class="piede">
      ${ico('euro', 15)}
      <span class="et">${totSpese ? 'Spese registrate' : 'Nessuna spesa ancora'}</span>
      <span class="sp"></span>
      ${totSpese ? '<span class="num">' + eur(totSpese) + '</span>' : ''}
      ${ico('freccia', 15)}
    </div>
  </button>`;
}
