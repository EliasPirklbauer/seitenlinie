'use strict';
/* =========================================================
   SEITENLINIE – Internationale Vereinswettbewerbe der Konföderationen
   Formate: swiss (Ligaphase), groups (Gruppen à 4), ko (nur K.-o.)
   ========================================================= */
const M=1e6;
const COMPS=[
 {key:'ucl',name:'UEFA Champions League',short:'UCL',confed:'UEFA',fmt:'swiss',n:36,rounds:8,direct:8,playoff:true,scheme:[4,4,4,4,3,2,2,2],fill:1,level:1,prize:{base:18.6*M,win:2.1*M,draw:.7*M,ko:[1*M,11*M,12.5*M,15*M,18.5*M],champ:6.5*M}},
 {key:'uel',name:'UEFA Europa League',short:'UEL',confed:'UEFA',fmt:'swiss',n:36,rounds:8,direct:8,playoff:true,scheme:[2,2,2,2,2,2,2,2],fill:1,level:2,prize:{base:4.3*M,win:.45*M,draw:.15*M,ko:[.3*M,1.75*M,2.5*M,3.5*M,6*M],champ:4*M}},
 {key:'uecl',name:'UEFA Conference League',short:'UECL',confed:'UEFA',fmt:'swiss',n:36,rounds:6,direct:8,playoff:true,scheme:[1,1,1,1,1,1,1,1],fill:1,level:3,prize:{base:3.2*M,win:.4*M,draw:.13*M,ko:[.2*M,.8*M,1.3*M,2*M,3*M],champ:2*M}},
 {key:'lib',name:'Copa Libertadores',short:'LIB',confed:'CONMEBOL',fmt:'groups',n:32,scheme:[7,6,3,3,3,3,2,2,2,1],level:1,prize:{base:3*M,win:.33*M,draw:0,ko:[1.25*M,1.7*M,2.3*M,7*M],champ:18*M}},
 {key:'sud',name:'Copa Sudamericana',short:'SUD',confed:'CONMEBOL',fmt:'groups',n:32,scheme:[6,6,3,3,3,3,2,2,2,2],level:2,prize:{base:.9*M,win:.1*M,draw:0,ko:[.5*M,.6*M,.8*M,2*M],champ:6*M}},
 {key:'ccc',name:'CONCACAF Champions Cup',short:'CCC',confed:'CONCACAF',fmt:'ko',n:16,scheme:[5,5,1,1,1,1,1,1],level:1,prize:{base:.3*M,win:0,draw:0,ko:[.3*M,.6*M,1.2*M,2*M],champ:5*M}},
 {key:'cafcl',name:'CAF Champions League',short:'CAFCL',confed:'CAF',fmt:'groups',n:16,scheme:[2,2,2,2,2,1,1,1,1,1,1],level:1,prize:{base:.7*M,win:.05*M,draw:0,ko:[.9*M,1.2*M,2*M],champ:4*M}},
 {key:'cafcc',name:'CAF Confederation Cup',short:'CAFCC',confed:'CAF',fmt:'groups',n:16,scheme:[2,2,2,2,1,1,1,1,1,1,1,1],level:2,prize:{base:.4*M,win:.03*M,draw:0,ko:[.4*M,.6*M,1*M],champ:2*M}},
 {key:'acle',name:'AFC Champions League Elite',short:'ACLE',confed:'AFC',fmt:'swiss',n:24,rounds:8,direct:16,playoff:false,scheme:[3,3,3,2,2,2,2,2,1,1,1,1,1],level:1,prize:{base:.8*M,win:.1*M,draw:.033*M,ko:[.3*M,.4*M,.6*M,2*M],champ:10*M}},
 {key:'acl2',name:'AFC Champions League Two',short:'ACL2',confed:'AFC',fmt:'groups',n:32,scheme:[2,2,2,2,2,2,2,2],fill:1,level:2,prize:{base:.3*M,win:.05*M,draw:0,ko:[.1*M,.15*M,.2*M,.5*M],champ:2.5*M}},
 {key:'ofc',name:'OFC Champions League',short:'OFC',confed:'OFC',fmt:'groups',n:8,scheme:[2,1,1,1,1,1,1],level:1,prize:{base:.05*M,win:.01*M,draw:0,ko:[.05*M,.1*M],champ:.3*M}},
];
const COMP=Object.fromEntries(COMPS.map(c=>[c.key,c]));
const GUEST_TEMPLATE={TW:[2,-8],IV:[2,1,-5],AV:[2,1,-5],DM:[1],ZM:[2,1,-4],OM:[1],FL:[2,-2],ST:[2,0,-5]};
const KO_NAMES={32:'Sechzehntelfinale',16:'Achtelfinale',8:'Viertelfinale',4:'Halbfinale',2:'Finale'};

function rankedAssocs(confed){return ASSOCS.filter(a=>a.confed===confed&&!(LEAGUE_DATA[a.code]||{}).noLeague).sort((a,b)=>coefTotal(b.code)-coefTotal(a.code)||b.str-a.str||a.code.localeCompare(b.code))}
function confedActive(confed){return S.active.some(c=>ASSOC[c].confed===confed)}

/* Startplätze nach Verbandsstärke: [{code,pos}] */
function allocateCodes(def,ranked){
  const out=[];
  ranked.forEach((a,i)=>{const k=def.scheme[i]!==undefined?def.scheme[i]:(def.fill||0);for(let j=0;j<k&&out.length<def.n;j++)out.push(a.code)});
  let j=0;while(out.length<def.n&&j<2000){out.push(ranked[j%ranked.length].code);j++}
  return out;
}
function slotTable(confed){
  const ranked=rankedAssocs(confed),res={};ranked.forEach(a=>res[a.code]={});
  for(const def of COMPS.filter(d=>d.confed===confed))for(const code of allocateCodes(def,ranked))res[code][def.key]=(res[code][def.key]||0)+1;
  return {ranked,res};
}
/* Reihenfolge der Vereine eines Landes für die Qualifikation */
function qualOrderActive(code){
  if(S.qualOrder&&S.qualOrder[code])return S.qualOrder[code].filter(id=>club(id)&&!club(id).guest);
  const L=S.leagues.find(l=>l.assoc===code&&l.tier===1);if(!L)return [];
  return [...L.clubs].sort((a,b)=>club(b).rep-club(a).rep);
}
function qualOrderBg(code){
  const st=assocStructure(code,S.seed);if(!st.length)return [];
  const names=st[0].clubs.map((n,i)=>({name:n,i,n:st[0].clubs.length}));
  const h=S.bg&&S.bg[code]&&S.bg[code][0];
  if(h){const k=names.findIndex(x=>x.name===h.champ);if(k>0){const c=names.splice(k,1)[0];names.unshift(c)}}
  return names;
}
function guestClub(name,code,idx,n){
  S.guests=S.guests||{};let c;
  if(S.guests[name]!==undefined)c=club(S.guests[name]);
  else{
    const rep=repFor(ASSOC[code],1,idx,n),econ=econOf(code,1);
    let sh=shortName(name);if(S.clubs.some(x=>x.assoc===code&&x.short===sh))sh=shortAlt(name);
    c={id:S.clubs.length,name,short:sh,assoc:code,league:null,guest:true,rep,econ,stadium:estStadium(rep,econ),colors:clubColors(name),budget:0,tBudget:0,wBudget:0,
      staff:staffForAssoc(name,S.seed,code),players:[],lineup:[],tactic:null,expRank:0,firedSeason:0};
    c.tactic={...COACH[c.staff.coach.trait].t};S.clubs.push(c);S.guests[name]=c.id;
  }
  for(const pid of c.players)delete S.players[pid];c.players=[];
  const baseQ=26+c.rep*.56;
  for(const pos in GUEST_TEMPLATE)for(const off of GUEST_TEMPLATE[pos]){const p=genPlayer(pos,baseQ+off+gauss()*3,randAge(),code);p.club=c.id;p.until=S.season+2;p.wage=rw(p.wage*c.econ);S.players[p.id]=p;c.players.push(p.id)}
  autoLineup(c);return c;
}
function releaseGuests(keep){
  for(const name in (S.guests||{})){const c=club(S.guests[name]);if(keep.has(c.id))continue;for(const pid of c.players)delete S.players[pid];c.players=[];c.lineup=[]}
}

/* ---------- Terminierung ---------- */
function compWeeks(def){
  const W=S.weeks,from=Math.max(1,Math.round(W*.1)),to=Math.max(from+1,Math.round(W*.5));
  const k=def.fmt==='swiss'?def.rounds:def.fmt==='groups'?6:0;
  const grp=[];for(let i=0;i<k;i++)grp.push(Math.round(from+(to-from)*(k>1?i/(k-1):0)));
  return {grp,koStart:k?to+2:from};
}
function koPlan(def,teams,startWeek,withPlayoff){
  // Anzahl K.-o.-Runden und Wochen; Final in letzter Woche
  const stages=withPlayoff?[teams]:[];let n=teams;while(n>=2){stages.push(n);n/=2}
  const W=S.weeks,finalW=W-1,nonFinal=stages.length-1;
  const span=finalW-startWeek;const twoLegs=span>=nonFinal*2+nonFinal;
  const plan=[];
  stages.forEach((sz,i)=>{
    if(sz===2){plan.push({size:2,legs:1,weeks:[finalW]});return}
    const base=startWeek+Math.floor(i*span/Math.max(1,nonFinal));
    plan.push({size:sz,legs:twoLegs?2:1,weeks:twoLegs?[base,Math.min(base+1,finalW-1)]:[Math.min(base,finalW-1)]});
  });
  return plan;
}

/* ---------- Wettbewerbe einer Saison anlegen ---------- */
function setupComps(){
  S.comps=[];S.compHist=S.compHist||{};S.coefSeason={};
  const keep=new Set(),placed=new Set();
  const key=e=>e.id!==undefined?'c'+e.id:'n'+e.name;
  for(const cf of CONFEDS){
    const defs=COMPS.filter(d=>d.confed===cf.id).sort((a,b)=>a.level-b.level);
    const ranked=rankedAssocs(cf.id),live=confedActive(cf.id),queues={};
    const getQ=code=>queues[code]||(queues[code]=S.active.includes(code)?qualOrderActive(code).map(id=>({id})):qualOrderBg(code).map(e=>({name:e.name,i:e.i,n:e.n})));
    const cupLevel=defs.length>1?2:1;
    for(const def of defs){
      const codes=allocateCodes(def,ranked);
      if(def.level===cupLevel){
        for(const code of new Set(codes)){const w=S.cupWinners&&S.cupWinners[code];if(!w)continue;
          const we=w.id!==undefined?{id:w.id}:{name:w.name,i:w.i,n:w.n};
          if(we.id!==undefined&&(!club(we.id)||club(we.id).guest||club(we.id).league===null))continue;
          if(placed.has(key(we)))continue;const q=getQ(code);const k=q.findIndex(e=>key(e)===key(we));if(k>=0)q.splice(k,1);q.unshift(we)}
      }
      const entries=[];
      for(const code of codes){const q=getQ(code);while(q.length&&placed.has(key(q[0])))q.shift();if(!q.length)continue;const e=q.shift();placed.add(key(e));entries.push({code,e})}
      for(const x of entries)coefClub(x.code);
      for(const x of entries)coefAdd(x.code,COEF_BONUS[def.level]||0);
      if(!live){S.comps.push({key:def.key,season:S.season,bg:true,entries:entries.map(x=>({code:x.code,name:x.e.name,rep:repFor(ASSOC[x.code],1,x.e.i,x.e.n)}))});continue}
      const teams=[];
      for(const x of entries){
        if(x.e.id!==undefined){if(!teams.includes(x.e.id))teams.push(x.e.id)}
        else{const g=guestClub(x.e.name,x.code,x.e.i,x.e.n);if(!teams.includes(g.id))teams.push(g.id)}
      }
      let j=0;while(teams.length<def.n&&j<500){const a=ranked[j%ranked.length];j++;if(S.active.includes(a.code))continue;
        const q=getQ(a.code);while(q.length&&placed.has(key(q[0])))q.shift();if(!q.length)continue;const e=q.shift();placed.add(key(e));coefClub(a.code);const g=guestClub(e.name,a.code,e.i,e.n);teams.push(g.id)}
      const mult=def.fmt==='groups'?4:2;teams.length=teams.length-teams.length%mult;
      teams.forEach(id=>{if(club(id).guest)keep.add(id)});
      S.comps.push(createComp(def,teams));
    }
  }
  releaseGuests(keep);
  for(const C of S.comps){if(C.bg)continue;const def=COMP[C.key];for(const id of C.teams)payPrize(club(id),def.prize.base,C)}
}
function createComp(def,teams){
  const C={key:def.key,season:S.season,teams:teams.slice(),rounds:[],stage:def.fmt==='ko'?'ko':def.fmt,groups:null,ko:[],koIdx:-1,winner:null,elim:{}};
  const wk=compWeeks(def);
  if(def.fmt==='swiss'){
    const rr=makeFixtures(teams);
    for(let r=0;r<def.rounds;r++)C.rounds.push({w:wk.grp[r],label:`Ligaphase · ${r+1}. Spieltag`,stage:'league',matches:rr[r].map(m=>({h:m.h,a:m.a,hg:null,ag:null}))});
  }else if(def.fmt==='groups'){
    const sorted=[...teams].sort((a,b)=>club(b).rep-club(a).rep),G=teams.length/4;C.groups=[];
    for(let g=0;g<G;g++)C.groups.push([]);
    // Lostöpfe: je ein Team pro Topf und Gruppe, möglichst kein Landesduell
    for(let pot=0;pot<4;pot++){const potT=sorted.slice(pot*G,pot*G+G);for(let i=potT.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[potT[i],potT[j]]=[potT[j],potT[i]]}
      for(let g=0;g<G;g++){let k=potT.findIndex(id=>!C.groups[g].some(x=>club(x).assoc===club(id).assoc));if(k<0)k=0;C.groups[g].push(potT.splice(k,1)[0])}}
    const perGroup=C.groups.map(g=>makeFixtures(g));
    for(let r=0;r<6;r++)C.rounds.push({w:wk.grp[r],label:`Gruppenphase · ${r+1}. Spieltag`,stage:'groups',matches:perGroup.flatMap(f=>f[r].map(m=>({h:m.h,a:m.a,hg:null,ag:null})))});
  }else{
    const sorted=[...teams].sort((a,b)=>club(b).rep-club(a).rep),n=sorted.length,pairs=[];
    for(let i=0;i<n/2;i++)pairs.push([sorted[i],sorted[n-1-i]]);
    startKO(C,def,pairs,wk.koStart);
  }
  return C;
}
function startKO(C,def,pairs,startWeek){
  C.plan=koPlan(def,pairs.length*2,startWeek,!!C.playoff);C.koIdx=-1;C.stage='ko';
  nextKOStage(C,def,pairs);
}
function nextKOStage(C,def,pairs){
  C.koIdx++;const pl=C.plan[C.koIdx]||{size:pairs.length*2,legs:1,weeks:[S.weeks-1]};
  const name=C.playoff&&C.koIdx===0?'K.-o.-Playoffs':KO_NAMES[pairs.length*2]||`Runde der letzten ${pairs.length*2}`;
  const stage={name,legs:pl.legs,ties:pairs.map(([a,b])=>({a,b,ga:0,gb:0,winner:null,pen:false})),rounds:[]};
  const stageIdx=C.ko.length;C.ko.push(stage);
  for(let l=0;l<pl.legs;l++){
    const ri=C.rounds.length;stage.rounds.push(ri);
    C.rounds.push({w:pl.weeks[l],label:pl.legs===2?`${name} · ${l===0?'Hinspiel':'Rückspiel'}`:name,stage:'ko',ko:stageIdx,leg:l,neutral:pl.size===2,
      matches:stage.ties.map((t,ti)=>l===0&&pl.legs===2?{h:t.b,a:t.a,hg:null,ag:null,tie:ti}:{h:t.a,a:t.b,hg:null,ag:null,tie:ti})});
  }
  // Prämie für das Erreichen der Runde
  const reach=def.prize.ko[Math.min(C.koIdx,def.prize.ko.length-1)]||0;
  for(const t of stage.ties){payPrize(club(t.a),reach,C);payPrize(club(t.b),reach,C);if(!(C.playoff&&C.koIdx===0)){coefAdd(club(t.a).assoc,1);coefAdd(club(t.b).assoc,1)}}
}
function payPrize(c,amount,C){
  if(!c||c.guest||!amount)return;c.budget+=amount;
  if(c.id===S.user&&S.fin){S.fin.cups=(S.fin.cups||0)+amount}
}

/* ---------- Tabellen ---------- */
function compTable(C,ids,stage){
  const t={};ids.forEach(id=>t[id]={id,sp:0,s:0,u:0,n:0,tf:0,ta:0,pts:0});
  for(const r of C.rounds){if(r.stage!==stage)continue;for(const m of r.matches){if(m.hg===null||!t[m.h]||!t[m.a])continue;const h=t[m.h],a=t[m.a];
    h.sp++;a.sp++;h.tf+=m.hg;h.ta+=m.ag;a.tf+=m.ag;a.ta+=m.hg;
    if(m.hg>m.ag){h.s++;a.n++;h.pts+=3}else if(m.hg<m.ag){a.s++;h.n++;a.pts+=3}else{h.u++;a.u++;h.pts++;a.pts++}}}
  return Object.values(t).sort((x,y)=>y.pts-x.pts||(y.tf-y.ta)-(x.tf-x.ta)||y.tf-x.tf||club(y.id).rep-club(x.id).rep);
}

/* ---------- Woche: Pokalspiele ---------- */
function playCompWeek(userList){
  const u=userClub();
  for(const C of S.comps||[]){
    if(C.bg||C.winner!==null)continue;const def=COMP[C.key];
    for(const r of C.rounds){
      if(r.w!==S.week||r.done)continue;
      const involved=new Set();r.matches.forEach(m=>{involved.add(m.h);involved.add(m.a)});
      for(const id of involved){const c=club(id);if(id===S.user){if(u.autoXI)autoLineup(u);const ch=fixLineup(u);if(ch.length)addNews('info','Aufstellung angepasst',`Für ${def.short}: ${ch.map(esc).join(', ')} rücken nach.`)}else autoLineup(c)}
      for(const m of r.matches){
        const isU=m.h===S.user||m.a===S.user;
        BIGMATCH=r.stage==='ko';const res=simMatch(club(m.h),club(m.a),isU,r.neutral);m.hg=res.hg;m.ag=res.ag;
        if(r.stage==='ko'){const st=C.ko[r.ko];if(st.legs===1||r.leg===st.legs-1){
          const agg={h:0,a:0};for(const ri of st.rounds){const pr=C.rounds[ri];if(pr===r)continue;const pm=pr.matches[m.tie];if(pm.hg===null)continue;if(pm.h===m.h){agg.h+=pm.hg;agg.a+=pm.ag}else{agg.h+=pm.ag;agg.a+=pm.hg}}
          resolveKO(m,res,isU,r.neutral,agg,true)}}
        BIGMATCH=false;
        for(const [id,gf,ga] of [[m.h,m.hg,m.ag],[m.a,m.ag,m.hg]]){if(r.stage!=='ko')payPrize(club(id),gf>ga?def.prize.win:gf===ga?def.prize.draw:0,C);coefAdd(club(id).assoc,gf>ga?2:gf===ga?1:0)}
        if(isU)userList.push({m,r:res,round:r,comp:C,label:`${def.name} · ${r.label}`});
      }
      r.done=true;
      advanceComp(C,def,r);
    }
  }
}
function decideTie(C,def,stage,t){
  // Gesamtergebnis
  let ga=0,gb=0;for(const ri of stage.rounds){const m=C.rounds[ri].matches[stage.ties.indexOf(t)];if(m.h===t.a){ga+=m.hg;gb+=m.ag}else{ga+=m.ag;gb+=m.hg}}
  t.ga=ga;t.gb=gb;
  const last=C.rounds[stage.rounds[stage.rounds.length-1]].matches[stage.ties.indexOf(t)];
  t.et=!!last.et;t.pen=!!last.pen;
  if(last.win!==undefined&&last.win!==null)t.winner=last.win;else t.winner=ga>=gb?t.a:t.b;
  const loser=t.winner===t.a?t.b:t.a;C.elim[loser]=stage.name;
}
function advanceComp(C,def,r){
  if(r.stage==='league'){
    if(C.rounds.some(x=>x.stage==='league'&&!x.done))return;
    const tab=compTable(C,C.teams,'league').map(x=>x.id);
    tab.slice(def.playoff?24:def.direct).forEach(id=>C.elim[id]='Ligaphase');
    const koStart=compWeeks(def).koStart;
    if(def.playoff){
      C.playoff=true;C.seeds=tab.slice(0,8);
      const po=[];for(let i=0;i<8;i++)po.push([tab[8+i],tab[23-i]]);
      startKO(C,def,po,koStart);
    }else{
      const top=tab.slice(0,def.direct),pairs=[];for(let i=0;i<top.length/2;i++)pairs.push([top[i],top[top.length-1-i]]);
      startKO(C,def,pairs,koStart);
    }
    return;
  }
  if(r.stage==='groups'){
    if(C.rounds.some(x=>x.stage==='groups'&&!x.done))return;
    const W=[],R=[];
    C.groups.forEach(g=>{const t=compTable(C,g,'groups');W.push(t[0].id);R.push(t[1].id);t.slice(2).forEach(x=>C.elim[x.id]='Gruppenphase')});
    const pairs=[];const G=W.length;
    for(let i=0;i<G;i++)pairs.push([W[i],R[(i+1)%G]]);
    startKO(C,def,pairs,compWeeks(def).koStart);
    return;
  }
  // K.-o.
  const stage=C.ko[r.ko];
  if(stage.rounds.some(ri=>!C.rounds[ri].done))return;
  stage.ties.forEach(t=>decideTie(C,def,stage,t));
  const winners=stage.ties.map(t=>t.winner);
  if(winners.length===1){finishComp(C,def,winners[0]);return}
  let pairs=[];
  if(C.playoff&&r.ko===0){C.playoff=false;const s=C.seeds;for(let i=0;i<8;i++)pairs.push([s[i],winners[7-i]])}
  else for(let i=0;i<winners.length;i+=2)pairs.push([winners[i],winners[i+1]]);
  nextKOStage(C,def,pairs);
}
function finishComp(C,def,winnerId){
  C.winner=winnerId;const w=club(winnerId);payPrize(w,def.prize.champ,C);coefAdd(w.assoc,2);
  w.rep=clamp(w.rep+(def.level===1?3:2),5,99);
  (S.compHist[def.key]=S.compHist[def.key]||[]).unshift({season:S.season,winner:w.name,assoc:w.assoc});
  if(S.compHist[def.key].length>15)S.compHist[def.key].length=15;
  if(winnerId===S.user)teamBonus('cu',def.name);
  if(winnerId===S.user)addNews('board',`🏆 ${def.name} gewonnen!`,`Dein ${esc(w.name)} holt den Titel! Prämie: ${money(def.prize.champ)}.`);
  else if(C.teams.includes(S.user)||def.confed===ASSOC[userClub().assoc].confed)addNews('info',`${esc(w.name)} gewinnt die ${def.name}`,`Saison ${S.season}/${(S.season+1)%100}.`);
}
/* Saisonende: offene Wettbewerbe abschließen, Hintergrund-Sieger ermitteln */
function closeComps(){
  for(const C of S.comps||[]){
    const def=COMP[C.key];
    if(C.bg){
      const cands=(C.entries||[]).map(e=>({name:e.name,assoc:e.code,rep:e.rep}));
      if(!cands.length)continue;const w=wpick(cands,x=>Math.pow(x.rep,4));
      const mean=cands.reduce((t,x)=>t+x.rep,0)/cands.length,games=def.fmt==='swiss'?def.rounds:def.fmt==='groups'?6:2;
      for(const x of cands){const f=clamp(Math.pow(x.rep/mean,2),.3,1.8);coefAdd(x.assoc,games*f*.95+(rnd()<.5*f?1+rnd()*3*f:0))}
      coefAdd(w.assoc,4);
      (S.compHist[def.key]=S.compHist[def.key]||[]).unshift({season:S.season,winner:w.name,assoc:w.assoc});if(S.compHist[def.key].length>15)S.compHist[def.key].length=15;
      continue;
    }
    if(C.winner===null){const alive=C.teams.filter(id=>!C.elim[id]);const w=alive.sort((a,b)=>club(b).rep-club(a).rep)[0]||C.teams[0];finishComp(C,def,w)}
  }
}
/* Spiele des Users in Wettbewerben */
function userCompFixtures(){
  const out=[];
  for(const C of S.comps||[]){if(C.bg)continue;const def=COMP[C.key];
    C.rounds.forEach(r=>r.matches.forEach(m=>{if(m.h===S.user||m.a===S.user)out.push({w:r.w,m,label:r.label,def,C,r})}))}
  return out;
}
function userComps(){return (S.comps||[]).filter(C=>!C.bg&&C.teams.includes(S.user))}
function compStatus(C,id){
  const def=COMP[C.key];
  if(C.winner===id)return '🏆 Sieger';
  if(C.elim[id])return 'ausgeschieden ('+C.elim[id]+')';
  if(C.stage==='ko'&&C.ko.length)return C.ko[C.ko.length-1].name;
  if(C.stage==='league'||C.stage==='swiss'){const t=compTable(C,C.teams,'league');return 'Ligaphase · Platz '+(t.findIndex(x=>x.id===id)+1)}
  if(C.stage==='groups'){const g=C.groups.find(g=>g.includes(id));const t=compTable(C,g,'groups');return 'Gruppe '+String.fromCharCode(65+C.groups.indexOf(g))+' · Platz '+(t.findIndex(x=>x.id===id)+1)}
  return '';
}
