/* ==========================================================================
   CERCA · luoghi e persone
   Due domande diverse con una casella sola, perché è così che uno le fa:
   «Milos» e «anna.v» si scrivono nello stesso posto e i risultati si dividono
   dopo, non prima.

   I luoghi non sono una tabella: sono il campo «Dove» dei post, scritto a
   mano da chi pubblica. «Milos», «milos» e «Milos, Grecia» sono la stessa
   isola per chiunque tranne che per un database, quindi si raggruppano qui
   su una chiave normalizzata e si mostra la scrittura più usata. Una tabella
   di luoghi ufficiali sarebbe più pulita e resterebbe vuota: nessuno compila
   un menu a tendina per raccontare un viaggio.
   ========================================================================== */
/* La chiave di un posto è la sua PRIMA parte, quella prima della virgola.
   Chi scrive «Milos» e chi scrive «Milos, Grecia» è stato sulla stessa isola,
   ma per un database sono due parole diverse: senza questa riga la pagina dei
   luoghi si riempie dello stesso posto scritto in quattro modi, ed è inutile.
   ⚠️ Il prezzo è che «Roma, Italia» e «Roma, Texas» finiscono insieme. Capita
   di rado, e il nome che si legge resta quello che ha usato la maggioranza —
   molto meglio di sei «Milos» separati, che capita invece sempre. */
const chiaveLuogo = s => String(s || '').split(',')[0].trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   /* «Nizza» e «Nizzà» stessa cosa */
  .replace(/\s+/g, ' ');

/* Da un mucchio di post a un elenco di posti, ognuno con quanti post, quante
   persone e una foto da mostrare. */
function raggruppaLuoghi(post){
  const m = new Map();
  (post || []).forEach(p => {
    const k = chiaveLuogo(p.luogo);
    if(!k) return;
    let g = m.get(k);
    if(!g){ g = {chiave:k, scritture:{}, n:0, persone:new Set(), foto:[], ultimo:p.creato}; m.set(k, g); }
    g.n++;
    g.persone.add(p.autore);
    g.scritture[p.luogo] = (g.scritture[p.luogo] || 0) + 1;
    (p.foto || []).forEach(f => { if(g.foto.length < 4 && percorsoFotoOk(f)) g.foto.push(f); });
    if(p.creato > g.ultimo) g.ultimo = p.creato;
  });
  return Array.from(m.values()).map(g => {
    /* Quale delle scritture si mostra: prima la più usata; a pari merito
       quella che non urla in maiuscolo, e poi la più completa — fra «Milos» e
       «Milos, Grecia» la seconda dice qualcosa in più. */
    const urla = t => t === t.toUpperCase() && /[A-Z]/.test(t);
    g.nome = Object.keys(g.scritture).sort((a,b) =>
      g.scritture[b] - g.scritture[a] ||
      (urla(a) ? 1 : 0) - (urla(b) ? 1 : 0) ||
      b.length - a.length)[0];
    return g;
  }).sort((a,b) => b.n - a.n || (a.ultimo < b.ultimo ? 1 : -1));
}

let qCerca = '';
let risLuoghi = [], risPersone = [];
let cercaInCorso = false, cercaPronta = false;
let luogoPost = [];

/* Senza niente scritto la pagina non è vuota: mostra dove è stata la gente.
   È metà della domanda che si fa aprendo una ricerca in un'app di viaggi —
   l'altra metà è «chi c'è», e sta nell'altra scheda. */
async function scopriLuoghi(){
  if(!socialAttivo()) return;
  cercaInCorso = true;
  try{
    const {data, error} = await sb.from('toyo_post')
      .select('id, autore, foto, luogo, creato')
      .neq('luogo', '').order('creato', {ascending:false}).limit(200);
    if(error) throw error;
    risLuoghi = raggruppaLuoghi(data || []).slice(0, 24);
  }catch(e){ risLuoghi = []; }
  cercaInCorso = false;
  cercaPronta = true;
}

/* Chi seguire quando non si conosce ancora nessuno: chi ha scritto di
   recente e non stai già seguendo. Non è un algoritmo, è una porta aperta. */
async function scopriPersone(){
  if(!socialAttivo()) return;
  cercaInCorso = true;
  try{
    const {data} = await sb.from('toyo_post').select('autore, creato')
      .order('creato', {ascending:false}).limit(120);
    const visti = [];
    (data || []).forEach(p => {
      if(p.autore !== utente.id && !ioSeguo.has(p.autore) && !bloccati.has(p.autore) &&
         visti.indexOf(p.autore) < 0) visti.push(p.autore);
    });
    const ids = visti.slice(0, 20);
    await scaricaProfili(ids);
    risPersone = ids.map(chi).filter(p => p.nick);
  }catch(e){ risPersone = []; }
  cercaInCorso = false;
  cercaPronta = true;
}

/* Le due ricerche partono insieme: chi scrive «Milos» vuole il posto, chi
   scrive «anna» vuole la persona, e nessuno dei due deve prima scegliere una
   scheda per scoprire di aver scelto quella sbagliata. Il pallino sulla
   scheda dice dove sono finiti i risultati. */
async function cercaOvunque(q){
  if(!socialAttivo()) return;
  const pulito = String(q || '').replace(/[%_,()*]/g, '').trim();
  if(pulito.length < 2){ qCerca = ''; risLuoghi = []; risPersone = []; await scopriLuoghi(); await scopriPersone(); return; }
  qCerca = pulito;
  cercaInCorso = true;
  try{
    const [lp, pf] = await Promise.all([
      sb.from('toyo_post').select('id, autore, foto, luogo, creato')
        .ilike('luogo', '*' + pulito + '*').order('creato', {ascending:false}).limit(200),
      sb.from('toyo_profili').select('utente, nick, nome, cognome, foto, bio')
        .or('nick.ilike.*' + pulito + '*,nome.ilike.*' + pulito + '*,cognome.ilike.*' + pulito + '*')
        .limit(24)
    ]);
    risLuoghi = raggruppaLuoghi((lp && lp.data) || []);
    /* ⚠️ I post di chi hai bloccato non arrivano — ci pensa il database — ma
       il PROFILO resta pubblico e tornava a galla qui, con tanto di pulsante
       «Segui». Bloccare qualcuno e ritrovarselo nella ricerca due minuti dopo
       vuol dire che il blocco non ha fatto quello che prometteva. */
    risPersone = (((pf && pf.data) || []).filter(p => p.utente !== utente.id && !bloccati.has(p.utente)));
    risPersone.forEach(p => { profili[p.utente] = p; });
  }catch(e){
    toast('La ricerca non risponde adesso');
  }
  cercaInCorso = false;
  cercaPronta = true;
}

/* Tutti i post di un posto. Il filtro fine si rifà qui perché «Milos» in
   database prende anche «Milossa»: il confronto vero è sulla chiave. */
async function apriLuogo(nome){
  if(!socialAttivo()) return;
  const k = chiaveLuogo(nome);
  V.luogo = k; V.luogoNome = nome; V.view = 'luogo';
  luogoPost = [];
  cercaInCorso = true;
  render();
  try{
    /* Al server si chiede la prima parte del nome — «milos», non
       «Milos, Grecia» — altrimenti chi ha scritto solo «Milos» resta fuori
       dal suo stesso posto. Il confronto esatto si rifà qui sulla chiave,
       perché in database «milos» prende anche «Milossa». */
    const {data, error} = await sb.from('toyo_post')
      .select('id, autore, testo, foto, luogo, creato')
      .ilike('luogo', '*' + k.replace(/[%_()*]/g, '') + '*')
      .order('creato', {ascending:false}).limit(60);
    if(error) throw error;
    luogoPost = (data || []).filter(p => idOk(p.id) && chiaveLuogo(p.luogo) === k);
    luogoPost.forEach(p => { p.foto = Array.isArray(p.foto) ? p.foto.filter(percorsoFotoOk).slice(0, MAX_FOTO_POST) : []; });
    await scaricaProfili(luogoPost.map(p => p.autore));
    await contaReazioni(luogoPost.map(p => p.id));
    /* I post del luogo entrano nella stessa lista che usano cuori, commenti
       e menu: senza, toccare il cuore qui dentro non trovava il post. */
    luogoPost.forEach(p => { if(!bacheca.some(x => x.id === p.id)) bacheca.push(p); });
  }catch(e){ toast('Non riesco a leggere i post di questo posto'); }
  cercaInCorso = false;
  render();
}

/* ---- disegno ---- */
function cardLuogo(g){
  const u = g.foto.length ? urlFoto(g.foto[0]) : '';
  const np = g.persone.size;
  return '<button class="luogo" data-act="apri-luogo" data-v="' + esc(g.nome) + '">' +
    (u ? '<img src="' + esc(u) + '" alt="" loading="lazy" decoding="async">'
       : '<span class="senza">' + ico('luogo',22) + '</span>') +
    '<span class="velo"></span>' +
    '<span class="tt"><b>' + esc(g.nome) + '</b>' +
      '<i>' + g.n + (g.n === 1 ? ' post' : ' post') + ' · ' + np + (np === 1 ? ' persona' : ' persone') + '</i></span>' +
  '</button>';
}

function viewCerca(){
  if(!socialAttivo()){
    return '<div class="empty-big"><div class="ic">' + ico('lente',22) + '</div>' +
      '<h2>La ricerca vive online</h2>' +
      '<p>Serve per trovare posti dove è stato qualcun altro e persone da seguire: senza account non c\'è né l\'uno né l\'altro.</p>' +
      '<div class="acts"><button class="btn btn-primary" data-act="vai-accesso">Entra o iscriviti</button></div></div>';
  }
  const suLuoghi = V.cTab !== 'persone';
  return '<div class="feed">' +
    '<button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-act="nav" data-view="bacheca">← Bacheca</button>' +
    '<div class="barra-cerca">' + ico('lente',18) +
      '<input id="qCerca" value="' + esc(qCerca) + '" ' +
        'placeholder="Un posto o una persona" spellcheck="false" autocapitalize="off" ' +
        'autocomplete="off" enterkeyhint="search">' +
      (qCerca ? '<button class="pulisci" data-act="pulisci-cerca" aria-label="Cancella"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' : '') +
    '</div>' +
    '<div class="tabs">' +
      '<button class="' + (suLuoghi ? 'on' : '') + '" data-act="cerca-tab" data-v="luoghi">Luoghi' +
        (qCerca && risLuoghi.length ? '<span class="b">' + risLuoghi.length + '</span>' : '') + '</button>' +
      '<button class="' + (!suLuoghi ? 'on' : '') + '" data-act="cerca-tab" data-v="persone">Persone' +
        (qCerca && risPersone.length ? '<span class="b">' + risPersone.length + '</span>' : '') + '</button>' +
    '</div>' +
    '<div id="risCerca">' + risultatiCerca() + '</div>' +
  '</div>';
}

function risultatiCerca(){
  const suLuoghi = V.cTab !== 'persone';
  if(cercaInCorso && !risLuoghi.length && !risPersone.length)
    return '<div class="card"><div class="card-b empty">Cerco…</div></div>';

  if(suLuoghi){
    if(!risLuoghi.length)
      return '<div class="card"><div class="card-b empty" style="padding:26px 20px">' +
        (qCerca ? 'Nessuno ha ancora raccontato niente da «' + esc(qCerca) + '».<br>' +
                  '<span style="font-size:12px">Se ci sei stato tu, il primo post può essere il tuo.</span>'
                : 'Quando qualcuno pubblicherà un post con un luogo, comparirà qui.') +
        '</div></div>';
    return (qCerca ? '' :
        '<div class="sec-head" style="margin:2px 0 0"><h2>Dove sono stati gli altri</h2>' +
        '<span class="sub">i posti di cui si parla di più</span></div>') +
      '<div class="luoghi">' + risLuoghi.map(cardLuogo).join('') + '</div>';
  }

  if(!risPersone.length)
    return '<div class="card"><div class="card-b empty" style="padding:26px 20px">' +
      (qCerca ? 'Nessuno con questo nome utente.' : 'Non c\'è ancora nessun altro qui dentro.') + '</div></div>';
  return (qCerca ? '' :
      '<div class="sec-head" style="margin:2px 0 0"><h2>Chi c\'è</h2>' +
      '<span class="sub">ha scritto di recente e non lo segui</span></div>') +
    '<div class="card"><div class="card-b tight">' +
      risPersone.map(p => rigaPersona(p.utente)).join('') + '</div></div>';
}

function viewLuogo(){
  const nome = V.luogoNome || '';
  const persone = new Set(luogoPost.map(p => p.autore));
  return '<div class="feed">' +
    '<button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-act="nav" data-view="cerca">← Cerca</button>' +
    '<div class="sec-head"><h2>' + ico('luogo',16) + esc(nome) + '</h2>' +
      '<span class="sub">' + (luogoPost.length
        ? luogoPost.length + (luogoPost.length === 1 ? ' post di ' : ' post di ') + persone.size + (persone.size === 1 ? ' persona' : ' persone')
        : 'sto guardando…') + '</span></div>' +
    (luogoPost.length
      ? luogoPost.map(cardPost).join('')
      : '<div class="card"><div class="card-b empty">' +
        (cercaInCorso ? 'Un attimo…' : 'Nessun post da qui, per ora.') + '</div></div>') +
  '</div>';
}

/* Scrivendo, i risultati arrivano da soli: si aspetta che le dita si fermino
   per un terzo di secondo, altrimenti «Milos» sono cinque richieste. */
let ritardoCerca;
function cercaScrivendo(v){
  clearTimeout(ritardoCerca);
  ritardoCerca = setTimeout(async () => {
    await cercaOvunque(v);
    /* Si ridisegna SOLO l'elenco: rifare la pagina intera toglierebbe il
       cursore dalla casella a metà parola. */
    const box = $('risCerca');
    if(box) box.innerHTML = risultatiCerca();
    aggiornaPallini();
    /* ⚠️ La ✕ per svuotare la casella la disegnava solo viewCerca(), che
       mentre si scrive non gira mai: c'era del testo dentro e nessun modo di
       toglierlo se non selezionarlo a mano. */
    aggiornaPulisci();
  }, 320);
}
function aggiornaPulisci(){
  const barra = document.querySelector('#stage .barra-cerca');
  const campo = $('qCerca');
  if(!barra || !campo) return;
  const cera = barra.querySelector('.pulisci');
  if(campo.value && !cera)
    barra.insertAdjacentHTML('beforeend',
      '<button class="pulisci" data-act="pulisci-cerca" aria-label="Cancella"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>');
  if(!campo.value && cera) cera.remove();
}
function aggiornaPallini(){
  const bs = document.querySelectorAll('#stage .tabs button');
  if(bs.length < 2) return;
  const met = (b, n) => {
    const vecchio = b.querySelector('.b');
    if(vecchio) vecchio.remove();
    if(qCerca && n) b.insertAdjacentHTML('beforeend', '<span class="b">' + n + '</span>');
  };
  met(bs[0], risLuoghi.length);
  met(bs[1], risPersone.length);
}

/* ---- la foto del profilo ------------------------------------------------ */
async function cambiaFotoProfilo(){
  if(!socialAttivo()){ toast('La foto del profilo si carica con un account'); return; }
  const inp = $('filePick');
  inp.value = ''; inp.accept = 'image/*'; inp.multiple = false;
  inp.onchange = async () => {
    const f = inp.files && inp.files[0];
    if(!f) return;
    toast('Preparo la foto…');
    try{
      /* 512 px basta e avanza: la faccia più grande in tutta l'app è 62 px,
         il doppio per gli schermi fitti fa 124. Il resto è peso inutile. */
      const b = await ridimensiona(f, 512, 0.85);
      const percorso = await caricaFotoPubblica(b, 'profilo.jpg');
      /* Stessa via ogni volta: il browser terrebbe in cache la foto vecchia,
         quindi si aggiunge un contrassegno che cambia. */
      DB.profilo.foto = percorso;
      DB.profilo.fotoVer = Date.now();
      save();
      profili[utente.id] = Object.assign(chi(utente.id), {foto:percorso, nome:DB.profilo.nome, cognome:DB.profilo.cognome});
      await pubblicaProfilo();
      render();
      if($('modal').innerHTML) formProfilo();
      toast('Foto aggiornata');
    }catch(e){ toast('Non riesco a caricare la foto adesso'); }
  };
  inp.click();
}
async function togliFotoProfilo(){
  if(!socialAttivo()) return;
  try{
    if(DB.profilo.foto) await sb.storage.from(BUCKET_FOTO).remove([DB.profilo.foto]);
  }catch(e){}
  DB.profilo.foto = ''; save();
  profili[utente.id] = Object.assign(chi(utente.id), {foto:''});
  await pubblicaProfilo();
  render();
  if($('modal').innerHTML) formProfilo();
  toast('Foto rimossa');
}

/* ---------- conferma ---------- */
function conferma(titolo, testo, act, id, scope, etichetta){
  modal(mHead(titolo) +
    '<div class="modal-b"><p style="margin:0;font-size:13.5px;color:var(--ink-2)">' + testo + '</p></div>' +
    '<div class="modal-f"><span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
      '<button class="btn btn-danger" data-act="' + act + '" data-id="' + (id||'') + '" data-scope="' + (scope||'') + '">Elimina</button></div>');
}
