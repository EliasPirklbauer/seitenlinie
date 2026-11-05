/* =====================================================================
   Seitenlinie – Atmosphäre: Fans, Stadion, Spieler, Trainer, Schiri
   Liefert zusätzliche Tickerzeilen für den Live-Spieltag
   ===================================================================== */
let MATCH_CTX=null;   // wird vor simMatch von Liga/Pokal/Europapokal gesetzt

function coachN(c){if(c.id===S.user&&S.manager)return S.manager;return c.staff&&c.staff.coach?c.staff.coach.name:'Der Trainer'}
function coachTag(c){if(c.id===S.user)return 'dein Team';const t=c.staff&&c.staff.coach&&COACH[c.staff.coach.trait];return t?t.label:''}
function coachL(c){const n=coachN(c).split(' ');return n[n.length-1]}
function captainOf(c){const xs=onPitch(c);if(!xs.length)return null;return xs.slice().sort((a,b)=>at(b.p,'ldr')-at(a.p,'ldr'))[0].p}
function starOf(c){const xs=onPitch(c);if(!xs.length)return null;return xs.slice().sort((a,b)=>ovr(b.p)-ovr(a.p))[0].p}
function homeSide(M){return M.res.neutral?null:'h'}
function fansOf(M,s){const c=M.c[s];return s==='h'&&!M.res.neutral?pick([`die Fans von ${c.short}`,'die Heimfans',`die ${c.short}-Anhänger`]):pick([`die mitgereisten ${c.short}-Fans`,'die Gästefans',`die Anhänger von ${c.short}`])}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function tooor(){return 'T'+'O'.repeat(ri(3,7))+'R'+'!'.repeat(ri(1,3))}
function chance(p){return rnd()<p}

const AT={
  weather:{
    cold:['Eisige Temperaturen, der Atem der Spieler steigt in kleinen Wolken auf.','Knackig kalt heute – die Ersatzspieler sitzen dick eingepackt auf der Bank.','Leichter Schneefall über dem Stadion, der Rasen ist aber bestens bespielbar.','Es regnet in Strömen – das wird ein Spiel für Kämpfer.'],
    mild:['Angenehme Temperaturen, der Rasen ist frisch gewässert.','Ein paar Wolken über dem Stadion, perfektes Fußballwetter.','Leichter Nieselregen – der Ball wird schnell werden.','Ein lauer Abend unter Flutlicht.'],
    warm:['Hochsommerliche Temperaturen – Trinkpausen könnten heute wichtig werden.','Die Sonne knallt aufs Spielfeld, über 28 Grad im Stadion.','Ein warmer Spätsommertag, die Tribünen sind in Sonnenlicht getaucht.']},
  crowd:['Das Stadion ist bis auf den letzten Platz gefüllt!','Ausverkauftes Haus – die Stimmung ist schon vor dem Anpfiff elektrisierend.','Die Ränge füllen sich, die Vorfreude ist überall zu spüren.','Ordentlich Betrieb auf den Tribünen.'],
  choreo:['Die Heimkurve präsentiert eine riesige Choreografie – Gänsehaut pur!','Ein Fahnenmeer auf der Tribüne von {c}!','Rauchschwaden und Schals in der Luft – die Kurve von {c} gibt alles.','Tausende Schals werden in die Höhe gereckt, „You\'ll never walk alone" schallt durchs Rund.'],
  walk:['Die Mannschaften betreten den Rasen – {cap1} und {cap2} führen ihre Teams aufs Feld.','Unter dem Jubel der Fans laufen die Teams ein.','Die Spieler kommen aus dem Tunnel, die Einlaufkinder an der Hand.'],
  anthem:['Die Hymne erklingt – die Spieler stehen Schulter an Schulter.','Gänsehaut-Moment: die Champions-League-Hymne hallt durchs Stadion.'],
  cupNight:['Pokalnächte haben ihre eigenen Gesetze!','Ein K.-o.-Spiel – hier gibt es kein Morgen.','Für beide Teams geht es um alles.'],
  coachPre:['{coach} gibt seinen Spielern letzte Anweisungen und klatscht jeden einzeln ab.','{coach} wirkt konzentriert, die Arme verschränkt an der Seitenlinie.','Handshake an der Seitenlinie zwischen {coach} und {coach2}.'],
  toss:['Platzwahl – {cap1} gewinnt den Münzwurf.','Seitenwahl erledigt, {ref} schaut auf die Uhr …'],
  // nach Toren
  celeb:['{p} rennt zur Eckfahne und lässt sich feiern!','{p} reißt sich das Trikot vom Leib – das gibt Gelb, aber das ist ihm egal!','{p} rutscht auf den Knien Richtung Kurve!','{p} formt mit den Händen ein Herz in Richtung Tribüne.','Die ganze Mannschaft begräbt {p} unter einer Jubeltraube!','{p} küsst das Wappen auf seinem Trikot!','{p} springt in die Arme von {a}!','{p} zeigt mit beiden Zeigefingern in den Himmel.','{p} bleibt ganz cool und klatscht nur kurz mit den Kollegen ab.'],
  fansGoalHome:['Das Stadion explodiert! {f} liegen sich in den Armen!','Ohrenbetäubender Jubel – die Tribünen beben!','Bierbecher fliegen durch die Luft, die Kurve ist außer sich!','Was für ein Lärm! Der Stadionsprecher ruft den Torschützen aus – und tausende brüllen seinen Nachnamen!'],
  fansGoalAway:['Im Gästeblock brechen alle Dämme! {f} feiern ausgelassen.','Plötzlich ist es still im Stadion – nur der Gästeblock jubelt.','Fassungslosigkeit auf den Heimrängen, Ekstase bei {f}.'],
  coachGoal:['{coach} reißt die Fäuste in die Höhe und umarmt seinen Co-Trainer!','{coach} sprintet die Seitenlinie entlang!','{coach} bleibt erstaunlich ruhig und gibt sofort neue Anweisungen.','Auf der Bank von {c} springen alle auf!'],
  concede:['{coach2} schüttelt fassungslos den Kopf.','Die Spieler von {o} schauen sich ratlos an.','{gk} hadert, schlägt mit der Faust auf den Rasen.','{cap2} klatscht in die Hände und versucht, sein Team aufzurichten.','{coach2} brüllt Anweisungen auf den Platz – er ist sichtlich bedient.'],
  equal:['Alles wieder offen!','Das Spiel beginnt von vorne!'],
  lateGoal:['Was für ein Drama in der Schlussphase!','Das Stadion steht Kopf!','Unfassbar – genau in diesem Moment!'],
  // nach vergebenen Großchancen
  missP:['{p} schlägt die Hände vors Gesicht.','{p} kann es nicht fassen, liegt bäuchlings auf dem Rasen.','{p} schaut ungläubig in den Himmel.','{p} tritt frustriert gegen den Torpfosten.'],
  missFans:['Ein kollektives Aufstöhnen geht durchs Stadion.','„Ohhhh!" – die Fans raufen sich die Haare.','Die Fans haben den Torschrei schon auf den Lippen.'],
  missCoach:['{coach} reißt die Hände über den Kopf.','{coach} kann es nicht glauben und dreht sich zur Bank um.','{coach} hockt sich an die Seitenlinie und starrt ins Leere.'],
  saveFans:['Szenenapplaus für {gk}!','{gk} wird von seinen Mitspielern abgeklatscht.','„{gkl}! {gkl}!" – Sprechchöre für den Keeper.'],
  // Karten
  protest:['{p} reklamiert heftig, doch {ref} bleibt hart.','Rudelbildung! Mehrere Spieler gehen aufeinander los, {cap} geht dazwischen.','Pfiffe von den Rängen – das Publikum ist mit der Entscheidung nicht einverstanden.','{p} hebt unschuldig die Hände – er hat den Ball gespielt, sagt er.','{coach} tobt an der Seitenlinie und wird vom vierten Offiziellen beruhigt.'],
  redReact:['{p} schleicht mit hängendem Kopf vom Platz.','Gellendes Pfeifkonzert, als {p} in die Kabine geht.','{coach} fasst sich an den Kopf – das kann das Spiel entscheiden.','{p} kann es nicht fassen und muss von den Betreuern weggeführt werden.'],
  // Wechsel
  ovation:['Stehende Ovationen für {out}, der sich den Applaus redlich verdient hat!','{out} wird mit großem Applaus verabschiedet.'],
  offBoo:['{out} geht betont langsam vom Feld – Pfiffe von den gegnerischen Fans.','{out} schüttelt beim Abgang demonstrativ den Kopf – er wollte nicht raus.'],
  subIn:['{in} klatscht mit {coach} ab und sprintet aufs Feld.','{in} bekommt noch letzte Anweisungen von {coach}.'],
  injury:['Aufmunternder Applaus von allen Seiten.','Die Fans beider Lager klatschen anerkennend.','Hoffentlich nichts Ernstes …'],
  // Füller
  fansHome:['„Steht auf, wenn ihr {c} seid!" – das ganze Stadion erhebt sich.','Die Heimkurve singt sich warm – Wechselgesänge von Tribüne zu Tribüne.','Die Fans von {c} peitschen ihr Team mit rhythmischem Klatschen nach vorne.','Eine La-Ola-Welle schwappt durchs Stadion.','„Auf geht\'s {c}, schießt ein Tor!" schallt es von den Rängen.','Trommeln und Fahnen in der Kurve – hier ist richtig was los.'],
  fansAway:['Der Gästeblock ist heute laut – {f} sind in großer Zahl angereist.','Wechselgesänge zwischen den Fanlagern.','Die Gästefans machen ordentlich Lärm, ihr Team lässt sich davon tragen.'],
  fansAngry:['Erste Pfiffe von den Rängen – die Geduld der Fans ist am Ende.','„Wir wollen euch kämpfen sehen!" schallt es aus der Kurve.','Unruhe auf den Tribünen. Die Fans von {c} sind mit dem Auftritt nicht zufrieden.'],
  fansHappy:['„Oléééé!" – jeder Pass von {c} wird gefeiert.','Die Fans von {c} genießen den Nachmittag und singen ohne Pause.','Partystimmung auf den Rängen von {c}!'],
  coachSide:['{coach} steht an der Seitenlinie und dirigiert lautstark.','{coach} gestikuliert wild und fordert mehr Tempo.','{coach} notiert sich etwas auf seinem Block.','{coach} ruft {p} zu sich und gibt taktische Anweisungen.','{coach} verschränkt die Arme – er wirkt nicht zufrieden.','{coach} klatscht anerkennend nach einer gelungenen Kombination.','Der Co-Trainer von {c} reicht {coachL} ein Tablet mit Szenen.'],
  players:['{cap} ruft seine Vorderleute zusammen und fordert mehr Konzentration.','{gk} brüllt seine Abwehr an – er ist mit der Ordnung nicht einverstanden.','{p} und {q} diskutieren nach einem Fehlpass.','{p} holt sich an der Seitenlinie eine Trinkflasche.','{p} sucht immer wieder das Eins-gegen-eins.','{p} will den Ball, winkt fordernd.','{star} ist bisher kaum zu sehen – {o} hat ihn gut im Griff.','{star} ist der auffälligste Spieler auf dem Platz.'],
  ref:['{ref} lässt viel laufen – eine großzügige Linie.','{ref} unterbricht kurz, ein Spieler hat Krämpfe.','Kurze Trinkpause – {ref} gibt das Zeichen.','{ref} ermahnt {p} mit erhobenem Zeigefinger.'],
  tactics:['{c} schiebt jetzt höher und attackiert schon den Spielaufbau.','{c} verlagert das Spiel immer wieder auf den ballfernen Flügel.','{o} zieht sich zurück und lauert auf Ballgewinne.','Das Mittelfeld ist dicht – kaum ein Durchkommen für beide Teams.','{c} versucht es über lange Bälle auf die Spitze.','{c} kombiniert sich geduldig durchs Zentrum.'],
  stat:['Statistik-Blick: {sh1} zu {sh2} Torschüsse, xG {x1} zu {x2}.','{c} hatte bisher {poss} Prozent Ballbesitz.','Zahl am Rande: {cor1} zu {cor2} Ecken bisher.'],
  tension:['Die Spannung ist kaum auszuhalten!','Jeder Zweikampf wird jetzt bejubelt, als wäre es ein Tor.','Das Publikum ist aufgestanden, keiner sitzt mehr.','Nervenkitzel pur!','Die Uhr tickt …'],
  // Halbzeit
  htFans:['Applaus zur Pause – das Publikum ist zufrieden.','Pfiffe zur Pause – das war zu wenig.','Gemischte Reaktionen auf den Rängen zur Pause.'],
  htCoach:['{coach} verschwindet als Erster in den Katakomben – da wird es eine deutliche Kabinenansprache geben.','{coach} klopft seinen Spielern auf dem Weg in die Kabine auf die Schulter.','{coach} diskutiert auf dem Weg in die Kabine mit {ref}.'],
  // Abpfiff
  ftWin:['Die Spieler von {c} reißen die Arme hoch und laufen zur Kurve!','{coach} umarmt jeden einzelnen Spieler.','Die Fans von {c} feiern ihre Mannschaft mit Sprechchören.','Ehrenrunde für {c} – die Kurve singt.'],
  ftLose:['Die Spieler von {c} sinken enttäuscht zu Boden.','{coach} geht mit gesenktem Kopf in die Kabine.','Hängende Köpfe bei {c}.','{cap} geht trotzdem zur Kurve und bedankt sich bei den Fans.'],
  ftDraw:['Shakehands zwischen {coach} und {coach2}.','Beide Teams geben sich die Hand – ein gerechtes Ergebnis?','Gemischte Gefühle auf den Rängen.'],
  ftBig:['Was für ein Spiel! Das werden die Fans so schnell nicht vergessen.','Ein echtes Spektakel!']
};
function atv(M,side,extra){
  const s=side||'h',c=M.c[s],o=M.c[OTHER[s]];
  const xs=onPitch(c),pp=xs.length?pick(xs).p:null,qq=xs.length?pick(xs).p:null;
  const cap1=captainOf(M.c.h),cap2=captainOf(M.c.a),cp=captainOf(c),gk=keeperOf(c),st=starOf(c);
  return Object.assign({c:c.short,o:o.short,coach:coachN(c),coachL:coachL(c),coach2:coachN(o),cap:pn(cp),cap1:pn(cap1),cap2:pn(cap2),p:pn(pp),q:pn(qq),gk:pn(gk),gkl:gk?gk.ln:'',star:pn(st),ref:M.res.ref||'Der Schiedsrichter',f:fansOf(M,s)},extra||{});
}

/* ---------- Vor dem Anpfiff ---------- */
function preMatchLines(M){
  const hc=M.c.h,ac=M.c.a,res=M.res,v=atv(M,'h'),ctx=MATCH_CTX||{};
  const d=gameDate(S.week),mo=+d.slice(5,7);
  const wx=mo>=11||mo<=2?'cold':mo>=6&&mo<=8?'warm':'mild';
  const full=res.att>=hc.stadium*.97;
  const L=[];
  L.push(T(TX.pre,{h:hc.name,a:ac.name}));
  if(ctx.label)L.push(`${ctx.name||''}${ctx.name&&ctx.label?' · ':''}${ctx.label||''}`.trim());
  L.push(`${res.neutral?'Neutraler Platz':'Stadion von '+hc.name} – ${res.att.toLocaleString('de-DE')} Zuschauer${full?', ausverkauft':''}. ${pick(AT.weather[wx])}`);
  L.push(full||BIGMATCH?pick(AT.crowd.slice(0,2)):pick(AT.crowd));
  if(!res.neutral&&(BIGMATCH||full||chance(.35)))L.push(T(AT.choreo,v));
  L.push(`An der Seitenlinie: ${coachN(hc)}${coachTag(hc)?' ('+coachTag(hc)+')':''} gegen ${coachN(ac)}${coachTag(ac)?' ('+coachTag(ac)+')':''}.`);
  L.push(T(AT.coachPre,v));
  L.push(T(AT.walk,v));
  if(ctx.comp==='ucl')L.push(AT.anthem[1]);else if(ctx.ko||ctx.cup)L.push(pick(AT.cupNight));
  L.push(T(AT.toss,v));
  L.push(T(TX.kick,{ref:res.ref}));
  return L;
}

/* ---------- Reaktionen ---------- */
function goalLines(M,side,p,a){
  const res=M.res,o=OTHER[side],v=atv(M,side,{p:pn(p),a:a?pn(a):pn(captainOf(M.c[side]))}),vo=atv(M,o);
  const L=[];
  L.push(T(AT.celeb,v));
  const homeFans=side==='h'&&!res.neutral;
  L.push(T(homeFans||res.neutral?AT.fansGoalHome:AT.fansGoalAway,{f:fansOf(M,side)}));
  if(chance(.6))L.push(T(AT.coachGoal,v));
  if(chance(.55))L.push(T(AT.concede,{coach2:coachN(M.c[o]),o:M.c[o].short,gk:pn(keeperOf(M.c[o])),cap2:pn(captainOf(M.c[o]))}));
  if(M.ph>=2&&M.m>=85)L.push(pick(AT.lateGoal));
  return L;
}
function missLines(M,side,p){
  const v=atv(M,side,{p:pn(p)}),L=[];
  if(chance(.7))L.push(T(AT.missP,v));
  if(chance(.6))L.push(pick(AT.missFans));
  if(chance(.4))L.push(T(AT.missCoach,v));
  return L;
}
function saveLines(M,side){const o=OTHER[side],gk=keeperOf(M.c[o]);return chance(.45)?[T(AT.saveFans,{gk:pn(gk),gkl:gk?gk.ln:''})]:[]}
function cardLines(M,side,p,red){
  const v=atv(M,side,{p:pn(p)}),L=[];
  if(red){L.push(T(AT.redReact,v));if(chance(.6))L.push(T(AT.protest,v))}
  else if(chance(.4))L.push(T(AT.protest,v));
  return L;
}
function subLines(M,side,inP,outP){
  const v=atv(M,side,{in:pn(inP),out:pn(outP)}),L=[];const ps=M.res.ps[outP.id]||{};
  if((ps.g||0)>0||(ps.a||0)>0)L.push(T(AT.ovation,v));else if(chance(.12))L.push(T(AT.offBoo,v));
  if(chance(.35))L.push(T(AT.subIn,v));
  return L;
}
function htLines(M){
  const res=M.res,H=res.ts.h,A=res.ts.a,diff=res.hg-res.ag;
  const L=[`Zur Pause: Torschüsse ${H.sh}:${A.sh}, aufs Tor ${H.sot}:${A.sot}, xG ${H.xg.toFixed(2)}:${A.xg.toFixed(2)}, Ecken ${H.cor}:${A.cor}.`];
  const fansSide=res.neutral?null:'h';
  if(fansSide)L.push(diff>0?AT.htFans[0]:diff<0?AT.htFans[1]:AT.htFans[2]);
  const loser=diff<0?'h':diff>0?'a':pick(['h','a']);L.push(T(AT.htCoach,atv(M,loser)));
  return L;
}
function ftLines(M){
  const res=M.res,diff=res.hg-res.ag,L=[];
  if(diff!==0){const w=diff>0?'h':'a',l=OTHER[w];L.push(T(AT.ftWin,atv(M,w)));L.push(T(AT.ftLose,atv(M,l)))}
  else L.push(T(AT.ftDraw,atv(M,'h')));
  if(res.hg+res.ag>=5||Math.abs(diff)<=1&&res.hg+res.ag>=4)L.push(pick(AT.ftBig));
  return L;
}

/* ---------- Szenen zwischendurch ---------- */
function atmoFiller(M){
  const res=M.res,late=M.ph>=2&&M.m>=80,diff=res.hg-res.ag;
  const r=rnd();let side=rnd()<M.pH?'h':'a';const v=atv(M,side);let txt;
  const homeLosing=!res.neutral&&diff<0,homeWinning=!res.neutral&&diff>=2;
  if(late&&Math.abs(diff)<=1&&r<.35)txt=pick(AT.tension);
  else if(r<.3){
    if(homeLosing&&M.m>=55&&chance(.5))txt=T(AT.fansAngry,atv(M,'h'));
    else if(homeWinning&&chance(.5))txt=T(AT.fansHappy,atv(M,'h'));
    else if(!res.neutral&&chance(.72))txt=T(AT.fansHome,atv(M,'h'));
    else txt=T(AT.fansAway,{f:fansOf(M,'a')});
  }
  else if(r<.5)txt=T(AT.coachSide,v);
  else if(r<.68)txt=T(AT.players,v);
  else if(r<.78)txt=T(AT.ref,v);
  else if(r<.9)txt=T(AT.tactics,v);
  else{const H=res.ts.h,A=res.ts.a;txt=T(AT.stat,{sh1:H.sh,sh2:A.sh,x1:H.xg.toFixed(2),x2:A.xg.toFixed(2),c:M.c.h.short,poss:res.poss,cor1:H.cor,cor2:A.cor})}
  return {side,txt};
}
