/* ==========================================================================
   PARTNER · link di prenotazione con eventuale affiliazione
   Ogni link parte "pulito". Se in TOYO_PARTNER (01-config.js, riempito dalla
   build con la variabile TOYO_PARTNER di Cloudflare) c'è un modello per
   quella marca, il link passa da lì e TOYO riceve una commissione — chi
   prenota paga lo stesso prezzo. I link affiliati sono marcati
   rel="sponsored" e la scheda lo dichiara, come chiedono le regole UE
   sulla pubblicità e i programmi di affiliazione.
   ========================================================================== */
function linkPartner(marca, url){
  const m = TOYO_PARTNER && TOYO_PARTNER[marca];
  if(!m) return {href:url, aff:false};
  if(m.indexOf('{url}') >= 0) return {href:m.replace('{url}', encodeURIComponent(url)), aff:true};
  return {href:url + (url.indexOf('?') >= 0 ? m : '?' + m.slice(1)), aff:true};
}
const haPartner = () => Object.keys(TOYO_PARTNER || {}).length > 0;

/* Gruppo di bottoni: [etichetta, marca, url] */
function gruppoPrenota(tit, icona, voci, primo){
  return `
    <div class="prenota-g">
      <div class="prenota-t">${icona}<span>${tit}</span></div>
      <div class="prenota-l">${voci.map((v, i) => {
        const l = linkPartner(v[1], v[2]);
        return '<a class="btn ' + (i === 0 && primo ? 'btn-primary' : 'btn-ghost') + ' btn-sm" target="_blank" rel="' +
          (l.aff ? 'sponsored noopener' : 'noopener noreferrer') + '" href="' + esc(l.href) + '">' + esc(v[0]) + ' ↗</a>';
      }).join('')}</div>
    </div>`;
}

const NOTA_PARTNER = '<div class="prenota-nota">Alcuni link sono di affiliazione: se prenoti, TOYO può ricevere una piccola commissione. Per te il prezzo non cambia.</div>';
