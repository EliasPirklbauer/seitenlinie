/* =====================================================================
   Seitenlinie – Medienzentrum: Redaktionen mit eigenen Autorinnen und
   Autoren. Eilmeldungen, Transfers, Gerüchte, Trainerwechsel, Analysen,
   Interviews, Kommentare und Wirtschaftsthemen – aus dem Spielgeschehen.
   ===================================================================== */
const MEDIA={
  sportblatt:{n:'Sportblatt',k:'Fachmagazin',c:'#1d4e89',d:'Das wöchentliche Fachmagazin. Gründlich recherchiert, nüchtern im Ton.'},
  abendpost:{n:'Abendpost',k:'Boulevardzeitung',c:'#c0392b',d:'Laut, schnell, meinungsstark. Lebt von Schlagzeilen – und manchmal von Gerüchten.'},
  echo:{n:'Fußball-Echo',k:'Transferportal',c:'#0f8a6c',d:'Spezialisiert auf Transfers, Verträge und Marktwerte. Gut vernetzt in der Beraterszene.'},
  kanal7:{n:'Kanal 7 Sport',k:'TV & Online',c:'#e67e22',d:'Der Sportsender mit Live-Ticker und Eilmeldungen – immer als Erster da.'},
  taktik:{n:'Taktiktafel',k:'Analyse-Blog',c:'#6c3fb5',d:'Daten, xG und Spielsysteme. Für alle, die das Spiel verstehen wollen.'},
  rundschau:{n:'Rundschau',k:'Tageszeitung',c:'#4a5568',d:'Die Tageszeitung mit starkem Wirtschaftsressort: Geld, Macht und Gremien im Fußball.'}};
const AUTH={
  kessler:{n:'Martina Kessler',o:'sportblatt',r:'Chefreporterin',st:'sachlich',rel:.92,b:'Seit zwanzig Jahren an der Seitenlinie. Fragt nach, bis es wehtut – aber immer fair.',t:'Interviews, Vorberichte, Saisonbilanzen'},
  brehm:{n:'Jonas Brehm',o:'sportblatt',r:'Taktik-Redakteur',st:'analyse',rel:.9,b:'Ehemaliger Jugendtrainer mit A-Lizenz. Zeichnet jede Grafik selbst.',t:'Team-Porträts, Spielsysteme'},
  krawinkel:{n:'Rolf Krawinkel',o:'abendpost',r:'Sportchef',st:'boulevard',rel:.55,b:'Gefürchtet in jeder Kabine. Seine Kolumne „Klartext“ hat schon Trainer gestürzt.',t:'Kommentare, Trainerstühle, Krisen'},
  pohl:{n:'Sandra Pohl',o:'abendpost',r:'Reporterin',st:'boulevard',rel:.6,b:'Kommt an jeden Spieler heran – und an jede Geschichte.',t:'Interviews, Gerüchte, Kabinengeflüster'},
  arslan:{n:'Deniz Arslan',o:'echo',r:'Transfer-Insider',st:'insider',rel:.82,b:'Bestens vernetzt mit Beratern in ganz Europa. Schreibt kurz, schreibt schnell.',t:'Transfers, Gerüchte, Vertragspoker'},
  hartwig:{n:'Lea Hartwig',o:'echo',r:'Marktwert-Expertin',st:'oekonomie',rel:.9,b:'Rechnet jede Ablöse nach – inklusive Raten, Boni und Gehalt.',t:'Deal-Analysen, Marktwerte'},
  voss:{n:'Tim Voss',o:'kanal7',r:'Nachrichtenchef',st:'tv',rel:.85,b:'Hat das Handy immer am Ohr. Eilmeldung ist sein zweiter Vorname.',t:'Breaking News, Spieltag'},
  amann:{n:'Dr. Felix Amann',o:'taktik',r:'Datenanalyst',st:'analyse',rel:.95,b:'Promovierter Statistiker. Glaubt an Expected Goals, nicht an Bauchgefühl.',t:'Spielanalysen, Daten'},
  ebert:{n:'Hanna Ebert',o:'rundschau',r:'Wirtschaftsredakteurin',st:'oekonomie',rel:.9,b:'Schreibt über Bilanzen, Gremien und die Ökonomie des Profifußballs.',t:'Finanzen, Vereinspolitik, Nachwuchs'}};
const MTYPE={breaking:['Eilmeldung','#c0392b'],transfer:['Transfer','#0f8a6c'],rumor:['Gerücht','#b8860b'],coach:['Trainer','#8e44ad'],analysis:['Analyse','#6c3fb5'],interview:['Interview','#1d4e89'],comment:['Kommentar','#c0392b'],matchday:['Spieltag','#e67e22'],finance:['Wirtschaft','#4a5568'],voices:['Stimmen','#7a5cc7'],board:['Vereinspolitik','#4a5568']};

/* ---------- Helfer ---------- */
const ml={c:c=>c?`<a class="mlink" data-act="clubInfo" data-id="${c.id}">${esc(c.name)}</a>`:'',p:p=>p?`<a class="mlink" data-act="player" data-id="${p.id}">${esc(fullname(p))}</a>`:''};
function mPick(a){return a[Math.floor(rnd()*a.length)]}
function mEmit(a,type,title,teaser,body,o){
  S.media=S.media||[];const x={id:'m'+(S.nextId++),s:S.season,w:S.week,a,type,title,teaser,body,cids:(o&&o.cids)||[],pids:(o&&o.pids)||[],br:!!(o&&o.br)};
  S.media.unshift(x);if(S.media.length>220)S.media.length=220;return x;
}
function mq(e){if(!S||S.user===null)return;S.mq=S.mq||[];S.mq.push({...e,s:S.season,w:S.week})}
function focusClub(c){const u=userClub();return c&&!c.guest&&(c.league===u.league||c.id===S.user)}
function feeTxt(f){return f>0?money(f):'ablösefrei'}
function topScorers(L,n){return L.clubs.flatMap(id=>squadOf(club(id))).filter(p=>p.goals>0).sort((a,b)=>b.goals-a.goals||b.ast-a.ast).slice(0,n)}
function formOf(c){const L=league(c),out=[];for(let r=L.fixtures.length-1;r>=0&&out.length<5;r--){const m=L.fixtures[r].find(m=>(m.h===c.id||m.a===c.id)&&m.hg!==null);if(m){const gf=m.h===c.id?m.hg:m.ag,ga=m.h===c.id?m.ag:m.hg;out.push(gf>ga?'S':gf===ga?'U':'N')}}return out.reverse()}
function avgRt(p){return p.rn?p.rs/p.rn/10:0}

/* ---------- Generatoren ---------- */
function artTransfer(t){
  const p=S.players[t.pid],to=club(t.tid),fr=t.fid>=0?club(t.fid):null;if(!p||!to)return;
  const big=t.fee>=Math.max(15e6,p.val*1.4)||t.fee>=40e6,ratio=p.val?t.fee/p.val:1,o={cids:[to.id,...(fr?[fr.id]:[])],pids:[p.id]};
  if(t.loan){mEmit('arslan','transfer',`Leihe fix: ${fullname(p)} geht zu ${to.name}`,`${pname(p)} wechselt auf Leihbasis${fr?' von '+fr.name:''}.`,[`Es ist durch: ${ml.p(p)} spielt künftig auf Leihbasis für ${ml.c(to)}. ${t.det?'Die Eckdaten: '+esc(t.det)+'.':''}`,`Für den ${p.age}-Jährigen geht es vor allem um Spielpraxis. ${fr?ml.c(fr)+' behält die Kontrolle über die Zukunft des Spielers.':''}`],o);return}
  if(big){
    mEmit('voss','breaking',`+++ ${to.name} holt ${fullname(p)} für ${money(t.fee)} +++`,`Der Transfer ist offiziell.`,[`<b>Eilmeldung:</b> ${ml.c(to)} hat ${ml.p(p)} verpflichtet${fr?' – '+ml.c(fr)+' kassiert '+money(t.fee):''}. Der ${POS_LABEL[p.pos]} (${p.age}) gilt als einer der Transfers des Jahres.`,`Mehr Details in Kürze.`],{...o,br:true});
    const verdict=ratio>=1.5?'Das ist deutlich über Marktwert – ein klassischer Aufschlag für einen Spieler, den man unbedingt will.':ratio>=1.1?'Ein fairer, wenn auch sportlicher Preis.':'Unter Marktwert – ein Schnäppchen aus Käufersicht.';
    mEmit('hartwig','transfer',`Deal-Check: Was ${fullname(p)} ${to.name} wirklich kostet`,`${money(t.fee)} Ablöse bei ${money(p.val)} Marktwert – eine Einordnung.`,[`${money(t.fee)} Ablöse, dazu ein Gehalt von rund ${money(mon(p.wage))} brutto im Monat: ${ml.c(to)} geht für ${ml.p(p)} ein erhebliches Investment ein. ${verdict}`,
      `Über eine Vertragslaufzeit bis ${contractEnd(p)} gerechnet, schreibt der Verein die Ablöse mit rund ${money(t.fee/Math.max(1,p.until-S.season+1))} pro Jahr ab. ${t.det?'Bemerkenswert ist die Struktur: '+esc(t.det)+'.':'Die Summe soll weitgehend sofort fällig sein.'}`,
      `Für ${fr?ml.c(fr):'den abgebenden Verein'} ist das ${ratio>=1.2?'ein Verkauf zur rechten Zeit':'ein schmerzhafter, aber vertretbarer Abgang'}. Das Transferbudget von ${ml.c(to)} liegt nach dem Deal bei ${money(to.tBudget||0)}.`],o);
  }else mEmit('arslan','transfer',mPick([`Offiziell: ${fullname(p)} wechselt zu ${to.name}`,`Fix: ${to.name} verpflichtet ${p.ln}`,`Jetzt ist es durch: ${p.ln} unterschreibt bei ${to.name}`]),`${POS_LABEL[p.pos]}, ${p.age} Jahre – ${feeTxt(t.fee)}.`,[`Wie das Fußball-Echo bereits berichtet hatte: ${ml.p(p)} wechselt ${fr?'von '+ml.c(fr)+' ':''}zu ${ml.c(to)}. Ablöse: ${feeTxt(t.fee)}.`,`Der ${p.age}-Jährige (Stärke ${ovr(p)}) unterschreibt bis ${contractEnd(p)}. ${ratio<.85&&t.fee>0?'Ein Preis unter Marktwert – da hat jemand gut verhandelt.':ratio>1.3?'Ein stolzer Preis.':''}`],o);
}
function artCoach(e){
  const c=club(e.cid);if(!c)return;const L=league(c),u=userClub();if(!(focusClub(c)||(L&&L.tier===1&&L.assoc===u.assoc)))return;const o={cids:[c.id],br:true};
  mEmit('voss','breaking',`+++ ${c.name} trennt sich von ${e.old} +++`,`Nachfolger: ${e.nw}.`,[`<b>Eilmeldung:</b> ${ml.c(c)} hat Trainer ${esc(e.old)} freigestellt. Grund: ${esc(e.why)}.`,`Die Nachfolge ist bereits geregelt: ${esc(e.nw)} übernimmt.`],o);
  if(focusClub(c))mEmit('krawinkel','comment',mPick([`KLARTEXT: Das Aus für ${e.old.split(' ').pop()} war überfällig!`,`KLARTEXT: Bei ${c.name} brennt der Baum!`,`KLARTEXT: ${c.name} und das Trainer-Karussell`]),`Rolf Krawinkel über den Trainerwechsel bei ${c.name}.`,[`Man musste kein Prophet sein. Platz ${rankOf(c.id)}, eine Mannschaft ohne Plan, Fans auf den Barrikaden – bei ${ml.c(c)} lief seit Wochen nichts zusammen.`,`${esc(e.nw)} erbt einen Scherbenhaufen. Ob er ihn kitten kann? Ich habe Zweifel. Aber eins ist klar: Die Ausreden sind jetzt aufgebraucht.`],{cids:[c.id]});
}
function artVor(e){const c=club(e.cid);if(!c||!focusClub(c))return;
  mEmit('ebert','board',`Machtwechsel bei ${c.name}: Neuer ${e.role}`,`Der Aufsichtsrat greift durch.`,[`Der Aufsichtsrat von ${ml.c(c)} hat ${esc(e.old||'die vakante Position')} ${e.old?'abberufen':'neu besetzt'} und ${esc(e.nw)} zum neuen ${esc(e.role)} bestellt.`,`Solche Personalentscheidungen in den Gremien sind oft der eigentliche Gradmesser für den Zustand eines Vereins: Sie verschieben Machtverhältnisse – ${e.role.startsWith('Sport')?'und betreffen in aller Regel auch den Trainer':'und damit die Spielräume der sportlichen Leitung'}.`],{cids:[c.id]})}
function artRumors(){
  const u=userClub();let n=0;
  for(const x of (S.aineg||[]).filter(x=>!x.rum)){const p=S.players[x.pid],b=club(x.buyer),s=club(x.seller);if(!p||!b||!s||!(focusClub(b)||focusClub(s)))continue;if(n>=2)break;x.rum=1;n++;
    mEmit('arslan','rumor',mPick([`Gespräche laufen: ${b.name} will ${p.ln}`,`${b.name} baggert an ${fullname(p)}`,`Exklusiv: ${b.name} bietet für ${p.ln}`]),`Nach Informationen des Fußball-Echo liegt ein Angebot vor.`,[`Nach Informationen des Fußball-Echo hat ${ml.c(b)} bei ${ml.c(s)} ein Angebot für ${ml.p(p)} hinterlegt. Die Rede ist von ${money(x.b.fee)}${x.b.plan&&x.b.plan.length?' plus Raten':''}.`,`Stand jetzt: Die Gespräche laufen. ${ml.c(s)} ${ROLE_ORDER.indexOf(p.role)<=1?'will eigentlich nicht verkaufen.':'wäre gesprächsbereit.'}`],{cids:[b.id,s.id],pids:[p.id]})}
  for(const o of (S.offers||[]).filter(o=>!o.rum)){o.rum=1;const p=S.players[o.pid],c=club(o.from);if(!p||!c||n>=3)continue;n++;
    mEmit('pohl','rumor',`Angebot für ${p.ln}! Verlässt er ${u.name}?`,`${c.name} soll konkret geworden sein.`,[`Die Abendpost erfuhr: ${ml.c(c)} hat ein Angebot für ${ml.p(p)} abgegeben. Bei ${ml.c(u)} soll man nicht begeistert sein.`,`Was sagt der Spieler? Aus seinem Umfeld heißt es: „${at(p,'amb')>=14?'Er will den nächsten Schritt machen.':'Er fühlt sich wohl, aber man hört sich alles an.'}“`],{cids:[c.id,u.id],pids:[p.id]})}
  if(rnd()<.45){ // freies Gerücht – mal wahr, mal nicht
    const L=league(u),cand=L.clubs.map(id=>club(id)).filter(c=>!c.guest).flatMap(c=>squadOf(c)).filter(p=>!p.loan&&(p.goals>=3||ovr(p)>=clubAvg(club(p.club))+5)).sort(()=>rnd()-.5)[0];
    if(cand){const c=club(cand.club),big=S.clubs.filter(b=>!b.guest&&b.rep>c.rep+4&&b.id!==c.id).sort(()=>rnd()-.5)[0];
      if(big){const a=rnd()<.6?'krawinkel':'pohl';mEmit(a,'rumor',mPick([`Hammer-Gerücht! ${big.name} will ${cand.ln}`,`Wechselt ${cand.ln} zu ${big.name}?`,`Scouts von ${big.name} beobachten ${cand.ln}`]),`Die Abendpost hört: Ein großer Klub ist interessiert.`,[`Nach Abendpost-Informationen saßen beim letzten Spiel von ${ml.c(c)} Scouts von ${ml.c(big)} auf der Tribüne – im Visier: ${ml.p(cand)} (${cand.age}).`,`${cand.goals?cand.goals+' Saisontore':'Starke Leistungen'} haben ihn interessant gemacht. ${ml.c(c)} dementiert: „Kein Kommentar zu Spekulationen.“`],{cids:[c.id,big.id],pids:[cand.id]})}}}
}
function artMatchday(played){
  const u=userClub(),L=league(u),pr=(played||[]).find(x=>x.L.id===L.id);if(!pr)return;const ms=L.fixtures[pr.r].filter(m=>m.hg!==null);if(!ms.length)return;
  const tab=tableOf(L),big=ms.slice().sort((a,b)=>(b.hg+b.ag)-(a.hg+a.ag))[0],sc=topScorers(L,3),lead=club(tab[0].id);
  const res=ms.map(m=>`${esc(club(m.h).short)} ${m.hg}:${m.ag} ${esc(club(m.a).short)}`).join(' · ');
  mEmit('voss','matchday',`${L.name}, ${pr.r+1}. Spieltag: ${club(big.h).name} – ${club(big.a).name} ${big.hg}:${big.ag} ist das Spiel des Tages`,`Alle Ergebnisse, die Tabelle, die Torjäger.`,[`<b>Die Ergebnisse:</b> ${res}.`,`Das torreichste Spiel: ${ml.c(club(big.h))} gegen ${ml.c(club(big.a))} – ${big.hg}:${big.ag}.`,`<b>An der Spitze:</b> ${ml.c(lead)} mit ${tab[0].pts} Punkten${tab[1]?', dahinter '+ml.c(club(tab[1].id))+' ('+tab[1].pts+')':''}.`,sc.length?`<b>Torjäger:</b> ${sc.map(p=>ml.p(p)+' ('+p.goals+')').join(', ')}.`:''].filter(Boolean),{cids:ms.flatMap(m=>[m.h,m.a])});
  // Datenanalyse deines Spiels
  const r=(S.ureps||[]).slice(-1)[0];if(r&&r.s===S.season&&r.w===S.week-1){const o=club(r.opp),eff=r.gf-r.xf,dx=r.xf-r.xa;
    mEmit('amann','analysis',dx>.7?mPick([`Die Daten zu ${u.name} gegen ${o.name}: Verdient, und zwar deutlich`,`xG-Check: ${u.name} dominiert ${o.name}`,`Zahlen lügen nicht: ${u.name} war klar besser`]):dx<-.7?mPick([`Die Daten zu ${u.name} gegen ${o.name}: Glück oder Plan?`,`xG-Check: ${o.name} hatte die besseren Chancen`,`Warum ${u.name} gegen ${o.name} in Probleme geriet`]):mPick([`Die Daten zu ${u.name} gegen ${o.name}: Ein Spiel auf Augenhöhe`,`xG-Check: ${u.name} gegen ${o.name} – Patt in den Zahlen`,`Analyse: Wo ${u.name} gegen ${o.name} den Unterschied suchte`]),`xG ${r.xf.toFixed(2)} : ${r.xa.toFixed(2)} · Ballbesitz ${r.poss} %.`,[`Endstand ${r.gf}:${r.ga}, Expected Goals ${r.xf.toFixed(2)} zu ${r.xa.toFixed(2)}. ${ml.c(u)} hatte ${r.poss} Prozent Ballbesitz und gab ${r.sh} Schüsse ab (Gegner: ${r.sha}).`,
      eff>.8?`Bemerkenswert ist die Effizienz: ${r.gf} Tore aus ${r.xf.toFixed(2)} xG – das ist überdurchschnittlich und auf Dauer selten haltbar.`:eff<-.8?`Das Problem ist die Chancenverwertung: Aus ${r.xf.toFixed(2)} xG wurden nur ${r.gf} Tore. Das gleicht sich über eine Saison meist aus.`:'Die Chancenverwertung bewegt sich im erwartbaren Rahmen.',
      `Taktisch spielte ${ml.c(u)} im ${esc(u.tactic.f)} (${MENTALITY[u.tactic.men]}). ${dx>.7?'Die Struktur stimmte: Man ließ wenig zu und kam regelmäßig in gefährliche Räume.':dx<-.7?'Die Restverteidigung war anfällig – der Gegner kam zu oft in den Strafraum.':'Beide Teams neutralisierten sich über weite Strecken.'}`],{cids:[u.id,o.id]})}
}
function artTeam(){
  const u=userClub(),L=league(u),cl=L.clubs.map(id=>club(id)).filter(c=>!c.guest);if(!cl.length)return;const c=cl[(S.week*7+S.season)%cl.length];ensureTactic(c);
  const F=formOf(c),rk=rankOf(c.id),best=squadOf(c).sort((a,b)=>avgRt(b)-avgRt(a)||ovr(b)-ovr(a))[0],sm=shapeMetrics(c),sc=squadOf(c).sort((a,b)=>b.goals-a.goals)[0];
  if(S.week%2===0){
    mEmit('brehm','analysis',`Team-Porträt: So spielt ${c.name}`,`Formation, Spielidee, Schlüsselspieler – die Taktik-Analyse.`,[`${ml.c(c)} steht auf Platz ${rk} (Ziel laut Vorstand: ${esc(c.target.t)}). Die Form der letzten Spiele: ${F.join(' ')||'–'}.`,
      `Trainer ${esc(c.staff.coach.name)} lässt im ${esc(c.tactic.f)} spielen – gegen den Ball formiert sich das Team im ${esc(sm.oopShape)}, mit Ball im ${esc(sm.ipShape)}. ${MENTALITY[c.tactic.men]}, ${PRESSING[c.tactic.press]}.`,
      best?`Der auffälligste Spieler: ${ml.p(best)} (${POS_LABEL[best.pos]})${best.rn?', Notenschnitt '+avgRt(best).toFixed(2).replace('.',','):''}.${sc&&sc.goals?' Bester Torschütze: '+ml.p(sc)+' mit '+sc.goals+' Treffern.':''}`:'',
      `${rk<=c.target.r?'Fazit: Die Mannschaft liegt im Soll – die Abläufe greifen.':'Fazit: Noch hakt es. Vor allem die Balance zwischen Offensive und Absicherung stimmt nicht.'}`].filter(Boolean),{cids:[c.id]});
  }else{
    const wb=wageBill(c),ratio=wb/Math.max(1,c.wBudget),inc=tvIncome(c)*52;
    mEmit('ebert','finance',`Wirtschafts-Check: ${c.name}`,`Kontostand, Gehaltsquote, Spielraum – wie solide ist der Verein aufgestellt?`,[`${ml.c(c)} verfügt aktuell über ${money(c.budget)} auf dem Konto, das Transferbudget beträgt ${money(c.tBudget||0)}.`,
      `Die Gehälter summieren sich auf ${money(mon(wb))} im Monat – das sind ${Math.round(ratio*100)} Prozent des genehmigten Gehaltsrahmens. ${ratio>.97?'Viel Luft ist da nicht mehr: Jeder weitere Spieler muss über einen Abgang gegenfinanziert werden.':ratio<.8?'Ein komfortabler Puffer, der Handlungsspielraum im nächsten Fenster schafft.':'Ein solides Verhältnis.'}`,
      `Aus TV-Geldern fließen hochgerechnet ${money(inc)} pro Saison. Das Stadion (${c.stadium.toLocaleString('de-DE')} Plätze) war zuletzt ${c.lastAtt?Math.round(c.lastAtt/c.stadium*100)+' Prozent':'gut'} ausgelastet${fansOf(c).mood<40?' – die schlechte Stimmung kostet Zuschauer und damit Einnahmen':''}.`,
      `Präsident ${esc(c.staff.pres.name)} gilt als ${PRES[c.staff.pres.trait].label.toLowerCase()}. ${c.staff.pres.trait==='sparsam'?'Große Sprünge sind daher nicht zu erwarten.':c.staff.pres.trait==='ambitioniert'?'Das bedeutet: hohe Investitionen, aber auch hoher Erwartungsdruck.':'Er setzt auf Kontinuität.'}`],{cids:[c.id]});
  }
}
function artInterview(){
  const u=userClub(),L=league(u),R=rnd();let p,c;
  if(R<.35){p=squadOf(u).filter(x=>!x.loan).sort((a,b)=>(b.goals*2+avgRt(b))-(a.goals*2+avgRt(a)))[0];c=u}
  else{const pool=L.clubs.map(id=>club(id)).filter(x=>!x.guest&&x.id!==S.user).flatMap(x=>squadOf(x)).filter(x=>!x.loan);p=pool.sort((a,b)=>(b.goals*2+avgRt(b)+(b.age<=21?3:0))-(a.goals*2+avgRt(a)+(a.age<=21?3:0)))[Math.floor(rnd()*6)];c=p&&club(p.club)}
  if(!p||!c)return;const a=rnd()<.55?'kessler':'pohl',bv=a==='pohl',amb=at(p,'amb'),happy=p.mor>=60,key=ROLE_ORDER.indexOf(p.role)<=1;
  const qa=[[bv?`${p.fn}, ganz ehrlich: Wie läuft es gerade?`:`Herr ${p.ln}, wie bewerten Sie Ihre bisherige Saison?`,happy?`Ich fühle mich richtig gut. ${p.goals?p.goals+' Tore sind ein guter Anfang, aber ich will mehr.':'Ich bekomme Vertrauen und versuche, es zurückzuzahlen.'}`:`Es könnte besser laufen, das weiß ich selbst. ${key?'':'Ich will mehr spielen, das ist kein Geheimnis.'}`],
    [`Was sagen Sie zu Ihrem Trainer ${c.staff.coach.name}?`,c.id===S.user?(p.mor>=55?'Er hat eine klare Idee und spricht offen mit uns. Das schätzen wir.':'Wir haben nicht immer die gleiche Meinung. Aber am Ende entscheidet er.'):(p.mor>=55?'Er ist sehr nah an der Mannschaft. Jeder weiß, was er zu tun hat.':'Kein Kommentar. Das klären wir intern.')],
    [bv?'Es gibt Gerüchte über einen Wechsel. Was ist dran?':'Wie sieht Ihre Zukunft aus?',amb>=15?`Ich habe große Ziele. Irgendwann will ich ${c.rep<80?'auf dem höchsten Niveau spielen':'die Champions League gewinnen'}. Mein Vertrag läuft bis ${contractEnd(p)} – alles Weitere sehen wir.`:`Ich fühle mich wohl hier. Mein Vertrag läuft bis ${contractEnd(p)}, und ich habe nicht vor, etwas zu ändern.`],
    [`Was ist das Ziel mit ${c.name}?`,rankOf(c.id)<=c.target.r?`Wir wollen da oben bleiben. Die Mannschaft hat Charakter.`:`Wir müssen schnell punkten. Die Qualität ist da, wir müssen sie auf den Platz bringen.`]];
  mEmit(a,'interview',bv?`${p.ln} packt aus: „${qa[2][1].split('.')[0]}“`:`Interview mit ${fullname(p)}: „${qa[0][1].split('.')[0]}“`,`${POS_LABEL[p.pos]} von ${c.name} im Gespräch mit ${AUTH[a].n}.`,
    [`<i>${ml.p(p)} (${p.age}) spielt bei ${ml.c(c)} als ${ROLES[p.role].label}. ${AUTH[a].n} hat ihn ${bv?'nach dem Training abgefangen':'zum ausführlichen Gespräch getroffen'}.</i>`,...qa.map(([q,a2])=>`<b>${esc(q)}</b><br>${esc(a2)}`)],{cids:[c.id],pids:[p.id]});
  if(amb>=15&&!happy)p.mor=clamp(p.mor-2,15,100);
}
function artColumn(){
  const u=userClub(),L=league(u),cl=L.clubs.map(id=>club(id)).filter(c=>!c.guest&&c.id!==S.user);if(!cl.length)return;
  if(S.week%4===2){const hot=cl.map(c=>({c,v:(rankOf(c.id)-c.expRank)*2+(50-fansOf(c).mood)/8+(50-(c.cimg||55))/10})).sort((a,b)=>b.v-a.v).slice(0,4);
    const meU=(rankOf(S.user)-u.expRank)*2+(50-fansOf(u).mood)/8+(50-boardOf().trust)/6+(mrel('abendpost')<35?3:mrel('abendpost')>70?-2:0);
    mEmit('krawinkel','comment','Das Trainer-Barometer: Wessen Stuhl wackelt?','Rolf Krawinkels Rangliste der gefährdeten Trainer.',[`Ich sag’s, wie es ist. Hier ist meine Liste – und ich irre mich selten:`,...hot.map((x,i)=>`<b>${i+1}. ${esc(x.c.staff.coach.name)}</b> (${ml.c(x.c)}): Platz ${rankOf(x.c.id)}, Fans ${fanLbl(fansOf(x.c).mood)[1]}. ${x.v>8?'Ganz heiß.':x.v>4?'Wird ungemütlich.':'Noch ruhig.'}`),`Und ${esc(mgrName())}? ${meU>6?'Ich würde mir an seiner Stelle keine Wohnung kaufen.':meU>2?'Steht unter Beobachtung.':'Fest im Sattel – vorerst.'}`],{cids:[...hot.map(x=>x.c.id),S.user]})}
  else{const all=[...cl,u],up=all.map(c=>({c,g:c.expRank-rankOf(c.id)})).sort((a,b)=>b.g-a.g)[0],down=all.map(c=>({c,g:rankOf(c.id)-c.expRank})).sort((a,b)=>b.g-a.g)[0];
    S.mcol=S.mcol||[];const x=[rnd()<.5?up:down,up,down].find(y=>y&&y.g>=2&&!S.mcol.includes(y.c.id));if(!x)return;const good=x===up;S.mcol=[x.c.id,...S.mcol].slice(0,4);
    mEmit('krawinkel','comment',good?`KLARTEXT: Hut ab vor ${x.c.name}!`:`KLARTEXT: ${x.c.name} – eine einzige Enttäuschung!`,good?'Der Überraschungsklub der Saison.':'Die Abendpost-Kolumne.',good?[`Wer hätte das gedacht? ${ml.c(x.c)} auf Platz ${rankOf(x.c.id)} – erwartet war Platz ${x.c.expRank}. ${x.c.id===S.user?esc(mgrName()):esc(x.c.staff.coach.name)} hat aus wenig viel gemacht.`,`Ich war skeptisch. Ich gebe zu: Ich lag falsch. Vorerst.`]:[`Platz ${rankOf(x.c.id)}. Erwartet war Platz ${x.c.expRank}. Bei ${ml.c(x.c)} stimmt gar nichts.`,`${x.c.id===S.user?'Der Trainer':esc(x.c.staff.coach.name)} redet von Geduld. Die Fans haben keine mehr. Und der Aufsichtsrat? Der zählt Punkte, keine Ausreden.`],{cids:[x.c.id]})}
}
function artInjury(){
  const L=league(userClub());
  for(const id of L.clubs){const c=club(id);if(c.guest)continue;for(const p of squadOf(c)){
    if(p.inj===0){p.injM=0;continue}if(p.injM||p.inj<4||ROLE_ORDER.indexOf(p.role)>1)continue;p.injM=1;
    mEmit('voss','breaking',`+++ Schock bei ${c.name}: ${p.ln} fällt ${p.inj} Wochen aus +++`,`Bitterer Ausfall für ${c.name}.`,[`<b>Eilmeldung:</b> ${ml.p(p)} hat sich verletzt und fällt nach Vereinsangaben rund ${p.inj} Wochen aus.`,`Für ${ml.c(c)} ist das ein harter Schlag – der ${POS_LABEL[p.pos]} ist ${ROLES[p.role].label}.`],{cids:[c.id],pids:[p.id],br:true})}}
}
function artSeason(){
  const u=userClub(),L=league(u),cl=L.clubs.map(id=>club(id)).filter(c=>!c.guest),fav=cl.slice().sort((a,b)=>clubAvg(b)-clubAvg(a)).slice(0,3);
  mEmit('kessler','analysis',`Saisonvorschau ${seasonLbl(S.season)}: Wer holt den Titel in der ${L.name}?`,'Favoriten, Geheimtipps, Abstiegskandidaten.',[`Die neue Saison steht vor der Tür. Unsere Favoriten: ${fav.map(c=>ml.c(c)).join(', ')}.`,`Und ${ml.c(u)}? Der Vorstand erwartet „${esc(u.target.t)}“. ${esc(mgrName())} weiß: An diesem Ziel wird er gemessen.`,`Unser Geheimtipp: ${ml.c(cl.slice().sort((a,b)=>b.rep-a.rep)[Math.min(cl.length-1,5)])} – mit viel Potenzial im Kader.`],{cids:[...fav.map(c=>c.id),u.id]});
}

/* ---------- Woche ---------- */
function mediaWeekly(played){
  if(!S||S.user===null)return;
  for(const e of (S.mq||[]))(e.k==='coach'?artCoach:e.k==='vor'?artVor:()=>{})(e);S.mq=[];
  const fresh=(S.transfers||[]).filter(t=>!t.m&&t.season===S.season);
  const big=fresh.filter(t=>!t.loan&&t.fee>0).sort((a,b)=>b.fee-a.fee);let n=0;
  for(const t of fresh){t.m=1;const fc=t.fid>=0?club(t.fid):null,tc=club(t.tid);const rel=focusClub(tc)||focusClub(fc)||t===big[0]&&t.fee>=20e6;if(rel&&n<6&&(t.fee>0||t.o>=65||t.tid===S.user||t.fid===S.user)){artTransfer(t);n++}}
  if(S.week===1)artSeason();
  artInjury();artRumors();artMatchday(played);
  if(S.week%2===1)artInterview();
  artTeam();if(S.week>=3)artColumn();
}
// Eigene Pressekonferenz wird zum Artikel
function mediaFromPk(hl,outlet){const u=userClub();mEmit(Math.random()<.5?'voss':'pohl','voices',hl,`Stimmen aus der Pressekonferenz von ${u.name}.`,[`${esc(mgrName())} sorgte auf der Pressekonferenz für Gesprächsstoff. ${esc(outlet)} titelte: „${esc(hl)}“.`],{cids:[u.id]})}

/* ---------- Oberfläche ---------- */
function renderMedia(){
  const F=UI.mf=UI.mf||{t:'',o:'',mine:false,tab:'feed'},list=(S.media||[]).filter(x=>(!F.t||x.type===F.t||(F.t==='breaking'&&x.br))&&(!F.o||AUTH[x.a].o===F.o)&&(!F.mine||x.cids.includes(S.user)));
  const br=(S.media||[]).filter(x=>x.br).slice(0,6);
  const chips=[['','Alle'],['breaking','Eilmeldungen'],['transfer','Transfers'],['rumor','Gerüchte'],['coach','Trainer'],['analysis','Analysen'],['interview','Interviews'],['comment','Kommentare'],['finance','Wirtschaft'],['matchday','Spieltag']];
  const tabs=`<div class="seg" style="margin-bottom:12px"><button class="${F.tab==='feed'?'on':''}" data-act="mTab" data-v="feed">Nachrichten</button><button class="${F.tab==='red'?'on':''}" data-act="mTab" data-v="red">Redaktionen</button></div>`;
  if(F.tab==='red')return `<h2>Medien</h2>${tabs}<div class="grid g2">${Object.entries(MEDIA).map(([k,M])=>`<div class="card"><div class="mhead" style="border-color:${M.c}"><b style="color:${M.c}">${M.n}</b> <span class="small muted">${M.k}</span></div><p class="small muted">${M.d}</p>${Object.entries(AUTH).filter(([a,A])=>A.o===k).map(([a,A])=>`<div class="crow"><span><b>${A.n}</b> · ${A.r}<small>${A.b}</small><small>Themen: ${A.t}</small></span><span class="small" title="Trefferquote bei Gerüchten">Verlässlichkeit<br><span class="stars">${stars(Math.round(A.rel*20))}</span></span></div>`).join('')}</div>`).join('')}</div>`;
  const card=x=>{const A=AUTH[x.a],M=MEDIA[A.o],T=MTYPE[x.type];return `<div class="card mart click ${x.br?'br':''}" data-act="mOpen" data-v="${x.id}"><div class="mmeta"><span class="mout" style="background:${M.c}">${M.n}</span><span class="mtype" style="color:${T[1]}">${T[0]}</span><span class="small muted">· ${fmtDate(gameDate(Math.max(0,x.w-1)))}${x.s!==S.season?' ('+seasonLbl(x.s)+')':''}</span></div><div class="mtitle">${esc(x.title)}</div><div class="small muted">${esc(x.teaser)}</div><div class="small" style="margin-top:6px">von <b>${A.n}</b></div></div>`};
  return `<h2>Medien</h2>${tabs}${ivPanel()}
   ${br.length?`<div class="mticker"><b>EILMELDUNG</b><div class="mtrack">${br.map(x=>`<span data-act="mOpen" data-v="${x.id}">${esc(x.title.replace(/\+\+\+/g,'').trim())}</span>`).join(' · ')}</div></div>`:''}
   <div class="row" style="gap:6px;flex-wrap:wrap;margin:10px 0">${chips.map(([k,l])=>`<button class="btn sm ${F.t===k?'pri':''}" data-act="mFilt" data-v="${k}">${l}</button>`).join('')}<button class="btn sm ${F.mine?'pri':''}" data-act="mMine">⭐ Mein Verein</button>
    <select data-chg="mOut"><option value="">Alle Medien</option>${Object.entries(MEDIA).map(([k,M])=>`<option value="${k}" ${F.o===k?'selected':''}>${M.n}</option>`).join('')}</select></div>
   <div class="mgrid">${list.slice(0,60).map(card).join('')||'<div class="card"><p class="muted">Noch keine Artikel. Spiel ein paar Wochen – die Redaktionen schreiben über alles, was passiert.</p></div>'}</div>`;
}
function mArticle(id){return ()=>{
  const x=(S.media||[]).find(y=>y.id===id);if(!x)return '';const A=AUTH[x.a],M=MEDIA[A.o],T=MTYPE[x.type];
  return `<div class="marticle"><div class="mmeta"><span class="mout" style="background:${M.c}">${M.n}</span><span class="mtype" style="color:${T[1]}">${T[0]}</span><span class="small muted">· ${fmtDate(gameDate(Math.max(0,x.w-1)))}</span></div>
   <h2 class="mh">${esc(x.title)}</h2><p class="mlead">${esc(x.teaser)}</p>${x.body.map(b=>`<p>${b}</p>`).join('')}
   <div class="mauthor"><b>${A.n}</b> · ${A.r} bei ${M.n}<div class="small muted">${A.b}</div></div>
   <div class="row" style="margin-top:12px"><button class="btn" data-act="closeModal">Schließen</button></div></div>`}}
Object.assign(ACT,{
  mTab:d=>{UI.mf.tab=d.v;render()},
  mFilt:d=>{UI.mf.t=d.v;render()},
  mMine:()=>{UI.mf.mine=!UI.mf.mine;render()},
  mOpen:d=>{const x=(S.media||[]).find(y=>y.id===d.v);if(x)x.rd=1;UI.modal=mArticle(d.v);render()}
});
Object.assign(CHG,{mOut:el=>{UI.mf.o=el.value;render()}});
