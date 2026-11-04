/* =====================================================================
   Seitenlinie – Verträge: Prämien, Gehaltsanpassungen, Ausstiegsklauseln,
   Steuern (brutto/netto). Gehälter werden intern pro Woche geführt und
   in der Oberfläche pro Monat angezeigt (Woche × 52 / 12).
   ===================================================================== */
const mon=w=>w*52/12, wk=m=>m*12/52;
function nice(v){if(v<=0)return 0;const e=Math.pow(10,Math.max(2,Math.floor(Math.log10(v))-1));return Math.round(v/e)*e}

/* ---------- Steuern & Abgaben ----------
   Vereinfachte Näherung für Profifußballer: t = Grenzsteuersatz für Spitzenverdiener
   inkl. Zuschlägen/Sozialabgaben, f = Sockel (€/Jahr), der die Progression annähert. */
const TAX={
 GER:[.475,22000,'Einkommensteuer 45 % + Solidaritätszuschlag'],ENG:[.47,16000,'Income Tax 45 % + National Insurance'],WAL:[.47,16000,'Income Tax 45 % + National Insurance'],NIR:[.47,16000,'Income Tax 45 % + National Insurance'],
 SCO:[.50,16000,'Scottish Income Tax 48 % + National Insurance'],ESP:[.47,20000,'IRPF (staatlich + regional, Ø)'],ITA:[.465,18000,'IRPEF 43 % + Regional-/Gemeindezuschlag'],FRA:[.52,20000,'Impôt sur le revenu 45 % + Zuschläge, CSG'],
 NED:[.495,20000,'Inkomstenbelasting 49,5 %'],POR:[.53,18000,'IRS 48 % + Solidaritätszuschlag'],BEL:[.53,18000,'Personenbelasting 50 % + Gemeindesteuer'],AUT:[.50,20000,'Einkommensteuer 50 %'],
 SUI:[.38,25000,'Bundes-, Kantons- und Gemeindesteuer (Ø)'],TUR:[.20,0,'Sondersteuer für Berufsfußballer'],GRE:[.44,12000,'Einkommensteuer 44 %'],DEN:[.52,20000,'Indkomstskat (Ø)'],SWE:[.52,20000,'Inkomstskatt (Ø)'],
 NOR:[.47,20000,'Inntektsskatt + Trinnskatt'],FIN:[.51,20000,'Tulovero (Ø)'],IRL:[.52,15000,'Income Tax 40 % + USC + PRSI'],POL:[.36,10000,'PIT 32 % + Gesundheitsbeitrag'],CZE:[.23,0,'Daň z příjmů 23 %'],
 CRO:[.30,8000,'Porez na dohodak (Ø)'],SRB:[.20,0,'Einkommensteuer (Ø)'],UKR:[.23,0,'Einkommensteuer 18 % + Militärabgabe'],RUS:[.22,0,'NDFL (progressiv bis 22 %)'],ISR:[.50,15000,'Einkommensteuer + Zuschlag'],
 KSA:[0,0,'keine Einkommensteuer'],UAE:[0,0,'keine Einkommensteuer'],QAT:[0,0,'keine Einkommensteuer'],KUW:[0,0,'keine Einkommensteuer'],BHR:[0,0,'keine Einkommensteuer'],OMA:[0,0,'keine Einkommensteuer'],
 USA:[.45,20000,'Federal 37 % + State Tax (Ø)'],CAN:[.53,20000,'Federal + Provincial (Ø)'],MEX:[.35,8000,'ISR 35 %'],BRA:[.275,6000,'IRPF 27,5 %'],ARG:[.35,8000,'Ganancias 35 %'],COL:[.39,8000,'Renta 39 %'],
 CHI:[.40,8000,'Impuesto Global Complementario'],URU:[.36,8000,'IRPF 36 %'],JPN:[.55,15000,'Einkommen- + Einwohnersteuer'],KOR:[.495,12000,'Einkommensteuer 45 % + Lokalsteuer'],CHN:[.45,8000,'IIT 45 %'],
 AUS:[.47,15000,'Income Tax 45 % + Medicare Levy'],IND:[.39,6000,'Einkommensteuer inkl. Zuschläge'],EGY:[.275,3000,'Einkommensteuer 27,5 %'],MAR:[.38,4000,'IR 38 %'],RSA:[.45,10000,'Income Tax 45 %'],NGA:[.24,3000,'PIT 24 %']};
const TAX_CONF={UEFA:[.42,14000],CONMEBOL:[.33,6000],CONCACAF:[.30,6000],CAF:[.30,3000],AFC:[.25,5000],OFC:[.33,8000]};
function taxOf(code){const t=TAX[code];if(t)return {t:t[0],f:t[1],lbl:t[2]};const a=ASSOC[code],c=TAX_CONF[a?a.confed:'UEFA']||TAX_CONF.UEFA;return {t:c[0],f:c[1],lbl:'vereinfachter Landesdurchschnitt'}}
function netOf(grossYear,code){const T=taxOf(code),tax=Math.max(0,(grossYear-T.f)*T.t);return {gross:grossYear,tax,net:grossYear-tax,rate:grossYear?tax/grossYear:0,lbl:T.lbl,top:T.t}}

/* ---------- Bausteine ---------- */
// Prämien (Beträge in €): ap Einsatz, gl Tor, as Vorlage, cs Zu-null, ti Meisterschaft, cu Pokal-/Cup-Titel,
// pr Aufstieg, ic Qualifikation international, lo Treue (je Saison), si Unterschrift (einmalig)
const BONUS=[
 {k:'si',lbl:'Unterschriftsprämie',unit:'einmalig',lv:[0,1,3,6],base:'m',hint:'wird bei Vertragsunterschrift ausgezahlt'},
 {k:'ap',lbl:'Einsatzprämie',unit:'pro Pflichtspiel',lv:[0,.05,.1,.2],hint:'für jeden Einsatz in der Startelf'},
 {k:'gl',lbl:'Torprämie',unit:'pro Tor',lv:[0,.1,.25,.5],att:1},
 {k:'as',lbl:'Vorlagenprämie',unit:'pro Vorlage',lv:[0,.05,.15,.3],att:1},
 {k:'cs',lbl:'Zu-null-Prämie',unit:'pro Spiel ohne Gegentor',lv:[0,.05,.15,.3],def:1},
 {k:'ti',lbl:'Meisterprämie',unit:'bei Meisterschaft',lv:[0,4,8,16]},
 {k:'cu',lbl:'Pokalprämie',unit:'je Pokal-/Cup-Titel',lv:[0,2,4,8]},
 {k:'pr',lbl:'Aufstiegsprämie',unit:'bei Aufstieg',lv:[0,4,8,16],lower:1},
 {k:'ic',lbl:'Int. Qualifikationsprämie',unit:'bei Qualifikation',lv:[0,2,4,8],top:1},
 {k:'lo',lbl:'Treueprämie',unit:'pro Saison',lv:[0,2,4,8],hint:'am Saisonende, solange der Vertrag läuft'}];
const BONUS_BY=Object.fromEntries(BONUS.map(b=>[b.k,b]));
const DEF_POS={TW:1,IV:1,AV:1,DM:1};
function bonusAmount(b,lvl,W){const f=b.lv[lvl]||0;return nice(b.base==='m'?mon(W)*f:W*f)}
const RAISE={ri:[0,3,5,10],ar:[null,[25,10],[50,15],[75,25]],up:[0,10,25,50],dn:[0,10,25,50]};
const CLAUSE_TYPES={all:'Alle Vereine',foreign:'Ausländische Vereine',higher:'Vereine einer höheren Liga',intl:'Teilnehmer int. Wettbewerbe',releg:'Nur bei Abstieg'};
function bonusApplies(b,p,c){
  const L=c&&league(c);
  if(b.att&&p.pos==='TW')return false;if(b.def&&!DEF_POS[p.pos])return false;
  if(b.lower&&(!L||L.tier===1))return false;if(b.top&&(!L||L.tier!==1))return false;return true;
}

/* ---------- KI-Standardverträge (deterministisch, werden nicht gespeichert) ---------- */
function aiContract(p){
  const c=p.club!==null?club(p.club):null;if(!c)return {};
  const R=mkRng(hashStr('ct'+p.id+':'+p.until+':'+p.club)),W=p.wage,L=league(c),ct={};
  const lvl=(pr,max)=>R()<pr?1+Math.floor(R()*max):0;
  const set=(k,l)=>{const b=BONUS_BY[k];if(l&&bonusApplies(b,p,c))ct[k]=bonusAmount(b,l,W)};
  set('ap',lvl(.8,2));set('gl',lvl(.7,3));set('as',lvl(.35,2));set('cs',lvl(.6,2));set('ti',lvl(.5,2));set('cu',lvl(.35,2));set('pr',lvl(.6,2));set('ic',lvl(.45,2));set('lo',lvl(.25,2));
  if(R()<.3)ct.ri=RAISE.ri[1+Math.floor(R()*2)];
  if(p.age<=23&&R()<.35)ct.ar=RAISE.ar[1+Math.floor(R()*2)].slice();
  if(L&&L.tier>1&&R()<.45)ct.up=RAISE.up[1+Math.floor(R()*2)];
  if(L&&L.down&&c.expRank>L.clubs.length/2&&R()<.4)ct.dn=RAISE.dn[1+Math.floor(R()*2)];
  // Spanien: Ausstiegsklausel gesetzlich üblich (cláusula de rescisión), sonst gelegentlich
  if(c.assoc==='ESP'){ct.rc=nice(Math.max(p.val,5e5)*(3+R()*7));ct.rt='all'}
  else if(R()<.2){const ty=['all','all','foreign','higher','intl','releg'][Math.floor(R()*6)];
    ct.rt=ty==='higher'&&(!L||L.tier===1)?'foreign':ty==='releg'&&(!L||!L.down)?'all':ty;ct.rc=nice(Math.max(p.val,2e5)*(ct.rt==='releg'?.8+R():1.5+R()*3));
    const w=R();if(ct.rt!=='releg'&&w<.2)ct.rf=`${p.until}-07-01`;else if(ct.rt!=='releg'&&w<.35)ct.ru=`${p.until-1}-08-31`}
  return ct;
}
function contractOf(p){return p.ct||aiContract(p)}
function materializeContract(p){if(!p.ct)p.ct=aiContract(p);p.ct.n=p.ct.n||0;return p.ct}

/* ---------- Spielkalender: Woche → Datum (Saison läuft vom 15.07. bis ca. 31.05.) ---------- */
function gameDate(week){const d=new Date(Date.UTC(S.season,6,15));d.setUTCDate(d.getUTCDate()+Math.round((week===undefined?S.week:week)*320/Math.max(S.weeks,1)));return d.toISOString().slice(0,10)}
const fmtDate=iso=>iso?iso.split('-').reverse().join('.'):'';
const isoDays=iso=>Date.UTC(+iso.slice(0,4),+iso.slice(5,7)-1,+iso.slice(8,10))/864e5;
function addDaysIso(iso,n){const d=new Date(Date.UTC(+iso.slice(0,4),+iso.slice(5,7)-1,+iso.slice(8,10)));d.setUTCDate(d.getUTCDate()+Math.round(n));return d.toISOString().slice(0,10)}
// Gültigkeit der Ausstiegsklausel: rf = gültig ab, ru = gültig bis (jeweils inklusive, ISO-Datum)
function clauseState(ct,date){date=date||gameDate();if(ct.rf&&date<ct.rf)return 'pre';if(ct.ru&&date>ct.ru)return 'post';return 'on'}
function clauseWindowText(ct){return ct.rf&&ct.ru?`${fmtDate(ct.rf)} – ${fmtDate(ct.ru)}`:ct.rf?`ab ${fmtDate(ct.rf)}`:ct.ru?`bis ${fmtDate(ct.ru)}`:'gesamte Vertragslaufzeit'}
// Anteil der Restlaufzeit, in dem die Klausel gilt
function clauseShare(ct,start,end){const a=isoDays(start),b=isoDays(end);if(b<=a)return 0;const x=Math.max(a,ct.rf?isoDays(ct.rf):a),y=Math.min(b,ct.ru?isoDays(ct.ru):b);return clamp((y-x)/(b-a),0,1)}
function clauseWatch(){
  const u=userClub();if(!u)return;
  for(const p of squadOf(u)){const ct=p.ct;if(!ct||!ct.rc||(!ct.rf&&!ct.ru))continue;const st=clauseState(ct);
    if(ct.cst&&ct.cst!==st){
      if(st==='on')addNews('transfer',`Ausstiegsklausel aktiv: ${fullname(p)}`,`Ab sofort darf ${esc(pname(p))} für <b>${money(ct.rc)}</b> wechseln (${CLAUSE_TYPES[ct.rt||'all']}, ${clauseWindowText(ct)}).`);
      if(st==='post')addNews('transfer',`Ausstiegsklausel verstrichen: ${fullname(p)}`,`Die Klausel über ${money(ct.rc)} ist am ${fmtDate(ct.ru)} abgelaufen – ein Wechsel geht jetzt nur noch mit deiner Zustimmung.`);
    }ct.cst=st}
}

/* ---------- Ausstiegsklausel ---------- */
function inIntlComp(c){return (S.comps||[]).some(C=>!C.bg&&(C.teams||[]).includes(c.id))}
function clauseApplies(p,buyer,ct){
  ct=ct||contractOf(p);if(!ct.rc||p.club===null||p.loan||clauseState(ct)!=='on')return false;const s=club(p.club);if(!s||!buyer||buyer.id===s.id)return false;
  const Ls=league(s),Lb=league(buyer);
  switch(ct.rt){
    case 'foreign':return buyer.assoc!==s.assoc;
    case 'higher':return !!(Ls&&Lb&&buyer.assoc===s.assoc&&Lb.tier<Ls.tier);
    case 'intl':return inIntlComp(buyer);
    case 'releg':return s.relegS===S.season;
    default:return true;
  }
}
function buyFee(p,buyer){const a=askPrice(p),ct=contractOf(p);if(clauseApplies(p,buyer,ct)&&ct.rc<a)return {fee:ct.rc,clause:true};return {fee:a,clause:false,rc:ct.rc&&clauseApplies(p,buyer,ct)?ct.rc:0}}

/* ---------- Erwartungswerte & Bewertung durch den Spieler ---------- */
function clubOdds(c){
  const L=league(c);if(!L)return {title:0,cup:.02,promo:0,releg:0,intl:0};
  const n=L.clubs.length,r=c.expRank||Math.ceil(n/2);
  return {title:r===1?.45:r===2?.22:r===3?.1:r<=5?.04:.01,cup:r<=2?.22:r<=5?.1:.03,
    promo:L.tier>1&&L.up?(r<=L.up?.55:r<=L.up*2?.2:.05):0,
    releg:L.down?(r>n-L.down?.5:r>n-2*L.down?.2:.04):0,
    intl:L.tier===1?(r<=3?.85:r<=6?.45:r<=9?.15:.03):0};
}
function expStats(p,c,role){
  const L=league(c),games=(L?L.fixtures.length:34)+5,apps=games*clamp(ROLES[role].exp+.08,0,1);
  return {apps,g:apps*RATE_G[p.pos]*Math.pow(at(p,'fin')/12,1.4),a:apps*RATE_A[p.pos],cs:DEF_POS[p.pos]?apps*.3:0};
}
function wishes(p){
  const w=[],o=ovr(p);
  if(at(p,'amb')>=14||p.pot>=o+6)w.push('rc');
  if(p.pos==='TW')w.push('cs');else if(RATE_G[p.pos]>=.2&&at(p,'fin')>=13)w.push('gl');
  if(p.age>=29)w.push('lo');else if(p.age<=23)w.push('ar');
  if(at(p,'prf')>=15&&w.length<3)w.push('ti');
  return w.slice(0,3);
}
const WISH_LABEL={rc:'Ausstiegsklausel',cs:'Zu-null-Prämie',gl:'Torprämie',lo:'Treueprämie',ar:'Gehaltserhöhung nach Einsätzen',ti:'Meisterprämie'};
function bonusEV(p,c,ct,role){
  const E=expStats(p,c,role),O=clubOdds(c);
  return {ap:(ct.ap||0)*E.apps,gl:(ct.gl||0)*E.g,as:(ct.as||0)*E.a,cs:(ct.cs||0)*E.cs,ti:(ct.ti||0)*O.title,cu:(ct.cu||0)*O.cup,pr:(ct.pr||0)*O.promo,ic:(ct.ic||0)*O.intl,lo:ct.lo||0};
}
function clauseWorth(p,c,ct,years){
  if(!ct.rc)return 0;const now=gameDate(),share=clauseShare(ct,now,addDaysIso(now,Math.max(.25,years||1)*365));const O=clubOdds(c),L=league(c);
  const cheap=1-clamp((ct.rc/Math.max(p.val,1e5)-1)/4,0,1);
  const typeF={all:1,foreign:.6,higher:L&&L.tier>1?.7:.05,intl:.7,releg:clamp(O.releg*2.5,0,1)*.5}[ct.rt||'all'];
  return (at(p,'amb')/20)*.12*cheap*typeF*(.25+.75*share)*(share>0?1:0);
}
// Wert des Pakets aus Sicht des Spielers, umgerechnet in garantiertes Wochengehalt
function ctValue(p,c,ct,W,years,role){
  const ev=bonusEV(p,c,ct,role),wi=wishes(p),O=clubOdds(c),E=expStats(p,c,role);
  let b=0;for(const k in ev)b+=ev[k]*(wi.includes(k)?1.3:1);
  let v=W+b*.8/52+(ct.si||0)*.9/(Math.max(1,years)*52);
  if(ct.ri)v+=W*(ct.ri/100)*(years-1)/2*.85;
  if(ct.ar){const tot=E.apps*years,frac=tot>ct.ar[0]?1-ct.ar[0]/tot:0;v+=W*ct.ar[1]/100*frac*.85*(wi.includes('ar')?1.3:1)}
  if(ct.up)v+=W*ct.up/100*O.promo*.8;
  if(ct.dn)v-=W*ct.dn/100*O.releg*1.25;
  v+=W*clauseWorth(p,c,ct,years)*(wi.includes('rc')?1.5:1);
  return v;
}
function ctCostSeason(p,c,ct,W,role){const ev=bonusEV(p,c,ct,role);let b=0;for(const k in ev)b+=ev[k];return {wage:W*52,bonus:b}}

/* ---------- Auszahlungen (nur für den eigenen Verein) ---------- */
function payBonus(amt,why){
  if(!amt)return;const u=userClub();u.budget-=amt;S.fin.bonus=(S.fin.bonus||0)+amt;
  if(why){S.fin.bon=S.fin.bon||{};S.fin.bon[why]=(S.fin.bon[why]||0)+amt}
}
function matchBonuses(c,res,ga){
  if(c.id!==S.user||!S.fin)return;const slots=slotsOf(c);
  c.lineup.forEach((id,i)=>{
    const p=id&&S.players[id];if(!p||!p.ct)return;const ct=p.ct,x=(res.st&&res.st[id])||{g:0,a:0};
    let amt=0;
    if(ct.ap){amt+=ct.ap;payBonus(ct.ap,'ap')}
    if(ct.gl&&x.g){payBonus(ct.gl*x.g,'gl');amt+=ct.gl*x.g}
    if(ct.as&&x.a){payBonus(ct.as*x.a,'as');amt+=ct.as*x.a}
    if(ct.cs&&ga===0&&DEF_POS[slots[i]]){payBonus(ct.cs,'cs');amt+=ct.cs}
    ct.pd=(ct.pd||0)+amt;ct.n=(ct.n||0)+1;
    if(ct.ar&&!ct.ad&&ct.n>=ct.ar[0]){ct.ad=1;const old=p.wage;p.wage=p.wage*(1+ct.ar[1]/100);
      addNews('transfer',`Gehaltserhöhung: ${fullname(p)}`,`Nach ${ct.ar[0]} Pflichtspielen greift die Vertragsklausel: +${ct.ar[1]} % – neu ${money(mon(p.wage))}/Monat (vorher ${money(mon(old))}).`)}
  });
}
function teamBonus(k,label){
  const u=userClub();let tot=0,n=0;
  for(const p of squadOf(u)){const v=p.ct&&p.ct[k];if(!v)continue;payBonus(v,k);p.ct.pd=(p.ct.pd||0)+v;tot+=v;n++}
  if(tot)addNews('board',`${BONUS_BY[k].lbl} ausgezahlt`,`${label}: ${n} Spieler erhalten zusammen <b>${money(tot)}</b>.`);
}
// Saisonende: Meister, Aufstieg/Abstieg, Treue, jährliche Steigerung
function seasonContracts(info){
  const u=userClub();if(!u)return;
  if(info.champ)teamBonus('ti','Meisterschaft');
  if(info.promo)teamBonus('pr','Aufstieg');
  teamBonus('lo','Vertragstreue');
  const msgs=[];
  for(const p of squadOf(u)){
    const ct=p.ct;if(!ct||p.until<=S.season)continue;const old=p.wage;let f=1;
    if(ct.ri)f*=1+ct.ri/100;if(info.promo&&ct.up)f*=1+ct.up/100;if(info.releg&&ct.dn)f*=1-ct.dn/100;
    if(f!==1){p.wage=old*f;msgs.push(`${esc(pname(p))} ${f>1?'+':''}${Math.round((f-1)*100)} %`)}
  }
  if(msgs.length)addNews('transfer','Vertragliche Gehaltsanpassungen',`Zum neuen Vertragsjahr: ${msgs.join(', ')}.`);
  for(const p of squadOf(u))if(p.ct)p.ct.pd=0;
}

/* ---------- Ausstiegsklausel: erst Vertragsgespräche mit dem Spieler, dann Zahlung ----------
   Ein KI-Verein, der die Klausel eines deiner Spieler ziehen will, muss sich zuerst mit dem Spieler
   über einen Vertrag einigen. Erst wenn der Spieler zusagt, wird die Klausel gezahlt und er wechselt. */
function windowEnd(){return S.week<4?3:winterStart()+2}
function activeTalk(pid){return (S.talks||[]).find(t=>t.pid===pid&&t.st==='open')}
/* ---------- Berater ---------- */
const AGENT_TYPES={
 fast:{lbl:'Zügiger Abwickler',d:-1,pay:1,stay:0,desc:'will schnell Klarheit und hält Fristen ein'},
 poker:{lbl:'Pokerspieler',d:1.5,pay:1.35,stay:0,desc:'zieht Gespräche in die Länge, um mehr herauszuholen'},
 family:{lbl:'Familienberater',d:.5,pay:.8,stay:.1,desc:'achtet auf das Umfeld, rät eher zum Bleiben'},
 biz:{lbl:'Geschäftsmann',d:0,pay:1.3,stay:0,desc:'Geld steht im Vordergrund'}};
const AGENCIES=['Sports Management','Football Agency','Player Consulting','Sportsmanagement','Talent Group','Pro Sports'];
function agentOf(p){
  const R=mkRng(hashStr('ag'+p.id)),pool=poolArr(ASSOC[p.nat]?ASSOC[p.nat].pool:'de'),r=R();
  const type=r<.28?'fast':r<.52?'poker':r<.72?'family':'biz';
  const ln=pool.l[Math.floor(R()*pool.l.length)];
  return {name:pool.f[Math.floor(R()*pool.f.length)]+' '+ln,agency:ln+' '+AGENCIES[Math.floor(R()*AGENCIES.length)],type,...AGENT_TYPES[type]};
}
/* Sportliche Lage eines Vereins aus Sicht des Spielers: +1 = top, −1 = Krise */
function clubSituation(c){
  const L=league(c);if(!L)return {v:0,txt:'keine Ligaspiele'};
  const n=L.clubs.length,early=S.week<3,r=early?(c.lastRank||c.expRank):rankOf(c.id),exp=c.expRank||Math.ceil(n/2),where=early?(c.lastRank?'letzte Saison Platz':'Prognose Platz'):'aktuell Platz';
  if(L.down&&r>n-L.down)return {v:-1,txt:`Abstiegskampf (${where} ${r})`};
  if(r<=2&&L.tier===1)return {v:1,txt:`Titelkampf (${where} ${r})`};
  if(L.tier>1&&L.up&&r<=L.up)return {v:.7,txt:`Aufstiegskurs (${where} ${r})`};
  if(r<=exp-3)return {v:.6,txt:`läuft besser als erwartet (${where} ${r})`};
  if(r>=exp+4)return {v:-.6,txt:`sportliche Krise (${where} ${r})`};
  return {v:0,txt:`im Soll (${where} ${r})`};
}
/* Individuelle Verhandlungsdauer in Wochen – mit Begründung */
function talkDuration(p,seller){
  const A=agentOf(p),sit=clubSituation(seller),why=[];let d=2;
  d+=A.d;why.push(`Berater ${A.name}: ${A.lbl}${A.d>0?' – zieht die Gespräche in die Länge':A.d<0?' – will schnell Klarheit':''}`);
  if(p.mor>=75){d+=1;why.push(`Moral hoch (${Math.round(p.mor)}) – fühlt sich wohl, zögert`)}
  else if(p.mor<45){d-=1;why.push(`Moral niedrig (${Math.round(p.mor)}) – will schnell weg`)}
  else why.push(`Moral durchschnittlich (${Math.round(p.mor)})`);
  if(sit.v>=.6){d+=1;why.push(`Verein: ${sit.txt} – er überlegt lange`)}
  else if(sit.v<=-.6){d-=.7;why.push(`Verein: ${sit.txt} – Wechsel ist reizvoll`)}
  else why.push(`Verein: ${sit.txt}`);
  if(inIntlComp(seller)){d+=.5;why.push('spielt mit seinem Verein international')}
  const winter=S.week>=winterStart();if(winter){d-=.5;why.push('Winterfenster – wenig Zeit')}
  else if(S.week===0)why.push('Fenster hat gerade erst geöffnet – genug Zeit');
  d+=(mkRng(hashStr('dur'+p.id+':'+S.season+':'+S.week))()-.5);
  let w=clamp(Math.round(d),1,5);const left=windowEnd()-S.week;let deadline=false;
  if(w>=left){w=left;deadline=true;const k=why.indexOf('Fenster hat gerade erst geöffnet – genug Zeit');if(k>=0)why.splice(k,1);why.push(left<=0?'Deadline Day – Entscheidung noch heute':`Fensterschluss in ${left} ${left===1?'Woche':'Wochen'} – Entscheidung am letzten Tag`)}
  return {w,deadline,why,agent:A,sit};
}
function dealVisible(t){const u=userClub();return [t.from,t.seller].some(id=>{const x=club(id);return x&&x.league===u.league})}
function talkVisible(t){const u=userClub();return t.seller===S.user||t.from===S.user||[t.from,t.seller].some(id=>{const x=club(id);return x&&(x.league===u.league||x.assoc===u.assoc)})}
// kind: 'clause' = Ausstiegsklausel, 'deal' = Vereine haben sich auf eine Ablöse geeinigt
function startClauseTalk(p,c,fee,kind,bid,loan){
  kind=kind||'clause';
  S.talks=S.talks||[];
  if(S.talks.some(t=>t.pid===p.id&&(t.st==='open'||t.from===c.id)))return true; // läuft schon / Verein hat es diese Saison schon versucht
  if(S.talks.some(t=>t.from===c.id&&t.st==='open'))return true;
  const seller=club(p.club);
  if(kind==='clause'&&S.week>=windowEnd()&&seller.id===S.user)return false; // dir bleibt sonst keine Zeit zu reagieren
  const role=suggestRole(p,c),wage=rw(Math.max(aiWageFor(p,c),p.wage*(1.08+rnd()*.35))),years=p.age>=31?ri(1,2):ri(3,5);
  const D=talkDuration(p,seller),dec=S.week+D.w;
  const t={id:'t'+(S.nextId++),kind,bid:bid?normBid(bid):null,loan:loan||null,pid:p.id,from:c.id,seller:seller.id,fee,wage,role,years,w:S.week,dec,st:'open',dur:D.w,deadline:D.deadline,why:D.why};
  S.talks.push(t);
  const dl=`bis Woche ${dec+1} (${fmtDate(gameDate(dec))})`;
  if(kind==='loan'){
    const vis=dealVisible(t)||c.id===S.user||seller.id===S.user;
    tn(vis,[c.id,seller.id],'transfer',`Leihe vereinbart: ${fullname(p)}`,`${esc(seller.name)} und ${esc(c.name)} sind sich über eine Leihe einig (${loanText(loan)}). Jetzt muss ${esc(pname(p))} noch zustimmen – er wäre dort ${ROLES[role].label}. Entscheidung ${dl}.`);
    return true;
  }
  if(kind==='deal'){
    if(seller.id===S.user)tn(true,[c.id,seller.id],'transfer',`Einigung mit ${esc(c.name)}: ${fullname(p)}`,`Die Vereine sind sich einig: <b>${bid?bidText(normBid(bid)):money(fee)}</b>. Jetzt verhandelt ${esc(pname(p))} mit ${esc(c.name)} über seinen Vertrag (ca. ${money(mon(wage))} brutto/Monat als ${ROLES[role].label}, bei dir ${money(mon(p.wage))}). Entscheidung ${dl}. Gründe für die Dauer: ${D.why.map(esc).join('; ')}.`);
    else tn(dealVisible(t),[c.id,seller.id],'transfer',`${esc(c.short)} und ${esc(seller.short)} einig über ${fullname(p)}`,`Ablöse: ${bid?bidText(normBid(bid)):money(fee)} – jetzt muss sich ${esc(pname(p))} noch mit ${esc(c.name)} auf einen Vertrag einigen. Entscheidung ${dl}.`);
    return true;
  }
  if(seller.id===S.user){
    tn(true,[c.id,seller.id],'offer',`Ausstiegsklausel: ${esc(c.name)} verhandelt mit ${fullname(p)}`,`${esc(c.name)} (${esc(leagueName(c))}) will die Klausel über <b>${money(fee)}</b> ziehen und führt Vertragsgespräche mit ${esc(pname(p))}. Laut seinem Berater geht es um rund <b>${money(mon(wage))}</b> brutto/Monat als ${ROLES[role].label} (bei dir aktuell ${money(mon(p.wage))}). Er entscheidet sich bis Woche ${dec+1} (${fmtDate(gameDate(dec))}) – ${D.deadline?'Entscheidung erst zum Fensterschluss':'Verhandlungsdauer ca. '+D.w+' '+(D.w===1?'Woche':'Wochen')}. Gründe: ${D.why.map(esc).join('; ')}. Du kannst den Vertrag nachbessern, um ihn zu halten – an der Klausel selbst lässt er jetzt nicht mehr rütteln.`);
  }else{
    // Der abgebende KI-Verein reagiert: wichtige Spieler sollen mit einem besseren Vertrag gehalten werden
    const key=seller.lineup.includes(p.id)||ROLE_ORDER.indexOf(p.role)<=1,trait=seller.staff.pres.trait;
    const keen=key?(trait==='sparsam'?.35:.65):.15,room=seller.wBudget-wageBill(seller);
    if(rnd()<keen){const nw=rw(Math.min(p.wage+Math.max(0,room),t.wage*(.9+rnd()*.2)));
      if(nw>p.wage){t.counter={old:p.wage,nw};p.wage=nw;p.mor=clamp(p.mor+8,15,100)}}
    tn(talkVisible(t),[c.id,seller.id],'transfer',`${esc(c.short)} will Ausstiegsklausel bei ${fullname(p)} ziehen`,`${esc(c.name)} verhandelt mit ${esc(pname(p))} (${esc(seller.name)}) über einen Wechsel – Klausel: ${money(fee)}.${t.counter?` ${esc(seller.name)} bessert nach und erhöht sein Gehalt auf ${money(mon(t.counter.nw))}/Monat.`:''} Entscheidung bis Woche ${dec+1}${D.deadline?' (Deadline Day)':''}.`);
  }
  return true;
}
// Wie wahrscheinlich sagt der Spieler dem neuen Verein zu?
function talkChance(t){
  const p=S.players[t.pid],c=club(t.from),u=club(t.seller!==undefined?t.seller:S.user);if(!p||!c||!u)return 0;
  const ri_=ROLE_ORDER.indexOf(t.role)-ROLE_ORDER.indexOf(p.role);
  const pay=t.wage/Math.max(1,p.wage)-1,A=agentOf(p),sit=clubSituation(u);
  if(t.kind==='loan')return clamp(.42+(ROLE_ORDER.indexOf(p.role)-ROLE_ORDER.indexOf(t.role))*.12+(p.age<=23?.1:0)-A.stay+(p.mor<50?.1:0),.05,.95);
  const base=t.kind==='deal'?.42+(u.id===S.user&&p.listed?.2:0)+(p.listed&&u.id!==S.user?.15:0):.3;
  return clamp(base+pay*1.1*A.pay-A.stay-sit.v*.09+(t.deadline?.04:0)+(c.rep-u.rep)/30+(at(p,'amb')-10)/35-(p.mor-60)/120-(c.assoc!==u.assoc?(10-at(p,'ada'))/30:0)-ri_*.08-(inIntlComp(c)?0:inIntlComp(u)?.08:0),.03,.95);
}
function clauseTalksWeekly(){
  for(const t of S.talks||[]){
    if(t.st!=='open'||S.week<t.dec)continue;
    const p=S.players[t.pid],c=club(t.from),sid=t.seller!==undefined?t.seller:S.user,mine=sid===S.user;let vis=talkVisible(t);const sn=club(sid)?club(sid).name:'';
    if(!p||!c||p.club!==sid){t.st='void';continue}
    const ct=contractOf(p),deal=t.kind==='deal'||t.kind==='loan',isLoan=t.kind==='loan';
    if(deal)vis=dealVisible(t);
    if(!deal&&!clauseApplies(p,c,ct)){t.st='void';tn(vis,[t.from,sid],'transfer',`Klausel greift nicht mehr: ${fullname(p)}`,`${esc(c.name)} kann die Ausstiegsklausel nicht mehr ziehen – ${esc(pname(p))} bleibt.`);continue}
    const fee=deal?t.fee:Math.min(t.fee,ct.rc||t.fee);
    if(c.budget<fee||!isWindow()){t.st='void';tn(vis||mine,[t.from,sid],'transfer',`Wechsel geplatzt: ${fullname(p)}`,`${esc(c.name)} bekommt die Ablöse von ${money(fee)} nicht rechtzeitig zusammen. ${esc(pname(p))} bleibt.`);continue}
    if(agentOf(p).type==='poker'&&!t.poked&&(mine||!deal)){t.poked=1;const nw=rw(t.wage*(1.05+rnd()*.08));if(c.wBudget-wageBill(c)>=nw||c.id!==S.user){t.wage=nw;tn(mine||vis,[t.from,sid],'transfer',`Berater pokert: ${fullname(p)}`,`${esc(agentOf(p).name)} hat bei ${esc(c.name)} kurz vor der Entscheidung noch mehr herausgeholt: jetzt ${money(mon(nw))} brutto/Monat.`)}}
    if(isLoan){
      if(rnd()<talkChance(t)){t.st='done';executeLoan(p,c,t.loan);trimSquad(c)}
      else{t.st='no';tn(vis||mine||c.id===S.user,[t.from,sid],'transfer',`${fullname(p)} lehnt Leihe ab`,`${esc(pname(p))} möchte nicht zu ${esc(c.name)} – die Leihe kommt nicht zustande.`)}
      continue;
    }
    if(rnd()<talkChance(t)){
      t.st='done';const nm=fullname(p);
      executeDeal(p,c,{...(t.bid||{}),fee},{wage:t.wage,until:S.season+t.years-(S.week<winterStart()?1:0),role:t.role});trimSquad(c);
      if(deal){if(mine)tn(true,[t.from,sid],'transfer',`${nm} verkauft`,`${esc(pname(p))} hat sich mit ${esc(c.name)} geeinigt (${money(mon(t.wage))} brutto/Monat). Der Wechsel ist perfekt: <b>${t.bid?bidText({...t.bid,fee}):money(fee)}</b>.`);
        else tn(vis,[t.from,sid],'transfer',`${esc(c.short)}: ${nm} verpflichtet`,`${POS_LABEL[p.pos]}, ${p.age} J., Stärke ${ovr(p)} – von ${esc(sn)} für ${money(fee)}.`)}
      else if(mine)tn(true,[t.from,sid],'offer',`Ausstiegsklausel gezogen: ${nm}`,`${esc(pname(p))} hat sich mit ${esc(c.name)} geeinigt (${money(mon(t.wage))} brutto/Monat, ${ROLES[t.role].label}). Der Verein hat die Klausel gezogen und <b>${money(fee)}</b> überwiesen – der Wechsel ist perfekt, du konntest ihn nicht verhindern.`);
      else tn(vis,[t.from,sid],'transfer',`${esc(c.short)}: ${nm} per Ausstiegsklausel`,`${esc(pname(p))} hat sich mit ${esc(c.name)} geeinigt. Die Klausel über ${money(fee)} wurde gezogen – ${esc(sn)} konnte den Wechsel nicht verhindern.`);
    }else{
      t.st='no';p.mor=clamp(p.mor+4,15,100);
      if(deal){if(mine)tn(true,[t.from,sid],'transfer',`${fullname(p)} lehnt Wechsel ab`,`Obwohl sich die Vereine einig waren, hat ${esc(pname(p))} sich nicht mit ${esc(c.name)} auf einen Vertrag geeinigt – er bleibt.`);
        else tn(vis,[t.from,sid],'transfer',`${fullname(p)} bleibt bei ${esc(sn)}`,`Die Ablöse war vereinbart, aber ${esc(pname(p))} konnte sich mit ${esc(c.name)} nicht auf einen Vertrag einigen.`)}
      else if(mine)tn(true,[t.from,sid],'transfer',`${fullname(p)} bleibt!`,`${esc(pname(p))} hat die Gespräche mit ${esc(c.name)} abgebrochen und lehnt den Wechsel ab. Die Klausel wurde nicht gezogen.`);
      else tn(vis,[t.from,sid],'transfer',`${fullname(p)} bleibt bei ${esc(sn)}`,`${esc(pname(p))} hat die Gespräche mit ${esc(c.name)} abgebrochen – die Klausel wird nicht gezogen.${t.counter?' Das verbesserte Vertragsangebot seines Vereins hat gewirkt.':''}`);
    }
  }
}
