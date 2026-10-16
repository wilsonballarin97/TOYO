#!/usr/bin/env node
/* ==========================================================================
   TOYO · build
   Prende i pezzi in src/ e produce il sito pronto in dist/:

     src/index.html   lo scheletro (<!--@CSS--> e <!--@JS--> sono i segnaposto)
     src/css/*.css    gli stili, uniti in ordine di nome
     src/js/*.js      il codice, unito in ordine di nome in UN solo script
                      classico: le sezioni condividono le stesse variabili,
                      esattamente come quando stavano tutte in index.html
     src/sw.js        il service worker (versione e lista file li scrive la build)
     public/          copiato così com'è (foto, icone, manifest, _headers)

   I file finali hanno l'impronta nel nome (app.3f9c1a2b.js): il browser può
   tenerli in cache per sempre e una versione nuova ha per forza un nome nuovo.
   La versione del service worker cambia da sola a ogni build: non c'è più
   CACHE_VERSION da ricordarsi di aggiornare a mano.

   Uso:  npm run build        → dist/
         npm run dev          → build + server locale su http://localhost:8788
                                 (ricostruisce da solo quando salvi un file)
   ========================================================================== */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, statSync, existsSync, watch } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname } from 'node:path';
import { createServer } from 'node:http';

const ROOT = new URL('.', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const PUB = join(ROOT, 'public');
const OUT = join(ROOT, 'dist');
const DEV = process.argv.includes('--dev');

let esbuild = null;
try { esbuild = await import('esbuild'); } catch { /* senza esbuild: niente minificazione, il resto va */ }

const leggi = f => readFileSync(f, 'utf8');
const impronta = s => createHash('sha256').update(s).digest('hex').slice(0, 10);
const elenco = (dir, ext) => readdirSync(dir).filter(f => f.endsWith(ext)).sort();

function unisci(dir, ext) {
  return elenco(dir, ext)
    .map(f => `/* ---- ${f} ---- */\n` + leggi(join(dir, f)).trimEnd() + '\n')
    .join('\n');
}

function datiBuild() {
  const sha = (process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || '').slice(0, 7);
  const ramo = process.env.CF_PAGES_BRANCH || '';
  const d = new Date();
  const data = d.toISOString().slice(0, 10);
  return [data, sha, ramo && ramo !== 'main' ? ramo : ''].filter(Boolean).join(' · ');
}

/* TOYO_PARTNER: JSON { marca: modello } dove il modello è
   - un indirizzo con {url} dentro (il link originale viene messo lì, codificato), oppure
   - pezzi da aggiungere all'indirizzo, che iniziano con & (es. "&partner_id=ABC").
   Un valore sbagliato ferma la build: meglio saperlo subito che avere link rotti. */
function partner() {
  const raw = (process.env.TOYO_PARTNER || '').trim();
  if (!raw) return {};
  let p;
  try { p = JSON.parse(raw); } catch { throw new Error('TOYO_PARTNER non è un JSON valido'); }
  const ok = {};
  for (const [k, v] of Object.entries(p)) {
    if (!/^[a-z0-9]+$/.test(k) || typeof v !== 'string' || !(/^https:\/\/[^\s"'<>]+$/.test(v) && v.includes('{url}') || /^&[^\s"'<>]+$/.test(v)))
      throw new Error(`TOYO_PARTNER.${k}: serve "https://…{url}…" oppure "&param=valore"`);
    ok[k] = v;
  }
  return ok;
}

/* I valori si scrivono dentro stringhe JS: niente apici o a capo che le rompano. */
const sicura = v => String(v || '').replace(/[\\'"\n\r<>]/g, '');

async function build() {
  const t0 = Date.now();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, 'assets'), { recursive: true });

  // ---- statici
  if (existsSync(PUB)) cpSync(PUB, OUT, { recursive: true });

  // ---- CSS
  let css = unisci(join(SRC, 'css'), '.css');
  if (esbuild && !DEV) css = (await esbuild.transform(css, { loader: 'css', minify: true })).code;
  const cssNome = `assets/app.${impronta(css)}.css`;
  writeFileSync(join(OUT, cssNome), css);

  // ---- JS
  let js = unisci(join(SRC, 'js'), '.js')
    .replaceAll("'__SUPABASE_URL__'", `'${sicura(process.env.SUPABASE_URL)}'`)
    .replaceAll("'__SUPABASE_KEY__'", `'${sicura(process.env.SUPABASE_KEY)}'`)
    .replaceAll("'__BUILD__'", `'${sicura(DEV ? 'dev' : datiBuild())}'`)
    .replace('{} /*@PARTNER*/', JSON.stringify(partner()));
  if (/sb_secret_[A-Za-z0-9_-]{8,}/.test(js)) {
    throw new Error('Trovata una chiave Supabase SECRET nel codice: non va mai nel browser.');
  }
  if (esbuild) {
    // Controllo di sintassi sempre; minificazione solo in produzione.
    // format 'iife' NO: lo script deve restare classico, con le variabili globali.
    js = (await esbuild.transform(js, { loader: 'js', minify: !DEV, target: 'es2019', legalComments: 'none' })).code;
  }
  const jsNome = `assets/app.${impronta(js)}.js`;
  writeFileSync(join(OUT, jsNome), js);

  // ---- HTML
  let html = leggi(join(SRC, 'index.html'))
    .replace('<!--@CSS-->', `<link rel="stylesheet" href="/${cssNome}">`)
    .replace('<!--@JS-->', `<script src="/${jsNome}"></script>`);
  writeFileSync(join(OUT, 'index.html'), html);

  // ---- service worker: precache di tutto quello che serve per aprire l'app offline
  const precache = ['/', '/index.html', '/' + cssNome, '/' + jsNome, '/manifest.webmanifest',
    '/icon-192.png', '/icon-512.png', '/icon-512-maskable.png'];
  for (const p of precache) {
    const f = p === '/' ? 'index.html' : p.slice(1);
    if (!existsSync(join(OUT, f))) throw new Error(`Il service worker vuole ${p} ma in dist/ non c'è.`);
  }
  const versione = 'toyo-' + impronta(html + css + js);
  const sw = leggi(join(SRC, 'sw.js'))
    .replace("'__CACHE_VERSION__'", `'${versione}'`)
    .replace("'__PRECACHE__'", JSON.stringify(precache));
  writeFileSync(join(OUT, 'sw.js'), sw);

  const kb = f => (statSync(join(OUT, f)).size / 1024).toFixed(0) + ' KB';
  console.log(`✓ build in ${Date.now() - t0} ms — ${jsNome} (${kb(jsNome)}), ${cssNome} (${kb(cssNome)}), sw ${versione}` +
    (esbuild ? '' : '  [esbuild assente: nessuna minificazione]'));
}

await build();

if (DEV) {
  const tipi = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  const porta = Number(process.env.PORT) || 8788;
  createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = join(OUT, p);
    if (!f.startsWith(OUT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'content-type': tipi[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(readFileSync(f));
  }).listen(porta, () => console.log(`→ http://localhost:${porta}  (le /api/* girano solo con "npm run preview")`));

  let attesa = null;
  for (const d of [SRC, PUB]) watch(d, { recursive: true }, () => {
    clearTimeout(attesa);
    attesa = setTimeout(() => build().catch(e => console.error('✗', e.message)), 120);
  });
}
