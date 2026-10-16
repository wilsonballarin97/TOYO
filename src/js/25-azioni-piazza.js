/* ==========================================================================
   AZIONI DELLA PIAZZA
   ========================================================================== */
/* Il cuore si accende PRIMA che il server risponda e torna indietro se il
   server dice di no. Aspettare la risposta per colorare un cuore fa sembrare
   l'app rotta su rete lenta — ed è l'unico punto dove questo trucco è onesto,
   perché se fallisce non si è perso niente. */
async function toccaMiPiace(id){
  if(!socialAttivo()){ toast('Serve un account'); return; }
  const c_era = miPiaceMiei.has(id);
  if(c_era){ miPiaceMiei.delete(id); contoMiPiace[id] = Math.max(0, (contoMiPiace[id] || 1) - 1); }
  else     { miPiaceMiei.add(id);    contoMiPiace[id] = (contoMiPiace[id] || 0) + 1; }
  aggiornaPiede(id);
  try{
    const {error} = c_era
      ? await sb.from('toyo_mipiace').delete().eq('post', id).eq('utente', utente.id)
      : await sb.from('toyo_mipiace').insert({post:id, utente:utente.id});
    if(error) throw error;
  }catch(e){
    if(c_era){ miPiaceMiei.add(id); contoMiPiace[id] = (contoMiPiace[id] || 0) + 1; }
    else     { miPiaceMiei.delete(id); contoMiPiace[id] = Math.max(0, (contoMiPiace[id] || 1) - 1); }
    aggiornaPiede(id);
    toast('Non è passato: riprova quando torna la rete');
  }
}
/* Ridisegna solo il piede di quel post: render() intero farebbe risalire la
   pagina in cima e chi stava leggendo perderebbe il segno. */
function aggiornaPiede(id){
  const p = document.querySelector('.post[data-post="' + CSS.escape(id) + '"] .post-f');
  if(p) p.innerHTML = piedePost(id);
}

async function segui(id){
  if(!socialAttivo()){ toast('Serve un account'); return; }
  if(id === utente.id) return;
  const seguivo = ioSeguo.has(id);
  try{
    const {error} = seguivo
      ? await sb.from('toyo_segui').delete().eq('chi', utente.id).eq('seguito', id)
      : await sb.from('toyo_segui').insert({chi:utente.id, seguito:id});
    if(error) throw error;
    if(seguivo) ioSeguo.delete(id); else ioSeguo.add(id);
    contoSeguiti = ioSeguo.size;
    toast(seguivo ? 'Non segui più ' + nomeDi(id) : 'Segui ' + nomeDi(id));
    await scaricaBacheca(); render();
  }catch(e){ toast('Non riesco adesso: riprova fra poco'); }
}

async function blocca(id){
  if(!socialAttivo()) return;
  try{
    const {error} = await sb.from('toyo_blocchi').insert({chi:utente.id, bloccato:id});
    if(error) throw error;
    /* Chi si blocca non si segue più: lasciare il legame in piedi vuol dire
       che sbloccandolo torna a comparire senza che nessuno l'abbia chiesto. */
    await sb.from('toyo_segui').delete().eq('chi', utente.id).eq('seguito', id);
    bloccati.add(id); ioSeguo.delete(id);
    closeModal();
    toast(nomeDi(id) + ' non ti vede più, e tu non vedi lui');
    await scaricaBacheca(); render();
  }catch(e){ toast('Non riesco a bloccare adesso'); }
}
async function sblocca(id){
  if(!socialAttivo()) return;
  try{
    await sb.from('toyo_blocchi').delete().eq('chi', utente.id).eq('bloccato', id);
    bloccati.delete(id);
    toast('Sbloccato');
    await scaricaBacheca(); render();
  }catch(e){ toast('Non riesco adesso'); }
}

async function segnala(id, motivo){
  if(!socialAttivo()) return;
  try{
    const {error} = await sb.from('toyo_segnalazioni')
      .insert({id:uid(), post:id, chi:utente.id, motivo:String(motivo || '').slice(0, 200)});
    if(error) throw error;
    closeModal();
    toast('Segnalazione inviata. Se vuoi, blocca anche chi l\'ha scritto.');
  }catch(e){ toast('Non riesco a segnalare adesso'); }
}

/* ---- pubblicare --------------------------------------------------------- */
let tmpFotoPost = [];   /* [{blob, anteprima}] — vive solo mentre la finestra è aperta */

function formPost(){
  if(!socialAttivo()){ toast('La bacheca funziona con un account'); return; }
  tmpFotoPost = [];
  const p = DB.profilo || {nome:'Tu', cognome:''};
  modal(mHead('Racconta qualcosa', 'Lo vedono le persone che ti seguono') +
    '<div class="modal-b">' +
      '<div style="display:flex;gap:12px;align-items:flex-start">' +
        avatar(p.nome, p.cognome, p.foto, 40) +
        '<div style="flex:1;min-width:0">' +
          '<textarea class="inp" id="poTesto" rows="4" maxlength="' + MAX_TESTO_POST + '" ' +
            'placeholder="Dove sei stato, cosa hai visto, cosa rifaresti…" ' +
            'style="border:0;background:none;padding:6px 0;resize:vertical;min-height:88px;font-size:15px"></textarea>' +
          '<div class="mini-foto" id="poFoto"></div>' +
        '</div>' +
      '</div>' +
      '<div class="field" style="margin:14px 0 0"><label>Dove <span class="opt">(facoltativo)</span></label>' +
        '<input class="inp" id="poLuogo" maxlength="120" placeholder="Milos, Grecia"></div>' +
      '<div class="err hide" id="poErr">Scrivi qualcosa o aggiungi una foto.</div>' +
    '</div>' +
    '<div class="modal-f">' +
      '<button class="btn btn-ghost btn-sm" data-act="post-foto">' + ico('fotocamera',16) + '<span>Foto</span></button>' +
      '<span class="hint" id="poConta">0 / ' + MAX_FOTO_POST + '</span>' +
      '<span class="sp"></span>' +
      '<button class="btn btn-ghost btn-sm" data-act="close-modal">Annulla</button>' +
      '<button class="btn btn-primary" data-act="salva-post" id="poSalva">Pubblica</button>' +
    '</div>');
  setTimeout(() => { const t = $('poTesto'); if(t) t.focus(); }, 60);
}

function disegnaFotoPost(){
  const box = $('poFoto'); if(!box) return;
  box.innerHTML = tmpFotoPost.map((f, i) =>
    '<figure><img src="' + esc(f.anteprima) + '" alt="">' +
    '<button class="via" data-act="togli-foto-post" data-i="' + i + '" aria-label="Togli questa foto"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></figure>').join('');
  const c = $('poConta'); if(c) c.textContent = tmpFotoPost.length + ' / ' + MAX_FOTO_POST;
}

function scegliFotoPost(){
  if(tmpFotoPost.length >= MAX_FOTO_POST){ toast('Massimo ' + MAX_FOTO_POST + ' foto per post'); return; }
  const inp = $('filePick');
  inp.value = ''; inp.accept = 'image/*'; inp.multiple = true;
  inp.onchange = async () => {
    const scelte = Array.from(inp.files || []).slice(0, MAX_FOTO_POST - tmpFotoPost.length);
    inp.multiple = false;
    for(const f of scelte){
      try{
        const b = await ridimensiona(f, 1400, 0.82);
        tmpFotoPost.push({blob:b, anteprima:URL.createObjectURL(b)});
      }catch(e){ toast('Una foto non si è potuta usare'); }
    }
    disegnaFotoPost();
  };
  inp.click();
}

let pubblicando = false;
async function salvaPost(){
  if(pubblicando) return;
  const testo = val('poTesto');
  if(!testo && !tmpFotoPost.length){ $('poErr').classList.remove('hide'); return; }
  if(testo.length > MAX_TESTO_POST){ toast('Il testo è troppo lungo'); return; }
  pubblicando = true;
  const btn = $('poSalva');
  if(btn){ btn.textContent = 'Pubblico…'; btn.disabled = true; }
  const id = uid();
  try{
    const percorsi = [];
    for(let i = 0; i < tmpFotoPost.length; i++){
      if(btn) btn.textContent = 'Carico la foto ' + (i + 1) + ' di ' + tmpFotoPost.length + '…';
      percorsi.push(await caricaFotoPubblica(tmpFotoPost[i].blob, id + '-' + i + '.jpg'));
    }
    const {error} = await sb.from('toyo_post').insert({
      id, autore:utente.id, testo, foto:percorsi, luogo:val('poLuogo') || ''
    });
    if(error) throw error;
    /* Le anteprime tengono memoria finché non le si libera a mano. */
    tmpFotoPost.forEach(f => { try{ URL.revokeObjectURL(f.anteprima); }catch(e){} });
    tmpFotoPost = [];
    closeModal();
    V.view = 'bacheca';
    await scaricaBacheca(); render();
    toast('Pubblicato');
  }catch(e){
    toast('Non riesco a pubblicare adesso: riprova');
    if(btn){ btn.textContent = 'Pubblica'; btn.disabled = false; }
  }
  pubblicando = false;
}

async function eliminaPost(id){
  if(!socialAttivo()) return;
  try{
    const p = bacheca.find(x => x.id === id);
    /* Prima le foto, poi la riga: al contrario restano immagini in un
       archivio pubblico di cui non esiste più il post. */
    if(p && p.foto && p.foto.length){
      try{ await sb.storage.from(BUCKET_FOTO).remove(p.foto); }catch(e){}
    }
    const {error} = await sb.from('toyo_post').delete().eq('id', id);
    if(error) throw error;
    closeModal();
    await scaricaBacheca(); render();
    toast('Post eliminato');
  }catch(e){ toast('Non riesco a eliminare adesso'); }
}

/* ---- commenti ----------------------------------------------------------- */
let commentiDi = null;
async function apriCommenti(id){
  if(!socialAttivo()) return;
  const post = bacheca.find(x => x.id === id);
  commentiDi = id;
  modal(mHead('Commenti', post ? 'a ' + nomeDi(post.autore) : '') +
    '<div class="modal-b" id="cmBody"><div class="card-b empty">Un attimo…</div></div>' +
    '<div class="modal-f">' +
      '<input class="inp" id="cmTesto" maxlength="600" placeholder="Scrivi un commento" style="flex:1;min-width:0">' +
      '<button class="btn btn-primary" data-act="salva-commento" data-id="' + esc(id) + '">Invia</button>' +
    '</div>', true);
  await disegnaCommenti(id);
}
async function disegnaCommenti(id){
  const box = $('cmBody'); if(!box) return;
  let righe = [];
  try{
    const {data, error} = await sb.from('toyo_commenti')
      .select('id, post, autore, testo, creato').eq('post', id).order('creato', {ascending:true}).limit(200);
    if(error) throw error;
    righe = (data || []).filter(c => idOk(c.id));
    await scaricaProfili(righe.map(c => c.autore));
  }catch(e){
    box.innerHTML = '<div class="card-b empty">Non riesco a leggere i commenti adesso.</div>';
    return;
  }
  contoCommenti[id] = righe.length;
  aggiornaPiede(id);
  const post = bacheca.find(x => x.id === id);
  const mioPost = post && post.autore === utente.id;
  box.innerHTML = righe.length ? righe.map(c => {
    const suo = c.autore === utente.id;
    return '<div class="persona-riga commento">' +
      avatarDi(c.autore, 32) +
      '<span class="tx"><b>' + esc(nomeDi(c.autore)) +
        '<i>' + esc(quando(c.creato)) + '</i></b>' +
      '<span class="detto">' + esc(c.testo) + '</span></span>' +
      ((suo || mioPost) ? '<button class="via-commento" data-act="del-commento" data-id="' + esc(c.id) +
        '" data-v="' + esc(id) + '" aria-label="Elimina commento">' + ico('cestino',15) + '</button>' : '') +
      '</div>';
  }).join('') : vuoto('bacheca','Nessun commento','Comincia tu: scrivi la prima nota per il gruppo.');
}
async function salvaCommento(id){
  const t = val('cmTesto');
  if(!t) return;
  try{
    const {error} = await sb.from('toyo_commenti').insert({id:uid(), post:id, autore:utente.id, testo:t.slice(0, 600)});
    if(error) throw error;
    if($('cmTesto')) $('cmTesto').value = '';
    await disegnaCommenti(id);
    const b = $('cmBody'); if(b) b.scrollTop = b.scrollHeight;
  }catch(e){ toast('Il commento non è partito'); }
}
async function eliminaCommento(cid, pid){
  try{
    await sb.from('toyo_commenti').delete().eq('id', cid);
    await disegnaCommenti(pid);
  }catch(e){ toast('Non riesco a eliminare il commento'); }
}

/* ---- una riga di persona, usata dalla ricerca e dai commenti ---- */
function rigaPersona(id){
  const p = chi(id);
  const seguo = ioSeguo.has(id);
  return '<div class="persona-riga">' + avatarDi(id, 40) +
    '<span class="tx"><b>' + esc(nomeDi(id)) + '</b><span>' + (p.nick ? '@' + esc(p.nick) : 'senza nome utente') +
      (p.bio ? ' · ' + esc(p.bio) : '') + '</span></span>' +
    '<button class="btn ' + (seguo ? 'btn-ghost' : 'btn-primary') + ' btn-sm" data-act="segui" data-id="' + esc(id) + '">' +
      ico(seguo ? 'spuntaPers' : 'piuPersona', 15) + '<span>' + (seguo ? 'Segui già' : 'Segui') + '</span></button>' +
    '</div>';
}
