/* =====================================================================
   Seitenlinie – Live-Spieltag: Ticker mit Spannung, Aufstellungen,
   Live-Statistik, xG-Verlauf und Spielerwerte
   ===================================================================== */
const LSPEED=[['slow','Langsam',1500],['norm','Normal',850],['fast','Schnell',280],['turbo','Turbo',60]];
function lspeedMs(k){const s=LSPEED.find(x=>x[0]===k);return s?s[2]:850}

/* ---------- Zeitleiste ---------- */
function tickInfo(r,t){
  if(t<=0)return {m:0,x:0,ph:0};
  const h1=45+(r.s1||0);
  if(t<=h1)return {m:Math.min(t,45),x:Math.max(0,t-45),ph:1};
  const t90=r.t90||h1+45+(r.s2||0);
  if(t<=t90){const k=t-h1;return {m:Math.min(45+k,90),x:Math.max(0,45+k-90),ph:2}}
  if(r.et){const e1=15+(r.e1||0);const k=t-t90;if(k<=e1)return {m:Math.min(90+k,105),x:Math.max(0,90+k-105),ph:3};
    const k2=k-e1;if(t<=(r.t120||t90+30))return {m:Math.min(105+k2,120),x:Math.max(0,105+k2-120),ph:4}}
  return {m:120,x:0,ph:5};
}
function minLbl(i){return i.ph===0?'':i.ph===5?'i.E.':i.x?`${i.m}+${i.x}'`:`${i.m}'`}
function buildBeats(r){
  const by={};let end=0;for(const e of r.ev){(by[e.t]=by[e.t]||[]).push(e);if(e.t>end)end=e.t}
  const beats=[];
  for(let t=0;t<=end;t++){
    if(t>0)beats.push({t,clock:1,d:1});
    for(const e of by[t]||[]){
      if(e.hid){beats.push({t,e,li:0,d:0});continue}
      const n=e.lines.length;
      e.lines.forEach((l,li)=>{
        let d=li===0?.55:1.35;
        if(e.big&&li===n-1)d=e.type==='goal'?.6:2.1;          // Auflösung einer Großchance
        if(e.type==='goal'&&li===e.gl)d=2.4;                   // Spannung vor dem Tor
        if(e.type==='offgoal'&&li===1)d=2.4;
        if((e.type==='pen'||e.type==='penmiss')&&li===1)d=2.3;
        if(e.k==='var'&&li===1)d=2.6;
        if(e.k==='pre')d=li===0?.2:1.4;
        beats.push({t,e,li,d,pause:li===n-1&&(e.k==='ht'||e.k==='et'||e.k==='pens'||e.k==='et1')?e.k:null});
      });
    }
  }
  return beats;
}
function liveState(L){
  const r=L.r,st={t:0,lines:new Map(),score:{h:0,a:0},pens:null,scorers:{h:[],a:[]},reds:{h:[],a:[]},yel:{},stats:{h:mts0(),a:mts0()},xgT:[],goalsT:[],cur:null};
  for(let i=0;i<L.bi&&i<L.beats.length;i++){
    const b=L.beats[i];if(b.clock){st.t=b.t;continue}
    const e=b.e;st.lines.set(e,b.li+1);if(!e.hid)L.lastE=e;const last=b.li===(e.hid?0:e.lines.length-1);
    if(e.type==='goal'&&b.li===e.gl){st.score[e.side]++;const p=S.players[e.pid];st.scorers[e.side].push({n:p?p.ln:'?',l:minLbl(e),id:e.pid});st.goalsT.push({t:e.t,side:e.side})}
    if(last&&e.d){const S2=st.stats[e.side];for(const k in e.d)S2[k]=(S2[k]||0)+e.d[k];if(e.d.xg)st.xgT.push({t:e.t,side:e.side,q:e.d.xg})}
    if(last&&e.type==='chance'&&e.out==='save')st.stats[OTHER[e.side]].sav++;
    if(last&&e.type==='red'){const p=S.players[e.pid];st.reds[e.side].push({n:p?p.ln:'?',l:minLbl(e),id:e.pid})}
    if(last&&e.type==='card')st.yel[e.pid]=1;
    if(last&&(e.type==='pen'||e.type==='penmiss'))st.pens=e.ps;
  }
  return st;
}

/* ---------- Steuerung ---------- */
function startLive(res){
  const prev=UI.live;
  UI.live={m:res.m,r:res.r,round:res.round,L:res.L,label:res.label||null,speed:(prev&&prev.speed)||'norm',tab:(prev&&prev.tab)||(innerWidth<900?'ticker':'lineup'),bi:0,beats:buildBeats(res.r),paused:false,done:false};
  UI.view='live';render();tickLive();
}
function tickLive(){
  clearTimeout(tickLive.t);const L=UI.live;if(!L||L.done||L.paused)return;
  const b=L.beats[L.bi];
  if(!b){L.done=true;if(UI.view==='live')render();return}
  const base=lspeedMs(L.speed);
  tickLive.t=setTimeout(()=>{
    if(UI.live!==L||L.paused)return;
    L.bi++;
    // versteckte Statistik-Ereignisse sofort mitnehmen
    while(L.beats[L.bi]&&L.beats[L.bi].d===0)L.bi++;
    if(b.pause){L.paused=b.pause}
    if(L.bi>=L.beats.length)L.done=true;
    if(UI.view==='live')render();
    if(!L.done&&!L.paused)tickLive();
  },b.d*base);
}
Object.assign(ACT,{
  liveSkip:()=>{const L=UI.live;clearTimeout(tickLive.t);L.bi=L.beats.length;L.done=true;L.paused=false;render()},
  livePause:()=>{const L=UI.live;if(L.done)return;L.paused=L.paused?false:'user';render();if(!L.paused)tickLive()},
  liveGo:()=>{const L=UI.live;L.paused=false;render();tickLive()},
  speed:d=>{const L=UI.live;L.speed=d.v;render();if(!L.paused)tickLive()},
  liveTab:d=>{UI.live.tab=d.v;render()}
});

/* ---------- Farben ---------- */
function lum(hex){const h=hex.replace('#','');if(h.length<6)return .5;const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return (0.299*r+0.587*g+0.114*b)/255}
function teamCols(hc,ac){
  const pickC=c=>{const [a,b]=c.colors;return lum(a)>.85||lum(a)<.12?(lum(b)>.85||lum(b)<.12?'#2a68b8':b):a};
  let h=pickC(hc),a=pickC(ac);
  const dist=(x,y)=>{const p=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));const u=p(x),v=p(y);return Math.hypot(u[0]-v[0],u[1]-v[1],u[2]-v[2])};
  try{if(dist(h,a)<90)a=h.toLowerCase()==='#d2402c'?'#2a68b8':'#d2402c'}catch(e){}
  return {h,a};
}

/* ---------- Darstellung ---------- */
const EV_ICON={goal:'⚽',card:'🟨',red:'🟥',sub:'🔁',injury:'🩹',whistle:'⏱️',corner:'⛳',offside:'🚩',offgoal:'🚩',foul:'⚠️',info:'💬',pen:'✅',penmiss:'❌'};
function evIcon(e){if(e.type==='chance')return e.out==='save'?'🧤':e.out==='post'?'🥅':e.out==='block'?'🛡️':'↗️';if(e.k==='var')return '📺';if(e.k==='pre')return '🏟️';return EV_ICON[e.type]||'•'}
function renderLive(){
  const L=UI.live;if(!L)return renderHome();
  const {m,r}=L,hc=club(m.h),ac=club(m.a),st=liveState(L),ti=tickInfo(r,st.t),col=teamCols(hc,ac);
  const inPen=st.pens!==null||ti.ph===5;
  let clock;
  if(L.done)clock=m.pen?'nach Elfmeterschießen':m.et?'nach Verlängerung':'Abpfiff';
  else if(L.paused==='ht')clock='Halbzeit';else if(L.paused==='et1')clock='Halbzeit Verlängerung';else if(L.paused==='et')clock='Ende reguläre Spielzeit';else if(L.paused==='pens'||inPen)clock='Elfmeterschießen';
  else if(st.t===0)clock='Vor dem Anpfiff';else clock=(ti.x?`${ti.m}+${ti.x}`:ti.m)+'. Minute';
  const scorers=s=>st.scorers[s].map(x=>`<div>⚽ ${esc(x.n)} ${x.l}</div>`).join('')+st.reds[s].map(x=>`<div>🟥 ${esc(x.n)} ${x.l}</div>`).join('');
  const total=r.et?(r.t120||r.end):(r.t90||r.end);
  const prog=Math.min(1,st.t/Math.max(1,total));
  const ctrl=L.done?`<button class="btn pri" data-act="liveDone">${UI.liveQueue&&UI.liveQueue.length?'Nächstes Spiel ▶':'Weiter zu den Ergebnissen ▶'}</button>`
    :L.paused&&L.paused!=='user'?`<button class="btn pri" data-act="liveGo">${L.paused==='ht'?'2. Halbzeit anpfeifen ▶':L.paused==='et'?'Verlängerung anpfeifen ▶':L.paused==='et1'?'Weiter ▶':'Zum Elfmeterschießen ▶'}</button><button class="btn" data-act="liveSkip">Zum Ergebnis ⏭</button>`
    :`<div class="seg">${LSPEED.map(([k,l])=>`<button class="${L.speed===k?'on':''}" data-act="speed" data-v="${k}">${l}</button>`).join('')}</div><button class="btn sm" data-act="livePause">${L.paused?'▶ Weiter':'⏸ Pause'}</button><button class="btn sm" data-act="liveSkip">Zum Ergebnis ⏭</button>`;
  const head=`<div class="card lscore">
    <div class="small muted" style="text-align:center;margin-bottom:6px">${L.label?esc(L.label):esc(L.L.name)+' · '+(L.round+1)+'. Spieltag'}${r.ref?' · Schiedsrichter '+esc(r.ref):''}</div>
    <div class="score">
      <div class="lteam">${badge(hc,52)}<b>${esc(hc.name)}</b><span class="small muted">${hc.tactic.f} · ${MENTALITY[hc.tactic.men]}</span><div class="lsc">${scorers('h')}</div></div>
      <div><div class="big ${L.flash?'flash':''}">${st.score.h}:${st.score.a}</div>${inPen&&st.pens?`<div class="small"><b>i.E. ${st.pens}</b></div>`:''}<div class="pill lclock ${!L.done&&!L.paused&&st.t>0?'run':''}">${clock}</div></div>
      <div class="lteam">${badge(ac,52)}<b>${esc(ac.name)}</b><span class="small muted">${ac.tactic.f} · ${MENTALITY[ac.tactic.men]}</span><div class="lsc">${scorers('a')}</div></div>
    </div>
    <div class="lprog"><i style="width:${prog*100}%"></i>${[45,90].map(x=>`<b style="left:${x/(r.et?120:90)*100}%"></b>`).join('')}</div>
    ${momentumSvg(r,st,col,total)}
    <div class="row" style="justify-content:center;margin-top:10px">${ctrl}</div>
    ${L.done?matchVerdict(L,st,hc,ac):''}
  </div>`;
  const tab=L.tab,rt=tab==='ticker'?'lineup':tab;
  const tabs=`<div class="seg ltabs">${[['ticker','Ticker'],['lineup','Aufstellungen'],['stats','Statistik'],['players','Spieler']].map(([k,l])=>`<button class="${k===tab?'on-m':''} ${k===rt?'on-d':''} ${k==='ticker'?'tk-only':''}" data-act="liveTab" data-v="${k}">${l}</button>`).join('')}</div>`;
  const right=rt==='lineup'?lineupPane(L,st,hc,ac):rt==='stats'?statsPane(L,st,hc,ac,col):playersPane(L,hc,ac);
  return `${head}${tabs}<div class="lgrid ${tab==='ticker'?'m-ticker':'m-right'}"><div class="card tick lticker">${tickerHtml(L,st,hc,ac)}</div><div class="lright">${right}</div></div>`;
}
function tickerHtml(L,st,hc,ac){
  const r=L.r;const items=[];
  for(const e of r.ev){if(e.hid)continue;const n=st.lines.get(e);if(!n)continue;items.push({e,n})}
  if(!items.length)return '<p class="muted">Gleich geht es los …</p>';
  const lastE=items[items.length-1].e;
  return items.reverse().map(({e,n})=>{
    const c=e.side==='h'?hc:ac,open=n<e.lines.length;
    const showTeam=!['info','whistle'].includes(e.type)||e.k==='var';
    const scored=e.type==='goal'&&n>e.gl;
    const cls=['lev','t-'+e.type,e.big?'big':'',scored?'scored':'',e===lastE&&!L.done?'cur':'',e.k==='ht'||e.k==='ft'||e.k==='et'||e.k==='pens'?'mark':''].join(' ');
    const lines=e.lines.slice(0,n).map((l,i)=>`<div class="${e.type==='goal'&&i===e.lines.length-1?'goalline':''} ${e===L.lastE&&i===n-1&&!L.done?'new':''}">${esc(l)}</div>`).join('');
    const xg=e.xg!==undefined&&!open?`<span class="xgtag">xG ${e.xg.toFixed(2)}</span>`:'';
    return `<div class="${cls}"><span class="m">${minLbl(e)}</span><span class="ic">${evIcon(e)}</span><div class="lt">${showTeam?`<span class="lteam-tag">${badge(c,18)}</span>`:''}${lines}${open?'<div class="dots"><i></i><i></i><i></i></div>':''}${xg}</div></div>`}).join('');
}
function momentumSvg(r,st,col,total){
  const W=600,H=64,bins=Math.ceil(Math.max(total,90)/5),bw=W/bins;const hb=new Array(bins).fill(0),ab=new Array(bins).fill(0);
  for(const x of st.xgT){const i=Math.min(bins-1,Math.floor((x.t-1)/5));(x.side==='h'?hb:ab)[i]+=x.q}
  const sc=v=>Math.min(H/2-4,v*46);
  let bars='';for(let i=0;i<bins;i++){if(hb[i])bars+=`<rect x="${i*bw+1}" y="${H/2-sc(hb[i])}" width="${bw-2}" height="${sc(hb[i])}" rx="1.5" fill="${col.h}"/>`;if(ab[i])bars+=`<rect x="${i*bw+1}" y="${H/2}" width="${bw-2}" height="${sc(ab[i])}" rx="1.5" fill="${col.a}"/>`}
  const goals=st.goalsT.map(g=>{const x=(g.t-.5)/Math.max(total,90)*W;return `<text x="${x}" y="${g.side==='h'?10:H-2}" font-size="10" text-anchor="middle">⚽</text>`}).join('');
  const now=st.t/Math.max(total,90)*W;
  return `<div class="lmom"><div class="small muted" style="display:flex;justify-content:space-between"><span>Spielverlauf · xG je 5 Minuten</span><span>xG <b style="color:${col.h}">${st.stats.h.xg.toFixed(2)}</b> : <b style="color:${col.a}">${st.stats.a.xg.toFixed(2)}</b></span></div>
   <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px"><line x1="0" x2="${W}" y1="${H/2}" y2="${H/2}" stroke="var(--line2)"/><line x1="${45/Math.max(total,90)*W}" x2="${45/Math.max(total,90)*W}" y1="0" y2="${H}" stroke="var(--line)" stroke-dasharray="3 3"/>${bars}${goals}<line x1="${now}" x2="${now}" y1="0" y2="${H}" stroke="var(--accent)" stroke-width="1.5"/></svg></div>`;
}
function matchVerdict(L,st,hc,ac){
  const r=L.r;const rt=r.rt||{};let best=null,bv=0;for(const id in rt){if(rt[id]>bv){bv=rt[id];best=id}}
  const p=best&&S.players[best],pc=p&&club(p.club);
  const xh=r.ts.h.xg,xa=r.ts.a.xg,gh=L.m.hg,ga=L.m.ag;
  let v='';const dx=xh-xa;
  if(gh>ga&&dx<-.6)v=`${hc.short} gewinnt, obwohl ${ac.short} die besseren Chancen hatte – Effizienz schlägt Dominanz.`;
  else if(ga>gh&&dx>.6)v=`${ac.short} gewinnt trotz weniger Torgefahr – ${hc.short} hat seine Chancen nicht genutzt.`;
  else if(gh===ga&&Math.abs(dx)>.8)v=`Nach Chancen hätte ${dx>0?hc.short:ac.short} gewinnen müssen.`;
  else v=`Das Ergebnis spiegelt den Spielverlauf wider.`;
  return `<div class="lverdict"><div>⭐ <b>Spieler des Spiels:</b> ${p?esc(fullname(p))+' ('+esc(pc?pc.short:'')+') · Note '+bv.toFixed(1):'–'}</div><div>📊 <b>Analyse:</b> xG ${xh.toFixed(2)} : ${xa.toFixed(2)} · ${esc(v)}</div></div>`;
}
function curLineup(L,st,side){
  const r=L.r,lu=r.xi[side].slice();
  for(const s of r.subs)if(s.side===side&&s.t<=st.t)lu[s.slot]=s.in;
  return lu;
}
function lineupPane(L,st,hc,ac){
  const r=L.r;const done=L.done;
  const team=(side,c)=>{
    ensureTactic(c);const lu=curLineup(L,st,side),sl=slotsOf(c),oop=c.tactic.oop||[];
    const redIds=new Set(st.reds[side].map(x=>x.id));
    const goals={};st.scorers[side].forEach(x=>goals[x.id]=(goals[x.id]||0)+1);
    const subIn={},subOut={};for(const s of r.subs)if(s.side===side&&s.t<=st.t){subIn[s.in]=minLbl(tickInfo(r,s.t));subOut[s.out]=minLbl(tickInfo(r,s.t))}
    const dots=lu.map((id,i)=>{const p=id&&S.players[id];if(!p||redIds.has(id))return '';const xy=oop[i]||[50,50];
      const tags=(goals[id]?'⚽'.repeat(goals[id]):'')+(st.yel[id]?'🟨':'')+(subIn[id]?'🔼':'');const rt=done&&r.rt&&r.rt[id];
      return `<div class="lslot" style="left:${xy[0]}%;top:${xy[1]}%"><div class="ldot" style="background:${GROUP_COLOR[GROUP[sl[i]]]}">${sl[i]}</div><div class="lnm">${esc(p.ln)}${tags?' '+tags:''}</div>${rt?`<div class="lrt" style="background:${rt>=7.5?'var(--good)':rt>=6.5?'var(--info)':rt>=5.8?'var(--gold)':'var(--bad)'}">${rt.toFixed(1)}</div>`:''}</div>`}).join('');
    const bench=r.bench[side].map(id=>S.players[id]).filter(Boolean).map(p=>`<div class="lbp ${subIn[p.id]?'in':''}"><span class="pill" style="font-size:10.5px;border-color:${GROUP_COLOR[GROUP[p.pos]]}88">${p.pos}</span><span class="nm">${esc(pname(p))}</span>${subIn[p.id]?`<span class="good small">🔼 ${subIn[p.id]}</span>`:`<span class="muted small">${ovr(p)}</span>`}</div>`).join('');
    const outs=Object.keys(subOut).map(id=>S.players[id]).filter(Boolean).map(p=>`<div class="lbp out"><span class="pill" style="font-size:10.5px">${p.pos}</span><span class="nm">${esc(pname(p))}</span><span class="bad small">🔽 ${subOut[p.id]}</span></div>`).join('');
    const sh=shapeMetrics?shapeMetrics(c):null;
    return `<div class="lteamcol"><div class="row" style="gap:8px;margin-bottom:6px">${badge(c,24)}<b>${esc(c.short)}</b><span class="small muted">${sh?'gegen den Ball '+sh.oopShape+' · mit Ball '+sh.ipShape:c.tactic.f}</span></div>
      <div class="lpitch"><i class="pb t"></i><i class="pb b"></i><i class="pm"></i><i class="pc"></i>${dots}</div>
      <h3 style="margin:10px 0 4px">Ersatzbank</h3><div class="lbench">${bench||'<span class="small muted">keine Ersatzspieler</span>'}${outs}</div></div>`;
  };
  return `<div class="card"><div class="lteams">${team('h',hc)}${team('a',ac)}</div><p class="small muted" style="margin:8px 0 0">Positionen gegen den Ball laut Taktik · 🔼 eingewechselt · 🔽 ausgewechselt${done?' · Zahl = Spielnote':''}</p></div>`;
}
function statsPane(L,st,hc,ac,col){
  const r=L.r,total=r.et?(r.t120||r.end):(r.t90||r.end),fr=L.done?1:Math.min(1,st.t/Math.max(1,total));
  const H=st.stats.h,A=st.stats.a,RH=r.ts.h,RA=r.ts.a;
  const pas=s=>Math.round((s==='h'?RH:RA).pas*fr),pcm=s=>Math.round((s==='h'?RH:RA).pcm*fr),q=s=>pas(s)?Math.round(pcm(s)/pas(s)*100):0;
  const rows=[['Ballbesitz',r.poss,100-r.poss,'%'],['Expected Goals (xG)',+H.xg.toFixed(2),+A.xg.toFixed(2)],['Torschüsse',H.sh,A.sh],['Aufs Tor',H.sot,A.sot],['Großchancen',H.bc,A.bc],
    ['Ecken',H.cor,A.cor],['Pässe',pas('h'),pas('a')],['Passquote',q('h'),q('a'),'%'],['Ballgewinne',Math.round((RH.tck+RH.int)*fr),Math.round((RA.tck+RA.int)*fr)],['Paraden',H.sav,A.sav],['Fouls',H.fls,A.fls],['Abseits',H.off,A.off],['Gelbe Karten',H.yc,A.yc],['Rote Karten',H.rc,A.rc]];
  const bars=rows.map(([l,a,b,u])=>{const t=(+a)+(+b)||1;return `<div class="lsr"><b>${a}${u||''}</b><span>${l}</span><b>${b}${u||''}</b><div class="lsb"><i style="width:${a/t*100}%;background:${col.h}"></i><i style="width:${b/t*100}%;background:${col.a}"></i></div></div>`}).join('');
  return `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:6px"><span>${badge(hc,22)} <b>${esc(hc.short)}</b></span><span class="small muted">${L.done?'Endstand':'live'}</span><span><b>${esc(ac.short)}</b> ${badge(ac,22)}</span></div>${bars}</div>
   <div class="card" style="margin-top:12px"><h3>xG-Verlauf</h3>${xgLine(st,col,total)}<p class="small muted" style="margin:6px 0 0">Expected Goals (xG) messen die Qualität der Torchancen: 0,10 heißt, aus dieser Lage fällt etwa jeder zehnte Schuss ins Tor. Die Summe zeigt, wie viele Tore ein Team im Schnitt erzielt hätte.</p></div>`;
}
function xgLine(st,col,total){
  const W=600,H=150,T=Math.max(total,90),pts={h:[[0,0]],a:[[0,0]]},cum={h:0,a:0};
  for(const x of st.xgT.slice().sort((a,b)=>a.t-b.t)){pts[x.side].push([x.t,cum[x.side]]);cum[x.side]+=x.q;pts[x.side].push([x.t,cum[x.side]])}
  pts.h.push([st.t,cum.h]);pts.a.push([st.t,cum.a]);
  const ymax=Math.max(1.5,Math.ceil(Math.max(cum.h,cum.a)*2)/2+.25);
  const X=t=>t/T*(W-30)+24,Y=v=>H-16-v/ymax*(H-26);
  const path=s=>pts[s].map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' ');
  const goals=st.goalsT.map(g=>{const c=pts[g.side].filter(p=>p[0]<=g.t).pop();return `<circle cx="${X(g.t)}" cy="${Y(c?c[1]:0)}" r="5" fill="${col[g.side]}" stroke="#fff" stroke-width="1.5"/>`}).join('');
  let grid='';for(let v=0;v<=ymax;v+=.5)grid+=`<line x1="24" x2="${W-6}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="0" y="${Y(v)+3}" font-size="10" fill="var(--muted)">${v.toFixed(1)}</text>`;
  for(const m of [45,90])grid+=`<line x1="${X(m)}" x2="${X(m)}" y1="6" y2="${H-16}" stroke="var(--line)" stroke-dasharray="3 3"/><text x="${X(m)}" y="${H-3}" font-size="10" fill="var(--muted)" text-anchor="middle">${m}'</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${grid}<path d="${path('h')}" fill="none" stroke="${col.h}" stroke-width="2.5"/><path d="${path('a')}" fill="none" stroke="${col.a}" stroke-width="2.5"/>${goals}</svg>`;
}
function playersPane(L,hc,ac){
  if(!L.done)return `<div class="card"><h3>Spielerwerte</h3><p class="small muted">Noten, Pässe, Zweikämpfe und xG jedes Spielers gibt es nach dem Abpfiff. Bis dahin: Daumen drücken!</p></div>`;
  const r=L.r,ps=r.ps||{},rt=r.rt||{},mins=r.min||{};
  let best=null,bv=0;for(const id in rt)if(rt[id]>bv){bv=rt[id];best=id}
  const team=(side,c)=>{
    const ids=r.xi[side].filter(Boolean).concat(r.subs.filter(s=>s.side===side).map(s=>s.in));
    const sl=slotsOf(c);
    const rows=ids.map(id=>{const p=S.players[id];if(!p)return '';const x=ps[id]||{},i=r.xi[side].indexOf(id),pos=i>=0?sl[i]:(r.subs.find(s=>s.in===id)||{}).slot!==undefined?sl[r.subs.find(s=>s.in===id).slot]:p.pos;const n=rt[id];
      return `<tr class="${id===best?'me':''}"><td><span class="pill" style="font-size:10.5px">${pos}</span></td><td>${esc(pname(p))}${id===best?' ⭐':''}${i<0?' <span class="small good">🔼</span>':''}</td><td class="n">${mins[id]||0}'</td><td class="n"><b style="color:${n>=7.5?'var(--good)':n<5.8?'var(--bad)':'inherit'}">${n?n.toFixed(1):'–'}</b></td><td class="n">${x.g||0}</td><td class="n">${x.a||0}</td><td class="n">${x.sh||0} (${x.sot||0})</td><td class="n">${(x.xg||0).toFixed(2)}</td><td class="n">${(x.xa||0).toFixed(2)}</td><td class="n">${x.kp||0}</td><td class="n">${x.pas||0} <span class="muted small">${x.pas?Math.round((x.pcm||0)/x.pas*100)+'%':''}</span></td><td class="n">${(x.tck||0)+(x.int||0)}</td><td class="n">${x.drb||0}</td><td class="n">${pos==='TW'?(x.sav||0):'–'}</td></tr>`}).join('');
    return `<h3 style="margin:4px 0 6px">${badge(c,20)} ${esc(c.name)}</h3><div class="tw" style="margin-bottom:12px"><table><thead><tr><th>Pos</th><th>Spieler</th><th class="n">Min</th><th class="n">Note</th><th class="n">T</th><th class="n">V</th><th class="n">Schüsse</th><th class="n">xG</th><th class="n">xA</th><th class="n">Key</th><th class="n">Pässe</th><th class="n">Ballgew.</th><th class="n">Dribbl.</th><th class="n">Paraden</th></tr></thead><tbody>${rows}</tbody></table></div>`};
  return `<div class="card">${team('h',hc)}${team('a',ac)}<p class="small muted" style="margin:0">Schüsse (aufs Tor) · xA = Qualität der Chancen, die der Spieler aufgelegt hat · Key = Schlüsselpässe · Ballgew. = Tacklings + abgefangene Bälle</p></div>`;
}
