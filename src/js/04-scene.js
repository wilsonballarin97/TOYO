/* ==========================================================================
   LE SCENE DEI VIAGGI
   Un viaggio senza il suo posto è una riga di database: prima qui c'era solo
   una sfumatura di colore, uguale per tutti tranne che nella tinta.
   Disegnate in SVG e non fotografie: pesano nulla, si vedono offline, non
   dipendono da nessun servizio e non hanno licenze da rispettare — le stesse
   ragioni per cui sono disegnate le illustrazioni delle idee di viaggio.
   Una per tema, così chi sceglie il tema sceglie anche il paesaggio.
   ========================================================================== */
const SCENE = [
  /* 0 · mare e isole */
  '<circle cx="322" cy="34" r="17" fill="#F2C14E"/>' +
  '<path d="M0 104 L58 74 L116 104 Z" fill="#F7F3EA"/><path d="M72 108 L134 62 L196 108 Z" fill="#FBF8F1"/>' +
  '<rect x="142" y="84" width="28" height="26" fill="#FBF8F1"/><path d="M156 71a14 14 0 0 1 14 13h-28a14 14 0 0 1 14-13z" fill="#2565A8"/>' +
  '<rect x="212" y="86" width="38" height="24" fill="#F7F3EA"/><path d="M266 110 L306 76 L346 110 Z" fill="#FBF8F1"/>' +
  '<rect y="110" width="400" height="40" fill="#2E7C99"/>' +
  '<path d="M0 119q21-7 42 0t42 0 42 0 42 0 42 0 42 0 42 0 42 0 42 0" stroke="#9BD0DE" stroke-width="1.6" fill="none" opacity=".5"/>',
  /* 1 · montagna */
  '<circle cx="330" cy="32" r="15" fill="#FBF0D3"/>' +
  '<path d="M-10 126 L86 46 L182 126 Z" fill="#3E6455"/><path d="M86 46 L118 72 L54 72 Z" fill="#F4F1E8"/>' +
  '<path d="M120 126 L214 58 L308 126 Z" fill="#2F5C40"/><path d="M214 58 L242 80 L186 80 Z" fill="#F4F1E8"/>' +
  '<path d="M262 126 L336 74 L410 126 Z" fill="#4A7C59"/><rect y="122" width="400" height="28" fill="#26493A"/>',
  /* 2 · borgo del sud */
  '<circle cx="60" cy="36" r="18" fill="#FBF0D3" opacity=".85"/>' +
  '<rect x="20" y="76" width="54" height="52" fill="#FBF8F1"/><rect x="86" y="58" width="66" height="70" fill="#F7F1E6"/>' +
  '<rect x="164" y="86" width="48" height="42" fill="#FBF8F1"/><rect x="224" y="66" width="58" height="62" fill="#F7F1E6"/>' +
  '<rect x="294" y="90" width="52" height="38" fill="#FBF8F1"/>' +
  '<path d="M86 58 L119 34 L152 58 Z" fill="#8E3418"/><path d="M224 66 L253 44 L282 66 Z" fill="#8E3418"/>' +
  '<path d="M20 76 L47 58 L74 76 Z" fill="#A34124"/><rect y="124" width="400" height="26" fill="#8E3418"/>',
  /* 3 · città di notte */
  '<circle cx="336" cy="30" r="13" fill="#F5EAD2"/>' +
  '<circle cx="60" cy="26" r="1.6" fill="#F5EAD2"/><circle cx="128" cy="42" r="1.3" fill="#F5EAD2"/><circle cx="248" cy="24" r="1.5" fill="#F5EAD2"/>' +
  '<rect x="14" y="72" width="42" height="56" fill="#2E2F52"/><rect x="66" y="48" width="50" height="80" fill="#3A3B63"/>' +
  '<rect x="128" y="84" width="38" height="44" fill="#2E2F52"/><rect x="178" y="58" width="56" height="70" fill="#3A3B63"/>' +
  '<rect x="246" y="78" width="44" height="50" fill="#2E2F52"/><rect x="302" y="64" width="52" height="64" fill="#3A3B63"/>' +
  '<g fill="#F2C14E"><rect x="24" y="82" width="7" height="8"/><rect x="38" y="98" width="7" height="8"/><rect x="78" y="60" width="7" height="8"/>' +
  '<rect x="94" y="84" width="7" height="8"/><rect x="190" y="72" width="7" height="8"/><rect x="212" y="94" width="7" height="8"/>' +
  '<rect x="258" y="92" width="7" height="8"/><rect x="316" y="78" width="7" height="8"/></g>' +
  '<rect y="124" width="400" height="26" fill="#232445"/>',
  /* 4 · campagna */
  '<circle cx="72" cy="34" r="19" fill="#FBF0D3"/>' +
  '<path d="M0 96q60-22 132 0t132 0 136 0v54H0z" fill="#C9A23A"/>' +
  '<path d="M0 116q60-18 132 0t132 0 136 0v34H0z" fill="#A8811F"/>' +
  '<path d="M262 96V62M262 62l16 10M262 62l-16 10M262 76l16 10M262 76l-16 10" stroke="#6E5410" stroke-width="3" fill="none"/>' +
  '<rect x="60" y="72" width="34" height="26" fill="#F7F1E6"/><path d="M60 72 L77 58 L94 72 Z" fill="#8E3418"/>',
  /* 5 · città grigia */
  '' +
  '<rect x="10" y="66" width="46" height="62" fill="#A89383"/><rect x="66" y="84" width="38" height="44" fill="#8B7D71"/>' +
  '<rect x="114" y="52" width="54" height="76" fill="#A89383"/><rect x="178" y="76" width="42" height="52" fill="#8B7D71"/>' +
  '<rect x="230" y="60" width="50" height="68" fill="#A89383"/><rect x="290" y="88" width="46" height="40" fill="#8B7D71"/>' +
  '<rect x="346" y="70" width="44" height="58" fill="#A89383"/>' +
  '<g fill="#F4EFE6" opacity=".55"><rect x="20" y="76" width="8" height="9"/><rect x="36" y="94" width="8" height="9"/>' +
  '<rect x="126" y="64" width="8" height="9"/><rect x="146" y="88" width="8" height="9"/><rect x="242" y="72" width="8" height="9"/>' +
  '<rect x="260" y="98" width="8" height="9"/><rect x="358" y="82" width="8" height="9"/></g>' +
  '<rect y="124" width="400" height="26" fill="#6E655C"/>'
];
/* ⚠️ Erano coppie di colori per sfumare il cielo dall'alto al basso. Adesso
   sono DUE FASCE PIENE: cielo alto e cielo basso, con la linea di stacco
   netta. E' la stessa scelta delle serigrafie dei manifesti di viaggio —
   pochi colori, nessuna sfumatura, e ogni colore si vede per quello che e'. */
const CIELI = [
  ['#2E6C96','#5E9BB8'], ['#4E7E9B','#8FB4B0'], ['#E8A76B','#F0C79B'],
  ['#1C1D3A','#343566'], ['#C79A2E','#DFC072'], ['#7E7468','#A79C8E']
];
/* Il velo scuro che sale dal basso serve a una cosa sola: far reggere il
   bianco del titolo su qualunque cielo, senza dover scegliere il colore del
   testo caso per caso. */
function scenaViaggio(tema){
  const i = Math.max(0, Math.min(5, num(tema) || 0));
  return '<span class="scena scena-foto">' +
    '<img src="foto/tema-' + i + '.jpg" alt="" loading="lazy" decoding="async">' +
  '</span>';
}

const TEMI = [
  /* Una sola famiglia di colori: il verde dell'app in cinque gradazioni,
     piu' un grigio caldo. Prima erano sei tinte scollegate (blu, arancio,
     viola, oro) e l'elenco dei viaggi sembrava un'altra applicazione. */
  '#2F5C40', '#55744C', '#7D9B76', '#A8C0A0', '#3F4A3C', '#6E655C'
];
const EMOJI = ['🧳','🏔','🏖','🏛','🌋','🎿','🚐','⛵','🎒','🌴','🗺','🎡','🚆','🏕','🌅','🎄',
               '🇮🇹','🇪🇸','🇬🇷','🇫🇷','🇵🇹','🇦🇹','🇳🇴','🇲🇦'];
const TIPI_DOC = [
  {id:'ci',   n:"Carta d'identità", ic:ico('tessera',17)},
  {id:'pass', n:'Passaporto',       ic:ico('passaporto',17)},
  {id:'pat',  n:'Patente di guida', ic:ico('auto',17)},
  {id:'ts',   n:'Tessera sanitaria',ic:ico('salute',17)},
  {id:'ass',  n:'Assicurazione',    ic:ico('scudo',17)},
  {id:'visto',n:'Visto',            ic:ico('timbro',17)},
  {id:'altro',n:'Altro',            ic:ico('fatture',17)}
];
const CATEGORIE = [
  {id:'alloggio', n:'Alloggio',            ic:ico('letto',17)},
  {id:'volo',     n:'Voli',                ic:ico('aereo',17)},
  {id:'treno',    n:'Treni, bus, traghetti',ic:ico('treno',17)},
  {id:'auto',     n:'Auto e trasferimenti', ic:ico('auto',17)},
  {id:'cibo',     n:'Ristoranti',          ic:ico('cibo',17)},
  {id:'attivita', n:'Attività e visite',   ic:ico('biglietto',17)},
  {id:'altro',    n:'Altro',               ic:ico('luogo',17)}
];
const cat = id => CATEGORIE.find(x => x.id === id) || CATEGORIE[CATEGORIE.length - 1];

/* Un solo verde: le categorie non si distinguono piu' per colore ma per
   disegno dell'icona. Il campo c resta per non toccare le firme, ma punta
   tutto all'accento. */
const ACC = 'var(--terracotta)';
const TIPI_TAPPA = [
  {id:'tappa',    n:'Tappa',      ic:ico('luogo',17),      c:ACC, cat:'altro'},
  {id:'alloggio', n:'Alloggio',   ic:ico('letto',17),      c:ACC, cat:'alloggio'},
  {id:'aereo',    n:'Aeroporto',  ic:ico('aereo',17),      c:ACC, cat:'volo'},
  {id:'trasp',    n:'Trasporto',  ic:ico('treno',17),      c:ACC, cat:'treno'},
  {id:'cibo',     n:'Ristorante', ic:ico('cibo',17),       c:ACC, cat:'cibo'},
  {id:'attivita', n:'Da vedere',  ic:ico('biglietto',17),  c:ACC, cat:'attivita'},
  {id:'altro',    n:'Altro',      ic:ico('altro',17),      c:ACC, cat:'altro'}
];
const tipoTappa = id => TIPI_TAPPA.find(x => x.id === id) || TIPI_TAPPA[0];

const TIPI_PREN = [
  {id:'alloggio',  n:'Alloggio',        ic:ico('letto',17),     c:ACC, cat:'alloggio'},
  {id:'volo',      n:'Volo',            ic:ico('aereo',17),     c:ACC, cat:'volo'},
  {id:'treno',     n:'Treno',           ic:ico('treno',17),     c:ACC, cat:'treno'},
  {id:'bus',       n:'Bus',             ic:ico('bus',17),       c:ACC, cat:'treno'},
  {id:'traghetto', n:'Traghetto',       ic:ico('nave',17),      c:ACC, cat:'treno'},
  {id:'auto',      n:'Auto a noleggio', ic:ico('auto',17),      c:ACC, cat:'auto'},
  {id:'attivita',  n:'Attività',        ic:ico('biglietto',17), c:ACC, cat:'attivita'},
  {id:'altro',     n:'Altro',           ic:ico('altro',17),     c:ACC, cat:'altro'}
];
const tipoPren = id => TIPI_PREN.find(x => x.id === id) || TIPI_PREN[0];
const STATI_PREN = {
  daPren:  ['warn','Da prenotare'],
  pren:    ['info','Prenotata'],
  pagata:  ['ok','Pagata']
};

const TIPI_DOC_V = [
  {id:'biglietto', n:'Biglietto',    ic:ico('biglietto',17)},
  {id:'prenota',   n:'Prenotazione', ic:ico('letto',17)},
  {id:'voucher',   n:'Voucher',      ic:ico('timbro',17)},
  {id:'polizza',   n:'Polizza',      ic:ico('scudo',17)},
  {id:'ricevuta',  n:'Ricevuta',     ic:ico('fatture',17)},
  {id:'altro',     n:'Altro',        ic:ico('archivio',17)}
];
const nomeTipo = (id, lista) => ((lista||TIPI_DOC).find(t => t.id === id) || {n:'Documento', ic:ico('archivio',17)});


/* ---------------------------------------------------------------- STATO UI */
let V = { view:'hub', tripId:null, tab:'panoramica', bTab:'seguiti', cTab:'luoghi' };
const viaggio = () => DB.viaggi.find(t => t.id === V.tripId);

/* Chi organizza modifica; chi partecipa consulta e basta (documenti e quota a
   parte). Il co-organizzatore ha le stesse mani del proprietario: è invitato
   con ruolo 'organizzatore' e il viaggio gli arriva con coorg acceso. */
const posso = t => !!(t && (t.mio || t.coorg));

/* Archiviato a mano oppure, se non hai deciso tu, quando il viaggio è finito. */
function archiviato(t){
  if(t.archiviato === true) return true;
  if(t.archiviato === false) return false;
  return !!(t.al && giorniA(t.al) < 0);
}
/* Un viaggio co-organizzato è a tutti gli effetti un viaggio che gestisci:
   prima compariva solo in modalità Viaggiatore, dove però sparivano i tuoi. */
const mieiViaggi  = () => DB.viaggi.filter(t => (DB.ruolo === 'organizzatore' ? (t.mio || t.coorg) : !t.mio));
const viaggiVivi  = () => mieiViaggi().filter(t => !archiviato(t));
const viaggiArch  = () => mieiViaggi().filter(t => archiviato(t));
