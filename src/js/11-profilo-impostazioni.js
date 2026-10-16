/* ==========================================================================
   PROFILO E IMPOSTAZIONI
   ========================================================================== */
function viewProfilo(){
  const p = DB.profilo;
  const nk = p.nick || (utente ? nickDi(utente) : '');
  const righe = [
    ['Nome', (p.nome||'') + ' ' + (p.cognome||'')],
    ['Nome utente', nk ? '@' + nk : ''],
    ['Telefono', p.tel],
    ['Data di nascita', p.nascita ? fmtDate(p.nascita) : ''],
    ['Nazionalità', p.nazione],
    ['Codice fiscale', p.cf]
  ];
  return `
  <button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-act="nav" data-view="hub">← Tutti i viaggi</button>

  <div class="sec-head"><h2>Il tuo profilo</h2><span class="sub">Serve a compilare i viaggi e i documenti</span>
    <span class="rt"><button class="btn btn-ghost btn-sm" data-act="edit-profilo">Modifica</button></span></div>

  <div class="card">
    <div class="card-b" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <button data-act="foto-profilo" title="Cambia la foto" style="position:relative;flex:0 0 62px;border-radius:var(--r-btn)">
        ${avatar(p.nome, p.cognome, p.foto, 62)}
        <span style="position:absolute;right:-2px;bottom:-2px;width:24px;height:24px;border-radius:var(--r-chip);
          display:grid;place-items:center;background:var(--terracotta);color:#fff;border:2px solid var(--surface)">${ico('fotocamera',13,'#fff')}</span>
      </button>
      <div style="flex:1;min-width:180px">
        <div style="font-size:18px;font-weight:700;letter-spacing:-.02em">${esc((p.nome||'') + ' ' + (p.cognome||''))}</div>
        <div style="font-size:12.5px;color:var(--ink-3)">${nk ? '@' + esc(nk) : 'senza nome utente'}</div>
        ${p.bio ? '<div style="font-size:12.5px;color:var(--ink-2);margin-top:4px">' + esc(p.bio) + '</div>' : ''}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <span class="pill">${DB.viaggi.filter(t=>t.mio).length} organizzati</span>
        <span class="pill">${DB.viaggi.filter(t=>!t.mio).length} come viaggiatore</span>
        ${socialAttivo() ? '<span class="pill">' + contoSeguaci + (contoSeguaci === 1 ? ' ti segue' : ' ti seguono') + '</span>' : ''}
      </div>
    </div>
  </div>

  ${socialAttivo() ? `
  <div class="card">
    <div class="card-h"><div><h3>${ico('bacheca',15)}La tua bacheca</h3>
      <div class="sub">${p.riservato ? 'Il tuo profilo è nascosto: nessuno può trovarti né seguirti'
                                      : 'Chi ti segue vede quello che pubblichi'}</div></div>
      <div class="rt"><button class="btn btn-ghost btn-sm" data-act="nav" data-view="bacheca">Apri</button></div></div>
    <div class="card-b tight"><div class="rows">
      <div class="row" style="padding:11px 8px"><span class="tx"><span class="t">Persone che segui</span></span>
        <span class="rt"><span class="v num">${contoSeguiti}</span></span></div>
      <div class="row" style="padding:11px 8px"><span class="tx"><span class="t">Persone che ti seguono</span></span>
        <span class="rt"><span class="v num">${contoSeguaci}</span></span></div>
    </div></div>
  </div>` : ''}

  <div class="card">
    <div class="card-h"><div><h3>Dati personali</h3><div class="sub">Li usi quando compili prenotazioni e assicurazioni</div></div></div>
    <div class="card-b tight"><div class="rows">
      ${righe.map(([k,v]) => `<div class="row" style="padding:10px 8px">
        <span class="tx"><span class="t" style="font-weight:500;color:var(--ink-3);font-size:12.5px">${k}</span></span>
        <span class="rt"><span class="v" style="font-weight:650;font-size:13.5px">${v && v.trim() ? esc(v) : '<span style="color:var(--ink-3);font-weight:500">da compilare</span>'}</span></span>
      </div>`).join('')}
    </div></div>
  </div>

  <div class="card">
    <div class="card-h"><div><h3>I tuoi documenti</h3><div class="sub">${DB.docs.length ? DB.docs.length + ' salvati' : 'Nessuno ancora'}</div></div>
      <div class="rt"><button class="btn btn-ghost btn-sm" data-act="nav" data-view="docs">Apri</button></div></div>
    ${DB.docs.length ? '<div class="card-b tight">' + DB.docs.slice(0,4).map(d => rigaDoc(d, 'me')).join('') + '</div>'
      : vuoto('tessera','Ancora nessun documento','Carta d\'identità, patente, tessera sanitaria: caricali una volta e li hai per sempre.')}
  </div>

  <div class="card">
    <div class="card-h"><div><h3>Impostazioni e backup</h3><div class="sub">Esporta i dati, importali su un altro dispositivo</div></div>
      <div class="rt"><button class="btn btn-ghost btn-sm" data-act="nav" data-view="impostazioni">Apri</button></div></div>
  </div>`;
}

/* Su Android e Chrome il browser ci passa l'invito all'installazione e basta
   un pulsante. Su iPhone quell'evento non esiste: Apple vuole che si passi dal
   tasto Condividi, quindi lì si spiega a parole invece di fingere un pulsante
   che non funzionerebbe. */
function cardInstalla(){
  if(inApp()) return '';
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const offline = 'serviceWorker' in navigator && location.protocol.indexOf('http') === 0;
  return `
  <div class="card">
    <div class="card-h"><div><h3>Tieni TOYO sul telefono</h3>
      <div class="sub">${offline ? 'Icona sulla Home, schermo intero, e funziona anche senza rete'
                                 : 'Da file aperto sul computer l\'installazione non è disponibile'}</div></div>
      <div class="rt">${offline ? '<span class="pill ok">offline pronto</span>' : '<span class="pill">solo online</span>'}</div></div>
    <div class="card-b">
      <div style="font-size:12.5px;color:var(--ink-2);line-height:1.6;margin-bottom:12px">
        Una volta installata, itinerario, prenotazioni, spese e documenti si aprono
        <b>anche in aereo o all'estero senza dati</b>. Quello che cambi mentre sei
        senza rete parte da solo appena torna la linea.
      </div>
      ${invitoInstalla
        ? '<button class="btn btn-primary btn-sm" data-act="installa">' + ico('telefono',16) + '<span>Installa TOYO</span></button>'
        : (iOS
          ? '<div style="font-size:12.5px;color:var(--ink-2);line-height:1.6">Su iPhone si fa da Safari: tocca <b>Condividi</b> ' +
            '(il quadrato con la freccia in su) e scegli <b>Aggiungi alla schermata Home</b>.</div>'
          : '<div style="font-size:12.5px;color:var(--ink-3);line-height:1.6">Se il pulsante non compare, cerca l\'icona di installazione ' +
            'nella barra degli indirizzi, oppure il menu ⋮ → <b>Installa</b>.</div>')}
    </div>
  </div>`;
}

/* Un'app che si fa caricare carte d'identità e passaporti — anche di altre
   persone — senza dire una parola su dove finiscono non è seria, prima ancora
   che a norma. Questa pagina dice le cose come stanno: niente promesse che il
   codice non mantiene. */
function viewPrivacy(){
  const conCloud = cloudAttivo();
  return `
  <button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-act="nav" data-view="impostazioni">← Impostazioni</button>

  <div class="sec-head"><h2>Dati e privacy</h2><span class="sub">Dove finisce quello che scrivi</span></div>

  <div class="card"><div class="card-h"><div><h3>Dove stanno i dati</h3></div></div>
    <div class="card-b" style="font-size:13px;line-height:1.7;color:var(--ink-2)">
      <b>Senza account:</b> tutto resta nel browser di questo dispositivo. Non esce di qui, e
      nessuno — noi compresi — può vederlo. Se cancelli i dati del browser, sparisce.<br><br>
      <b>Con l'account:</b> viaggi, spese e documenti stanno su un database <b>Supabase</b>
      ${conCloud ? 'del titolare di questa installazione' : ''}, con le regole di accesso che
      fanno vedere a ognuno solo i propri dati e i viaggi a cui è stato invitato.
      Gli allegati stanno in una cartella privata intestata al tuo account.
    </div>
  </div>

  <div class="card" style="border-left:3px solid var(--gold)"><div class="card-h"><div><h3>La bacheca è pubblica</h3>
    <div class="sub">È l'unica parte di TOYO che esce dal tuo spazio</div></div></div>
    <div class="card-b" style="font-size:13px;line-height:1.7;color:var(--ink-2)">
      Viaggi, spese e documenti restano tuoi. La <b>bacheca</b> no: quello che pubblichi lì
      lo vede <b>chiunque abbia un account</b>, non solo chi ti segue — «Esplora» mostra gli
      ultimi post di tutti, ed è così che ci si trova.<br><br>
      Le <b>foto dei post e quella del profilo</b> stanno in un archivio con indirizzo pubblico:
      chi ha il link di una foto la apre anche senza essere iscritto. È il prezzo di un feed che
      si carica in fretta, ed è il motivo per cui <b>non vanno messe lì le foto dei documenti</b>.
      Quelle stanno nell'archivio privato, che è un'altra cosa e non c'entra niente.<br><br>
      Se non vuoi comparire: <b>Profilo → Modifica → Nascondi il mio profilo</b>. Sparisci dalle
      ricerche e nessuno può seguirti. Puoi anche <b>bloccare</b> una persona: il blocco vale nei
      due sensi, e chi blocchi non ti vede più.
    </div>
  </div>

  <div class="card"><div class="card-h"><div><h3>Documenti d'identità</h3>
    <div class="sub">La parte più delicata</div></div></div>
    <div class="card-b" style="font-size:13px;line-height:1.7;color:var(--ink-2)">
      TOYO permette di caricare carte d'identità e passaporti, e permette a chi organizza di
      raccogliere <b>anche quelli degli altri partecipanti</b>. Se lo fai, quei documenti sono
      di altre persone: caricarli è una tua responsabilità, e dovresti averne il permesso.<br><br>
      Non vengono condivisi automaticamente con nessuno: restano nella cartella di chi li ha
      caricati. Quando un viaggio si conclude, cancellali.<br><br>
      L'archivio dei documenti è <b>privato e separato</b> da quello delle foto della bacheca:
      un documento si apre solo con un permesso firmato che scade dopo due minuti, e solo per chi
      l'ha caricato. Nessun documento finisce mai in un post.
    </div>
  </div>

  <div class="card"><div class="card-h"><div><h3>Cosa non facciamo</h3></div></div>
    <div class="card-b" style="font-size:13px;line-height:1.7;color:var(--ink-2)">
      Nessuna pubblicità, nessuna rivendita di dati, nessun tracciamento di terze parti.
      TOYO non chiede l'email: se entri con un nome utente, un indirizzo di posta non esiste
      proprio.<br><br>
      <b>Servizi esterni contattati:</b> Supabase (account e dati), jsDelivr (la libreria del
      programma), e — solo se cerchi un luogo o apri la mappa — Google Maps oppure
      OpenStreetMap. A loro arriva quello che scrivi nella casella di ricerca.
    </div>
  </div>

  <div class="card"><div class="card-h"><div><h3>Cancellare tutto</h3></div></div>
    <div class="card-b" style="font-size:13px;line-height:1.7;color:var(--ink-2)">
      Da <b>Impostazioni → Account → Elimina l'account</b>: spariscono account, viaggi,
      documenti e allegati, da qui e dal server. È immediato e non si torna indietro.
      Prima conviene scaricare il backup.
      <div style="margin-top:13px;display:flex;gap:9px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" data-act="export">${ico('bustaGiu',16)}<span>Scarica backup</span></button>
        <button class="btn btn-ghost btn-sm" data-act="nav" data-view="impostazioni">Vai alle impostazioni</button>
      </div>
    </div>
  </div>

  <div style="font-size:11.5px;color:var(--ink-3);line-height:1.6;padding:0 2px">
    Questa pagina descrive come funziona TOYO, non è un'informativa legale redatta da un
    avvocato. Se apri l'app al pubblico, fattene scrivere una: il titolare del trattamento sei tu,
    non chi ha scritto il programma.
  </div>`;
}

function viewImpostazioni(){
  let peso = 0;
  try{ peso = new Blob([JSON.stringify(DB)]).size; }catch(e){}
  const nDoc = DB.docs.length + DB.viaggi.reduce((n,t) => n + t.docs.length, 0);
  return `
  <button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-act="nav" data-view="hub">← Tutti i viaggi</button>

  <div class="sec-head"><h2>Impostazioni</h2><span class="sub">I dati stanno su questo dispositivo, in questo browser</span>
    <span class="rt"><span class="pill">TOYO ${VERSIONE}</span></span></div>

  ${cardInstalla()}

  <div class="card"><div class="card-b" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
    <span>${ico('lucchetto',19)}</span>
    <div style="flex:1;min-width:180px"><div style="font-weight:650;font-size:13.5px">Dati e privacy</div>
      <div style="font-size:12px;color:var(--ink-3)">Dove stanno i tuoi dati e come si cancellano</div></div>
    <button class="btn btn-ghost btn-sm" data-act="nav" data-view="privacy">Leggi</button>
  </div></div>

  <div class="card">
    <div class="card-h"><div><h3>Spazio usato</h3><div class="sub">${nDoc} ${nDoc===1?'allegato':'allegati'} · ${DB.viaggi.length} ${DB.viaggi.length===1?'viaggio':'viaggi'}</div></div>
      <div class="rt"><b class="num">${kb(peso)}</b></div></div>
    <div class="card-b">
      <span class="bar" style="display:block"><i class="${peso > 3.5e6 ? '' : 'sage'}" style="width:${Math.min(100, Math.round(peso/4.5e6*100))}%"></i></span>
      <div style="font-size:11.5px;color:var(--ink-3);margin-top:7px">
        Il browser concede circa 5 MB. ${peso > 3.5e6 ? '<b style="color:var(--terracotta)">Sei vicino al limite: fai un backup e alleggerisci gli allegati.</b>' : 'Se ti avvicini al limite, elimina gli allegati più pesanti.'}
      </div>
      ${storeOk ? '' : '<div style="margin-top:10px"><span class="pill red">Questo browser non salva i dati: usa il backup prima di chiudere</span></div>'}
      ${utente && peso > 2.5e6 ? '<div style="margin-top:10px"><span class="pill warn">Con gli allegati la sincronia diventa pesante: valuta di tenerli sul dispositivo</span></div>' : ''}
    </div>
  </div>

  <div class="card">
    <div class="card-h"><div><h3>Account</h3>
      <div class="sub">${utente ? 'Sei entrato: i dati ti seguono su ogni dispositivo'
        : (cloudAttivo() ? 'Account configurato, ma non sei entrato' : 'Ora i dati stanno solo su questo dispositivo')}</div></div>
      <div class="rt">${utente ? '<span class="pill ok">collegato</span>'
        : (cloudAttivo() ? '<span class="pill warn">non collegato</span>' : '<span class="pill">locale</span>')}</div></div>
    <div class="card-b">
      ${utente ? `
        <div class="rows">
          <div class="row" style="padding:9px 2px"><span class="tx"><span class="t" style="font-weight:500;color:var(--ink-3);font-size:12.5px">${
            eNick(utente.email) ? 'Nome utente' : 'Email'}</span></span>
            <span class="rt"><span class="v" style="font-size:13px">${esc(eNick(utente.email) ? '@' + nickDi(utente) : (utente.email || ''))}</span></span></div>
          ${eNick(utente.email) ? `<div class="row" style="padding:9px 2px"><span class="tx"><span class="t" style="font-weight:500;color:var(--ink-3);font-size:12.5px">Email</span>
            <span class="m">non l'hai lasciata: la password non è recuperabile</span></span></div>` : ''}
          <div class="row" style="padding:9px 2px"><span class="tx"><span class="t" style="font-weight:500;color:var(--ink-3);font-size:12.5px">Sincronia</span></span>
            <span class="rt"><span class="pill ${syncStato === 'ok' ? 'ok' : (syncStato === 'errore' ? 'warn' : '')}">${
              syncStato === 'ok' ? 'tutto salvato' : (syncStato === 'errore' ? 'non risponde' : 'in corso')}</span></span></div>
        </div>
        <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:12px">
          <button class="btn btn-ghost btn-sm" data-act="esci-account">Esci dall'account</button>
          <button class="btn btn-ghost btn-sm" data-act="cambia-pw">${ico('chiave',16)}<span>Cambia password</span></button>
          ${cloudCfg && cloudCfg.dalFile ? '' : '<button class="btn btn-ghost btn-sm" data-act="togli-cloud">Stacca questo dispositivo</button>'}
          <button class="btn btn-ghost btn-sm" data-act="diagnosi">${ico('lente',16)}<span>Verifica collegamento</span></button>
          <button class="btn btn-danger btn-sm" data-act="elimina-account">Elimina l'account</button>
        </div>
        ${cloudCfg && cloudCfg.dalFile ? '<div style="font-size:11.5px;color:var(--ink-3);margin-top:11px">Il progetto è scritto dentro il file dell\'app: chiunque la apra trova gli account già attivi.</div>' : ''}`
      : cloudAttivo() ? `
        <div style="font-size:12.5px;color:var(--ink-2);margin-bottom:12px">Il progetto è configurato${
          cloudCfg && cloudCfg.dalFile ? ' dentro il file dell\'app' : ''}. Entra o registrati per far seguire i dati su ogni dispositivo.</div>
        <div style="display:flex;gap:9px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" data-act="crea-account">Entra o registrati</button>
          <button class="btn btn-ghost btn-sm" data-act="diagnosi">${ico('lente',16)}<span>Verifica collegamento</span></button>
          ${cloudCfg && cloudCfg.dalFile ? '' : '<button class="btn btn-ghost btn-sm" data-act="togli-cloud">Stacca</button>'}
          <button class="btn btn-ghost btn-sm" data-act="esci-locale">Esci dal profilo</button>
        </div>`
      : `
        <div style="font-size:12.5px;color:var(--ink-2);line-height:1.55;margin-bottom:13px">
          Per far registrare le persone serve un progetto <b>Supabase</b> (gratuito). Incolla qui l'indirizzo del progetto e la chiave pubblica <i>anon</i>:
          da quel momento TOYO mostra registrazione e accesso, e i dati di ognuno viaggiano con lui.
        </div>
        <div class="field"><label>Indirizzo del progetto</label>
          <input class="inp" id="cfgUrl" placeholder="https://abcdefgh.supabase.co" value="${esc(cloudCfg && cloudCfg.url || '')}"></div>
        <div class="field"><label>Chiave pubblica (anon)</label>
          <input class="inp" id="cfgKey" placeholder="eyJhbGciOi…" value="${esc(cloudCfg && cloudCfg.key || '')}"></div>
        <div style="display:flex;gap:9px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" data-act="salva-cloud">Attiva gli account</button>
          <button class="btn btn-ghost btn-sm" data-act="diagnosi">${ico('lente',16)}<span>Verifica collegamento</span></button>
          <button class="btn btn-ghost btn-sm" data-act="copia-sql">' + ico('copia',15) + 'Copia l'SQL da incollare</button>
          <a class="btn btn-ghost btn-sm" href="https://supabase.com/dashboard" target="_blank" rel="noopener">Apri Supabase</a>
          <button class="btn btn-ghost btn-sm" data-act="esci-locale">Esci dal profilo</button>
        </div>
        <div style="font-size:11.5px;color:var(--ink-3);margin-top:11px">
          La chiave <i>anon</i> è pensata per stare nel browser: protegge la Row Level Security, non la segretezza.
          La chiave <i>service_role</i> non va mai messa qui.
        </div>`}
    </div>
  </div>

  <div class="card">
    <div class="card-h"><div><h3>Archivio file</h3>
      <div class="sub">${storageAttivo() ? 'I nuovi allegati vanno nel tuo archivio privato online' : 'Gli allegati stanno dentro questo dispositivo'}</div></div>
      <div class="rt">${storageAttivo() ? '<span class="pill ok">online</span>' : '<span class="pill">locale</span>'}</div></div>
    <div class="card-b">
      ${(() => {
        const tutti = [];
        DB.docs.forEach(d => tutti.push(d));
        DB.viaggi.forEach(t => { (t.docs||[]).forEach(d => tutti.push(d)); (t.mieiDocs||[]).forEach(d => tutti.push(d));
          (t.gente||[]).forEach(p => (p.docs||[]).forEach(d => tutti.push(d))); });
        const locali = tutti.filter(d => d.file && d.file.data && !d.file.percorso);
        const online = tutti.filter(d => d.file && d.file.percorso);
        const pesoLocale = locali.reduce((n,d) => n + (d.file.size || 0), 0);
        return `
        <div class="rows" style="margin-bottom:12px">
          <div class="row" style="padding:8px 2px"><span class="tx"><span class="t" style="font-weight:500;color:var(--ink-3);font-size:12.5px">Nel dispositivo</span></span>
            <span class="rt"><span class="v num">${locali.length}</span><span class="k">${kb(pesoLocale)}</span></span></div>
          <div class="row" style="padding:8px 2px"><span class="tx"><span class="t" style="font-weight:500;color:var(--ink-3);font-size:12.5px">Nell'archivio online</span></span>
            <span class="rt"><span class="v num">${online.length}</span></span></div>
        </div>
        ${storageAttivo() ? (locali.length ? `
          <div style="font-size:12.5px;color:var(--ink-2);line-height:1.5;margin-bottom:11px">
            Hai ${locali.length} ${locali.length === 1 ? 'allegato' : 'allegati'} ancora dentro il dispositivo (${kb(pesoLocale)}).
            Spostandoli online il salvataggio si alleggerisce e li ritrovi da ogni dispositivo.</div>
          <button class="btn btn-primary btn-sm" data-act="sposta-file"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V5M6 11l6-6 6 6"/></svg> Sposta gli allegati online</button>`
          : '<div style="font-size:12.5px;color:var(--ink-3)">Tutti gli allegati sono già nell\'archivio online, in una cartella che può aprire solo il tuo account.</div>')
        : `<div style="font-size:12.5px;color:var(--ink-2);line-height:1.55">
            Senza account gli allegati restano qui e pesano sui ~5 MB del browser: per questo il limite è 3 MB a file.
            Con l'account attivo i file vanno in un archivio privato (limite 10 MB a file) e si aprono con un link che scade dopo due minuti.</div>`}`;
      })()}
    </div>
  </div>

  <div class="card">
    <div class="card-h"><div><h3>Mappa</h3><div class="sub">${DB.gmapsKey ? 'Chiave Google attiva: mappa unica con tutti i punti' : 'Mappa Google incorporata, senza chiave'}</div></div>
      <div class="rt">${DB.gmapsKey ? '<span class="pill ok">chiave attiva</span>' : '<span class="pill">standard</span>'}</div></div>
    <div class="card-b">
      <div style="font-size:12.5px;color:var(--ink-2);line-height:1.55;margin-bottom:12px">
        Così com'è, TOYO mostra la mappa di Google incorporata sul punto che scegli: funziona subito, senza registrarti a niente.
        Se hai una <b>chiave API di Google Maps</b>, incollala qui e la mappa diventa una sola con tutti i punti insieme,
        colorati per tipo e cliccabili.
      </div>
      <div class="field" style="margin-bottom:9px"><label>Chiave API Google Maps <span class="opt">(facoltativa)</span></label>
        <input class="inp" id="gmKey" placeholder="AIza…" value="${esc(DB.gmapsKey || '')}"></div>
      <div style="display:flex;gap:9px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" data-act="salva-key">Salva la chiave</button>
        ${DB.gmapsKey ? '<button class="btn btn-ghost btn-sm" data-act="togli-key">Togli la chiave</button>' : ''}
        <a class="btn btn-ghost btn-sm" href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noopener">Come si ottiene</a>
      </div>
      <div style="font-size:11.5px;color:var(--ink-3);margin-top:10px">La chiave resta su questo dispositivo, dentro il tuo salvataggio. In ogni caso "Indicazioni" apre Google Maps e funziona sempre.</div>
    </div>
  </div>

  <div class="card">
    <div class="card-h"><div><h3>Backup</h3><div class="sub">Un file con tutto dentro, allegati compresi</div></div></div>
    <div class="card-b" style="display:flex;gap:9px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" data-act="export"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M6 13l6 6 6-6"/></svg> Esporta backup</button>
      <button class="btn btn-ghost btn-sm" data-act="import"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V5M6 11l6-6 6 6"/></svg> Importa backup</button>
    </div>
  </div>

  <div class="card">
    <div class="card-h"><div><h3>Ricomincia da capo</h3><div class="sub">Cancella viaggi, documenti e profilo da questo dispositivo</div></div></div>
    <div class="card-b"><button class="btn btn-danger btn-sm" data-act="reset">Cancella tutti i dati</button></div>
  </div>

  <div class="card">
    <div class="card-h"><div><h3>Come funziona TOYO</h3></div></div>
    <div class="card-b" style="font-size:13px;color:var(--ink-2);line-height:1.6">
      Nessun account e nessun server: tutto quello che scrivi resta in questo browser, su questo dispositivo.
      Passa da <b>Organizzatore</b> a <b>Viaggiatore</b> dalla barra in alto quando vuoi, senza registrarti a niente:
      cambia solo quali viaggi vedi.
      <div style="margin-top:10px"><span class="pill info">Per portarli su un altro dispositivo, usa Esporta e poi Importa</span></div>
    </div>
  </div>`;
}







/* ---------- schermata account (quando il cloud è configurato) ---------- */
let authTab = 'entra';
/* Il cursore va dove si scrive: sul nome utente se è vuoto, sulla password se
   il nome è già ricordato. Un dettaglio da niente che toglie un tocco a ogni
   accesso. */
function focusAuth(){
  setTimeout(() => {
    const chi = $('auChi'), pw = $('auPw'), nome = $('auNome');
    if(nome) return nome.focus();
    if(chi && !chi.value) return chi.focus();
    if(pw) pw.focus();
  }, 80);
}

function viewAuth(){
  return `
  <aside class="onb-art">
    <div class="brand"><div class="brand-mark">◈</div><div class="brand-name">TO<span>YO</span></div></div>
    <div class="onb-mid">
      <div class="kick">Travel on your own</div>
      <h1>Il tuo viaggio.<br>Come dici tu.</h1>
      <p>Crea un account: i tuoi viaggi, i documenti e le spese ti seguono su telefono e computer.</p>
      <div class="onb-pts">
        <div class="pt"><div class="ic">${ico('mappa',20)}</div><div><b>Itinerario</b><span>Tutto su una mappa, con le indicazioni.</span></div></div>
        <div class="pt"><div class="ic">${ico('fatture',20)}</div><div><b>Spese</b><span>Bilancio e report che si aggiornano da soli.</span></div></div>
        <div class="pt"><div class="ic">${ico('tessera',20)}</div><div><b>Documenti</b><span>Carta d&#39;identità, patente, biglietti.</span></div></div>
      </div>
    </div>
    <div class="tiny" style="color:rgba(255,255,255,.8)">Niente pubblicità, niente rivendita di dati. I documenti restano tuoi.</div>
  </aside>

  <main class="onb-main">
    <div class="onb-box">
      <div class="brand" style="margin-bottom:20px"><div class="brand-mark">◈</div>
        <div class="brand-name" style="display:block">TO<span>YO</span></div></div>

      ${(!sb && cloudAttivo()) ? `
      <div class="card" style="border-left:3px solid var(--terracotta);margin-bottom:18px">
        <div class="card-b" style="font-size:12.5px;line-height:1.5">
          <b>Non riesco a raggiungere il server.</b>
          ${location.protocol === 'file:'
            ? ' Stai aprendo TOYO come file sul computer: da qui il browser blocca il collegamento. Va aperta da un indirizzo <b>http</b> o <b>https</b>.'
            : ' Controlla indirizzo e chiave del progetto.'}
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" data-act="config-cloud"><svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3L5.5 5.5"/></svg> Correggi indirizzo o chiave</button>
            <button class="btn btn-ghost btn-sm" data-act="diagnosi">${ico('lente',16)}<span>Verifica collegamento</span></button>
          </div>
        </div>
      </div>` : ''}

      <div class="seg" style="display:grid;grid-template-columns:1fr 1fr;gap:4px;background:var(--surface-2);
        border:1px solid var(--line);border-radius:var(--r-btn);padding:4px;margin-bottom:20px">
        <button class="${authTab === 'entra' ? 'on' : ''}" data-act="auth-tab" data-v="entra">Accedi</button>
        <button class="${authTab === 'registra' ? 'on' : ''}" data-act="auth-tab" data-v="registra">Registrati</button>
      </div>

      ${authTab === 'registra' ? `
        <h2>Crea il tuo account</h2>
        <p class="lead">Nome, cognome e il nome utente con cui entri. Niente email.</p>

        <div class="two">
          <div class="field"><label>Nome</label><input class="inp" id="auNome" placeholder="Marco" autocomplete="given-name"></div>
          <div class="field"><label>Cognome</label><input class="inp" id="auCognome" placeholder="Rossi" autocomplete="family-name"></div>
        </div>
        <div class="field"><label>Nome utente <span class="opt">(è come ti trovano gli altri)</span></label>
          <div class="at"><span>@</span><input class="inp" id="auNick" placeholder="marco.rossi" autocomplete="username" spellcheck="false" autocapitalize="off"></div>
          <div class="tiny" style="margin-top:6px">Da 3 a 20 caratteri: lettere, numeri, punto e trattino basso. Niente spazi.</div></div>
        <div class="field"><label>Password <span class="opt">(almeno 8 caratteri)</span></label>
          <div class="pw-wrap">
            <input class="inp" type="password" id="auPw" placeholder="••••••••" autocomplete="new-password" enterkeyhint="go">
            <button type="button" class="pw-occhio" data-act="mostra-pw" data-v="auPw" aria-label="Mostra la password"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.8"/></svg></button>
          </div>
          <div class="forza" id="pwForza"><i></i><span></span></div>
          <div class="tiny hide" id="capsAvviso">Il BLOC MAIUSC è acceso.</div></div>
        <div class="err hide" id="auErr"></div>
        <button class="btn btn-primary btn-full" data-act="fai-registra">Crea account</button>
        <p class="tiny" style="margin-top:10px">Nessuna email, nessuna conferma da aprire: entri subito.
          In cambio la password non si può rimandare a nessuno &mdash; <b>segnatela</b>.</p>
      ` : `
        <h2>Bentornato</h2>
        <p class="lead">Entra e ritrovi i tuoi viaggi come li hai lasciati.</p>
        <div class="field"><label>Nome utente</label>
          <div class="at"><span>@</span><input class="inp" id="auChi" placeholder="marco.rossi" autocomplete="username"
            spellcheck="false" autocapitalize="off" autocorrect="off" inputmode="text" enterkeyhint="next"
            value="${esc(ultimoNick())}"></div></div>
        <div class="field"><label>Password</label>
          <div class="pw-wrap">
            <input class="inp" type="password" id="auPw" placeholder="••••••••" autocomplete="current-password" enterkeyhint="go">
            <button type="button" class="pw-occhio" data-act="mostra-pw" data-v="auPw" aria-label="Mostra la password"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.8"/></svg></button>
          </div>
          <div class="tiny hide" id="capsAvviso">Il BLOC MAIUSC è acceso.</div></div>
        <div style="display:flex;margin:-4px 0 14px"><button style="margin-left:auto;font-size:12.5px;font-weight:650;color:var(--terracotta)" data-act="fai-recupera">Password dimenticata?</button></div>
        <div class="err hide" id="auErr"></div>
        <button class="btn btn-primary btn-full" data-act="fai-entra">Entra</button>
      `}

      <div style="margin-top:22px;padding-top:16px;border-top:1px solid var(--line)">
        <button class="btn btn-ghost btn-full btn-sm" data-act="modo-locale">Provo senza account, solo su questo dispositivo</button>
        <p class="tiny" style="margin-top:9px">Potrai creare l'account dopo: i viaggi già fatti vengono portati su.</p>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;justify-content:center">
          <button style="font-size:11.5px;font-weight:650;color:var(--ink-3)" data-act="config-cloud"><svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3L5.5 5.5"/></svg> Cambia progetto o chiave</button>
          <button style="font-size:11.5px;font-weight:650;color:var(--ink-3)" data-act="diagnosi">${ico('lente',16)}<span>Verifica collegamento</span></button>
        </div>
        <p class="tiny" style="margin-top:12px;text-align:center;opacity:.7">TOYO ${VERSIONE}</p>
      </div>
    </div>
  </main>`;
}
function formCloud(){
  const c = cloudCfg || {};
  modal(mHead('Progetto Supabase', 'Indirizzo e chiave pubblica del tuo progetto') +
    '<div class="modal-b">' +
      '<div class="field"><label>Indirizzo del progetto</label>' +
        '<input class="inp" id="cfgUrl" placeholder="https://abcdefgh.supabase.co" value="' + esc(c.url || '') + '"></div>' +
      '<div class="field"><label>Chiave pubblica (publishable / anon)</label>' +
        '<textarea class="inp" id="cfgKey" style="min-height:84px;font-size:12.5px;word-break:break-all" ' +
        'placeholder="sb_publishable_… oppure eyJhbGciOi…">' + esc(c.key || '') + '</textarea></div>' +
      '<div style="font-size:11.5px;color:var(--ink-3);line-height:1.5">' +
        'Su Supabase: <b>Settings → API Keys</b>, usa il pulsante di copia (non selezionare col mouse: la chiave mostrata è troncata). ' +
        'Non usare la chiave <i>secret</i>.</div>' +
    '</div>' +
    '<div class="modal-f">' +
      '<button class="btn btn-ghost btn-sm" data-act="diagnosi">' + ico('lente',16) + '<span>Verifica</span></button>' +
      '<span class="sp"></span>' +
      (cloudAttivo() ? '<button class="btn btn-ghost btn-sm" data-act="togli-cloud">Togli</button>' : '') +
      '<button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
      '<button class="btn btn-primary" data-act="salva-cloud">Salva</button></div>');
}

/* Ricordare il nome utente è il dettaglio che fa sembrare l'app tua: la
   password no, quella la tiene il gestore del browser se l'utente vuole. */
const NICK_KEY = 'toyo.ultimo-nick';
function ultimoNick(){
  try{ return localStorage.getItem(NICK_KEY) || ''; }catch(e){ return ''; }
}
function ricordaNick(n){
  try{ n ? localStorage.setItem(NICK_KEY, n) : localStorage.removeItem(NICK_KEY); }catch(e){}
}

/* Quanto regge una password, spiegato in parole invece che con un punteggio.
   Non blocca niente: informa mentre si scrive. */
function forzaPassword(pw){
  const p = String(pw || '');
  if(!p) return null;
  let punti = 0;
  if(p.length >= 8) punti++;
  if(p.length >= 12) punti++;
  if(p.length >= 16) punti++;
  if(/[a-z]/.test(p) && /[A-Z]/.test(p)) punti++;
  if(/[0-9]/.test(p)) punti++;
  if(/[^A-Za-z0-9]/.test(p)) punti++;
  if(/^(.)\1+$/.test(p) || /^(012|123|234|345|456|567|678|789|abc|qwe|password|toyo)/i.test(p)) punti = Math.min(punti, 1);
  if(p.length < 8) return {l:'troppo corta', c:'var(--red)', w:15};
  if(punti <= 2)   return {l:'debole',       c:'var(--red)', w:33};
  if(punti <= 4)   return {l:'discreta',     c:'var(--gold)', w:66};
  return {l:'robusta', c:'var(--sage)', w:100};
}
function aggiornaForza(){
  const box = $('pwForza'); if(!box) return;
  const f = forzaPassword(val('auPw'));
  const barra = box.querySelector('i'), testo = box.querySelector('span');
  barra.style.setProperty('--w', (f ? f.w : 0) + '%');
  barra.style.setProperty('--c', f ? f.c : 'var(--line)');
  testo.textContent = f ? f.l : '';
  testo.style.color = f ? f.c : 'var(--ink-3)';
}
/* Il BLOC MAIUSC acceso è la causa numero uno di "password sbagliata" su una
   casella che mostra solo pallini. */
function controllaMaiuscole(e){
  const av = $('capsAvviso'); if(!av || !e.getModifierState) return;
  av.classList.toggle('hide', !e.getModifierState('CapsLock'));
}

function erroreAuth(msg){
  const e = $('auErr');
  if(!e) return;
  e.textContent = msg; e.classList.remove('hide');
}
/* se il server dice che la chiave non va, apri direttamente la correzione */
function chiaveRotta(e){
  if(/Invalid API key|JWT|apikey/i.test(String((e && e.message) || e))) setTimeout(formCloud, 900);
}
/* I messaggi contano quanto il codice: chi non entra deve capire se è colpa
   sua, della rete o del server, e cosa fare. Qui non si parla mai di email,
   perché su TOYO l'email non esiste. */
const testoErrore = (e, modo) => {
  const m = String(e && e.message || e);

  if(!navigator.onLine) return 'Sei senza connessione: TOYO non riesce a raggiungere il server.';
  if(/Failed to fetch|NetworkError|fetch failed|AuthRetryableFetch|scaduto/i.test(m))
    return 'Il server non risponde. Può essere la tua connessione, oppure il progetto Supabase in pausa: sul piano gratuito si addormenta dopo una settimana senza visite e ci mette un minuto a risvegliarsi. Riprova fra poco.';

  if(/Invalid login/i.test(m))
    return 'Nome utente o password non corretti. Attenzione al BLOC MAIUSC.';
  if(/already registered|already exists|duplicate key/i.test(m))
    return 'Questo nome utente è già preso: provane un altro.';
  if(/Email address.*invalid|is invalid/i.test(m))
    return 'Il server rifiuta questo nome utente. Su Supabase, in Authentication, controlla che non ci sia una restrizione sui domini consentiti.';
  if(/Email not confirmed/i.test(m))
    return 'Il server aspetta una conferma che qui non può arrivare: su Supabase spegni Authentication → Sign In / Providers → Email → Confirm email.';
  if(/at least 6|Password should|weak/i.test(m)) return 'La password è troppo corta: almeno 8 caratteri.';
  if(/rate|too many/i.test(m)) return 'Troppi tentativi ravvicinati: aspetta un minuto e riprova.';
  if(/Invalid API key|JWT|apikey/i.test(m))
    return 'Chiave non valida. Di solito è copiata a metà: ricopiala da Supabase → Settings → API Keys col pulsante di copia, e controlla che sia quella pubblica (publishable / anon).';
  if(/User not found/i.test(m)) return 'Nessun account con questo nome utente.';
  return 'Qualcosa non ha funzionato. Riprova fra poco. (' + m + ')';
};
