/* ==========================================================================
   ARCHIVIO FILE
   Con l'account attivo i file vanno in un bucket privato: nel salvataggio
   resta solo il percorso, e si aprono con un link firmato che scade.
   Senza account restano dentro il dispositivo, come prima.
   ========================================================================== */
const BUCKET = 'documenti';
const storageAttivo = () => !!(sb && utente);
const LIMITE_FILE = () => storageAttivo() ? 10 * 1024 * 1024 : 3 * 1024 * 1024;

function dataUrlToBlob(d){
  const virgola = d.indexOf(',');
  const testa = d.slice(0, virgola), b64 = d.slice(virgola + 1);
  const mime = (testa.match(/:(.*?);/) || [])[1] || 'application/octet-stream';
  const bin = atob(b64), arr = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], {type:mime});
}
async function caricaFile(blob, nomeFile, docId){
  const est = (String(nomeFile).match(/\.[a-z0-9]+$/i) || [''])[0];
  const percorso = utente.id + '/' + docId + est;
  const {error} = await sb.storage.from(BUCKET).upload(percorso, blob, {upsert:true, contentType:blob.type || 'application/octet-stream'});
  if(error) throw error;
  return percorso;
}
async function urlFirmato(percorso, secondi){
  const {data, error} = await sb.storage.from(BUCKET).createSignedUrl(percorso, secondi || 120);
  if(error) throw error;
  return data.signedUrl;
}
async function eliminaFile(percorso){
  if(!storageAttivo() || !percorso) return;
  try{ await sb.storage.from(BUCKET).remove([percorso]); }catch(e){}
}
/* dammi un indirizzo apribile, sia che il file stia online sia che stia qui */
async function indirizzoFile(f){
  if(!f) return null;
  if(f.data) return f.data;
  if(f.percorso && storageAttivo()) return await urlFirmato(f.percorso, 120);
  return null;
}

/* sposta online gli allegati già caricati sul dispositivo */
async function spostaAllegati(){
  if(!storageAttivo()){ toast('Prima entra nel tuo account'); return; }
  const tutti = [];
  DB.docs.forEach(d => tutti.push(d));
  DB.viaggi.forEach(t => {
    (t.docs || []).forEach(d => tutti.push(d));
    (t.mieiDocs || []).forEach(d => tutti.push(d));
    (t.gente || []).forEach(p => (p.docs || []).forEach(d => tutti.push(d)));
  });
  const daFare = tutti.filter(d => d.file && d.file.data && !d.file.percorso);
  if(!daFare.length){ toast('Non c\'è niente da spostare'); return; }
  let fatti = 0, falliti = 0;
  for(const d of daFare){
    try{
      const blob = dataUrlToBlob(d.file.data);
      const percorso = await caricaFile(blob, d.file.n, d.id);
      d.file = {n:d.file.n, mime:d.file.mime, size:d.file.size, percorso};
      fatti++;
      toast('Sposto gli allegati… ' + fatti + ' di ' + daFare.length);
    }catch(e){ falliti++; }
  }
  save(); render();
  toast(falliti ? fatti + ' spostati, ' + falliti + ' non riusciti' : 'Fatto: ' + fatti + ' allegati ora sono online');
}

/* ---- nome utente ---------------------------------------------------------
   Supabase vuole per forza un indirizzo email come identificativo. Per far
   entrare la gente con un nome utente (senza lasciare la mail) l'indirizzo lo
   costruiamo noi: "marco" diventa "marco@utenti.toyo.app". Non esiste come
   casella di posta, serve solo come nome in archivio — ed è per questo che gli
   account con nome utente funzionano solo con "Confirm email" spento.
   Effetto collaterale utile: il nome utente è unico in automatico, perché
   Supabase non accetta due volte lo stesso indirizzo.                        */
const DOM_NICK = 'utenti.toyo.app';
const normNick = n => String(n || '').trim().toLowerCase().replace(/^@+/, '');
const nickOk = n => /^[a-z0-9._]{3,20}$/.test(n) && !/^[._]/.test(n) && !/[._]$/.test(n) && !/[._]{2}/.test(n);
const indirizzoDi = n => normNick(n) + '@' + DOM_NICK;
const eNick = e => String(e || '').toLowerCase().endsWith('@' + DOM_NICK);
/* Si entra SOLO col nome utente. Accettare anche un'email significherebbe che
   da qualche parte l'abbiamo chiesta — e qui non la chiediamo mai a nessuno.
   La chiocciola iniziale, se la scrivi, viene tolta da normNick. */
const identita = v => indirizzoDi(v);
/* Come si chiama chi è entrato: nome utente se ce l'ha, altrimenti l'email. */
function nickDi(u){
  const m = (u && u.user_metadata) || {};
  if(m.nick) return m.nick;
  const e = (u && u.email) || '';
  return eNick(e) ? e.split('@')[0] : e;
}

/* ---- azioni di autenticazione ---- */
async function registrati(d){
  const nick = normNick(d.nick);
  const {data, error} = await sb.auth.signUp({
    email: indirizzoDi(nick), password: d.pw,
    options: {data:{nome:d.nome, cognome:d.cognome || '', nick}}
  });
  if(error) throw error;

  /* Quando la conferma via email è accesa, Supabase non dice apertamente che
     l'account esiste già (serve a non far scoprire chi è iscritto): lo si
     capisce dalla lista "identities" vuota. */
  if(data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
    return 'nick-preso';

  if(!data.session) return 'conferma-nick';

  utente = data.user;
  DB.profilo = DB.profilo || {nome:'', cognome:'', email:'', tel:'', nascita:'', nazione:'', cf:''};
  DB.profilo.nome    = d.nome    || DB.profilo.nome;
  DB.profilo.cognome = d.cognome || DB.profilo.cognome;
  DB.profilo.nick    = nick;
  await allineaDati();
  return 'dentro';
}
async function entra(chi, pw){
  const {data, error} = await sb.auth.signInWithPassword({email:identita(chi), password:pw});
  if(error) throw error;
  utente = data.user;
  await allineaDati();
}
async function eliminaAccount(){
  if(!sb || !utente){ toast('Non sei entrato in nessun account'); return; }
  clearTimeout(syncT);
  /* I file nello Storage non spariscono cancellando le righe: vanno rimossi
     prima, altrimenti restano documenti d'identità in un archivio di cui non
     esiste più il proprietario. */
  try{
    const percorsi = [];
    const raccogli = d => { if(d && d.file && d.file.percorso) percorsi.push(d.file.percorso); };
    (DB.docs || []).forEach(raccogli);
    (DB.viaggi || []).forEach(t => {
      (t.docs || []).forEach(raccogli); (t.mieiDocs || []).forEach(raccogli);
      (t.gente || []).forEach(g => (g.docs || []).forEach(raccogli));
    });
    if(percorsi.length) await sb.storage.from(BUCKET).remove(percorsi);
  }catch(e){}
  try{
    const {error} = await sb.rpc('elimina_mio_account');
    if(error) throw error;
    try{ localStorage.removeItem(KEY); }catch(e){}
    DB = {v:1, profilo:null, ruolo:'organizzatore', docs:[], viaggi:[], gmapsKey:''};
    await sb.auth.signOut();
    utente = null; syncStato = 'off'; scordaLaPiazza();
    closeModal(); V = {view:'hub', tripId:null, tab:'panoramica', bTab:'seguiti', cTab:'luoghi'};
    boot();
    toast('Account e dati eliminati');
  }catch(e){
    toast('Non riesco a eliminare: lancia prima la funzione SQL su Supabase');
  }
}

async function esci(pulisci){
  /* ⚠️ Il salvataggio è ritardato di 1,5 s. Uscendo subito dopo una modifica,
     il timer non scattava mai e con "Esci e pulisci" quella modifica spariva
     per sempre — mentre la finestra prometteva che i viaggi restavano al
     sicuro sul server. */
  uscitaVoluta = true;
  await svuotaCoda();
  if(pulisci && syncStato === 'errore'){
    toast('Non riesco a salvare online: non pulisco, perderesti le ultime modifiche');
    pulisci = false;
  }
  if(sb) try{ await sb.auth.signOut(); }catch(e){}
  utente = null; syncStato = 'off'; authTab = 'entra';
  /* ⚠️ La bacheca vive in memoria, non nel salvataggio. Senza questa riga il
     secondo che entra da questo browser vedeva ancora i post, i seguiti e la
     rubrica del primo, finché non ricaricava la pagina. */
  scordaLaPiazza();
  if(pulisci){
    try{ localStorage.removeItem(KEY); }catch(e){}
    DB = {v:1, profilo:null, ruolo:'organizzatore', docs:[], viaggi:[], gmapsKey:''};
    V = {view:'hub', tripId:null, tab:'panoramica', bTab:'seguiti', cTab:'luoghi'};
  }
  boot();
  toast(pulisci ? 'Uscito: su questo dispositivo non è rimasto niente' : 'Sei uscito dall\'account');
}
/* Due versioni degli stessi dati e nessun modo di sapere quale è più recente:
   la sola cosa onesta è farlo decidere a chi li ha scritti, dicendo quanto c'è
   da una parte e dall'altra. */
let remotoInAttesa = null;
function chiediQualiDati(remoto){
  const qui  = (DB.viaggi || []).length;
  const la   = ((remoto.dati && remoto.dati.viaggi) || []).length;
  const quando = remoto.aggiornato ? new Date(remoto.aggiornato).toLocaleDateString('it-IT') : '';
  modal(mHead('Due versioni dei tuoi dati', 'Su questo dispositivo e sul tuo account') +
    '<div class="modal-b"><div style="font-size:13px;line-height:1.65;color:var(--ink-2)">' +
      'Su questo dispositivo ci sono <b>' + qui + (qui === 1 ? ' viaggio' : ' viaggi') + '</b> creati senza account.<br>' +
      'Nel tuo account ce ne sono <b>' + la + (la === 1 ? ' viaggio' : ' viaggi') + '</b>' + (quando ? ', aggiornati il ' + quando : '') + '.<br><br>' +
      'Non posso sapere quali vuoi tenere, e sovrascriverli in silenzio sarebbe il modo peggiore di scoprirlo. Scegli tu.<br><br>' +
      '<span style="font-size:12px;color:var(--ink-3)">In ogni caso ho già messo da parte una copia di quelli locali: se sbagli, si recupera.</span>' +
    '</div></div>' +
    '<div class="modal-f">' +
      '<button class="btn btn-ghost btn-sm" data-act="tieni-locali">Tieni questi ' + qui + '</button>' +
      '<span class="sp"></span>' +
      '<button class="btn btn-primary" data-act="tieni-remoti">Usa quelli dell\'account</button></div>', true);
}

/* Senza email non esiste un link da rimandare: meglio dirlo chiaro invece di
   far cercare una funzione che non c'è. */
function spiegaPassword(){
  modal(mHead('Password dimenticata', 'Come funziona qui') +
    '<div class="modal-b"><div style="font-size:13px;line-height:1.65;color:var(--ink-2)">' +
      'TOYO non chiede l\'email a nessuno: è il motivo per cui ti bastano un nome utente e una password. ' +
      'Il rovescio della medaglia è che <b>non c\'è nessun indirizzo a cui mandarti un link</b> per rifarla.<br><br>' +
      'Cosa puoi fare:' +
      '<ul style="margin:10px 0 0;padding-left:18px">' +
        '<li style="margin-bottom:7px">Se sei ancora dentro su un altro dispositivo, vai in <b>Impostazioni \u2192 Backup</b> ' +
        'e scarica il file: i viaggi non li perdi comunque.</li>' +
        '<li style="margin-bottom:7px">Scrivi a chi gestisce TOYO: dal pannello si può rimettere una password.</li>' +
        '<li>Oppure crea un nuovo account e reimporta il backup.</li>' +
      '</ul></div></div>' +
    '<div class="modal-f"><span class="sp"></span><button class="btn btn-primary" data-act="close-modal">Ho capito</button></div>');
}

/* Uscire lasciando i dati sul dispositivo va bene a casa, non su un computer
   condiviso: qui si sceglie. */
function chiediEsci(){
  const n = utente ? (nickDi(utente) || '') : '';
  modal(mHead('Uscire dall\'account', n ? 'Sei entrato come ' + n : '') +
    '<div class="modal-b"><div style="font-size:13px;line-height:1.6;color:var(--ink-2)">' +
      'I viaggi restano al sicuro sul server: li ritrovi al prossimo accesso.<br><br>' +
      'Vuoi lasciarne una copia anche su questo dispositivo (più veloce da riaprire) ' +
      'oppure pulire tutto, come si fa su un computer condiviso?' +
    '</div></div>' +
    '<div class="modal-f"><button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
      '<span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="do-esci" data-v="pulisci">Esci e pulisci</button>' +
      '<button class="btn btn-primary" data-act="do-esci" data-v="tieni">Esci</button></div>');
}

/* Senza account il profilo esiste solo in questo browser: uscire vuol dire
   cancellarlo. Il backup va quindi offerto prima, dentro la stessa finestra,
   non lasciato a una voce di menu che nessuno cerca in quel momento. */
function chiediEsciLocale(){
  const p = DB.profilo || {};
  const nome = (p.nome ? (p.nome + ' ' + (p.cognome || '')).trim() : '');
  const n = (DB.viaggi || []).length;
  modal(mHead('Uscire dal profilo', nome ? 'Profilo di ' + nome : '') +
    '<div class="modal-b"><div style="font-size:13px;line-height:1.65;color:var(--ink-2)">' +
      'Non stai usando nessun account: <b>i dati stanno solo su questo dispositivo</b>. ' +
      'Uscire vuol dire cancellare il profilo' +
      (n ? ' e ' + n + (n === 1 ? ' viaggio' : ' viaggi') : '') +
      ' da qui, e ripartire dalla schermata iniziale.<br><br>' +
      'Se vuoi ritrovarli, <b>scarica prima il backup</b>: è un file che puoi reimportare quando vuoi, ' +
      'anche su un altro dispositivo o dentro un account.' +
    '</div></div>' +
    '<div class="modal-f"><button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
      '<span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="export">' + ico('bustaGiu',16) + '<span>Scarica backup</span></button>' +
      '<button class="btn btn-danger btn-sm" data-act="do-esci-locale">Esci e cancella</button></div>');
}
async function esciLocale(){
  uscitaVoluta = true;
  await svuotaCoda();
  if(sb) try{ await sb.auth.signOut(); }catch(e){}
  try{ localStorage.removeItem(KEY); }catch(e){}
  DB = {v:1, profilo:null, ruolo:'organizzatore', docs:[], viaggi:[], gmapsKey:''};
  utente = null; syncStato = 'off'; authTab = 'entra';
  closeModal();
  V = {view:'hub', tripId:null, tab:'panoramica', bTab:'seguiti', cTab:'luoghi'};
  boot();
  toast('Uscito: su questo dispositivo non è rimasto niente');
}
