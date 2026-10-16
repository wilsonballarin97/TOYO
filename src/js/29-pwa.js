/* ==========================================================================
   APP INSTALLABILE E OFFLINE
   Il service worker parte solo su http(s): aprendo il file col doppio clic
   (file://) il browser lo rifiuta, ed è giusto così — in locale non serve.

   Quando su GitHub arriva un index.html nuovo, il service worker se ne
   accorge, lo installa e la pagina si ricarica da sola una volta sola: senza
   questo pezzo la gente resterebbe sulla versione vecchia per giorni.
   ========================================================================== */
if('serviceWorker' in navigator && location.protocol.indexOf('http') === 0){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const nuovo = reg.installing;
        if(!nuovo) return;
        nuovo.addEventListener('statechange', () => {
          if(nuovo.state === 'installed' && navigator.serviceWorker.controller){
            toast('Versione nuova pronta: ricarico');
            nuovo.postMessage('aggiorna-ora');
          }
        });
      });
    }).catch(() => {});

    let giaRicaricato = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if(giaRicaricato) return;
      giaRicaricato = true;
      location.reload();
    });
  });
}
