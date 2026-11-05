/* =====================================================================
   Seitenlinie – Aufsichtsrat: Mitglieder mit Schwerpunkten, Saisonvorgaben,
   Vertrauen, Sitzungen im Gesprächsstil und – im Ernstfall – Entlassung
   ===================================================================== */
const BD_FOCUS={sport:{lbl:'Sport',ic:'⚽'},fin:{lbl:'Finanzen',ic:'💶'},youth:{lbl:'Nachwuchs',ic:'🌱'},fans:{lbl:'Fans & Image',ic:'📣'}};
const BD_MEET=[9,19,29];
function bpick(a){return a[Math.floor(Math.random()*a.length)]}
function boardOf(){
  const u=userClub();
  if(!S.board||S.board.cid!==u.id){
    const R=mkRng(hashStr('bd'+u.id+':'+S.seed)),pool=poolArr(ASSOC[u.assoc]?ASSOC[u.assoc].pool:'de'),nm=()=>pool.f[Math.floor(R()*pool.f.length)]+' '+pool.l[Math.floor(R()*pool.l.length)];
    const jobs=['Unternehmer','Bankdirektorin','Ex-Profi','Rechtsanwalt','Fanvertreter','Steuerberaterin','Bürgermeister a. D.','Mittelständler'];
    S.board={cid:u.id,trust:62,members:[{name:u.staff.pres.name,role:'Präsident (Vorsitz)',focus:'sport'},{name:nm(),role:jobs[Math.floor(R()*jobs.length)],focus:'fin'},{name:nm(),role:jobs[Math.floor(R()*jobs.length)],focus:'youth'},{name:nm(),role:'Fanvertreter',focus:'fans'}],goals:null,log:[],warn:0,promise:null,season:null};
  }
  if(S.board.season!==S.season)boardGoals();
  return S.board;
}
function boardGoals(){
  const B=S.board,u=userClub(),pres=u.staff.pres.trait,L=league(u),yp=squadOf(u).filter(p=>p.age<=21).length;
  const goals=[{k:'league',w:40,t:u.target.t,r:u.target.r}];
  goals.push(pres==='sparsam'?{k:'fin',w:20,t:'Gewinn erwirtschaften (Saisonsaldo positiv)',min:0}:{k:'fin',w:15,t:'Kein großes Minus (Saisonsaldo über −'+money(Math.round(u.wBudget*52*.08/1e5)*1e5)+')',min:-Math.round(u.wBudget*52*.08)});
  goals.push({k:'youth',w:15,t:`Junge Spieler einbauen: mindestens ${Math.max(12,yp*7)} Pflichtspiel-Einsätze für U21-Spieler`,n:Math.max(12,yp*7)});
  const cup=(S.ncups||[]).find(c=>c.code===u.assoc);if(cup)goals.push({k:'cup',w:10,t:`${cup.name}: mindestens ${L.tier===1?'Viertelfinale':'2. Runde'}`,need:L.tier===1?'Viertelfinale':'2. Runde'});
  goals.push(u.rep>=70?{k:'goals',w:15,t:`Attraktiver Fußball: mindestens ${Math.round(L.fixtures.length*1.7)} Ligatore`,n:Math.round(L.fixtures.length*1.7)}:{k:'att',w:15,t:'Zuschauerschnitt von mindestens 85 % Auslastung',n:.85});
  B.goals=goals;B.season=S.season;B.promise=null;
}
function goalState(g){
  const u=userClub(),row=tableOf(league(u)).find(r=>r.id===S.user)||{sp:0,tf:0},rank=rankOf(S.user),f=S.fin;
  switch(g.k){
    case 'league':return {ok:rank<=g.r,txt:`aktuell Platz ${rank}`,p:clamp(1-(rank-g.r)/6,0,1)};
    case 'fin':{const inc=f.tv+f.tickets+f.prize+(f.cups||0)+(f.spons||0),exp=f.wages+(f.bonus||0)+(f.staff||0),sal=inc+f.tOut-exp-f.tIn,share=Math.max(.15,S.week/S.weeks);return {ok:sal>=g.min*share,txt:`Saldo ${money(sal)}`,p:clamp(.5+(sal-g.min*share)/Math.max(1,u.wBudget*52*.1),0,1)}}
    case 'youth':{const n=squadOf(u).filter(p=>p.age<=21).reduce((t,p)=>t+(p.apps||0),0),exp=g.n*S.week/S.weeks;return {ok:n>=exp,txt:`${n} von ${g.n} Einsätzen`,p:clamp(n/Math.max(1,g.n),0,1)}}
    case 'cup':{const cup=(S.ncups||[]).find(c=>c.code===u.assoc);if(!cup)return {ok:true,txt:'–',p:1};const st=natCupStatus(cup,S.user)||'';const out=cup.out&&cup.out[S.user];
      const order=['1. Runde','2. Runde','Achtelfinale','Viertelfinale','Halbfinale','Finale'];const reached=out?order.indexOf(out):order.length;const need=order.indexOf(g.need);return {ok:reached>=need||cup.winner===S.user,txt:out?`ausgeschieden (${out})`:st,p:out?(reached>=need?1:.2):.7}}
    case 'goals':{const exp=g.n*row.sp/Math.max(1,league(u).fixtures.length);return {ok:row.tf>=exp,txt:`${row.tf} Tore nach ${row.sp} Spielen`,p:clamp(row.tf/Math.max(1,g.n),0,1)}}
    case 'att':{const a=(u.lastAtt||0)/u.stadium;return {ok:a>=g.n,txt:`zuletzt ${Math.round(a*100)} % Auslastung`,p:clamp(a/g.n,0,1)}}
  }
  return {ok:true,txt:'',p:1};
}
function trustLbl(v){return v>=75?['🟢','volles Vertrauen']:v>=55?['🟢','zufrieden']:v>=40?['🟡','beobachtet genau']:v>=25?['🟠','unruhig']:['🔴','Job in Gefahr']}

/* ---------- Woche ---------- */
function boardWeekly(res){
  if(!S||S.user===null||S.fired)return;const B=boardOf(),u=userClub(),pat=PRES[u.staff.pres.trait].patience;
  for(const it of res.userList||[]){const m=it.m,home=m.h===S.user,gf=home?m.hg:m.ag,ga=home?m.ag:m.hg;const opp=club(home?m.a:m.h);
    const exp=clamp((clubAvg(u)-clubAvg(opp))/12,-1,1);const r=gf>ga?1:gf===ga?0:-1;let dt=(r-exp*.6)*1.4/Math.sqrt(pat);if(dt<0)dt*=1-.25*ownerK('press');B.trust=clamp(B.trust+dt,0,100)}
  if(BD_MEET.includes(S.week)){boardMeeting();}
  if(S.week>=8){
    if(B.trust<25&&B.warn<1){B.warn=1;addNews('board','⚠️ Der Aufsichtsrat ist alarmiert',`Das Vertrauen ist auf ${Math.round(B.trust)} gefallen. ${esc(B.members[0].name)}: „Wir erwarten eine sofortige Reaktion. Die nächsten Spiele sind entscheidend.“`)}
    if(B.trust<12)return boardFire(`Das Vertrauen des Aufsichtsrats ist aufgebraucht (${Math.round(B.trust)}).`);
    if(B.trust>=35)B.warn=0;
  }
}
function boardEval(){const B=boardOf();let s=0,tot=0;for(const g of B.goals){const st=goalState(g);s+=g.w*(st.ok?1:st.p*.5);tot+=g.w}return s/tot}
function boardMeeting(){
  const B=boardOf(),u=userClub(),cr=crewOf(u),sc=boardEval(),nm=r=>cr[r]?cr[r].name:roleLbl(r)+' (vakant)',f=S.fin;
  const inc=f.tv+f.tickets+f.prize+(f.cups||0)+(f.spons||0),exp=f.wages+(f.bonus||0)+(f.staff||0),sal=inc+f.tOut-exp-f.tIn,rk=rankOf(S.user);
  const sdR=Math.round((rel()-55)/8),d0=Math.round((sc-.6)*25),d=d0+sdR;
  const L=[`Anwesend: Aufsichtsrat (${B.members.map(m=>esc(m.name)).join(', ')}), Vorstand (${VOR_ROLES.map(r=>esc(nm(r))).join(', ')}). Der Trainer ist nicht anwesend.`,
    `<b>Bericht des Vorstandsvorsitzenden</b> (${esc(nm('ceo'))}): Platz ${rk} – Saisonziel „${esc(u.target.t)}“ ${rk<=u.target.r?'wird aktuell erreicht':'wird aktuell verfehlt'}.`,
    `<b>Finanzbericht</b> (${esc(nm('cfo'))}): Saldo ${money(sal)}, Kontostand ${money(u.budget)}, Transferbudget ${money(u.tBudget)}.`,
    `<b>Sportbericht</b> (${esc(nm('dirq'))}): ${sdR>=2?'Er stellt sich klar hinter den Trainer.':sdR>=0?'Er sieht die Arbeit des Trainers grundsätzlich positiv.':sdR>=-2?'Er äußert Zweifel an einzelnen Entscheidungen des Trainers.':'Er kritisiert den Trainer deutlich – das Verhältnis gilt als belastet.'}`,
    `<b>Vorgaben</b>: ${B.goals.map(g=>{const st=goalState(g);return esc(g.t)+' '+(st.ok?'✓':'✗')}).join(' · ')} – Erfüllung ${Math.round(sc*100)} %.`];
  orgPersonnel(L);if(S.fired)return;
  if(sc<.4&&rnd()<.22&&cr.dirq){L.push(`<b>Beschluss</b>: Der Aufsichtsrat macht den Sportbereich verantwortlich und beruft ${esc(cr.dirq.name)} ab.`);vorReplace(u,'dirq','die sportliche Bilanz');if(S.fired)return}
  if(sc>=.75&&B.trust>=60&&rnd()<.3){const add=Math.round(u.tBudget*.15/1e5)*1e5+Math.round(1e6*u.econ/1e5)*1e5;u.tBudget+=add;L.push(`<b>Beschluss</b>: zusätzliches Transferbudget von ${money(add)} freigegeben.`)}
  B.trust=clamp(B.trust+d,0,100);
  L.push(`<b>Beschluss</b>: Vertrauen in den Trainer ${d>=0?'+':''}${d} → ${Math.round(B.trust)} (${trustLbl(B.trust)[1]}).`);
  B.prot=[{season:S.season,w:S.week,lines:L},...(B.prot||[])].slice(0,8);
  B.pending={w:S.week,score:sc,d};
  addNews('board','📅 Aufsichtsrat hat getagt',`Ohne dich – das Protokoll liegt unter „Mitarbeiter → Aufsichtsrat“. Vertrauen in den Trainer ${d>=0?'+':''}${d}. ${esc(nm('ceo'))} und ${esc(nm('dirq'))} bitten dich zum Gespräch.`);
}
function boardSeasonEnd(){
  if(!S.board||S.fired)return;const B=boardOf(),sc=boardEval(),u=userClub();
  if(B.promise){const ok=goalState(B.goals[0]).ok;B.trust=clamp(B.trust+(ok?8:-15),0,100);B.log.unshift({s:S.season,t:`Versprechen ${ok?'gehalten':'gebrochen'}: ${B.promise}`})}
  B.trust=clamp(B.trust+Math.round((sc-.6)*30),0,100);
  B.log.unshift({s:S.season,t:`Saisonbilanz ${Math.round(sc*100)} % der Vorgaben – Vertrauen ${Math.round(B.trust)}`});B.log=B.log.slice(0,12);
  if(B.trust<20)return boardFire(`Nach einer enttäuschenden Saison (${Math.round(sc*100)} % der Vorgaben erfüllt) zieht der Aufsichtsrat die Konsequenzen.`);
  addNews('board','Aufsichtsrat: Saisonbilanz',`${Math.round(sc*100)} % der Vorgaben erfüllt. Vertrauen: ${Math.round(B.trust)} – ${trustLbl(B.trust)[1]}.`);
}

/* ---------- Entlassung & neuer Job ---------- */
function boardFire(why){
  const u=userClub();S.fired={why,season:S.season,week:S.week,club:u.name,offers:jobOffers()};
  addNews('board','❌ Du wurdest entlassen',`${esc(why)} ${esc(u.staff.pres.name)} bedankt sich für deine Arbeit.`);
  UI.view='fired';
}
function jobOffers(){
  const u=userClub();
  return S.clubs.filter(c=>!c.guest&&c.id!==S.user&&league(c)&&c.rep<=u.rep-3&&c.rep>=u.rep-30).sort(()=>rnd()-.5).slice(0,4).map(c=>c.id);
}
function takeJob(cid){
  const old=userClub(),nc=club(cid);
  // alter Verein bekommt einen KI-Trainer
  const pool=poolArr(ASSOC[old.assoc].pool),tr=pick(Object.keys(COACH));old.staff.coach={name:pick(pool.f)+' '+pick(pool.l),trait:tr};old.tactic={...COACH[tr].t};autoLineup(old);
  const prev=nc.staff.coach;S.user=cid;nc.staff.coach={name:S.manager,trait:null};nc.autoXI=true;squadOf(nc).forEach(materializeContract);ensureTactic(nc);autoLineup(nc);
  S.fin={tv:0,tickets:0,wages:0,tIn:0,tOut:0,prize:0,cups:0,bonus:0,bon:{},log:[]};S.offers=[];S.deals={};S.vr={};S.ldeals={};S.bidRes={};S.reports=[];S.known={};S.crewEv=[];S.ureps=[];S.wish=[];S.sdprop=[];S.needs=[];S.taskReq=[];S.orgReq=[];S.relReq=[];
  S.board=null;S.fired=null;resetCache();boardOf();orgOf(nc).rel=60;
  addNews('board',`Neuer Job: ${nc.name}`,`Du übernimmst ${esc(nc.name)} (${esc(league(nc).name)}) als Nachfolger von ${esc(prev.name)}. Der Vorstand erwartet: <b>${nc.target.t}</b>.`);
  UI.view='home';UI.live=null;save();render();
}
function renderFired(){
  const F=S.fired;if(!F)return renderHome();
  const offers=F.offers.map(id=>{const c=club(id);return `<div class="card crewc"><div class="row" style="gap:10px">${badge(c,36)}<div><div class="cname">${esc(c.name)}</div><div class="small muted">${esc(league(c).name)} · Ziel: ${c.target.t} · Ruf ${c.rep}</div></div></div><button class="btn pri" data-act="takeJob" data-v="${id}" style="margin-top:8px">Angebot annehmen</button></div>`}).join('');
  return `<h2>Entlassen</h2><div class="card"><p><b>${esc(F.club)}</b> hat sich von dir getrennt. ${esc(F.why)}</p><p class="small muted">Im Fußball geht es schnell weiter – diese Vereine suchen einen neuen Trainer:</p></div>
   <div class="crewgrid" style="margin-top:12px">${offers||'<div class="card">Aktuell gibt es keine Angebote.</div>'}</div>
   <div class="row" style="margin-top:12px"><button class="btn" data-act="newCareer">Neue Karriere starten</button></div>`;
}

/* ---------- Sitzung (Gespräch) ---------- */
const BD_RESP=[['calm','„Wir sind auf dem richtigen Weg"','Ruhig den Plan erklären'],['budget','„Ich brauche mehr Mittel"','Mehr Transferbudget fordern'],['promise','„Ich verspreche Ihnen das Saisonziel"','Vertrauen jetzt – aber am Saisonende wird abgerechnet'],['self','„Ich nehme die Kritik an"','Selbstkritisch zeigen'],['push','„Lassen Sie mich in Ruhe arbeiten"','Klare Kante – riskant']];
function bdOpen(){
  const B=boardOf();UI.ct={role:'_board',msgs:[],pend:[]};const P=B.pending,cr=crewOf(userClub()),ceo=cr.ceo?cr.ceo.name:'Der Vorstand',sd=sdName(),cfo=cr.cfo?cr.cfo.name:ceo;
  ctSay('sys',`Büro des Vorstands · nach der Sitzung des Aufsichtsrats`);
  ctSay('them',`*${ceo}* Danke, dass Sie da sind, Trainer. Der Aufsichtsrat hat getagt – wir möchten Ihnen sagen, wie es gelaufen ist.`);
  for(const g of B.goals){const st=goalState(g),who=g.k==='fin'?cfo:g.k==='att'?ceo:sd;
    ctSay('them',`*${who}* ${st.ok?bpick(['Beim Thema','Was','Zu'])+' „'+g.t+'“: '+st.txt+'. Das gefällt mir.':bpick(['Sorgen macht mir','Nicht zufrieden bin ich mit'])+' „'+g.t+'“ – '+st.txt+'. Da muss mehr kommen.'}`)}
  if(P)ctSay('them',`*${sd}* ${rel()>=65?'Ich habe mich im Aufsichtsrat klar für Sie ausgesprochen.':rel()>=45?'Ich habe dem Aufsichtsrat ehrlich berichtet – mit Licht und Schatten.':'Ich will offen sein: Ich habe im Aufsichtsrat meine Zweifel geäußert.'}`);
  ctSay('them',`*${ceo}* ${P&&P.score>=.7?'Unterm Strich: gute Arbeit. Machen Sie so weiter.':P&&P.score>=.5?'Insgesamt ordentlich, aber nicht mehr.':'Ehrlich gesagt sind wir besorgt. Was sagen Sie dazu?'}`);
  UI.modal=bdModal();render();
}
function bdModal(){return ()=>{
  const B=boardOf(),C=UI.ct;setTimeout(ctPump,0);const busy=C.pend.length>0,[ti,tl]=trustLbl(B.trust);
  return `<div class="vrc"><div class="vrhead"><div><h2 style="margin:0">Gespräch mit dem Vorstand</h2><div class="small muted">${VOR_ROLES.filter(r=>crewOf(userClub())[r]&&r!=='mkt').map(r=>esc(crewOf(userClub())[r].name)+' ('+roleLbl(r)+')').join(' · ')}</div></div></div>
   <div class="vrgrid"><div>${vrLog(C.msgs,null,crewOf(userClub()).ceo?crewOf(userClub()).ceo.name:'Vorstand',busy?'Vorstand':null)}</div><div class="card vrpanel ${busy?'busy':''}">${meter('Vertrauen in dich',B.trust)}<div class="small muted" style="margin:4px 0 10px">${ti} ${tl}</div>
    ${B.pending?`<label class="f">Deine Antwort</label><div class="vrargs col">${BD_RESP.map(([k,l,d])=>`<button data-act="bdResp" data-v="${k}" title="${esc(d)}">${l}<br><small class="muted" style="font-weight:400">${d}</small></button>`).join('')}</div>`:'<p class="small muted">Das Gespräch ist beendet.</p>'}
   </div></div><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-act="ctClose">Gespräch beenden</button></div></div>`;
}}
function bdResp(k){
  const B=boardOf(),u=userClub(),P=B.pending;if(!P)return;const pres=crewOf(u).ceo?crewOf(u).ceo.name:B.members[0].name,good=P.score>=.6;
  const say=t=>ctSay('them',`*${pres}* ${t}`);
  switch(k){
    case 'calm':ctSay('me','Wir sind auf dem richtigen Weg. Die Mannschaft entwickelt sich, die Ergebnisse werden kommen.');if(good||B.trust>=50){B.trust+=3;say('Gut. Wir vertrauen Ihnen.')}else{B.trust-=2;say('Schöne Worte. Wir wollen Taten sehen.')}break;
    case 'budget':ctSay('me','Wenn wir die Ziele erreichen sollen, brauche ich mehr Mittel für Transfers.');
      if(B.trust>=65&&good){const add=Math.round(u.tBudget*.25/1e5)*1e5+Math.round(2e6*u.econ/1e5)*1e5;u.tBudget+=add;say(`*schaut zu ${crewOf(u).cfo?crewOf(u).cfo.name:'dem Finanzvorstand'}* … Der Aufsichtsrat hat uns Spielraum gegeben. Einverstanden. Wir geben ${spM(add)} zusätzlich frei. Enttäuschen Sie uns nicht.`)}
      else{B.trust-=5;say(B.trust<45?'Mehr Geld? Erst müssen die Ergebnisse stimmen.':'Das Budget ist ausgeschöpft. Arbeiten Sie mit dem, was Sie haben.')}break;
    case 'promise':ctSay('me',`Ich verspreche Ihnen: Wir erreichen das Saisonziel – ${u.target.t}.`);if(B.promise){say('Das haben Sie uns schon versprochen.');break}B.promise=u.target.t;B.trust+=7;say('Wir nehmen Sie beim Wort. Am Saisonende rechnen wir ab.');break;
    case 'self':ctSay('me','Die Kritik ist berechtigt. Ich nehme sie an und arbeite an den Punkten.');B.trust+=good?1:4;say('Das ehrt Sie. Wir sind gespannt.');break;
    case 'push':ctSay('me','Bei allem Respekt: Lassen Sie mich in Ruhe arbeiten. Ich weiß, was ich tue.');if(good&&B.trust>=60){B.trust+=4;say('*nickt* Selbstbewusst – das gefällt uns, solange die Ergebnisse stimmen.')}else{B.trust-=9;say('*kühl* Diesen Ton verbitten wir uns. Das geht so auch an den Aufsichtsrat.')}break;
  }
  B.trust=clamp(B.trust,0,100);B.log.unshift({s:S.season,t:`Sitzung Woche ${P.w}: ${BD_RESP.find(x=>x[0]===k)[1]} → Vertrauen ${Math.round(B.trust)}`});B.log=B.log.slice(0,12);B.pending=null;
}
function boardPanel(){
  const B=boardOf(),[ti,tl]=trustLbl(B.trust),next=BD_MEET.find(w=>w>S.week);
  const goals=B.goals.map(g=>{const st=goalState(g);return `<div class="crow"><span>${esc(g.t)}<small>${esc(st.txt)} · Gewicht ${g.w} %</small></span><b class="${st.ok?'good':'bad'}">${st.ok?'✓ auf Kurs':'✗ verfehlt'}</b></div>`}).join('');
  return `<div class="card" style="grid-column:1/-1">${B.pending?`<div class="news t-offer" style="margin-bottom:10px">📅 Der Aufsichtsrat hat getagt – der Vorstand bittet dich zum Gespräch. <button class="btn sm pri" data-act="bdOpen">Zum Gespräch</button></div>`:''}
    ${meter('Vertrauen in den Trainer',B.trust)}<div class="small" style="margin:4px 0 10px">${ti} ${tl}${B.promise?` · Versprochen: <b>${esc(B.promise)}</b>`:''} · nächste Sitzung: ${next?'Woche '+(next+1):'Saisonende'}</div>
    <p class="small muted">Der Aufsichtsrat kontrolliert den Verein und bestellt den Vorstand. Der Vorstand führt die Geschäfte und berichtet ihm – du bist bei den Sitzungen nicht dabei.</p>
    <h3>Aufsichtsrat</h3><div class="crewgrid">${B.members.map(m=>`<div class="card crewc board"><div class="crole">${BD_FOCUS[m.focus].ic} ${BD_FOCUS[m.focus].lbl}</div><div class="cname">${esc(m.name)}</div><div class="small muted">${esc(m.role)}</div></div>`).join('')}</div>
    <h3 style="margin-top:14px">Vom Aufsichtsrat bestellter Vorstand</h3><div class="clist">${VOR_ROLES.map(r=>{const m=crewOf(userClub())[r];return `<div class="crow"><span><b>${m?esc(m.name):'vakant'}</b><small>${roleLbl(r)}${m?' · seit '+seasonLbl(m.since)+' · Vertrag bis '+contractEnd({club:1,until:m.until}):''}</small></span><span class="stars">${m?stars(m.q):''}</span></div>`}).join('')}</div>
    ${(B.prot||[]).length?`<h3 style="margin-top:14px">Sitzungsprotokolle</h3>${B.prot.slice(0,UI.protAll?8:1).map(P=>`<div class="card protocol"><div class="small muted">Sitzung ${seasonLbl(P.season)} · Woche ${P.w}</div>${P.lines.map(l=>`<div class="small" style="margin-top:4px">${l}</div>`).join('')}</div>`).join('')}${B.prot.length>1?`<button class="btn sm" data-act="protAll" style="margin-top:6px">${UI.protAll?'Nur letztes Protokoll':'Alle Protokolle'}</button>`:''}`:''}
    <h3 style="margin-top:14px">Vorgaben für ${seasonLbl(S.season)}</h3><div class="clist">${goals}</div>
    ${B.log.length?`<h3 style="margin-top:14px">Protokoll</h3>${B.log.slice(0,6).map(l=>`<div class="small muted">${seasonLbl(l.s)} · ${esc(l.t)}</div>`).join('')}`:''}
    <p class="small muted" style="margin-top:10px">Siege gegen stärkere Gegner bringen mehr Vertrauen, Niederlagen gegen schwächere kosten mehr. Fällt das Vertrauen zu tief, wirst du entlassen.</p></div>`;
}
Object.assign(ACT,{
  bdOpen:()=>bdOpen(),
  protAll:()=>{UI.protAll=!UI.protAll;render()},
  bdResp:d=>{bdResp(d.v);render();setTimeout(()=>{const e=document.getElementById('vrlog');if(e)e.scrollTop=e.scrollHeight},0)},
  takeJob:d=>takeJob(+d.v)
});
