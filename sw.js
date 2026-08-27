
/* ==========================================================================
   TOYO · service worker
   Serve a due cose: far partire l'app senza rete (aereo, roaming spento,
   metropolitana) e farla installare sulla schermata Home come un'app vera.
 
   La regola che conta è l'ordine: per la pagina si prova PRIMA la rete e si
   usa la copia salvata solo se la rete non c'è. Al contrario — copia prima,
   rete poi — l'app resterebbe ferma alla versione vecchia anche dopo un
   aggiornamento su GitHub, ed è l'errore che fa impazzire chi pubblica.
 
   ⚠️ Quando cambi VERSIONE, la vecchia copia viene buttata e ripresa da capo.
   Alza il numero ogni volta che carichi un index.html nuovo.
   ========================================================================== */
const VERSIONE = 'toyo-v7';
const CASSETTO = 'toyo-cache-' + VERSIONE;
 
/* Quello che serve per partire da zero senza rete. */
const BASE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];
 
/* La libreria Supabase arriva da un CDN: se è in cache, l'app riesce a
   entrare nell'account anche con una rete pessima. Se il CDN non risponde in
   fase di installazione non è un dramma: si continua lo stesso. */
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
  if(req.method !== 'GET') return;                 /* login e salvataggi: mai toccati */
 
  const url = new URL(req.url);
  const stessoSito = url.origin === self.location.origin;
 
  /* La pagina: rete prima, copia salvata come rete di sicurezza. */
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
 
  /* Icone, manifest e libreria: copia prima, e intanto si aggiorna di nascosto. */
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
 
  /* Tutto il resto (Supabase, mappe): rete e basta. Mai in cache: sono dati
     di persone, e una copia vecchia sarebbe peggio di nessuna copia. */
});
 
/* La pagina può chiedere di far entrare subito la versione appena scaricata. */
self.addEventListener('message', e => {
  if(e.data === 'aggiorna-ora') self.skipWaiting();
});
