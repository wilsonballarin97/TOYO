/* ==========================================================================
   ACCESSO CON EMAIL E CODICE
   Accanto a "Continua con Google" ci si registra con la propria email:
   1. scrivi l'email → Supabase manda un codice di 6 cifre;
   2. scrivi il codice → sei dentro (se l'account non c'era, nasce adesso);
   3. al primo accesso scegli il nome utente (e, se vuoi, una password per
      entrare la volta dopo senza aspettare la mail).
   Lo stesso codice serve anche per entrare quando la password non la ricordi.

   Su Supabase (una volta sola, istruzioni nel README):
   - Authentication → Emails → "Magic link" e "Confirm signup" devono
     contenere {{ .Token }}, così arriva il codice invece del link;
   - serve un server di posta (SMTP) proprio: quello di prova di Supabase
     scrive solo agli indirizzi del team del progetto.
   Gli account vecchi con nome utente e password continuano a funzionare.
   ========================================================================== */
let accessoCodice = false;        /* nella scheda "Accedi": modulo col codice invece della password */
let mailPasso = 'mail';           /* 'mail' = chiedo l'indirizzo, 'codice' = aspetto le 6 cifre */
let mailIndirizzo = '';
let mailInviataAlle = 0;
const ATTESA_RINVIO = 60;         /* secondi prima di poter chiedere un altro codice */

const mailOk = m => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(m || '').trim());

function formAccessoEmail(modo){
  const reg = modo === 'registra';
  if(mailPasso === 'codice' && mailIndirizzo){
    const mancano = Math.max(0, ATTESA_RINVIO - Math.round((Date.now() - mailInviataAlle) / 1000));
    return `
      ${reg ? '<h2>Controlla la posta</h2>' : ''}
      <p class="lead">Ti ho mandato un codice di 6 cifre a <span class="au-mail">${esc(mailIndirizzo)}</span>.
        Se non lo vedi, guarda anche nello spam.</p>
      <div class="field"><label for="auCodice">Codice</label>
        <input class="inp otp" id="auCodice" inputmode="numeric" autocomplete="one-time-code" maxlength="6"
          pattern="[0-9]*" placeholder="••••••" enterkeyhint="go"></div>
      <div class="err hide" id="auErr"></div>
      <button class="btn btn-primary btn-full" data-mail="verifica">${reg ? 'Conferma e crea l\'account' : 'Entra'}</button>
      <div class="au-righe">
        <button class="au-link" data-mail="cambia">← Cambia email</button>
        <button class="au-link" data-mail="rimanda" id="auRimanda" ${mancano ? 'disabled style="opacity:.5"' : ''}>
          ${mancano ? 'Rimanda il codice fra ' + mancano + ' s' : 'Rimanda il codice'}</button>
      </div>`;
  }
  return `
    ${reg ? '<h2>Crea il tuo account</h2><p class="lead">Ti basta la tua email: ti mandiamo un codice per confermarla.</p>'
          : '<p class="tiny" style="margin:-6px 0 14px">Ti mandiamo un codice di 6 cifre: niente password da ricordare.</p>'}
    <div class="field"><label for="auMail">La tua email</label>
      <input class="inp" id="auMail" type="email" inputmode="email" autocomplete="email" placeholder="tu@email.it"
        spellcheck="false" autocapitalize="off" enterkeyhint="send" value="${esc(mailIndirizzo)}"></div>
    <div class="err hide" id="auErr"></div>
    <button class="btn btn-primary btn-full" data-mail="invia" data-modo="${reg ? 'registra' : 'entra'}">Mandami il codice</button>
    ${reg ? '<p class="tiny" style="margin-top:10px">L\'email resta privata: gli altri vedono solo il nome utente che sceglierai dopo.</p>'
          : '<div class="au-righe"><button class="au-link" data-mail="torna-password">← Entra con la password</button></div>'}`;
}

function ridisegnaAuth(){
  $('onb').innerHTML = viewAuth();
  setTimeout(() => { const c = $('auCodice') || $('auMail'); if(c) c.focus(); }, 80);
}

function erroreMail(e){
  const m = String((e && e.message) || e);
  if(/not authorized|not allowed/i.test(m))
    return 'Il server non può ancora mandare email a questo indirizzo: manca il servizio di posta del progetto. Entra con Google, oppure riprova più tardi.';
  if(/rate limit|too many|seconds|security purposes/i.test(m))
    return 'Hai chiesto troppi codici di fila: aspetta un minuto e riprova.';
  if(/Signups not allowed|signup.*disabled/i.test(m))
    return 'Le nuove iscrizioni con email non sono attive su questo server.';
  if(/expired|invalid|Token has expired/i.test(m))
    return 'Codice scaduto o non corretto. Controlla le cifre, oppure fattene mandare un altro.';
  return testoErrore(e);
}

async function mandaCodice(btn){
  if(!sb){ erroreAuth('Il server non risponde: riprova fra poco.'); return; }
  const mail = (val('auMail') || mailIndirizzo).trim().toLowerCase();
  if(!mailOk(mail)){ erroreAuth('Scrivi un indirizzo email valido, tipo nome@esempio.it'); const c = $('auMail'); if(c) c.focus(); return; }
  if(mail.endsWith('@' + DOM_NICK)){ erroreAuth('Questo non è un indirizzo vero: entra con il nome utente e la password.'); return; }
  if(!navigator.onLine){ erroreAuth('Sei senza connessione: per mandarti il codice serve la rete.'); return; }
  if(btn){ btn.disabled = true; btn.textContent = 'Invio…'; }
  try{
    const {error} = await conScadenza(sb.auth.signInWithOtp({
      email: mail,
      options: {shouldCreateUser: true, emailRedirectTo: location.origin + '/'}
    }), 20000);
    if(error) throw error;
    mailIndirizzo = mail; mailPasso = 'codice'; mailInviataAlle = Date.now();
    ridisegnaAuth();
    contoAllaRovescia();
    toast('Codice inviato a ' + mail);
  }catch(e){
    if(btn){ btn.disabled = false; btn.textContent = btn.dataset.mail === 'rimanda' ? 'Rimanda il codice' : 'Mandami il codice'; }
    erroreAuth(erroreMail(e));
  }
}

let rovesciaT = null;
function contoAllaRovescia(){
  clearInterval(rovesciaT);
  rovesciaT = setInterval(() => {
    const b = $('auRimanda');
    if(!b){ clearInterval(rovesciaT); return; }
    const mancano = Math.max(0, ATTESA_RINVIO - Math.round((Date.now() - mailInviataAlle) / 1000));
    b.disabled = !!mancano; b.style.opacity = mancano ? '.5' : '';
    b.textContent = mancano ? 'Rimanda il codice fra ' + mancano + ' s' : 'Rimanda il codice';
    if(!mancano) clearInterval(rovesciaT);
  }, 1000);
}

let verificando = false;
async function verificaCodice(btn){
  if(verificando) return;
  const codice = String(val('auCodice')).replace(/\D/g, '');
  if(codice.length !== 6){ erroreAuth('Il codice ha 6 cifre.'); const c = $('auCodice'); if(c) c.focus(); return; }
  if(btn){ btn.disabled = true; btn.textContent = 'Controllo…'; }
  verificando = true;
  try{
    const {data, error} = await conScadenza(sb.auth.verifyOtp({email: mailIndirizzo, token: codice, type: 'email'}), 20000);
    if(error) throw error;
    utente = data.user || (data.session && data.session.user) || utente;
    ricordaNick(mailIndirizzo);
    mailPasso = 'mail'; accessoCodice = false;
    await allineaDati();
    verificando = false;
    boot();
  }catch(e){
    verificando = false;
    if(btn){ btn.disabled = false; btn.textContent = 'Riprova'; }
    erroreAuth(erroreMail(e));
    const c = $('auCodice'); if(c){ c.value = ''; c.focus(); }
  }
}

/* chi è entrato con email+codice (non Google, non nome utente vecchio stile) */
const entratoConMail = u => !!(u && u.email && !eNick(u.email) &&
  (((u.app_metadata || {}).provider || 'email') === 'email'));

document.addEventListener('click', e => {
  const b = e.target.closest('[data-mail]');
  if(!b) return;
  e.preventDefault(); e.stopPropagation();
  const a = b.dataset.mail;
  if(a === 'invia' || a === 'rimanda') mandaCodice(b);
  else if(a === 'verifica') verificaCodice(b);
  else if(a === 'cambia'){ mailPasso = 'mail'; ridisegnaAuth(); }
  else if(a === 'vai-codice'){ accessoCodice = true; mailPasso = 'mail';
    const c = val('auChi'); if(c && c.indexOf('@') > 0) mailIndirizzo = c.trim().toLowerCase();
    ridisegnaAuth(); }
  else if(a === 'torna-password'){ accessoCodice = false; ridisegnaAuth(); }
}, true);

/* Invio da tastiera: email → manda il codice; 6 cifre → verifica da solo. */
document.addEventListener('keydown', e => {
  if(e.key !== 'Enter' || !e.target) return;
  if(e.target.id === 'auMail'){ e.preventDefault(); mandaCodice(document.querySelector('[data-mail="invia"]')); }
  if(e.target.id === 'auCodice'){ e.preventDefault(); verificaCodice(document.querySelector('[data-mail="verifica"]')); }
});
document.addEventListener('input', e => {
  if(e.target && e.target.id === 'auCodice'){
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    if(v !== e.target.value) e.target.value = v;
    if(v.length === 6) verificaCodice(document.querySelector('[data-mail="verifica"]'));
  }
});

/* ---- password per chi entra con l'email ----
   Non serve quella vecchia: chi si è registrato col codice potrebbe non
   averne mai avuta una. Se il server vuole una conferma recente (accesso
   vecchio), si chiede di rientrare col codice. */
function formImpostaPw(){
  modal(mHead('La tua password', 'Per entrare con email e password, senza aspettare il codice') +
    '<div class="modal-b">' +
      '<div class="field"><label for="ipNuova">Nuova password <span class="opt">(almeno 8 caratteri)</span></label>' +
        '<input class="inp" type="password" id="ipNuova" autocomplete="new-password"></div>' +
      '<div class="field" style="margin-bottom:0"><label for="ipRipeti">Ripetila</label>' +
        '<input class="inp" type="password" id="ipRipeti" autocomplete="new-password"></div>' +
      '<div class="err hide" id="ipErr"></div>' +
    '</div>' + mFoot('fai-imposta-pw', 'Salva la password'));
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act="imposta-pw"],[data-act="fai-imposta-pw"]');
  if(!el) return;
  e.preventDefault(); e.stopPropagation();
  if(el.dataset.act === 'imposta-pw'){ formImpostaPw(); return; }
  const nuova = val('ipNuova'), ripeti = val('ipRipeti'), err = $('ipErr');
  const dì = m => { err.textContent = m; err.classList.remove('hide'); };
  if(nuova.length < 8) return dì('La password deve avere almeno 8 caratteri.');
  if(nuova !== ripeti) return dì('Le due password non coincidono.');
  if(!sb || !utente) return dì('Non sei collegato al server.');
  el.disabled = true; el.textContent = 'Salvo…';
  sb.auth.updateUser({password: nuova}).then(r => {
    if(r.error) throw r.error;
    closeModal(); toast('Password salvata: ora entri anche con email e password');
  }).catch(x => {
    el.disabled = false; el.textContent = 'Salva la password';
    const m = String((x && x.message) || x);
    dì(/reauth|recent|nonce/i.test(m) ? 'Per sicurezza esci, rientra con il codice via email e riprova subito.'
      : /same|different/i.test(m) ? 'È uguale a quella di adesso.'
      : 'Non riesco a salvarla adesso: riprova fra poco.');
  });
}, true);
