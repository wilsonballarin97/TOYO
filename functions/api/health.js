/* GET /api/health — per controllare al volo che il deploy sia vivo e quale commit gira. */
export function onRequestGet({ env }) {
  return new Response(JSON.stringify({
    ok: true,
    app: 'toyo',
    commit: env.CF_PAGES_COMMIT_SHA || null,
    ramo: env.CF_PAGES_BRANCH || null,
    supabase: Boolean(env.SUPABASE_URL),
    ora: new Date().toISOString()
  }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
