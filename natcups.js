'use strict';
/* =========================================================
   SEITENLINIE – Nationale Pokale & Fünfjahreswertung
   ========================================================= */
const NATCUP_NAMES={GER:'DFB-Pokal',ENG:'FA Cup',ESP:'Copa del Rey',ITA:'Coppa Italia',FRA:'Coupe de France',NED:'KNVB-Beker',POR:'Taça de Portugal',BEL:'Belgischer Pokal',TUR:'Türkiye Kupası',SCO:'Scottish Cup',AUT:'ÖFB-Cup',SUI:'Schweizer Cup',DEN:'DBU Pokalen',SWE:'Svenska Cupen',NOR:'NM Cup',POL:'Puchar Polski',CZE:'Tschechischer Pokal',GRE:'Griechischer Pokal',CRO:'Kroatischer Pokal',SRB:'Serbischer Pokal',UKR:'Ukrainischer Pokal',RUS:'Russischer Pokal',ROU:'Cupa României',BUL:'Bulgarischer Pokal',HUN:'Magyar Kupa',CYP:'Zyprischer Pokal',ISR:'Israelischer Pokal',IRL:'FAI Cup',WAL:'Welsh Cup',NIR:'Irish Cup',SVK:'Slowakischer Pokal',SVN:'Slowenischer Pokal',BRA:'Copa do Brasil',ARG:'Copa Argentina',COL:'Copa Colombia',CHI:'Copa Chile',URU:'Copa AUF Uruguay',ECU:'Copa Ecuador',PAR:'Copa Paraguay',PER:'Copa Perú',MEX:'Copa MX',USA:'US Open Cup',CAN:'Canadian Championship',JPN:'Emperor’s Cup',KOR:'Korea Cup',KSA:'King’s Cup',QAT:'Emir Cup',UAE:'President’s Cup',IRN:'Hazfi Cup',CHN:'CFA Cup',AUS:'Australia Cup',EGY:'Egypt Cup',MAR:'Coupe du Trône',RSA:'Südafrikanischer Pokal',TUN:'Coupe de Tunisie',ALG:'Coupe d’Algérie',NGA:'Federation Cup',GHA:'FA Cup Ghana'};
function natCupName(code){return NATCUP_NAMES[code]||'Landespokal '+natName(code)}
function nextPow2(n){let p=1;while(p<n)p*=2;return p}
function cupRoundName(teams){return teams===2?'Finale':teams===4?'Halbfinale':teams===8?'Viertelfinale':teams===16?'Achtelfinale':null}

function setupNatCups(){
  S.ncups=[];
  for(const code of S.active){
    const ids=S.leagues.filter(L=>L.assoc===code).flatMap(L=>L.clubs);if(ids.length<4)continue;
    const bracket=nextPow2(ids.length),R=Math.log2(bracket),W=S.weeks,a=Math.max(1,Math.round(W*.08)),b=Math.max(a+R-1,W-2);
    const weeks=[];for(let r=0;r<R;r++)weeks.push(R>1?Math.round(a+(b-a)*r/(R-1)):b);
    const sorted=[...ids].sort((x,y)=>club(y).rep-club(x).rep),byes=bracket-ids.length;
    const cup={code,name:natCupName(code),season:S.season,bracket,weeks,rounds:[],byes:sorted.slice(0,byes),winner:null,out:{}};
    drawCupRound(cup,sorted.slice(byes),0);
    S.ncups.push(cup);
  }
}
function drawCupRound(cup,teams,r){
  const t=teams.slice();for(let i=t.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[t[i],t[j]]=[t[j],t[i]]}
  const left=cup.bracket/Math.pow(2,r),label=cupRoundName(left)||`${r+1}. Runde`,final=left===2;
  const matches=[];
  for(let i=0;i+1<t.length;i+=2){
    let h=t[i],a=t[i+1];const th=league(club(h)).tier,ta=league(club(a)).tier;
    if(!final&&ta>th){[h,a]=[a,h]}  // Unterklassiger hat Heimrecht
    matches.push({h,a,hg:null,ag:null,pen:false,win:null});
  }
  cup.rounds.push({w:cup.weeks[r]!==undefined?cup.weeks[r]:S.weeks-2,label,r,neutral:final,matches,done:false});
}
function natPrize(c,r,champ){if(!c||c.guest)return;const v=(champ?3e6:.25e6*Math.pow(1.8,r))*c.econ;c.budget+=v;if(c.id===S.user&&S.fin)S.fin.cups=(S.fin.cups||0)+v}
function playNatCupWeek(userList){
  const u=userClub();
  for(const cup of S.ncups||[]){
    if(cup.winner!==null)continue;
    const r=cup.rounds[cup.rounds.length-1];if(!r||r.done||r.w!==S.week)continue;
    for(const m of r.matches){
      for(const id of [m.h,m.a]){if(id===S.user){if(u.autoXI)autoLineup(u);fixLineup(u)}else autoLineup(club(id))}
      const isU=m.h===S.user||m.a===S.user;
      const res=simMatch(club(m.h),club(m.a),isU,r.neutral);m.hg=res.hg;m.ag=res.ag;
      if(m.hg!==m.ag)m.win=m.hg>m.ag?m.h:m.a;
      else{m.pen=true;const sh=clubAvg(club(m.h)),sa=clubAvg(club(m.a));m.win=rnd()<clamp(.5+(sh-sa)*.01,.3,.7)?m.h:m.a}
      const lose=m.win===m.h?m.a:m.h;cup.out[lose]=r.label;natPrize(club(m.win),r.r,false);
      if(isU)userList.push({m,r:res,round:r,cup,label:`${cup.name} · ${r.label}${m.pen?'':''}`});
    }
    r.done=true;
    const winners=r.matches.map(m=>m.win);
    if(cup.bracket/Math.pow(2,r.r)===2){finishNatCup(cup,winners[0]);continue}
    const next=r.r===0?winners.concat(cup.byes):winners;
    drawCupRound(cup,next,r.r+1);
  }
}
function finishNatCup(cup,id){
  cup.winner=id;const c=club(id);natPrize(c,0,true);c.rep=clamp(c.rep+1,5,99);
  S.cupWinners[cup.code]={id};
  (S.natHist[cup.code]=S.natHist[cup.code]||[]).unshift({season:S.season,winner:c.name});if(S.natHist[cup.code].length>15)S.natHist[cup.code].length=15;
  if(id===S.user)addNews('board',`🏆 ${cup.name} gewonnen!`,`Dein ${esc(c.name)} holt den Pokal – und damit einen internationalen Startplatz.`);
  else if(cup.code===userClub().assoc)addNews('info',`${esc(c.name)} gewinnt den ${cup.name}`,`Der Pokalsieger erhält einen internationalen Startplatz.`);
}
function closeNatCups(){
  for(const cup of S.ncups||[]){if(cup.winner!==null)continue;
    const alive=cup.rounds[cup.rounds.length-1].matches.flatMap(m=>[m.h,m.a]).filter(id=>!cup.out[id]);
    finishNatCup(cup,alive.sort((a,b)=>club(b).rep-club(a).rep)[0])}
  // Hintergrund-Länder
  for(const a of ASSOCS){
    if(S.active.includes(a.code))continue;const st=assocStructure(a.code,S.seed);if(!st.length)continue;
    const L=st[0],n=L.clubs.length;const e=wpick(L.clubs.map((name,i)=>({name,i,n})),x=>Math.pow(repFor(a,1,x.i,n),3));
    S.cupWinners[a.code]={name:e.name,i:e.i,n:e.n};
    (S.natHist[a.code]=S.natHist[a.code]||[]).unshift({season:S.season,winner:e.name});if(S.natHist[a.code].length>10)S.natHist[a.code].length=10;
  }
}
function userNatCupFixtures(){
  const out=[];for(const cup of S.ncups||[])cup.rounds.forEach(r=>r.matches.forEach(m=>{if(m.h===S.user||m.a===S.user)out.push({w:r.w,m,label:r.label,cup,r})}));return out;
}
function userNatCup(){return (S.ncups||[]).find(c=>c.code===userClub().assoc)}
function natCupStatus(cup,id){
  if(!cup)return '';if(cup.winner===id)return '🏆 Pokalsieger';if(cup.out[id])return 'ausgeschieden ('+cup.out[id]+')';
  const r=cup.rounds[cup.rounds.length-1];if(cup.byes.includes(id)&&cup.rounds.length===1)return 'Freilos in Runde 1';return r?r.label:'';
}

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
