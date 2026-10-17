/* ==========================================================================
   SONDAGGI · decidere insieme prima di partire
   La domanda vive dentro il viaggio (la scrive chi organizza); i voti stanno
   in una tabella a parte, perché anche chi partecipa deve poter scrivere e sul
   viaggio ha solo lettura.
   ========================================================================== */
let voti = {};        /* voti[viaggioId][sondaggioId] = [{utente, nick, opzione}] */
/* Se la lettura dei dati condivisi fallisce, i saldi restano quelli di prima:
   mostrarli come definitivi è peggio che non mostrarli. Con questo acceso la
   card lo dice. */
let condivisiVecchi = false;
let membri = {};      /* membri[viaggioId] = [{utente, nick, ruolo, stato}] */
let speseAltrui = {}; /* speseAltrui[viaggioId] = [spese registrate da chi partecipa] */

/* Chi è dentro il viaggio, dal server. Serve a due cose: mostrare i
   partecipanti veri accanto alle persone segnate a mano, e sapere fra chi si
   dividono le spese. */
async function scaricaMembri(){
  if(!sb || !utente) return;
  const ids = DB.viaggi.filter(t => t.condiviso || t.ospite || t.coorg).map(t => t.id);
  if(!ids.length){ membri = {}; return; }
  const {data, error} = await sb.from('toyo_membri')
    .select('viaggio, utente, nick, ruolo, stato, propr, da_nick').in('viaggio', ids);
  if(error){ condivisiVecchi = true; return; }
  const m = {};
  (data || []).forEach(r => { (m[r.viaggio] = m[r.viaggio] || []).push(r); });
  membri = m; condivisiVecchi = false;
  /* Se non è rimasto nessuno, il viaggio smette di essere condiviso: senza
     questo continuava a essere ripubblicato a ogni salvataggio, per sempre. */
  DB.viaggi.forEach(t => {
    if(t.mio && t.condiviso && !(m[t.id] || []).length) t.condiviso = false;
  });
}

/* Le spese registrate da chi partecipa: sul viaggio ha sola lettura, quindi
   le sue le scrive qui. Il conto finale somma queste e quelle del viaggio. */
async function scaricaSpeseAltrui(){
  if(!sb || !utente) return;
  const ids = DB.viaggi.filter(t => t.condiviso || t.ospite || t.coorg).map(t => t.id);
  if(!ids.length){ speseAltrui = {}; return; }
  const {data, error} = await sb.from('toyo_spese')
    .select('id, viaggio, utente, nick, voce, importo, cat, chi_paga, diviso_tra, pagato').in('viaggio', ids);
  if(error){ condivisiVecchi = true; return; }
  const m = {};
  (data || []).forEach(r => {
    if(!idOk(r.id)) return;
    (m[r.viaggio] = m[r.viaggio] || []).push({
      id:r.id, voce:r.voce, importo:r.importo, cat:r.cat || 'altro', pagato:!!r.pagato,
      chiPaga:r.chi_paga || 'org', divisoTra:r.diviso_tra || [],
      daUtente:r.utente, daNick:r.nick, condivisa:true
    });
  });
  speseAltrui = m; condivisiVecchi = false;
}
/* La lista completa: quelle scritte da chi organizza più quelle di chi parte. */
const tutteSpese = t => (t ? (t.spese || []).concat(speseAltrui[t.id] || []) : []);
const miaSpesa   = x => !!(x && x.condivisa && utente && x.daUtente === utente.id);

async function salvaSpesaCondivisa(t, dati, id){
  if(!sb || !utente) throw new Error('serve un account');
  const {error} = await sb.from('toyo_spese').upsert({
    id: id || uid(), viaggio: t.id, utente: utente.id, nick: nickDi(utente),
    voce: dati.voce, importo: num(dati.importo), cat: dati.cat || 'altro',
    chi_paga: dati.chiPaga || 'org', diviso_tra: dati.divisoTra || [], pagato: !!dati.pagato
  });
  if(error) throw error;
  await scaricaSpeseAltrui();
}
async function cancellaSpesaCondivisa(id){
  if(!sb || !utente) return;
  const {error} = await sb.from('toyo_spese').delete().eq('id', id);
  if(error) throw error;
  await scaricaSpeseAltrui();
}

async function scaricaVoti(){
  if(!sb || !utente) return;
  const ids = DB.viaggi.filter(t => t.sondaggi && t.sondaggi.length).map(t => t.id);
  if(!ids.length){ voti = {}; return; }
  const {data, error} = await sb.from('toyo_voti')
    .select('viaggio, sondaggio, utente, nick, opzione').in('viaggio', ids);
  if(error){ condivisiVecchi = true; return; }
  const m = {};
  (data || []).forEach(r => {
    m[r.viaggio] = m[r.viaggio] || {};
    (m[r.viaggio][r.sondaggio] = m[r.viaggio][r.sondaggio] || []).push(r);
  });
  voti = m;
}
const votiDi   = (t, s) => ((voti[t.id] || {})[s.id] || []);
const mioVoto  = (t, s) => { const v = votiDi(t, s).find(x => utente && x.utente === utente.id); return v && v.opzione; };
function conteggio(t, s){
  const n = {};
  (s.opzioni || []).forEach(o => n[o.id] = 0);
  votiDi(t, s).forEach(v => { if(n[v.opzione] !== undefined) n[v.opzione]++; });
  return n;
}
async function vota(t, sondaggioId, opzioneId){
  if(!sb || !utente){ toast('Per votare serve un account'); return; }
  const {error} = await sb.from('toyo_voti').upsert({
    viaggio: t.id, sondaggio: sondaggioId, utente: utente.id,
    nick: nickDi(utente), opzione: opzioneId
  });
  if(error) throw error;
  await scaricaVoti();
}

async function rispondiInvito(viaggioId, accetta){
  const {error} = await sb.from('toyo_membri')
    .update({stato: accetta ? 'accettato' : 'rifiutato'})
    .eq('viaggio', viaggioId).eq('utente', utente.id);
  if(error) throw error;
  if(accetta) DB.ruolo = 'viaggiatore';
  await scaricaCondivisi();
  save();
}

/* Scrive la copia locale senza far ripartire la sincronia: serve mentre si sta
   ancora decidendo di chi sono i dati. */
function salvaLocale(){
  try{ localStorage.setItem(KEY, JSON.stringify(DB)); }catch(e){}
}

/* Al login succedono due cose distinte: si allinea il documento personale
   (viaggi propri, profilo, documenti) e si vanno a prendere i viaggi condivisi
   da altri. La seconda non deve saltare se la prima esce presto. */
async function allineaDati(){
  await allineaBlob();
  if(!sb || !utente) return;
  try{
    /* ⚠️ L'ordine è tutto: prima si SCARICA, poi si pubblica.
       Al contrario, un co-organizzatore che apriva l'app rimandava su la
       propria copia ferma a ieri e cancellava per tutti il lavoro fatto
       dall'organizzatore nel frattempo. */
    await scaricaCondivisi();
    await pubblicaProfilo();
    await pubblicaCondivisi();
    /* Chi segui e chi hai bloccato: tre righe di dati, ma senza non si sa
       cosa disegnare sui pulsanti «Segui» né quanti seguaci scrivere nel
       profilo. I post veri si scaricano solo aprendo la bacheca. */
    try{ await scaricaGrafo(); }catch(e){}
    /* render() solo se l'app è già a schermo: al primo accesso ci pensa boot() */
    const app = $('app');
    if(DB.profilo && app && !app.classList.contains('hide')) render();
  }catch(e){
    toast('Non riesco a leggere i viaggi condivisi adesso');
  }
}

/* al login: se online è vuoto porto su i dati locali, altrimenti prendo i più recenti */
async function allineaBlob(){
  /* Il browser è uno solo, gli account possono essere tanti. Ogni copia locale
     porta il timbro di chi l'ha creata: se il timbro è di un altro utente quei
     dati non vanno né tenuti né caricati. Senza questo controllo il secondo che
     entra dallo stesso browser si ritrova i viaggi del primo — e al primo
     salvataggio glieli riscrive dentro il proprio account. */
  if(utente && DB.propr && DB.propr !== utente.id){
    DB = {v:1, profilo:null, ruolo:'organizzatore', docs:[], viaggi:[], gmapsKey:''};
    V = {view:'hub', tripId:null, tab:'panoramica', bTab:'seguiti', cTab:'luoghi'};
    salvaLocale();
  }
  try{
    const remoto = await scaricaDati();
    const localePieno = DB.profilo || (DB.viaggi && DB.viaggi.length);
    if(!remoto || !remoto.dati || !remoto.dati.profilo){
      if(localePieno){ await inviaDati(); }
      else { const mm = (utente.user_metadata) || {};
        DB.profilo = DB.profilo || {nome:mm.nome || nickDi(utente) || 'Tu', cognome:mm.cognome || '', nick:nickDi(utente),
        email: eNick(utente.email) ? '' : (utente.email || ''), tel:'', nascita:'', nazione:'', cf:''}; await inviaDati(); }
      return;
    }
    const dRem = remoto.aggiornato || '';
    const dLoc = DB.aggiornato || '';
    if(localePieno && dLoc && dRem && dLoc > dRem){ await inviaDati(); return; }

    /* ⚠️ Il caso che faceva sparire mesi di lavoro: dati locali pieni ma senza
       timbro dell'ora (usati finora senza account, o appena importati da un
       backup). Prima la condizione qui sopra saltava e si passava dritti a
       "DB = remoto.dati", cancellando tutto senza chiedere niente.
       Ora si mette al sicuro una copia e si fa scegliere. */
    if(localePieno && !dLoc){
      try{ localStorage.setItem(KEY + '.prima-del-login', JSON.stringify(DB)); }catch(e){}
      remotoInAttesa = remoto;
      syncStato = 'ok'; segnaSync();
      setTimeout(() => chiediQualiDati(remoto), 300);
      return;
    }

    DB = remoto.dati;
    migra();
    DB.propr = utente.id;
    if(!DB.profilo.email && utente.email && !eNick(utente.email)) DB.profilo.email = utente.email;
    save();
    syncStato = 'ok'; segnaSync();
  }catch(e){
    syncStato = 'errore'; segnaSync();
    toast('Account collegato, ma la sincronia non risponde');
  }
}
