/* ==========================================================================
   MAPPA · Google Maps
   Senza chiave: mappa Google incorporata sul punto scelto (funziona subito).
   Con la tua chiave API (Impostazioni): mappa unica con tutti i punti e info.
   In ogni caso: "Indicazioni" apre Google Maps col percorso fino al punto.
   ========================================================================== */
let gmap = null, gmarker = [], googleP = null;

/* sulla mappa finiscono sia i punti dell'itinerario sia le prenotazioni geolocalizzate */
function puntiDi(t){
  if(!t) return [];
  const a = (t.tappe || []).filter(x => x.lat && x.lon).map(x => Object.assign({}, x, {
    src:'itinerario', etichetta:x.dove || x.nome, tp:tipoTappa(x.tipo)
  }));
  const b = (t.prenotazioni || []).filter(x => x.lat && x.lon).map(x => Object.assign({}, x, {
    src:'prenotazione', etichetta:x.titolo || x.dove, tp:tipoPren(x.tipo)
  }));
  return a.concat(b).sort((x,y) => (x.dal||'9999') < (y.dal||'9999') ? -1 : 1);
}
function puntoScelto(t){
  const p = puntiDi(t);
  return p.find(x => x.id === V.puntoSel) || p[0] || null;
}
const coord = p => p.lat + ',' + p.lon;
const gmEmbed = p => 'https://www.google.com/maps?q=' + encodeURIComponent(coord(p)) + '&z=13&hl=it&output=embed';
/* percorso completo dentro la mappa incorporata: tutte le tappe in ordine, unite da un tracciato */
function gmEmbedPercorso(p){
  if(!p || p.length < 2) return p && p.length ? gmEmbed(p[0]) : '';
  const q = p.slice(0, 10);
  const saddr = coord(q[0]);
  const daddr = q.slice(1).map(coord).join(' to:');
  return 'https://www.google.com/maps?saddr=' + encodeURIComponent(saddr) +
         '&daddr=' + encodeURIComponent(daddr) + '&hl=it&output=embed';
}
const gmApri  = p => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(coord(p)) +
                     (p.gpid ? '&query_place_id=' + encodeURIComponent(p.gpid) : '');
const gmDir   = p => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(coord(p)) +
                     (p.gpid ? '&destination_place_id=' + encodeURIComponent(p.gpid) : '');
function gmPercorso(t){
  const p = puntiDi(t);
  if(p.length < 2) return p.length ? gmDir(p[0]) : '';
  const mezzo = p.slice(1, -1).map(coord).join('|');
  return 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(coord(p[0])) +
    '&destination=' + encodeURIComponent(coord(p[p.length-1])) +
    (mezzo ? '&waypoints=' + encodeURIComponent(mezzo) : '') + '&travelmode=driving';
}

function caricaGoogle(){
  if(window.google && window.google.maps) return Promise.resolve(true);
  if(!DB.gmapsKey) return Promise.resolve(false);
  if(googleP) return googleP;
  googleP = new Promise(res => {
    const sc = document.createElement('script');
    sc.src = 'https://maps.googleapis.com/maps/api/js?language=it&region=IT&key=' + encodeURIComponent(DB.gmapsKey);
    sc.async = true;
    sc.onload = () => res(!!(window.google && window.google.maps));
    sc.onerror = () => res(false);
    document.head.appendChild(sc);
    setTimeout(() => res(!!(window.google && window.google.maps)), 6000);
  });
  return googleP;
}
function distruggiMappa(){ gmap = null; gmarker = []; }

function disegnaMappa(t){
  if(!t || !DB.gmapsKey) return;
  const host = $('gmap');
  if(!host) return;
  const punti = puntiDi(t);
  if(!punti.length) return;
  caricaGoogle().then(ok => {
    const h = $('gmap');
    if(!h) return;
    if(!ok){
      h.innerHTML = '<div class="card-b empty" style="padding:28px 18px">La chiave Google non funziona o è finita la quota.<br>' +
        'Toglila dalle Impostazioni per tornare alla mappa incorporata.</div>';
      return;
    }
    const centro = puntoScelto(t);
    gmap = new google.maps.Map(h, {
      center:{lat:centro.lat, lng:centro.lon}, zoom:9,
      mapTypeControl:false, streetViewControl:false, fullscreenControl:true,
      styles:[{featureType:'poi.business', stylers:[{visibility:'off'}]}]
    });
    const bounds = new google.maps.LatLngBounds();
    const info = new google.maps.InfoWindow();
    gmarker = [];
    punti.forEach((x,i) => {
      const tp = x.tp || tipoTappa(x.tipo);
      const m = new google.maps.Marker({
        position:{lat:x.lat, lng:x.lon}, map:gmap, title:x.etichetta || x.dove,
        label:{text:String(i+1), color:'#fff', fontSize:'12px', fontWeight:'700'},
        icon:{path:google.maps.SymbolPath.CIRCLE, scale:13, fillColor:tp.c, fillOpacity:1,
              strokeColor:'#fff', strokeWeight:2.5}
      });
      m.addListener('click', () => {
        V.puntoSel = x.id;
        info.setContent(
          '<div style="font-family:Inter,sans-serif;min-width:180px">' +
            '<div style="font-weight:700;font-size:14px;margin-bottom:2px">' + tp.ic + ' ' + esc(x.etichetta || x.dove) + '</div>' +
            '<div style="font-size:12px;color:#5C5148;margin-bottom:8px">' + tp.n +
              (x.src === 'prenotazione' ? ' · prenotazione' : '') +
              (x.dal ? ' · ' + fmtRange(x.dal, x.al || x.dal) : '') + '</div>' +
            '<a href="' + gmDir(x) + '" target="_blank" rel="noopener" style="display:inline-block;background:#C4522E;color:#fff;' +
              'padding:7px 12px;border-radius:var(--r-btn);font-size:12.5px;font-weight:650;text-decoration:none">Indicazioni</a> ' +
            '<a href="' + gmApri(x) + '" target="_blank" rel="noopener" style="display:inline-block;padding:7px 10px;' +
              'font-size:12.5px;font-weight:650;color:#C4522E;text-decoration:none">Apri in Maps</a>' +
          '</div>');
        info.open(gmap, m);
        aggiornaBarraPunto(viaggio());
      });
      gmarker.push({id:x.id, m});
      bounds.extend(m.getPosition());
    });
    if(punti.length > 1){
      new google.maps.Polyline({path:punti.map(x => ({lat:x.lat, lng:x.lon})), map:gmap,
        strokeColor:'#C4522E', strokeOpacity:0, icons:[{icon:{path:'M 0,-1 0,1', strokeOpacity:.9, scale:3},
        offset:'0', repeat:'12px'}]});
      gmap.fitBounds(bounds, 60);
    } else gmap.setZoom(12);
  });
}
function focusTappa(id){
  V.puntoSel = id;
  const t = viaggio();
  const g = gmarker.find(x => x.id === id);
  if(g && gmap){ gmap.panTo(g.m.getPosition()); gmap.setZoom(13); google.maps.event.trigger(g.m, 'click'); return; }
  render();
}
function aggiornaBarraPunto(t){
  const b = $('mapBar');
  if(b) b.innerHTML = barraPunto(t);
}
function barraPunto(t){
  const p = puntoScelto(t);
  if(!p) return '';
  const tp = p.tp || tipoTappa(p.tipo);
  return '<span style="font-weight:650;font-size:13px">' + tp.ic + ' ' + esc(p.etichetta || p.dove) + '</span>' +
    '<span style="font-size:11.5px;color:var(--ink-3)">' + tp.n + (p.src === 'prenotazione' ? ' · prenotazione' : '') +
      (p.dal ? ' · ' + fmtRange(p.dal, p.al || p.dal) : '') + '</span>' +
    '<span class="rt" style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<a class="btn btn-ghost btn-sm" href="' + gmApri(p) + '" target="_blank" rel="noopener">Apri in Maps</a>' +
      '<a class="btn btn-primary btn-sm" href="' + gmDir(p) + '" target="_blank" rel="noopener">' + ico('bussola',16) + '<span>Indicazioni</span></a>' +
    '</span>';
}

/* disegno di riserva quando non c'è rete */
function miniMappa(punti){
  const W = 640, H = 340, P = 54;
  const lats = punti.map(p => p.lat), lons = punti.map(p => p.lon);
  const la0 = Math.min(...lats), la1 = Math.max(...lats);
  const lo0 = Math.min(...lons), lo1 = Math.max(...lons);
  const dLa = (la1 - la0) || 1, dLo = (lo1 - lo0) || 1;
  const X = p => P + ((p.lon - lo0) / dLo) * (W - P*2);
  const Y = p => H - P - ((p.lat - la0) / dLa) * (H - P*2);
  const pts = punti.map(p => [X(p), Y(p)]);
  const linea = pts.length > 1
    ? '<polyline points="' + pts.map(a => a.join(',')).join(' ') + '" fill="none" stroke="#C4522E" stroke-width="2.5" stroke-dasharray="7 7" opacity=".85"/>' : '';
  const griglia = [0,1,2,3,4].map(i =>
    '<line x1="0" y1="' + (H/4*i) + '" x2="' + W + '" y2="' + (H/4*i) + '" stroke="#E3D7C6" stroke-width="1"/>' +
    '<line x1="' + (W/4*i) + '" y1="0" x2="' + (W/4*i) + '" y2="' + H + '" stroke="#E3D7C6" stroke-width="1"/>').join('');
  const nodi = punti.map((p,i) => {
    const x = X(p), y = Y(p), tp = p.tp || tipoTappa(p.tipo);
    const anc = x > W - 110 ? 'end' : 'middle';
    return '<g>' +
      '<circle cx="' + x + '" cy="' + y + '" r="13.5" fill="' + tp.c + '" stroke="#FFFCF8" stroke-width="2.5"/>' +
      '<text x="' + x + '" y="' + (y + 4.5) + '" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">' + (i+1) + '</text>' +
      '<text x="' + x + '" y="' + (y - 21) + '" text-anchor="' + anc + '" font-size="12.5" font-weight="650" fill="#2B2420">' + esc(p.etichetta || p.dove) + '</text>' +
    '</g>';
  }).join('');
  return '<svg class="minimap" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mappa dei punti">' +
    '<rect width="' + W + '" height="' + H + '" fill="#EDE3D5"/>' + griglia + linea + nodi + '</svg>' +
    '<div class="minimap-note">Sei senza rete · questa è la mappa essenziale</div>';
}

/* ---------------------------------------------------------------- GEOCODING */
let geoRis = [];
async function cercaLuogo(){
  const q = val('tDove');
  if(!q){ toast('Scrivi prima dove si trova'); return; }
  const box = $('geoBox');
  box.innerHTML = '<div style="font-size:12.5px;color:var(--ink-3);padding:8px 2px">Cerco “' + esc(q) + '”…</div>';
  try{
    let ris = [];
    if(DB.gmapsKey){
      const r = await fetch('https://maps.googleapis.com/maps/api/geocode/json?language=it&address=' +
        encodeURIComponent(q) + '&key=' + encodeURIComponent(DB.gmapsKey));
      const j = await r.json();
      ris = (j.results || []).slice(0,5).map(x => ({
        nome:x.address_components && x.address_components[0] ? x.address_components[0].long_name : x.formatted_address,
        testo:x.formatted_address, lat:x.geometry.location.lat, lon:x.geometry.location.lng, pid:x.place_id
      }));
    } else {
      /* Prima il proxy su Cloudflare (/api/geocode: cache e User-Agent come
         chiede Nominatim), poi Nominatim diretto se il proxy non c'è
         (file aperto in locale, altro hosting). */
      const qs = 'format=json&limit=5&accept-language=it&q=' + encodeURIComponent(q);
      let r = await fetch('/api/geocode?' + qs).catch(() => null);
      if(!r || !r.ok || !(r.headers.get('content-type') || '').includes('json'))
        r = await fetch('https://nominatim.openstreetmap.org/search?' + qs);
      if(!r.ok) throw new Error('rete');
      ris = (await r.json()).map(x => {
        const parti = x.display_name.split(',');
        return {nome:parti[0].trim(), testo:parti.slice(1,4).join(',').trim(), lat:+x.lat, lon:+x.lon, pid:''};
      });
    }
    geoRis = ris;
    if(!ris.length){
      box.innerHTML = '<div style="font-size:12.5px;color:var(--ink-3);padding:8px 2px">Non ho trovato questo posto. ' +
        'Prova col nome della città, oppure <a href="https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(q) + '" target="_blank" rel="noopener" style="color:var(--terracotta);font-weight:650">cercalo su Google Maps</a>.</div>';
      return;
    }
    box.innerHTML = '<div class="geo-res">' + ris.map((x,i) =>
      '<button type="button" data-act="pick-luogo" data-i="' + i + '"><b>' + esc(x.nome) + '</b>' + esc(x.testo) + '</button>').join('') + '</div>';
  }catch(e){
    box.innerHTML = '<div style="font-size:12.5px;color:var(--ink-3);padding:8px 2px">' +
      'Non riesco a cercare adesso (serve la rete). Puoi salvare lo stesso — il punto resterà senza posizione — ' +
      'oppure usa <b>La mia posizione</b> se sei sul posto.</div>';
  }
}
function usaPosizione(){
  if(!navigator.geolocation){ toast('Il dispositivo non dà la posizione'); return; }
  $('geoBox').innerHTML = '<div style="font-size:12.5px;color:var(--ink-3);padding:8px 2px">Chiedo la posizione…</div>';
  navigator.geolocation.getCurrentPosition(
    pos => segnaLuogo(pos.coords.latitude, pos.coords.longitude, val('tDove') || 'la tua posizione', ''),
    () => { $('geoBox').innerHTML = '<div style="font-size:12.5px;color:var(--ink-3);padding:8px 2px">Posizione non disponibile: forse l\'hai negata al browser.</div>'; },
    {timeout:8000}
  );
}
let tmpLat = null, tmpLon = null, tmpPid = '';
function segnaLuogo(lat, lon, etichetta, pid){
  tmpLat = +lat; tmpLon = +lon; tmpPid = pid || '';
  $('geoBox').innerHTML = '<div class="geo-ok"><span><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.2s7-6.5 7-11.2a7 7 0 1 0-14 0c0 4.7 7 11.2 7 11.2z"/><circle cx="12" cy="9.8" r="2.6"/></svg></span>' +
    '<span><b>' + esc(etichetta) + '</b><br><span style="font-size:11.5px;opacity:.85">' +
      tmpLat.toFixed(4) + ', ' + tmpLon.toFixed(4) + '</span></span>' +
    '<button class="rt" type="button" data-act="togli-luogo" style="font-size:12px;font-weight:650;color:var(--red)">Togli</button></div>';
}
