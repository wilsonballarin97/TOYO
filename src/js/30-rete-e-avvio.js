/* ==========================================================================
   RETE CHE VA E CHE TORNA
   Le Impostazioni promettevano che "quello che cambi senza rete parte da solo
   appena torna la linea". Non era vero: non c'era nessun ascoltatore e un
   invio fallito non veniva mai ritentato. Ora è vero.
   ========================================================================== */
window.addEventListener('online', () => {
  if(sb && utente && syncStato === 'errore'){
    toast('Rete tornata: sto salvando');
    inviaDati();
  }
});
/* Chiudere la scheda o mandare l'app in secondo piano non deve buttare via il
   salvataggio ancora in attesa. Su mobile "pagehide" è l'unico che scatta
   davvero quando l'utente cambia app. */
const flushSeServe = () => {
  if(sb && utente && syncT){ clearTimeout(syncT); inviaDati(); }
};
window.addEventListener('pagehide', flushSeServe);
document.addEventListener('visibilitychange', () => { if(document.hidden) flushSeServe(); });

/* Android e Chrome desktop lasciano decidere a noi quando proporre
   l'installazione; iPhone no, lì si passa dal tasto Condividi di Safari. */
var invitoInstalla = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  invitoInstalla = e;
  if(V.view === 'impostazioni') render();
});
window.addEventListener('appinstalled', () => { invitoInstalla = null; toast('TOYO è sulla tua schermata Home'); });
function inApp(){
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

/* L'HTML scritto a mano non passa dai template: le icone della barra in alto e
   di quella in basso si riempiono qui, una volta sola. */
document.querySelectorAll('[data-ico]').forEach(el => {
  el.innerHTML = ico(el.dataset.ico, parseInt(el.dataset.icoPx, 10) || 20);
});
