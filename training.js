/* =====================================================================
   Seitenlinie – Training: Mikrozyklus rund um den Spieltag (MD+1 … MD-1),
   Einheiten mit Belastung, Trainerteam, Eingespieltheit, Gegner-
   vorbereitung, Standards, individuelle Förderung, Positionsumschulung,
   Trainingsverletzungen und ein Wochenbericht.
   ===================================================================== */
const TU={
  rest:{l:'Frei',ic:'🛋️',g:'rec',int:0,fit:3,mor:1.2,d:'Kompletter Ruhetag – Kopf frei bekommen.'},
  regen:{l:'Regeneration',ic:'🧊',g:'rec',int:1,fit:4,st:'phys',d:'Auslaufen, Eisbad, Physiotherapie. Pflicht nach dem Spiel.'},
  kraft:{l:'Kraft & Athletik',ic:'🏋️',g:'phys',int:6,a:['str','nat','jum','bal'],st:'fit',d:'Kraftraum und Stabilisation. Beugt Verletzungen langfristig vor.'},
  ausd:{l:'Ausdauer & Intervalle',ic:'🫁',g:'phys',int:7,a:['sta','wor','nat'],st:'fit',d:'Hohe Belastung – macht fit für 90 Minuten Pressing.'},
  speed:{l:'Schnelligkeit',ic:'⚡',g:'phys',int:6,a:['pac','acc','agi'],st:'fit',d:'Sprints, Reaktion, Antritt. Wirkt vor allem bei jungen Spielern.'},
  tech:{l:'Technik & Passspiel',ic:'🎯',g:'tech',int:3,a:['fir','tec','pas','dri'],st:'ast',d:'Rondos, Passformen, Ballannahme unter Druck.'},
  fin:{l:'Torabschluss',ic:'🥅',g:'tech',int:3,a:['fin','lon','cmp','otb'],st:'ast',d:'Abschlüsse aus allen Lagen, Laufwege im Strafraum.'},
  def:{l:'Taktik Defensive',ic:'🧱',g:'tac',int:5,a:['pos','mar','tck','cnt','ant'],st:'ast',fam:2.4,d:'Pressing-Auslöser, Verschieben, Kettenarbeit.'},
  off:{l:'Taktik Offensive',ic:'🧭',g:'tac',int:4,a:['pas','vis','otb','dec','tea'],st:'ast',fam:2.4,d:'Spielaufbau, Positionsspiel, eingeübte Angriffsmuster.'},
  std:{l:'Standardsituationen',ic:'🚩',g:'tech',int:2,a:['cor','fre','hea','pen'],st:'ast',sp:1,d:'Ecken, Freistöße, Elfmeter – offensiv wie defensiv.'},
  game:{l:'Trainingsspiel',ic:'⚔️',g:'tac',int:6,a:['dec','tea','wor','cmp'],st:'ast',fam:1.6,mor:.6,d:'11 gegen 11 – Wettkampfhärte, Ersatzspieler können sich zeigen.'},
  prep:{l:'Gegnervorbereitung',ic:'📼',g:'tac',int:2,st:'ana',prep:1,d:'Videoanalyse und Matchplan für den nächsten Gegner.'},
  mental:{l:'Mentales & Teambuilding',ic:'🧠',g:'ment',int:1,a:['tea','ldr','cmp','det'],st:'psy',mor:2,d:'Teamabend, Mentaltraining, Gespräche.'}};
const TG={rec:['Erholung','#3a9d6a'],phys:['Athletik','#d35400'],tech:['Technik','#2e6fbf'],tac:['Taktik','#7b4bc4'],ment:['Mental','#b8860b']};
const TDAYS=['MD+1','MD+2','MD-4','MD-3','MD-2','MD-1'],TOFF=[1,2,3,4,5,6];   // Tage nach dem letzten Spiel bis zum nächsten
const TTPL={
  std:{l:'Normale Ligawoche',p:[['regen','rest'],['rest','rest'],['kraft','tech'],['def','off'],['game','std'],['prep','rest']]},
  heavy:{l:'Intensivwoche',p:[['regen','kraft'],['ausd','tech'],['speed','def'],['off','game'],['fin','std'],['prep','rest']]},
  light:{l:'Belastung steuern',p:[['regen','rest'],['rest','mental'],['tech','rest'],['def','rest'],['off','std'],['prep','rest']]},
  tac:{l:'Taktik-Schwerpunkt',p:[['regen','rest'],['rest','tech'],['def','kraft'],['off','def'],['game','std'],['prep','rest']]},
  pre:{l:'Saisonvorbereitung',p:[['ausd','kraft'],['speed','tech'],['ausd','def'],['off','game'],['kraft','fin'],['game','mental']]}};
const IND={'':'Kein Schwerpunkt',fin:'Abschluss',hea:'Kopfball',pas:'Passspiel',tck:'Zweikampf',pac:'Schnelligkeit',sta:'Ausdauer',str:'Kraft',dec:'Spielintelligenz',ldr:'Führung',cro:'Flanken',fre:'Freistöße',gk:'Torwartspiel'};
const IND_A={fin:['fin','cmp','otb'],hea:['hea','jum','bra'],pas:['pas','vis','fir'],tck:['tck','mar','agg'],pac:['pac','acc'],sta:['sta','nat','wor'],str:['str','bal'],dec:['dec','ant','pos'],ldr:['ldr','tea','cmp'],cro:['cro','tec'],fre:['fre','cor','pen'],gk:['ref','han','ovo','cmd']};
const INT={low:['Schonen',.55],norm:['Normal',1],high:['Hoch',1.3]};

function trainOf(){S.train=S.train||{plan:TTPL.std.p.map(d=>d.slice()),tpl:'std',fam:{},ind:{},rep:null,wk:0,hist:[]};return S.train}
function famOf(c){if(c.id!==S.user)return 60;const T=trainOf();ensureTactic(c);const f=c.tactic.f;if(T.fam[f]===undefined)T.fam[f]=Object.keys(T.fam).length?45:62;return T.fam[f]}
function trainMul(c){if(!S||c.guest)return 1;if(c.id!==S.user)return 1.004;const T=trainOf(),cur=T.cur||{};return 1+(famOf(c)-60)/1500+(cur.prep||0)*.012*(1+.5*crewK(c,'ana'))+(cur.sp||0)*.004}
function staffK(c,st){return st?crewK(c,st):0}
function weekUnits(){
  const T=trainOf(),ng=nextUserGames(),two=ng.length>1&&ng[1].w===ng[0].w,free=!ng.length||ng[0].w>S.week;
  let days=T.plan.map((d,i)=>({i,u:d}));
  if(two)days=days.filter(x=>x.i===0||x.i===5);           // Englische Woche: nur Regeneration + Abschlusstraining
  return {days,two,free,units:days.flatMap(x=>x.u.filter(Boolean))};
}
function planLoad(units){return units.reduce((t,k)=>t+(TU[k]?TU[k].int:0),0)}
function planMix(units){const m={rec:0,phys:0,tech:0,tac:0,ment:0};for(const k of units)if(TU[k])m[TU[k].g]+=Math.max(1,TU[k].int);const s=Object.values(m).reduce((a,b)=>a+b,0)||1;for(const k in m)m[k]=m[k]/s;return m}
function devBase(p){const g=Math.max(0,p.pot-ovr(p));return p.age<=21?.016+g*.0055:p.age<=24?.013+g*.004:p.age<=29?.008:.005}
function addProg(p,k,v,gains){
  if(v<=0)return;p.tp=p.tp||{};p.tp[k]=(p.tp[k]||0)+v;
  if(p.tp[k]>=1){p.tp[k]-=1;const i=AIDX[k],cur=p.at.charCodeAt(i)-64;if(cur>=20)return;
    if(ovr(p)>=p.pot&&ATTR_GROUP[k]!=='ment')return;
    const a=decodeAt(p);a[i]=cur+1;p.at=encodeAt(a);CACHE.rate.delete(p);CACHE.ovr.delete(p);gains.push({pid:p.id,k,v:cur+1})}
}

/* ---------- Die Trainingswoche ---------- */
function trainWeek(){
  if(!S||S.user===null||S.fired)return;const u=userClub(),T=trainOf(),W=weekUnits(),units=W.units,load=planLoad(units)+(W.two?6:0),mix=planMix(units);
  const rep={s:S.season,w:S.week,units,load,two:W.two,gains:[],inj:[],top:[],flop:[],fam0:famOf(u),mor:0,fit:0};
  T.cur={prep:units.includes('prep')?1:0,sp:units.filter(k=>k==='std').length};
  // Eingespieltheit der aktuellen Formation
  const f=u.tactic.f;let famG=units.reduce((t,k)=>t+(TU[k].fam||0),0)*(1+.4*crewK(u,'ast'));T.fam[f]=clamp(famOf(u)+famG-3.2,10,100);
  for(const k in T.fam)if(k!==f)T.fam[k]=clamp(T.fam[k]-1,10,100);
  rep.fam1=T.fam[f];
  const recU=units.filter(k=>TU[k].g==='rec').length,restU=units.filter(k=>k==='rest').length,morU=units.reduce((t,k)=>t+(TU[k].mor||0),0);
  const sq=squadOf(u).filter(p=>p.club===S.user);let fsum=0,msum=0;
  for(const p of sq){
    const I=T.ind[p.id]||{},im=INT[I.i||'norm'][1];
    if(p.inj>0){addProg(p,'nat',0,rep.gains);continue}
    const pl=load*im+(I.f?3:0);
    // Fitness & Moral
    const fd=clamp(recU*.8+restU*.2-(pl-24)*.6,-9,7);p.fit=clamp(p.fit+fd,35,100);fsum+=fd;
    const md=(restU*.35+morU*.5-Math.max(0,pl-34)*.12-1.5)*.15+(I.i==='low'&&ROLE_ORDER.indexOf(p.role)>=2?-.3:0);p.mor=clamp(p.mor+md,15,100);msum+=md;
    // Trainingsverletzung
    const ir=Math.max(0,pl-18)*.00045*(at(p,'inp')/10)*(p.fit<72?1.6:1)*(1-.25*crewK(u,'phys'))*(1-.15*crewK(u,'fit'));
    if(rnd()<ir){p.inj=crewInjDur(u,ri(1,3));rep.inj.push({pid:p.id,w:p.inj});continue}
    // Entwicklung
    const base=devBase(p)*im*(.85+at(p,'prf')/40)*(p.age<=21?1+.2*crewK(u,'u19'):1);
    for(const k of units){const U=TU[k];if(!U.a)continue;const sk=1+.3*staffK(u,U.st);
      if(p.pos==='TW'){if(U.g==='tech'||U.g==='tac'){const ga=['ref','han','ovo','cmd','kic','aer','rus','com'];const q=base*(1+.35*crewK(u,'gk'))/2;addProg(p,ga[Math.floor(rnd()*ga.length)],q,rep.gains);addProg(p,ga[Math.floor(rnd()*ga.length)],q,rep.gains)}else for(const a of U.a)addProg(p,a,base*sk/U.a.length,rep.gains);continue}
      const key=U.a.filter(x=>WEIGHTS[p.pos][x]),pool=key.length?key:U.a;addProg(p,pool[Math.floor(rnd()*pool.length)],base*sk,rep.gains)}
    if(I.f){const A=I.f==='gk'?IND_A.gk:IND_A[I.f];if(A&&(I.f!=='gk'||p.pos==='TW'))for(const a of A)addProg(p,a,base*1.6/A.length*(1+.2*crewK(u,p.pos==='TW'?'gk':'ast')),rep.gains)}
    // Positionsumschulung
    if(I.pos&&I.pos!==p.pos){const ix=POS_IDX[I.pos],pp=p.pp.split('').map(ch=>ch.charCodeAt(0)-64);p.tpp=(p.tpp||0)+.18*(.6+at(p,'ver')/25)*(1+.3*crewK(u,'ast'));
      if(p.tpp>=1&&pp[ix]<18){p.tpp-=1;pp[ix]++;p.pp=String.fromCharCode(...pp.map(v=>64+v));CACHE.rate.delete(p);CACHE.ovr.delete(p);if(pp[ix]>=15&&!p.tppN){p.tppN=1;addNews('info',`Umschulung: ${fullname(p)}`,`${esc(pname(p))} beherrscht die Position ${POS_LABEL[I.pos]} inzwischen gut.`)}}}
    // Trainingsleistung
    p.trf=clamp(6.3+(at(p,'prf')-10)*.07+(at(p,'det')-10)*.05+(p.mor-60)/45+gauss()*.55,3,10);
  }
  rep.fit=sq.length?fsum/sq.length:0;rep.mor=sq.length?msum/sq.length:0;
  const ranked=sq.filter(p=>p.inj===0&&p.trf).sort((a,b)=>b.trf-a.trf);rep.top=ranked.slice(0,3).map(p=>p.id);rep.flop=ranked.slice(-2).map(p=>p.id);
  const pusher=ranked.slice(0,3).find(p=>!u.lineup.includes(p.id)&&ROLE_ORDER.indexOf(p.role)>=1);
  if(pusher){pusher.mor=clamp(pusher.mor+2,15,100);rep.push=pusher.id}
  for(const x of rep.inj){const p=S.players[x.pid];addNews('info',`Trainingsverletzung: ${fullname(p)}`,`${esc(pname(p))} hat sich im Training verletzt und fällt ${x.w} ${x.w===1?'Woche':'Wochen'} aus. Trainingsbelastung diese Woche: ${load}.`)}
  T.rep=rep;T.hist=[{w:S.week,load,fit:rep.fit},...(T.hist||[])].slice(0,10);T.wk=(T.wk||0)+1;
}
function trainAfter(){const T=S&&S.train;if(T)T.cur=null}

/* ---------- Ratschlag des Co-Trainers ---------- */
function trainAdvice(){
  const u=userClub(),W=weekUnits(),units=W.units,load=planLoad(units),ng=nextUserGames()[0],ast=crewOf(u).ast,out=[];
  const tired=squadOf(u).filter(p=>p.inj===0&&p.fit<75).length;
  if(W.two)out.push('Englische Woche: Es wird nur am Tag nach dem Spiel und am Tag davor trainiert. Plane dort Regeneration und Matchvorbereitung.');
  if(load>38)out.push(`Die Belastung ist sehr hoch (${load}). Das Verletzungsrisiko steigt, die Spieler gehen müde ins Spiel.`);
  else if(load<14&&!W.free)out.push('Die Woche ist sehr locker. Gut für die Frische – aber Eingespieltheit und Entwicklung leiden.');
  if(TTPL&&W.days[0]&&!W.days[0].u.some(k=>TU[k].g==='rec'))out.push('Direkt nach dem Spiel fehlt eine Regenerationseinheit.');
  if(!units.includes('prep')&&ng)out.push(`Wir haben keine Gegnervorbereitung auf ${club(ng.m.h===S.user?ng.m.a:ng.m.h).name} eingeplant.`);
  if(tired>=5)out.push(`${tired} Spieler sind unter 75 % Fitness – ich würde die Woche entschärfen.`);
  if(famOf(u)<50)out.push(`Die Mannschaft ist im ${u.tactic.f} noch nicht eingespielt (${Math.round(famOf(u))}). Mehr Taktikeinheiten helfen.`);
  if(!out.length)out.push('Der Plan ist ausgewogen. So können wir arbeiten.');
  return {who:ast?ast.name:'Dein Co-Trainer',out};
}

/* ---------- Oberfläche ---------- */
function renderTraining(){
  const u=userClub(),T=trainOf(),tab=UI.trTab||'plan';
  const tabs=`<div class="seg" style="margin-bottom:12px">${[['plan','Wochenplan'],['ind','Individuell'],['rep','Wochenbericht']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-act="trTab" data-v="${k}">${l}</button>`).join('')}</div>`;
  const staff=['ast','fit','gk','ana','psy','u19','phys'].map(r=>{const m=crewOf(u)[r];return `<span class="pill">${CREW[r].lbl}: ${m?esc(m.name)+' '+m.q:'<span class="bad">vakant</span>'}</span>`}).join(' ');
  if(tab==='ind')return `<h2>Training</h2>${tabs}${trainIndPage()}`;
  if(tab==='rep')return `<h2>Training</h2>${tabs}${trainRepPage()}`;
  const W=weekUnits(),units=W.units,load=planLoad(units),mix=planMix(units),ng=nextUserGames()[0],md=ng&&ng.wh?ng.wh.d:null,A=trainAdvice();
  const dayDate=i=>md?addDaysIso(md,TOFF[i]-7):null;
  const opts=sel=>Object.entries(TU).map(([k,U])=>`<option value="${k}" ${sel===k?'selected':''}>${U.ic} ${U.l}</option>`).join('');
  const cols=T.plan.map((d,i)=>{const on=!W.two||i===0||i===5,dt=dayDate(i);return `<div class="tday ${on?'':'off'}"><div class="tdh"><b>${TDAYS[i]}</b><span class="small muted">${dt?fmtWhenShort({d:dt}):''}</span></div>
     ${[0,1].map(s=>`<div class="tslot"><span class="small muted">${s?'Nachmittag':'Vormittag'}</span><select data-chg="trSlot" data-d="${i}" data-s="${s}" ${on?'':'disabled'}>${opts(d[s])}</select><div class="tg" style="background:${TG[TU[d[s]].g][1]}"></div></div>`).join('')}</div>`}).join('');
  const mixBar=Object.entries(mix).map(([k,v])=>v>0?`<i style="width:${v*100}%;background:${TG[k][1]}" title="${TG[k][0]} ${Math.round(v*100)} %"></i>`:'').join('');
  return `<h2>Training</h2>${tabs}
   <div class="card"><div class="row" style="justify-content:space-between;gap:10px"><div><h3 style="margin:0">Mikrozyklus ${W.two?'· Englische Woche':W.free?'· spielfreie Woche':''}</h3><div class="small muted">${ng?`Nächstes Spiel: ${esc(club(ng.m.h===S.user?ng.m.a:ng.m.h).name)} · ${fmtWhenShort(ng.wh)} (MD)`:'Kein Spiel geplant'}</div></div>
     <div class="row" style="gap:6px">${Object.entries(TTPL).map(([k,P])=>`<button class="btn sm ${T.tpl===k?'pri':''}" data-act="trTpl" data-v="${k}">${P.l}</button>`).join('')}</div></div>
    <div class="tweek">${cols}<div class="tday md"><div class="tdh"><b>MD</b><span class="small muted">${md?fmtWhenShort({d:md}):''}</span></div><div class="tslot"><b>⚽ Spieltag</b></div></div></div>
    <div class="grid g2" style="margin-top:12px"><div>${meter('Belastung der Woche',clamp(load*2.2,0,100))}<div class="small muted" style="margin:2px 0 8px">Wert ${load} · ideal 20–34 · über 38 steigt das Verletzungsrisiko deutlich</div>
       <div class="small">Schwerpunkte</div><div class="tmix">${mixBar}</div><div class="small muted" style="margin-top:4px">${Object.entries(mix).filter(([k,v])=>v>0).map(([k,v])=>`<span style="color:${TG[k][1]}">■</span> ${TG[k][0]} ${Math.round(v*100)} %`).join(' · ')}</div>
       ${meter(`Eingespieltheit im ${u.tactic.f}`,famOf(u))}<div class="small muted">Wächst mit Taktikeinheiten und Trainingsspielen, sinkt ohne – und bei Formationswechseln.</div></div>
      <div class="news t-board"><b>💬 ${esc(A.who)} (Co-Trainer):</b>${A.out.map(x=>`<div class="small" style="margin-top:4px">• ${esc(x)}</div>`).join('')}</div></div>
    <div class="small" style="margin-top:10px">${staff}</div></div>
   <div class="card" style="margin-top:12px"><h3>Die Einheiten</h3><div class="tunits">${Object.entries(TU).map(([k,U])=>`<div class="tunit"><b>${U.ic} ${U.l}</b> <span class="small" style="color:${TG[U.g][1]}">${TG[U.g][0]}</span><div class="small muted">${U.d}</div><div class="small">Belastung ${U.int}${U.st?' · leitet: '+CREW[U.st].lbl:''}${U.a?' · fördert: '+U.a.map(a=>ATTR_LABEL[a]).join(', '):''}</div></div>`).join('')}</div></div>`;
}
function trainIndPage(){
  const u=userClub(),T=trainOf(),sq=squadOf(u).filter(p=>p.club===S.user).sort((a,b)=>POS_ORDER[a.pos]-POS_ORDER[b.pos]||ovr(b)-ovr(a));
  const rows=sq.map(p=>{const I=T.ind[p.id]||{},prog=p.tp?Object.entries(p.tp).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${ATTR_LABEL[k]} ${Math.round(v*100)} %`).join(', '):'';
    return `<tr><td><span class="pill">${p.pos}</span></td><td class="click" data-act="player" data-id="${p.id}"><b>${esc(fullname(p))}</b> ${ovrTag(ovr(p))}<div class="small muted">${p.age} J. · Pot. ${potDisp(p)}${p.inj?' · <span class="bad">verletzt</span>':''}</div></td>
     <td><select data-chg="trInd" data-id="${p.id}" data-k="f">${Object.entries(IND).filter(([k])=>k!=='gk'||p.pos==='TW').map(([k,l])=>`<option value="${k}" ${I.f===k||(!I.f&&!k)?'selected':''}>${l}</option>`).join('')}</select></td>
     <td><select data-chg="trInd" data-id="${p.id}" data-k="i">${Object.entries(INT).map(([k,[l]])=>`<option value="${k}" ${(I.i||'norm')===k?'selected':''}>${l}</option>`).join('')}</select></td>
     <td><select data-chg="trInd" data-id="${p.id}" data-k="pos"><option value="">–</option>${POS_LIST.filter(x=>x!==p.pos&&(x==='TW')===(p.pos==='TW')).map(x=>`<option value="${x}" ${I.pos===x?'selected':''}>${x}</option>`).join('')}</select></td>
     <td class="n">${Math.round(p.fit)} %</td><td class="n">${p.trf?p.trf.toFixed(1).replace('.',','):'–'}</td><td class="small">${prog}</td></tr>`}).join('');
  return `<div class="card"><p class="small muted">Individueller Schwerpunkt: zusätzliche Einheit mit dem Co-Trainer (bzw. Torwarttrainer). Intensität „Schonen“ senkt Belastung und Verletzungsrisiko, „Hoch“ beschleunigt die Entwicklung. Umschulung: Der Spieler lernt Woche für Woche eine neue Position.</p>
   <div class="tw"><table><thead><tr><th>Pos</th><th>Spieler</th><th>Schwerpunkt</th><th>Intensität</th><th>Umschulung</th><th class="n">Fitness</th><th class="n">Trainingsnote</th><th>Fortschritt</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function trainRepPage(){
  const R=trainOf().rep,u=userClub();if(!R)return '<div class="card"><p class="muted">Der erste Wochenbericht kommt nach der ersten Trainingswoche.</p></div>';
  const P=id=>S.players[id];const g={};for(const x of R.gains)(g[x.pid]=g[x.pid]||[]).push(x);
  return `<div class="grid g2"><div class="card"><h3>Woche ${R.w+1}${R.two?' · Englische Woche':''}</h3>
     <div class="crow"><span>Belastung</span><b>${R.load}</b></div><div class="crow"><span>Fitness im Schnitt</span><b class="${R.fit>=0?'good':'bad'}">${R.fit>=0?'+':''}${R.fit.toFixed(1).replace('.',',')}</b></div>
     <div class="crow"><span>Moral im Schnitt</span><b class="${R.mor>=0?'good':'bad'}">${R.mor>=0?'+':''}${R.mor.toFixed(1).replace('.',',')}</b></div>
     <div class="crow"><span>Eingespieltheit</span><b>${Math.round(R.fam0)} → ${Math.round(R.fam1)}</b></div>
     <div class="crow"><span>Einheiten</span><span class="small" style="text-align:right">${R.units.map(k=>TU[k].ic+' '+TU[k].l).join(', ')}</span></div>
     ${R.inj.length?`<div class="news t-coach" style="margin-top:8px"><b>Trainingsverletzungen:</b> ${R.inj.map(x=>esc(fullname(P(x.pid)))+' ('+x.w+' W.)').join(', ')}</div>`:''}</div>
    <div class="card"><h3>Aus dem Training</h3>
     <div class="small"><b>🔥 Trainingsweltmeister:</b> ${R.top.map(id=>`${esc(fullname(P(id)))} (${P(id).trf.toFixed(1).replace('.',',')})`).join(', ')}</div>
     <div class="small" style="margin-top:4px"><b>😴 Enttäuschend:</b> ${R.flop.map(id=>`${esc(fullname(P(id)))} (${P(id).trf.toFixed(1).replace('.',',')})`).join(', ')}</div>
     ${R.push?`<div class="news t-offer" style="margin-top:8px">💡 ${esc(fullname(P(R.push)))} drängt sich für die Startelf auf.</div>`:''}
     <h3 style="margin-top:12px">Fortschritte</h3>${Object.keys(g).length?Object.entries(g).map(([id,l])=>`<div class="small">📈 <b>${esc(fullname(P(id)))}</b>: ${l.map(x=>ATTR_LABEL[x.k]+' → '+x.v).join(', ')}</div>`).join(''):'<p class="small muted">Diese Woche keine Sprünge – Entwicklung braucht Zeit.</p>'}</div></div>`;
}
Object.assign(ACT,{
  trTab:d=>{UI.trTab=d.v;render()},
  trTpl:d=>{const T=trainOf();T.tpl=d.v;T.plan=TTPL[d.v].p.map(x=>x.slice());save();render()}
});
Object.assign(CHG,{
  trSlot:el=>{const T=trainOf();T.plan[+el.dataset.d][+el.dataset.s]=el.value;T.tpl='';save();render()},
  trInd:el=>{const T=trainOf(),id=el.dataset.id;const I=T.ind[id]=T.ind[id]||{};I[el.dataset.k]=el.value||undefined;save();render()}
});
const TRAIN_DEV_SHARE=.7;
