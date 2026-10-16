/* ==========================================================================
   INVITI · link condivisibile + email
   Il link contiene il viaggio (nome, date, tappe, quota): chi lo apre trova
   tutto pronto e lo aggiunge ai suoi viaggi. Non contiene documenti né persone.
   ========================================================================== */
function b64enc(str){
  const b = new TextEncoder().encode(str);
  let out = '';
  for(let i = 0; i < b.length; i += 4096) out += String.fromCharCode.apply(null, b.subarray(i, i + 4096));
  return btoa(out).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64dec(s){
  s = s.replace(/-/g,'+').replace(/_/g,'/');
  const bin = atob(s + '==='.slice((s.length + 3) % 4));
  const arr = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(arr);
}
function pacchettoInvito(t){
  return {
    n:t.nome, e:t.emoji, d:t.dove, a:t.dal, b:t.al, q:t.quota, m:t.tema||0, nt:t.note||'',
    o:(DB.profilo.nome + ' ' + (DB.profilo.cognome||'')).trim(),
    om:'',   /* l'email non viaggia nei link condivisi */
    tp:(t.tappe||[]).map(x => ({n:x.nome, d:x.dove||'', a:x.dal||'', b:x.al||'', la:x.lat||null, lo:x.lon||null}))
  };
}
function linkInvito(t){
  const base = location.href.split('#')[0];
  return base + '#invito=' + b64enc(JSON.stringify(pacchettoInvito(t)));
}
function testoInvito(t, link){
  const chi = (DB.profilo.nome || 'Un amico');
  return chi + ' ti invita a ' + t.nome + '\n\n' +
    (t.dove ? '' + ico('luogo',15) + '' + t.dove + '\n' : '') +
    '' + ico('calendario',15) + '' + fmtRange(t.dal, t.al) + '\n' +
    (num(t.quota) ? '' + ico('euro',15) + 'Quota indicativa: ' + eur(t.quota) + '\n' : '') +
    '\nApri questo link per vedere il viaggio e aggiungerlo ai tuoi:\n' + link +
    '\n\n— inviato con TOYO, Travel on your own';
}

function formCambiaPw(){
  modal(mHead('Cambia password', 'Serve quella di adesso') +
    '<div class="modal-b">' +
      '<div class="field"><label>Password di adesso</label>' +
        '<input class="inp" id="pwVecchia" type="password" autocomplete="current-password"></div>' +
      '<div class="field"><label>Nuova password</label>' +
        '<input class="inp" id="pwNuova" type="password" autocomplete="new-password" placeholder="almeno 8 caratteri"></div>' +
      '<div class="field" style="margin-bottom:0"><label>Ripeti la nuova</label>' +
        '<input class="inp" id="pwRipeti" type="password" autocomplete="new-password"></div>' +
      '<div class="err hide" id="pwErr"></div>' +
      '<div style="font-size:11.5px;color:var(--ink-3);margin-top:11px">Su TOYO non c\'è nessuna email a cui mandare un link: ' +
        'se la dimentichi non si recupera. Segnala da qualche parte prima di cambiarla.</div>' +
    '</div>' + mFoot('fai-cambia-pw', 'Cambia password'));
  setTimeout(() => $('pwVecchia') && $('pwVecchia').focus(), 60);
}

function formSondaggio(){
  modal(mHead('Nuova domanda', 'Le proposte, una per riga') +
    '<div class="modal-b">' +
      '<div class="field"><label>Cosa chiedi</label>' +
        '<input class="inp" id="qDomanda" placeholder="Es. Dove andiamo a settembre?"></div>' +
      '<div class="field" style="margin-bottom:0"><label>Le risposte fra cui scegliere</label>' +
        '<textarea class="inp" id="qOpz" style="min-height:110px" placeholder="Lisbona&#10;Isole Cicladi&#10;Dolomiti"></textarea>' +
        '<div style="font-size:11.5px;color:var(--ink-3);margin-top:7px">Una per riga, da due in su. Ognuno vota una sola risposta e può cambiare idea finché la votazione è aperta.</div></div>' +
      '<div class="err hide" id="qErr">Serve una domanda e almeno due risposte.</div>' +
    '</div>' + mFoot('save-sondaggio', 'Apri la votazione'));
  setTimeout(() => $('qDomanda') && $('qDomanda').focus(), 60);
}

function formApriInvito(){
  modal(mHead('Ho un link di invito', 'Incolla qui il link che ti hanno mandato') +
    '<div class="modal-b">' +
      '<div class="field" style="margin-bottom:8px"><label>Link o messaggio ricevuto</label>' +
        '<textarea class="inp" id="invTesto" placeholder="Incolla tutto il messaggio: trovo io il link dentro" style="min-height:110px"></textarea></div>' +
      '<div style="font-size:12px;color:var(--ink-3)">Puoi anche aprire direttamente il link dal messaggio: TOYO riconosce l\'invito da solo.</div>' +
    '</div>' +
    '<div class="modal-f"><span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
      '<button class="btn btn-primary" data-act="leggi-invito">Apri l\'invito</button></div>');
}

function formInvito(personaId){
  const t = viaggio();
  if(!t) return;
  const p = personaId ? t.gente.find(x => x.id === personaId) : null;
  const link = linkInvito(t);
  modal(mHead('Invita al viaggio', (t.emoji + ' ' + t.nome) + (p ? ' · per ' + p.nome : '')) +
    '<div class="modal-b">' +

      (sb && utente ?
      '<div class="field"><label>Invita chi è già su TOYO</label>' +
        '<div style="display:flex;gap:8px">' +
          '<input class="inp" id="invNick" placeholder="@nomeutente" style="flex:1" autocapitalize="off" autocorrect="off">' +
          '<button class="btn btn-primary btn-sm" data-act="cerca-utente">Cerca</button>' +
        '</div>' +
        '<div id="invEsito" style="margin-top:10px"></div>' +
        '<div style="font-size:11.5px;color:var(--ink-3);margin-top:8px">Gli arriva una richiesta dentro l\'app. Se accetta vede il viaggio come viaggiatore, ' +
          'sempre aggiornato: se sposti una tappa, la vede anche lui.</div>' +
      '</div>' +
      '<div class="menu-sep" style="margin:16px 0"></div>' : '') +

      '<p style="margin:0 0 14px;font-size:13px;color:var(--ink-2)">Il link qui sotto è l\'altra strada: chi lo apre trova il viaggio già pronto — date, tappe e quota — ' +
        'ma se ne prende una <b>copia</b>, che non si aggiorna più. Documenti e dati delle altre persone non vengono condivisi in nessuno dei due casi.</p>' +

      '<div class="field"><label>Link di invito</label>' +
        '<div class="iban"><code id="invLink" style="word-break:break-all;font-size:11px;line-height:1.45">' + esc(link) + '</code></div>' +
        '<div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap">' +
          '<button class="btn btn-primary btn-sm" data-act="copia-link">' + ico('copia',16) + '<span>Copia il link</span></button>' +
          (navigator.share ? '<button class="btn btn-ghost btn-sm" data-act="condividi-link">↗ Condividi</button>' : '') +
        '</div>' +
      '</div>' +

      (p ? '' :
      '<div class="field" style="margin-bottom:0"><label>Aggiungi anche alla lista persone <span class="opt">(facoltativo)</span></label>' +
        '<input class="inp" id="invNome" placeholder="Nome di chi inviti">' +
        '<button class="btn btn-ghost btn-sm btn-full" style="margin-top:9px" data-act="invita-nuovo">＋ Aggiungi come invitato</button></div>') +
    '</div>' +
    '<div class="modal-f"><span class="hint">Il link funziona anche offline, una volta ricevuto</span><span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="close-modal">Chiudi</button></div>');
}

/* ---- ricezione dell'invito ---- */
let invitoInSospeso = null;
function leggiInvitoDaUrl(){
  const h = location.hash || '';
  const i = h.indexOf('invito=');
  if(i < 0) return null;
  try{
    const dati = JSON.parse(b64dec(h.slice(i + 7)));
    history.replaceState(null, '', location.href.split('#')[0]);
    return dati && dati.n ? dati : null;
  }catch(e){ return null; }
}
function mostraInvito(d){
  const tappe = (d.tp || []).length;
  modal(mHead('Ti hanno invitato a un viaggio', (d.o || 'Un amico') + ' ti ha mandato questo') +
    '<div class="modal-b">' +
      '<div class="hero" style="background:' + TEMI[d.m || 0] + ';border-radius:var(--r-btn)">' +
        '<div class="hero-top"><div>' +
          '<div class="kick">Invito</div><h1>' + esc(d.e || '🧳') + ' ' + esc(d.n) + '</h1>' +
          '<div class="hero-meta">' + (d.d ? '<span>' + ico('luogo',15) + '' + esc(d.d) + '</span>' : '') +
            '<span>' + ico('calendario',15) + '' + fmtRange(d.a, d.b) + '</span></div>' +
        '</div></div></div>' +
      '<div class="card" style="margin-top:14px"><div class="card-b tight"><div class="rows">' +
        '<div class="row"><span class="ic"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.2 8.8l-1.9 4.5-4.5 1.9 1.9-4.5z"/></svg></span><span class="tx"><span class="t">Organizza</span>' +
          '<span class="m">' + esc(d.o || 'non indicato') + (d.om ? ' · ' + esc(d.om) : '') + '</span></span></div>' +
        (num(d.q) ? '<div class="row"><span class="ic"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 6.2A6.6 6.6 0 0 0 7 11.2v1.6a6.6 6.6 0 0 0 10.5 5"/><path d="M4.6 10.6h7M4.6 13.8h7"/></svg></span><span class="tx"><span class="t">Quota indicativa</span>' +
          '<span class="m">' + eur(d.q) + ' a persona</span></span></div>' : '') +
        (tappe ? '<div class="row"><span class="ic"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4.2L3.5 6.5v13.3L9 17.5l6 2.3 5.5-2.3V4.2L15 6.5z"/><path d="M9 4.2v13.3M15 6.5v13.3"/></svg></span><span class="tx"><span class="t">' + tappe + (tappe === 1 ? ' tappa' : ' tappe') + '</span>' +
          '<span class="m">' + d.tp.map(x => esc(x.n)).join(' → ') + '</span></span></div>' : '') +
      '</div></div></div>' +
      '<p style="font-size:12px;color:var(--ink-3);margin:12px 0 0">Accettando, il viaggio finisce fra i tuoi come "partecipo": ' +
        'potrai segnare la tua quota, le tue cose da fare e i tuoi documenti.</p>' +
    '</div>' +
    '<div class="modal-f"><span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="close-modal">Non ora</button>' +
      '<button class="btn btn-primary" data-act="accetta-invito-link">Aggiungi ai miei viaggi</button></div>');
  invitoInSospeso = d;
}
function accettaInvito(){
  const d = invitoInSospeso;
  if(!d) return;
  const t = {
    id:uid(), nome:d.n, emoji:d.e || '🧳', dove:d.d || '', dal:d.a || '', al:d.b || '',
    quota:d.q || '', posti:'', note:d.nt || '', tema:d.m || 0, mio:false, mioVersato:0,
    tappe:(d.tp || []).map(x => ({id:uid(), nome:x.n, dove:x.d, dal:x.a, al:x.b, note:'', lat:x.la, lon:x.lo})),
    gente:[], spese:[], todo:[], docs:[], mieiDocs:[]
  };
  if(d.o) t.gente.push({id:uid(), nome:d.o, email:'', stato:'confermato', versato:'', docs:[]});
  DB.viaggi.push(t);
  DB.ruolo = 'viaggiatore';
  invitoInSospeso = null;
  save(); closeModal(); go('trip', t.id, 'panoramica');
  toast('Viaggio aggiunto ai tuoi');
}
