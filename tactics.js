/* =====================================================================
   Seitenlinie – Taktik: zwei Formationen (gegen den Ball / mit Ball),
   Rollen pro Phase, Formen-Analyse und Wirkung im Spiel.
   Koordinaten: x 0–100 (links → rechts), y 0–100 (gegnerisches Tor oben → eigenes Tor unten).
   ===================================================================== */

/* ---------- Position aus Koordinate (gegen den Ball maßgeblich) ---------- */
function posFromXY(x,y,i){
  if(i===0)return 'TW';
  const wide=t=>x<t||x>100-t;
  if(y>=66)return wide(22)?'AV':'IV';
  if(y>=56)return wide(20)?'AV':'DM';
  if(y>=40)return wide(20)?'FL':'ZM';
  if(y>=26)return wide(22)?'FL':'OM';
  return wide(20)?'FL':'ST';
}
function ensureTactic(c){
  const t=c.tactic;if(!t)return;
  if(!t.oop||t.oop.length!==11){const F=FORMATIONS[t.f]||FORMATIONS['4-4-2'];t.oop=F.xy.map(a=>a.slice());t.ip=null;t.roles=null;t.droles=null}
  if(!t.roles||!t.droles){bestRoles(c,null)}
  ensureInstr(t);
  if(!t.ip||t.ip.length!==11)t.ip=deriveIP(t);
}
function slotsOf(c){ensureTactic(c);return c.tactic.oop.map(([x,y],i)=>posFromXY(x,y,i))}

/* ---------- Rollen mit Ball ----------
   a = Schlüsselattribute, fx = Wirkung, mv = Laufweg mit Ball, g/as = Gewicht für Tore/Vorlagen */
const IN=1,OUT=-1;
const TROLES={
 tw_klass:{p:'TW',lbl:'Klassischer Torwart',sh:'TW',d:'Bleibt auf der Linie, sicher im Strafraum.',a:{ref:3,han:3,ovo:2,cmd:2,pos:2},fx:{cover:.3}},
 tw_mit:{p:'TW',lbl:'Mitspielender Torwart',sh:'MTW',d:'Spielt im Aufbau mit und sichert hinter einer hohen Linie ab (Sweeper-Keeper).',a:{ref:2,ovo:2,rus:3,acc:1,pas:2,fir:2,dec:2},fx:{build:.6,sweep:1},mv:{dy:-5}},
 iv_klass:{p:'IV',lbl:'Klassischer Innenverteidiger',sh:'IV',d:'Verteidigt den Strafraum, gewinnt Kopfball- und Zweikampfduelle.',a:{tck:3,mar:3,hea:3,str:2,jum:2,pos:2},fx:{cover:.6,aerialD:1},mv:{dy:-3}},
 iv_ball:{p:'IV',lbl:'Spieleröffnender IV',sh:'SIV',d:'Eröffnet das Spiel mit flachen und vertikalen Pässen.',a:{pas:3,fir:2,cmp:3,vis:2,tck:2,pos:2},fx:{build:.9,cover:.3},mv:{dy:-5}},
 iv_halb:{p:'IV',lbl:'Halbverteidiger',sh:'HV',d:'Äußerer IV einer Dreierkette, schiebt mit Ball breit und hoch und hinterläuft.',a:{pas:2,sta:2,dri:2,tck:2,otb:2,pac:2},fx:{width:.4,build:.3,cover:-.2},mv:{dx:OUT*6,dy:-12}},
 iv_lib:{p:'IV',lbl:'Libero',sh:'LIB',d:'Rückt mit Ball ins Mittelfeld auf und verteilt die Bälle, sichert ohne Ball ab.',a:{pas:3,vis:2,ant:2,cmp:2,dec:2,pos:2},fx:{build:1,cover:-.2},mv:{dy:-14}},
 av_def:{p:'AV',lbl:'Defensiver Außenverteidiger',sh:'DAV',d:'Bleibt hinten, sichert die Restverteidigung ab.',a:{tck:3,mar:2,pos:3,pac:2,cnt:2},fx:{cover:.7},mv:{dy:-6}},
 av_off:{p:'AV',lbl:'Offensiver Außenverteidiger',sh:'OAV',d:'Hinterläuft den Flügel und bringt Flanken.',a:{cro:3,sta:2,pac:2,otb:2,dri:2,wor:2},fx:{width:.9,cross:.8,cover:-.4},mv:{xTo:6,dy:-28},as:1.25},
 av_inv3:{p:'AV',lbl:'Inverser AV (Dreierkette)',sh:'IAV',d:'Rückt mit Ball neben die Innenverteidiger und bildet eine Dreierkette.',a:{pos:3,tck:2,pas:2,cmp:2,dec:2},fx:{rest:1,build:.4,width:-.3},mv:{xTo:24,yTo:74}},
 av_invm:{p:'AV',lbl:'Inverser AV (ins Mittelfeld)',sh:'IOAV',d:'Schiebt mit Ball ins Zentrum neben den Sechser – das „Box-Mittelfeld“.',a:{pas:3,fir:2,dec:2,tec:2,tea:2,pos:2},fx:{build:.8,rest:.5,width:-.4},mv:{xTo:38,yTo:56}},
 av_fv:{p:'AV',lbl:'Flügelverteidiger',sh:'FV',d:'Gibt allein die Breite, läuft die ganze Seite (Wingback).',a:{sta:3,pac:2,cro:3,dri:2,wor:2,acc:2},fx:{width:1.2,cross:.9,cover:-.5},mv:{xTo:5,dy:-36},as:1.3},
 dm_anker:{p:'DM',lbl:'Ankerspieler (Sechser)',sh:'ANK',d:'Hält die Position vor der Abwehr und schließt den Raum.',a:{pos:3,ant:2,mar:2,tck:2,cnt:2,tea:2},fx:{cover:.8,rest:.8},mv:{dy:-3}},
 dm_spiel:{p:'DM',lbl:'Tiefer Spielmacher',sh:'TSP',d:'Taktgeber aus der Tiefe (Regista), verteilt die Bälle.',a:{pas:3,vis:3,fir:2,cmp:2,tec:2,dec:2},fx:{build:1.2,rest:.4},mv:{dy:-6},as:1.2},
 dm_abr:{p:'DM',lbl:'Abräumer',sh:'ABR',d:'Jagt den Ball, gewinnt zweite Bälle und Zweikämpfe.',a:{tck:3,agg:2,sta:2,wor:3,ant:2},fx:{press:.8,cover:.4},mv:{dy:-8}},
 dm_abk:{p:'DM',lbl:'Abkippender Sechser',sh:'ABK',d:'Lässt sich mit Ball zwischen die Innenverteidiger fallen (Halbverteidiger-Rolle).',a:{pos:2,pas:3,dec:2,cmp:2,mar:2},fx:{build:.7,rest:1},mv:{xTo:50,yTo:80}},
 zm_b2b:{p:'ZM',lbl:'Box-to-Box',sh:'B2B',d:'Von Strafraum zu Strafraum, schaltet sich in Angriff und Abwehr ein.',a:{sta:3,wor:3,pas:2,otb:2,tck:2,nat:2},fx:{box:.5,press:.5},mv:{dy:-12},g:1.2},
 zm_acht:{p:'ZM',lbl:'Halbraum-Achter',sh:'ACH',d:'Stößt in den Halbraum vor, sucht Pässe in die Tiefe (Mezzala).',a:{dri:2,pas:2,otb:3,tec:2,vis:2,fin:1},fx:{chance:.8,box:.5,cover:-.3},mv:{xTo:30,dy:-26},g:1.3,as:1.2},
 zm_spiel:{p:'ZM',lbl:'Spielmacher',sh:'SPM',d:'Lenkt das Spiel im Zentrum, sucht den entscheidenden Pass.',a:{pas:3,vis:3,tec:2,fir:2,dec:2,cmp:2},fx:{build:.9,chance:.5},mv:{dy:-10},as:1.35},
 zm_carr:{p:'ZM',lbl:'Absicherer (Carrilero)',sh:'ABS',d:'Arbeitet zur Seite, sichert den Halbraum und den Außenverteidiger ab.',a:{pos:2,tea:3,wor:2,pas:2,sta:2},fx:{cover:.6,rest:.4},mv:{dx:OUT*5,dy:-6}},
 om_zehn:{p:'OM',lbl:'Klassischer Zehner',sh:'10',d:'Kreativzentrale zwischen den Linien.',a:{vis:3,pas:3,tec:2,fir:2,fla:2,dec:2},fx:{chance:1.1,press:-.3},mv:{dy:-6},as:1.45},
 om_schat:{p:'OM',lbl:'Schattenstürmer',sh:'SST',d:'Startet aus dem Rückraum in die Spitze, kommt zum Abschluss.',a:{otb:3,fin:3,acc:2,cmp:2,ant:2},fx:{box:1,chance:.3},mv:{dy:-14},g:1.45},
 om_frei:{p:'OM',lbl:'Freigeist (Trequartista)',sh:'TRQ',d:'Sucht sich seine Räume selbst, wenig Defensivarbeit.',a:{fla:3,tec:3,dri:2,vis:2,fin:2},fx:{chance:1,press:-.6},mv:{dy:-8},g:1.2,as:1.25},
 fl_klass:{p:'FL',lbl:'Klassischer Flügelspieler',sh:'FLÜ',d:'Bleibt breit an der Linie und flankt.',a:{cro:3,pac:2,dri:2,acc:2,tec:2},fx:{width:1,cross:1},mv:{xTo:5,dy:-10},as:1.35},
 fl_inv:{p:'FL',lbl:'Inverser Flügelstürmer',sh:'IFS',d:'Zieht von außen nach innen und schließt mit dem starken Fuß ab.',a:{dri:3,fin:2,acc:2,otb:2,tec:2,lon:1},fx:{box:.9,chance:.4,width:-.4},mv:{xTo:26,dy:-14},g:1.45},
 fl_raum:{p:'FL',lbl:'Raumdeuter',sh:'RD',d:'Findet die Räume, die andere nicht sehen – Laufwege statt Dribblings.',a:{otb:3,ant:3,fin:2,cmp:2,dec:2},fx:{box:1.1,width:-.6},mv:{xTo:34,dy:-16},g:1.5},
 fl_def:{p:'FL',lbl:'Defensiver Flügelspieler',sh:'DFL',d:'Arbeitet viel nach hinten, unterstützt den Außenverteidiger.',a:{wor:3,sta:2,tck:2,cro:2,pos:2},fx:{cover:.6,press:.4,width:.4},mv:{dy:-6}},
 st_ziel:{p:'ST',lbl:'Zielspieler',sh:'ZS',d:'Wandspieler, macht Bälle fest und gewinnt Kopfballduelle.',a:{hea:3,str:3,jum:2,fir:2,bal:2},fx:{aerial:1.2,box:.4},mv:{dy:-2},g:1.15},
 st_konter:{p:'ST',lbl:'Tiefenläufer',sh:'TL',d:'Läuft permanent hinter die Abwehr, ideal zum Kontern.',a:{pac:3,acc:3,otb:3,fin:2,dri:1},fx:{counter:1.2,box:.6},mv:{dy:-4},g:1.25},
 st_f9:{p:'ST',lbl:'Falsche Neun',sh:'F9',d:'Lässt sich ins Mittelfeld fallen, schafft Überzahl und öffnet Räume für die Flügel.',a:{fir:3,pas:2,vis:2,tec:3,otb:2,dec:2},fx:{build:.6,chance:.8,box:-.8},mv:{dy:14},g:.75,as:1.35},
 st_press:{p:'ST',lbl:'Pressingstürmer',sh:'PS',d:'Erster Verteidiger, läuft unermüdlich an.',a:{wor:3,sta:3,agg:2,ant:2,acc:2},fx:{press:1},mv:{dy:-2}},
 st_abst:{p:'ST',lbl:'Strafraumstürmer',sh:'SRS',d:'Lauert im Strafraum, lebt vom Abschluss (Poacher).',a:{fin:3,otb:3,ant:2,cmp:2,acc:2},fx:{box:1,press:-.4},mv:{dy:-4},g:1.4},
 st_komp:{p:'ST',lbl:'Kompletter Stürmer',sh:'KS',d:'Kann alles: Abschluss, Kopfball, Ablagen.',a:{fin:2,fir:2,str:2,hea:2,pas:2,tec:2},fx:{box:.6,chance:.3,aerial:.4},mv:{dy:-3},g:1.15}};
/* ---------- Rollen gegen den Ball ---------- */
const DROLES={
 d_tw_line:{p:'TW',lbl:'Auf der Linie',sh:'Linie',d:'Bleibt im Tor – sicher bei tiefer Abwehr.',a:{ref:3,pos:2,cmd:2},fx:{}},
 d_tw_sweep:{p:'TW',lbl:'Mitverteidigend',sh:'Mitvert.',d:'Läuft weit heraus und sichert den Raum hinter einer hohen Linie.',a:{rus:3,acc:2,ovo:2,dec:2},fx:{sweep:1}},
 d_iv_hold:{p:'IV',lbl:'Raum halten',sh:'Halten',d:'Hält die Linie, verteidigt den Raum.',a:{pos:3,cnt:2,mar:2,ant:2},fx:{cover:.4}},
 d_iv_stop:{p:'IV',lbl:'Herausrückend (Stopper)',sh:'Stopper',d:'Verfolgt den Gegenspieler bis ins Mittelfeld.',a:{agg:2,tck:3,ant:2,acc:2},fx:{press:.5,cover:-.3}},
 d_av_hold:{p:'AV',lbl:'Abwartend',sh:'Abwart.',d:'Bleibt tief und schützt den Rücken.',a:{pos:3,mar:2,cnt:2},fx:{cover:.4}},
 d_av_press:{p:'AV',lbl:'Pressend',sh:'Pressend',d:'Rückt auf den gegnerischen Flügelspieler heraus.',a:{agg:2,acc:2,wor:2,tck:2},fx:{press:.5,cover:-.2}},
 d_dm_screen:{p:'DM',lbl:'Abschirmend',sh:'Abschirm.',d:'Stellt die Passwege ins Zentrum zu.',a:{pos:3,ant:2,tea:2},fx:{cover:.6}},
 d_dm_hunt:{p:'DM',lbl:'Jagend',sh:'Jagend',d:'Attackiert jeden Ball im Zentrum.',a:{tck:3,agg:2,wor:2,sta:2},fx:{press:.7,cover:-.2}},
 d_zm_close:{p:'ZM',lbl:'Halbräume schließen',sh:'Schließen',d:'Verschiebt kompakt und schließt die Halbräume.',a:{pos:2,tea:3,wor:2},fx:{cover:.5}},
 d_zm_press:{p:'ZM',lbl:'Herausrückend',sh:'Herausr.',d:'Rückt ins Pressing auf die gegnerischen Sechser heraus.',a:{wor:3,agg:2,acc:2,sta:2},fx:{press:.6,cover:-.2}},
 d_om_screen:{p:'OM',lbl:'Sechser zustellen',sh:'Zustellen',d:'Nimmt den gegnerischen Sechser in Deckungsschatten.',a:{tea:2,pos:2,wor:2},fx:{press:.3,cover:.3}},
 d_om_free:{p:'OM',lbl:'Konterbereit',sh:'Konter',d:'Spart Kraft und ist Anspielstation für den Konter.',a:{otb:2,acc:2,dec:2},fx:{counter:.6,cover:-.3}},
 d_fl_track:{p:'FL',lbl:'Zurückarbeitend',sh:'Zurück',d:'Läuft mit dem gegnerischen Außenverteidiger mit nach hinten.',a:{wor:3,sta:2,tck:2},fx:{cover:.5}},
 d_fl_high:{p:'FL',lbl:'Hoch bleiben',sh:'Hoch',d:'Bleibt vorne als Konterstation.',a:{pac:2,acc:2,otb:2},fx:{counter:.8,cover:-.4}},
 d_st_press:{p:'ST',lbl:'Anlaufen',sh:'Anlaufen',d:'Läuft die Innenverteidiger und den Torwart an.',a:{wor:3,agg:2,acc:2,sta:2},fx:{press:.8}},
 d_st_screen:{p:'ST',lbl:'Passwege zustellen',sh:'Zustellen',d:'Lenkt den Aufbau des Gegners auf eine Seite.',a:{tea:2,pos:2,ant:2},fx:{cover:.3,press:.3}},
 d_st_high:{p:'ST',lbl:'Konterposition halten',sh:'Lauern',d:'Bleibt vorne und wartet auf den langen Ball.',a:{pac:2,acc:2,otb:3},fx:{counter:.9,cover:-.2}}};
const ROLE_PREFS={
 offensiv:['av_off','zm_acht','fl_inv','st_konter','d_st_press','d_av_press','d_zm_press'],
 defensiv:['av_def','dm_anker','zm_carr','fl_def','st_ziel','d_fl_track','d_iv_hold','d_st_screen','d_av_hold','d_tw_line'],
 ballbesitz:['tw_mit','iv_ball','av_invm','av_inv3','dm_spiel','zm_spiel','om_zehn','fl_klass','st_f9','d_zm_close','d_tw_sweep'],
 konter:['av_def','dm_abr','fl_klass','st_konter','d_fl_high','d_st_high','d_iv_hold','d_om_free'],
 pressing:['tw_mit','iv_ball','av_off','dm_abr','zm_b2b','fl_inv','st_press','d_st_press','d_zm_press','d_av_press','d_iv_stop','d_dm_hunt','d_tw_sweep']};
function rolesFor(pos,phase){const src=phase==='oop'?DROLES:TROLES;return Object.keys(src).filter(k=>src[k].p===pos)}
function roleDef(k){return TROLES[k]||DROLES[k]||null}
// Eignung eines Spielers für eine Rolle (5–100)
function roleScore(p,k){const R=roleDef(k);if(!p||!R)return 0;let s=0,w=0;for(const a in R.a){s+=at(p,a)*R.a[a];w+=R.a[a]}return w?s/w*5:0}
function roleStars(sc){return sc>=80?5:sc>=70?4:sc>=60?3:sc>=50?2:1}
function bestRoles(c,prefs){
  const t=c.tactic,slots=t.oop.map(([x,y],i)=>posFromXY(x,y,i)),pr=prefs||[];
  const pick=(pos,phase,p,old)=>{const ks=rolesFor(pos,phase);if(old&&ks.includes(old)&&!prefs)return old;let best=ks[0],bv=-1;for(const k of ks){const v=(p?roleScore(p,k):50)+(pr.includes(k)?12:0)+(k===old?2:0);if(v>bv){bv=v;best=k}}return best};
  const ids=c.lineup||[];
  t.roles=slots.map((pos,i)=>pick(pos,'ip',S.players[ids[i]],t.roles&&t.roles[i]));
  t.droles=slots.map((pos,i)=>pick(pos,'oop',S.players[ids[i]],t.droles&&t.droles[i]));
  // Balance: nicht beide Außenverteidiger offensiv ohne Absicherung
  const avs=slots.map((p,i)=>p==='AV'?i:-1).filter(i=>i>=0);
  if(avs.length===2&&avs.every(i=>['av_off','av_fv'].includes(t.roles[i]))&&!t.roles.some(r=>r==='dm_anker'||r==='dm_abk')&&slots.filter(p=>p==='IV').length<3)t.roles[avs[1]]=pr.includes('av_invm')?'av_invm':'av_def';
}
// Form mit Ball aus der Form gegen den Ball + Laufwegen der Rollen ableiten
function deriveIP(t){
  const push=t.men==='offensiv'?9:t.men==='defensiv'?3:6;
  return t.oop.map(([x,y],i)=>{
    if(i===0){const R=TROLES[t.roles&&t.roles[0]];return [x,clamp(y+(R&&R.mv&&R.mv.dy||0),78,96)]}
    const R=TROLES[t.roles&&t.roles[i]]||{},mv=R.mv||{},left=x<50;
    let nx=x,ny=y-push*(y>66?.5:y<30?.3:1);
    if(mv.xTo!==undefined)nx=left?mv.xTo:100-mv.xTo;
    if(mv.dx)nx=x+(left?1:-1)*mv.dx; // dx<0 = nach außen, dx>0 = nach innen
    if(mv.yTo!==undefined)ny=mv.yTo;
    if(mv.dy)ny+=mv.dy;
    const du=t.du&&DUTIES[t.du[i]];if(du)ny+=du.dy;
    const pos=posFromXY(x,y,i),minY={IV:36,AV:12,DM:22,ZM:18,OM:14,FL:8,ST:8}[pos]||10;
    return [Math.round(clamp(nx,3,97)),Math.round(clamp(ny,minY,90))];
  });
}
// KI: Rollen nach Trainertyp und Spielern, Form mit Ball daraus ableiten
function aiTactic(c){
  ensureTactic(c);const trait=c.staff&&c.staff.coach&&c.staff.coach.trait;
  bestRoles(c,ROLE_PREFS[trait]||[]);ensureInstr(c.tactic);aiInstr(c);c.tactic.ip=deriveIP(c.tactic);
}

/* ---------- Formen-Analyse ---------- */
function detectShape(xy){
  const pts=xy.slice(1).map(a=>a[1]).sort((a,b)=>b-a);const lines=[];
  for(const y of pts){const L=lines[lines.length-1];if(L&&L.last-y<=10){L.n++;L.last=y}else lines.push({last:y,n:1})}
  return lines.map(l=>l.n).join('-');
}
function shapeMetrics(c){
  const t=c.tactic,o=t.oop.slice(1),ip=t.ip.slice(1);
  const ys=o.map(a=>a[1]),defs=t.oop.map((a,i)=>({a,pos:posFromXY(a[0],a[1],i)})).filter(x=>x.pos==='IV'||x.pos==='AV');
  return {
    rest:ip.filter(a=>a[1]>=50).length,
    front:ip.filter(a=>a[1]<=30).length,
    wide:ip.filter(a=>a[1]<=50&&(a[0]<16||a[0]>84)).length,
    central:ip.filter(a=>a[0]>=28&&a[0]<=72&&a[1]>=26&&a[1]<=62).length,
    depth:Math.max(...ys)-Math.min(...ys),
    line:defs.length?defs.reduce((s,x)=>s+x.a[1],0)/defs.length:75,
    oopShape:detectShape(t.oop),ipShape:detectShape(t.ip)};
}
function tacticProfile(c){
  ensureTactic(c);const t=c.tactic,fx={build:0,chance:0,box:0,width:0,cross:0,aerial:0,aerialD:0,counter:0,press:0,cover:0,rest:0,sweep:0};
  const add=(k,i)=>{const R=roleDef(k);if(!R)return;const p=S.players[c.lineup[i]];const q=p?clamp(roleScore(p,k)/68,.6,1.3):.6;for(const f in R.fx)fx[f]+=R.fx[f]*q};
  for(let i=0;i<11;i++){add(t.roles[i],i);add(t.droles[i],i)}
  ensureInstr(t);
  for(let i=0;i<11;i++){const du=DUTIES[t.du[i]];if(du)for(const f in du.fx)fx[f]+=du.fx[f];
    const p=S.players[c.lineup[i]];for(const k of t.pi[i]||[]){const I=PINSTR[k];if(!I)continue;const q=p?clamp(at(p,I.a)/12,.5,1.4):.6;for(const f in I.fx)fx[f]+=I.fx[f]*(I.fx[f]>0?q:1)}}
  const m=shapeMetrics(c);
  let Mf=1+.01*(fx.build-2.5)+.012*(m.central-3),Af=1+.01*(fx.chance-2.5)+.012*(fx.box+m.front*.6-4.5)+.012*Math.min(fx.cross,fx.aerial)+(m.wide>=2?.02:m.wide===1?0:-.04),Df=1+.012*(fx.cover-2.6)+(m.rest>=6?.04:m.rest===5?.025:m.rest===4?.01:m.rest===3?-.015:-.05)+(m.depth<=52?.03:m.depth>=68?-.03:0);
  if(t.press==='hoch'){Mf+=.008*fx.press;if(m.line>74)Df-=.02}
  if(t.press==='niedrig'&&m.line<70)Df-=.02;
  if(t.style==='konter')Af+=.012*fx.counter;if(t.style==='ballbesitz')Mf+=.006*fx.build;
  const E=instrEffects(c,fx);Mf*=E.M;Af*=E.A;Df*=E.D;
  return {M:clamp(Mf,.84,1.16),A:clamp(Af,.84,1.16),D:clamp(Df,.84,1.16),fx,m,E};
}
// Hohe Linie gegen schnelle Stürmer: Anfälligkeit für Bälle in die Tiefe
function lineRisk(c,opp){
  const P=tacticProfile(c),high=clamp((74-P.m.line-P.E.line)/10,0,1.8);if(!high)return 1;
  const os=slotsOf(opp),pace=[];opp.lineup.forEach((id,i)=>{const p=S.players[id];if(p&&(os[i]==='ST'||os[i]==='FL'))pace.push((at(p,'pac')+at(p,'acc'))/2)});
  const pc=pace.length?pace.reduce((a,b)=>a+b,0)/pace.length:12;
  return clamp(1-high*Math.max(0,pc-11)/45*(P.fx.sweep>0?.5:1),.88,1);
}
function tacticHints(c){
  const P=tacticProfile(c),m=P.m,h=[];
  if(m.rest<=3)h.push(['bad',`Nur ${m.rest} Spieler sichern mit Ball ab – sehr anfällig für Konter. Üblich sind 4–5 (z. B. 3+2).`]);
  else if(m.rest>=7)h.push(['gold',`${m.rest} Spieler bleiben mit Ball hinten – sicher, aber wenig Durchschlagskraft.`]);
  if(m.front<=2)h.push(['gold',`Nur ${m.front} Spieler besetzen mit Ball die letzte Linie – die gegnerische Abwehr wird kaum gebunden.`]);
  if(m.wide===0)h.push(['bad','Niemand gibt mit Ball die Breite – das Spiel wird sehr eng und leicht zu verteidigen.']);
  if(m.depth>=68)h.push(['gold',`Gegen den Ball ${Math.round(m.depth)} % Abstand zwischen erster und letzter Linie – nicht kompakt.`]);
  if(c.tactic.press==='hoch'&&m.line>74)h.push(['gold','Hohes Pressing, aber tiefe Abwehrlinie: Die Mannschaft reißt auseinander.']);
  if(m.line<64&&!P.fx.sweep)h.push(['gold','Sehr hohe Abwehrlinie ohne mitspielenden Torwart – Gefahr durch Bälle in die Tiefe.']);
  if(P.fx.cross>1.4&&P.fx.aerial<.6)h.push(['gold','Viele Flanken, aber kein kopfballstarker Abnehmer im Zentrum.']);
  if(!h.length)h.push(['good','Die Taktik ist in sich stimmig.']);
  return h;
}

/* ---------- Aufgabe je Spieler (wie weit er sich mit Ball einschaltet) ---------- */
const DUTIES={def:{lbl:'Absichern',d:'Hält sich mit Ball zurück und sichert ab.',dy:6,fx:{cover:.3,rest:.3,box:-.2}},sup:{lbl:'Unterstützen',d:'Ausgewogen – schaltet sich situativ ein.',dy:0,fx:{}},att:{lbl:'Angreifen',d:'Schiebt mit Ball weit nach vorne und sucht den Abschluss.',dy:-7,fx:{box:.3,chance:.2,cover:-.3,rest:-.3}}};
/* ---------- Individuelle Anweisungen ---------- */
const PINSTR={
 risk:{lbl:'Riskantere Pässe',a:'pas',fx:{chance:.3,build:-.1},not:['TW']},
 drib:{lbl:'Häufiger dribbeln',a:'dri',fx:{chance:.25},not:['TW','IV']},
 long:{lbl:'Aus der Distanz schießen',a:'lon',fx:{chance:.1},g:1.15,not:['TW','IV']},
 cross:{lbl:'Häufiger flanken',a:'cro',fx:{cross:.4},only:['AV','FL','ZM','OM']},
 box:{lbl:'In den Strafraum starten',a:'otb',fx:{box:.35,cover:-.15},g:1.2,not:['TW','IV']},
 hold:{lbl:'Position halten',a:'pos',fx:{cover:.3,box:-.2},not:['TW']},
 mark:{lbl:'Gegenspieler eng decken',a:'mar',fx:{cover:.25},not:['TW','ST']},
 hard:{lbl:'Härter in die Zweikämpfe',a:'tck',fx:{press:.2,cover:.1},card:1.4,not:['TW']},
 press:{lbl:'Mehr pressen',a:'wor',fx:{press:.35},tire:1.1,not:['TW']},
 dist:{lbl:'Schnell abwerfen (Konter)',a:'thr',fx:{counter:.4},only:['TW']},
 short:{lbl:'Kurz abspielen',a:'pas',fx:{build:.3},only:['TW']}};
function pinstrFor(pos){return Object.keys(PINSTR).filter(k=>{const I=PINSTR[k];return (!I.only||I.only.includes(pos))&&(!I.not||!I.not.includes(pos))})}

/* ---------- Mannschaftsanweisungen ---------- */
const TI_OPTS={
 build:{lbl:'Spielaufbau',o:{short:'Kurz & flach',mix:'Gemischt',long:'Lange Bälle'},d:'Wie der Ball von hinten nach vorne kommt.'},
 tempo:{lbl:'Tempo',o:{low:'Geduldig',norm:'Normal',high:'Hoch'},d:'Wie schnell nach vorne gespielt wird.'},
 width:{lbl:'Breite mit Ball',o:{narrow:'Eng',norm:'Normal',wide:'Breit'},d:'Wie weit die Mannschaft das Feld auseinanderzieht.'},
 risk:{lbl:'Passrisiko',o:{safe:'Sicher',norm:'Normal',risky:'Riskant'},d:'Sichere Pässe halten den Ball, riskante schaffen Chancen.'},
 focus:{lbl:'Angriffsfokus',o:{center:'Durch die Mitte',mix:'Ausgewogen',wings:'Über die Flügel'},d:'Wo die Angriffe hauptsächlich laufen.'},
 cross:{lbl:'Flanken',o:{low:'Flach (Cut-backs)',mix:'Gemischt',high:'Hoch'},d:'Wie in den Strafraum geflankt wird.'},
 shoot:{lbl:'Abschluss',o:{work:'Herausspielen',norm:'Normal',long:'Aus der Distanz'},d:'Wann geschossen wird.'},
 counter:{lbl:'Nach Ballgewinn',o:{hold:'Ball sichern',mix:'Situativ',go:'Sofort kontern'},d:'Umschalten nach Ballgewinn.'}};
const TD_OPTS={
 line:{lbl:'Abwehrlinie',o:{low:'Tief',mid:'Mittel',high:'Hoch'},d:'Wie hoch die Abwehr steht.'},
 trans:{lbl:'Nach Ballverlust',o:{back:'Zurückfallen',mix:'Situativ',press:'Gegenpressing'},d:'Sofort nachsetzen oder sich ordnen.'},
 tackle:{lbl:'Zweikampfführung',o:{soft:'Vorsichtig',norm:'Normal',hard:'Hart'},d:'Härtere Zweikämpfe gewinnen mehr Bälle, bringen aber Karten.'},
 trap:{lbl:'Abseitsfalle',o:{off:'Aus',on:'An'},d:'Die Abwehr rückt gemeinsam heraus.'},
 funnel:{lbl:'Gegner lenken',o:{in:'Nach innen',none:'Neutral',out:'Nach außen'},d:'Nach außen = Flanken zulassen, die Mitte zu; nach innen = Flügel zu, Zentrum dicht.'},
 mark:{lbl:'Deckung',o:{zone:'Raumdeckung',mix:'Gemischt',man:'Manndeckung'},d:'Raum oder Gegenspieler verteidigen.'}};
const TI_DEF={build:'mix',tempo:'norm',width:'norm',risk:'norm',focus:'mix',cross:'mix',shoot:'norm',counter:'mix'};
const TD_DEF={line:'mid',trans:'mix',tackle:'norm',trap:'off',funnel:'none',mark:'zone'};
const TI_PREFS={
 offensiv:{ti:{tempo:'high',risk:'risky',width:'wide'},td:{line:'high',trans:'press'}},
 defensiv:{ti:{tempo:'low',risk:'safe',counter:'go'},td:{line:'low',trans:'back',funnel:'out'}},
 ballbesitz:{ti:{build:'short',tempo:'low',risk:'safe',focus:'center',cross:'low',shoot:'work',counter:'hold'},td:{line:'high',trans:'press'}},
 konter:{ti:{build:'long',tempo:'high',counter:'go',focus:'wings'},td:{line:'low',trans:'back',funnel:'out'}},
 pressing:{ti:{tempo:'high',counter:'go'},td:{line:'high',trans:'press',tackle:'hard',trap:'on'}},
 pragmatiker:{ti:{},td:{}},rotation:{ti:{build:'short'},td:{}}};
function ensureInstr(t){
  t.ti=Object.assign({},TI_DEF,t.ti||{});t.td=Object.assign({},TD_DEF,t.td||{});
  if(!t.du||t.du.length!==11)t.du=new Array(11).fill('sup');
  if(!t.pi||t.pi.length!==11)t.pi=Array.from({length:11},()=>[]);
}
function aiInstr(c){const t=c.tactic,trait=c.staff&&c.staff.coach&&c.staff.coach.trait,P=TI_PREFS[trait]||{ti:{},td:{}};t.ti=Object.assign({},TI_DEF,P.ti);t.td=Object.assign({},TD_DEF,P.td);
  if(t.press==='hoch')t.td.trans='press';else if(t.press==='niedrig')t.td.trans='back';
  const sl=slotsOf(c);t.du=sl.map((pos,i)=>{const r=t.roles[i];return ['av_off','av_fv','zm_acht','zm_b2b','om_schat','fl_inv','fl_raum','st_konter','st_abst'].includes(r)?'att':['av_def','av_inv3','dm_anker','dm_abk','zm_carr','fl_def','iv_klass'].includes(r)?'def':'sup'})}
// Kennzahlen eines Mannschaftsteils
function avgAttr(c,poss,a){const sl=slotsOf(c);let s=0,n=0;c.lineup.forEach((id,i)=>{const p=S.players[id];if(p&&(!poss||poss.includes(sl[i]))){s+=at(p,a);n++}});return n?s/n:10}
// Wirkung der Mannschaftsanweisungen auf das Spiel
function instrEffects(c,fx){
  const t=c.tactic;ensureInstr(t);const I=t.ti,D=t.td,e={M:1,A:1,D:1,rate:1,oppRate:1,conv:1,ctr:1,cards:1,tire:1,line:0};
  if(I.build==='short'){e.M*=1+(avgAttr(c,['IV','DM','TW'],'pas')-12)*.006}else if(I.build==='long'){e.M*=.97;e.A*=1+.012*(fx.aerial-.8)}
  if(I.tempo==='high'){e.rate*=1.035;e.oppRate*=1.025;e.tire*=1.15;e.conv*=.98}else if(I.tempo==='low'){e.rate*=.95;e.oppRate*=.97;e.tire*=.9;e.M*=1.02}
  if(I.width==='wide'){e.A*=1+.01*(fx.width-1);e.M*=.99}else if(I.width==='narrow'){e.M*=1.02;if(fx.width>1.5)e.A*=.98}
  if(I.risk==='risky'){e.conv*=1.04;e.M*=.97}else if(I.risk==='safe'){e.conv*=.95;e.M*=1.03}
  if(I.focus==='wings')e.A*=1+.01*(fx.width+fx.cross-2);else if(I.focus==='center')e.A*=1+.01*(fx.chance+fx.build-2.5);
  if(I.cross==='high')e.conv*=1+.03*(fx.aerial-.8);else if(I.cross==='low')e.conv*=1+.02*(fx.box-1.5);
  if(I.shoot==='long'){e.rate*=1.03;e.conv*=.94+(avgAttr(c,['ZM','OM','FL','ST','DM'],'lon')-11)*.015}else if(I.shoot==='work'){e.rate*=.95;e.conv*=1.05}
  if(I.counter==='go')e.ctr*=1.05;else if(I.counter==='hold'){e.ctr*=.96;e.M*=1.01}
  if(D.line==='high'){e.line=-6;e.M*=1.02}else if(D.line==='low'){e.line=6;e.D*=1.03;e.M*=.98}
  if(D.trans==='press'){e.M*=1.02;e.tire*=1.08}else if(D.trans==='back'){e.D*=1.015;e.M*=.99}
  if(D.tackle==='hard'){e.D*=1.02;e.cards*=1.5}else if(D.tackle==='soft'){e.D*=.98;e.cards*=.6}
  if(D.trap==='on'){const q=(avgAttr(c,['IV','AV'],'ant')+avgAttr(c,['IV','AV'],'cnt'))/2;e.D*=q>=12?1.02:.98;e.line-=3}
  if(D.funnel==='out')e.D*=1+.01*(fx.aerialD-1.2);else if(D.funnel==='in')e.D*=1+.01*(fx.cover-3);
  if(D.mark==='man')e.D*=1+(avgAttr(c,['IV','AV','DM'],'mar')-11)*.006;else if(D.mark==='mix')e.D*=1.003;
  return e;
}
