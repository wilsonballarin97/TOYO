/* ==========================================================================
   VIAGGI CONDIVISI
   Chi organizza pubblica il viaggio in `toyo_viaggi`; chi partecipa lo legge
   da lì a ogni avvio. Non è una copia congelata come il vecchio link: se
   l'organizzatore sposta una tappa, al viaggiatore arriva.

   Cosa NON viene condiviso, per scelta: i documenti (stanno in una cartella
   privata che solo il proprietario può aprire), la quota versata da ciascuno
   e i documenti delle altre persone. Passa l'itinerario, non l'archivio.
   ========================================================================== */
let invitiAperti = [];      /* inviti ricevuti e non ancora risposti */

/* La rubrica serve solo a farsi trovare quando qualcuno ci invita. */
async function pubblicaProfilo(){
  if(!sb || !utente) return;
  const nick = nickDi(utente);
  if(!nick) return;
  try{
    await sb.from('toyo_profili').upsert({
      utente: utente.id, nick,
      nome:    (DB.profilo && DB.profilo.nome)    || '',
      cognome: (DB.profilo && DB.profilo.cognome) || '',
      /* Foto, presentazione e "voglio comparire": stanno in rubrica perché è
         quello che gli altri vedono. Il resto del profilo — telefono, data di
         nascita, codice fiscale — non esce da qui e non è mai uscito. */
      foto:    (DB.profilo && DB.profilo.foto)    || '',
      bio:     ((DB.profilo && DB.profilo.bio)    || '').slice(0, 200),
      pubblico: !(DB.profilo && DB.profilo.riservato)
    });
  }catch(e){ toast('Non riesco ad aggiornare la tua scheda in rubrica'); }
}

/* Copia ripulita: via tutto quello che è personale o che l'altro non potrebbe
   comunque aprire. */
function viaggioDaCondividere(t){
  const v = JSON.parse(JSON.stringify(t));
  delete v.mieiDocs; delete v.mioVersato; delete v.propr; delete v.ospite;
  v.docs = [];
  /* Il commento sopra prometteva che la quota versata da ciascuno non usciva:
     invece usciva, insieme all'email. Ora esce solo il nome e se è confermato. */
  v.gente = (v.gente || []).map(p => ({id:p.id, nome:p.nome, stato:p.stato, docs:[]}));
  return v;
}
async function pubblicaViaggio(t){
  if(!sb || !utente || !t) return;
  const {error} = await sb.from('toyo_viaggi').upsert({
    id: t.id, propr: utente.id,
    dati: viaggioDaCondividere(t),
    aggiornato: new Date().toISOString()
  });
  if(error) throw new Error('condiviso: ' + error.message);
  t.daPubblicare = false;
}
/* Solo i viaggi che hanno davvero qualcuno invitato: gli altri non hanno
   motivo di finire sul server condiviso.
   Il co-organizzatore non è il proprietario della riga, quindi aggiorna e non
   inserisce: un upsert verrebbe respinto dalla regola sull'inserimento. */
async function aggiornaViaggioCoorg(t){
  if(!sb || !utente || !t) return;
  /* .update() su una riga inesistente non è un errore per PostgREST: aggiorna
     zero righe e tace. Si chiede indietro la riga toccata per accorgersene. */
  const {data, error} = await sb.from('toyo_viaggi')
    .update({dati: viaggioDaCondividere(t), aggiornato: new Date().toISOString()})
    .eq('id', t.id).select('id');
  if(error) throw new Error('condiviso: ' + error.message);
  if(!data || !data.length) throw new Error('condiviso: il viaggio non esiste più sul server');
  t.daPubblicare = false;
}
/* Solo i viaggi davvero toccati. Prima si ripubblicava tutto a ogni singolo
   salvataggio: con sei viaggi condivisi erano sette richieste ogni volta, e
   soprattutto un co-organizzatore che modificava un altro viaggio rimandava su
   la propria copia vecchia, cancellando il lavoro dell'organizzatore. */
async function pubblicaCondivisi(){
  if(!sb || !utente) return;
  for(const t of DB.viaggi.filter(t => t.mio && t.condiviso && t.daPubblicare !== false))
    await pubblicaViaggio(t);
  for(const t of DB.viaggi.filter(t => t.coorg && t.daPubblicare !== false))
    await aggiornaViaggioCoorg(t);
}
/* Da chiamare a ogni modifica di un viaggio condiviso. */
function segnaDaPubblicare(t){ if(t && (t.condiviso || t.coorg)) t.daPubblicare = true; }

/* Innesta il viaggio ricevuto tenendo da parte quello che è solo di chi lo
   riceve: i suoi documenti, quanto ha versato, se l'ha archiviato. */
/* Un viaggio che arriva da un altro account è dato non fidato: i suoi id
   finiscono dentro attributi HTML, quindi le voci con un id storto si buttano
   invece di provare a ripararle. Meglio una tappa in meno che una pagina
   compromessa. */
function ripulisciViaggio(v){
  if(!v || !idOk(v.id)) return null;
  ['tappe','prenotazioni','gente','spese','todo','docs','sondaggi'].forEach(k => {
    v[k] = Array.isArray(v[k]) ? v[k].filter(x => x && idOk(x.id)) : [];
  });
  v.sondaggi.forEach(sd => {
    sd.opzioni = Array.isArray(sd.opzioni) ? sd.opzioni.filter(o => o && idOk(o.id)) : [];
  });
  v.gente.forEach(x => { x.docs = Array.isArray(x.docs) ? x.docs.filter(d => d && idOk(d.id)) : []; });
  return v;
}

function innestaCondiviso(v, m){
  const i = DB.viaggi.findIndex(t => t.id === v.id);
  const pre = i >= 0 ? DB.viaggi[i] : null;
  const t = Object.assign({}, v, {
    mio: false, ospite: true,
    coorg: !!(m && m.ruolo === 'organizzatore'),
    proprId: (m && m.propr) || (pre && pre.proprId) || '',
    organizzatore: (m && m.da_nick) || (pre && pre.organizzatore) || '',
    mieiDocs:   (pre && pre.mieiDocs)   || [],
    mioVersato: (pre && pre.mioVersato) || 0,
    archiviato: pre ? pre.archiviato : null
  });
  if(i >= 0) DB.viaggi[i] = t; else DB.viaggi.push(t);
}

async function scaricaCondivisi(){
  if(!sb || !utente) return;
  const {data:membri, error} = await sb.from('toyo_membri')
    .select('viaggio, stato, propr, titolo, da_nick, ruolo').eq('utente', utente.id);
  if(error) throw error;

  invitiAperti = (membri || []).filter(m => m.stato === 'invitato');
  const dentro = (membri || []).filter(m => m.stato === 'accettato');
  const ids = dentro.map(m => m.viaggio);

  /* Se l'organizzatore mi ha tolto dal viaggio, sparisce anche da qui. */
  DB.viaggi = DB.viaggi.filter(t => !t.ospite || ids.indexOf(t.id) >= 0);

  if(ids.length){
    const {data:viaggi, error:e2} = await sb.from('toyo_viaggi').select('id, dati').in('id', ids);
    if(e2) throw e2;
    (viaggi || []).forEach(r => {
      const m = dentro.find(x => x.viaggio === r.id);
      const pulito = ripulisciViaggio(r.dati);
      if(pulito) innestaCondiviso(pulito, m);
    });
  }
  /* Tre letture indipendenti: in fila erano tre round-trip sommati, e
     all'avvio si notavano. Partono insieme. */
  await Promise.all([scaricaMembri(), scaricaSpeseAltrui(), scaricaVoti()]);
  salvaLocale();
}

/* ---- invitare qualcuno per nome utente ---- */
async function cercaPersona(nick){
  const n = normNick(nick);
  if(!nickOk(n)) return {errore:'Il nome utente non ha un formato valido.'};
  if(n === normNick(nickDi(utente))) return {errore:'Quello sei tu.'};
  /* Si cerca una persona alla volta, con una funzione dedicata: la tabella dei
     profili non è più leggibile in blocco, altrimenti bastava una richiesta per
     portarsi via nome e cognome di tutti gli iscritti. */
  const {data, error} = await sb.rpc('toyo_trova', {p_nick:n});
  if(error) return {errore:'Non riesco a cercare adesso: riprova fra poco.'};
  const p = Array.isArray(data) ? data[0] : data;
  if(!p) return {errore:'Nessuno si chiama « @' + n +' » su TOYO.'};
  return {persona:p};
}
async function mandaInvito(t, persona, ruolo){
  /* Il viaggio deve esistere sul server prima dell'invito: la regola che
     controlla "è tuo?" guarda lì. */
  t.condiviso = true;
  if(t.mio) await pubblicaViaggio(t); else await aggiornaViaggioCoorg(t);
  const {error} = await sb.from('toyo_membri').upsert({
    viaggio: t.id, utente: persona.utente, propr: t.mio ? utente.id : t.proprId,
    nick: persona.nick || '',
    titolo: (t.emoji ? t.emoji + ' ' : '') + t.nome,
    da_nick: nickDi(utente), ruolo: ruolo === 'organizzatore' ? 'organizzatore' : 'viaggiatore',
    stato: 'invitato'
  });
  if(error) throw error;
  save();
}
