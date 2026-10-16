/* Vale per tutte le /api/*: un errore imprevisto torna come JSON ordinato
   (e finisce nei log di Cloudflare), mai come pagina d'errore. Solo GET. */
export async function onRequest({ request, next }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ errore: 'metodo non permesso' }), {
      status: 405, headers: { 'content-type': 'application/json; charset=utf-8', 'allow': 'GET, HEAD' } });
  }
  try {
    const r = await next();
    const h = new Headers(r.headers);
    h.set('x-content-type-options', 'nosniff');
    if (!h.has('cache-control')) h.set('cache-control', 'no-store');
    return new Response(r.body, { status: r.status, headers: h });
  } catch (e) {
    console.error('api', new URL(request.url).pathname, e && e.stack || e);
    return new Response(JSON.stringify({ errore: 'servizio non disponibile, riprova fra poco' }), {
      status: 502, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  }
}
