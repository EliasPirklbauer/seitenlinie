/* =====================================================================
   Seitenlinie – Vereinsorganisation
   Aufsichtsrat → bestellt den Vorstand → Geschäftsverteilung.
   Der Trainer kümmert sich um die Mannschaft. Transfers, Verträge,
   Verkäufe, Finanzen und Presse liegen – je nach Vereinsmodell – bei
   Sportdirektor, Kaderplaner, Finanzvorstand oder Mediendirektor.
   ===================================================================== */
const VOR_ROLES=['ceo','cfo','dirq','mkt'];          // Vorstand – vom Aufsichtsrat bestellt
const OFFICE_ROLES=['kader','media'];                // Geschäftsstelle – vom Vorstand eingestellt
const TASKS={
  team:{lbl:'Mannschaft & Training',ic:'⚽',d:'Training, Aufstellung, Taktik, Einwechslungen.',opts:['coach']},
  buy:{lbl:'Transfers & Ablöseverhandlungen',ic:'💶',d:'Sucht Spieler, verhandelt mit den abgebenden Vereinen.',opts:['dirq','coach']},
  sell:{lbl:'Verkäufe & Anfragen',ic:'🏷️',d:'Entscheidet über Angebote für eigene Spieler und beantwortet Anfragen.',opts:['dirq','coach']},
  ctr:{lbl:'Vertragsgespräche',ic:'✍️',d:'Verlängerungen mit eigenen Spielern, Gehaltsverhandlungen.',opts:['kader','dirq','coach']},
  loan:{lbl:'Leihgeschäfte',ic:'🔁',d:'Spieler ausleihen und verleihen.',opts:['kader','dirq','coach']},
  staff:{lbl:'Personal im Sportbereich',ic:'🧑‍🏫',d:'Einstellung von Co-Trainern, Ärzten, Scouts.',opts:['dirq','coach']},
  fin:{lbl:'Finanzen & Budgets',ic:'📊',d:'Gibt Transfer- und Gehaltsbudgets frei, kontrolliert Kosten.',opts:['cfo','ceo']},
  press:{lbl:'Presse & Kommunikation',ic:'🎙️',d:'Pressearbeit, Krisenkommunikation, Auftritt des Vereins.',opts:['media','ceo','coach']},
  spons:{lbl:'Sponsoring & Vermarktung',ic:'🤝',d:'Sponsorenverträge, Ticketing, Fanartikel.',opts:['ceo','mkt']},
  youth:{lbl:'Nachwuchs',ic:'🌱',d:'Akademie, Talentsichtung, Übergang in den Profibereich.',opts:['youth','dirq']},
  scout:{lbl:'Scouting',ic:'🔭',d:'Spielerbeobachtung im In- und Ausland.',opts:['scout','kader','dirq']}};
const ORG_MODEL={
  manager:{lbl:'Teammanager-Modell',d:'Wie in England üblich: Der Trainer ist auch für Transfers, Verkäufe und Verträge zuständig.'},
  sd:{lbl:'Sportdirektor-Modell',d:'Der Sportdirektor verantwortet Transfers, Verkäufe und Verträge. Der Trainer meldet Bedarf und spricht mit.'},
  vorstand:{lbl:'Sportvorstand-Modell',d:'Ein Sportvorstand führt den Sportbereich, ein Kaderplaner übernimmt Verträge und Leihen. Großvereins-Struktur.'}};
const ENG_LIKE=['ENG','SCO','WAL','NIR','IRL'];

function orgOf(c){
  if(c.org)return c.org;
  const L=league(c),model=ENG_LIKE.includes(c.assoc)&&c.rep<88?'manager':(L&&L.tier>=3&&c.rep<45)?'manager':c.rep>=80?'vorstand':'sd';
  const t={team:'coach',fin:'cfo',press:c.rep>=55?'media':'ceo',spons:c.rep>=65?'mkt':'ceo',youth:'youth',scout:'scout'};
  if(model==='manager')Object.assign(t,{buy:'coach',sell:'coach',ctr:'coach',loan:'coach',staff:'coach'});
  else if(model==='sd')Object.assign(t,{buy:'dirq',sell:'dirq',ctr:'dirq',loan:'dirq',staff:'dirq'});
  else Object.assign(t,{buy:'dirq',sell:'dirq',ctr:'kader',loan:'kader',staff:'dirq'});
  c.org={model,tasks:t,rel:60};return c.org;
}
function owner(task,c){c=c||userClub();return orgOf(c).tasks[task]||'coach'}
function mayDo(task){return !S||S.user===null||owner(task)==='coach'}
function roleLbl(role,c){c=c||userClub();if(role==='coach')return 'Cheftrainer';if(role==='dirq')return orgOf(c).model==='vorstand'?'Sportvorstand':'Sportdirektor';if(role==='mkt'&&orgOf(c).model!=='manager')return 'Vorstand Marketing';return CREW[role]?CREW[role].lbl:role}
function ownerName(task,c){c=c||userClub();const r=owner(task,c);if(r==='coach')return c.id===S.user?'Du':c.staff.coach.name;const m=crewOf(c)[r];return m?m.name:'– unbesetzt –'}
function ownerK(task,c){c=c||userClub();const r=owner(task,c);return r==='coach'?0:crewK(c,r)}
function sdOf(){return crewOf(userClub()).dirq}
function sdName(){const m=sdOf();return m?m.name:'Der Sportdirektor'}
function rel(){return orgOf(userClub()).rel}
function relAdd(d){const o=orgOf(userClub());o.rel=clamp(o.rel+d,0,100)}
function relLbl(v){return v>=75?'eng & vertrauensvoll':v>=55?'professionell':v>=40?'angespannt':'zerrüttet'}
function isVorRole(r){return VOR_ROLES.includes(r)}
function isOfficeRole(r){return OFFICE_ROLES.includes(r)}

/* ---------- Kaderplanung: Wunschliste, Bedarf, Vorschläge ---------- */
function wishes(){return S.wish=S.wish||[]}
function negActive(pid){return (S.aineg||[]).some(n=>n.pid===pid&&n.buyer===S.user)||(S.talks||[]).some(t=>t.pid===pid&&t.from===S.user&&t.st==='open')}
function wishOf(pid){return wishes().find(w=>w.pid===pid&&['open','neg'].includes(w.st))}
function addWish(pid,prio,kind,src){
  const p=S.players[pid];if(!p||p.club===S.user)return;let w=wishOf(pid);
  if(w){w.prio=prio;w.kind=kind||w.kind;return w}
  w={id:'w'+(S.nextId++),pid,prio,kind:kind||'buy',src:src||'coach',w:S.week,season:S.season,st:'open',note:''};
  const sp=(S.sdprop||[]).find(x=>x.pid===pid&&x.st==='open');if(sp){sp.st='yes';w.force=1;relAdd(3)}
  wishes().push(w);return w;
}
function wishStatus(w){
  const p=S.players[w.pid];if(!p)return 'nicht mehr verfügbar';
  return {open:isWindow()?'wird geprüft':'wartet auf das Transferfenster',neg:'in Verhandlung',done:'✅ verpflichtet',no:'❌ '+(w.note||'abgelehnt'),fail:'❌ '+(w.note||'gescheitert'),gone:'nicht mehr verfügbar'}[w.st]||w.st;
}
// Wie sieht der Sportdirektor den Spieler?
function posLvl(u,pos){const st=u.lineup.map(id=>S.players[id]).filter(p=>p&&p.pos===pos).map(ovr);return st.length?Math.min(...st):bestAtPos(u,pos,1)}
function sdView(p,u){
  const tr=u.staff.dir.trait,lvl=posLvl(u,p.pos),o=ovr(p),price=p.club===null?0:Math.min(sellerTarget(p),buyFee(p,u).fee);
  const why=[];let ok=true;
  if(o<lvl-3&&p.pot<lvl+4){ok=false;why.push('keine echte Verstärkung')}
  if(tr==='jugend'&&p.age>=29){ok=false;why.push('zu alt für unser Konzept')}
  if(tr==='erfahrung'&&p.age<=20&&o<lvl){ok=false;why.push('zu unerfahren')}
  if(tr==='schnaeppchen'&&price>p.val*1.35){ok=false;why.push('zu teuer für das, was er bringt')}
  if(tr==='star'&&o<lvl&&p.pot<lvl+6){ok=false;why.push('nicht das Niveau, das wir brauchen')}
  return {ok,why,price,lvl};
}
function orgSearch(u,pos,budget,need){
  const tr=u.staff.dir.trait,lvl=posLvl(u,pos)-(need?2:-1),bill=wageBill(u),cands=[];
  for(const p of posIndex()[pos]){
    const o=ovr(p);if(o<lvl&&!(tr==='jugend'&&p.pot>=lvl+6))continue;if(cands.length>=20)break;
    if(p.club===S.user||p.inj>0||p.loan)continue;if(p.club!==null){const sc=club(p.club);if(!sc||sc.guest||sc.rep-u.rep>20)continue}
    if(tr==='jugend'&&p.age>24)continue;if(tr==='erfahrung'&&p.age<25)continue;
    const price=p.club===null?0:Math.min(sellerTarget(p),buyFee(p,u).fee);if(price>budget)continue;if(bill+aiWageFor(p,u)>u.wBudget)continue;
    const score=tr==='jugend'?p.pot*2-p.age:tr==='erfahrung'?o:tr==='schnaeppchen'?(o-lvl)/(price/1e6+1):o*3-price/1e7;cands.push({p,score});
  }
  cands.sort((a,b)=>b.score-a.score);return cands.length?cands[Math.floor(rnd()*Math.min(3,cands.length))].p:null;
}
function arLimit(u){return Math.max(u.tBudget*.5,1.5e6*u.econ)}
function arApproval(price){
  const u=userClub(),B=boardOf();if(price<=arLimit(u))return {need:false,ok:true};
  return {need:true,ok:rnd()<clamp(.35+(B.trust-40)/50+crewK(u,'ceo')*.1,.1,.95)};
}

/* ---------- Wöchentliche Arbeit der Verantwortlichen ---------- */
function orgWeekly(){
  if(!S||S.user===null||S.fired)return;const u=userClub();orgOf(u);const cr=crewOf(u);
  for(const role of VOR_ROLES)if(!cr[role]){vorReplace(u,role,'Nachfolge');if(S.fired)return}
  for(const role of OFFICE_ROLES)if(!cr[role]){const m=crewPerson(u,role,clamp(Math.round(crewLevel(u)+(rnd()-.5)*6),1,20));m.until=S.season+2;m.since=S.season;cr[role]=m;addNews('board',`Vorstand besetzt: ${CREW[role].lbl}`,`Neu: <b>${esc(m.name)}</b> (Qualität ${m.q}).`)}
  orgTaskReqs();orgRelease();
  if(!mayDo('buy'))orgBuy(u);
  if(!mayDo('sell'))orgSell(u);
  if(!mayDo('ctr'))orgContracts(u);
  // Beziehung driftet langsam zur Mitte
  const o=orgOf(u);o.rel=clamp(o.rel+(60-o.rel)*.02,0,100);
}
function orgBuy(u){
  const role=owner('buy'),m=crewOf(u)[role],nm=m?m.name:'Niemand';
  // Status der laufenden Wünsche
  for(const w of wishes()){
    if(!['open','neg'].includes(w.st))continue;const p=S.players[w.pid];if(!p){w.st='gone';continue}
    if(p.club===S.user||(p.loan&&p.loan.to===S.user)){w.st='done';relAdd(3);addNews('transfer',`✅ ${nm}: ${fullname(p)} ist da`,`${roleLbl(role)} ${esc(nm)} hat ${esc(pname(p))} (${p.pos}, ${ovr(p)}) verpflichtet${w.src==='coach'?' – dein Wunsch ist erfüllt':''}.`);continue}
    if(w.st==='neg'&&!negActive(p.id)){w.st='fail';w.note='keine Einigung';addNews('transfer',`❌ Kein Transfer: ${fullname(p)}`,`${esc(nm)} konnte sich mit ${p.club!==null?esc(club(p.club).name)+' bzw. dem Spieler':'dem Spieler'} nicht einigen.`)}
    if(w.st==='open'&&w.season!==S.season&&!isWindow()){w.st='gone'}
  }
  if(!isWindow())return;
  if(!m){if(wishes().some(w=>w.st==='open')&&!S.orgVacW){S.orgVacW=1;addNews('board','Niemand kümmert sich um Transfers',`Die Stelle ${roleLbl(role)} ist unbesetzt – deine Wunschliste bleibt liegen.`)}return}
  let cap=1+(m.q>=14?1:0);if((S.talks||[]).some(t=>t.from===S.user&&t.st==='open'))cap=Math.min(cap,1);
  const open=wishes().filter(w=>w.st==='open').sort((a,b)=>a.prio-b.prio||a.w-b.w);
  for(const w of open){if(cap<=0||aiBusy(u)>=2)break;const p=S.players[w.pid];if(!p)continue;
    if(p.club!==null&&((S.aineg||[]).some(n=>n.pid===p.id)||activeTalk(p.id))){w.note='ein anderer Verein verhandelt gerade';continue}
    cap--;
    const V=sdView(p,u),T=p.club!==null?club(p.club):null;
    if(!V.ok&&w.src==='coach'&&!w.force){const push=w.prio===1&&rel()>=50&&rnd()<.6;
      if(!push){w.st='no';w.note=`${nm}: ${V.why[0]}`;relAdd(-1);addNews('transfer',`${roleLbl(role)} winkt ab: ${fullname(p)}`,`${esc(nm)}: „${esc(cap1(V.why.join(', ')))}. Den holen wir nicht.“`);continue}}
    if(V.price>u.tBudget){w.st='no';w.note='Finanzvorstand: kein Budget';addNews('transfer',`Kein Budget: ${fullname(p)}`,`${esc(ownerName('fin'))} (Finanzen) gibt die geschätzten ${money(V.price)} nicht frei – das Transferbudget liegt bei ${money(u.tBudget)}.`);continue}
    if(wageBill(u)+aiWageFor(p,u)>u.wBudget){w.st='no';w.note='Gehaltsbudget reicht nicht';addNews('transfer',`Gehaltsbudget ausgeschöpft: ${fullname(p)}`,`${esc(ownerName('fin'))} lehnt ab: Sein Gehalt passt nicht mehr in den Etat.`);continue}
    const A=arApproval(V.price);if(A.need&&!A.ok){w.st='no';w.note='Aufsichtsrat lehnt ab';addNews('board',`Aufsichtsrat stoppt Transfer: ${fullname(p)}`,`Für ${money(V.price)} braucht es die Zustimmung des Aufsichtsrats – die gibt es nicht. ${esc(boardOf().members[0].name)}: „Bei dieser Summe wollen wir erst mehr Konstanz sehen.“`);continue}
    if(A.need)addNews('board',`Aufsichtsrat genehmigt: ${fullname(p)}`,`Der Aufsichtsrat gibt grünes Licht für Verhandlungen bis etwa ${money(V.price)}.`);
    if(!T){ // vereinslos
      const ch=clamp(.45+(u.rep-55)/60+crewK(u,role)*.12,.1,.92);
      if(rnd()<ch){executeDeal(p,u,{fee:0},{wage:aiWageFor(p,u),until:S.season+(p.age>=30?1:2),role:suggestRole(p,u)});w.st='done';relAdd(3);addNews('transfer',`✅ ${esc(nm)} holt ${fullname(p)}`,`Der vereinslose ${p.pos} (${ovr(p)}) unterschreibt bis ${contractEnd(p)}.`)}
      else{w.st='fail';w.note='Spieler sagt ab';addNews('transfer',`${fullname(p)} sagt ab`,`Der vereinslose Spieler hat sich gegen ${esc(u.name)} entschieden.`)}
      continue}
    let started=false;
    if(w.kind==='loan'){started=aiLoanFor(p,u)}
    else{const bf=buyFee(p,u);if(bf.clause&&bf.fee<=u.tBudget)started=startClauseTalk(p,u,bf.fee,'clause');else{aiStartNeg(p,u);started=negActive(p.id)}}
    if(started||negActive(p.id)){w.st='neg';addNews('transfer',`${esc(nm)} verhandelt: ${fullname(p)}`,`${roleLbl(role)} ${esc(nm)} hat ${w.kind==='loan'?'eine Leihanfrage':'Gespräche'} mit ${esc(T.name)} aufgenommen${w.src==='coach'?' – auf deinen Wunsch':''}.`)}
    else{w.st='fail';w.note=`${T.name} blockt ab`;addNews('transfer',`Keine Gespräche: ${fullname(p)}`,`${esc(T.name)} zeigt kein Interesse an Verhandlungen.`)}
  }
  orgProposals(u,m,role);
}
function cap1(s){return s?s[0].toUpperCase()+s.slice(1):s}
// Eigene Ideen des Sportdirektors – der Trainer wird gefragt
function orgProposals(u,m,role){
  S.sdprop=(S.sdprop||[]).filter(x=>x.st==='open'||x.season===S.season);
  for(const x of S.sdprop.filter(x=>x.st==='open'&&S.week-x.w>=2)){ // keine Antwort → er entscheidet selbst
    x.st=rnd()<.6?'self':'drop';const p=S.players[x.pid];if(p&&x.st==='self'){addWish(p.id,2,'buy','sd').force=1;addNews('transfer',`${esc(m.name)} entscheidet allein: ${fullname(p)}`,'Du hast nicht geantwortet – er nimmt die Verhandlungen auf.')}}
  if(S.sdprop.filter(x=>x.st==='open').length>=2)return;
  const needs=(S.needs||[]).filter(n=>n.st==='open');const tr=u.staff.dir.trait;
  let pos=null,src='sd';if(needs.length){const n=needs.sort((a,b)=>a.prio-b.prio)[0];pos=n.pos;n.st='prop';src='need'}
  else if(rnd()<(tr==='star'?.16:.09)){const wp=weakestPos(u);pos=wp.pos}
  if(!pos)return;
  const p=orgSearch(u,pos,u.tBudget*.85,src==='need');
  if(!p){if(src==='need')addNews('transfer',`Kein passender ${pos} gefunden`,`${esc(m.name)}: „Für die Position ${POS_LABEL[pos]} finde ich im Moment niemanden, der uns verbessert und bezahlbar ist.“`);return}
  S.sdprop.push({id:'sp'+(S.nextId++),pid:p.id,pos,src,w:S.week,season:S.season,st:'open'});
  addNews('offer',`${esc(m.name)} schlägt vor: ${fullname(p)}`,`${roleLbl(role)} ${esc(m.name)} möchte ${esc(pname(p))} holen (${p.pos}, ${p.age} J., Stärke ${ovr(p)}, ${p.club!==null?esc(club(p.club).name):'vereinslos'}). Er will deine Meinung – unter „Transfers → Kaderplanung“.`);
}
function sdPropAnswer(id,yes){
  const x=(S.sdprop||[]).find(y=>y.id===id);if(!x||x.st!=='open')return;const p=S.players[x.pid],u=userClub(),m=sdOf(),nm=m?m.name:'Der Sportdirektor';
  if(yes){x.st='yes';relAdd(4);addWish(x.pid,2,'buy','sd').force=1;toast(`${nm} nimmt die Gespräche auf`);return}
  x.st='no';relAdd(-3);
  const over=(u.staff.dir.trait==='star'?.3:.12)+(boardOf().trust<40?.25:0)+(rel()<35?.2:0);
  if(rnd()<over){addWish(x.pid,2,'buy','sd').force=1;relAdd(-4);addNews('board',`${esc(nm)} setzt sich über dich hinweg`,`Trotz deines Neins verhandelt ${esc(nm)} weiter mit ${esc(pname(p))}. „Ich verantworte den Kader, Trainer – nicht Sie.“`)}
  else addNews('transfer',`Vorschlag verworfen: ${fullname(p)}`,`${esc(nm)} akzeptiert dein Nein. „Okay, dann suchen wir weiter.“`);
}

/* ---------- Verkäufe: der Verantwortliche entscheidet, du empfiehlst ---------- */
function orgSell(u){
  const role=owner('sell'),m=crewOf(u)[role],nm=m?m.name:'Der Vorstand',tr=u.staff.dir.trait;
  // Anfragen beantwortet er selbst
  for(const x of (S.uinq||[]).filter(x=>x.st==='open'))orgAnswerInq(x);
  for(const o of S.offers.slice()){
    if(o.w>=S.week&&!(S.week>=windowEnd()))continue;const p=S.players[o.pid],c=club(o.from);if(!p||!c){S.offers=S.offers.filter(y=>y!==o);continue}
    const ri_=ROLE_ORDER.indexOf(p.role),key=ri_<=1,recTxt=o.rec==='yes'?'Du warst dafür.':o.rec==='no'?'Du warst dagegen.':'Du hast keine Empfehlung abgegeben.';
    let acc;
    if(o.loan){acc=ri_>=3&&o.rec!=='no'&&!p.nfs&&(p.age<=23||p.listed)}
    else{let th=key?1.6:p.listed?.85:1.15;if(o.rec==='no'||p.nfs)th+=.5;if(o.rec==='yes')th-=.15;if(tr==='schnaeppchen')th-=.1;if(tr==='star'&&key)th+=.2;if(u.budget<0)th-=.25;
      const v=bidValue(o.bid||{fee:o.fee},p)/Math.max(1,p.val);acc=v>=th;
      if(!acc&&v>=th*.8&&(o.rounds||0)<2&&isWindow()){const ask=normBid({...(o.bid||{fee:o.fee}),fee:nice((o.bid||{fee:o.fee}).fee*1.2)});const r=buyerReply(o,ask);
        if(r.res==='counter'){o.w=S.week;addNews('offer',`${esc(nm)} pokert: ${fullname(p)}`,`${esc(nm)} hat ${esc(c.name)} ein Gegenangebot gemacht – sie bessern nach: ${bidText(o.bid)}. ${recTxt}`);continue}
        if(r.res==='yes'){acc=true;o.bid=r.bid;o.fee=r.bid.fee}}}
    S.offers=S.offers.filter(y=>y!==o);
    if(acc&&isWindow()){
      if(o.loan)startClauseTalk(p,c,o.loan.fee,'loan',null,o.loan);else startClauseTalk(p,c,o.fee,'deal',o.bid||{fee:o.fee});
      if(o.rec==='no'||p.nfs)relAdd(-6);
      addNews('offer',`${esc(nm)} sagt Ja: ${fullname(p)}`,`${roleLbl(role)} ${esc(nm)} nimmt das Angebot von ${esc(c.name)} an (${o.loan?loanText(o.loan):bidText(o.bid||{fee:o.fee})}). ${recTxt}${o.rec==='no'||p.nfs?' <b>Er hat sich über dein Veto hinweggesetzt.</b>':''} Jetzt entscheidet der Spieler.`);
    }else{
      if(o.rec==='yes')relAdd(-2);
      addNews('offer',`${esc(nm)} lehnt ab: ${fullname(p)}`,`Das Angebot von ${esc(c.name)} (${o.loan?loanText(o.loan):bidText(o.bid||{fee:o.fee})}) ist ${esc(nm)} ${o.loan?'nicht recht':'zu niedrig'}. ${recTxt}`);
    }
  }
}
function orgAnswerInq(x){
  const p=S.players[x.pid],c=club(x.by);if(!p||!c){x.st='done';return}
  const ri_=ROLE_ORDER.indexOf(p.role),nm=ownerName('sell');x.st='done';x.w=S.week;x.season=S.season;
  if(p.nfs||ri_<=1&&!p.listed){x.ans='no'}else if(x.kind==='loan'){x.ans=ri_>=3?'loan':'no'}else{x.ans='price';x.price=nice(p.val*(p.listed?1:1.3))}
  addNews('transfer',`${esc(nm)} antwortet ${esc(c.name)}: ${fullname(p)}`,x.ans==='no'?'Nicht zu haben.':x.ans==='loan'?'Eine Leihe ist denkbar.':`Verhandlungsbasis ab ${money(x.price)}.`);
}

/* ---------- Verträge: Empfehlung des Trainers, Gespräch führt der Zuständige ---------- */
const REC={prio:'Unbedingt verlängern',ext:'Verlängern',no:'Auslaufen lassen'};
function orgContracts(u){
  const role=owner('ctr'),m=crewOf(u)[role];if(!m)return;const k=crewK(u,role);
  const due=squadOf(u).filter(p=>!p.loan&&p.until<=S.season&&(p.ctS!==S.season||(p.ctTry||0)<3)&&p.rec!=='no'&&(p.rec||(ROLE_ORDER.indexOf(p.role)<=1&&S.week>=S.weeks*.3)));
  due.sort((a,b)=>(a.rec==='prio'?0:a.rec==='ext'?1:2)-(b.rec==='prio'?0:b.rec==='ext'?1:2)||ovr(b)-ovr(a));
  let cap=1+(m.q>=13?1:0);
  for(const p of due){if(cap--<=0)break;if(p.ctS!==S.season){p.ctS=S.season;p.ctTry=0}if(p.ctW===S.week)continue;p.ctW=S.week;
    const years=p.age>=32?1:p.age>=29?2:p.age<=23&&p.rec==='prio'?4:3,W=rw(wageDemand(p,u,p.role,years)*(1.04-.08*k));
    if(wageBill(u)-p.wage+W>u.wBudget){p.ctTry++;addNews('board',`Finanzvorstand bremst: ${fullname(p)}`,`${esc(ownerName('fin'))} gibt die geforderten ${money(mon(W))}/Monat für ${esc(pname(p))} nicht frei – das Gehaltsbudget ist ausgeschöpft.`);continue}
    const A=agentOf(p),ch=clamp(.5+(p.mor-60)/70+k*.15+(p.rec==='prio'?.08:0)-(at(p,'amb')-10)/30-(A.type==='poker'?.1:0)+(u.rep-60)/90,.08,.95);
    if(rnd()<ch){materializeContract(p);p.wage=W;p.until=S.season+years;p.ct.n=0;p.mor=clamp(p.mor+6,15,100);p.ctTry=0;
      addNews('transfer',`✍️ ${esc(m.name)} verlängert mit ${fullname(p)}`,`Neuer Vertrag bis ${contractEnd(p)} – ${money(mon(W))} brutto/Monat.${p.rec?' Deine Empfehlung wurde umgesetzt.':' Das hat er selbst entschieden.'}`)}
    else{p.ctTry++;
      if(p.ctTry>=3){addNews('transfer',`${fullname(p)} will nicht verlängern`,`Nach drei Gesprächsrunden mit ${esc(m.name)} ist klar: ${esc(pname(p))} geht am Saisonende ablösefrei.${S.week<winterStart()+2?' Der Verein setzt ihn auf die Transferliste.':''}`);if(S.week<winterStart()+2)p.listed=true}
      else addNews('transfer',`Vertragsgespräch ohne Ergebnis: ${fullname(p)}`,`${esc(m.name)} und Berater ${esc(A.name)} liegen noch auseinander (Runde ${p.ctTry} von 3).`)}
  }
}
// Freistellung: nur auf Antrag
function orgRelease(){
  for(const r of (S.relReq||[]).filter(r=>r.st==='open'&&r.w<S.week)){const p=S.players[r.pid],u=userClub();r.st='done';if(!p||p.club!==S.user)continue;
    const cost=releaseCost(p),ok=ROLE_ORDER.indexOf(p.role)>=2&&cost<=Math.max(u.tBudget*.3,u.budget*.1);
    if(ok){release(p);addNews('transfer',`${fullname(p)} freigestellt`,`${esc(ownerName('ctr'))} hat deinem Antrag zugestimmt. Abfindung: ${money(cost)}.`)}
    else addNews('transfer',`Freistellung abgelehnt: ${fullname(p)}`,`${esc(ownerName('ctr'))}: „${ROLE_ORDER.indexOf(p.role)<2?'Er ist zu wichtig für uns.':'Die Abfindung von '+money(cost)+' können wir uns nicht leisten.'}“`)}
}
// Änderung der Geschäftsverteilung – der Vorstand entscheidet
function orgTaskReqs(){
  const u=userClub(),O=orgOf(u),B=boardOf();
  for(const r of (S.taskReq||[]).filter(r=>r.st==='open'&&r.w<S.week)){
    const cur=O.tasks[r.task],toCoach=r.to==='coach',fromK=cur==='coach'?0:crewK(u,cur);
    const p=clamp(.2+(B.trust-50)/60+(toCoach?(B.trust>=70?.15:-.25):.1)+(fromK<0?.25:0)-(cur==='dirq'&&!toCoach?0:0),.05,.9),ok=rnd()<p;r.st=ok?'yes':'no';
    if(ok){O.tasks[r.task]=r.to;if(cur==='dirq')relAdd(-6);addNews('board',`Vorstand stimmt zu: ${TASKS[r.task].lbl}`,`Ab sofort zuständig: ${toCoach?'<b>du</b>':esc(roleLbl(r.to))+' '+esc(crewOf(u)[r.to]?crewOf(u)[r.to].name:'')}.`)}
    else addNews('board',`Vorstand lehnt ab: ${TASKS[r.task].lbl}`,`${esc(crewOf(u).ceo?crewOf(u).ceo.name:'Der Vorstand')}: „Die Zuständigkeiten bleiben, wie sie sind. ${toCoach?'Konzentrieren Sie sich auf die Mannschaft.':'Wir sehen keinen Grund für eine Änderung.'}“`);
  }
}

/* ---------- Aufsichtsrat bestellt den Vorstand – für alle Vereine ---------- */
function vorPerf(c,role){
  const gap=(c.lastRank||c.expRank)-c.expRank,att=(c.lastAtt||c.stadium*.8)/c.stadium;
  return role==='dirq'?-gap/4:role==='ceo'?(c.budget<0?-1:.3)-gap/8:role==='cfo'?(c.budget<-1e6*c.econ?-1.2:.4):role==='mkt'?(att-.75)*4:0;
}
function vorReplace(c,role,why,quiet){
  const cr=crewOf(c),old=cr[role],q=clamp(Math.round(crewLevel(c)+(rnd()-.4)*7),1,20),m=crewPerson(c,role,q);m.until=S.season+3;m.since=S.season;cr[role]=m;
  if(role==='dirq'){const tr=pick(Object.keys(DIR));c.staff.dir={name:m.name,trait:tr}}
  const mine=c.id===S.user;mq({k:'vor',cid:c.id,role:roleLbl(role,c),old:old?old.name:null,nw:m.name});
  if(mine){addNews('board',`Aufsichtsrat: neuer ${roleLbl(role)}`,`${old?esc(old.name)+' muss gehen – '+esc(why)+'. ':''}Der Aufsichtsrat beruft <b>${esc(m.name)}</b> (${m.age} J., Qualität ${m.q}${role==='dirq'?', '+DIR[c.staff.dir.trait].label:''}).`);
    if(role==='dirq'){orgOf(c).rel=45;const B=boardOf();B.trust=clamp(B.trust-6,0,100);if(B.trust<38&&rnd()<.45)return boardFire(`Der neue ${roleLbl('dirq')} ${m.name} setzt auf einen eigenen Trainer.`)}}
  else if(!quiet&&c.league===userClub().league)addNews('coach',`${c.short}: neuer ${roleLbl(role,c)}`,`${old?esc(old.name)+' muss gehen. ':''}Nachfolger: ${esc(m.name)}.`);
  if(!mine&&role==='dirq'&&rnd()<.25)fireCoach(c,`der neue Sportdirektor ${m.name} will einen eigenen Trainer`);
}
function orgSeasonEnd(){
  for(const c of S.clubs){if(c.guest||!league(c))continue;const cr=crewOf(c);orgOf(c);
    for(const role of VOR_ROLES){const m=cr[role];
      if(!m){vorReplace(c,role,'Stelle war vakant',true);continue}
      const perf=vorPerf(c,role),pr=clamp(.06-perf*.18+(m.q<8?.1:0)+(m.age>=66?.5:0),0,.85);
      if(rnd()<pr)vorReplace(c,role,perf<-.5?'die Bilanz stimmt nicht':m.age>=66?'Ruhestand':'der Aufsichtsrat will einen Neuanfang');
      else if(m.until<=S.season){m.until=S.season+2+(perf>.5?1:0);if(c.id===S.user)addNews('board',`Aufsichtsrat verlängert mit ${m.name}`,`${roleLbl(role)} ${esc(m.name)} bleibt bis ${contractEnd({club:1,until:m.until})}.`)}
      if(S.fired)return;
    }
    // Geschäftsstelle: Vorstand ersetzt auslaufende Verträge selbst
    for(const role of OFFICE_ROLES){const m=cr[role];if(!m||m.until<S.season){cr[role]=crewPerson(c,role,clamp(Math.round(crewLevel(c)+(rnd()-.5)*6),1,20));cr[role].until=S.season+2;cr[role].since=S.season;
      if(c.id===S.user)addNews('board',`Vorstand besetzt: ${CREW[role].lbl}`,`${m?esc(m.name)+' hört auf. ':''}Neu: <b>${esc(cr[role].name)}</b> (Qualität ${cr[role].q}).`)}}
  }
}
// Anträge auf Personalwechsel im Vorstand / der Geschäftsstelle – entschieden in der Aufsichtsratssitzung
function orgPersonnel(lines){
  const u=userClub(),cr=crewOf(u),B=boardOf();
  for(const r of (S.orgReq||[]).filter(r=>r.st==='open')){const m=cr[r.role];r.st='done';if(!m)continue;
    const perf=isVorRole(r.role)?vorPerf({...u,lastRank:rankOf(u.id)},r.role):0,p=clamp(.12+(B.trust-50)/70+(10-m.q)/15-perf*.15,.04,.85);
    if(r.role==='dirq')relAdd(-8);
    if(rnd()<p){lines.push(`Antrag des Trainers: ${roleLbl(r.role)} ${m.name} abberufen – <b>angenommen</b>.`);
      if(isVorRole(r.role))vorReplace(u,r.role,'auf Anregung des Trainers');else{cr[r.role]=crewPerson(u,r.role,clamp(Math.round(crewLevel(u)+(rnd()-.3)*6),1,20));cr[r.role].until=S.season+2;cr[r.role].since=S.season;addNews('board',`Neu: ${CREW[r.role].lbl}`,`${esc(cr[r.role].name)} ersetzt ${esc(m.name)}.`)}
      if(S.fired)return}
    else{lines.push(`Antrag des Trainers: ${roleLbl(r.role)} ${m.name} abberufen – <b>abgelehnt</b>.`);B.trust=clamp(B.trust-3,0,100);
      addNews('board',`Aufsichtsrat hält an ${m.name} fest`,`Deine Anregung, ${esc(m.name)} (${roleLbl(r.role)}) abzuberufen, wurde abgelehnt.${r.role==='dirq'?' Er weiß davon – euer Verhältnis hat gelitten.':''}`)}
  }
}

/* ---------- Oberfläche: Aufgabenverteilung ---------- */
function renderTasks(){
  const u=userClub(),O=orgOf(u),M=ORG_MODEL[O.model];
  const rows=Object.entries(TASKS).map(([k,T])=>{const r=O.tasks[k],m=r==='coach'?null:crewOf(u)[r],req=(S.taskReq||[]).find(x=>x.task===k&&x.st==='open');
    const who=r==='coach'?'<b>Du</b> (Cheftrainer)':m?`<b>${esc(m.name)}</b> · ${roleLbl(r)} <span class="stars">${stars(m.q)}</span>`:`<span class="bad">${roleLbl(r)} – unbesetzt</span>`;
    const alt=T.opts.filter(o=>o!==r);
    return `<div class="crow task"><span>${T.ic} <b>${T.lbl}</b><small>${T.d}</small><small>${req?`⏳ Änderung beantragt: ${roleLbl(req.to)} – Entscheidung des Vorstands nächste Woche`:''}</small></span>
      <span style="text-align:right">${who}${alt.length&&!req&&k!=='team'?`<br><select data-chg="taskReq" data-task="${k}" style="margin-top:4px"><option value="">Änderung beantragen …</option>${alt.map(o=>`<option value="${o}">→ ${o==='coach'?'mir (Trainer)':roleLbl(o)}</option>`).join('')}</select>`:''}</span></div>`}).join('');
  return `<div class="card" style="grid-column:1/-1"><h3>Geschäftsverteilung · ${M.lbl}</h3><p class="small muted">${M.d} Die Struktur legt der Verein fest – du kannst beim Vorstand eine Änderung beantragen. Je höher das Vertrauen, desto eher stimmt er zu.</p>
    <div class="clist">${rows}</div>
    <div class="row" style="margin-top:10px;gap:16px"><div style="flex:1;min-width:220px">${meter('Verhältnis zu '+sdName(),rel())}<div class="small muted">${relLbl(rel())} – wächst, wenn ihr an einem Strang zieht, leidet bei Vetos und Machtkämpfen.</div></div></div></div>`;
}

/* ---------- Oberfläche: Kaderplanung (Transfers) ---------- */
function orgPlanPage(){
  const u=userClub(),dele=!mayDo('buy');
  const head=`<div class="card"><div class="row" style="justify-content:space-between;gap:10px"><div><h3 style="margin:0">Kaderplanung</h3><div class="small muted">Transfers: <b>${esc(ownerName('buy'))}</b> · Verkäufe: <b>${esc(ownerName('sell'))}</b> · Verträge: <b>${esc(ownerName('ctr'))}</b> · Finanzen: <b>${esc(ownerName('fin'))}</b></div></div>
    <div class="small">Transferbudget <b>${money(u.tBudget)}</b> · Gehälter ${money(mon(wageBill(u)))} / ${money(mon(u.wBudget))}</div></div>
    ${dele?`<p class="small muted" style="margin:8px 0 0">Du meldest Bedarf und Wünsche, ${esc(sdName())} (${DIR[u.staff.dir.trait].label}) entscheidet mit Vorstand und Aufsichtsrat. Große Transfers (über ${money(arLimit(u))}) braucht die Zustimmung des Aufsichtsrats.</p>`:`<p class="small muted" style="margin:8px 0 0">In deinem Verein bist du als Teammanager selbst für Transfers zuständig – nutze den Transfermarkt und den Verhandlungsraum.</p>`}</div>`;
  if(!dele&&mayDo('ctr')&&mayDo('sell'))return head;
  const props=sdPropCards();
  const W=wishes().filter(w=>w.season===S.season||['open','neg'].includes(w.st)).slice().reverse();

  const wl=W.map(w=>{const p=S.players[w.pid];if(!p)return '';return `<div class="crow"><span><a class="click" data-act="player" data-id="${p.id}" style="cursor:pointer"><b>${esc(fullname(p))}</b></a> ${ovrTag(ovr(p))}<small>${p.pos} · ${p.age} J. · ${p.club!==null?esc(club(p.club).name):'vereinslos'} · ${w.kind==='loan'?'Leihe':'Kauf'} · Priorität ${['','hoch','mittel','niedrig'][w.prio]}${w.src!=='coach'?' · Idee des Sportdirektors':''}</small></span>
    <span style="text-align:right"><b class="${w.st==='done'?'good':['no','fail'].includes(w.st)?'bad':''}">${wishStatus(w)}</b>${w.st==='open'?`<br><button class="btn sm" data-act="wishDel" data-v="${w.id}">Zurückziehen</button>`:''}</span></div>`}).join('');
  const needs=(S.needs||[]).filter(n=>n.season===S.season);
  const needForm=`<div class="row" style="gap:6px;margin-top:8px"><select data-chg="needPos"><option value="">Position wählen …</option>${POS_LIST.map(p=>`<option value="${p}">${POS_LABEL[p]}</option>`).join('')}</select>${[1,2,3].map(pr=>`<button class="btn sm" data-act="needAdd" data-v="${pr}">${['','Dringend','Wichtig','Wenn möglich'][pr]}</button>`).join('')}</div>`;
  const needL=needs.map(n=>`<span class="pill">${n.pos} · ${['','dringend','wichtig','optional'][n.prio]} · ${n.st==='open'?'offen':'Vorschlag gemacht'}</span>`).join(' ');
  const ctr=squadOf(u).filter(p=>!p.loan&&p.until<=S.season+(S.week>=S.weeks*.6?1:0)).sort((a,b)=>a.until-b.until||ovr(b)-ovr(a)).map(p=>`<div class="crow orgr"><span><a class="click" data-act="player" data-id="${p.id}" style="cursor:pointer"><b>${esc(fullname(p))}</b></a> ${ovrTag(ovr(p))}<small>${p.pos} · ${p.age} J. · Vertrag bis ${contractEnd(p)} · ${ROLES[p.role].label}${p.ctS===S.season&&p.ctTry?` · ${p.ctTry>=3?'<span class="bad">will nicht verlängern</span>':'Gespräche laufen ('+p.ctTry+'/3)'}`:''}</small></span>
    <span class="seg sm">${Object.entries(REC).map(([k,l])=>`<button class="${p.rec===k?'on':''}" data-act="recSet" data-id="${p.id}" data-v="${k}">${l}</button>`).join('')}</span></div>`).join('');
  const offers=S.offers.map(o=>{const p=S.players[o.pid],c=club(o.from);if(!p||!c)return '';return `<div class="crow orgr"><span><b>${esc(fullname(p))}</b> ${ovrTag(ovr(p))}<small>${esc(c.name)}: ${o.loan?loanText(o.loan):bidText(o.bid||{fee:o.fee})} · Marktwert ${money(p.val)}</small></span><span class="seg sm"><button class="${o.rec==='yes'?'on':''}" data-act="offerRec" data-id="${o.id}" data-v="yes">Verkaufen</button><button class="${o.rec==='no'?'on':''}" data-act="offerRec" data-id="${o.id}" data-v="no">Behalten</button></span></div>`}).join('');
  const nfs=squadOf(u).filter(p=>p.nfs||p.listed).map(p=>`<span class="pill">${p.nfs?'🔒':'🏷️'} ${esc(pname(p))}</span>`).join(' ');
  return head+`<div class="grid g2" style="margin-top:12px">
    ${dele?`<div class="card"><h3>Vorschläge des Sportdirektors</h3>${props||'<p class="small muted">Aktuell keine Vorschläge.</p>'}
      <h3 style="margin-top:14px">Bedarf melden</h3><p class="small muted">Sag ${esc(sdName())}, wo du Verstärkung brauchst – er sucht passende Spieler und legt sie dir vor.</p>${needForm}<div style="margin-top:6px">${needL}</div></div>
    <div class="card"><h3>Deine Wunschliste</h3><p class="small muted">Wunschspieler setzt du im Spielerprofil auf die Liste. ${esc(sdName())} prüft sie im Transferfenster – Priorität „hoch“ zuerst.</p><div class="clist">${wl||'<p class="small muted">Noch keine Wünsche.</p>'}</div></div>`:''}
    ${!mayDo('ctr')?`<div class="card" style="grid-column:1/-1"><h3>Vertragsempfehlungen</h3><p class="small muted">Die Gespräche führt ${esc(ownerName('ctr'))}. Deine Empfehlung bestimmt die Reihenfolge – entscheiden tut er.</p><div class="clist">${ctr||'<p class="small muted">Keine auslaufenden Verträge.</p>'}</div></div>`:''}
    ${!mayDo('sell')?`<div class="card"><h3>Angebote für deine Spieler</h3><p class="small muted">${esc(ownerName('sell'))} entscheidet innerhalb einer Woche. Deine Empfehlung zählt – ein Veto kann er aber übergehen.</p><div class="clist">${offers||'<p class="small muted">Keine offenen Angebote.</p>'}</div>
      <h3 style="margin-top:14px">Freigegeben / unverkäuflich</h3><div>${nfs||'<span class="small muted">Im Spielerprofil markierst du Spieler als „zum Verkauf freigegeben“ oder „unverkäuflich“.</span>'}</div></div>`:''}
  </div>`;
}
// Spielerprofil: Aktionen, wenn der Trainer nicht zuständig ist
function sdPropCards(){
  return (S.sdprop||[]).filter(x=>x.st==='open').map(x=>{const p=S.players[x.pid];if(!p)return '';return `<div class="news t-offer"><b>💡 ${esc(sdName())} schlägt vor:</b> <a class="click" data-act="player" data-id="${p.id}" style="text-decoration:underline;cursor:pointer">${esc(fullname(p))}</a> ${ovrTag(ovr(p))} · ${p.pos} · ${p.age} J. · ${p.club!==null?esc(club(p.club).name):'vereinslos'} · Marktwert ${money(p.val)}${x.src==='need'?' <span class="small muted">(für deinen Bedarf)</span>':''}
    <div class="row" style="margin-top:6px"><button class="btn sm pri" data-act="sdYes" data-v="${x.id}">👍 Einverstanden</button><button class="btn sm" data-act="sdNo" data-v="${x.id}">👎 Nicht mein Spieler</button></div></div>`}).join('');
}
function orgHome(){return S&&S.user!==null&&!mayDo('buy')?sdPropCards():''}
function orgActions(p,mine,orig){
  if(mine){
    if(mayDo('ctr')&&mayDo('sell'))return orig;
    const ctr=mayDo('ctr')?`<button class="btn pri" data-act="negOpen" data-id="${p.id}" data-mode="extend">✍️ Vertrag anpassen / verlängern</button>`:`<span class="small muted">Vertragsempfehlung an ${esc(ownerName('ctr'))}:</span><span class="seg sm">${Object.entries(REC).map(([k,l])=>`<button class="${p.rec===k?'on':''}" data-act="recSet" data-id="${p.id}" data-v="${k}">${l}</button>`).join('')}</span>`;
    const sell=mayDo('sell')?`<button class="btn" data-act="listToggle" data-id="${p.id}">${p.listed?'Von Transferliste nehmen':'🏷️ Auf Transferliste'}</button><button class="btn warn" data-act="release" data-id="${p.id}">Freistellen</button>`
      :`<button class="btn ${p.listed?'pri':''}" data-act="listToggle" data-id="${p.id}">${p.listed?'✓ Zum Verkauf freigegeben':'🏷️ Zum Verkauf freigeben'}</button><button class="btn ${p.nfs?'pri':''}" data-act="nfsToggle" data-id="${p.id}">${p.nfs?'🔒 Unverkäuflich (dein Veto)':'🔒 Als unverkäuflich markieren'}</button><button class="btn warn" data-act="relReq" data-id="${p.id}">Freistellung beantragen</button>`;
    return `<div class="row">${ctr}</div><div class="row" style="margin-top:8px">${sell}</div>`;
  }
  if(mayDo('buy'))return orig;
  const w=wishOf(p.id),D=userDeal(p.id);if(D)return orig;
  return `<div class="clist"><h3>Kaderplanung</h3><p class="small muted">Transfers verantwortet ${esc(ownerName('buy'))}. Du kannst ihn auf die Wunschliste setzen – ${esc(sdName())} prüft, verhandelt und holt die Freigaben ein.</p>
    ${w?`<div class="small" style="margin-bottom:6px">Auf deiner Wunschliste: <b>${wishStatus(w)}</b> · Priorität ${['','hoch','mittel','niedrig'][w.prio]}</div>`:''}
    <div class="row">${[1,2,3].map(pr=>`<button class="btn ${w&&w.prio===pr?'pri':''}" data-act="wishAdd" data-id="${p.id}" data-v="${pr}">⭐ ${['','Hohe','Mittlere','Niedrige'][pr]} Priorität</button>`).join('')}${p.club!==null?`<button class="btn" data-act="wishLoan" data-id="${p.id}">🔁 Als Leihe wünschen</button>`:''}</div></div>`;
}
function orgOfferBtns(o,orig){
  if(mayDo('sell'))return orig;
  return `<div class="row" style="margin-top:6px"><span class="small muted">Entscheidung: ${esc(ownerName('sell'))} · deine Empfehlung:</span><span class="seg sm"><button class="${o.rec==='yes'?'on':''}" data-act="offerRec" data-id="${o.id}" data-v="yes">Verkaufen</button><button class="${o.rec==='no'?'on':''}" data-act="offerRec" data-id="${o.id}" data-v="no">Behalten</button></span></div>`;
}
function orgReqBtn(role){const open=(S.orgReq||[]).some(r=>r.role===role&&r.st==='open');return open?'<span class="small muted">⏳ Wechsel angeregt – Entscheidung in der nächsten Aufsichtsratssitzung</span>':`<button class="btn sm" data-act="orgReq" data-v="${role}">Wechsel ${isVorRole(role)?'beim Aufsichtsrat':'beim Vorstand'} anregen</button>`}

/* ---------- Aktionen ---------- */
const DENY=t=>toast(t);
function pidOf(id){const p=S.players[id];return p?p.id:id}
(function(){
  const wrap=(name,task,fn)=>{const orig=ACT[name];ACT[name]=d=>{if(S&&S.user!==null&&!mayDo(task))return fn(d,orig);return orig(d)}};
  const who=t=>`${ownerName(t)} (${roleLbl(owner(t))})`;
  for(const n of ['bidOpen','inqOpen','vrOpen','bidTake','bidSubmit'])wrap(n,'buy',()=>DENY(`Transfers verantwortet ${who('buy')} – setz den Spieler auf deine Wunschliste.`));
  wrap('loanOpen','loan',d=>{addWish(pidOf(d.id),2,'loan');save();toast('Leihwunsch an '+ownerName('loan'));render()});
  {const orig=ACT.negOpen;ACT.negOpen=d=>{if(S&&S.user!==null){const p=S.players[d.id];
    if(d.mode==='extend'&&!mayDo('ctr'))return DENY(`Vertragsgespräche führt ${who('ctr')} – gib eine Empfehlung ab.`);
    if(d.mode!=='extend'&&!mayDo('buy')&&!userDeal(p.id))return DENY(`Transfers verantwortet ${who('buy')} – setz den Spieler auf deine Wunschliste.`)}
    return orig(d)}}
  for(const n of ['offerYes','offerNo'])wrap(n,'sell',d=>{const o=S.offers.find(x=>x.id===d.id);if(o)o.rec=n==='offerYes'?'yes':'no';save();toast('Empfehlung an '+ownerName('sell'));render()});
  for(const n of ['bidCounter','uinqAns','uinqPrice','uinqSend'])wrap(n,'sell',()=>DENY(`Das entscheidet ${who('sell')}.`));
  wrap('release','sell',d=>{S.relReq=S.relReq||[];if(!S.relReq.some(r=>r.pid===pidOf(d.id)&&r.st==='open'))S.relReq.push({pid:pidOf(d.id),w:S.week,st:'open'});save();toast('Antrag gestellt – Entscheidung nächste Woche');render()});
  wrap('shift','fin',(d,orig)=>{const B=boardOf();if(B.trust<45&&rnd()<.6)return DENY(`${ownerName('fin')} lehnt die Umschichtung ab.`);return orig(d)});
  for(const n of ['crewTake','crewFire','crewExt','crewHire']){const orig=ACT[n];ACT[n]=d=>{const role=d.role||d.v;
    if(S&&S.user!==null&&(isVorRole(role)||isOfficeRole(role)))return DENY(isVorRole(role)?'Den Vorstand bestellt der Aufsichtsrat.':'Die Geschäftsstelle besetzt der Vorstand.');
    if(S&&S.user!==null&&!mayDo('staff')&&n!=='crewHire'){const R=mkRng(hashStr(n+role+S.season+':'+S.week)),ok=R()<clamp(.45+(rel()-50)/80+(boardOf().trust-50)/120,.1,.95);
      if(!ok){relAdd(-1);addNews('board',`${sdName()} lehnt ab`,`Dein Personalwunsch (${CREW[role].lbl}) wurde nicht genehmigt.`);save();return DENY(`${sdName()} genehmigt das nicht.`)}}
    return orig(d)}}
})();
Object.assign(ACT,{
  wishAdd:d=>{const w=addWish(pidOf(d.id),+d.v,'buy');save();toast(`Auf der Wunschliste (Priorität ${['','hoch','mittel','niedrig'][w.prio]})`);render()},
  wishLoan:d=>{addWish(pidOf(d.id),2,'loan');save();toast('Leihwunsch an '+ownerName('loan'));render()},
  wishDel:d=>{const w=wishes().find(x=>x.id===d.v);if(w&&w.st==='open')S.wish=wishes().filter(x=>x!==w);save();render()},
  needAdd:d=>{if(!UI.needPos)return toast('Erst eine Position wählen');S.needs=(S.needs||[]).filter(n=>!(n.pos===UI.needPos&&n.season===S.season));S.needs.push({pos:UI.needPos,prio:+d.v,season:S.season,w:S.week,st:'open'});save();toast(`Bedarf gemeldet: ${UI.needPos}`);render()},
  sdYes:d=>{sdPropAnswer(d.v,true);save();render()},
  sdNo:d=>{sdPropAnswer(d.v,false);save();render()},
  recSet:d=>{const p=S.players[d.id];p.rec=p.rec===d.v?null:d.v;save();render()},
  offerRec:d=>{const o=S.offers.find(x=>x.id===d.id);if(o)o.rec=o.rec===d.v?null:d.v;save();render()},
  nfsToggle:d=>{const p=S.players[d.id];p.nfs=!p.nfs;if(p.nfs)p.listed=false;save();render()},
  relReq:d=>ACT.release(d),
  orgReq:d=>{S.orgReq=S.orgReq||[];if(!S.orgReq.some(r=>r.role===d.v&&r.st==='open'))S.orgReq.push({role:d.v,w:S.week,st:'open'});save();toast('Angeregt – Entscheidung in der nächsten Aufsichtsratssitzung');render()}
});
Object.assign(CHG,{
  taskReq:el=>{const v=el.value;if(!v)return;S.taskReq=S.taskReq||[];S.taskReq.push({task:el.dataset.task,to:v,w:S.week,st:'open'});save();toast('Antrag beim Vorstand gestellt');render()},
  needPos:el=>{UI.needPos=el.value}
});
