/* =====================================================================
   Seitenlinie – Ablöseverhandlungen zwischen Vereinen
   Ein Gebot besteht aus: fee (sofort), inst + instY (Raten über 1–3 Jahre),
   ao + aoN (Erfolgsbonus nach X Pflichtspielen), so (Weiterverkaufsbeteiligung in %).
   ===================================================================== */
const SO_OPTS=[0,10,15,20,25,30],AO_N=[10,25,50],INST_Y=[1,2,3];
/* ---------- Zahlungsplan: Ablöse sofort oder zu einem Datum, Raten mit eigenem Fälligkeitsdatum ---------- */
const PAY_MD=['08-31','12-31','01-31','06-30','07-01'];
function today(){return gameDate()}
function maxPayDate(){return addDaysIso(today(),5*365)}
function disc(d){if(!d)return 1;const days=Math.max(0,isoDays(d)-isoDays(today()));return Math.pow(.94,days/365)}
function nextDates(n,step){
  // Standardtermine: Monatsenden der Transferfenster, Jahreswechsel, Saisonwechsel
  const t=today(),y0=+t.slice(0,4),out=[];
  for(let y=y0;y<=y0+5;y++)for(const md of ['01-31','07-01'])out.push(`${y}-${md}`);
  const c=out.filter(d=>isoDays(d)-isoDays(t)>=45).sort();
  const res=[];for(let i=0;res.length<n&&i<c.length;i+=step)res.push(c[i]);return res;
}
function feeDateChips(){
  const t=today(),y0=+t.slice(0,4),c=[];for(let y=y0;y<=y0+1;y++)for(const md of PAY_MD)c.push(`${y}-${md}`);
  return [...new Set(c)].filter(d=>d>t&&isoDays(d)-isoDays(t)<=400).sort().slice(0,5);
}
function planSum(b){return (b.plan||[]).reduce((t,x)=>t+(x.amt||0),0)}
// fügt einen Betrag (Gegenwartswert) als Raten hinzu – parts Raten im Abstand von step Halbjahren
function planAdd(b,pv,parts,step){
  parts=parts||2;step=step||2;const ds=nextDates(parts,step);b.plan=(b.plan||[]).slice();
  for(const d of ds)b.plan.push({d,amt:nice(pv/parts/disc(d))});return b;
}
function bidTotal(b){return (b.fee||0)+planSum(b)+(b.inst&&!b.plan?b.inst:0)+(b.ao||0)}
function normBid(b){
  const t=today(),mx=maxPayDate();
  let plan=(b.plan||[]).map(x=>({d:x.d,amt:Math.max(0,Math.round(x.amt||0))})).filter(x=>x.amt>0&&x.d);
  if(!b.plan&&b.inst>0){const y=b.instY||2,per=b.inst/y;for(let i=1;i<=y;i++)plan.push({d:`${S.season+i}-07-01`,amt:Math.round(per)})}
  for(const x of plan){if(x.d<=t)x.d=addDaysIso(t,1);if(x.d>mx)x.d=mx}
  plan.sort((a,b)=>a.d<b.d?-1:1);
  const feeD=b.feeD&&b.feeD>t?(b.feeD>mx?mx:b.feeD):null;
  const n={fee:Math.max(0,Math.round(b.fee||0)),feeD,plan,inst:plan.reduce((s,x)=>s+x.amt,0),instY:plan.length,ao:Math.max(0,Math.round(b.ao||0)),aoN:b.aoN||25,so:b.so||0};if(!n.ao)n.aoN=25;return n;
}
function normBidOld(b){const n={fee:Math.max(0,Math.round(b.fee||0)),inst:Math.max(0,Math.round(b.inst||0)),instY:b.inst>0?(b.instY||2):0,ao:Math.max(0,Math.round(b.ao||0)),aoN:b.aoN||25,so:b.so||0};if(!n.ao)n.aoN=25;return n}
function bidText(b){
  b=b.plan||!b.inst?b:normBid(b);
  const parts=[`${money(b.fee)} ${b.feeD?'am '+fmtDate(b.feeD):'sofort'}`];
  const pl=b.plan||[];
  if(pl.length&&pl.length<=3)parts.push(...pl.map(x=>`${money(x.amt)} am ${fmtDate(x.d)}`));
  else if(pl.length)parts.push(`${money(planSum(b))} in ${pl.length} Raten (${fmtDate(pl[0].d)} bis ${fmtDate(pl[pl.length-1].d)})`);
  if(b.ao)parts.push(`${money(b.ao)} nach ${b.aoN} Pflichtspielen`);
  if(b.so)parts.push(`${b.so} % Weiterverkaufsbeteiligung`);
  return parts.join(' + ');
}
// Was der abgebende Verein für den Spieler haben will
function sellerTarget(p){
  if(p.club===null)return 0;const s=club(p.club);let t=askPrice(p);
  if(s.id!==S.user&&p.role==='schluessel')t*=1.35; // Schlüsselspieler gibt niemand gern ab
  return Math.max(t,25000);
}
// Wert eines Gebots aus Sicht des Verkäufers: Raten abgezinst, Bonus nur zur Hälfte sicher, Beteiligung als Hoffnung
function bidValue(b,p){
  b=b.plan||!b.inst?b:normBid(b);
  return (b.fee||0)*disc(b.feeD)+(b.plan||[]).reduce((t,x)=>t+x.amt*disc(x.d),0)+(b.ao||0)*.5+(b.so||0)/100*Math.max(p.val,1e5)*.35;
}
// Antwort eines KI-Verkäufers auf ein Gebot
function sellerJudge(p,b){
  const tgt=sellerTarget(p),v=bidValue(b,p),s=club(p.club);
  if(v>=tgt*.97)return {res:'yes'};
  if(v<tgt*.55)return {res:'no',msg:`${esc(s.name)} lehnt ab – das Angebot ist weit von ihren Vorstellungen entfernt.`};
  const nb=normBid({...b,fee:nice(b.fee+(tgt*1.02-v))});
  return {res:'counter',bid:nb,msg:`${esc(s.name)} macht ein Gegenangebot: ${bidText(nb)}.`};
}
function bidNow(b){return b.feeD?0:(b.fee||0)}
function bidLater(b){return (b.feeD?b.fee:0)+planSum(b)}
// Wie viel ein KI-Käufer insgesamt stemmen kann (sofort + Raten)
function aiMax(c){if(c.id===S.user)return Math.min(c.tBudget||0,Math.max(0,c.budget))*.95;const dir=c.staff.dir.trait;return Math.min(c.tBudget||0,Math.max(0,c.budget))*(dir==='star'?.9:.6)}
function aiFinance(c){const m=aiMax(c);return {now:m,inst:c.budget>0?m*1.2:0}}
function aiMakeBid(p,c,T){
  const F=aiFinance(c);let total=T*(.8+rnd()*.15)*(c.id===S.user?1-.06*ownerK('buy'):1);const b={fee:total,plan:[],ao:0,aoN:25,so:0};
  if(total>F.now){b.fee=F.now*.95;const rest=total-b.fee;if(rest>F.inst)return null;planAdd(b,rest,ri(1,4),rnd()<.5?1:2)}
  else if(rnd()<.3){b.ao=nice(total*.12);b.aoN=pick(AO_N);b.fee=total-b.ao}
  if(rnd()<.2)b.so=pick([10,15,20]);
  if(rnd()<.18){const ch=feeDateChips();if(ch.length)b.feeD=ch[0]}   // Ablöse erst zum Monatsende fällig
  b.fee=nice(b.fee);return normBid(b);
}
// Komplette Verhandlung zwischen zwei KI-Vereinen (bis zu 3 Runden)
function aiNegotiate(p,c){
  const T=sellerTarget(p),F=aiFinance(c);let b=aiMakeBid(p,c,T);if(!b)return null;
  for(let r=0;r<3;r++){
    const j=sellerJudge(p,b);if(j.res==='yes')return b;if(j.res==='no')return null;
    const nb=j.bid;
    if(nb.fee<=F.now){if(rnd()<.8)return nb;return null}
    const extra=nb.fee-F.now*.95;nb.fee=nice(F.now*.95);planAdd(nb,extra,ri(2,3),2);
    if(planSum(nb)>F.inst)return null;b=normBid(nb);
  }
  return null;
}
// Gebot eines KI-Vereins für einen deiner Spieler (mit Schmerzgrenze lim)
function aiOfferFor(p,c,price){
  const base=price?price*(.9+rnd()*.12):p.val*(p.listed?.85+rnd()*.3:1+rnd()*.5),b=aiMakeBid(p,c,base/.875);if(!b)return null;
  const F=aiFinance(c),lim=Math.min(bidValue(b,p)*(1.12+rnd()*.3),F.now+F.inst*.9);
  return {bid:b,lim:Math.max(lim,bidValue(b,p))};
}
// Gegenangebot von dir an einen KI-Käufer
function buyerReply(o,ask){
  const p=S.players[o.pid],c=club(o.from),v=bidValue(ask,p),F=aiFinance(c);
  if(v<=o.lim&&bidNow(ask)<=F.now*1.02&&bidLater(ask)<=F.inst)return {res:'yes',bid:normBid(ask)};
  o.rounds=(o.rounds||0)+1;
  if(o.rounds>=3)return {res:'no',msg:`${esc(c.name)} bricht die Verhandlungen ab – deine Forderung ist ihnen zu hoch.`};
  const cur=bidValue(o.bid,p),target=Math.min(o.lim,cur+(v-cur)*.5);
  const nb=normBid({...o.bid,fee:Math.min(nice(o.bid.fee+(target-cur)),nice(F.now))});
  if(bidValue(nb,p)<target-1)planAdd(nb,target-bidValue(nb,p),2,2)
  o.bid=normBid(nb);
  return {res:'counter',bid:o.bid,msg:`${esc(c.name)} bessert nach: ${bidText(o.bid)}.`};
}

/* ---------- Ausführung & Folgezahlungen ---------- */
function bookFin(c,amt,dir){if(c.id!==S.user||!S.fin)return;if(dir==='in')S.fin.tOut+=amt;else S.fin.tIn+=amt}
function executeDeal(p,buyer,bid,contract){
  const seller=p.club!==null?club(p.club):null,b=normBid(bid||{fee:0});
  doTransfer(p,buyer,b.fee,contract);
  if(seller){
    S.inst=S.inst||[];
    if(b.feeD&&b.fee){ // Ablöse erst später fällig: Geld fließt am Stichtag
      buyer.budget+=b.fee;seller.budget-=b.fee;if(buyer.id===S.user)S.fin.tIn-=b.fee;if(seller.id===S.user)S.fin.tOut-=b.fee;
      S.inst.push({from:buyer.id,to:seller.id,amt:b.fee,dd:b.feeD,pid:p.id,name:fullname(p),kind:'fee'})}
    for(const x of b.plan||[])S.inst.push({from:buyer.id,to:seller.id,amt:x.amt,dd:x.d,pid:p.id,name:fullname(p),kind:'rate'});
    if(b.ao)(p.ao=p.ao||[]).push({from:buyer.id,to:seller.id,need:b.aoN,amt:b.ao,n:0});
    if(b.so)(p.so=p.so||[]).push({to:seller.id,pct:b.so,since:S.season});
    const tr=S.transfers[0];if(tr&&tr.pid===p.id&&(b.plan.length||b.feeD||b.ao||b.so)){tr.fee=bidTotal(b);tr.det=bidText(b)}
  }
}
// Weiterverkaufsbeteiligungen werden beim nächsten Transfer fällig (aus doTransfer aufgerufen)
function paySellOn(p,from,to,fee){
  if(!p.so||!p.so.length||!from||fee<=0){p.so=[];p.ao=[];return}
  for(const so of p.so){const rc=club(so.to);if(!rc||rc.id===to.id)continue;const amt=fee*so.pct/100;
    from.budget-=amt;rc.budget+=amt;bookFin(from,-amt,'in');bookFin(rc,amt,'in');
    if(from.id===S.user)addNews('transfer',`Weiterverkaufsbeteiligung fällig: ${fullname(p)}`,`Von der Ablöse gehen ${so.pct} % (<b>${money(amt)}</b>) an ${esc(rc.name)}.`);
    if(rc.id===S.user)addNews('transfer',`Geldsegen: ${fullname(p)} weiterverkauft`,`${esc(from.name)} verkauft ihn für ${money(fee)} an ${esc(to.name)} – deine Weiterverkaufsbeteiligung von ${so.pct} % bringt <b>${money(amt)}</b>.`)}
  p.so=[];p.ao=[];
}
// Erfolgsbonus: nach X Pflichtspielen für den neuen Verein
function aoTick(p){
  for(const a of p.ao||[]){if(a.done||p.club!==a.from)continue;a.n++;
    if(a.n>=a.need){a.done=1;const f=club(a.from),t=club(a.to);if(!f||!t)continue;f.budget-=a.amt;t.budget+=a.amt;
      if(f.id===S.user){S.fin.tIn+=a.amt;addNews('transfer',`Erfolgsbonus fällig: ${fullname(p)}`,`Nach ${a.need} Pflichtspielen zahlst du vereinbarungsgemäß <b>${money(a.amt)}</b> an ${esc(t.name)}.`)}
      if(t.id===S.user){S.fin.tOut+=a.amt;addNews('transfer',`Erfolgsbonus erhalten: ${fullname(p)}`,`${esc(pname(p))} hat ${a.need} Pflichtspiele für ${esc(f.name)} absolviert – du erhältst <b>${money(a.amt)}</b>.`)}}}
}
// Fällige Zahlungen (Ablöse mit Stichtag und Raten) – jede Woche, sobald das Datum erreicht ist
function instDue(r){return r.dd||`${r.due}-07-15`}
function payInstallments(){
  const t=today(),keep=[];const paid=[],got=[];
  for(const r of S.inst||[]){if(instDue(r)>t){keep.push(r);continue}const f=club(r.from),tt=club(r.to);if(!f||!tt)continue;
    f.budget-=r.amt;tt.budget+=r.amt;
    if(f.id===S.user){S.fin.tIn+=r.amt;paid.push(r)}if(tt.id===S.user){S.fin.tOut+=r.amt;got.push(r)}}
  S.inst=keep;
  const line=r=>`${r.kind==='fee'?'Ablöse':'Rate'} für ${esc(r.name)}: <b>${money(r.amt)}</b> (fällig ${fmtDate(instDue(r))})`;
  if(paid.length)addNews('board','Transferzahlung überwiesen',paid.map(r=>line(r)+` an ${esc(club(r.to).name)}`).join('<br>'));
  if(got.length)addNews('board','Transferzahlung erhalten',got.map(r=>line(r)+` von ${esc(club(r.from).name)}`).join('<br>'));
}
function userInstallments(){const u=S.user;return (S.inst||[]).filter(r=>r.from===u||r.to===u)}

/* ---------- Bedenkzeit: Vereine antworten erst nach ein paar Tagen ----------
   Angebote (Kauf) und Gegenangebote (Verkauf) werden verschickt und beim nächsten
   Spieltagswechsel bzw. eine Woche später beantwortet – spätestens zum Fensterschluss. */
function replyDelay(c,p){
  let d=0;const why=[];
  if(PRES[c.staff.pres.trait].sellMul>1.05&&rnd()<.6){d++;why.push('der Präsident rechnet genau nach')}
  else if(p&&p.role==='schluessel'&&rnd()<.5){d++;why.push('es geht um einen Schlüsselspieler')}
  else if(c.rep>=85&&rnd()<.35){d++;why.push('großer Verein, lange Entscheidungswege')}
  if(S.week>=windowEnd())return {dec:S.week,days:0,when:gameDate(),why:['Deadline Day – die Antwort kommt noch heute'],now:true};
  const dec=Math.min(S.week+1+d,windowEnd());
  const days=Math.max(2,Math.round((isoDays(gameDate(dec))-isoDays(gameDate()))*.6)+ri(0,2));
  return {dec,days,when:addDaysIso(gameDate(),days),why};
}
function pendingBid(pid){return (S.pbids||[]).find(x=>x.pid===pid)}
function sendBid(p,b){
  const s=club(p.club),R=replyDelay(s,p);S.pbids=S.pbids||[];
  S.pbids.push({id:'b'+(S.nextId++),kind:'buy',pid:p.id,seller:s.id,b,w:S.week,dec:R.dec,when:R.when});
  if(S.bidRes)delete S.bidRes[p.id];
  addNews('transfer',`Angebot verschickt: ${fullname(p)}`,`Dein Angebot an ${esc(s.name)} (${bidText(b)}) liegt jetzt dort auf dem Tisch. ${R.now?'Deadline Day – die Antwort kommt noch heute.':`Eine Antwort ist in etwa ${R.days} Tagen zu erwarten (bis ${fmtDate(R.when)})${R.why.length?' – '+R.why.join(', '):''}.`}`);
  if(R.now)processBids();
  return R;
}
function sendLoanBid(p,lt){
  const s=club(p.club),R=replyDelay(s,p);S.pbids=S.pbids||[];
  S.pbids.push({id:'b'+(S.nextId++),kind:'loan',pid:p.id,seller:s.id,t:lt,w:S.week,dec:R.dec,when:R.when});
  if(S.bidRes)delete S.bidRes[p.id];
  addNews('transfer',`Leihanfrage verschickt: ${fullname(p)}`,`Dein Leihangebot an ${esc(s.name)} (${loanText(lt)}) wird geprüft. ${R.now?'Deadline Day – die Antwort kommt noch heute.':`Antwort bis ${fmtDate(R.when)}.`}`);
  if(R.now)processBids();
  return R;
}
function userLoanDeal(pid){const D=S.ldeals&&S.ldeals[pid];if(!D)return null;if(D.season!==S.season||!isWindow()||S.week>D.exp){delete S.ldeals[pid];return null}return D}
function sendCounter(o,ask){
  const c=club(o.from),R=replyDelay(c,null);S.pbids=S.pbids||[];
  S.pbids.push({id:'b'+(S.nextId++),kind:'sell',oid:o.id,pid:o.pid,buyer:c.id,b:ask,w:S.week,dec:R.dec,when:R.when});o.wait=1;
  if(R.now)processBids();
  return R;
}
function processBids(){
  const keep=[];
  for(const x of S.pbids||[]){
    if(S.week<x.dec){keep.push(x);continue}
    const p=S.players[x.pid];if(!p)continue;
    if(!isWindow()){addNews('transfer',`Keine Antwort mehr: ${fullname(p)}`,'Das Transferfenster hat geschlossen, bevor eine Einigung zustande kam.');continue}
    if(x.kind==='loan'){
      const s=club(x.seller);S.bidRes=S.bidRes||{};
      if(p.club!==x.seller){addNews('transfer',`Leihanfrage hinfällig: ${fullname(p)}`,`${esc(pname(p))} spielt nicht mehr bei ${esc(s.name)}.`);continue}
      const j=sellerJudgeLoan(p,x.t,userClub());
      if(j.res==='yes'){S.ldeals=S.ldeals||{};S.ldeals[p.id]={t:x.t,season:S.season,exp:windowEnd()};S.bidRes[p.id]={res:'loanyes',t:x.t,seller:s.id};
        addNews('offer',`✅ Leihe möglich: ${fullname(p)}`,`${esc(s.name)} stimmt der Leihe zu (${loanText(x.t)}). Jetzt muss nur noch der Spieler zustimmen.`)}
      else if(j.res==='counter'){S.bidRes[p.id]={res:'loancounter',t:j.terms,seller:s.id};addNews('offer',`Gegenvorschlag zur Leihe: ${fullname(p)}`,j.msg)}
      else{S.bidRes[p.id]={res:'no',seller:s.id};addNews('offer',`❌ Keine Leihe: ${fullname(p)}`,j.msg)}
      continue;
    }
    if(x.kind==='buy'){
      const s=club(x.seller);
      if(p.club!==x.seller){addNews('transfer',`Angebot hinfällig: ${fullname(p)}`,`${esc(pname(p))} spielt nicht mehr bei ${esc(s.name)}.`);continue}
      let j=sellerJudge(p,x.b);const k=bidKey(p.id),last=((S.btries||{})[k]||0)>=3;
      const q=inqFor(p.id,S.user);if(q&&inqFresh(q)&&q.res&&q.res.club&&q.res.club.sale==='no'&&bidValue(x.b,p)<sellerTarget(p)*1.3)j={res:'no',msg:`${esc(s.name)} verweist auf die Antwort zu deiner Anfrage: ${esc(pname(p))} ist nicht zu haben. Nur ein außergewöhnliches Angebot würde daran etwas ändern.`};
      S.bidRes=S.bidRes||{};
      if(j.res==='yes'){S.deals=S.deals||{};S.deals[p.id]={bid:x.b,season:S.season,exp:windowEnd()};S.bidRes[p.id]={res:'yes',bid:x.b,seller:s.id};
        addNews('offer',`✅ ${esc(s.name)} nimmt an: ${fullname(p)}`,`${esc(s.name)} akzeptiert dein Angebot (<b>${bidText(x.b)}</b>). Jetzt musst du dich nur noch mit dem Spieler einigen – bis zum Ende des Transferfensters.`)}
      else if(j.res==='counter'&&!last){S.bidRes[p.id]={res:'counter',bid:j.bid,seller:s.id};
        addNews('offer',`Gegenangebot von ${esc(s.name)}: ${fullname(p)}`,`${j.msg} Du kannst annehmen oder ein neues Angebot machen.`)}
      else{S.bidRes[p.id]={res:'no',seller:s.id};
        addNews('offer',`❌ ${esc(s.name)} lehnt ab: ${fullname(p)}`,j.res==='counter'?`${j.msg} Mehr Verhandlungsrunden gibt es in diesem Fenster aber nicht – sie bleiben bei ihrer Forderung. Du kannst das Gegenangebot noch annehmen.`:j.msg);
        if(j.res==='counter')S.bidRes[p.id]={res:'counter',bid:j.bid,seller:s.id,final:1}}
    }else{
      const o=S.offers.find(y=>y.id===x.oid);if(!o)continue;o.wait=0;const c=club(o.from);
      const r=buyerReply(o,x.b);
      if(r.res==='yes'){S.offers=S.offers.filter(y=>y.pid!==o.pid);startClauseTalk(p,c,r.bid.fee,'deal',r.bid);
        addNews('offer',`✅ ${esc(c.name)} akzeptiert deine Forderung: ${fullname(p)}`,`Vereinbart: <b>${bidText(r.bid)}</b>. Jetzt verhandelt ${esc(pname(p))} mit ihnen über seinen Vertrag.`)}
      else if(r.res==='no'){S.offers=S.offers.filter(y=>y.id!==o.id);addNews('offer',`❌ Verhandlungen abgebrochen: ${fullname(p)}`,r.msg)}
      else{o.fee=o.bid.fee;o.w=S.week;addNews('offer',`Neues Angebot von ${esc(c.name)}: ${fullname(p)}`,`${r.msg} Du kannst annehmen, erneut kontern oder ablehnen.`)}
    }
  }
  S.pbids=keep;
  if(!isWindow()){S.bidRes={};}
}

/* ---------- KI ↔ KI: Ablöseverhandlung mit Bedenkzeit auf beiden Seiten ---------- */
function aiNegVisible(n){return dealVisible({from:n.buyer,seller:n.seller})}
function aiBusy(c){return (S.aineg||[]).filter(n=>n.buyer===c.id).length+(S.talks||[]).filter(t=>t.from===c.id&&t.st==='open').length}
function aiStartNeg(p,c){
  S.aineg=S.aineg||[];if(S.aineg.some(n=>n.pid===p.id)||activeTalk(p.id)||aiBusy(c)>=2)return;
  const b=aiMakeBid(p,c,sellerTarget(p));if(!b)return;const s=club(p.club),R=replyDelay(s,p);
  const n={id:'n'+(S.nextId++),pid:p.id,buyer:c.id,seller:s.id,b,round:1,step:'seller',dec:R.dec,when:R.when};S.aineg.push(n);
  tn(aiNegVisible(n),[c.id,s.id],'transfer',`${esc(c.short)} bietet für ${fullname(p)}`,`${esc(c.name)} hat bei ${esc(s.name)} ein Angebot abgegeben: ${bidText(b)}. ${R.now?'Deadline Day – die Antwort kommt noch heute.':`${esc(s.name)} prüft es, Antwort bis ${fmtDate(R.when)}.`}`);
  if(R.now)aiNegStep(n);
}
function aiNegDrop(n){S.aineg=(S.aineg||[]).filter(x=>x!==n)}
function aiNegStep(n){
  for(let guard=0;guard<6&&S.week>=n.dec;guard++){
    const p=S.players[n.pid],c=club(n.buyer),s=club(n.seller),vis=aiNegVisible(n);
    if(!p||p.club!==n.seller||!c||!s)return aiNegDrop(n);
    if(!isWindow()){tn(vis,[c.id,s.id],'transfer',`Keine Einigung: ${fullname(p)}`,`${esc(c.name)} und ${esc(s.name)} sind bis zum Fensterschluss nicht zusammengekommen.`);return aiNegDrop(n)}
    if(n.step==='seller'){
      const j=sellerJudge(p,n.b);
      if(j.res==='yes'){aiNegDrop(n);startClauseTalk(p,c,n.b.fee,'deal',n.b);return}
      if(j.res==='no'){tn(vis,[c.id,s.id],'transfer',`${esc(s.short)} lehnt ab: ${fullname(p)}`,`${esc(s.name)} weist das Angebot von ${esc(c.name)} (${bidText(n.b)}) zurück.`);return aiNegDrop(n)}
      n.b=j.bid;n.step='buyer';const R=replyDelay(c,null);n.dec=R.dec;n.when=R.when;
      tn(vis,[c.id,s.id],'transfer',`Gegenangebot: ${fullname(p)}`,`${esc(s.name)} fordert von ${esc(c.name)}: ${bidText(n.b)}. ${R.now?'Die Antwort kommt noch heute.':`${esc(c.name)} prüft – Antwort bis ${fmtDate(R.when)}.`}`);
      if(!R.now)return;
    }else{
      const F=aiFinance(c),nb={...n.b};
      if(bidNow(nb)<=F.now){if(rnd()<.8){aiNegDrop(n);startClauseTalk(p,c,nb.fee,'deal',nb);return}
        tn(vis,[c.id,s.id],'transfer',`${esc(c.short)} steigt aus: ${fullname(p)}`,`${esc(c.name)} ist die Forderung von ${esc(s.name)} zu hoch.`);return aiNegDrop(n)}
      n.round++;
      const extra=nb.fee-F.now*.95;nb.fee=nice(F.now*.95);planAdd(nb,extra,ri(2,4),rnd()<.5?1:2);
      if(planSum(nb)>F.inst||n.round>3){tn(vis,[c.id,s.id],'transfer',`Keine Einigung: ${fullname(p)}`,`${esc(c.name)} kann die Forderung von ${esc(s.name)} nicht finanzieren – die Gespräche sind beendet.`);return aiNegDrop(n)}
      n.b=normBid(nb);n.step='seller';const R=replyDelay(s,p);n.dec=R.dec;n.when=R.when;
      tn(vis,[c.id,s.id],'transfer',`${esc(c.short)} bessert nach: ${fullname(p)}`,`Neues Angebot an ${esc(s.name)}: ${bidText(n.b)}. ${R.now?'Die Antwort kommt noch heute.':`Antwort bis ${fmtDate(R.when)}.`}`);
      if(!R.now)return;
    }
  }
}
function processAiNegs(){for(const n of (S.aineg||[]).slice())if(S.week>=n.dec)aiNegStep(n)}

/* ---------- Transfer-Ticker: alle Transfer-Meldungen aus allen Ligen ---------- */
function tn(vis,ids,type,title,body){
  const cl=ids.map(id=>club(id)).filter(Boolean);
  S.tnews=S.tnews||[];S.tnews.unshift({season:S.season,w:S.week,d:gameDate(),type,title,body,lg:cl.map(x=>x.league===null?-1:x.league),as:[...new Set(cl.map(x=>x.assoc))],u:ids.includes(S.user)?1:0});
  if(S.tnews.length>600)S.tnews.length=600;
  if(vis)addNews(type,title,body);
}
