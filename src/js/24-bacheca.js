/* ==========================================================================
   BACHECA
   Fin qui TOYO è stato uno strumento privato: i tuoi viaggi, le tue spese, i
   tuoi documenti. Da qui in poi c'è anche una piazza, e una piazza va aperta
   con delle regole scritte prima, non dopo.

   Le regole sono tre, e stanno nel database — non qui, perché quello che sta
   qui lo cambia chiunque apra la console del browser:
   · si pubblica solo a nome proprio;
   · si legge tutto quello che non arriva da qualcuno che hai bloccato;
   · il blocco è reciproco: se blocchi qualcuno, sparisce a te e tu sparisci
     a lui. Un blocco a senso unico lascia l'altro libero di guardarti, ed è
     la cosa che nelle app fatte male si scopre sempre troppo tardi.

   La bacheca dei "Seguiti" mostra chi hai scelto. "Esplora" mostra gli
   ultimi post di tutti: senza, chi si iscrive oggi non ha nessuno da
   seguire e la piazza resta vuota per sempre.
   ========================================================================== */
const BUCKET_FOTO = 'foto';
const MAX_FOTO_POST = 4;
const MAX_TESTO_POST = 2000;

/* Il percorso di una foto arriva dal server, cioè da altri utenti: finisce
   dentro un attributo src, quindi o ha la forma che ci aspettiamo o si butta. */
const percorsoFotoOk = p => {
  const v = String(p || '');
  /* cartella dell'utente / nome file, e niente ".." che risalga di livello */
  return /^[A-Za-z0-9_-]{6,64}\/[A-Za-z0-9._-]{1,64}$/.test(v) && v.indexOf('..') < 0;
};

function urlFoto(p){
  if(!sb || !percorsoFotoOk(p)) return '';
  try{
    const r = sb.storage.from(BUCKET_FOTO).getPublicUrl(p);
    const u = (r && r.data && r.data.publicUrl) || '';
    return /^https:\/\/[A-Za-z0-9._\-\/%?=&:]+$/.test(u) ? u : '';
  }catch(e){ return ''; }
}

/* ⚠️ Una foto scattata col telefono pesa fra i 3 e i 12 MB. Caricarla intera
   vuol dire far aspettare chi pubblica su rete mobile, riempire lo spazio del
   progetto in un pomeriggio e far scaricare quei megabyte a ognuno che scorre
   la bacheca. Si ridimensiona QUI, prima di partire: quello che esce sono
   200 KB circa, e a schermo non si vede la differenza. */
function ridimensiona(file, lato, qualita){
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
      if(!w || !h){ no(new Error('immagine vuota')); return; }
      const s = Math.min(1, (lato || 1400) / Math.max(w, h));
      w = Math.max(1, Math.round(w * s)); h = Math.max(1, Math.round(h * s));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      /* Il fondo bianco serve alle PNG trasparenti: senza, il trasparente
         diventa nero appena si passa a JPEG. */
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.drawImage(img, 0, 0, w, h);
      c.toBlob(b => b ? ok(b) : no(new Error('conversione fallita')), 'image/jpeg', qualita || 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); no(new Error('non è un\'immagine')); };
    img.src = url;
  });
}

async function caricaFotoPubblica(blob, nome){
  const percorso = utente.id + '/' + nome;
  const {error} = await sb.storage.from(BUCKET_FOTO)
    .upload(percorso, blob, {upsert:true, contentType:'image/jpeg', cacheControl:'86400'});
  if(error) throw error;
  return percorso;
}

/* ---- rubrica in memoria -------------------------------------------------
   Nome, foto e nome utente di chi compare nella bacheca. Si chiedono una
   volta sola per sessione: senza questa cache, venti post dello stesso autore
   sono venti richieste identiche. */
let profili = {};
function chi(id){
  return profili[id] || {utente:id, nick:'', nome:'Qualcuno', cognome:'', foto:'', bio:''};
}
async function scaricaProfili(ids){
  if(!sb || !utente) return;
  const mancano = Array.from(new Set(ids)).filter(x => x && !profili[x]);
  if(!mancano.length) return;
  try{
    const {data} = await sb.from('toyo_profili')
      .select('utente, nick, nome, cognome, foto, bio').in('utente', mancano);
    (data || []).forEach(p => { profili[p.utente] = p; });
  }catch(e){}
  /* Chi non ha un profilo pubblico resta senza nome, ma la riga si disegna
     lo stesso: un post che sparisce a metà è peggio di un post anonimo. */
  mancano.forEach(x => { if(!profili[x]) profili[x] = chi(x); });
}

/* Una faccia sola per tutta l'app: se c'è la foto si vede la foto, se non
   c'è si vedono le iniziali sul colore che quella persona ha sempre. */
function avatar(nome, cognome, foto, px, extra){
  const s = px || 32;
  const base = 'width:' + s + 'px;height:' + s + 'px;flex:0 0 ' + s + 'px;' +
               'font-size:' + Math.max(9, Math.round(s * 0.36)) + 'px;' + (extra || '');
  const u = urlFoto(foto);
  if(u) return '<span class="av foto" style="' + base + '"><img src="' + esc(u) + '" alt="" loading="lazy" decoding="async"></span>';
  return '<span class="av" style="' + base + 'background:' + coloreDa(nome) + '">' + esc(iniz(nome, cognome)) + '</span>';
}
function avatarDi(id, px, extra){
  const p = chi(id);
  return avatar(p.nome || p.nick || '?', p.cognome, p.foto, px, extra);
}
/* La propria foto: sta nel salvataggio locale, così si vede anche prima che
   la rubrica sia scesa dal server — e continua a vedersi senza rete. */
function urlFotoProfilo(){
  return (DB.profilo && DB.profilo.foto) ? urlFoto(DB.profilo.foto) : '';
}
function nomeDi(id){
  const p = chi(id);
  const n = ((p.nome || '') + ' ' + (p.cognome || '')).trim();
  return n || (p.nick ? '@' + p.nick : 'Qualcuno');
}

/* ---- stato della piazza ---- */
let ioSeguo      = new Set();
let bloccati     = new Set();
let bacheca      = [];
let miPiaceMiei  = new Set();
let contoMiPiace = {};
let contoCommenti= {};
let bachecaPronta = false;
let bachecaInCorso = false;
let contoSeguiti = 0, contoSeguaci = 0;

const socialAttivo = () => !!(sb && utente);

/* Tutto quello che sta qui sopra e' di CHI E' ENTRATO, non del dispositivo:
   uscendo va buttato, altrimenti il prossimo apre la bacheca e trova la
   piazza di un altro. */
function scordaLaPiazza(){
  profili = {}; ioSeguo = new Set(); bloccati = new Set();
  bacheca = []; miPiaceMiei = new Set();
  contoMiPiace = {}; contoCommenti = {};
  contoSeguiti = 0; contoSeguaci = 0;
  bachecaPronta = false; bachecaInCorso = false;
  qCerca = ''; risLuoghi = []; risPersone = []; luogoPost = [];
  cercaPronta = false; cercaInCorso = false;
  tmpFotoPost.forEach(f => { try{ URL.revokeObjectURL(f.anteprima); }catch(e){} });
  tmpFotoPost = [];
}

async function scaricaGrafo(){
  if(!socialAttivo()) return;
  const [s, b, f] = await Promise.all([
    sb.from('toyo_segui').select('seguito').eq('chi', utente.id),
    sb.from('toyo_blocchi').select('bloccato').eq('chi', utente.id),
    sb.from('toyo_segui').select('chi', {count:'exact', head:true}).eq('seguito', utente.id)
  ]);
  ioSeguo  = new Set(((s && s.data) || []).map(x => x.seguito));
  bloccati = new Set(((b && b.data) || []).map(x => x.bloccato));
  contoSeguiti = ioSeguo.size;
  contoSeguaci = (f && typeof f.count === 'number') ? f.count : contoSeguaci;
}

async function scaricaBacheca(){
  if(!socialAttivo()) return;
  bachecaInCorso = true;
  try{
    await scaricaGrafo();
    let q = sb.from('toyo_post')
      .select('id, autore, testo, foto, luogo, creato')
      .order('creato', {ascending:false}).limit(40);
    if(V.bTab !== 'esplora'){
      const ids = [utente.id].concat(Array.from(ioSeguo));
      q = q.in('autore', ids);
    }
    const {data, error} = await q;
    if(error) throw error;
    /* Gli id arrivano da altri account e finiscono dentro attributi HTML:
       quelli storti si buttano invece di provare a ripararli. */
    bacheca = (data || []).filter(p => p && idOk(p.id));
    bacheca.forEach(p => {
      p.foto = Array.isArray(p.foto) ? p.foto.filter(percorsoFotoOk).slice(0, MAX_FOTO_POST) : [];
    });
    await scaricaProfili(bacheca.map(p => p.autore));
    await contaReazioni(bacheca.map(p => p.id));
    bachecaPronta = true;
  }catch(e){
    toast('Non riesco a leggere la bacheca adesso');
  }
  bachecaInCorso = false;
}

async function contaReazioni(ids){
  contoMiPiace = {}; contoCommenti = {}; miPiaceMiei = new Set();
  if(!ids.length || !socialAttivo()) return;
  try{
    const [mp, cm] = await Promise.all([
      sb.from('toyo_mipiace').select('post, utente').in('post', ids),
      sb.from('toyo_commenti').select('post').in('post', ids)
    ]);
    ((mp && mp.data) || []).forEach(x => {
      contoMiPiace[x.post] = (contoMiPiace[x.post] || 0) + 1;
      if(x.utente === utente.id) miPiaceMiei.add(x.post);
    });
    ((cm && cm.data) || []).forEach(x => { contoCommenti[x.post] = (contoCommenti[x.post] || 0) + 1; });
  }catch(e){}
}

/* ---- quanto tempo fa ----------------------------------------------------
   "2 h" e non "18 agosto 2026 alle 14:32": in una bacheca la data esatta non
   serve quasi mai, e occupa la riga dove sta il nome. */
function quando(iso){
  const d = new Date(iso);
  if(isNaN(d)) return '';
  const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if(s < 60) return 'ora';
  if(s < 3600) return Math.floor(s / 60) + ' min';
  if(s < 86400) return Math.floor(s / 3600) + ' h';
  if(s < 604800) return Math.floor(s / 86400) + ' g';
  return d.getDate() + ' ' + MESI[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '');
}
