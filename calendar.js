/* =====================================================================
   Seitenlinie – Kalender: alle Termine aller Wettbewerbe im Monatsblick
   ===================================================================== */
const MONTHS=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const WDAYS=['Mo','Di','Mi','Do','Fr','Sa','So'];
function isoAdd(iso,n){return addDaysIso(iso,n)}
function wdayIso(iso){const d=new Date(iso+'T00:00:00Z').getUTCDay();return (d+6)%7} // 0 = Montag
// Spieltermin einer Spielwoche: Liga am Samstag, Europapokal Di/Mi/Do, Pokal Mittwoch, Supercup Freitag
/* ---------- Realistische Spieltermine ---------- */
function satOf(w){let d=gameDate(w);while(wdayIso(d)!==5)d=isoAdd(d,1);return d}
const DOFF={mo:2,di:-4,mi:-3,do:-2,fr:-1,sa:0,so:1};
// Anstoßzeiten der Ligen (Wochentag, Uhrzeit, Anzahl Spiele)
const LEAGUE_PAT={
 GER:[['fr','20:30',1],['sa','15:30',5],['sa','18:30',1],['so','15:30',1],['so','17:30',1],['so','19:30',1]],
 ENG:[['sa','13:30',1],['sa','16:00',5],['sa','18:30',1],['so','15:00',2],['so','17:30',1],['mo','21:00',1]],
 ESP:[['fr','21:00',1],['sa','14:00',1],['sa','16:15',1],['sa','18:30',1],['sa','21:00',1],['so','14:00',1],['so','16:15',1],['so','18:30',1],['so','21:00',1],['mo','21:00',1]],
 ITA:[['sa','15:00',1],['sa','18:00',1],['sa','20:45',1],['so','12:30',1],['so','15:00',3],['so','18:00',1],['so','20:45',1],['mo','20:45',1]],
 FRA:[['fr','20:45',1],['sa','17:00',1],['sa','19:00',1],['sa','21:05',1],['so','15:00',3],['so','17:15',1],['so','20:45',1]],
 NED:[['fr','20:00',1],['sa','16:30',1],['sa','18:45',1],['sa','21:00',1],['so','12:15',1],['so','14:30',3],['so','16:45',1]],
 POR:[['fr','20:15',1],['sa','15:30',1],['sa','18:00',1],['sa','20:30',1],['so','15:30',2],['so','18:00',1],['so','20:30',1],['mo','20:15',1]],
 _low:[['fr','19:00',1],['sa','14:00',4],['sa','16:00',2],['so','13:30',2],['so','16:00',1]],
 _def:[['fr','20:00',1],['sa','15:00',4],['sa','18:00',2],['so','15:00',2],['so','17:30',1]]};
const MIDWEEK_PAT=[['di','18:30',2],['di','20:30',2],['mi','18:30',3],['mi','20:30',3]];
function hshuffle(arr,seed){const R=mkRng(hashStr(seed)),a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function expandPat(pat,n){const out=[];for(const [d,t,k] of pat)for(let i=0;i<k;i++)out.push([d,t]);while(out.length<n)out.push(['sa','15:30']);return out.slice(0,n)}
let CAL_BUSY=null;
function busyWeeks(){
  if(CAL_BUSY&&CAL_BUSY.key===S.season+':'+S.week)return CAL_BUSY.set;
  const set=new Set();for(const C of S.comps||[])if(!C.bg)C.rounds.forEach(r=>set.add(r.w));for(const cup of S.ncups||[]){cup.rounds.forEach(r=>set.add(r.w));(cup.slots||[]).forEach(w=>set.add(w))}
  CAL_BUSY={key:S.season+':'+S.week,set};return set;
}
function leagueRoundSlots(L,r){
  const md=L.fixtures[r],w=L.rw[r],sat=satOf(w),code=L.assoc;
  const nr=L.fixtures.length,R=mkRng(hashStr('mw'+L.id+':'+S.season));const mids=new Set();
  if(L.tier<=2){const k=nr>=36?3:2;let guard=0;while(mids.size<k&&guard++<50){const x=3+Math.floor(R()*(nr-7));if(!busyWeeks().has(L.rw[x]))mids.add(x)}}
  // Boxing Day in England / Schottland
  if((code==='ENG'||code==='SCO')){let best=-1,bd=99;L.fixtures.forEach((_,x)=>{const s=satOf(L.rw[x]),dd=Math.abs(isoDays(s)-isoDays(`${S.season}-12-26`));if(dd<bd){bd=dd;best=x}});
    if(best===r&&bd<=6){const ord=hshuffle(md.map((_,k)=>k),'bx'+L.id+r);const out=[];ord.forEach((k,j)=>out[k]={d:`${S.season}-12-${j<md.length-2?'26':'27'}`,t:j%3===0?'12:30':j%3===1?'15:00':'17:30'});return out}}
  const pat=mids.has(r)?MIDWEEK_PAT:L.tier===1?(LEAGUE_PAT[code]||LEAGUE_PAT._def):LEAGUE_PAT._low;
  const slots=expandPat(pat,md.length),ord=hshuffle(md.map((_,k)=>k),'lg'+L.id+':'+r+':'+S.season),out=[];
  ord.forEach((k,j)=>{const [dn,t]=slots[j];out[k]={d:isoAdd(sat,DOFF[dn]),t,mid:mids.has(r)}});
  return out;
}
function isFinal(label){return /^Finale/.test(label)}
// Wochentage der Kontinentalwettbewerbe: [Wochentage normale Runden], Finale [Tag, Uhrzeit]
const COMP_DAYS={ucl:{days:['di','mi'],times:['18:45','21:00'],final:['sa','21:00']},uel:{days:['do'],times:['18:45','21:00'],final:['mi','21:00']},uecl:{days:['do'],times:['18:45','21:00'],final:['mi','21:00']},
 lib:{days:['di','mi','do'],times:['19:00','21:30'],final:['sa','17:00']},sud:{days:['di','mi','do'],times:['19:00','21:30'],final:['sa','17:00']},
 acle:{days:['mo','di'],times:['16:00','18:00'],final:['sa','19:30']},acl2:{days:['mi','do'],times:['16:00','18:00'],final:['sa','19:30']},
 cafcl:{days:['fr','sa','so'],times:['16:00','19:00'],final:['so','20:00']},cafcc:{days:['mi','so'],times:['16:00','19:00'],final:['so','17:00']},
 ccc:{days:['di','mi','do'],times:['19:00','21:00'],final:['sa','20:00']},ofc:{days:['sa','so'],times:['15:00','18:00'],final:['sa','16:00']}};
function compRoundSlots(C,r){
  const D=COMP_DAYS[C.key]||{days:['mi'],times:['20:00'],final:['sa','20:00']},sat=satOf(r.w);
  if(isFinal(r.label))return r.matches.map(()=>({d:isoAdd(sat,DOFF[D.final[0]]),t:D.final[1]}));
  const n=Math.max(1,r.matches.length),ord=hshuffle([...Array(n).keys()],'cp'+C.key+r.label+S.season),out=[];
  // Rückspiele am selben Wochentag wie das Hinspiel des Duells
  ord.forEach((k,j)=>{const day=D.days[(r.ko!==undefined?k:j)%D.days.length],t=D.times[j%D.times.length];out[k]={d:isoAdd(sat,DOFF[day]),t}});
  return out;
}
// Pokale: frühe Runden je nach Land am Wochenende, sonst unter der Woche; Finale nach Landespraxis
const CUP_FINAL={GER:['sa','20:00'],ENG:['sa','16:30'],ESP:['sa','21:30'],ITA:['mi','21:00'],FRA:['sa','21:00'],NED:['so','18:00'],POR:['so','17:15'],SCO:['sa','15:00'],BEL:['so','14:30'],TUR:['mi','20:45'],AUT:['do','20:30'],SUI:['so','14:00']};
const CUP_WEEKEND={GER:1,ENG:99,FRA:6,POR:4,SCO:99,BEL:2,NED:1,SUI:3,AUT:2,ESP:0,ITA:0};
function cupRoundSlots(cup,r,si,n){
  const sat=satOf(r.w),code=cup.code,lbl=r.label;
  if(isFinal(lbl)&&!/Hin|Rück/.test(lbl)){const f=CUP_FINAL[code]||['sa','20:00'];return Array.from({length:n},()=>({d:isoAdd(sat,DOFF[f[0]]),t:f[1]}))}
  const wkEnd=(CUP_WEEKEND[code]!==undefined?CUP_WEEKEND[code]:1)>si;
  // Pokalrunde am Wochenende nur, wenn die eigene Liga in dieser Woche pausiert – sonst unter der Woche
  const top=S.leagues.find(L=>L.assoc===code&&L.tier===1),lgThatWeek=top&&top.rw.includes(r.w);
  const pat=wkEnd&&!lgThatWeek?[['fr','20:45'],['sa','15:30'],['sa','18:30'],['so','15:30'],['so','18:30'],['sa','14:00']]:[['di','18:00'],['di','20:45'],['mi','18:00'],['mi','20:45'],['do','20:45']];
  const ord=hshuffle([...Array(n).keys()],'cup'+code+lbl+S.season),out=[];ord.forEach((k,j)=>{const [dn,t]=pat[j%pat.length];out[k]={d:isoAdd(sat,DOFF[dn]),t}});return out;
}
const KO_NAME=n=>n===2?'Finale':n===4?'Halbfinale':n===8?'Viertelfinale':n===16?'Achtelfinale':n===32?'Sechzehntelfinale':`Runde der letzten ${n}`;
function resStr(m,uid){if(m.hg===null)return null;const home=m.h===uid;return {txt:resultText(m),win:m.win!==undefined&&m.win!==null?m.win===uid:(home?m.hg>m.ag:m.ag>m.hg),draw:(m.win===undefined||m.win===null)&&m.hg===m.ag}}
function calEvents(){
  const ev=[],u=S.user,uc=userClub(),uL=league(uc);
  const add=e=>ev.push(e);
  const summarize=(list,base)=>{const g={};list.forEach(x=>{(g[x.d]=g[x.d]||[]).push(x)});Object.entries(g).forEach(([d,xs])=>add({...base,d,n:xs.length,t:xs.map(x=>x.t).sort()[0],done:xs.every(x=>x.m&&x.m.hg!==null)}))};
  // Ligen
  for(const L of S.leagues){
    L.fixtures.forEach((md,r)=>{const w=L.rw[r],sl=leagueRoundSlots(L,r),mid=sl[0]&&sl[0].mid;
      md.forEach((m,k)=>{if(m.h===u||m.a===u)add({d:sl[k].d,t:sl[k].t,w,cat:'league',mine:true,comp:L.name,label:`${r+1}. Spieltag${mid?' (englische Woche)':''}`,m})});
      summarize(md.map((m,k)=>({d:sl[k].d,t:sl[k].t,m})),{w,cat:'league',mine:false,comp:L.name,assoc:L.assoc,label:`${r+1}. Spieltag${mid?' · englische Woche':''}`,own:L.id===uL.id})});
  }
  // Kontinentale Wettbewerbe (inkl. geplanter K.-o.-Runden)
  for(const C of S.comps||[]){if(C.bg)continue;const def=COMP[C.key],own=C.teams.includes(u);
    C.rounds.forEach(r=>{const sl=compRoundSlots(C,r);
      r.matches.forEach((m,k)=>{if(m.h===u||m.a===u)add({d:sl[k].d,t:sl[k].t,w:r.w,cat:'intl',mine:true,comp:def.name,short:def.short,label:r.label,m})});
      if(r.matches.length)summarize(r.matches.map((m,k)=>({d:sl[k].d,t:sl[k].t,m})),{w:r.w,cat:'intl',mine:false,comp:def.name,short:def.short,label:r.label,own})});
    const plan=C.plan||(C.stage!=='ko'?koPlan(def,16,compWeeks(def).koStart,!!def.playoff):null);
    if(plan){const from=C.plan?(C.koIdx||0)+1:0;plan.slice(from).forEach((pl,j)=>{const nm=C.plan||j>0||!def.playoff?KO_NAME(pl.size):'Playoffs';
      pl.weeks.forEach((w,l)=>{const r={w,label:pl.legs===2?`${nm} · ${l?'Rückspiel':'Hinspiel'}`:nm,matches:[],ko:1};const n=Math.max(1,pl.size/2);
        const sl=isFinal(r.label)?compRoundSlots(C,{...r,matches:[{}]}):compRoundSlots(C,{...r,matches:Array.from({length:n},()=>({}))});
        summarize(sl.map(x=>({d:x.d,t:x.t})),{w,cat:'intl',mine:false,plan:true,comp:def.name,short:def.short,label:r.label,own})})})}
  }
  // Nationale Pokale (inkl. geplanter Runden)
  for(const cup of S.ncups||[]){const own=cup.code===uc.assoc;
    cup.rounds.forEach(r=>{const sl=cupRoundSlots(cup,r,r.si||0,r.matches.length);
      r.matches.forEach((m,k)=>{if(m.h===u||m.a===u)add({d:sl[k].d,t:sl[k].t,w:r.w,cat:'cup',mine:true,comp:cup.name,label:r.label,m})});
      if(r.matches.length)summarize(r.matches.map((m,k)=>({d:sl[k].d,t:sl[k].t,m})),{w:r.w,cat:'cup',mine:false,comp:cup.name,assoc:cup.code,label:r.label,own})});
    if(!cup.winner){let used=cup.rounds.length,si=cup.stages.length;
      for(;si<cup.spec.length;si++){const sp=cup.spec[si];for(let l=0;l<sp.legs;l++){const w=cup.slots[used]!==undefined?cup.slots[used]:S.weeks-2;used++;
        const r={w,label:sp.legs===2?`${sp.name} · ${l?'Rückspiel':'Hinspiel'}`:sp.name};const sl=cupRoundSlots(cup,r,si,isFinal(r.label)?1:3);
        summarize(sl.map(x=>({d:x.d,t:x.t})),{w,cat:'cup',mine:false,plan:true,comp:cup.name,assoc:cup.code,label:r.label,own})}}}
  }
  // Supercups: immer samstags
  for(const sc of S.supercups||[])sc.rounds.forEach(r=>{const d=satOf(r.w),t='20:30';
    r.matches.forEach(m=>{if(m.h===u||m.a===u)add({d,t,w:r.w,cat:'sc',mine:true,comp:sc.name,label:r.label,m})});
    add({d,t,w:r.w,cat:'sc',mine:false,comp:sc.name,assoc:sc.code,label:r.label,n:r.matches.length,done:r.matches.every(x=>x.hg!==null),own:sc.code===uc.assoc})});
  // Termine
  const ws=winterStart(),we=ws+2;
  const T=(w,title,sub,icon)=>add({d:gameDate(w),w,cat:'date',mine:true,comp:title,label:sub,icon});
  T(0,'Saisonstart & Transferfenster öffnet','Sommerfenster bis Woche 4','🟢');
  T(3,'Deadline Day','Letzter Tag des Sommerfensters','⏰');
  T(ws,'Wintertransferfenster öffnet','Leihen bis zur Winterpause enden','🟢');
  T(we,'Deadline Day','Letzter Tag des Winterfensters','⏰');
  add({d:`${S.season+1}-06-30`,w:S.weeks,cat:'date',mine:true,comp:'Saisonende',label:'Verträge und Leihen laufen aus',icon:'🏁'});
  const exp=squadOf(uc).filter(p=>p.until<=S.season).length;if(exp)add({d:`${S.season+1}-06-30`,w:S.weeks,cat:'date',mine:true,comp:`${exp} Verträge laufen aus`,label:'deines Kaders – Verlängerung prüfen',icon:'✍️'});
  for(const p of squadOf(uc))if(p.loan&&p.loan.to===S.user&&p.loan.half)add({d:loanEndIso(p.loan),w:ws,cat:'date',mine:true,comp:`Leihende: ${fullname(p)}`,label:`zurück zu ${club(p.loan.from).name}`,icon:'🔁'});
  for(const x of S.pbids||[])if(x.kind!=='sell'){const p=S.players[x.pid];if(p)add({d:x.when,w:x.dec,cat:'date',mine:true,comp:`Antwort erwartet: ${fullname(p)}`,label:'auf dein Angebot',icon:'📨'})}
  for(const t of S.talks||[])if(t.st==='open'&&(t.seller===S.user||t.from===S.user)){const p=S.players[t.pid];if(p)add({d:gameDate(t.dec),w:t.dec,cat:'date',mine:true,comp:`Entscheidung: ${fullname(p)}`,label:t.kind==='clause'?'Ausstiegsklausel':t.kind==='loan'?'Leihe':'Wechsel',icon:'⚖️'})}
  return ev;
}
const CAL_COL={league:'var(--info)',intl:'#b48cff',cup:'var(--gold)',sc:'#ff9f6e',date:'var(--good)'};
function calChip(e,full){
  const u=S.user;
  if(e.m){const home=e.m.h===u,opp=club(home?e.m.a:e.m.h),r=resStr(e.m,u);
    return `<div class="cchip mine" style="border-color:${CAL_COL[e.cat]};--c:${CAL_COL[e.cat]}" title="${esc(e.comp+' · '+e.label)}"><i style="background:${CAL_COL[e.cat]}"></i>${full?`<b>${e.t?e.t+' · ':''}${esc(e.comp)}</b> · ${esc(e.label)}<br>`:(e.t?`<span class="ct">${e.t}</span> `:'')}${home?'':'@ '}${esc(full?opp.name:opp.short)}${r?` <b class="${r.win?'good':r.draw?'':'bad'}">${r.txt}</b>`:''}</div>`}
  if(e.cat==='date')return `<div class="cchip date" title="${esc(e.comp+' · '+e.label)}">${e.icon||''} ${esc(full?e.comp+' – '+e.label:e.comp)}</div>`;
  return `<div class="cchip ${e.plan?'plan':''}" style="border-color:${CAL_COL[e.cat]};--c:${CAL_COL[e.cat]}" title="${esc(e.comp+' · '+e.label)}"><i style="background:${CAL_COL[e.cat]}"></i>${full&&e.t?e.t+' · ':''}${esc(full?e.comp+' · '+e.label:(e.short||e.comp))}${full&&e.n?` <span class="muted">(${e.n} ${e.n===1?'Spiel':'Spiele'})</span>`:''}${e.plan?' <span class="muted">geplant</span>':''}</div>`;
}
function renderCalendar(){
  const today=gameDate(),C=UI.cal=UI.cal||{};if(!C.y){C.y=+today.slice(0,4);C.m=+today.slice(5,7)-1}
  const mode=C.mode||'mine',uc=userClub();
  let ev=calEvents().filter(e=>mode==='all'?true:mode==='country'?(e.mine||e.assoc===uc.assoc||e.own):e.mine);
  const mineKeys=new Set(ev.filter(e=>e.m).map(e=>e.d+'|'+e.comp));ev=ev.filter(e=>e.mine||!mineKeys.has(e.d+'|'+e.comp));
  const first=`${C.y}-${String(C.m+1).padStart(2,'0')}-01`,days=new Date(Date.UTC(C.y,C.m+1,0)).getUTCDate(),lead=wdayIso(first);
  const inMonth=ev.filter(e=>e.d.slice(0,7)===first.slice(0,7)).sort((a,b)=>a.d.localeCompare(b.d)||(b.m?1:0)-(a.m?1:0)||(a.t||'').localeCompare(b.t||''));
  const byDay={};for(const e of inMonth)(byDay[e.d]=byDay[e.d]||[]).push(e);
  let cells='';for(let i=0;i<lead;i++)cells+='<div class="cday empty"></div>';
  for(let dd=1;dd<=days;dd++){const iso=`${first.slice(0,8)}${String(dd).padStart(2,'0')}`,es=byDay[iso]||[],max=3;
    cells+=`<div class="cday ${iso===today?'today':''} ${iso<today?'past':''} ${C.sel===iso?'sel':''} ${es.some(e=>e.m)?'hasm':''}" data-act="calDay" data-v="${iso}"><span class="cn">${dd}</span>${es.slice(0,max).map(e=>calChip(e,false)).join('')}${es.length>max?`<div class="cmore">+${es.length-max} weitere</div>`:''}</div>`}
  const sel=C.sel&&byDay[C.sel]?C.sel:null;
  const fmtD=iso=>{const d=new Date(iso+'T00:00:00Z');return `${WDAYS[wdayIso(iso)]}, ${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()]}`};
  const agenda=(sel?byDay[sel]:inMonth).reduce((acc,e)=>{(acc[e.d]=acc[e.d]||[]).push(e);return acc},{});
  const agendaHtml=Object.entries(agenda).map(([d,es])=>`<div class="aday ${d===today?'today':''}"><div class="ad">${fmtD(d)}${d===today?' <span class="pill gold" style="font-size:10px">heute</span>':''}</div><div>${es.map(e=>calChip(e,true)).join('')}</div></div>`).join('')||'<p class="muted small">Keine Termine in diesem Monat.</p>';
  return `<div class="row" style="justify-content:space-between;align-items:center"><h2 style="margin:0">Kalender</h2>
    <div class="seg">${[['mine','Meine Termine'],['country','Mein Land'],['all','Alle Wettbewerbe']].map(([k,l])=>`<button class="${mode===k?'on':''}" data-act="calMode" data-v="${k}">${l}</button>`).join('')}</div></div>
   <div class="calhead"><button class="btn sm" data-act="calNav" data-v="-1">◀</button><h3>${MONTHS[C.m]} ${C.y}</h3><button class="btn sm" data-act="calNav" data-v="1">▶</button><button class="btn sm" data-act="calToday">Heute</button></div>
   <div class="clegend">${[['league','Liga'],['intl','International'],['cup','Pokal'],['sc','Supercup'],['date','Termine']].map(([k,l])=>`<span><i style="background:${CAL_COL[k]}"></i>${l}</span>`).join('')}<span class="muted">Anstoßzeiten nach Praxis der jeweiligen Liga und Wettbewerbe</span></div>
   <div class="cgrid">${WDAYS.map(d=>`<div class="cwd">${d}</div>`).join('')}${cells}</div>
   <div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${sel?fmtD(sel):'Alle Termine im '+MONTHS[C.m]}</h3>${sel?'<button class="btn sm" data-act="calDay" data-v="">Ganzer Monat</button>':''}</div><div style="margin-top:8px">${agendaHtml}</div></div>`;
}
Object.assign(ACT,{
  calNav:d=>{const C=UI.cal;C.m+=+d.v;if(C.m<0){C.m=11;C.y--}if(C.m>11){C.m=0;C.y++}C.sel=null;render()},
  calToday:()=>{const t=gameDate();UI.cal.y=+t.slice(0,4);UI.cal.m=+t.slice(5,7)-1;UI.cal.sel=t;render()},
  calMode:d=>{UI.cal.mode=d.v;render()},
  calDay:d=>{UI.cal.sel=d.v||null;render()}});
