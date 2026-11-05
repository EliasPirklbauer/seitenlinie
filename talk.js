/* =====================================================================
   Seitenlinie – Gesprächssprache für den Verhandlungsraum
   Gesprochene Zahlen, Gesten, Smalltalk und Persönlichkeit
   ===================================================================== */
function spM(v){
  v=Math.round(v||0);
  if(v>=1e6){const m=v/1e6;const s=(Math.round(m*10)/10).toLocaleString('de-DE');return (s==='1'?'eine Million':s+' Millionen')}
  if(v>=1e4)return (Math.round(v/1000)*1000).toLocaleString('de-DE')+' Euro';
  return v.toLocaleString('de-DE')+' Euro';
}
function num(n){return ['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn'][n]||String(n)}
function yrsW(n){return n===1?'ein Jahr':num(n)+' Jahre'}
function mgrName(){return S.manager||'Trainer'}
function mgrLast(){const n=mgrName().split(' ');return n[n.length-1]}
function firstOf(p){return p.fn}
const G={
  calm:['*lehnt sich zurück*','*nickt langsam*','*rührt in seinem Kaffee*','*blättert in den Unterlagen*','*faltet die Hände*'],
  tense:['*trommelt mit den Fingern auf den Tisch*','*atmet hörbar aus*','*schiebt die Mappe ein Stück von sich*','*schaut kurz auf die Uhr*','*verzieht das Gesicht*'],
  warm:['*lacht*','*lächelt*','*breitet die Arme aus*','*klopft auf den Tisch*'],
  think:['*überlegt*','*kratzt sich am Kinn*','*schaut aus dem Fenster*','*macht sich eine Notiz*','*rechnet kurz auf einem Zettel*'],
  shy:['*schaut auf den Boden*','*reibt sich die Hände*','*lächelt verlegen*'],
  phone:['*schaut auf sein Handy*','*legt das Handy mit dem Display nach unten auf den Tisch*']};
function gest(k){return pick(G[k])}
function moodG(pat){return pat>=60?gest(rnd()<.5?'calm':'warm'):pat>=35?gest(rnd()<.5?'think':'calm'):gest('tense')}
function lastResultLine(){
  const r=(S.ureps||[]).slice(-1)[0];if(!r||r.s!==S.season)return '';
  const o=club(r.opp);if(!o)return '';
  if(r.gf>r.ga)return pick([`Glückwunsch übrigens zum ${r.gf}:${r.ga} gegen ${o.name}.`,`Starker Auftritt neulich gegen ${o.short}, das muss man sagen.`]);
  if(r.gf<r.ga)return pick([`Bitter, das ${r.gf}:${r.ga} gegen ${o.name}. Kopf hoch.`,`Das Spiel gegen ${o.short} … das tat bestimmt weh.`]);
  return `Das ${r.gf}:${r.ga} gegen ${o.short} – gerechtes Ergebnis, oder?`;
}

/* ---------- Mein Angebot in gesprochener Form ---------- */
function offerSpeech(b,du){
  const parts=[];const ihr=du?'ihr':'Sie';
  parts.push(`${spM(b.fee)} sofort`);
  if(b.inst)parts.push(`weitere ${spM(b.inst)}, verteilt auf ${b.instY===1?'ein Jahr':num(b.instY)+' Jahre'}`);
  if(b.ao)parts.push(`${spM(b.ao)} obendrauf, sobald er ${b.aoN} Pflichtspiele für uns gemacht hat`);
  if(b.so)parts.push(`und ${b.so} Prozent, falls wir ihn irgendwann weiterverkaufen`);
  return parts.length===1?parts[0]:parts.slice(0,-1).join(', ')+(parts[parts.length-1].startsWith('und')?' ':' und ')+parts[parts.length-1];
}
const MY_ARG={
  neutral:['Wir würden {offer} auf den Tisch legen.','Unser Vorschlag: {offer}.','Lassen Sie mich direkt sein: {offer}.','Wir haben intern gerechnet. Möglich sind {offer}.'],
  bench:['Wir bieten {offer}. Und seien wir ehrlich – {first} sitzt bei Ihnen doch meistens draußen, {apps} Einsätze in dieser Saison.','{offer}. Mal unter uns: Bei Ihnen kommt {first} kaum zum Zug. Bei uns würde er spielen.'],
  contract:['{offer}. Sein Vertrag läuft {until} aus – irgendwann geht er sonst ablösefrei.','Wir legen {offer} hin. Bei der Restlaufzeit ist das, glaube ich, ein faires Angebot.'],
  age:['{offer}. Er ist {age}, da wird der Wiederverkaufswert nicht mehr steigen.','Für einen {age}-Jährigen sind {offer} ordentlich, finden Sie nicht?'],
  wants:['{offer}. Und ich habe mit {first} gesprochen – er will zu uns.','Wir bieten {offer}. Der Junge möchte wechseln, das wissen Sie wahrscheinlich auch.'],
  alt:['{offer}. Ich sage es offen: Wir haben auch andere Spieler auf dem Zettel.','Unser Angebot liegt bei {offer}. Wenn das nicht passt, schauen wir uns eben anders um.'],
  partner:['{offer}. Und ich fände es schön, wenn unsere Vereine in Zukunft öfter zusammenarbeiten.','Wir bieten {offer}. Ich denke, wir können beide von einer guten Beziehung profitieren.'],
  final:['{offer}. Das ist unser letztes Angebot – mehr ist nicht drin.','Ich lege {offer} auf den Tisch. Und das ist mein letztes Wort.']};
function myOfferLine(b,arg,p){
  const until=p.until<=S.season?'diesen Sommer':'nächsten Sommer';
  return T(MY_ARG[arg]||MY_ARG.neutral,{offer:offerSpeech(b),first:firstOf(p),apps:p.apps||0,until,age:p.age});
}

/* ---------- Sportdirektor ---------- */
const SD_VOICE={
  star:{hello:['Wir verkaufen nicht an jeden. Aber ich höre mir an, was Sie vorhaben.','Unsere besten Spieler haben ihren Preis. Das wissen Sie hoffentlich.'],agree:'Gut. Dann wird das ein Transfer, über den man spricht.',no:'Bei uns gibt es keine Rabatte.'},
  schnaeppchen:{hello:['Ich bin Kaufmann. Wenn die Zahlen stimmen, kommen wir zusammen.','Bei uns hat alles seinen Preis – reden wir über Zahlen.'],agree:'Die Zahlen stimmen. Machen wir es.',no:'Das rechnet sich für uns nicht.'},
  jugend:{hello:['Sie wissen, wie sehr wir an unseren Spielern hängen. Überzeugen Sie mich.','Unsere Jungs sind unser Kapital. Ich gebe niemanden leichtfertig ab.'],agree:'Er hat es sich verdient. Passen Sie gut auf ihn auf.',no:'So geben wir keinen unserer Jungs ab.'},
  erfahrung:{hello:['Lassen Sie uns pragmatisch bleiben. Was schwebt Ihnen vor?','Ich mag klare Ansagen. Also – was bieten Sie?'],agree:'Pragmatisch und fair. So mag ich das.',no:'Das ist mir zu wenig.'}};
function sdHello(p,s,dir,pres,rel){
  const V=SD_VOICE[dir.trait]||SD_VOICE.erfahrung,sit=clubSituation(s),L=[];
  L.push(`${gest('warm')} Herr ${mgrLast()}, willkommen bei ${s.name}! ${pick(['Kaffee? Wasser?','Setzen Sie sich doch.','Gut hergefunden?'])}`);
  const lr=lastResultLine();if(lr)L.push(lr);
  if(sit.v<=-.6)L.push(pick(['Sie wissen ja, bei uns läuft es gerade nicht rund. Das macht solche Gespräche nicht einfacher.','Wir stecken im Moment in einer schwierigen Phase, da will ich ehrlich sein.']));
  else if(sit.v>=.6)L.push(`Wir spielen eine starke Saison – und ${firstOf(p)} hat seinen Anteil daran.`);
  L.push(`${gest('calm')} Sie sind wegen ${firstOf(p)} hier. ${pick(V.hello)}`);
  if(pres.trait==='sparsam')L.push(`Unter uns: Unser Präsident schaut gerade sehr genau aufs Geld.`);
  else if(pres.trait==='ambitioniert')L.push(`Unser Präsident hat große Pläne. Den Spieler abzugeben, wird er nicht gern hören.`);
  if(rel>=2)L.push('Mit Ihnen haben wir ja schon gute Geschäfte gemacht – das zählt für mich.');
  else if(rel<=-2)L.push(`${gest('tense')} Ehrlich gesagt: Nach dem letzten Mal bin ich vorsichtig.`);
  return L;
}
const SD_ARG={
  bench:{ok:['{g} Gut … er kommt bei uns nicht so zum Zug, wie wir uns das vorgestellt haben. Das gebe ich zu.','Da haben Sie einen Punkt. {first} sitzt zu oft draußen, das sieht er auch selbst so.'],no:['{g} Er ist bei uns gesetzt, das wissen Sie genau. Netter Versuch.','{first} hat fast jedes Spiel gemacht. Erzählen Sie mir nichts.']},
  contract:{ok:['{g} Ja … der Vertrag. Wir wollen ihn nicht ablösefrei verlieren, da haben Sie recht.','Die Laufzeit ist ein Thema, keine Frage.'],no:['Sein Vertrag läuft noch lange. Wir stehen überhaupt nicht unter Druck.','{g} Vertrag? Der hat noch Jahre. Das ist kein Argument.']},
  age:{ok:['Er ist über dreißig, das stimmt. Aber er ist topfit, glauben Sie mir.','{g} Das Alter, ja. Trotzdem ist er einer unserer Wichtigsten.'],no:['Er ist {age}. Das Argument zieht wirklich nicht.','{g} {age} Jahre? Er ist im besten Fußballeralter.']},
  wants:{ok:['{g} Ich habe auch schon gehört, dass er wechseln möchte. Gegen den Willen des Spielers zu arbeiten, bringt niemandem etwas.','Ja, {first} hat das bei mir auch schon angedeutet.'],no:['{g} Mit dem Spieler haben Sie offenbar noch nicht richtig gesprochen. Oder er sieht das anders als Sie.','Woher wollen Sie das wissen? {first} hat mir gegenüber nichts dergleichen gesagt.']},
  alt:{ok:['{g} Andere Kandidaten … Lassen Sie uns nicht vorschnell sein.','Hm. Na ja, wir müssen ja auch nicht gleich auseinandergehen.'],no:['{g} Dann nehmen Sie doch die Alternativen. Ich halte Sie nicht auf.','Drohungen beeindrucken mich nicht, Herr {mgr}.']},
  partner:{ok:['{g} Langfristig denken gefällt mir. Gute Beziehungen sind in diesem Geschäft Gold wert.','Das sehe ich genauso. Man sieht sich immer zweimal.']},
  repeat:['Das hatten Sie schon gesagt. Wiederholungen machen es nicht besser.','{g} Das sagten Sie bereits.']};
function sdArg(key,ok,p){return T(SD_ARG[key][ok?'ok':'no']||SD_ARG[key].ok,{g:gest(ok?'think':'tense'),first:firstOf(p),age:p.age,mgr:mgrLast()})}
function sdCounter(close,cb,pat){
  const lead=close>.9?pick(['Wir sind nah dran.','Das geht in die richtige Richtung.','Okay, jetzt reden wir.']):close>.75?pick(['Da fehlt noch ein gutes Stück.','Das reicht mir noch nicht.','Sie müssen schon noch etwas tun.']):pick(['Wir liegen noch weit auseinander.','Da müssen Sie deutlich drauflegen.','Damit kann ich nicht zu meinem Präsidenten gehen.']);
  return `${moodG(pat)} ${lead} ${pick(['Ich sage Ihnen, was ich mir vorstellen kann:','Mein Vorschlag:','Für uns müsste es so aussehen:'])} ${offerSpeech(cb)}.${pat<35?' '+pick(['Und viel Zeit habe ich nicht mehr.','Lange mache ich das hier nicht mehr mit.']):''}`;
}
function sdInsult(){return `${gest('tense')} ${pick(['Das ist nicht Ihr Ernst. Das ist weit weg von jeder Realität.','Soll das ein Witz sein? So kommen wir nicht weiter.','Dafür bekommen Sie nicht einmal seine Schuhe.','Ich hoffe, das war ein Versprecher.'])}`}
function sdAgree(dir,pres){const V=SD_VOICE[dir.trait]||SD_VOICE.erfahrung;return `${gest('warm')} ${V.agree} *steht auf und reicht Ihnen die Hand* Ich rufe gleich ${pres.trait==='sparsam'?'unseren Präsidenten':'den Präsidenten'} an. Die Papiere schicken wir Ihnen heute noch.`}
function sdBreak(){return `${gest('tense')} ${pick(['Ich glaube, wir verschwenden hier unsere Zeit. Wir sind fertig.','Wir drehen uns im Kreis. Ich breche das Gespräch ab.','Dann sind wir hier fertig. Viel Erfolg bei Ihrer Suche.'])} *klappt die Mappe zu*`}
function sdFinalCounter(cb){return `${gest('think')} … ${pick(['Na gut.','Hören Sie.'])} Ein letztes Wort von unserer Seite: ${offerSpeech(cb)}. Darunter geht nichts – wirklich nichts.`}

/* ---------- Spieler ---------- */
function plStyle(p){return p.age<=21?'young':ovr(p)>=80||at(p,'amb')>=16?'star':agentOf(p).type==='family'||p.age>=30?'family':'normal'}
function plHello(p,conv){
  const st=plStyle(p),cur=p.club!==null?club(p.club):null,L=[];
  L.push(st==='young'?`${gest('shy')} Hallo Trainer … also, Herr ${mgrLast()}. Danke, dass Sie sich Zeit nehmen.`:st==='star'?`*gibt Ihnen einen festen Händedruck* Trainer. Ich habe nicht viel Zeit, aber ich bin gespannt.`:`*setzt sich* Hallo Trainer, schön, Sie kennenzulernen.`);
  const lr=lastResultLine();if(lr&&rnd()<.5)L.push(lr.replace('Glückwunsch übrigens','Glückwunsch übrigens auch von mir'));
  L.push(conv>=60?pick(['Ich habe schon viel von Ihrem Projekt gehört. Ehrlich gesagt bin ich ziemlich neugierig.','Mein Berater hat mir erzählt, dass Sie sich sehr um mich bemühen. Das freut mich.']):conv>=35?pick([`Ich bin offen. Aber ich bin ${cur?'bei '+cur.short:'gerade'} auch nicht unglücklich.`,'Ich höre mir gern an, was Sie vorhaben.']):pick([`Ehrlich gesagt bin ich nur hier, weil mein Berater darauf bestanden hat.`,`Ich fühle mich ${cur?'bei '+cur.short:''} eigentlich wohl, das sage ich gleich.`]));
  return L;
}
const PL_PRIO={
  money:['Ich will ehrlich sein: Ich möchte für meine Familie ausgesorgt haben. Die Karriere ist kurz.','Am Ende ist Fußball auch mein Beruf. Das Finanzielle muss einfach stimmen.'],
  play:['Ich will spielen. Jede Woche. Auf der Bank werde ich verrückt.','Spielzeit. Ganz klar. Ich will Verantwortung auf dem Platz.'],
  title:['Ich will Titel gewinnen, solange ich noch kann. Eine Meisterschale – davon träume ich.','Ich will um etwas spielen. Mittelfeld der Tabelle reicht mir nicht.'],
  dev:['Ich will besser werden. Irgendwann will ich auf höchstem Niveau spielen, vielleicht in der Nationalmannschaft.','Ich brauche einen Trainer, der mich weiterbringt. Jeden Tag.'],
  prestige:['Ich träume von den großen Stadien, den großen Abenden unter Flutlicht.','Ich will in einer Liga spielen, die die ganze Welt sieht.'],
  home:['Meine Familie ist mir das Wichtigste. Meine Frau und die Kinder müssen sich wohlfühlen.','Ehrlich gesagt vermisse ich manchmal mein Zuhause. Das spielt eine Rolle.']};
const PL_MORE={money:'Natürlich muss auch das Finanzielle passen, das will ich nicht verschweigen.',play:'Und ich will nicht auf der Bank versauern.',title:'Und ich will gewinnen. Ich hasse es zu verlieren.',dev:'Und ich will mich weiterentwickeln, nicht stehen bleiben.',prestige:'Eine starke Liga wäre schon schön.',home:'Und meine Familie soll sich wohlfühlen – das ist mir wichtig.'};
function plReact(d){return d>=10?pick(['*nickt*','*lächelt*','*richtet sich auf*','*Augen leuchten*']):d<=0?pick(['*verschränkt die Arme*','*runzelt die Stirn*','*schaut zu seinem Berater*','*lehnt sich skeptisch zurück*']):pick(['*überlegt*','*nickt vorsichtig*'])}
function plEnd(conv,p){
  return conv>=70?`*steht auf und gibt Ihnen die Hand* Trainer, ich habe ein richtig gutes Gefühl. Sprechen Sie mit ${agentOf(p).name.split(' ')[0]} über die Details – ich will das machen.`:
    conv>=45?`Danke für das offene Gespräch. Ich denke darüber nach. Mein Berater meldet sich bei Ihnen.`:
    conv>=25?`${gest('think')} Ich bin noch nicht ganz überzeugt. Wenn, dann muss das Paket wirklich stimmen.`:
    `Ich glaube nicht, dass das passt, Trainer. Tut mir leid – aber danke für Ihre Zeit.`;
}

/* ---------- Berater ---------- */
const AG_VOICE={
  fast:{hello:'Machen wir es kurz, ich habe heute noch zwei Termine.',counter:['Ich will das heute abschließen.','Kommen Sie mir ein Stück entgegen, dann sind wir durch.'],yes:'Perfekt. Ich schicke Ihnen die Unterlagen noch heute.'},
  poker:{hello:'*lehnt sich entspannt zurück* Wissen Sie, mein Telefon klingelt seit Wochen. Aber Sie waren mir sympathisch.',counter:['*lächelt* Ich glaube, da geht noch was.','Sie wollen ihn doch, oder? Dann zeigen Sie es auch.'],yes:'*grinst* Sie verhandeln hart. Gut, wir machen es.'},
  family:{hello:'Für {first} und seine Familie muss das Gesamtpaket stimmen – nicht nur das Geld.',counter:['Es geht nicht nur um Geld, aber eben auch.','Er soll sich bei Ihnen wohlfühlen. Daran messe ich alles.'],yes:'Ich glaube, das ist ein guter Schritt für ihn. Danke für Ihre Geduld.'},
  biz:{hello:'*öffnet einen Laptop* Ich habe die Zahlen vorbereitet. Reden wir übers Geschäft.',counter:['Die Zahlen sind die Zahlen.','Am Ende muss es sich für alle Beteiligten rechnen – auch für mich.'],yes:'Gutes Geschäft für alle. So soll es sein.'}};
function agHello(A,p,ask){
  const V=AG_VOICE[A.type];
  return [`*schüttelt Ihnen die Hand* ${A.name}, ${A.agency}. ${T([V.hello],{first:firstOf(p)})}`,
    `Unsere Vorstellungen: ${spM(mon(ask.W))} brutto im Monat als ${ROLES[ask.role].label}, ${yrsW(ask.years)}. Dazu ${spM(ask.si)} Handgeld. Und mein Honorar liegt bei ${spM(ask.af)}.`];
}
function myAgentLine(o,tac){
  const base=pick([`Wir bieten ${spM(o.mw)} brutto im Monat, ${yrsW(o.years)}, als ${ROLES[o.role].label}. ${spM(o.si)} Handgeld und ${spM(o.af)} für Sie.`,`Mein Vorschlag: ${spM(o.mw)} im Monat über ${yrsW(o.years)}, ${spM(o.si)} Handgeld, Ihr Honorar ${spM(o.af)}.`]);
  const add={deadline:' Ich brauche bis morgen früh eine Antwort.',flatter:' Und ich sage das ehrlich: Sie machen einen tollen Job für ihn.',walk:' Das ist mein letztes Wort.'}[tac]||'';
  return base+add;
}
function agCounter(A,c,pat,floorHit){
  const V=AG_VOICE[A.type];
  return `${moodG(pat)} ${pick(V.counter)} Wir wären bei ${spM(c.mw)} im Monat, ${spM(c.si)} Handgeld und ${spM(c.af)} Honorar.${floorHit?' Weiter runter gehe ich nicht – das ist die Schmerzgrenze.':''}`;
}
