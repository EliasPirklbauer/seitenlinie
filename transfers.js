/* =====================================================================
   Seitenlinie – Ablöseverhandlungen zwischen Vereinen
   Ein Gebot besteht aus: fee (sofort), inst + instY (Raten über 1–3 Jahre),
   ao + aoN (Erfolgsbonus nach X Pflichtspielen), so (Weiterverkaufsbeteiligung in %).
   ===================================================================== */
const SO_OPTS=[0,10,15,20,25,30],AO_N=[10,25,50],INST_Y=[1,2,3];
function bidTotal(b){return (b.fee||0)+(b.inst||0)+(b.ao||0)}
function normBid(b){const n={fee:Math.max(0,Math.round(b.fee||0)),inst:Math.max(0,Math.round(b.inst||0)),instY:b.inst>0?(b.instY||2):0,ao:Math.max(0,Math.round(b.ao||0)),aoN:b.aoN||25,so:b.so||0};if(!n.ao)n.aoN=25;return n}
function bidText(b){
  const parts=[`${money(b.fee)} sofort`];
  if(b.inst)parts.push(`${money(b.inst)} in ${b.instY} Jahresrate${b.instY>1?'n':''}`);
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
  return (b.fee||0)+(b.inst||0)*Math.pow(.94,b.instY||1)+(b.ao||0)*.5+(b.so||0)/100*Math.max(p.val,1e5)*.35;
}
// Antwort eines KI-Verkäufers auf ein Gebot
function sellerJudge(p,b){
  const tgt=sellerTarget(p),v=bidValue(b,p),s=club(p.club);
  if(v>=tgt*.97)return {res:'yes'};
  if(v<tgt*.55)return {res:'no',msg:`${esc(s.name)} lehnt ab – das Angebot ist weit von ihren Vorstellungen entfernt.`};
  const nb=normBid({...b,fee:nice(b.fee+(tgt*1.02-v))});
  return {res:'counter',bid:nb,msg:`${esc(s.name)} macht ein Gegenangebot: ${bidText(nb)}.`};
}
// Wie viel ein KI-Käufer insgesamt stemmen kann (sofort + Raten)
function aiMax(c){const dir=c.staff.dir.trait;return Math.min(c.tBudget||0,Math.max(0,c.budget))*(dir==='star'?.9:.6)}
function aiFinance(c){const m=aiMax(c);return {now:m,inst:c.budget>0?m*1.2:0}}
function aiMakeBid(p,c,T){
  const F=aiFinance(c);let total=T*(.8+rnd()*.15);const b={fee:total,inst:0,instY:0,ao:0,aoN:25,so:0};
  if(total>F.now){b.fee=F.now*.95;b.inst=total-b.fee;b.instY=ri(1,3);if(b.inst>F.inst)return null}
  else if(rnd()<.3){b.ao=nice(total*.12);b.aoN=pick(AO_N);b.fee=total-b.ao}
  if(rnd()<.2)b.so=pick([10,15,20]);
  b.fee=nice(b.fee);b.inst=nice(b.inst);return normBid(b);
}
// Komplette Verhandlung zwischen zwei KI-Vereinen (bis zu 3 Runden)
function aiNegotiate(p,c){
  const T=sellerTarget(p),F=aiFinance(c);let b=aiMakeBid(p,c,T);if(!b)return null;
  for(let r=0;r<3;r++){
    const j=sellerJudge(p,b);if(j.res==='yes')return b;if(j.res==='no')return null;
    const nb=j.bid;
    if(nb.fee<=F.now){if(rnd()<.8)return nb;return null}
    const extra=nb.fee-F.now*.95;nb.fee=nice(F.now*.95);nb.instY=Math.max(nb.instY||0,2);nb.inst=nice((nb.inst||0)+extra/Math.pow(.94,nb.instY));
    if(nb.inst>F.inst)return null;b=normBid(nb);
  }
  return null;
}
// Gebot eines KI-Vereins für einen deiner Spieler (mit Schmerzgrenze lim)
function aiOfferFor(p,c){
  const base=p.val*(p.listed?.85+rnd()*.3:1+rnd()*.5),b=aiMakeBid(p,c,base/.875);if(!b)return null;
  const F=aiFinance(c),lim=Math.min(bidValue(b,p)*(1.12+rnd()*.3),F.now+F.inst*.9);
  return {bid:b,lim:Math.max(lim,bidValue(b,p))};
}
// Gegenangebot von dir an einen KI-Käufer
function buyerReply(o,ask){
  const p=S.players[o.pid],c=club(o.from),v=bidValue(ask,p),F=aiFinance(c);
  if(v<=o.lim&&ask.fee<=F.now*1.02&&ask.inst<=F.inst)return {res:'yes',bid:normBid(ask)};
  o.rounds=(o.rounds||0)+1;
  if(o.rounds>=3)return {res:'no',msg:`${esc(c.name)} bricht die Verhandlungen ab – deine Forderung ist ihnen zu hoch.`};
  const cur=bidValue(o.bid,p),target=Math.min(o.lim,cur+(v-cur)*.5);
  const nb=normBid({...o.bid,fee:Math.min(nice(o.bid.fee+(target-cur)),nice(F.now))});
  if(bidValue(nb,p)<target-1){nb.instY=Math.max(nb.instY||0,2);nb.inst=nice((nb.inst||0)+(target-bidValue(nb,p))/Math.pow(.94,nb.instY))}
  o.bid=normBid(nb);
  return {res:'counter',bid:o.bid,msg:`${esc(c.name)} bessert nach: ${bidText(o.bid)}.`};
}

/* ---------- Ausführung & Folgezahlungen ---------- */
function bookFin(c,amt,dir){if(c.id!==S.user||!S.fin)return;if(dir==='in')S.fin.tOut+=amt;else S.fin.tIn+=amt}
function executeDeal(p,buyer,bid,contract){
  const seller=p.club!==null?club(p.club):null,b=normBid(bid||{fee:0});
  doTransfer(p,buyer,b.fee,contract);
  if(seller){
    if(b.inst&&b.instY){const per=b.inst/b.instY;for(let i=1;i<=b.instY;i++)(S.inst=S.inst||[]).push({from:buyer.id,to:seller.id,amt:per,due:S.season+i,pid:p.id,name:fullname(p)})}
    if(b.ao)(p.ao=p.ao||[]).push({from:buyer.id,to:seller.id,need:b.aoN,amt:b.ao,n:0});
    if(b.so)(p.so=p.so||[]).push({to:seller.id,pct:b.so,since:S.season});
    const tr=S.transfers[0];if(tr&&tr.pid===p.id&&(b.inst||b.ao||b.so)){tr.fee=bidTotal(b);tr.det=bidText(b)}
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
// Raten zum Start der neuen Saison
function payInstallments(){
  const keep=[];let paid=0,got=0;
  for(const r of S.inst||[]){if(r.due>S.season){keep.push(r);continue}const f=club(r.from),t=club(r.to);if(!f||!t)continue;
    f.budget-=r.amt;t.budget+=r.amt;if(f.id===S.user){S.fin.tIn+=r.amt;paid+=r.amt}if(t.id===S.user){S.fin.tOut+=r.amt;got+=r.amt}}
  S.inst=keep;
  if(paid)addNews('board','Transferraten bezahlt',`Zum Saisonstart wurden Raten über <b>${money(paid)}</b> an andere Vereine überwiesen.`);
  if(got)addNews('board','Transferraten erhalten',`Andere Vereine haben Raten über <b>${money(got)}</b> überwiesen.`);
}
function userInstallments(){const u=S.user;return (S.inst||[]).filter(r=>r.from===u||r.to===u)}
