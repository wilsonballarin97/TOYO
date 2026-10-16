/* ==========================================================================
   TRASLOCO · dal vecchio indirizzo GitHub Pages a Cloudflare
   I viaggi salvati senza account stanno nel browser, legati all'indirizzo da
   cui si apriva TOYO: cambiando indirizzo non si vedono più. La pagina rimasta
   su wilsonballarin97.github.io/TOYO apre questa con #trasloco e le passa i
   dati con postMessage (niente nell'indirizzo, niente server in mezzo).
   Qui si accettano solo messaggi da quell'origine, e prima di sostituire
   qualcosa si chiede conferma come per un backup da file.
   ========================================================================== */
const ORIGINE_VECCHIA = 'https://wilsonballarin97.github.io';

if(location.hash === '#trasloco' && window.opener){
  history.replaceState(null, '', location.pathname);
  let ricevuto = false;
  window.addEventListener('message', e => {
    if(e.origin !== ORIGINE_VECCHIA || ricevuto) return;
    const m = e.data;
    if(!m || m.tipo !== 'toyo-trasloco' || typeof m.dati !== 'string') return;
    ricevuto = true;
    let d = null;
    try{ d = JSON.parse(m.dati); }catch(err){}
    if(!d || !Array.isArray(d.viaggi)){ toast('I dati arrivati non sono un backup TOYO'); return; }
    try{ e.source.postMessage({tipo:'toyo-ricevuto'}, ORIGINE_VECCHIA); }catch(err){}
    /* Chi arriva qui la prima volta non ha niente da perdere: si importa
       subito. Se invece qui c'è già qualcosa, si chiede. */
    if(!(DB.viaggi || []).length){
      daImportare = d;
      azioneImportaSubito();
    } else {
      chiediImport(d);
    }
  });
  // Dice alla pagina vecchia che è pronta a ricevere (ripetuto: non si sa chi carica prima).
  let tentativi = 0;
  const bussa = setInterval(() => {
    if(ricevuto || ++tentativi > 20 || !window.opener){ clearInterval(bussa); return; }
    try{ window.opener.postMessage({tipo:'toyo-pronto'}, ORIGINE_VECCHIA); }catch(err){ clearInterval(bussa); }
  }, 500);
}

function azioneImportaSubito(){
  DB = daImportare; daImportare = null; migra();
  DB.aggiornato = new Date().toISOString();
  save(); boot(); toast('I tuoi viaggi sono arrivati');
}
