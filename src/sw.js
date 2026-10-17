/* ==========================================================================
   TOYO · service worker
   Due compiti: far aprire l'app anche senza rete e far arrivare subito le
   versioni nuove a chi l'ha già installata.

   CACHE_VERSION e PRECACHE li scrive build.mjs a ogni build: la versione è
   l'impronta dei file, quindi cambia da sola quando cambia qualcosa.
   ========================================================================== */
const CACHE_VERSION = '__CACHE_VERSION__';
const CACHE_SHELL = `${CACHE_VERSION}-shell`;
const CACHE_FOTO = 'toyo-foto-v1';   // le foto non cambiano: sopravvivono agli aggiornamenti
const PRECACHE = '__PRECACHE__';

self.addEventListener('install', event => {
  /* Un file alla volta: se ne mancasse uno, gli altri finiscono comunque in
     cache (cache.addAll invece fallisce in blocco e lascia la cache vuota). */
  event.waitUntil(
    caches.open(CACHE_SHELL).then(cache =>
      Promise.all(PRECACHE.map(u => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(nomi => Promise.all(nomi.filter(n => n !== CACHE_SHELL && n !== CACHE_FOTO).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* La pagina chiede di saltare l'attesa appena il worker nuovo è installato;
   il ricaricamento lo fa lei con 'controllerchange'. */
self.addEventListener('message', event => {
  if (event.data === 'aggiorna-ora') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;     // Supabase, Maps…: rete
  if (url.pathname.startsWith('/api/')) return;        // Functions: sempre rete

  // Navigazione: rete prima (versione fresca), cache se offline. Solo l'app
  // vera finisce in cache come /index.html; le altre pagine (es. /privacy.html)
  // offline cadono sulla copia salvata di sé stesse o sull'app.
  if (req.mode === 'navigate') {
    const app = url.pathname === '/' || url.pathname === '/index.html';
    event.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const c = res.clone(); caches.open(CACHE_SHELL).then(k => k.put(app ? '/index.html' : req, c)); }
        return res;
      }).catch(() => caches.match(app ? '/index.html' : req, { ignoreSearch: true })
        .then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // Asset con impronta e foto: cache prima, sono immutabili.
  const cacheNome = url.pathname.startsWith('/foto/') ? CACHE_FOTO : CACHE_SHELL;
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok) { const c = res.clone(); caches.open(cacheNome).then(k => k.put(req, c)); }
      return res;
    }))
  );
});
