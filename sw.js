/* ==========================================================================
   TOYO · service worker
   Serve a due cose: far aprire l'app anche senza rete (l'aereo di cui parla
   index.html) e avvisare quando su GitHub è arrivata una versione nuova.

   ⚠️ Cambia CACHE_VERSION ogni volta che pubblichi una modifica che vuoi
   che arrivi subito a chi ha già installato l'app. Senza questo passo il
   service worker continua a servire i file vecchi dalla cache.
   ========================================================================== */
const CACHE_VERSION = 'toyo-2026-08-27';
const CACHE_SHELL = `${CACHE_VERSION}-shell`;

/* Solo i file che servono per aprire l'app da soli, senza rete.
   Niente Supabase, niente Google Maps: quelli hanno bisogno della rete
   per natura, non ha senso tenerli in cache. */
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_SHELL)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => {}) // una risorsa mancante non deve bloccare l'installazione
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(nomi =>
      Promise.all(
        nomi.filter(n => n !== CACHE_SHELL).map(n => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

/* index.html chiama postMessage('aggiorna-ora') sul worker nuovo appena
   installato: qui basta saltare l'attesa, il resto (reload della pagina)
   lo fa già lo script principale con 'controllerchange'. */
self.addEventListener('message', event => {
  if(event.data === 'aggiorna-ora') self.skipWaiting();
});

/* Cache-first per i file dell'app (aprirsi subito, anche offline),
   rete per tutto il resto (Supabase, Google Maps, Nominatim...). */
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // lascia passare le API esterne

  event.respondWith(
    caches.match(req).then(cached => {
      const rete = fetch(req).then(res => {
        if(res && res.ok){
          const copia = res.clone();
          caches.open(CACHE_SHELL).then(cache => cache.put(req, copia));
        }
        return res;
      }).catch(() => cached);
      // se c'è già in cache, mostra subito quella e aggiorna dietro le quinte;
      // altrimenti aspetta la rete
      return cached || rete;
    })
  );
});
