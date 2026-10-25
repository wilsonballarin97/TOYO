/* ==========================================================================
   IDEE DI VIAGGIO IN EUROPA
   Ogni idea ha la sua fotografia reale in public/foto/idea-<id>.jpg (servita come /foto/...).
   ========================================================================== */
function scena(id){
  const foto = ['cicladi','lisbona','dolomiti','amsterdam','andalusia','islanda','praga','amalfi'];
  const f = foto.indexOf(id) >= 0 ? id : 'cicladi';
  return '<span class="ideasvg scena-foto" style="position:absolute;inset:0">' +
    '<img src="foto/idea-' + f + '.jpg" alt="" loading="lazy" decoding="async">' +
  '</span>';
}

const IDEE = [
  {id:'cicladi', emoji:'🇬🇷', nome:'Isole Cicladi', paese:'Grecia', tema:0,
   quando:'maggio – ottobre', giorni:8, budget:'700 – 1.100 €',
   perche:'Traghetti fra isole bianche e blu, spiagge e taverne sul porto. Facile da fare in gruppo.',
   tappe:[['Atene','tappa',2],['Naxos','tappa',3],['Milos','tappa',3]]},
  {id:'lisbona', emoji:'🇵🇹', nome:'Lisbona e Sintra', paese:'Portogallo', tema:2,
   quando:'tutto l\'anno', giorni:5, budget:'450 – 700 €',
   perche:'Città in salita, tram gialli, pesce e pasticcerie. Voli economici da mezza Italia.',
   tappe:[['Lisbona','tappa',3],['Sintra','attivita',1],['Cascais','tappa',1]]},
  {id:'dolomiti', emoji:'🏔', nome:'Dolomiti in rifugio', paese:'Italia', tema:1,
   quando:'giugno – settembre', giorni:4, budget:'250 – 450 €',
   perche:'Due giorni di cammino e una notte in quota. Poco costoso e vicino.',
   tappe:[['Val di Funes','tappa',1],['Rifugio Genova','alloggio',2],['Malga Zannes','attivita',1]]},
  {id:'amsterdam', emoji:'🇳🇱', nome:'Amsterdam in bici', paese:'Paesi Bassi', tema:3,
   quando:'aprile – settembre', giorni:4, budget:'500 – 800 €',
   perche:'Canali, musei e biciclette. Si gira tutto senza mai prendere un taxi.',
   tappe:[['Amsterdam','tappa',3],['Zaanse Schans','attivita',1]]},
  {id:'andalusia', emoji:'🇪🇸', nome:'Andalusia in furgone', paese:'Spagna', tema:2,
   quando:'marzo – giugno', giorni:9, budget:'650 – 950 €',
   perche:'Siviglia, Granada, Cordova: strade brevi fra città bellissime, e si mangia con poco.',
   tappe:[['Siviglia','tappa',3],['Granada','tappa',3],['Cordova','tappa',2]]},
  {id:'islanda', emoji:'🇮🇸', nome:'Islanda, anello del sud', paese:'Islanda', tema:3,
   quando:'giugno – agosto', giorni:8, budget:'1.400 – 2.000 €',
   perche:'Cascate, ghiacciai e sorgenti calde. Costa di più, ma è il viaggio che non si dimentica.',
   tappe:[['Reykjavík','tappa',2],['Vík','tappa',3],['Jökulsárlón','attivita',1]]},
  {id:'praga', emoji:'🇨🇿', nome:'Praga e Boemia', paese:'Repubblica Ceca', tema:3,
   quando:'settembre – dicembre', giorni:5, budget:'400 – 650 €',
   perche:'Centro storico da camminare, birra a poco, mercatini se ci vai a dicembre.',
   tappe:[['Praga','tappa',3],['Český Krumlov','tappa',2]]},
  {id:'amalfi', emoji:'🇮🇹', nome:'Costiera Amalfitana', paese:'Italia', tema:0,
   quando:'maggio – giugno, settembre', giorni:6, budget:'550 – 900 €',
   perche:'Paesi a picco sul mare, sentieri e limoni. Meglio fuori dai mesi di punta.',
   tappe:[['Salerno','tappa',1],['Amalfi','tappa',3],['Sentiero degli Dei','attivita',1]]}
];

function cardIdea(x){
  return `
  <button class="ideacard" data-act="apri-idea" data-id="${esc(x.id)}">
    <div class="ideaimg">${scena(x.id)}</div>
    <div class="ideabd">
      <h3>${esc(x.nome)}</h3>
      <div class="m">${esc(x.paese)} · ${x.giorni} giorni</div>
      <div class="foot">
        <span class="pill">${esc(x.quando)}</span>
        <span class="pill gold">${esc(x.budget)}</span>
      </div>
    </div>
  </button>`;
}
/* ⚠️ Nella home c'erano otto schede di idee una sotto l'altra: la pagina
   diventava lunghissima e i propri viaggi si perdevano in mezzo. Ora nella
   home c'è UNA scheda; un tocco apre la pagina con tutte le idee. */
function sezioneIdee(){
  const anteprima = ['lisbona','cicladi','dolomiti','praga'];
  return `
  <button class="idee-una" data-act="nav" data-view="idee">
    <span class="iu-foto">${anteprima.map(id => '<span><img src="foto/idea-' + id + '.jpg" alt="" loading="lazy" decoding="async"></span>').join('')}</span>
    <span class="iu-tx">
      <span class="iu-k">Non sai dove andare?</span>
      <span class="iu-t">Idee per il prossimo viaggio</span>
      <span class="iu-m">${IDEE.length} giri d'Europa già pronti, con tappe, periodo e budget</span>
    </span>
    <span class="iu-fr">${ico('freccia',18)}</span>
  </button>`;
}
function viewIdee(){
  return `
  <button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-act="nav" data-view="hub">← Tutti i viaggi</button>
  ${titSez('Idee per il prossimo viaggio', IDEE.length + ' giri d\'Europa collaudati · toccane uno per vedere l\'itinerario e crearlo con le tappe già dentro')}
  <div class="ideagrid">${IDEE.map(cardIdea).join('')}</div>`;
}
function apriIdea(id){
  const x = IDEE.find(i => i.id === id);
  if(!x) return;
  modal(
    '<div class="ideahero">' + scena(x.id) +
      '<div class="ideahero-tx"><div class="kick">' + esc(x.paese) + ' · ' + x.giorni + ' giorni</div>' +
      '<h2>' + esc(x.emoji) + ' ' + esc(x.nome) + '</h2></div>' +
      '<button class="x ideax" data-act="close-modal" aria-label="Chiudi"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    '</div>' +
    '<div class="modal-b">' +
      '<p style="margin:0 0 14px;font-size:13.5px;color:var(--ink-2);line-height:1.55">' + esc(x.perche) + '</p>' +
      '<div class="rows" style="margin-bottom:14px">' +
        '<div class="row" style="padding:9px 2px"><span class="ic">' + ico('calendario',18) + '</span><span class="tx">' +
          '<span class="t">Periodo consigliato</span><span class="m">' + esc(x.quando) + '</span></span></div>' +
        '<div class="row" style="padding:9px 2px"><span class="ic"><svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 6.2A6.6 6.6 0 0 0 7 11.2v1.6a6.6 6.6 0 0 0 10.5 5"/><path d="M4.6 10.6h7M4.6 13.8h7"/></svg></span><span class="tx">' +
          '<span class="t">Budget indicativo a persona</span><span class="m">' + esc(x.budget) + ' · volo e alloggio compresi</span></span></div>' +
      '</div>' +
      '<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);font-weight:700;margin-bottom:8px">Itinerario suggerito</div>' +
      '<div class="rows">' + x.tappe.map((t,i) => {
        const tp = tipoTappa(t[1]);
        return '<div class="row" style="padding:9px 2px"><span class="ic" style="background:' + tp.c + ';border-color:' + tp.c + ';color:#fff;font-weight:700">' + (i+1) + '</span>' +
          '<span class="tx"><span class="t">' + esc(t[0]) + '</span><span class="m">' + tp.n + ' · ' + t[2] + (t[2] === 1 ? ' giorno' : ' giorni') + '</span></span></div>';
      }).join('') + '</div>' +
      '<div style="font-size:11.5px;color:var(--ink-3);margin-top:14px">Le date le scegli tu: TOYO crea il viaggio con le tappe già dentro, poi aggiungi prenotazioni e persone.</div>' +
    '</div>' +
    '<div class="modal-f"><span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="close-modal">Chiudi</button>' +
      '<button class="btn btn-primary" data-act="usa-idea" data-id="' + esc(x.id) + '">Organizza questo viaggio</button></div>', true);
}
function usaIdea(id){
  const x = IDEE.find(i => i.id === id);
  if(!x) return;
  const oggi = new Date(); oggi.setHours(12,0,0,0);
  const inizio = new Date(oggi.getTime() + 45 * 86400000);
  const iso = d => d.toISOString().slice(0,10);
  const t = {id:uid(), nome:x.nome, emoji:x.emoji, dove:x.paese, dal:iso(inizio),
    al:iso(new Date(inizio.getTime() + (x.giorni - 1) * 86400000)),
    quota:'', posti:'', note:'Idea di partenza: ' + x.perche, tema:x.tema, mio:true, archiviato:null,
    mioVersato:0, tappe:[], prenotazioni:[], gente:[], spese:[], todo:[], docs:[], mieiDocs:[]};
  let g = new Date(inizio);
  x.tappe.forEach(v => {
    const dal = iso(g);
    g = new Date(g.getTime() + (v[2] - 1) * 86400000);
    t.tappe.push({id:uid(), nome:v[0], dove:v[0], tipo:v[1], dal, al:iso(g), note:'', lat:null, lon:null, gpid:'', costo:'', pagato:false});
    g = new Date(g.getTime() + 86400000);
  });
  DB.viaggi.push(t);
  DB.ruolo = 'organizzatore';
  save(); closeModal(); go('trip', t.id, 'itinerario');
  toast('Viaggio creato: aggiusta le date e cerca i luoghi sulla mappa');
}
