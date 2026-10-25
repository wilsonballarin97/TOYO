/* ==========================================================================
   ACCEDI CON GOOGLE
   Un tocco su "Continua con Google": Supabase apre la pagina di Google, poi
   riporta qui con un codice monouso (flusso PKCE: il codice non serve a
   nessuno senza la chiave segreta rimasta in questo browser).
   - Al primo accesso si sceglie il nome utente: l'email di Google resta
     privata, nessuno la vede; agli altri arriva solo @nomeutente.
   - Se si stava aprendo un link d'invito, l'invito sopravvive al giro su
     Google (lo si mette da parte e lo si rimette nell'indirizzo al ritorno).
   Va attivato su Supabase: Authentication → Sign In / Providers → Google
   (istruzioni nel README).
   ========================================================================== */
const OPZIONI_SB = {auth: {flowType: 'pkce', detectSessionInUrl: true, persistSession: true}};
const GOOGLE_HASH = 'toyo.dopo-google';

/* Prima di tutto (questo file gira prima di boot): se torniamo da Google
   con un invito in sospeso, lo si rimette dov'era. */
(function(){
  try{
    const salvato = sessionStorage.getItem(GOOGLE_HASH);
    if(salvato && /[?&](code|error)=/.test(location.search) && !location.hash){
      history.replaceState(null, '', location.pathname + location.search + salvato);
    }
  }catch(e){}
})();

function bottoneGoogle(){
  if(!cloudAttivo() || !sb) return '';
  return `
    <button type="button" class="btn btn-google btn-full" data-google="1">
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
      <span>Continua con Google</span>
    </button>
    <p class="tiny" style="margin:8px 0 0;text-align:center">Da Google arrivano nome ed email. L'email resta privata: gli altri vedono solo il tuo nome utente.</p>
    <div class="oppure"><span>oppure con la tua email</span></div>`;
}

async function entraConGoogle(){
  if(!sb){ toast('Il server non risponde: riprova fra poco'); return; }
  try{
    try{ location.hash ? sessionStorage.setItem(GOOGLE_HASH, location.hash) : sessionStorage.removeItem(GOOGLE_HASH); }catch(e){}
    const {error} = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {redirectTo: location.origin + location.pathname, queryParams: {prompt: 'select_account'}}
    });
    if(error) throw error;
  }catch(e){
    const msg = String((e && e.message) || e);
    toast(/provider is not enabled|Unsupported provider/i.test(msg)
      ? 'L\'accesso con Google non è ancora attivo su questo server'
      : 'Non riesco ad aprire Google: riprova');
  }
}

/* Dopo il ritorno: via il codice dall'indirizzo (non deve finire nei link
   condivisi né nella cronologia), e se Google ha detto di no lo si spiega. */
function pulisciUrlGoogle(){
  const q = new URLSearchParams(location.search);
  if(!q.has('code') && !q.has('error')) return;
  const errore = q.get('error_description') || q.get('error');
  let hash = location.hash;
  try{ hash = hash || sessionStorage.getItem(GOOGLE_HASH) || ''; sessionStorage.removeItem(GOOGLE_HASH); }catch(e){}
  history.replaceState(null, '', location.pathname + hash);
  if(errore) setTimeout(() => toast(/denied|cancel/i.test(errore) ? 'Accesso con Google annullato' : 'Google non ha completato l\'accesso'), 400);
}

/* ---- primo accesso con Google: si sceglie il nome utente ---- */
function viewSceltaNick(){
  const m = (utente && utente.user_metadata) || {};
  const nome = m.nome || m.given_name || (m.full_name || m.name || '').split(' ')[0] || '';
  const cognome = m.cognome || m.family_name || (m.full_name || m.name || '').split(' ').slice(1).join(' ') || '';
  const proposta = normNick((nome + '.' + cognome).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9.]+/g, '')).slice(0, 20);
  return `
  <main class="onb-main" style="grid-column:1/-1">
    <div class="onb-box">
      <div class="brand" style="margin-bottom:20px"><div class="brand-mark">◈</div>
        <div class="brand-name" style="display:block">TO<span>YO</span></div></div>
      <h2>Ci sei quasi</h2>
      <p class="lead">Scegli il nome utente con cui ti trovano gli altri. La tua email resta privata.</p>
      <div class="two">
        <div class="field"><label for="gnNome">Nome</label><input class="inp" id="gnNome" value="${esc(nome)}" autocomplete="given-name"></div>
        <div class="field"><label for="gnCogn">Cognome</label><input class="inp" id="gnCogn" value="${esc(cognome)}" autocomplete="family-name"></div>
      </div>
      <div class="field"><label for="gnNick">Nome utente</label>
        <div class="at"><span>@</span><input class="inp" id="gnNick" value="${esc(nickOk(proposta) ? proposta : '')}" placeholder="marco.rossi"
          autocomplete="username" spellcheck="false" autocapitalize="off"></div>
        <div class="tiny" style="margin-top:6px">Da 3 a 20 caratteri: lettere, numeri, punto e trattino basso.</div></div>
      ${entratoConMail(utente) ? `
      <div class="field"><label for="gnPw">Password <span class="opt">(facoltativa, almeno 8 caratteri)</span></label>
        <input class="inp" type="password" id="gnPw" autocomplete="new-password" placeholder="••••••••">
        <div class="tiny" style="margin-top:6px">Con una password entri con email e password. Senza, entri ogni volta con un codice via email.</div></div>` : ''}
      <div id="gnErr" class="err hide"></div>
      <button class="btn btn-primary btn-full" data-google-nick="1">Continua</button>
      <p class="tiny" style="margin-top:14px;text-align:center"><button style="font-weight:650;color:var(--ink-3)" data-google-esci="1">Non sono io: esci</button></p>
    </div>
  </main>`;
}

async function salvaNickGoogle(btn){
  const nome = val('gnNome'), cognome = val('gnCogn'), nick = normNick(val('gnNick'));
  const err = $('gnErr');
  const dì = t => { err.textContent = t; err.classList.remove('hide'); };
  if(!nome) return dì('Scrivi il tuo nome.');
  if(!nickOk(nick)) return dì('Il nome utente può avere da 3 a 20 caratteri fra lettere, numeri, punto e trattino basso.');
  const pw = $('gnPw') ? $('gnPw').value : '';
  if(pw && pw.length < 8) return dì('La password deve avere almeno 8 caratteri (oppure lasciala vuota).');
  btn.disabled = true; btn.textContent = 'Controllo…';
  try{
    /* Il nome utente dev'essere solo tuo: si guarda nella rubrica. */
    const {data: gia} = await sb.from('toyo_profili').select('utente').eq('nick', nick).limit(1);
    if(gia && gia.length && gia[0].utente !== utente.id){ btn.disabled = false; btn.textContent = 'Continua'; return dì('@' + nick + ' è già preso: provane un altro.'); }
    const {data, error} = await sb.auth.updateUser(pw ? {data: {nick, nome, cognome}, password: pw} : {data: {nick, nome, cognome}});
    if(error) throw error;
    utente = data.user;
    if(DB.profilo){ DB.profilo.nick = nick; if(!DB.profilo.nome || DB.profilo.nome === 'Tu') { DB.profilo.nome = nome; DB.profilo.cognome = cognome; } }
    boot();
    toast('Benvenuto su TOYO, @' + nick);
  }catch(e){
    btn.disabled = false; btn.textContent = 'Continua';
    dì('Non riesco a salvare adesso: riprova fra poco.');
  }
}

document.addEventListener('click', e => {
  const g = e.target.closest('[data-google]'), n = e.target.closest('[data-google-nick]'), x = e.target.closest('[data-google-esci]');
  if(!g && !n && !x) return;
  e.preventDefault(); e.stopPropagation();
  if(g) entraConGoogle();
  if(n) salvaNickGoogle(n);
  if(x) esci(false);
}, true);
