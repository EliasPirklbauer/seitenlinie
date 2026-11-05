/* =====================================================================
   Seitenlinie – Rubrik „Statistiken“: Team-, Spieler- und Analysewerte
   ===================================================================== */
function stUI(){UI.st=UI.st||{tab:'teams',lid:null,grp:'att',sort:null,dir:-1,pm:'top',pos:'',psort:'goals'};return UI.st}
function ssOf(c){return c.ss&&c.ss.season===S.season?c.ss:null}
const f1=v=>(Math.round(v*10)/10).toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1});
const f2=v=>v.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct=v=>isFinite(v)?Math.round(v*100)+' %':'–';
const sgn=(v,f)=>(v>0?'+':v<0?'−':'±')+(f||f2)(Math.abs(v));

/* ---------- Teamwerte ---------- */
const TCOLS={
  att:[['mp','Sp',s=>s.mp,v=>v],['g','Tore',s=>s.g,v=>v],['xg','xG',s=>s.xg,f1],['gxg','Tore − xG',s=>s.g-s.xg,v=>sgn(v,f1)],['shp','Schüsse/Sp',s=>s.sh/s.mp,f1],['sotp','aufs Tor',s=>s.sot/Math.max(1,s.sh),pct],['bc','Großchancen',s=>s.bc,v=>v],['conv','Verwertung',s=>s.g/Math.max(1,s.sh),pct],['xgs','xG/Schuss',s=>s.xg/Math.max(1,s.sh),f2]],
  def:[['mp','Sp',s=>s.mp,v=>v],['ga','Gegentore',s=>s.ga,v=>v],['xga','xGA',s=>s.xga,f1],['gaxg','xGA − Gegentore',s=>s.xga-s.ga,v=>sgn(v,f1)],['shap','Schüsse zugel./Sp',s=>s.sha/s.mp,f1],['bca','Großch. zugel.',s=>s.bca,v=>v],['cs','Zu Null',s=>s.cs,v=>v],['bg','Ballgewinne/Sp',s=>(s.tck+s.int)/s.mp,f1]],
  style:[['mp','Sp',s=>s.mp,v=>v],['poss','Ballbesitz',s=>s.poss/s.mp/100,pct],['pasp','Pässe/Sp',s=>s.pas/s.mp,v=>Math.round(v)],['pq','Passquote',s=>s.pcm/Math.max(1,s.pas),pct],['ppda','PPDA',s=>s.pasA/Math.max(1,s.tck+s.int+s.fls),f1],['corp','Ecken/Sp',s=>s.cor/s.mp,f1],['offp','Abseits/Sp',s=>s.off/s.mp,f1]],
  disc:[['mp','Sp',s=>s.mp,v=>v],['flsp','Fouls/Sp',s=>s.fls/s.mp,f1],['yc','Gelb',s=>s.yc,v=>v],['rc','Rot',s=>s.rc,v=>v],['ycp','Gelb/Sp',s=>s.yc/s.mp,f2]]};
const TGRP=[['att','Angriff'],['def','Abwehr'],['style','Spielstil'],['disc','Disziplin']];
const TLOW=new Set(['ga','xga','shap','bca','ppda','flsp','yc','rc','ycp','offp']);

/* ---------- Spielerwerte ---------- */
const PCATS=[
  ['goals','Tore',p=>p.goals||0,v=>v],['ast','Vorlagen',p=>p.ast||0,v=>v],['sc','Scorerpunkte',p=>(p.goals||0)+(p.ast||0),v=>v],
  ['xg','Expected Goals (xG)',p=>sxv(p,'xg')/100,f1],['xa','Expected Assists (xA)',p=>sxv(p,'xa')/100,f1],['g90','Tore pro 90 Min.',p=>sxv(p,'min')>=450?(p.goals||0)/sxv(p,'min')*90:null,f2],
  ['sh','Torschüsse',p=>sxv(p,'sh'),v=>v],['kp','Schlüsselpässe',p=>sxv(p,'kp'),v=>v],['drb','Dribblings',p=>sxv(p,'drb'),v=>v],
  ['bg','Ballgewinne',p=>sxv(p,'tck')+sxv(p,'int'),v=>v],['pq','Passquote (ab 300 Pässe)',p=>sxv(p,'pas')>=300?sxv(p,'pcm')/sxv(p,'pas'):null,pct],['pas','Pässe',p=>sxv(p,'pas'),v=>v],
  ['sav','Paraden',p=>p.pos==='TW'?sxv(p,'sav'):null,v=>v],['cs','Zu Null',p=>p.pos==='TW'?(p.cs||0):null,v=>v],['rt','Ø-Note (ab 5 Spielen)',p=>p.rn>=5?p.rs/p.rn/10:null,v=>v.toFixed(2).replace('.',',')],
  ['gxg','Tore über xG (Abschlussstärke)',p=>sxv(p,'xg')>=150?(p.goals||0)-sxv(p,'xg')/100:null,v=>sgn(v,f1)],['yc','Gelbe Karten',p=>p.yc||0,v=>v],['min','Einsatzminuten',p=>sxv(p,'min'),v=>v.toLocaleString('de-DE')]];
function leaguePlayers(L){return L.clubs.flatMap(id=>squadOf(club(id))).filter(Boolean)}

/* ---------- Hauptansicht ---------- */
function renderStats(){
  const U=stUI(),uL=league(userClub());const L=S.leagues[U.lid!==null&&U.lid!==undefined?U.lid:uL.id]||uL;
  const tabs=`<div class="seg">${[['teams','Teams'],['players','Spieler'],['analysis','Analyse'],['mine','Mein Team']].map(([k,l])=>`<button class="${U.tab===k?'on':''}" data-act="stTab" data-v="${k}">${l}</button>`).join('')}</div>`;
  const played=L.clubs.some(id=>{const s=ssOf(club(id));return s&&s.mp});
  let body;
  if(U.tab==='mine')body=statsMine();
  else if(!played)body=`<div class="card"><p class="muted">In der ${esc(L.name)} wurde in dieser Saison noch nicht gespielt. Die Statistiken füllen sich nach dem ersten Spieltag.</p></div>`;
  else body=U.tab==='teams'?statsTeams(L):U.tab==='players'?statsPlayers(L):statsAnalysis(L);
  return `<div class="row" style="justify-content:space-between;margin-bottom:10px"><h2 style="margin:0">Statistiken <span class="small muted">Saison ${S.season}/${(S.season+1)%100}</span></h2>${U.tab!=='mine'?leagueSelect(L.id,'stLeague'):''}</div>
   <div class="row" style="margin-bottom:12px">${tabs}</div>${body}`;
}
function statsTeams(L){
  const U=stUI(),cols=TCOLS[U.grp];
  const rows=L.clubs.map(id=>({c:club(id),s:ssOf(club(id))})).filter(x=>x.s&&x.s.mp);
  const key=U.sort&&cols.find(c=>c[0]===U.sort)?U.sort:cols[1][0],col=cols.find(c=>c[0]===key),dir=U.sort===key?U.dir:(TLOW.has(key)?1:-1);
  rows.sort((a,b)=>(col[2](a.s)-col[2](b.s))*dir);
  // Ligadurchschnitt
  const avg=cols.map(c=>{const vs=rows.map(x=>c[2](x.s)).filter(v=>isFinite(v));return vs.reduce((a,b)=>a+b,0)/Math.max(1,vs.length)});
  const best=cols.map(c=>{const vs=rows.map(x=>c[2](x.s));return TLOW.has(c[0])?Math.min(...vs):Math.max(...vs)});
  const th=cols.map(c=>`<th class="n click" data-act="stSort" data-v="${c[0]}">${c[1]}${c[0]===key?(dir<0?' ▾':' ▴'):''}</th>`).join('');
  const tr=rows.map((x,i)=>`<tr class="${x.c.id===S.user?'me':''} click" data-act="clubInfo" data-id="${x.c.id}"><td class="n">${i+1}</td><td>${badge(x.c,20)} ${esc(x.c.name)}</td>${cols.map((c,j)=>{const v=c[2](x.s);return `<td class="n ${c[0]===key?'stk':''}">${v===best[j]&&j>0&&c[0]!=='mp'?'<b>':''}${c[3](v)}${v===best[j]&&j>0&&c[0]!=='mp'?'</b>':''}</td>`}).join('')}</tr>`).join('');
  const help={att:'Tore − xG: positiv = Chancen besser verwertet als erwartet. Großchancen = Schüsse mit mindestens 25 % Torwahrscheinlichkeit.',def:'xGA = Expected Goals gegen dich. xGA − Gegentore positiv: weniger kassiert als die Chancen des Gegners hergaben (starker Torwart oder Glück).',style:'PPDA = gegnerische Pässe pro eigener Defensivaktion (Tackling, abgefangener Ball, Foul). Je niedriger, desto intensiver das Pressing.',disc:'Fouls und Karten. Harte Zweikampfführung und Gegenpressing treiben die Werte nach oben.'}[U.grp];
  return `<div class="seg" style="margin-bottom:10px">${TGRP.map(([k,l])=>`<button class="${U.grp===k?'on':''}" data-act="stGrp" data-v="${k}">${l}</button>`).join('')}</div>
   <div class="tw"><table class="sttab"><thead><tr><th class="n">#</th><th>Verein</th>${th}</tr></thead><tbody>${tr}<tr class="stavg"><td></td><td class="muted">Ligaschnitt</td>${cols.map((c,j)=>`<td class="n muted">${j===0?'':(c[3]===TCOLS.att[0][3]||String(c[3]).startsWith('v=>v'))?f1(avg[j]):c[3](avg[j])}</td>`).join('')}</tr></tbody></table></div>
   <p class="small muted">${help} Nur Ligaspiele · Spaltenkopf antippen zum Sortieren.</p>`;
}
function statsPlayers(L){
  const U=stUI();const all=leaguePlayers(L).filter(p=>p.apps>0||sxv(p,'min')>0);
  const mode=`<div class="seg" style="margin-bottom:10px">${[['top','Bestenlisten'],['table','Alle Spieler']].map(([k,l])=>`<button class="${U.pm===k?'on':''}" data-act="stPm" data-v="${k}">${l}</button>`).join('')}</div>`;
  if(U.pm==='top'){
    const cards=PCATS.map(([k,l,fn,fmt])=>{
      const list=all.map(p=>({p,v:fn(p)})).filter(x=>x.v!==null&&x.v>0||k==='gxg'&&x.v!==null).sort((a,b)=>b.v-a.v).slice(0,k==='gxg'?5:8);
      if(!list.length)return '';
      return `<div class="card stlb"><h3>${l}</h3>${list.map((x,i)=>{const c=club(x.p.club);return `<div class="stl ${x.p.club===S.user?'mine':''}" data-act="player" data-id="${x.p.id}"><span class="r">${i+1}</span>${badge(c,18)}<span class="nm">${esc(pname(x.p))}<small>${x.p.pos} · ${esc(c.short)}</small></span><b>${fmt(x.v)}</b></div>`}).join('')}</div>`}).join('');
    return mode+`<div class="stgrid">${cards}</div><p class="small muted">Alle Wettbewerbe der laufenden Saison, Spieler der ${esc(L.name)}. Tippe auf einen Spieler für seine Karte.</p>`;
  }
  const cols=[['min','Min',p=>sxv(p,'min')],['apps','Sp',p=>p.apps],['goals','T',p=>p.goals||0],['ast','V',p=>p.ast||0],['xg','xG',p=>sxv(p,'xg')/100],['xa','xA',p=>sxv(p,'xa')/100],['sh','Sch.',p=>sxv(p,'sh')],['sot','aT',p=>sxv(p,'sot')],['kp','Key',p=>sxv(p,'kp')],['drb','Drb.',p=>sxv(p,'drb')],['bg','Ballg.',p=>sxv(p,'tck')+sxv(p,'int')],['pq','Pass %',p=>sxv(p,'pas')?sxv(p,'pcm')/sxv(p,'pas'):0],['rt','Note',p=>p.rn?p.rs/p.rn/10:0]];
  const ps=all.filter(p=>!U.pos||p.pos===U.pos);const col=cols.find(c=>c[0]===U.psort)||cols[2];ps.sort((a,b)=>col[2](b)-col[2](a));
  const fmt=(k,v)=>k==='xg'||k==='xa'?f1(v):k==='pq'?(v?Math.round(v*100):'–'):k==='rt'?(v?v.toFixed(2).replace('.',','):'–'):v;
  const posSel=`<div class="chipsel" style="margin-bottom:8px">${['',...POS_LIST].map(p=>`<button class="${U.pos===p?'on':''}" data-act="stPos" data-v="${p}">${p||'Alle'}</button>`).join('')}</div>`;
  return mode+posSel+`<div class="tw"><table class="sttab"><thead><tr><th class="n">#</th><th>Spieler</th><th>Verein</th>${cols.map(c=>`<th class="n click" data-act="stPsort" data-v="${c[0]}">${c[1]}${c[0]===col[0]?' ▾':''}</th>`).join('')}</tr></thead><tbody>${ps.slice(0,100).map((p,i)=>`<tr class="click ${p.club===S.user?'me':''}" data-act="player" data-id="${p.id}"><td class="n">${i+1}</td><td><span class="pill" style="font-size:10.5px">${p.pos}</span> ${esc(pname(p))}</td><td>${badge(club(p.club),18)}</td>${cols.map(c=>`<td class="n ${c[0]===col[0]?'stk':''}">${fmt(c[0],c[2](p))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
   <p class="small muted">Top 100 · Sch. = Torschüsse, aT = aufs Tor, Key = Schlüsselpässe, Drb. = erfolgreiche Dribblings, Ballg. = Tacklings + abgefangene Bälle.</p>`;
}
function statsAnalysis(L){
  const rows=L.clubs.map(id=>({c:club(id),s:ssOf(club(id))})).filter(x=>x.s&&x.s.mp);
  const tab=tableOf(L);const rank=id=>tab.findIndex(r=>r.id===id)+1;
  const byX=rows.slice().sort((a,b)=>b.s.xpts-a.s.xpts);
  const maxD=Math.max(1,...rows.map(x=>Math.abs(x.s.pts-x.s.xpts)));
  const xrows=byX.map((x,i)=>{const d=x.s.pts-x.s.xpts,r=rank(x.c.id);return `<tr class="${x.c.id===S.user?'me':''}"><td class="n">${i+1}</td><td>${badge(x.c,20)} ${esc(x.c.name)}</td><td class="n muted">${r}.${r!==i+1?` <span class="${r<i+1?'good':'bad'}">${r<i+1?'▲':'▼'}${Math.abs(r-(i+1))}</span>`:''}</td><td class="n"><b>${f1(x.s.xpts)}</b></td><td class="n">${x.s.pts}</td><td class="stdiff"><div class="dbar"><i class="${d>=0?'pos':'neg'}" style="${d>=0?'left:50%':'right:50%'};width:${Math.abs(d)/maxD*50}%"></i></div><span class="${d>=.5?'good':d<=-.5?'bad':'muted'}">${sgn(d,f1)}</span></td></tr>`}).join('');
  // Streudiagramm xG vs xGA pro Spiel
  const W=460,H=340,pad=34;const xs=rows.map(x=>x.s.xg/x.s.mp),ys=rows.map(x=>x.s.xga/x.s.mp);
  const x0=Math.min(...xs)*.9,x1=Math.max(...xs)*1.08,y0=Math.min(...ys)*.9,y1=Math.max(...ys)*1.08;
  const X=v=>pad+(v-x0)/(x1-x0||1)*(W-pad-12),Y=v=>12+(v-y0)/(y1-y0||1)*(H-pad-12);   // wenig Gegentor-xG = oben
  const mx=xs.reduce((a,b)=>a+b,0)/xs.length,my=ys.reduce((a,b)=>a+b,0)/ys.length;
  const dots=rows.map(x=>{const c=x.c,cx=X(x.s.xg/x.s.mp),cy=Y(x.s.xga/x.s.mp);return `<g><circle cx="${cx}" cy="${cy}" r="${c.id===S.user?9:7}" fill="${c.colors[0]}" stroke="${c.id===S.user?'var(--accent)':c.colors[1]}" stroke-width="${c.id===S.user?3:1.5}"/><text x="${cx}" y="${cy-11}" font-size="11" text-anchor="middle" fill="var(--text)" font-weight="600">${esc(c.short)}</text></g>`}).join('');
  const scatter=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto"><rect x="${pad}" y="12" width="${W-pad-12}" height="${H-pad-12}" fill="none" stroke="var(--line)"/>
    <line x1="${X(mx)}" x2="${X(mx)}" y1="12" y2="${H-pad}" stroke="var(--line2)" stroke-dasharray="4 4"/><line x1="${pad}" x2="${W-12}" y1="${Y(my)}" y2="${Y(my)}" stroke="var(--line2)" stroke-dasharray="4 4"/>
    <text x="${W-16}" y="26" font-size="11" text-anchor="end" fill="var(--good)" font-weight="700">dominant</text><text x="${pad+6}" y="26" font-size="11" fill="var(--muted)" font-weight="700">defensiv stabil</text>
    <text x="${W-16}" y="${H-pad-6}" font-size="11" text-anchor="end" fill="var(--muted)" font-weight="700">offensiv, aber offen</text><text x="${pad+6}" y="${H-pad-6}" font-size="11" fill="var(--bad)" font-weight="700">unterlegen</text>
    ${dots}<text x="${(W+pad)/2}" y="${H-8}" font-size="11" text-anchor="middle" fill="var(--muted)">xG pro Spiel (eigene Chancen) →</text><text x="12" y="${(H-pad)/2}" font-size="11" fill="var(--muted)" transform="rotate(-90 12 ${(H-pad)/2})" text-anchor="middle">← xG gegen pro Spiel (weniger = besser)</text></svg>`;
  // Abschlussstärke der Spieler
  const ps=leaguePlayers(L).filter(p=>sxv(p,'xg')>=120).map(p=>({p,d:(p.goals||0)-sxv(p,'xg')/100})).sort((a,b)=>b.d-a.d);
  const pl=list=>list.map(x=>`<div class="stl" data-act="player" data-id="${x.p.id}">${badge(club(x.p.club),18)}<span class="nm">${esc(pname(x.p))}<small>${x.p.goals} Tore aus ${f1(sxv(x.p,'xg')/100)} xG</small></span><b class="${x.d>=0?'good':'bad'}">${sgn(x.d,f1)}</b></div>`).join('')||'<p class="small muted">Noch zu wenige Daten.</p>';
  const lucky=byX.slice().sort((a,b)=>(b.s.pts-b.s.xpts)-(a.s.pts-a.s.xpts))[0],unlucky=byX.slice().sort((a,b)=>(a.s.pts-a.s.xpts)-(b.s.pts-b.s.xpts))[0];
  return `<div class="grid g2">
   <div class="card" style="grid-column:1/-1"><h3>Tabelle nach Expected Points (xPts)</h3><p class="small muted" style="margin-top:-4px">Aus den xG beider Teams wird für jedes Spiel berechnet, wie viele Punkte ein Team im Schnitt geholt hätte. Die Differenz zeigt, wer über oder unter seinen Verhältnissen spielt. Am meisten Glück hatte bisher <b>${esc(lucky.c.short)}</b> (${sgn(lucky.s.pts-lucky.s.xpts,f1)}), am meisten Pech <b>${esc(unlucky.c.short)}</b> (${sgn(unlucky.s.pts-unlucky.s.xpts,f1)}).</p>
     <div class="tw"><table><thead><tr><th class="n">#</th><th>Verein</th><th class="n">echter Platz</th><th class="n">xPts</th><th class="n">Pkt</th><th>Pkt − xPts</th></tr></thead><tbody>${xrows}</tbody></table></div></div>
   <div class="card"><h3>Chancen für und gegen</h3>${scatter}<p class="small muted">Rechts = viele eigene Chancen, oben = wenige Chancen zugelassen. Die gestrichelten Linien zeigen den Ligaschnitt.</p></div>
   <div class="card"><h3>Abschlussstärke</h3><p class="small muted" style="margin-top:-4px">Tore minus xG: Wer trifft öfter, als seine Chancen erwarten lassen? (ab 1,2 xG)</p><h3 style="font-size:12.5px;margin:10px 0 4px">Eiskalt</h3>${pl(ps.slice(0,5))}<h3 style="font-size:12.5px;margin:14px 0 4px">Glücklos</h3>${pl(ps.slice(-5).reverse())}</div>
  </div>`;
}
function statsMine(){
  const u=userClub(),L=league(u),s=ssOf(u),reps=(S.ureps||[]).filter(r=>r.s===S.season);
  if(!reps.length)return `<div class="card"><p class="muted">Noch keine Pflichtspiele in dieser Saison. Nach deinem ersten Spiel siehst du hier den xG-Verlauf deines Teams.</p></div>`;
  // Chart: xG für/gegen pro Spiel + gleitender Schnitt
  const W=720,H=220,n=reps.length,bw=Math.min(36,(W-40)/n),mid=H/2;const mx=Math.max(2,...reps.map(r=>Math.max(r.xf,r.xa)));
  const sc=v=>v/mx*(mid-22);
  const roll=(k)=>reps.map((r,i)=>{const w=reps.slice(Math.max(0,i-4),i+1);return w.reduce((a,b)=>a+b[k],0)/w.length});
  const rf=roll('xf'),ra=roll('xa');
  const X=i=>30+i*bw+bw/2;
  const bars=reps.map((r,i)=>{const c=club(r.opp),res=r.gf>r.ga?'good':r.gf<r.ga?'bad':'gold';return `<g><title>${esc(r.lbl)} · ${r.home?'H':'A'} ${esc(c?c.name:'')} · ${r.gf}:${r.ga} · xG ${f2(r.xf)}:${f2(r.xa)}</title><rect x="${X(i)-bw*.36}" y="${mid-sc(r.xf)}" width="${bw*.72}" height="${sc(r.xf)}" rx="2" fill="var(--good)" opacity=".75"/><rect x="${X(i)-bw*.36}" y="${mid}" width="${bw*.72}" height="${sc(r.xa)}" rx="2" fill="var(--bad)" opacity=".7"/><text x="${X(i)}" y="${H-4}" font-size="9.5" text-anchor="middle" fill="var(--${res})" font-weight="700">${r.gf}:${r.ga}</text></g>`}).join('');
  const line=(arr,sign,col)=>`<path d="${arr.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+(mid+sign*sc(v)).toFixed(1)).join(' ')}" fill="none" stroke="${col}" stroke-width="2.5"/>`;
  const chart=`<svg viewBox="0 0 ${Math.max(W,30+n*bw+10)} ${H}" style="width:100%;height:auto"><line x1="30" x2="${30+n*bw}" y1="${mid}" y2="${mid}" stroke="var(--line2)"/><text x="0" y="16" font-size="10" fill="var(--good)">xG für</text><text x="0" y="${H-24}" font-size="10" fill="var(--bad)">xG gegen</text>${bars}${line(rf,-1,'var(--good)')}${line(ra,1,'var(--bad)')}</svg>`;
  const tot=k=>reps.reduce((a,r)=>a+r[k],0);
  const kpis=[['xG pro Spiel',f2(tot('xf')/n)],['xG gegen pro Spiel',f2(tot('xa')/n)],['Tore − xG',sgn(tot('gf')-tot('xf'),f1)],['Gegentore − xGA',sgn(tot('ga')-tot('xa'),f1)],['Ø Ballbesitz',Math.round(tot('poss')/n)+' %'],['Schüsse pro Spiel',f1(tot('sh')/n)]];
  // Rang in der Liga
  let ranks='';if(s&&s.mp){const rows=L.clubs.map(id=>ssOf(club(id))?{id,s:ssOf(club(id))}:null).filter(x=>x&&x.s.mp);
    const rk=(fn,low)=>{const sorted=rows.slice().sort((a,b)=>low?fn(a.s)-fn(b.s):fn(b.s)-fn(a.s));return sorted.findIndex(x=>x.id===S.user)+1};
    const items=[['xG',rk(s=>s.xg/s.mp)],['wenigste xGA',rk(s=>s.xga/s.mp,true)],['Ballbesitz',rk(s=>s.poss/s.mp)],['Passquote',rk(s=>s.pcm/Math.max(1,s.pas))],['Pressing (PPDA)',rk(s=>s.pasA/Math.max(1,s.tck+s.int+s.fls),true)],['Großchancen',rk(s=>s.bc)],['xPts',rk(s=>s.xpts)]];
    ranks=`<div class="card"><h3>Ligavergleich (${esc(L.name)})</h3><div class="strank">${items.map(([l,r])=>`<div><b class="${r<=3?'good':r>rows.length-3?'bad':''}">${r}.</b><span>${l}</span></div>`).join('')}</div><p class="small muted">Platz unter ${rows.length} Teams. Punkte ${s.pts}, nach Chancen verdient: ${f1(s.xpts)} xPts.</p></div>`}
  // Kaderwerte
  const sq=squadOf(u).filter(p=>p.apps>0).sort((a,b)=>sxv(b,'min')-sxv(a,'min'));
  const tr=sq.map(p=>`<tr class="click" data-act="player" data-id="${p.id}"><td><span class="pill" style="font-size:10.5px">${p.pos}</span></td><td>${esc(pname(p))}</td><td class="n">${p.apps}</td><td class="n">${sxv(p,'min')}</td><td class="n">${p.goals||0}</td><td class="n">${p.ast||0}</td><td class="n">${f1(sxv(p,'xg')/100)}</td><td class="n">${f1(sxv(p,'xa')/100)}</td><td class="n">${sxv(p,'sh')}</td><td class="n">${sxv(p,'kp')}</td><td class="n">${sxv(p,'pas')?Math.round(sxv(p,'pcm')/sxv(p,'pas')*100)+' %':'–'}</td><td class="n">${sxv(p,'tck')+sxv(p,'int')}</td><td class="n">${sxv(p,'drb')}</td><td class="n">${p.pos==='TW'?sxv(p,'sav'):'–'}</td><td class="n"><b>${p.rn?(p.rs/p.rn/10).toFixed(2).replace('.',','):'–'}</b></td></tr>`).join('');
  return `<div class="grid g2"><div class="card" style="grid-column:1/-1"><h3>xG-Verlauf deiner Spiele</h3>${chart}<p class="small muted">Balken: xG für (oben) und gegen (unten) in jedem Pflichtspiel, darunter das Ergebnis. Linien: Schnitt der letzten 5 Spiele. Liegt die grüne Linie dauerhaft über der roten, ist dein Team auf einem guten Weg, auch wenn die Ergebnisse mal fehlen.</p>
     <div class="ksum" style="margin-top:10px">${kpis.map(([l,v])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div></div>
   ${ranks}
   <div class="card" style="grid-column:1/-1"><h3>Kader-Statistik (alle Wettbewerbe)</h3><div class="tw"><table class="sttab"><thead><tr><th>Pos</th><th>Spieler</th><th class="n">Sp</th><th class="n">Min</th><th class="n">T</th><th class="n">V</th><th class="n">xG</th><th class="n">xA</th><th class="n">Sch.</th><th class="n">Key</th><th class="n">Pass %</th><th class="n">Ballg.</th><th class="n">Drb.</th><th class="n">Paraden</th><th class="n">Note</th></tr></thead><tbody>${tr}</tbody></table></div></div></div>`;
}
Object.assign(ACT,{
  stTab:d=>{stUI().tab=d.v;render()},
  stGrp:d=>{const U=stUI();U.grp=d.v;U.sort=null;render()},
  stSort:d=>{const U=stUI();if(U.sort===d.v)U.dir*=-1;else{U.sort=d.v;U.dir=TLOW.has(d.v)?1:-1}render()},
  stPm:d=>{stUI().pm=d.v;render()},
  stPos:d=>{stUI().pos=d.v;render()},
  stPsort:d=>{stUI().psort=d.v;render()}
});
Object.assign(CHG,{stLeague:el=>{stUI().lid=+el.value;render()}});
