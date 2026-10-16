(function(){
  var MESI=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  var DOW=['L','M','M','G','V','S','D'];
  function iso(d){var m=d.getMonth()+1,g=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(g<10?'0':'')+g;}
  function parse(v){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
  function open(input){
    var min=parse(input.min), max=parse(input.max), sel=parse(input.value);
    var cur=new Date((sel||min||new Date()).getTime()); cur.setDate(1);
    var ov=document.createElement('div'); ov.className='cal-ov';
    ov.innerHTML='<div class="cal-card" role="dialog" aria-label="Scegli una data">'+
      '<div class="cal-head"><div class="cal-title"></div><div class="cal-nav">'+
      '<button type="button" data-p="-1" aria-label="Mese precedente">‹</button>'+
      '<button type="button" data-p="1" aria-label="Mese successivo">›</button></div></div>'+
      '<div class="cal-dow">'+DOW.map(function(d){return '<span>'+d+'</span>';}).join('')+'</div>'+
      '<div class="cal-grid"></div>'+
      '<div class="cal-foot"><button type="button" class="cal-clear">Cancella</button>'+
      '<button type="button" class="cal-today">Oggi</button></div></div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function(){ov.classList.add('on');});
    var title=ov.querySelector('.cal-title'), grid=ov.querySelector('.cal-grid');
    function close(){ov.classList.remove('on');setTimeout(function(){ov.remove();},170);}
    function commit(v){input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));close();}
    function draw(){
      title.textContent=MESI[cur.getMonth()]+' '+cur.getFullYear();
      var first=(new Date(cur.getFullYear(),cur.getMonth(),1).getDay()+6)%7;
      var days=new Date(cur.getFullYear(),cur.getMonth()+1,0).getDate();
      var todayIso=iso(new Date()), h='';
      for(var i=0;i<first;i++) h+='<button class="empty" disabled></button>';
      for(var g=1;g<=days;g++){
        var d=new Date(cur.getFullYear(),cur.getMonth(),g), v=iso(d);
        var off=(min&&d<min)||(max&&d>max);
        h+='<button type="button" data-v="'+v+'"'+(off?' disabled':'')+' class="'+
          (sel&&iso(sel)===v?'sel ':'')+(v===todayIso?'today':'')+'">'+g+'</button>';
      }
      grid.innerHTML=h;
      var pb=ov.querySelector('[data-p="-1"]'), nb=ov.querySelector('[data-p="1"]');
      pb.disabled=!!(min&&new Date(cur.getFullYear(),cur.getMonth(),0)<min);
      nb.disabled=!!(max&&new Date(cur.getFullYear(),cur.getMonth()+1,1)>max);
    }
    draw();
    ov.addEventListener('click',function(e){
      if(e.target===ov){close();return;}
      var b=e.target.closest('button'); if(!b) return;
      if(b.dataset.p){cur.setMonth(cur.getMonth()+ +b.dataset.p);draw();return;}
      if(b.classList.contains('cal-clear')){commit('');return;}
      if(b.classList.contains('cal-today')){var t=new Date();if((min&&t<min)||(max&&t>max)){cur=new Date(t.getFullYear(),t.getMonth(),1);draw();return;}commit(iso(t));return;}
      if(b.dataset.v) commit(b.dataset.v);
    });
    document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',esc);}});
  }
  function grab(e){
    var i=e.target.closest('input[type="date"]');
    if(!i||i.disabled||i.readOnly) return;
    e.preventDefault(); i.blur();
    if(!document.querySelector('.cal-ov')) open(i);
  }
  document.addEventListener('pointerdown',grab,true);
  document.addEventListener('click',grab,true);
  document.addEventListener('focusin',function(e){
    var i=e.target.closest && e.target.closest('input[type="date"]');
    if(i && !document.querySelector('.cal-ov')){i.blur();open(i);}
  },true);
})();
