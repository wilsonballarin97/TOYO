/* ==========================================================================
   ICONE
   Disegnate, mai emoji. Le emoji cambiano faccia su ogni telefono — su iPhone
   sono a colori e tondeggianti, su Android piatte, su Windows un'altra cosa
   ancora — quindi non si possono allineare, non si possono colorare e non
   stanno mai davvero sulla stessa griglia. Sono la firma più riconoscibile
   dell'interfaccia messa insieme in fretta.
   Tutte su griglia 24, tratto 1.8, estremi arrotondati: si riconoscono come
   una famiglia sola.
   L'emoji del viaggio resta: quella la sceglie chi crea il viaggio, è
   contenuto suo, non arredamento nostro.
   ========================================================================== */
const ICONE = {
  valigia:   '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.2A2.2 2.2 0 0 1 11.2 3h1.6A2.2 2.2 0 0 1 15 5.2V7"/><path d="M3 12h18"/>',
  bussola:   '<circle cx="12" cy="12" r="9"/><path d="M15.2 8.8l-1.9 4.5-4.5 1.9 1.9-4.5z"/>',
  tessera:   '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8.5" cy="11" r="2.2"/><path d="M14 10h4M14 14h4M5.4 16.2c.7-1.4 4-1.4 4.7 0"/>',
  persona:   '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c0-3.9 3.4-5.9 7.5-5.9s7.5 2 7.5 5.9"/>',
  personaPiu:'<circle cx="9" cy="8" r="3.6"/><path d="M2.5 20.5c0-3.6 3-5.6 6.5-5.6s6.5 2 6.5 5.6"/><path d="M17.5 8h5M20 5.5v5"/>',
  persone:   '<circle cx="9" cy="8.5" r="3.3"/><path d="M2.5 20c0-3.4 2.9-5.2 6.5-5.2s6.5 1.8 6.5 5.2"/><path d="M16.5 6.2a3.2 3.2 0 0 1 0 6M18 14.9c2.4.4 3.9 1.9 3.9 4.4"/>',
  luogo:     '<path d="M12 21.2s7-6.5 7-11.2a7 7 0 1 0-14 0c0 4.7 7 11.2 7 11.2z"/><circle cx="12" cy="9.8" r="2.6"/>',
  euro:      '<path d="M17.5 6.2A6.6 6.6 0 0 0 7 11.2v1.6a6.6 6.6 0 0 0 10.5 5"/><path d="M4.6 10.6h7M4.6 13.8h7"/>',
  calendario:'<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  busta:     '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3 7l9 6 9-6"/>',
  bustaGiu:  '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3 7l9 6 9-6"/><path d="M12 10.5v6M9.5 14l2.5 2.5 2.5-2.5"/>',
  matita:    '<path d="M4 20h4l10.5-10.5a2.4 2.4 0 0 0-3.4-3.4L4.6 16.6z"/><path d="M14.5 7.5l2 2"/>',
  cestino:   '<path d="M4 7h16M9.5 7V5.2A1.7 1.7 0 0 1 11.2 3.5h1.6A1.7 1.7 0 0 1 14.5 5.2V7"/><path d="M6.5 7l.9 12a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7"/><path d="M10.5 11v6M13.5 11v6"/>',
  lente:     '<circle cx="10.8" cy="10.8" r="6.8"/><path d="M15.8 15.8L21 21"/>',
  copia:     '<rect x="8.5" y="8.5" width="12" height="12" rx="2.4"/><path d="M15.5 5.5A2 2 0 0 0 13.5 3.5h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2"/>',
  archivio:  '<rect x="3" y="4" width="18" height="4.5" rx="1.6"/><path d="M4.6 8.5v10a2 2 0 0 0 2 2h10.8a2 2 0 0 0 2-2v-10"/><path d="M10 12.5h4"/>',
  graffetta: '<path d="M20 11.5l-8.2 8.2a4.6 4.6 0 0 1-6.5-6.5L14 4.5a3.1 3.1 0 0 1 4.3 4.3l-8.6 8.6a1.5 1.5 0 0 1-2.2-2.2l8-8"/>',
  porta:     '<path d="M14 3.5H6.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2H14"/><path d="M10.5 12h9.5M16.5 8.5l3.5 3.5-3.5 3.5"/>',
  lucchetto: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.4"/><path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9"/>',
  chiave:    '<circle cx="8" cy="15.5" r="4"/><path d="M11 12.8L20 4M17 7l2.5 2.5M14.6 9.2l2.4 2.4"/>',
  ingranaggio:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3L5.5 5.5"/>',
  nuvola:    '<path d="M7 18.5h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 11 3.8 3.8 0 0 0 7 18.5z"/>',
  disco:     '<path d="M4.5 5.5a2 2 0 0 1 2-2h9.6L20.5 8v10.5a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2z"/><path d="M8 3.5v5h7M8 20.5v-6h8v6"/>',
  sincro:    '<path d="M20.5 12a8.5 8.5 0 1 1-2.5-6"/><path d="M20.5 3v5.2h-5.2"/>',
  telefono:  '<rect x="6" y="2.5" width="12" height="19" rx="2.6"/><path d="M10.5 18.5h3"/>',
  piu:       '<path d="M12 5v14M5 12h14"/>',
  freccia:   '<path d="M9 5.5l6.5 6.5L9 18.5"/>',
  spunta:    '<path d="M4.5 12.5l5 5 10-11"/>',
  fatture:   '<path d="M5 3.5h14v17l-2.3-1.6-2.3 1.6-2.4-1.6-2.4 1.6L7.3 19 5 20.5z"/><path d="M8.6 8h6.8M8.6 12h4.6"/>',
  mappa:     '<path d="M9 4.2L3.5 6.5v13.3L9 17.5l6 2.3 5.5-2.3V4.2L15 6.5z"/><path d="M9 4.2v13.3M15 6.5v13.3"/>',
  urna:      '<path d="M4.5 20.5h15M7 20.5V9.5M12 20.5V4.5M17 20.5v-7"/>',
  bandiera:  '<path d="M5.5 21V3.8M5.5 4.6h11.8l-2.2 4 2.2 4H5.5"/>',
  info:      '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6h.01"/>',
  /* --- bacheca ---
     Il cuore esiste in due versioni, vuoto e pieno: il "mi piace" deve
     cambiare FORMA, non solo colore. Chi non distingue bene i colori
     altrimenti non vede nessuna differenza fra prima e dopo il tocco. */
  cuore:     '<path d="M12 20.4S3.6 15.2 3.6 9.4A4.6 4.6 0 0 1 12 6.8a4.6 4.6 0 0 1 8.4 2.6c0 5.8-8.4 11-8.4 11z"/>',
  cuorePien: '<path d="M12 20.4S3.6 15.2 3.6 9.4A4.6 4.6 0 0 1 12 6.8a4.6 4.6 0 0 1 8.4 2.6c0 5.8-8.4 11-8.4 11z" fill="currentColor" stroke-width="1"/>',
  fumetto:   '<path d="M20.5 12.6c0 3.9-3.8 7-8.5 7a10 10 0 0 1-2.6-.34L4 21l1.3-3.6A6.6 6.6 0 0 1 3.5 12.6c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7z"/>',
  fotocamera:'<path d="M3 8.6a2 2 0 0 1 2-2h2.3l1.4-2.1h6.6l1.4 2.1H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.6"/>',
  altro:     '<circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
  blocco:    '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  piuPersona:'<circle cx="9.5" cy="8" r="3.6"/><path d="M3 20.5c0-3.6 3-5.6 6.5-5.6 1.3 0 2.5.3 3.5.8"/><path d="M16 18h6M19 15v6"/>',
  spuntaPers:'<circle cx="9.5" cy="8" r="3.6"/><path d="M3 20.5c0-3.6 3-5.6 6.5-5.6 1.3 0 2.5.3 3.5.8"/><path d="M15.8 18.2l2 2 4-4.4"/>',
  bacheca:   '<path d="M4 5.5A2 2 0 0 1 6 3.5h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6.4L7 20.5v-4H6a2 2 0 0 1-2-2z"/><path d="M8 8h8M8 11.6h5"/>',
  /* --- categorie: un set lineare al posto delle emoji, che cambiavano
     disegno su ogni telefono e non si potevano colorare. --- */
  letto:     '<path d="M3 19V7M3 11.5h18V19M3 15.5h18"/><path d="M21 19v-3.5"/><circle cx="7.5" cy="9.2" r="1.9"/><path d="M10.5 11.5V10a1.8 1.8 0 0 1 1.8-1.8h5.4A1.8 1.8 0 0 1 19.5 10v1.5"/>',
  aereo:     '<path d="M10.6 3.4a1.6 1.6 0 0 1 2.8 0l2 6.2 6.1 2a.9.9 0 0 1 0 1.7l-6.1 2-2 6.2a1.6 1.6 0 0 1-2.8 0l-2-6.2-6.1-2a.9.9 0 0 1 0-1.7l6.1-2z" opacity="0"/><path d="M21 15.5L13.6 12V5.6a1.6 1.6 0 0 0-3.2 0V12L3 15.5v2.2l7.4-2.2v3l-2.2 1.5v1.3l3.8-1 3.8 1v-1.3L13.6 20.5v-3L21 17.7z"/>',
  treno:     '<rect x="5" y="3.5" width="14" height="13" rx="3"/><path d="M5 10.5h14M8.5 20.5l-2 2M15.5 20.5l2 2M6.5 16.5h11"/><circle cx="8.8" cy="13.5" r="1"/><circle cx="15.2" cy="13.5" r="1"/>',
  bus:       '<rect x="4" y="3.5" width="16" height="13.5" rx="2.6"/><path d="M4 10.5h16M7 20.5v-3M17 20.5v-3"/><circle cx="7.8" cy="14" r="1"/><circle cx="16.2" cy="14" r="1"/>',
  auto:      '<path d="M4 16.5v-3l1.9-4.4A2 2 0 0 1 7.7 8h8.6a2 2 0 0 1 1.8 1.1L20 13.5v3"/><path d="M4 13.5h16M5.5 16.5v2.2M18.5 16.5v2.2"/><circle cx="8" cy="16.6" r="0" /><path d="M7 15.5h1.6M15.4 15.5H17"/>',
  nave:      '<path d="M4 14.5l1.5-4.6h13L20 14.5"/><path d="M9 9.9V6.4h6v3.5M12 3.4v3M3 15.5c2.6 0 2.6 2 5.2 2s2.6-2 5.2-2 2.6 2 5.2 2M4.4 19.6c2 0 2 1.4 4 1.4s2-1.4 4-1.4 2 1.4 4 1.4"/>',
  cibo:      '<path d="M7 3.5v8M4.6 3.5v4.2a2.4 2.4 0 0 0 4.8 0V3.5M7 11.5v9"/><path d="M17.5 20.5v-7.8c-1.8 0-2.8-1.4-2.5-3.6.3-2.4 1.4-4.4 2.5-5.6 1.1 1.2 2.2 3.2 2.5 5.6.3 2.2-.7 3.6-2.5 3.6"/>',
  biglietto: '<path d="M3.5 8.5V6.6a1.6 1.6 0 0 1 1.6-1.6h13.8a1.6 1.6 0 0 1 1.6 1.6v1.9a2.8 2.8 0 0 0 0 7v1.9a1.6 1.6 0 0 1-1.6 1.6H5.1a1.6 1.6 0 0 1-1.6-1.6v-1.9a2.8 2.8 0 0 0 0-7z"/><path d="M13.5 5v2M13.5 11v2M13.5 17v2"/>',
  occhio:    '<path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.8"/>',
  occhioNo:  '<path d="M4 4.5l16 15M9.4 6.6A9.8 9.8 0 0 1 12 6.3c5.9 0 9.5 5.7 9.5 5.7a17 17 0 0 1-3.4 3.9M6.3 8.4A16.8 16.8 0 0 0 2.5 12s3.6 5.7 9.5 5.7a9.6 9.6 0 0 0 3.1-.5"/><path d="M10.2 10.4a2.8 2.8 0 0 0 3.7 3.9"/>',
  scudo:     '<path d="M12 3.2l7 2.6v5.4c0 4.3-3 7.5-7 9.6-4-2.1-7-5.3-7-9.6V5.8z"/><path d="M9 12l2.1 2.2L15.2 10"/>',
  salute:    '<path d="M12 3.2l7 2.6v5.4c0 4.3-3 7.5-7 9.6-4-2.1-7-5.3-7-9.6V5.8z"/><path d="M12 8.6v6M9 11.6h6"/>',
  passaporto:'<rect x="5" y="3" width="14" height="18" rx="2.4"/><circle cx="12" cy="10" r="3"/><path d="M9.4 16.4h5.2"/>',
  timbro:    '<path d="M6 20.5h12M6 17.5h12v-1.8a2 2 0 0 0-2-2h-1.2c0-2 1.2-2.6 1.2-4.5a4 4 0 1 0-8 0c0 1.9 1.2 2.5 1.2 4.5H8a2 2 0 0 0-2 2z"/>',
  pacco:     '<path d="M3.5 7.6L12 3.4l8.5 4.2v8.8L12 20.6l-8.5-4.2z"/><path d="M3.5 7.6L12 11.8l8.5-4.2M12 11.8v8.8"/>',
  clessidra: '<path d="M7 3.5h10M7 20.5h10"/><path d="M7.5 3.5c0 4.3 4.5 5.3 4.5 8.5s-4.5 4.2-4.5 8.5M16.5 3.5c0 4.3-4.5 5.3-4.5 8.5s4.5 4.2 4.5 8.5"/>',
  avviso:    '<path d="M12 4.2l8.4 14.6H3.6z"/><path d="M12 9.6v4.2M12 16.6h.01"/>',
  su:        '<path d="M12 20V5M6 11l6-6 6 6"/>',
  giu:       '<path d="M12 4v15M6 13l6 6 6-6"/>',
  stella:    '<path d="M12 3.8l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 10l5.9-.8z"/>',
  chiudi:    '<path d="M6 6l12 12M18 6L6 18"/>',
  cerchio:   '<circle cx="12" cy="12" r="8.5"/>'
};

/* Il tratto non si assottiglia quando l'icona rimpicciolisce: a 16px un tratto
   da 1.8 su griglia 24 è troppo sottile e sparisce. */
function ico(nome, px, colore){
  const d = ICONE[nome];
  if(!d) return '';
  const s = px || 20;
  const w = s <= 15 ? 2.1 : (s <= 18 ? 1.95 : 1.8);
  return '<svg class="ico" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" aria-hidden="true" ' +
    'stroke="' + (colore || 'currentColor') + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
}

/* Uno stato vuoto è una schermata come le altre: icona, una frase che dice
   cosa manca, una riga che spiega perché conviene riempirla. Le sezioni
   bianche con una riga grigia in mezzo erano la parte peggiore dell'app. */
function vuoto(nome, titolo, testo, azione){
  return '<div class="stato-vuoto"><span class="sv-ic">' + ico(nome, 22) + '</span>' +
    '<b>' + titolo + '</b>' +
    (testo ? '<p>' + testo + '</p>' : '') +
    (azione || '') + '</div>';
}
