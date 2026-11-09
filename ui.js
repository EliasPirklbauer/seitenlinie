'use strict';
/* =========================================================
   SEITENLINIE – Oberfläche
   ========================================================= */
let UI={view:'home',modal:null,live:null,setup:null,tf:{pos:'',max:'',q:'',tab:'plan',nat:''},mdView:null,selSlot:null,toast:null,sortK:'pos',tableLeague:null,world:{confed:'UEFA',assoc:null},loading:null,meta:null,oldSave:false};

/* ---------- Installierbare Web-App (PWA) ---------- */
const PWA={deferred:null,update:null,
  standalone:(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true,
  ios:/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),
  swOK:'serviceWorker' in navigator&&/^https?:$/.test(location.protocol)};
if(PWA.swOK){
  const hadController=!!navigator.serviceWorker.controller;let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||reloading)return;reloading=true;location.reload()});
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').then(reg=>{
      PWA.reg=reg;
      if(reg.waiting&&navigator.serviceWorker.controller){PWA.update=reg.waiting;render()}
      reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){PWA.update=w;render()}})});
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&navigator.onLine)reg.update().catch(()=>{})});
    }).catch(()=>{PWA.swOK=false});
  });
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();PWA.deferred=e;if(!UI.setup)render()});
window.addEventListener('appinstalled',()=>{PWA.deferred=null;toast('App installiert!')});
window.addEventListener('online',()=>{if(!UI.setup&&UI.view!=='live')render()});
window.addEventListener('offline',()=>{if(!UI.setup&&UI.view!=='live')render()});
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{})}catch(e){}
function updateBanner(){return PWA.update?`<div class="upd">🔄 Neue Version verfügbar <button class="btn sm pri" data-act="applyUpdate">Aktualisieren</button></div>`:''}
function installCard(){
  let body;
  if(PWA.standalone)body='<p class="good">✓ Läuft als installierte App – auch ohne Internet.</p>';
  else if(PWA.deferred)body='<p class="small muted">Installiere Seitenlinie als App: eigenes Symbol, Vollbild, startet auch offline.</p><button class="btn pri" data-act="install">📲 App installieren</button>';
  else if(PWA.ios)body='<p class="small">So installierst du die App auf iPhone/iPad:</p><ol class="small" style="margin:6px 0 0;padding-left:20px"><li>Diese Seite in <b>Safari</b> öffnen</li><li>Auf das <b>Teilen-Symbol</b> ⬆️ tippen</li><li><b>„Zum Home-Bildschirm“</b> wählen</li></ol>';
  else if(PWA.swOK)body='<p class="small">Im Browser-Menü <b>„App installieren“</b> wählen (Chrome/Edge: Symbol rechts in der Adressleiste).</p>';
  else body='<p class="small muted">Installieren geht nur über die Webadresse (https). Als lokale Datei läuft das Spiel trotzdem offline im Browser.</p>';
  return `<div class="card"><h3>Als App installieren</h3>${body}<p class="small muted" style="margin-top:10px">Die installierte App hat einen eigenen Speicher. Spielstände überträgst du per Export/Import.</p></div>`;
}

/* ---------- Grundgerüst ---------- */
const ICONS={
 staff:'<circle cx="12" cy="7" r="3"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/><path d="M4 11h3M17 11h3"/>',
 media:'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M7 8.5h10M7 12h5M7 15.5h5"/><rect x="13.5" y="11.5" width="3.5" height="4" rx=".5"/>',
 training:'<path d="M12 3 7.5 20h9z"/><path d="M5 20h14"/><path d="M9.4 13h5.2M10.6 8.5h2.8"/>',
 stats:'<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
 home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
 squad:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2c2.8.3 5 2.6 5 5.8"/>',
 tactic:'<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M4 12h16"/><circle cx="12" cy="12" r="2.6"/><path d="M9 3v3h6V3M9 21v-3h6v3"/>',
 fixtures:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M12 14h2M8 17h2"/>',
 table:'<path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 4v16"/>',
 calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="8.5" cy="14.5" r="1.2"/><circle cx="12" cy="14.5" r="1.2"/><circle cx="15.5" cy="14.5" r="1.2"/>',
 transfers:'<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>',
 finance:'<ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/><path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
 cups:'<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 3.5M17 6h2.5a2.5 2.5 0 0 1-2.6 3.5"/><path d="M12 14v3M8.5 20.5h7l-.8-3.5H9.3z"/>',
 world:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z"/>',
 menu:'<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/>'};
const icon=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
const NAV=[['home','Übersicht'],['media','Medien'],['squad','Kader'],['tactic','Taktik'],['training','Training'],['fixtures','Spielplan'],['calendar','Kalender'],['table','Tabelle'],['stats','Statistiken'],['transfers','Transfers'],['staff','Mitarbeiter'],['finance','Finanzen'],['cups','Wettbewerbe'],['world','Welt'],['menu','Menü']];
function modalHtml(){return UI.modal?`<div class="ov" data-act="closeModal"><div class="modal" data-stop="1">${UI.modal()}</div></div>`:''}
function toastHtml(){return UI.toast?`<div class="toast">${UI.toast}</div>`:''}
function render(){
  const app=document.getElementById('app');
  if(UI.loading){app.innerHTML=`<div class="title"><div class="card" style="text-align:center;max-width:420px"><div style="font-size:40px">🌍</div><h2>${UI.loading}</h2><p class="muted small">Einen Moment – Vereine, Kader und Spielpläne werden erzeugt.</p></div></div>`;return}
  if(!S||S.user===null){app.innerHTML=(UI.setup?renderSetup():renderTitle())+updateBanner()+modalHtml()+toastHtml();return}
  const c=userClub(),v=UI.view;
  let body='';
  if(v==='live')body=renderLive();
  else if(v==='matchday')body=renderWeekResults();
  else if(v==='season')body=renderSeasonEndScreen();
  else if(S.fired)body=renderFired();
  else body=({home:renderHome,squad:renderSquad,tactic:renderTactic,fixtures:renderFixtures,calendar:renderCalendar,table:renderTable,staff:renderStaff,training:renderTraining,fans:renderFans,media:renderMedia,stats:renderStats,transfers:renderTransfers,finance:renderFinance,cups:renderCups,world:renderWorld,menu:renderMenu}[v]||renderHome)();
  const nav=NAV.map(([k,l])=>`<a class="${v===k?'on':''}" data-act="nav" data-v="${k}" href="#" aria-label="${l}">${icon(k)}<span>${l}</span></a>`).join('');
  const inLive=v==='live'&&UI.live&&!UI.live.done,over=S.week>=S.weeks;
  const adv=inLive?'':over?`<button class="btn pri adv" data-act="toSeason">Saisonende ▶</button>`:`<button class="btn pri adv" data-act="advance">Weiter ▶</button>`;
  const vt=(NAV.find(x=>x[0]===v)||[0,''])[1];
  app.innerHTML=`<div class="shell" style="--club:${c.colors[0]};--club2:${c.colors[1]}">
   <header class="top">
     <div class="brand"><i></i>Seitenlinie</div>
     <div class="club">${badge(c,30)}<div style="min-width:0"><b>${esc(c.name)}</b><div class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(league(c).name)} · ${S.season}/${(S.season+1)%100}</div></div></div>
     <div class="meta">${navigator.onLine?'':'<span class="pill" title="Kein Internet – das Spiel läuft trotzdem">📴</span>'}<div class="stat hide-m pro-only"><span>${WDAY_LONG[wdayIso(gameDate(S.week))]}</span><b>${fmtDate(gameDate(S.week))}</b></div><div class="stat hide-m"><span>Woche</span><b>${Math.min(S.week+1,S.weeks)} / ${S.weeks}</b></div><div class="stat hide-m pro-only"><span>Kontostand</span><b>${money(c.budget)}</b></div><div class="stat hide-m"><span>Transferbudget</span><b>${money(c.tBudget)}</b></div>${adv}</div>
   </header>
   <nav class="side nav">${nav}</nav>
   <main class="main"><div class="crumb pro-only">${esc(c.name)} <span>›</span> ${esc(vt||'')}</div>${body}</main>
   <nav class="bnav">${nav}</nav>
  </div>${updateBanner()}${modalHtml()}${toastHtml()}`;
}
function toast(msg){UI.toast=msg;render();clearTimeout(toast.t);toast.t=setTimeout(()=>{UI.toast=null;render()},2400)}

/* ---------- Titel ---------- */
function slotsHtml(){
  const l=slotsList().sort((a,b)=>(b.ts||0)-(a.ts||0));if(!l.length)return '';const cur=curSlot();
  const when=ts=>{if(!ts)return '';const d=new Date(ts);return d.toLocaleDateString('de-DE')+' '+d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})};
  return `<div class="svslots"><div class="small muted" style="text-align:left;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Deine Karrieren (${l.length})</div>${l.map(x=>`<div class="svslot ${x.id===cur?'cur':''}">
    <span class="badge" style="background:${(x.colors||['#445','#fff'])[0]};color:${(x.colors||['#445','#fff'])[1]};border-color:${(x.colors||['#445','#fff'])[1]};width:34px;height:34px;font-size:13px">${esc(x.short||(x.club||'?').slice(0,3).toUpperCase())}</span>
    <div class="svinfo"><b>${esc(x.name||x.club)}</b>${x.fired?' <span class="pill">vereinslos</span>':''}<div class="small muted">${x.name?esc(x.club)+' · ':''}${esc(x.league)} · ${x.season}/${(x.season+1)%100} · Woche ${Math.min(x.week+1,x.weeks)}${x.manager?' · '+esc(x.manager):''}</div><div class="small muted">Zuletzt gespielt: ${when(x.ts)}</div></div>
    <div class="svbtn">${UI.delSlot===x.id?`<button class="btn sm warn" data-act="slotDelYes" data-v="${x.id}">Wirklich löschen</button><button class="btn sm" data-act="slotDelNo">Abbrechen</button>`:`<button class="btn sm pri" data-act="slotLoad" data-v="${x.id}">Laden</button><button class="btn sm" data-act="slotRen" data-v="${x.id}" title="Umbenennen">✏️</button><button class="btn sm" data-act="slotDel" data-v="${x.id}" title="Löschen">🗑️</button>`}</div></div>`).join('')}</div>`;
}
function renderTitle(){
  const m=slotsList().length;
  return `<div class="title"><div class="card" style="max-width:${m?620:460}px;width:100%;text-align:center;padding:34px 28px 28px">
   <div class="lamps"><i></i><i></i><i></i><i></i><i></i></div><h1 class="wordmark">Seitenlinie</h1><div class="chalk"></div><p class="muted" style="margin:0">Dein Fußball Manager für 211 Verbände – auch ohne Internet.</p>
   <div class="grid" style="margin-top:20px">
    ${slotsHtml()}
    <button class="btn ${m?'':'pri'}" style="justify-content:center;padding:12px" data-act="newCareer">＋ Neue Karriere</button>
    <button class="btn" style="justify-content:center" data-act="importOpen">Spielstand importieren</button>
   </div>
   ${UI.oldSave&&!m&&false?'<p class="small gold" style="margin-top:14px">Hinweis: Karrieren aus Version 0.3 und älter (fiktive Einzel-Liga) lassen sich in der neuen Weltversion nicht fortsetzen.</p>':''}
   ${!PWA.standalone&&(PWA.deferred||PWA.ios)?`<div style="margin-top:16px">${PWA.deferred?'<button class="btn" style="width:100%;justify-content:center" data-act="install">📲 Als App installieren</button>':'<p class="small muted">📲 Als App installieren: in Safari Teilen ⬆️ → „Zum Home-Bildschirm“</p>'}</div>`:''}
  </div></div>`;
}

/* ---------- Karrierestart: Verein wählen, dann Welt ---------- */
function assocLeaguesInfo(code){const st=assocStructure(code,UI.setup.seed);return st}
function renderSetup(){
  const st=UI.setup;
  return st.step==='world'?renderSetupWorld():renderSetupClub();
}
function confedTabs(cur,act){return `<div class="seg" style="margin-bottom:10px">${CONFEDS.map(c=>`<button class="${cur===c.id?'on':''}" data-act="${act}" data-v="${c.id}" title="${c.region}">${c.name}</button>`).join('')}</div>`}
function renderSetupClub(){
  const st=UI.setup;
  const q=(st.q||'').toLowerCase();
  const list=ASSOCS.filter(a=>a.confed===st.confed&&(!q||a.name.toLowerCase().includes(q))).sort((a,b)=>b.str-a.str);
  const assocList=list.map(a=>{const d=LEAGUE_DATA[a.code]||{};const nl=d.noLeague;const L=nl?[]:assocLeaguesInfo(a.code);
    return `<div class="card clubpick ${st.assoc===a.code?'on':''}" style="padding:10px" data-act="pickAssoc" data-v="${a.code}"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b>${esc(a.name)}</b><span class="small gold">${stars(a.str)}</span></div><div class="small muted">${nl?'keine eigene Liga':L.length+(L.length>1?' Ligen':' Liga')+' · '+L.reduce((s,l)=>s+l.clubs.length,0)+' Vereine'}${d.clubs?' · echte Vereine':''}</div></div>`}).join('');
  let right='<p class="muted">Wähle links einen Verband.</p>';
  if(st.assoc){
    const a=ASSOC[st.assoc],d=LEAGUE_DATA[st.assoc]||{};
    if(d.noLeague)right=`<div class="card"><h2>${esc(a.name)}</h2><p>${esc(d.info)}</p></div>`;
    else{
      const L=assocLeaguesInfo(st.assoc);const tier=Math.min(st.tier,L.length);const lt=L[tier-1];
      const cards=lt.clubs.map((nm,i)=>{const rep=repFor(a,tier,i,lt.clubs.length),econ=econOf(st.assoc,tier),staff=staffForAssoc(nm,st.seed,st.assoc),col=clubColors(nm);
        const fake={colors:col,short:shortName(nm)};const sel=st.pick&&st.pick.code===st.assoc&&st.pick.tier===tier&&st.pick.idx===i;
        return `<div class="card clubpick ${sel?'on':''}" data-act="pickClub" data-i="${i}"><div class="row" style="flex-wrap:nowrap">${badge(fake,34)}<div style="min-width:0"><b>${esc(nm)}</b><div class="small gold">${stars(rep)}</div></div></div>
          <div class="small" style="margin-top:6px">Budget ca. <b>${money(estBudget(rep,econ))}</b> · Stadion ${estStadium(rep,econ).toLocaleString('de-DE')}</div>
          <div class="small muted">Präsident: ${PRES[staff.pres.trait].label} · Sportdir.: ${DIR[staff.dir.trait].label}</div></div>`}).join('');
      right=`<div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(a.name)}</h2><span class="small muted">${a.confed}</span></div>
       <div class="seg" style="margin:10px 0">${L.map(l=>`<button class="${l.tier===tier?'on':''}" data-act="pickTier" data-v="${l.tier}">${esc(l.name)}</button>`).join('')}</div>
       ${lt.real?'':'<p class="small muted">Vereine dieser Liga sind nach echten Städten benannt.</p>'}
       <div class="grid g3">${cards}</div>`;
    }
  }
  const sel=st.pick;
  return `<div class="main" style="margin:auto;padding-top:calc(18px + var(--sat));max-width:1300px">
   <div class="row" style="justify-content:space-between"><h2>Neue Karriere · 1/2 Verein wählen</h2><button class="btn sm" data-act="backTitle">Zurück</button></div>
   <div class="card" style="margin-bottom:12px"><div class="row"><div style="flex:1;min-width:200px"><label class="f">Dein Managername</label><input id="mgrName" value="${esc(st.name)}" placeholder="z. B. Elias" style="width:100%"></div></div></div>
   ${confedTabs(st.confed,'setConfed')}
   <div class="setup-grid"><div><input placeholder="Verband suchen…" value="${esc(st.q||'')}" data-chg="assocQ" style="width:100%;margin-bottom:8px"><div class="grid assoc-list">${assocList||'<p class="muted">Kein Verband gefunden.</p>'}</div></div><div id="assocRight">${right}</div></div>
   <div class="sticky-cta">
    <button class="btn pri" style="width:100%;justify-content:center;padding:13px" data-act="toWorldStep" ${sel?'':'disabled'}>${sel?'Weiter mit '+esc(assocStructure(sel.code,st.seed)[sel.tier-1].clubs[sel.idx])+' ▶':'Verein auswählen'}</button>
   </div></div>`;
}
function worldSize(codes){let clubs=0;for(const c of codes)assocStructure(c,UI.setup.seed).forEach(l=>clubs+=l.clubs.length);return {clubs,players:clubs*27}}
const PRESETS=[
 ['Nur mein Land',()=>[]],
 ['Top 5 Europas',()=>['ENG','ESP','GER','ITA','FRA']],
 ['Europa Top 12',()=>['ENG','ESP','GER','ITA','FRA','POR','NED','BEL','TUR','AUT','SUI','SCO']],
 ['Südamerika',()=>['BRA','ARG','COL','URU','CHI','ECU','PAR','PER']],
 ['Weltweit Top 15',()=>['ENG','ESP','GER','ITA','FRA','POR','NED','BRA','ARG','USA','MEX','KSA','JPN','TUR','BEL']],
];
function renderSetupWorld(){
  const st=UI.setup,act=st.active,size=worldSize([...act]);
  const warn=size.players>9000?'bad':size.players>5000?'gold':'good';
  const conf=st.wconfed||st.confed;
  const list=ASSOCS.filter(a=>a.confed===conf&&!(LEAGUE_DATA[a.code]||{}).noLeague).sort((a,b)=>b.str-a.str).map(a=>{
    const on=act.has(a.code),locked=a.code===st.pick.code;
    return `<label class="card clubpick ${on?'on':''}" style="padding:8px 10px;display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" data-chg="actToggle" data-v="${a.code}" ${on?'checked':''} ${locked?'disabled':''}><span style="flex:1"><b>${esc(a.name)}</b> <span class="small gold">${stars(a.str)}</span><br><span class="small muted">${assocStructure(a.code,st.seed).map(l=>esc(l.name)).join(' · ')}</span></span></label>`}).join('');
  return `<div class="main" style="margin:auto;padding-top:calc(18px + var(--sat));max-width:1100px">
   <div class="row" style="justify-content:space-between"><h2>Neue Karriere · 2/2 Welt einrichten</h2><button class="btn sm" data-act="backClubStep">◀ Zurück</button></div>
   <div class="card" style="margin-bottom:12px"><p style="margin:0">Alle <b>211 Verbände</b> sind dabei. Die Länder, die du hier auswählst, werden <b>voll simuliert</b>: echte Spielpläne, Kader und Transfers. Alle anderen laufen im Hintergrund mit, dort wird pro Saison nur der Meister ermittelt.</p>
    <div class="row" style="margin-top:10px">${PRESETS.map((p,i)=>`<button class="btn sm" data-act="preset" data-i="${i}">${p[0]}</button>`).join('')}</div>
    <div class="small" style="margin-top:10px">Aktiv: <b>${act.size}</b> Länder · ca. <b>${size.clubs}</b> Vereine · <b class="${warn}">${size.players.toLocaleString('de-DE')}</b> Spieler ${size.players>9000?'– auf Handys/iPads spürbar langsamer':size.players>5000?'– auf älteren Handys etwas langsamer':''}</div></div>
   ${confedTabs(conf,'setWConfed')}
   <div class="grid g3">${list}</div>
   <div class="sticky-cta">
    <button class="btn pri" style="width:100%;justify-content:center;padding:13px" data-act="startCareer">Karriere starten ▶</button></div></div>`;
}

/* ---------- Übersicht ---------- */
function nextUserGames(){
  const list=[];const nx=nextUserMatch();if(nx)list.push({w:nx.w,m:nx.m,comp:null,order:0,wh:whenOf('league',league(userClub()),nx.r,nx.m)});
  for(const f of userCompFixtures())if(f.m.hg===null&&f.w>=S.week)list.push({w:f.w,m:f.m,comp:f.C,label:COMP[f.C.key].short+' · '+f.label,order:1,wh:whenOf('comp',f.C,f.r,f.m)});
  for(const f of userNatCupFixtures())if(f.m.hg===null&&f.w>=S.week)list.push({w:f.w,m:f.m,comp:f.cup,label:f.cup.name+' · '+f.label,order:2,wh:whenOf('cup',f.cup,f.r,f.m)});
  for(const f of userSupercupFixtures())if(f.m.hg===null&&f.w>=S.week)list.push({w:f.w,m:f.m,comp:f.sc,label:f.sc.name+' · '+f.label,order:-1,wh:whenOf('sc',f.sc,f.r,f.m)});
  const k=g=>g.wh?g.wh.d+' '+g.wh.t:'';
  return list.sort((a,b)=>a.w-b.w||(k(a)<k(b)?-1:k(a)>k(b)?1:a.order-b.order)).filter((g,i,arr)=>g.w===arr[0].w);
}
function renderHome(){
  const c=userClub(),L=league(c),tab=tableOf(L),rank=tab.findIndex(r=>r.id===S.user)+1,me=tab[rank-1];
  const nx=nextUserMatch(),ng=nextUserGames();
  let next='<p class="muted">Die Saison ist beendet. Tippe auf „Saisonende“.</p>';
  if(ng.length){
    const g=ng[0],m=g.m,opp=club(m.h===S.user?m.a:m.h),home=m.h===S.user;const co=COACH[opp.staff.coach.trait];
    const wait=g.w>S.week?`<div class="pill wrap" style="margin-bottom:8px">Diese Woche spielfrei – nächstes Spiel am ${fmtWhenShort(g.wh)}</div>`:'';
    const more=ng.length>1&&ng[1].w===g.w?`<div class="pill wrap" style="margin-bottom:8px;border-color:var(--gold)">Englische Woche: ${ng.map(x=>fmtWhenShort(x.wh)).join(' & ')}</div>`:'';
    const sub=g.comp?`${esc(g.label)} · ${esc(leagueName(opp))}`:`${nx.r+1}. Spieltag · Platz ${tab.findIndex(r=>r.id===opp.id)+1}`;
    const hc=home?c:opp,ac=home?opp:c;
    next=`${wait}${more}<div class="nxwhen"><b>${fmtWhenLong(g.wh)}</b><span>Anstoß ${g.wh?g.wh.t:''} Uhr</span></div><div class="small muted" style="text-align:center">${sub}</div>
    <div class="vs"><div class="team">${badge(hc,54)}<b>${esc(hc.name)}</b><span class="small muted">Stärke ${clubAvg(hc)}</span></div><div class="mid">vs<small>${home?'Heimspiel':'Auswärtsspiel'}</small></div><div class="team">${badge(ac,54)}<b>${esc(ac.name)}</b><span class="small muted">Stärke ${clubAvg(ac)}</span></div></div>
    <div class="small" style="text-align:center">Gegnertrainer <b>${esc(opp.staff.coach.name)}</b>, ${co.label}. <span class="muted">${(()=>{ensureTactic(opp);const m=shapeMetrics(opp);return `Gegen den Ball ${m.oopShape}, mit Ball ${m.ipShape} · ${MENTALITY[opp.tactic.men]}, ${PRESSING[opp.tactic.press]}`})()}</span></div>`;
  }
  const talks=(S.talks||[]).filter(t=>t.st==='open'&&(t.seller===undefined||t.seller===S.user)).map(t=>{const p=S.players[t.pid],fc=club(t.from);if(!p||!fc)return '';const ch=talkChance(t);
    const deal=t.kind==='deal';
    return `<div class="news t-offer">${deal?`<b>🤝 ${esc(fc.name)}</b>: Ablöse vereinbart (${money(t.fee)}) – ${esc(fullname(p))} ${ovrTag(ovr(p))} verhandelt über seinen Vertrag`:`<b>⚡ ${esc(fc.name)}</b> verhandelt über die Ausstiegsklausel (${money(t.fee)}) mit ${esc(fullname(p))} ${ovrTag(ovr(p))}`}
      <div class="small" style="margin-top:4px">Angebot an den Spieler: ca. <b>${money(mon(t.wage))}</b> brutto/Monat als ${ROLES[t.role].label} · bei dir: ${money(mon(p.wage))}</div>
      <div class="small" style="margin-top:2px">⏱️ Entscheidung bis <b>Woche ${t.dec+1}</b> (${fmtDate(gameDate(t.dec))})${t.deadline?' · <b class="gold">Deadline Day</b>':t.dur?` · Verhandlungsdauer ca. ${t.dur} ${t.dur===1?'Woche':'Wochen'}`:''}</div>
      ${t.why?`<div class="whys">${t.why.map(w=>`<span>${esc(w)}</span>`).join('')}</div>`:''}
      <div class="small" style="margin-top:2px">Stimmung laut Berater: <b class="${deal?'':ch>=.6?'bad':ch>=.35?'gold':'good'}">${ch>=.6?'Er tendiert zum Wechsel':ch>=.35?'Er ist unentschlossen':'Er tendiert zum Bleiben'}</b></div>
      <div class="row" style="margin-top:6px">${deal?'<span class="small muted">Du hast dem Verkauf zugestimmt – jetzt liegt es am Spieler.</span>':`<button class="btn sm pri" data-act="negOpen" data-id="${p.id}" data-mode="extend">Vertrag nachbessern</button>`}<button class="btn sm" data-act="player" data-id="${p.id}">Spielerprofil</button></div></div>`}).join('');
  const pend=(S.pbids||[]).filter(x=>x.kind==='buy').map(x=>{const p=S.players[x.pid],sc=club(x.seller);return p?`<div class="news t-offer"><b>📨 Angebot an ${esc(sc.name)}</b> für ${esc(fullname(p))} ${ovrTag(ovr(p))}: ${bidText(x.b)}<div class="small" style="margin-top:4px">Der Verein prüft dein Angebot · Antwort bis <b>${fmtDate(x.when)}</b></div></div>`:''}).join('');
  const res=Object.entries(S.bidRes||{}).map(([pid,R])=>{const p=S.players[pid];if(!p||p.club===S.user||R.res==='no')return '';const sc=club(R.seller);
    if(R.res==='yes'){if(!userDeal(pid))return '';return `<div class="news t-transfer"><b>✅ Ablöse mit ${esc(sc.name)} vereinbart</b> für ${esc(fullname(p))}: ${bidText(R.bid)}<div class="row" style="margin-top:6px"><button class="btn sm pri" data-act="negOpen" data-id="${pid}" data-mode="buy">✍️ Vertragsgespräche führen</button></div></div>`}
    return `<div class="news t-offer"><b>↩️ Gegenangebot von ${esc(sc.name)}</b> für ${esc(fullname(p))}: ${bidText(R.bid)}${R.final?' <span class="small muted">(letzte Runde)</span>':''}<div class="row" style="margin-top:6px"><button class="btn sm pri" data-act="bidOpen" data-id="${pid}">Ansehen / annehmen / neu bieten</button></div></div>`}).join('');
  const uq=(S.uinq||[]).filter(x=>x.st==='open').map(x=>{const p=S.players[x.pid],c=club(x.by);if(!p||!c||p.club!==S.user)return '';
    return `<div class="news t-offer"><b>❓ Anfrage von ${esc(c.name)}</b> <span class="small muted">(${esc(leagueName(c))})</span> zu ${esc(fullname(p))} ${ovrTag(ovr(p))}: ${x.kind==='loan'?'Wäre eine Leihe möglich?':x.kind==='both'?'Ist er zu haben – fest oder als Leihe?':'Ist er zu haben?'}
      <div class="row" style="margin-top:6px">${x.kind!=='loan'?`<button class="btn sm pri" data-act="uinqPrice" data-id="${x.id}">Verkäuflich ab …</button>`:''}${x.kind!=='buy'?`<button class="btn sm" data-act="uinqAns" data-id="${x.id}" data-v="loan">Leihe möglich</button>`:''}<button class="btn sm" data-act="uinqAns" data-id="${x.id}" data-v="no">${x.kind==='loan'?'Keine Leihe':'Unverkäuflich'}</button></div></div>`}).join('');
  const lres=Object.entries(S.bidRes||{}).map(([pid,R])=>{const p=S.players[pid];if(!p||p.club===S.user)return '';const sc=club(R.seller);
    if(R.res==='loanyes'&&userLoanDeal(pid))return `<div class="news t-transfer"><b>✅ Leihe mit ${esc(sc.name)} vereinbart</b> für ${esc(fullname(p))}: ${loanText(R.t)}<div class="row" style="margin-top:6px"><button class="btn sm pri" data-act="loanClose" data-id="${pid}">🔁 Spieler fragen & abschließen</button></div></div>`;
    if(R.res==='loancounter')return `<div class="news t-offer"><b>↩️ Gegenvorschlag zur Leihe von ${esc(sc.name)}</b> für ${esc(fullname(p))}: ${loanText(R.t)}<div class="row" style="margin-top:6px"><button class="btn sm pri" data-act="loanOpen" data-id="${pid}">Ansehen / annehmen</button></div></div>`;
    return ''}).join('');
  const offers=pressHome()+orgHome()+uq+pend+res+talks+S.offers.map(o=>{const p=S.players[o.pid],fc=club(o.from);return `<div class="news t-offer"><b>${esc(fc.name)}</b> <span class="small muted">(${esc(leagueName(fc))})</span> ${o.loan?'möchte':'bietet für'} ${esc(fullname(p))} ${ovrTag(ovr(p))}${o.loan?' ausleihen':''}: <b>${o.loan?loanText(o.loan):o.bid?bidText(o.bid):money(o.fee)}</b> <span class="muted small">(Marktwert ${money(p.val)}${o.rounds?` · Runde ${o.rounds+1} von 3`:''})</span>${o.wait?`<div class="small" style="margin-top:6px">📨 Dein Gegenangebot liegt bei ihnen – Antwort bis <b>${fmtDate(((S.pbids||[]).find(x=>x.oid===o.id)||{}).when)}</b></div>`:orgOfferBtns(o,`<div class="row" style="margin-top:6px"><button class="btn sm pri" data-act="offerYes" data-id="${o.id}">Annehmen</button>${o.loan?'':`<button class="btn sm" data-act="bidCounter" data-id="${o.id}">Gegenangebot</button>`}<button class="btn sm" data-act="offerNo" data-id="${o.id}">Ablehnen</button></div>`)}</div>`}).join('');
  const news=S.news.slice(0,14).map(n=>`<div class="news t-${n.type}"><b>${esc(n.title)}</b> <span class="small muted">· ${n.w?'Woche '+n.w:'Saisonstart'}</span><div class="small">${n.body}</div></div>`).join('');
  const last=[];for(let r=Math.min(L.fixtures.length-1,(nx?nx.r:L.fixtures.length)-1);r>=0&&last.length<5;r--){const m=L.fixtures[r].find(m=>m.h===S.user||m.a===S.user);if(m&&m.hg!==null)last.push(m)}
  return `<div class="grid home-grid">
   <div class="card matchcard"><h3>Nächstes Spiel</h3>${next}${S.week<S.weeks?`<div class="row" style="margin-top:14px;justify-content:center"><button class="btn" data-act="nav" data-v="tactic">Taktik prüfen</button><button class="btn pri" data-act="advance">${ng.length&&ng[0].w===S.week?'Spiel starten ▶':'Woche simulieren ▶'}</button></div>`:''}</div>
   <div class="card"><h3>Saison · ${esc(L.name)}</h3>
     <div class="row" style="gap:26px"><div><div class="small muted">Platz</div><div class="kpi">${rank}.</div></div><div><div class="small muted">Punkte</div><div class="kpi">${me.pts}</div></div><div><div class="small muted">Tore</div><div class="kpi">${me.tf}:${me.ta}</div></div></div>
     <div class="small" style="margin-top:8px">Vorstandsziel: <b>${c.target.t}</b> ${rank<=c.target.r?'<span class="good">✓ auf Kurs</span>':'<span class="bad">✗ aktuell verfehlt</span>'}</div>
     ${(()=>{const B=boardOf(),[ti,tl]=trustLbl(B.trust);return `<div class="small" style="margin-top:4px">${ti} Rückhalt im Verein: <b>${Math.round(B.trust)}</b> – ${tl}${B.pending?' · <a data-act="bdOpen" style="color:var(--text);cursor:pointer;text-decoration:underline">Vorstand bittet zum Gespräch</a>':''}</div>`})()}
     <div class="small muted" style="margin-top:4px">Letzte Spiele: ${last.map(m=>{const gf=m.h===S.user?m.hg:m.ag,ga=m.h===S.user?m.ag:m.hg;return `<b class="${gf>ga?'good':gf<ga?'bad':''}">${gf}:${ga}</b>`}).join(' · ')||'–'}</div>
     <div class="small muted" style="margin-top:4px">Transferfenster: ${isWindow()?'<span class="good">offen</span>':'geschlossen'} · Gehälter ${money(mon(wageBill(c)))} / ${money(mon(c.wBudget))} pro Monat</div>
     ${userSupercup()?`<div class="small" style="margin-top:4px">🛡️ ${esc(userSupercup().name)}: <b>${userSupercup().winner===S.user?'🏆 gewonnen':userSupercup().winner!==null?'verloren':'Woche '+(userSupercup().rounds[0].w+1)}</b></div>`:''}
     ${userNatCup()?`<div class="small" style="margin-top:4px">🏆 <a data-act="openNatCup" style="color:var(--text);cursor:pointer;text-decoration:underline">${esc(userNatCup().name)}</a>: <b>${natCupStatus(userNatCup(),S.user)}</b></div>`:''}
     ${userComps().map(C=>`<div class="small" style="margin-top:4px">🏅 <a class="click" data-act="openComp" data-v="${C.key}" style="color:var(--text);cursor:pointer;text-decoration:underline">${COMP[C.key].name}</a>: <b>${compStatus(C,S.user)}</b></div>`).join('')}
   </div>
   <div class="card" style="grid-column:1/-1"><h3>Posteingang</h3>${offers}${news||'<p class="muted">Keine Nachrichten.</p>'}</div>
  </div>`;
}

/* ---------- Kader ---------- */
const POS_ORDER=Object.fromEntries(POS_LIST.map((p,i)=>[p,i]));
function playerRow(p,c,extra){
  const inXI=c&&c.lineup.includes(p.id);
  return `<tr class="click" data-act="player" data-id="${p.id}"><td>${inXI?'<b class="good">●</b>':''}</td><td><span class="pill" style="border-color:${GROUP_COLOR[GROUP[p.pos]]}88">${p.pos}</span></td><td><b>${esc(fullname(p))}</b>${p.loan?` <span class="pill" style="font-size:10px;padding:0 6px;border-color:var(--info)" title="Leihe von ${esc(club(p.loan.from).name)}">Leihe</span>`:''}${(p.inj?' <span class="bad small">🩹'+p.inj+'</span>':'')+(p.sus?' <span class="bad small" title="gesperrt">🟥'+p.sus+'</span>':'')}</td><td class="small muted">${p.nat}</td><td class="n">${p.age}</td><td class="n">${ovrTag(ovr(p))}</td><td class="n muted">${potDisp(p)}</td><td class="n">${Math.round(p.fit)}%</td><td class="n">${p.mor>=80?'😀':p.mor>=60?'🙂':p.mor>=40?'😐':'☹️'}</td><td class="n">${p.apps}</td><td class="n">${p.goals}</td><td class="n">${money(p.val)}</td><td class="n muted">${money(mon(p.wage))}</td><td class="small">${p.club!==null?ROLES[p.role].short:'–'}</td><td class="n ${p.club!==null&&p.until<=S.season?'gold':''}">${contractEnd(p)}${p.listed?' 🏷️':''}</td>${extra||''}</tr>`;
}
const PH='<th></th><th>Pos</th><th>Name</th><th>Nat.</th><th class="n">Alter</th><th class="n">Stärke</th><th class="n">Pot.</th><th class="n">Fit</th><th class="n">Moral</th><th class="n">Sp.</th><th class="n">Tore</th><th class="n">Marktwert</th><th class="n">Gehalt/M.</th><th>Rolle</th><th class="n">Vertrag</th>';
function renderSquad(){
  const c=userClub();let ps=squadOf(c);const k=UI.sortK;
  ps.sort(k==='ovr'?(a,b)=>ovr(b)-ovr(a):k==='age'?(a,b)=>a.age-b.age:k==='val'?(a,b)=>b.val-a.val:(a,b)=>POS_ORDER[a.pos]-POS_ORDER[b.pos]||ovr(b)-ovr(a));
  const sb=(key,l)=>`<button class="${k===key?'on':''}" data-act="sort" data-k="${key}">${l}</button>`;
  return `<div class="row" style="justify-content:space-between;margin-bottom:10px"><h2 style="margin:0">Kader <span class="muted small">${ps.length} Spieler · Gehälter ${money(mon(wageBill(c)))} von ${money(mon(c.wBudget))}/Monat</span></h2><div class="seg">${sb('pos','Position')}${sb('ovr','Stärke')}${sb('age','Alter')}${sb('val','Wert')}</div></div>
  <div class="tw"><table><thead><tr>${PH}</tr></thead><tbody>${ps.map(p=>playerRow(p,c)).join('')}</tbody></table></div>
  ${loanedOut(c).length?`<h3 style="margin-top:14px">Verliehene Spieler</h3><div class="tw"><table><thead><tr><th>Pos</th><th>Name</th><th class="n">Alter</th><th class="n">Stärke</th><th>Leihverein</th><th>Konditionen</th><th class="n">Spiele</th></tr></thead><tbody>${loanedOut(c).map(p=>`<tr class="click" data-act="player" data-id="${p.id}"><td>${p.pos}</td><td><b>${esc(fullname(p))}</b></td><td class="n">${p.age}</td><td class="n">${ovrTag(ovr(p))}</td><td>${esc(club(p.loan.to).name)}</td><td class="small">${loanText({fee:p.loan.fee,ws:Math.round(p.loan.ws*1000)/10,opt:p.loan.opt,obl:p.loan.obl,dur:p.loan.half?'half':p.loan.until>p.loan.since?'2':'1'})}</td><td class="n">${p.apps}</td></tr>`).join('')}</tbody></table></div>`:''}
  <p class="small muted">● = Startelf · <span class="pill" style="font-size:10px;padding:0 6px">Leihe</span> = ausgeliehener Spieler · <span class="gold">Vertrag gelb</span> = läuft am Saisonende aus · 🏷️ = auf der Transferliste · Tippe auf einen Spieler für Details und Vertragsgespräche.</p>`;
}
const seasonLbl=s=>`${s}/${String((s+1)%100).padStart(2,'0')}`;
const fmtR=v=>v?v.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}):'–';
const rCls=v=>!v?'muted':v>=7.2?'good':v<6.5?'bad':'';
function cBadge(name,id,sz){const c=id!==null&&id!==undefined&&id>=0&&club(id);return badge(c||{short:shortName(name),colors:clubColors(name)},sz)}
function tile(lbl,val,sub){return `<div class="ptile"><span>${lbl}</span><b>${val}</b>${sub?`<small>${sub}</small>`:''}</div>`}
function playerModal(pid){
  return ()=>{
    const p=S.players[pid];if(!p)return '<p>Spieler nicht gefunden.</p>';
    const c=p.club!==null?club(p.club):null,mine=p.club===S.user,tab=UI.ptab||'profil';
    const B=bio(p),V=careerView(p);
    const head=`<div class="phead">
      <div class="pid">${c?badge(c,52):'<span class="badge" style="width:52px;height:52px;font-size:13px;background:var(--panel2);color:var(--muted)">FA</span>'}
        <div style="min-width:0"><h2 style="margin:0">${esc(fullname(p))}</h2>
        <div class="muted small">${POS_LABEL[p.pos]} · ${c?esc(c.name)+' · '+esc(leagueName(c)):'vereinslos'}</div>
        <div class="chips"><span class="pill">${esc(natName(p.nat))}</span><span class="pill">${p.age} Jahre</span>${p.listed?'<span class="pill gold">🏷️ Transferliste</span>':''}${p.loan?`<span class="pill" style="border-color:var(--info)">🔁 Leihe von ${esc(club(p.loan.from).name)} ${loanEndText(p.loan)}</span>`:''}${(p.inj?`<span class="pill bad">🩹 ${p.inj} Wo. verletzt</span>`:'')+(p.sus?`<span class="pill bad">🟥 gesperrt (${p.sus} ${p.sus===1?'Spiel':'Spiele'})</span>`:'')}</div></div></div>
      <div class="pscore"><div><span>Stärke</span>${ovrTag(ovr(p))}</div><div><span>Potenzial${known(p)?'':' ~'}</span>${known(p)?ovrTag(p.pot):`<span class="ovr" style="font-size:16px" title="Grobe Schätzung – schicke einen Scout in die Region">${potDisp(p)}</span>`}</div></div></div>
      <div class="seg ptabs">${[['profil','Profil'],['vertrag','Vertrag'],['karriere','Karriere']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-act="ptab" data-v="${k}">${l}</button>`).join('')}</div>`;
    let body='';
    if(tab==='profil'){
      const key=WEIGHTS[p.pos];
      const col=(title,keys)=>`<div class="acol"><h3>${title}</h3>${keys.map(k=>{const v=at(p,k),fd=attrDisp(p,k,v);return `<div class="arow${key[k]?' key':''}"><span>${ATTR_LABEL[k]}</span><b class="av ${fd?'fog':'v'+(v>=16?4:v>=11?3:v>=6?2:1)}">${fd||v}</b></div>`}).join('')}</div>`;
      const T=ATTR_DEF.filter(d=>d[2]==='tech').map(d=>d[0]),Mn=ATTR_DEF.filter(d=>d[2]==='ment').map(d=>d[0]),Ph=ATTR_DEF.filter(d=>d[2]==='phys').map(d=>d[0]),G=ATTR_DEF.filter(d=>d[2]==='gk').map(d=>d[0]);
      const cols=p.pos==='TW'?col('Torwart',[...G,'fir','pas'])+col('Mental',Mn)+col('Physis',Ph):col('Technik',T)+col('Mental',Mn)+col('Physis',Ph);
      const PM={TW:[50,90],IV:[50,74],AV:[[14,70],[86,70]],DM:[50,60],ZM:[50,46],OM:[50,32],FL:[[14,30],[86,30]],ST:[50,13]};
      const dots=POS_LIST.flatMap(pos=>{const f=familiarity(p,pos),xy=Array.isArray(PM[pos][0])?PM[pos]:[PM[pos]];const cls=f>=19?'f4':f>=15?'f3':f>=11?'f2':f>=7?'f1':'f0';
        return xy.map(([x,y])=>`<div class="pdot ${cls}" style="left:${x}%;top:${y}%" title="${POS_LABEL[pos]}: ${FAM_LABEL(f)} · Stärke ${Math.round(rateAt(p,pos))}">${pos}<small>${Math.round(rateAt(p,pos))}</small></div>`)}).join('');
      const posList=POS_LIST.map(pos=>({pos,f:familiarity(p,pos)})).filter(x=>x.f>=11).sort((a,b)=>b.f-a.f).map(x=>`<div class="arow"><span>${POS_LABEL[x.pos]}</span><b class="small ${x.f>=19?'good':x.f>=15?'':'muted'}">${FAM_LABEL(x.f)}</b></div>`).join('');
      const avg=p.rn?p.rs/p.rn/10:0,bd=`${String(B.dy).padStart(2,'0')}.${String(B.mo).padStart(2,'0')}.${B.year}`;
      const wbar=`<span class="wbar"><i style="width:${B.weak*5}%"></i></span>`;
      body=`<div class="ptiles">
        ${tile('Nationalität',esc(natName(p.nat)),(()=>{const k=CONFEDS.find(x=>x.id===ASSOC[p.nat].confed);return k?esc(k.name+' · '+k.region):''})())}
        ${tile('Alter',p.age+' Jahre','geb. '+bd)}
        ${tile('Größe',B.h+' cm')}
        ${tile('Gewicht',B.w+' kg')}
        ${tile('Starker Fuß',FOOT_LABEL[B.foot])}
        ${tile('Schwacher Fuß',B.foot==='B'?'Beidfüßig':weakLabel(B.weak),wbar)}
        ${tile('Persönlichkeit',personality(p))}
        ${(()=>{const A=agentOf(p);return tile('Berater',esc(A.name),esc(A.lbl)+' · '+esc(A.agency))})()}
        ${tile('Marktwert',money(p.val))}
        ${tile('Fitness · Moral',`${Math.round(p.fit)}% · ${p.mor>=80?'😀':p.mor>=60?'🙂':p.mor>=40?'😐':'☹️'} ${Math.round(p.mor)}`)}
        ${tile('Saison '+seasonLbl(S.season),`${p.apps} Sp · ${p.goals} T · ${p.ast||0} V`,`Ø-Note <b class="${rCls(avg)}">${fmtR(avg)}</b>`)}
      </div>
      <div class="attrgrid">${cols}</div>
      <p class="small muted" style="margin:6px 0 0">Werte von 1 bis 20. <b class="keymark">Hervorgehoben</b> sind die Schlüsselattribute für ${POS_LABEL[p.pos]}.</p>
      <div class="grid g2" style="margin-top:14px"><div><h3>Positionen</h3><div class="minipitch">${dots}</div></div><div class="acol" style="align-self:start"><h3>Vertrautheit</h3>${posList}</div></div>`;
    }
    else if(tab==='vertrag'){
      const u=userClub(),ct=c?contractOf(p):{},code=c?c.assoc:u.assoc;
      if(!c){
        const r=suggestRole(p,u),dem=wageDemand(p,u,r,2),nt=netOf(dem*52,code);
        body=`<div class="cbig"><div><span>Status</span><b class="gold">Vereinslos</b><small>Kann jederzeit ablösefrei verpflichtet werden (im Transferfenster).</small></div>
          <div><span>Gehaltsforderung (brutto)</span><b>${money(mon(dem))}<em>/Monat</em></b><small>netto ca. ${money(nt.net/12)}/Monat · als ${ROLES[r].label}</small></div>
          <div><span>Handgeld</span><b>${money(dem*6)}</b><small>rund 1,4 Monatsgehälter</small></div></div>`;
      }else{
        const end=p.until+1,elapsed=S.week/Math.max(S.weeks,1)*11,leftM=Math.max(0,Math.round((end-S.season)*12-1-elapsed));
        const since=V.since!==null&&V.since!==undefined?V.since:S.season,totalM=Math.max(1,(end-since)*12),pct=clamp(100-leftM/totalM*100,0,100);
        const leftTxt=leftM>=12?`${Math.floor(leftM/12)} ${Math.floor(leftM/12)===1?'Jahr':'Jahre'}${leftM%12?`, ${leftM%12} Mon.`:''}`:`${leftM} ${leftM===1?'Monat':'Monate'}`;
        const yrs=S.season-since,bf=mine?{fee:askPrice(p)}:buyFee(p,u),warn=p.until<=S.season,nt=netOf(p.wage*52,code);
        const bill=mine?wageBill(c):0;
        const bon=BONUS.filter(b=>ct[b.k]).map(b=>`<div class="crow"><span>${b.lbl}<small>${b.unit}</small></span><b>${money(ct[b.k])}</b></div>`).join('');
        const adj=[ct.ri?`<div class="crow"><span>Jährliche Gehaltssteigerung<small>zum 1. Juli jedes Vertragsjahres</small></span><b class="good">+${ct.ri} %</b></div>`:'',
          ct.ar?`<div class="crow"><span>Erhöhung nach ${ct.ar[0]} Pflichtspielen<small>${ct.ad?'bereits erreicht':mine?`bisher ${ct.n||0} von ${ct.ar[0]} Spielen`:'einmalig'}</small></span><b class="${ct.ad?'muted':'good'}">+${ct.ar[1]} %</b></div>`:'',
          ct.up?`<div class="crow"><span>Erhöhung bei Aufstieg<small>ab der neuen Saison</small></span><b class="good">+${ct.up} %</b></div>`:'',
          ct.dn?`<div class="crow"><span>Kürzung bei Abstieg<small>ab der neuen Saison</small></span><b class="bad">−${ct.dn} %</b></div>`:''].join('');
        const appl=!mine&&ct.rc&&clauseApplies(p,u,ct);
        const clause=ct.rc?`<div class="cclause ${appl?'on':''}"><span>Ausstiegsklausel</span><b>${money(ct.rc)}</b><small>gilt für: ${CLAUSE_TYPES[ct.rt||'all']} · Gültigkeit: ${clauseWindowText(ct)}${(()=>{const st=clauseState(ct);return st==='pre'?` · <b class="gold">noch nicht aktiv</b>`:st==='post'?` · <b class="muted">verstrichen</b>`:(ct.rf||ct.ru)?` · <b class="good">aktiv</b>`:''})()}${mine&&activeTalk(p.id)?` · <b class="bad">${esc(club(activeTalk(p.id).from).name)} verhandelt gerade mit ihm – Entscheidung bis Woche ${activeTalk(p.id).dec+1}</b>`:''}${mine?'':appl?' · <b class="good">gilt für deinen Verein – der Verein kann den Wechsel nicht verhindern</b>':' · gilt nicht für deinen Verein'}</small></div>`:`<div class="cclause"><span>Ausstiegsklausel</span><b class="muted" style="font-size:22px">keine</b><small>Ein Wechsel ist nur mit Zustimmung des Vereins möglich.</small></div>`;
        body=`<div class="cbig">
          <div><span>Gehalt brutto</span><b>${money(mon(p.wage))}<em>/Monat</em></b><small>${money(p.wage*52)} brutto pro Jahr</small></div>
          <div><span>Gehalt netto (geschätzt)</span><b>${money(nt.net/12)}<em>/Monat</em></b><small>${money(nt.net)} pro Jahr · Abzüge ${Math.round(nt.rate*100)} % (${esc(natName(code))}: ${esc(nt.lbl)})</small></div>
          <div><span>Vertrag bis</span><b class="${warn?'gold':''}">30.06.${end}</b><small>${warn?'⚠️ Läuft zum Saisonende aus':'Restlaufzeit: '+leftTxt}</small></div></div>
        <div class="cline"><div class="row" style="justify-content:space-between"><span class="small muted">Seit ${since<S.season?'Juli '+since:'dieser Saison'}</span><span class="small muted">30.06.${end}</span></div><div class="cbar"><i style="width:${pct}%"></i></div></div>
        <div class="ptiles">
          ${tile('Rolle im Kader',ROLES[p.role].label,`erwartet ca. ${Math.round(ROLES[p.role].exp*100)}% der Spiele`)}
          ${tile('Im Verein seit',seasonLbl(since),yrs>0?`${yrs} ${yrs===1?'Saison':'Saisons'} beim ${esc(c.short)}`:'erste Saison')}
          ${tile('Marktwert',money(p.val))}
          ${tile(mine?'Interne Ablöse-Vorstellung':bf.clause?'Ablöse (Klausel)':'Geforderte Ablöse',bf.fee?money(bf.fee):'ablösefrei',p.listed?'🏷️ steht auf der Transferliste':mine?'nicht auf der Transferliste':isWindow()?'Transferfenster offen':'Transferfenster geschlossen')}
          ${mine?tile('Anteil Gehaltsbudget',Math.round(p.wage/Math.max(1,c.wBudget)*100)+' %',`Gesamt: ${money(mon(bill))} von ${money(mon(c.wBudget))}/Monat`):''}
          ${mine?tile('Freistellung kostet',money(releaseCost(p)),'50 % der Restgehälter'):''}
        </div>
        <div class="grid g2" style="margin-top:14px">
          <div class="clist"><h3>Prämien</h3>${bon||'<p class="small muted">Keine Prämien vereinbart.</p>'}${mine&&p.ct?`<div class="small muted" style="margin-top:8px">In dieser Saison ausgezahlt: <b style="color:var(--text)">${money(p.ct.pd||0)}</b></div>`:''}</div>
          ${(p.so||[]).length||(p.ao||[]).some(a=>!a.done)?`<div class="clist" style="grid-column:1/-1"><h3>Vereinbarungen aus dem letzten Transfer</h3>${(p.so||[]).map(x=>`<div class="crow"><span>Weiterverkaufsbeteiligung<small>${esc(club(x.to)?club(x.to).name:'?')} erhält bei einem Verkauf diesen Anteil der Ablöse</small></span><b>${x.pct} %</b></div>`).join('')}${(p.ao||[]).filter(a=>!a.done).map(a=>`<div class="crow"><span>Erfolgsbonus an ${esc(club(a.to)?club(a.to).name:'?')}<small>nach ${a.need} Pflichtspielen · bisher ${a.n}</small></span><b>${money(a.amt)}</b></div>`).join('')}</div>`:''}
          <div><div class="clist"><h3>Gehaltsanpassungen</h3>${adj||'<p class="small muted">Keine Anpassungen vereinbart – das Gehalt bleibt bis Vertragsende gleich.</p>'}</div>${clause}</div>
        </div>`;
      }
      let actions='';
      const LN=p.loan;
      if(LN)actions=`<div class="clist"><h3>Leihgeschäft</h3><div class="crow"><span>Stammverein<small>Vertrag läuft dort bis ${contractEnd(p)}</small></span><b>${esc(club(LN.from).name)}</b></div><div class="crow"><span>Leihverein<small>${loanEndText(LN)}</small></span><b>${esc(club(LN.to).name)}</b></div><div class="crow"><span>Konditionen</span><b class="small" style="font-family:inherit">${loanText({fee:LN.fee,ws:Math.round(LN.ws*1000)/10,opt:LN.opt,obl:LN.obl,dur:LN.half?'half':LN.until>LN.since?'2':'1'})}</b></div>
        ${LN.to===S.user&&LN.opt&&!LN.obl?`<div class="row" style="margin-top:8px"><button class="btn ${LN.buy?'':'pri'}" data-act="loanBuyToggle" data-id="${p.id}">${LN.buy?'Kaufoption doch nicht ziehen':'💶 Kaufoption ziehen ('+money(LN.opt)+')'}</button><span class="small muted">${LN.buy?'✅ Wird zum Saisonende fest übernommen.':'Wird zum Saisonende ausgeübt, wenn du sie ziehst.'}</span></div>`:''}
        ${LN.to===S.user&&LN.obl?'<div class="small muted" style="margin-top:6px">Kaufpflicht: Er wird zum Saisonende automatisch fest übernommen.</div>':''}</div>`;
      else if(mine)actions=`<div class="row"><button class="btn pri" data-act="negOpen" data-id="${p.id}" data-mode="extend">✍️ Vertrag anpassen / verlängern</button><button class="btn" data-act="listToggle" data-id="${p.id}">${p.listed?'Von Transferliste nehmen':'🏷️ Auf Transferliste'}</button><button class="btn warn" data-act="release" data-id="${p.id}">Freistellen</button></div>`;
      else{const bf=buyFee(p,u),D=userDeal(p.id),LD=p.club!==null?userLoanDeal(p.id):null,w=isWindow(),dis=w?'':'disabled',q=p.club!==null?inqFor(p.id,S.user):null;
        const intel=q?(q.st==='open'?`<div class="news t-offer" style="margin-bottom:10px">🔎 Deine Anfrage läuft – Antwort bis ${fmtDate(q.when)}.</div>`:inqFresh(q)?`<div class="clist" style="margin-bottom:10px"><h3>Erkenntnisse aus deiner Anfrage <span class="small muted">(${fmtDate(gameDate(q.aw!==undefined?q.aw:q.w))})</span></h3>${q.res.club?`<div class="crow"><span>Verein<small>${q.res.club.saleTxt||''} ${q.res.club.loanTxt||''}${q.res.club.txt||''}</small></span><b>${q.res.club.lo?money(q.res.club.lo)+' – '+money(q.res.club.hi):q.res.club.sale==='no'?'<span class="bad">nicht zu haben</span>':'–'}</b></div>`:''}${q.res.agent?`<div class="crow"><span>Berater ${esc(q.res.agent.agent)}<small>${q.res.agent.txt} ${q.res.agent.why.join(', ')}${q.res.agent.loanTxt?' · '+q.res.agent.loanTxt:''}</small></span><b class="${q.res.agent.lvl==='hot'?'good':q.res.agent.lvl==='no'?'bad':''}">${q.res.agent.lvl!=='no'?money(q.res.agent.wlo)+' – '+money(q.res.agent.whi)+'/M.':'kein Interesse'}</b></div>`:''}</div>`:''):'';
        actions=intel+`<div class="row"><button class="btn pri" data-act="vrOpen" data-id="${p.id}">🤝 Verhandlungsraum</button>${p.club===null?`<button class="btn" data-act="negOpen" data-id="${p.id}" data-mode="buy" ${dis}>✍️ Vertragsformular</button>`
          :D?`<button class="btn" data-act="negOpen" data-id="${p.id}" data-mode="buy" ${dis}>✍️ Vertragsformular</button><span class="small good">Ablöse vereinbart: ${bidText(D.bid)}</span>`
          :LD?`<button class="btn pri" data-act="loanClose" data-id="${p.id}" ${dis}>🔁 Leihe abschließen – Spieler fragen</button><span class="small good">${loanText(LD.t)}</span>`
          :`<button class="btn" data-act="inqOpen" data-id="${p.id}">🔎 Anfrage stellen</button><button class="btn" data-act="bidOpen" data-id="${p.id}" ${dis}>💶 Angebot schriftlich</button><button class="btn" data-act="loanOpen" data-id="${p.id}" ${dis}>🔁 Leihangebot</button>${bf.clause?`<button class="btn" data-act="negOpen" data-id="${p.id}" data-mode="buy" ${dis}>⚡ Ausstiegsklausel ziehen: ${money(bf.fee)}</button>`:''}`}</div>${w?'':`<div class="small muted" style="margin-top:4px">Transferfenster geschlossen – Anfragen sind trotzdem möglich, Angebote erst ${windowLabel()}.</div>`}`}
      if(!LN)actions=orgActions(p,mine,actions);
      body+=`<div style="margin-top:14px">${actions}</div>`;
    }
    else{
      const rows=V.rows.slice().sort((a,b)=>b.s-a.s||(b.live?1:0)-(a.live?1:0)),gk=p.pos==='TW';
      const sum=rows.reduce((t,r)=>{t.apps+=r.apps;t.g+=r.g;t.a+=r.a;t.yc+=r.yc;t.cs+=r.cs;t.rw+=r.avg*r.apps;return t},{apps:0,g:0,a:0,yc:0,cs:0,rw:0});
      const tavg=sum.apps?sum.rw/sum.apps:0;
      // Stationen gruppieren
      const st=[];for(const r of V.rows.slice().sort((a,b)=>a.s-b.s)){const l=st[st.length-1];if(l&&l.name===r.name){l.to=r.s;l.apps+=r.apps;l.g+=r.g;l.a+=r.a;l.cs+=r.cs}else st.push({name:r.name,cid:r.cid,from:r.s,to:r.s,apps:r.apps,g:r.g,a:r.a,cs:r.cs,lname:r.lname})}
      const feeIn=x=>{const m=V.moves.filter(m=>m.t===x.name&&m.s>=x.from-1&&m.s<=x.to).pop();return m?(m.fee?money(m.fee):'ablösefrei'):null};
      const timeline=st.slice().reverse().map((x,i)=>{const f=feeIn(x),cur=i===0&&p.club!==null&&x.cid===p.club;
        return `<div class="tl ${cur?'cur':''}"><div class="tl-dot"></div>${cBadge(x.name,x.cid,34)}<div style="min-width:0;flex:1"><b>${esc(x.name)}</b>${cur?' <span class="pill good" style="font-size:10.5px">aktuell</span>':''}<div class="small muted">${seasonLbl(x.from).slice(0,4)}–${cur?'heute':String(x.to+1)} · ${esc(x.lname||'')}</div></div>
          <div class="tl-st"><b>${x.apps}</b><small>Sp</small></div><div class="tl-st"><b>${gk?x.cs:x.g}</b><small>${gk?'WW':'Tore'}</small></div>${f?`<div class="tl-fee">${f==='ablösefrei'?'<span class="muted">ablösefrei</span>':f}</div>`:'<div class="tl-fee muted">–</div>'}</div>`}).join('');
      const youth=V.youth?`<div class="tl youth"><div class="tl-dot"></div><span class="small muted">Jugend: <b style="color:var(--text)">${esc(V.youth)}</b></span></div>`:'';
      const tr=rows.map(r=>`<tr class="${r.live?'me':''}"><td class="small">${seasonLbl(r.s)}</td><td><div class="row" style="flex-wrap:nowrap;gap:8px">${cBadge(r.name,r.cid,22)}<div style="min-width:0"><b>${esc(r.name)}</b><div class="small muted">${esc(r.lname||'')}</div></div></div></td><td class="n">${r.apps}</td><td class="n">${r.g}</td><td class="n">${r.a}</td>${gk?`<td class="n">${r.cs}</td>`:''}<td class="n">${r.yc}</td><td class="n ${rCls(r.avg)}">${fmtR(r.avg)}</td></tr>`).join('');
      body=`<div class="ksum">
          <div><b>${sum.apps}</b><span>Spiele</span></div><div><b>${sum.g}</b><span>Tore</span></div><div><b>${sum.a}</b><span>Vorlagen</span></div>
          ${gk?`<div><b>${sum.cs}</b><span>Weiße Westen</span></div>`:`<div><b>${sum.apps?(sum.g/sum.apps).toLocaleString('de-DE',{maximumFractionDigits:2}):'0'}</b><span>Tore/Spiel</span></div>`}
          <div><b class="${rCls(tavg)}">${fmtR(tavg)}</b><span>Ø-Note</span></div><div><b>${st.length}</b><span>Stationen</span></div></div>
        <h3 style="margin-top:16px">Stationen</h3><div class="tlwrap">${timeline}${youth}</div>
        <h3 style="margin-top:16px">Saison für Saison</h3>
        <div class="tw"><table class="ctab"><thead><tr><th>Saison</th><th>Verein</th><th class="n" title="Spiele">Sp</th><th class="n" title="Tore">T</th><th class="n" title="Vorlagen">V</th>${gk?'<th class="n" title="Weiße Westen">WW</th>':''}<th class="n" title="Gelbe Karten">🟨</th><th class="n" title="Durchschnittsnote">Ø</th></tr></thead>
        <tbody>${tr}</tbody><tfoot><tr><td></td><td><b>Gesamt</b></td><td class="n">${sum.apps}</td><td class="n">${sum.g}</td><td class="n">${sum.a}</td>${gk?`<td class="n">${sum.cs}</td>`:''}<td class="n">${sum.yc}</td><td class="n ${rCls(tavg)}">${fmtR(tavg)}</td></tr></tfoot></table></div>
        <p class="small muted" style="margin:8px 0 0">Alle Pflichtspiele (Liga, Pokal, international). Noten von 1 bis 10 · Werte vor ${seasonLbl(S.statsFrom||S.season)} stammen aus der Vorgeschichte des Spielers.</p>`;
    }
    return `<div class="pcard">${head}<div class="pbody">${body}</div>
      <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn" data-act="closeModal">Schließen</button></div></div>`;
  };
}

/* ---------- Vertragsverhandlung ---------- */
function negCt(N,p,u){
  const W=wk(N.mw),ct={},lock=N.mode==='extend'&&activeTalk(p.id);
  for(const b of BONUS){const v=N.b[b.k]||0;if(v>0&&bonusApplies(b,p,u))ct[b.k]=Math.round(v)}
  if(N.ri)ct.ri=RAISE.ri[N.ri];if(N.ar)ct.ar=RAISE.ar[N.ar].slice();
  const L=league(u);if(N.up&&L&&L.tier>1)ct.up=RAISE.up[N.up];if(N.dn&&L&&L.down)ct.dn=RAISE.dn[N.dn];
  if(lock){const cur=contractOf(p);for(const k of ['rc','rt','rf','ru'])if(cur[k]!==undefined)ct[k]=cur[k]}
  else if(N.rt!=='none'&&N.rc>0){ct.rc=N.rc;ct.rt=N.rt;if((N.rw==='from'||N.rw==='range')&&N.rf)ct.rf=N.rf;if((N.rw==='until'||N.rw==='range')&&N.ru)ct.ru=N.ru}
  return ct;
}
function negYears(N,p){return N.years===0?Math.max(1,p.until-S.season+(S.week<winterStart()?1:.5)):N.years}
function negDemand(N,p,u){
  if(N.years===0){const cur=p.ct||contractOf(p);return ctValue(p,u,cur,p.wage,negYears(N,p),p.role)}
  return wageDemand(p,u,N.role,N.years);
}
function negEval(N,p,u){
  const ct=negCt(N,p,u),W=wk(N.mw),yrs=negYears(N,p),role=N.years===0?p.role:N.role;
  const val=ctValue(p,u,ct,W,yrs,role),dem=negDemand(N,p,u);return {ct,W,yrs,role,val,dem,ratio:val/Math.max(1,dem)};
}
function negInit(p,u,mode){
  const role=suggestRole(p,u),keep=mode==='extend'&&p.until>S.season,years=keep?0:p.age>=31?1:p.age<=23?4:3;
  const N={pid:p.id,mode,role:keep?p.role:role,years,mw:0,b:{},ri:0,ar:0,up:0,dn:0,rt:'none',rc:0,rw:'always',rf:'',ru:'',msg:null};
  const cur=mode==='extend'?(p.ct||contractOf(p)):{};
  const W0=mode==='extend'?p.wage:wageDemand(p,u,role,years||1);
  for(const b of BONUS){
    if(mode==='extend')N.b[b.k]=b.k==='si'?0:(cur[b.k]||0);
    else N.b[b.k]=(b.k==='ap'||b.k==='gl')&&bonusApplies(b,p,u)?bonusAmount(b,1,W0):0;
  }
  if(mode==='extend'){const ix=(arr,v)=>Math.max(0,arr.findIndex(x=>JSON.stringify(x)===JSON.stringify(v)));
    N.ri=cur.ri?Math.max(1,ix(RAISE.ri,cur.ri)):0;N.ar=cur.ar?Math.max(1,RAISE.ar.findIndex(x=>x&&x[0]===cur.ar[0])):0;N.up=cur.up?Math.max(1,ix(RAISE.up,cur.up)):0;N.dn=cur.dn?Math.max(1,ix(RAISE.dn,cur.dn)):0;
    if(cur.rc){N.rt=cur.rt||'all';N.rc=cur.rc;N.rf=cur.rf||'';N.ru=cur.ru||'';N.rw=cur.rf&&cur.ru?'range':cur.rf?'from':cur.ru?'until':'always'}}
  N.mw=Math.round(mon(W0)/100)*100;
  if(mode==='buy')negMatchDemand(N,p,u);
  return N;
}
// Wert ist linear im Gehalt (Prämien fest): zwei Stützstellen → passendes Monatsgehalt
function negMatchDemand(N,p,u){
  const m0=N.mw||1000,e1=negEval(N,p,u);N.mw=m0*2;const e2=negEval(N,p,u);
  const slope=(e2.val-e1.val)/m0,need=m0+(e1.dem-e1.val)/Math.max(slope,1e-9);
  N.mw=Math.max(100,Math.ceil(need/100)*100);
}
function parseMoney(str){
  let t=String(str||'').toLowerCase().replace(/€|eur|euro/g,'').replace(/\s+/g,'');if(!t)return 0;
  let mul=1;if(/(mio|mill|m)\.?$/.test(t)){mul=1e6;t=t.replace(/(mio|mill|m)\.?$/,'')}else if(/(tsd|k|t)\.?$/.test(t)){mul=1e3;t=t.replace(/(tsd|k|t)\.?$/,'')}
  if(mul>1){if(t.includes(',')||(t.match(/\./g)||[]).length>1)t=t.replace(/\./g,'').replace(',','.')}else{t=t.replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.')}
  const v=parseFloat(t);return isFinite(v)?Math.max(0,v*mul):NaN;
}
const fmtNum=v=>Math.round(v||0).toLocaleString('de-DE');
function amtInput(k,v,cls){return `<label class="minp ${cls||''}"><input type="text" inputmode="decimal" data-chg="negAmt" data-k="${k}" value="${v?fmtNum(v):''}" placeholder="0" aria-label="Betrag"><span>€</span></label>`}
function negModal(){
  return ()=>{
    const N=UI.neg,p=S.players[N.pid],u=userClub();if(!p)return '';
    const buy=N.mode==='buy',D=buy?userDeal(p.id):null,bf=buy?(D?{fee:D.bid.fee,deal:D}:buyFee(p,u)):{fee:0},fee=bf.fee,E=negEval(N,p,u),L=league(u);
    const bill=wageBill(u)-(buy?0:p.wage),free=u.wBudget-bill,hand=buy&&p.club===null?E.W*6:0,si=E.ct.si||0;
    const sugg=suggestRole(p,u),endYear=N.years===0?p.until:buy?S.season+N.years-(S.week<winterStart()?1:0):S.season+N.years;
    const seg=(act,k,cur,vals)=>`<div class="seg">${vals.map(([v,l])=>`<button class="${String(cur)===String(v)?'on':''}" data-act="${act}" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const roles=ROLE_ORDER.filter(r=>r!=='perspektive'||p.age<=21).map(r=>[r,ROLES[r].short]),over=E.W>free;
    const wi=wishes(p),star=k=>wi.includes(k)?' <span class="gold" title="Wunsch des Beraters">★</span>':'';
    const nt=netOf(E.W*52,u.assoc),cost=ctCostSeason(p,u,E.ct,E.W,E.role);
    const yearOpts=[[1,'1 J.'],[2,'2 J.'],[3,'3 J.'],[4,'4 J.'],[5,'5 J.']];if(!buy&&p.until>S.season)yearOpts.unshift([0,'unverändert']);
    const bonusRows=BONUS.filter(b=>bonusApplies(b,p,u)).map(b=>{const cur=Math.round(N.b[b.k]||0);
      return `<div class="nrow"><div class="nhead"><div><b>${b.lbl}</b>${star(b.k)}<small>${b.unit}</small></div>${amtInput(b.k,cur)}</div>
      <div class="chipsel">${b.lv.map((_,l)=>{const v=l?bonusAmount(b,l,E.W):0;return `<button class="${cur===Math.round(v)?'on':''}" data-act="negLv" data-k="${b.k}" data-v="${v}">${l?money(v):'keine'}</button>`}).join('')}</div></div>`}).join('');
    const pctL=a=>a.map((v,i)=>[i,i?(v>0?'+':'')+v+' %':'–']);
    const adjRows=`<div class="nrow"><div><b>Jährliche Steigerung</b><small>pro Vertragsjahr</small></div>${seg('negAdj','ri',N.ri,pctL(RAISE.ri))}</div>
      <div class="nrow"><div><b>Erhöhung nach Einsätzen</b>${star('ar')}<small>einmalig, nach X Pflichtspielen</small></div>${seg('negAdj','ar',N.ar,RAISE.ar.map((v,i)=>[i,v?`${v[0]} Sp. +${v[1]} %`:'–']))}</div>
      ${L&&L.tier>1?`<div class="nrow"><div><b>Erhöhung bei Aufstieg</b><small>ab der neuen Saison</small></div>${seg('negAdj','up',N.up,pctL(RAISE.up))}</div>`:''}
      ${L&&L.down?`<div class="nrow"><div><b>Kürzung bei Abstieg</b><small>spart Kosten, mag kein Spieler</small></div>${seg('negAdj','dn',N.dn,RAISE.dn.map((v,i)=>[i,i?'−'+v+' %':'–']))}</div>`:''}`;
    const types=[['none','Keine'],...Object.entries(CLAUSE_TYPES).filter(([k])=>!(k==='higher'&&(!L||L.tier===1))&&!(k==='releg'&&(!L||!L.down)))];
    const cEnd=`${endYear+1}-06-30`,today=gameDate(),yrsL=[];for(let y=S.season;y<=endYear;y++)yrsL.push(y);
    const dIn=(k,v,min)=>`<label class="minp dinp"><input type="date" data-chg="negDate" data-k="${k}" value="${v||''}" min="${min||today}" max="${cEnd}"></label>`;
    const chips=(k,list,cur)=>`<div class="chipsel" style="margin-top:6px">${list.map(([v,l])=>`<button class="${cur===v?'on':''}" data-act="negDatePick" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const fromL=yrsL.slice(1).map(y=>[`${y}-07-01`,`ab 01.07.${y}`]),untilL=yrsL.flatMap(y=>[[`${y}-08-31`,`bis 31.08.${y}`],[`${y+1}-01-31`,`bis 31.01.${y+1}`]]).filter(([v])=>v>=today&&v<=cEnd).slice(0,5);
    const wShare=clauseShare({rf:(N.rw==='from'||N.rw==='range')?N.rf:'',ru:(N.rw==='until'||N.rw==='range')?N.ru:''},today,cEnd);
    const clauseWin=`<div style="margin-top:10px"><b class="small">Gültigkeit</b>${seg('negSet','rw',N.rw,[['always','Ganze Laufzeit'],['from','Erst ab …'],['until','Verstreicht am …'],['range','Zeitraum']])}
      ${N.rw==='from'||N.rw==='range'?`<div class="drow"><span>gültig ab</span>${dIn('rf',N.rf)}</div>${chips('rf',fromL,N.rf)}`:''}
      ${N.rw==='until'||N.rw==='range'?`<div class="drow"><span>gültig bis</span>${dIn('ru',N.ru,N.rw==='range'&&N.rf?N.rf:today)}</div>${chips('ru',untilL,N.ru)}`:''}
      <div class="small muted" style="margin-top:6px">${N.rw==='always'?'Die Klausel gilt bis zum Vertragsende am '+fmtDate(cEnd)+'.':`Die Klausel gilt in ${Math.round(wShare*100)} % der Restlaufzeit – je kürzer, desto weniger ist sie dem Spieler wert. Heute im Spiel: ${fmtDate(today)}.`}</div></div>`;
    const talk=!buy&&activeTalk(p.id);
    const clauseRow=talk?`<div class="nrow col"><div><b>Ausstiegsklausel</b><small>${esc(club(talk.from).name)} verhandelt gerade über die Klausel (${money(talk.fee)}) – sie kann jetzt nicht geändert werden. Ein besserer Vertrag (Gehalt, Rolle, Prämien) senkt aber die Chance, dass er wechselt.</small></div></div>`:`<div class="nrow col"><div><b>Ausstiegsklausel</b>${star('rc')}<small>Fester Ablösebetrag, bei dem der Spieler wechseln darf</small></div>${seg('negSet','rt',N.rt,types)}
      ${N.rt!=='none'?`<div class="row" style="margin-top:8px"><button class="btn sm" data-act="negRc" data-v="-1">−</button>${amtInput('rc',N.rc)}<button class="btn sm" data-act="negRc" data-v="1">+</button>${[1,1.5,2,3,5].map(m=>`<button class="btn sm" data-act="negRcMul" data-v="${m}">${String(m).replace('.',',')}× MW</button>`).join('')}</div><div class="small muted" style="margin-top:4px">Marktwert: ${money(p.val)} · je niedriger die Klausel, desto zufriedener ist ein ehrgeiziger Spieler</div>${clauseWin}`:''}</div>`;
    const sat=clamp(E.ratio*100,0,130),satCls=E.ratio>=1?'good':E.ratio>=.9?'gold':'bad';
    return `<div class="negc"><h2 style="margin-bottom:2px">${buy?'Transfer':'Vertrag anpassen / verlängern'}: ${esc(fullname(p))}</h2>
     <div class="small muted">${POS_LABEL[p.pos]} · ${p.age} J. · ${esc(natName(p.nat))} · Stärke ${ovr(p)} · Pot. ${potDisp(p)} · aktuell ${money(mon(p.wage))}/Monat${p.club!==null?' bis '+contractEnd(p):''}</div>
     ${buy?`<div class="news" style="margin-top:10px">${p.club!==null?(bf.deal?`🤝 <b>Ablöse mit ${esc(club(p.club).name)} vereinbart:</b> ${bidText(bf.deal.bid)}. Jetzt fehlt nur noch die Einigung mit dem Spieler.`:bf.clause?`⚡ <b>Ausstiegsklausel:</b> Für <b>${money(fee)}</b> darf ${esc(pname(p))} wechseln – ${esc(club(p.club).name)} kann nicht ablehnen. Zuerst musst du dich aber mit dem Spieler auf einen Vertrag einigen; erst dann wird die Klausel gezogen und die Ablöse überwiesen.`:`<b>${esc(club(p.club).name)}</b> verlangt <b>${money(fee)}</b> Ablöse.`):'Vereinslos: keine Ablöse, aber '+money(hand)+' Handgeld.'} Transferbudget: <b>${money(u.tBudget)}</b></div>`:''}
     <div class="small" style="margin-top:8px">Berater: <b>${esc(agentOf(p).name)}</b> (${esc(agentOf(p).agency)}) · ${esc(agentOf(p).lbl)} – ${esc(agentOf(p).desc)}</div>
     ${wi.length?`<div class="small" style="margin-top:8px">Wünsche des Beraters: ${wi.map(k=>`<span class="pill gold">★ ${WISH_LABEL[k]}</span>`).join(' ')}</div>`:''}
     <div class="neggrid">
      <div class="card"><h3>Grunddaten</h3>
        <label class="f">Rolle im Kader <span class="muted">(Empfehlung: ${ROLES[sugg].short})</span></label>${N.years===0?`<div class="small muted">${ROLES[p.role].label} (bleibt unverändert)</div>`:seg('negSet','role',N.role,roles)}
        <label class="f" style="margin-top:10px">Laufzeit (bis 30.06.${endYear+1})</label>${seg('negSet','years',N.years,yearOpts)}
        <label class="f" style="margin-top:10px">Gehalt brutto pro Monat</label>
        <div class="row"><button class="btn sm" data-act="negWageStep" data-v="-1">−</button>${amtInput('mw',N.mw,'big'+(over?' bad':''))}<button class="btn sm" data-act="negWageStep" data-v="1">+</button><button class="btn sm" data-act="negWageSet">An Forderung anpassen</button></div>
        <div class="small muted" style="margin-top:4px">Betrag direkt eintippen, z. B. <i>85.000</i>, <i>85 Tsd</i> oder <i>1,2 Mio</i> – mit Enter bestätigen.</div>
        <div class="small" style="margin-top:6px">Netto ca. <b>${money(nt.net/12)}</b>/Monat · Abzüge ${Math.round(nt.rate*100)} % <span class="muted">(${esc(nt.lbl)})</span></div>
        <div class="small ${over?'bad':'muted'}">Gehaltsbudget frei: ${money(mon(free))}/Monat${over?' – zu wenig! Budget unter Finanzen umschichten.':''}</div>
        <h3 style="margin-top:14px">Gehaltsanpassungen</h3>${adjRows}
        <h3 style="margin-top:14px">Klauseln</h3>${clauseRow}
      </div>
      <div class="card"><h3>Prämien</h3>${bonusRows}</div>
     </div>
     <div class="card nsum">
       <div class="nsat"><div class="row" style="justify-content:space-between"><b>Zufriedenheit des Beraters</b><b class="${satCls}">${Math.round(E.ratio*100)} %</b></div><div class="cbar"><i style="width:${sat/1.3}%;background:var(--${satCls==='gold'?'gold':satCls})"></i></div>
         <div class="small muted" style="margin-top:4px">${N.years===0?'Bewertet gegen den aktuellen Vertrag. Ab 100 % stimmt er der Anpassung zu.':'Ab 100 % unterschreibt er sicher, knapp darunter vielleicht.'} Prämien zählen für Spieler weniger als festes Gehalt.</div></div>
       <div class="nkpi"><div><span>Gehalt / Saison</span><b>${money(cost.wage)}</b></div><div><span>Erw. Prämien / Saison</span><b>${money(cost.bonus)}</b></div><div><span>Einmalig</span><b>${money(fee+hand+si)}</b></div><div><span>Gesamtvolumen</span><b>${money(fee+hand+si+(cost.wage+cost.bonus)*E.yrs)}</b></div></div>
     </div>
     <div class="small muted">Versuche übrig: ${Math.max(0,3-(p.negTries||0))}</div>
     ${N.msg?`<div class="news ${N.ok?'t-transfer':'t-coach'}" style="margin-top:10px">${N.msg}</div>`:''}
     <div class="row" style="margin-top:14px;justify-content:space-between"><button class="btn pri" data-act="negSubmit" ${over||(p.negTries||0)>=3?'disabled':''}>Angebot abgeben</button><button class="btn" data-act="closeModal">Schließen</button></div></div>`;
  };
}
function negSubmit(){
  const N=UI.neg,p=S.players[N.pid],u=userClub(),buy=N.mode==='buy';
  const fail=m=>{N.msg=m;N.ok=false;render()};
  if((p.negTries||0)>=3)return fail('Der Berater hat die Gespräche für diese Saison abgebrochen.');
  const D=buy?userDeal(p.id):null,bf=buy?(D?{fee:D.bid.fee,deal:D,clause:false}:buyFee(p,u)):{fee:0,clause:false};
  if(buy&&p.club!==null&&!bf.clause&&!D)return fail('Zuerst musst du dich mit dem Verein auf eine Ablöse einigen.');
  if(buy){
    if(!isWindow())return fail('Das Transferfenster ist geschlossen.');
    if(p.club===S.user)return fail('Spieler gehört schon dir.');
    if(u.players.length>=32)return fail('Dein Kader ist voll (max. 32).');
    if(p.club!==null&&!bf.clause&&!D&&club(p.club).players.length<=19)return fail(`${esc(club(p.club).name)} gibt keine Spieler mehr ab – Kader zu klein.`);
    if(p.club!==null&&!D&&club(p.club).rep-u.rep>22&&ovr(p)>=clubAvg(club(p.club))-2)return fail(`${esc(pname(p))} hat kein Interesse – ${esc(club(p.club).name)} ist ihm sportlich zu weit voraus.`);
  }
  const E=negEval(N,p,u),fee=bf.fee,hand=buy&&p.club===null?E.W*6:0,si=E.ct.si||0;
  if(buy&&u.tBudget<fee+hand+si)return fail(`Nicht genug Transferbudget (nötig: ${money(fee+hand+si)}).`);
  if(!buy&&si&&u.budget<si)return fail('Für die Unterschriftsprämie ist nicht genug Geld auf dem Konto.');
  const free=u.wBudget-(wageBill(u)-(buy?0:p.wage));if(E.W>free)return fail('Das Gehalt sprengt dein Gehaltsbudget.');
  if(N.years!==0){const sugg=suggestRole(p,u),gap=ROLE_ORDER.indexOf(N.role)-ROLE_ORDER.indexOf(sugg);
    if(gap>=2){p.negTries=(p.negTries||0)+1;return fail(`Als ${ROLES[N.role].label} will er nicht unterschreiben – er sieht sich mindestens als ${ROLES[ROLE_ORDER[ROLE_ORDER.indexOf(sugg)+1]].label}.`)}}
  const qa=buy&&p.club!==null?inqFor(p.id,S.user):null;
  if(qa&&inqFresh(qa)&&qa.res&&qa.res.agent&&qa.res.agent.lvl==='no'&&E.ratio<1.25){p.negTries=(p.negTries||0)+1;return fail(`Sein Berater hatte dir schon gesagt, dass er kein Interesse hat. Nur ein deutlich besseres Paket (mind. 125 %) könnte ihn umstimmen.`)}
  const accept=E.ratio>=1||(N.years!==0&&rnd()<clamp((E.ratio-.85)/.15,0,1)*.8);
  if(!accept){p.negTries=(p.negTries||0)+1;p.mor=clamp(p.mor-2,15,100);
    return fail(E.ratio>=.92?`Knapp! Das Paket erreicht ${Math.round(E.ratio*100)} % seiner Vorstellung – etwas mehr Gehalt oder eine Prämie, die er sich wünscht, könnte reichen.`:`Abgelehnt – das Paket liegt bei nur ${Math.round(E.ratio*100)} % seiner Vorstellung (entspricht ca. ${money(mon(E.dem))} brutto/Monat).`)}
  if(buy){
    const until=S.season+N.years-(S.week<winterStart()?1:0),fromName=p.club!==null?club(p.club).name:'vereinslos';
    executeDeal(p,u,{...(D?D.bid:{}),fee},{wage:E.W,until,role:N.role,ct:E.ct});if(S.deals)delete S.deals[p.id];
    if(si){payBonus(si,'si');u.tBudget=Math.max(0,u.tBudget-si)}
    addNews('transfer',`Neuzugang: ${fullname(p)}`,`Von ${esc(fromName)} für ${D?bidText(D.bid):fee?money(fee):'ablösefrei'}${bf.clause?' (Ausstiegsklausel)':''} · ${money(N.mw)} brutto/Monat bis ${contractEnd(p)} · ${ROLES[N.role].label}${si?` · Unterschriftsprämie ${money(si)}`:''}.`);
  }else{
    const pd=p.ct?p.ct.pd||0:0;
    if(N.years!==0){p.until=S.season+N.years;p.role=N.role}
    p.wage=E.W;p.ct=Object.assign({},E.ct,{n:0,pd});p.negTries=0;p.mor=clamp(p.mor+(E.ratio>1.05?10:6),15,100);p.unhappy=false;
    if(si)payBonus(si,'si');
    addNews('transfer',`${fullname(p)}: ${N.years===0?'Vertrag angepasst':'verlängert'}`,`Vertrag bis ${contractEnd(p)} · ${money(N.mw)} brutto/Monat · ${ROLES[p.role].label}${si?` · Unterschriftsprämie ${money(si)}`:''}.`);
  }
  UI.modal=null;UI.neg=null;S.rng=RNG;save();toast(buy?`${fullname(p)} unterschreibt!`:'Vertrag unterschrieben!');
}

/* ---------- Ablöseverhandlung (Kauf und Verkauf) ---------- */
function userDeal(pid){const D=S.deals&&S.deals[pid];if(!D)return null;if(D.season!==S.season||!isWindow()||S.week>D.exp){delete S.deals[pid];return null}return D}
function bidKey(pid){return pid+':'+S.season+':'+(S.week<4?'s':'w')}
function scoutEst(p){const t=sellerTarget(p),f=1+(mkRng(hashStr('sc'+p.id+S.season))()-.5)*.24*(1-.6*crewK(userClub(),'scout'));return nice(t*f)}
/* ---------- Zahlungsplan-Editor (Angebot & Verhandlungsraum) ---------- */
function deferLimit(){const u=userClub(),open=userInstallments().filter(r=>r.from===S.user).reduce((t,r)=>t+r.amt,0);return Math.max(0,Math.round((u.tBudget*1.5+Math.max(0,u.budget)*.3-open)/1e5)*1e5)}
function planTarget(ns){if(ns==='bid')return UI.bid.b;const V=S.vr&&S.vr[UI.vr.pid];return V&&V.club.offer}
function planRows(b){
  const rows=[];if(b.feeD)rows.push(`<div class="crow"><span>Ablöse<small>fällig am ${fmtDate(b.feeD)}</small></span><b>${money(b.fee)}</b></div>`);
  for(const x of b.plan||[])rows.push(`<div class="crow"><span>Rate<small>fällig am ${fmtDate(x.d)}</small></span><b>${money(x.amt)}</b></div>`);
  return rows.join('');
}
function planEditor(b,ns){
  const t=today(),mx=maxPayDate(),chips=feeDateChips(),pl=b.plan||[];
  const dIn=(act,v,i)=>`<label class="minp dinp"><input type="date" data-chg="${act}" data-ns="${ns}" ${i!==undefined?`data-i="${i}"`:''} value="${v||''}" min="${addDaysIso(t,1)}" max="${mx}"></label>`;
  const amt=(i,v)=>`<label class="minp"><input type="text" inputmode="decimal" data-chg="pAmt" data-ns="${ns}" data-i="${i}" value="${v?fmtNum(v):''}" placeholder="0"><span>€</span></label>`;
  return `<div class="nrow"><div><b>Fälligkeit der Ablöse</b><small>sofort bei Unterschrift oder zu einem festen Datum</small></div>
     <div class="chipsel"><button class="${!b.feeD?'on':''}" data-act="pFeeD" data-ns="${ns}" data-v="">Sofort</button>${chips.map(d=>`<button class="${b.feeD===d?'on':''}" data-act="pFeeD" data-ns="${ns}" data-v="${d}">${fmtDate(d)}</button>`).join('')}</div>
     <div class="drow"><span>eigenes Datum</span>${dIn('pFeeDate',b.feeD)}</div></div>
   <div class="nrow"><div><b>Raten</b><small>beliebig viele, jede mit eigenem Fälligkeitsdatum</small></div>
     ${pl.map((x,i)=>`<div class="row planrow">${amt(i,x.amt)}<span class="small muted">am</span>${dIn('pDate',x.d,i)}<button class="btn sm" data-act="pDel" data-ns="${ns}" data-i="${i}">✕</button></div>`).join('')}
     <div class="chipsel" style="margin-top:6px"><button data-act="pAdd" data-ns="${ns}">+ Rate</button><button data-act="pPreset" data-ns="${ns}" data-v="y2">2 Jahresraten</button><button data-act="pPreset" data-ns="${ns}" data-v="y3">3 Jahresraten</button><button data-act="pPreset" data-ns="${ns}" data-v="h4">4 Halbjahresraten</button>${pl.length?`<button data-act="pPreset" data-ns="${ns}" data-v="none">keine Raten</button>`:''}</div></div>`;
}
function planChanged(ns){if(ns==='bid'){const B=UI.bid;if(B.res!=='counter'){B.res=null;B.msg=null}}render()}
function bidModal(){
  return ()=>{
    const B=UI.bid,p=S.players[B.pid],u=userClub();if(!p)return '';const sell=B.mode==='sell',o=sell?S.offers.find(x=>x.id===B.oid):null;
    const other=sell?(o?club(o.from):null):club(p.club);if(!other)return '<p>Das Angebot ist nicht mehr gültig.</p><button class="btn" data-act="closeModal">Schließen</button>';
    const b=B.b,tries=(S.btries||{})[bidKey(p.id)]||0,left=sell?3-((o&&o.rounds)||0):3-tries;
    const seg=(k,cur,vals)=>`<div class="seg">${vals.map(([v,l])=>`<button class="${String(cur)===String(v)?'on':''}" data-act="bidSet" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const inp=(k,v)=>`<label class="minp"><input type="text" inputmode="decimal" data-chg="bidAmt" data-k="${k}" value="${v?fmtNum(v):''}" placeholder="0"><span>€</span></label>`;
    const over=!sell&&bidNow(b)>u.tBudget,overL=!sell&&bidLater(b)>deferLimit();
    const head=sell?`<h2 style="margin-bottom:2px">Gegenangebot an ${esc(other.name)}</h2><div class="small muted">für ${esc(fullname(p))} · ${POS_LABEL[p.pos]} · ${p.age} J. · Stärke ${ovr(p)} · Marktwert ${money(p.val)} · Vertrag bis ${contractEnd(p)}</div>
        <div class="news" style="margin-top:10px">Aktuelles Angebot: <b>${bidText(o.bid)}</b> (Gesamtwert ${money(bidTotal(o.bid))}). Trage ein, was du verlangst.</div>`
      :`<h2 style="margin-bottom:2px">Ablöse-Angebot an ${esc(other.name)}</h2><div class="small muted">für ${esc(fullname(p))} · ${POS_LABEL[p.pos]} · ${p.age} J. · Stärke ${ovr(p)} · Marktwert ${money(p.val)} · Vertrag bis ${contractEnd(p)}</div>
        <div class="news" style="margin-top:10px">Vorstellung von ${esc(other.name)} laut deinem Scout: ca. <b>${money(scoutEst(p))}</b>${p.role==='schluessel'?' – er ist dort Schlüsselspieler, unter Wert gibt ihn niemand ab':''}. Präsident ${esc(other.staff.pres.name)}: ${PRES[other.staff.pres.trait].label}.</div>`;
    return `<div class="negc">${head}
      <div class="neggrid">
        <div class="card"><h3>Ablöse</h3>
          <div class="nrow"><div class="nhead"><div><b>Ablöse</b><small>Hauptzahlung</small></div>${inp('fee',b.fee)}</div>
            <div class="chipsel">${[.8,.9,1,1.1,1.25].map(m=>{const v=nice((sell?bidTotal(o.bid):scoutEst(p))*m);return `<button data-act="bidSet" data-k="fee" data-v="${v}">${money(v)}</button>`}).join('')}</div></div>
          ${planEditor(b,'bid')}
          <div class="nrow"><div class="nhead"><div><b>Erfolgsbonus</b><small>einmalig nach einer Zahl an Pflichtspielen</small></div>${inp('ao',b.ao)}</div>
            ${b.ao?`<div class="row" style="gap:8px"><span class="small muted">nach</span>${seg('aoN',b.aoN||25,AO_N.map(n=>[n,n+' Spielen']))}</div>`:''}</div>
          <div class="nrow"><div><b>Weiterverkaufsbeteiligung</b><small>Anteil an der Ablöse, wenn ${sell?'der Käufer ihn':'du ihn'} später weiterverkauf${sell?'t':'st'}</small></div>${seg('so',b.so||0,SO_OPTS.map(x=>[x,x?x+' %':'keine']))}</div>
        </div>
        <div class="card"><h3>Übersicht</h3>
          <div class="crow"><span>Gesamtwert<small>Ablöse + Raten + Bonus</small></span><b>${money(bidTotal(b))}</b></div>
          <div class="crow"><span>Sofort fällig<small>bei Unterschrift</small></span><b class="${over?'bad':''}">${money(bidNow(b))}</b></div>
          ${planRows(normBid(b))}
          ${b.ao?`<div class="crow"><span>Erfolgsbonus<small>nach ${b.aoN} Pflichtspielen für ${sell?esc(other.short):'dich'}</small></span><b>${money(b.ao)}</b></div>`:''}
          ${b.so?`<div class="crow"><span>Weiterverkauf<small>${b.so} % einer künftigen Ablöse</small></span><b>${b.so} %</b></div>`:''}
          ${sell?'':`<div class="small ${over||overL?'bad':'muted'}" style="margin-top:8px">Transferbudget: ${money(u.tBudget)}${over?' – reicht nicht für den Sofort-Betrag!':''} · Spätere Zahlungen genehmigt der Vorstand bis ${money(deferLimit())}${overL?' – überschritten!':''}${(()=>{const open=userInstallments().filter(r=>r.from===S.user).reduce((t,r)=>t+r.amt,0);return open?` · offene Raten: ${money(open)}`:''})()}</div>`}
          <div class="small muted" style="margin-top:8px">Später fälliges Geld ist für den Verkäufer weniger wert (ca. 6 % pro Jahr Abschlag), ein Erfolgsbonus etwa die Hälfte. Der Gegenwert für ihn: <b>${money(bidValue(normBid(b),p))}</b>. Verhandlungsrunden übrig: ${Math.max(0,left)}</div>
        </div>
      </div>
      ${B.msg?`<div class="news ${B.res==='yes'?'t-transfer':B.res==='counter'||B.res==='sent'?'t-offer':'t-coach'}" style="margin-top:12px">${B.msg}${B.res==='counter'&&!sell?`<div class="row" style="margin-top:8px"><button class="btn sm pri" data-act="bidTake">Gegenangebot annehmen</button><button class="btn sm" data-act="bidUseCounter">In die Felder übernehmen</button></div>`:''}${B.res==='yes'&&!sell?`<div class="row" style="margin-top:8px"><button class="btn sm pri" data-act="negOpen" data-id="${p.id}" data-mode="buy">✍️ Weiter zu den Vertragsgesprächen</button></div>`:''}</div>`:''}
      ${!B.msg&&(sell?o&&o.wait:pendingBid(p.id))?`<div class="news t-offer" style="margin-top:12px">📨 ${sell?'Dein Gegenangebot':'Dein Angebot'} liegt beim Verein – Antwort bis ${fmtDate((S.pbids||[]).find(x=>x.pid===p.id).when)}.</div>`:''}
      <div class="row" style="margin-top:14px;justify-content:space-between">${B.res==='yes'||B.res==='no'||B.res==='sent'||(sell?o&&o.wait:pendingBid(p.id))?'<span></span>':`<button class="btn pri" data-act="bidSubmit" ${over||overL||left<=0?'disabled':''}>${sell?'Gegenangebot senden':'Angebot abschicken'}</button>`}<button class="btn" data-act="closeModal">Schließen</button></div></div>`;
  };
}
function bidSubmit(){
  const B=UI.bid,p=S.players[B.pid],u=userClub(),b=normBid(B.b);
  const say=(res,msg)=>{B.res=res;B.msg=msg;save();render()};
  if(!isWindow())return say('no','Das Transferfenster ist geschlossen.');
  if(B.mode==='sell'){
    const o=S.offers.find(x=>x.id===B.oid);if(!o)return say('no','Das Angebot ist nicht mehr gültig.');
    if(o.wait)return say('sent','Dein Gegenangebot liegt bereits bei ihnen – warte die Antwort ab.');
    const R=sendCounter(o,b),c=club(o.from);
    if(R.now)return say('sent','Deadline Day – die Antwort ist schon da, schau in den Posteingang.');
    return say('sent',`📨 Gegenangebot an ${esc(c.name)} verschickt (${bidText(b)}). Sie prüfen deine Forderung und melden sich in etwa ${R.days} Tagen (bis ${fmtDate(R.when)}) – die Antwort kommt in den Posteingang.`);
  }
  const s=club(p.club);S.btries=S.btries||{};const k=bidKey(p.id);
  if((S.btries[k]||0)>=3)return say('no',`${esc(s.name)} will in diesem Fenster nicht mehr über ${esc(pname(p))} sprechen.`);
  if(u.players.length>=32)return say('no','Dein Kader ist voll (max. 32).');
  if(s.players.length<=19)return say('no',`${esc(s.name)} gibt keine Spieler mehr ab – Kader zu klein.`);
  if(s.rep-u.rep>22&&ovr(p)>=clubAvg(s)-2)return say('no',`${esc(pname(p))} hat kein Interesse – ${esc(s.name)} ist sportlich zu weit voraus.`);
  if(bidNow(b)>u.tBudget)return say('no','Der Sofort-Betrag übersteigt dein Transferbudget.');
  if(bidLater(b)>deferLimit())return say('no','So viele spätere Zahlungen genehmigt der Vorstand nicht.');
  if(pendingBid(p.id))return say('sent','Dein Angebot liegt bereits beim Verein – warte die Antwort ab.');
  S.btries[k]=(S.btries[k]||0)+1;
  const R=sendBid(p,b);
  if(R.now){B.res=null;B.msg=null;UI.modal=null;save();render();return}
  return say('sent',`📨 Angebot an ${esc(s.name)} verschickt. Der Verein prüft es und meldet sich in etwa ${R.days} Tagen (bis ${fmtDate(R.when)})${R.why.length?' – '+R.why.join(', '):''}. Die Antwort kommt in den Posteingang.`);
  const j=sellerJudge(p,b);
  if(j.res==='yes'){S.deals=S.deals||{};S.deals[p.id]={bid:b,season:S.season,exp:windowEnd()};addNews('transfer',`Ablöse vereinbart: ${fullname(p)}`,`${esc(s.name)} akzeptiert dein Angebot (${bidText(b)}). Jetzt musst du dich noch mit dem Spieler einigen – bis zum Ende des Transferfensters.`);
    return say('yes',`✅ ${esc(s.name)} akzeptiert: <b>${bidText(b)}</b>. Jetzt musst du dich nur noch mit dem Spieler einigen.`)}
  if(j.res==='no'){if(S.btries[k]>=3)S.btries[k]=3;return say('no',j.msg)}
  B.counter=j.bid;if(S.btries[k]>=3)return say('no',j.msg+' Mehr Runden gibt es in diesem Fenster nicht – sie bleiben bei ihrer Forderung.');
  return say('counter',j.msg);
}

/* ---------- Anfrage stellen ---------- */
function inqModal(){
  return ()=>{
    const Q=UI.inq,p=S.players[Q.pid],u=userClub(),s=club(p.club);if(!p||!s)return '';
    const seg=(k,cur,vals)=>`<div class="seg">${vals.map(([v,l])=>`<button class="${cur===v?'on':''}" data-act="inqSet" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const A=agentOf(p),open=(S.inq||[]).find(x=>x.pid===p.id&&x.by===S.user&&x.st==='open');
    return `<div class="negc"><h2 style="margin-bottom:2px">Anfrage: ${esc(fullname(p))}</h2><div class="small muted">${POS_LABEL[p.pos]} · ${p.age} J. · Stärke ${ovr(p)} · ${esc(s.name)} (${esc(leagueName(s))}) · ${ROLES[p.role].label} · Vertrag bis ${contractEnd(p)}</div>
      <div class="card" style="margin-top:12px"><label class="f">Wen kontaktierst du?</label>${seg('to',Q.to,[['club',`Verein (Sportdirektor ${esc(s.staff.dir.name)})`],['agent',`Berater (${esc(A.name)})`],['both','Beide']])}
        <label class="f" style="margin-top:10px">Worum geht es?</label>${seg('kind',Q.kind,[['buy','Fester Transfer'],['loan','Leihe'],['both','Transfer oder Leihe']])}
        <p class="small muted" style="margin-top:10px">Der <b>Verein</b> sagt dir, ob er überhaupt verkaufen bzw. verleihen würde und in welchem Rahmen. Der <b>Berater</b> verrät, ob der Spieler offen für einen Wechsel zu euch ist und was er verdienen möchte. Anfragen sind jederzeit möglich – auch außerhalb des Transferfensters – und verpflichten zu nichts. Die Antwort dauert ein paar Tage.</p></div>
      ${Q.msg?`<div class="news t-offer" style="margin-top:10px">${Q.msg}</div>`:open?`<div class="news t-offer" style="margin-top:10px">🔎 Es läuft bereits eine Anfrage – Antwort bis ${fmtDate(open.when)}.</div>`:''}
      <div class="row" style="margin-top:14px;justify-content:space-between">${Q.msg||open?'<span></span>':'<button class="btn pri" data-act="inqSend">Anfrage senden</button>'}<button class="btn" data-act="closeModal">Schließen</button></div></div>`;
  };
}
/* ---------- Leihangebot ---------- */
function loanModal(){
  return ()=>{
    const B=UI.loan,p=S.players[B.pid],u=userClub(),s=club(p.club);if(!p||!s)return '';const t=B.t;
    const seg=(k,cur,vals)=>`<div class="seg">${vals.map(([v,l])=>`<button class="${String(cur)===String(v)?'on':''}" data-act="loanSet" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const inp=(k,v)=>`<label class="minp"><input type="text" inputmode="decimal" data-chg="loanAmt" data-k="${k}" value="${v?fmtNum(v):''}" placeholder="0"><span>€</span></label>`;
    const q=inqFor(p.id,S.user),hint=q&&q.st==='done'&&q.res.club&&q.res.club.loanTxt?q.res.club.loanTxt:'Tipp: Mit einer Anfrage erfährst du vorher, ob und zu welchen Bedingungen eine Leihe möglich ist.';
    const dur=t.dur||'1',weeks=loanWeeks(dur),cost=(t.fee||0)+t.ws/100*p.wage*weeks,pend=pendingBid(p.id),R=(S.bidRes||{})[p.id];
    return `<div class="negc"><h2 style="margin-bottom:2px">Leihangebot an ${esc(s.name)}</h2><div class="small muted">für ${esc(fullname(p))} · ${POS_LABEL[p.pos]} · ${p.age} J. · Stärke ${ovr(p)} · bei ${esc(s.short)}: ${ROLES[p.role].label} · bei dir wäre er: ${ROLES[suggestRole(p,u)].label}</div>
      <div class="news" style="margin-top:10px">${hint}</div>
      <div class="neggrid"><div class="card"><h3>Konditionen</h3>
        <div class="nrow"><div class="nhead"><div><b>Leihgebühr</b><small>einmalig an ${esc(s.short)}</small></div>${inp('fee',t.fee)}</div></div>
        <div class="nrow"><div class="nhead"><div><b>Gehaltsübernahme</b><small>Anteil am Gehalt (${money(mon(p.wage))} brutto/Monat), den du zahlst</small></div><label class="minp"><input type="text" inputmode="decimal" data-chg="loanPct" value="${String(t.ws).replace('.',',')}" style="width:70px"><span>%</span></label></div>
          <div class="chipsel">${WS_OPTS.map(x=>`<button class="${t.ws===x?'on':''}" data-act="loanSet" data-k="ws" data-v="${x}">${x} %</button>`).join('')}</div>
          <div class="split"><div style="width:${t.ws}%"></div></div>
          <div class="row" style="justify-content:space-between;gap:8px"><span class="small"><b>Du (${esc(u.short)}):</b> ${money(mon(p.wage*t.ws/100))}/Monat · ${money(p.wage*t.ws/100*weeks)} gesamt</span><span class="small" style="text-align:right"><b>${esc(s.short)}:</b> ${money(mon(p.wage*(100-t.ws)/100))}/Monat · ${money(p.wage*(100-t.ws)/100*weeks)} gesamt</span></div></div>
        <div class="nrow"><div class="nhead"><div><b>Kaufoption</b><small>fester Preis zum Ende der Leihe (leer = keine)</small></div>${inp('opt',t.opt)}</div>${t.opt?seg('obl',t.obl?1:0,[[0,'Option (du entscheidest)'],[1,'Kaufpflicht']]):''}</div>
        <div class="nrow"><div><b>Dauer</b><small>${durText(dur)} – danach kehrt er zurück${t.opt?', außer die Option wird gezogen':''}</small></div>${seg('dur',dur,loanDurOpts(p))}${p.until<S.season+1?`<small class="muted">Länger nicht möglich – sein Vertrag bei ${esc(s.short)} endet am 30.06.${p.until+1}.</small>`:''}</div>
      </div><div class="card"><h3>Übersicht</h3>
        <div class="crow"><span>Leihgebühr</span><b>${money(t.fee||0)}</b></div>
        <div class="crow"><span>Dein Gehaltsanteil<small>${String(t.ws).replace('.',',')} % · ca. ${weeks} Spielwochen</small></span><b>${money(mon(p.wage*t.ws/100))}/M.</b></div>
        <div class="crow"><span>Anteil ${esc(s.short)}<small>${String(Math.round((100-t.ws)*10)/10).replace('.',',')} %</small></span><b>${money(mon(p.wage*(100-t.ws)/100))}/M.</b></div>
        <div class="crow"><span>Kosten der Leihe gesamt</span><b>${money(cost)}</b></div>
        ${t.opt?`<div class="crow"><span>${t.obl?'Kaufpflicht':'Kaufoption'}</span><b>${money(t.opt)}</b></div>`:''}
        <div class="small muted" style="margin-top:8px">Junge Spieler verleiht ein Verein nur, wenn sie Spielpraxis bekommen. Stamm- und Schlüsselspieler werden praktisch nie verliehen.</div></div></div>
      ${B.msg?`<div class="news ${B.res==='yes'?'t-transfer':'t-offer'}" style="margin-top:12px">${B.msg}</div>`:''}
      ${R&&R.res==='loancounter'&&!B.msg?`<div class="news t-offer" style="margin-top:12px">Gegenvorschlag von ${esc(s.name)}: <b>${loanText(R.t)}</b><div class="row" style="margin-top:8px"><button class="btn sm pri" data-act="loanTake">Annehmen</button></div></div>`:''}
      <div class="row" style="margin-top:14px;justify-content:space-between">${B.msg||pend?'<span>'+(pend?'📨 Dein Leihangebot wird geprüft – Antwort bis '+fmtDate(pend.when):'')+'</span>':'<button class="btn pri" data-act="loanSend">Leihangebot abschicken</button>'}<button class="btn" data-act="closeModal">Schließen</button></div></div>`;
  };
}
/* ---------- Antwort auf eine Anfrage an dich ---------- */
function uinqModal(){
  return ()=>{
    const X=UI.uinq,x=(S.uinq||[]).find(y=>y.id===X.id),p=x&&S.players[x.pid],c=x&&club(x.by);if(!x||!p)return '<p>Anfrage nicht mehr aktuell.</p><button class="btn" data-act="closeModal">Schließen</button>';
    return `<h2 style="margin-bottom:2px">Antwort an ${esc(c.name)}</h2><div class="small muted">Anfrage zu ${esc(fullname(p))} · Marktwert ${money(p.val)}</div>
      <label class="f" style="margin-top:12px">Ab welcher Ablöse würdest du verkaufen?</label>
      <div class="row"><label class="minp big"><input type="text" inputmode="decimal" data-chg="uinqAmt" value="${fmtNum(X.price)}"><span>€</span></label>${[1,1.25,1.5,2].map(m=>`<button class="btn sm" data-act="uinqMul" data-v="${m}">${String(m).replace('.',',')}× MW</button>`).join('')}</div>
      <p class="small muted">Der Verein orientiert sich an deiner Antwort: Er bietet nur, wenn er sich diesen Betrag leisten kann.</p>
      <div class="row" style="margin-top:14px;justify-content:space-between"><button class="btn pri" data-act="uinqSend">Antwort senden</button><button class="btn" data-act="closeModal">Abbrechen</button></div>`;
  };
}

/* ---------- Taktik ---------- */
function roleSelect(i,phase,cur,pos,p){
  const ks=rolesFor(pos,phase);
  return `<select data-chg="roleSel" data-i="${i}" data-ph="${phase}" style="width:100%">${ks.map(k=>{const R=roleDef(k),st=p?roleStars(roleScore(p,k)):0;return `<option value="${k}" ${k===cur?'selected':''}>${R.lbl}${p?' '+'★'.repeat(st)+'☆'.repeat(5-st):''}</option>`}).join('')}</select>`;
}
function renderTactic(){
  const c=userClub(),t=c.tactic;ensureTactic(c);const str=teamStrength(c),slots=slotsOf(c),ph=UI.tph||'oop',P=tacticProfile(c),m=P.m;
  const cur=ph==='ip'?t.ip:t.oop,other=ph==='ip'?t.oop:t.ip;
  const dots=cur.map((xy,i)=>{const p=c.lineup[i]&&S.players[c.lineup[i]],pos=slots[i],col=GROUP_COLOR[GROUP[pos]],rk=ph==='ip'?t.roles[i]:t.droles[i],R=roleDef(rk);
    const r=p?Math.round(rateAt(p,pos)):'-',fit=p?roleStars(roleScore(p,rk)):0;
    return `<div class="slot drag ${UI.selSlot===i?'sel':''}" data-drag="${i}" style="left:${xy[0]}%;top:${xy[1]}%"><div class="dot" style="background:${col};color:#08130d">${r}</div><div class="nm">${p?esc(p.ln):'<i>leer</i>'}${p&&(p.inj?' 🩹':'')+(p.sus?' 🟥':'')}</div><div class="rl" title="${R?esc(R.lbl):''}">${R?esc(R.sh):''}<span>${'★'.repeat(fit)}</span></div></div>`}).join('');
  const ghosts=ph==='both'?'':other.map((xy,i)=>`<div class="ghost" style="left:${xy[0]}%;top:${xy[1]}%"></div>`).join('');
  const lines=`<svg class="tlines" viewBox="0 0 100 100" preserveAspectRatio="none">${t.oop.map((a,i)=>`<line x1="${a[0]}" y1="${a[1]}" x2="${t.ip[i][0]}" y2="${t.ip[i][1]}"/>`).join('')}</svg>`;
  const both=ph==='both'?t.oop.map((xy,i)=>{const p=c.lineup[i]&&S.players[c.lineup[i]],col=GROUP_COLOR[GROUP[slots[i]]];return `<div class="slot mini" style="left:${xy[0]}%;top:${xy[1]}%"><div class="dot" style="background:${col}">${slots[i]}</div></div><div class="slot mini ipd" style="left:${t.ip[i][0]}%;top:${t.ip[i][1]}%"><div class="dot">${p?esc(p.ln.slice(0,3)):''}</div></div>`}).join(''):'';
  const seg=(key,obj)=>`<div class="seg">${Object.entries(obj).map(([k,l])=>`<button class="${t[key]===k?'on':''}" data-act="tac" data-k="${key}" data-v="${k}">${l}</button>`).join('')}</div>`;
  const bar=(l,v)=>`<div class="attr"><span>${l}</span><div class="bar"><i style="width:${clamp(v,0,100)}%"></i></div><b>${Math.round(v)}</b></div>`;
  const kv=(l,v,s)=>`<div class="crow"><span>${l}${s?`<small>${s}</small>`:''}</span><b>${v}</b></div>`;
  const pct=f=>`<b class="${f>1.005?'good':f<.995?'bad':''}">${f>=1?'+':''}${Math.round((f-1)*100)} %</b>`;
  const rows=slots.map((pos,i)=>{const p=c.lineup[i]&&S.players[c.lineup[i]];
    return `<tr><td><span class="pill" style="border-color:${GROUP_COLOR[GROUP[pos]]}88">${pos}</span></td><td><a data-act="tplayer" data-i="${i}" style="cursor:pointer"><b>${p?esc(fullname(p)):'<i>leer</i>'}</b></a>${p?`<div class="small muted">${FAM_LABEL(familiarity(p,pos))} · Stärke ${Math.round(rateAt(p,pos))}</div>`:''}</td><td>${roleSelect(i,'ip',t.roles[i],pos,p)}</td><td><select data-chg="dutySel" data-i="${i}">${Object.entries(DUTIES).map(([k,D])=>`<option value="${k}" ${t.du[i]===k?'selected':''}>${D.lbl}</option>`).join('')}</select></td><td>${roleSelect(i,'oop',t.droles[i],pos,p)}</td><td class="small"><a data-act="tplayer" data-i="${i}" style="cursor:pointer">${(t.pi[i]||[]).length?(t.pi[i]).map(k=>PINSTR[k].lbl).join(', '):'<span class="muted">+ hinzufügen</span>'}</a></td></tr>`}).join('');
  const sel=UI.troleInfo!==undefined&&UI.troleInfo!==null?UI.troleInfo:null;
  return `<h2>Taktik <span class="small muted">${t.cust?'eigene Formation':esc(t.f)}</span></h2><div class="grid g2">
   <div>
    <div class="seg ptabs" style="margin:0 0 10px">${[['oop','🛡️ Gegen den Ball'],['ip','⚽ Mit Ball'],['both','🔀 Beide']].map(([k,l])=>`<button class="${ph===k?'on':''}" data-act="tph" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="pbwrap"><div class="pitch tpitch ${ph}" id="tpitch"><div class="mid"></div><div class="circ"></div>${ph==='both'?lines+both:ghosts+dots}</div>
    <div class="bench" id="tbench"><h3>Ersatzbank</h3><div class="small muted" style="margin-bottom:6px">Auf einen Spieler im Feld ziehen zum Einwechseln.</div>${squadOf(c).filter(p=>!c.lineup.includes(p.id)).sort((a,b)=>POS_ORDER[a.pos]-POS_ORDER[b.pos]||ovr(b)-ovr(a)).map(p=>`<div class="bp ${(p.inj||p.sus)?'inj':''}" data-bench="${p.id}"><span class="pill" style="border-color:${GROUP_COLOR[GROUP[p.pos]]}88">${p.pos}</span><span class="bn"><b>${esc(p.ln)}</b><small>${Math.round(p.fit)}% · ${p.inj?'🩹 '+p.inj+' Wo.':p.sus?'🟥 gesperrt':'Moral '+Math.round(p.mor)}</small></span>${ovrTag(ovr(p))}</div>`).join('')||'<p class="small muted">Keine Ersatzspieler.</p>'}</div></div>
    <div class="row" style="justify-content:center;gap:14px;margin-top:8px"><span class="small">Gegen den Ball: <b>${m.oopShape}</b></span><span class="small">Mit Ball: <b>${m.ipShape}</b></span></div>
    <p class="small muted" style="text-align:center">${ph==='both'?'Linien zeigen die Laufwege vom Defensiv- ins Offensivsystem. Zum Verschieben eine Phase wählen.':'Ziehe Spieler frei über das Feld. Tippe einen Spieler an für Rolle, Aufgabe und Anweisungen. Die Position (z. B. IV, ZM) ergibt sich aus der Stellung gegen den Ball.'}</p>
    <div class="row" style="justify-content:center">${ph!=='oop'?'<button class="btn sm" data-act="ipDerive">↻ Form mit Ball aus den Rollen ableiten</button>':''}<button class="btn sm" data-act="tMirror">⇆ Spiegeln</button></div>
   </div>
   <div class="grid" style="align-content:start">
    <div class="card"><label class="f">Grundformation (setzt beide Phasen neu)</label><div class="seg">${Object.keys(FORMATIONS).map(f=>`<button class="${t.f===f&&!t.cust?'on':''}" data-act="formation" data-v="${f}">${f}</button>`).join('')}</div>
     <div class="seg ptabs" style="margin:14px 0 4px">${[['gen','Allgemein'],['ip','Mit Ball'],['oop','Gegen den Ball']].map(([k,l])=>`<button class="${(UI.ttab||'gen')===k?'on':''}" data-act="ttab" data-v="${k}">${l}</button>`).join('')}</div>
     ${(UI.ttab||'gen')==='gen'?`<label class="f" style="margin-top:8px">Mentalität</label>${seg('men',MENTALITY)}
     <label class="f" style="margin-top:12px">Pressinghöhe</label>${seg('press',PRESSING)}
     <label class="f" style="margin-top:12px">Spielstil</label>${seg('style',STYLE)}`:instrHtml(t,(UI.ttab==='ip')?'ti':'td')}
     <div class="row" style="margin-top:14px"><button class="btn" data-act="autoXI">⚡ Beste Elf aufstellen</button><button class="btn" data-act="bestRolesBtn">🎯 Passende Rollen wählen</button></div>
     <label class="small" style="display:flex;gap:8px;align-items:flex-start;margin-top:12px"><input type="checkbox" data-chg="autoXIToggle" ${c.autoXI?'checked':''}><span><b>Co-Trainer stellt vor jedem Spiel auf</b><br><span class="muted">Wählt die beste fitte Elf für deine Formation. Rollen und Formen bleiben wie von dir eingestellt.</span></span></label></div>
    <div class="card"><h3>Analyse</h3>
      ${kv('Restverteidigung',m.rest+' Spieler','bleiben mit Ball in der eigenen Hälfte')}
      ${kv('Letzte Linie',m.front+' Spieler','mit Ball im letzten Drittel')}
      ${kv('Breite',m.wide+' Spieler','mit Ball an den Seitenlinien')}
      ${kv('Zentrum',m.central+' Spieler','mit Ball zwischen den Linien / in den Halbräumen')}
      ${kv('Kompaktheit',Math.round(m.depth)+' %','Abstand erste–letzte Linie gegen den Ball')}
      ${kv('Abwehrlinie',m.line<68?'hoch':m.line<76?'mittel':'tief','gegen den Ball')}
      <div class="row" style="gap:14px;margin-top:8px"><span class="small">Abwehr ${pct(P.D)}</span><span class="small">Mittelfeld ${pct(P.M)}</span><span class="small">Angriff ${pct(P.A)}</span><span class="small muted">durch Formen & Rollen</span></div>
      <div style="margin-top:8px">${tacticHints(c).map(([cl,tx])=>`<div class="small ${cl}" style="margin-top:4px">• ${tx}</div>`).join('')}</div></div>
    <div class="card"><h3>Mannschaftsteile</h3>${bar('Abwehr',str.D)}${bar('Mittelfeld',str.M)}${bar('Angriff',str.A)}</div>
   </div></div>
   <div class="card" style="margin-top:14px"><h3>Rollen</h3>
    <div class="tw"><table class="roles"><thead><tr><th>Pos</th><th>Spieler</th><th>Rolle mit Ball</th><th>Aufgabe</th><th>Rolle gegen den Ball</th><th>Anweisungen</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small muted" style="margin-top:8px">Sterne = Eignung des Spielers für die Rolle (aus seinen Attributen). Die Rolle mit Ball bestimmt auch seinen Laufweg, wenn du die Form mit Ball ableiten lässt.</p>
    <div class="rolehelp">${(()=>{const seen=new Set();return slots.flatMap((pos,i)=>[t.roles[i],t.droles[i]]).filter(k=>!seen.has(k)&&seen.add(k)).map(k=>{const R=roleDef(k);return `<div><b>${esc(R.lbl)}</b> <span class="muted small">(${R.p})</span><div class="small">${esc(R.d)}</div><div class="small muted">Wichtig: ${Object.keys(R.a).map(a=>ATTR_LABEL[a]).join(', ')}</div></div>`}).join('')})()}</div>
   </div>`;
}
function slotPicker(){return ()=>{const c=userClub(),slots=slotsOf(c);if(UI.selSlot===null)return '';
  const pos=slots[UI.selSlot];const ps=squadOf(c).sort((a,b)=>rateAt(b,pos)-rateAt(a,pos));const rk=c.tactic.roles[UI.selSlot],dk=c.tactic.droles[UI.selSlot];
  return `<div class="row" style="justify-content:space-between"><h3 style="margin:0">Spieler für ${pos} (${POS_LABEL[pos]})</h3><button class="btn sm" data-act="slotCancel">Abbrechen</button></div>
   <div class="small muted" style="margin-top:4px">Rollen: ${esc(roleDef(rk).lbl)} (mit Ball) · ${esc(roleDef(dk).lbl)} (gegen den Ball)</div>
   <div class="tw" style="margin-top:8px;max-height:65vh;overflow:auto"><table><thead><tr><th>Pos</th><th>Name</th><th class="n">Stärke hier</th><th class="n">Rolle</th><th class="n">Fit</th><th></th></tr></thead><tbody>${ps.map(p=>{const where=c.lineup.indexOf(p.id);return `<tr class="click" data-act="assign" data-id="${p.id}"><td>${p.pos}</td><td>${esc(fullname(p))}${(p.inj?' <span class="bad">🩹</span>':'')+(p.sus?' <span class="bad">🟥</span>':'')}<div class="small muted">${FAM_LABEL(familiarity(p,pos))}</div></td><td class="n">${ovrTag(Math.round(rateAt(p,pos)))}</td><td class="n gold small">${'★'.repeat(roleStars(roleScore(p,rk)))}</td><td class="n">${Math.round(p.fit)}%</td><td class="small muted">${where>=0?'auf '+slots[where]:''}</td></tr>`}).join('')}</tbody></table></div>`}}

function instrHtml(t,grp){
  const O=grp==='ti'?TI_OPTS:TD_OPTS,cur=t[grp];
  return Object.entries(O).map(([k,def])=>`<label class="f" style="margin-top:10px" title="${esc(def.d)}">${def.lbl} <span class="muted" style="font-weight:400">– ${esc(def.d)}</span></label><div class="seg">${Object.entries(def.o).map(([v,l])=>`<button class="${cur[k]===v?'on':''}" data-act="tinstr" data-g="${grp}" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`).join('');
}
/* Spieler-Panel: Rolle, Aufgabe, Anweisungen */
function tpModal(){
  return ()=>{
    const c=userClub(),t=c.tactic,i=UI.tpi,slots=slotsOf(c),pos=slots[i],p=c.lineup[i]&&S.players[c.lineup[i]];
    const card=(k,phase)=>{const R=roleDef(k),on=(phase==='ip'?t.roles[i]:t.droles[i])===k,sc=p?roleScore(p,k):0;
      return `<button class="rcard ${on?'on':''}" data-act="tpRole" data-ph="${phase}" data-v="${k}"><b>${esc(R.lbl)}</b><span class="gold">${p?'★'.repeat(roleStars(sc))+'<span class="muted">'+'☆'.repeat(5-roleStars(sc))+'</span>':''}</span><small>${esc(R.d)}</small><small class="muted">${Object.keys(R.a).map(a=>ATTR_LABEL[a]+(p?' '+at(p,a):'')).join(' · ')}</small></button>`};
    const pins=pinstrFor(pos);
    return `<div class="negc"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><h2 style="margin:0">${p?esc(fullname(p)):'Freie Position'}</h2><div class="small muted">${POS_LABEL[pos]} (${pos})${p?` · Stärke hier ${Math.round(rateAt(p,pos))} · ${FAM_LABEL(familiarity(p,pos))} · Fitness ${Math.round(p.fit)}%`:''}</div></div>
       <div class="row"><button class="btn sm" data-act="slot" data-i="${i}">🔄 Spieler tauschen</button>${p?`<button class="btn sm" data-act="player" data-id="${p.id}">Profil</button>`:''}</div></div>
      <h3 style="margin-top:14px">⚽ Rolle mit Ball</h3><div class="rgrid">${rolesFor(pos,'ip').map(k=>card(k,'ip')).join('')}</div>
      <h3 style="margin-top:14px">Aufgabe</h3><div class="seg">${Object.entries(DUTIES).map(([k,D])=>`<button class="${t.du[i]===k?'on':''}" data-act="tpDuty" data-v="${k}">${D.lbl}</button>`).join('')}</div><div class="small muted" style="margin-top:4px">${DUTIES[t.du[i]].d}</div>
      <h3 style="margin-top:14px">🛡️ Rolle gegen den Ball</h3><div class="rgrid">${rolesFor(pos,'oop').map(k=>card(k,'oop')).join('')}</div>
      <h3 style="margin-top:14px">Individuelle Anweisungen <span class="small muted">(max. 3)</span></h3><div class="chipsel">${pins.map(k=>{const I=PINSTR[k],on=(t.pi[i]||[]).includes(k);return `<button class="${on?'on':''}" data-act="tpPin" data-v="${k}" title="${ATTR_LABEL[I.a]}${p?' '+at(p,I.a):''}">${on?'✓ ':''}${I.lbl}${p?` <span class="muted">(${ATTR_LABEL[I.a]} ${at(p,I.a)})</span>`:''}</button>`}).join('')}</div>
      <label class="small" style="display:flex;gap:8px;align-items:center;margin-top:14px"><input type="checkbox" data-chg="tpAutoMove" ${UI.tpMove!==false?'checked':''}> Laufweg mit Ball automatisch an Rolle & Aufgabe anpassen</label>
      <div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn pri" data-act="closeModal">Fertig</button></div></div>`;
  };
}
(function(){
  let B=null;
  document.addEventListener('pointerdown',e=>{const el=e.target.closest('.bp[data-bench]');if(!el)return;B={el,pid:el.dataset.bench,sx:e.clientX,sy:e.clientY,moved:false,ghost:null};e.preventDefault()});
  document.addEventListener('pointermove',e=>{if(!B)return;if(!B.moved&&Math.abs(e.clientX-B.sx)+Math.abs(e.clientY-B.sy)>6){B.moved=true;const g=B.el.cloneNode(true);g.classList.add('bghost');document.body.appendChild(g);B.ghost=g}
    if(B.ghost){B.ghost.style.left=e.clientX+'px';B.ghost.style.top=e.clientY+'px';document.querySelectorAll('.tpitch .slot.drop').forEach(x=>x.classList.remove('drop'));B.ghost.style.display='none';const t=document.elementFromPoint(e.clientX,e.clientY);B.ghost.style.display='';const sl=t&&t.closest('.slot[data-drag]');if(sl)sl.classList.add('drop')}});
  const end=e=>{if(!B)return;const b=B;B=null;if(b.ghost){b.ghost.style.display='none';const t=document.elementFromPoint(e.clientX,e.clientY);b.ghost.remove();const sl=t&&t.closest('.slot[data-drag]');
      if(sl){const c=userClub(),i=+sl.dataset.drag,old=c.lineup[i],p=S.players[b.pid];c.lineup[i]=b.pid;const was=c.autoXI;c.autoXI=false;save();render();toast(`${p.ln} kommt für ${old&&S.players[old]?S.players[old].ln:'die freie Position'}`+(was?' – Co-Trainer-Aufstellung aus':''));return}
      document.querySelectorAll('.tpitch .slot.drop').forEach(x=>x.classList.remove('drop'));return}
    ACT.player({id:b.pid})};
  document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
})();
function tpMoveIP(){if(UI.tpMove===false)return;const t=userClub().tactic,d=deriveIP(t);t.ip[UI.tpi]=d[UI.tpi]}
/* Drag & Drop auf dem Taktikfeld (Maus und Touch) */
(function(){
  let D=null;
  document.addEventListener('pointerdown',e=>{const el=e.target.closest('.slot[data-drag]');if(!el)return;const pitch=document.getElementById('tpitch');if(!pitch)return;
    D={el,i:+el.dataset.drag,sx:e.clientX,sy:e.clientY,moved:false,rect:pitch.getBoundingClientRect()};el.setPointerCapture&&el.setPointerCapture(e.pointerId);e.preventDefault()});
  document.addEventListener('pointermove',e=>{if(!D)return;const dx=e.clientX-D.sx,dy=e.clientY-D.sy;if(Math.abs(dx)+Math.abs(dy)>5)D.moved=true;if(!D.moved)return;
    const x=clamp((e.clientX-D.rect.left)/D.rect.width*100,3,97),y=clamp((e.clientY-D.rect.top)/D.rect.height*100,D.i===0?78:6,96);
    D.el.style.left=x+'%';D.el.style.top=y+'%';D.x=x;D.y=y;D.el.classList.add('dragging')});
  const end=e=>{if(!D)return;const d=D;D=null;
    if(!d.moved){ACT.tplayer({i:d.i});return}
    const c=userClub(),t=c.tactic,ph=UI.tph||'oop',arr=ph==='ip'?t.ip:t.oop;arr[d.i]=[Math.round(d.x),Math.round(d.y)];t.cust=1;
    if(ph==='oop'){const pos=posFromXY(d.x,d.y,d.i),ks=rolesFor(pos,'ip');if(!ks.includes(t.roles[d.i])){const p=S.players[c.lineup[d.i]];t.roles[d.i]=ks.slice().sort((a,b)=>roleScore(p,b)-roleScore(p,a))[0]}
      const kd=rolesFor(pos,'oop');if(!kd.includes(t.droles[d.i])){const p=S.players[c.lineup[d.i]];t.droles[d.i]=kd.slice().sort((a,b)=>roleScore(p,b)-roleScore(p,a))[0]}}
    save();render()};
  document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
})();

/* ---------- Liga-Auswahl ---------- */
function leagueSelect(cur,chg){
  const groups=S.active.map(code=>`<optgroup label="${esc(natName(code))}">${S.leagues.filter(L=>L.assoc===code).sort((a,b)=>a.tier-b.tier).map(L=>`<option value="${L.id}" ${L.id===cur?'selected':''}>${esc(L.name)}</option>`).join('')}</optgroup>`).join('');
  return `<select data-chg="${chg}" style="max-width:100%">${groups}</select>`;
}

/* ---------- Spielplan ---------- */
function renderFixtures(){
  const u=userClub(),uL=league(u);
  const rows=[];
  uL.fixtures.forEach((md,i)=>{const m=md.find(m=>m.h===S.user||m.a===S.user);const wh=m?whenOf('league',uL,i,m):{d:satOf(uL.rw[i]),t:''};rows.push({w:uL.rw[i],o:0,lbl:`${i+1}. ST`,m,wh,mid:wh&&wh.mid})});
  userCompFixtures().forEach(f=>rows.push({w:f.w,o:1,lbl:`<span class="pill" style="font-size:11px">${COMP[f.C.key].short}</span>`,m:f.m,title:f.label,wh:whenOf('comp',f.C,f.r,f.m)}));
  userNatCupFixtures().forEach(f=>rows.push({w:f.w,o:2,lbl:`<span class="pill" style="font-size:11px;border-color:var(--gold)">Pokal</span>`,m:f.m,title:f.cup.name+' · '+f.label,wh:whenOf('cup',f.cup,f.r,f.m)}));
  userSupercupFixtures().forEach(f=>rows.push({w:f.w,o:-1,lbl:`<span class="pill" style="font-size:11px;border-color:var(--blue)">Supercup</span>`,m:f.m,title:f.sc.name+' · '+f.label,wh:whenOf('sc',f.sc,f.r,f.m)}));
  const key=x=>(x.wh?x.wh.d:'9999')+' '+(x.wh&&x.wh.t||'99:99');
  rows.sort((a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:a.o-b.o);
  let lastMonth='';
  const mine=rows.map(x=>{const mo=x.wh?x.wh.d.slice(0,7):'';let head='';
    if(mo&&mo!==lastMonth){lastMonth=mo;head=`<tr class="fxmonth"><td colspan="5">${MONTHS[+mo.slice(5,7)-1]} ${mo.slice(0,4)}</td></tr>`}
    const when=`<td class="fxwhen"><b>${fmtWhenShort(x.wh)}</b><span>${x.m&&x.wh.t?x.wh.t+' Uhr':''}${x.mid?' · EW':''}</span></td>`;
    const m=x.m;if(!m)return head+`<tr>${when}<td>${x.lbl}</td><td colspan="3" class="muted">spielfrei</td></tr>`;
    const home=m.h===S.user,opp=club(home?m.a:m.h);let res='<span class="muted">–</span>';
    if(m.hg!==null){const won=m.win!==undefined&&m.win!==null?m.win===S.user:null;const gf=home?m.hg:m.ag,ga=home?m.ag:m.hg;const cls=won===true?'good':won===false?'bad':gf>ga?'good':gf<ga?'bad':'';res=`<b class="${cls}">${resultText(m)}</b>`}
    return head+`<tr class="${x.w===S.week?'me':''}" title="${esc((x.title?x.title+' · ':'')+fmtWhenLong(x.wh)+(x.wh.t?', '+x.wh.t+' Uhr':'')+' · Spielwoche '+(x.w+1))}">${when}<td>${x.lbl}</td><td>${home?'H':'A'}</td><td>${badge(opp,22)} ${esc(opp.name)}</td><td class="n">${res}</td></tr>`}).join('');
  const lid=UI.fxLeague!==undefined&&UI.fxLeague!==null?UI.fxLeague:uL.id,L=S.leagues[lid];
  let sel=UI.fxRound;if(sel===undefined||sel===null||sel>=L.fixtures.length){sel=0;for(let r=0;r<L.fixtures.length;r++)if(L.rw[r]<=S.week)sel=r}
  const sl=leagueRoundSlots(L,sel),items=L.fixtures[sel].map((m,k)=>({m,wh:sl[k]||{d:satOf(L.rw[sel]),t:''}}));
  items.sort((a,b)=>(a.wh.d+a.wh.t)<(b.wh.d+b.wh.t)?-1:(a.wh.d+a.wh.t)>(b.wh.d+b.wh.t)?1:0);
  const mid=sl[0]&&sl[0].mid;let lastD='',lastT='';
  const all=items.map(({m,wh})=>{let h='';if(wh.d!==lastD){lastD=wh.d;lastT='';h=`<tr class="fxday"><td colspan="4">${fmtWhenLong(wh)}</td></tr>`}
    const t=wh.t!==lastT?wh.t:'';lastT=wh.t;
    return h+`<tr class="${m.h===S.user||m.a===S.user?'me':''}"><td class="fxtime">${t}</td><td style="text-align:right">${esc(club(m.h).name)} ${badge(club(m.h),20)}</td><td style="text-align:center"><b>${m.hg!==null?m.hg+':'+m.ag:'-:-'}</b></td><td>${badge(club(m.a),20)} ${esc(club(m.a).name)}</td></tr>`}).join('');
  const span=items.length?(items[0].wh.d===items[items.length-1].wh.d?fmtWhenShort(items[0].wh):fmtWhenShort(items[0].wh)+' – '+fmtWhenShort(items[items.length-1].wh)):'';
  return `<h2>Spielplan</h2><div class="grid g2"><div class="tw" style="max-height:72vh;overflow:auto"><table class="fxtab"><thead><tr><th>Termin</th><th>Runde</th><th></th><th>Gegner</th><th class="n">Erg.</th></tr></thead><tbody>${mine}</tbody></table></div>
  <div><div class="row" style="margin-bottom:8px">${leagueSelect(L.id,'fxLeague')}</div><div class="row" style="margin-bottom:8px"><button class="btn sm" data-act="fxRound" data-i="${Math.max(0,sel-1)}">◀</button><b>${sel+1}. Spieltag</b> <span class="small muted">${span}${mid?' · <span class="pill" style="font-size:11px;border-color:var(--gold)">Englische Woche</span>':''}</span><button class="btn sm" data-act="fxRound" data-i="${Math.min(L.fixtures.length-1,sel+1)}">▶</button></div><div class="tw"><table class="fxtab"><tbody>${all}</tbody></table></div><p class="small muted">Anstoßzeiten nach Praxis der jeweiligen Liga · alle Zeiten Ortszeit</p></div></div>`;
}

/* ---------- Tabelle ---------- */
function tableHtml(L,compact){
  const tab=tableOf(L),n=tab.length;
  return `<div class="tw"><table><thead><tr><th class="n">#</th><th>Verein</th><th class="n">Sp</th>${compact?'':'<th class="n">S</th><th class="n">U</th><th class="n">N</th>'}<th class="n">Tore</th><th class="n">Diff</th><th class="n">Pkt</th>${compact?'':'<th>Form</th>'}</tr></thead><tbody>${tab.map((r,i)=>{const c=club(r.id);
    const z=L.tier===1&&i===0?'z-cl':L.up&&i<L.up?'z-cl':L.down&&i>=n-L.down?'z-ab':'';
    return `<tr class="${z} ${r.id===S.user?'me':''} click" data-act="clubInfo" data-id="${r.id}"><td class="n">${i+1}</td><td>${badge(c,22)} ${esc(c.name)}</td><td class="n">${r.sp}</td>${compact?'':`<td class="n">${r.s}</td><td class="n">${r.u}</td><td class="n">${r.n}</td>`}<td class="n">${r.tf}:${r.ta}</td><td class="n">${r.tf-r.ta>0?'+':''}${r.tf-r.ta}</td><td class="n"><b>${r.pts}</b></td>${compact?'':`<td>${r.form.slice(-5).map(f=>`<span style="color:${f==='S'?'var(--accent)':f==='N'?'var(--bad)':'var(--muted)'}">${f}</span>`).join(' ')}</td>`}</tr>`}).join('')}</tbody></table></div>
   <p class="small muted">${L.tier===1?'<span class="good">▌</span> Meister':''}${L.up?' <span class="good">▌</span> Aufstieg ('+L.up+')':''}${L.down?' · <span class="bad">▌</span> Abstieg ('+L.down+')':L.tier===1&&S.leagues.filter(x=>x.assoc===L.assoc).length===1?' · kein Abstieg':''}</p>`;
}
function renderTable(){
  const lid=UI.tableLeague!==null?UI.tableLeague:userClub().league,L=S.leagues[lid];
  const champs=L.champs.slice(0,5).map(c=>`${c.season}/${(c.season+1)%100}: <b>${esc(c.champ)}</b>`).join(' · ');
  return `<div class="row" style="justify-content:space-between;margin-bottom:10px"><h2 style="margin:0">Tabelle</h2>${leagueSelect(L.id,'tableLeague')}</div>${tableHtml(L,false)}${champs?`<p class="small muted">Meister: ${champs}</p>`:''}`;
}

/* ---------- Transfers ---------- */
function renderTransfers(){
  const f=UI.tf,c=userClub();
  const tabs=`<div class="seg" style="margin-bottom:12px"><button class="${f.tab==='plan'?'on':''}" data-act="tfTab" data-v="plan">Kaderplanung</button><button class="${f.tab==='markt'?'on':''}" data-act="tfTab" data-v="markt">Transfermarkt</button><button class="${f.tab==='ticker'?'on':''}" data-act="tfTab" data-v="ticker">Transfer-Ticker</button><button class="${f.tab==='log'?'on':''}" data-act="tfTab" data-v="log">Letzte Wechsel</button></div>`;
  // Filter für Ticker & Wechsel: Land (tk.code) und Liga (tk.lg)
  const tk=UI.tk=UI.tk||{code:'',lg:'',q:'',type:''};
  const clubOk=id=>{const x=club(id);if(!x)return false;if(tk.lg!=='')return x.league===+tk.lg;if(tk.code)return x.assoc===tk.code;return true};
  const pairOk=ids=>ids.some(clubOk);
  if(f.tab==='plan')return `<h2>Transfers</h2>${tabs}${orgPlanPage()}`;
  const filt=`<div class="row" style="gap:8px;margin-bottom:12px">
      <select data-chg="tkCode"><option value="">Alle Länder</option>${S.active.map(code=>`<option value="${code}" ${tk.code===code?'selected':''}>${esc(natName(code))}</option>`).join('')}</select>
      <select data-chg="tkLg"><option value="">Alle Ligen${tk.code?' in '+esc(natName(tk.code)):''}</option>${S.leagues.filter(L=>!tk.code||L.assoc===tk.code).sort((a,b)=>a.assoc.localeCompare(b.assoc)||a.tier-b.tier).map(L=>`<option value="${L.id}" ${String(L.id)===String(tk.lg)?'selected':''}>${esc(L.name)}${tk.code?'':' ('+L.assoc+')'}</option>`).join('')}</select>
      <button class="btn sm" data-act="tkMine">Meine Liga</button><label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-chg="tkInq" ${tk.inq?'checked':''}> Anfragen anzeigen</label>
      <input type="search" placeholder="Spieler oder Verein…" data-chg="tkQ" value="${esc(tk.q)}" style="min-width:180px">
    </div>`;
  const q=tk.q.toLowerCase(),qOk=txt=>!q||txt.toLowerCase().includes(q);
  if(f.tab==='ticker'){
    const run=[...(S.aineg||[]).filter(n=>pairOk([n.buyer,n.seller])).map(n=>({p:S.players[n.pid],a:club(n.buyer),b:club(n.seller),st:n.step==='seller'?'Verkäufer prüft das Angebot':'Käufer prüft das Gegenangebot',bid:n.b,when:n.when})),
      ...(S.talks||[]).filter(t=>t.st==='open'&&pairOk([t.from,t.seller])).map(t=>({p:S.players[t.pid],a:club(t.from),b:club(t.seller),st:t.kind==='clause'?'Spieler verhandelt (Ausstiegsklausel)':'Ablöse steht – Spieler verhandelt',bid:t.bid||{fee:t.fee},when:gameDate(t.dec)}))]
      .filter(x=>x.p&&x.a&&x.b&&qOk(fullname(x.p)+' '+x.a.name+' '+x.b.name));
    const runT=`<h3 style="margin-top:4px">Laufende Verhandlungen <span class="small muted">${run.length}</span></h3>${run.length?`<div class="tw" style="margin-bottom:14px;max-height:46vh;overflow:auto"><table><thead><tr><th>Spieler</th><th>Käufer</th><th>Verkäufer</th><th>Stand</th><th>Angebot</th><th>bis</th></tr></thead><tbody>${run.slice(0,150).map(x=>`<tr class="click" data-act="player" data-id="${x.p.id}"><td><b>${esc(fullname(x.p))}</b> ${ovrTag(ovr(x.p))}</td><td class="small">${esc(x.a.name)}<div class="muted">${esc(leagueName(x.a))}</div></td><td class="small">${esc(x.b.name)}<div class="muted">${esc(leagueName(x.b))}</div></td><td class="small">${x.st}</td><td class="small" style="white-space:normal;min-width:220px">${bidText(normBid(x.bid))}</td><td class="small muted">${fmtDate(x.when)}</td></tr>`).join('')}</tbody></table></div>`:`<p class="small muted">${isWindow()?'Gerade keine laufenden Verhandlungen mit diesem Filter.':'Das Transferfenster ist geschlossen.'}</p>`}`;
    const src=tk.inq?[...(S.tnews||[]),...(S.tinq||[])].sort((a,b)=>(b.season*100+b.w)-(a.season*100+a.w)):(S.tnews||[]);
    const news=src.filter(n=>(tk.lg!==''?n.lg.includes(+tk.lg):tk.code?n.as.includes(tk.code):true)&&qOk(n.title+' '+n.body.replace(/<[^>]+>/g,'')));
    const feed=news.slice(0,200).map(n=>`<div class="news t-${n.type} tick ${n.u?'mine':''}"><b>${n.title}</b> <span class="small muted">· ${fmtDate(n.d)} · ${n.season%100}/W${n.w+1} · ${n.as.map(a=>esc(natName(a))).join(' / ')}</span><div class="small">${n.body}</div></div>`).join('')||'<p class="muted">Noch keine Meldungen mit diesem Filter.</p>';
    return `<h2>Transfers</h2>${tabs}${filt}${runT}<h3 style="margin-top:8px">Transfer-Ticker <span class="small muted">${news.length} Meldungen</span></h3><div class="tickfeed">${feed}</div>`;
  }
  if(f.tab==='log'){
    const list=S.transfers.filter(t=>(t.fid===undefined?(!tk.code&&tk.lg===''):pairOk([t.fid,t.tid]))&&qOk(t.name+' '+t.from+' '+t.to));
    return `<h2>Transfers</h2>${tabs}${filt}<div class="tw"><table><thead><tr><th>Wo.</th><th>Spieler</th><th>Pos</th><th class="n">Alter</th><th class="n">Stärke</th><th>Von</th><th>Nach</th><th class="n">Ablöse</th></tr></thead><tbody>${list.slice(0,200).map(t=>`<tr><td class="muted small">${t.season%100}/W${t.w+1}</td><td>${esc(t.name)} <span class="small muted">${t.nat||''}</span></td><td>${t.pos}</td><td class="n">${t.age}</td><td class="n">${ovrTag(t.o)}</td><td>${esc(t.from)}</td><td>${esc(t.to)}</td><td class="n" ${t.det?`title="${esc(t.det)}"`:''}>${t.loan?'<span class="pill" style="font-size:10px">Leihe</span> ':''}${t.fee?money(t.fee):t.loan?'':'ablösefrei'}${t.det?' <span class="muted small">*</span>':''}</td></tr>`).join('')||'<tr><td colspan="8" class="muted">Noch keine Wechsel mit diesem Filter.</td></tr>'}</tbody></table></div><p class="small muted">* mit Raten, Erfolgsbonus oder Weiterverkaufsbeteiligung – Details beim Antippen bzw. Überfahren.</p>`;
  }
  let ps=Object.values(S.players).filter(p=>p.club!==S.user&&(p.club===null||!club(p.club).guest));
  if(f.pos)ps=ps.filter(p=>p.pos===f.pos);
  if(f.country)ps=ps.filter(p=>p.club!==null&&club(p.club).assoc===f.country);
  if(f.q){const q=f.q.toLowerCase();ps=ps.filter(p=>fullname(p).toLowerCase().includes(q))}
  if(f.free)ps=ps.filter(p=>p.club===null);
  if(f.young)ps=ps.filter(p=>p.age<=21);
  if(f.exp)ps=ps.filter(p=>p.club!==null&&p.until<=S.season);
  const max=parseFloat(f.max)*1e6;if(f.max!==''&&max>=0)ps=ps.filter(p=>buyFee(p,c).fee<=max);
  ps.sort((a,b)=>ovr(b)-ovr(a));const total=ps.length;ps=ps.slice(0,80);
  return `<h2>Transfers</h2>${tabs}
  <div class="card" style="margin-bottom:12px"><div class="row">
   <div><label class="f">Position</label><select data-chg="tfPos"><option value="">Alle</option>${POS_LIST.map(p=>`<option ${f.pos===p?'selected':''}>${p}</option>`).join('')}</select></div>
   <div><label class="f">Land des Vereins</label><select data-chg="tfCountry"><option value="">Alle aktiven</option>${S.active.map(code=>`<option value="${code}" ${f.country===code?'selected':''}>${esc(natName(code))}</option>`).join('')}</select></div>
   <div><label class="f">Max. Ablöse (Mio.)</label><input type="number" min="0" step="0.5" value="${esc(f.max)}" data-chg="tfMax" style="width:110px"></div>
   <div style="flex:1;min-width:150px"><label class="f">Name</label><input value="${esc(f.q)}" data-chg="tfQ" placeholder="Suchen…" style="width:100%"></div>
   <label class="small"><input type="checkbox" data-chg="tfFree" ${f.free?'checked':''}> vereinslos</label>
   <label class="small"><input type="checkbox" data-chg="tfYoung" ${f.young?'checked':''}> U21</label>
   <label class="small"><input type="checkbox" data-chg="tfExp" ${f.exp?'checked':''}> Vertrag läuft aus</label>
  </div><div class="small muted" style="margin-top:8px">Transferbudget: <b style="color:var(--text)">${money(c.tBudget)}</b> · Gehaltsbudget frei: <b style="color:var(--text)">${money(mon(c.wBudget-wageBill(c)))}</b>/Monat · Fenster: ${isWindow()?'<span class="good">offen</span>':'<span class="bad">geschlossen</span>'} · ${total} Treffer${total>80?' (Top 80)':''}</div></div>
  <div class="tw"><table><thead><tr>${PH}<th>Verein</th><th class="n">Preis</th></tr></thead><tbody>
  ${ps.map(p=>playerRow(p,null,`<td>${p.club!==null?esc(club(p.club).name):'<span class="muted">frei</span>'}</td><td class="n"><b>${p.club!==null?(()=>{const bf=buyFee(p,c);return money(bf.fee)+(bf.clause?' <span class="pill gold" title="Ausstiegsklausel" style="font-size:10px;padding:0 6px">AK</span>':'')})():'frei'}</b></td>`)).join('')}</tbody></table></div>`;
}

/* ---------- Finanzen ---------- */
const WAGE_RATE=40;
function renderFinance(){
  const c=userClub(),f=S.fin,wages=wageBill(c),step=rw(Math.max(1000,c.wBudget*.05));
  const inc=f.tv+f.tickets+f.prize+(f.cups||0)+(f.spons||0),exp=f.wages+(f.bonus||0)+(f.staff||0);
  const line=(l,v,cls)=>`<div class="row" style="justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--line)"><span>${l}</span><b class="${cls||''}">${money(v)}</b></div>`;
  return `<h2>Finanzen</h2><div class="grid g2">
   <div class="card"><h3>Kontostand</h3><div style="font-size:30px;font-weight:800" class="${c.budget<0?'bad':''}">${money(c.budget)}</div><div class="small muted">Gehälter aktuell ${money(mon(wages))} pro Monat (${money(wages*52)} pro Jahr)</div>
     <div class="small muted" style="margin-top:6px">Wirtschaftskraft der ${esc(league(c).name)}: <b>${Math.round(c.econ*100)} %</b> der stärksten Liga. Danach richten sich TV-Gelder, Ticketpreise und Gehälter.</div>
     <div class="small muted" style="margin-top:6px">Präsident ${esc(c.staff.pres.name)} (${PRES[c.staff.pres.trait].label}) gibt ${Math.round(PRES[c.staff.pres.trait].tShare*100)} % des Kontostands als Transferbudget frei und lässt dir ${Math.round(PRES[c.staff.pres.trait].saleBack*100)} % der Verkaufserlöse.</div></div>
   <div class="card"><h3>Budgets vom Vorstand</h3>
     <div class="row" style="justify-content:space-between"><span>Transferbudget</span><b>${money(c.tBudget)}</b></div>
     <div class="row" style="justify-content:space-between;margin-top:6px"><span>Gehaltsbudget</span><b>${money(mon(wages))} / ${money(mon(c.wBudget))} pro Monat</b></div>
     <div class="bar" style="margin-top:6px"><i style="width:${clamp(wages/c.wBudget*100,0,100)}%;background:${wages>c.wBudget*.95?'var(--bad)':wages>c.wBudget*.85?'var(--gold)':'var(--accent)'}"></i></div>
     <label class="f" style="margin-top:12px">Budget umschichten (1 € Monatsgehalt = ${(WAGE_RATE*12/52).toLocaleString('de-DE',{maximumFractionDigits:1})} € Transferbudget)</label>
     <div class="row"><button class="btn sm" data-act="shift" data-v="${step}">+${money(mon(step))}/Monat Gehalt <span class="muted">(−${money(step*WAGE_RATE)})</span></button><button class="btn sm" data-act="shift" data-v="-${step}">−${money(mon(step))}/Monat Gehalt <span class="muted">(+${money(step*WAGE_RATE)})</span></button></div></div>
   <div class="card"><h3>Diese Saison</h3>${line('TV-Gelder',f.tv,'good')}${line('Zuschauereinnahmen',f.tickets,'good')}${line('Liga-Prämien',f.prize,'good')}${line('Internationale Wettbewerbe',f.cups||0,'good')}${line('Sponsoring, Vermarktung & Zinsen',f.spons||0,'good')}${line('Spielerverkäufe',f.tOut,'good')}${line('Gehälter & Abfindungen',-f.wages,'bad')}${line('Prämien',-(f.bonus||0),'bad')}${line('Mitarbeiter & Abfindungen',-(f.staff||0),'bad')}${line('Spielerkäufe',-f.tIn,'bad')}${line('Saldo',inc+f.tOut-exp-f.tIn,inc+f.tOut-exp-f.tIn>=0?'good':'bad')}</div>
   <div class="card"><h3>Prämien diese Saison</h3>${BONUS.filter(b=>(f.bon||{})[b.k]).map(b=>line(b.lbl,-(f.bon[b.k]),'bad')).join('')||'<p class="small muted">Noch keine Prämien ausgezahlt.</p>'}<div class="small muted" style="margin-top:8px">Erwartet für die ganze Saison: <b style="color:var(--text)">${money(squadOf(c).reduce((t,p)=>{if(!p.ct)return t;const e=bonusEV(p,c,p.ct,p.role);for(const k in e)t+=e[k];return t},0))}</b> (laut Vertragsklauseln deines Kaders)</div></div>
   <div class="card"><h3>Transferraten & Beteiligungen</h3>${(()=>{const r=userInstallments().sort((a,b)=>instDue(a)<instDue(b)?-1:1);
      const rows=r.map(x=>`<div class="crow"><span>${x.from===S.user?'an':'von'} ${esc(club(x.from===S.user?x.to:x.from).name)}<small>${esc(x.name)} · ${x.kind==='fee'?'Ablöse':'Rate'} fällig am ${fmtDate(instDue(x))}</small></span><b class="${x.from===S.user?'bad':'good'}">${x.from===S.user?'−':'+'}${money(x.amt)}</b></div>`).join('');
      const so=Object.values(S.players).flatMap(p=>(p.so||[]).filter(x=>x.to===S.user).map(x=>({p,x}))).map(({p,x})=>`<div class="crow"><span>${esc(fullname(p))}<small>Weiterverkaufsbeteiligung · jetzt ${p.club!==null?esc(club(p.club).name):'vereinslos'}</small></span><b class="good">${x.pct} %</b></div>`).join('');
      const ao=Object.values(S.players).flatMap(p=>(p.ao||[]).filter(a=>!a.done&&(a.to===S.user||a.from===S.user)).map(a=>({p,a}))).map(({p,a})=>`<div class="crow"><span>${esc(fullname(p))}<small>Erfolgsbonus nach ${a.need} Spielen · bisher ${a.n}</small></span><b class="${a.from===S.user?'bad':'good'}">${a.from===S.user?'−':'+'}${money(a.amt)}</b></div>`).join('');
      return rows+so+ao||'<p class="small muted">Keine offenen Raten, Boni oder Beteiligungen.</p>'})()}</div>
   <div class="card" style="grid-column:1/-1"><h3>Wochenverlauf</h3><div class="tw"><table><thead><tr><th>Woche</th><th class="n">TV</th><th class="n">Tickets</th><th class="n">Gehälter</th><th class="n">Kontostand</th></tr></thead><tbody>${f.log.map(l=>`<tr><td>${l.w}.</td><td class="n">${money(l.tv)}</td><td class="n">${l.tickets?money(l.tickets):'–'}</td><td class="n bad">-${money(l.wages)}</td><td class="n"><b>${money(l.bal)}</b></td></tr>`).join('')||'<tr><td colspan="5" class="muted">Noch keine Wochen gespielt.</td></tr>'}</tbody></table></div></div>
  </div>`;
}

/* ---------- Wettbewerbe ---------- */
function slotRange(sl){const ds=[...new Set((sl||[]).map(x=>x.d))].sort();if(!ds.length)return '';const ts=[...new Set(sl.map(x=>x.t))].sort();
  const one=ds.length===1;return (one?fmtWhenShort({d:ds[0]}):fmtWhenShort({d:ds[0]})+' – '+fmtWhenShort({d:ds[ds.length-1]}))+(one&&ts.length===1?' · '+ts[0]+' Uhr':'')}
function schedRows(items,rowFn,cols){
  items=items.slice().sort((a,b)=>{const ka=a.wh.d+a.wh.t,kb=b.wh.d+b.wh.t;return ka<kb?-1:ka>kb?1:((b.m.h===S.user||b.m.a===S.user)-(a.m.h===S.user||a.m.a===S.user))});
  let lastD='',lastT='';
  return items.map(({m,wh})=>{let h='';if(wh.d!==lastD){lastD=wh.d;lastT='';h=`<tr class="fxday"><td colspan="${cols+1}">${fmtWhenLong(wh)}</td></tr>`}
    const t=wh.t!==lastT?wh.t:'';lastT=wh.t;return h+rowFn(m).replace(/^(<tr[^>]*>)/,`$1<td class="fxtime">${t}</td>`)}).join('');
}
function cupMatchRow(m){return `<tr class="${m.h===S.user||m.a===S.user?'me':''}"><td style="text-align:right"><a data-act="clubInfo" data-id="${m.h}" style="cursor:pointer">${esc(club(m.h).name)}</a> ${badge(club(m.h),20)}</td><td style="text-align:center"><b>${resultText(m)}</b></td><td>${badge(club(m.a),20)} <a data-act="clubInfo" data-id="${m.a}" style="cursor:pointer">${esc(club(m.a).name)}</a></td></tr>`}
function cupTableHtml(C,rows,zones){
  return `<div class="tw"><table><thead><tr><th class="n">#</th><th>Verein</th><th>Land</th><th class="n">Sp</th><th class="n">S</th><th class="n">U</th><th class="n">N</th><th class="n">Tore</th><th class="n">Pkt</th></tr></thead><tbody>${rows.map((r,i)=>{const c=club(r.id);
    return `<tr class="${zones(i)} ${r.id===S.user?'me':''} click" data-act="clubInfo" data-id="${r.id}"><td class="n">${i+1}</td><td>${badge(c,20)} ${esc(c.name)}</td><td class="small muted">${c.assoc}</td><td class="n">${r.sp}</td><td class="n">${r.s}</td><td class="n">${r.u}</td><td class="n">${r.n}</td><td class="n">${r.tf}:${r.ta}</td><td class="n"><b>${r.pts}</b></td></tr>`}).join('')}</tbody></table></div>`;
}
function cupsModeTabs(){const m=UI.cupMode||'int';return `<div class="seg" style="margin-bottom:12px">${[['int','International'],['nat','Pokale & Supercups'],['coef','Fünfjahreswertung']].map(([k,l])=>`<button class="${m===k?'on':''}" data-act="cupMode" data-v="${k}">${l}</button>`).join('')}</div>`}
function renderCups(){
  if(UI.cupMode==='nat')return renderNatCups();
  if(UI.cupMode==='coef')return renderCoef();
  return renderIntCups();
}
function renderNatCups(){
  const cups=S.ncups||[];
  if(!cups.length)return `<h2>Wettbewerbe</h2>${cupsModeTabs()}<div class="card"><p>Die nationalen Pokale starten mit der nächsten Saison.</p></div>`;
  const code=UI.natCup||userClub().assoc,cup=cups.find(c=>c.code===code)||cups[0];
  const sel=cups.map(c=>`<button class="btn sm ${c.code===cup.code?'pri':''}" style="margin:2px" data-act="natCupSel" data-v="${c.code}">${c.code===userClub().assoc?'⭐ ':''}${esc(c.name)}</button>`).join('');
  const row=m=>`<tr class="${m.h===S.user||m.a===S.user?'me':''}"><td style="text-align:right">${m.win===m.h?'<b>':''}<a data-act="clubInfo" data-id="${m.h}" style="cursor:pointer">${esc(club(m.h).name)}</a>${m.win===m.h?'</b>':''} <span class="small muted">${tierLabel(club(m.h))}</span> ${badge(club(m.h),20)}</td><td style="text-align:center;white-space:nowrap"><b>${resultText(m)}</b></td><td>${badge(club(m.a),20)} <span class="small muted">${tierLabel(club(m.a))}</span> ${m.win===m.a?'<b>':''}<a data-act="clubInfo" data-id="${m.a}" style="cursor:pointer">${esc(club(m.a).name)}</a>${m.win===m.a?'</b>':''}</td></tr>`;
  const sortU=ms=>ms.slice().sort((a,b)=>((b.h===S.user||b.a===S.user)-(a.h===S.user||a.a===S.user))||((club(b.h).amateur||club(b.a).amateur)-(club(a.h).amateur||club(a.a).amateur)));
  const rounds=cup.rounds.slice().reverse().map(r=>{const st=cup.stages.find(s=>s.si===r.si);const ams=r.matches.filter(m=>club(m.h).amateur||club(m.a).amateur).length;
    const sl=r.matches.length?cupRoundSlots(cup,r,r.si||0,r.matches.length):[{d:satOf(r.w),t:''}];const it=r.matches.map((m,k)=>({m,wh:sl[k]||sl[0]}));
    return `<div class="card" style="margin-bottom:10px"><h3>${esc(r.label)} <span class="small muted">${slotRange(sl)} · ${r.matches.length} Spiele${ams?' · '+ams+' mit Amateuren':''}</span></h3><div class="tw"><table class="fxtab"><tbody>${schedRows(it,row,3)}</tbody></table></div></div>`}).join('');
  const upcoming=cup.spec.map((sp,i)=>({sp,i})).filter(x=>x.i>=cup.stages.length&&x.sp.add.length).map(x=>`<div class="small">Steigen in der Runde „${esc(x.sp.name)}“ ein: ${x.sp.add.map(id=>esc(club(id).short)).join(', ')}</div>`).join('');
  const hist=(S.natHist[cup.code]||[]).map(h=>`<div class="small">${h.season}/${(h.season+1)%100}: <b>${esc(h.winner)}</b></div>`).join('')||'<p class="small muted">Noch kein Sieger.</p>';
  const cf=ASSOC[cup.code].confed,lvl=COMPS.filter(d=>d.confed===cf).length>1?2:1,target=COMPS.find(d=>d.confed===cf&&d.level===lvl);
  const sc=(S.supercups||[]).find(x=>x.code===cup.code),rule=SUPERCUPS[cup.code];
  let scHtml='';
  if(rule){
    const scHist=(S.scHist[cup.code]||[]).slice(0,5).map(h=>`${h.season}/${(h.season+1)%100}: <b>${esc(h.winner)}</b>`).join(' · ');
    let inner;
    if(!sc)inner=`<p class="small muted">Startet, sobald Meister und Pokalsieger einer Saison feststehen.</p>`;
    else if(sc.cancelled)inner=`<p class="small">In dieser Saison entfällt der Supercup (Double des Meisters).</p>`;
    else inner=sc.rounds.map(r=>`<div class="small muted" style="margin-top:6px">${esc(r.label)} · <b style="color:var(--text)">${fmtWhenLong({d:satOf(r.w)})}, 20:30 Uhr</b>${r.neutral?' · neutraler Platz':' · beim Meister'}</div>${r.matches.length?`<div class="tw"><table class="fxtab"><tbody>${r.matches.map(m=>row(m).replace(/^(<tr[^>]*>)/,'$1<td class="fxtime">20:30</td>')).join('')}</tbody></table></div>`:'<div class="small muted">Gegner stehen nach dem Halbfinale fest.</div>'}`).join('')+(sc.info?`<p class="small gold">${esc(sc.info)}</p>`:'')+(sc.winner!==null?`<p><b>🏆 ${esc(club(sc.winner).name)}</b></p>`:'');
    scHtml=`<div class="card" style="margin-bottom:12px"><h3>🛡️ ${esc(rule.name)}</h3><p class="small muted">${esc(rule.rule)}</p>${inner}${scHist?`<div class="small muted" style="margin-top:6px">Sieger: ${scHist}</div>`:''}</div>`;
  }
  return `<h2>Wettbewerbe</h2>${cupsModeTabs()}<div class="card" style="margin-bottom:12px">${sel}</div>
   <div class="row" style="justify-content:space-between"><h2 style="margin:0 0 8px">${esc(cup.name)}</h2><span class="small muted">${cup.code===userClub().assoc?'<b class="good">Dein Verein: '+natCupStatus(cup,S.user)+'</b>':''}</span></div>
   <p class="small muted">${esc(cup.note||'')} Unentschieden nach 90 Minuten: Verlängerung, dann Elfmeterschießen. Der Pokalsieger bekommt einen Startplatz in der ${target?target.name:'Kontinentalwettbewerb'}. Ist er über die Liga schon höher qualifiziert, rückt der nächste Ligaplatz nach.</p>
   ${upcoming?`<div class="card" style="margin-bottom:10px">${upcoming}</div>`:''}
   ${cup.winner!==null?`<div class="card" style="text-align:center;margin-bottom:10px"><div style="font-size:34px">🏆</div><b>${esc(club(cup.winner).name)}</b> gewinnt den ${esc(cup.name)}!</div>`:''}
   <div class="grid" style="grid-template-columns:minmax(0,1fr) 260px;gap:14px" id="cupgrid"><div>${scHtml}${cupPlanHtml(cup)}${rounds}</div><div class="card"><h3>Pokalsieger</h3>${hist}</div></div>`;
}
function renderCoef(){
  const cf=UI.coefConfed||ASSOC[userClub().assoc].confed;const {ranked,res}=slotTable(cf);const defs=COMPS.filter(d=>d.confed===cf).sort((a,b)=>a.level-b.level);
  const yrs=[4,3,2,1,0].map(i=>S.season-1-i);
  const rows=ranked.map((a,i)=>{const h=S.coefHist[a.code]||[];const cur=coefSeasonValue(a.code);const act=S.active.includes(a.code);
    return `<tr class="${a.code===userClub().assoc?'me':''}"><td class="n">${i+1}</td><td><b>${esc(a.name)}</b> ${act?'<span class="pill good" style="font-size:10px">aktiv</span>':''}</td>${[4,3,2,1,0].map(k=>`<td class="n small muted">${h[k]!==undefined?h[k].toFixed(3):'–'}</td>`).join('')}<td class="n"><b>${coefTotal(a.code).toFixed(3)}</b></td><td class="n small">${cur?cur.toFixed(3):'–'}</td>${defs.map(d=>`<td class="n">${res[a.code][d.key]||'<span class="muted">–</span>'}</td>`).join('')}</tr>`}).join('');
  return `<h2>Wettbewerbe</h2>${cupsModeTabs()}${confedTabs(cf,'coefConfed')}
   <p class="small muted">Pro Saison: Punkte aller Vereine eines Verbands in den Kontinentalwettbewerben (Sieg 2, Remis 1, jede erreichte K.-o.-Runde 1, Titel 2, Teilnahmebonus) geteilt durch die Zahl der Teilnehmer. Die Summe der letzten fünf Saisons bestimmt die Startplätze ${defs.map(d=>d.short).join(' / ')} der nächsten Saison. Startwerte sind an der realen Stärke orientiert.</p>
   <div class="tw"><table><thead><tr><th class="n">#</th><th>Verband</th>${yrs.map(y=>`<th class="n">${y%100}/${(y+1)%100}</th>`).join('')}<th class="n">Summe</th><th class="n">laufend</th>${defs.map(d=>`<th class="n">${d.short}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
   <p class="small muted">Spalten ${defs.map(d=>d.short).join(', ')}: Startplätze nach aktuellem Stand. Der Pokalsieger nimmt einen Platz im zweithöchsten Wettbewerb ein.</p>`;
}
function renderIntCups(){
  const cur=S.comps||[];
  if(!cur.length)return `<h2>Wettbewerbe</h2>${cupsModeTabs()}<div class="card"><p>Die internationalen Wettbewerbe starten mit der nächsten Saison. Die Startplätze kommen aus den Abschlusstabellen der Ligen.</p></div>`;
  const key=UI.cup||(userComps()[0]||cur.find(C=>!C.bg)||cur[0]).key;const C=cur.find(x=>x.key===key)||cur[0],def=COMP[C.key];
  const sel=CONFEDS.map(cf=>{const items=COMPS.filter(d=>d.confed===cf.id);return `<div style="margin-bottom:6px"><span class="small muted" style="display:inline-block;min-width:92px">${cf.name}</span>${items.map(d=>{const inst=cur.find(x=>x.key===d.key);const mine=inst&&!inst.bg&&inst.teams.includes(S.user);return `<button class="btn sm ${d.key===C.key?'pri':''}" style="margin:2px" data-act="cupSel" data-v="${d.key}">${mine?'⭐ ':''}${d.short}</button>`}).join('')}</div>`}).join('');
  const hist=(S.compHist[def.key]||[]).map(h=>`<div class="small">${h.season}/${(h.season+1)%100}: <b>${esc(h.winner)}</b> <span class="muted">${h.assoc}</span></div>`).join('')||'<p class="small muted">Noch kein Sieger.</p>';
  let body='';
  if(C.bg){
    const names=(C.entries||[]).map(e=>`${esc(e.name)} <span class="muted">${e.code}</span>`);
    body=`<div class="card"><p class="small muted">Diese Konföderation läuft im Hintergrund, weil kein Land aus ihr voll simuliert wird. Der Sieger wird am Saisonende ermittelt.</p><h3>Teilnehmer</h3><div class="small">${names.join(' · ')}</div></div>`;
  }else{
    const tabs=[];if(def.fmt==='swiss')tabs.push(['league','Ligaphase']);if(def.fmt==='groups')tabs.push(['groups','Gruppen']);tabs.push(['ko','K.-o.-Runde'],['games','Spiele']);
    const tab=UI.cupTab||(C.stage==='ko'?'ko':tabs[0][0]);
    const tabHtml=`<div class="seg" style="margin-bottom:10px">${tabs.map(([k,l])=>`<button class="${tab===k?'on':''}" data-act="cupTab" data-v="${k}">${l}</button>`).join('')}</div>`;
    let inner='';
    if(tab==='league'){const rows=compTable(C,C.teams,'league');const d=def.direct,po=def.playoff?24:d;
      inner=cupTableHtml(C,rows,i=>i<d?'z-cl':i<po?'z-rel':'z-ab')+`<p class="small muted"><span class="good">▌</span> direkt ins Achtelfinale${def.playoff?' · <span class="gold">▌</span> K.-o.-Playoffs':''} · <span class="bad">▌</span> ausgeschieden</p>`}
    else if(tab==='groups')inner=`<div class="grid g2">${C.groups.map((g,gi)=>`<div><h3>Gruppe ${String.fromCharCode(65+gi)}</h3>${cupTableHtml(C,compTable(C,g,'groups'),i=>i<2?'z-cl':'')}</div>`).join('')}</div>`;
    else if(tab==='ko')inner=C.ko.length?C.ko.map((st,si)=>`<div class="card" style="margin-bottom:10px"><h3>${esc(st.name)} <span class="small muted">${st.legs===2?'Hin- und Rückspiel':'ein Spiel'} · ${st.rounds.map(ri=>slotRange(compRoundSlots(C,C.rounds[ri]))).join(' / ')}</span></h3>${st.ties.map(t=>{const a=club(t.a),b=club(t.b);const legs=st.rounds.map(ri=>{const R=C.rounds[ri],k=st.ties.indexOf(t),m=R.matches[k];if(m.hg===null){const w=compRoundSlots(C,R)[k];return w?fmtWhenShort(w)+' '+w.t:'-:-'}return m.h===t.a?m.hg+':'+m.ag:m.ag+':'+m.hg}).join(' · ');
      return `<div class="row small ${t.a===S.user||t.b===S.user?'good':''}" style="justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--line)"><span>${t.winner===t.a?'<b>':''}${badge(a,18)} ${esc(a.name)}${t.winner===t.a?'</b>':''} – ${t.winner===t.b?'<b>':''}${badge(b,18)} ${esc(b.name)}${t.winner===t.b?'</b>':''}</span><span class="muted">${legs}${t.winner!==null&&st.legs===2?' (ges. '+t.ga+':'+t.gb+')':''}${t.pen?' · i.E. '+(()=>{const lm=C.rounds[st.rounds[st.rounds.length-1]].matches[st.ties.indexOf(t)];return lm.h===t.a?lm.ph+':'+lm.pa:lm.pa+':'+lm.ph})():t.et?' · n.V.':''}</span></div>`}).join('')}</div>`).join('')+(C.winner!==null?`<div class="card" style="text-align:center"><div style="font-size:34px">🏆</div><b>${esc(club(C.winner).name)}</b> gewinnt die ${def.name}!</div>`:'')+compPlanHtml(C,def):`<p class="muted">Die K.-o.-Runde beginnt nach der ${def.fmt==='swiss'?'Ligaphase':'Gruppenphase'}.</p>`+compPlanHtml(C,def);
    else{const rounds=C.rounds.slice().sort((a,b)=>a.w-b.w);inner=rounds.map(r=>{const ms=r.matches.filter(m=>!C.teams.includes(S.user)||true);const sl=compRoundSlots(C,r);return `<h3 style="margin-top:12px">${esc(r.label)} <span class="small muted">${slotRange(sl)}</span></h3><div class="tw"><table class="fxtab"><tbody>${schedRows(ms.map((m,k)=>({m,wh:sl[k]||sl[0]})),cupMatchRow,3)}</tbody></table></div>`}).join('')+compPlanHtml(C,def)}
    body=`${tabHtml}${inner}`;
  }
  return `<h2>Wettbewerbe <span class="small muted">Saison ${S.season}/${(S.season+1)%100}</span></h2>${cupsModeTabs()}<div class="card" style="margin-bottom:12px">${sel}</div>
   <div class="row" style="justify-content:space-between"><h2 style="margin:0 0 8px">${def.name}</h2><span class="small muted">${def.n} Teams · ${def.fmt==='swiss'?'Ligaphase + K.-o.':def.fmt==='groups'?'Gruppen + K.-o.':'K.-o.-System'}${C.teams&&C.teams.includes(S.user)?' · <b class="good">Dein Verein: '+compStatus(C,S.user)+'</b>':''}</span></div>
   <div class="grid" style="grid-template-columns:minmax(0,1fr) 260px;gap:14px" id="cupgrid"><div>${body}</div><div class="card"><h3>Sieger</h3>${hist}</div></div>`;
}

/* ---------- Welt ---------- */
function renderWorld(){
  const W=UI.world,conf=W.confed;
  if(W.assoc){
    const a=ASSOC[W.assoc],active=S.active.includes(a.code),d=LEAGUE_DATA[a.code]||{};
    let body;
    if(d.noLeague)body=`<p>${esc(d.info)}</p>`;
    else if(active){
      body=S.leagues.filter(L=>L.assoc===a.code).sort((x,y)=>x.tier-y.tier).map(L=>{const tab=tableOf(L).slice(0,3);
        return `<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(L.name)}</h3><button class="btn sm" data-act="openTable" data-id="${L.id}">Tabelle ▶</button></div>
         <div class="small muted">${L.clubs.length} Vereine${L.up?' · '+L.up+' Aufsteiger':''}${L.down?' · '+L.down+' Absteiger':''}</div>
         <div style="margin-top:6px">${tab.map((r,i)=>`<div class="row small" style="gap:6px">${i+1}. ${badge(club(r.id),20)} ${esc(club(r.id).name)} <span class="muted">${r.pts} Pkt.</span></div>`).join('')}</div>
         ${L.champs.length?`<div class="small muted" style="margin-top:6px">Letzter Meister: ${esc(L.champs[0].champ)}</div>`:''}</div>`}).join('');
    }else{
      const st=assocStructure(a.code,S.seed),h=S.bg[a.code]||[];
      body=st.map(l=>`<div class="card"><h3 style="margin:0 0 6px">${esc(l.name)}</h3><div class="small">${l.clubs.map(esc).join(' · ')}</div></div>`).join('')+
        `<div class="card"><h3>Meister</h3>${h.length?h.map(x=>`<div class="small">${x.season}/${(x.season+1)%100}: <b>${esc(x.champ)}</b></div>`).join(''):'<p class="small muted">Noch keine abgeschlossene Saison.</p>'}</div>`+`<div class="card"><h3>${esc(natCupName(a.code))}</h3>${(S.natHist[a.code]||[]).map(x=>`<div class="small">${x.season}/${(x.season+1)%100}: <b>${esc(x.winner)}</b></div>`).join('')||'<p class="small muted">Noch kein Pokalsieger.</p>'}</div>`;
    }
    return `<div class="row" style="justify-content:space-between;margin-bottom:10px"><h2 style="margin:0">${esc(a.name)} <span class="small muted">${a.confed} · ${active?'voll simuliert':'Hintergrund'}</span></h2><button class="btn sm" data-act="worldBack">◀ Alle Verbände</button></div>${active||d.noLeague?'':'<p class="small muted">Dieses Land läuft im Hintergrund mit. Pro Saison wird nur der Meister ermittelt. Voll simulieren kannst du es, wenn du es beim Start einer neuen Karriere auswählst.</p>'}<div class="grid g2">${body}</div>`;
  }
  const list=ASSOCS.filter(a=>a.confed===conf).sort((a,b)=>(S.active.includes(b.code)-S.active.includes(a.code))||b.str-a.str).map(a=>{
    const active=S.active.includes(a.code),d=LEAGUE_DATA[a.code]||{},h=S.bg[a.code];
    const info=d.noLeague?'keine eigene Liga':active?S.leagues.filter(L=>L.assoc===a.code).map(L=>esc(L.name)).join(' · '):h&&h.length?'Meister '+h[0].season+': '+esc(h[0].champ):assocStructure(a.code,S.seed).map(l=>esc(l.name)).join(' · ');
    return `<div class="card clubpick" style="padding:10px" data-act="worldAssoc" data-v="${a.code}"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b>${esc(a.name)}</b><span class="pill ${active?'good':''}">${active?'aktiv':'Hintergrund'}</span></div><div class="small muted">${info}</div></div>`}).join('');
  const hist=S.history.map(h=>`<tr><td>${h.season}/${(h.season+1)%100}</td><td>${esc(h.league)}</td><td>${esc(h.champ)}</td><td>${esc(h.userClub)}: ${h.userRank}.</td><td>${esc(h.top)}</td></tr>`).join('');
  const cf=CONFEDS.find(c=>c.id===conf);
  return `<h2>Welt</h2>${confedTabs(conf,'worldConfed')}<p class="small muted">${cf.region}: ${ASSOCS.filter(a=>a.confed===conf).length} Verbände · aktiv: ${S.active.filter(c=>ASSOC[c].confed===conf).length}</p><div class="grid g3">${list}</div>
  ${hist?`<h3 style="margin-top:18px">Deine Chronik</h3><div class="tw"><table><thead><tr><th>Saison</th><th>Liga</th><th>Meister</th><th>Dein Platz</th><th>Torschützenkönig</th></tr></thead><tbody>${hist}</tbody></table></div>`:''}`;
}
function clubModal(id){
  return ()=>{
    const c=club(id),st=c.staff,ps=squadOf(c).sort((a,b)=>POS_ORDER[a.pos]-POS_ORDER[b.pos]||ovr(b)-ovr(a));
    const staffRow=(role,s,info)=>`<div class="news"><b>${role}: ${esc(s.name)}</b><div class="small">${info}</div></div>`;
    return `<div class="row" style="flex-wrap:nowrap">${badge(c,44)}<div><h2 style="margin:0">${esc(c.name)}</h2><div class="small muted">${esc(leagueName(c))}${c.guest?'':' · Platz '+rankOf(c.id)} · Ø-Stärke ${clubAvg(c)} · Budget ${money(c.budget)} · Stadion ${c.stadium.toLocaleString('de-DE')}</div></div></div>
    <div style="margin-top:12px">${staffRow('Präsident',st.pres,`${PRES[st.pres.trait].label} – ${PRES[st.pres.trait].desc}`)}${staffRow('Sportdirektor',st.dir,`${DIR[st.dir.trait].label} – ${DIR[st.dir.trait].desc}`)}${c.id===S.user?staffRow('Trainer',st.coach,'Das bist du.'):staffRow('Trainer',st.coach,`${COACH[st.coach.trait].label} – ${COACH[st.coach.trait].desc}`)}</div>
    <div class="small muted">Taktik: ${c.tactic.f} · ${MENTALITY[c.tactic.men]} · ${PRESSING[c.tactic.press]} · ${STYLE[c.tactic.style]}</div>
    ${(S.comps||[]).filter(C=>!C.bg&&C.teams.includes(c.id)).map(C=>`<div class="small">🏅 ${COMP[C.key].name}: ${compStatus(C,c.id)}</div>`).join('')}
    <div class="tw" style="margin-top:10px;max-height:300px;overflow:auto"><table><thead><tr><th></th><th>Pos</th><th>Name</th><th>Nat.</th><th class="n">Alter</th><th class="n">Stärke</th><th class="n">Wert</th></tr></thead><tbody>${ps.map(p=>`<tr class="click" data-act="player" data-id="${p.id}"><td>${c.lineup.includes(p.id)?'<b class="good">●</b>':''}</td><td>${p.pos}</td><td>${esc(fullname(p))}</td><td class="small muted">${p.nat}</td><td class="n">${p.age}</td><td class="n">${ovrTag(ovr(p))}</td><td class="n">${money(p.val)}</td></tr>`).join('')}</tbody></table></div>
    <div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-act="closeModal">Schließen</button></div>`;
  };
}

/* ---------- Menü ---------- */
function renderMenu(){
  return `<h2>Menü</h2><div class="grid g2">
   <div class="card"><h3>Spielstand</h3><p class="small muted">Das Spiel speichert automatisch nach jeder Woche auf diesem Gerät. Um auf einem anderen Gerät weiterzuspielen, exportiere den Spielstand und importiere ihn dort.</p>
    <div class="row"><button class="btn" data-act="saveNow">💾 Jetzt speichern</button><button class="btn" data-act="exportOpen">📤 Exportieren</button><button class="btn" data-act="importOpen">📥 Importieren</button></div>${SAVE_STATUS==='fail'?'<p class="small bad">Letztes Speichern fehlgeschlagen – bitte exportieren.</p>':''}</div>
   <div class="card"><h3>Design</h3><p class="small muted">Wie soll dein Arbeitsplatz aussehen?</p><div class="seg">${[['pro','🖥️ Manager-Zentrale (PC)'],['desk','☀️ Trainerbüro (hell)'],['night','🌙 Flutlicht (dunkel)']].map(([k,l])=>`<button class="${(document.documentElement.className||'pro')===k?'on':''}" data-act="setTheme" data-v="${k}">${l}</button>`).join('')}</div></div>
   ${installCard()}
   <div class="card"><h3>Karrieren</h3><p class="small muted">Du kannst beliebig viele Karrieren parallel spielen (bis zu ${MAX_SLOTS}). Jede hat ihren eigenen Speicherstand – eine neue Karriere überschreibt nichts.</p><div class="small" style="margin-bottom:8px">Aktueller Speicherstand: <b>${esc(S.slotName||userClub().name)}</b></div><div class="row"><button class="btn pri" data-act="switchCareer">🔁 Karriere wechseln</button><button class="btn" data-act="newCareer">＋ Neue Karriere</button><button class="btn" data-act="slotRen" data-v="${curSlot()}">✏️ Umbenennen</button></div></div>
   <div class="card"><h3>Über</h3><p class="small muted">Seitenlinie v${APP_VERSION}. 6 Konföderationen, 211 Verbände, ${S.leagues.length} aktive Ligen, ${COMPS.length} internationale Vereinswettbewerbe, nationale Pokale und Fünfjahreswertung. Echte Ligen und Vereine (Stand ca. Saison 2025/26, Auf- und Absteiger 2026 evtl. nicht berücksichtigt). Alle Spieler sind fiktiv. Alle Ligen laufen im europäischen Kalender.</p></div>
  </div>`;
}
function exportModal(){return ()=>`<h2>Spielstand exportieren</h2><p class="small muted">Teile den Spielstand als Datei oder kopiere den Text und füge ihn auf dem anderen Gerät unter „Importieren“ ein. Größe: ca. ${Math.round(exportText().length/1024)} KB.</p>
  <div class="row" style="margin-top:10px">${navigator.canShare?'<button class="btn pri" data-act="shareExp">📤 Teilen / In Dateien sichern</button>':''}<button class="btn ${navigator.canShare?'':'pri'}" data-act="download">Als Datei speichern</button><button class="btn" data-act="copyExp">Text kopieren</button><button class="btn" data-act="closeModal">Schließen</button></div>`}
function importModal(){return ()=>`<h2>Spielstand importieren</h2><p class="small muted">Wähle eine exportierte Datei oder füge den Text ein.</p>
  <input type="file" id="impFile" accept=".json,application/json,text/plain" data-chg="impFile" style="width:100%">
  <textarea id="impTxt" style="width:100%;height:130px;margin-top:10px;font-size:11px" placeholder="Spielstand-Text hier einfügen…"></textarea>
  <div class="row" style="margin-top:10px"><button class="btn pri" data-act="doImport">Importieren</button><button class="btn" data-act="closeModal">Abbrechen</button></div>`}

/* ---------- Live-Spiel & Ergebnisse ---------- */
/* renderLive, startLive, tickLive: siehe live.js */
function renderWeekResults(){
  const W=UI.weekRes||{played:[]};const uL=league(userClub());
  const mine=W.played.find(x=>x.L.id===uL.id);
  let main;
  if(mine){const rows=mine.L.fixtures[mine.r].map(m=>`<tr class="${m.h===S.user||m.a===S.user?'me':''}"><td style="text-align:right">${esc(club(m.h).name)} ${badge(club(m.h),20)}</td><td style="text-align:center"><b>${m.hg}:${m.ag}</b></td><td>${badge(club(m.a),20)} ${esc(club(m.a).name)}</td></tr>`).join('');
    main=`<h3>${esc(uL.name)} · ${mine.r+1}. Spieltag</h3><div class="tw"><table><tbody>${rows}</tbody></table></div>`}
  else main=`<div class="card"><b>Deine Liga hatte diese Woche spielfrei.</b><p class="small muted">Andere Ligen haben gespielt: ${W.played.map(x=>esc(x.L.name)).join(', ')||'keine'}.</p></div>`;
  const cupRes=(S.comps||[]).filter(C=>!C.bg).map(C=>{const rs=C.rounds.filter(r=>r.w===S.week-1&&r.done);if(!rs.length)return '';
    const mine=C.teams.includes(S.user);
    return rs.map(r=>`<h3 style="margin-top:14px">${COMP[C.key].name} · ${esc(r.label)}</h3><div class="tw"><table><tbody>${r.matches.filter(m=>mine||C.key===UI.cup||true).slice(0,mine?99:8).map(m=>`<tr class="${m.h===S.user||m.a===S.user?'me':''}"><td style="text-align:right">${esc(club(m.h).name)} ${badge(club(m.h),20)}</td><td style="text-align:center"><b>${resultText(m)}</b></td><td>${badge(club(m.a),20)} ${esc(club(m.a).name)}</td></tr>`).join('')}</tbody></table></div>`).join('')}).join('');
  const nc=userNatCup();let natRes='';
  const row=m=>`<tr class="${m.h===S.user||m.a===S.user?'me':''}"><td style="text-align:right">${m.win===m.h?'<b>':''}${esc(club(m.h).name)}${m.win===m.h?'</b>':''} <span class="small muted">${tierLabel(club(m.h))}</span> ${badge(club(m.h),20)}</td><td style="text-align:center"><b>${resultText(m)}</b></td><td>${badge(club(m.a),20)} <span class="small muted">${tierLabel(club(m.a))}</span> ${m.win===m.a?'<b>':''}${esc(club(m.a).name)}${m.win===m.a?'</b>':''}</td></tr>`;
  if(nc){const r=nc.rounds.find(r=>r.w===S.week-1&&r.done);if(r){const ms=r.matches.slice().sort((a,b)=>((b.h===S.user||b.a===S.user)-(a.h===S.user||a.a===S.user)));natRes=`<h3 style="margin-top:14px">${esc(nc.name)} · ${esc(r.label)}</h3><div class="tw"><table><tbody>${ms.slice(0,16).map(row).join('')}</tbody></table></div>`}}
  for(const sc of S.supercups||[]){if(sc.code!==userClub().assoc)continue;for(const r of sc.rounds)if(r.w===S.week-1&&r.done)natRes=`<h3 style="margin-top:14px">${esc(sc.name)} · ${esc(r.label)}</h3><div class="tw"><table><tbody>${r.matches.map(row).join('')}</tbody></table></div>`+natRes}
  return `<div class="row" style="justify-content:space-between"><h2>Woche ${S.week} – Ergebnisse</h2><button class="btn pri" data-act="nav" data-v="home">Zur Übersicht</button></div>
  <div class="grid g2"><div>${main}${cupRes}${natRes}</div><div>${tableHtml(uL,true)}</div></div>`;
}
function renderSeasonEndScreen(){
  const u=userClub(),L=league(u),tab=tableOf(L),champ=club(tab[0].id),rank=tab.findIndex(r=>r.id===S.user)+1;
  const n=tab.length,promo=L.up&&rank<=L.up,rel=L.down&&rank>n-L.down;
  return `<div class="card" style="text-align:center"><div style="font-size:44px">🏆</div><h2>${esc(champ.name)} ist Meister der ${esc(L.name)} ${S.season}/${(S.season+1)%100}!</h2>
   <p>Dein ${esc(u.name)} beendet die Saison auf <b>Platz ${rank}</b>. Ziel war: ${u.target.t} ${rank<=u.target.r?'<span class="good">✓ erreicht</span>':'<span class="bad">✗ verfehlt</span>'}</p>
   ${promo?'<p class="good"><b>🎉 Aufstieg geschafft!</b></p>':''}${rel?'<p class="bad"><b>Abstieg 😞</b></p>':''}
   ${userSupercup()?`<p>🛡️ ${esc(userSupercup().name)}: <b>${userSupercup().winner===S.user?'🏆 gewonnen':'verloren'}</b></p>`:''}
   ${userNatCup()?`<p>🏆 ${esc(userNatCup().name)}: <b>${natCupStatus(userNatCup(),S.user)}</b></p>`:''}
   ${userComps().map(C=>`<p>🏅 ${COMP[C.key].name}: <b>${compStatus(C,S.user)}</b></p>`).join('')}
   <p class="small muted">Beim Saisonwechsel steigen Vereine auf und ab, Spieler altern und entwickeln sich, Verträge laufen aus, jede Akademie bringt Jugendspieler, und in den Hintergrund-Ländern werden die Meister ermittelt.</p>
   <button class="btn pri" data-act="newSeason">Neue Saison starten ▶</button></div><div style="margin-top:14px">${tableHtml(L,false)}</div>`;
}

/* =========================================================
   EVENTS
   ========================================================= */
function newSeed(){return (Date.now()^Math.floor(Math.random()*1e9))>>>0}
const ACT={
  setTheme:d=>{document.documentElement.className=d.v;try{localStorage.setItem('sl-theme',d.v)}catch(e){}const m=document.querySelector('meta[name=theme-color]');if(m)m.content=d.v==='desk'?'#f1e9da':d.v==='pro'?'#0e1116':'#131b2e';render()},
  nav:d=>{if(UI.view==='live'&&UI.live&&!UI.live.done)return;UI.view=d.v;UI.selSlot=null;if(d.v==='table')UI.tableLeague=UI.tableLeague;window.scrollTo(0,0);render()},
  closeModal:()=>{UI.modal=null;UI.selSlot=null;UI.neg=null;render()},
  slotLoad:async d=>{UI.loading='Spielstand wird geladen…';render();const sv=await loadSave(d.v);UI.loading=null;if(sv){try{setCur(d.v);applySave(sv);UI.view='home';UI.modal=null;render()}catch(e){toast(e.message==='alt'?'Spielstand aus alter Version – nicht kompatibel':'Spielstand konnte nicht geladen werden')}}else{toast('Spielstand nicht gefunden');render()}},
  slotDel:d=>{UI.delSlot=d.v;render()},
  slotDelNo:()=>{UI.delSlot=null;render()},
  slotDelYes:async d=>{await deleteSlot(d.v);UI.delSlot=null;toast('Karriere gelöscht');render()},
  slotRen:d=>{const l=slotsList(),x=l.find(y=>y.id===d.v);if(!x)return;const n=prompt('Name für diese Karriere:',x.name||x.club);if(n===null)return;x.name=n.trim().slice(0,40);slotsWrite(l);if(S&&curSlot()===d.v)S.slotName=x.name;render()},
  switchCareer:()=>{if(S&&S.user!==null){S.rng=RNG;save()}setTimeout(()=>{S=null;UI.view='home';UI.modal=null;UI.live=null;render();window.scrollTo(0,0)},150)},
  continue:async()=>{UI.loading='Spielstand wird geladen…';render();const sv=await loadSave();UI.loading=null;if(sv){try{applySave(sv);UI.view='home';render()}catch(e){toast('Spielstand konnte nicht geladen werden')}}else{UI.meta=null;render();toast('Kein Spielstand gefunden')}},
  newCareer:()=>{UI.modal=null;UI.setup={step:'club',confed:'UEFA',assoc:'GER',tier:1,pick:null,name:S&&S.manager||'',seed:newSeed(),q:'',active:new Set()};UI.setupPrev=S;S=null;render();window.scrollTo(0,0)},
  backTitle:()=>{UI.setup=null;S=UI.setupPrev||null;if(S){RNG=S.rng||1;resetCache();UI.view='menu'}render()},
  setConfed:d=>{UI.setup.name=document.getElementById('mgrName').value;UI.setup.confed=d.v;UI.setup.assoc=null;render()},
  pickAssoc:d=>{const el=document.getElementById('mgrName');if(el)UI.setup.name=el.value;UI.setup.assoc=d.v;UI.setup.tier=1;render();if(window.innerWidth<900){const r=document.getElementById('assocRight');if(r)r.scrollIntoView({behavior:'smooth',block:'start'})}},
  pickTier:d=>{UI.setup.name=document.getElementById('mgrName').value;UI.setup.tier=+d.v;render()},
  pickClub:d=>{UI.setup.name=document.getElementById('mgrName').value;UI.setup.pick={code:UI.setup.assoc,tier:UI.setup.tier,idx:+d.i};render()},
  toWorldStep:()=>{const st=UI.setup;st.name=document.getElementById('mgrName').value;st.step='world';st.active=new Set([st.pick.code]);st.wconfed=ASSOC[st.pick.code].confed;render();window.scrollTo(0,0)},
  backClubStep:()=>{UI.setup.step='club';render()},
  setWConfed:d=>{UI.setup.wconfed=d.v;render()},
  preset:d=>{const st=UI.setup;st.active=new Set([st.pick.code,...PRESETS[+d.i][1]()]);render()},
  startCareer:()=>{
    const st=UI.setup,codes=[st.pick.code,...[...st.active].filter(c=>c!==st.pick.code)];
    UI.loading='Welt wird erstellt…';render();
    if(slotsList().length>=MAX_SLOTS){UI.loading=null;render();return toast(`Maximal ${MAX_SLOTS} Karrieren – bitte zuerst eine löschen.`)}
    setCur(newSlotId());
    setTimeout(()=>{newWorld(st.seed,codes,st.pick,st.name.trim()||'Manager');startCareer(st.name.trim()||'Manager');UI.setup=null;UI.loading=null;UI.view='home';UI.tableLeague=null;UI.fxLeague=null;render()},40);
  },
  advance:()=>{if(S.fired){UI.view="home";render();toast("Nimm zuerst ein Jobangebot an.");return}
    if(S.week>=S.weeks){UI.view='season';render();return}
    S.rng=RNG;UI.weekSnap=JSON.stringify(S);UI.weekIv=[];LIVE_IV=[];
    const res=playWeek();UI.weekRes=res;UI.fxRound=null;UI.live=null;UI.liveAll=res.userList;
    UI.liveQueue=res.userList.slice();
    if(UI.liveQueue.length)startLive(UI.liveQueue.shift());else{UI.view='matchday';render()}
  },
  toSeason:()=>{UI.view='season';render()},
  newSeason:()=>{UI.loading='Neue Saison wird vorbereitet…';render();setTimeout(()=>{seasonEnd();UI.loading=null;UI.view='home';render();toast('Neue Saison gestartet!')},40)},
  openComp:d=>{UI.cup=d.v;UI.cupMode='int';UI.view='cups';window.scrollTo(0,0);render()},
  cupSel:d=>{UI.cup=d.v;UI.cupTab=null;render()},
  cupMode:d=>{UI.cupMode=d.v;render()},
  natCupSel:d=>{UI.natCup=d.v;render()},
  coefConfed:d=>{UI.coefConfed=d.v;render()},
  openNatCup:()=>{UI.cupMode='nat';UI.natCup=userClub().assoc;UI.view='cups';window.scrollTo(0,0);render()},
  cupTab:d=>{UI.cupTab=d.v;render()},
  liveDone:()=>{if(UI.liveQueue&&UI.liveQueue.length){startLive(UI.liveQueue.shift());return}UI.view='matchday';UI.live=null;render()},
  player:d=>{UI.ptab='profil';UI.modal=playerModal(d.id);render()},
  ptab:d=>{UI.ptab=d.v;render()},
  clubInfo:d=>{UI.modal=clubModal(+d.id);render()},
  sort:d=>{UI.sortK=d.k;render()},
  slot:d=>{UI.selSlot=+d.i;UI.modal=slotPicker();render()},
  slotCancel:()=>{UI.selSlot=null;UI.modal=null;render()},
  assign:d=>{const c=userClub(),i=UI.selSlot,j=c.lineup.indexOf(d.id);if(j>=0)c.lineup[j]=c.lineup[i];c.lineup[i]=d.id;UI.selSlot=null;UI.modal=null;const was=c.autoXI;c.autoXI=false;save();render();if(was)toast('Co-Trainer-Aufstellung ausgeschaltet – deine Elf gilt')},
  formation:d=>{const c=userClub(),t=c.tactic;t.f=d.v;t.cust=0;t.oop=FORMATIONS[d.v].xy.map(a=>a.slice());t.roles=null;t.droles=null;t.ip=null;autoLineup(c);bestRoles(c,null);t.ip=deriveIP(t);save();render()},
  tph:d=>{UI.tph=d.v;render()},
  ttab:d=>{UI.ttab=d.v;render()},
  tinstr:d=>{const t=userClub().tactic;ensureInstr(t);t[d.g][d.k]=d.v;save();render()},
  tplayer:d=>{UI.tpi=+d.i;UI.modal=tpModal();render()},
  tpRole:d=>{const t=userClub().tactic;if(d.ph==='ip')t.roles[UI.tpi]=d.v;else t.droles[UI.tpi]=d.v;tpMoveIP();save();render()},
  tpDuty:d=>{const t=userClub().tactic;t.du[UI.tpi]=d.v;tpMoveIP();save();render()},
  tpPin:d=>{const t=userClub().tactic,a=t.pi[UI.tpi]=t.pi[UI.tpi]||[];const j=a.indexOf(d.v);if(j>=0)a.splice(j,1);else{if(a.length>=3){toast('Höchstens 3 Anweisungen pro Spieler');return}a.push(d.v)}save();render()},
  ipDerive:()=>{const t=userClub().tactic;t.ip=deriveIP(t);save();render();toast('Form mit Ball aus den Rollen abgeleitet')},
  tMirror:()=>{const c=userClub(),t=c.tactic;t.oop=t.oop.map(([x,y])=>[100-x,y]);t.ip=t.ip.map(([x,y])=>[100-x,y]);t.cust=1;save();render()},
  bestRolesBtn:()=>{const c=userClub(),t=c.tactic;t.roles=null;t.droles=null;bestRoles(c,null);save();render();toast('Rollen passend zu deinen Spielern gewählt')},
  tac:d=>{const t=userClub().tactic;t[d.k]=d.v;save();render()},
  autoXI:()=>{autoLineup(userClub());save();toast('Beste Elf aufgestellt')},
  fxRound:d=>{UI.fxRound=+d.i;render()},
  openTable:d=>{UI.tableLeague=+d.id;UI.view='table';render()},
  worldConfed:d=>{UI.world.confed=d.v;UI.world.assoc=null;render()},
  worldAssoc:d=>{UI.world.assoc=d.v;window.scrollTo(0,0);render()},
  worldBack:()=>{UI.world.assoc=null;render()},
  tfTab:d=>{UI.tf.tab=d.v;render()},
  tkMine:()=>{const u=userClub();UI.tk=UI.tk||{};UI.tk.code=u.assoc;UI.tk.lg=String(u.league);render()},
  negOpen:d=>{const p=S.players[d.id],u=userClub();UI.neg=negInit(p,u,d.mode);UI.modal=negModal();render()},
  negSet:d=>{const N=UI.neg,p=S.players[N.pid];if(!N)return;if(d.k==='years'){N.years=+d.v;negDateFix(N)}else if(d.k==='rt'){N.rt=d.v;if(d.v!=='none'&&!N.rc)N.rc=nice(Math.max(p.val,1e5)*2)}else if(d.k==='rw'){N.rw=d.v;if((d.v==='from'||d.v==='range')&&!N.rf)N.rf=`${S.season+1}-07-01`;if((d.v==='until'||d.v==='range')&&!N.ru)N.ru=`${S.season+1}-06-30`;negDateFix(N)}else N[d.k]=d.v;N.msg=null;render()},
  inqOpen:d=>{UI.inq={pid:d.id,to:'both',kind:'buy',msg:null};UI.modal=inqModal();render()},
  inqSet:d=>{UI.inq[d.k]=d.v;render()},
  inqSend:()=>{const Q=UI.inq,p=S.players[Q.pid];const x=sendInquiry(p,userClub(),Q.to,Q.kind);if(!x){Q.msg='Es läuft bereits eine Anfrage.';render();return}
    Q.msg=`🔎 Anfrage verschickt. ${Q.to==='agent'?'Der Berater':Q.to==='club'?esc(club(p.club).name):'Verein und Berater'} melde${Q.to==='both'?'n':'t'} sich bis ${fmtDate(x.when)} – die Antwort kommt in den Posteingang.`;
    addNews('transfer',`Anfrage gestellt: ${fullname(p)}`,`Du hast bei ${Q.to==='agent'?'seinem Berater':Q.to==='club'?esc(club(p.club).name):esc(club(p.club).name)+' und seinem Berater'} nachgefragt (${Q.kind==='loan'?'Leihe':Q.kind==='both'?'Transfer oder Leihe':'Transfer'}). Antwort bis ${fmtDate(x.when)}.`);save();render()},
  loanOpen:d=>{const p=S.players[d.id],u=userClub(),L=loanTarget(p,u),R=(S.bidRes||{})[p.id];UI.loan={pid:p.id,t:R&&R.res==='loancounter'?{...R.t}:{fee:nice(L.fee*.8),ws:50,opt:0,obl:false,dur:'1'},msg:null};UI.modal=loanModal();render()},
  loanSet:d=>{const B=UI.loan;B.t[d.k]=d.k==='obl'?d.v==='1':d.k==='dur'?d.v:+d.v;render()},
  loanSend:()=>{const B=UI.loan,p=S.players[B.pid],u=userClub();if(!isWindow()){B.msg='Das Transferfenster ist geschlossen.';render();return}
    if(u.players.length>=32){B.msg='Dein Kader ist voll (max. 32).';render();return}if((B.t.fee||0)>u.tBudget){B.msg='Die Leihgebühr übersteigt dein Transferbudget.';render();return}
    const R=sendLoanBid(p,{...B.t});B.msg=R.now?'Deadline Day – die Antwort ist schon im Posteingang.':`📨 Leihangebot verschickt – ${esc(club(p.club).name)} prüft und antwortet bis ${fmtDate(R.when)}.`;save();render()},
  loanTake:()=>{const B=UI.loan,p=S.players[B.pid],R=(S.bidRes||{})[p.id];if(!R||!R.t)return;S.ldeals=S.ldeals||{};S.ldeals[p.id]={t:R.t,season:S.season,exp:windowEnd()};S.bidRes[p.id]={res:'loanyes',t:R.t,seller:R.seller};B.msg=`✅ Leihe vereinbart: ${loanText(R.t)}. Jetzt muss nur noch der Spieler zustimmen.`;B.res='yes';save();render()},
  loanClose:d=>{const p=S.players[d.id],LD=userLoanDeal(d.id),u=userClub();if(!LD){toast('Die Vereinbarung ist nicht mehr gültig');return}
    if((LD.t.fee||0)>u.tBudget){toast('Die Leihgebühr übersteigt dein Transferbudget');return}
    startClauseTalk(p,u,LD.t.fee||0,'loan',null,LD.t);delete S.ldeals[p.id];if(S.bidRes)delete S.bidRes[p.id];UI.modal=null;save();toast('Der Spieler überlegt – Antwort im Posteingang');render()},
  loanBuyToggle:d=>{const p=S.players[d.id];if(p&&p.loan){p.loan.buy=!p.loan.buy;if(p.loan.buy&&userClub().budget<p.loan.opt)toast('Achtung: Das Geld muss zum Saisonende auf dem Konto sein');save();render()}},
  uinqAns:d=>{const x=(S.uinq||[]).find(y=>y.id===d.id);if(!x)return;x.st='done';x.ans=d.v;x.w=S.week;x.season=S.season;const c=club(x.by),p=S.players[x.pid];
    addNews('transfer',`Antwort an ${esc(c.name)}: ${fullname(p)}`,d.v==='no'?'Du hast abgewunken – sie werden kein Angebot machen.':'Du hast signalisiert, dass eine Leihe möglich ist.');save();render()},
  uinqPrice:d=>{const x=(S.uinq||[]).find(y=>y.id===d.id),p=S.players[x.pid];UI.uinq={id:d.id,price:nice(p.val*1.25)};UI.modal=uinqModal();render()},
  uinqMul:d=>{const x=(S.uinq||[]).find(y=>y.id===UI.uinq.id),p=S.players[x.pid];UI.uinq.price=nice(p.val*(+d.v));render()},
  uinqSend:()=>{const x=(S.uinq||[]).find(y=>y.id===UI.uinq.id);if(!x)return;x.st='done';x.ans='price';x.price=UI.uinq.price;x.w=S.week;x.season=S.season;const c=club(x.by),p=S.players[x.pid];
    addNews('transfer',`Antwort an ${esc(c.name)}: ${fullname(p)}`,`Du hast signalisiert: verkäuflich ab <b>${money(x.price)}</b>.`);UI.modal=null;save();render()},
  bidOpen:d=>{const p=S.players[d.id],R=(S.bidRes||{})[p.id];UI.bid={pid:p.id,mode:'buy',b:normBid(R&&R.bid?R.bid:{fee:nice(scoutEst(p)*.9)}),res:null,msg:null};
    if(R&&R.res==='counter'){UI.bid.res='counter';UI.bid.counter=R.bid;UI.bid.msg=`${esc(club(R.seller).name)} hat ein Gegenangebot gemacht: <b>${bidText(R.bid)}</b>.${R.final?' Weitere Runden gibt es in diesem Fenster nicht.':''}`}
    else if(R&&R.res==='no'){UI.bid.msg=`${esc(club(R.seller).name)} hat dein letztes Angebot abgelehnt.`;UI.bid.res=null}
    UI.modal=bidModal();render()},
  bidCounter:d=>{const o=S.offers.find(x=>x.id===d.id);if(!o)return;if(!o.bid)o.bid=normBid({fee:o.fee});if(!o.lim)o.lim=bidValue(o.bid,S.players[o.pid])*1.15;UI.bid={pid:o.pid,mode:'sell',oid:o.id,b:normBid({...o.bid,fee:nice(bidTotal(o.bid)*1.2)}),res:null,msg:null};UI.modal=bidModal();render()},
  pFeeD:d=>{const b=planTarget(d.ns);if(!b)return;b.feeD=d.v||null;planChanged(d.ns)},
  pAdd:d=>{const b=planTarget(d.ns);if(!b)return;b.plan=(b.plan||[]).slice();const last=b.plan.length?b.plan[b.plan.length-1].d:null;const nd=(nextDates(12,1).find(x=>!last||x>last))||addDaysIso(last,182);b.plan.push({d:nd,amt:nice(Math.max(1e5,(b.fee||0)*.2))});planChanged(d.ns)},
  pDel:d=>{const b=planTarget(d.ns);if(!b)return;b.plan=(b.plan||[]).filter((_,i)=>i!==+d.i);planChanged(d.ns)},
  pPreset:d=>{const b=planTarget(d.ns);if(!b)return;const tot=planSum(b)||nice(Math.max(1e5,(b.fee||0)*.3));if(d.v==='none'){b.plan=[];planChanged(d.ns);return}
    const n=d.v==='y2'?2:d.v==='y3'?3:4,step=d.v==='h4'?1:2,ds=nextDates(n,step);b.plan=ds.map(x=>({d:x,amt:nice(tot/n)}));planChanged(d.ns)},
  bidSet:d=>{const B=UI.bid;B.b[d.k]=+d.v;if(d.k==='fee'||d.k==='so'){}B.msg=B.res==='counter'?B.msg:null;if(B.res!=='counter')B.res=null;render()},
  bidSubmit:()=>bidSubmit(),
  bidUseCounter:()=>{const B=UI.bid;if(B.counter)B.b={...B.counter};B.res=null;B.msg=null;render()},
  bidTake:()=>{const B=UI.bid,p=S.players[B.pid],s=club(p.club);if(!B.counter)return;if(B.counter.fee>userClub().tBudget){B.msg='Der Sofort-Betrag übersteigt dein Transferbudget.';B.res='no';render();return}
    S.deals=S.deals||{};S.deals[p.id]={bid:B.counter,season:S.season,exp:windowEnd()};if(S.bidRes)S.bidRes[p.id]={res:'yes',bid:B.counter,seller:s.id};B.b={...B.counter};B.res='yes';B.msg=`✅ Einigung mit ${esc(s.name)}: <b>${bidText(B.counter)}</b>. Jetzt musst du dich nur noch mit dem Spieler einigen.`;
    addNews('transfer',`Ablöse vereinbart: ${fullname(p)}`,`Du akzeptierst das Gegenangebot von ${esc(s.name)} (${bidText(B.counter)}).`);save();render()},
  negDatePick:d=>{const N=UI.neg;N[d.k]=d.v;negDateFix(N);N.msg=null;render()},
  negLv:d=>{const N=UI.neg;N.b[d.k]=+d.v;N.msg=null;render()},
  negAdj:d=>{const N=UI.neg;N[d.k]=+d.v;N.msg=null;render()},
  negRc:d=>{const N=UI.neg,p=S.players[N.pid];const st=nice(Math.max(p.val*.1,5e4));N.rc=Math.max(1e5,nice(N.rc+st*(+d.v)));N.msg=null;render()},
  negRcMul:d=>{const N=UI.neg,p=S.players[N.pid];N.rc=Math.max(1e5,nice(Math.max(p.val,1e5)*(+d.v)));N.msg=null;render()},
  negWageStep:d=>{const N=UI.neg;const step=N.mw>=500000?10000:N.mw>=100000?5000:N.mw>=20000?1000:N.mw>=5000?250:100;N.mw=Math.max(100,N.mw+step*(+d.v));N.msg=null;render()},
  negWageSet:()=>{const N=UI.neg;negMatchDemand(N,S.players[N.pid],userClub());N.msg=null;render()},
  negSubmit:()=>negSubmit(),
  listToggle:d=>{const p=S.players[d.id];p.listed=!p.listed;save();toast(p.listed?'Auf die Transferliste gesetzt':'Von der Transferliste genommen')},
  shift:d=>{const u=userClub(),v=+d.v,cost=v*WAGE_RATE;
    if(v>0){if(u.tBudget<cost)return toast('Nicht genug Transferbudget');u.tBudget-=cost;u.wBudget+=v}
    else{if(u.wBudget+v<wageBill(u))return toast('Gehaltsbudget kann nicht unter die aktuellen Gehälter fallen');u.wBudget+=v;u.tBudget+=-cost}
    save();render()},
  release:d=>{const p=S.players[d.id];if(UI.confirmRel!==d.id){UI.confirmRel=d.id;return toast('Zum Bestätigen nochmal tippen')}
    UI.confirmRel=null;const cost=release(p);addNews('transfer',`${fullname(p)} freigestellt`,`Abfindung: ${money(cost)}.`);UI.modal=null;save();toast('Spieler freigestellt')},
  offerYes:d=>{const o=S.offers.find(x=>x.id===d.id);if(!o)return;const p=S.players[o.pid],fc=club(o.from);S.offers=S.offers.filter(x=>x.pid!==o.pid);
    if(!isWindow()){toast('Das Transferfenster ist geschlossen');render();return}
    if(o.loan)startClauseTalk(p,fc,o.loan.fee,'loan',null,o.loan);else startClauseTalk(p,fc,o.fee,'deal',o.bid||{fee:o.fee});save();toast('Einigung mit dem Verein – jetzt entscheidet der Spieler');render()},
  offerNo:d=>{const o=S.offers.find(x=>x.id===d.id);if(o){const p=S.players[o.pid];p.mor=clamp(p.mor-3,15,100)}S.offers=S.offers.filter(x=>x.id!==d.id);save();render()},
  saveNow:()=>{save();toast('Gespeichert')},
  exportOpen:()=>{UI.modal=exportModal();render()},
  importOpen:()=>{UI.modal=importModal();render()},
  install:()=>{const d=PWA.deferred;if(!d)return;d.prompt();d.userChoice.finally(()=>{PWA.deferred=null;render()})},
  applyUpdate:()=>{if(S&&S.user!==null)save();if(PWA.update)PWA.update.postMessage({type:'SKIP_WAITING'});else location.reload()},
  shareExp:()=>{try{const f=new File([exportText()],`seitenlinie_${S.season}_w${S.week}.json`,{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f],title:'Seitenlinie Spielstand'}).catch(()=>{});else toast('Teilen nicht möglich – Text kopieren')}catch(e){toast('Teilen nicht möglich – Text kopieren')}},
  download:()=>{try{const b=new Blob([exportText()],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`seitenlinie_${S.season}_w${S.week}.json`;document.body.appendChild(a);a.click();a.remove();toast('Download gestartet')}catch(e){toast('Download nicht möglich – Text kopieren')}},
  copyExp:()=>{const t=exportText();try{navigator.clipboard.writeText(t).then(()=>toast('Kopiert!'),()=>toast('Kopieren nicht erlaubt – bitte Datei nutzen'))}catch(e){toast('Kopieren nicht möglich')}},
  doImport:()=>{const t=document.getElementById('impTxt').value.trim();if(!t)return toast('Kein Text');try{const o=JSON.parse(t);const prev=CUR_SLOT;setCur(newSlotId());try{applySave(o)}catch(e){if(prev)setCur(prev);throw e}save();UI.modal=null;UI.setup=null;UI.view='home';render();toast('Spielstand geladen')}catch(e){toast(e.message==='alt'?'Spielstand aus alter Version – nicht kompatibel':'Ungültiger Spielstand')}},
};
function negDateFix(N){const p=S.players[N.pid],endY=N.years===0?p.until:S.season+N.years,cEnd=`${endY+1}-06-30`,t=gameDate();
  for(const k of ['rf','ru'])if(N[k]){if(N[k]>cEnd)N[k]=cEnd;if(N[k]<t)N[k]=t}
  if(N.rw==='range'&&N.rf&&N.ru&&N.ru<=N.rf)N.ru=addDaysIso(N.rf,60)>cEnd?cEnd:addDaysIso(N.rf,60)}
const CHG={
  dutySel:el=>{const t=userClub().tactic;t.du[+el.dataset.i]=el.value;save();render()},
  tpAutoMove:el=>{UI.tpMove=el.checked;render()},
  roleSel:el=>{const t=userClub().tactic,i=+el.dataset.i;if(el.dataset.ph==='ip')t.roles[i]=el.value;else t.droles[i]=el.value;save();render()},
  loanPct:el=>{const B=UI.loan;if(!B)return;const v=parseFloat(String(el.value).replace('%','').replace(',','.').trim());if(isNaN(v)){toast('Bitte einen Prozentwert zwischen 0 und 100 eingeben');render();return}B.t.ws=Math.round(clamp(v,0,100)*10)/10;render()},
  tkInq:el=>{UI.tk.inq=el.checked;render()},
  loanAmt:el=>{const B=UI.loan;if(!B)return;const v=parseMoney(el.value);if(isNaN(v)){toast('Bitte einen gültigen Betrag eingeben');render();return}B.t[el.dataset.k]=Math.round(v);if(el.dataset.k==='opt'&&!v)B.t.obl=false;render()},
  uinqAmt:el=>{const v=parseMoney(el.value);if(!isNaN(v))UI.uinq.price=Math.round(v);render()},
  tkCode:el=>{UI.tk.code=el.value;UI.tk.lg='';render()},
  tkLg:el=>{UI.tk.lg=el.value;render()},
  tkQ:el=>{UI.tk.q=el.value.trim();render()},
  pAmt:el=>{const b=planTarget(el.dataset.ns);if(!b)return;const v=parseMoney(el.value);if(isNaN(v)){toast('Bitte einen gültigen Betrag eingeben');render();return}b.plan=b.plan.map(x=>({...x}));b.plan[+el.dataset.i].amt=Math.round(v);planChanged(el.dataset.ns)},
  pDate:el=>{const b=planTarget(el.dataset.ns);if(!b||!el.value)return;b.plan=b.plan.map(x=>({...x}));b.plan[+el.dataset.i].d=el.value;b.plan.sort((x,y)=>x.d<y.d?-1:1);planChanged(el.dataset.ns)},
  pFeeDate:el=>{const b=planTarget(el.dataset.ns);if(!b)return;b.feeD=el.value&&el.value>today()?el.value:null;planChanged(el.dataset.ns)},
  bidAmt:el=>{const B=UI.bid;if(!B)return;const v=parseMoney(el.value);if(isNaN(v)){toast('Bitte einen gültigen Betrag eingeben');render();return}B.b[el.dataset.k]=Math.round(v);if(el.dataset.k==='inst'&&v&&!B.b.instY)B.b.instY=2;if(B.res!=='counter'){B.res=null;B.msg=null}render()},
  negDate:el=>{const N=UI.neg;if(!N)return;if(/^\d{4}-\d{2}-\d{2}$/.test(el.value)){N[el.dataset.k]=el.value;negDateFix(N)}N.msg=null;render()},
  negAmt:el=>{const N=UI.neg;if(!N)return;const v=parseMoney(el.value),k=el.dataset.k;
    if(isNaN(v)){toast('Bitte einen gültigen Betrag eingeben');render();return}
    if(k==='mw')N.mw=Math.max(100,Math.round(v));else if(k==='rc')N.rc=Math.max(1e5,Math.round(v));else N.b[k]=Math.round(v);
    N.msg=null;const id=el.dataset.k;render();},
  assocQ:el=>{UI.setup.q=el.value;UI.setup.name=(document.getElementById('mgrName')||{}).value||UI.setup.name;render();const e=document.querySelector('[data-chg=assocQ]');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length)}},
  actToggle:el=>{const st=UI.setup;if(el.checked)st.active.add(el.dataset.v);else st.active.delete(el.dataset.v);render()},
  tableLeague:el=>{UI.tableLeague=+el.value;render()},
  autoXIToggle:el=>{userClub().autoXI=el.checked;save();toast(el.checked?'Co-Trainer stellt auf':'Du stellst selbst auf')},
  fxLeague:el=>{UI.fxLeague=+el.value;UI.fxRound=null;render()},
  tfPos:el=>{UI.tf.pos=el.value;render()},
  tfCountry:el=>{UI.tf.country=el.value;render()},
  tfMax:el=>{UI.tf.max=el.value;render()},
  tfQ:el=>{UI.tf.q=el.value;render()},
  tfFree:el=>{UI.tf.free=el.checked;render()},
  tfYoung:el=>{UI.tf.young=el.checked;render()},
  tfExp:el=>{UI.tf.exp=el.checked;render()},
  impFile:el=>{const f=el.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{document.getElementById('impTxt').value=r.result};r.readAsText(f)},
};
document.addEventListener('click',e=>{
  if(e.target.closest('input[type=checkbox]'))return;
  const el=e.target.closest('[data-act]');if(!el)return;
  if(el.dataset.act==='closeModal'&&e.target.closest('[data-stop]')&&!e.target.closest('button'))return;
  e.preventDefault();ACT[el.dataset.act]&&ACT[el.dataset.act](el.dataset,el);
});
document.addEventListener('change',e=>{const el=e.target.closest('[data-chg]');if(el&&CHG[el.dataset.chg])CHG[el.dataset.chg](el)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&UI.modal){UI.modal=null;render()}});

/* Start */
(function init(){UI.meta=readMeta();UI.oldSave=hasOldSave();render()})();
