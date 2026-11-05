/* =====================================================================
   Seitenlinie – Verhandlungsraum
   1) Verein: Ablöse mit dem Sportdirektor, Runde für Runde mit Argumenten
   2) Spieler: persönliches Gespräch, versteckte Prioritäten, Versprechen
   3) Berater: Gehalt, Laufzeit, Handgeld, Beraterhonorar – mit Pokern
   ===================================================================== */
function vrKey(){return S.season+':'+(S.week<4?'s':'w')}
function vrOf(pid){S.vr=S.vr||{};let V=S.vr[pid];if(V&&V.key!==vrKey()){delete S.vr[pid];V=null}if(!V)V=S.vr[pid]={key:vrKey(),pid,club:null,player:null,agent:null,step:null};return V}
function relOf(cid){return (S.rel||{})[cid]||0}
function relAdd(cid,d){S.rel=S.rel||{};S.rel[cid]=clamp((S.rel[cid]||0)+d,-5,5)}
function vrSay(st,who,t){st.msgs.push({who,t});if(st.msgs.length>60)st.msgs.splice(0,st.msgs.length-60)}
const VR_DIRV={
  star:{hi:['Willkommen. Ich sage es gleich: Wir verkaufen nicht an jeden.','Schön, dass Sie da sind. Unsere besten Spieler haben ihren Preis.'],conc:.28,floor:.96},
  schnaeppchen:{hi:['Setzen Sie sich. Bei uns hat alles seinen Preis – reden wir über Zahlen.','Ich bin Kaufmann. Wenn das Angebot stimmt, kommen wir zusammen.'],conc:.42,floor:.9},
  jugend:{hi:['Sie wissen, wie sehr wir an unseren Spielern hängen. Aber hören wir uns an, was Sie vorhaben.','Unsere Jungs sind unser Kapital. Überzeugen Sie mich.'],conc:.33,floor:.94},
  erfahrung:{hi:['Lassen Sie uns pragmatisch bleiben. Was schwebt Ihnen vor?','Ich mag klare Ansagen. Was bieten Sie?'],conc:.36,floor:.93}};
const VR_ARGS=[
  ['neutral','Sachlich anbieten','Ohne Druck – nur das Angebot.'],
  ['bench','„Er spielt bei euch kaum"','Wirkt, wenn er dort wenig Einsatzzeit hat.'],
  ['contract','„Sein Vertrag läuft bald aus"','Wirkt bei Vertragsende in diesem oder nächstem Sommer.'],
  ['age','„Er ist nicht mehr der Jüngste"','Wirkt bei Spielern ab 30.'],
  ['wants','„Der Spieler will zu uns"','Wirkt, wenn du ihn im Spielergespräch überzeugt hast.'],
  ['alt','„Wir haben Alternativen"','Bluff – sparsame oder klamme Vereine werden nervös, andere genervt.'],
  ['partner','„Langfristig gute Partner"','Baut Geduld auf, kaum Preiswirkung.'],
  ['final','„Das ist unser letztes Angebot"','Alles oder nichts.']];
const PRIO_LBL={money:'Gehalt & finanzielle Sicherheit',play:'Spielzeit',title:'Titel gewinnen',dev:'sich weiterentwickeln',prestige:'die große Bühne',home:'Heimat & Familie'};

/* ---------- Einstieg ---------- */
function vrOpen(pid,step){
  const p=S.players[pid],u=userClub();if(!p)return;
  const V=vrOf(pid);
  if(p.club!==null&&!V.club)V.club=vrClubInit(p);
  if(!V.player)V.player=vrPlayerInit(p,u);
  V.step=step||V.step||(p.club===null||vrClubDone(p)?(V.player.st==='done'?'agent':'player'):'club');
  UI.vr={pid,draftArg:'neutral'};UI.modal=vrModal();render();
}
function vrClubDone(p){if(p.club===null)return true;if(userDeal(p.id))return true;const bf=buyFee(p,userClub());return bf.clause}

/* ---------- 1) Verein ---------- */
function vrClubInit(p){
  const s=club(p.club),dir=s.staff.dir,pres=s.staff.pres,DV=VR_DIRV[dir.trait]||VR_DIRV.erfahrung,rel=relOf(s.id);
  let T=sellerTarget(p),floor=T*DV.floor*(pres.trait==='sparsam'?.95:pres.trait==='ambitioniert'?1.03:1);
  const q=inqFor(p.id,S.user);if(q&&inqFresh(q)&&q.res&&q.res.club&&q.res.club.sale==='no'){T*=1.3;floor*=1.25}
  if(s.budget<0){floor*=.92}
  if(p.until<=S.season){T*=.8;floor*=.78}
  const pat=clamp(70+rel*5+(pres.trait==='geduldig'?15:pres.trait==='ambitioniert'?-10:0),25,100);
  const st={T,floor,T0:T,pat,round:0,used:{},msgs:[],counter:null,st:'open',offer:normBid({fee:nice(scoutEst(p)*.85)}),dir:dir.name,trait:dir.trait};
  vrSay(st,'sys',`Besprechung mit ${dir.name} (Sportdirektor, ${DIR[dir.trait].label}) von ${s.name}. Präsident: ${PRES[pres.trait].label}.`);
  vrSay(st,'them',pick(DV.hi));
  if(rel>=2)vrSay(st,'them','Mit Ihnen haben wir ja schon gute Geschäfte gemacht.');else if(rel<=-2)vrSay(st,'them','Ehrlich gesagt: Nach dem letzten Mal bin ich vorsichtig.');
  return st;
}
function vrArgEffect(C,p,arg){
  const s=club(p.club),used=C.used[arg];C.used[arg]=1;
  const inXI=s.lineup.includes(p.id),played=(tableOf(league(s)).find(r=>r.id===s.id)||{sp:0}).sp||0,share=played?p.apps/played:.5;
  if(used&&arg!=='neutral'&&arg!=='final')return {txt:'Das hatten Sie schon gesagt. Wiederholungen machen es nicht besser.',pat:-6};
  switch(arg){
    case 'bench':if(!inXI&&share<.5){C.T*=.93;C.floor*=.95;return {txt:pick(['Gut, er kommt bei uns nicht so zum Zug, wie wir uns das vorgestellt haben.','Da haben Sie einen Punkt – er sitzt zu oft draußen.'])}}
      return {txt:pick(['Er ist bei uns gesetzt, das wissen Sie genau.','Er spielt fast jedes Spiel. Netter Versuch.']),pat:-14};
    case 'contract':if(p.until<=S.season+1){C.T*=p.until<=S.season?.88:.93;C.floor*=.94;return {txt:'Ja … der Vertrag. Wir wollen ihn nicht ablösefrei verlieren, da haben Sie recht.'}}
      return {txt:'Sein Vertrag läuft noch lange. Wir stehen nicht unter Druck.',pat:-10};
    case 'age':if(p.age>=30){C.T*=.95;C.floor*=.97;return {txt:'Er ist 30 plus, das stimmt. Aber er ist topfit.'}}
      return {txt:`Er ist ${p.age}. Das Argument zieht nicht.`,pat:-10};
    case 'wants':{const P=(S.vr[p.id]||{}).player;if(P&&P.conv>=60){C.T*=.95;C.floor*=.96;return {txt:'Ich habe schon gehört, dass er wechseln möchte. Gegen den Willen des Spielers zu arbeiten, bringt niemandem etwas.'}}
      return {txt:'Mit dem Spieler haben Sie offenbar noch nicht gesprochen – oder er sieht das anders. Erzählen Sie mir nichts.',pat:-14}}
    case 'alt':if(C.trait==='schnaeppchen'||s.budget<0){C.T*=.96;return {txt:'Hm. Andere Kandidaten … Lassen Sie uns nicht vorschnell sein.'}}
      return {txt:pick(['Dann nehmen Sie doch die Alternativen.','Drohungen beeindrucken mich nicht.']),pat:-12};
    case 'partner':C.pat=Math.min(100,C.pat+10);C.T*=.99;return {txt:'Langfristig denken gefällt mir. Gute Beziehungen sind in diesem Geschäft viel wert.'};
  }
  return {txt:''};
}
function vrClubPropose(p,arg){
  const C=(S.vr[p.id]).club,u=userClub(),s=club(p.club),b=normBid(C.offer),DV=VR_DIRV[C.trait]||VR_DIRV.erfahrung;
  if(C.st!=='open')return;
  if(!isWindow()){vrSay(C,'sys','Das Transferfenster ist geschlossen – eine Einigung ist erst im nächsten Fenster möglich.');return}
  if(b.fee>u.tBudget){vrSay(C,'sys',`Dein Transferbudget reicht für ${money(b.fee)} sofort nicht (frei: ${money(u.tBudget)}). Nutze Raten oder einen Erfolgsbonus.`);return}
  const argL=VR_ARGS.find(a=>a[0]===arg);
  vrSay(C,'me',`Unser Angebot: ${bidText(b)}.${arg!=='neutral'?' '+argL[1].replace(/[„"]/g,''):''}`);
  const ef=vrArgEffect(C,p,arg);if(ef.txt&&arg!=='final')vrSay(C,'them',ef.txt);C.pat+=ef.pat||0;
  C.round++;const v=bidValue(b,p);
  if(arg==='final'){
    if(v>=C.floor){vrClubAgree(p,b,'Na gut. Sie haben gewonnen – wir machen es.');return}
    if(C.pat>45&&rnd()<.35){const cb=normBid({...b,fee:nice(b.fee+(C.floor-v)*1.02)});C.counter=cb;C.lastFinal=1;vrSay(C,'them',`Ein letztes Wort von unserer Seite: ${bidText(cb)}. Darunter geht nichts.`);C.pat=Math.min(C.pat,15);return}
    vrClubBreak(p,'Dann sind wir hier fertig. Viel Erfolg bei Ihrer Suche.');return;
  }
  if(v>=C.T*.98){vrClubAgree(p,b,pick(['Damit können wir leben. Abgemacht!','Einverstanden. Sie haben einen guten Spieler gekauft.','Handschlag – wir haben einen Deal.']));return}
  if(v<C.T*.55){C.pat-=25;vrSay(C,'them',pick(['Das ist nicht Ihr Ernst. Das ist weit weg von jeder Realität.','Soll das ein Witz sein? So kommen wir nicht weiter.','Dafür bekommen Sie nicht einmal seine Schuhe.']));if(C.pat<=0)vrClubBreak(p,'Ich glaube, wir verschwenden hier unsere Zeit.');return}
  const gap=C.T-v,conc=DV.conc*(.6+Math.max(0,C.pat)/200);
  C.T=Math.max(C.floor,C.T-gap*conc);C.pat-=8+Math.max(0,1-v/C.T)*22;
  if(C.pat<=0){vrClubBreak(p,'Wir drehen uns im Kreis. Ich breche das Gespräch ab.');return}
  let cb=normBid({...b,fee:nice(b.fee+(C.T-v))});
  if(cb.fee>u.tBudget){const extra=cb.fee-u.tBudget;cb.fee=nice(u.tBudget);cb.instY=Math.max(cb.instY||0,2);cb.inst=nice((cb.inst||0)+extra/Math.pow(.94,cb.instY)*1.03);cb=normBid(cb)}
  C.counter=cb;
  const close=v/C.T;
  vrSay(C,'them',`${close>.9?pick(['Wir sind nah dran.','Das geht in die richtige Richtung.']):close>.75?pick(['Da fehlt noch ein gutes Stück.','Das reicht mir noch nicht.']):pick(['Wir liegen noch weit auseinander.','Da müssen Sie deutlich drauflegen.'])} Mein Vorschlag: ${bidText(cb)}.`);
}
function vrClubAgree(p,b,txt){
  const V=S.vr[p.id],C=V.club,s=club(p.club);C.st='agreed';C.deal=b;vrSay(C,'them',txt);
  S.deals=S.deals||{};S.deals[p.id]={bid:b,season:S.season,exp:windowEnd()};S.bidRes=S.bidRes||{};S.bidRes[p.id]={res:'yes',bid:b,seller:s.id};
  if(bidValue(b,p)<=C.T0*1.05&&C.pat>30)relAdd(s.id,.5);
  addNews('offer',`🤝 Einigung mit ${esc(s.name)}: ${fullname(p)}`,`Im Verhandlungsraum mit ${esc(C.dir)} vereinbart: <b>${bidText(b)}</b>. Jetzt musst du dich noch mit Spieler und Berater einigen – bis zum Ende des Transferfensters.`);
  vrSay(C,'sys','✅ Ablöse vereinbart. Weiter mit dem Spielergespräch.');
}
function vrClubBreak(p,txt){
  const C=S.vr[p.id].club,s=club(p.club);C.st='broken';vrSay(C,'them',txt);relAdd(s.id,-1);
  S.btries=S.btries||{};S.btries[bidKey(p.id)]=3;
  addNews('offer',`❌ Gespräche geplatzt: ${fullname(p)}`,`${esc(C.dir)} von ${esc(s.name)} hat die Verhandlungen abgebrochen. In diesem Transferfenster wird das nichts mehr – und die Beziehung zu ${esc(s.short)} hat gelitten.`);
  vrSay(C,'sys','❌ Abgebrochen. In diesem Fenster gibt es keine neue Chance.');
}

/* ---------- 2) Spieler ---------- */
function vrPrio(p){
  const A=agentOf(p),o=ovr(p),R=mkRng(hashStr('prio'+p.id));
  const w={money:.6+(A.type==='biz'?.5:A.type==='poker'?.3:0)+(p.age>=27&&p.age<=31?.3:0)+R()*.35,
    play:.5+(p.age>=20&&p.age<=29?.4:0)+(ROLE_ORDER.indexOf(p.role)>=2?.5:0)+R()*.35,
    title:.3+(at(p,'amb')-10)/12+(p.age>=27?.3:0)+R()*.35,
    dev:p.age<=23?.6+(p.pot-o)/15+R()*.2:.05,
    prestige:.3+(at(p,'amb')-10)/20+R()*.35,
    home:.15+(A.type==='family'?.55:0)+(p.age>=30?.2:0)+R()*.25};
  for(const k in w)w[k]=Math.max(.05,w[k]);
  return w;
}
function vrPlayerInit(p,u){
  const w=vrPrio(p),cur=p.club!==null?club(p.club):null;
  let conv=40+(cur?(u.rep-cur.rep)/2:12)+(p.mor<45?10:p.mor>80?-6:0)+(p.listed?10:0)+(inIntlComp(u)&&!(cur&&inIntlComp(cur))?6:0);
  const q=p.club!==null?inqFor(p.id,S.user):null;if(q&&inqFresh(q)&&q.res&&q.res.agent){conv+=q.res.agent.lvl==='yes'?10:q.res.agent.lvl==='no'?-15:0}
  const st={w,conv:clamp(Math.round(conv),5,95),turns:9,used:{},known:[],msgs:[],promise:{},st:'open',demand:0};
  const A=agentOf(p);
  vrSay(st,'sys',`Treffen mit ${fullname(p)} (${p.age} J., ${POS_LABEL[p.pos]}) – sein Berater ${A.name} (${A.lbl}) ist dabei.`);
  vrSay(st,'them',st.conv>=60?pick(['Schön, dass es geklappt hat. Ich habe viel von Ihrem Projekt gehört.','Danke für die Einladung – ich bin neugierig.']):st.conv>=35?pick(['Hallo. Ich höre mir gern an, was Sie vorhaben.','Mal sehen, was Sie mir erzählen.']):pick(['Ehrlich gesagt bin ich nur hier, weil mein Berater darauf bestanden hat.','Ich bin eigentlich zufrieden, wo ich bin.']));
  return st;
}
function vrTop(P,n){return Object.entries(P.w).sort((a,b)=>b[1]-a[1]).slice(0,n).map(x=>x[0])}
function vrCred(k,p,u,role){
  const cur=p.club!==null?club(p.club):null;
  switch(k){
    case 'play':{const sug=suggestRole(p,u),gap=ROLE_ORDER.indexOf(sug)-ROLE_ORDER.indexOf(role);return gap<=0?1:gap===1?.65:.25}
    case 'title':{const r=rankOf(u.id)||u.lastRank||10;return clamp((u.rep-55)/35,0,1)*.6+(r<=3?.4:r<=6?.2:0)+(inIntlComp(u)?.15:0)}
    case 'dev':return p.age>23?.15:ROLE_ORDER.indexOf(suggestRole(p,u))<=2?.9:.45;
    case 'prestige':{const e=league(u).econ||u.econ,e0=cur?(league(cur).econ||cur.econ):.3;return clamp(.5+(e-e0)*1.4+(inIntlComp(u)?.15:0),0,1)}
    case 'home':return p.nat===u.assoc?1:.1;
    case 'money':return 1;
  }
  return .5;
}
const VR_PITCH=[
  ['q_prio','❓ „Was ist dir bei deinem nächsten Verein wichtig?"','q'],
  ['q_more','❓ „Und was noch?"','q'],
  ['q_now',`❓ „Wie zufrieden bist du gerade?"`,'q'],
  ['play','⚽ Rolle versprechen','p'],
  ['title','🏆 „Wir spielen um Titel"','p'],
  ['dev','📈 „Bei uns wirst du besser"','p'],
  ['prestige','🏟️ „Die große Bühne wartet"','p'],
  ['home','🏡 „Hier bist du zu Hause"','p'],
  ['money','💶 „Finanziell lohnt es sich"','p']];
function vrPlayerMove(p,k,role){
  const P=S.vr[p.id].player,u=userClub(),cur=p.club!==null?club(p.club):null;
  if(P.st!=='open'||P.turns<=0)return;
  if(P.used[k]&&k!=='play'){vrSay(P,'them','Das haben Sie mir schon erzählt.');P.conv-=2;return}
  P.used[k]=1;P.turns--;
  const say=t=>vrSay(P,'them',t),me=t=>vrSay(P,'me',t);
  if(k==='q_prio'){me('Was ist dir bei deinem nächsten Verein wirklich wichtig?');const t=vrTop(P,1)[0];if(!P.known.includes(t))P.known.push(t);
    say({money:'Ich will ehrlich sein: Ich möchte für meine Familie ausgesorgt haben.',play:'Ich will spielen. Jede Woche. Auf der Bank werde ich verrückt.',title:'Ich will Titel gewinnen, solange ich noch kann.',dev:'Ich will mich weiterentwickeln und irgendwann auf höchstem Niveau spielen.',prestige:'Ich träume von den großen Stadien und den großen Abenden.',home:'Meine Familie ist mir das Wichtigste. Sie muss sich wohlfühlen.'}[t]);return}
  if(k==='q_more'){me('Und was spielt sonst noch eine Rolle?');const t=vrTop(P,2)[1];if(!P.known.includes(t))P.known.push(t);
    say({money:'Natürlich muss auch das Finanzielle passen.',play:'Spielzeit ist mir auch wichtig.',title:'Und ich will um etwas spielen, nicht im Mittelfeld der Tabelle versauern.',dev:'Ich möchte einen Trainer, der mich besser macht.',prestige:'Eine starke Liga wäre schön.',home:'Und meine Familie soll sich wohlfühlen.'}[t]);return}
  if(k==='q_now'){me(`Wie zufrieden bist du gerade${cur?' bei '+cur.short:''}?`);
    if(!cur){say('Ohne Verein ist es nicht leicht. Ich will so schnell wie möglich wieder auf den Platz.');P.conv+=4;return}
    const sit=clubSituation(cur);say(p.mor<45?`Ehrlich? Nicht gut. Ich bin ${ROLES[p.role].label}, aber ich fühle mich nicht wertgeschätzt.`:p.mor>78?`Eigentlich sehr gut. ${cur.short} ist ${sit.v>=.6?'erfolgreich':'mein Zuhause'}. Sie müssen mir schon etwas bieten.`:`Es ist okay. Bei ${cur.short} läuft es ${sit.v<=-.6?'gerade schlecht':'ganz normal'}.`);return}
  // Überzeugungsversuche
  const w=P.w[k],mw=Math.max(...Object.values(P.w)),cred=vrCred(k,p,u,role||'stamm'),rel=w/mw;
  let d=rel*cred*22-(cred<.4?6:0)-(rel<.35?3:0);
  const texts={
    play:()=>{me(`Bei uns wirst du ${ROLES[role].label}. Das verspreche ich dir.`);P.promise.role=role;
      return cred>=.9?'Das klingt gut. Ich will Verantwortung übernehmen.':cred>=.6?'Hm. Sie haben auf meiner Position schon gute Leute … aber ich glaube Ihnen.':'Ehrlich? Sie haben doch längst stärkere Spieler auf meiner Position. Das glaube ich Ihnen nicht.'},
    title:()=>{me('Wir wollen Titel gewinnen – und du sollst ein Teil davon sein.');P.promise.title=1;return cred>=.7?'Das ist genau das, was ich hören will.':cred>=.4?'Titel? Na ja … mal sehen, wie realistisch das ist.':'Bei allem Respekt – um Titel spielen Sie nicht.'},
    dev:()=>{me('Bei uns bekommst du Spielzeit und einen Trainer, der dich besser macht.');return cred>=.7?'Das ist mir wichtig. Ich will den nächsten Schritt machen.':'Ich weiß nicht, ob ich bei Ihnen wirklich weiterkomme.'},
    prestige:()=>{me(`Die ${league(u).name} – volle Stadien, große Abende${inIntlComp(u)?', dazu Europapokal':''}.`);return cred>=.7?'Davon habe ich als Kind geträumt.':cred>=.4?'Die Liga ist interessant, ja.':'Ehrlich gesagt ist das sportlich kein Schritt nach vorne für mich.'},
    home:()=>{me('Du würdest wieder in deiner Heimat spielen – nah bei Familie und Freunden.');return cred>=.9?'Das wäre schön. Meine Familie würde sich sehr freuen.':'Ich komme ja gar nicht von hier.'},
    money:()=>{me('Finanziell wird sich das für dich richtig lohnen.');P.demand+=.06;return rel>.75?'Das hört mein Berater gern. Und ich auch, ehrlich gesagt.':'Geld ist nicht alles. Aber gut zu wissen.'}};
  const reply=texts[k]();
  if(k==='money')d=rel*14;
  P.conv=clamp(Math.round(P.conv+d),0,100);
  say(reply+(d>=10?' 😊':d<=0?' 😕':''));
  if(P.turns===0)vrSay(P,'sys','Die Gesprächszeit ist um. Beende das Gespräch, um zum Berater zu wechseln.');
}
function vrPlayerEnd(p){
  const P=S.vr[p.id].player;if(P.st!=='open')return;P.st='done';
  vrSay(P,'them',P.conv>=70?'Ich habe ein richtig gutes Gefühl. Sprechen Sie mit meinem Berater über die Details.':P.conv>=45?'Ich denke darüber nach. Mein Berater meldet sich.':P.conv>=25?'Ich bin noch nicht überzeugt. Wenn, dann muss das Finanzielle stimmen.':'Ich glaube nicht, dass das passt. Tut mir leid.');
  vrSay(P,'sys',P.conv>=25?'Weiter zum Gespräch mit dem Berater.':'❌ Der Spieler hat kein Interesse – die Gespräche mit dem Berater sind sinnlos.');
}

/* ---------- 3) Berater ---------- */
const AG_V={fast:{conc:.5,floor:.97,afw:1,open:1.06},poker:{conc:.25,floor:.91,afw:1.3,open:1.16},family:{conc:.45,floor:.95,afw:.7,open:1.05},biz:{conc:.35,floor:.93,afw:1.6,open:1.1}};
function vrConvMult(P){return clamp(1.12-(P?P.conv:45)*.0025+(P?P.demand:0),.86,1.2)}
function pkgVal(W,years,si,af,afw){return W*52*(1+(years-1)*.22)+si+af*afw}
function vrAgentInit(p,u){
  const V=S.vr[p.id],P=V.player,A=agentOf(p),AV=AG_V[A.type],D=userDeal(p.id),bf=buyFee(p,u);
  const role=P.promise.role||suggestRole(p,u),years=p.age>=31?1:p.age<=23?4:3;
  const dem=wageDemand(p,u,role,years)*vrConvMult(P);
  const fee=D?bidTotal(D.bid):bf.fee||0;
  const askW=dem*AV.open,askSi=rw(mon(dem)*(p.club===null?4:1.2)),askAf=rw(Math.max(fee*.05,mon(dem)*2.5)*(A.type==='biz'?1.3:1));
  const st={A,role,years,dem,askW,askSi,askAf,ask:pkgVal(askW,years,askSi,askAf,AV.afw),floor:pkgVal(dem*AV.floor,years,askSi*.5,askAf*.6,AV.afw),pat:clamp(60+(P.conv-50)*.5,25,95),
    msgs:[],st:'open',round:0,rival:null,offer:{mw:Math.round(mon(dem)*.92/100)*100,years,si:rw(askSi*.5),af:rw(askAf*.6),role},counter:null};
  vrSay(st,'sys',`Vertragsgespräch mit ${A.name} (${A.agency}) – ${A.lbl}: ${A.desc}.`);
  vrSay(st,'them',`Mein Mandant möchte ${money(mon(askW))} brutto im Monat als ${ROLES[role].label}, ${years} ${years===1?'Jahr':'Jahre'}, ${money(askSi)} Handgeld. Mein Honorar: ${money(askAf)}.`);
  if(P.promise.role)vrSay(st,'them',`Und die Rolle als ${ROLES[P.promise.role].label}, die Sie ihm versprochen haben, schreiben wir ins Protokoll.`);
  return st;
}
const AG_TAC=[['neutral','Sachlich'],['deadline','Frist setzen'],['flatter','Wertschätzung zeigen'],['bluff','Bluff durchschauen'],['walk','„Mein letztes Wort"']];
function vrAgentMove(p,tac){
  const V=S.vr[p.id],G=V.agent,u=userClub(),A=G.A,AV=AG_V[A.type],o=G.offer;
  if(G.st!=='open')return;
  const W=wk(o.mw),v=pkgVal(W,o.years,o.si,o.af,AV.afw);
  vrSay(G,'me',`${money(o.mw)} brutto/Monat, ${o.years} ${o.years===1?'Jahr':'Jahre'}, ${ROLES[o.role].label}, ${money(o.si)} Handgeld, ${money(o.af)} Honorar.${tac==='deadline'?' Ich brauche bis morgen eine Antwort.':tac==='flatter'?' Ich schätze Ihre Arbeit sehr.':tac==='walk'?' Das ist mein letztes Wort.':''}`);
  // Rolle muss passen
  const gap=ROLE_ORDER.indexOf(o.role)-ROLE_ORDER.indexOf(G.role);
  if(gap>=1){vrSay(G,'them',`Als ${ROLES[o.role].label}? Wir hatten über ${ROLES[G.role].label} gesprochen. So nicht.`);G.pat-=12;if(G.pat<=0)vrAgentBreak(p);return}
  let conc=AV.conc;G.round++;
  if(tac==='bluff'){
    if(!G.rival){vrSay(G,'them','Welchen Bluff? Ich habe nichts dergleichen gesagt.');G.pat-=6}
    else if(G.rival.real){G.ask*=1.04;G.pat-=15;vrSay(G,'them',`Kein Bluff. ${club(G.rival.cid).name} wartet nicht ewig – überlegen Sie gut.`)}
    else{G.ask=Math.max(G.floor,G.ask*.94);G.pat-=4;G.rival.called=1;vrSay(G,'them','… Na gut. Lassen wir das andere Angebot beiseite.')}
    G.rival=null;
  }
  if(tac==='deadline'){if(A.type==='fast'){conc+=.2;vrSay(G,'them','Klare Fristen mag ich. Dann lassen Sie uns das zügig abschließen.')}else if(A.type==='poker'){G.pat-=15;G.ask*=1.02;vrSay(G,'them','Fristen? Die setze in diesem Spiel ich.')}else{conc+=.1}}
  if(tac==='flatter'){G.pat=Math.min(100,G.pat+10);conc+=.05;vrSay(G,'them',A.type==='biz'?'Freundlich sind viele. Am Ende zählen Zahlen.':'Danke, das hört man selten.')}
  if(tac==='walk'){
    if(v>=G.floor){vrAgentAgree(p,'Gut. Dann machen wir es so.');return}
    const P=V.player;if(P.conv>=60&&rnd()<.45){G.ask=G.floor;G.counter=vrCounter(G,o,AV);vrSay(G,'them',`Mein Mandant will unbedingt zu Ihnen. Letzter Vorschlag: ${money(G.counter.mw)} im Monat, ${money(G.counter.si)} Handgeld, ${money(G.counter.af)} Honorar – sonst ist er weg.`);G.pat=Math.min(G.pat,12);return}
    vrAgentBreak(p);return;
  }
  if(v>=G.ask*.985){vrAgentAgree(p,pick(['Damit sind wir einverstanden.','Abgemacht – mein Mandant unterschreibt.','Das passt. Wir haben einen Vertrag.']));return}
  if(v<G.floor*.75){G.pat-=20;vrSay(G,'them',pick(['Damit brauchen wir gar nicht weiterreden.','Das ist eine Beleidigung für meinen Mandanten.']));if(G.pat<=0)vrAgentBreak(p);return}
  G.ask=Math.max(G.floor,G.ask-(G.ask-v)*conc);G.pat-=7+Math.max(0,1-v/G.ask)*20;
  if(G.pat<=0){vrAgentBreak(p);return}
  G.counter=vrCounter(G,o,AV);
  // Druckmittel: konkurrierendes Angebot (echt oder erfunden)
  if(!G.rival&&G.round===1&&(A.type==='poker'||A.type==='biz'||rnd()<.25)){
    const real=(S.aineg||[]).find(n=>n.pid===p.id&&n.buyer!==S.user)||(S.talks||[]).find(t=>t.pid===p.id&&t.from!==S.user&&t.st==='open');
    let cid=real?(real.buyer!==undefined?real.buyer:real.from):null;
    if(!cid){const cands=S.clubs.filter(c=>!c.guest&&c.id!==S.user&&c.id!==p.club&&Math.abs(c.rep-u.rep)<12);const c=cands.length?pick(cands):null;cid=c?c.id:null}
    if(cid!==null){G.rival={real:!!real,cid};vrSay(G,'them',`Nur damit Sie es wissen: ${club(cid).name} hat ebenfalls angefragt. ${real?'Konkret.':'Sehr konkret.'}`)}
  }
  vrSay(G,'them',`Wir kommen Ihnen entgegen: ${money(G.counter.mw)} brutto im Monat, ${money(G.counter.si)} Handgeld, ${money(G.counter.af)} Honorar.${G.ask<=G.floor*1.01?' Weiter runter geht es nicht.':''}`);
}
function vrCounter(G,o,AV){
  // jede Position wandert anteilig von deinem Angebot Richtung seiner Ausgangsforderung
  const v=pkgVal(wk(o.mw),o.years,o.si,o.af,AV.afw),D0=pkgVal(G.askW,o.years,G.askSi,G.askAf,AV.afw);
  const f=clamp((G.ask-v)/Math.max(1,D0-v),0,1);
  const mw=Math.ceil((o.mw+f*(mon(G.askW)-o.mw))/100)*100,si=rw(o.si+f*Math.max(0,G.askSi-o.si)),af=rw(o.af+f*Math.max(0,G.askAf-o.af));
  return {...o,mw:Math.max(o.mw,mw),si:Math.max(o.si,si),af:Math.max(o.af,af)};
}
function vrAgentBreak(p){const G=S.vr[p.id].agent;G.st='broken';p.negTries=3;vrSay(G,'them','So wird das nichts. Wir beenden die Gespräche.');vrSay(G,'sys','❌ Der Berater hat abgebrochen – in diesem Fenster ist der Spieler für dich erledigt.');
  addNews('transfer',`❌ Berater bricht ab: ${fullname(p)}`,`${esc(G.A.name)} hat die Vertragsgespräche beendet.`)}
function vrAgentAgree(p,txt){
  const V=S.vr[p.id],G=V.agent,u=userClub(),o=G.offer,W=wk(o.mw);
  const D=userDeal(p.id),bf=buyFee(p,u),fee=p.club===null?0:D?D.bid.fee:bf.clause?bf.fee:null;
  const fail=m=>{vrSay(G,'sys','⚠️ '+m)};
  if(fee===null)return fail('Erst muss die Ablöse mit dem Verein vereinbart sein.');
  if(!isWindow())return fail('Das Transferfenster ist geschlossen.');
  if(u.players.length>=32)return fail('Dein Kader ist voll (max. 32).');
  if(W>u.wBudget-wageBill(u))return fail(`Das Gehalt sprengt dein Gehaltsbudget (frei: ${money(mon(u.wBudget-wageBill(u)))}/Monat).`);
  if(u.tBudget<fee+o.si+o.af)return fail(`Nicht genug Transferbudget für Ablöse, Handgeld und Honorar (nötig: ${money(fee+o.si+o.af)}).`);
  vrSay(G,'them',txt);G.st='agreed';
  const until=S.season+o.years-(S.week<winterStart()?1:0),fromName=p.club!==null?club(p.club).name:'vereinslos';
  executeDeal(p,u,{...(D?D.bid:{}),fee},{wage:W,until,role:o.role,ct:{si:o.si}});if(S.deals)delete S.deals[p.id];
  if(o.si){payBonus(o.si,'si');u.tBudget=Math.max(0,u.tBudget-o.si)}
  if(o.af){u.budget-=o.af;u.tBudget=Math.max(0,u.tBudget-o.af);S.fin.tIn+=o.af}
  const prom=[];if(V.player.promise.role)prom.push({k:'role',role:V.player.promise.role,s:S.season});if(V.player.promise.title)prom.push({k:'title',s:S.season});
  if(prom.length)p.prom=prom;
  p.mor=clamp(60+V.player.conv*.35,40,95);
  addNews('transfer',`Neuzugang: ${fullname(p)}`,`Von ${esc(fromName)} für ${D?bidText(D.bid):fee?money(fee):'ablösefrei'} · ${money(o.mw)} brutto/Monat bis ${contractEnd(p)} · ${ROLES[o.role].label} · Handgeld ${money(o.si)} · Beraterhonorar ${money(o.af)}.${prom.length?' Versprochen: '+prom.map(x=>x.k==='role'?ROLES[x.role].label:'Kampf um Titel').join(', ')+'.':''}`);
  vrSay(G,'sys',`✅ ${fullname(p)} unterschreibt bei ${u.name}!`);
  delete S.vr[p.id];UI.vrDone={pid:p.id,msgs:G.msgs};
  S.rng=RNG;save();toast(`${fullname(p)} unterschreibt!`);
}

/* ---------- Versprechen prüfen ---------- */
function vrPromiseCheck(final){
  const u=userClub(),row=tableOf(league(u)).find(r=>r.id===S.user)||{sp:0},rank=rankOf(S.user);
  for(const p of squadOf(u)){if(!p.prom)continue;
    for(const x of p.prom){if(x.done||x.s!==S.season)continue;
      if(x.k==='role'&&row.sp>=8){const need=x.role==='schluessel'?.7:x.role==='stamm'?.55:.3;
        if(p.apps<row.sp*need&&p.inj<3){x.done=1;p.mor=clamp(p.mor-20,15,100);p.unhappy=true;addNews('board',`${fullname(p)} fühlt sich belogen`,`Du hattest ihm versprochen, ${ROLES[x.role].label} zu sein – doch er kam nur auf ${p.apps} von ${row.sp} Ligaspielen. Seine Moral ist im Keller.`)}
        else if(final){x.done=1;p.mor=clamp(p.mor+5,15,100)}}
      if(x.k==='title'&&final){x.done=1;if(rank>4){p.mor=clamp(p.mor-10,15,100);addNews('board',`${fullname(p)} ist enttäuscht`,`Statt um Titel zu spielen, landete dein Team auf Platz ${rank}. Er hatte sich mehr erhofft.`)}}
    }
  }
}

/* ---------- Oberfläche ---------- */
function vrModal(){return ()=>{
  const R=UI.vr,p=S.players[R.pid],u=userClub();
  if(UI.vrDone&&UI.vrDone.pid===R.pid){const pp=S.players[R.pid];return `<div class="vrc"><h2>🤝 Transfer perfekt!</h2><p>${esc(fullname(pp))} gehört jetzt zu ${esc(u.name)}.</p>${vrLog(UI.vrDone.msgs.slice(-6),pp)}<div class="row" style="margin-top:12px"><button class="btn pri" data-act="vrClose">Schließen</button></div></div>`}
  if(!p)return '';const V=vrOf(p.id);
  if(p.club!==null&&!V.club)V.club=vrClubInit(p);if(!V.player)V.player=vrPlayerInit(p,u);
  const step=V.step,clubOk=vrClubDone(p),pDone=V.player.st==='done';
  if(step==='agent'&&!V.agent&&clubOk&&pDone&&V.player.conv>=25)V.agent=vrAgentInit(p,u);
  const tabs=[['club','1 · Verein',p.club===null?'—':clubOk?'✅':V.club&&V.club.st==='broken'?'❌':''],['player','2 · Spieler',pDone?(V.player.conv>=25?'✅':'❌'):''],['agent','3 · Berater & Vertrag',V.agent&&V.agent.st==='broken'?'❌':!clubOk||!pDone||V.player.conv<25?'🔒':'']];
  const cur=p.club!==null?club(p.club):null;
  const head=`<div class="vrhead"><div class="row" style="gap:10px">${cur?badge(cur,34):'<span class="pill">vereinslos</span>'}<div><h2 style="margin:0">Verhandlungsraum · ${esc(fullname(p))}</h2><div class="small muted">${POS_LABEL[p.pos]} · ${p.age} J. · Stärke ${ovr(p)} · Pot. ${p.pot} · Marktwert ${money(p.val)} · Vertrag bis ${contractEnd(p)}</div></div></div>
    <div class="seg vrtabs">${tabs.map(([k,l,ic])=>`<button class="${step===k?'on':''}" data-act="vrStep" data-v="${k}" ${k==='club'&&p.club===null?'disabled':''}>${l} ${ic}</button>`).join('')}</div></div>`;
  let body='';
  if(step==='club')body=p.club===null?'<p class="muted">Vereinslos – keine Ablöse nötig.</p>':vrClubView(p,V);
  else if(step==='player')body=vrPlayerView(p,V);
  else body=vrAgentView(p,V,clubOk,pDone);
  return `<div class="vrc">${head}${body}<div class="row" style="margin-top:12px;justify-content:space-between"><span class="small muted">Gespräche bleiben bis zum Ende des Transferfensters gespeichert.</span><button class="btn" data-act="vrClose">Raum verlassen</button></div></div>`;
}}
function vrLog(msgs,p,them){
  return `<div class="vrlog" id="vrlog">${msgs.map(m=>m.who==='sys'?`<div class="vrsys">${esc(m.t)}</div>`:`<div class="vrmsg ${m.who}"><span class="vrav">${m.who==='me'?'Du':esc((them||'?').split(' ').map(x=>x[0]).join('').slice(0,2))}</span><div>${esc(m.t)}</div></div>`).join('')}</div>`;
}
function meter(lbl,v,inv){const c=v>=60?'var(--good)':v>=35?'var(--gold)':'var(--bad)';return `<div class="vrmeter"><span>${lbl}</span><div class="cbar"><i style="width:${clamp(v,0,100)}%;background:${c}"></i></div><b>${Math.round(clamp(v,0,100))}</b></div>`}
function vrAmt(path,v){return `<label class="minp"><input type="text" inputmode="decimal" data-chg="vrAmt" data-k="${path}" value="${v?fmtNum(v):''}" placeholder="0"><span>€</span></label>`}
function vrClubView(p,V){
  const C=V.club,u=userClub(),b=C.offer,bf=buyFee(p,u);
  if(bf.clause&&!userDeal(p.id))return `<div class="news t-offer">⚡ Für ${esc(pname(p))} gilt eine Ausstiegsklausel über <b>${money(bf.fee)}</b>. Mit dem Verein musst du nicht verhandeln – überzeuge den Spieler und einige dich mit dem Berater.</div>`;
  const close=bidValue(normBid(b),p)/C.T;
  const hint=C.st!=='open'?'':close>=.98?'Damit dürfte er einverstanden sein.':close>=.9?'Nah dran.':close>=.75?'Noch ein gutes Stück entfernt.':'Weit weg von seinen Vorstellungen.';
  const ctrl=C.st!=='open'?`<div class="news ${C.st==='agreed'?'t-transfer':'t-coach'}">${C.st==='agreed'?`✅ Vereinbart: <b>${bidText(C.deal)}</b>`:'❌ Verhandlung abgebrochen.'}</div>${C.st==='agreed'?`<button class="btn pri" data-act="vrStep" data-v="player" style="margin-top:8px">Weiter zum Spieler ▶</button>`:''}`:
   `<label class="f">Sofort</label>${vrAmt('club.fee',b.fee)}
    <label class="f" style="margin-top:8px">Raten <span class="muted">(über Jahre)</span></label><div class="row">${vrAmt('club.inst',b.inst)}<div class="seg">${INST_Y.map(y=>`<button class="${(b.instY||2)===y?'on':''}" data-act="vrSet" data-k="club.instY" data-v="${y}">${y} J.</button>`).join('')}</div></div>
    <label class="f" style="margin-top:8px">Erfolgsbonus</label><div class="row">${vrAmt('club.ao',b.ao)}<div class="seg">${AO_N.map(n=>`<button class="${(b.aoN||25)===n?'on':''}" data-act="vrSet" data-k="club.aoN" data-v="${n}">nach ${n} Sp.</button>`).join('')}</div></div>
    <label class="f" style="margin-top:8px">Weiterverkaufsbeteiligung</label><div class="seg">${SO_OPTS.map(s=>`<button class="${(b.so||0)===s?'on':''}" data-act="vrSet" data-k="club.so" data-v="${s}">${s?s+' %':'keine'}</button>`).join('')}</div>
    <label class="f" style="margin-top:10px">Dein Argument</label><div class="vrargs">${VR_ARGS.map(([k,l,d])=>`<button class="${UI.vr.draftArg===k?'on':''} ${C.used[k]&&k!=='neutral'?'used':''}" data-act="vrArg" data-v="${k}" title="${esc(d)}">${l}</button>`).join('')}</div>
    <div class="small muted" style="margin-top:4px">${esc((VR_ARGS.find(a=>a[0]===UI.vr.draftArg)||[])[2]||'')}</div>
    <div class="small" style="margin-top:8px">Gesamtwert für ihn ca. <b>${money(bidValue(normBid(b),p))}</b> · <span class="${close>=.9?'good':close>=.75?'gold':'bad'}">${hint}</span> · Transferbudget ${money(u.tBudget)}</div>
    <div class="row" style="margin-top:10px"><button class="btn pri" data-act="vrClubGo">Angebot vorlegen</button>${C.counter?`<button class="btn" data-act="vrClubAccept">Seinen Vorschlag annehmen (${money(bidTotal(C.counter))})</button>`:''}</div>`;
  return `<div class="vrgrid"><div>${vrLog(C.msgs,p,C.dir)}</div><div class="card vrpanel">${meter('Geduld des Sportdirektors',C.pat)}<div class="small muted" style="margin:2px 0 10px">Runde ${C.round} · Beziehung zu ${esc(club(p.club).short)}: ${relOf(p.club)>0?'gut':relOf(p.club)<0?'angespannt':'neutral'}</div>${ctrl}</div></div>`;
}
function vrPlayerView(p,V){
  const P=V.player,u=userClub(),known=P.known.map(k=>`<span class="pill gold">★ ${PRIO_LBL[k]}</span>`).join(' ');
  const ctrl=P.st!=='open'?`<div class="news ${P.conv>=25?'t-transfer':'t-coach'}">Gespräch beendet – Überzeugung ${P.conv} %.</div>${P.conv>=25?`<button class="btn pri" data-act="vrStep" data-v="agent" style="margin-top:8px">Weiter zum Berater ▶</button>`:''}`:
    `<div class="small muted" style="margin-bottom:6px">Noch ${P.turns} Gesprächszüge. Fragen helfen, seine Prioritäten zu verstehen – Versprechen werden gespeichert und später überprüft.</div>
     <div class="vrargs col">${VR_PITCH.filter(x=>x[0]!=='play').map(([k,l])=>`<button class="${P.used[k]?'used':''}" data-act="vrPl" data-v="${k}" ${P.turns<=0?'disabled':''}>${l}</button>`).join('')}</div>
     <label class="f" style="margin-top:10px">⚽ Rolle versprechen <span class="muted">(Empfehlung: ${ROLES[suggestRole(p,u)].short})</span></label>
     <div class="seg">${ROLE_ORDER.filter(r=>r!=='perspektive'||p.age<=21).map(r=>`<button class="${P.promise.role===r?'on':''}" data-act="vrPl" data-v="play" data-r="${r}" ${P.turns<=0?'disabled':''}>${ROLES[r].short}</button>`).join('')}</div>
     <div class="row" style="margin-top:12px"><button class="btn pri" data-act="vrPlEnd">Gespräch beenden</button></div>`;
  return `<div class="vrgrid"><div>${vrLog(P.msgs,p,fullname(p))}</div><div class="card vrpanel">${meter('Überzeugung',P.conv)}
    <div class="small" style="margin:6px 0 10px">${known?'Weiß ich schon: '+known:'<span class="muted">Was ihm wichtig ist, weißt du noch nicht.</span>'}${P.promise.role?`<div class="small" style="margin-top:4px">Versprochen: <b>${ROLES[P.promise.role].label}</b>${P.promise.title?', Kampf um Titel':''}</div>`:P.promise.title?'<div class="small" style="margin-top:4px">Versprochen: Kampf um Titel</div>':''}</div>${ctrl}</div></div>`;
}
function vrAgentView(p,V,clubOk,pDone){
  if(!clubOk)return `<div class="news t-offer">🔒 Zuerst die Ablöse mit dem Verein klären.</div>`;
  if(!pDone)return `<div class="news t-offer">🔒 Führe zuerst das Gespräch mit dem Spieler – danach verhandelst du mit dem Berater.</div><button class="btn pri" data-act="vrStep" data-v="player" style="margin-top:8px">Zum Spielergespräch ▶</button>`;
  if(V.player.conv<25)return `<div class="news t-coach">Der Spieler hat kein Interesse – der Berater lehnt Gespräche ab.</div>`;
  const G=V.agent,u=userClub(),o=G.offer,AV=AG_V[G.A.type];
  const v=pkgVal(wk(o.mw),o.years,o.si,o.af,AV.afw),close=v/G.ask;
  const free=u.wBudget-wageBill(u),nt=netOf(wk(o.mw)*52,u.assoc);
  const ctrl=G.st!=='open'?`<div class="news ${G.st==='agreed'?'t-transfer':'t-coach'}">${G.st==='agreed'?'✅ Einigung!':'❌ Abgebrochen.'}</div>`:
   `<label class="f">Gehalt brutto / Monat</label><div class="row">${vrAmt('agent.mw',o.mw)}<span class="small muted">netto ca. ${money(nt.net/12)}</span></div>
    <label class="f" style="margin-top:8px">Laufzeit</label><div class="seg">${[1,2,3,4,5].map(y=>`<button class="${o.years===y?'on':''}" data-act="vrSet" data-k="agent.years" data-v="${y}">${y} J.</button>`).join('')}</div>
    <label class="f" style="margin-top:8px">Rolle</label><div class="seg">${ROLE_ORDER.filter(r=>r!=='perspektive'||p.age<=21).map(r=>`<button class="${o.role===r?'on':''}" data-act="vrSet" data-k="agent.role" data-v="${r}">${ROLES[r].short}</button>`).join('')}</div>
    <div class="row" style="margin-top:8px;gap:14px"><div><label class="f">Handgeld</label>${vrAmt('agent.si',o.si)}</div><div><label class="f">Beraterhonorar</label>${vrAmt('agent.af',o.af)}</div></div>
    <label class="f" style="margin-top:10px">Taktik</label><div class="vrargs">${AG_TAC.map(([k,l])=>`<button class="${(UI.vr.agTac||'neutral')===k?'on':''}" data-act="vrAgTac" data-v="${k}" ${k==='bluff'&&!G.rival?'disabled':''}>${l}</button>`).join('')}</div>
    <div class="small" style="margin-top:8px"><span class="${close>=.985?'good':close>=.9?'gold':'bad'}">${close>=.985?'Das sollte reichen.':close>=.9?'Nah dran.':close>=.75?'Da fehlt noch etwas.':'Weit auseinander.'}</span> · Gehaltsbudget frei ${money(mon(free))}/Monat · Transferbudget ${money(u.tBudget)}</div>
    <div class="row" style="margin-top:10px"><button class="btn pri" data-act="vrAgGo">Angebot machen</button>${G.counter?`<button class="btn" data-act="vrAgAccept">Seinen Vorschlag annehmen (${money(G.counter.mw)}/Monat · ${money(G.counter.si+G.counter.af)} einmalig)</button>`:''}</div>
    <div class="small muted" style="margin-top:6px">Dem Berater ist sein Honorar ${AV.afw>1.2?'besonders ':''}wichtig${AV.afw>1.2?' – hier lässt sich Gehalt sparen':''}.</div>`;
  return `<div class="vrgrid"><div>${vrLog(G.msgs,p,G.A.name)}</div><div class="card vrpanel">${meter('Geduld des Beraters',G.pat)}${meter('Überzeugung des Spielers',V.player.conv)}<div style="margin-top:10px">${ctrl}</div></div></div>`;
}
function vrScroll(){setTimeout(()=>{const e=document.getElementById('vrlog');if(e)e.scrollTop=e.scrollHeight},0)}
function vrPath(V,path){const [a,k]=path.split('.');return a==='club'?[V.club.offer,k]:[V.agent.offer,k]}
Object.assign(ACT,{
  vrOpen:d=>{UI.vrDone=null;vrOpen(d.id);vrScroll()},
  vrClose:()=>{UI.modal=null;UI.vr=null;UI.vrDone=null;S.rng=RNG;save();render()},
  vrStep:d=>{const V=vrOf(UI.vr.pid);V.step=d.v;render();vrScroll()},
  vrArg:d=>{UI.vr.draftArg=d.v;render()},
  vrAgTac:d=>{UI.vr.agTac=d.v;render()},
  vrSet:d=>{const V=vrOf(UI.vr.pid),[o,k]=vrPath(V,d.k);o[k]=isNaN(+d.v)?d.v:+d.v;render()},
  vrClubGo:()=>{const p=S.players[UI.vr.pid];vrClubPropose(p,UI.vr.draftArg);UI.vr.draftArg='neutral';render();vrScroll()},
  vrClubAccept:()=>{const p=S.players[UI.vr.pid],C=S.vr[p.id].club,u=userClub();if(!C.counter)return;if(C.counter.fee>u.tBudget){vrSay(C,'sys','Dafür reicht dein Transferbudget nicht.');render();return}vrClubAgree(p,C.counter,'Sehr gut. Dann haben wir einen Deal.');render();vrScroll()},
  vrPl:d=>{const p=S.players[UI.vr.pid];vrPlayerMove(p,d.v,d.r);render();vrScroll()},
  vrPlEnd:()=>{const p=S.players[UI.vr.pid];vrPlayerEnd(p);render();vrScroll()},
  vrAgGo:()=>{const p=S.players[UI.vr.pid];vrAgentMove(p,UI.vr.agTac||'neutral');UI.vr.agTac='neutral';render();vrScroll()},
  vrAgAccept:()=>{const p=S.players[UI.vr.pid],G=S.vr[p.id].agent;if(!G.counter)return;G.offer={...G.counter};vrAgentAgree(p,'Wunderbar. Wir sind uns einig.');render();vrScroll()}
});
Object.assign(CHG,{vrAmt:el=>{const V=vrOf(UI.vr.pid),[o,k]=vrPath(V,el.dataset.k),v=parseMoney(el.value);if(isNaN(v)){toast('Bitte einen gültigen Betrag eingeben');render();return}o[k]=Math.round(v);render()}});
