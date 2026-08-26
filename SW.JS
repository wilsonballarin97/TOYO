/* TOYO · service worker
   Fa due cose: far partire l'app senza rete e farla installare sulla Home.
   L'ordine conta: per la pagina si prova PRIMA la rete e si usa la copia
   salvata solo se la rete non c'è. Al contrario l'app resterebbe ferma alla
   versione vecchia dopo ogni aggiornamento.
   ⚠️ Quando carichi un index.html nuovo, alza VERSIONE (toyo-v1 → toyo-v2). */
const VERSIONE = 'toyo-v1';
const CASSETTO = 'toyo-cache-' + VERSIONE;

const BASE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CASSETTO);
    await c.addAll(BASE);
    try{ await c.add(new Request(CDN, {mode:'cors'})); }catch(err){}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const nomi = await caches.keys();
    await Promise.all(nomi.filter(n => n !== CASSETTO).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  const stessoSito = url.origin === self.location.origin;

  if(req.mode === 'navigate'){
    e.respondWith((async () => {
      try{
        const r = await fetch(req);
        const c = await caches.open(CASSETTO);
        c.put('./index.html', r.clone());
        return r;
      }catch(err){
        const c = await caches.open(CASSETTO);
        return (await c.match('./index.html')) || (await c.match('./')) || Response.error();
      }
    })());
    return;
  }

  if(stessoSito || url.href === CDN){
    e.respondWith((async () => {
      const c = await caches.open(CASSETTO);
      const salvata = await c.match(req);
      const dallaRete = fetch(req).then(r => {
        if(r && (r.ok || r.type === 'opaque')) c.put(req, r.clone());
        return r;
      }).catch(() => null);
      return salvata || (await dallaRete) || Response.error();
    })());
    return;
  }
});

self.addEventListener('message', e => {
  if(e.data === 'aggiorna-ora') self.skipWaiting();
});
