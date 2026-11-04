/* =====================================================================
   Seitenlinie – Anbahnung (Anfragen bei Verein & Berater) und Leihgeschäfte
   ===================================================================== */
const WS_OPTS=[0,25,50,75,100];
/* Leihdauer: 'half' = bis zur Winterpause (nur im Sommer), '1' = bis Saisonende, '2' = bis Ende der nächsten Saison */
function loanDurOpts(p){
  const winter=S.week>=winterStart(),o=[];
  if(!winter)o.push(['half','6 Monate (bis Winterpause)']);
  o.push(['1',winter?'Rest der Saison (ca. 6 Monate)':'1 Saison']);
  if(!p||p.until>=S.season+1)o.push(['2',winter?'1½ Jahre':'2 Saisons']);
  return o;
}
function loanWeeks(dur){const ws=winterStart();return dur==='half'?Math.max(2,ws-S.week):dur==='2'?Math.max(4,S.weeks-S.week)+S.weeks:Math.max(4,S.weeks-S.week)}
function loanDurFactor(dur){return dur==='half'?.55:dur==='2'?1.8:1}
function loanEndIso(L){return L.half?gameDateFor(L.until,winterStart()):`${L.until+1}-06-30`}
function gameDateFor(season,week){const d=new Date(Date.UTC(season,6,15));d.setUTCDate(d.getUTCDate()+Math.round(week*320/Math.max(S.weeks,1)));return d.toISOString().slice(0,10)}
function loanEndText(L){return L.half?'bis zur Winterpause ('+fmtDate(loanEndIso(L))+')':'bis 30.06.'+(L.until+1)}
function durText(dur){const winter=S.week>=winterStart();return dur==='half'?'bis zur Winterpause':dur==='2'?(winter?'1½ Jahre (bis 30.06.'+(S.season+2)+')':'2 Saisons (bis 30.06.'+(S.season+2)+')'):(winter?'bis Saisonende (ca. 6 Monate)':'bis Saisonende')}
const ROLE_RANK=r=>ROLE_ORDER.indexOf(r); // 0 = Schlüsselspieler … 4 = Perspektive
function windowSoon(){const ws=winterStart();return (S.week>=ws-2&&S.week<ws)||S.week>=S.weeks-3}
function windowLabel(){if(isWindow())return 'jetzt';if(S.week<winterStart())return 'im Winterfenster (ab Woche '+(winterStart()+1)+')';return 'im Sommerfenster'}

/* ---------- Leihgeschäfte ----------
   p.loan = {from, to, ws (Anteil Gehalt, den der Leihverein zahlt), fee, opt (Kaufoption), obl (Kaufpflicht), until, since, buy} */
function loanedOut(c){return (c.lout||[]).map(id=>S.players[id]).filter(p=>p&&p.loan&&p.loan.from===c.id)}
function loanAvailable(p){
  if(p.club===null||p.loan)return {ok:false,why:p.loan?'ist bereits ausgeliehen':'ist vereinslos'};
  const s=club(p.club),r=p.role;
  if(r==='schluessel'||r==='stamm')return {ok:false,why:`ist bei ${esc(s.name)} fest eingeplant`};
  if(r==='rotation'&&p.age>23)return {ok:false,why:`wird bei ${esc(s.name)} als Rotationsspieler gebraucht`};
  if(s.players.length<=21)return {ok:false,why:`wird gebraucht – der Kader von ${esc(s.name)} ist zu klein`};
  return {ok:true};
}
// Was der Stammverein bei einer Leihe erwartet
function loanTarget(p,borrower,dur){
  const young=p.age<=23,role=suggestRole(p,borrower),play=ROLE_RANK(role)<=2;
  return {fee:nice(Math.max(p.val*(young?.03:.07),2e4)*loanDurFactor(dur||'1')),ws:young?50:75,needPlay:young,play,role,opt:nice(sellerTarget(p)*1.05)};
}
function loanValue(p,t,borrower){
  const dur=t.dur||'1',L=loanTarget(p,borrower,dur),weeks=loanWeeks(dur);
  let v=(t.fee||0)+(t.ws||0)/100*p.wage*weeks+(t.opt?(t.obl?t.opt*.9:Math.min(t.opt,L.opt)*.15):0);
  if(L.needPlay&&L.play)v+=p.val*.04;
  return {v,need:L.fee+L.ws/100*p.wage*weeks+(L.needPlay&&L.play?p.val*.04:0),L};
}
function sellerJudgeLoan(p,t,borrower){
  const s=club(p.club),av=loanAvailable(p);if(!av.ok)return {res:'no',msg:`${esc(s.name)} lehnt eine Leihe ab – er ${av.why}.`};
  if(t.dur==='2'&&p.until<S.season+1)return {res:'no',msg:`${esc(s.name)} kann ihn nicht für zwei Jahre verleihen – sein Vertrag läuft vorher aus.`};
  if(t.dur==='2'&&p.age>=27&&rnd()<.5)return {res:'counter',terms:{...t,dur:'1'},msg:`${esc(s.name)} will ihn höchstens bis Saisonende verleihen.`};
  const {v,need,L}=loanValue(p,t,borrower);
  if(L.needPlay&&!L.play)return {res:'no',msg:`${esc(s.name)} verleiht ${esc(pname(p))} nur, wenn er regelmäßig spielt – bei ${esc(borrower.name)} wäre er nur ${ROLES[L.role].label}.`};
  if(t.opt&&t.opt<L.opt*.8)return {res:'counter',terms:{...t,opt:L.opt},msg:`${esc(s.name)} ist zu einer Leihe bereit, aber nicht mit einer so niedrigen Kaufoption. Ihr Vorschlag: Kaufoption ${money(L.opt)}.`};
  if(v>=need*.95)return {res:'yes'};
  if(v<need*.4)return {res:'no',msg:`${esc(s.name)} lehnt ab – die Leihkonditionen sind viel zu schlecht.`};
  const nt={...t,ws:Math.max(t.ws||0,L.ws)};const v2=loanValue(p,nt,borrower).v;if(v2<need)nt.fee=nice((nt.fee||0)+(need-v2));
  return {res:'counter',terms:nt,msg:`${esc(s.name)} macht einen Gegenvorschlag: ${loanText(nt)}.`};
}
function loanText(t){const x=[`Leihgebühr ${t.fee?money(t.fee):'keine'}`,`${String(t.ws||0).replace('.',',')} % Gehaltsübernahme`];if(t.opt)x.push(`${t.obl?'Kaufpflicht':'Kaufoption'} ${money(t.opt)}`);x.push(durText(t.dur||'1'));return x.join(' · ')}
function executeLoan(p,borrower,t){
  const parent=club(p.club);if(!parent||p.loan)return;
  closeRow(p);
  parent.players=parent.players.filter(x=>x!==p.id);parent.lineup=parent.lineup.map(x=>x===p.id?null:x);(parent.lout=parent.lout||[]).push(p.id);
  borrower.players.push(p.id);p.club=borrower.id;
  p.loan={from:parent.id,to:borrower.id,ws:(t.ws||0)/100,fee:t.fee||0,opt:t.opt||0,obl:!!t.obl,until:S.season+(t.dur==='2'?1:0),half:t.dur==='half'?1:0,since:S.season,w:S.week,role0:p.role};
  p.role=suggestRole(p,borrower);p.mor=clamp(p.mor+5,15,100);p.listed=false;
  const fee=t.fee||0;borrower.budget-=fee;borrower.tBudget=Math.max(0,(borrower.tBudget||0)-fee);parent.budget+=fee;
  if(borrower.id===S.user)S.fin.tIn+=fee;if(parent.id===S.user)S.fin.tOut+=fee;
  S.transfers.unshift({season:S.season,w:S.week,fid:parent.id,tid:borrower.id,pid:p.id,name:fullname(p),pos:p.pos,age:p.age,o:ovr(p),from:parent.name,to:borrower.name,fee,nat:p.nat,loan:1,det:loanText(t)});
  if(S.transfers.length>800)S.transfers.length=800;
  if(parent.id!==S.user)autoLineup(parent);if(borrower.id!==S.user)autoLineup(borrower);
  tn(parent.league===userClub().league||borrower.league===userClub().league||parent.id===S.user||borrower.id===S.user,[parent.id,borrower.id],'transfer',`Leihe: ${fullname(p)} zu ${esc(borrower.short)}`,`${esc(pname(p))} wechselt auf Leihbasis von ${esc(parent.name)} zu ${esc(borrower.name)} (${loanText(t)}).`);
}
// Rückkehr zum Stammverein (am Saisonende, Karrierezeilen sind dann schon abgeschlossen)
function endLoan(p,closeRows){
  const L=p.loan;if(!L)return;const b=club(L.to),parent=club(L.from);
  if(closeRows)closeRow(p);
  if(b){b.players=b.players.filter(x=>x!==p.id);b.lineup=b.lineup.map(x=>x===p.id?null:x)}
  if(parent){parent.lout=(parent.lout||[]).filter(x=>x!==p.id);parent.players.push(p.id);p.club=parent.id;p.role=suggestRole(p,parent)}
  delete p.loan;
}
// mid = Leihen, die zur Winterpause enden
function processLoanEnds(mid){
  const news=[];
  for(const p of Object.values(S.players)){
    const L=p.loan;if(!L||L.until>S.season)continue;if(mid?!L.half:false)continue;const b=club(L.to),parent=club(L.from);
    let buy=L.obl||L.buy;
    if(!buy&&L.opt&&b&&b.id!==S.user){buy=ovr(p)>=clubAvg(b)-3&&b.budget>L.opt*1.2&&rnd()<.75}
    endLoan(p,!!mid);
    if(buy&&b&&parent&&b.budget>=L.opt*(L.obl?0:1)){
      executeDeal(p,b,{fee:L.opt},{wage:p.wage,until:Math.max(p.until,S.season+2),role:suggestRole(p,b)});if(b.id===S.user)materializeContract(p);
      tn(b.league===userClub().league||parent.league===userClub().league||b.id===S.user||parent.id===S.user,[b.id,parent.id],'transfer',`${L.obl?'Kaufpflicht':'Kaufoption'} gezogen: ${fullname(p)}`,`${esc(b.name)} übernimmt ${esc(pname(p))} fest für ${money(L.opt)} von ${esc(parent.name)}.`);
    }else if(b&&(b.id===S.user||parent.id===S.user))news.push(`${esc(fullname(p))} (zurück zu ${esc(parent.name)})`);
  }
  if(news.length)addNews('transfer','Leihen beendet',`${mid?'Zur Winterpause':'Zum Saisonende'} kehren zurück: ${news.join(', ')}.`);
  for(const c of S.clubs)if(c.lout)c.lout=c.lout.filter(id=>S.players[id]&&S.players[id].loan);
}

/* ---------- Anfragen: erst vorfühlen, dann bieten ----------
   inq = {id, pid, by (anfragender Verein), club, to:'club'|'agent'|'both', kind:'buy'|'loan'|'both', w, dec, when, st, res:{club:{…}, agent:{…}}} */
function inqFor(pid,by){return (S.inq||[]).filter(x=>x.pid===pid&&x.by===by).sort((a,b)=>(b.season*100+b.w)-(a.season*100+a.w))[0]||null}
function inqFresh(x){return x&&(S.season*100+S.week)-(x.season*100+x.w)<=12} // gilt etwa 12 Wochen bzw. bis zum nächsten Fenster
function clubStance(p,asker,kind){
  const s=club(p.club),out={};const tgt=sellerTarget(p),repGap=s.rep-asker.rep;
  if(p.loan)return {sale:'no',loan:'no',txt:`${esc(pname(p))} ist ${loanEndText(p.loan)} an ${esc(club(p.loan.to).name)} ausgeliehen.`};
  const recent=(p.tr||[]).length&&p.tr[p.tr.length-1][0]===S.season&&p.tr[p.tr.length-1][3]===s.id;
  if(kind!=='loan'){
    if(recent){out.sale='no';out.saleTxt='Er ist gerade erst gekommen – ein Verkauf steht nicht zur Debatte.'}
    else if(s.players.length<=20){out.sale='no';out.saleTxt='Unser Kader ist zu dünn, wir geben niemanden ab.'}
    else if(p.role==='schluessel'){
      if(repGap>8||rnd()<.5){out.sale='no';out.saleTxt='Er ist unverkäuflich – wir planen fest mit ihm.'}
      else{out.sale='high';out.lo=nice(tgt*1.05);out.hi=nice(tgt*1.3);out.saleTxt='Eigentlich wollen wir ihn nicht abgeben. Nur ein sehr gutes Angebot würde uns umstimmen.'}
    }
    else if(p.role==='stamm'&&repGap>15){out.sale='no';out.saleTxt=`Wir sehen keinen Grund, ihn an ${esc(asker.name)} abzugeben.`}
    else if(p.until<=S.season){out.sale='yes';out.lo=nice(tgt*.75);out.hi=nice(tgt*.95);out.saleTxt='Sein Vertrag läuft aus – wir sind gesprächsbereit.'}
    else if(p.listed||p.role==='ergaenzung'){out.sale='yes';out.lo=nice(tgt*.8);out.hi=nice(tgt*1.0);out.saleTxt='Wir würden ihn zu einem fairen Preis abgeben.'}
    else{out.sale='talk';out.lo=nice(tgt*.95);out.hi=nice(tgt*1.15);out.saleTxt=p.role==='stamm'?'Er ist Stammspieler – billig wird das nicht.':'Wir sind offen für Gespräche.'}
  }
  if(kind!=='buy'){
    const av=loanAvailable(p),L=loanTarget(p,asker);
    if(!av.ok){out.loan='no';out.loanTxt=`Eine Leihe kommt nicht infrage – er ${av.why}.`}
    else if(L.needPlay&&!L.play){out.loan='cond';out.loanTxt=`Eine Leihe nur, wenn er bei euch regelmäßig spielt – als ${ROLES[L.role].label} reicht das nicht.`}
    else{out.loan='yes';out.lfee=L.fee;out.lws=L.ws;out.lopt=L.opt;out.loanTxt=`Leihe möglich: Leihgebühr ca. ${money(L.fee)}, mindestens ${L.ws} % Gehaltsübernahme${p.age<=23?', er muss Spielpraxis bekommen':''}. Eine Kaufoption ab etwa ${money(L.opt)} wäre denkbar.`}
  }
  return out;
}
function agentStance(p,asker,kind){
  const s=p.club!==null?club(p.club):null,A=agentOf(p),role=suggestRole(p,asker),dr=ROLE_RANK(p.role)-ROLE_RANK(role);
  const repGap=asker.rep-(s?s.rep:asker.rep-5),La=league(asker),Lp=s?league(s):null;
  let sc=.32+repGap/40+dr*.07+(at(p,'amb')-10)/40-(p.mor-60)/150+(inIntlComp(asker)?.06:0)-(s&&inIntlComp(s)&&!inIntlComp(asker)?.06:0)-A.stay;
  if(s&&asker.assoc!==s.assoc)sc-=(10-at(p,'ada'))/30;
  if(La&&Lp&&La.tier>Lp.tier)sc-=.18*(La.tier-Lp.tier);
  if(s&&p.until<=S.season)sc+=.08;
  if(kind==='loan'){sc=.35+dr*.1+(p.age<=23?.1:-.05)+(ROLE_RANK(p.role)>=3?.15:0)-A.stay}
  sc=clamp(sc,0,1);
  const lvl=sc>=.55?'hot':sc>=.35?'open':sc>=.2?'cool':'no';
  const pro=[],con=[];
  if(repGap<-15)con.push('der Verein ist ihm zu klein');if(repGap>10)pro.push('ein Schritt nach oben');
  if(La&&Lp&&La.tier>Lp.tier)con.push('er will nicht in eine niedrigere Liga');
  if(p.mor>=75&&kind!=='loan')con.push('er fühlt sich bei '+(s?esc(s.short):'seinem Verein')+' sehr wohl');if(p.mor<45)pro.push('er ist bei '+(s?esc(s.short):'seinem Verein')+' unzufrieden');
  if(dr>0)pro.push('bei euch hätte er eine größere Rolle');if(dr<0)con.push(`er wäre bei euch nur ${ROLES[role].label}`);
  if(inIntlComp(asker))pro.push('internationaler Fußball reizt ihn');else if(s&&inIntlComp(s))con.push('er spielt derzeit international');
  if(s&&p.until<=S.season)pro.push('sein Vertrag läuft aus');
  const dem=wageDemand(p,asker,role,3);
  const txt={hot:'Er ist sehr interessiert an einem Wechsel zu euch.',open:'Er ist offen für Gespräche.',cool:'Er ist skeptisch.',no:'Er hat kein Interesse.'}[lvl];
  const why=(lvl==='hot'||lvl==='open'?pro:con).slice(0,3);if(!why.length)why.push(...(lvl==='hot'||lvl==='open'?con:pro).slice(0,2));
  return {lvl,sc,txt,why,role,wlo:nice(mon(dem)*.92),whi:nice(mon(dem)*1.1),agent:A.name,loanTxt:kind!=='buy'?(ROLE_RANK(role)<=2?'Eine Leihe mit Spielpraxis könnte er sich vorstellen.':'Für eine Leihe ohne Einsatzgarantie ist er nicht zu haben.'):null};
}
function sendInquiry(p,asker,to,kind){
  S.inq=S.inq||[];const s=club(p.club);
  if((S.inq||[]).some(x=>x.pid===p.id&&x.by===asker.id&&x.st==='open'))return null;
  const R=replyDelay(to==='agent'?asker:s,p);const dec=S.week+1+(to!=='agent'&&!R.now&&R.dec>S.week+1?1:0);
  const days=to==='agent'?ri(1,3):dec>S.week+1?7+ri(1,4):ri(2,5);
  const x={id:'q'+(S.nextId++),pid:p.id,by:asker.id,club:s.id,to,kind,w:S.week,season:S.season,dec,when:addDaysIso(gameDate(),days),st:'open',res:{}};
  S.inq.push(x);if(S.inq.length>400)S.inq=S.inq.filter(y=>inqFresh(y)||y.st==='open');
  return x;
}
function answerInquiry(x){
  const p=S.players[x.pid],a=club(x.by);if(!p||!a||p.club===null){x.st='void';return}
  if(p.club!==x.club){x.st='void';if(x.by===S.user)addNews('transfer',`Anfrage hinfällig: ${fullname(p)}`,`${esc(pname(p))} spielt nicht mehr bei ${esc(club(x.club).name)}.`);return}
  if(x.to!=='agent')x.res.club=clubStance(p,a,x.kind);
  if(x.to!=='club')x.res.agent=agentStance(p,a,x.kind);
  x.st='done';x.aw=S.week;
  const s=club(x.club);
  if(x.by===S.user){
    const c=x.res.club,g=x.res.agent;let body='';
    if(c){body+=`<b>${esc(s.name)} (Sportdirektor ${esc(s.staff.dir.name)}):</b> `;if(c.saleTxt)body+=c.saleTxt+(c.lo?` Preisrahmen etwa <b>${money(c.lo)} – ${money(c.hi)}</b>.`:'');if(c.loanTxt)body+=' '+c.loanTxt;if(c.txt)body+=c.txt}
    if(g){body+=`${c?'<br>':''}<b>Berater ${esc(g.agent)}:</b> ${g.txt}${g.why.length?' ('+g.why.join(', ')+')':''}${g.lvl!=='no'&&x.kind!=='loan'?` Gehaltsvorstellung etwa <b>${money(g.wlo)} – ${money(g.whi)}</b> brutto/Monat als ${ROLES[g.role].label}.`:''}${g.loanTxt?' '+g.loanTxt:''}`}
    addNews('offer',`Antwort auf deine Anfrage: ${fullname(p)}`,body+(isWindow()?'':` <span class="muted">Angebote sind ${windowLabel()} möglich.</span>`));
  }else{
    // KI ↔ KI: kurze Ticker-Meldung
    const c=x.res.club;
    tinq([a.id,s.id],`${esc(a.short)} erkundigt sich nach ${fullname(p)}`,`${esc(a.name)} hat bei ${esc(s.name)} nachgefragt (${x.kind==='loan'?'Leihe':x.kind==='both'?'Transfer oder Leihe':'Transfer'}). ${c?(c.sale==='no'&&x.kind!=='loan'?'Antwort: nicht verkäuflich.':c.sale?'Antwort: gesprächsbereit.':c.loan==='yes'?'Antwort: Leihe möglich.':'Antwort: abgelehnt.'):''}`);
  }
}
function processInquiries(){
  for(const x of S.inq||[])if(x.st==='open'&&S.week>=x.dec&&x.club!==S.user)answerInquiry(x);
  for(const x of S.uinq||[])if(x.st==='open'&&(S.season*100+S.week)-(x.season*100+x.w)>=3){x.st='done';x.ans='none'}
}
// Anfragen zwischen KI-Vereinen landen in einer eigenen Liste, damit sie die Transfer-Meldungen nicht verdrängen
function tinq(ids,title,body){const cl=ids.map(id=>club(id)).filter(Boolean);S.tinq=S.tinq||[];S.tinq.unshift({season:S.season,w:S.week,d:gameDate(),type:'inq',title,body,lg:cl.map(x=>x.league===null?-1:x.league),as:[...new Set(cl.map(x=>x.assoc))],u:0});if(S.tinq.length>400)S.tinq.length=400}

/* ---------- KI fragt bei DIR an ---------- */
function aiAskUser(p,c,kind){
  S.uinq=S.uinq||[];if(S.uinq.some(x=>x.pid===p.id&&x.by===c.id&&(x.st==='open'||inqFresh(x))))return;
  const x={id:'u'+(S.nextId++),pid:p.id,by:c.id,kind,w:S.week,season:S.season,st:'open'};S.uinq.push(x);
  addNews('offer',`Anfrage von ${esc(c.name)}: ${fullname(p)}`,`Sportdirektor ${esc(c.staff.dir.name)} möchte wissen, ob ${esc(pname(p))} ${kind==='loan'?'ausgeliehen werden könnte':kind==='both'?'zu haben ist – als fester Transfer oder Leihe':'zu haben ist'}. Antworte im Posteingang.`);
}
function userAnswer(pid,by){return (S.uinq||[]).filter(x=>x.pid===pid&&x.by===by&&x.st==='done').sort((a,b)=>(b.season*100+b.w)-(a.season*100+a.w))[0]||null}

/* ---------- KI-Marktlogik: vorfühlen vor dem Fenster und vor dem Angebot ---------- */
// liefert true, wenn die KI jetzt erst anfragt (also noch nicht bietet)
function aiNeedsInquiry(p,c,kind){
  if(p.club===S.user){
    const open=(S.uinq||[]).find(x=>x.pid===p.id&&x.by===c.id&&x.st==='open');
    if(open){if((S.season*100+S.week)-(open.season*100+open.w)>=2){open.st='done';open.ans='none'}else return true}
    const ans=userAnswer(p.id,c.id);if(ans&&inqFresh(ans))return false;aiAskUser(p,c,kind);return true}
  const x=inqFor(p.id,c.id);if(x&&inqFresh(x)&&x.st==='done')return false;if(x&&x.st==='open')return true;
  if(isWindow()&&rnd()<.6)return false; // viele Vereine bieten auch direkt
  sendInquiry(p,c,'club',kind);return true;
}
function aiInquiryVerdict(p,c,kind){
  if(p.club===S.user){const a=userAnswer(p.id,c.id);if(!a)return {go:true};
    if(a.ans==='none')return {go:true};if(a.ans==='no')return {go:false};if(a.ans==='loan')return {go:true,loan:true};return {go:true,price:a.price||0}}
  const x=inqFor(p.id,c.id);if(!x||!x.res||!x.res.club)return {go:true};const r=x.res.club;
  if(kind==='loan')return {go:r.loan==='yes',loan:true};
  if(r.sale==='no')return {go:r.loan==='yes',loan:r.loan==='yes'};
  return {go:true,price:r.hi||0};
}
// KI-Scouting vor einem Fenster: nur Anfragen, keine Angebote
function aiPreWindow(c){
  if(!windowSoon()||rnd()>.25)return;
  const need=weakestPos(c),dir=c.staff.dir.trait;
  const cand=posIndex()[need.pos].filter(p=>p.club!==null&&p.club!==c.id&&!p.loan&&ovr(p)>=need.level+2&&!club(p.club).guest).slice(0,15);
  if(!cand.length)return;const p=pick(cand);
  const kind=dir==='jugend'&&p.age<=23&&ROLE_RANK(p.role)>=3?'loan':'buy';
  if(p.club===S.user)aiAskUser(p,c,kind);else if(!inqFor(p.id,c.id))sendInquiry(p,c,'club',kind);
}
// KI leiht aus: junge Spieler mit wenig Einsatzzeit bei größeren Vereinen
function aiLoanTry(c){
  const need=weakestPos(c),cands=posIndex()[need.pos].filter(p=>p.club!==null&&p.club!==c.id&&!p.loan&&p.age<=24&&ovr(p)>=need.level+1&&ROLE_RANK(p.role)>=3&&!club(p.club).guest&&club(p.club).rep>=c.rep).slice(0,10);
  if(!cands.length)return false;const p=pick(cands);if(activeTalk(p.id)||(S.aineg||[]).some(n=>n.pid===p.id))return false;
  if(aiNeedsInquiry(p,c,'loan'))return true;const v=aiInquiryVerdict(p,c,'loan');if(!v.go)return false;
  return aiLoanFor(p,c);
}
function aiLoanFor(p,c){
  if(!loanAvailable(p).ok)return false;
  const opts=loanDurOpts(p).map(o=>o[0]),r=rnd(),dur=opts.includes('half')&&r<.15?'half':opts.includes('2')&&r>.85&&p.age<=23?'2':'1';
  const L=loanTarget(p,c,dur),t={fee:nice(L.fee*(.8+rnd()*.4)),ws:L.ws,opt:rnd()<.35?L.opt:0,obl:false,dur};
  if(p.club===S.user){if(S.offers.some(o=>o.pid===p.id))return true;S.offers.push({id:'o'+(S.nextId++),from:c.id,pid:p.id,fee:t.fee,loan:t,w:S.week});
    addNews('offer',`Leihanfrage für ${fullname(p)}`,`${esc(c.name)} möchte ${esc(pname(p))} ausleihen: ${loanText(t)}.`);return true}
  const j=sellerJudgeLoan(p,t,c);const tt=j.res==='yes'?t:j.res==='counter'&&rnd()<.7?j.terms:null;if(!tt)return false;
  startClauseTalk(p,c,tt.fee,'loan',null,tt);return true;
}
