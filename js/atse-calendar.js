(() => {
  const root = document.getElementById('atse-kalender');
  if (!root) return;
  const $ = id => document.getElementById('calendar-' + id);
  const endpoint = 'https://yktioliukcrrccrfwxad.supabase.co/functions/v1/atse-calendar';
  const localDate = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit'});
  const today = localDate.format(new Date());
  let month = today.slice(0,7), games = [], all = false, loading = false;
  const dateLabel = date => new Intl.DateTimeFormat('de-AT',{dateStyle:'full',timeZone:'UTC'}).format(new Date(date + 'T12:00:00Z'));
  const timeLabel = start => new Intl.DateTimeFormat('de-AT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Vienna'}).format(new Date(start));
  const statusLabel = {scheduled:'Geplant',live:'Live',finished:'Beendet',cancelled:'Abgesagt',postponed:'Verschoben',suspended:'Unterbrochen'};
  function el(tag,text,className) { const node = document.createElement(tag); if (text != null) node.textContent=text; if(className) node.className=className; return node; }
  function render() {
    const filtered = games.filter(g => $('filter').value === 'all' || g.is_home === ($('filter').value === 'home'));
    const current = filtered.filter(g=>g.date?.startsWith(month));
    const first = new Date(month+'-01T12:00:00Z');
    $('month').textContent = new Intl.DateTimeFormat('de-AT',{month:'long',year:'numeric',timeZone:'UTC'}).format(first);
    const grid = $('grid'); grid.replaceChildren();
    for(const day of ['Mo','Di','Mi','Do','Fr','Sa','So']) grid.append(el('div',day,'calendar-weekday'));
    const offset=(first.getUTCDay()+6)%7;
    for(let i=0;i<offset;i++) grid.append(el('div','','calendar-day empty'));
    const count=new Date(first.getUTCFullYear(),first.getUTCMonth()+1,0).getUTCDate();
    for(let day=1;day<=count;day++) {
      const date=month+'-'+String(day).padStart(2,'0');
      const cell=el('div',null,'calendar-day'+(date===today?' is-today':''));
      cell.append(el('span',String(day)));
      for(const g of current.filter(g=>g.date===date)) {
        const a=el('a',(g.is_home?'Heim':'Auswärts')+' · '+(g.start?timeLabel(g.start):'Zeit offen'),g.is_home?'home':'away');
        a.href='#game-'+g.id;
        a.setAttribute('aria-label',g.home+' gegen '+g.away+', '+dateLabel(date));
        a.addEventListener('click',()=>{ if(all){all=false;render();} });
        cell.append(a);
      }
      grid.append(cell);
    }
    $('list-title').textContent=all?'Alle veröffentlichten Spiele':'Spiele im gewählten Monat';
    $('show-all').textContent=all?'Nur diesen Monat anzeigen':'Alle Spiele anzeigen';
    $('show-all').setAttribute('aria-pressed',String(all));
    const list=$('games');list.replaceChildren();
    const selected=all?filtered:current;
    for(const g of selected) {
      const card=el('article',null,'calendar-game'+(g.is_home?'':' away'));card.id='game-'+g.id;
      card.append(el('span',(g.is_home?'Heimspiel':'Auswärtsspiel')+' · '+(statusLabel[g.status]||g.status),'calendar-tag'),el('h4',g.home+' – '+g.away),el('p',g.date?dateLabel(g.date)+(g.start?' · '+timeLabel(g.start)+' Uhr':' · Beginnzeit offen'):'Termin noch offen'),el('p',g.venue||'Spielort noch offen'));
      if(g.home_score!==null && g.away_score!==null) card.append(el('p','Ergebnis: '+g.home_score+' : '+g.away_score));
      card.append(el('p',g.competition));list.append(card);
    }
    if(!selected.length) list.append(el('p','Für diese Auswahl sind derzeit keine Spiele veröffentlicht.'));
    const undated=filtered.filter(g=>!g.date).length;
    if(!all && undated) list.append(el('p',undated+' weitere Spiele ohne bestätigtes Datum findest du unter „Alle Spiele anzeigen“.'));
  }
  async function load() {
    if(loading) return;loading=true;
    try {
      const response=await fetch(endpoint+'?format=json',{cache:'no-store',signal:AbortSignal.timeout(20000)});
      if(!response.ok) throw new Error('Schedule unavailable');
      const data=await response.json();if(!Array.isArray(data.games)) throw new Error('Invalid schedule');
      games=data.games;render();
      $('state').textContent=games.length+' Spiele · automatisch aktualisiert · Stand '+new Intl.DateTimeFormat('de-AT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Vienna'}).format(new Date())+' Uhr';
    } catch {
      $('state').textContent='Spielplan konnte nicht aktualisiert werden.'+(games.length?' Zuletzt geladene Spiele bleiben sichtbar.':' Bitte später erneut versuchen.');
    } finally { loading=false; }
  }
  function move(delta){const d=new Date(month+'-01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+delta);month=d.toISOString().slice(0,7);all=false;render();}
  $('prev').addEventListener('click',()=>move(-1));$('next').addEventListener('click',()=>move(1));
  $('today').addEventListener('click',()=>{month=localDate.format(new Date()).slice(0,7);all=false;render();});
  $('filter').addEventListener('change',render);$('show-all').addEventListener('click',()=>{all=!all;render();});
  $('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(endpoint);$('copy').textContent='Link kopiert';}catch{$('url').focus();$('url').select();$('state').textContent='Die Abo-Adresse ist markiert. Bitte kopieren.';}});
  render();void load();setInterval(()=>{if(!document.hidden)void load();},300000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void load();});
})();
