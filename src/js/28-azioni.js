/* ==========================================================================
   AZIONI
   ========================================================================== */
function sincronizzaEspanso(el, menuId){
  setTimeout(() => {
    const m = $(menuId);
    if(el && m) el.setAttribute('aria-expanded', m.classList.contains('on') ? 'true' : 'false');
  }, 0);
}
function closeMenus(){
  document.querySelectorAll('.menu').forEach(m => m.classList.remove('on'));
  document.querySelectorAll('.switcher').forEach(s => s.classList.remove('open'));
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if(!el){
    if(!e.target.closest('.sw-wrap') && !e.target.closest('.top-right')) closeMenus();
    return;
  }
  const a = el.dataset.act, id = el.dataset.id, t = viaggio();
  /* Qualunque azione tocchi un viaggio lo segna da ripubblicare: così
     pubblicaCondivisi() manda solo quello che è cambiato davvero. */
  viaggioInAzione = t || DB.viaggi.find(x => x.id === id) || null;
  const stop = () => { e.preventDefault(); e.stopPropagation(); };

  /* chi partecipa consulta: può toccare solo i suoi documenti e la sua quota */
  const SOLO_ORG = /^(new-tappa|edit-tappa|del-tappa|do-del-tappa|save-tappa|update-tappa|new-pren|edit-pren|del-pren|do-del-pren|save-pren|update-pren|new-persona|edit-persona|del-persona|do-del-persona|save-persona|update-persona|new-todo|edit-todo|del-todo|do-del-todo|save-todo|update-todo|toggle-todo|lista-pronta|salva-lista|edit-trip|update-trip|del-trip|do-del-trip|invita|copia-link|condividi-link|invita-nuovo|cerca-utente|manda-invito|togli-membro|do-togli-membro|archivia|ripristina|save-quota|usa-quota|new-doc-trip|new-sondaggio|save-sondaggio|chiudi-sondaggio|del-sondaggio|do-del-sondaggio)$/;
  if(t && !posso(t) && SOLO_ORG.test(a)){
    toast('Questo viaggio lo gestisce chi lo organizza');
    return;
  }

  switch(a){
    /* --- account --- */
    case 'auth-tab': authTab = el.dataset.v; $('onb').innerHTML = viewAuth(); focusAuth(); break;
    case 'vai-accesso':
      DB.soloLocale = false; save();
      if(cloudAttivo()) boot();
      else { toast('Prima serve il progetto Supabase'); formCloud(); }
      break;
    /* Chi sceglie "senza account" dopo che qualcun altro è uscito da questo
       browser non deve ritrovarsi i suoi viaggi: la copia timbrata si scarta. */
    case 'modo-locale':
      /* ⚠️ Questo pulsante sta anche sulla schermata di accesso, cioè dove
         arriva chi NON riesce a entrare. Premendolo si perdevano i propri
         viaggi senza una parola. */
      if(DB.propr && (DB.viaggi || []).length){
        modal(mHead('Continuare senza account?', 'Su questo dispositivo ci sono dati di un account') +
          '<div class="modal-b"><div style="font-size:13px;line-height:1.65;color:var(--ink-2)">' +
            'Qui dentro ci sono <b>' + DB.viaggi.length + (DB.viaggi.length === 1 ? ' viaggio' : ' viaggi') + '</b> ' +
            'scaricati da un account. Andando avanti senza account questa copia viene cancellata.<br><br>' +
            'I viaggi <b>restano sul server</b> e li ritrovi rientrando. Se però ci sono modifiche fatte ' +
            'senza rete, quelle si perdono: scarica prima il backup.' +
          '</div></div>' +
          '<div class="modal-f"><button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
            '<span class="sp"></span>' +
            '<button class="btn btn-ghost btn-sm" data-act="export"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M6 13l6 6 6-6"/></svg> Backup</button>' +
            '<button class="btn btn-danger btn-sm" data-act="do-modo-locale">Continua senza account</button></div>', true);
        break;
      }
      DB.soloLocale = true; save(); mostraLocale(); break;
    case 'do-modo-locale':
      closeModal();
      DB = {v:1, profilo:null, ruolo:'organizzatore', docs:[], viaggi:[], gmapsKey:''};
      V = {view:'hub', tripId:null, tab:'panoramica', bTab:'seguiti', cTab:'luoghi'};
      DB.soloLocale = true; save(); mostraLocale(); break;
    case 'fai-registra': {
      const nome = val('auNome'), cognome = val('auCognome'), pw = val('auPw');
      const nick = normNick(val('auNick'));
      if(!nome){ erroreAuth('Scrivi il tuo nome.'); $('auNome').focus(); return; }
      if(!nickOk(nick)){
        erroreAuth(nick ? 'Il nome utente può avere da 3 a 20 caratteri fra lettere, numeri, punto e trattino basso \u2014 senza spazi e senza accenti.'
                        : 'Scegli un nome utente.');
        $('auNick').focus(); return; }
      if(pw.length < 8){ erroreAuth('La password deve avere almeno 8 caratteri.'); $('auPw').focus(); return; }
      /* Non si blocca su una password debole, ma si fa notare una volta: è la
         sola chiave dell'account, e qui non esiste nessun "password
         dimenticata". */
      const f = forzaPassword(pw);
      if(f && f.l === 'debole' && !el.dataset.insisto){
        el.dataset.insisto = '1';
        erroreAuth('Questa password è debole, e su TOYO non si può recuperare. Premi di nuovo se la vuoi comunque.');
        return;
      }
      if(!navigator.onLine){ erroreAuth('Sei senza connessione: per creare l\'account serve la rete.'); return; }

      el.disabled = true; el.textContent = 'Creo l\'account\u2026';
      const rimetti = () => { el.disabled = false; el.textContent = 'Crea account'; };
      conScadenza(registrati({nick, nome, cognome, pw}), 20000).then(esito => {
        if(esito === 'nick-preso'){
          rimetti(); erroreAuth('Il nome utente \u00ab @' + nick + ' \u00bb \u00e8 gi\u00e0 preso. Provane un altro.'); return;
        }
        if(esito === 'conferma-nick'){
          /* Con "Confirm email" acceso l'account resta in attesa di una mail che
             non arriverà mai: va spenta l'opzione su Supabase. */
          $('onb').innerHTML = '<div class="onb-main"><div class="onb-box done-box">' +
            '<div class="big">\u2699\ufe0f</div><h2>Manca un\'impostazione</h2>' +
            '<p>L\'account <b>@' + esc(nick) + '</b> \u00e8 stato creato, ma il server aspetta una conferma via email \u2014 e qui nessuno lascia l\'email.</p>' +
            '<p style="font-size:12.5px;color:var(--ink-3);margin-top:10px;line-height:1.6">Su Supabase: <b>Authentication \u2192 Sign In / Providers \u2192 Email</b>, spegni <b>Confirm email</b> e salva. ' +
            'Poi torna qui ed entra normalmente.</p>' +
            '<button class="btn btn-primary btn-full" style="margin-top:18px" data-act="auth-tab" data-v="entra">Torna all\'accesso</button></div></div>';
          return;
        }
        ricordaNick(nick);
        boot();
      }).catch(err => { rimetti(); erroreAuth(testoErrore(err)); chiaveRotta(err); });
      break;
    }
    case 'fai-entra': {
      const chi = normNick(val('auChi')), pw = val('auPw');
      /* Meglio dire subito cosa manca che mandare una richiesta destinata a
         tornare indietro con un errore generico. */
      if(!chi){ erroreAuth('Scrivi il tuo nome utente.'); $('auChi').focus(); return; }
      if(!pw){ erroreAuth('Scrivi la password.'); $('auPw').focus(); return; }
      if(!nickOk(chi)){
        erroreAuth('Quello non è un nome utente valido: da 3 a 20 caratteri fra lettere, numeri, punto e trattino basso.');
        $('auChi').focus(); return;
      }
      if(!navigator.onLine){ erroreAuth('Sei senza connessione: per entrare serve la rete.'); return; }
      el.disabled = true; el.textContent = 'Entro\u2026';
      $('auErr').classList.add('hide');
      /* Un limite di tempo: senza, con il progetto in pausa il pulsante resta
         "Entro…" per sempre. */
      conScadenza(entra(chi, pw), 20000)
        .then(() => { ricordaNick(chi); boot(); })
        .catch(err => {
          el.disabled = false; el.textContent = 'Entra';
          erroreAuth(testoErrore(err)); chiaveRotta(err);
          const c = $('auPw'); if(c){ c.value = ''; c.focus(); }
        });
      break;
    }
    case 'fai-recupera': spiegaPassword(); break;
    case 'esci-account': chiediEsci(); break;
    /* Il recupero password non può esistere senza email, e l'app lo dice con
       onestà. Il CAMBIO invece non ha bisogno di nessuna email: non c'era, e
       chi sospettava che qualcuno gli avesse visto la password non poteva fare
       niente. */
    case 'cambia-pw': formCambiaPw(); break;
    case 'fai-cambia-pw': {
      const vecchia = val('pwVecchia'), nuova = val('pwNuova'), ripeti = val('pwRipeti');
      const err = $('pwErr');
      const dì = m => { err.textContent = m; err.classList.remove('hide'); };
      if(nuova.length < 8) return dì('La nuova password deve avere almeno 8 caratteri.');
      if(nuova !== ripeti) return dì('Le due nuove password non coincidono.');
      if(nuova === vecchia) return dì('La nuova password è uguale a quella di adesso.');
      el.disabled = true; el.textContent = 'Cambio…';
      /* Prima si riverifica quella vecchia: senza, chi trova il telefono
         sbloccato cambia la password e ti chiude fuori dal tuo account. */
      sb.auth.signInWithPassword({email:utente.email, password:vecchia})
        .then(r => {
          if(r.error) throw new Error('vecchia');
          return sb.auth.updateUser({password:nuova});
        })
        .then(r => {
          if(r.error) throw r.error;
          closeModal(); toast('Password cambiata');
        })
        .catch(e => {
          el.disabled = false; el.textContent = 'Cambia password';
          dì(String(e && e.message) === 'vecchia' ? 'La password di adesso non è giusta.'
                                                  : 'Non riesco a cambiarla adesso: riprova fra poco.');
        });
      break;
    }
    case 'do-esci': closeModal(); esci(el.dataset.v === 'pulisci'); break;
    case 'esci-locale': chiediEsciLocale(); break;
    case 'mostra-pw': {
      const c = $(el.dataset.v); if(!c) break;
      const visibile = c.type === 'text';
      c.type = visibile ? 'password' : 'text';
      el.innerHTML = visibile ? '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.8"/></svg>' : '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5l16 15M9.4 6.6A9.8 9.8 0 0 1 12 6.3c5.9 0 9.5 5.7 9.5 5.7a17 17 0 0 1-3.4 3.9M6.3 8.4A16.8 16.8 0 0 0 2.5 12s3.6 5.7 9.5 5.7a9.6 9.6 0 0 0 3.1-.5"/><path d="M10.2 10.4a2.8 2.8 0 0 0 3.7 3.9"/></svg>';
      el.setAttribute('aria-label', visibile ? 'Mostra la password' : 'Nascondi la password');
      c.focus();
      break;
    }
    case 'do-import': {
      if(!daImportare) break;
      DB = daImportare; daImportare = null; migra();
      DB.aggiornato = new Date().toISOString();
      save(); closeModal(); boot(); toast('Backup importato');
      break;
    }
    case 'tieni-locali': {
      closeModal();
      DB.aggiornato = new Date().toISOString();
      remotoInAttesa = null;
      inviaDati().then(() => { boot(); toast('Tenuti i viaggi di questo dispositivo'); });
      break;
    }
    case 'tieni-remoti': {
      closeModal();
      if(remotoInAttesa && remotoInAttesa.dati){
        DB = remotoInAttesa.dati; migra(); DB.propr = utente ? utente.id : DB.propr;
        salvaLocale();
      }
      remotoInAttesa = null;
      boot(); toast('Caricati i viaggi del tuo account');
      break;
    }
    case 'installa': {
      if(!invitoInstalla){ toast('Il browser non offre l\'installazione qui'); break; }
      invitoInstalla.prompt();
      invitoInstalla.userChoice.then(() => { invitoInstalla = null; render(); }).catch(() => {});
      break;
    }
    case 'do-esci-locale': esciLocale(); break;
    case 'diagnosi': diagnosi(); break;
    case 'config-cloud': formCloud(); break;
    case 'elimina-account': {
      const mio = nickDi(utente) || '';
      modal(mHead('Eliminare l\'account?', 'Non si torna indietro') +
        '<div class="modal-b"><div style="font-size:13px;line-height:1.65;color:var(--ink-2)">' +
          'Spariscono account, viaggi, documenti e allegati, da qui e dal server. ' +
          'I viaggi che organizzi spariscono anche per chi partecipa.<br><br>' +
          'Se ti servono, <b>scarica prima il backup</b>.' +
        '</div>' +
        '<div class="field" style="margin:15px 0 0"><label>Scrivi <b>@' + esc(mio) + '</b> per confermare</label>' +
          '<input class="inp" id="delNick" placeholder="@' + esc(mio) + '" autocapitalize="off"></div>' +
          '<div class="err hide" id="delErr">Il nome utente non corrisponde.</div>' +
        '</div>' +
        '<div class="modal-f"><button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
          '<span class="sp"></span>' +
          '<button class="btn btn-ghost btn-sm" data-act="export"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M6 13l6 6 6-6"/></svg> Backup</button>' +
          '<button class="btn btn-danger" data-act="do-elimina-account">Elimina tutto</button></div>');
      break;
    }
    case 'do-elimina-account': {
      const scritto = normNick(val('delNick'));
      if(scritto !== normNick(nickDi(utente))){
        $('delErr').classList.remove('hide'); $('delNick').classList.add('bad'); return;
      }
      eliminaAccount(); break;
    }
    case 'sposta-file': el.disabled = true; el.textContent = 'Sposto…'; spostaAllegati(); break;
    case 'salva-cloud': {
      const url = pulisci(val('cfgUrl')), key = pulisci(val('cfgKey'));
      if(!url || !key){ toast('Servono sia l\'indirizzo sia la chiave'); return; }
      if(!/^https:\/\/.+\.supabase\.co$/.test(url)){ toast('L\'indirizzo è tipo https://xxxx.supabase.co'); return; }
      scriviCfg({url, key});
      DB.soloLocale = false; save();
      toast('Chiave salvata');
      sb = null; utente = null; motivoCloud = '';
      closeModal();
      initCloud().then(() => boot());
      break;
    }
    case 'togli-cloud': {
      conferma('Staccare l\'account?', 'TOYO torna a salvare solo su questo dispositivo. I dati già online restano dove sono.', 'do-togli-cloud');
      break;
    }
    case 'do-togli-cloud': {
      scriviCfg(null); sb = null; utente = null; syncStato = 'off';
      DB.soloLocale = true; save(); closeModal(); render(); toast('Torno alla modalità locale');
      break;
    }
    case 'crea-account': { DB.soloLocale = false; save(); boot(); break; }
    case 'copia-sql': {
      try{ navigator.clipboard.writeText(SQL_SETUP); toast('SQL copiato: incollalo nell\'SQL Editor di Supabase'); }
      catch(err){ toast('Copia manualmente il testo qui sotto'); }
      break;
    }

    /* --- onboarding --- */
    case 'onb-save': {
      const n = val('obNome'), nk = normNick(val('obNick'));
      const err = $('obErr');
      $('obNome').classList.toggle('bad', !n);
      if($('obNick')) $('obNick').classList.toggle('bad', !nickOk(nk));
      if(!n || !nickOk(nk)){
        err.textContent = !n ? 'Scrivi il tuo nome.'
          : (nk ? 'Il nome utente può avere da 3 a 20 caratteri fra lettere, numeri, punto e trattino basso.'
                : 'Scegli un nome utente.');
        err.classList.remove('hide'); return;
      }
      DB.profilo = {nome:n, cognome:val('obCogn'), nick:nk, email:'', tel:'', nascita:'', nazione:'', cf:''};
      save(); boot(); toast('Ciao ' + n + '! Crea il tuo primo viaggio');
      break;
    }

    /* --- navigazione --- */
    case 'toggle-role-menu': sincronizzaEspanso(el, 'roleMenu'); stop(); { const m = $('roleMenu'), on = m.classList.contains('on'); closeMenus(); if(!on){ m.classList.add('on'); $('roleSw').classList.add('open'); } break; }
    case 'toggle-user-menu': sincronizzaEspanso(el, 'userMenu'); stop(); { const m = $('userMenu'), on = m.classList.contains('on'); closeMenus(); if(!on) m.classList.add('on'); break; }
    case 'set-role': DB.ruolo = el.dataset.role; save(); go('hub'); toast(DB.ruolo === 'organizzatore' ? 'Modalità organizzatore' : 'Modalità viaggiatore'); break;
    case 'nav':
      go(el.dataset.view);
      /* La bacheca si va a prendere solo quando la si apre davvero: caricarla
         all'avvio vorrebbe dire far aspettare i post a chi voleva solo
         guardare l'itinerario. */
      if(el.dataset.view === 'bacheca' && socialAttivo() && !bachecaPronta)
        scaricaBacheca().then(render);
      if(el.dataset.view === 'cerca' && socialAttivo()){
        setTimeout(() => { const i = $('qCerca'); if(i) i.focus(); }, 60);
        if(!cercaPronta) scopriLuoghi().then(() => {
          const b = $('risCerca'); if(b) b.innerHTML = risultatiCerca();
        });
      }
      break;
    case 'bacheca-tab':
      V.bTab = el.dataset.v; bacheca = []; render();
      scaricaBacheca().then(render);
      break;
    case 'cerca-tab':
      V.cTab = el.dataset.v;
      /* Si ridisegna solo l'elenco: rifare la pagina toglierebbe il cursore
         dalla casella mentre si sta ancora scrivendo. */
      document.querySelectorAll('#stage .tabs button').forEach(x =>
        x.classList.toggle('on', x === el));
      { const box = $('risCerca'); if(box) box.innerHTML = risultatiCerca(); }
      if(!cercaPronta || (!qCerca && !((V.cTab === 'persone') ? risPersone : risLuoghi).length)){
        (V.cTab === 'persone' ? scopriPersone() : scopriLuoghi()).then(() => {
          const box = $('risCerca'); if(box) box.innerHTML = risultatiCerca();
        });
      }
      break;
    case 'fai-cerca': stop(); cercaScrivendo(val('qCerca')); break;
    case 'pulisci-cerca':
      qCerca = ''; cercaPronta = false;
      if($('qCerca')) $('qCerca').value = '';
      render(); setTimeout(() => { const i = $('qCerca'); if(i) i.focus(); }, 30);
      scopriLuoghi().then(() => { const b = $('risCerca'); if(b) b.innerHTML = risultatiCerca(); });
      break;
    case 'apri-luogo': apriLuogo(el.dataset.v); break;
    case 'go-docs': go('docs'); break;
    case 'open-trip': go('trip', id, 'panoramica'); break;
    case 'tab': V.tab = el.dataset.tab; render(); break;
    case 'close-modal': closeModal(); break;
    case 'fab':
      if(V.view === 'hub') formViaggio();
      else if(V.view === 'docs') formDoc('me');
      else if(V.view === 'bacheca') formPost();
      else if(V.view === 'trip'){
        ({itinerario:()=>formTappa(), prenotazioni:()=>formPren(), persone:()=>formPersona(), soldi:()=>formSpesa(),
          documenti:()=>formDoc('trip'), dafare:()=>formTodo(), decisioni:()=>formSondaggio(),
          panoramica:()=>formTodo()}[V.tab] || (()=>formTodo()))();
      }
      break;

    /* --- bacheca --- */
    case 'new-post': formPost(); break;
    case 'post-foto': stop(); scegliFotoPost(); break;
    case 'togli-foto-post': {
      stop();
      const i = +el.dataset.i;
      const f = tmpFotoPost[i];
      if(f){ try{ URL.revokeObjectURL(f.anteprima); }catch(err){} tmpFotoPost.splice(i, 1); disegnaFotoPost(); }
      break;
    }
    case 'salva-post': salvaPost(); break;
    case 'mi-piace': toccaMiPiace(id); break;
    case 'commenti': apriCommenti(id); break;
    case 'salva-commento': salvaCommento(id); break;
    case 'del-commento': eliminaCommento(id, el.dataset.v); break;
    case 'menu-post': menuPost(id); break;
    case 'del-post': conferma('Eliminare il post?', 'Spariscono anche le foto, i mi piace e i commenti. Non si torna indietro.', 'do-del-post', id); break;
    case 'do-del-post': eliminaPost(id); break;
    case 'apri-foto': apriFotoPost(id, +el.dataset.i); break;
    case 'segui': closeModal(); segui(id); break;
    case 'form-segnala': formSegnala(id); break;
    case 'fai-segnala': segnala(id, el.dataset.v); break;
    case 'form-blocca': formBlocca(id); break;
    case 'fai-blocca': blocca(id); break;
    case 'fai-sblocca': closeModal(); sblocca(id); break;
    case 'profilo-di': apriProfiloDi(id); break;
    /* ⚠️ C'erano DUE ricerche di persone: una finestrella e la pagina nuova.
       Due strade per la stessa cosa vuol dire che una delle due e' sempre
       quella sbagliata. Resta la pagina, aperta sulla scheda giusta. */
    case 'cerca-gente': V.cTab = 'persone'; go('cerca');
      setTimeout(() => { const i = $('qCerca'); if(i) i.focus(); }, 60);
      if(!risPersone.length) scopriPersone().then(() => {
        const b = $('risCerca'); if(b) b.innerHTML = risultatiCerca();
      });
      break;
    case 'foto-profilo': cambiaFotoProfilo(); break;
    case 'togli-foto-profilo': togliFotoProfilo(); break;

    /* --- viaggio --- */
    case 'new-trip': closeMenus(); if(DB.ruolo !== 'organizzatore'){ DB.ruolo = 'organizzatore'; save(); } formViaggio(); break;
    case 'toggle-arch': V.mostraArch = !V.mostraArch; render(); break;
    case 'apri-invito': formApriInvito(); break;
    case 'apri-idea': apriIdea(id); break;
    case 'usa-idea': usaIdea(id); break;
    case 'leggi-invito': {
      const testo = val('invTesto');
      const i = testo.indexOf('invito=');
      if(i < 0){ toast('Non trovo un invito in quel testo'); return; }
      try{
        const d = JSON.parse(b64dec(testo.slice(i + 7).split(/[^A-Za-z0-9\-_]/)[0]));
        closeModal(); mostraInvito(d);
      }catch(err){ toast('Questo link non è un invito valido'); }
      break;
    }
    case 'archivia': { const v = DB.viaggi.find(x => x.id === id) || t; v.archiviato = true; save(); closeModal(); render(); toast('Viaggio archiviato'); break; }
    case 'ripristina': { const v = DB.viaggi.find(x => x.id === id) || t; v.archiviato = false; save(); closeModal(); render(); toast('Viaggio ripreso'); break; }
    case 'edit-trip': formViaggio(DB.viaggi.find(x => x.id === id)); break;
    case 'pick-mio': document.querySelectorAll('#vRuolo .chip').forEach(c => c.classList.toggle('on', c === el)); break;
    case 'pick-emoji': tmpEmoji = el.dataset.v; document.querySelectorAll('#vEmoji button').forEach(b => b.classList.toggle('on', b === el)); break;
    case 'pick-tema': tmpTema = +el.dataset.v; document.querySelectorAll('#vTema .theme').forEach(b => b.classList.toggle('on', b === el)); break;
    case 'save-trip': {
      const nuovo = leggiViaggio({id:uid(), mio:true, archiviato:null, tappe:[], prenotazioni:[], gente:[], spese:[], todo:[], docs:[], mieiDocs:[], mioVersato:0});
      if(!nuovo) return;
      DB.viaggi.push(nuovo); DB.ruolo = 'organizzatore'; save();
      closeModal(); go('trip', nuovo.id, 'panoramica'); toast('Viaggio creato');
      break;
    }
    case 'update-trip': { if(!leggiViaggio(t)) return; save(); closeModal(); render(); toast('Viaggio aggiornato'); break; }
    case 'del-trip': conferma('Eliminare il viaggio?', 'Spariscono anche tappe, persone, spese e documenti allegati. Non si torna indietro.', 'do-del-trip', t.id); break;
    case 'do-del-trip': {
      const vg = DB.viaggi.find(x => x.id === id);
      /* Senza questa riga il viaggio spariva solo dal proprio elenco e restava
         per sempre nel TOYO degli invitati, che nessuno poteva più aggiornare
         né togliere. Il "cascade" del database porta via membri, spese e voti. */
      if(sb && utente && vg && (vg.condiviso || vg.coorg)){
        sb.from('toyo_viaggi').delete().eq('id', id).then(() => {}, () => toast('Eliminato qui, ma non sul server: riprova online'));
      }
      DB.viaggi = DB.viaggi.filter(x => x.id !== id);
      save(); closeModal(); go('hub'); toast('Viaggio eliminato');
      break;
    }

    /* --- tappe --- */
    case 'new-tappa': formTappa(); break;
    case 'cerca-luogo': stop(); cercaLuogo(); break;
    case 'mia-posizione': stop(); usaPosizione(); break;
    case 'pick-luogo': { const r = geoRis[+el.dataset.i]; if(r){ segnaLuogo(r.lat, r.lon, r.nome, r.pid); if($('tDove') && !val('tDove')) $('tDove').value = r.nome; } break; }
    case 'pick-cat': document.querySelectorAll('#sCat .chip').forEach(c => c.classList.toggle('on', c === el)); break;
    case 'pick-paga': document.querySelectorAll('#sPaga .chip').forEach(c => c.classList.toggle('on', c === el)); break;
    case 'pick-ruolo': document.querySelectorAll('#invRuolo .chip').forEach(c => c.classList.toggle('on', c === el)); break;
    /* "Divisa fra" è a scelta multipla, ma almeno uno deve restare acceso:
       una spesa divisa fra nessuno non vuol dire niente. */
    case 'pick-fra': {
      const acc = document.querySelectorAll('#sFra .chip.on');
      if(acc.length === 1 && acc[0] === el){ toast('Almeno una persona deve restare'); break; }
      el.classList.toggle('on');
      break;
    }
    case 'pick-tipot': tmpTipoT = el.dataset.v; document.querySelectorAll('#tTipo .chip').forEach(c => c.classList.toggle('on', c === el)); break;
    case 'punto-sel': V.puntoSel = id; V.mapVista = 'punto'; render(); break;
    case 'punto-tutti': V.mapVista = 'percorso'; render(); break;
    case 'togli-luogo': tmpLat = null; tmpLon = null; tmpPid = ''; $('geoBox').innerHTML = '<div style="font-size:12px;color:var(--ink-3);padding:6px 2px">Posizione rimossa: la tappa non comparirà sulla mappa.</div>'; break;
    case 'focus-tappa': focusTappa(id); break;
    case 'edit-tappa': formTappa(t.tappe.find(x => x.id === id)); break;
    case 'save-tappa': case 'update-tappa': {
      const dove = val('tDove');
      if(!dove){ $('tErr').classList.remove('hide'); $('tDove').classList.add('bad'); return; }
      const dal = val('tDal'), al = val('tAl');
      if(!dentroViaggio(dal) || !dentroViaggio(al)){ toast('Quelle date sono fuori dal viaggio'); return; }
      const dati = {nome:dove, dove:dove, tipo:tmpTipoT, gpid:tmpPid,
                    dal, al, ora:($('tOra') ? val('tOra') : ''), note:val('tNote'), lat:tmpLat, lon:tmpLon,
                    costo:val('tCosto'), pagato:$('tPagato').checked};
      if(a === 'save-tappa') t.tappe.push(Object.assign({id:uid()}, dati));
      else Object.assign(t.tappe.find(x => x.id === V.editId), dati);
      save(); closeModal(); V.tab = 'itinerario'; render();
      toast(tmpLat != null ? 'Tappa salvata e messa sulla mappa' : 'Tappa salvata');
      break;
    }
    case 'del-tappa': conferma('Eliminare la tappa?', 'Resta tutto il resto del viaggio.', 'do-del-tappa', id); break;
    case 'do-del-tappa': t.tappe = t.tappe.filter(x => x.id !== id); save(); closeModal(); render(); break;

    /* --- persone --- */
    case 'new-pren': formPren(); break;
    case 'edit-pren': formPren((t.prenotazioni || []).find(x => x.id === id)); break;
    case 'pick-tipop': tmpTipoP = el.dataset.v; document.querySelectorAll('#pTipo .chip').forEach(c => c.classList.toggle('on', c === el)); break;
    case 'pick-statop': document.querySelectorAll('#bStato .chip').forEach(c => c.classList.toggle('on', c === el)); break;
    case 'save-pren': case 'update-pren': {
      const titolo = val('bTitolo');
      if(!titolo){ $('bErr').classList.remove('hide'); $('bTitolo').classList.add('bad'); return; }
      const dal = val('bDal'), al = val('bAl');
      if(!dentroViaggio(dal) || !dentroViaggio(al)){ toast('Quelle date sono fuori dal viaggio'); return; }
      const st = document.querySelector('#bStato .chip.on');
      const dati = {tipo:tmpTipoP, titolo, tappaId: ($('bTappa') ? $('bTappa').value : (x => x)('')), fornitore:val('bForn'), codice:val('bCod'),
        dove:val('tDove'), lat:tmpLat, lon:tmpLon, gpid:tmpPid,
        dal, al, ora:val('bOra'), costo:val('bCosto'),
        stato: st ? st.dataset.v : 'pren', note:val('bNote')};
      t.prenotazioni = t.prenotazioni || [];
    if(typeof t.archiviato === 'undefined') t.archiviato = null;   /* null = decide la data */
      if(a === 'save-pren') t.prenotazioni.push(Object.assign({id:uid()}, dati));
      else Object.assign(t.prenotazioni.find(x => x.id === V.editId), dati);
      save(); closeModal(); render();
      toast(tmpLat != null ? 'Prenotazione salvata e messa sulla mappa' : 'Prenotazione salvata');
      break;
    }
    case 'del-pren': conferma('Eliminare la prenotazione?', 'Sparisce anche dal report delle spese e dalla mappa.', 'do-del-pren', id); break;
    case 'do-del-pren': t.prenotazioni = t.prenotazioni.filter(x => x.id !== id); save(); closeModal(); render(); break;
    case 'new-persona': formPersona(); break;
    case 'togli-membro': conferma('Togliere dal viaggio?', 'Il viaggio sparisce dal suo TOYO. Le spese che ha registrato restano nel conto.', 'do-togli-membro', el.dataset.id); break;
    case 'do-togli-membro': {
      if(!sb || !utente || !t) break;
      sb.from('toyo_membri').delete().eq('viaggio', t.id).eq('utente', id)
        .then(() => scaricaMembri()).then(() => { closeModal(); render(); toast('Tolto dal viaggio'); },
              () => toast('Non riesco a toglierlo adesso'));
      break;
    }

    /* ---- sondaggi ---- */
    case 'new-sondaggio': formSondaggio(); break;
    case 'save-sondaggio': {
      const dom = val('qDomanda');
      const opz = (val('qOpz') || '').split('\n').map(r => r.trim()).filter(Boolean);
      if(!dom || opz.length < 2){ $('qErr').classList.remove('hide'); return; }
      t.sondaggi = t.sondaggi || [];
      t.sondaggi.unshift({id:uid(), domanda:dom, chiuso:false,
        opzioni: opz.slice(0, 10).map(x => ({id:uid(), testo:x}))});
      save(); closeModal(); V.tab = 'decisioni'; render(); toast('Votazione aperta');
      break;
    }
    case 'vota': {
      if(!t) break;
      vota(t, id, el.dataset.v).then(render)
        .catch(() => toast('Non riesco a registrare il voto adesso'));
      break;
    }
    case 'chiudi-sondaggio': {
      const sd = (t.sondaggi || []).find(x => x.id === id);
      if(sd){ sd.chiuso = !sd.chiuso; save(); render(); toast(sd.chiuso ? 'Votazione chiusa' : 'Votazione riaperta'); }
      break;
    }
    case 'del-sondaggio': conferma('Eliminare la domanda?', 'Spariscono anche i voti già dati.', 'do-del-sondaggio', id); break;
    case 'do-del-sondaggio': {
      t.sondaggi = (t.sondaggi || []).filter(x => x.id !== id);
      if(sb && utente) sb.from('toyo_voti').delete().eq('viaggio', t.id).eq('sondaggio', id).then(()=>{}, ()=>{});
      save(); closeModal(); render();
      break;
    }

    case 'invita': formInvito(id || ''); break;

    /* ---- invito per nome utente ---- */
    case 'cerca-utente': {
      const box = $('invEsito'); if(!box) break;
      box.innerHTML = '<div style="font-size:12.5px;color:var(--ink-3)">Cerco…</div>';
      cercaPersona(val('invNick')).then(r => {
        if(r.errore){ box.innerHTML = '<div style="font-size:12.5px;color:var(--rust,#b4472e)">' + esc(r.errore) + '</div>'; return; }
        const p = r.persona;
        const nomeCompleto = (p.nome + ' ' + (p.cognome || '')).trim();
        box.innerHTML =
          '<div class="row" style="padding:9px 2px"><span class="tx">' +
            '<span class="t">@' + esc(p.nick) + '</span>' +
            (nomeCompleto ? '<span class="m">' + esc(nomeCompleto) + '</span>' : '') +
          '</span></div>' +
          '<div class="chips" id="invRuolo" style="margin:9px 0 10px">' +
            '<button class="chip on" type="button" data-act="pick-ruolo" data-v="viaggiatore">' + ico('valigia',15) + 'Partecipa</button>' +
            '<button class="chip" type="button" data-act="pick-ruolo" data-v="organizzatore">' + ico('bussola',15) + 'Co-organizza</button>' +
          '</div>' +
          '<div style="font-size:11.5px;color:var(--ink-3);margin-bottom:10px">Chi partecipa consulta e basta. ' +
            'Un <b>co-organizzatore</b> modifica il viaggio come te e può invitare altri.</div>' +
          '<button class="btn btn-primary btn-sm" data-act="manda-invito" data-u="' + esc(p.utente) + '" data-n="' + esc(p.nick) + '">Manda la richiesta</button>';
      });
      break;
    }
    case 'manda-invito': {
      if(!t) break;
      const box = $('invEsito');
      const rr = document.querySelector('#invRuolo .chip.on');
      const ruolo = rr ? rr.dataset.v : 'viaggiatore';
      el.disabled = true; el.textContent = 'Mando…';
      mandaInvito(t, {utente:el.dataset.u, nick:el.dataset.n}, ruolo).then(() => {
        if(box) box.innerHTML = '<div style="font-size:12.5px;color:var(--sage,#4a7c59)"><svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg> Richiesta mandata a @' +
          esc(el.dataset.n) + '. La trova aprendo TOYO.</div>';
        toast('Invito mandato a @' + el.dataset.n);
      }).catch(err => {
        el.disabled = false; el.textContent = 'Manda la richiesta';
        if(box) box.innerHTML = '<div style="font-size:12.5px;color:var(--rust,#b4472e)">Non ci riesco: ' +
          esc((err && err.message) || 'errore') + '. Se dice che manca una tabella, rilancia l\'SQL su Supabase.</div>';
      });
      break;
    }
    case 'accetta-invito':
    case 'rifiuta-invito': {
      const ok = a === 'accetta-invito';
      el.disabled = true; el.textContent = ok ? 'Entro…' : 'Rifiuto…';
      rispondiInvito(el.dataset.v, ok).then(() => {
        render();
        toast(ok ? 'Sei dentro: lo trovi fra i viaggi a cui partecipi' : 'Invito rifiutato');
      }).catch(() => { el.disabled = false; el.textContent = ok ? 'Accetta' : 'Rifiuta'; toast('Non riesco a rispondere adesso'); });
      break;
    }

    case 'copia-link': {
      const link = $('invLink').textContent;
      try{ navigator.clipboard.writeText(link); toast('Link copiato: incollalo dove vuoi'); }
      catch(err){
        const r = document.createRange(); r.selectNode($('invLink'));
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        toast('Link selezionato: copialo a mano');
      }
      break;
    }
    case 'condividi-link': {
      const link = $('invLink').textContent;
      if(navigator.share) navigator.share({title:'Invito a ' + t.nome, text:testoInvito(t, link), url:link}).catch(()=>{});
      break;
    }
    case 'invita-nuovo': {
      const nome = val('invNome');
      if(!nome){ toast('Scrivi almeno il nome'); return; }
      t.gente.push({id:uid(), nome:nome, email:'', stato:'invitato', versato:'', docs:[]});
      save(); closeModal(); render(); toast('Aggiunto fra gli invitati');
      break;
    }
    case 'accetta-invito-link': accettaInvito(); break;
    case 'edit-persona': formPersona(t.gente.find(x => x.id === id)); break;
    case 'pick-stato': document.querySelectorAll('#pStato .chip').forEach(c => c.classList.toggle('on', c === el)); break;
    case 'save-persona': case 'update-persona': {
      const nome = val('pNome');
      if(!nome){ $('pErr').classList.remove('hide'); $('pNome').classList.add('bad'); return; }
      const st = document.querySelector('#pStato .chip.on');
      const dati = {nome, email:val('pEmail'), stato: st ? st.dataset.v : 'invitato', versato: val('pVersato')};
      if(a === 'save-persona') t.gente.push(Object.assign({id:uid()}, dati));
      else Object.assign(t.gente.find(x => x.id === V.editId), dati);
      save(); closeModal(); render(); toast('Salvato');
      break;
    }
    case 'del-persona': conferma('Togliere questa persona?', 'Sparisce dal viaggio, insieme a quanto risulta versato.', 'do-del-persona', id); break;
    case 'do-del-persona': {
      /* Le spese che la riguardano restano. Se non si ripuliscono i riferimenti,
         quelle che aveva anticipato vengono riattribuite a chi organizza e le
         divisioni cambiano da sole: i conti di tutti si spostano senza che
         nessuno abbia toccato niente. */
      const p = t.gente.find(x => x.id === id);
      t.gente = t.gente.filter(x => x.id !== id);
      let toccate = 0;
      (t.spese || []).forEach(x => {
        if(x.chiPaga === id){ x.chiPaga = 'org'; toccate++; }
        if(Array.isArray(x.divisoTra) && x.divisoTra.indexOf(id) >= 0){
          x.divisoTra = x.divisoTra.filter(v => v !== id); toccate++;
        }
      });
      save(); closeModal(); render();
      toast(toccate ? 'Persona eliminata: ' + toccate + (toccate === 1 ? ' spesa ricalcolata' : ' spese ricalcolate') : 'Persona eliminata');
      break;
    }

    /* --- spese --- */
    case 'new-spesa': formSpesa(); break;
    case 'edit-spesa': formSpesa(tutteSpese(t).find(x => x.id === id)); break;
    case 'toggle-spesa': {
      const s = tutteSpese(t).find(x => x.id === id);
      if(!s) break;
      if(s.condivisa){
        if(!miaSpesa(s)){ toast('Questa voce la gestisce chi l\'ha registrata'); break; }
        salvaSpesaCondivisa(t, Object.assign({}, s, {pagato: !s.pagato}), s.id)
          .then(render).catch(() => toast('Non riesco a salvare adesso'));
      } else {
        if(!posso(t)){ toast('Questo viaggio lo gestisce chi lo organizza'); break; }
        s.pagato = !s.pagato; save(); render();
      }
      break;
    }
    case 'save-spesa': case 'update-spesa': {
      const voce = val('sVoce');
      if(!voce){ $('sErr').classList.remove('hide'); $('sVoce').classList.add('bad'); return; }
      const cc = document.querySelector('#sCat .chip.on');
      const pp = document.querySelector('#sPaga .chip.on');
      /* Se sono selezionati tutti, si salva la lista VUOTA che vuol dire
         "fra tutti": congelare i nomi di oggi escluderebbe per sempre chi
         accetta l'invito domani. */
      const tutti = Array.from(document.querySelectorAll('#sFra .chip')).map(e => e.dataset.v);
      const scelti = Array.from(document.querySelectorAll('#sFra .chip.on')).map(e => e.dataset.v);
      const ff = (scelti.length === tutti.length) ? [] : scelti;
      const dati = {voce, importo: val('sImporto'), fornitore: val('sFornitore'),
                    cat: cc ? cc.dataset.v : 'altro', pagato: $('sPagato').checked,
                    chiPaga: pp ? pp.dataset.v : 'org', divisoTra: ff};

      /* Chi può modificare il viaggio scrive dentro il viaggio; chi partecipa
         scrive nella tabella delle spese, l'unico posto dove ha diritto. */
      const nella = a === 'update-spesa' && (t.spese || []).some(x => x.id === V.editId);
      const dentroIlViaggio = a === 'save-spesa' ? posso(t) : nella;

      if(dentroIlViaggio){
        if(a === 'save-spesa') t.spese.push(Object.assign({id:uid()}, dati));
        else Object.assign(t.spese.find(x => x.id === V.editId), dati);
        save(); closeModal(); render(); toast('Spesa salvata');
      } else {
        if(!sb || !utente){ toast('Per aggiungere una spesa qui serve un account'); return; }
        salvaSpesaCondivisa(t, dati, a === 'update-spesa' ? V.editId : null)
          .then(() => { closeModal(); render(); toast('Spesa salvata: la vedono tutti'); })
          .catch(() => toast('Non riesco a salvare la spesa adesso'));
      }
      break;
    }
    case 'del-spesa': conferma('Eliminare la spesa?', 'Il bilancio si aggiorna subito.', 'do-del-spesa', id); break;
    case 'do-del-spesa': {
      const s = tutteSpese(t).find(x => x.id === id);
      if(s && s.condivisa){
        cancellaSpesaCondivisa(id).then(() => { closeModal(); render(); })
          .catch(() => toast('Non riesco a eliminarla adesso'));
      } else {
        t.spese = t.spese.filter(x => x.id !== id); save(); closeModal(); render();
      }
      break;
    }

    /* --- da fare --- */
    case 'new-todo': formTodo(); break;
    case 'lista-pronta': formListaPronta(); break;
    case 'salva-lista': salvaListaPronta(); break;
    case 'lista-bagaglio': formBagaglio(); break;
    case 'salva-bagaglio': salvaBagaglio(); break;

    /* --- itinerario: ordine della giornata e copie fuori dall'app --- */
    case 'ott-giorno': {
      const n = ottimizzaGiorno(t, el.dataset.v);
      if(!n){ toast('Servono almeno tre punti con luogo'); return; }
      save(); render(); toast('Giornata rimessa in fila: meno spostamenti');
      break;
    }
    case 'stampa-viaggio': stampaViaggio(t); break;
    case 'ics-viaggio': icsViaggio(t); break;
    case 'edit-todo': formTodo(t.todo.find(x => x.id === id)); break;
    case 'toggle-todo': { const x = t.todo.find(y => y.id === id); x.fatto = !x.fatto; save(); render(); break; }
    case 'save-todo': case 'update-todo': {
      const testo = val('dT');
      if(!testo){ $('dErr').classList.remove('hide'); $('dT').classList.add('bad'); return; }
      const dati = {t:testo, scad:val('dScad'), per:val('dPer')};
      if(a === 'save-todo') t.todo.push(Object.assign({id:uid(), fatto:false}, dati));
      else Object.assign(t.todo.find(x => x.id === V.editId), dati);
      save(); closeModal(); render(); toast('Salvato');
      break;
    }
    case 'del-todo': conferma('Eliminare?', 'Sparisce dalla lista delle cose da fare.', 'do-del-todo', id); break;
    case 'do-del-todo': t.todo = t.todo.filter(x => x.id !== id); save(); closeModal(); render(); break;

    /* --- quota personale --- */
    case 'mia-quota': formQuota(); break;
    case 'usa-quota': t.quota = el.dataset.v; save(); render(); toast('Quota aggiornata a ' + eur(el.dataset.v) + ' a persona'); break;
    case 'save-quota': t.quota = val('qQuota'); t.mioVersato = val('qVersato'); save(); closeModal(); render(); toast('Quota aggiornata'); break;

    /* --- documenti --- */
    case 'new-doc-me': formDoc('me'); break;
    case 'lista-doc': listaDoc(el.dataset.scope); break;
    case 'add-doc-scope': formDoc(el.dataset.scope); break;
    case 'copia-doc': {
      const scope = $('modal').dataset.scope;
      const src = DB.docs.find(x => x.id === id);
      if(!src) return;
      /* ⚠️ Object.assign è superficiale: la copia puntava allo STESSO file
     nell'archivio. Togliendo la copia dal viaggio si cancellava il file, e il
     documento originale restava in elenco senza potersi più aprire. */
  const copia = JSON.parse(JSON.stringify(src));
  copia.id = uid();
  if(copia.file && copia.file.percorso) copia.file = {n:copia.file.n, mime:copia.file.mime,
    size:copia.file.size, percorso:copia.file.percorso, riferimento:true};
  contenitore(scope).push(copia);
      save(); listaDoc(scope); render(); toast('Documento copiato');
      break;
    }
    case 'new-doc-trip': formDoc('trip'); break;
    case 'edit-doc': formDoc(el.dataset.scope, trovaDoc(id, el.dataset.scope)); break;
    case 'pick-tipo': tmpTipo = el.dataset.v; document.querySelectorAll('#docTipo .chip').forEach(c => c.classList.toggle('on', c === el)); break;
    case 'pick-file': stop(); apriFile(); break;
    case 'clear-file': tmpFile = null; tmpFileRaw = null; if($('dropT')){ $('dropIc').innerHTML = '<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V5M6 11l6-6 6 6"/></svg>'; $('dropT').textContent = 'Scegli un file'; $('dropM').textContent = 'Foto o PDF, fino a ' + kb(LIMITE_FILE()); $('dropZone').classList.remove('over'); } el.remove(); break;
    case 'save-doc': case 'update-doc': salvaDocumento(a, el); break;
    case 'view-doc': viewDoc(id, el.dataset.scope); break;
    case 'dl-doc': {
      const d = trovaDoc(id, el.dataset.scope);
      if(!d || !d.file) break;
      indirizzoFile(d.file).then(u => { if(u) scarica(d.file.n, u); else toast('File non raggiungibile adesso'); })
        .catch(() => toast('File non raggiungibile adesso'));
      break;
    }
    case 'del-doc': conferma('Eliminare il documento?', 'Sparisce anche il file allegato.', 'do-del-doc', id, el.dataset.scope); break;
    case 'do-del-doc': {
      const scope = el.dataset.scope;
      const arr = contenitore(scope);
      const i = arr.findIndex(x => x.id === id);
      if(i >= 0){ if(arr[i].file && arr[i].file.percorso && !arr[i].file.riferimento) eliminaFile(arr[i].file.percorso); arr.splice(i, 1); }
      save();
      if(scope === 'mie' || scope.indexOf('p:') === 0){ listaDoc(scope); } else { closeModal(); }
      render(); break;
    }

    /* --- profilo e impostazioni --- */
    case 'edit-profilo': formProfilo(); break;
    case 'save-profilo': {
      const n = val('prNome');
      if(!n){ $('prErr').textContent = 'Serve almeno il nome.'; $('prErr').classList.remove('hide'); $('prNome').classList.add('bad'); return; }
      /* con l'account il nome utente è l'identificativo: non si tocca da qui */
      const nk = utente ? (DB.profilo.nick || nickDi(utente)) : normNick(val('prNick'));
      if(!utente && nk && !nickOk(nk)){
        $('prErr').textContent = 'Il nome utente può avere da 3 a 20 caratteri fra lettere, numeri, punto e trattino basso.';
        $('prErr').classList.remove('hide'); $('prNick').classList.add('bad'); return;
      }
      /* ⚠️ Si riparte da quello che c'è, non da zero: costruendo un oggetto
         nuovo da capo, la foto appena caricata (che non ha un campo in questa
         finestra) spariva al primo salvataggio del profilo. */
      DB.profilo = Object.assign({}, DB.profilo, {
        nome:n, cognome:val('prCogn'), nick:nk, email:'',
        tel: val('prTel'), bio: val('prBio').slice(0, 200),
        riservato: !!($('prRiservato') && $('prRiservato').checked),
        nascita:val('prNasc'), nazione:val('prNaz'), cf:val('prCf')});
      save();
      if(sb && utente) pubblicaProfilo();   /* altrimenti gli altri ti cercano col nome vecchio */
      closeModal(); render(); toast('Profilo aggiornato');
      break;
    }
    case 'export': {
      const data = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(DB));
      const oggi = new Date().toISOString().slice(0,10);
      scarica('toyo-backup-' + oggi + '.json', data);
      toast('Backup scaricato');
      break;
    }
    case 'import': {
      const inp = $('filePick'); inp.value = ''; inp.accept = 'application/json';
      inp.onchange = () => {
        const f = inp.files && inp.files[0]; if(!f) return;
        const r = new FileReader();
        r.onload = () => {
          try{
            const d = JSON.parse(r.result);
            if(!d || !d.viaggi) throw new Error('formato');
            /* Sostituire tutto senza dire quanto si sta buttando via è il modo
               più veloce per far perdere sei viaggi a chi apre il backup
               sbagliato. */
            daImportare = d;
            const nDoc = (d.docs || []).length + (d.viaggi || []).reduce((n,t) => n + ((t.docs||[]).length), 0);
            const quando = d.aggiornato ? new Date(d.aggiornato).toLocaleDateString('it-IT') : 'senza data';
            modal(mHead('Importare questo backup?', 'Sostituisce tutto quello che hai adesso') +
              '<div class="modal-b"><div style="font-size:13px;line-height:1.7;color:var(--ink-2)">' +
                'Il file contiene <b>' + d.viaggi.length + (d.viaggi.length === 1 ? ' viaggio' : ' viaggi') + '</b> e <b>' +
                nDoc + (nDoc === 1 ? ' documento' : ' documenti') + '</b> · ' + esc(quando) + '.<br><br>' +
                'Al posto dei <b>' + (DB.viaggi || []).length + '</b> che hai ora.' +
              '</div></div>' +
              '<div class="modal-f"><button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
                '<span class="sp"></span>' +
                '<button class="btn btn-ghost btn-sm" data-act="export"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M6 13l6 6 6-6"/></svg> Backup di adesso</button>' +
                '<button class="btn btn-primary" data-act="do-import">Sostituisci</button></div>');
          }catch(err){ toast('Questo file non è un backup TOYO'); }
        };
        r.readAsText(f);
      };
      inp.click();
      break;
    }
    case 'salva-key': {
      const k = val('gmKey');
      DB.gmapsKey = k; save(); googleP = null; render();
      toast(k ? 'Chiave salvata: mappa completa attiva' : 'Chiave rimossa');
      break;
    }
    case 'togli-key': DB.gmapsKey = ''; save(); googleP = null; render(); toast('Torno alla mappa incorporata'); break;
    case 'reset': conferma('Cancellare tutto?', 'Viaggi, documenti e profilo spariscono da questo dispositivo. Se non hai un backup, non si recupera.', 'do-reset'); break;
    case 'do-reset': {
      try{ localStorage.removeItem(KEY); }catch(err){}
      DB = {v:1, profilo:null, ruolo:'organizzatore', docs:[], viaggi:[]};
      closeModal(); V = {view:'hub', tripId:null, tab:'panoramica', bTab:'seguiti', cTab:'luoghi'}; boot();
      break;
    }
  }
});

/* ricorda l'elemento che stai modificando */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if(el && /^edit-(tappa|persona|spesa|todo|doc|pren)$/.test(el.dataset.act)) V.editId = el.dataset.id;
}, true);

$('ov').addEventListener('click', e => { if(e.target.id === 'ov') closeModal(); });
/* Scrivere nella casella della ricerca fa partire i risultati da solo: non
   c'e' nessun pulsante «cerca» da premere, perche' nelle app dove c'e' non lo
   preme quasi nessuno e sembra che la ricerca non funzioni. */
document.addEventListener('input', e => {
  if(e.target && e.target.id === 'qCerca') cercaScrivendo(e.target.value);
});
document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){ closeModal(); closeMenus(); }
  if(e.key === 'Enter' && e.target && e.target.id === 'qCerca'){
    /* I risultati arrivano scrivendo: l'Invio serve solo a togliere di mezzo
       la tastiera del telefono, che copre meta' schermo. */
    clearTimeout(ritardoCerca);
    cercaScrivendo(e.target.value);
    e.target.blur();
    return;
  }
  if(e.key === 'Enter' && $('ov').classList.contains('on') && e.target.tagName === 'INPUT'){
    /* Un campo che ha un pulsante suo — la ricerca di persone — deve
       rispondere a quello, non a quello in fondo alla finestra: premendo
       Invio nella ricerca si chiudeva la finestra senza cercare niente. */
    const mirato = e.target.dataset.invio;
    const b = mirato ? $('modal').querySelector('[data-act="' + mirato + '"]')
                     : $('modal').querySelector('.modal-f .btn-primary');
    if(b) b.click();
  }
});
/* ⚠️ Prima l'Invio funzionava solo sulla schermata "Come ti chiami?": sulla
   pagina di accesso non faceva niente, e chi scriveva la password e premeva
   Invio restava lì a chiedersi perché. */
$('onb').addEventListener('keydown', e => {
  if(e.key !== 'Enter') return;
  const b = document.querySelector('[data-act="onb-save"], [data-act="fai-entra"], [data-act="fai-registra"]');
  if(b && !b.disabled) b.click();
});
$('onb').addEventListener('keyup', e => {
  if(e.target && e.target.type === 'password') controllaMaiuscole(e);
});
$('onb').addEventListener('input', e => {
  if(e.target && e.target.id === 'auPw') aggiornaForza();
});
/* Scoprire che il nome utente è già preso DOPO aver compilato tutto è la
   frustrazione classica delle registrazioni: si controlla appena esci dal
   campo, con una sola richiesta. */
$('onb').addEventListener('blur', e => {
  if(!e.target || e.target.id !== 'auNick' || !sb) return;
  const n = normNick(e.target.value);
  if(!nickOk(n)) return;
  sb.rpc('toyo_trova', {p_nick:n}).then(r => {
    const preso = r && r.data && (Array.isArray(r.data) ? r.data.length : 1);
    if(preso && normNick(val('auNick')) === n)
      erroreAuth('Il nome utente « @' + n + ' » è già preso. Provane un altro.');
  }).catch(() => {});
}, true);
