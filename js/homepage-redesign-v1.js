(() => {
  const root=document.getElementById('home-redesign');if(!root)return;
  const V2='https://yktioliukcrrccrfwxad.supabase.co',V1='https://ekaxdyysefmypkainhij.supabase.co';
  const KEY=window.STB_V2_SHOP_PUBLISHABLE_KEY||'';
  const LEGACY_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';
  const $=id=>document.getElementById(id);
  const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
  const link=(href,text,cls)=>{const a=node('a',text,cls);a.href=href;return a};
  const safeUrl=value=>{try{const u=new URL(value,location.origin);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}};
  const asset=(value,base)=>{if(!value)return null;const own=String(value).replace(/^https?:\/\/(?:www\.)?styrian-bastards\.at(?=\/)/i,'');return safeUrl(/^https?:\/\//i.test(own)||own.startsWith('/')?own:base+'/storage/v1/object/public/public-assets/'+encodeURI(own));};
  const dateLabel=value=>new Intl.DateTimeFormat('de-AT',{dateStyle:'medium',timeZone:'Europe/Vienna'}).format(new Date(value));
  const timeLabel=value=>new Intl.DateTimeFormat('de-AT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Vienna'}).format(new Date(value));
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  async function rpc(base,name,payload={}){const response=await fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:base===V2?KEY:LEGACY_KEY,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error(name);const rows=await response.json();if(!Array.isArray(rows))throw Error('Invalid public projection');return rows;}
  const fulfilled=results=>results.flatMap(r=>r.status==='fulfilled'?r.value:[]);
  let loading=false,lastGames=[];
  function renderGames(games){
    const list=$('games');list.replaceChildren();
    const upcoming=games.filter(g=>g.date>=today()&&!['finished','cancelled'].includes(g.status)&&(!g.start||Date.parse(g.start)>=Date.now())).sort((a,b)=>a.date.localeCompare(b.date)||(a.start||'').localeCompare(b.start||'')).slice(0,3);
    for(const g of upcoming){const d=new Date(g.date+'T12:00:00Z'),card=node('article',null,'hp-game'),head=node('div',null,'hp-game-head'),date=node('div',null,'hp-game-date');date.append(node('strong',String(d.getUTCDate()).padStart(2,'0')));const parts=node('span');parts.append(node('span',new Intl.DateTimeFormat('de-AT',{month:'short',timeZone:'UTC'}).format(d)),node('span',new Intl.DateTimeFormat('de-AT',{weekday:'short',timeZone:'UTC'}).format(d)));date.append(parts);head.append(date,node('span',g.is_home?'HEIMSPIEL':'AUSWÄRTS','hp-badge'+(g.is_home?' hp-is-home':'')));const title=node('h3',g.is_home?g.away:g.home);title.prepend(node('small',g.is_home?'ATSE GRAZ GEGEN':'GEGEN ATSE GRAZ'));const info=node('div',null,'hp-game-info');info.append(node('b',g.start?timeLabel(g.start)+' Uhr':'Beginnzeit offen'),node('span',g.venue||'Spielort noch offen'));card.append(head,title,info);if(['postponed','suspended'].includes(g.status))card.append(node('small',g.status==='postponed'?'Verschoben – Termin bitte beachten':'Unterbrochen'));list.append(card);}
    if(!upcoming.length)list.append(node('p','Derzeit sind keine kommenden Spiele veröffentlicht. Alle Spiele findest du im Kalender.'));
  }
  async function loadGames(){if(loading)return;loading=true;try{const r=await fetch(V2+'/functions/v1/atse-calendar?format=json',{cache:'no-store',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error();const data=await r.json();if(!Array.isArray(data.games))throw Error();lastGames=data.games;renderGames(lastGames);$('sync-state').textContent='Automatisch aus dem Gamecenter aktualisiert · '+timeLabel(new Date())+' Uhr';}catch{$('sync-state').textContent=lastGames.length?'Aktualisierung derzeit nicht möglich · zuletzt geladene Spiele':'Spielplan derzeit nicht verfügbar · bitte Kalender öffnen';if(!lastGames.length)$('games').replaceChildren(link('/atse-kalender.html','Zum vollständigen ATSE-Spielkalender →','hp-text-link'));}finally{loading=false;}}
  let newsLoading=false;
  async function loadSocial(){const response=await fetch(V2+'/functions/v1/social-public-feed',{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Social feed unavailable');const data=await response.json();if(!Array.isArray(data.items))throw Error('Invalid social feed');return data.items.filter(x=>['facebook','instagram'].includes(x.channel)&&x.id&&x.title&&safeUrl(x.permalink)).map(x=>({...x,source:x.channel}));}
  async function loadNews(){
    if(newsLoading)return;newsLoading=true;
    const results=await Promise.allSettled([
      loadSocial(),
      rpc(V2,'news_public_feed_v2',{p_limit:3,p_after:null}).then(rows=>rows.filter(x=>x.title&&x.slug).map(x=>({...x,source:'v2-news',summary:x.teaser,image:/^[0-9a-f-]{36}$/i.test(x.cover_media_id||'')?V2+'/functions/v1/news-public-image?id='+encodeURIComponent(x.cover_media_id):null}))),
      rpc(V2,'get_public_press',{p_limit:3,p_after:null}).then(rows=>rows.filter(x=>x.title).map(x=>({...x,source:'v2',summary:x.teaser,image:asset(x.image_path,V2)}))),
      rpc(V1,'get_public_media_items',{p_category:null,p_limit:3,p_featured_only:false}).then(rows=>rows.filter(x=>x.title).map(x=>({...x,source:'v1',image:asset(x.image_path,V1)})))
    ]);
    const byDate=(a,b)=>(Date.parse(b.published_at||b.publication_date)||0)-(Date.parse(a.published_at||a.publication_date)||0);
    const allItems=fulfilled(results).sort(byDate),selected=[];
    // Reserve the latest item from both social channels before filling the third card.
    for(const channel of ['facebook','instagram']){const latest=allItems.find(x=>x.source===channel);if(latest)selected.push(latest);}
    for(const item of allItems){if(selected.length>=3)break;if(!selected.includes(item))selected.push(item);}
    const items=selected.sort(byDate);
    const list=$('home-news');list.replaceChildren();const seen=new Set();
    for(const x of items){if(list.children.length>=3)break;const identity=x.source+':'+(x.slug||x.id||x.title);if(seen.has(identity))continue;seen.add(identity);
      const card=node('article',null,'hp-news-card');let href=null;
      if(['facebook','instagram'].includes(x.source))href=safeUrl(x.permalink);
      else if(x.source==='v1'&&(x.slug||x.id))href='/presse.html?'+(x.slug?'slug='+encodeURIComponent(x.slug):'id='+encodeURIComponent(x.id));
      else if(x.slug)href='/presse.html?source='+x.source+'&slug='+encodeURIComponent(x.slug);
      const art=node('div',null,'hp-news-art');if(x.image){const img=node('img');img.src=x.image;img.alt=x.title;img.loading='lazy';img.addEventListener('error',()=>{img.remove();art.classList.add('hp-news-placeholder');art.textContent='STYRIAN BASTARDS';});art.append(img);}else{art.classList.add('hp-news-placeholder');art.textContent='STYRIAN BASTARDS';}
      const body=node('div',null,'hp-news-body');const published=x.published_at||x.publication_date;const label=published&&Number.isFinite(Date.parse(published))?dateLabel(published)+' · ':'';
      body.append(node('span',label+({facebook:'FACEBOOK',instagram:'INSTAGRAM','v2-news':'VEREINSNEWS'}[x.source]||'PRESSE & MEDIEN'),'hp-news-meta'),node('h3',x.title),node('p',String(x.summary||x.teaser||'Neuigkeiten rund um die Styrian Bastards und den ATSE Graz.').slice(0,220)));
      if(href){const a=link(href,x.source==='facebook'?'Auf Facebook ansehen ↗':x.source==='instagram'?'Auf Instagram ansehen ↗':'Beitrag lesen ↗','hp-article-open');if(['facebook','instagram'].includes(x.source)){a.target='_blank';a.rel='noopener noreferrer';}body.append(a);}card.append(art,body);list.append(card);
    }
    $('home-news-state').textContent=list.children.length?(results[0].status==='fulfilled'?'Aktuelles von Facebook, Instagram und den Styrian Bastards.':'Social-Media-Beiträge derzeit nicht verfügbar. Weitere News und Medienberichte:'):results.every(r=>r.status==='rejected')?'Neuigkeiten konnten nicht geladen werden. Bitte später erneut versuchen.':'Aktuell sind keine Neuigkeiten veröffentlicht.';newsLoading=false;
  }
  async function loadPartners(){const results=await Promise.allSettled([
    rpc(V1,'get_public_sponsors').then(rows=>rows.map(x=>({name:x.name,website:x.website,logo:asset(x.logo_path,V1),order:x.public_sort_order}))),
    rpc(V2,'get_public_sponsors').then(rows=>rows.map(x=>({name:x.public_name,website:x.public_website,logo:asset(x.public_logo_path,V2),order:x.public_sort_order})))
  ]);const unique=new Map();for(const p of fulfilled(results))if(p.name)unique.set(p.name.trim().toLocaleLowerCase('de'),p);const list=$('home-partners');list.replaceChildren();
    for(const p of [...unique.values()].sort((a,b)=>Number(a.order||0)-Number(b.order||0))){const href=safeUrl(p.website?.match(/^https?:/)?p.website:p.website?'https://'+p.website:'');const card=href?link(href,null,'hp-partner-logo-tile'):node('div',null,'hp-partner-logo-tile');if(href){card.target='_blank';card.rel='noopener noreferrer';}if(p.logo){const img=node('img');img.src=p.logo;img.alt=p.name;img.loading='lazy';img.addEventListener('error',()=>{img.remove();card.prepend(node('strong',p.name,'hp-partner-name'));});card.append(img);}else card.append(node('strong',p.name,'hp-partner-name'));card.append(node('span',p.name+(href?' ↗':'')));list.append(card);}
    if(!list.children.length)list.append(link('/sponsoren.html','Unsere Partner kennenlernen →','hp-text-link'));
  }
  async function loadShop(){try{const products=await rpc(V2,'get_public_shop_products',{p_limit:100,p_offset:0,p_category:null});const list=$('product-peeks');list.replaceChildren();for(const p of products.filter(x=>x.availability!=='unavailable').slice(0,2)){const a=link('/merch.html?source=v2&id='+encodeURIComponent(p.product_id),null,'hp-product-peek');const image=asset(p.primary_image_path,V2);if(image){const img=node('img');img.src=image;img.alt=p.primary_image_alt_text||p.name;img.loading='lazy';img.addEventListener('error',()=>img.remove());a.append(img);}const copy=node('div');copy.append(node('span',p.category||'FANARTIKEL','hp-product-category'),node('strong',String(p.name||'Fanartikel').replace(/🔥/g,'').trim()));a.append(copy);if(p.display_price_cents!=null&&Number.isFinite(Number(p.display_price_cents)))a.append(node('span',new Intl.NumberFormat('de-AT',{style:'currency',currency:p.currency||'EUR'}).format(Number(p.display_price_cents)/100),'hp-product-price'));list.append(a);}if(!list.children.length)list.append(node('p','Alle aktuellen Fanartikel findest du in unserem Shop.'));$('shop-source').textContent='Aktuelle Shopartikel · Details und Verfügbarkeit im Shop.';}catch{$('shop-source').textContent='Shopartikel konnten nicht geladen werden. Unser Shop ist über den Button erreichbar.';}}
  async function loadAbo(){try{const rows=await rpc(V2,'get_public_abo_campaign');const c=rows[0];if(c?.homepage_visible!==true)return;$('saisonabo').hidden=false;const season=c.season_label||c.season||'';$('home-abo-season').textContent=/^20\d{2}[/-]\d{2,4}$/.test(String(season))?String(season):'ATSE GRAZ';if(c.sales_open===false||Number(c.available_quantity)<1){$('home-abo-copy').textContent='Der Abo-Verkauf ist derzeit pausiert oder das Kontingent ausgeschöpft. Aktuelle Informationen findest du auf der Abo-Seite.';$('saisonabo').querySelector('a').textContent='Aktuelle Abo-Informationen ↗';}}catch{$('saisonabo').hidden=true;}}
  async function loadEvents(){const results=await Promise.allSettled([
    rpc(V1,'get_public_events').then(rows=>rows.map(x=>({...x,source:'v1'}))),rpc(V2,'get_public_events',{p_limit:50,p_after:null,p_after_id:null}).then(rows=>rows.map(x=>({...x,source:'v2'})))
  ]);const items=fulfilled(results).filter(e=>e.title&&Number.isFinite(Date.parse(e.starts_at||e.event_date))&&String(e.starts_at||e.event_date).slice(0,10)>=today()).sort((a,b)=>String(a.starts_at||a.event_date).localeCompare(String(b.starts_at||b.event_date))).slice(0,3);const list=$('home-events');list.replaceChildren();if(!items.length){list.append(node('p',results.every(r=>r.status==='rejected')?'Veranstaltungen konnten nicht geladen werden. Frag uns nach den nächsten Aktionen.':'Neue Fanclub-Veranstaltungen geben wir hier bekannt.'));return;}const ul=node('ul',null,'hp-event-list');for(const e of items){const li=node('li');li.append(node('time',dateLabel(e.starts_at||e.event_date)),e.source==='v1'?link('/event.html?id='+encodeURIComponent(e.id),e.title):node('span',e.title));if(e.location_name||e.location)li.append(node('small',String(e.location_name||e.location)));ul.append(li);}list.append(ul);}
  // Preserve the original fixed navigation and reserve exactly its actual height.
  function syncHeader(){const nav=document.querySelector('#navbar .sb-navbar');if(nav)root.style.setProperty('--hp-nav-height',Math.ceil(nav.getBoundingClientRect().height)+'px');}
  const headerObserver=new MutationObserver(()=>{syncHeader();const nav=document.querySelector('#navbar .sb-navbar');if(nav){new ResizeObserver(syncHeader).observe(nav);headerObserver.disconnect();}});headerObserver.observe($('navbar'),{childList:true,subtree:true});window.addEventListener('resize',syncHeader);syncHeader();
  void loadGames();void loadNews();void loadPartners();void loadShop();void loadAbo();void loadEvents();
  setInterval(()=>{if(!document.hidden){void loadGames();void loadNews();}},300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){void loadGames();void loadNews();}});
})();
