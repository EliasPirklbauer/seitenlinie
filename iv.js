/* =====================================================================
   Seitenlinie – Interviews: Redaktionen fragen an, du sagst zu oder ab –
   oder bietest selbst ein Interview an. Jede Redaktion fragt in ihrem
   Stil, deine Antworten erscheinen als Artikel im Medienzentrum.
   ===================================================================== */
const IV_OUT={sportblatt:'kessler',abendpost:'pohl',echo:'arslan',taktik:'amann',rundschau:'ebert',kanal7:'voss'};
function mrel(o){S.mrel=S.mrel||{};if(S.mrel[o]===undefined)S.mrel[o]=50;return S.mrel[o]}
function mrelAdd(o,d){mrel(o);S.mrel[o]=clamp(S.mrel[o]+d,0,100)}
function mrelLbl(v){return v>=72?'Sehr gut':v>=55?'Gut':v>=40?'Neutral':v>=25?'Angespannt':'Feindselig'}

/* ---------- Anfragen ---------- */
function ivWeekly(){
  if(!S||S.user===null||S.fired)return;S.ivReq=(S.ivReq||[]).filter(r=>r.st==='open'&&r.exp>=S.week&&r.s===S.season);
  const open=S.ivReq.length;if(open)return;const u=userClub(),f=userForm(),half=Math.floor(S.weeks/2);let o=null,why='';
  if(S.week===half){o='sportblatt';why='das große Halbzeit-Interview'}
  else if(f<=-.4&&rnd()<.35){o='abendpost';why='die Krise'}
  else if(f>=.5&&rnd()<.25){o=rnd()<.5?'abendpost':'kanal7';why='den Höhenflug'}
  else if(isWindow()&&rnd()<.18){o='echo';why='die Transferpläne'}
  else if(rnd()<.08){o=pick(['taktik','rundschau','sportblatt','kanal7']);why={taktik:'deine Spielidee',rundschau:'Finanzen und Vereinsführung',sportblatt:'deine Arbeit als Trainer',kanal7:'die aktuelle Lage'}[o]}
  if(!o||mrel(o)<20&&o!=='abendpost')return;
  const a=IV_OUT[o];S.ivReq.push({id:'iv'+(S.nextId++),out:o,a,why,s:S.season,w:S.week,exp:S.week+1,st:'open'});
  addNews('press',`🎤 Interviewanfrage: ${MEDIA[o].n}`,`${AUTH[a].n} (${AUTH[a].r}) möchte mit dir über ${why} sprechen. Zu- oder absagen kannst du in der Übersicht oder unter „Medien“.`);
}

/* ---------- Fragen je Redaktion ---------- */
function ivQuestions(o){
  const u=userClub(),sq=squadOf(u),f=userForm(),rk=rankOf(S.user),B=boardOf(),sd=sdName(),A=AUTH[IV_OUT[o]],Q=[];
  const opt=(t,tone,fx,hl)=>({t,tone,fx:fx||{},hl});const L=mgrLast();
  const star=sq.filter(p=>!p.loan).sort((a,b)=>b.val-a.val)[0],un=sq.filter(p=>p.unhappy||p.mor<45).sort((a,b)=>ovr(b)-ovr(a))[0],yg=sq.filter(p=>p.age<=21).sort((a,b)=>b.pot-a.pot)[0],wp=weakestPos(u);
  const T=u.tactic;ensureTactic(u);
  if(o==='sportblatt'){
    Q.push({q:`Herr ${L}, Platz ${rk}. Wie fällt Ihre Zwischenbilanz aus?`,opts:[opt('Wir liegen im Plan, aber wir sind noch lange nicht fertig.','calm',{board:1},null),opt('Ich bin sehr zufrieden – die Mannschaft hat sich enorm entwickelt.','conf',{team:2,img:1},`${L}: „Die Mannschaft hat sich enorm entwickelt“`),opt('Ehrlich gesagt: Das ist zu wenig für unsere Ansprüche.','hard',{team:-2,board:1,img:1},`${L} schonungslos: „Das ist zu wenig“`)]});
    Q.push({q:'Wie würden Sie Ihre Spielidee in einem Satz beschreiben?',opts:[opt(`Wir wollen den Ball und das Spiel kontrollieren${T.style==='ballbesitz'?' – geduldig, aber mit Ziel':''}.`,'calm',{img:T.style==='ballbesitz'?2:0},null),opt('Hohes Tempo, aggressives Anlaufen, schnelles Umschalten.','conf',{img:T.press==='hoch'?2:0,team:1},`${L}: „Wir wollen den Gegner ersticken“`),opt('Erst einmal stabil stehen – dann zuschlagen.','calm',{img:T.men==='defensiv'||T.style==='konter'?2:-1},null)]});
    Q.push({q:'Was für ein Typ Trainer sind Sie in der Kabine?',opts:[opt('Fordernd, aber gerecht. Leistung entscheidet, sonst nichts.','hard',{team:1},null),opt('Nah an den Spielern. Ich will, dass jeder gern zur Arbeit kommt.','warm',{team:3},`${L}: „Jeder soll gern zur Arbeit kommen“`),opt('Ich bin der Chef. Das muss jeder wissen.','hot',{team:-2,img:-1},`Harte Hand: ${L} – „Ich bin der Chef“`)]});
    Q.push({q:`Und persönlich: Wo sehen Sie sich in fünf Jahren?`,opts:[opt(`Am liebsten immer noch hier bei ${u.name}.`,'warm',{board:3,fan:3},`${L} schwärmt: „Am liebsten noch in fünf Jahren hier“`),opt('Ganz oben. Ich will Titel gewinnen – egal wo.','conf',{board:-3,img:1,fan:-2},`${L} kokettiert mit größeren Aufgaben`),opt('Im Fußball plant man keine fünf Jahre.','dodge',{},null)]});
  }
  if(o==='abendpost'||o==='kanal7'){
    Q.push({q:f<=-.3?`Ganz ehrlich, Trainer: Haben Sie Angst um Ihren Job?`:`Alle reden vom Höhenflug. Heben Sie schon ab?`,opts:f<=-.3?[opt('Angst ist kein guter Berater. Ich arbeite.','calm',{img:1},null),opt('Ich spüre den Rückhalt – solche Fragen stellen nur Sie.','hot',{img:-2,board:B.trust>=50?1:-2},`${L} giftet: „Solche Fragen stellen nur Sie!“`),opt('Wenn die Ergebnisse nicht kommen, bin ich der Erste, der geht. So ist das Geschäft.','humble',{board:2,team:1},`${L}: „Dann bin ich der Erste, der geht“`)]
      :[opt('Abheben? Wir trainieren morgen wieder um zehn.','calm',{team:1,img:1},null),opt('Warum nicht träumen? Die Fans dürfen das.','conf',{fan:4,team:2},`${L} lässt die Fans träumen!`),opt('Wer abhebt, fliegt. Das weiß jeder in der Kabine.','hard',{team:1},null)]});
    if(un)Q.push({q:`Stimmt es, dass es zwischen Ihnen und ${un.fn} ${un.ln} kracht?`,opts:[opt('Quatsch. Er ist ein wichtiger Teil der Mannschaft.','warm',{pl:[un.id,7]},null),opt('Er weiß, was er tun muss, um zu spielen.','hard',{pl:[un.id,-6],img:1},`Zoff! ${L} lässt ${un.ln} abblitzen`),opt('Was in der Kabine passiert, bleibt in der Kabine.','dodge',{},null)]});
    if(star)Q.push({q:`Ihr Star ${star.ln}: Bleibt er, auch wenn ein Riesenangebot kommt?`,opts:[opt(`${star.ln} bleibt. Punkt. Darauf gebe ich mein Wort.`,'conf',{pl:[star.id,5],nfs:star.id,rel:mayDo('sell')?0:-4,fan:2},`${L} gibt sein Wort: ${star.ln} bleibt!`),opt(`Das entscheide nicht ich, sondern ${mayDo('sell')?'der Verein':sd}.`,'dodge',{rel:2,img:-1},null),opt('Bei der richtigen Summe muss man rechnen.','hard',{pl:[star.id,-6],fan:-3},`${L} öffnet die Tür: ${star.ln} zu haben?`)]});
    Q.push({q:`Rolf Krawinkel schreibt, Sie seien „${f<0?'ratlos':'ein Glücksritter'}“. Ihre Antwort?`,opts:[opt('Ich lese keine Zeitung. Schon gar nicht diese.','hot',{img:-1,fan:2},`${L} keilt gegen die Abendpost`),opt('Jeder darf seine Meinung haben. Ich messe mich an Ergebnissen.','calm',{img:2},null),opt('Herr Krawinkel ist herzlich zum Training eingeladen.','warm',{img:2},`${L} lädt Krawinkel zum Training ein`)]});
  }
  if(o==='echo'){
    Q.push({q:`Wo sehen Sie im Kader noch Handlungsbedarf?`,opts:[opt(`Auf der Position ${POS_LABEL[wp.pos]} wollen wir etwas machen.`,'conf',{need:wp.pos,rel:mayDo('buy')?0:-3,team:-1},`${L} bestätigt: ${u.name} sucht einen ${POS_LABEL[wp.pos]}`),opt('Wir sind gut aufgestellt. Nur wenn sich etwas Besonderes ergibt.','calm',{team:2},null),opt(`Darüber spreche ich mit ${mayDo('buy')?'meinem Stab':sd}, nicht mit der Presse.`,'dodge',{rel:3},null)]});
    if(!mayDo('buy'))Q.push({q:`Wie läuft die Zusammenarbeit mit ${sd} bei den Transfers?`,opts:[opt('Sehr eng. Wir sprechen jeden Tag.','calm',{rel:4},null),opt('Ich würde mir manchmal mehr Mitsprache wünschen.','hard',{rel:-6,img:1},`Machtkampf? ${L} will mehr Mitsprache bei Transfers`),opt('Er macht seinen Job, ich meinen.','dodge',{rel:-1},null)]});
    if(star)Q.push({q:`Es gibt Anfragen für ${star.fn} ${star.ln}. Wie realistisch ist ein Abgang?`,opts:[opt('Er ist unverkäuflich.','conf',{pl:[star.id,4],nfs:star.id,fan:2},`${L}: „${star.ln} ist unverkäuflich“`),opt('Im Fußball ist nichts unmöglich.','hard',{pl:[star.id,-5],fan:-2},`${star.ln}-Abschied wird wahrscheinlicher`),opt('Kein Kommentar.','dodge',{},null)]});
    if(yg)Q.push({q:`Ihr Talent ${yg.ln} wird von großen Klubs beobachtet. Ist er zu halten?`,opts:[opt('Bei uns bekommt er Spielzeit – das ist das beste Argument.','warm',{pl:[yg.id,6]},null),opt('Er muss erst einmal Leistung bringen.','hard',{pl:[yg.id,-4]},null)]});
  }
  if(o==='taktik'){
    const r=(S.ureps||[]).slice(-1)[0];
    Q.push({q:`Sie spielen meist im ${T.f}. Warum gerade dieses System?`,opts:[opt('Es passt am besten zu den Stärken meiner Spieler.','calm',{img:2,team:1},null),opt('Systeme sind überbewertet – es geht um Prinzipien.','conf',{img:1},`${L}: „Systeme sind überbewertet“`)]});
    if(r)Q.push({q:`Im letzten Spiel lag der xG-Wert bei ${r.xf.toFixed(2)} zu ${r.xa.toFixed(2)}. Wie viel geben Sie auf solche Daten?`,opts:[opt('Sehr viel. Unser Analystenteam arbeitet täglich damit.','calm',{img:2},`${L} setzt voll auf Daten`),opt('Daten helfen – aber Fußball ist mehr als Zahlen.','calm',{img:1},null),opt('Ehrlich? Ich vertraue meinem Bauchgefühl.','hot',{img:-1},`${L} pfeift auf xG: „Ich vertraue meinem Bauch“`)]});
    Q.push({q:`Wie wichtig ist das Pressing in Ihrem Spiel?`,opts:[opt('Zentral. Wir wollen den Ball so früh wie möglich zurück.','conf',{team:T.press==='hoch'?1:-1},null),opt('Situativ. Wir pressen, wenn der Moment stimmt.','calm',{img:1},null)]});
  }
  if(o==='rundschau'){
    Q.push({q:`${u.name} arbeitet im ${ORG_MODEL[orgOf(u).model].lbl}. Ist das die richtige Struktur?`,opts:[opt('Ja. Jeder weiß, wofür er zuständig ist.','calm',{rel:3,board:1},null),opt('Ich würde mir als Trainer mehr Einfluss wünschen.','hard',{rel:-5,board:-2,img:1},`${L} stellt die Vereinsstruktur infrage`),opt('Strukturen sind wichtig, aber Menschen sind wichtiger.','dodge',{},null)]});
    Q.push({q:`Der Verein muss wirtschaftlich solide bleiben. Wie gehen Sie mit begrenzten Mitteln um?`,opts:[opt('Wir müssen kreativ sein – und eigene Talente entwickeln.','warm',{board:2,img:1},`${L}: „Wir müssen kreativ sein“`),opt('Ohne Investitionen gibt es keinen Erfolg. Das muss jedem klar sein.','hard',{board:-2,fan:2},`${L} fordert Investitionen`),opt(`Die Finanzen sind Sache von ${crewOf(u).cfo?crewOf(u).cfo.name:'unserem Finanzvorstand'}.`,'dodge',{},null)]});
    Q.push({q:`Wie bewerten Sie Ihr Verhältnis zum Aufsichtsrat?`,opts:[opt('Professionell und vertrauensvoll.','calm',{board:2},null),opt('Ich wünsche mir mehr Geduld.','humble',{board:-1,img:1},null)]});
  }
  return Q.slice(0,4).map(q=>({...q,j:AUTH[IV_OUT[o]].n,o:MEDIA[o].n,topic:'Interview'}));
}

/* ---------- Ablauf ---------- */
function ivOpen(id){
  const r=(S.ivReq||[]).find(x=>x.id===id);if(!r)return;const Q=ivQuestions(r.out);if(!Q.length)return;const A=AUTH[r.a],M=MEDIA[r.out];r.st='run';
  UI.ct={role:'_press',msgs:[],pend:[],pk:{kind:'iv',Q,i:0,ans:[],out:r.out,a:r.a,why:r.why,title:`🎤 Interview mit ${M.n}`}};
  ctSay('sys',`${M.n} · ${A.n}, ${A.r} · Thema: ${r.why}`);
  ctSay('them',`*${A.n}* ${A.st==='boulevard'?'Trainer, schön, dass es klappt! Ich komme gleich zur Sache.':A.st==='analyse'?'Danke für Ihre Zeit. Ich habe ein paar Fragen zu Ihrer Spielweise mitgebracht.':A.st==='oekonomie'?'Vielen Dank. Mich interessiert heute vor allem der Blick hinter die Kulissen.':'Danke, dass Sie sich die Zeit nehmen.'}`);
  pkAsk();UI.modal=pkModal();render();
}
function ivEnd(){
  const C=UI.ct,K=C.pk,A=AUTH[K.a],M=MEDIA[K.out],u=userClub(),P=pressOf();
  const r=(S.ivReq||[]).find(x=>x.st==='run');if(r)r.st='done';
  const best=K.ans.filter(a=>a.hl).sort((a,b)=>b.w-a.w)[0],hot=K.ans.filter(a=>a.tone==='hot').length;
  mrelAdd(K.out,4+(A.st==='boulevard'?hot*2:-hot*2)-K.ans.filter(a=>a.tone==='dodge').length*2);
  const title=best?best.hl:`${mgrName()} im Interview: „${K.ans[0].t.split(/[.!?]/)[0]}“`;K.hl=title;
  mEmit(K.a,'interview',title,`Der Trainer von ${u.name} im großen ${M.n}-Interview über ${K.why}.`,[`<i>${esc(mgrName())} trainiert ${ml.c(u)}. ${esc(A.n)} hat mit ihm über ${esc(K.why)} gesprochen.</i>`,...K.ans.map(a=>`<b>${esc(a.q.replace(/^\*[^*]+\*\s*/,''))}</b><br>${esc(a.t)}`)],{cids:[u.id]});
  ctSay('sys',`Das Interview erscheint in der nächsten Ausgabe von ${M.n}. Verhältnis zu ${M.n}: ${mrelLbl(mrel(K.out))}.`);
  P.log.unshift({s:S.season,w:S.week,o:M.n,hl:title});P.log=P.log.slice(0,20);
  addNews('press',`📰 ${M.n}: ${title}`,`Dein Interview ist erschienen – nachzulesen unter „Medien“.`);
}
function ivDecline(id){
  const r=(S.ivReq||[]).find(x=>x.id===id);if(!r)return;r.st='no';mrelAdd(r.out,-6);const u=userClub(),A=AUTH[r.a];
  if(A.st==='boulevard'||r.out==='kanal7')mEmit(r.a,'comment',`${mgrLast()} kneift!`,`Der Trainer von ${u.name} sagt ein Interview ab.`,[`Wir wollten mit ${esc(mgrName())} über ${esc(r.why)} sprechen. Die Antwort: Absage. Was hat er zu verbergen?`],{cids:[u.id]});
}
// Selbst ein Interview anbieten
function ivOffer(o){
  S.ivCd=S.ivCd||-99;if(S.week-S.ivCd<3)return toast('Du hast gerade erst ein Interview gegeben.');
  const ok=o==='abendpost'||o==='kanal7'||mrel(o)>=25;if(!ok){mrelAdd(o,1);return toast(`${MEDIA[o].n} winkt ab – das Verhältnis ist zu schlecht.`)}
  S.ivCd=S.week;S.ivReq=(S.ivReq||[]).filter(r=>r.st!=='open');const why={sportblatt:'deine Arbeit als Trainer',abendpost:'die aktuelle Lage',echo:'die Transferpläne',taktik:'deine Spielidee',rundschau:'Finanzen und Vereinsführung',kanal7:'die aktuelle Lage'}[o];
  const r={id:'iv'+(S.nextId++),out:o,a:IV_OUT[o],why,s:S.season,w:S.week,exp:S.week,st:'open',own:1};S.ivReq.push(r);mrelAdd(o,2);ivOpen(r.id);
}
function ivHome(){
  return (S.ivReq||[]).filter(r=>r.st==='open'&&r.s===S.season&&r.exp>=S.week&&!r.own).map(r=>{const A=AUTH[r.a],M=MEDIA[r.out];return `<div class="news t-press"><b>🎤 Interviewanfrage: ${M.n}</b><div class="small">${A.n} (${A.r}) möchte mit dir über ${esc(r.why)} sprechen. Verhältnis: ${mrelLbl(mrel(r.out))}.</div><div class="row" style="margin-top:6px"><button class="btn sm pri" data-act="ivYes" data-v="${r.id}">Zusagen</button><button class="btn sm" data-act="ivNo" data-v="${r.id}">Absagen</button></div></div>`}).join('');
}
function ivPanel(){
  const req=ivHome();if(!UI.ivShow)return `<div class="row" style="margin-bottom:12px;gap:8px">${req}<button class="btn" data-act="ivShow">🎤 Interview anbieten</button></div>`;
  return `<div class="card" style="margin-bottom:12px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">🎤 Interviews</h3><button class="btn sm" data-act="ivShow">Einklappen</button></div>${req}<p class="small muted">Biete einer Redaktion selbst ein Interview an. Jede fragt in ihrem eigenen Stil – deine Antworten erscheinen als Artikel und wirken auf Mannschaft, Fans, Vorstand und dein Verhältnis zur Redaktion.</p>
   <div class="ivgrid">${Object.entries(MEDIA).map(([k,M])=>`<div class="ivo"><div><b style="color:${M.c}">${M.n}</b><div class="small muted">${AUTH[IV_OUT[k]].n} · Verhältnis: ${mrelLbl(mrel(k))}</div></div><button class="btn sm" data-act="ivOffer" data-v="${k}">Interview anbieten</button></div>`).join('')}</div></div>`;
}
Object.assign(ACT,{
  ivYes:d=>ivOpen(d.v),
  ivNo:d=>{ivDecline(d.v);save();render()},
  ivOffer:d=>ivOffer(d.v),
  ivShow:()=>{UI.ivShow=!UI.ivShow;render()}
});
(function(){const orig=ACT.pkClose;ACT.pkClose=d=>{const C=UI.ct;if(C&&C.pk&&C.pk.kind==='iv'&&C.pk.i<C.pk.Q.length){const r=(S.ivReq||[]).find(x=>x.st==='run');if(r)r.st='no';mrelAdd(C.pk.out,-8);ACT.ctClose();return}return orig(d)}})();
