'use strict';
/* =========================================================
   SEITENLINIE – Engine (v0.4: Weltfußball mit 211 Verbänden)
   ========================================================= */
const SAVE_KEY='seitenlinie_save_v4';
const META_KEY='seitenlinie_meta';
const OLD_KEYS=['seitenlinie_save_v1'];
const VERSION=9;
const APP_VERSION='0.14.2';

/* ---------- Zufall ---------- */
let RNG=1;
function rnd(){RNG|=0;RNG=RNG+0x6D2B79F5|0;let t=Math.imul(RNG^RNG>>>15,1|RNG);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
function mkRng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const pick=a=>a[Math.floor(rnd()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function gauss(){let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function wpick(items,wf,r){r=r||rnd;let tot=0;const ws=items.map(i=>{const w=Math.max(0,wf(i));tot+=w;return w});let x=r()*tot;for(let i=0;i<items.length;i++){x-=ws[i];if(x<=0)return items[i]}return items[items.length-1]}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- Weltdaten aufbereiten ---------- */
const ASSOCS=ASSOC_DATA.trim().split('\n').map(r=>{const [code,name,confed,str,pool,cities]=r.split('|');return {code,name,confed,str:+str,pool,cities:cities.split(',')}});
const ASSOC=Object.fromEntries(ASSOCS.map(a=>[a.code,a]));
const POOLS={};
function poolArr(k){if(!POOLS[k]){const p=NAME_POOLS[k]||NAME_POOLS.en;POOLS[k]={f:p.f.split('|'),l:p.l.split('|')}}return POOLS[k]}
const NAT_WEIGHTS=ASSOCS.map(a=>({code:a.code,w:Math.pow(a.str,2.4)}));

/* ---------- Stammdaten Spiel ---------- */
/* ---------- Attribute im Stil des Football Manager (1–20) ----------
   Gespeichert als kompakter Text: ein Zeichen pro Attribut (A=1 … T=20). */
const ATTR_DEF=[
 // Technik
 ['cor','Ecken','tech'],['cro','Flanken','tech'],['dri','Dribbling','tech'],['fin','Abschluss','tech'],['fir','Ballannahme','tech'],['fre','Freistöße','tech'],['hea','Kopfball','tech'],
 ['lon','Weitschüsse','tech'],['lth','Weite Einwürfe','tech'],['mar','Manndeckung','tech'],['pas','Passen','tech'],['pen','Elfmeter','tech'],['tck','Tackling','tech'],['tec','Technik','tech'],
 // Mental
 ['agg','Aggressivität','ment'],['ant','Antizipation','ment'],['bra','Mut','ment'],['cmp','Nervenstärke','ment'],['cnt','Konzentration','ment'],['dec','Entscheidungen','ment'],['det','Entschlossenheit','ment'],
 ['fla','Flair','ment'],['ldr','Führungsqualität','ment'],['otb','Spiel ohne Ball','ment'],['pos','Stellungsspiel','ment'],['tea','Teamwork','ment'],['vis','Übersicht','ment'],['wor','Laufbereitschaft','ment'],
 // Physis
 ['acc','Antritt','phys'],['agi','Beweglichkeit','phys'],['bal','Balance','phys'],['jum','Sprungkraft','phys'],['nat','Grundfitness','phys'],['pac','Schnelligkeit','phys'],['sta','Ausdauer','phys'],['str','Kraft','phys'],
 // Torwart
 ['aer','Reichweite','gk'],['cmd','Strafraumbeherrsch.','gk'],['com','Kommunikation','gk'],['ecc','Exzentrik','gk'],['han','Fangsicherheit','gk'],['kic','Abschlag','gk'],['ovo','Eins-gegen-eins','gk'],
 ['ref','Reflexe','gk'],['rus','Herauslaufen','gk'],['pun','Fausten','gk'],['thr','Abwurf','gk'],
 // Versteckt
 ['con','Beständigkeit','hid'],['imp','Große Spiele','hid'],['inp','Verletzungsanfälligkeit','hid'],['ver','Vielseitigkeit','hid'],['prf','Professionalität','hid'],['amb','Ehrgeiz','hid'],['tmp','Temperament','hid'],['ada','Anpassungsfähigkeit','hid']];
const ATTR_KEYS=ATTR_DEF.map(d=>d[0]);
const AIDX=Object.fromEntries(ATTR_KEYS.map((k,i)=>[k,i]));
const ATTR_LABEL=Object.fromEntries(ATTR_DEF.map(d=>[d[0],d[1]]));
const ATTR_GROUP=Object.fromEntries(ATTR_DEF.map(d=>[d[0],d[2]]));
function at(p,k){return p.at.charCodeAt(AIDX[k])-64}
function decodeAt(p){const a=new Array(ATTR_KEYS.length);for(let i=0;i<a.length;i++)a[i]=p.at.charCodeAt(i)-64;return a}
function encodeAt(arr){return String.fromCharCode(...arr.map(v=>64+clamp(Math.round(v),1,20)))}
const POS_LIST=['TW','IV','AV','DM','ZM','OM','FL','ST'];
const POS_LABEL={TW:'Torwart',IV:'Innenverteidiger',AV:'Außenverteidiger',DM:'Defensives Mittelfeld',ZM:'Zentrales Mittelfeld',OM:'Offensives Mittelfeld',FL:'Flügel',ST:'Stürmer'};
const GROUP={TW:'TW',IV:'ABW',AV:'ABW',DM:'MIT',ZM:'MIT',OM:'MIT',FL:'ANG',ST:'ANG'};
const GROUP_COLOR={TW:'#f0bf4c',ABW:'#5aa9f0',MIT:'#38d47c',ANG:'#ef5d5d'};
/* Gewichtung der Attribute je Position (Schlüsselattribute wie im FM) */
const WEIGHTS={
 TW:{ref:6,ovo:4,han:4,aer:3,cmd:3,com:2,pos:3,cnt:2,dec:2,agi:3,kic:1,thr:1,fir:1,pas:1,cmp:1,ant:1},
 IV:{mar:4,tck:4,hea:4,pos:4,jum:3,str:3,ant:2,cnt:2,dec:2,bra:2,pac:2,cmp:1,acc:1,pas:1,fir:1,agg:1,tea:1},
 AV:{tck:3,mar:3,pos:3,pac:3,sta:3,acc:2,wor:2,cro:2,pas:2,ant:2,cnt:2,dec:2,tea:2,agi:1,dri:1,fir:1,tec:1,otb:1},
 DM:{tck:4,pos:4,ant:3,pas:3,dec:3,cnt:2,tea:2,wor:2,sta:2,str:2,mar:2,fir:2,cmp:2,agg:1,bra:1,vis:1,tec:1},
 ZM:{pas:4,dec:3,fir:3,tec:3,vis:3,tea:3,wor:2,sta:2,ant:2,cmp:2,otb:2,tck:2,dri:1,lon:1,cnt:1,pos:1,acc:1,agi:1},
 OM:{vis:4,tec:4,pas:3,fir:3,dec:3,dri:3,otb:3,fla:2,cmp:2,ant:2,lon:2,fin:2,agi:2,acc:1,tea:1},
 FL:{pac:4,acc:4,dri:4,cro:3,tec:3,agi:3,fir:2,otb:2,wor:2,sta:2,fla:2,pas:2,dec:1,fin:1,bal:1},
 ST:{fin:5,otb:4,cmp:3,fir:3,ant:3,pac:3,acc:3,hea:2,tec:2,dri:2,str:2,dec:2,jum:1,agi:1,bal:1,lon:1}};
const WSUM=Object.fromEntries(Object.entries(WEIGHTS).map(([k,w])=>[k,Object.values(w).reduce((a,b)=>a+b,0)]));
const WIDX=Object.fromEntries(Object.entries(WEIGHTS).map(([k,w])=>[k,Object.entries(w).map(([a,v])=>[AIDX[a],v])]));
const POS_IDX=Object.fromEntries(['TW','IV','AV','DM','ZM','OM','FL','ST'].map((p,i)=>[p,i]));
const FAM_LABEL=f=>f>=19?'Natürlich':f>=15?'Routiniert':f>=11?'Solide':f>=7?'Unsicher':'Ungeeignet';
const FAM={'AV-FL':.85,'FL-AV':.82,'OM-ST':.88,'ST-OM':.85,'DM-IV':.88,'IV-DM':.85,'OM-FL':.9,'FL-OM':.88,'DM-ZM':.95,'ZM-DM':.93,'ZM-OM':.93,'OM-ZM':.92,'IV-AV':.85,'AV-IV':.85,'FL-ST':.88,'ST-FL':.86};
const ADJ={'ABW-MIT':1,'MIT-ABW':1,'MIT-ANG':1,'ANG-MIT':1};
const FORMATIONS={
 '4-4-2':{s:['TW','AV','IV','IV','AV','FL','ZM','ZM','FL','ST','ST'],xy:[[50,92],[12,72],[37,77],[63,77],[88,72],[12,45],[37,52],[63,52],[88,45],[37,18],[63,18]]},
 '4-3-3':{s:['TW','AV','IV','IV','AV','ZM','DM','ZM','FL','ST','FL'],xy:[[50,92],[12,72],[37,77],[63,77],[88,72],[27,47],[50,59],[73,47],[15,22],[50,14],[85,22]]},
 '4-2-3-1':{s:['TW','AV','IV','IV','AV','DM','DM','FL','OM','FL','ST'],xy:[[50,92],[12,72],[37,77],[63,77],[88,72],[36,58],[64,58],[14,33],[50,37],[86,33],[50,13]]},
 '4-5-1':{s:['TW','AV','IV','IV','AV','FL','ZM','DM','ZM','FL','ST'],xy:[[50,92],[12,72],[37,77],[63,77],[88,72],[12,42],[31,46],[50,59],[69,46],[88,42],[50,15]]},
 '5-3-2':{s:['TW','AV','IV','IV','IV','AV','ZM','DM','ZM','ST','ST'],xy:[[50,92],[8,62],[28,77],[50,79],[72,77],[92,62],[27,45],[50,56],[73,45],[37,18],[63,18]]},
 '3-5-2':{s:['TW','IV','IV','IV','FL','ZM','DM','ZM','FL','ST','ST'],xy:[[50,92],[28,77],[50,79],[72,77],[8,45],[31,46],[50,59],[69,46],[92,45],[37,18],[63,18]]},
};
const MENTALITY={defensiv:'Defensiv',ausgewogen:'Ausgewogen',offensiv:'Offensiv'};
const PRESSING={niedrig:'Tief stehen',mittel:'Mittelfeldpressing',hoch:'Gegenpressing'};
const STYLE={normal:'Direkt',ballbesitz:'Ballbesitz',konter:'Konter'};
const PRES={
 ambitioniert:{label:'Ambitioniert',desc:'Will schnellen Erfolg, gibt viel aus und feuert Trainer früh.',sellMul:1.5,patience:.5,tShare:.7,wRatio:.82,saleBack:1},
 geduldig:{label:'Geduldig',desc:'Langfristiges Denken, lässt dem Trainer Zeit.',sellMul:1.3,patience:1.6,tShare:.5,wRatio:.72,saleBack:.75},
 sparsam:{label:'Sparsam',desc:'Hält das Geld zusammen, verkauft eher.',sellMul:1.12,patience:1,tShare:.3,wRatio:.62,saleBack:.5},
};
const ROLES={
 schluessel:{label:'Schlüsselspieler',short:'Schlüssel',exp:.9,wage:1.25},stamm:{label:'Stammspieler',short:'Stamm',exp:.7,wage:1.1},
 rotation:{label:'Rotationsspieler',short:'Rotation',exp:.4,wage:1},ergaenzung:{label:'Ergänzungsspieler',short:'Ergänzung',exp:.15,wage:.9},
 perspektive:{label:'Perspektivspieler',short:'Perspektive',exp:.1,wage:.8}};
const ROLE_ORDER=['schluessel','stamm','rotation','ergaenzung','perspektive'];
const DIR={
 jugend:{label:'Talentscout',desc:'Kauft junge Spieler mit hohem Potenzial, starke Nachwuchsarbeit.'},
 erfahrung:{label:'Routinier-Fan',desc:'Holt erfahrene Spieler, die sofort helfen.'},
 schnaeppchen:{label:'Schnäppchenjäger',desc:'Sucht unterbewertete Spieler mit gutem Preis-Leistungs-Verhältnis.'},
 star:{label:'Star-Jäger',desc:'Will die stärksten Namen, egal was sie kosten.'}};
const COACH={
 offensiv:{label:'Offensivfanatiker',desc:'4-3-3, offensiv, hohes Pressing.',t:{f:'4-3-3',men:'offensiv',press:'hoch',style:'normal'}},
 defensiv:{label:'Betonmischer',desc:'5-3-2, defensiv, steht tief.',t:{f:'5-3-2',men:'defensiv',press:'niedrig',style:'konter'}},
 ballbesitz:{label:'Ballbesitz-Stratege',desc:'4-2-3-1, kontrolliert das Spiel über Passquoten.',t:{f:'4-2-3-1',men:'ausgewogen',press:'mittel',style:'ballbesitz'}},
 konter:{label:'Konterspezialist',desc:'4-4-2, lauert auf Umschaltmomente.',t:{f:'4-4-2',men:'defensiv',press:'mittel',style:'konter'}},
 pressing:{label:'Pressing-Maschine',desc:'4-2-3-1, aggressives Gegenpressing, hoher Kraftverbrauch.',t:{f:'4-2-3-1',men:'offensiv',press:'hoch',style:'normal'}},
 pragmatiker:{label:'Pragmatiker',desc:'Passt die Ausrichtung an jeden Gegner an.',t:{f:'4-4-2',men:'ausgewogen',press:'mittel',style:'normal'},adaptive:true},
 rotation:{label:'Rotations-Fan',desc:'4-5-1, achtet extrem auf Fitness und rotiert viel.',t:{f:'4-5-1',men:'ausgewogen',press:'mittel',style:'ballbesitz'},rotate:true},
};
const SQUAD_TEMPLATE={TW:[2,-6,-12],IV:[2,1,-4,-8],AV:[2,1,-5,-8],DM:[1,-5],ZM:[2,1,-4,-7],OM:[1,-5],FL:[2,0,-6],ST:[2,0,-6]};
const TIER_ECON=[1,.45,.25];
const COLOR_PAIRS=[['#c8102e','#ffffff'],['#f5d000','#111111'],['#1d4ed8','#ffffff'],['#ffffff','#d00000'],['#111111','#e11d1d'],['#60a5fa','#ffffff'],['#dc2626','#facc15'],['#16a34a','#ffffff'],['#1e3a8a','#ffffff'],['#0ea5e9','#111111'],['#e11d48','#ffffff'],['#7c3aed','#ffffff'],['#0f766e','#facc15'],['#f97316','#111111'],['#065f46','#ffffff'],['#facc15','#1e3a8a'],['#991b1b','#facc15'],['#ffffff','#111111'],['#111111','#ffffff'],['#be123c','#1e3a8a']];

/* ---------- Spielzustand ---------- */
let S=null;
let CACHE={tables:{},posIdx:null,ovr:new Map(),rate:new Map()};
function resetCache(){CACHE={tables:{},posIdx:null,ovr:new Map(),rate:new Map()}}

/* ---------- Verbände: Ligenstruktur (deterministisch, auch für Vorschau) ---------- */
function defaultSize(a){return a.str>=60?16:a.str>=50?14:a.str>=40?12:a.str>=28?10:8}
function econOf(code,tier){return clamp(Math.pow(ASSOC[code].str/90,3)*TIER_ECON[tier-1],.02,1.15)}
function repFor(a,tier,i,n){const s=a.str;const [top,bot]=tier===1?[s+6,s-14]:tier===2?[s-10,s-22]:[s-19,s-30];return clamp(Math.round(top-(top-bot)*Math.pow(n>1?i/(n-1):0,.75)),5,99)}
function genClubNames(a,n,r,used){
  const pats=CLUB_PATTERNS[a.pool]||CLUB_PATTERNS.en,out=[];
  const cities=a.cities.slice();for(let i=cities.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[cities[i],cities[j]]=[cities[j],cities[i]]}
  let guard=0;
  while(out.length<n&&guard++<500){
    const c=cities[out.length%cities.length];
    const pass=Math.floor(guard/cities.length);
    const nm=pats[(Math.floor(r()*pats.length)+pass)%pats.length].replace('{c}',c);
    if(used.has(nm)||out.includes(nm))continue;out.push(nm);
  }
  return out;
}
const STRUCT_CACHE={};
function assocStructure(code,seed){
  const key=code+':'+seed;if(STRUCT_CACHE[key])return STRUCT_CACHE[key];
  const a=ASSOC[code],d=LEAGUE_DATA[code]||{};
  if(d.noLeague)return STRUCT_CACHE[key]=[];
  const r=mkRng(hashStr(code)^seed);
  const real=d.clubs?d.clubs.length:0;
  let want=d.closed?1:a.str>=85?3:a.str>=62?2:1;want=Math.max(want,real);
  const used=new Set(),leagues=[];
  for(let t=0;t<want;t++){
    let names;
    if(d.clubs&&d.clubs[t])names=d.clubs[t].split('|');
    else{const n=t===0?defaultSize(a):Math.min(20,leagues[t-1].clubs.length);names=genClubNames(a,n,r,used)}
    names.forEach(x=>used.add(x));
    const lname=(d.names&&d.names[t])||(t===0?a.name+' – 1. Liga':a.name+' – '+(t+1)+'. Liga');
    leagues.push({tier:t+1,name:lname,clubs:names,real:!!(d.clubs&&d.clubs[t])});
  }
  return STRUCT_CACHE[key]=leagues;
}
function promoCount(n){return n>=20?3:n>=14?2:1}

/* ---------- Vereinsdetails aus Name ---------- */
const STOP=new Set(['FC','SV','VfB','VfL','TSV','SC','FSV','AS','US','RC','JS','CD','UD','CF','AC','SS','KS','FK','NK','MFK','IF','IK','BK','SK','KF','CS','MC','ES','CR','USM','SE','TE','PAS','AE','APO','Club','Real','Deportivo','Atlético','Sporting','Stade','Olympique','Al','1.','The','Royal','Royale','KAA','KRC','RSC','KV','KVC','OH','RAAL','FCV','AFC','AJ','OGC','OSC','SCO','EA','ESTAC','USL','HSC','BSC','GD','EC','SL','Clube','União','CA','CSD','LDU','Dinamo','Dynamo','Borussia','Eintracht','Hertha','Bayer','Werder','de','do','da','del','la','Le','La','El','Los','Las','ZSKA','HNK','Universidad','Universitatea','KFC','MŠK','NŠ','FCSB']);
function shortName(name){
  const words=name.replace(/[.'’]/g,' ').split(/[\s\-\/&]+/).filter(Boolean);
  const keep=words.filter(w=>!STOP.has(w)&&!/^\d+$/.test(w)&&!/^Al$/i.test(w));
  const base=(keep[0]||words[0]||'XXX').replace(/^Al-/,'');
  let s=base.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z]/g,'').toUpperCase();
  if(s.length<3&&keep[1])s+=keep[1].normalize('NFD').replace(/[^A-Za-z]/g,'').toUpperCase();
  return (s+'XXX').slice(0,3);
}
function shortAlt(name){
  const words=name.replace(/[.'’]/g,' ').split(/[\s\-\/&]+/).filter(w=>w&&!STOP.has(w)&&!/^\d+$/.test(w));
  const clean=w=>w.normalize('NFD').replace(/[^A-Za-z]/g,'').toUpperCase();
  if(words.length>=2)return (clean(words[0])[0]+clean(words[1]).slice(0,2)+'XX').slice(0,3);
  const w=clean(words[0]||name);return (w[0]+w.slice(-2)+'XX').slice(0,3);
}
function clubColors(name){return COLOR_PAIRS[hashStr(name)%COLOR_PAIRS.length]}
function clubStaff(name,seed){
  const r=mkRng(hashStr(name)^seed^0x9e37);const pk=a=>a[Math.floor(r()*a.length)];
  const nm=()=>{const p=poolArr('de');return pk(p.f)+' '+pk(p.l)};
  return {pres:{name:nm(),trait:pk(Object.keys(PRES))},dir:{name:nm(),trait:pk(Object.keys(DIR))},coach:{name:nm(),trait:pk(Object.keys(COACH))}};
}
function staffForAssoc(name,seed,code){
  const st=clubStaff(name,seed),r=mkRng(hashStr(name+code)^seed),p=poolArr(ASSOC[code].pool);const pk=a=>a[Math.floor(r()*a.length)];
  st.pres.name=pk(p.f)+' '+pk(p.l);st.dir.name=pk(p.f)+' '+pk(p.l);st.coach.name=pk(p.f)+' '+pk(p.l);return st;
}
function estBudget(rep,econ){return Math.round(rep*rep*6000*econ/1e5)*1e5}
function estStadium(rep,econ){return Math.round((4000+Math.pow(rep/100,2)*72000*Math.sqrt(econ))/500)*500}

/* ---------- Spieler ---------- */
function fam(n,s){if(n===s)return 1;const k=n+'-'+s;if(FAM[k])return FAM[k];if(n==='TW'||s==='TW')return .3;if(GROUP[n]===GROUP[s])return .85;if(ADJ[GROUP[n]+'-'+GROUP[s]])return .72;return .6}
/* Vertrautheit (1–20) → Faktor auf die Stärke */
function famFactor(f){return .45+.55*Math.pow((f-1)/19,.8)}
function familiarity(p,pos){return p.pp.charCodeAt(POS_IDX[pos])-64}
/* Stärke je Position (1–100): gewichteter Schnitt der Schlüsselattribute × 5 × Vertrautheit */
function posRatings(p){
  let r=CACHE.rate.get(p);if(r)return r;
  r=new Array(8);const pl=POS_LIST;
  for(let i=0;i<8;i++){const pos=pl[i];let s=0;for(const [ix,w] of WIDX[pos])s+=(p.at.charCodeAt(ix)-64)*w;r[i]=s/WSUM[pos]*5*famFactor(p.pp.charCodeAt(i)-64)}
  CACHE.rate.set(p,r);return r;
}
function rateAt(p,pos){return posRatings(p)[POS_IDX[pos]]}
function rawRateAt(p,pos){let s=0;for(const [ix,w] of WIDX[pos])s+=(p.at.charCodeAt(ix)-64)*w;return s/WSUM[pos]*5}
function ovr(p){let v=CACHE.ovr.get(p);if(v===undefined){v=Math.round(rateAt(p,p.pos));CACHE.ovr.set(p,v)}return v}
/* Persönlichkeit aus versteckten Werten (angelehnt an den FM) */
function personality(p){
  const det=at(p,'det'),prf=at(p,'prf'),amb=at(p,'amb'),tmp=at(p,'tmp'),con=at(p,'con'),ldr=at(p,'ldr');
  if(prf>=18&&det>=16)return 'Musterprofi';
  if(ldr>=16&&det>=15)return 'Leitwolf';
  if(amb>=17&&det>=14)return 'Sehr ehrgeizig';
  if(prf>=15)return 'Profi';
  if(det>=16)return 'Entschlossen';
  if(tmp<=6)return 'Hitzkopf';
  if(con<=6)return 'Unbeständig';
  if(prf<=6)return 'Unprofessionell';
  if(amb<=6)return 'Genügsam';
  if(tmp>=16)return 'Gelassen';
  return 'Ausgeglichen';
}
function pname(p){return p.fn.charAt(0)+'. '+p.ln}
function fullname(p){return p.fn+' '+p.ln}
function calcValue(p){
  const o=ovr(p);let v=1e6*Math.pow(Math.max(o-38,1)/10,2.6);
  const af=p.age<=21?1.35:p.age<=24?1.2:p.age<=28?1:p.age<=30?.75:p.age<=32?.5:.3;
  v*=af;if(p.age<24)v*=1+Math.max(0,p.pot-o)/40;
  return Math.max(10000,Math.round(v/5000)*5000);
}
function calcWage(p){const o=ovr(p);return (3500+Math.pow(Math.max(o-35,0),2.2)*33)*(p.age<21?.6:1)}
function rw(v){return Math.max(250,Math.round(v/250)*250)}
function pickNat(code){
  if(code&&rnd()<.78)return code;
  return wpick(NAT_WEIGHTS,x=>x.w).code;
}
/* Attribute für eine Zielstärke q (1–100) auf Position pos erzeugen */
function genAttributes(pos,q,age){
  const base=q/5,w=WEIGHTS[pos],gk=pos==='TW';
  const v=new Array(ATTR_KEYS.length);
  ATTR_KEYS.forEach((k,i)=>{
    const g=ATTR_GROUP[k];let x;
    if(g==='hid')x=11+gauss()*3.6;
    else if(g==='gk')x=gk?(w[k]?base+gauss()*1.5:base-1.5+gauss()*2.5):1.5+rnd()*3.5;
    else if(gk)x=(g==='ment'||g==='phys')?(w[k]?base+gauss()*1.5:base-2.5+gauss()*2.2):(w[k]?base-1+gauss()*1.8:base-7+gauss()*2.5);
    else if(w[k])x=base+(w[k]>=3?.4:0)+gauss()*1.6;
    else x=base-(g==='tech'?3.2:2.2)+gauss()*2.4;
    // Alter: Junge sind schneller, Ältere klüger
    if(g==='phys'&&['pac','acc','agi'].includes(k))x+=(age<23?.8:age>30?-(age-30)*.45:0);
    if(['dec','ant','cmp','pos','ldr'].includes(k))x+=(age<21?-1.2:age>27?Math.min(1.5,(age-27)*.3):0);
    if(k==='lth'||k==='pen'||k==='cor'||k==='fre')x=base-4+gauss()*3.5+(k==='fre'&&w.tec?1:0);
    v[i]=clamp(x,1,20);
  });
  // auf Zielstärke kalibrieren (Schlüsselattribute verschieben)
  for(let it=0;it<4;it++){
    let s=0;for(const [ix,ww] of WIDX[pos])s+=clamp(Math.round(v[ix]),1,20)*ww;const r=s/WSUM[pos]*5;
    const d=(q-r)/5;if(Math.abs(d)<.12)break;
    for(const [ix] of WIDX[pos])v[ix]=clamp(v[ix]+d,1,20);
  }
  return encodeAt(v);
}
function genFamiliarity(pos,ver){
  const pp=[];
  for(const q of POS_LIST){
    if(q===pos){pp.push(20);continue}
    let f=Math.round(fam(pos,q)*20-4+(ver-10)*.35+gauss()*1.5);
    if(pos==='TW'||q==='TW')f=1+Math.floor(rnd()*2);
    pp.push(clamp(f,1,18));
  }
  // manche Spieler können eine zweite Position richtig gut
  if(pos!=='TW'&&rnd()<.35){const cands=POS_LIST.filter(q=>q!==pos&&q!=='TW'&&fam(pos,q)>=.85);if(cands.length){const q=pick(cands);pp[POS_IDX[q]]=ri(15,18)}}
  return String.fromCharCode(...pp.map(f=>64+f));
}
function genPlayer(pos,q,age,natCode){
  const nat=pickNat(natCode),pool=poolArr(ASSOC[nat].pool);
  if(age<21)q-=(21-age)*2.2;
  const atStr=genAttributes(pos,clamp(q,15,97),age);
  const p={id:'p'+(S.nextId++),fn:pick(pool.f),ln:pick(pool.l),nat,age,pos,at:atStr,pp:'',pot:0,fit:100,mor:70,inj:0,goals:0,apps:0,club:null,val:0,wage:0,
    until:S.season+(age<=23?ri(1,4):age>=31?ri(0,1):ri(0,3)),role:'rotation',negTries:0,listed:false};
  p.pp=genFamiliarity(pos,at(p,'ver'));if(S.statsFrom!==undefined&&S.season>S.statsFrom)p.cr=S.season;
  const o=ovr(p);
  const drive=(at(p,'det')+at(p,'prf')+at(p,'amb'))/30; // 0.1 … 2
  p.pot=age<24?clamp(Math.round(o+(24-age)*(.8+rnd()*2.2)*(.7+drive*.4)+rnd()*5),o,96):o;
  p.val=calcValue(p);p.wage=rw(calcWage(p));
  return p;
}
function randAge(){return clamp(Math.round(25.5+gauss()*4),17,35)}

/* ---------- Welt erzeugen ---------- */
function makeClub(name,code,L,i,n){
  const a=ASSOC[code],rep=repFor(a,L.tier,i,n),econ=econOf(code,L.tier);
  let sh=shortName(name);if(L.clubs.some(id=>S.clubs[id].short===sh))sh=shortAlt(name);
  const c={id:S.clubs.length,name,short:sh,assoc:code,league:L.id,rep,econ,
    stadium:estStadium(rep,econ),colors:clubColors(name),budget:estBudget(rep,econ),tBudget:0,wBudget:0,
    staff:staffForAssoc(name,S.seed,code),players:[],lineup:[],tactic:null,expRank:i+1,firedSeason:0};
  c.tactic={...COACH[c.staff.coach.trait].t};
  S.clubs.push(c);L.clubs.push(c.id);
  const baseQ=26+rep*.56;
  for(const pos in SQUAD_TEMPLATE)for(const off of SQUAD_TEMPLATE[pos]){
    const p=genPlayer(pos,baseQ+off+gauss()*3,randAge(),code);p.club=c.id;p.wage=rw(p.wage*econ);S.players[p.id]=p;c.players.push(p.id);
  }
  assignRoles(c);initBudgets(c);
  return c;
}
function makeFixtures(ids){
  const arr=ids.slice();if(arr.length%2)arr.push(null);
  const n=arr.length;
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
  const rounds=[],last={},homes={};
  for(let r=0;r<n-1;r++){
    const md=[];
    for(let i=0;i<n/2;i++){
      const x=arr[i],y=arr[n-1-i];if(x===null||y===null)continue;let home;
      if(last[x]==='H'&&last[y]!=='H')home=y;else if(last[y]==='H'&&last[x]!=='H')home=x;else home=(homes[x]||0)<=(homes[y]||0)?x:y;
      const away=home===x?y:x;homes[home]=(homes[home]||0)+1;last[home]='H';last[away]='A';md.push({h:home,a:away});
    }
    rounds.push(md);arr.splice(1,0,arr.pop());
  }
  const second=rounds.map(md=>md.map(m=>({h:m.a,a:m.h})));
  return rounds.concat(second).map(md=>md.map(m=>({h:m.h,a:m.a,hg:null,ag:null})));
}
function schedule(){
  for(const L of S.leagues)L.fixtures=makeFixtures(L.clubs);
  S.weeks=Math.max(...S.leagues.map(L=>L.fixtures.length));
  for(const L of S.leagues){const R=L.fixtures.length;L.rw=L.fixtures.map((_,r)=>R>1?Math.round(r*(S.weeks-1)/(R-1)):0);L.wr={};L.rw.forEach((w,r)=>L.wr[w]=r)}
}
function newWorld(seed,activeCodes,sel,manager){
  RNG=seed>>>0;resetCache();
  S={v:VERSION,seed,nextId:1,comps:[],compHist:{},guests:{},ncups:[],cupWinners:{},natHist:{},coefHist:null,coefSeason:{},supercups:[],scHist:{},prevTables:null,prevCup:{},season:2026,statsFrom:2026,week:0,weeks:0,user:null,manager,active:activeCodes.slice(),clubs:[],players:{},leagues:[],news:[],offers:[],transfers:[],history:[],fin:null,bg:{},rng:0};
  for(const code of activeCodes){
    const st=assocStructure(code,seed);const ids=[];
    st.forEach(lt=>{const L={id:S.leagues.length,assoc:code,tier:lt.tier,name:lt.name,clubs:[],up:0,down:0,champs:[]};S.leagues.push(L);ids.push(L);
      lt.clubs.forEach((nm,i)=>{const c=makeClub(nm,code,L,i,lt.clubs.length);if(sel&&code===sel.code&&lt.tier===sel.tier&&i===sel.idx)S.user=c.id})});
    for(let t=0;t<ids.length-1;t++){const k=Math.min(promoCount(ids[t].clubs.length),promoCount(ids[t+1].clubs.length));ids[t].down=k;ids[t+1].up=k}
  }
  refillFreeAgents();
  schedule();
  S.clubs.forEach(c=>{autoLineup(c);c.target=boardTarget(c)});
  S.comps=[];S.compHist={};S.guests={};S.qualOrder=null;S.coefHist=initCoef();
  setupComps();setupSupercups();setupNatCups();
  return S;
}
function refillFreeAgents(){
  const free=Object.values(S.players).filter(p=>p.club===null);
  const want=40+S.active.length*8;
  for(let i=free.length;i<want;i++){const code=pick(S.active);const p=genPlayer(pick(POS_LIST),34+rnd()*30+ASSOC[code].str*.05,ri(19,33),code);S.players[p.id]=p}
}
function startCareer(manager){
  const c=userClub();
  c.staff.coach={name:manager,trait:null};c.autoXI=true;
  S.fin={tv:0,tickets:0,wages:0,tIn:0,tOut:0,prize:0,bonus:0,bon:{},log:[]};
  squadOf(c).forEach(materializeContract);
  addNews('board',`Willkommen beim ${c.name}!`,`Der Vorstand um Präsident ${esc(c.staff.pres.name)} (${PRES[c.staff.pres.trait].label}) erwartet in dieser Saison: <b>${c.target.t}</b> in der ${esc(league(c).name)}. Transferbudget: <b>${money(c.tBudget)}</b>, Gehaltsbudget: <b>${money(c.wBudget)}/Woche</b>.`);
  addNews('info','Transferfenster geöffnet',`Bis Woche 4 kannst du Spieler kaufen. Das Winterfenster öffnet in Woche ${winterStart()+1}. Simuliert werden ${S.active.length} Länder mit ${S.leagues.length} Ligen.`);
  S.fin.cups=userComps().reduce((t,C)=>t+COMP[C.key].prize.base,0);
  const uc=userComps();if(uc.length)addNews('board','Internationale Wettbewerbe',`Dein Verein ist dabei: ${uc.map(C=>COMP[C.key].name).join(', ')}. Unter der Woche kommen zusätzliche Spiele dazu – plane Rotation ein.`);
  save();
}

/* ---------- Helfer ---------- */
const club=id=>S.clubs[id];
const userClub=()=>S.clubs[S.user];
const league=c=>c.league===null?null:S.leagues[c.league];
function leagueName(c){return c.amateur?natName(c.assoc)+' · Amateurverein':c.guest?natName(c.assoc)+' · Gastverein':league(c).name}
function money(v){const s=v<0?'-':'';v=Math.abs(v);if(v>=1e6)return s+(v/1e6).toLocaleString('de-DE',{maximumFractionDigits:1})+' Mio. €';if(v>=1e3)return s+Math.round(v/1e3).toLocaleString('de-DE')+' Tsd. €';return s+Math.round(v)+' €'}
function winterStart(){return Math.floor(S.weeks*.47)}
function isWindow(){return S.week<4||(S.week>=winterStart()&&S.week<winterStart()+3)}
function addNews(type,title,body){S.news.unshift({type,title,body,season:S.season,w:S.week});if(S.news.length>80)S.news.length=80}
function ovrColor(o){return o>=80?'#38d47c':o>=70?'#8bd86a':o>=60?'#d9cf55':o>=50?'#e0a14a':'#d06060'}
function ovrTag(o){return `<span class="ovr" style="background:${ovrColor(o)}22;color:${ovrColor(o)}">${o}</span>`}
function badge(c,sz){return `<span class="badge" style="background:${c.colors[0]};color:${c.colors[1]};border-color:${c.colors[1]}${sz?';width:'+sz+'px;height:'+sz+'px;font-size:'+Math.round(sz/2.5)+'px':''}">${esc(c.short)}</span>`}
function squadOf(c){return c.players.map(id=>S.players[id])}
function clubAvg(c){const xi=c.lineup.filter(Boolean).map(id=>S.players[id]).filter(Boolean);if(!xi.length)return 0;return Math.round(xi.reduce((s,p)=>s+ovr(p),0)/xi.length)}
function natName(code){return ASSOC[code]?ASSOC[code].name:code}
function stars(rep){const n=clamp(Math.round(rep/20),0,5);return '★'.repeat(n)+'☆'.repeat(5-n)}

/* ---------- Vorstandsziele ---------- */
function boardTarget(c){
  const L=league(c),n=L.clubs.length,e=c.expRank;
  if(L.tier===1){
    if(e===1)return {t:'Meisterschaft',r:1};
    const top=Math.max(3,Math.round(n*.25));
    if(e<=Math.max(2,Math.round(n*.2)))return {t:`Spitzengruppe (Top ${top})`,r:top};
    if(e<=Math.round(n*.5))return {t:'Obere Tabellenhälfte',r:Math.round(n/2)};
    if(L.down===0||e<=n-L.down-3)return {t:'Gesichertes Mittelfeld',r:n-Math.max(L.down,1)-1};
    return {t:'Klassenerhalt',r:n-L.down};
  }
  if(e<=L.up)return {t:'Aufstieg',r:L.up};
  if(e<=Math.round(n*.35))return {t:'Oberes Drittel',r:Math.round(n*.4)};
  if(L.down===0||e<=n-L.down-3)return {t:'Gesichertes Mittelfeld',r:Math.max(L.up+1,n-Math.max(L.down,1)-1)};
  return {t:'Klassenerhalt',r:n-L.down};
}

/* ---------- Rollen, Verträge, Budgets ---------- */
function suggestRole(p,c){
  const o=ovr(p);let rank=0;for(const id of c.players){if(id===p.id)continue;const q=S.players[id];if(q&&ovr(q)>o)rank++}
  if(rank<3)return 'schluessel';if(rank<11)return 'stamm';if(p.age<=20)return 'perspektive';if(rank<16)return 'rotation';return 'ergaenzung';
}
function assignRoles(c){for(const p of squadOf(c))p.role=suggestRole(p,c)}
function baseWageAt(o){return 3500+Math.pow(Math.max(o-35,0),2.2)*33}
function tvIncome(c){return 16*baseWageAt(25+c.rep*.56)*c.econ+15000*c.econ}
function ticketPrice(c){return (8+c.rep*.22)*Math.sqrt(c.econ)}
function estRevenue(c){return tvIncome(c)+c.stadium*clamp(.55+c.rep/220,.4,1)*ticketPrice(c)/2}
function wageBill(c){let s=0;for(const id of c.players)s+=S.players[id].wage;return s}
function initBudgets(c){
  const pr=PRES[c.staff.pres.trait];
  c.wBudget=rw(Math.max(wageBill(c)*1.06,estRevenue(c)*pr.wRatio));
  c.tBudget=Math.max(0,Math.round(c.budget*pr.tShare/1e4)*1e4);
}
function contractEnd(p){return p.club===null?'–':'06/'+String((p.until+1)%100).padStart(2,'0')}
function weeksLeft(p){return Math.max(0,(p.until-S.season)*52+Math.round((S.weeks-S.week)*52/Math.max(S.weeks,1)*.75))}
function releaseCost(p){return Math.round(p.wage*weeksLeft(p)*.5/1000)*1000}
function wageDemand(p,c,role,years){
  let d=calcWage(p)*c.econ*ROLES[role].wage*(1.15-c.rep/400)*(.92+at(p,'amb')/120);
  if(p.age>=30)d*=years>=3?.95:years===1?1.08:1;else if(p.age<=23&&years>=4)d*=1.05;
  if(p.mor<40)d*=1.12;
  if(p.club===c.id)d=Math.max(d,p.wage*1.03);else if(p.club!==null)d=Math.max(d,p.wage*1.15);
  return rw(d);
}
/* ---------- Karriere-Statistik ---------- */
// Zeile: [Saison, Verein, Spiele, Tore, Vorlagen, Gelb, Weiße Westen, Notensumme×10, benotete Spiele, Liga]
function seasonRows(p){return (p.car||[]).filter(r=>r[0]===S.season)}
function liveDelta(p){const d=[p.apps||0,p.goals||0,p.ast||0,p.yc||0,p.cs||0,p.rs||0,p.rn||0];for(const r of seasonRows(p))for(let i=0;i<7;i++)d[i]-=r[i+2];return d.map(v=>Math.max(0,v))}
function closeRow(p){
  if(p.club===null||p.club===undefined)return;const c=club(p.club);if(!c)return;
  const d=liveDelta(p);if(d.every(v=>!v)&&seasonRows(p).some(r=>r[1]===c.id))return;
  p.car=p.car||[];p.car.push([S.season,c.id,...d,c.league===null?-1:c.league]);if(p.car.length>18)p.car.splice(0,p.car.length-18);
}
/* Steckbrief: Größe, Gewicht, Fuß, Geburtstag – einmal ermittelt, dann fest */
const BIO_H={TW:190,IV:187,ST:183,DM:181,AV:178,ZM:179,OM:176,FL:175};
function bio(p){
  if(!p.bi){
    const R=mkRng(hashStr('bio'+p.id)),G=()=>{let u=R()||1e-9,v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
    const h=clamp(Math.round(BIO_H[p.pos]+(at(p,'jum')+at(p,'hea')-20)*.42+(at(p,'str')-10)*.25+G()*4.2),162,204);
    const w=clamp(Math.round(h-107+(at(p,'str')-10)*.85+G()*3.2),55,102);
    const r=R(),ft=r<.07?'B':r<.3?'L':'R';
    const wf=ft==='B'?17+Math.floor(R()*4):clamp(Math.round(5+R()*6+(at(p,'tec')-10)*.35),1,15);
    p.bi=[h,w,ft,wf,1+Math.floor(R()*12),1+Math.floor(R()*28)].join('|');
  }
  const [h,w,ft,wf,mo,dy]=p.bi.split('|');
  return {h:+h,w:+w,foot:ft,weak:+wf,mo:+mo,dy:+dy,year:S.season-p.age-(+mo>=7?1:0)};
}
const FOOT_LABEL={R:'Rechts',L:'Links',B:'Beidfüßig'};
function weakLabel(v){return v>=17?'Sehr stark':v>=14?'Stark':v>=10?'Ordentlich':v>=6?'Schwach':'Sehr schwach'}

/* Vorgeschichte vor Spielbeginn (deterministisch, wird nicht gespeichert) */
const CPOOL={};
function careerPool(code){
  if(CPOOL[code])return CPOOL[code];
  let out=[];
  if(S.active.includes(code))out=S.leagues.filter(L=>L.assoc===code).flatMap(L=>L.clubs.map(id=>{const c=club(id);return {id,name:c.name,rep:c.rep,lname:L.name,tier:L.tier}}));
  else assocStructure(code,S.seed).forEach(L=>L.clubs.forEach((nm,i)=>out.push({id:null,name:nm,rep:repFor(ASSOC[code],L.tier,i,L.clubs.length),lname:L.name,tier:L.tier})));
  return CPOOL[code]=out;
}
function poolPick(R,code,rep,avoid){
  const pool=careerPool(code).filter(x=>!avoid.includes(x.name));if(!pool.length)return null;
  const sc=pool.map(x=>({x,d:Math.abs(x.rep-rep)+R()*9})).sort((a,b)=>a.d-b.d);return sc[Math.floor(R()*Math.min(3,sc.length))].x;
}
const RATE_G={ST:.42,FL:.24,OM:.22,ZM:.09,DM:.04,IV:.045,AV:.03,TW:0},RATE_A={ST:.14,FL:.2,OM:.24,ZM:.13,DM:.07,IV:.03,AV:.1,TW:.004};
function synthHistory(p){
  const R=mkRng(hashStr('car'+p.id)),until=Math.max(S.statsFrom||S.season,p.cr||0);
  const ageF=p.age-(S.season-until),debut=17+Math.floor(R()*3)+(p.pos==='TW'?1:0),n=Math.max(0,ageF-debut);
  const trs=p.tr||[],stored=p.car||[];
  let anchorId=stored.length&&stored[0][0]===until?stored[0][1]:trs.length?(trs[0][2]>=0?trs[0][2]:null):stored.length?stored[0][1]:p.club;
  let anchor=null;if(anchorId!==null&&anchorId!==undefined&&club(anchorId)){const c=club(anchorId),L=league(c);anchor={id:c.id,name:c.name,rep:c.rep,lname:L?L.name:leagueName(c),tier:L?L.tier:1,code:c.assoc}}
  const homeCode=careerPool(p.nat).length?p.nat:(anchor?anchor.code:p.nat);
  // Stationen rückwärts aufbauen
  const stations=[];let left=n,rep=anchor?anchor.rep:clamp(26+ovr(p)*.5,10,80),code=anchor?anchor.code:homeCode;
  if(anchor){const ten=left===0?0:R()<.18?0:1+Math.floor(Math.pow(R(),1.4)*Math.min(left,6));stations.push({...anchor,len:ten});left-=ten}
  const avoid=anchor?[anchor.name]:[];
  while(left>0||!stations.length){
    const len=Math.min(left,1+Math.floor(R()*3.2));
    rep=Math.max(5,rep-(4+R()*10));
    code=careerPool(homeCode).length&&(R()<(left<=len?.8:.5))?homeCode:(anchor?anchor.code:homeCode);
    const x=poolPick(R,code,rep,avoid);if(!x)break;avoid.push(x.name);stations.push({...x,code,len});left-=len;
  }
  // vorwärts: Saisons, Statistiken, Wechsel
  stations.reverse();
  const rows=[],moves=[];let s=until-n;const fin=at(p,'fin'),agg=at(p,'agg'),o=ovr(p);
  stations.forEach((st,k)=>{
    if(k>0){
      const prev=stations[k-1],ago=until-s,free=R()<.22;
      const fee=free?0:Math.round(p.val*Math.pow(.8,ago)*(.2+R()*.7)*(st.rep>prev.rep?1:.6)/25000)*25000;
      moves.push({s,w:0,f:prev.name,fid:prev.id,t:st.name,tid:st.id,fee,syn:true});
    }
    for(let y=0;y<st.len;y++,s++){
      const age=ageF-(until-s),sh=clamp(.25+(age-17)*.085,.15,.92)*(.75+R()*.45)*(anchor&&st.id===anchor.id&&p.club===anchor.id?.3+ROLES[p.role].exp*.8:1);
      const apps=Math.max(0,Math.round(sh*36+R()*4-2)),g=Math.round(apps*RATE_G[p.pos]*Math.pow(fin/12,1.4)*(.6+R()*.8));
      const a=Math.round(apps*RATE_A[p.pos]*(.6+R()*.8)),yc=Math.round(apps*.1*(agg/10)*(.5+R()));
      const cs=p.pos==='TW'?Math.round(apps*(.22+R()*.18)):0,avg=apps?clamp(6.45+(sh-.5)*.7+(o-60)*.006+(R()-.5)*.35,5.9,7.9):0;
      rows.push({s,cid:st.id,name:st.name,lname:st.lname,apps,g,a,yc,cs,avg,syn:true});
    }
  });
  const youth=stations[0],last=stations[stations.length-1];
  const since=anchor&&last&&last.id===anchor.id?until-last.len:null;
  return {rows,moves,since,youth:youth?youth.name:null};
}
function careerView(p){
  const H=synthHistory(p),rows=H.rows.slice();
  const nameOf=id=>id>=0&&club(id)?club(id).name:'vereinslos';
  for(const r of p.car||[])rows.push({s:r[0],cid:r[1],name:nameOf(r[1]),lname:r[9]>=0&&S.leagues[r[9]]?S.leagues[r[9]].name:(club(r[1])?leagueName(club(r[1])):''),apps:r[2],g:r[3],a:r[4],yc:r[5],cs:r[6],avg:r[8]?r[7]/r[8]/10:0});
  if(p.club!==null){const c=club(p.club),d=liveDelta(p);if(!seasonRows(p).some(r=>r[1]===c.id)||d.some(v=>v))rows.push({s:S.season,cid:c.id,name:c.name,lname:leagueName(c),apps:d[0],g:d[1],a:d[2],yc:d[3],cs:d[4],avg:d[6]?d[5]/d[6]/10:0,live:true})}
  const moves=H.moves.concat((p.tr||[]).map(t=>({s:t[0],w:t[1],f:nameOf(t[2]),fid:t[2]>=0?t[2]:null,t:nameOf(t[3]),tid:t[3],fee:t[4]})));
  const since=p.since!==undefined?p.since:H.since;
  return {rows,moves,since,youth:H.youth};
}
function freeAgent(p){
  closeRow(p);delete p.ct;  if(p.club!==null){const c=club(p.club);c.players=c.players.filter(x=>x!==p.id);c.lineup=c.lineup.map(x=>x===p.id?null:x)}
  p.club=null;p.role='rotation';p.listed=false;p.wage=rw(calcWage(p)*.5);
}
function aiKeeps(p,c){
  const os=squadOf(c).map(ovr).sort((a,b)=>a-b),median=os[Math.floor(os.length/2)],o=ovr(p);
  const dir=c.staff.dir.trait,pres=c.staff.pres.trait;
  if(p.age>=33)return dir==='erfahrung'&&o>=median+3;
  if(p.age<=22&&p.pot>=median+3)return true;
  if(o<median-3)return dir==='jugend'&&p.age<=21;
  if(pres==='sparsam'&&p.wage>wageBill(c)/c.players.length*1.4)return rnd()<.4;
  return rnd()<.85;
}

/* ---------- Aufstellung ---------- */
function autoLineup(c){
  const slots=FORMATIONS[c.tactic.f].s;
  const co=c.staff.coach.trait&&COACH[c.staff.coach.trait];const fitW=co&&co.rotate?.8:.4;
  const avail=squadOf(c).filter(p=>p.inj===0);
  const used=new Set(),lu=new Array(11).fill(null);
  const val=(p,pos)=>rateAt(p,pos)*((1-fitW)+fitW*p.fit/100);
  slots.forEach((pos,i)=>{let best=null,bv=-1;for(const p of avail){if(used.has(p.id)||p.pos!==pos)continue;const v=val(p,pos);if(v>bv){bv=v;best=p}}if(best&&best.fit>=55){used.add(best.id);lu[i]=best.id}});
  slots.forEach((pos,i)=>{if(lu[i])return;let best=null,bv=-1;for(const p of avail){if(used.has(p.id))continue;const v=val(p,pos);if(v>bv){bv=v;best=p}}if(best){used.add(best.id);lu[i]=best.id}});
  c.lineup=lu;
}
function fixLineup(c){
  const slots=FORMATIONS[c.tactic.f].s;const changed=[];
  if(c.lineup.length!==11)c.lineup=new Array(11).fill(null).map((_,i)=>c.lineup[i]||null);
  const used=new Set(c.lineup.filter(id=>id&&S.players[id]&&S.players[id].inj===0&&S.players[id].club===c.id));
  slots.forEach((pos,i)=>{
    const id=c.lineup[i],p=id&&S.players[id];if(p&&p.inj===0&&p.club===c.id)return;
    let best=null,bv=-1;for(const q of squadOf(c)){if(q.inj||used.has(q.id))continue;const v=rateAt(q,pos)*(.6+.4*q.fit/100);if(v>bv){bv=v;best=q}}
    c.lineup[i]=best?best.id:null;if(best){used.add(best.id);changed.push(pname(best))}
  });
  return changed;
}

/* ---------- Teamstärke & Match-Engine ---------- */
const CONTRIB={TW:{d:2},IV:{d:1},AV:{d:1,a:.2},DM:{d:.5,m:1},ZM:{m:1,a:.2},OM:{m:.7,a:.7},FL:{m:.5,a:1},ST:{a:1}};
let BIGMATCH=false;
function teamStrength(c){
  const slots=FORMATIONS[c.tactic.f].s;const acc={d:[0,0],m:[0,0],a:[0,0]};
  slots.forEach((pos,i)=>{
    const p=c.lineup[i]&&S.players[c.lineup[i]];
    let r=p?rateAt(p,pos)*(.72+.28*p.fit/100)*(.96+.08*p.mor/100):18;
    if(p){r*=1+(rnd()-.5)*.16*(21-at(p,'con'))/20;if(BIGMATCH)r*=1+(at(p,'imp')-10.5)*.006}
    for(const k in CONTRIB[pos]){acc[k][0]+=r*CONTRIB[pos][k];acc[k][1]+=CONTRIB[pos][k]}
  });
  const avg=k=>acc[k][1]?acc[k][0]/acc[k][1]:30;
  let D=avg('d')*(1+.03*(acc.d[1]-6.5)),M=avg('m')*(1+.03*(acc.m[1]-3.5)),A=avg('a')*(1+.03*(acc.a[1]-3.8));
  const t=c.tactic;
  if(t.men==='offensiv'){A*=1.08;D*=.94}else if(t.men==='defensiv'){A*=.92;D*=1.08}
  if(t.press==='hoch'){M*=1.06;D*=.97}else if(t.press==='niedrig'){M*=.95;D*=1.03}
  if(t.style==='ballbesitz')M*=1.05;
  return {D,M,A,ovr:(D+M+A)/3};
}
function prepareAI(c,opp){
  if(c.id===S.user)return;const co=COACH[c.staff.coach.trait];
  if(co&&co.adaptive){const diff=clubAvg(opp)-clubAvg(c);c.tactic.men=diff>3?'defensiv':diff<-3?'offensiv':'ausgewogen';c.tactic.style=diff>3?'konter':'normal'}
}
function pickScorer(c){
  const slots=FORMATIONS[c.tactic.f].s;const W={ST:5,FL:3,OM:3,ZM:1.3,DM:.6,IV:.5,AV:.4,TW:0};
  const cand=c.lineup.map((id,i)=>({p:id&&S.players[id],pos:slots[i]})).filter(x=>x.p);
  const x=wpick(cand,x=>W[x.pos]*Math.pow(at(x.p,'fin')/12,2)*(.7+at(x.p,'otb')/30)*(x.pos==='IV'?at(x.p,'hea')/12:1));return x?x.p:null;
}
function pickAssist(c,scorer){
  const slots=FORMATIONS[c.tactic.f].s;const W={ST:1.1,FL:2.3,OM:2.6,ZM:1.7,DM:.7,IV:.35,AV:1.3,TW:.04};
  const cand=c.lineup.map((id,i)=>({p:id&&S.players[id],pos:slots[i]})).filter(x=>x.p&&x.p!==scorer);
  const x=wpick(cand,x=>W[x.pos]*Math.pow((at(x.p,'pas')+at(x.p,'vis')+at(x.p,'cro')*.6+at(x.p,'tea')*.4)/36,2));return x?x.p:null;
}
function mst(res,p){res.st=res.st||{};return res.st[p.id]||(res.st[p.id]={g:0,a:0,y:0})}
function pickAny(c){const ids=c.lineup.filter(Boolean);return ids.length?S.players[pick(ids)]:null}
const TXT_CHANCE=['{p} zieht ab – knapp vorbei!','Riesenchance für {p}, aber der Keeper pariert!','{p} köpft an die Latte!','{p} scheitert aus spitzem Winkel.','Schuss von {p} – geblockt!','{p} vergibt frei vor dem Tor!'];
const TXT_GOAL=['TOR! {p} trifft für {c}!','TOR! {p} vollendet eiskalt – {c} jubelt!','TOR! Traumtor von {p}!','TOR! {p} köpft ein!'];
function matchRates(hc,ac,neutral){
  const H=teamStrength(hc),A=teamStrength(ac);if(!neutral){H.M*=1.04;H.A*=1.03}
  const pH=Math.pow(H.M,3.2)/(Math.pow(H.M,3.2)+Math.pow(A.M,3.2));
  const menF=t=>t.men==='offensiv'?1.15:t.men==='defensiv'?.85:1,openF=t=>t.men==='offensiv'?1.07:t.men==='defensiv'?.95:1;
  let rH=.13*(pH/.5)*menF(hc.tactic)*openF(ac.tactic),rA=.13*((1-pH)/.5)*menF(ac.tactic)*openF(hc.tactic);
  if(hc.tactic.style==='ballbesitz')rH*=.95;if(ac.tactic.style==='ballbesitz')rA*=.95;
  let cH=clamp(.1*Math.pow(H.A/A.D,2.8),.03,.32),cA=clamp(.1*Math.pow(A.A/H.D,2.8),.03,.32);
  if(hc.tactic.style==='konter'&&pH<.5)cH*=1.15;if(ac.tactic.style==='konter'&&pH>.5)cA*=1.15;
  return {pH,rH,rA,cH,cA};
}
function simPeriod(hc,ac,R,from,to,detail,res,cap){
  for(let m=from;m<=to;m++){
    const mm=cap?Math.min(m,cap):m;
    for(const side of ['h','a']){
      const c=side==='h'?hc:ac,rate=side==='h'?R.rH:R.rA,conv=side==='h'?R.cH:R.cA;
      if(rnd()<rate){side==='h'?res.sh++:res.sa++;
        if(rnd()<conv){const p=pickScorer(c);side==='h'?res.hg++:res.ag++;const q=rnd()<.74?pickAssist(c,p):null;if(p){p.goals++;mst(res,p).g++}if(q){q.ast=(q.ast||0)+1;mst(res,q).a++}if(detail)res.ev.push({m:mm,side,type:'goal',t:pick(TXT_GOAL).replace('{p}',p?pname(p):'?').replace('{c}',c.short)+(q?` (Vorlage: ${pname(q)})`:'')})}
        else if(detail&&rnd()<.35){const p=pickScorer(c)||pickAny(c);res.ev.push({m:mm,side,type:'chance',t:pick(TXT_CHANCE).replace('{p}',p?pname(p):'?')})}}
    }
  }
}
function scoreEvents(ev){ev.sort((x,y)=>x.m-y.m||(x.type==='goal'?1:-1));let h=0,a=0,ph=0,pa=0;for(const e of ev){if(e.type==='goal'){e.side==='h'?h++:a++;e.score=h+':'+a}if(e.type==='pen'&&e.ok){e.side==='h'?ph++:pa++}if(e.type==='pen'||e.type==='penmiss')e.score=ph+':'+pa}}
function simMatch(hc,ac,detail,neutral){
  prepareAI(hc,ac);prepareAI(ac,hc);
  const R=matchRates(hc,ac,neutral);
  const res={hg:0,ag:0,ev:[],poss:Math.round(R.pH*100),sh:0,sa:0,et:false,pen:null};
  simPeriod(hc,ac,R,1,90+ri(1,4),detail,res,90);
  for(const [side,c] of [['h',hc],['a',ac]]){
    const xi=c.lineup.filter(Boolean).map(id=>S.players[id]).filter(Boolean);
    if(xi.length){const hot=xi.reduce((t,p)=>t+at(p,'agg')+(21-at(p,'tmp')),0)/xi.length/21;const nc=Math.round(rnd()*3.2*hot);for(let i=0;i<nc;i++){const p=wpick(xi,p=>at(p,'agg')+(21-at(p,'tmp')));if(p&&!mst(res,p).y){mst(res,p).y=1;p.yc=(p.yc||0)+1;if(detail)res.ev.push({m:ri(5,90),side,type:'card',t:`Gelbe Karte für ${pname(p)}.`})}}}
    const inj=xi.length?xi.reduce((t,p)=>t+at(p,'inp'),0)/xi.length:10;
    if(xi.length&&rnd()<.11*(.6+inj/25)){const p=wpick(xi,p=>Math.pow(at(p,'inp'),1.5)*(1.3-at(p,'nat')/40));if(p){p.inj=ri(1,5);if(detail)res.ev.push({m:ri(5,88),side,type:'injury',t:`${pname(p)} verletzt sich und muss raus (ca. ${p.inj} Wo.).`})}}
  }
  if(detail)scoreEvents(res.ev);
  for(const [c,gf,ga] of [[hc,res.hg,res.ag],[ac,res.ag,res.hg]]){
    const loss=c.tactic.press==='hoch'?14:c.tactic.press==='niedrig'?8:11;
    const slots=FORMATIONS[c.tactic.f].s,avg=clubAvg(c)||50;
    c.lineup.forEach((id,i)=>{if(!id)return;const p=S.players[id];if(!p)return;p.apps++;p.fit=clamp(p.fit-loss*(1.3-at(p,'sta')/40)-rnd()*3,30,100);p.mor=clamp(p.mor+(gf>ga?5:gf<ga?-5:0),15,100);
      const pos=slots[i],x=(res.st&&res.st[id])||{g:0,a:0,y:0},def=pos==='TW'||pos==='IV'||pos==='AV'||pos==='DM';
      if(pos==='TW'&&ga===0)p.cs=(p.cs||0)+1;
      let r=6.45+clamp((gf-ga)*.18,-.6,.6)+x.g*.95+x.a*.5-x.y*.3+(ga===0&&def?(pos==='TW'?.55:.3):0)-(def?Math.max(0,ga-1)*(pos==='TW'?.25:.12):0)+((rateAt(p,pos)||ovr(p))-avg)*.025+gauss()*.42;
      r=clamp(Math.round(r*10)/10,3.5,10);p.rs=(p.rs||0)+Math.round(r*10);p.rn=(p.rn||0)+1;if(p.ao)aoTick(p);
      if(detail){res.rt=res.rt||{};res.rt[id]=r}});
    matchBonuses(c,res,ga);
  }
  res.end=95;
  return res;
}
/* Verlängerung: 2 x 15 Minuten, müde Beine = etwas weniger Torchancen */
function extraTime(hc,ac,res,detail,neutral){
  const R=matchRates(hc,ac,neutral);R.rH*=.9;R.rA*=.9;
  if(detail)res.ev.push({m:91,side:'h',type:'info',t:'Verlängerung! Es geht in die 30 Zusatzminuten.'});
  simPeriod(hc,ac,R,91,120,detail,res,0);
  for(const c of [hc,ac])for(const id of c.lineup){const p=id&&S.players[id];if(p)p.fit=clamp(p.fit-5,30,100)}
  res.et=true;res.end=122;if(detail)scoreEvents(res.ev);
}
/* Elfmeterschießen: 5 Schützen je Team, danach K.-o.-Modus */
function shootout(hc,ac,res,detail){
  const kickers=c=>{const ids=c.lineup.filter(Boolean).map(id=>S.players[id]).filter(p=>p&&p.pos!=='TW');ids.sort((a,b)=>(at(b,'pen')*2+at(b,'cmp'))-(at(a,'pen')*2+at(a,'cmp')));return ids.length?ids:[null]};
  const keeper=c=>{const id=c.lineup[0];const p=id&&S.players[id];return p?(at(p,'ref')+at(p,'ovo'))*2.5:50};
  const kh=kickers(hc),ka=kickers(ac),gh=keeper(hc),ga=keeper(ac);
  const prob=(p,gk)=>clamp(.76+((p?(at(p,'pen')*.6+at(p,'cmp')*.4)*5:55)-62)/190-(gk-62)/260,.55,.94);
  let ph=0,pa=0,k=0,min=121,done=false;
  if(detail)res.ev.push({m:min,side:'h',type:'info',t:'Elfmeterschießen!'});
  const kick=(side,r)=>{const ks=side==='h'?kh:ka,gk=side==='h'?ga:gh,p=ks[r%ks.length],ok=rnd()<prob(p,gk);if(ok){side==='h'?ph++:pa++}
    if(detail)res.ev.push({m:min+1+k,side,type:ok?'pen':'penmiss',ok,t:`${p?pname(p):'?'} ${ok?'verwandelt sicher.':pick(['scheitert am Torwart!','setzt den Ball neben das Tor!','trifft nur den Pfosten!'])}`});k++};
  for(let r=0;r<5&&!done;r++){
    kick('h',r);if(ph>pa+(5-r)||pa>ph+(4-r)){done=true;break}
    kick('a',r);if(ph>pa+(4-r)||pa>ph+(4-r)){done=true;break}
  }
  let r=5;while(!done&&ph===pa&&r<40){kick('h',r);kick('a',r);r++}
  if(ph===pa)ph++;
  res.pen={h:ph,a:pa};res.end=min+2+k;if(detail)scoreEvents(res.ev);
}
/* K.-o.-Entscheidung: agg = Tore beider Teams aus vorherigen Spielen (bezogen auf m.h/m.a) */
function resolveKO(m,res,detail,neutral,agg,allowET){
  const hc=club(m.h),ac=club(m.a);agg=agg||{h:0,a:0};
  const tot=()=>[agg.h+res.hg,agg.a+res.ag];let [x,y]=tot();
  if(x!==y){m.win=x>y?m.h:m.a;return}
  if(allowET){extraTime(hc,ac,res,detail,neutral);m.hg=res.hg;m.ag=res.ag;m.et=true;[x,y]=tot();if(x!==y){m.win=x>y?m.h:m.a;return}}
  shootout(hc,ac,res,detail);m.pen=true;m.ph=res.pen.h;m.pa=res.pen.a;m.win=res.pen.h>res.pen.a?m.h:m.a;
}
function resultText(m){if(m.hg===null)return '-:-';let s=m.hg+':'+m.ag;if(m.et&&!m.pen)s+=' n.V.';if(m.pen)s+=(m.et?' n.V.':'')+', '+m.ph+':'+m.pa+' i.E.';return s}

/* ---------- Tabellen ---------- */
function tableOf(L){
  const key=L.id;if(CACHE.tables[key])return CACHE.tables[key];
  const t={};L.clubs.forEach(id=>t[id]={id,sp:0,s:0,u:0,n:0,tf:0,ta:0,pts:0,form:[]});
  for(const md of L.fixtures)for(const m of md){
    if(m.hg===null)continue;const h=t[m.h],a=t[m.a];if(!h||!a)continue;
    h.sp++;a.sp++;h.tf+=m.hg;h.ta+=m.ag;a.tf+=m.ag;a.ta+=m.hg;
    if(m.hg>m.ag){h.s++;a.n++;h.pts+=3;h.form.push('S');a.form.push('N')}
    else if(m.hg<m.ag){a.s++;h.n++;a.pts+=3;a.form.push('S');h.form.push('N')}
    else{h.u++;a.u++;h.pts++;a.pts++;h.form.push('U');a.form.push('U')}
  }
  return CACHE.tables[key]=Object.values(t).sort((x,y)=>y.pts-x.pts||(y.tf-y.ta)-(x.tf-x.ta)||y.tf-x.tf||club(x.id).name.localeCompare(club(y.id).name));
}
function rankOf(id){const c=club(id);if(c.guest)return 0;return tableOf(league(c)).findIndex(r=>r.id===id)+1}

/* ---------- Transfers ---------- */
function askPrice(p){
  if(p.club===null)return 0;
  const s=club(p.club);let mul=PRES[s.staff.pres.trait].sellMul;
  if(s.lineup.includes(p.id))mul+=.25;
  if(s.id===S.user)mul=p.listed?.9:1;
  if(p.until<=S.season)mul*=S.week>=winterStart()?.35:.6;else if(p.until===S.season+1)mul*=.85;
  return Math.round(p.val*mul/5000)*5000;
}
function signingFee(p,wage){return p.club===null?(wage||p.wage)*6:0}
function aiWageFor(p,c){return rw(Math.max(calcWage(p)*c.econ*1.1,p.club!==null?p.wage*1.15:0))}
function doTransfer(p,to,fee,contract){
  const from=p.club!==null?club(p.club):null;
  const ct=contract||{wage:aiWageFor(p,to),until:S.season+ri(2,4),role:suggestRole(p,to)};
  const sign=signingFee(p,ct.wage);
  paySellOn(p,from,to,fee);
  if(from){from.players=from.players.filter(x=>x!==p.id);from.lineup=from.lineup.map(x=>x===p.id?null:x);from.budget+=fee;from.tBudget=(from.tBudget||0)+fee*PRES[from.staff.pres.trait].saleBack}
  to.players.push(p.id);to.budget-=fee+sign;to.tBudget=Math.max(0,(to.tBudget||0)-fee-sign);
  if(to.id===S.user){p.ct=Object.assign({},ct.ct||{});p.ct.n=0;delete p.ct.ad;p.ct.pd=0}else delete p.ct;
  closeRow(p);p.tr=p.tr||[];p.tr.push([S.season,S.week,from?from.id:-1,to.id,fee]);if(p.tr.length>12)p.tr.shift();p.since=S.season;
  p.club=to.id;p.mor=78;p.wage=ct.wage;p.until=ct.until;p.role=ct.role;p.listed=false;p.negTries=0;
  if(from&&from.id===S.user)S.fin.tOut+=fee;
  if(to.id===S.user)S.fin.tIn+=fee+sign;
  S.transfers.unshift({season:S.season,w:S.week,pid:p.id,name:fullname(p),pos:p.pos,age:p.age,o:ovr(p),from:from?from.name:'vereinslos',to:to.name,fee,nat:p.nat});
  if(S.transfers.length>200)S.transfers.length=200;
  if(from&&from.id!==S.user&&from.lineup.includes(null))autoLineup(from);
}
function release(p){const c=club(p.club);const cost=releaseCost(p);freeAgent(p);c.budget-=cost;if(c.id===S.user)S.fin.wages+=cost;return cost}
function bestAtPos(c,pos,n){const arr=squadOf(c).filter(p=>p.pos===pos).map(ovr).sort((a,b)=>b-a);let s=0;for(let i=0;i<n;i++)s+=arr[i]!==undefined?arr[i]:30;return s/n}
function weakestPos(c){
  const slots=FORMATIONS[c.tactic.f].s,cnt={};slots.forEach(p=>cnt[p]=(cnt[p]||0)+1);
  let worst=null,wv=1e9;for(const pos in cnt){const v=bestAtPos(c,pos,cnt[pos])+(squadOf(c).filter(p=>p.pos===pos).length<=cnt[pos]?-8:0);if(v<wv){wv=v;worst=pos}}
  return {pos:worst,level:wv};
}
function posIndex(){
  if(CACHE.posIdx)return CACHE.posIdx;const idx={};POS_LIST.forEach(p=>idx[p]=[]);
  for(const p of Object.values(S.players))idx[p.pos].push(p);
  for(const k in idx)idx[k].sort((a,b)=>ovr(b)-ovr(a));return CACHE.posIdx=idx;
}
function aiTransfer(c){
  const dir=c.staff.dir.trait;if(aiBusy(c)>=2)return;
  const max=Math.min(c.tBudget||0,Math.max(0,c.budget))*(dir==='star'?.9:.6);if(max<50000*Math.max(c.econ,.2))return;
  const bill=wageBill(c),need=weakestPos(c),cands=[];
  const minO=dir==='jugend'?0:need.level+2;
  for(const p of posIndex()[need.pos]){
    const o0=ovr(p);if(o0<minO)break;if(cands.length>=25)break;
    if(p.club===c.id||p.inj>0)continue;
    if(dir==='jugend'&&(p.age>23||p.pot<need.level+4))continue;
    if(dir==='erfahrung'&&p.age<26)continue;
    let bf=buyFee(p,c);const tgt=p.club!==null&&p.club!==S.user?sellerTarget(p):bf.fee;
    // Schlüsselspieler kosten einen Aufschlag – ist eine gültige Klausel günstiger, wird sie gezogen
    if(!bf.clause&&bf.rc&&bf.rc<tgt)bf={fee:bf.rc,clause:true};
    if(p.club!==null){const sc=S.clubs[p.club];if(sc.guest||sc.players.length<=19||(sc.rep-c.rep>22&&!bf.clause))continue}
    const price=bf.clause||p.club===null||p.club===S.user?bf.fee:tgt,wage=aiWageFor(p,c),total=price+(p.club===null?wage*6:0);if(total>max*(bf.clause||p.club===null?1:1.5))continue;
    if(bill+wage>c.wBudget)continue;
    const o=ovr(p);
    if(dir==='jugend'){if(p.age>23||p.pot<need.level+4)continue}else if(o<need.level+2)continue;
    if(dir==='erfahrung'&&p.age<26)continue;
    const score=dir==='jugend'?p.pot*2-p.age:dir==='erfahrung'?o:dir==='schnaeppchen'?(o-need.level)/(total/1e6+1):o*3-total/1e7;
    cands.push({p,price,score,cl:bf.clause});
  }
  if(!cands.length)return;
  cands.sort((x,y)=>y.score-x.score);
  const {p,price,cl}=cands[Math.min(cands.length-1,Math.floor(rnd()*Math.min(3,cands.length)))];
  if(p.club===S.user){
    const bf=buyFee(p,c),u=userClub();
    if(bf.clause&&bf.fee<=max){if(startClauseTalk(p,c,bf.fee))return}
    if(S.offers.some(o=>o.pid===p.id)||activeTalk(p.id))return;if(!p.listed&&rnd()<.5)return;
    const of=aiOfferFor(p,c);if(!of)return;
    S.offers.push({id:'o'+(S.nextId++),from:c.id,pid:p.id,fee:of.bid.fee,bid:of.bid,lim:of.lim,rounds:0,w:S.week});
    addNews('offer',`Angebot für ${fullname(p)}`,`${esc(c.name)} (${esc(league(c).name)}, Sportdirektor ${esc(c.staff.dir.name)}, ${DIR[dir].label}) bietet: <b>${bidText(of.bid)}</b>.`);
    return;
  }
  if(p.club!==null){
    if(cl){startClauseTalk(p,c,price,'clause');return}
    aiStartNeg(p,c);return}
  const fromName=p.club!==null?club(p.club).name:'vereinslos';
  doTransfer(p,c,price);trimSquad(c);
  if(c.league===userClub().league)addNews('transfer',`${c.short}: ${fullname(p)} verpflichtet`,`${POS_LABEL[p.pos]}, ${p.age} J., Stärke ${ovr(p)} – von ${esc(fromName)} für ${price?money(price):'ablösefrei'}.`);
}
function aiSell(c){
  const p=squadOf(c).sort((a,b)=>b.val-a.val)[0];if(!p)return;
  const buyer=S.clubs.filter(b=>!b.guest&&b.id!==c.id&&b.id!==S.user&&(b.tBudget||0)>p.val&&b.budget>p.val&&b.players.length<28&&b.rep>=c.rep-10&&wageBill(b)+aiWageFor(p,b)<=b.wBudget).sort((a,b)=>b.budget-a.budget)[0];
  if(!buyer)return;doTransfer(p,buyer,p.val);trimSquad(buyer);autoLineup(buyer);
}
function trimSquad(c){
  while(c.players.length>28){const worst=squadOf(c).sort((a,b)=>(ovr(a)-a.age*.2)-(ovr(b)-b.age*.2))[0];release(worst)}
  let guard=0;
  while(c.players.length<20&&guard++<10){
    const need=weakestPos(c);const free=posIndex()[need.pos].filter(p=>p.club===null);
    const fa=free.sort((a,b)=>Math.abs(ovr(a)-need.level)-Math.abs(ovr(b)-need.level))[0]
      ||Object.values(S.players).filter(p=>p.club===null).sort((a,b)=>ovr(b)-ovr(a))[0];
    if(!fa)break;doTransfer(fa,c,0);
  }
}
function fireCoach(c,reason){
  const old=c.staff.coach;let nt;do{nt=pick(Object.keys(COACH))}while(nt===old.trait);
  const pool=poolArr(ASSOC[c.assoc].pool);
  c.staff.coach={name:pick(pool.f)+' '+pick(pool.l),trait:nt};c.tactic={...COACH[nt].t};c.firedSeason=S.season;autoLineup(c);
  if(c.league===userClub().league)addNews('coach',`Trainerwechsel bei ${c.name}`,`${esc(old.name)} (${COACH[old.trait].label}) muss gehen – ${reason}. Nachfolger: ${esc(c.staff.coach.name)} (${COACH[nt].label}, ${COACH[nt].t.f}).`);
}
function aiWeekly(){
  const win=isWindow();
  for(const c of S.clubs){
    if(c.id===S.user||c.guest)continue;
    if(win&&rnd()<.4)aiTransfer(c);
    if(win&&c.budget<-3e6*c.econ)aiSell(c);
    trimSquad(c);
    if(S.week>=S.weeks*.3&&c.firedSeason!==S.season){
      const rank=rankOf(c.id),gap=rank-c.expRank;
      if(gap>=5&&rnd()<.06*gap/PRES[c.staff.pres.trait].patience/5)fireCoach(c,`Platz ${rank} statt Platz ${c.expRank} wie erwartet`);
    }
    autoLineup(c);
  }
}

/* ---------- Woche spielen ---------- */
function weeklyFinances(homeSet){
  for(const c of S.clubs){
    if(c.guest)continue;
    const wages=wageBill(c),tv=tvIncome(c);let tickets=0;
    if(homeSet.has(c.id)){const L=league(c),r=rankOf(c.id);const att=Math.round(c.stadium*clamp(.55+c.rep/220+(L.clubs.length-r)/L.clubs.length*.14,.35,1));tickets=att*ticketPrice(c);c.lastAtt=att}
    c.budget+=tv+tickets-wages;c.tBudget=Math.min(c.tBudget||0,Math.max(0,c.budget));
    if(c.id===S.user){S.fin.tv+=tv;S.fin.tickets+=tickets;S.fin.wages+=wages;S.fin.log.unshift({w:S.week+1,tv,tickets,wages,bal:c.budget});if(S.fin.log.length>60)S.fin.log.length=60}
  }
}
function nextUserMatch(){
  const c=userClub(),L=league(c);
  for(let r=0;r<L.fixtures.length;r++){const m=L.fixtures[r].find(m=>m.h===c.id||m.a===c.id);if(m&&m.hg===null)return {r,w:L.rw[r],m,L}}
  return null;
}
function playWeek(){
  RNG=S.rng||RNG;resetCache();
  for(const p of Object.values(S.players)){if(p.club===null)continue;if(p.inj>0)p.inj--;p.fit=clamp(p.fit+10+at(p,'nat')/4,0,100)}
  aiWeekly();clauseWatch();clauseTalksWeekly();
  const u=userClub();if(u.autoXI)autoLineup(u);const changed=fixLineup(u);
  let userRes=null;const homes=new Set(),played=[];
  for(const L of S.leagues){
    const r=L.wr[S.week];if(r===undefined)continue;played.push({L,r});
    for(const m of L.fixtures[r]){
      const isU=m.h===S.user||m.a===S.user;
      if(isU&&changed.length)addNews('info','Aufstellung angepasst',`Für verletzte/fehlende Spieler rücken nach: ${changed.map(esc).join(', ')}.`);
      const res=simMatch(club(m.h),club(m.a),isU);m.hg=res.hg;m.ag=res.ag;homes.add(m.h);
      if(isU)userRes={m,r:res,round:r,L};
    }
  }
  const userList=userRes?[userRes]:[];
  playSupercupWeek(userList);
  playCompWeek(userList);
  playNatCupWeek(userList);
  CACHE.tables={};
  weeklyFinances(homes);
  for(const p of Object.values(S.players)){
    if(p.club===null)continue;const c=club(p.club);if(c.guest)continue;
    if(p.inj===0&&league(c).wr[S.week]!==undefined){if(c.lineup.includes(p.id))p.mor+=1.5;else p.mor-=ROLES[p.role].exp*3}
    p.mor=clamp(p.mor+(70-p.mor)*.03,15,100);
    if(c.id===S.user){
      if(p.mor<35&&!p.unhappy&&ROLE_ORDER.indexOf(p.role)<=1){p.unhappy=true;addNews('board',`${fullname(p)} ist unzufrieden`,`Als ${ROLES[p.role].label} erwartet er mehr Einsatzzeit. Stell ihn auf, gib ihm eine andere Rolle bei einer Vertragsverlängerung oder setze ihn auf die Transferliste.`)}
      if(p.mor>50)p.unhappy=false;
    }
  }
  S.offers=S.offers.filter(o=>(o.wait||S.week-o.w<2)&&S.players[o.pid]&&S.players[o.pid].club===S.user);
  S.week++;
  processBids();processAiNegs();
  const ws=winterStart();
  if(S.week===4)addNews('info','Transferfenster geschlossen',`Das Sommer-Transferfenster ist zu. Nächste Chance: Woche ${ws+1}.`);
  if(S.week===ws)addNews('info','Wintertransferfenster geöffnet','Für drei Wochen sind Transfers wieder möglich.');
  if(S.week===ws+3)addNews('info','Wintertransferfenster geschlossen','Ab jetzt zählt nur noch der Kader, den du hast.');
  if(S.week===Math.floor(S.weeks*.35)||S.week===Math.floor(S.weeks*.7)){const exp=squadOf(u).filter(p=>p.until<=S.season);if(exp.length)addNews('board','Auslaufende Verträge',`Am Saisonende ablösefrei weg, wenn du nicht verlängerst: ${exp.map(p=>esc(pname(p))+' ('+p.pos+', '+ovr(p)+')').join(', ')}.`)}
  S.rng=RNG;save();
  return {userRes,userList,played};
}

/* ---------- Saisonende ---------- */
function develop(p){
  const o=Math.round(rawRateAt(p,p.pos));
  const drive=.55+(at(p,'det')+at(p,'prf'))/40;   // 0.6 … 1.55
  let d;
  if(p.age<=21)d=(p.pot-o)*(.18+rnd()*.25)*drive;
  else if(p.age<=24)d=(p.pot-o)*(.14+rnd()*.2)*drive;
  else if(p.age<=29)d=gauss()*1.1+(drive-1)*.8;
  else if(p.age<=31)d=-(.8+rnd()*1.8)/Math.max(.7,drive);
  else d=-(1.8+rnd()*3.2)/Math.max(.7,drive);
  const v=decodeAt(p),w=WEIGHTS[p.pos];
  ATTR_KEYS.forEach((k,i)=>{
    const g=ATTR_GROUP[k];if(g==='hid')return;
    if(g==='gk'&&p.pos!=='TW')return;
    let dd=d/5*(w[k]?1.15:.55)+gauss()*.35;
    if(g==='phys'&&['pac','acc','agi','sta'].includes(k)&&p.age>=29)dd-=.25+(p.age-29)*.08;   // Tempo baut zuerst ab
    if(['dec','ant','cmp','pos','ldr','vis','tea'].includes(k)&&p.age>=24&&p.age<=33)dd+=.18;  // Erfahrung
    v[i]=clamp(v[i]+dd,1,20);
  });
  p.at=encodeAt(v);CACHE.rate.delete(p);CACHE.ovr.delete(p);
  const no=Math.round(rawRateAt(p,p.pos));
  if(no>p.pot){const fix=(p.pot-no)/5;for(const [ix] of WIDX[p.pos])v[ix]=clamp(v[ix]+fix,1,20);p.at=encodeAt(v);CACHE.rate.delete(p);CACHE.ovr.delete(p)}
  const nn=ovr(p);if(p.pot<nn)p.pot=nn;if(p.age>=24)p.pot=Math.max(nn,Math.min(p.pot,nn+2));
  // mit Spielpraxis lernen junge Spieler neue Positionen
  if(p.age<=26&&rnd()<.15){const pp=p.pp.split('').map(c=>c.charCodeAt(0)-64);const q=pick(POS_LIST.filter(x=>x!==p.pos&&x!=='TW'&&p.pos!=='TW'));if(q){const i=POS_IDX[q];pp[i]=Math.min(18,pp[i]+ri(1,3));p.pp=String.fromCharCode(...pp.map(f=>64+f));CACHE.rate.delete(p)}}
}
function bgSeason(){
  for(const a of ASSOCS){
    if(S.active.includes(a.code))continue;const st=assocStructure(a.code,S.seed);if(!st.length)continue;
    const names=st[0].clubs;const champ=wpick(names.map((n,i)=>({n,i})),x=>Math.pow(names.length-x.i,2.2)).n;
    (S.bg[a.code]=S.bg[a.code]||[]).unshift({season:S.season,champ});S.bg[a.code].length=Math.min(S.bg[a.code].length,10);
  }
}
function seasonEnd(){
  RNG=S.rng||RNG;resetCache();
  closeComps();closeNatCups();finalizeCoef();
  S.qualOrder={};for(const L of S.leagues)if(L.tier===1)S.qualOrder[L.assoc]=tableOf(L).map(r=>r.id);
  S.prevTables={};for(const L of S.leagues)S.prevTables[L.id]=tableOf(L).map(r=>r.id);
  const u=userClub(),uL=league(u),uTab=tableOf(uL),uRank=uTab.findIndex(r=>r.id===S.user)+1;
  // Prämien, Ruf, Meister
  for(const L of S.leagues){
    const tab=tableOf(L),n=tab.length;
    tab.forEach((r,i)=>{const c=club(r.id),prize=(n-i)*1e6*c.econ*(L.tier===1?1:.6)+(i===0?5e6*c.econ:0);c.budget+=prize;if(c.id===S.user)S.fin.prize+=prize;c.rep=clamp(Math.round(c.rep+(c.expRank-(i+1))*.5),5,99);c.lastRank=i+1});
    L.champs.unshift({season:S.season,champ:club(tab[0].id).name});if(L.champs.length>15)L.champs.length=15;
  }
  const topScorer=uL.clubs.flatMap(id=>squadOf(club(id))).sort((a,b)=>b.goals-a.goals)[0];
  S.history.unshift({season:S.season,league:uL.name,champ:club(uTab[0].id).name,userRank:uRank,userClub:u.name,top:topScorer?`${fullname(topScorer)} (${topScorer.goals})`:'-'});
  addNews('board',`Saisonbilanz ${S.season}/${(S.season+1)%100}`,`Platz ${uRank} in der ${esc(uL.name)}. Ziel war: ${u.target.t}. ${uRank<=u.target.r?'Der Vorstand ist sehr zufrieden!':uRank<=u.target.r+3?'Der Vorstand ist einigermaßen zufrieden.':'Der Vorstand ist enttäuscht – nächste Saison muss es besser laufen.'}`);
  addNews('info',`${club(uTab[0].id).name} ist Meister der ${uL.name}!`,`Torschützenkönig: ${topScorer?esc(fullname(topScorer))+' mit '+topScorer.goals+' Toren':'-'}.`);
  // KI-Trainer
  for(const c of S.clubs){if(c.id===S.user||c.guest)continue;const gap=c.lastRank-c.expRank;if(gap>=6/PRES[c.staff.pres.trait].patience&&c.firedSeason!==S.season)fireCoach(c,`Saison auf Platz ${c.lastRank} beendet`)}
  // Auf- und Abstieg
  const moves=[];
  for(const code of S.active){
    const Ls=S.leagues.filter(L=>L.assoc===code).sort((a,b)=>a.tier-b.tier);
    for(let t=0;t<Ls.length-1;t++){
      const up=Ls[t],lo=Ls[t+1],k=up.down;if(!k)continue;
      const down=tableOf(up).slice(-k).map(r=>r.id),prom=tableOf(lo).slice(0,k).map(r=>r.id);
      moves.push({down,prom,up,lo});
    }
  }
  for(const mv of moves){
    mv.up.clubs=mv.up.clubs.filter(id=>!mv.down.includes(id)).concat(mv.prom);
    mv.lo.clubs=mv.lo.clubs.filter(id=>!mv.prom.includes(id)).concat(mv.down);
    mv.down.forEach(id=>{const c=club(id);c.relegS=S.season+1;c.league=mv.lo.id;c.econ=econOf(c.assoc,mv.lo.tier);c.rep=clamp(c.rep-3,5,99)});
    mv.prom.forEach(id=>{const c=club(id);c.league=mv.up.id;c.econ=econOf(c.assoc,mv.up.tier);c.rep=clamp(c.rep+3,5,99)});
    if(mv.down.includes(S.user))addNews('board','Abstieg 😞',`Dein ${esc(u.name)} steigt in die ${esc(mv.lo.name)} ab. Einnahmen und Budgets sinken deutlich.`);
    if(mv.prom.includes(S.user))addNews('board','AUFSTIEG! 🎉',`Dein ${esc(u.name)} steigt in die ${esc(mv.up.name)} auf!`);
    if(uL.assoc===mv.up.assoc)addNews('info',`Auf- und Abstieg ${esc(mv.up.name)}`,`Absteiger: ${mv.down.map(id=>esc(club(id).name)).join(', ')} · Aufsteiger: ${mv.prom.map(id=>esc(club(id).name)).join(', ')}.`);
  }
  // Vertragsprämien & Gehaltsanpassungen
  seasonContracts({champ:uRank===1,promo:moves.some(mv=>mv.prom.includes(S.user)),releg:moves.some(mv=>mv.down.includes(S.user))});
  // Karrierezeilen der Saison abschließen
  for(const p of Object.values(S.players))closeRow(p);
  // Vertragsenden
  const leaving=[];
  for(const p of Object.values(S.players)){
    if(p.club===null||p.until>S.season)continue;const c=club(p.club);if(c.guest)continue;
    if(c.id===S.user){leaving.push(fullname(p));freeAgent(p);continue}
    if(aiKeeps(p,c)){const r=suggestRole(p,c);p.until=S.season+(p.age<=24?ri(2,4):p.age>=31?1:ri(1,3));p.wage=rw(calcWage(p)*c.econ*ROLES[r].wage);p.role=r}
    else freeAgent(p);
  }
  if(leaving.length)addNews('transfer','Verträge ausgelaufen',`Ablösefrei verlassen den Verein: ${leaving.map(esc).join(', ')}.`);
  // Altern, Entwicklung, Karriereende
  const retired=[];
  for(const p of Object.values(S.players)){
    p.age++;develop(p);p.goals=0;p.apps=0;p.ast=0;p.yc=0;p.cs=0;p.rs=0;p.rn=0;p.fit=100;p.inj=0;p.mor=70;p.negTries=0;p.unhappy=false;
    if(p.age>=36||(p.age>=33&&rnd()<.3)||(p.club===null&&p.age>=34)){
      if(p.club!==null){const c=club(p.club);c.players=c.players.filter(x=>x!==p.id);c.lineup=c.lineup.map(x=>x===p.id?null:x);if(c.id===S.user)retired.push(fullname(p))}
      delete S.players[p.id];continue;
    }
    p.val=calcValue(p);if(p.club===null)p.wage=rw(calcWage(p)*.5);
  }
  CACHE.ovr=new Map();CACHE.rate=new Map();CACHE.posIdx=null;
  if(retired.length)addNews('info','Karriereende',`Aus deinem Kader beenden ihre Karriere: ${retired.map(esc).join(', ')}.`);
  // Jugend
  for(const c of S.clubs){
    if(c.guest)continue;
    const yj=c.staff.dir.trait==='jugend',n=yj?3:2,names=[];
    for(let i=0;i<n;i++){const q=36+c.rep*.3+(yj?5:0);const p=genPlayer(pick(POS_LIST),q,ri(16,18),c.assoc);p.pot=clamp(p.pot+(yj?6:0),0,96);p.club=c.id;p.until=S.season+3;p.role='perspektive';p.wage=rw(calcWage(p)*.8*c.econ);S.players[p.id]=p;c.players.push(p.id);if(c.id===S.user)materializeContract(p);names.push(`${fullname(p)} (${p.pos}, Pot. ${p.pot})`)}
    if(c.id===S.user)addNews('transfer','Neue Jugendspieler',`Aus der Akademie rücken auf: ${names.map(esc).join(', ')}.`);
  }
  refillFreeAgents();
  const fas=Object.values(S.players).filter(p=>p.club===null).sort((a,b)=>ovr(b)-ovr(a));
  fas.slice(60+S.active.length*15).forEach(p=>delete S.players[p.id]);
  bgSeason();
  // Neue Saison
  S.season++;S.week=0;S.offers=[];S.talks=[];S.pbids=[];S.bidRes={};S.aineg=[];resetCache();
  for(const L of S.leagues)[...L.clubs].map(club).sort((a,b)=>b.rep-a.rep).forEach((c,i)=>c.expRank=i+1);
  schedule();
  S.fin={tv:0,tickets:0,wages:0,tIn:0,tOut:0,prize:0,cups:0,bonus:0,bon:{},log:[]};
  payInstallments();
  for(const c of S.clubs){if(c.guest)continue;if(c.id!==S.user){trimSquad(c);assignRoles(c)}initBudgets(c);autoLineup(c);c.target=boardTarget(c)}
  fixLineup(u);
  setupComps();setupSupercups();setupNatCups();
  const uc=userComps();if(uc.length)teamBonus('ic','Qualifikation für '+uc.map(C=>COMP[C.key].name).join(', '));
  if(uc.length)addNews('board','Internationale Wettbewerbe',`Dein Verein spielt in dieser Saison: ${uc.map(C=>COMP[C.key].name).join(', ')}. Denk an Rotation – unter der Woche kommen zusätzliche Spiele dazu.`);
  addNews('board',`Saison ${S.season}/${(S.season+1)%100}: Neue Ziele`,`Liga: ${esc(league(u).name)}. Der Vorstand erwartet: <b>${u.target.t}</b>. Transferbudget: ${money(u.tBudget)}, Gehaltsbudget: ${money(u.wBudget)}/Woche.`);
  S.rng=RNG;save();
}

/* ---------- Speichern (IndexedDB, Fallback localStorage) ---------- */
const IDB={db:null,
  open(){return new Promise((res,rej)=>{try{const r=indexedDB.open('seitenlinie',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>{IDB.db=r.result;res(r.result)};r.onerror=()=>rej(r.error)}catch(e){rej(e)}})},
  async get(k){const db=IDB.db||await IDB.open();return new Promise((res,rej)=>{const q=db.transaction('kv','readonly').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})},
  async set(k,v){const db=IDB.db||await IDB.open();return new Promise((res,rej)=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})},
  async del(k){const db=IDB.db||await IDB.open();return new Promise((res)=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').delete(k);t.oncomplete=()=>res();t.onerror=()=>res()})}};
let SAVE_STATUS='ok';
function writeMeta(){try{const c=userClub();localStorage.setItem(META_KEY,JSON.stringify({club:c.name,league:league(c).name,season:S.season,week:S.week,weeks:S.weeks,v:VERSION}))}catch(e){}}
let SAVE_BUSY=false,SAVE_PENDING=false;
function save(){
  if(!S||S.user===null)return;S.rng=RNG;writeMeta();
  if(SAVE_BUSY){SAVE_PENDING=true;return}
  SAVE_BUSY=true;const txt=JSON.stringify(S);
  const done=()=>{SAVE_BUSY=false;if(SAVE_PENDING){SAVE_PENDING=false;save()}};
  IDB.set(SAVE_KEY,txt).then(()=>{SAVE_STATUS='ok';done()}).catch(()=>{try{localStorage.setItem(SAVE_KEY,txt);SAVE_STATUS='ok'}catch(e){SAVE_STATUS='fail'}done()});
}
async function loadSave(){
  let t=null;try{t=await IDB.get(SAVE_KEY)}catch(e){}
  if(!t){try{t=localStorage.getItem(SAVE_KEY)}catch(e){}}
  if(!t)return null;try{return JSON.parse(t)}catch(e){return null}
}
function readMeta(){try{return JSON.parse(localStorage.getItem(META_KEY)||'null')}catch(e){return null}}
function hasOldSave(){try{return OLD_KEYS.some(k=>localStorage.getItem(k))}catch(e){return false}}
function applySave(obj){
  if(!obj||!obj.clubs||!obj.players)throw new Error('Ungültiger Spielstand');
  if((obj.v||1)<3)throw new Error('alt');
  S=obj;RNG=S.rng||1;resetCache();
  if(S.v<4){S.comps=[];S.compHist={};S.guests={};S.qualOrder=null;S.v=4;addNews('info','Neu: Internationale Wettbewerbe','Champions League, Copa Libertadores & Co. starten ab der nächsten Saison. Die Startplätze kommen aus den Abschlusstabellen dieser Saison.')}
  if(S.v<5){
    S.ncups=[];S.cupWinners={};S.natHist={};S.coefHist=initCoef();S.coefSeason={};
    for(const C of S.comps){
      if(C.bg&&C.slots&&!C.entries)C.entries=C.slots.map(x=>{const L=assocStructure(x.code,S.seed)[0];return L&&L.clubs[x.pos]?{code:x.code,name:L.clubs[x.pos],rep:repFor(ASSOC[x.code],1,x.pos,L.clubs.length)}:null}).filter(Boolean);
      const list=C.bg?(C.entries||[]).map(e=>e.code):(C.teams||[]).map(id=>club(id).assoc);list.forEach(code=>{coefClub(code);coefAdd(code,COEF_BONUS[COMP[C.key].level]||0)});
    }
    S.v=5;S.migratedTo5=true;addNews('info','Neu: Nationale Pokale & Fünfjahreswertung','Die Pokale starten ab der nächsten Saison. Die Fünfjahreswertung läuft ab sofort mit – sie bestimmt künftig die internationalen Startplätze.');
  }
  if(S.v<6){
    S.supercups=[];S.scHist={};S.prevTables=null;S.prevCup={};
    if((S.ncups||[]).some(c=>!c.spec)){S.ncups=[];addNews('info','Neu: Pokale mit Amateuren, Verlängerung & Supercups','Die Pokale starten im neuen Format (mit Amateurvereinen und echten Länderregeln) ab der nächsten Saison. Supercups folgen, sobald Meister und Pokalsieger einer Saison feststehen.')}
    else addNews('info','Neu: Amateure im Pokal, Verlängerung & Supercups','Ab sofort gibt es in allen K.-o.-Spielen Verlängerung vor dem Elfmeterschießen. Supercups starten, sobald Meister und Pokalsieger feststehen.');
    S.v=6;
  }
  if(S.v<7){
    // alte 8 Attribute → FM-Attributsystem
    const OW={TW:{tor:.85,pas:.07,kop:.08},IV:{zwk:.4,kop:.28,tem:.15,pas:.12,aus:.05},AV:{zwk:.3,tem:.28,aus:.2,pas:.15,tec:.07},DM:{zwk:.35,pas:.3,aus:.2,tec:.15},ZM:{pas:.35,tec:.25,aus:.2,zwk:.1,abs:.1},OM:{tec:.35,pas:.3,abs:.25,tem:.1},FL:{tem:.35,tec:.3,pas:.2,abs:.15},ST:{abs:.45,tem:.2,kop:.15,tec:.2}};
    const MAP={tem:['pac','acc'],tec:['tec','dri','fir'],pas:['pas','vis'],abs:['fin','lon','cmp'],zwk:['tck','mar','str'],kop:['hea','jum'],aus:['sta','nat','wor'],tor:['ref','han','ovo','aer']};
    for(const pl of Object.values(S.players)){
      if(!pl.a||pl.at)continue;
      let q=0;for(const k in OW[pl.pos])q+=pl.a[k]*OW[pl.pos][k];
      pl.at=genAttributes(pl.pos,clamp(q,15,97),pl.age);
      const v=decodeAt(pl),keys=Object.keys(MAP).filter(k=>k!=='tor'||pl.pos==='TW'),mean=keys.reduce((t,k)=>t+pl.a[k],0)/keys.length;
      for(const k of keys)for(const t of MAP[k])v[AIDX[t]]=clamp(v[AIDX[t]]+(pl.a[k]-mean)/5*.6,1,20);
      pl.at=encodeAt(v);pl.pp=genFamiliarity(pl.pos,at(pl,'ver'));delete pl.a;
    }
    resetCache();
    for(const pl of Object.values(S.players)){if(pl.pot<ovr(pl))pl.pot=ovr(pl)}
    addNews('info','Neu: Spielerprofile wie im Football Manager','Jeder Spieler hat jetzt rund 50 Eigenschaften auf einer Skala von 1–20, Positionsvertrautheiten und eine Persönlichkeit. Die Stärkewerte wurden neu berechnet.');
    S.v=7;
  }
  if(S.v<8){
    S.statsFrom=S.season;
    addNews('info','Neu: Ausführliche Spielerprofile','Spielerkarten zeigen jetzt Steckbrief, Vertragsdetails und die komplette Karriere mit allen Stationen. Vorlagen, Karten, weiße Westen und Spielnoten werden ab sofort erfasst.');
    S.v=8;
  }
  if(S.v<9){
    squadOf(userClub()).forEach(materializeContract);S.fin.bonus=S.fin.bonus||0;S.fin.bon=S.fin.bon||{};
    addNews('info','Neu: Vertragspakete','Verträge enthalten jetzt Prämien, Gehaltsanpassungen und Ausstiegsklauseln. Gehälter werden pro Monat angezeigt – brutto und netto. Die bestehenden Verträge deiner Spieler wurden mit ihren Standardklauseln übernommen.');
    S.v=9;
  }
  save();
}
function exportText(){S.rng=RNG;return JSON.stringify(S)}
