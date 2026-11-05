/* =====================================================================
   Seitenlinie – Presse: Pressekonferenzen vor und nach dem Spiel,
   Schlagzeilen, öffentliches Bild. Deine Worte wirken auf Mannschaft,
   einzelne Spieler, Fans, Vorstand und Sportdirektor.
   ===================================================================== */
const OUTLETS=['Sportblatt','Abendpost','Fußball-Echo','Rundschau','Kanal 7 Sport','Stadionfunk','Tagesanzeiger','Fanradio 90'];
function pressOf(){S.press=S.press||{img:55,log:[],done:{}};return S.press}
function jName(R){const pool=poolArr(ASSOC[userClub().assoc]?ASSOC[userClub().assoc].pool:'de');return pool.f[Math.floor(R()*pool.f.length)]+' '+pool.l[Math.floor(R()*pool.l.length)]}
function imgLbl(v){return v>=75?'Liebling der Medien':v>=58?'positiv':v>=42?'neutral':v>=28?'kritisch beäugt':'Buhmann der Presse'}
function sqMor(){const s=squadOf(userClub());return s.reduce((t,p)=>t+p.mor,0)/Math.max(1,s.length)}
const TONE={conf:'selbstbewusst',calm:'diplomatisch',humble:'demütig',dodge:'ausweichend',hot:'angriffslustig',warm:'schützend',hard:'deutlich'};

/* ---------- Fragen aus der aktuellen Lage ---------- */
function pkQuestions(kind){
  const u=userClub(),sq=squadOf(u),P=pressOf(),R=mkRng(hashStr('pk'+kind+S.season+':'+S.week+':'+S.seed)),f=userForm(),rk=rankOf(S.user),B=boardOf(),sd=sdName();
  const Q=[];const opt=(t,tone,fx,hl)=>({t,tone,fx:fx||{},hl});
  if(kind==='pre'){
    const g=nextUserGames()[0];if(!g)return [];const o=club(g.m.h===S.user?g.m.a:g.m.h),fav=clubAvg(u)-clubAvg(o);
    Q.push({topic:'Gegner',q:`Trainer, ${g.comp?'im '+g.label:'am Wochenende'} geht es gegen ${o.name}. Was erwarten Sie?`,opts:[
      opt('Wir wollen die drei Punkte – und wir werden sie holen.','conf',{team:2,img:1,claim:'win',mm:.006},`Kampfansage! ${mgrLast()} verspricht den Sieg gegen ${o.name}`),
      opt(`${o.name} hat Qualität, aber wir haben einen klaren Plan.`,'calm',{team:1},null),
      opt(fav>3?'Wir sind Favorit, aber das heißt nichts.':'Wir sind Außenseiter – ein Punkt wäre schon ein Erfolg.','humble',{team:fav>3?0:-1,board:fav>3?0:-1},fav>3?null:`${mgrLast()} tiefstapelt vor ${o.name}`),
      opt('Ehrlich gesagt mache ich mir um den Gegner keine großen Gedanken.','hot',{team:2,img:-3,mm:.01,claim:'win',risk:1},`Arrogant? ${mgrLast()} unterschätzt ${o.name}`)]});
    const coach=o.staff.coach.name;
    const OQ=S.oppQuote&&S.oppQuote.s===S.season&&S.oppQuote.w===S.week&&S.oppQuote.cid===o.id?S.oppQuote:null;
    if(OQ||R()<.3)Q.push({topic:'Gegnertrainer',q:OQ?`${coach} hat gesagt: „${OQ.q}“ Was entgegnen Sie?`:`${coach} hat gesagt, Ihre Mannschaft sei „leicht auszurechnen“. Ihre Antwort?`,opts:[
      opt('Ich lasse lieber meine Mannschaft auf dem Platz antworten.','calm',{img:2,team:1},null),
      opt(`${coach.split(' ').pop()} sollte sich um seine eigene Mannschaft kümmern.`,'hot',{team:2,img:-1,mm:.005},`Zoff vor dem Spiel: ${mgrLast()} kontert ${coach.split(' ').pop()}`),
      opt('Dann wird er am Wochenende eine Überraschung erleben.','conf',{team:1,claim:'win'},null)]});
  }
  if(kind==='post'){
    const r=(S.ureps||[]).slice(-1)[0];if(!r)return [];const o=club(r.opp),win=r.gf>r.ga,loss=r.gf<r.ga,top=r.top&&S.players[r.top],low=r.low&&S.players[r.low];
    Q.push({topic:'Ergebnis',q:win?`Ein ${r.gf}:${r.ga} gegen ${o.name} – wie zufrieden sind Sie?`:loss?`Ein ${r.gf}:${r.ga} gegen ${o.name}. Was ist schiefgelaufen?`:`${r.gf}:${r.ga} gegen ${o.name} – Punkt gewonnen oder zwei verloren?`,opts:win?[
      opt('Die Mannschaft hat genau umgesetzt, was wir besprochen haben.','calm',{team:2},null),
      opt('Das war eine Machtdemonstration. So wollen wir auftreten.','conf',{team:3,img:-1},`${mgrLast()} nach dem ${r.gf}:${r.ga}: „Machtdemonstration!“`),
      opt('Wir hatten auch Glück. Es gibt noch viel zu verbessern.','humble',{team:-1,img:2},null)]:loss?[
      opt('Ich übernehme die Verantwortung. Das geht auf meine Kappe.','warm',{team:2,img:2,board:1},`${mgrLast()} nimmt die Schuld auf sich`),
      opt('Einige haben heute nicht ihr Niveau erreicht. Das werden wir intern deutlich ansprechen.','hard',{team:-3,img:1,low:-8},`Abrechnung: ${mgrLast()} kritisiert seine Spieler`),
      opt('Der Schiedsrichter hat heute das Spiel entschieden.','hot',{img:-3,board:-2,fine:1,team:1},`${mgrLast()} wütet gegen den Schiedsrichter – Strafe droht`),
      opt('Wir haken das ab und schauen nach vorne.','dodge',{},null)]:[
      opt('Ein Punkt, mit dem wir leben können.','calm',{team:1},null),
      opt('Zwei verlorene Punkte. Das ärgert mich gewaltig.','hard',{team:-1,img:1},null),
      opt('Die Moral der Mannschaft war beeindruckend.','warm',{team:2},null)]});
    if(top&&top.club===S.user)Q.push({topic:'Spieler',q:`${top.fn} ${top.ln} war heute überragend. Was zeichnet ihn aus?`,opts:[
      opt(`${top.ln} ist ein Schlüsselspieler für uns – so einen findet man nicht oft.`,'warm',{pl:[top.id,6]},`Lob vom Trainer: ${top.ln} ist „ein Schlüsselspieler“`),
      opt('Es war eine Teamleistung. Ich will keinen hervorheben.','calm',{team:1,pl:[top.id,-1]},null),
      opt(`Er hat gut gespielt – aber da geht noch mehr.`,'hard',{pl:[top.id,-2]},null)]});
    if(low&&low.club===S.user&&!win)Q.push({topic:'Kritik',q:`${low.fn} ${low.ln} wirkte heute überfordert. Hat er noch Ihr Vertrauen?`,opts:[
      opt('Selbstverständlich. Jeder hat mal einen schlechten Tag.','warm',{pl:[low.id,6],team:1},null),
      opt('Er weiß selbst, dass das zu wenig war.','hard',{pl:[low.id,-6],img:1},`${mgrLast()} stellt ${low.ln} öffentlich bloß`),
      opt('Zu einzelnen Spielern äußere ich mich nicht.','dodge',{},null)]});
  }
  // Lagefragen – passend zur Situation
  const pool=[];
  if(f<=-.3)pool.push({topic:'Krise',q:`Die letzten Spiele liefen schlecht. Wackelt Ihr Stuhl?`,opts:[
    opt('Ich spüre den vollen Rückhalt des Vereins.','conf',{img:B.trust>=50?1:-3},B.trust<50?`„Voller Rückhalt“? ${mgrLast()} unter Druck`:null),
    opt('Die Kritik ist berechtigt. Wir müssen liefern.','humble',{team:1,board:1},null),
    opt('Fragen Sie das den Aufsichtsrat.','hot',{board:-3,img:-2,risk:1},`Eklat: ${mgrLast()} schiebt die Verantwortung ab`),
    opt('Die Mannschaft lebt – das sieht man jeden Tag im Training.','warm',{team:2},null)]});
  if(f>=.4)pool.push({topic:'Höhenflug',q:`Starke Serie – ist jetzt mehr drin als „${u.target.t}“?`,opts:[
    opt('Wir schauen nur von Spiel zu Spiel.','calm',{team:1},null),
    opt('Warum nicht? Wir greifen an.','conf',{team:2,img:2,board:1},`${mgrLast()}: „Wir greifen an!“`),
    opt('Bleiben wir auf dem Boden. Die Saison ist lang.','humble',{img:1},null)]});
  const inj=sq.filter(p=>p.inj>=2&&ROLE_ORDER.indexOf(p.role)<=1).sort((a,b)=>ovr(b)-ovr(a))[0];
  if(inj){const bk=sq.filter(p=>p.pos===inj.pos&&p.inj===0&&p.id!==inj.id).sort((a,b)=>ovr(b)-ovr(a))[0];pool.push({topic:'Verletzung',q:`Wie schwer wiegt der Ausfall von ${inj.fn} ${inj.ln}?`,opts:[
    opt('Er fehlt uns, aber andere stehen bereit.','calm',{team:1},null),
    opt('Das ist ein schwerer Schlag für uns.','humble',{team:-2},null),
    ...(bk?[opt(`${bk.ln} brennt darauf – er bekommt jetzt seine Chance.`,'warm',{pl:[bk.id,7]},`Jetzt schlägt die Stunde von ${bk.ln}`)]:[])]})}
  const bench=sq.filter(p=>!u.lineup.includes(p.id)&&p.inj===0&&ROLE_ORDER.indexOf(p.role)<=1&&(p.unhappy||p.mor<50)).sort((a,b)=>ovr(b)-ovr(a))[0];
  if(bench)pool.push({topic:'Bankspieler',q:`${bench.fn} ${bench.ln} sitzt nur auf der Bank. Ist er unzufrieden?`,opts:[
    opt('Er wird seine Chance bekommen, versprochen.','warm',{pl:[bench.id,8]},null),
    opt('Wer spielt, entscheide ich nach Leistung im Training.','hard',{pl:[bench.id,-4],team:1},null),
    opt('Er muss sich mehr anbieten. Der Ball liegt bei ihm.','hard',{pl:[bench.id,-9],img:1},`${mgrLast()} watscht ${bench.ln} ab`)]});
  const star=(S.offers||[]).map(o=>S.players[o.pid]).filter(Boolean)[0]||sq.filter(p=>ovr(p)>=clubAvg(u)+4&&p.age<=27).sort((a,b)=>b.val-a.val)[0];
  if(star&&(isWindow()||windowSoon())){const ic=S.clubs.filter(c=>!c.guest&&c.rep>u.rep).sort(()=>R()-.5)[0];if(ic)pool.push({topic:'Gerücht',q:`Angeblich ist ${ic.name} an ${star.fn} ${star.ln} interessiert. Bleibt er?`,opts:[
    opt(`${star.ln} ist unverkäuflich. Punkt.`,'conf',{pl:[star.id,5],nfs:star.id,rel:mayDo('sell')?0:-3,img:1},`${mgrLast()} macht ${star.ln} zum Unverkäuflichen`),
    opt(`Dazu äußere ich mich nicht – das ist Sache von ${mayDo('sell')?'uns intern':sd}.`,'dodge',{rel:2},null),
    opt('Jeder Spieler hat seinen Preis.','hard',{pl:[star.id,-6],rel:-1,fan:-3},`${mgrLast()} öffnet die Tür für einen ${star.ln}-Verkauf`)]})}
  if(isWindow()){const wp=weakestPos(u);pool.push({topic:'Transfers',q:'Braucht die Mannschaft noch Verstärkung?',opts:[
    opt(`Ja – auf der Position ${POS_LABEL[wp.pos]} wollen wir nachlegen.`,'conf',{team:-1,rel:mayDo('buy')?0:-3,need:wp.pos},`${mgrLast()} fordert Verstärkung – Druck auf ${mayDo('buy')?'die Kaderplanung':sd}`),
    opt('Ich bin mit meinem Kader sehr zufrieden.','warm',{team:2},null),
    opt(`Das bespreche ich intern${mayDo('buy')?'':' mit '+sd}.`,'dodge',{rel:2},null)]})}
  if(!mayDo('buy')&&(rel()<48||B.trust<45))pool.push({topic:'Führung',q:`Wie ist Ihr Verhältnis zu ${sd}?`,opts:[
    opt('Wir arbeiten eng und vertrauensvoll zusammen.','calm',{rel:3},null),
    opt('Wir sind nicht immer einer Meinung – das ist im Fußball normal.','dodge',{rel:-1,img:1},null),
    opt('Fragen Sie ihn selbst.','hot',{rel:-7,img:-1,risk:1},`Eiszeit zwischen ${mgrLast()} und ${sd.split(' ').pop()}`)]});
  const yg=sq.filter(p=>p.age<=20&&p.pot>=clubAvg(u)).sort((a,b)=>b.pot-a.pot)[0];
  if(yg)pool.push({topic:'Talent',q:`Alle reden über ${yg.fn} ${yg.ln}. Wird er bald Stammspieler?`,opts:[
    opt('Er hat eine große Zukunft vor sich.','warm',{pl:[yg.id,6],img:1},`${mgrLast()} adelt Talent ${yg.ln}`),
    opt('Langsam – wir dürfen ihn nicht verheizen.','calm',{pl:[yg.id,-1]},null),
    opt('Er muss noch viel lernen.','hard',{pl:[yg.id,-5]},null)]});
  pool.push({topic:'Saisonziel',q:`Platz ${rk} – ist das Saisonziel „${u.target.t}“ noch realistisch?`,opts:[
    opt('Absolut. Daran halten wir fest.','conf',{board:rk<=u.target.r?1:0,img:rk<=u.target.r?1:-1},null),
    opt('Abgerechnet wird am Schluss.','calm',{},null),
    opt('Wir müssen ehrlich sein: Das wird schwer.','humble',{team:-2,board:-2},`${mgrLast()} rückt vom Saisonziel ab`)]});
  while(Q.length<3&&pool.length){const i=Math.floor(R()*pool.length);Q.push(pool.splice(i,1)[0])}
  return Q.map(q=>({...q,j:jName(R),o:OUTLETS[Math.floor(R()*OUTLETS.length)]}));
}

/* ---------- Ablauf ---------- */
function pkAvail(kind){
  if(!S||S.user===null||S.fired)return false;const P=pressOf();
  if(kind==='pre'){const g=nextUserGames()[0];return !!g&&g.w===S.week&&!P.done['pre'+S.season+':'+S.week]&&S.week<S.weeks}
  return !!P.post&&P.post.s===S.season&&P.post.w===S.week&&!P.done['post'+S.season+':'+S.week];
}
function pkOpen(kind){
  const Q=pkQuestions(kind);if(!Q.length)return;const u=userClub(),med=owner('press')!=='coach'?crewOf(u)[owner('press')]:null;
  UI.ct={role:'_press',msgs:[],pend:[],pk:{kind,Q,i:0,ans:[]}};
  ctSay('sys',kind==='pre'?`Presseraum · ${u.name} · Pressekonferenz vor dem Spiel`:`Mixed Zone & Presseraum · nach dem Abpfiff`);
  if(med){const risky=Q.find(q=>q.opts.some(o=>o.fx.risk||o.fx.img<=-3));
    ctSay('them',`*${med.name}, ${roleLbl(owner('press'))}, flüstert dir vorab zu* ${med.q>=9?`Die Kollegen werden nach ${Q.map(q=>q.topic).join(', ')} fragen.`:'Heute sind viele Journalisten da.'}${risky&&med.q>=12?` Vorsicht beim Thema „${risky.topic}“ – da suchen sie eine Schlagzeile.`:''}`)}
  pkAsk();UI.modal=pkModal();render();
}
function pkAsk(){const C=UI.ct,K=C.pk,q=K.Q[K.i];if(!q)return;ctSay('them',`*${q.j} (${q.o})* ${q.q}`)}
function pkModal(){return ()=>{
  const C=UI.ct;if(!C||!C.pk)return '';setTimeout(ctPump,0);const K=C.pk,busy=C.pend.length>0,q=K.Q[K.i],P=pressOf(),med=owner('press')!=='coach'?crewOf(userClub())[owner('press')]:null,warn=med&&med.q>=12;
  return `<div class="vrc"><div class="vrhead"><div><h2 style="margin:0">${K.title||'🎙️ Pressekonferenz '+(K.kind==='pre'?'vor dem Spiel':'nach dem Spiel')}</h2><div class="small muted">Frage ${Math.min(K.i+1,K.Q.length)} von ${K.Q.length}${med?' · vorbereitet von '+esc(med.name):''}</div></div></div>
   <div class="vrgrid"><div>${vrLog(C.msgs,null,'Presse',busy?'Journalisten':null)}</div><div class="card vrpanel ${busy?'busy':''}">${meter('Bild in der Öffentlichkeit',P.img)}${meter('Stimmung Mannschaft',sqMor())}
    ${q?`<label class="f" style="margin-top:10px">Deine Antwort</label><div class="vrargs col">${q.opts.map((o,i)=>`<button data-act="pkAns" data-v="${i}">${esc(o.t)}<br><small class="muted" style="font-weight:400">${TONE[o.tone]}${warn&&(o.fx.risk||o.fx.img<=-3)?' · ⚠️ riskant':''}</small></button>`).join('')}</div>`
     :`<p class="small muted" style="margin-top:10px">${K.kind==='iv'?'Das Interview ist beendet.':'Die Pressekonferenz ist beendet.'}</p>${K.hl?`<div class="news t-board"><b>Morgen in der Zeitung:</b><br>${esc(K.hl)}</div>`:''}`}
   </div></div><div class="row" style="margin-top:12px;justify-content:flex-end">${q?`<button class="btn" data-act="pkSkip">Frage abblocken</button>`:''}<button class="btn ${q?'':'pri'}" data-act="pkClose">${q?'Pressekonferenz abbrechen':'Fertig'}</button></div></div>`;
}}
const PK_REACT={conf:['*Kameras klicken*','*Raunen im Raum*','*einige Journalisten notieren eifrig*'],calm:['*nickt*','*notiert*','*nächste Wortmeldung*'],humble:['*überraschte Blicke*','*notiert*'],dodge:['*leises Murren*','*Nachfrage wird abgewunken*'],hot:['*Unruhe im Raum*','*Blitzlichtgewitter*','*der Pressesprecher räuspert sich*'],warm:['*nickt anerkennend*','*notiert*'],hard:['*Stille*','*Kugelschreiber kratzen*']};
function pkFx(fx){
  const u=userClub(),P=pressOf(),B=boardOf();
  if(fx.team)for(const p of squadOf(u))p.mor=clamp(p.mor+fx.team,15,100);
  if(fx.pl){const p=S.players[fx.pl[0]];if(p)p.mor=clamp(p.mor+fx.pl[1],15,100)}
  if(fx.low){const r=(S.ureps||[]).slice(-1)[0];for(const id of (r&&r.lows)||[]){const p=S.players[id];if(p&&p.club===S.user)p.mor=clamp(p.mor+fx.low,15,100)}}
  if(fx.img)P.img=clamp(P.img+fx.img*(1+.15*ownerK('press')),0,100);
  if(fx.board)B.trust=clamp(B.trust+fx.board,0,100);
  if(fx.rel)relAdd(fx.rel);
  if(fx.mm){P.mm=(P.mm||0)+fx.mm;P.mmW=S.week}
  if(fx.claim)P.claim={w:S.week,s:S.season};
  if(fx.nfs){const p=S.players[fx.nfs];if(p){p.nfs=true;p.listed=false}}
  if(fx.need&&!mayDo('buy')){S.needs=(S.needs||[]).filter(n=>!(n.pos===fx.need&&n.season===S.season));S.needs.push({pos:fx.need,prio:1,season:S.season,w:S.week,st:'open'})}
  if(fx.fine){const amt=nice(25000*Math.max(.3,u.econ));u.budget-=amt;S.fin.staff=(S.fin.staff||0)+amt;P.fine=amt}
}
function pkAnswer(i){
  const C=UI.ct,K=C.pk,q=K.Q[K.i];if(!q)return;const o=q.opts[i];
  ctSay('me',o.t);pkFx(o.fx);feudTone(o.tone);fanAdd(userClub(),({conf:1.5,hot:1.5,humble:-1,dodge:-.5,warm:.5,hard:0,calm:0}[o.tone]||0)+(o.fx.fan||0)+(o.fx.nfs?3:0)+(o.fx.fine?2:0));K.ans.push({q:q.q,t:o.t,topic:q.topic,tone:o.tone,hl:o.hl,o:q.o,w:Math.abs(o.fx.img||0)+(o.fx.risk?3:0)+(o.hl?2:0)});
  ctSay('them',bpick(PK_REACT[o.tone]||['*notiert*']));K.i++;
  if(K.i<K.Q.length)pkAsk();else pkEnd();
}
function pkEnd(){
  if(UI.ct.pk.kind==='iv')return ivEnd();
  const C=UI.ct,K=C.pk,P=pressOf(),u=userClub();P.done[K.kind+S.season+':'+S.week]=1;
  const best=K.ans.filter(a=>a.hl).sort((a,b)=>b.w-a.w)[0],calm=K.ans.every(a=>['calm','dodge','humble'].includes(a.tone));
  K.hl=best?best.hl:calm?`${mgrLast()} bleibt gelassen – keine Schlagzeilen aus ${u.short==='?'?'dem Verein':u.name}`:null;
  ctSay('sys',P.fine?`Der Verband prüft deine Schiedsrichter-Kritik – Geldstrafe ${money(P.fine)}.`:'Die Pressekonferenz ist beendet.');
  if(K.hl){P.log.unshift({s:S.season,w:S.week,o:best?best.o:bpick(OUTLETS),hl:K.hl});P.log=P.log.slice(0,20);mediaFromPk(K.hl,best?best.o:'Die Presse');addNews('press',`📰 ${best?best.o:'Presse'}: ${K.hl}`,`Nach der Pressekonferenz ${K.kind==='pre'?'vor dem Spiel':'nach dem Spiel'}. Bild in der Öffentlichkeit: ${Math.round(P.img)} (${imgLbl(P.img)}).`)}
  P.fine=0;
}
function pkSkipAll(kind){const P=pressOf(),u=userClub(),ast=crewOf(u).ast;P.done[kind+S.season+':'+S.week]=1;P.img=clamp(P.img-2,0,100);
  addNews('press','📰 Trainer schwänzt Pressekonferenz',`${ast?esc(ast.name)+' (Co-Trainer)':'Der Pressesprecher'} beantwortete die Fragen. Die Journalisten sind verstimmt – Bild in der Öffentlichkeit ${Math.round(P.img)}.`)}

/* ---------- Woche: Wirkung von Ansagen und öffentlichem Bild ---------- */
function pressWeekly(res){
  if(!S||S.user===null||S.fired)return;const P=pressOf(),B=boardOf(),list=res.userList||[];
  if(list.length){const last=list[list.length-1],m=last.m,home=m.h===S.user,gf=home?m.hg:m.ag,ga=home?m.ag:m.hg;
    if(P.claim&&P.claim.s===S.season&&P.claim.w===S.week-1){
      if(gf>ga){P.img=clamp(P.img+3,0,100);fanAdd(userClub(),2);addNews('press','📰 Wort gehalten',`${mgrLast()} hatte den Sieg angekündigt – und geliefert. Die Presse ist beeindruckt.`)}
      else{P.img=clamp(P.img-5,0,100);fanAdd(userClub(),-3);B.trust=clamp(B.trust-2,0,100);addNews('press','📰 Große Klappe, nichts dahinter',`${mgrLast()} hatte vollmundig den Sieg versprochen – jetzt hagelt es Spott. Bild in der Öffentlichkeit: ${Math.round(P.img)}.`)}}
    P.post={s:S.season,w:S.week}}
  P.claim=P.claim&&P.claim.w>=S.week-1?P.claim:null;
  P.img=clamp(P.img+(50-P.img)*.03+userForm()*1.2,0,100);
  B.trust=clamp(B.trust+(P.img-50)*.02+(fansOf(userClub()).mood-55)*.012,0,100);
}
function pressMul(c){const P=S&&S.press;return c.id===S.user&&P&&P.mmW===S.week?1+Math.min(.015,P.mm||0):1}
function pressHome(){
  if(!S||S.user===null||S.fired)return '';const P=pressOf();let h=ivHome();
  if(pkAvail('pre'))h+=`<div class="news t-press"><b>🎙️ Pressekonferenz vor dem Spiel</b><div class="small">Die Journalisten warten. Deine Worte wirken auf Mannschaft, Fans und Vorstand.</div><div class="row" style="margin-top:6px"><button class="btn sm pri" data-act="pkOpen" data-v="pre">Zur Pressekonferenz</button><button class="btn sm" data-act="pkSkipAll" data-v="pre">Co-Trainer schicken</button></div></div>`;
  if(pkAvail('post'))h+=`<div class="news t-press"><b>🎙️ Pressekonferenz nach dem Spiel</b><div class="small">${(()=>{const r=(S.ureps||[]).slice(-1)[0];return r?`${r.gf}:${r.ga} gegen ${esc(club(r.opp).name)} – die Reporter haben Fragen.`:''})()}</div><div class="row" style="margin-top:6px"><button class="btn sm pri" data-act="pkOpen" data-v="post">Zur Pressekonferenz</button><button class="btn sm" data-act="pkSkipAll" data-v="post">Auslassen</button></div></div>`;
  const L=P.log.slice(0,3);
  const F=fansOf(userClub()),[fi,fl]=fanLbl(F.mood);
  h+=`<div class="news t-fans"><b>📣 Fans: ${fi} ${fl}</b> <span class="small muted">· Stimmung ${Math.round(F.mood)}${F.next==='choreo'?' · Choreo geplant':F.next?' · Protest angekündigt':''}</span> <button class="btn sm" data-act="fans" style="margin-left:6px">Zu den Fans</button></div>`;
  h+=`<div class="news t-press"><b>📰 Pressespiegel</b> <span class="small muted">· Bild in der Öffentlichkeit ${Math.round(P.img)} – ${imgLbl(P.img)}</span>${L.length?L.map(x=>`<div class="small" style="margin-top:3px"><b>${esc(x.o)}:</b> ${esc(x.hl)} <span class="muted">(W${x.w+1})</span></div>`).join(''):'<div class="small muted">Noch keine Schlagzeilen.</div>'}<div style="margin-top:6px"><button class="btn sm" data-act="pressReview">Alle Schlagzeilen der Liga</button></div></div>`;
  return h;
}
Object.assign(ACT,{
  pkOpen:d=>pkOpen(d.v),
  pkAns:d=>{pkAnswer(+d.v);render();setTimeout(()=>{const e=document.getElementById('vrlog');if(e)e.scrollTop=e.scrollHeight},0)},
  pkSkip:()=>{const C=UI.ct,K=C&&C.pk;if(!K||!K.Q[K.i])return;ctSay('me','Dazu sage ich heute nichts.');pressOf().img=clamp(pressOf().img-1,0,100);ctSay('them','*leises Murren*');K.i++;if(K.i<K.Q.length)pkAsk();else pkEnd();render()},
  pkClose:()=>{const C=UI.ct;if(C&&C.pk&&C.pk.i<C.pk.Q.length){pressOf().done[C.pk.kind+S.season+':'+S.week]=1;pressOf().img=clamp(pressOf().img-2,0,100)}ACT.ctClose()},
  pkSkipAll:d=>{pkSkipAll(d.v);save();render()}
});
