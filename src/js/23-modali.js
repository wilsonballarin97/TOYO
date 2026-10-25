/* ==========================================================================
   MODALI
   ========================================================================== */
/* Il focus entra nella finestra e alla chiusura torna dove stava: senza, chi
   naviga da tastiera resta indietro alla pagina e non trova più il punto in
   cui era. */
let tornaAlFocus = null;
function modal(html, wide){
  tornaAlFocus = document.activeElement;
  clearTimeout(svuotaModale);
  $('modal').className = 'modal' + (wide ? ' wide' : '');
  $('modal').innerHTML = html;
  $('ov').classList.add('on');
  setTimeout(() => {
    const m = $('modal');
    const primo = m.querySelector('input:not([type=hidden]), textarea, select') ||
                  m.querySelector('.modal-f .btn-primary') || m.querySelector('button');
    if(primo && !m.querySelector('input:focus, textarea:focus')) primo.focus();
  }, 50);
}
let svuotaModale;
function closeModal(){
  $('ov').classList.remove('on');
  /* Il contenuto si toglie DOPO la dissolvenza: svuotarlo subito faceva
     scomparire il pannello e lasciava solo il fondo che sbiadiva. */
  clearTimeout(svuotaModale);
  svuotaModale = setTimeout(() => {
    if(!$('ov').classList.contains('on')) $('modal').innerHTML = '';
  }, 200);
  if(tornaAlFocus && document.contains(tornaAlFocus)){ try{ tornaAlFocus.focus(); }catch(e){} }
  tornaAlFocus = null;
}
/* L'escape sta qui dentro: sperare che lo faccia ognuno dei venti chiamanti è
   il modo in cui prima o poi passa un nome utente con dentro del codice. */
function mHead(titolo, sub){
  return '<div class="modal-h"><div><h2 id="modal-tit">' + esc(titolo) + '</h2>' + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') +
    '</div><button class="x" data-act="close-modal" aria-label="Chiudi"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>';
}
function mFoot(act, label, extra){
  return '<div class="modal-f">' + (extra || '') + '<span class="sp"></span>' +
    '<button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
    '<button class="btn btn-primary" data-act="' + act + '">' + label + '</button></div>';
}

/* ---------- viaggio ---------- */
let tmpTema = 0, tmpEmoji = '🧳';
function formViaggio(t){
  const nuovo = !t;
  t = t || {emoji:'🧳', tema:0, nome:'', dove:'', dal:'', al:'', quota:'', posti:'', note:'', mio: DB.ruolo === 'organizzatore'};
  tmpTema = t.tema || 0; tmpEmoji = t.emoji || '🧳';
  modal(
    mHead(nuovo ? 'Nuovo viaggio' : 'Modifica viaggio', nuovo ? 'Bastano un nome e delle date. Il resto lo aggiungi dopo.' : '') +
    '<div class="modal-b">' +
      '<div class="field"><label>Nome del viaggio</label>' +
        '<input class="inp" id="vNome" placeholder="Es. Grecia con i ragazzi" value="' + esc(t.nome) + '"></div>' +
      '<div class="field"><label>Dove si va <span class="opt">(facoltativo)</span></label>' +
        '<input class="inp" id="vDove" placeholder="Atene, Naxos, Milos" value="' + esc(t.dove) + '"></div>' +
      '<div class="two">' +
        '<div class="field"><label>Partenza</label><input class="inp" type="date" id="vDal" min="' + minPartenza(t) + '" value="' + esc(t.dal) + '"></div>' +
        '<div class="field"><label>Ritorno</label><input class="inp" type="date" id="vAl" min="' + esc(t.dal || minPartenza(t)) + '" value="' + esc(t.al) + '"></div>' +
      '</div>' +
      '<div class="tiny" style="margin:-4px 0 12px">' + ico('calendario',14) + ' Si parte da oggi in avanti, e il ritorno non può venire prima della partenza.</div>' +
      '<div class="two">' +
        '<div class="field"><label>Quota a persona <span class="opt">(€, facoltativa)</span></label>' +
          '<input class="inp" id="vQuota" inputmode="decimal" placeholder="0" value="' + esc(t.quota) + '"></div>' +
        '<div class="field"><label>Posti <span class="opt">(facoltativo)</span></label>' +
          '<input class="inp" id="vPosti" inputmode="numeric" placeholder="quante persone" value="' + esc(t.posti) + '"></div>' +
      '</div>' +

      '<div class="field"><label>Icona</label><div class="emoji-grid" id="vEmoji">' +
        EMOJI.map(e => '<button data-act="pick-emoji" data-v="' + esc(e) + '" class="' + (e === tmpEmoji ? 'on' : '') + '">' + e + '</button>').join('') +
      '</div></div>' +
      '<div class="field"><label>Colore</label><div class="theme-row" id="vTema">' +
        TEMI.map((g,i) => '<button class="theme ' + (i === tmpTema ? 'on' : '') + '" data-act="pick-tema" data-v="' + esc(i) + '" style="background:' + g + '"></button>').join('') +
      '</div></div>' +
      '<div class="field" style="margin-bottom:0"><label>Note <span class="opt">(facoltativo)</span></label>' +
        '<textarea class="inp" id="vNote" placeholder="Ritrovo, regole del gruppo, cosa portare…">' + esc(t.note) + '</textarea></div>' +
      '<div class="err hide" id="vErr">Dai un nome al viaggio.</div>' +
    '</div>' +
    mFoot(nuovo ? 'save-trip' : 'update-trip', nuovo ? 'Crea il viaggio' : 'Salva',
      nuovo ? '' : ('<button class="btn btn-ghost btn-sm" data-act="' + (archiviato(t) ? 'ripristina' : 'archivia') + '" data-id="' + esc(t.id) + '">' +
        (archiviato(t) ? '↩ Riprendi' : '' + ico('archivio',15) + 'Archivia') + '</button>' +
        '<button class="btn btn-danger btn-sm" data-act="del-trip">Elimina</button>'))
  );
  setTimeout(()=>{ const n = $('vNome'); if(n) n.focus(); }, 60);
}
/* oggi in formato aaaa-mm-gg, nell'ora di chi usa l'app (toISOString sarebbe UTC:
   fra mezzanotte e le due "oggi" sarebbe ancora ieri) */
function oggiIso(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
/* Un viaggio nuovo non può partire nel passato. Uno già esistente con la
   partenza passata (è in corso, o è finito) si può comunque correggere senza
   che il modulo lo blocchi. */
function minPartenza(t){
  const oggi = oggiIso();
  return (t && t.id && t.dal && t.dal < oggi) ? t.dal : oggi;
}
function leggiViaggio(t){
  const nome = val('vNome');
  const errore = (testo, campo) => {
    $('vErr').textContent = testo; $('vErr').classList.remove('hide');
    /* sui campi data niente focus: aprirebbe da solo il calendario */
    if($(campo)){ $(campo).classList.add('bad'); if($(campo).type !== 'date') $(campo).focus(); }
    return null;
  };
  if(!nome) return errore('Dai un nome al viaggio.', 'vNome');
  const dal = val('vDal'), al = val('vAl'), min = minPartenza(t);
  if(dal && dal < min) return errore('La partenza non può essere nel passato: scegli da oggi in avanti.', 'vDal');
  if(!dal && al && al < oggiIso()) return errore('Il ritorno non può essere nel passato.', 'vAl');
  if(dal && al && al < dal) return errore('Il ritorno viene prima della partenza: controlla le date.', 'vAl');
  t.nome = nome; t.dove = val('vDove'); t.dal = dal; t.al = al;
  t.quota = val('vQuota'); t.posti = val('vPosti'); t.note = val('vNote');
  t.tema = tmpTema; t.emoji = tmpEmoji;
  if(typeof t.mio === 'undefined') t.mio = true;
  if(t.dal && t.al && t.al < t.dal){ const x = t.dal; t.dal = t.al; t.al = x; }
  return t;
}

/* ---------- tappa / persona / spesa / todo ---------- */
let tmpTipoT = 'tappa';
function formTappa(x){
  const nuovo = !x;
  x = x || {dove:'', dal:(V.nuovaData || ''), al:'', note:'', lat:null, lon:null, tipo:'tappa', gpid:''};
  V.nuovaData = '';
  tmpLat = x.lat || null; tmpLon = x.lon || null; tmpPid = x.gpid || ''; tmpTipoT = x.tipo || 'tappa';
  modal(mHead(nuovo ? 'Aggiungi un punto' : 'Modifica punto',
      'Hotel, aeroporto, ristorante, tappa: cercalo e finisce sulla mappa') +
    '<div class="modal-b">' +
      '<div class="field"><label>Dove</label>' +
        '<input class="inp" id="tDove" placeholder="Hotel Attalos Atene · Aeroporto di Naxos · Milos" value="' + esc(x.dove || x.nome || '') + '">' +
        '<div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap">' +
          '<button class="btn btn-primary btn-sm" type="button" data-act="cerca-luogo">' + ico('lente',15) + 'Cerca su Google</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" data-act="mia-posizione">' + ico('luogo',15) + 'La mia posizione</button>' +
        '</div>' +
        '<div id="geoBox"></div>' +
      '</div>' +
      '<div class="field"><label>Che cos\'è</label><div class="chips" id="tTipo">' +
        TIPI_TAPPA.map(v => '<button class="chip ' + (v.id === tmpTipoT ? 'on' : '') + '" type="button" data-act="pick-tipot" data-v="' + esc(v.id) + '">' +
          v.ic + ' ' + v.n + '</button>').join('') +
      '</div></div>' +
      '<div class="two"><div class="field"><label>Dal <span class="opt">(facoltativo)</span></label><input class="inp" type="date" id="tDal"' + attrDate() + ' value="' + esc(x.dal) + '"></div>' +
      '<div class="field"><label>Al <span class="opt">(facoltativo)</span></label><input class="inp" type="date" id="tAl"' + attrDate() + ' value="' + esc(x.al) + '"></div></div>' +
      /* L'ora serve a mettere in fila le tappe dentro la giornata: senza,
         "Giorno 2" resta un elenco a caso. */
      '<div class="field"><label>A che ora <span class="opt">(facoltativo)</span></label>' +
        '<input class="inp" type="time" id="tOra" value="' + esc(x.ora || '') + '" style="max-width:170px"></div>' +
      notaDate() +

      '<div class="field"><label>Quanto costa <span class="opt">(€, facoltativo · entra nel report delle spese)</span></label>' +
        '<input class="inp" id="tCosto" inputmode="decimal" placeholder="0" value="' + esc(x.costo || '') + '" style="max-width:170px"></div>' +
      '<div class="field" style="margin-bottom:0"><label>Note <span class="opt">(orari, codici, numero di stanza…)</span></label>' +
        '<input class="inp" id="tNote" placeholder="Check-in dalle 15, prenotazione QK7T2M" value="' + esc(x.note) + '"></div>' +
      '<div class="err hide" id="tErr">Scrivi almeno dove si trova.</div>' +
    '</div>' + mFoot(nuovo ? 'save-tappa' : 'update-tappa', 'Salva'));
  if(tmpLat != null) segnaLuogo(tmpLat, tmpLon, x.dove || x.nome, tmpPid);
  setTimeout(()=>$('tDove') && $('tDove').focus(), 60);
}

function formPersona(p){
  const nuovo = !p; p = p || {nome:'', email:'', stato:'invitato', versato:''};
  const t = viaggio();
  modal(mHead(nuovo ? 'Aggiungi persona' : 'Modifica persona') +
    '<div class="modal-b">' +
      '<div class="field"><label>Nome</label><input class="inp" id="pNome" placeholder="Nome e cognome" value="' + esc(p.nome) + '"></div>' +
      '<div class="field"><label>Come lo senti <span class="opt">(facoltativo)</span></label>' +
        '<input class="inp" id="pEmail" placeholder="telefono, @nomeutente, come preferisci" value="' + esc(p.email) + '"></div>' +
      '<div class="field"><label>Stato</label><div class="chips" id="pStato">' +
        [['confermato','Confermato'],['forse','In forse'],['invitato','Invitato']].map(([v,n]) =>
          '<button class="chip ' + (p.stato === v ? 'on' : '') + '" data-act="pick-stato" data-v="' + esc(v) + '">' + n + '</button>').join('') +
      '</div></div>' +
      '<div class="field" style="margin-bottom:0"><label>Quanto ha versato <span class="opt">(€)</span></label>' +
        '<input class="inp" id="pVersato" inputmode="decimal" placeholder="0" value="' + esc(p.versato) + '">' +
        (num(t.quota) ? '<div style="font-size:11.5px;color:var(--ink-3);margin-top:6px">Quota di questo viaggio: ' + eur(t.quota) + '</div>' : '') +
      '</div>' +
      '<div class="err hide" id="pErr">Serve almeno il nome.</div>' +
    '</div>' + mFoot(nuovo ? 'save-persona' : 'update-persona', 'Salva'));
  setTimeout(()=>$('pNome') && $('pNome').focus(), 60);
}
function formSpesa(x){
  const nuovo = !x; x = x || {voce:'', importo:'', fornitore:'', pagato:false};
  modal(mHead(nuovo ? 'Nuova spesa' : 'Modifica spesa') +
    '<div class="modal-b">' +
      '<div class="field"><label>Cosa</label><input class="inp" id="sVoce" placeholder="Es. Cena di gruppo" value="' + esc(x.voce) + '"></div>' +
      '<div class="field"><label>Categoria</label><div class="chips" id="sCat">' +
        CATEGORIE.map(c => '<button class="chip ' + ((x.cat||'altro') === c.id ? 'on' : '') + '" type="button" data-act="pick-cat" data-v="' + esc(c.id) + '">' +
          c.ic + ' ' + c.n + '</button>').join('') + '</div></div>' +
      '<div class="two"><div class="field"><label>Importo <span class="opt">(€)</span></label>' +
        '<input class="inp" id="sImporto" inputmode="decimal" placeholder="0" value="' + esc(x.importo) + '"></div>' +
      '<div class="field"><label>A chi <span class="opt">(facoltativo)</span></label>' +
        '<input class="inp" id="sFornitore" placeholder="Compagnia, hotel…" value="' + esc(x.fornitore) + '"></div></div>' +
      '<label class="check" style="margin-top:4px"><input type="checkbox" id="sPagato" ' + (x.pagato ? 'checked' : '') + '> Già pagata</label>' +

      /* Chi anticipa e fra chi si divide: da qui esce il "chi deve quanto a chi". */
      (() => {
        const t = viaggio(); if(!t) return '';
        const roster = rosterSpese(t);
        const paga = x.chiPaga || 'org';
        const fra = Array.isArray(x.divisoTra) && x.divisoTra.length ? x.divisoTra : roster.map(p => p.id);
        return '<div class="menu-sep" style="margin:15px 0"></div>' +
          '<div class="field"><label>Chi ha anticipato</label><div class="chips" id="sPaga">' +
            roster.map(p => '<button class="chip ' + (paga === p.id ? 'on' : '') + '" type="button" data-act="pick-paga" data-v="' +
              esc(p.id) + '">' + esc(p.nome) + '</button>').join('') + '</div></div>' +
          '<div class="field" style="margin-bottom:0"><label>Divisa fra</label><div class="chips" id="sFra">' +
            roster.map(p => '<button class="chip ' + (fra.indexOf(p.id) >= 0 ? 'on' : '') + '" type="button" data-act="pick-fra" data-v="' +
              esc(p.id) + '">' + esc(p.nome) + '</button>').join('') + '</div>' +
            '<div style="font-size:11.5px;color:var(--ink-3);margin-top:7px">Tocca per togliere chi non c\'entra. ' +
              'Aggiungi le persone dalla scheda <b>Persone</b> per vederle qui.</div></div>';
      })() +

      '<div class="err hide" id="sErr">Scrivi cosa hai speso.</div>' +
    '</div>' + mFoot(nuovo ? 'save-spesa' : 'update-spesa', 'Salva'));
  setTimeout(()=>$('sVoce') && $('sVoce').focus(), 60);
}
function formTodo(x){
  const nuovo = !x; x = x || {t:'', scad:'', per:'', fatto:false};
  modal(mHead(nuovo ? 'Nuova cosa da fare' : 'Modifica') +
    '<div class="modal-b">' +
      '<div class="field"><label>Cosa</label><input class="inp" id="dT" placeholder="Es. Prenotare il traghetto" value="' + esc(x.t) + '"></div>' +
      '<div class="two"><div class="field"><label>Entro il <span class="opt">(facoltativo)</span></label>' +
        '<input class="inp" type="date" id="dScad" value="' + esc(x.scad) + '"></div>' +
      '<div class="field"><label>Tocca a <span class="opt">(facoltativo)</span></label>' +
        '<input class="inp" id="dPer" placeholder="chi se ne occupa" value="' + esc(x.per) + '"></div></div>' +
      '<div class="err hide" id="dErr">Scrivi cosa c\'è da fare.</div>' +
    '</div>' + mFoot(nuovo ? 'save-todo' : 'update-todo', 'Salva'));
  setTimeout(()=>$('dT') && $('dT').focus(), 60);
}
function formQuota(){
  const t = viaggio();
  modal(mHead('Quanto hai versato', t.nome) +
    '<div class="modal-b">' +
      '<div class="field"><label>Quota totale <span class="opt">(€)</span></label>' +
        '<input class="inp" id="qQuota" inputmode="decimal" placeholder="0" value="' + esc(t.quota) + '"></div>' +
      '<div class="field" style="margin-bottom:0"><label>Hai già versato <span class="opt">(€)</span></label>' +
        '<input class="inp" id="qVersato" inputmode="decimal" placeholder="0" value="' + esc(t.mioVersato || '') + '"></div>' +
    '</div>' + mFoot('save-quota', 'Salva'));
}

/* ---------- documenti ---------- */
let tmpFile = null, tmpTipo = null, tmpFileRaw = null;
function formDoc(scope, d){
  const nuovo = !d;
  const tipi = scope === 'trip' ? TIPI_DOC_V : TIPI_DOC;
  d = d || {tipo: tipi[0].id, nome:'', numero:'', scad:'', file:null};
  tmpFile = d.file || null; tmpTipo = d.tipo; tmpFileRaw = null;
  modal(mHead(nuovo ? (scope === 'trip' ? 'Allega un documento di viaggio' : 'Aggiungi un documento') : 'Modifica documento',
      scope === 'trip' ? 'Biglietti, prenotazioni, voucher, polizze' : 'Resta su questo dispositivo, non lo vede nessun altro') +
    '<div class="modal-b">' +
      ((nuovo && scope !== 'me' && scope !== 'trip' && DB.docs.length) ?
        '<div class="field"><label>Prendi da <span class="opt">i tuoi documenti</span></label>' +
          DB.docs.map(x => '<button class="pickdoc" data-act="copia-doc" data-id="' + esc(x.id) + '">' +
            '<span class="fic">' + (x.file ? (/^image\//.test(x.file.mime) ? 'IMG' : 'PDF') : '—') + '</span>' +
            '<span><span class="t">' + esc(x.nome) + '</span><span class="m">' + esc(nomeTipo(x.tipo).n) +
              (x.file ? ' · ' + kb(x.file.size) : ' · senza file') + '</span></span>' +
            '<span style="margin-left:auto;font-size:12px;font-weight:650;color:var(--terracotta)">Copia →</span></button>').join('') +
          '<div style="font-size:11.5px;color:var(--ink-3);margin:2px 0 4px">Oppure compila qui sotto per caricarne uno nuovo.</div>' +
        '</div>' : '') +
      '<div class="field"><label>Tipo</label><div class="chips" id="docTipo">' +
        tipi.map(x => '<button class="chip ' + (x.id === d.tipo ? 'on' : '') + '" data-act="pick-tipo" data-v="' + esc(x.id) + '">' + x.ic + ' ' + x.n + '</button>').join('') +
      '</div></div>' +
      '<div class="field"><label>Nome</label><input class="inp" id="docNome" placeholder="' +
        (scope === 'trip' ? 'Es. Biglietti volo andata' : "Es. Carta d'identità di " + esc(DB.profilo.nome)) + '" value="' + esc(d.nome) + '"></div>' +
      '<div class="two">' +
        '<div class="field"><label>Numero <span class="opt">(facoltativo)</span></label><input class="inp" id="docNum" placeholder="numero o codice" value="' + esc(d.numero) + '"></div>' +
        '<div class="field"><label>' + (scope === 'trip' ? 'Data' : 'Scadenza') + ' <span class="opt">(facoltativo)</span></label><input class="inp" type="date" id="docScad" value="' + esc(d.scad) + '"></div>' +
      '</div>' +
      '<div class="field" style="margin-bottom:0"><label>File</label>' +
        '<button class="drop" id="dropZone" data-act="pick-file">' +
          '<span class="ic" id="dropIc">' + (tmpFile ? '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>' : '<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V5M6 11l6-6 6 6"/></svg>') + '</span>' +
          '<span><span class="t" id="dropT">' + (tmpFile ? esc(tmpFile.n) : 'Scegli un file') + '</span>' +
          '<span class="m" id="dropM">' + (tmpFile ? kb(tmpFile.size) + ' · tocca per sostituirlo' : 'Foto o PDF, fino a ' + kb(LIMITE_FILE())) + '</span></span>' +
        '</button>' +
        (tmpFile ? '<button class="btn btn-ghost btn-sm" style="margin-top:9px" data-act="clear-file">Togli il file</button>' : '') +
      '</div>' +
      '<div class="err hide" id="docErr">Dai un nome al documento.</div>' +
    '</div>' + mFoot(nuovo ? 'save-doc' : 'update-doc', 'Salva'));
  $('modal').dataset.scope = scope;
  setTimeout(()=>$('docNome') && $('docNome').focus(), 60);
}
async function salvaDocumento(a, bottone){
  const scope = $('modal').dataset.scope;
  const nuovo = a === 'save-doc';
  const d = leggiDoc(nuovo ? {id:uid()} : trovaDoc(V.editId, scope));
  if(!d) return;
  if(storageAttivo() && tmpFileRaw){
    if(bottone){ bottone.disabled = true; bottone.textContent = 'Carico il file…'; }
    try{
      const percorso = await caricaFile(tmpFileRaw, tmpFileRaw.name, d.id);
      d.file = {n:tmpFileRaw.name, mime:tmpFileRaw.type || 'application/octet-stream', size:tmpFileRaw.size, percorso};
    }catch(e){
      if(bottone){ bottone.disabled = false; bottone.textContent = 'Salva'; }
      toast('Non riesco a caricare il file: controlla il bucket "documenti" su Supabase');
      return;
    }
  }
  if(nuovo && scope === 'trip' && tmpPrenDoc) d.prenId = tmpPrenDoc;
  if(nuovo) contenitore(scope).push(d);
  if(nuovo) tmpPrenDoc = '';
  tmpFileRaw = null;
  save();
  if(scope === 'mie' || scope.indexOf('p:') === 0){ listaDoc(scope); } else { closeModal(); }
  render(); toast('Documento salvato');
}

function leggiDoc(d){
  const nome = val('docNome');
  if(!nome){ $('docErr').classList.remove('hide'); $('docNome').classList.add('bad'); return null; }
  d.nome = nome; d.numero = val('docNum'); d.scad = val('docScad');
  d.tipo = tmpTipo; d.file = tmpFile;
  return d;
}
function listaDoc(scope){
  const arr = contenitore(scope);
  const chiudi = (scope === 'mie' || scope.indexOf('p:') === 0);
  modal(mHead(nomeScope(scope),
      scope === 'trip' ? 'Biglietti, prenotazioni, voucher' : "Carta d'identità, passaporto, patente: servono per prenotare e per i controlli") +
    '<div class="modal-b">' +
      (arr.length ? '<div class="card"><div class="card-b tight">' + arr.map(d => rigaDoc(d, scope)).join('') + '</div></div>'
        : '<div class="card">' + vuoto('archivio','Nessun documento','Quando ne carichi uno lo trovi qui.') + '</div>') +
      '<button class="drop" style="margin-top:12px" data-act="add-doc-scope" data-scope="' + esc(scope) + '">' +
        '<span class="ic"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5l-8.2 8.2a4.6 4.6 0 0 1-6.5-6.5L14 4.5a3.1 3.1 0 0 1 4.3 4.3l-8.6 8.6a1.5 1.5 0 0 1-2.2-2.2l8-8"/></svg></span><span><span class="t">Aggiungi un documento</span>' +
        '<span class="m">' + (storageAttivo() ? 'Va nel tuo archivio online, privato' : 'Foto o PDF fino a 3 MB') +
          (DB.docs.length && chiudi ? ' · o copia uno dei tuoi' : '') + '</span></span></button>' +
    '</div>' +
    '<div class="modal-f"><span class="hint">Restano su questo dispositivo</span><span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="close-modal">Chiudi</button></div>', true);
  $('modal').dataset.scope = scope;
}

function apriFile(){
  const inp = $('filePick');
  inp.value = '';
  inp.accept = 'image/*,application/pdf';
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if(!f) return;
    if(f.size > LIMITE_FILE()){ toast('File troppo pesante: massimo ' + kb(LIMITE_FILE())); return; }
    const mostra = () => {
      if($('dropT')){
        $('dropIc').innerHTML = '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>';
        $('dropT').textContent = f.name;
        $('dropM').textContent = kb(f.size) + (storageAttivo() ? ' · va nel tuo archivio online' : ' · tocca per sostituirlo');
        $('dropZone').classList.add('over');
      }
      toast('File allegato');
    };
    tmpFileRaw = f;
    if(storageAttivo()){
      /* con l'account attivo non serve tenerlo in memoria: si carica al salvataggio */
      tmpFile = {n:f.name, mime:f.type || 'application/octet-stream', size:f.size};
      mostra();
      return;
    }
    const r = new FileReader();
    r.onload = () => { tmpFile = {n:f.name, mime:f.type || 'application/octet-stream', size:f.size, data:r.result}; mostra(); };
    r.onerror = () => toast('Non riesco a leggere il file');
    r.readAsDataURL(f);
  };
  inp.click();
}
/* dove vivono i documenti, in base al contesto:
   'me' = i tuoi · 'trip' = del viaggio · 'mie' = i tuoi per questo viaggio · 'p:<id>' = di un partecipante */
function contenitore(scope){
  const t = viaggio();
  if(scope === 'me') return DB.docs;
  if(!t) return [];
  if(scope === 'trip') return t.docs;
  if(scope === 'mie') return (t.mieiDocs = t.mieiDocs || []);
  if(scope && scope.indexOf('p:') === 0){
    const p = t.gente.find(x => x.id === scope.slice(2));
    if(p) return (p.docs = p.docs || []);
  }
  return [];
}
function trovaDoc(id, scope){ return contenitore(scope).find(d => d.id === id); }
function nomeScope(scope){
  const t = viaggio();
  if(scope === 'me') return 'I tuoi documenti';
  if(scope === 'trip') return 'Documenti del viaggio';
  if(scope === 'mie') return 'I tuoi documenti per ' + (t ? t.nome : 'il viaggio');
  if(scope && scope.indexOf('p:') === 0){
    const p = t && t.gente.find(x => x.id === scope.slice(2));
    return 'Documenti di ' + (p ? p.nome : 'un partecipante');
  }
  return 'Documenti';
}
async function viewDoc(id, scope){
  const d = trovaDoc(id, scope);
  if(!d || !d.file) return;
  const f = d.file;
  let url = null;
  try{ url = await indirizzoFile(f); }catch(e){}
  const corpo = !url
    ? '<div class="card-b empty">Non riesco a recuperare il file. Se sei senza rete, riprova quando torni online.</div>'
    : (/^image\//.test(f.mime)
      ? '<img class="viewer-img" src="' + url + '" alt="' + esc(d.nome) + '">'
      : (/pdf/.test(f.mime)
        ? '<iframe class="viewer-frame" src="' + url + '" title="' + esc(d.nome) + '"></iframe>'
        : '<div class="card-b empty">Anteprima non disponibile per questo tipo di file. Scaricalo per aprirlo.</div>'));
  modal(mHead(d.nome, f.n + ' · ' + kb(f.size) + (f.percorso ? ' · nel tuo archivio online' : ' · su questo dispositivo')) +
    '<div class="modal-b">' + corpo + '</div>' +
    '<div class="modal-f"><span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="close-modal">Chiudi</button>' +
      '<button class="btn btn-primary" data-act="dl-doc" data-id="' + esc(d.id) + '" data-scope="' + esc(scope) + '"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M6 13l6 6 6-6"/></svg> Scarica</button></div>', true);
}
function scarica(nome, dataUrl){
  const a = document.createElement('a');
  a.href = dataUrl; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- profilo ---------- */
function formProfilo(){
  const p = DB.profilo;
  modal(mHead('Il tuo profilo', 'Solo quello che ti serve, niente di obbligatorio') +
    '<div class="modal-b">' +
      /* La faccia sta in cima, dove ci si aspetta di trovarla: cercarla in
         fondo a otto campi è il motivo per cui in tante app la foto non ce
         l'ha nessuno. */
      '<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">' +
        avatar(p.nome, p.cognome, p.foto, 62) +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn btn-ghost btn-sm" type="button" data-act="foto-profilo">' + ico('fotocamera',15) +
            '<span>' + (p.foto ? 'Cambia foto' : 'Metti una foto') + '</span></button>' +
          (p.foto ? '<button class="btn btn-ghost btn-sm" type="button" data-act="togli-foto-profilo">Togli</button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="two"><div class="field"><label>Nome</label><input class="inp" id="prNome" value="' + esc(p.nome) + '"></div>' +
      '<div class="field"><label>Cognome</label><input class="inp" id="prCogn" value="' + esc(p.cognome||'') + '"></div></div>' +
      '<div class="field"><label>Nome utente' + (utente ? ' <span class="opt">(non si cambia: è con questo che entri)</span>' : '') + '</label>' +
        '<div class="at"><span>@</span><input class="inp" id="prNick" value="' + esc(p.nick || (utente ? nickDi(utente) : '')) + '"' +
        (utente ? ' disabled style="opacity:.65"' : ' placeholder="marco.rossi" spellcheck="false" autocapitalize="off"') + '></div></div>' +
      '<div class="field"><label>Due righe su di te <span class="opt">(facoltativo · le legge chi apre il tuo profilo)</span></label>' +
        '<input class="inp" id="prBio" maxlength="200" placeholder="Montagna d\'inverno, isole d\'estate" value="' + esc(p.bio||'') + '"></div>' +
      /* ⚠️ Qui c'erano DUE campi telefono, tutti e due etichettati «Telefono»
         e tutti e due col valore vecchio dentro: chi ne cambiava uno vedeva
         l'altro rimasto indietro e non capiva quale contasse. */
      '<div class="two"><div class="field"><label>Telefono <span class="opt">(facoltativo)</span></label>' +
        '<input class="inp" type="tel" id="prTel" inputmode="tel" autocomplete="tel" value="' + esc(p.tel||'') + '"></div>' +
      '<div class="field"><label>Data di nascita</label><input class="inp" type="date" id="prNasc" value="' + esc(p.nascita||'') + '"></div></div>' +
      '<div class="two"><div class="field"><label>Nazionalità</label><input class="inp" id="prNaz" placeholder="Italiana" value="' + esc(p.nazione||'') + '"></div>' +
      '<div class="field"><label>Codice fiscale <span class="opt">(facoltativo)</span></label>' +
        '<input class="inp" id="prCf" value="' + esc(p.cf||'') + '"></div></div>' +
      (utente ?
      '<div class="field" style="margin-bottom:0"><label>Chi ti può trovare</label>' +
        '<label style="display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border:1px solid var(--line);' +
          'border-radius:var(--r-btn);background:var(--surface-2);cursor:pointer">' +
          '<input type="checkbox" id="prRiservato" style="margin-top:3px"' + (p.riservato ? ' checked' : '') + '>' +
          '<span><b style="display:block;font-size:13px">Nascondi il mio profilo</b>' +
          '<span style="font-size:11.5px;color:var(--ink-3);line-height:1.5">Non compari nelle ricerche e nessuno può seguirti. ' +
          'Chi organizza un viaggio non riesce più a invitarti col nome utente: dovrà mandarti un link.</span></span>' +
        '</label></div>' : '') +
      '<div class="err hide" id="prErr">Serve almeno il nome.</div>' +
    '</div>' + mFoot('save-profilo', 'Salva'));
}

/* Conferma prima di sostituire tutto: la usano l'import da file e il
   trasloco dal vecchio indirizzo (31-trasloco.js). */
function chiediImport(d){
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
}
