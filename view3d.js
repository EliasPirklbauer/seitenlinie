/* =====================================================================
   Seitenlinie – 2,5D-Stadionkamera mit Highlight-Modus
   Inszeniert die Ereignisse der Engine (Ticker) als bewegte Spielszene.
   Koordinaten: x 0–105 (Länge, Heimteam spielt nach rechts), y 0–68
   (y=0 = Gegengerade nah an der Kamera … y=68 = ferne Seite), z = Höhe.
   ===================================================================== */
const V3={canvas:null,ctx:null,run:false,last:0,cam:{x:52.5,z:1},pl:{},ball:{x:52.5,y:34,z:0,fl:null,owner:null},
  poss:'h',passT:1.2,scene:null,curE:null,st:null,L:null,overlay:null,ovT:0,mode:null,crowd:null,flash:0};
function v3mode(){try{return localStorage.getItem('sl-v3')||'full'}catch(e){return 'full'}}
function v3setMode(m){try{localStorage.setItem('sl-v3',m)}catch(e){}}
const PL_SPEED=7.5;
const GK_COL={h:'#f2d024',a:'#36c06b'};

/* ---------- Einbindung in den Live-Bildschirm ---------- */
function v3Slot(L){
  const m=v3mode();if(m==='ticker')return '';
  return `<div class="card v3card ${m}" id="v3card"><div id="v3slot" class="v3slot"></div><div class="v3idle small muted">🎬 Highlight-Modus – die nächste große Szene wird hier gezeigt. Bis dahin läuft der Ticker.</div></div>`;
}
function v3Toggle(){const m=v3mode();return `<div class="seg v3seg">${[['ticker','📝 Ticker'],['hl','🎬 Highlights'],['full','🏟️ Ganzes Spiel']].map(([k,l])=>`<button class="${m===k?'on':''}" data-act="v3mode" data-v="${k}">${l}</button>`).join('')}</div>`}
Object.assign(ACT,{v3mode:d=>{v3setMode(d.v);render()}});
(function(){const R=render;render=function(){R.apply(this,arguments);try{mountV3()}catch(e){console.error(e)}}})();

function mountV3(){
  const slot=document.getElementById('v3slot');
  if(!slot||UI.view!=='live'||!UI.live){V3.run=false;return}
  if(!V3.canvas){V3.canvas=document.createElement('canvas');V3.canvas.className='v3canvas';V3.ctx=V3.canvas.getContext('2d')}
  if(V3.canvas.parentNode!==slot)slot.appendChild(V3.canvas);
  const L=UI.live;
  if(V3.L!==L||V3.mid!==L.m){v3Reset(L)}
  V3.L=L;V3.st=liveState(L);V3.mode=v3mode();
  v3OnState(L,V3.st);
  if(!V3.run){V3.run=true;V3.last=performance.now();requestAnimationFrame(v3Loop)}
}
function v3Reset(L){
  V3.mid=L.m;V3.pl={};V3.scene=null;V3.curE=null;V3.overlay=null;V3.ball={x:52.5,y:34,z:0,fl:null,owner:null};V3.poss=L.m.h===S.user?'h':'a';V3.passT=1;
  V3.col=teamCols(club(L.m.h),club(L.m.a));
}

/* ---------- Mannschaften ---------- */
function toWorld(side,a,b){return side==='h'?{x:a,y:68-b}:{x:105-a,y:b}}
function toAtt(side,x,y){return side==='h'?{a:x,b:68-y}:{a:105-x,b:y}}
function v3Teams(){
  const L=V3.L,st=V3.st,out=[];
  for(const side of ['h','a']){
    const c=club(side==='h'?L.m.h:L.m.a);ensureTactic(c);
    const lu=curLineup(L,st,side),sl=slotsOf(c),reds=new Set(st.reds[side].map(x=>x.id));
    lu.forEach((id,i)=>{if(!id||reds.has(id))return;const p=S.players[id];if(!p)return;out.push({id,side,i,pos:sl[i],p,c})});
  }
  return out;
}
function syncPlayers(){
  const ts=v3Teams(),seen=new Set();
  for(const t of ts){seen.add(t.id);let P=V3.pl[t.id];
    if(!P){const w=homeSpot(t);P=V3.pl[t.id]={id:t.id,x:Object.keys(V3.pl).length<22?w.x:52.5,y:Object.keys(V3.pl).length<22?w.y:-2,tx:w.x,ty:w.y,dive:0,face:t.side==='h'?1:-1}}
    Object.assign(P,{side:t.side,i:t.i,pos:t.pos,p:t.p,c:t.c})}
  for(const id in V3.pl)if(!seen.has(id))delete V3.pl[id];
}
function homeSpot(t){const xy=(t.c.tactic.oop||[])[t.i]||[50,50];return toWorld(t.side,(1-xy[1]/100)*105*.5+(t.side?0:0),xy[0]/100*68)}
function formTarget(P){
  const side=P.side,inP=V3.poss===side,t=P.c.tactic;
  const xy=((inP?t.ip:t.oop)||t.oop||[])[P.i]||[50,50];
  const fa=(1-xy[1]/100)*105,fb=xy[0]/100*68;
  const B=toAtt(side,V3.ball.x,V3.ball.y);
  let a,b;
  if(P.pos==='TW'){a=clamp(3+(B.a<40?(40-B.a)*.25:0)+(inP?6:0),2,20);b=34+(B.b-34)*.18}
  else if(inP){a=fa+(B.a-52)*.55+4;b=34+(fb-34)*1.05+(B.b-34)*.12}
  else{a=52+(fa-52)*.82+(B.a-52)*.5-2;b=34+(fb-34)*.85+(B.b-34)*.3}
  a=clamp(a,1,103);b=clamp(b,1.5,66.5);
  return toWorld(side,a,b);
}

/* ---------- Ballbewegung ---------- */
function kick(to,dur,h){const B=V3.ball;B.fl={fx:B.x,fy:B.y,fz:B.z,tx:to.x,ty:to.y,tz:to.z||0,t:0,dur:Math.max(.12,dur),h:h||0};B.owner=null}
function ballStep(dt){
  const B=V3.ball;
  if(B.fl){const f=B.fl;f.t+=dt;const k=Math.min(1,f.t/f.dur);
    B.x=f.fx+(f.tx-f.fx)*k;B.y=f.fy+(f.ty-f.fy)*k;B.z=f.fz+(f.tz-f.fz)*k+f.h*4*k*(1-k);
    if(k>=1){B.fl=null;if(f.onEnd)f.onEnd()}}
  else if(B.owner&&V3.pl[B.owner]){const P=V3.pl[B.owner],d=P.side==='h'?1:-1;B.x=P.x+.7*d;B.y=P.y-.3;B.z=0}
}
function nearest(side,x,y,excl){let best=null,bd=1e9;for(const id in V3.pl){const P=V3.pl[id];if(P.side!==side||id===excl||P.pos==='TW')continue;const d=Math.hypot(P.x-x,P.y-y);if(d<bd){bd=d;best=P}}return best}
function teamOf(side){return Object.values(V3.pl).filter(P=>P.side===side)}

/* ---------- Ruhiges Spiel (ohne Ereignis) ---------- */
function ambient(dt){
  const B=V3.ball,L=V3.L,pH=(L.r.poss||50)/100;
  for(const id in V3.pl){const P=V3.pl[id];const t=formTarget(P);P.tx=t.x;P.ty=t.y;P.dive=0}
  if(B.owner&&V3.pl[B.owner]){const P=V3.pl[B.owner],d=P.side==='h'?1:-1;const A=toAtt(P.side,P.x,P.y);
    if(A.a<84){P.tx=P.x+4*d;P.ty=P.y+(34-P.y)*.05}}
  if(B.fl)return;
  if(!B.owner||!V3.pl[B.owner]){const n=nearest(V3.poss,B.x,B.y);if(n){n.tx=B.x;n.ty=B.y;if(Math.hypot(n.x-B.x,n.y-B.y)<1.6)B.owner=n.id}return}
  V3.passT-=dt;
  if(V3.passT<=0){
    const own=V3.pl[B.owner],side=own.side,o=side==='h'?'a':'h';
    const share=side==='h'?pH:1-pH;
    if(rnd2()<.11*(1-share)/.5){// Ballverlust
      const n=nearest(o,B.x,B.y);if(n){V3.poss=o;kick({x:n.x,y:n.y},Math.hypot(n.x-B.x,n.y-B.y)/16,0);B.fl.onEnd=()=>{B.owner=n.id}}
      V3.passT=1+rnd2()*1.6;return}
    const A0=toAtt(side,own.x,own.y);
    const mates=teamOf(side).filter(P=>P.id!==own.id);
    const tgt=wpick(mates,P=>{const A=toAtt(side,P.x,P.y),d=Math.hypot(P.x-own.x,P.y-own.y);if(d<6||d>38)return .05;let w=1+(A.a-A0.a)/18;if(A.a>88)w*=.15;if(P.pos==='TW')w*=A0.a<30?.6:.02;return Math.max(.05,w)},rnd2);
    if(tgt){const d=Math.hypot(tgt.x-own.x,tgt.y-own.y),lead=(tgt.side==='h'?1:-1)*2;kick({x:tgt.x+lead,y:tgt.y},d/17,d>26?2.2:0);const id=tgt.id;B.fl.onEnd=()=>{B.owner=id};tgt.tx=tgt.x+lead;tgt.ty=tgt.y}
    V3.passT=.9+rnd2()*1.7;
  }
}
// eigener Zufall – darf den Spielzufall (RNG) nicht beeinflussen
let V3R=12345;function rnd2(){V3R=(V3R*1103515245+12345)&0x7fffffff;return V3R/0x7fffffff}

/* ---------- Szenen aus Ereignissen ---------- */
const SCENE_TYPES=new Set(['goal','chance','offgoal','corner','pen','penmiss']);
function isHighlight(e){return e&&(e.type==='goal'||e.type==='offgoal'||e.type==='pen'||e.type==='penmiss'||(e.type==='chance'&&(e.big||e.kind==='pen')))}
function v3OnState(L,st){
  const e=L.lastE;
  if(e&&e!==V3.curE&&SCENE_TYPES.has(e.type)&&st.lines.get(e)){
    V3.curE=e;
    if(V3.mode==='full'||isHighlight(e))startScene(L,e);
  }
  if(V3.scene&&V3.scene.e===e){const n=st.lines.get(e)||0;V3.scene.revealed=n}
  if(e&&(e.k==='ht'||e.k==='ft'||e.k==='et2'||e.k==='penend')&&e!==V3.curE){V3.curE=e;v3Overlay(e.k==='ht'?'HALBZEIT':e.k==='penend'?'ENTSCHIEDEN':'ABPFIFF',3.5)}
}
function v3Overlay(t,s,col){V3.overlay={t,s,col};V3.ovT=s}
function sceneTiming(L,e){
  // geplante Zeit bis zur Auflösung (Schuss) in Sekunden
  const base=lspeedMs(L.speed)/1000;let i0=L.beats.findIndex(b=>b.e===e),sum=0;
  for(let i=i0+1;i<L.beats.length;i++){const b=L.beats[i];if(b.e!==e)break;sum+=b.d;if(b.li===(e.ol!==undefined?e.ol:e.lines.length-1))break}
  return Math.max(.8,sum*base);
}
function startScene(L,e){
  if(V3.scene&&(V3.scene.out==='goal'||V3.scene.out==='offgoal')&&V3.scene.phase==='after')kickoff(V3.scene.out==='goal'?V3.scene.o:V3.scene.o);
  const side=e.side,o=side==='h'?'a':'h',isPen=e.type==='pen'||e.type==='penmiss',shoot=isPen&&!e.kind?true:false;
  const sh=V3.pl[e.pid]||nearest(side,V3.ball.x,V3.ball.y),as=e.aid&&V3.pl[e.aid];
  const kind=isPen?'pen':e.type==='corner'?'corner':e.type==='offgoal'?'through':(e.kind||'box');
  const out=isPen?(e.ok?'goal':'save'):e.type==='offgoal'?'offgoal':e.type==='corner'?'clear':(e.type==='goal'?'goal':e.out||'off');
  const R=()=>rnd2();
  const W=(a,b)=>toWorld(side,a,b);
  const wing=R()<.5?8:60;
  let start,shotSpot;
  switch(kind){
    case 'counter':start=W(38,20+R()*28);shotSpot=W(88+R()*5,26+R()*16);break;
    case 'through':start=W(64,24+R()*20);shotSpot=W(91+R()*6,27+R()*14);break;
    case 'cross':case 'head':start=W(80,wing);shotSpot=W(95+R()*4,29+R()*10);break;
    case 'corner':start=W(104.5,R()<.5?.8:67.2);shotSpot=W(96+R()*4,28+R()*12);break;
    case 'fk':start=W(80,22+R()*24);shotSpot=start;break;
    case 'long':start=W(66,24+R()*20);shotSpot=W(79+R()*5,22+R()*24);break;
    case 'solo':start=W(70,R()<.5?14:54);shotSpot=W(90+R()*5,24+R()*20);break;
    case 'pen':start=W(94,34);shotSpot=W(94,34);break;
    default:start=W(76,24+R()*20);shotSpot=W(92+R()*5,26+R()*16);
  }
  const dur=e.type==='corner'?1.6:isPen&&!e.kind?1.4:sceneTiming(L,e);
  V3.scene={e,side,o,sh:sh&&sh.id,as:as&&as.id,kind,out,start,shotSpot,t:0,dur,phase:'build',revealed:1,shotAt:null,post:0,isShootout:isPen&&!e.kind};
  V3.poss=side;
  // Ball zum Startpunkt
  const carrier=kind==='cross'||kind==='head'||kind==='corner'?(as||nearest(side,start.x,start.y)):(kind==='through'&&as?as:sh);
  V3.scene.car=carrier&&carrier.id;
  // Schnitt auf die Szene (wie in der TV-Regie)
  const B=V3.ball;B.x=start.x;B.y=start.y;B.z=0;B.fl=null;B.owner=null;
  for(const id in V3.pl){const P=V3.pl[id];const t=formTarget(P);P.x=t.x;P.y=t.y;P.tx=t.x;P.ty=t.y;P.dive=0}
  if(carrier){carrier.x=start.x-(side==='h'?.8:-.8);carrier.y=start.y;if(!isPen&&kind!=='corner'&&kind!=='fk')B.owner=carrier.id}
  if(sh&&sh!==carrier&&!isPen){const m=toWorld(side,toAtt(side,V3.scene.shotSpot.x,V3.scene.shotSpot.y).a-9,toAtt(side,V3.scene.shotSpot.x,V3.scene.shotSpot.y).b);sh.x=m.x;sh.y=m.y}
  if(isPen&&sh){const w=toWorld(side,91.5,34);sh.x=w.x;sh.y=w.y}
  V3.cam.x=clamp(start.x,28,77);V3.cut=.35;
}
function sceneStep(dt){
  const S0=V3.scene,B=V3.ball;S0.t+=dt;
  const side=S0.side,o=S0.o,W=(a,b)=>toWorld(side,a,b),sh=V3.pl[S0.sh],car=V3.pl[S0.car];
  const goalX=side==='h'?105:0,gk=Object.values(V3.pl).find(P=>P.side===o&&P.pos==='TW');
  // Grundaufstellung: Angreifer in den Strafraum, Verteidiger zurück
  for(const id in V3.pl){const P=V3.pl[id];P.dive=P.dive||0;
    const A=toAtt(side,P.x,P.y);
    if(S0.isShootout){if(P.id===S0.sh){continue}if(P.pos==='TW'&&P.side===o)continue;const w=toWorld('h',52.5+((P.i%6)-2.5)*1.6,34+(P.side==='h'?-1:1));P.tx=w.x;P.ty=w.y;continue}
    if(S0.kind==='pen'){if(P.id===S0.sh||(P.pos==='TW'&&P.side===o))continue;const w=W(82+((P.i*7)%9),20+((P.i*13)%28));P.tx=w.x;P.ty=w.y;continue}
    if(P.side===side&&P.pos!=='TW'){const deep=P.pos==='IV'||P.pos==='DM';const w=deep?W(58+(P.i%3)*4,20+(P.i*11)%28):W(clamp(A.a+ (88-A.a)*.06,60,97),clamp(toAtt(side,P.x,P.y).b,14,54));P.tx=w.x;P.ty=w.y}
    else if(P.side===o&&P.pos!=='TW'){const w=W(clamp(88+((P.i*5)%10),84,101),20+((P.i*17)%28));P.tx=P.tx+(w.x-P.tx)*.06;P.ty=P.ty+(w.y-P.ty)*.06}
  }
  if(gk&&S0.phase!=='shot'&&S0.phase!=='after'){gk.tx=side==='h'?103.5:1.5;gk.ty=34+(B.y-34)*.35}
  // Ablauf
  const k=Math.min(1,S0.t/S0.dur);
  const resolved=S0.revealed>(S0.e.ol!==undefined?S0.e.ol:(S0.e.lines.length-1));
  if(S0.phase==='build'){
    if(S0.kind==='pen'||S0.isShootout){if(sh){const w=W(91.5,34);sh.tx=w.x;sh.ty=w.y}if(gk){gk.tx=goalX+(side==='h'?-.6:.6);gk.ty=34}
      if(!B.fl){B.x=W(94,34).x;B.y=34;B.z=0}}
    else if(S0.kind==='cross'||S0.kind==='head'||S0.kind==='corner'){
      if(car&&S0.kind!=='corner'){const tgt=W(97,toAtt(side,S0.start.x,S0.start.y).b<34?4:64);car.tx=car.x+(tgt.x-car.x)*k;car.ty=S0.start.y;if(!B.fl)B.owner=car.id}
      if(sh){sh.tx=S0.shotSpot.x;sh.ty=S0.shotSpot.y}
      if(k>.62&&!S0.crossed&&B.owner!==sh?.id){S0.crossed=true;const to={x:S0.shotSpot.x,y:S0.shotSpot.y,z:1.8};kick(to,.75,4.5)}
    }else{
      const path=car||sh;
      if(path){if(!B.fl&&!S0.passed)B.owner=path.id;const tx=S0.start.x+(S0.shotSpot.x-S0.start.x)*Math.min(1,k*1.05),ty=S0.start.y+(S0.shotSpot.y-S0.start.y)*k;path.tx=tx;path.ty=ty}
      if(car&&sh&&car!==sh&&k>.45&&!S0.passed){S0.passed=true;kick({x:S0.shotSpot.x,y:S0.shotSpot.y},.6,0);B.fl.onEnd=()=>{B.owner=sh.id}}
      if(sh&&car!==sh){sh.tx=S0.shotSpot.x;sh.ty=S0.shotSpot.y}
    }
    if(resolved&&S0.t>.5)shoot(S0,gk);
    if(S0.kind==='corner'&&S0.out==='clear'&&k>=1)shoot(S0,gk);
  }else if(S0.phase==='after'){
    S0.post+=dt;
    if(S0.out==='goal'||S0.out==='offgoal'){
      const sp=V3.pl[S0.sh];if(sp&&S0.out==='goal'){const corner=W(103,toAtt(side,sp.x,sp.y).b<34?2:66);sp.tx=corner.x;sp.ty=corner.y;
        for(const P of teamOf(side))if(P.id!==sp.id&&P.pos!=='TW'){P.tx=sp.x+(P.i%3-1)*1.2;P.ty=sp.y+(P.i%2?1:-1)}}
      if(S0.post>5.5&&V3.L.lastE!==S0.e)kickoff(o);
    }else if(S0.post>1.6){V3.scene=null;V3.poss=o;const n=gk||nearest(o,B.x,B.y);if(n)B.owner=n.id;}
  }
  if(gk&&gk.dive>0)gk.dive=Math.max(0,gk.dive-dt*.5);
}
function shoot(S0,gk){
  const side=S0.side,W=(a,b)=>toWorld(side,a,b),B=V3.ball,R=rnd2;
  if(S0.out!=='clear'&&Math.hypot(B.x-S0.shotSpot.x,B.y-S0.shotSpot.y)>5){B.x=S0.shotSpot.x;B.y=S0.shotSpot.y;B.z=0;B.fl=null;const sp=V3.pl[S0.sh];if(sp){sp.x=B.x-(side==='h'?.8:-.8);sp.y=B.y}V3.cut=.25}
  S0.phase='shot';const from={x:B.x,y:B.y};
  const gy=31+R()*6,low=.2+R()*1.9;
  const fin=()=>{S0.phase='after';S0.post=0};
  const out=S0.out;
  if(out==='clear'){const d=V3.pl[nearest(S0.o,B.x,B.y)?.id];kick(W(70,10+R()*48),.9,3);B.fl.onEnd=fin;return}
  if(out==='goal'||out==='offgoal'){kick({...W(105.8,68-gy),z:low},.42,S0.kind==='long'?1.2:.3);B.fl.onEnd=()=>{V3.ball.z=.2;fin();if(out==='goal'){V3.flash=1.2;v3Overlay('TOR!',3.2,V3.col[side])}else v3Overlay('ABSEITS!',2.6,'#c63d2b')};
    if(gk){gk.dive=1;gk.ty=W(104,68-gy+(R()<.5?3:-3)).y}return}
  if(out==='save'){const tgt=W(104.2,68-gy);kick({...tgt,z:low},.4,.25);if(gk){gk.tx=tgt.x;gk.ty=tgt.y;gk.dive=1}
    B.fl.onEnd=()=>{kick(W(98,R()<.5?8:60),.6,2.5);B.fl.onEnd=fin;v3Overlay(S0.isShootout||S0.kind==='pen'?'GEHALTEN!':'PARADE!',1.8)};return}
  if(out==='block'){const tgt={x:from.x+(side==='h'?2.5:-2.5),y:from.y+(R()-.5)*2};kick(tgt,.16,0);B.fl.onEnd=()=>{kick(W(80,10+R()*48),.7,1.5);B.fl.onEnd=fin};return}
  if(out==='post'){const py=R()<.5?30.34:37.66;kick({...W(105,68-py),z:1.3},.42,.2);B.fl.onEnd=()=>{kick(W(95,20+R()*28),.5,1);B.fl.onEnd=fin;v3Overlay('PFOSTEN!',1.8)};if(gk)gk.dive=.6;return}
  // daneben / drüber
  const over=R()<.45,wy=over?gy:(R()<.5?25+R()*4:39+R()*4);kick({...W(108,68-wy),z:over?3.4+R()*1.5:.6},.55,over?1.2:.2);B.fl.onEnd=fin;
}
function kickoff(toSide){
  V3.scene=null;V3.poss=toSide;V3.ball={x:52.5,y:34,z:0,fl:null,owner:null};
  for(const id in V3.pl){const P=V3.pl[id];const t=formTarget(P);P.x=t.x;P.y=t.y;P.dive=0}
  const n=nearest(toSide,52.5,34);if(n){n.x=52.5+(toSide==='h'?-.8:.8);n.y=34;V3.ball.owner=n.id}
}

/* ---------- Hauptschleife ---------- */
function v3Loop(now){
  if(!V3.run)return;
  const dt=Math.min(.05,(now-V3.last)/1000);V3.last=now;
  const L=V3.L;const frozen=!L||L.done||L.paused;
  const card=document.getElementById('v3card');
  if(!V3.canvas||!V3.canvas.isConnected){V3.run=false;return}
  syncPlayers();
  const active=V3.mode==='full'||!!V3.scene;
  if(card)card.classList.toggle('idle',!active);
  if(!frozen){
    const spd=L.speed==='turbo'?3:L.speed==='fast'?1.4:1;const sdt=dt*spd;
    if(V3.scene)sceneStep(sdt);else if(V3.mode==='full')ambient(sdt);
    ballStep(sdt);
    for(const id in V3.pl){const P=V3.pl[id];const dx=P.tx-P.x,dy=P.ty-P.y,d=Math.hypot(dx,dy),mx=PL_SPEED*sdt*(V3.scene?1.25:1);
      if(d>.05){const m=Math.min(d,mx);P.x+=dx/d*m;P.y+=dy/d*m;if(Math.abs(dx)>.2)P.face=dx>0?1:-1;P.run=(P.run||0)+m*2.2}}
    if(V3.ovT>0)V3.ovT-=dt;if(V3.flash>0)V3.flash-=dt;if(V3.cut>0)V3.cut-=dt;
  }
  if(active)draw();
  requestAnimationFrame(v3Loop);
}

/* ---------- Zeichnen ---------- */
function draw(){
  const cv=V3.canvas,slot=cv.parentNode;const dpr=Math.min(2,window.devicePixelRatio||1);
  const Wc=slot.clientWidth||600,Hc=Math.round(Wc<560?Wc*.7:Math.min(Wc*.56,460));
  if(cv.width!==Math.round(Wc*dpr)||cv.height!==Math.round(Hc*dpr)){cv.width=Math.round(Wc*dpr);cv.height=Math.round(Hc*dpr);cv.style.width=Wc+'px';cv.style.height=Hc+'px'}
  const g=V3.ctx;g.setTransform(dpr,0,0,dpr,0,0);
  const B=V3.ball;
  // Kamera folgt dem Ball
  const tx=clamp(B.x,Wc<560?20:28,Wc<560?85:77),zoom=V3.scene&&V3.scene.phase!=='build'?1.12:1;
  V3.cam.x+=(tx-V3.cam.x)*.06;V3.cam.z+=(zoom-V3.cam.z)*.04;
  const cx=V3.cam.x,C={x:cx,y:-36/V3.cam.z,z:30/V3.cam.z},T={x:cx,y:36,z:0};
  let f={x:T.x-C.x,y:T.y-C.y,z:T.z-C.z};const fl=Math.hypot(f.x,f.y,f.z);f={x:f.x/fl,y:f.y/fl,z:f.z/fl};
  const r={x:1,y:0,z:0};
  const u={x:0,y:-f.z,z:f.y};
  const F=Wc*(Wc<560?1.05:.95);
  const P=(x,y,z)=>{const d={x:x-C.x,y:y-C.y,z:(z||0)-C.z};const zc=d.x*f.x+d.y*f.y+d.z*f.z;const xc=d.x*r.x+d.y*r.y+d.z*r.z,yc=d.x*u.x+d.y*u.y+d.z*u.z;return {x:Wc/2+xc/zc*F,y:Hc*.5-yc/zc*F,s:F/zc,zc}};
  // Himmel & Tribüne
  const desk=document.documentElement.className==='desk';
  const far=P(cx,80,0),farTop=P(cx,96,22);
  const sky=g.createLinearGradient(0,0,0,far.y);sky.addColorStop(0,'#0e1a2e');sky.addColorStop(1,'#1d2c46');g.fillStyle=sky;g.fillRect(0,0,Wc,Hc);
  // Ränge (ferne Tribüne)
  const stand=P(cx,72,0),standTop=P(cx,98,26);
  g.fillStyle='#27324a';g.fillRect(0,standTop.y,Wc,stand.y-standTop.y+2);
  if(!V3.crowd){const pc=document.createElement('canvas');pc.width=256;pc.height=64;const q=pc.getContext('2d');let s=7;const R=()=>{s=(s*16807)%2147483647;return s/2147483647};q.fillStyle='#2a344c';q.fillRect(0,0,256,64);for(let i=0;i<1400;i++){q.fillStyle=['#c9d3e6','#e85d4a','#f2c14e','#5aa9f0','#ffffff','#8892a6','#3b4660'][Math.floor(R()*7)];q.globalAlpha=.35+R()*.5;q.beginPath();q.arc(R()*256,R()*64,1+R()*.9,0,7);q.fill()}V3.crowd=pc}
  const pat=g.createPattern(V3.crowd,'repeat');g.save();g.translate(-cx*6%240,0);g.fillStyle=pat;g.globalAlpha=.9;g.fillRect(cx*6%240,standTop.y,Wc,stand.y-standTop.y);g.restore();g.globalAlpha=1;
  // Flutlicht-Schein
  const glow=g.createRadialGradient(Wc*.2,standTop.y,4,Wc*.2,standTop.y,Wc*.35);glow.addColorStop(0,'rgba(255,240,200,.35)');glow.addColorStop(1,'rgba(255,240,200,0)');g.fillStyle=glow;g.fillRect(0,0,Wc,Hc);
  const glow2=g.createRadialGradient(Wc*.8,standTop.y,4,Wc*.8,standTop.y,Wc*.35);glow2.addColorStop(0,'rgba(255,240,200,.35)');glow2.addColorStop(1,'rgba(255,240,200,0)');g.fillStyle=glow2;g.fillRect(0,0,Wc,Hc);
  // Werbebanden (fern)
  const bA=P(cx-120,70,0),bB=P(cx+120,70,0),bC=P(cx+120,70,1),bD=P(cx-120,70,1);
  g.fillStyle='#1b2335';g.beginPath();g.moveTo(bA.x,bA.y);g.lineTo(bB.x,bB.y);g.lineTo(bC.x,bC.y);g.lineTo(bD.x,bD.y);g.fill();
  // Rasen mit Mähstreifen
  const poly=(pts,fill)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fillStyle=fill;g.fill()};
  poly([P(-8,-6),P(113,-6),P(113,74),P(-8,74)],'#1f6b42');
  for(let i=0;i<20;i++){const x0=i*5.25,x1=x0+5.25;poly([P(x0,0),P(x1,0),P(x1,68),P(x0,68)],i%2?'#2a8452':'#257a4b')}
  // Linien
  g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=Math.max(1,F/600);
  const line=pts=>{g.beginPath();pts.forEach((p,i)=>{const q=P(p[0],p[1],0);i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y)});g.stroke()};
  line([[0,0],[105,0],[105,68],[0,68],[0,0]]);line([[52.5,0],[52.5,68]]);
  const circ=(cx0,cy0,rr,a0,a1)=>{const pts=[];for(let k=0;k<=32;k++){const a=a0+(a1-a0)*k/32;pts.push([cx0+Math.cos(a)*rr,cy0+Math.sin(a)*rr])}line(pts)};
  circ(52.5,34,9.15,0,Math.PI*2);
  for(const s of [0,1]){const X=x=>s?105-x:x;line([[X(0),13.84],[X(16.5),13.84],[X(16.5),54.16],[X(0),54.16]]);line([[X(0),24.84],[X(5.5),24.84],[X(5.5),43.16],[X(0),43.16]]);
    const sp=P(X(11),34,0);g.fillStyle='#fff';g.beginPath();g.arc(sp.x,sp.y,Math.max(1.2,sp.s*.2),0,7);g.fill();
    const a0=s?Math.PI-0.93:-0.93,a1=s?Math.PI+0.93:0.93;circ(X(11),34,9.15,a0,a1)}
  // Spieler, Ball, Tore nach Tiefe sortieren
  const items=[];
  for(const id in V3.pl){const Pl=V3.pl[id];items.push({k:'p',o:Pl,d:P(Pl.x,Pl.y,0).zc})}
  items.push({k:'b',d:P(B.x,B.y,0).zc});
  for(const gx of [0,105])items.push({k:'g',x:gx,d:P(gx,34,0).zc+(gx?1:1)});
  items.sort((a,b)=>b.d-a.d);
  const sel=V3.scene?V3.scene.sh:null;
  for(const it of items){
    if(it.k==='g')drawGoal(g,P,it.x);
    else if(it.k==='b')drawBall(g,P,B);
    else drawPlayer(g,P,it.o,it.o.id===sel||it.o.id===B.owner);
  }
  // HUD
  drawHud(g,Wc,Hc);
  if(V3.cut>0){g.fillStyle=`rgba(0,0,0,${Math.min(1,V3.cut*3)})`;g.fillRect(0,0,Wc,Hc)}
  if(V3.flash>0){g.fillStyle=`rgba(255,255,255,${Math.min(.35,V3.flash*.3)})`;g.fillRect(0,0,Wc,Hc)}
  if(V3.overlay&&V3.ovT>0){const o=V3.overlay,a=Math.min(1,V3.ovT/.4,(o.s-V3.ovT)/.25+.2);g.save();g.globalAlpha=Math.max(0,a);
    const fs=Math.round(Math.min(Wc*.12,84));g.font=`700 ${fs}px "Barlow Condensed",sans-serif`;g.textAlign='center';g.textBaseline='middle';
    g.fillStyle=o.col||'rgba(0,0,0,.55)';const tw=g.measureText(o.t).width;g.fillRect(Wc/2-tw/2-24,Hc*.42-fs*.6,tw+48,fs*1.2);
    g.fillStyle='#fff';g.fillText(o.t,Wc/2,Hc*.42);g.restore()}
  if(V3.L&&V3.L.paused&&!V3.L.done&&!(V3.overlay&&V3.ovT>0)){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,Wc,Hc);g.fillStyle='#fff';g.font='700 22px "Barlow Condensed",sans-serif';g.textAlign='center';g.fillText(V3.L.paused==='ht'?'HALBZEIT':'PAUSE',Wc/2,Hc/2)}
}
function shade(hex,k){try{const h=hex.replace('#','');let r=parseInt(h.slice(0,2),16),g2=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);r=clamp(Math.round(r*k),0,255);g2=clamp(Math.round(g2*k),0,255);b=clamp(Math.round(b*k),0,255);return `rgb(${r},${g2},${b})`}catch(e){return hex}}
function drawPlayer(g,P,Pl,hi){
  const base=P(Pl.x,Pl.y,0),s=base.s,h=3.1*s,w=1.15*s;
  const isGK=Pl.pos==='TW',col=isGK?GK_COL[Pl.side]:V3.col[Pl.side],c2=Pl.c&&Pl.c.colors?Pl.c.colors[1]:'#fff';
  // Schatten
  g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(base.x+s*.3,base.y,w*.9,w*.32,0,0,7);g.fill();
  if(Pl.dive>.05){// Torwart im Flug
    g.save();g.translate(base.x,base.y-h*.35);g.rotate((Pl.face||1)*1.2*Pl.dive);
    g.fillStyle=col;g.fillRect(-w*.5,-h*.5,w,h*.55);g.fillStyle='#222';g.fillRect(-w*.5,0,w,h*.25);g.fillStyle='#f0c8a0';g.beginPath();g.arc(0,-h*.62,w*.38,0,7);g.fill();g.restore();return}
  const sw=Math.sin((Pl.run||0))*w*.35;
  // Beine
  g.strokeStyle='#1d1d1d';g.lineWidth=Math.max(1,w*.32);g.lineCap='round';
  g.beginPath();g.moveTo(base.x-w*.18,base.y-h*.42);g.lineTo(base.x-w*.18+sw,base.y);g.moveTo(base.x+w*.18,base.y-h*.42);g.lineTo(base.x+w*.18-sw,base.y);g.stroke();
  // Hose
  g.fillStyle=shade(col,.55);g.fillRect(base.x-w*.48,base.y-h*.52,w*.96,h*.16);
  // Trikot
  g.fillStyle=col;g.beginPath();g.moveTo(base.x-w*.5,base.y-h*.5);g.lineTo(base.x+w*.5,base.y-h*.5);g.lineTo(base.x+w*.56,base.y-h*.86);g.lineTo(base.x-w*.56,base.y-h*.86);g.closePath();g.fill();
  g.fillStyle=c2;g.globalAlpha=.85;g.fillRect(base.x-w*.56,base.y-h*.86,w*1.12,h*.06);g.globalAlpha=1;
  // Kopf
  g.fillStyle='#e8b98f';g.beginPath();g.arc(base.x,base.y-h*.95,w*.32,0,7);g.fill();
  if(hi&&Pl.p){g.font=`600 ${Math.max(10,Math.min(13,s*1.3))}px Rubik,sans-serif`;g.textAlign='center';const t=Pl.p.ln;const tw=g.measureText(t).width;
    g.fillStyle='rgba(10,16,30,.75)';g.fillRect(base.x-tw/2-4,base.y-h*1.32-12,tw+8,15);g.fillStyle='#fff';g.fillText(t,base.x,base.y-h*1.32)}
}
function drawBall(g,P,B){
  const sh=P(B.x,B.y,0),b=P(B.x,B.y,B.z+.35);const r=Math.max(2.2,b.s*.42);
  g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(sh.x,sh.y,r*1.1,r*.45,0,0,7);g.fill();
  g.fillStyle='#fff';g.beginPath();g.arc(b.x,b.y,r,0,7);g.fill();g.strokeStyle='#333';g.lineWidth=.8;g.stroke();
  g.fillStyle='#333';g.beginPath();g.arc(b.x-r*.2,b.y-r*.15,r*.32,0,7);g.fill();
}
function drawGoal(g,P,x){
  const d=x?1:-1,y1=30.34,y2=37.66,H=2.44,D=2;
  const a=P(x,y1,0),b=P(x,y2,0),c=P(x,y2,H),e=P(x,y1,H),a2=P(x+d*D,y1,0),b2=P(x+d*D,y2,0),c2=P(x+d*D,y2,H*.8),e2=P(x+d*D,y1,H*.8);
  g.fillStyle='rgba(255,255,255,.12)';g.beginPath();[e,c,c2,e2].forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.fill();
  g.beginPath();[a2,b2,c2,e2].forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fill();
  g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=.7;for(let i=1;i<6;i++){const yy=y1+(y2-y1)*i/6;const p1=P(x+d*D,yy,0),p2=P(x+d*D,yy,H*.8);g.beginPath();g.moveTo(p1.x,p1.y);g.lineTo(p2.x,p2.y);g.stroke()}
  g.strokeStyle='#fff';g.lineWidth=Math.max(1.5,a.s*.14);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(e.x,e.y);g.lineTo(c.x,c.y);g.lineTo(b.x,b.y);g.stroke();
}
function drawHud(g,W,H){
  const L=V3.L,st=V3.st;if(!L||!st)return;const hc=club(L.m.h),ac=club(L.m.a),ti=tickInfo(L.r,st.t);
  const txt=`${hc.short}  ${st.score.h} : ${st.score.a}  ${ac.short}`,mm=ti.ph===0?'':ti.ph===5?'i.E.':ti.x?`${ti.m}+${ti.x}'`:`${ti.m}'`;
  g.font='700 15px "Barlow Condensed",sans-serif';const tw=g.measureText(txt).width;
  g.fillStyle='rgba(8,14,28,.82)';g.fillRect(12,12,tw+70,26);g.fillStyle=V3.col.h;g.fillRect(12,12,4,26);g.fillStyle=V3.col.a;g.fillRect(16+tw+12,12,4,26);
  g.fillStyle='#fff';g.textAlign='left';g.textBaseline='middle';g.fillText(txt,22,25);
  g.fillStyle='#ffd23f';g.fillText(mm,tw+38,25);
  if(V3.scene&&V3.mode==='hl'){g.fillStyle='rgba(198,61,43,.9)';g.fillRect(W-92,12,80,22);g.fillStyle='#fff';g.font='700 13px "Barlow Condensed",sans-serif';g.textAlign='center';g.fillText('HIGHLIGHT',W-52,23)}
  else if(!L.done){g.fillStyle='rgba(198,61,43,.9)';g.fillRect(W-58,12,46,22);g.fillStyle='#fff';g.font='700 13px "Barlow Condensed",sans-serif';g.textAlign='center';g.fillText('LIVE',W-35,23)}
}
