/* =====================================================================
   Seitenlinie – Kalender: alle Termine aller Wettbewerbe im Monatsblick
   ===================================================================== */
const MONTHS=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const WDAYS=['Mo','Di','Mi','Do','Fr','Sa','So'];
function isoAdd(iso,n){return addDaysIso(iso,n)}
function wdayIso(iso){const d=new Date(iso+'T00:00:00Z').getUTCDay();return (d+6)%7} // 0 = Montag
// Spieltermin einer Spielwoche: Liga am Samstag, Europapokal Di/Mi/Do, Pokal Mittwoch, Supercup Freitag
function matchDay(w,kind){
  let d=gameDate(w);while(wdayIso(d)!==5)d=isoAdd(d,1);
  return kind==='l1'?isoAdd(d,-4):kind==='l2'?isoAdd(d,-2):kind==='l3'?isoAdd(d,-2):kind==='cup'?isoAdd(d,-3):kind==='sc'?isoAdd(d,-1):kind==='cont'?isoAdd(d,-3):d;
}
const KO_NAME=n=>n===2?'Finale':n===4?'Halbfinale':n===8?'Viertelfinale':n===16?'Achtelfinale':n===32?'Sechzehntelfinale':`Runde der letzten ${n}`;
function resStr(m,uid){if(m.hg===null)return null;const home=m.h===uid;return {txt:resultText(m),win:m.win!==undefined&&m.win!==null?m.win===uid:(home?m.hg>m.ag:m.ag>m.hg),draw:(m.win===undefined||m.win===null)&&m.hg===m.ag}}
function calEvents(){
  const ev=[],u=S.user,uc=userClub(),uL=league(uc);
  const add=(e)=>ev.push(e);
  // Ligen
  for(const L of S.leagues){
    const mine=L.id===uL.id;
    L.fixtures.forEach((md,r)=>{const w=L.rw[r],d=matchDay(w,'l');const m=md.find(x=>x.h===u||x.a===u);
      if(m)add({d,w,cat:'league',mine:true,comp:L.name,label:`${r+1}. Spieltag`,m});
      add({d,w,cat:'league',mine:false,comp:L.name,assoc:L.assoc,label:`${r+1}. Spieltag`,n:md.length,done:md.every(x=>x.hg!==null),own:mine})});
  }
  // Kontinentale Wettbewerbe (inkl. geplanter K.-o.-Runden)
  for(const C of S.comps||[]){if(C.bg)continue;const def=COMP[C.key],kind=def.confed==='UEFA'?'l'+def.level:'cont';
    C.rounds.forEach(r=>{const d=matchDay(r.w,kind),m=r.matches.find(x=>x.h===u||x.a===u);
      if(m)add({d,w:r.w,cat:'intl',mine:true,comp:def.name,short:def.short,label:r.label,m});
      add({d,w:r.w,cat:'intl',mine:false,comp:def.name,short:def.short,label:r.label,n:r.matches.length,done:r.matches.every(x=>x.hg!==null),own:C.teams.includes(u)})});
    const plan=C.plan||(C.stage!=='ko'?koPlan(def,def.fmt==='swiss'?16:16,compWeeks(def).koStart,!!def.playoff):null);
    if(plan){const from=C.plan?(C.koIdx||0)+1:0;plan.slice(from).forEach((pl,j)=>{const nm=C.plan||j>0||!def.playoff?KO_NAME(pl.size):'Playoffs';
      pl.weeks.forEach((w,l)=>add({d:matchDay(w,kind),w,cat:'intl',mine:false,plan:true,comp:def.name,short:def.short,label:pl.legs===2?`${nm} · ${l?'Rückspiel':'Hinspiel'}`:nm,own:C.teams.includes(u)}))})}
  }
  // Nationale Pokale (inkl. geplanter Runden)
  for(const cup of S.ncups||[]){
    cup.rounds.forEach(r=>{const d=matchDay(r.w,'cup'),m=r.matches.find(x=>x.h===u||x.a===u);
      if(m)add({d,w:r.w,cat:'cup',mine:true,comp:cup.name,label:r.label,m});
      add({d,w:r.w,cat:'cup',mine:false,comp:cup.name,assoc:cup.code,label:r.label,n:r.matches.length,done:r.done,own:cup.code===uc.assoc})});
    if(!cup.winner){let used=cup.rounds.length,si=cup.stages.length;
      for(;si<cup.spec.length;si++){const sp=cup.spec[si];for(let l=0;l<sp.legs;l++){const w=cup.slots[used]!==undefined?cup.slots[used]:S.weeks-2;used++;
        add({d:matchDay(w,'cup'),w,cat:'cup',mine:false,plan:true,comp:cup.name,assoc:cup.code,label:sp.legs===2?`${sp.name} · ${l?'Rückspiel':'Hinspiel'}`:sp.name,own:cup.code===uc.assoc})}}}
  }
  // Supercups
  for(const sc of S.supercups||[])sc.rounds.forEach(r=>{const d=matchDay(r.w,'sc'),m=r.matches.find(x=>x.h===u||x.a===u);
    if(m)add({d,w:r.w,cat:'sc',mine:true,comp:sc.name,label:r.label,m});
    add({d,w:r.w,cat:'sc',mine:false,comp:sc.name,assoc:sc.code,label:r.label,n:r.matches.length,done:r.matches.every(x=>x.hg!==null),own:sc.code===uc.assoc})});
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
    return `<div class="cchip mine" style="border-color:${CAL_COL[e.cat]};--c:${CAL_COL[e.cat]}" title="${esc(e.comp+' · '+e.label)}"><i style="background:${CAL_COL[e.cat]}"></i>${full?`<b>${esc(e.comp)}</b> · ${esc(e.label)}<br>`:''}${home?'':'@ '}${esc(full?opp.name:opp.short)}${r?` <b class="${r.win?'good':r.draw?'':'bad'}">${r.txt}</b>`:''}</div>`}
  if(e.cat==='date')return `<div class="cchip date" title="${esc(e.comp+' · '+e.label)}">${e.icon||''} ${esc(full?e.comp+' – '+e.label:e.comp)}</div>`;
  return `<div class="cchip ${e.plan?'plan':''}" style="border-color:${CAL_COL[e.cat]};--c:${CAL_COL[e.cat]}" title="${esc(e.comp+' · '+e.label)}"><i style="background:${CAL_COL[e.cat]}"></i>${esc(full?e.comp+' · '+e.label:(e.short||e.comp))}${full&&e.n?` <span class="muted">(${e.n} Spiele)</span>`:''}${e.plan?' <span class="muted">geplant</span>':''}</div>`;
}
function renderCalendar(){
  const today=gameDate(),C=UI.cal=UI.cal||{};if(!C.y){C.y=+today.slice(0,4);C.m=+today.slice(5,7)-1}
  const mode=C.mode||'mine',uc=userClub();
  let ev=calEvents().filter(e=>mode==='all'?true:mode==='country'?(e.mine||e.assoc===uc.assoc||e.own):e.mine);
  const mineKeys=new Set(ev.filter(e=>e.m).map(e=>e.d+'|'+e.comp));ev=ev.filter(e=>e.mine||!mineKeys.has(e.d+'|'+e.comp));
  const first=`${C.y}-${String(C.m+1).padStart(2,'0')}-01`,days=new Date(Date.UTC(C.y,C.m+1,0)).getUTCDate(),lead=wdayIso(first);
  const inMonth=ev.filter(e=>e.d.slice(0,7)===first.slice(0,7)).sort((a,b)=>a.d.localeCompare(b.d)||(b.m?1:0)-(a.m?1:0));
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
   <div class="clegend">${[['league','Liga'],['intl','International'],['cup','Pokal'],['sc','Supercup'],['date','Termine']].map(([k,l])=>`<span><i style="background:${CAL_COL[k]}"></i>${l}</span>`).join('')}<span class="muted">Spieltage: Liga samstags, Europapokal Di/Do, Pokal mittwochs</span></div>
   <div class="cgrid">${WDAYS.map(d=>`<div class="cwd">${d}</div>`).join('')}${cells}</div>
   <div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${sel?fmtD(sel):'Alle Termine im '+MONTHS[C.m]}</h3>${sel?'<button class="btn sm" data-act="calDay" data-v="">Ganzer Monat</button>':''}</div><div style="margin-top:8px">${agendaHtml}</div></div>`;
}
Object.assign(ACT,{
  calNav:d=>{const C=UI.cal;C.m+=+d.v;if(C.m<0){C.m=11;C.y--}if(C.m>11){C.m=0;C.y++}C.sel=null;render()},
  calToday:()=>{const t=gameDate();UI.cal.y=+t.slice(0,4);UI.cal.m=+t.slice(5,7)-1;UI.cal.sel=t;render()},
  calMode:d=>{UI.cal.mode=d.v;render()},
  calDay:d=>{UI.cal.sel=d.v||null;render()}});
