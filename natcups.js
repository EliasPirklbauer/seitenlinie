'use strict';
/* =========================================================
   SEITENLINIE – Nationale Pokale (mit Amateuren), Supercups & Fünfjahreswertung
   ========================================================= */
const NATCUP_NAMES={GER:'DFB-Pokal',ENG:'FA Cup',ESP:'Copa del Rey',ITA:'Coppa Italia',FRA:'Coupe de France',NED:'KNVB-Beker',POR:'Taça de Portugal',BEL:'Belgischer Pokal',TUR:'Türkiye Kupası',SCO:'Scottish Cup',AUT:'ÖFB-Cup',SUI:'Schweizer Cup',DEN:'DBU Pokalen',SWE:'Svenska Cupen',NOR:'NM Cup',POL:'Puchar Polski',CZE:'Tschechischer Pokal',GRE:'Griechischer Pokal',CRO:'Kroatischer Pokal',SRB:'Serbischer Pokal',UKR:'Ukrainischer Pokal',RUS:'Russischer Pokal',ROU:'Cupa României',BUL:'Bulgarischer Pokal',HUN:'Magyar Kupa',CYP:'Zyprischer Pokal',ISR:'Israelischer Pokal',IRL:'FAI Cup',WAL:'Welsh Cup',NIR:'Irish Cup',SVK:'Slowakischer Pokal',SVN:'Slowenischer Pokal',BRA:'Copa do Brasil',ARG:'Copa Argentina',COL:'Copa Colombia',CHI:'Copa Chile',URU:'Copa AUF Uruguay',ECU:'Copa Ecuador',PAR:'Copa Paraguay',PER:'Copa Perú',MEX:'Copa MX',USA:'US Open Cup',CAN:'Canadian Championship',JPN:'Emperor’s Cup',KOR:'Korea Cup',KSA:'King’s Cup',QAT:'Emir Cup',UAE:'President’s Cup',IRN:'Hazfi Cup',CHN:'CFA Cup',AUS:'Australia Cup',EGY:'Egypt Cup',MAR:'Coupe du Trône',RSA:'Südafrikanischer Pokal',TUN:'Coupe de Tunisie',ALG:'Coupe d’Algérie',NGA:'Federation Cup',GHA:'FA Cup Ghana'};
function natCupName(code){return NATCUP_NAMES[code]||'Landespokal '+natName(code)}
function nextPow2(n){let p=1;while(p<n)p*=2;return p}
function cupRoundName(teams){return teams===2?'Finale':teams===4?'Halbfinale':teams===8?'Viertelfinale':teams===16?'Achtelfinale':teams===32?'Sechzehntelfinale':null}

/* ---------- Hilfen ---------- */
function isReserve(c){return /( II| B| U23)$|^Jong /.test(c.name)}
function tierOf(c){return c.amateur?9:c.guest?1:league(c).tier}
function tierLabel(c){return c.amateur?'Am.':c.guest?'G':league(c).tier+'.'}
/* Reihenfolge einer Liga: Abschlusstabelle der Vorsaison, sonst Stärke */
function tierOrder(code,tier,noReserve){
  const L=S.leagues.find(l=>l.assoc===code&&l.tier===tier);if(!L)return [];
  let ids=[...L.clubs];
  const prev=S.prevTables&&S.prevTables[L.id];
  if(prev)ids.sort((a,b)=>{const ia=prev.indexOf(a),ib=prev.indexOf(b);return (ia<0?999:ia)-(ib<0?999:ib)||club(b).rep-club(a).rep});
  else ids.sort((a,b)=>club(b).rep-club(a).rep);
  return noReserve?ids.filter(id=>!isReserve(club(id))):ids;
}
function allNonReserve(code){return S.leagues.filter(L=>L.assoc===code).sort((a,b)=>a.tier-b.tier).flatMap(L=>L.clubs).filter(id=>!isReserve(club(id)))}

/* ---------- Amateurvereine ---------- */
const AMA_USED={};
function amateurNames(code,n){
  const a=ASSOC[code];const towns=(AMATEUR_TOWNS[code]||a.cities.join(',')).split(',');
  const r=mkRng(hashStr('ama'+code)^S.seed^S.season);
  const pats=CLUB_PATTERNS[a.pool]||CLUB_PATTERNS.en;
  const taken=new Set(S.clubs.filter(c=>c.assoc===code&&!c.amateur).map(c=>c.name));
  const t=towns.slice();for(let i=t.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[t[i],t[j]]=[t[j],t[i]]}
  const out=[];let k=0;
  while(out.length<n&&k<n*6){
    const town=t[k%t.length],pass=Math.floor(k/t.length);k++;
    const nm=town.includes(' ')&&pass===0?town:pats[(Math.floor(r()*pats.length)+pass)%pats.length].replace('{c}',town);
    if(taken.has(nm)||out.includes(nm))continue;out.push(nm);
  }
  return out;
}
function amateurClub(name,code,strength){
  S.guests=S.guests||{};const key='AMA:'+code+':'+name;let c;
  if(S.guests[key]!==undefined)c=club(S.guests[key]);
  else{
    const econ=econOf(code,3)*.4;
    c={id:S.clubs.length,name,short:shortName(name),assoc:code,league:null,guest:true,amateur:true,rep:strength,econ,stadium:Math.round(2000+strength*60),colors:clubColors(name),budget:0,tBudget:0,wBudget:0,
      staff:staffForAssoc(name,S.seed,code),players:[],lineup:[],tactic:null,expRank:0,firedSeason:0};
    c.tactic={...COACH[c.staff.coach.trait].t};S.clubs.push(c);S.guests[key]=c.id;
  }
  c.rep=strength;
  for(const pid of c.players)delete S.players[pid];c.players=[];
  const baseQ=26+c.rep*.56;
  for(const pos in GUEST_TEMPLATE)for(const off of GUEST_TEMPLATE[pos]){const p=genPlayer(pos,baseQ+off+gauss()*3,randAge(),code);p.club=c.id;p.until=S.season+1;p.wage=rw(p.wage*c.econ);S.players[p.id]=p;c.players.push(p.id)}
  autoLineup(c);return c;
}
function makeAmateurs(code,n){
  if(n<=0)return [];const a=ASSOC[code];const names=amateurNames(code,n);
  // Stärke unterhalb der untersten simulierten Liga
  const tiers=S.leagues.filter(L=>L.assoc===code).length;const top=a.str-(tiers>=3?32:tiers===2?24:16);
  return names.map((nm,i)=>amateurClub(nm,code,clamp(Math.round(top-(i/Math.max(1,n-1))*12-rnd()*4),4,70)).id);
}

/* ---------- Pokalformate je Land ---------- */
/* Eine Runde: add = neue Teilnehmer, am = Anzahl neuer Amateure, legs, home ('lower'|'draw'|'higher'), pots (Profis vs. Unterklassige) */
function cupSpec(code){
  const T=(t,nr)=>tierOrder(code,t,nr!==false);
  const inComps=id=>(S.comps||[]).some(C=>!C.bg&&C.teams.includes(id));
  const sc=S.supercups&&S.supercups.find(x=>x.code===code);const scTeams=sc?sc.teams:[];
  switch(code){
    case 'GER':{const pros=[...T(1),...T(2)];const l3=T(3).slice(0,4);
      return {note:'64 Teams: Bundesliga, 2. Bundesliga, die besten 4 der 3. Liga (ohne zweite Mannschaften) und 24 Amateure. Runde 1 mit zwei Lostöpfen, Unterklassige haben immer Heimrecht.',
        rounds:[{name:'1. Runde',add:[...pros,...l3],am:24,pots:{a:pros},home:'lower'},{name:'2. Runde'},{name:'Achtelfinale'},{name:'Viertelfinale'},{name:'Halbfinale'},{name:'Finale',neutral:true}]}}
    case 'ENG':return {note:'Ab der 1. Hauptrunde: League One plus 56 Teams aus League Two und Non-League. Premier League und Championship steigen in Runde 3 ein. Heimrecht per Los, Halbfinale und Finale in Wembley.',
        rounds:[{name:'1. Runde',add:T(3,false),am:56,home:'draw'},{name:'2. Runde',home:'draw'},{name:'3. Runde',add:[...T(1),...T(2)],home:'draw'},{name:'4. Runde',home:'draw'},{name:'5. Runde',home:'draw'},{name:'Viertelfinale',home:'draw'},{name:'Halbfinale',neutral:true},{name:'Finale',neutral:true}]};
    case 'ESP':{const scIn=scTeams.filter(id=>club(id)&&!club(id).guest),l1=T(1).filter(id=>!scIn.includes(id)),l2=T(2),l3=T(3);const base=l1.length+l2.length+l3.length;const am=Math.max(0,4*(32-scIn.length)-base);
      return {note:'Alle Erst-, Zweit- und Drittligisten plus Amateure. Unterklassige haben Heimrecht. Die vier Supercopa-Teilnehmer steigen erst im Sechzehntelfinale ein. Halbfinale mit Hin- und Rückspiel.',
        rounds:[{name:'1. Runde',add:[...l1,...l2,...l3],am,home:'lower'},{name:'2. Runde',home:'lower'},{name:'Sechzehntelfinale',add:scIn,home:'lower'},{name:'Achtelfinale',home:'lower'},{name:'Viertelfinale',home:'lower'},{name:'Halbfinale',legs:2},{name:'Finale',neutral:true}]}}
    case 'ITA':{const a=T(1),b=T(2),c3=T(3).slice(0,4);const seeds=a.slice(0,8),a2=a.slice(8),bLow=b.slice(-4),bRest=b.slice(0,-4);
      return {note:'Serie A, Serie B und 4 Teams aus der Serie C. Die Top 8 der Serie A steigen erst im Achtelfinale ein. Der höher eingestufte Verein hat Heimrecht. Halbfinale mit Hin- und Rückspiel, Finale in Rom.',
        rounds:[{name:'Vorrunde',add:[...c3,...bLow],home:'higher'},{name:'1. Runde',add:[...bRest,...a2],home:'higher'},{name:'2. Runde',home:'higher'},{name:'Achtelfinale',add:seeds,home:'higher'},{name:'Viertelfinale',home:'higher'},{name:'Halbfinale',legs:2},{name:'Finale',neutral:true}]}}
    case 'FRA':{const l3=T(3).slice(0,8);
      return {note:'Ab den 1/32-Finals: Ligue 1, Ligue 2, 8 Teams aus der National und 20 Amateure. Unterklassige haben Heimrecht. Finale im Stade de France.',
        rounds:[{name:'1/32-Finale',add:[...T(1),...T(2),...l3],am:20,home:'lower'},{name:'1/16-Finale',home:'lower'},{name:'Achtelfinale',home:'lower'},{name:'Viertelfinale',home:'lower'},{name:'Halbfinale',home:'lower'},{name:'Finale',neutral:true}]}}
    case 'NED':{const ere=T(1),bye=ere.filter(inComps),r1=ere.filter(id=>!bye.includes(id)),eer=T(2);const size=2*(32-bye.length);const am=Math.max(0,size-r1.length-eer.length);
      return {note:'Eredivisie, Eerste Divisie (ohne Jong-Teams) und Amateure. Europapokal-Teilnehmer haben in Runde 1 ein Freilos. Finale in Rotterdam.',
        rounds:[{name:'1. Runde',add:[...r1,...eer],am,home:'lower'},{name:'2. Runde',add:bye,home:'lower'},{name:'Achtelfinale',home:'lower'},{name:'Viertelfinale',home:'lower'},{name:'Halbfinale',home:'lower'},{name:'Finale',neutral:true}]}}
    case 'POR':return {note:'Liga Portugal 2 (ohne B-Teams) ab Runde 2, die Primeira Liga ab Runde 3, dazu viele Amateure. Halbfinale mit Hin- und Rückspiel, Finale im Jamor.',
        rounds:[{name:'2. Runde',add:T(2),am:48,home:'lower'},{name:'3. Runde',add:T(1),am:14,home:'lower'},{name:'4. Runde',home:'lower'},{name:'Achtelfinale',home:'lower'},{name:'Viertelfinale',home:'lower'},{name:'Halbfinale',legs:2},{name:'Finale',neutral:true}]};
    case 'SCO':return {note:'Die Championship steigt in Runde 3 ein, die Premiership in Runde 4. Dazu kommen Teams aus League One, League Two, Highland und Lowland League. Halbfinale und Finale im Hampden Park.',
        rounds:[{name:'3. Runde',add:T(2),am:22,home:'draw'},{name:'4. Runde',add:T(1),am:4,home:'draw'},{name:'Achtelfinale',home:'draw'},{name:'Viertelfinale',home:'draw'},{name:'Halbfinale',neutral:true},{name:'Finale',neutral:true}]};
    case 'BRA':{const lib=(S.comps||[]).filter(C=>!C.bg&&C.key==='lib').flatMap(C=>C.teams).filter(id=>club(id).assoc==='BRA');
      const a=T(1).filter(id=>!lib.includes(id)),b=T(2);const size=2*(32-lib.length),am=Math.max(0,size-a.length-b.length);
      return {note:'Série A und Série B plus Teams aus den Bundesstaaten. Die Libertadores-Teilnehmer steigen im Sechzehntelfinale ein. Ab dort Hin- und Rückspiel, auch im Finale.',
        rounds:[{name:'3. Runde',add:[...a,...b],am,home:'lower'},{name:'Sechzehntelfinale',add:lib,legs:2},{name:'Achtelfinale',legs:2},{name:'Viertelfinale',legs:2},{name:'Halbfinale',legs:2},{name:'Finale',legs:2}]}}
    default:{
      const ids=allNonReserve(code);const closed=(LEAGUE_DATA[code]||{}).closed;
      const N=nextPow2(ids.length+Math.max(4,Math.ceil(ids.length*.5)));const am=N-ids.length;
      const rounds=[];let left=N;while(left>=2){rounds.push({name:cupRoundName(left)||`${rounds.length+1}. Runde`,home:'lower',neutral:left===2});left/=2}
      rounds[0].add=ids;rounds[0].am=am;
      return {note:`Alle Profivereine${closed?'':' aller Ligastufen'} plus ${am} Amateur- und Regionalvereine. Unterklassige haben Heimrecht, Finale auf neutralem Platz.`,rounds};
    }
  }
}

/* ---------- Pokal anlegen und spielen ---------- */
function setupNatCups(){
  S.ncups=[];
  const keepAm=new Set();
  for(const code of S.active){
    if(S.leagues.filter(L=>L.assoc===code).reduce((t,L)=>t+L.clubs.length,0)<4)continue;
    const spec=cupSpec(code);
    // Termine: jede Runde (bzw. jedes Hinspiel/Rückspiel) eine eigene Woche
    const legs=spec.rounds.reduce((t,r)=>t+(r.legs||1),0),W=S.weeks,a=Math.max(1,Math.round(W*.06)),b=Math.max(a+legs,W-2);
    const slots=[];for(let i=0;i<legs;i++)slots.push(Math.round(a+(b-a)*(legs>1?i/(legs-1):1)));
    const cup={code,name:natCupName(code),season:S.season,note:spec.note,spec:spec.rounds.map(r=>({name:r.name,legs:r.legs||1,home:r.home||'lower',neutral:!!r.neutral,add:(r.add||[]).slice(),am:r.am||0,pots:r.pots||null})),
      slots,stages:[],rounds:[],winner:null,out:{},runner:null};
    S.ncups.push(cup);
    drawCupStage(cup,[],0);
    cup.stages.forEach(st=>st.ties.forEach(t=>{for(const id of [t.a,t.b])if(club(id).amateur)keepAm.add(id)}));
  }
  // nicht mehr benötigte Amateurkader freigeben
  for(const k in (S.guests||{})){if(!k.startsWith('AMA:'))continue;const c=club(S.guests[k]);if(keepAm.has(c.id))continue;for(const pid of c.players)delete S.players[pid];c.players=[];c.lineup=[]}
}
function drawCupStage(cup,carry,si){
  const sp=cup.spec[si];
  let teams=[...carry,...sp.add.filter(id=>!carry.includes(id))];
  const ams=makeAmateurs(cup.code,sp.am);teams=teams.concat(ams);
  if(teams.length%2){const extra=makeAmateurs(cup.code,1);teams=teams.concat(extra)}
  const shuffle=t=>{for(let i=t.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[t[i],t[j]]=[t[j],t[i]]}return t};
  let pairs=[];
  if(sp.pots){
    const A=shuffle(teams.filter(id=>sp.pots.a.includes(id))),B=shuffle(teams.filter(id=>!sp.pots.a.includes(id)));
    while(A.length&&B.length)pairs.push([B.pop(),A.pop()]);
    const rest=shuffle(A.concat(B));for(let i=0;i+1<rest.length;i+=2)pairs.push([rest[i],rest[i+1]]);
  }else{const t=shuffle(teams);for(let i=0;i+1<t.length;i+=2)pairs.push([t[i],t[i+1]])}
  // Heimrecht
  pairs=pairs.map(([h,a])=>{
    if(sp.neutral)return [h,a];
    if(sp.home==='lower'&&tierOf(club(a))>tierOf(club(h)))return [a,h];
    if(sp.home==='higher'&&club(a).rep>club(h).rep)return [a,h];
    return [h,a];
  });
  const stage={name:sp.name,legs:sp.legs,ties:pairs.map(([a,b])=>({a,b,winner:null})),rounds:[],si};
  cup.stages.push(stage);
  const used=cup.rounds.length;
  for(let l=0;l<sp.legs;l++){
    const w=cup.slots[used+l]!==undefined?cup.slots[used+l]:S.weeks-2;
    stage.rounds.push(cup.rounds.length);
    cup.rounds.push({w:Math.max(w,S.week),label:sp.legs===2?`${sp.name} · ${l===0?'Hinspiel':'Rückspiel'}`:sp.name,si,leg:l,neutral:sp.neutral&&sp.legs===1,done:false,
      matches:stage.ties.map((t,ti)=>l===1?{h:t.b,a:t.a,hg:null,ag:null,tie:ti}:{h:t.a,a:t.b,hg:null,ag:null,tie:ti})});
  }
}
function natPrize(c,si,champ,n){if(!c||c.guest)return;const v=(champ?3e6:.2e6*Math.pow(1.7,si))*c.econ;c.budget+=v;if(c.id===S.user&&S.fin)S.fin.cups=(S.fin.cups||0)+v}
function playNatCupWeek(userList){
  const u=userClub();
  for(const cup of S.ncups||[]){
    if(cup.winner!==null)continue;
    for(const r of cup.rounds){
      if(r.done||r.w!==S.week)continue;
      const stage=cup.stages[cup.stages.length-1];if(stage.si!==r.si)continue;
      for(const m of r.matches){
        for(const id of [m.h,m.a]){if(id===S.user){if(u.autoXI)autoLineup(u);fixLineup(u)}else autoLineup(club(id))}
        const isU=m.h===S.user||m.a===S.user;
        BIGMATCH=stage.si>=cup.spec.length-3;const res=simMatch(club(m.h),club(m.a),isU,r.neutral);m.hg=res.hg;m.ag=res.ag;
        if(stage.legs===1||r.leg===1){
          const agg={h:0,a:0};if(r.leg===1){const pm=cup.rounds[stage.rounds[0]].matches[m.tie];agg.h=pm.ag;agg.a=pm.hg}
          resolveKO(m,res,isU,r.neutral,agg,true);
          const t=stage.ties[m.tie];t.winner=m.win;const lose=m.win===t.a?t.b:t.a;cup.out[lose]=stage.name;natPrize(club(m.win),stage.si,false);
        }
        BIGMATCH=false;
        if(isU)userList.push({m,r:res,round:r,cup,label:`${cup.name} · ${r.label}`});
      }
      r.done=true;
      if(stage.rounds.every(ri=>cup.rounds[ri].done)){
        const winners=stage.ties.map(t=>t.winner);
        if(stage.si===cup.spec.length-1||winners.length===1){const t=stage.ties[0];cup.runner=t.winner===t.a?t.b:t.a;finishNatCup(cup,winners[0])}
        else drawCupStage(cup,winners,stage.si+1);
      }
    }
  }
}
function finishNatCup(cup,id){
  cup.winner=id;const c=club(id);natPrize(c,0,true);c.rep=clamp(c.rep+1,5,99);
  if(id===S.user)teamBonus('cu',NATCUP_NAMES[cup.code]||'Pokalsieg');
  S.cupWinners[cup.code]={id};S.prevCup=S.prevCup||{};S.prevCup[cup.code]={winner:id,runner:cup.runner};
  (S.natHist[cup.code]=S.natHist[cup.code]||[]).unshift({season:S.season,winner:c.name});if(S.natHist[cup.code].length>15)S.natHist[cup.code].length=15;
  if(id===S.user)addNews('board',`🏆 ${cup.name} gewonnen!`,`Dein ${esc(c.name)} holt den Pokal – und damit einen internationalen Startplatz.`);
  else if(cup.code===userClub().assoc)addNews('info',`${esc(c.name)} gewinnt den ${cup.name}`,`${c.amateur?'Sensation: Ein Amateurverein holt den Pokal! ':''}Der Pokalsieger erhält einen internationalen Startplatz.`);
}
function closeNatCups(){
  for(const cup of S.ncups||[]){if(cup.winner!==null)continue;
    const st=cup.stages[cup.stages.length-1];const alive=st.ties.flatMap(t=>[t.a,t.b]).filter(id=>!cup.out[id]);
    const order=alive.sort((a,b)=>club(b).rep-club(a).rep);cup.runner=order[1]!==undefined?order[1]:null;finishNatCup(cup,order[0])}
  for(const a of ASSOCS){
    if(S.active.includes(a.code))continue;const st=assocStructure(a.code,S.seed);if(!st.length)continue;
    const L=st[0],n=L.clubs.length;const e=wpick(L.clubs.map((name,i)=>({name,i,n})),x=>Math.pow(repFor(a,1,x.i,n),3));
    S.cupWinners[a.code]={name:e.name,i:e.i,n:e.n};
    (S.natHist[a.code]=S.natHist[a.code]||[]).unshift({season:S.season,winner:e.name});if(S.natHist[a.code].length>10)S.natHist[a.code].length=10;
  }
}
function userNatCupFixtures(){const out=[];for(const cup of S.ncups||[])cup.rounds.forEach(r=>r.matches.forEach(m=>{if(m.h===S.user||m.a===S.user)out.push({w:r.w,m,label:r.label,cup,r})}));return out}
function userNatCup(){return (S.ncups||[]).find(c=>c.code===userClub().assoc)}
function natCupStatus(cup,id){
  if(!cup)return '';if(cup.winner===id)return '🏆 Pokalsieger';if(cup.out[id])return 'ausgeschieden ('+cup.out[id]+')';
  const st=cup.stages[cup.stages.length-1];if(st&&st.ties.some(t=>t.a===id||t.b===id))return st.name;
  const nxt=cup.spec.findIndex(sp=>sp.add.includes(id));return nxt>=0?'steigt ein: '+cup.spec[nxt].name:'';
}

/* =========================================================
   SUPERCUPS – Regeln je Land
   teams: 2 oder 4; double: wer rückt nach, wenn Meister = Pokalsieger
   ('league2' Vizemeister, 'cup2' Pokalfinalist, 'cancel' entfällt)
   venue: 'champion' (Heimspiel des Meisters) | 'neutral'; when: 'pre' (vor der Saison) | 'winter'
   et: Verlängerung (false = direkt Elfmeterschießen)
   ========================================================= */
const SUPERCUPS={
 GER:{name:'DFL-Supercup',teams:2,double:'league2',venue:'champion',when:'pre',et:false,prize:[1.5,1],rule:'Meister gegen Pokalsieger im Stadion des Meisters. Holt der Meister auch den Pokal, spielt der Vizemeister. Bei Remis direkt Elfmeterschießen.'},
 ENG:{name:'FA Community Shield',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[1,.6],rule:'Meister gegen FA-Cup-Sieger in Wembley. Beim Double spielt der Vizemeister. Bei Remis direkt Elfmeterschießen.'},
 ESP:{name:'Supercopa de España',teams:4,fill:'league',venue:'neutral',when:'winter',et:false,prize:[6,4,1.5],rule:'Final Four mit den Top 2 der LaLiga und den beiden Pokalfinalisten auf neutralem Platz (Saudi-Arabien). Halbfinale: Meister gegen Pokalfinalist, Pokalsieger gegen Vizemeister. Doppelte Teilnehmer werden durch die nächsten Ligaplätze ersetzt. Bei Remis direkt Elfmeterschießen.'},
 ITA:{name:'Supercoppa Italiana',teams:4,fill:'league',venue:'neutral',when:'winter',et:false,prize:[7,4,1.5],rule:'Final Four mit den Top 2 der Serie A und den beiden Coppa-Finalisten auf neutralem Platz (Saudi-Arabien). Doppelte Teilnehmer werden durch die nächsten Ligaplätze ersetzt. Bei Remis direkt Elfmeterschießen.'},
 FRA:{name:'Trophée des Champions',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[1.2,.6],rule:'Meister gegen Pokalsieger auf neutralem Platz, oft im Ausland. Beim Double spielt der Vizemeister. Bei Remis direkt Elfmeterschießen.'},
 NED:{name:'Johan Cruijff Schaal',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[.5,.25],rule:'Meister gegen KNVB-Beker-Sieger. Beim Double spielt der Vizemeister. Bei Remis direkt Elfmeterschießen.'},
 POR:{name:'Supertaça Cândido de Oliveira',teams:2,double:'cup2',venue:'neutral',when:'pre',et:false,prize:[.8,.4],rule:'Meister gegen Pokalsieger. Beim Double spielt der unterlegene Pokalfinalist. Bei Remis direkt Elfmeterschießen.'},
 TUR:{name:'Turkish Super Cup',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[.8,.4],rule:'Meister gegen Pokalsieger auf neutralem Platz. Beim Double spielt der Vizemeister.'},
 POL:{name:'Superpuchar Polski',teams:2,double:'league2',venue:'champion',when:'pre',et:false,prize:[.3,.15],rule:'Meister gegen Pokalsieger beim Meister. Beim Double spielt der Vizemeister.'},
 RUS:{name:'Russischer Supercup',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[.4,.2],rule:'Meister gegen Pokalsieger. Beim Double spielt der Vizemeister.'},
 ROU:{name:'Supercupa României',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[.2,.1],rule:'Meister gegen Pokalsieger. Beim Double spielt der Vizemeister.'},
 BUL:{name:'Bulgarischer Supercup',teams:2,double:'cup2',venue:'neutral',when:'pre',et:false,prize:[.1,.05],rule:'Meister gegen Pokalsieger. Beim Double spielt der unterlegene Pokalfinalist.'},
 CRO:{name:'Kroatischer Supercup',teams:2,double:'cancel',venue:'champion',when:'pre',et:false,prize:[.1,.05],rule:'Meister gegen Pokalsieger beim Meister. Holt der Meister auch den Pokal, findet der Supercup nicht statt.'},
 ISR:{name:'Israelischer Supercup',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[.2,.1],rule:'Meister gegen Pokalsieger. Beim Double spielt der Vizemeister.'},
 CYP:{name:'Zyprischer Supercup',teams:2,double:'cup2',venue:'neutral',when:'pre',et:false,prize:[.1,.05],rule:'Meister gegen Pokalsieger. Beim Double spielt der unterlegene Pokalfinalist.'},
 IRL:{name:'President’s Cup',teams:2,double:'league2',venue:'champion',when:'pre',et:false,prize:[.05,.02],rule:'Meister gegen FAI-Cup-Sieger beim Meister. Beim Double spielt der Vizemeister.'},
 BRA:{name:'Supercopa do Brasil',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[2,1],rule:'Meister der Série A gegen Sieger der Copa do Brasil auf neutralem Platz. Beim Double spielt der Vizemeister. Bei Remis direkt Elfmeterschießen.'},
 ARG:{name:'Supercopa Argentina',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[.8,.4],rule:'Meister gegen Sieger der Copa Argentina auf neutralem Platz. Beim Double spielt der Vizemeister.'},
 JPN:{name:'Japanischer Supercup',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[.5,.25],rule:'J1-Meister gegen Emperor’s-Cup-Sieger. Beim Double spielt der Vizemeister.'},
 KSA:{name:'Saudi Super Cup',teams:4,fill:'league',venue:'neutral',when:'pre',et:false,prize:[3,1.5,.7],rule:'Final Four mit den Top 2 der Liga und den beiden Finalisten des King’s Cup. Doppelte Teilnehmer werden durch die nächsten Ligaplätze ersetzt.'},
 UAE:{name:'UAE Super Cup',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[.3,.15],rule:'Meister gegen Pokalsieger. Beim Double spielt der Vizemeister.'},
 CHN:{name:'Chinesischer Supercup',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[.3,.15],rule:'Meister gegen CFA-Cup-Sieger. Beim Double spielt der Vizemeister.'},
 EGY:{name:'Ägyptischer Supercup',teams:2,double:'cup2',venue:'neutral',when:'pre',et:false,prize:[.2,.1],rule:'Meister gegen Pokalsieger. Beim Double spielt der unterlegene Pokalfinalist.'},
 ALG:{name:'Algerischer Supercup',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[.1,.05],rule:'Meister gegen Pokalsieger. Beim Double spielt der Vizemeister.'},
 TUN:{name:'Tunesischer Supercup',teams:2,double:'league2',venue:'neutral',when:'pre',et:false,prize:[.1,.05],rule:'Meister gegen Pokalsieger. Beim Double spielt der Vizemeister.'},
};
function setupSupercups(){
  S.supercups=[];
  for(const code of S.active){
    const rule=SUPERCUPS[code];if(!rule)continue;
    const L=S.leagues.find(l=>l.assoc===code&&l.tier===1);const prev=S.prevTables&&L&&S.prevTables[L.id];const cup=S.prevCup&&S.prevCup[code];
    if(!prev||!cup||cup.winner===null||cup.winner===undefined)continue;
    const champ=prev[0],second=prev[1];
    const ok=id=>id!==undefined&&id!==null&&club(id)&&!club(id).guest;
    let teams=[],pairs=[],info='';
    if(rule.teams===2){
      let opp=cup.winner;
      if(opp===champ){
        if(rule.double==='cancel'){addNewsIf(code,`${rule.name} entfällt`,`${esc(club(champ).name)} hat Meisterschaft und Pokal gewonnen – nach den Regeln findet der ${rule.name} in diesem Jahr nicht statt.`);S.supercups.push({code,name:rule.name,rule,teams:[],cancelled:true,season:S.season,matches:[],winner:null});continue}
        opp=rule.double==='cup2'?cup.runner:second;info=rule.double==='cup2'?'Double des Meisters – der Pokalfinalist rückt nach.':'Double des Meisters – der Vizemeister rückt nach.';
      }
      if(!ok(champ)||!ok(opp))continue;teams=[champ,opp];pairs=[[champ,opp]];
    }else{
      const want=[prev[0],prev[1],cup.winner,cup.runner];const seen=new Set();let k=2;const list=[];
      for(const id of want){let x=id;while(!ok(x)||seen.has(x)){x=prev[k++];if(x===undefined)break}if(x!==undefined){seen.add(x);list.push(x)}}
      if(list.length<4)continue;const [c1,c2,p1,p2]=list;teams=list;pairs=[[c1,p2],[p1,c2]];
      if(new Set(want).size<4)info='Doppelte Qualifikation – die nächsten Ligaplätze rücken nach.';
    }
    const w0=rule.when==='winter'?winterStart():0;
    const sc={code,name:rule.name,rule,teams,info,season:S.season,winner:null,rounds:[]};
    if(pairs.length===2){sc.rounds.push({w:w0,label:'Halbfinale',neutral:true,matches:pairs.map(([h,a])=>({h,a,hg:null,ag:null}))});sc.rounds.push({w:w0+1,label:'Finale',neutral:true,matches:[]})}
    else sc.rounds.push({w:w0,label:'Finale',neutral:rule.venue==='neutral',matches:pairs.map(([h,a])=>({h,a,hg:null,ag:null}))});
    S.supercups.push(sc);
  }
}
function addNewsIf(code,t,b){if(code===userClub().assoc)addNews('info',t,b)}
function playSupercupWeek(userList){
  const u=userClub();
  for(const sc of S.supercups||[]){
    if(sc.cancelled||sc.winner!==null)continue;
    sc.rounds.forEach((r,ri)=>{
      if(r.done||r.w!==S.week||!r.matches.length)return;
      for(const m of r.matches){
        for(const id of [m.h,m.a]){if(id===S.user){if(u.autoXI)autoLineup(u);fixLineup(u)}else autoLineup(club(id))}
        const isU=m.h===S.user||m.a===S.user;BIGMATCH=true;const res=simMatch(club(m.h),club(m.a),isU,r.neutral);m.hg=res.hg;m.ag=res.ag;
        resolveKO(m,res,isU,r.neutral,{h:0,a:0},sc.rule.et);BIGMATCH=false;
        if(isU)userList.push({m,r:res,round:r,sc,label:`${sc.name} · ${r.label}`});
      }
      r.done=true;
      const P=sc.rule.prize;
      if(r.label==='Halbfinale'){const fin=sc.rounds[ri+1];const w=r.matches.map(m=>m.win);r.matches.forEach(m=>{const l=m.win===m.h?m.a:m.h;scPrize(club(l),P[2])});fin.matches=[{h:w[0],a:w[1],hg:null,ag:null}]}
      else{const m=r.matches[0];sc.winner=m.win;const l=m.win===m.h?m.a:m.h;scPrize(club(m.win),P[0]);scPrize(club(l),P[1]);club(m.win).rep=clamp(club(m.win).rep+.5,5,99);
        (S.scHist[sc.code]=S.scHist[sc.code]||[]).unshift({season:S.season,winner:club(m.win).name});if(S.scHist[sc.code].length>15)S.scHist[sc.code].length=15;
        if(m.win===S.user)addNews('board',`🏆 ${sc.name} gewonnen!`,`Dein ${esc(club(m.win).name)} holt den ersten Titel der Saison.`);
        else if(sc.code===u.assoc)addNews('info',`${esc(club(m.win).name)} gewinnt den ${sc.name}`,`${resultText(m)} gegen ${esc(club(l).name)}.`)}
    });
  }
}
function scPrize(c,mio){if(!c||c.guest||!mio)return;const v=mio*1e6;c.budget+=v;if(c.id===S.user&&S.fin)S.fin.cups=(S.fin.cups||0)+v}
function userSupercupFixtures(){const out=[];for(const sc of S.supercups||[])sc.rounds.forEach(r=>r.matches.forEach(m=>{if(m.h===S.user||m.a===S.user)out.push({w:r.w,m,label:r.label,sc,r})}));return out}
function userSupercup(){return (S.supercups||[]).find(s=>s.code===userClub().assoc&&s.teams.includes(S.user))}

/* ---------- Fünfjahreswertung ---------- */
const COEF_BONUS={1:4,2:1,3:.5};
function initCoef(){
  const h={};
  for(const a of ASSOCS){const r=mkRng(hashStr('coef'+a.code)),base=22*Math.pow(clamp((a.str-25)/70,0,1.2),2.2);
    h[a.code]=[];for(let i=0;i<5;i++)h[a.code].push(Math.round(base*(.8+r()*.4)*1000)/1000)}
  return h;
}
function coefTotal(code){return (S.coefHist&&S.coefHist[code]||[]).reduce((s,v)=>s+v,0)}
function coefAdd(code,pts){if(!S.coefSeason)S.coefSeason={};const e=S.coefSeason[code]||(S.coefSeason[code]={pts:0,n:0});e.pts+=pts}
function coefClub(code){if(!S.coefSeason)S.coefSeason={};const e=S.coefSeason[code]||(S.coefSeason[code]={pts:0,n:0});e.n++}
function coefSeasonValue(code){const e=S.coefSeason&&S.coefSeason[code];return e&&e.n?e.pts/e.n:0}
function finalizeCoef(){
  for(const a of ASSOCS){const h=S.coefHist[a.code]=S.coefHist[a.code]||[];h.unshift(Math.round(coefSeasonValue(a.code)*1000)/1000);h.length=Math.min(h.length,5)}
  S.coefLast=S.season;S.coefSeason={};
}
