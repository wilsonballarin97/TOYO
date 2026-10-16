/* TOYO si è spostato su https://toyo-travel.pages.dev
   Questo service worker sostituisce quello vecchio solo per spegnerlo:
   svuota la cache e si toglie di mezzo, così chi aveva l'app installata da
   qui vede la pagina del trasloco invece della versione salvata. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('message', e => { if (e.data === 'aggiorna-ora') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
