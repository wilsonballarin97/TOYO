/* ==========================================================================
   LA BACHECA A SCHERMO
   ========================================================================== */
function piedePost(id){
  const mp = contoMiPiace[id] || 0, cm = contoCommenti[id] || 0;
  const acceso = miPiaceMiei.has(id);
  return '<button class="reag ' + (acceso ? 'on' : '') + '" data-act="mi-piace" data-id="' + esc(id) + '" ' +
      'aria-pressed="' + (acceso ? 'true' : 'false') + '" aria-label="Mi piace">' +
      ico(acceso ? 'cuorePien' : 'cuore', 17) + '<span class="n">' + (mp || '') + '</span></button>' +
    '<button class="reag" data-act="commenti" data-id="' + esc(id) + '" aria-label="Commenti">' +
      ico('fumetto',17) + '<span class="n">' + (cm || '') + '</span></button>';
}

function cardPost(p){
  const mio = p.autore === utente.id;
  const foto = (p.foto || []).slice(0, MAX_FOTO_POST);
  return '<article class="post" data-post="' + esc(p.id) + '">' +
    '<div class="post-h">' +
      '<button data-act="profilo-di" data-id="' + esc(p.autore) + '" style="display:flex;align-items:center;gap:10px;min-width:0;flex:1">' +
        avatarDi(p.autore, 38) +
        '<span style="min-width:0"><span class="nm">' + esc(nomeDi(p.autore)) + '</span>' +
        '<span class="mt">' + (chi(p.autore).nick ? '@' + esc(chi(p.autore).nick) + ' · ' : '') + esc(quando(p.creato)) + '</span></span>' +
      '</button>' +
      '<span class="rt">' +
        (!mio && !ioSeguo.has(p.autore)
          ? '<button class="btn btn-ghost btn-sm" data-act="segui" data-id="' + esc(p.autore) + '">Segui</button>' : '') +
        '<button class="icon-btn" data-act="menu-post" data-id="' + esc(p.id) + '" aria-label="Altro">' + ico('altro',16) + '</button>' +
      '</span>' +
    '</div>' +
    (p.testo ? '<div class="post-txt">' + esc(p.testo) + '</div>' : '') +
    (p.luogo ? '<div class="post-luogo">' + ico('luogo',13) + esc(p.luogo) + '</div>' : '') +
    (foto.length ? '<div class="post-foto n' + foto.length + '">' + foto.map((f, i) =>
        '<button data-act="apri-foto" data-id="' + esc(p.id) + '" data-i="' + i + '" aria-label="Ingrandisci">' +
        '<img src="' + esc(urlFoto(f)) + '" alt="" loading="lazy" decoding="async"></button>').join('') + '</div>' : '') +
    '<div class="post-f">' + piedePost(p.id) + '</div>' +
  '</article>';
}

function menuPost(id){
  const p = bacheca.find(x => x.id === id);
  if(!p) return;
  const mio = p.autore === utente.id;
  modal(mHead(mio ? 'Il tuo post' : 'Post di ' + nomeDi(p.autore)) +
    '<div class="modal-b" style="padding-top:6px">' +
      (mio
        ? '<button class="mi" data-act="del-post" data-id="' + esc(id) + '"><span class="si">' + ico('cestino',18) + '</span>Elimina il post</button>'
        : '<button class="mi" data-act="segui" data-id="' + esc(p.autore) + '"><span class="si">' +
            ico(ioSeguo.has(p.autore) ? 'spuntaPers' : 'piuPersona', 18) + '</span>' +
            (ioSeguo.has(p.autore) ? 'Smetti di seguire' : 'Segui') + '</button>' +
          '<button class="mi" data-act="form-segnala" data-id="' + esc(id) + '"><span class="si">' + ico('bandiera',18) + '</span>Segnala</button>' +
          '<button class="mi" data-act="form-blocca" data-id="' + esc(p.autore) + '"><span class="si">' + ico('blocco',18) + '</span>Blocca ' + esc(nomeDi(p.autore)) + '</button>') +
    '</div>' +
    '<div class="modal-f"><span class="sp"></span><button class="btn btn-ghost btn-sm" data-act="close-modal">Chiudi</button></div>');
}

function formSegnala(id){
  const M = ['Contenuto offensivo', 'Spam o pubblicità', 'Foto non appropriate', 'Non è vero / inganna', 'Altro'];
  modal(mHead('Segnalare questo post?', 'La segnalazione resta registrata e non è anonima verso di noi') +
    '<div class="modal-b" style="padding-top:6px">' +
      M.map(m => '<button class="mi" data-act="fai-segnala" data-id="' + esc(id) + '" data-v="' + esc(m) + '">' +
        '<span class="si">' + ico('bandiera',17) + '</span>' + esc(m) + '</button>').join('') +
    '</div>' +
    '<div class="modal-f"><span class="sp"></span><button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button></div>');
}
function formBlocca(id){
  modal(mHead('Bloccare ' + nomeDi(id) + '?') +
    '<div class="modal-b"><div style="font-size:13.5px;line-height:1.65;color:var(--ink-2)">' +
      'Il blocco vale <b>nei due sensi</b>: non vedrai più i suoi post e i commenti, e lei o lui non vedrà più i tuoi. ' +
      'Se vi seguivate, il legame si scioglie.<br><br>' +
      'Nei <b>viaggi</b> che avete già in comune non cambia niente: lì siete stati messi insieme da chi organizza, ' +
      'e toglierne uno di nascosto all\'altro sarebbe peggio. Se il problema è un viaggio, parlane con chi lo gestisce.' +
    '</div></div>' +
    '<div class="modal-f"><span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
      '<button class="btn btn-danger" data-act="fai-blocca" data-id="' + esc(id) + '">Blocca</button></div>');
}

async function apriFotoPost(id, i){
  const p = bacheca.find(x => x.id === id);
  if(!p || !p.foto || !p.foto[i]) return;
  const u = urlFoto(p.foto[i]);
  if(!u) return;
  modal(mHead(nomeDi(p.autore), p.luogo || quando(p.creato)) +
    '<div class="modal-b"><img class="viewer-img" src="' + esc(u) + '" alt=""></div>' +
    '<div class="modal-f"><span class="sp"></span><button class="btn btn-ghost btn-sm" data-act="close-modal">Chiudi</button></div>', true);
}

function viewBacheca(){
  if(!socialAttivo()){
    return '<div class="empty-big"><div class="ic">' + ico('bacheca',22) + '</div>' +
      '<h2>La bacheca vive online</h2>' +
      '<p>È la parte di TOYO che si condivide: foto e racconti di chi segui, e i tuoi visibili a chi ti segue. ' +
      'Senza account non c\'è nessuno da seguire e non c\'è nessuno a cui mostrare.</p>' +
      '<div class="acts"><button class="btn btn-primary" data-act="vai-accesso">Entra o iscriviti</button></div></div>';
  }
  const p = DB.profilo || {nome:'Tu', cognome:''};
  const seguiti = V.bTab !== 'esplora';
  /* La ricerca di persone sta QUI, nella striscia, e non sopra come pulsante
     a tutta larghezza: non e' l'azione principale della bacheca, e messa in
     cima sembrava esserlo. */
  /* ⚠️ La ricerca era una lente in fondo alla striscia delle schede: c'era,
     ma bisognava sapere che c'era. Adesso e' una barra vera in cima, che e'
     dove la si cerca in qualunque app. Non e' un campo scrivibile ma un
     pulsante: la casella vera sta nella pagina della ricerca, con il cursore
     gia' dentro, cosi' non ci sono due caselle che fanno la stessa cosa. */
  const barra =
    '<button class="barra-cerca finta" data-act="nav" data-view="cerca">' + ico('lente',18) +
      '<span>Cerca un posto o una persona</span></button>';
  const testa =
    '<div class="tabs bacheca-tabs">' +
      '<button class="' + (seguiti ? 'on' : '') + '" data-act="bacheca-tab" data-v="seguiti">Chi segui</button>' +
      '<button class="' + (!seguiti ? 'on' : '') + '" data-act="bacheca-tab" data-v="esplora">Esplora</button>' +
    '</div>';

  const comp =
    '<div class="comp">' + avatar(p.nome, p.cognome, p.foto, 38) +
      '<button class="finto" data-act="new-post">Racconta un viaggio, ' + esc((p.nome || '').split(' ')[0] || 'tu') + '…</button>' +
      '<button class="icon-btn" data-act="new-post" aria-label="Aggiungi foto">' + ico('fotocamera',17) + '</button>' +
    '</div>';

  let corpo;
  if(bachecaInCorso && !bacheca.length){
    corpo = '<div class="post"><div class="post-h">' +
      '<div class="skel" style="width:38px;height:38px;border-radius:var(--r-btn)"></div>' +
      '<div style="flex:1"><div class="skel skel-riga" style="width:40%"></div>' +
      '<div class="skel skel-riga" style="width:22%;margin-top:6px;height:11px"></div></div></div>' +
      '<div style="padding:0 16px 16px"><div class="skel skel-riga" style="width:92%"></div>' +
      '<div class="skel skel-riga" style="width:74%;margin-top:8px"></div></div></div>';
  } else if(!bacheca.length){
    corpo = seguiti
      ? '<div class="card"><div class="card-b empty" style="padding:26px 20px">' +
          '<b style="display:block;font-size:14px;color:var(--ink);margin-bottom:6px">Ancora silenzio</b>' +
          'Qui compaiono i post di chi segui. Comincia da <b>Esplora</b>, oppure cerca qualcuno per nome utente.' +
          '<div style="display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap">' +
            '<button class="btn btn-primary btn-sm" data-act="bacheca-tab" data-v="esplora">Vai a Esplora</button>' +
            '<button class="btn btn-ghost btn-sm" data-act="cerca-gente">' + ico('lente',15) + '<span>Trova persone</span></button>' +
          '</div></div></div>'
      : '<div class="card"><div class="card-b empty" style="padding:26px 20px">' +
          '<b style="display:block;font-size:14px;color:var(--ink);margin-bottom:6px">La piazza è nuova</b>' +
          'Non ha ancora scritto nessuno. Il primo post può essere il tuo.' +
          '<div style="margin-top:14px"><button class="btn btn-primary btn-sm" data-act="new-post">Scrivi il primo</button></div>' +
        '</div></div>';
  } else {
    corpo = bacheca.map(cardPost).join('');
  }

  return '<div class="feed">' +
    '<div class="sec-head"><h2>Bacheca</h2>' +
      '<span class="sub">' + contoSeguiti + ' seguiti · ' + contoSeguaci + (contoSeguaci === 1 ? ' ti segue' : ' ti seguono') + '</span></div>' +
    barra + testa + comp + corpo +
  '</div>';
}

/* ---- il profilo pubblico di qualcun altro ---- */
async function apriProfiloDi(id){
  if(!socialAttivo()) return;
  if(id === utente.id){ closeModal(); go('profilo'); return; }
  await scaricaProfili([id]);
  const p = chi(id);
  let suoi = [], seguaci = 0;
  try{
    const [ps, sg] = await Promise.all([
      sb.from('toyo_post').select('id, testo, foto, creato').eq('autore', id).order('creato', {ascending:false}).limit(12),
      sb.from('toyo_segui').select('chi', {count:'exact', head:true}).eq('seguito', id)
    ]);
    suoi = ((ps && ps.data) || []).filter(x => idOk(x.id));
    seguaci = (sg && typeof sg.count === 'number') ? sg.count : 0;
  }catch(e){}
  const seguo = ioSeguo.has(id);
  const bloccato = bloccati.has(id);
  const griglia = suoi.filter(x => x.foto && x.foto.length && percorsoFotoOk(x.foto[0]));
  /* ⚠️ Il titolo diceva il nome e poi il corpo lo ripeteva uguale due righe
     sotto. In cima sta il nome utente, che e' l'unica cosa davvero univoca;
     il nome per esteso e la presentazione stanno dentro, con le facce. */
  modal(mHead(p.nick ? '@' + p.nick : nomeDi(id), 'Profilo') +
    '<div class="modal-b">' +
      '<div style="display:flex;gap:var(--s4);align-items:center">' +
        avatar(p.nome || p.nick, p.cognome, p.foto, 66) +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:17px;font-weight:700;letter-spacing:-.025em">' + esc(nomeDi(id)) + '</div>' +
          (p.bio ? '<div style="font-size:12.5px;color:var(--ink-2);margin-top:2px">' + esc(p.bio) + '</div>' : '') +
          '<div style="display:flex;gap:14px;margin-top:8px;font-size:12px;color:var(--ink-3)">' +
            '<span><b class="num" style="color:var(--ink);font-size:13.5px">' + suoi.length + '</b> post</span>' +
            '<span><b class="num" style="color:var(--ink);font-size:13.5px">' + seguaci + '</b> ' + (seguaci === 1 ? 'seguace' : 'seguaci') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:var(--s4)">' +
        (bloccato
          ? '<button class="btn btn-ghost btn-full" data-act="fai-sblocca" data-id="' + esc(id) + '">Sblocca ' + esc(nomeDi(id)) + '</button>'
          : '<button class="btn ' + (seguo ? 'btn-ghost' : 'btn-primary') + ' btn-full" data-act="segui" data-id="' + esc(id) + '">' +
            ico(seguo ? 'spuntaPers' : 'piuPersona', 16) + '<span>' + (seguo ? 'Smetti di seguire' : 'Segui') + '</span></button>') +
      '</div>' +
      (griglia.length
        ? '<div class="griglia-foto">' +
          griglia.slice(0, 9).map(x => '<button data-act="close-modal" aria-label="Chiudi">' +
            '<img src="' + esc(urlFoto(x.foto[0])) + '" alt="" loading="lazy"></button>').join('') + '</div>'
        : '<div class="card-b empty" style="margin-top:var(--s4)">' +
            (suoi.length ? 'Scrive, ma senza foto.' : 'Non ha ancora pubblicato niente.') + '</div>') +
    '</div>' +
    '<div class="modal-f">' +
      (bloccato ? '' : '<button class="btn btn-ghost btn-sm" data-act="form-blocca" data-id="' + esc(id) + '">' + ico('blocco',15) + '<span>Blocca</span></button>') +
      '<span class="sp"></span><button class="btn btn-ghost btn-sm" data-act="close-modal">Chiudi</button></div>', true);
}
