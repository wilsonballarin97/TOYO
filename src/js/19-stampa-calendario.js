/* ==========================================================================
   PORTARE VIA IL VIAGGIO · stampa e calendario
   Nessun servizio esterno: la pagina di stampa e il file .ics li scriviamo qui.
   ========================================================================== */
function stampaViaggio(t){
  const gruppi = tappePerGiorno(t);
  const pren = (t.prenotazioni || []).slice().sort((a,b) => (a.dal||'9999') < (b.dal||'9999') ? -1 : 1);
  const righe = g => g.lista.map(x => {
    const tp = tipoTappa(x.tipo);
    return '<li><b>' + (x.ora ? esc(x.ora) + ' · ' : '') + esc(x.dove || x.nome || '') + '</b>' +
      '<span> — ' + esc(tp.n) + (x.note ? ' · ' + esc(x.note) : '') + '</span></li>';
  }).join('');
  const html = '<!doctype html><html lang="it"><head><meta charset="utf-8">' +
    '<title>' + esc(t.nome || 'Viaggio') + '</title><style>' +
    'body{font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1d211c;margin:34px;max-width:720px}' +
    'h1{font-size:26px;margin:0 0 4px}h2{font-size:15px;margin:26px 0 6px;border-bottom:1px solid #ddd;padding-bottom:5px}' +
    '.sub{color:#6b7266;margin-bottom:8px}ul{margin:0;padding-left:18px}li{margin:4px 0}span{color:#6b7266}' +
    '@media print{body{margin:12mm}}</style></head><body>' +
    '<h1>' + esc(t.nome || 'Viaggio') + '</h1>' +
    '<div class="sub">' + esc(t.dove || '') + (t.dal ? ' · ' + fmtRange(t.dal, t.al || t.dal) : '') + '</div>' +
    (gruppi.length ? gruppi.map(g => '<h2>' + (g.data ? (g.n ? 'Giorno ' + g.n + ' · ' : '') + fmtDate(g.data) : 'Senza data') +
      '</h2><ul>' + righe(g) + '</ul>').join('') : '<p>Nessuna tappa inserita.</p>') +
    (pren.length ? '<h2>Prenotazioni</h2><ul>' + pren.map(p => '<li><b>' + esc(p.titolo || p.dove || '') + '</b>' +
      '<span> — ' + (p.dal ? fmtDate(p.dal) : 'data da definire') + (p.codice ? ' · codice ' + esc(p.codice) : '') + '</span></li>').join('') + '</ul>' : '') +
    ((t.docs || []).length ? '<h2>Documenti allegati</h2><ul>' + t.docs.map(d => '<li>' + esc(d.nome || d.n || 'Documento') + '</li>').join('') + '</ul>' : '') +
    '</body></html>';
  const w = window.open('', '_blank');
  if(!w){ toast('Il browser ha bloccato la finestra di stampa'); return; }
  w.document.write(html); w.document.close();
  setTimeout(() => { try{ w.focus(); w.print(); }catch(e){} }, 350);
}
function icsViaggio(t){
  const pad = n => String(n).padStart(2, '0');
  const giorno = d => d ? d.replace(/-/g, '') : '';
  const dopo = d => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + 1);
    return x.getFullYear() + pad(x.getMonth()+1) + pad(x.getDate()); };
  const testo = s => String(s || '').replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const ora = s => s ? s.replace(':', '') + '00' : '';
  const ev = [];
  const push = (uidv, dal, al, oraI, titolo, luogo, nota) => {
    if(!dal) return;
    ev.push(['BEGIN:VEVENT', 'UID:' + uidv + '@toyo.app',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z',
      oraI ? 'DTSTART:' + giorno(dal) + 'T' + ora(oraI) : 'DTSTART;VALUE=DATE:' + giorno(dal),
      oraI ? 'DTEND:' + giorno(dal) + 'T' + ora(oraI).replace(/^(\d{2})/, m => pad((+m + 1) % 24))
           : 'DTEND;VALUE=DATE:' + dopo(al || dal),
      'SUMMARY:' + testo(titolo),
      luogo ? 'LOCATION:' + testo(luogo) : '',
      nota ? 'DESCRIPTION:' + testo(nota) : '',
      'END:VEVENT'].filter(Boolean).join('\r\n'));
  };
  if(t.dal) push('v-' + t.id, t.dal, t.al || t.dal, '', (t.nome || 'Viaggio'), t.dove || '', 'Viaggio su TOYO');
  (t.tappe || []).forEach(x => push('t-' + x.id, x.dal, x.al || x.dal, x.ora, x.dove || x.nome || 'Tappa', x.dove || '', x.note || ''));
  (t.prenotazioni || []).forEach(p => push('p-' + p.id, p.dal, p.al || p.dal, '', p.titolo || p.dove || 'Prenotazione', p.dove || '', p.codice ? 'Codice ' + p.codice : ''));
  if(!ev.length){ toast('Metti almeno una data e riprova'); return; }
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//TOYO//IT','CALSCALE:GREGORIAN']
    .concat(ev).concat(['END:VCALENDAR']).join('\r\n');
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = (t.nome || 'viaggio').replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'-').toLowerCase() + '.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Calendario scaricato: aprilo per aggiungere le date');
}
