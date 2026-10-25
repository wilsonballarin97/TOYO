/* ==========================================================================
   TOYO · Travel on your own — app completa, dati locali
   Nessun dato di esempio: tutto quello che vedi lo hai creato tu.
   ========================================================================== */

/* ---------------------------------------------------------------- STORE */
/* Etichetta visibile in fondo alla schermata di accesso e in Impostazioni:
   serve a capire al volo quale copia del file si sta aprendo. */
const VERSIONE = '25 ott · accesso con email, sezioni del viaggio' + (TOYO_BUILD ? ' · ' + TOYO_BUILD : '');
const KEY = 'toyo.v1';
const KEY_VECCHIA = 'triply.v1';   /* i dati creati quando l'app si chiamava TRIPLY */
let storeOk = true;

function loadDB(){
  try{
    let raw = localStorage.getItem(KEY);
    if(!raw){
      raw = localStorage.getItem(KEY_VECCHIA);
      if(raw){ localStorage.setItem(KEY, raw); localStorage.removeItem(KEY_VECCHIA); }
    }
    return raw ? JSON.parse(raw) : null;
  }catch(e){ storeOk = false; return null; }
}
/* ⚠️ Il timbro dell'ora si mette QUI, non dentro inviaDati().
   Prima veniva scritto solo a sincronia riuscita: chi modificava senza rete e
   poi chiudeva l'app si ritrovava una copia locale con l'ora vecchia, e al
   rientro il server sembrava più recente e le sue modifiche sparivano. */
let viaggioInAzione = null, daImportare = null;
function save(){
  DB.aggiornato = new Date().toISOString();
  segnaDaPubblicare(viaggioInAzione || viaggio());
  programmaSync();
  try{
    localStorage.setItem(KEY, JSON.stringify(DB));
    if(!storeOk){ storeOk = true; render(); }
    return true;
  }catch(e){
    /* Un toast qui non basta: il chiamante subito dopo ne mostra uno di
       successo che lo copre, e l'utente crede di aver salvato. Serve qualcosa
       che si pianti davanti. */
    storeOk = false;
    avvisoSpazioPieno(/quota|exceed/i.test(e.name + e.message));
    return false;
  }
}
function avvisoSpazioPieno(quota){
  modal(mHead('Non sono riuscito a salvare', quota ? 'Lo spazio di questo browser è pieno' : 'Il browser ha rifiutato la scrittura') +
    '<div class="modal-b"><div style="font-size:13px;line-height:1.65;color:var(--ink-2)">' +
      '<b>L\'ultima modifica è solo a schermo: se ricarichi la pagina la perdi.</b><br><br>' +
      (quota ? 'Succede quando ci sono allegati pesanti salvati dentro il browser. ' +
               'Scarica il backup, poi libera spazio: sposta gli allegati nell\'archivio online da Impostazioni, ' +
               'oppure elimina i documenti più grossi.'
             : 'Può capitare in navigazione privata o con i dati dei siti bloccati. Prova a scaricare il backup e a riaprire TOYO in una finestra normale.') +
    '</div></div>' +
    '<div class="modal-f"><span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="export">' + ico('bustaGiu',16) + '<span>Scarica backup</span></button>' +
      '<button class="btn btn-primary" data-act="close-modal">Ho capito</button></div>', true);
}
let DB = loadDB() || { v:1, profilo:null, ruolo:'organizzatore', docs:[], viaggi:[] };

/* Gli id finiscono come chiavi primarie condivise su Supabase e viaggiano da
   un account all'altro dentro i viaggi. Con Math.random() erano indovinabili —
   e chi riceve decine di id generati nella stessa sessione può ricostruire la
   sequenza — e due utenti diversi potevano generare lo stesso id: un upsert
   non darebbe errore, sovrascriverebbe. */
const uid = () => {
  try{ if(crypto && crypto.randomUUID) return crypto.randomUUID(); }catch(e){}
  try{
    const a = new Uint8Array(16); crypto.getRandomValues(a);
    return Array.from(a, b => b.toString(16).padStart(2,'0')).join('');
  }catch(e){}
  return 'x' + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
};
/* Un id che arriva da un altro account non è mai da fidarsi: finisce dentro un
   attributo HTML, quindi o è fatto di caratteri innocui o si butta. */
const idOk = v => /^[A-Za-z0-9_-]{1,64}$/.test(String(v || ''));

/* ---------------------------------------------------------------- UTILS */
const $ = id => document.getElementById(id);
const ONB_LOCALE = $('onb').innerHTML;   /* la schermata "come ti chiami", usata senza account */
function mostraLocale(){
  $('onb').innerHTML = ONB_LOCALE;
  if($('obVer')) $('obVer').textContent = VERSIONE;
}
const val = id => ($(id) ? $(id).value.trim() : '');
const esc = s => String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

let toastT;
function toast(m){
  const t = $('toast'); t.textContent = m; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove('on'), 2600);
}
const MESI = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
function fmtDate(iso){
  if(!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  if(isNaN(d)) return '';
  return d.getDate() + ' ' + MESI[d.getMonth()] + ' ' + d.getFullYear();
}
function fmtRange(dal, al){
  if(dal && al && dal === al) return fmtDate(dal);
  if(!dal && !al) return 'Date da definire';
  if(dal && !al) return 'Dal ' + fmtDate(dal);
  if(!dal && al) return 'Fino al ' + fmtDate(al);
  const a = new Date(dal + 'T12:00:00'), b = new Date(al + 'T12:00:00');
  if(a.getFullYear() === b.getFullYear()){
    if(a.getMonth() === b.getMonth()) return a.getDate() + ' – ' + b.getDate() + ' ' + MESI[b.getMonth()] + ' ' + b.getFullYear();
    return a.getDate() + ' ' + MESI[a.getMonth()] + ' – ' + b.getDate() + ' ' + MESI[b.getMonth()] + ' ' + b.getFullYear();
  }
  return fmtDate(dal) + ' – ' + fmtDate(al);
}
function giorniA(iso){
  if(!iso) return null;
  const d = new Date(iso + 'T12:00:00'); if(isNaN(d)) return null;
  const oggi = new Date(); oggi.setHours(12,0,0,0);
  return Math.round((d - oggi) / 86400000);
}
function durata(dal, al){
  if(!dal || !al) return null;
  const g = Math.round((new Date(al+'T12:00:00') - new Date(dal+'T12:00:00')) / 86400000) + 1;
  return g > 0 ? g : null;
}
const eur = n => {
  const v = Number(n || 0);
  const t = '€ ' + Math.abs(v).toLocaleString('it-IT', {maximumFractionDigits:2});
  return v < 0 ? '− ' + t : t;
};
const num = v => { const n = parseFloat(String(v).replace(',','.')); return isNaN(n) ? 0 : n; };
/* Il colore di una persona non è casuale: si ricava dal suo nome, così resta
   lo stesso in ogni schermata e su ogni dispositivo. */
/* ⚠️ Erano DUE funzioni con due tavolozze e due hash: la stessa persona era
   viola nell'elenco viaggi e blu-grigio dentro il viaggio, e cambiava anche
   forma (cerchio di là, quadrato stondato di qua). Ora è una sola, e le tinte
   sono tutte dentro il sistema — niente viola, niente rosa, niente verde
   acqua che non esistono da nessun'altra parte. */
const TINTE = ['#C4522E','#4A7C59','#2565A8','#8A6600','#2F5C40','#8E3418'];
function coloreDa(nome){
  const t = String(nome || '');
  let n = 0;
  for(let i = 0; i < t.length; i++) n = (n * 31 + t.charCodeAt(i)) % 100000;
  return TINTE[n % TINTE.length];
}

function iniz(nome, cognome){
  const a = (nome||'').trim()[0] || '?';
  const b = (cognome||'').trim()[0] || '';
  return (a + b).toUpperCase();
}
/* Un solo nome per la stessa cosa: colorFor resta come alias perché è chiamato
   in quattro punti, ma il colore lo decide coloreDa. */
const colorFor = str => coloreDa(str);
function kb(bytes){
  if(bytes < 1024) return bytes + ' B';
  if(bytes < 1024*1024) return Math.round(bytes/1024) + ' KB';
  return (bytes/1048576).toFixed(1) + ' MB';
}
