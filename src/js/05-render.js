/* ==========================================================================
   RENDER
   ========================================================================== */
function migra(){
  DB.viaggi.forEach(t => {
    t.tappe = t.tappe || []; t.gente = t.gente || []; t.spese = t.spese || [];
    t.sondaggi = t.sondaggi || [];
    t.todo = t.todo || []; t.docs = t.docs || []; t.mieiDocs = t.mieiDocs || [];
    t.gente.forEach(p => { p.docs = p.docs || []; });
    t.prenotazioni = t.prenotazioni || [];
    if(typeof t.archiviato === 'undefined') t.archiviato = null;   /* null = decide la data */
    t.tappe.forEach(x => { x.tipo = x.tipo || 'tappa'; if(!x.dove && x.nome) x.dove = x.nome; });
    t.spese.forEach(x => { x.cat = x.cat || 'altro'; });
  });
  DB.docs = DB.docs || [];
  DB.gmapsKey = DB.gmapsKey || '';
}
/* La libreria arriva da un CDN e import() non ha un tempo massimo: su una rete
   pessima l'app restava a guardare uno sfondo vuoto, per sempre. */
function conScadenza(promessa, ms){
  return Promise.race([promessa, new Promise((_, ko) => setTimeout(() => ko(new Error('scaduto')), ms))]);
}

async function boot(){
  migra();
  const avvio = $('avvio');
  if(avvio) avvio.classList.add('hide');
  const inv = leggiInvitoDaUrl();
  if(inv) invitoInSospeso = inv;

  if(!cloudCfg) cloudCfg = leggiCfg();
  if(cloudAttivo() && !sb){
    try{ await conScadenza(initCloud(), 12000); }
    catch(e){ sb = null; syncStato = 'errore'; }
  }

  /* ⚠️ Se il server non risponde, chi ha già i propri dati qui dentro non deve
     restare chiuso fuori davanti alla schermata di accesso: entra e lavora in
     locale, e la sincronia riparte da sola quando torna la rete. */
  if(cloudAttivo() && !sb && DB.profilo){
    $('onb').classList.add('hide'); $('app').classList.remove('hide');
    render(); segnaSync();
    toast('Non riesco a contattare il server: lavori su questo dispositivo');
    return;
  }

  /* account configurato ma nessuno è entrato → schermata di accesso */
  if(cloudAttivo() && !utente && !DB.soloLocale){
    $('onb').innerHTML = viewAuth();
    $('onb').classList.remove('hide'); $('app').classList.add('hide');
    focusAuth();
    return;
  }
  if(utente && syncStato === 'off'){ syncStato = 'ok'; await allineaDati(); }

  if(!DB.profilo){
    mostraLocale();
    $('onb').classList.remove('hide'); $('app').classList.add('hide');
    return;
  }
  $('onb').classList.add('hide'); $('app').classList.remove('hide');
  render(); segnaSync();
  if(invitoInSospeso) setTimeout(() => mostraInvito(invitoInSospeso), 250);
}
function render(){
  const org = DB.ruolo === 'organizzatore';
  V.mostraArch = V.mostraArch || false;
  $('roleIc').innerHTML = ico(org ? 'bussola' : 'valigia', 19);
  $('roleNm').textContent = org ? 'Organizzatore' : 'Viaggiatore';
  const n = viaggiVivi().length;
  $('roleD').textContent = org
    ? (n ? n + (n === 1 ? ' viaggio che gestisci' : ' viaggi che gestisci') : 'nessun viaggio ancora')
    : (n ? n + (n === 1 ? ' viaggio a cui partecipi' : ' viaggi a cui partecipi') : 'nessun viaggio ancora');
  /* La faccia in alto a destra: se c'è una foto si vede quella. È il punto in
     cui si capisce a colpo d'occhio in quale account si è entrati — e con due
     account sullo stesso telefono è l'unica differenza visibile. */
  const uFoto = urlFotoProfilo();
  if(uFoto){
    $('avatar').innerHTML = '<img src="' + esc(uFoto) + '" alt="">';
    $('avatar').classList.add('foto');
  } else {
    $('avatar').textContent = iniz(DB.profilo.nome, DB.profilo.cognome);
    $('avatar').classList.remove('foto');
  }
  $('avatar').classList.toggle('org', org && !uFoto);

  $('roleMenu').innerHTML =
    '<div class="menu-lbl">Come stai usando TOYO</div>' +
    roleItem('organizzatore',ico('bussola',19),'Organizzatore','Crei e gestisci i viaggi') +
    roleItem('viaggiatore',ico('valigia',19),'Viaggiatore','Segui i viaggi a cui partecipi') +
    '<div class="menu-sep"></div>' +
    '<button class="mi" data-act="nav" data-view="hub"><span class="si">' + ico('valigia',18) + '</span>I tuoi viaggi</button>' +
    (org ? '<button class="mi" data-act="new-trip"><span class="si">＋</span>Nuovo viaggio</button>'
         : '<button class="mi" data-act="apri-invito"><span class="si">' + ico('bustaGiu',18) + '</span>Ho un link di invito</button>');

  const sotto = utente ? (eNick(utente.email) ? '@' + nickDi(utente) : utente.email) : DB.profilo.email;
  $('userMenu').innerHTML =
    '<div class="menu-lbl">' + esc(DB.profilo.nome + ' ' + (DB.profilo.cognome||'')) + '</div>' +
    (sotto ? '<div style="padding:0 10px 8px;font-size:11.5px;color:var(--ink-3);word-break:break-all">' + esc(sotto) + '</div>' : '') +
    '<div class="menu-sep"></div>' +
    '<button class="mi" data-act="nav" data-view="profilo"><span class="si">' + ico('persona',18) + '</span>Il mio profilo</button>' +
    '<button class="mi" data-act="nav" data-view="bacheca"><span class="si">' + ico('bacheca',18) + '</span>La bacheca</button>' +
    '<button class="mi" data-act="nav" data-view="docs"><span class="si">' + ico('tessera',18) + '</span>I miei documenti</button>' +
    '<button class="mi" data-act="nav" data-view="impostazioni"><span class="si">' + ico('ingranaggio',18) + '</span>Impostazioni e backup</button>' +
    '<div class="menu-sep"></div>' +
    (utente
      ? '<button class="mi" data-act="esci-account"><span class="si">' + ico('porta',18) + '</span>Esci dall\'account</button>'
      : '<button class="mi" data-act="esci-locale"><span class="si">' + ico('porta',18) + '</span>Esci dal profilo</button>');

  const fab = $('fab');
  if(fab) fab.setAttribute('aria-label', V.view === 'trip'
    ? ({itinerario:'Nuova tappa', prenotazioni:'Nuova prenotazione', persone:'Aggiungi persona',
        soldi:'Nuova spesa', documenti:'Nuovo documento', decisioni:'Nuova domanda'}[V.tab] || 'Nuova cosa da fare')
    : (V.view === 'docs' ? 'Nuovo documento'
      : (V.view === 'bacheca' ? 'Scrivi un post' : 'Nuovo viaggio')));

  /* Cercare e guardare un posto sono figli della bacheca: la linguetta in
     fondo resta accesa su «Bacheca», altrimenti sembra di essere usciti da
     un'altra parte e non si sa piu' da dove si e' arrivati. */
  const acceso = V.view === 'trip' ? 'hub'
    : ((V.view === 'cerca' || V.view === 'luogo') ? 'bacheca' : V.view);
  document.querySelectorAll('#tabbar button').forEach(b =>
    b.classList.toggle('on', b.dataset.view === acceso));

  segnaSync();
  /* ⚠️ .tabs scorre in orizzontale e ha otto schede: ricostruendo la vista,
     la striscia tornava a sinistra e la scheda appena toccata finiva fuori
     dallo schermo. Su telefono sembrava che il tocco non avesse funzionato. */
  setTimeout(() => {
    const att = document.querySelector('.tabs button.on');
    if(att && att.scrollIntoView) att.scrollIntoView({block:'nearest', inline:'center'});
  }, 0);
  const s = $('stage');
  if(V.view === 'trip' && viaggio())      s.innerHTML = viewTrip(viaggio());
  else if(V.view === 'docs')              s.innerHTML = viewDocs();
  else if(V.view === 'bacheca')           s.innerHTML = viewBacheca();
  else if(V.view === 'cerca')             s.innerHTML = viewCerca();
  else if(V.view === 'luogo')             s.innerHTML = viewLuogo();
  else if(V.view === 'profilo')           s.innerHTML = viewProfilo();
  else if(V.view === 'impostazioni')      s.innerHTML = viewImpostazioni();
  else if(V.view === 'privacy')           s.innerHTML = viewPrivacy();
  else { V.view = 'hub'; s.innerHTML = viewHub(); }

  $('fab').style.display =
    (V.view === 'hub' || V.view === 'trip' || V.view === 'docs' ||
     ((V.view === 'bacheca' || V.view === 'luogo') && socialAttivo())) ? '' : 'none';
  if(V.view === 'trip' && V.tab === 'itinerario') disegnaMappa(viaggio());
  else distruggiMappa();
}
function roleItem(r, ic, nm, dt){
  return '<button class="mi ' + (DB.ruolo === r ? 'active' : '') + '" data-act="set-role" data-role="' + r + '">' +
    '<span class="fl">' + ic + '</span><span><span class="nm">' + nm + '</span><span class="dt">' + dt + '</span></span></button>';
}
function go(view, tripId, tab){
  V.view = view;
  if(tripId !== undefined) V.tripId = tripId;
  if(tab) V.tab = tab;
  closeMenus(); render(); window.scrollTo(0,0);
}
