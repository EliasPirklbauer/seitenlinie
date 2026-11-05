/* =====================================================================
   Seitenlinie – Scouting-Netzwerk: Scouts mit Einsatzgebieten,
   Wissensstand über Spieler (Potenzial & Attribute) und Scoutberichte
   ===================================================================== */
const SCOUT_MAX=5;
function scoutsOf(){const u=userClub();if(!u.scouts){const R=mkRng(hashStr('sc0'+u.id+':'+S.season));const m=crewPerson(u,'scout',clamp(Math.round(crewLevel(u)-2),1,20),R);m.wage=rw(m.wage*.55);m.region={type:'assoc',code:u.assoc};u.scouts=[m]}return u.scouts}
function regionLbl(r){return r.type==='confed'?(CONFEDS.find(c=>c.id===r.code)||{}).region||r.code:natName(r.code)}
function inRegion(r,code){if(!code||!ASSOC[code])return false;return r.type==='confed'?ASSOC[code].confed===r.code:r.code===code}
function playerHome(p){return p.club!==null&&club(p.club)?club(p.club).assoc:p.nat}
// Ist ein Spieler gut bekannt? Eigener Kader, eigene Liga, Scout-Gebiet oder frischer Bericht
function known(p){
  if(!S||S.user===null)return true;
  if(p.club===S.user)return true;
  const u=userClub();if(p.club!==null&&club(p.club)&&club(p.club).league===u.league)return true;
  if(S.known&&S.known[p.id]>=S.season)return true;
  const h=playerHome(p);for(const s of scoutsOf())if(inRegion(s.region,h)||inRegion(s.region,p.nat))return true;
  return false;
}
function fogW(){return Math.max(2,Math.round(5-2*crewK(userClub(),'scout')))}
function fogShift(p,salt,w){return Math.round((mkRng(hashStr('fog'+p.id+salt))()-.5)*w)}
function potDisp(p){if(known(p))return String(p.pot);const w=fogW(),c=p.pot+fogShift(p,'pot',w);return `${clamp(c-w,1,99)}–${clamp(c+w,1,99)}`}
function attrDisp(p,k,v){if(known(p))return null;const w=2,c=v+fogShift(p,k,2);return `${clamp(c-w,1,20)}–${clamp(c+w,1,20)}`}

/* ---------- Scouts einstellen ---------- */
function scoutCands(){
  const u=userClub(),R=mkRng(hashStr('scand'+S.season+':'+S.week)),lvl=crewLevel(u),out=[];
  for(let i=0;i<5;i++){const q=clamp(Math.round(lvl+(R()-.45)*10),1,20);const m=crewPerson(u,'scout',q,R);m.wage=rw(m.wage*.55);m.id='s'+i;m.keen=q<=lvl+2||R()<.5;out.push(m)}
  return out.sort((a,b)=>b.q-a.q);
}
function regionOpts(){
  const o=CONFEDS.map(c=>[`confed:${c.id}`,`🌍 ${c.region}`]);
  const codes=Object.keys(ASSOC).sort((a,b)=>natName(a).localeCompare(natName(b)));
  return o.concat(codes.map(c=>[`assoc:${c}`,natName(c)]));
}

/* ---------- Wöchentliche Berichte ---------- */
const SC_SAY={
  talent:['Ein Rohdiamant. Wenn er so weitermacht, spielt er in drei Jahren ganz oben.','Der Junge hat etwas Besonderes – Ballgefühl, Übersicht, Mentalität.','Noch nicht fertig, aber das Potenzial ist enorm. Früh zuschlagen!'],
  ready:['Sofort eine Verstärkung für uns, ohne Wenn und Aber.','Er würde bei uns direkt spielen. Konstant, zuverlässig, fit.','Genau das Profil, das uns auf dieser Position fehlt.'],
  bargain:['Unterbewertet. Für das Geld bekommt man selten so viel Qualität.','Sein Vertrag läuft bald aus – das könnte ein Schnäppchen werden.','Sein Verein steckt in Geldnöten. Jetzt wäre der Moment.']};
function scoutWeekly(){
  if(!S||S.user===null)return;const sc=scoutsOf();if(!sc.length)return;
  const u=userClub(),need=weakestPos(u),uAvg=clubAvg(u)||60;S.reports=S.reports||[];S.known=S.known||{};
  const seen=new Set(S.reports.filter(r=>r.s===S.season).map(r=>r.pid));
  for(const s of sc){
    if(rnd()>.45+s.q*.015)continue;
    const pool=[];
    for(const p of Object.values(S.players)){
      if(p.club===S.user||seen.has(p.id)||p.age>33)continue;const h=playerHome(p);
      if(!inRegion(s.region,h)&&!inRegion(s.region,p.nat))continue;
      const o=ovr(p),talent=p.age<=21&&p.pot>=uAvg+2,ready=o>=uAvg-1&&o<=uAvg+12,bargain=ready&&(p.until<=S.season||p.club!==null&&club(p.club)&&club(p.club).budget<0);
      if(!talent&&!ready)continue;
      const fit=(p.pos===need.pos?1.6:1)*(talent?1.2:1)*(bargain?1.3:1);
      pool.push({p,sc:(talent?p.pot:o)*fit+rnd()*4,k:bargain?'bargain':talent?'talent':'ready'});
    }
    if(!pool.length)continue;
    pool.sort((a,b)=>b.sc-a.sc);const x=pool[Math.floor(rnd()*Math.min(5,pool.length))];
    // Einschätzung des Scouts: je besser, desto genauer
    const err=Math.round((rnd()-.5)*(22-s.q)/3);
    const rep={id:'r'+(S.nextId++),s:S.season,w:S.week,pid:x.p.id,by:s.name,q:s.q,kind:x.k,pot:x.p.pot+err,o:ovr(x.p),fee:x.p.club!==null?scoutEst(x.p):0,txt:pick(SC_SAY[x.k]),rec:x.k==='talent'||x.p.pos===need.pos?'Verpflichten':'Beobachten'};
    S.reports.unshift(rep);seen.add(x.p.id);S.known[x.p.id]=S.season+1;
    const c=x.p.club!==null?club(x.p.club):null;
    addNews('transfer',`📋 Scoutbericht: ${fullname(x.p)}`,`${esc(s.name)} (${regionLbl(s.region)}): ${esc(fullname(x.p))}, ${x.p.age} J., ${POS_LABEL[x.p.pos]}, ${c?esc(c.name):'vereinslos'}. Stärke ${rep.o}, Potenzial ca. ${rep.pot}. „${rep.txt}“ Empfehlung: <b>${rep.rec}</b>${rep.fee?`, geschätzte Ablöse ${money(rep.fee)}`:''}.`);
  }
  if(S.reports.length>40)S.reports.length=40;
}

/* ---------- Oberfläche (im Mitarbeiter-Bereich) ---------- */
function scoutPanel(){
  const sc=scoutsOf(),reps=(S.reports||[]).slice(0,12);
  const rows=sc.map((s,i)=>`<div class="crow"><span><b>${esc(s.name)}</b> <span class="stars">${stars(s.q)}</span> ${s.q}<small>${s.age} J. · ${esc(natName(s.nat))} · ${money(mon(s.wage))}/Monat · bis ${contractEnd({club:1,until:s.until})}</small></span>
    <span style="display:flex;gap:6px;align-items:center"><select data-chg="scoutRegion" data-i="${i}" style="max-width:190px">${regionOpts().map(([v,l])=>`<option value="${v}" ${v===s.region.type+':'+s.region.code?'selected':''}>${esc(l)}</option>`).join('')}</select><button class="btn sm warn" data-act="scoutFire" data-i="${i}">✕</button></span></div>`).join('');
  const rp=reps.map(r=>{const p=S.players[r.pid];if(!p)return '';const c=p.club!==null?club(p.club):null;
    return `<div class="stl" data-act="player" data-id="${p.id}"><span class="r">${r.kind==='talent'?'💎':r.kind==='bargain'?'💰':'✅'}</span>${c?badge(c,18):''}<span class="nm">${esc(fullname(p))}<small>${p.age} J. · ${p.pos} · ${c?esc(c.short):'vereinslos'} · ${esc(r.by)}: „${esc(r.txt)}“</small></span><b>${r.o}<small class="muted" style="font-size:11px"> / ~${r.pot}</small></b></div>`}).join('');
  return `<div class="card" style="grid-column:1/-1"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Scouting-Netzwerk</h3><span class="small muted">${sc.length}/${SCOUT_MAX} Scouts</span></div>
    <p class="small muted">Jeder Scout beobachtet ein Gebiet – einen Kontinent oder ein Land. Spieler dort (und in deiner eigenen Liga) kennst du genau. Bei allen anderen siehst du Potenzial und Attribute nur als grobe Spanne. Dazu schicken die Scouts regelmäßig Berichte.</p>
    <div class="clist">${rows||'<p class="small muted">Noch keine Scouts angestellt.</p>'}</div>
    ${sc.length<SCOUT_MAX?`<button class="btn sm pri" data-act="scoutHire" style="margin-top:8px">+ Scout einstellen</button>`:''}
    <h3 style="margin-top:14px">Letzte Scoutberichte</h3>${rp||'<p class="small muted">Noch keine Berichte.</p>'}</div>`;
}
function scoutModal(){return ()=>{
  const u=userClub(),cs=scoutCands(),bud=crewBudget(u),cost=crewCost(u);
  return `<h2>Scout einstellen</h2><p class="small muted">Personalbudget frei: ${money(mon(bud-cost))}/Monat. Bessere Scouts schicken häufiger Berichte und schätzen Potenzial genauer ein.</p>
   <label class="f">Einsatzgebiet</label><select id="scoutReg">${regionOpts().map(([v,l])=>`<option value="${v}" ${v==='confed:'+(ASSOC[u.assoc]||{}).confed?'selected':''}>${esc(l)}</option>`).join('')}</select>
   <div class="clist" style="margin-top:10px">${cs.map(m=>{const over=cost+m.wage>bud;return `<div class="crow cand"><span><b>${esc(m.name)}</b> <span class="stars">${stars(m.q)}</span> <b>${m.q}</b><small>${m.age} J. · ${esc(natName(m.nat))} · ${crewQLbl(m.q)}</small></span><span style="text-align:right"><b>${money(mon(m.wage))}/Monat</b><br>${m.keen?`<button class="btn sm ${over?'':'pri'}" data-act="scoutTake" data-id="${m.id}" ${over?'disabled':''}>${over?'Budget reicht nicht':'Einstellen'}</button>`:'<span class="small muted">kein Interesse</span>'}</span></div>`}).join('')}</div>
   <div class="row" style="margin-top:10px"><button class="btn" data-act="closeModal">Schließen</button></div>`;
}}
Object.assign(ACT,{
  scoutHire:()=>{UI.modal=scoutModal();render()},
  scoutTake:d=>{const m=scoutCands().find(x=>x.id===d.id);if(!m)return;const sel=(document.getElementById('scoutReg')||{}).value||'confed:UEFA';const [type,code]=sel.split(':');
    m.region={type,code};m.until=S.season+2;m.since=S.season;delete m.id;delete m.keen;scoutsOf().push(m);
    addNews('board',`Neuer Scout: ${m.name}`,`${esc(m.name)} (Qualität ${m.q}) beobachtet ab sofort ${esc(regionLbl(m.region))}.`);UI.modal=null;save();render()},
  scoutFire:d=>{const sc=scoutsOf(),m=sc[+d.i];if(!m)return;const sev=crewSeverance(m);userClub().budget-=sev;S.fin.staff=(S.fin.staff||0)+sev;sc.splice(+d.i,1);toast(`${m.name} entlassen (Abfindung ${money(sev)})`);save();render()}
});
Object.assign(CHG,{scoutRegion:el=>{const s=scoutsOf()[+el.dataset.i];if(!s)return;const [type,code]=el.value.split(':');s.region={type,code};toast(`${s.name} beobachtet jetzt ${regionLbl(s.region)}`);save();render()}});
