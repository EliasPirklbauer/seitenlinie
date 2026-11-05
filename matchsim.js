/* =====================================================================
   Seitenlinie – Match-Engine: Minute für Minute, mit Wechseln, Karten,
   Statistiken (xG, Pässe, Zweikämpfe …) und detailliertem Live-Ticker
   ===================================================================== */

/* ---------- Statistik-Speicher ---------- */
// Spieler: Saison, alle Wettbewerbe (kompaktes Array)
const SX=['min','sh','sot','xg','xa','kp','pas','pcm','tck','int','drb','fls','sav','rc','sub','bc','ga'];
const SXI={};SX.forEach((k,i)=>SXI[k]=i);
function sxOf(p){if(!p.sx||p.sx.length!==SX.length){const o=p.sx||[];p.sx=SX.map((_,i)=>o[i]||0)}return p.sx}
function sxv(p,k){return p.sx?(p.sx[SXI[k]]||0):0}
// Team: Saison, nur Ligaspiele
const TS_KEYS=['mp','g','ga','xg','xga','sh','sha','sot','sota','bc','bca','poss','pas','pcm','pasA','cor','fls','yc','rc','off','cs','tck','int','pts','xpts','w','d','l'];
function teamSS(c){if(!c.ss||c.ss.season!==S.season){c.ss={season:S.season};for(const k of TS_KEYS)c.ss[k]=0}return c.ss}
function mts0(){return {sh:0,sot:0,xg:0,bc:0,cor:0,fls:0,yc:0,rc:0,off:0,pas:0,pcm:0,tck:0,int:0,drb:0,sav:0}}

/* ---------- Hilfen ---------- */
const SIDES=['h','a'];
const OTHER={h:'a',a:'h'};
const RATE_ADJ=1.01;   // gleicht die längere Nachspielzeit aus (Torquote bleibt gleich)
function keeperOf(c){const sl=slotsOf(c);const i=sl.indexOf('TW');const id=c.lineup[i>=0?i:0];return id?S.players[id]:null}
function onPitch(c){const sl=slotsOf(c);return c.lineup.map((id,i)=>({p:id&&S.players[id],pos:sl[i],i})).filter(x=>x.p)}
function benchOf(c,n){
  const inXI=new Set(c.lineup.filter(Boolean));
  const avail=squadOf(c).filter(p=>p.inj===0&&!inXI.has(p.id));
  const out=[];const gk=avail.filter(p=>p.pos==='TW').sort((a,b)=>ovr(b)-ovr(a))[0];if(gk)out.push(gk);
  const val=p=>ovr(p)*(.75+.25*p.fit/100);
  // je Mannschaftsteil mindestens ein Spieler, dann nach Stärke
  for(const g of ['ABW','MIT','ANG']){const b=avail.filter(p=>GROUP[p.pos]===g&&!out.includes(p)).sort((a,b)=>val(b)-val(a))[0];if(b&&out.length<n)out.push(b)}
  avail.filter(p=>!out.includes(p)).sort((a,b)=>val(b)-val(a)).forEach(p=>{if(out.length<n)out.push(p)});
  return out;
}
function refName(c){const pool=poolArr(ASSOC[c.assoc]?ASSOC[c.assoc].pool:'en');const R=mkRng(hashStr('ref'+c.id+':'+S.season+':'+S.week));return pool.f[Math.floor(R()*pool.f.length)]+' '+pool.l[Math.floor(R()*pool.l.length)]}
const T=(arr,o)=>{let s=pick(arr);for(const k in o)s=s.split('{'+k+'}').join(o[k]);return s};
function pn(p){return p?pname(p):'?'}
function poisson(l,k){let f=1;for(let i=2;i<=k;i++)f*=i;return Math.exp(-l)*Math.pow(l,k)/f}
function xPts(xa,xb){let w=0,d=0;for(let i=0;i<9;i++){const pi=poisson(xa,i);for(let j=0;j<9;j++){const pr=pi*poisson(xb,j);if(i>j)w+=pr;else if(i===j)d+=pr}}return 3*w+d}

/* ---------- Ticker-Texte ---------- */
const TX={
  pre:['Herzlich willkommen zum Spiel {h} gegen {a}!','Hallo und herzlich willkommen – heute treffen {h} und {a} aufeinander!','Es ist angerichtet: {h} empfängt {a}.'],
  kick:['Anpfiff! Schiedsrichter {ref} gibt die Partie frei.','Der Ball rollt! {ref} hat angepfiffen.','Los geht\'s! {ref} pfeift die Partie an.'],
  build:{
    cross:['{a} kommt auf dem Flügel durch und flankt in den Strafraum …','Hohe Hereingabe von {a} …','{a} bringt den Ball scharf vors Tor …','Flanke von {a} von der rechten Seite …','{a} zieht bis zur Grundlinie und flankt …'],
    head:['{p} steigt am höchsten …','{p} kommt mit dem Kopf an den Ball …','Kopfball {p} …'],
    through:['{a} spielt einen klugen Steckpass in die Schnittstelle …','Traumpass von {a} in den Lauf von {p} …','{a} chippt den Ball über die Abwehr – {p} ist durch …','Schneller Doppelpass zwischen {a} und {p} …'],
    counter:['Ballgewinn im Mittelfeld – {c} schaltet blitzschnell um!','Konter! {c} hat jede Menge Platz …','Umschaltmoment! {a} treibt den Ball nach vorne …','{c} kontert in Überzahl!'],
    long:['{p} fasst sich aus 25 Metern ein Herz …','{p} zieht aus der Distanz ab …','{p} hat Platz und versucht es von der Strafraumkante …','Direktabnahme von {p} aus 20 Metern …'],
    solo:['{p} tanzt zwei Gegenspieler aus …','{p} zieht von außen nach innen und …','{p} setzt sich im Eins-gegen-eins durch …','{p} dribbelt in den Strafraum …'],
    corner:['Ecke für {c}. {a} bringt sie herein …','Eckball von {a} – gefährlich an den ersten Pfosten …','{a} tritt die Ecke …'],
    fk:['Freistoß aus aussichtsreicher Position. {p} legt sich den Ball zurecht …','Gefährlicher Freistoß für {c} – {p} läuft an …'],
    box:['Gewühl im Strafraum – der Ball springt {p} vor die Füße …','{a} legt quer auf {p} …','Cut-back von {a} – {p} steht völlig frei …','{p} schaltet am schnellsten …']},
  pen:['ELFMETER für {c}! {d} bringt {p} im Strafraum zu Fall!','Der Schiedsrichter zeigt auf den Punkt – Elfmeter für {c}!'],
  penShoot:['{p} legt sich den Ball zurecht … Anlauf …','{p} tritt an … {gk} im Tor …'],
  goal:{
    head:['… und köpft wuchtig ein!','… per Kopf ins lange Eck!','… und nickt den Ball unhaltbar ein!'],
    long:['… und der Ball schlägt im Winkel ein!','… ein Strahl – unhaltbar unter die Latte!','… und der Ball senkt sich hinter {gk} ins Netz!'],
    pen:['… und verwandelt sicher!','… und schiebt eiskalt ins linke Eck!','… und hämmert den Ball unter die Latte!'],
    std:['… und schiebt eiskalt ein!','… flach ins Eck – keine Chance für {gk}!','… und der Ball zappelt im Netz!','… und vollendet souverän!','… und trifft ins kurze Eck!','… und lupft den Ball über {gk}!']},
  save:['… aber {gk} ist zur Stelle und pariert stark!','… {gk} taucht ab und lenkt den Ball um den Pfosten!','… zu zentral, {gk} hält sicher.','… Glanzparade von {gk}!','… {gk} reagiert blitzschnell mit dem Fuß!'],
  penSave:['… {gk} ahnt die Ecke und hält! Was für ein Moment!','… GEHALTEN! {gk} ist der Held!'],
  block:['… der Schuss wird im letzten Moment geblockt!','… {d} wirft sich dazwischen!','… hängen geblieben, {d} klärt.'],
  off:['… knapp am Pfosten vorbei!','… deutlich drüber.','… der Ball streicht über die Latte.','… vorbei! Da war mehr drin.','… am langen Eck vorbei.'],
  penOff:['… und setzt den Ball neben das Tor!','… drüber! Der Elfmeter ist verschossen!'],
  post:['… an den Pfosten! Riesenpech für {c}!','… an die Latte! Das Aluminium rettet!','… Pfosten! Der Ball springt zurück ins Feld!'],
  bigMiss:['Das muss das Tor sein!','Da hält das ganze Stadion den Atem an!','Die Riesenchance!','Unglaublich, dass der nicht drin ist!'],
  ctx:{lead:'{c} geht in Führung!',eq:'Der Ausgleich!',more:'{c} baut die Führung aus!',deci:'Ist das die Vorentscheidung?',anschl:'Der Anschlusstreffer! Jetzt wird es noch einmal spannend!',late:'In der Schlussphase! Das könnte der Siegtreffer sein!',lateEq:'Der späte Ausgleich! Was für eine Moral!',trick:'Hattrick für {p}!',brace:'Doppelpack für {p}!',turn:'Das Spiel ist gedreht!'},
  var:['Moment … der VAR schaut sich die Szene noch einmal an …','Check im Kölner Keller … äh, beim VAR …','Der Schiedsrichter fasst sich ans Ohr – VAR-Check läuft …'],
  varOk:['Das Tor zählt! Der Jubel kann weitergehen.','Kein Vergehen – Tor gegeben!'],
  foulY:['{p} kommt zu spät gegen {v} – Gelbe Karte!','Taktisches Foul von {p} an {v}. Dafür gibt es Gelb.','{p} reklamiert zu heftig und sieht Gelb.','Rüdes Einsteigen von {p} – zu Recht Gelb.'],
  foulGR:['{p} sieht die zweite Gelbe Karte – Gelb-Rot! {c} nur noch zu zehnt!','Gelb-Rot für {p}! Das ist bitter für {c}.'],
  foulR:['ROT! {p} grätscht {v} von hinten um – glatt Rot!','Platzverweis! Notbremse von {p} gegen {v} – Rot!'],
  foul:['Foul von {p} an {v}. Freistoß für {o}.','{p} hält {v} am Trikot fest – Freistoß.','{v} wird von {p} gelegt. Der Schiedsrichter lässt weiterspielen – Vorteil.','Zweikampf zwischen {p} und {v} – Foulpfiff.'],
  fkDanger:['Freistoß in gefährlicher Position für {o}!'],
  offside:['Abseits! {p} stand einen Schritt zu weit vorne.','Die Fahne geht hoch – {p} im Abseits.','{p} startet zu früh. Abseits.'],
  offGoal:['Der Ball ist im Tor – doch die Fahne ist oben! {p} stand im Abseits. Kein Tor!','{p} trifft – aber der VAR meldet sich: Abseits! Der Treffer zählt nicht.'],
  corner:['Ecke für {c} – die Hereingabe wird geklärt.','Eckball {c}. {d} köpft den Ball aus der Gefahrenzone.','Ecke für {c}, doch {gk} pflückt den Ball sicher herunter.'],
  injury:['{p} bleibt nach einem Zweikampf liegen … die Betreuer kommen aufs Feld.','{p} greift sich an den Oberschenkel und muss behandelt werden.'],
  injOut:['{p} kann nicht weitermachen.','Für {p} geht es nicht weiter.'],
  sub:['Wechsel bei {c}: {in} kommt für {out}.','{c} wechselt: {out} geht runter, {in} ist neu im Spiel.'],
  subAtt:['Offensiver Wechsel – {c} will hier noch etwas holen!','Der Trainer von {c} setzt alles auf eine Karte.'],
  subDef:['{c} will das Ergebnis über die Zeit bringen.','Defensiver Wechsel bei {c} – Sicherheit geht vor.'],
  subFresh:['Frische Beine für {c}.','{out} war sichtlich platt – gute Entscheidung.'],
  subLate:['Ein Wechsel kurz vor Schluss – das kostet noch etwas Zeit.'],
  hold:['{c} lässt den Ball in den eigenen Reihen laufen.','{c} kontrolliert das Geschehen im Mittelfeld.','Ruhige Phase. Beide Teams neutralisieren sich im Mittelfeld.','{c} sucht geduldig nach der Lücke.','Viel Ballbesitz für {c}, aber noch keine Durchschlagskraft.'],
  press:['{c} läuft früh an und stört den Spielaufbau von {o}.','Gegenpressing von {c} – {o} kommt kaum zur Ruhe.','{c} attackiert hoch und zwingt {o} zu langen Bällen.'],
  deep:['{c} steht tief und lauert auf Konter.','{c} verteidigt kompakt mit zwei Viererketten.','{o} findet kaum ein Durchkommen gegen das Bollwerk von {c}.'],
  fans:['Die Fans von {c} sind lautstark zu hören.','Die Kurve von {c} peitscht ihr Team nach vorne.','Tolle Atmosphäre hier im Stadion!','Pfiffe von den Rängen – das Publikum will mehr sehen.'],
  push:['{c} drückt jetzt mächtig auf das nächste Tor!','Da braut sich was zusammen – {c} spielt sich fest!','{c} hat jetzt die Kontrolle übernommen.'],
  late:['Noch {n} Minuten! {c} wirft alles nach vorne.','Die Schlussphase läuft – {c} drängt auf den Ausgleich!','{c} rennt an, {o} verteidigt mit Mann und Maus.'],
  lateDraw:['Noch {n} Minuten – wer setzt den Lucky Punch?','Alles offen in der Schlussphase!','Die Zuschauer stehen – jeder Angriff könnte jetzt entscheiden.'],
  lateLead:['{c} spielt die Zeit herunter.','{c} verteidigt die Führung leidenschaftlich.'],
  stop1:['Nachspielzeit in Halbzeit eins: +{n}.','Es gibt {n} Minute(n) Nachschlag.'],
  stop1z:['Keine Nachspielzeit – gleich ist Pause.'],
  stop2:['Die Tafel geht hoch: {n} Minuten Nachspielzeit!','Vierter Offizieller zeigt +{n} an.'],
  ht:['Halbzeit! Pausenstand {s}.','Pausenpfiff – es steht {s}.'],
  ht2:['Weiter geht\'s! Die zweite Halbzeit läuft.','Der Ball rollt wieder – Halbzeit zwei!'],
  ft:['Abpfiff! {txt}','Schluss, aus, vorbei! {txt}']
};

/* ---------- Ereignisse ---------- */
function evPush(M,o){if(!M.detail)return;const res=M.res;o.t=M.t;o.m=M.m;o.x=M.x;o.ph=M.ph;o.sc=res.hg+':'+res.ag;res.ev.push(o);if(!o.hid)M.lastVis=M.t;return o}
function names(M,side){return {c:M.c[side].short,o:M.c[OTHER[side]].short,cn:M.c[side].name}}
function psAdd(M,p,k,v){const r=M.res.ps[p.id]||(M.res.ps[p.id]={});r[k]=(r[k]||0)+v}

/* ---------- Hauptfunktion ---------- */
function simMatch(hc,ac,detail,neutral){
  prepareAI(hc,ac);prepareAI(ac,hc);
  const R=matchRates(hc,ac,neutral);
  const pH=clamp(R.pH+gauss()*.03,.22,.78);
  const res={hg:0,ag:0,ev:[],poss:Math.round(pH*100),sh:0,sa:0,et:false,pen:null,
    ts:{h:mts0(),a:mts0()},xi:{h:hc.lineup.slice(),a:ac.lineup.slice()},bench:{h:benchOf(hc,9).map(p=>p.id),a:benchOf(ac,9).map(p=>p.id)},
    subs:[],reds:[],yel:{},ps:{},min:{},s1:ri(0,2)+(rnd()<.35?1:0),s2:ri(2,6),neutral:!!neutral,home:hc.id,away:ac.id,
    ref:detail?refName(hc):'',att:detail?(neutral?Math.round(hc.stadium*.9):(hc.lastAtt||Math.round(hc.stadium*.85))):0};
  const M={R,res,detail,c:{h:hc,a:ac},pH,t:0,m:0,x:0,ph:1,lastVis:0,atk:{h:1,a:1},cv:{h:1,a:1},used:{h:new Set(),a:new Set()},subsLeft:{h:5,a:5},windows:{h:0,a:0},
    plan:{h:planSubs(),a:planSubs()},iv:{},recent:[],goalsBy:{},behind:{h:false,a:false}};
  res.M=M;
  for(const s of SIDES)res.xi[s].forEach((id,i)=>{if(id)M.iv[id]={side:s,from:0,to:null}});
  // Foul-, Abseits- und Verletzungsraten
  M.fr={},M.or={},M.ir={};
  for(const s of SIDES){const c=M.c[s],o=M.c[OTHER[s]],t=c.tactic,td=t.td||{},ot=o.tactic,otd=ot.td||{};
    const xi=onPitch(c).map(x=>x.p);const hot=xi.length?xi.reduce((a,p)=>a+at(p,'agg')+(21-at(p,'tmp')),0)/xi.length/21:1;
    M.fr[s]=11*hot*(td.tackle==='hard'?1.25:td.tackle==='soft'?.78:1)*(t.press==='hoch'?1.1:t.press==='niedrig'?.9:1)/95;
    M.or[s]=1.9*(otd.line==='high'?1.45:otd.line==='low'?.65:1)*(otd.trap==='on'?1.35:1)*(t.style==='konter'?1.2:1)/95;
    const inj=xi.length?xi.reduce((a,p)=>a+at(p,'inp'),0)/xi.length:10;M.ir[s]=.11*(.6+inj/25)/95;
    M.cardF=M.cardF||{};M.cardF[s]=td.tackle==='hard'?1.45:td.tackle==='soft'?.6:1;
  }
  if(detail){const h=hc.name,a=ac.name;M.t=0;M.m=0;
    evPush(M,{side:'h',type:'info',k:'pre',lines:[T(TX.pre,{h,a}),`${neutral?'Neutraler Platz':'Stadion von '+esc(hc.name)} · ${res.att.toLocaleString('de-DE')} Zuschauer · Schiedsrichter ${res.ref}`,T(TX.kick,{ref:res.ref})]})}
  runHalf(M,1);runHalf(M,2);
  res.t90=M.t;res.end=M.t+1;
  finishRegular(M,hc,ac);
  return res;
}
function planSubs(){
  // Wechselfenster wie in der Realität: meist 2–3 Unterbrechungen nach der Pause
  const w=[];if(rnd()<.13)w.push({m:46,n:1});
  w.push({m:ri(56,67),n:rnd()<.55?2:1});w.push({m:ri(68,79),n:rnd()<.5?2:1});if(rnd()<.6)w.push({m:ri(80,88),n:1});
  return w;
}
function runHalf(M,h){
  const res=M.res,len=45+(h===1?res.s1:res.s2),base=h===1?0:45;M.ph=h;
  for(let k=1;k<=len;k++){
    M.t++;M.m=Math.min(base+k,base+45);M.x=Math.max(0,base+k-(base+45));
    if(h===2&&k===1&&M.detail)evPush(M,{side:'h',type:'info',k:'ht2',lines:[pick(TX.ht2)]});
    minute(M);
    if(k===45&&M.detail){const n=h===1?res.s1:res.s2;evPush(M,{side:'h',type:'info',k:'stop',lines:[n?T(h===1?TX.stop1:TX.stop2,{n}):pick(TX.stop1z)]})}
  }
  if(M.detail){const s=res.hg+':'+res.ag;
    if(h===1)evPush(M,{side:'h',type:'whistle',k:'ht',lines:[T(TX.ht,{s})]});
    else{const hc=M.c.h,ac=M.c.a;const txt=res.hg>res.ag?`${hc.name} gewinnt ${s}.`:res.hg<res.ag?`${ac.name} gewinnt ${res.ag}:${res.hg} auswärts.`:`Unentschieden, ${s}.`;
      evPush(M,{side:'h',type:'whistle',k:'ft',lines:[T(TX.ft,{txt})]})}
  }
}
function minute(M){
  const res=M.res;
  if(M.ph===2&&M.x===0)for(const s of SIDES){const w=M.plan[s].find(w=>w.m===M.m&&!w.done);if(w){w.done=true;doSubs(M,s,w.n,'plan')}}
  for(const s of SIDES){
    const o=OTHER[s];
    const rate=(s==='h'?M.R.rH:M.R.rA)*RATE_ADJ*M.atk[s];
    if(rnd()<rate)shot(M,s);
    if(rnd()<M.fr[s])foul(M,s);
    if(rnd()<M.or[s])offside(M,s);
    if(rnd()<.021*(s==='h'?M.pH:1-M.pH)*2)corner(M,s,false);
    if(rnd()<M.ir[s])injury(M,s);
  }
  if(M.detail)filler(M);
}

/* ---------- Torschuss ---------- */
function shotKind(c,p,a,q,pos){
  const ti=c.tactic.ti||{};const r=rnd();
  if(q<.05&&r<.7)return 'long';
  if(a&&(GROUP[a.pos]==='ABW'&&a.pos==='AV'||a.pos==='FL')&&r<.45+(ti.focus==='wings'?.15:0)+(ti.cross==='high'?.1:0))return at(p,'hea')>=11&&rnd()<.7?'head':'box';
  if(r<.12)return 'corner';
  if(r<.17&&q<.12)return 'fk';
  if(c.tactic.style==='konter'&&r<.4||ti.counter==='go'&&r<.3)return 'counter';
  if(q>=.22&&a)return 'through';
  if(at(p,'dri')>=13&&r<.55)return 'solo';
  return a?'box':'solo';
}
function shot(M,side){
  const res=M.res,c=M.c[side],o=OTHER[side],oc=M.c[o],TS=res.ts[side],TO=res.ts[o];
  const conv=(side==='h'?M.R.cH:M.R.cA)*M.cv[side];
  const p=pickScorer(c)||(onPitch(c)[0]||{}).p;if(!p)return;
  let q=clamp(conv*Math.exp(gauss()*1.1-.605),.012,.88),kind=null;
  if(q>.5&&rnd()<.42){kind='pen';q=.76}
  const a=kind==='pen'?null:(rnd()<.72?pickAssist(c,p):null);
  if(!kind)kind=shotKind(c,p,a,q);
  const gk=keeperOf(oc);
  const goal=rnd()<q;
  side==='h'?res.sh++:res.sa++;TS.sh++;TS.xg+=q;if(q>=.25)TS.bc++;
  psAdd(M,p,'sh',1);psAdd(M,p,'xg',q);if(q>=.25)psAdd(M,p,'bc',1);if(a){psAdd(M,a,'kp',1);psAdd(M,a,'xa',q)}
  let out;const d={sh:1,xg:q,bc:q>=.25?1:0};
  if(goal){
    out='goal';TS.sot++;d.sot=1;side==='h'?res.hg++:res.ag++;p.goals++;mst(res,p).g++;psAdd(M,p,'sot',1);psAdd(M,p,'g',1);
    if(a){a.ast=(a.ast||0)+1;mst(res,a).a++;psAdd(M,a,'a',1)}
    if(gk)psAdd(M,gk,'ga',1);
    M.goalsBy[p.id]=(M.goalsBy[p.id]||0)+1;if(res.hg<res.ag)M.behind.h=true;if(res.ag<res.hg)M.behind.a=true;
  }else{
    const r=rnd();
    out=kind==='pen'?(r<.55?'save':r<.88?'off':'post'):(r<.36?'save':r<.62?'block':r<.95?'off':'post');
    if(out==='save'){TS.sot++;d.sot=1;psAdd(M,p,'sot',1);if(gk){psAdd(M,gk,'sav',1);TO.sav++}}
  }
  M.recent.push({t:M.t,side,q});
  if(M.detail)shotEvent(M,side,p,a,gk,kind,q,out,d);
  if(!goal&&((out==='save'&&rnd()<.35)||(out==='block'&&rnd()<.45)))corner(M,side,true);
  if(kind==='pen'){const df=wpick(onPitch(oc).filter(x=>x.pos!=='TW'),x=>x.pos==='IV'||x.pos==='AV'?3:1);if(df){TO.fls++;psAdd(M,df.p,'fls',1)}}
}
function goalContext(M,side,p){
  const res=M.res,g=side==='h'?res.hg:res.ag,o=side==='h'?res.ag:res.hg,n=names(M,side),before=g-1;
  const out=[];const late=M.ph>=2&&M.m>=85;
  if(M.goalsBy[p.id]===3)out.push(T([TX.ctx.trick],{p:pn(p)}));else if(M.goalsBy[p.id]===2)out.push(T([TX.ctx.brace],{p:pn(p)}));
  if(g===o)out.push(late?TX.ctx.lateEq:TX.ctx.eq);
  else if(g===o+1&&before===o)out.push(M.behind[side]?TX.ctx.turn:late?TX.ctx.late:T([TX.ctx.lead],{c:n.c}));
  else if(g>o+1)out.push(g-o===2&&M.ph>=2&&M.m>=70?TX.ctx.deci:T([TX.ctx.more],{c:n.c}));
  else if(g===o-1)out.push(TX.ctx.anschl);
  return out.join(' ');
}
function shotEvent(M,side,p,a,gk,kind,q,out,d){
  const n=names(M,side),oc=M.c[OTHER[side]];
  const df=onPitch(oc).filter(x=>x.pos==='IV'||x.pos==='AV'||x.pos==='DM');const dd=df.length?pick(df).p:null;
  const tk=a||(onPitch(M.c[side]).filter(x=>x.p!==p).sort((x,y)=>at(y.p,'cor')-at(x.p,'cor'))[0]||{}).p;
  const v={p:pn(p),a:pn(tk),c:n.c,o:n.o,gk:pn(gk),d:pn(dd)};
  const lines=[];
  if(kind==='pen'){lines.push(T(TX.pen,v));lines.push(T(TX.penShoot,v))}
  else{
    const b=TX.build;
    if(kind==='head'){lines.push(T(a?b.cross:b.corner,v));lines.push(T(b.head,v))}
    else if(kind==='corner'){lines.push(T(b.corner,v));lines.push(T(b.head,v))}
    else if(kind==='counter'){lines.push(T(b.counter,{...v,a:a?pn(a):pn(p)}));lines.push(`${pn(p)} kommt zum Abschluss …`)}
    else if(kind==='through'||kind==='box'){lines.push(T(kind==='through'?b.through:b.box,v));if(q>=.25)lines.push(`${pn(p)} allein vor ${pn(gk)} …`)}
    else lines.push(T(b[kind]||b.solo,v));
  }
  let k='chance',big=false;
  if(out==='goal'){
    const g=TX.goal[kind==='head'||kind==='corner'?'head':kind==='long'||kind==='fk'?'long':kind==='pen'?'pen':'std'];
    lines.push(T(g,v));
    const ctx=goalContext(M,side,p);
    lines.push(`TOOOR für ${M.c[side].name}! ${pn(p)} trifft zum ${M.res.hg}:${M.res.ag}!${a?` Vorlage: ${pn(a)}.`:''}${ctx?' '+ctx:''}`);
    k='goal';big=true;
  }else{
    const pool=kind==='pen'?(out==='save'?TX.penSave:out==='post'?TX.post:TX.penOff):TX[out];
    lines.push(T(pool,v));if(q>=.3&&out!=='block')lines.push(pick(TX.bigMiss));
    big=q>=.3||kind==='pen';
    if(!big&&q<.06&&out==='block'&&rnd()<.5){evPush(M,{side,type:'shot',hid:true,d});return}
  }
  const e=evPush(M,{side,type:k==='goal'?'goal':'chance',kind,out,lines,big,xg:Math.round(q*100)/100,pid:p.id,aid:a?a.id:null,d});
  if(k==='goal'){e.gl=lines.length-2;
    if(rnd()<.12){evPush(M,{side,type:'info',k:'var',lines:[pick(TX.var),pick(TX.varOk)]})}}
}

/* ---------- Standards, Fouls, Abseits ---------- */
function corner(M,side,fromShot){
  const res=M.res;res.ts[side].cor++;
  if(!M.detail)return;
  if(fromShot){evPush(M,{side,type:'stat',hid:true,d:{cor:1}});return}
  const oc=M.c[OTHER[side]],gk=keeperOf(oc),df=onPitch(oc).filter(x=>x.pos==='IV');
  if(rnd()<.4)evPush(M,{side,type:'corner',lines:[T(TX.corner,{c:M.c[side].short,d:df.length?pn(pick(df).p):'die Abwehr',gk:pn(gk)})],d:{cor:1}});
  else evPush(M,{side,type:'stat',hid:true,d:{cor:1}});
}
const FOULW={TW:.05,IV:1.4,AV:1.1,DM:1.5,ZM:1,OM:.7,FL:.7,ST:.8};
function foul(M,side){
  const res=M.res,c=M.c[side],o=OTHER[side],oc=M.c[o];res.ts[side].fls++;
  const xs=onPitch(c);if(!xs.length)return;
  const x=wpick(xs,x=>FOULW[x.pos]*(at(x.p,'agg')+(21-at(x.p,'tmp'))));const p=x.p;psAdd(M,p,'fls',1);
  const vs=onPitch(oc);const v=vs.length?wpick(vs,y=>y.pos==='ST'||y.pos==='FL'||y.pos==='OM'?2:1).p:null;
  const pc=.105*(at(p,'agg')+(21-at(p,'tmp')))/21*M.cardF[side];
  const d={fls:1};let type='foul',lines=null;const nv={p:pn(p),v:pn(v),c:c.short,o:oc.short};
  if(rnd()<.0035){d.rc=1;type='red';lines=[T(TX.foulR,nv)];sendOff(M,side,p,x.i)}
  else if(rnd()<pc){
    if(res.yel[p.id]){d.rc=1;d.yc=1;type='red';lines=[T(TX.foulGR,nv)];sendOff(M,side,p,x.i)}
    else{res.yel[p.id]=1;d.yc=1;type='card';res.ts[side].yc++;p.yc=(p.yc||0)+1;mst(res,p).y=1;lines=[T(TX.foulY,nv)]}
  }
  if(!M.detail)return;
  if(lines)evPush(M,{side,type,lines,pid:p.id,d});
  else if(rnd()<.2)evPush(M,{side,type:'foul',lines:[T(TX.foul,nv)].concat(rnd()<.25?[T(TX.fkDanger,nv)]:[]),d});
  else evPush(M,{side,type:'stat',hid:true,d});
}
function sendOff(M,side,p,i){
  const res=M.res,c=M.c[side];res.ts[side].rc++;res.reds.push({t:M.t,side,id:p.id});
  const sx=sxOf(p);sx[SXI.rc]++;
  c.lineup[i]=null;if(M.iv[p.id])M.iv[p.id].to=M.t;
  M.atk[side]*=.74;M.atk[OTHER[side]]*=1.16;M.cv[OTHER[side]]*=1.06;
}
function offside(M,side){
  const res=M.res,c=M.c[side];res.ts[side].off++;
  if(!M.detail)return;
  const xs=onPitch(c).filter(x=>x.pos==='ST'||x.pos==='FL'||x.pos==='OM');const p=xs.length?pick(xs).p:null;
  if(p&&rnd()<.07)evPush(M,{side,type:'offgoal',lines:[`${pn(p)} wird in die Tiefe geschickt …`,T(TX.offGoal,{p:pn(p)})],big:true,d:{off:1}});
  else if(p&&rnd()<.35)evPush(M,{side,type:'offside',lines:[T(TX.offside,{p:pn(p)})],d:{off:1}});
  else evPush(M,{side,type:'stat',hid:true,d:{off:1}});
}
function injury(M,side){
  const c=M.c[side],xs=onPitch(c);if(!xs.length)return;
  const x=wpick(xs,x=>Math.pow(at(x.p,'inp'),1.5)*(1.3-at(x.p,'nat')/40));const p=x.p;if(p.inj>0)return;
  p.inj=ri(1,5);
  if(M.detail)evPush(M,{side,type:'injury',lines:[T(TX.injury,{p:pn(p)}),T(TX.injOut,{p:pn(p)})+` (Ausfall ca. ${p.inj} ${p.inj===1?'Woche':'Wochen'})`],pid:p.id});
  if(!doSubs(M,side,1,'inj',x.i)){c.lineup[x.i]=null;if(M.iv[p.id])M.iv[p.id].to=M.t;M.atk[side]*=.85}
}

/* ---------- Wechsel ---------- */
function doSubs(M,side,n,why,forceSlot){
  const res=M.res,c=M.c[side];let done=0;
  if(M.subsLeft[side]<=0)return 0;
  const sl=slotsOf(c),g=side==='h'?res.hg:res.ag,o=side==='h'?res.ag:res.hg;
  for(let k=0;k<n&&M.subsLeft[side]>0;k++){
    let i=forceSlot;
    if(i===undefined){
      const cand=c.lineup.map((id,j)=>({id,j})).filter(x=>x.id&&sl[x.j]!=='TW'&&!M.used[side].has(x.id));
      if(!cand.length)break;
      const pick1=wpick(cand,x=>{const p=S.players[x.id];return 1+Math.max(0,110-p.fit)/14+(21-at(p,'sta'))/5+(res.yel[x.id]?4:0)+(GROUP[sl[x.j]]==='ANG'?1.6:0)+(M.goalsBy[x.id]?-0.6:0)});
      i=pick1.j;
    }
    const outId=c.lineup[i];if(!outId)break;const pos=sl[i];
    const benchP=res.bench[side].map(id=>S.players[id]).filter(p=>p&&!M.used[side].has(p.id)&&p.inj===0&&p.club===c.id&&!M.iv[p.id]);
    if(!benchP.length)break;
    const trailing=g<o,leading=g>o,late=M.ph===2&&M.m>=65;
    const score=q=>{let v=rateAt(q,pos)*(.8+.2*q.fit/100);if(q.pos==='TW'&&pos!=='TW')v-=60;if(pos==='TW'&&q.pos!=='TW')v-=60;
      if(late&&trailing&&GROUP[q.pos]==='ANG')v+=6;if(late&&leading&&(GROUP[q.pos]==='ABW'||q.pos==='DM'))v+=5;return v};
    const inP=benchP.sort((a,b)=>score(b)-score(a))[0];
    c.lineup[i]=inP.id;M.used[side].add(inP.id);M.used[side].add(outId);M.subsLeft[side]--;done++;
    if(M.iv[outId])M.iv[outId].to=M.t;M.iv[inP.id]={side,from:M.t,to:null,sub:true};
    res.subs.push({t:M.t,m:M.m,x:M.x,side,out:outId,in:inP.id,slot:i});
    if(M.detail){const op=S.players[outId],v={c:c.short,in:pn(inP),out:pn(op)};
      const extra=why==='inj'?'':late&&trailing&&GROUP[inP.pos]==='ANG'?T(TX.subAtt,v):late&&leading&&(GROUP[inP.pos]==='ABW'||inP.pos==='DM')?T(TX.subDef,v):M.x>0?pick(TX.subLate):rnd()<.35?T(TX.subFresh,v):'';
      evPush(M,{side,type:'sub',lines:[T(TX.sub,v)+(extra?' '+extra:'')],pin:inP.id,pout:outId})}
    forceSlot=undefined;
  }
  return done;
}

/* ---------- Atmosphäre & Spannung ---------- */
function filler(M){
  const res=M.res;if(M.t-M.lastVis<4||rnd()>.3)return;
  const rec=M.recent.filter(r=>r.t>M.t-10);const xh=rec.filter(r=>r.side==='h').reduce((a,r)=>a+r.q,0),xa=rec.filter(r=>r.side==='a').reduce((a,r)=>a+r.q,0);
  const late=M.ph===2&&M.m>=78,diff=res.hg-res.ag,n=Math.max(1,90-M.m);
  let side,txt;
  if(late&&Math.abs(diff)<=1){
    if(diff===0){side='h';txt=T(TX.lateDraw,{n})}
    else{const lose=diff>0?'a':'h';side=rnd()<.7?lose:OTHER[lose];txt=side===lose?T(TX.late,{n,c:M.c[lose].short,o:M.c[OTHER[lose]].short}):T(TX.lateLead,{c:M.c[side].short})}
  }else if(Math.abs(xh-xa)>.45){side=xh>xa?'h':'a';txt=T(TX.push,{c:M.c[side].short})}
  else{
    side=rnd()<M.pH?'h':'a';const c=M.c[side],o=M.c[OTHER[side]],v={c:c.short,o:o.short};const r=rnd();
    if(r<.25)txt=T(TX.fans,v);
    else if(c.tactic.press==='hoch'&&r<.55)txt=T(TX.press,v);
    else if((c.tactic.men==='defensiv'||c.tactic.style==='konter')&&r<.6)txt=T(TX.deep,v);
    else txt=T(TX.hold,v);
  }
  evPush(M,{side,type:'info',k:'fill',lines:[txt]});
}

/* ---------- Abschluss: Pässe, Zweikämpfe, Minuten, Noten ---------- */
const PASSW={TW:.5,IV:1.3,AV:1.1,DM:1.55,ZM:1.5,OM:1.1,FL:.85,ST:.55};
const TCKW={TW:0,IV:1.25,AV:1.1,DM:1.5,ZM:1,OM:.5,FL:.5,ST:.3};
const INTW={TW:.1,IV:1.5,AV:1,DM:1.4,ZM:.8,OM:.4,FL:.35,ST:.2};
const DRBW={TW:0,IV:.1,AV:.6,DM:.3,ZM:.6,OM:1.2,FL:1.6,ST:1};
function spread(list,total,wf){const ws=list.map(wf),tot=ws.reduce((a,b)=>a+b,0)||1;return ws.map(w=>total*w/tot)}
function periodStats(M,from,to,frac){
  // verteilt Pässe/Zweikämpfe für den Zeitraum auf die Spieler, die auf dem Platz standen
  const res=M.res;
  for(const s of SIDES){
    const c=M.c[s],t=c.tactic,ti=t.ti||{},share=s==='h'?M.pH:1-M.pH,TS=res.ts[s];
    const sl=slotsOf(c);
    const on=Object.entries(M.iv).filter(([id,v])=>v.side===s).map(([id,v])=>{const p=S.players[id];const a=Math.max(from,v.from),b=Math.min(to,v.to===null?to:v.to);return {p,w:Math.max(0,b-a)/(to-from),pos:v.slot!==undefined?sl[v.slot]:posOfPlayer(M,s,id)}}).filter(x=>x.p&&x.w>0);
    if(!on.length)continue;
    const styleF=(t.style==='ballbesitz'?1.12:t.style==='konter'?.86:1)*(ti.build==='short'?1.06:ti.build==='long'?.88:1)*(ti.tempo==='low'?1.05:ti.tempo==='high'?.95:1);
    const P=Math.round((250+560*share)*styleF*(.92+rnd()*.16)*frac);
    const avgPas=on.reduce((a,x)=>a+(at(x.p,'pas')+at(x.p,'tec')+at(x.p,'fir'))/3*x.w,0)/on.reduce((a,x)=>a+x.w,0);
    const comp=clamp(.74+(avgPas-11)*.014+(share-.5)*.16+(ti.risk==='safe'?.03:ti.risk==='risky'?-.04:0)+(ti.build==='long'?-.05:ti.build==='short'?.02:0),.6,.93);
    const ps=spread(on,P,x=>PASSW[x.pos]*x.w*(at(x.p,'pas')+at(x.p,'vis'))/24);
    on.forEach((x,i)=>{const n=Math.round(ps[i]);const pc=Math.round(n*clamp(comp+(at(x.p,'pas')-12)*.01+gauss()*.03+(x.pos==='ST'?-.06:x.pos==='TW'?-.08:0),.4,.98));psAdd(M,x.p,'pas',n);psAdd(M,x.p,'pcm',pc);TS.pas+=n;TS.pcm+=pc});
    const pr=t.press==='hoch'?1.18:t.press==='niedrig'?.86:1;
    const Tk=(10+12*(1-share))*pr*(.85+rnd()*.3)*frac,In=(6+9*(1-share))*(.85+rnd()*.3)*frac,Dr=(5+9*share)*(.8+rnd()*.4)*frac;
    const tk=spread(on,Tk,x=>TCKW[x.pos]*x.w*(at(x.p,'tck')+at(x.p,'wor')/2)/15),it=spread(on,In,x=>INTW[x.pos]*x.w*(at(x.p,'ant')+at(x.p,'pos'))/22),dr=spread(on,Dr,x=>DRBW[x.pos]*x.w*Math.pow(at(x.p,'dri')/12,2));
    on.forEach((x,i)=>{const a=Math.round(tk[i]+gauss()*.4*Math.sqrt(tk[i])),b=Math.round(it[i]+gauss()*.4*Math.sqrt(it[i])),d=Math.round(dr[i]+gauss()*.4*Math.sqrt(dr[i]));
      if(a>0){psAdd(M,x.p,'tck',a);TS.tck+=a}if(b>0){psAdd(M,x.p,'int',b);TS.int+=b}if(d>0){psAdd(M,x.p,'drb',d);TS.drb+=d}});
  }
}
function posOfPlayer(M,s,id){const c=M.c[s],sl=slotsOf(c);let i=M.res.xi[s].indexOf(id);if(i<0){const sub=M.res.subs.find(x=>x.in===id);i=sub?sub.slot:0}return sl[i]}
function finishRegular(M,hc,ac){
  const res=M.res;
  for(const [id,v] of Object.entries(M.iv))v.slot=res.xi[v.side].indexOf(id)>=0?res.xi[v.side].indexOf(id):(res.subs.find(x=>x.in===id)||{}).slot;
  periodStats(M,0,M.t,1);
  M.cur={h:hc.lineup.slice(),a:ac.lineup.slice()};
  // Minuten
  const t90=M.t;
  for(const [id,v] of Object.entries(M.iv)){const to=v.to===null?t90:v.to;res.min[id]=Math.max(1,Math.round((to-v.from)*90/t90))}
  // Startelf wiederherstellen
  hc.lineup=res.xi.h.slice();ac.lineup=res.xi.a.slice();
  for(const [c,gf,ga,s] of [[hc,res.hg,res.ag,'h'],[ac,res.ag,res.hg,'a']]){
    const loss=(c.tactic.press==='hoch'?14:c.tactic.press==='niedrig'?8:11)*(c.tactic.ti&&c.tactic.ti.tempo==='high'?1.1:c.tactic.ti&&c.tactic.ti.tempo==='low'?.92:1)*(c.tactic.td&&c.tactic.td.trans==='press'?1.06:1);
    const sl=slotsOf(c),avg=clubAvg(c)||50;
    for(const [id,v] of Object.entries(M.iv)){if(v.side!==s)continue;const p=S.players[id];if(!p)continue;
      const mins=res.min[id],fr=Math.min(1,mins/90);
      p.apps++;if(v.sub)sxOf(p)[SXI.sub]++;
      p.fit=clamp(p.fit-loss*fr*(1.3-at(p,'sta')/40)-rnd()*3*fr,30,100);p.mor=clamp(p.mor+(gf>ga?5:gf<ga?-5:0)*(v.sub?.6:1),15,100);
      const pos=sl[v.slot!==undefined?v.slot:0],x=(res.st&&res.st[id])||{g:0,a:0,y:0},ps=res.ps[id]||{},def=pos==='TW'||pos==='IV'||pos==='AV'||pos==='DM';
      if(pos==='TW'&&ga===0&&!v.sub&&v.to===null)p.cs=(p.cs||0)+1;
      let r=6.45+clamp((gf-ga)*.18,-.6,.6)+x.g*.95+x.a*.5-x.y*.3+(ga===0&&def?(pos==='TW'?.55:.3):0)-(def?Math.max(0,ga-1)*(pos==='TW'?.25:.12):0)+((rateAt(p,pos)||ovr(p))-avg)*.025+gauss()*.38;
      r+=.12*((ps.kp||0)-.6)+.04*((ps.tck||0)+(ps.int||0)-3)*(def?1:.6)+.03*((ps.drb||0)-1)+(pos==='TW'?.1*((ps.sav||0)-2.5):0)+(ps.pas>=12?((ps.pcm||0)/ps.pas-.8)*.8:0)-.04*(ps.fls||0)+.05*((ps.sot||0)-(x.g||0));
      if(res.reds.some(z=>z.id===id))r-=1.2;
      if(v.sub)r=6.45+(r-6.45)*clamp(mins/60,.25,1);
      r=clamp(Math.round(r*10)/10,3.5,10);p.rs=(p.rs||0)+Math.round(r*10);p.rn=(p.rn||0)+1;if(p.ao)aoTick(p);
      res.rt=res.rt||{};res.rt[id]=r;
    }
    matchBonuses(c,res,ga);
  }
  commitPlayerStats(M,res.min);
}
function commitPlayerStats(M,mins){
  const res=M.res;
  for(const [id,v] of Object.entries(M.iv)){const p=S.players[id];if(!p)continue;const a=sxOf(p),ps=res.ps[id]||{};
    a[SXI.min]+=mins[id]||0;for(const k of ['sh','sot','kp','pas','pcm','tck','int','drb','fls','sav','bc','ga'])a[SXI[k]]+=ps[k]||0;
    a[SXI.xg]+=Math.round((ps.xg||0)*100);a[SXI.xa]+=Math.round((ps.xa||0)*100)}
  res.ps0=JSON.parse(JSON.stringify(res.ps));
}

/* ---------- Verlängerung ---------- */
function extraTime(hc,ac,res,detail,neutral){
  const M=res.M;M.detail=detail;
  hc.lineup=M.cur.h.slice();ac.lineup=M.cur.a.slice();
  M.R.rH*=.9;M.R.rA*=.9;
  const t0=M.t;res.e1=ri(0,2);res.e2=ri(1,3);
  if(detail){const ft=res.ev.find(e=>e.k==='ft');if(ft)ft.lines=[`Ende der regulären Spielzeit – ${res.hg}:${res.ag}. Es gibt keinen Sieger!`];evPush(M,{side:'h',type:'whistle',k:'et',lines:['Verlängerung! Es geht in die 30 Zusatzminuten.']})}
  for(const [h,len,base] of [[3,15+res.e1,90],[4,15+res.e2,105]]){M.ph=h;
    if(h===4&&detail){M.t++;M.m=106;M.x=0;evPush(M,{side:'h',type:'info',k:'ht2',lines:['Seitenwechsel – die zweite Hälfte der Verlängerung läuft.']});M.t--}
    for(let k=1;k<=len;k++){M.t++;M.m=Math.min(base+k,base+15);M.x=Math.max(0,base+k-(base+15));
      if(h===4&&k===1&&M.x===0){for(const s of SIDES)if(M.subsLeft[s]>0&&rnd()<.6)doSubs(M,s,1,'plan')}
      minute(M)}
    if(detail&&h===3)evPush(M,{side:'h',type:'whistle',k:'et1',lines:[`Halbzeit in der Verlängerung. Es steht ${res.hg}:${res.ag}.`]});
  }
  if(detail)evPush(M,{side:'h',type:'whistle',k:'et2',lines:[`Ende der Verlängerung: ${res.hg}:${res.ag}.`]});
  // Statistik für die Verlängerung
  const before=JSON.parse(JSON.stringify(res.ps));for(const id in res.ps0)for(const k in res.ps0[id])before[id][k]-=res.ps0[id][k];
  for(const [id,v] of Object.entries(M.iv)){if(v.slot===undefined)v.slot=(res.subs.find(x=>x.in===id)||{}).slot}
  const saved=res.ps;res.ps={};periodStats(M,t0,M.t,.33);
  const etMins={};for(const [id,v] of Object.entries(M.iv)){const a=Math.max(t0,v.from),b=v.to===null?M.t:Math.min(M.t,v.to);if(b>a)etMins[id]=Math.round((b-a)*30/(M.t-t0))}
  for(const id in before){res.ps[id]=res.ps[id]||{};for(const k in before[id])res.ps[id][k]=(res.ps[id][k]||0)+before[id][k]}
  const etPs=res.ps;res.ps=saved;
  // in res.ps (Spielansicht) die Verlängerung ergänzen
  for(const id in etPs){const r=res.ps[id]||(res.ps[id]={});for(const k in etPs[id]){if(!(k in (before[id]||{})))r[k]=(r[k]||0)+etPs[id][k]}}
  for(const id in etMins){res.min[id]=(res.min[id]||0)+etMins[id];const p=S.players[id];if(!p)continue;const a=sxOf(p),ps=etPs[id]||{};a[SXI.min]+=etMins[id];for(const k of ['sh','sot','kp','pas','pcm','tck','int','drb','fls','sav','bc','ga'])a[SXI[k]]+=ps[k]||0;a[SXI.xg]+=Math.round((ps.xg||0)*100);a[SXI.xa]+=Math.round((ps.xa||0)*100);p.fit=clamp(p.fit-5,30,100)}
  M.cur={h:hc.lineup.slice(),a:ac.lineup.slice()};
  hc.lineup=res.xi.h.slice();ac.lineup=res.xi.a.slice();
  res.et=true;res.t120=M.t;res.end=M.t+1;
}

/* ---------- Elfmeterschießen ---------- */
function shootout(hc,ac,res,detail){
  const M=res.M;const cur=M&&M.cur?M.cur:{h:hc.lineup,a:ac.lineup};
  const kickers=s=>{const ids=cur[s].filter(Boolean).map(id=>S.players[id]).filter(p=>p&&p.pos!=='TW');ids.sort((a,b)=>(at(b,'pen')*2+at(b,'cmp'))-(at(a,'pen')*2+at(a,'cmp')));return ids.length?ids:[null]};
  const keeperP=s=>{const c=s==='h'?hc:ac;const sl=slotsOf(c);const id=cur[s][sl.indexOf('TW')>=0?sl.indexOf('TW'):0];return id?S.players[id]:null};
  const kv=p=>p?(at(p,'ref')+at(p,'ovo'))*2.5:50;
  const kh=kickers('h'),ka=kickers('a'),gkh=keeperP('h'),gka=keeperP('a'),gh=kv(gkh),ga=kv(gka);
  const prob=(p,gk)=>clamp(.76+((p?(at(p,'pen')*.6+at(p,'cmp')*.4)*5:55)-62)/190-(gk-62)/260,.55,.94);
  let ph=0,pa=0,k=0,done=false;const t0=(M?M.t:120)+1;
  if(detail&&M){M.t=t0;M.m=120;M.x=0;M.ph=5;evPush(M,{side:'h',type:'whistle',k:'pens',lines:['Elfmeterschießen! Die Nerven liegen blank.',`${hc.short} beginnt.`]})}
  const kick=(side,r)=>{const ks=side==='h'?kh:ka,gkv=side==='h'?ga:gh,gkp=side==='h'?gka:gkh,p=ks[r%ks.length],ok=rnd()<prob(p,gkv);if(ok){side==='h'?ph++:pa++}
    if(detail&&M){M.t=t0+1+k;const miss=pick([`… ${pn(gkp)} hält!`,'… und setzt den Ball neben das Tor!','… nur der Pfosten!']);
      evPush(M,{side,type:ok?'pen':'penmiss',ok,big:true,lines:[`${pn(p)} tritt an …`,ok?pick(['… und verwandelt sicher!','… und trifft ins Eck!','… Tor! Eiskalt!']):miss],ps:ph+':'+pa})}
    k++};
  for(let r=0;r<5&&!done;r++){
    kick('h',r);if(ph>pa+(5-r)||pa>ph+(4-r)){done=true;break}
    kick('a',r);if(ph>pa+(4-r)||pa>ph+(4-r)){done=true;break}
  }
  let r=5;while(!done&&ph===pa&&r<40){kick('h',r);kick('a',r);r++}
  if(ph===pa)ph++;
  res.pen={h:ph,a:pa};
  if(detail&&M){M.t=t0+2+k;const w=ph>pa?hc:ac;evPush(M,{side:ph>pa?'h':'a',type:'whistle',k:'penend',big:true,lines:[`${w.name} gewinnt das Elfmeterschießen mit ${Math.max(ph,pa)}:${Math.min(ph,pa)}!`]})}
  res.end=(M?M.t:t0+k)+1;
}

/* ---------- Saisonwerte der Teams (Liga) ---------- */
function addLeagueStats(m,res){
  const hc=club(m.h),ac=club(m.a);const xh=res.ts.h.xg,xa=res.ts.a.xg;
  for(const [c,s,o,gf,ga,xf,xo] of [[hc,'h','a',res.hg,res.ag,xh,xa],[ac,'a','h',res.ag,res.hg,xa,xh]]){
    const ss=teamSS(c),T=res.ts[s],O=res.ts[o];
    ss.mp++;ss.g+=gf;ss.ga+=ga;ss.xg+=xf;ss.xga+=xo;ss.sh+=T.sh;ss.sha+=O.sh;ss.sot+=T.sot;ss.sota+=O.sot;ss.bc+=T.bc;ss.bca+=O.bc;
    ss.poss+=s==='h'?res.poss:100-res.poss;ss.pas+=T.pas;ss.pcm+=T.pcm;ss.pasA+=O.pas;ss.cor+=T.cor;ss.fls+=T.fls;ss.yc+=T.yc;ss.rc+=T.rc;ss.off+=T.off;ss.tck+=T.tck;ss.int+=T.int;
    if(ga===0)ss.cs++;ss.pts+=gf>ga?3:gf===ga?1:0;if(gf>ga)ss.w++;else if(gf===ga)ss.d++;else ss.l++;ss.xpts+=xPts(xf,xo);
  }
}
/* Spielbericht des eigenen Teams speichern (für die Analyse) */
function saveUserReport(item){
  const m=item.m,r=item.r;if(!r||!r.ts)return;const home=m.h===S.user;
  S.ureps=S.ureps||[];
  S.ureps.push({s:S.season,w:S.week,lbl:item.label||(item.L?item.L.name+' · '+(item.round+1)+'. ST':''),opp:home?m.a:m.h,home,gf:home?m.hg:m.ag,ga:home?m.ag:m.hg,
    xf:Math.round((home?r.ts.h.xg:r.ts.a.xg)*100)/100,xa:Math.round((home?r.ts.a.xg:r.ts.h.xg)*100)/100,poss:home?r.poss:100-r.poss,sh:home?r.sh:r.sa,sha:home?r.sa:r.sh,res:resultText(m)});
  if(S.ureps.length>120)S.ureps=S.ureps.slice(-120);
}
