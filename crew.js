/* =====================================================================
   Seitenlinie – Mitarbeiter: Führungsriege, sportlicher Stab, Medizin,
   Scouting & Nachwuchs. Jeder Mitarbeiter hat eine Qualität (1–20),
   Gehalt und Vertrag – und wirkt sich messbar aufs Spiel aus.
   ===================================================================== */
const CREW_GROUPS=[['tasks','Aufgaben'],['lead','Vorstand'],['office','Geschäftsstelle'],['sport','Sportlicher Stab'],['med','Medizin & Leistung'],['scout','Scouting & Nachwuchs'],['board','Aufsichtsrat']];
const CREW={
  ceo:{g:'lead',lbl:'Vorstandsvorsitzender',a:'Wirtschaftliche Führung',wf:2.0,eff:k=>`Sponsoring ${pc(k*60)}`,desc:'Führt den Verein wirtschaftlich, verantwortet Sponsoring und vertritt den Vorstand gegenüber dem Aufsichtsrat.',board:1},
  cfo:{g:'lead',lbl:'Finanzvorstand',a:'Finanzplanung',wf:1.4,eff:k=>`Zinserträge & Kostenkontrolle ${pc(k*100)}`,desc:'Gibt Budgets frei, legt Rücklagen an und hält die Kosten im Griff.',board:1},
  dirq:{g:'lead',lbl:'Sportdirektor',a:'Verhandlungsgeschick',wf:1.6,eff:k=>`Geduld der Gegenseite in Verhandlungen ${sg(Math.round(k*15))}`,desc:'Verantwortet Kader und Transfers – entscheidet mit Vorstand und Aufsichtsrat über Zu- und Abgänge.',board:1,link:'dir'},
  mkt:{g:'lead',lbl:'Marketingvorstand',a:'Vermarktung',wf:.9,eff:k=>`Zuschauereinnahmen ${pc(k*8)}`,desc:'Ticketing, Fanartikel und Stadionerlebnis.',board:1},
  kader:{g:'office',lbl:'Kaderplaner',a:'Vertragsmanagement',wf:.8,eff:k=>`Gehaltsforderungen bei Verlängerungen ${pc(-k*8)}`,desc:'Führt Vertragsgespräche, plant Laufzeiten und den Kader der nächsten Jahre.'},
  media:{g:'office',lbl:'Mediendirektor',a:'Kommunikation',wf:.6,eff:k=>`Vertrauensverlust nach Niederlagen ${pc(-k*25)}`,desc:'Pressearbeit, Krisenkommunikation und Auftritt des Vereins.'},
  ast:{g:'sport',lbl:'Co-Trainer',a:'Taktik & Training',wf:1.2,eff:k=>`Mannschaftsstärke ${pc(k*2)}, Entwicklung ${pc(k*12)}`,desc:'Deine rechte Hand im Training und an der Seitenlinie.'},
  gk:{g:'sport',lbl:'Torwarttrainer',a:'Torwarttraining',wf:.7,eff:k=>`Entwicklung der Torhüter ${pc(k*25)}`,desc:'Trainiert Reflexe, Strafraumbeherrschung und Spieleröffnung.'},
  fit:{g:'sport',lbl:'Athletiktrainer',a:'Fitness & Belastung',wf:.8,eff:k=>`Regeneration ${pc(k*15)}, Altersabbau ${pc(-k*20)}`,desc:'Sorgt dafür, dass die Spieler frisch bleiben.'},
  ana:{g:'sport',lbl:'Spielanalyst',a:'Gegner- & Videoanalyse',wf:.6,eff:k=>`Mannschaftsstärke ${pc(k*1.5)}`,desc:'Bereitet jeden Gegner per Video auf.'},
  psy:{g:'sport',lbl:'Sportpsychologe',a:'Mentale Stärke',wf:.6,eff:k=>`Moral-Grundniveau ${sg(Math.round(k*6))}`,desc:'Hält die Stimmung stabil, gerade in Krisen.'},
  doc:{g:'med',lbl:'Mannschaftsarzt',a:'Medizinische Betreuung',wf:.9,eff:k=>`Ausfallzeit nach Verletzungen ${pc(-k*25)}`,desc:'Diagnose und Behandlung – je besser, desto schneller sind Verletzte zurück.'},
  phys:{g:'med',lbl:'Physiotherapeut',a:'Physiotherapie',wf:.6,eff:k=>`Verletzungsrisiko ${pc(-k*25)}, Regeneration ${pc(k*10)}`,desc:'Prävention und Regeneration nach jedem Spiel.'},
  scout:{g:'scout',lbl:'Chefscout',a:'Spielerbeurteilung',wf:.8,eff:k=>`Genauigkeit der Marktwert-Einschätzung ${pc(k*60)}, Talente ${sg(Math.round(k*2))} Potenzial`,desc:'Schätzt Ablösen genauer ein und findet bessere Talente.'},
  youth:{g:'scout',lbl:'Leiter Nachwuchsleistungszentrum',a:'Jugendarbeit',wf:.8,eff:k=>`Qualität der Jugendspieler ${sg(Math.round(k*4))}`,desc:'Bestimmt, wie gut die Spieler sind, die jedes Jahr aus der Akademie kommen.'},
  u19:{g:'scout',lbl:'U19-Trainer',a:'Talentförderung',wf:.6,eff:k=>`Entwicklung der Spieler bis 21 ${pc(k*20)}`,desc:'Bringt junge Spieler schneller voran.'}};
function pc(v){v=Math.round(v);return (v>0?'+':v<0?'−':'±')+Math.abs(v)+' %'}
function sg(v){return (v>0?'+':v<0?'−':'±')+Math.abs(v)}
function crewWage(q,role,c){return rw((1500+q*q*90)*CREW[role].wf*Math.max(.08,c.econ||.3))}
function crewPerson(c,role,q,R){
  R=R||rnd;const code=R()<.82?c.assoc:pick(S.active.length?S.active:[c.assoc]);
  const pool=poolArr(ASSOC[code]?ASSOC[code].pool:'de'),age=Math.round(32+R()*28);
  return {name:pool.f[Math.floor(R()*pool.f.length)]+' '+pool.l[Math.floor(R()*pool.l.length)],age,nat:code,q,wage:crewWage(q,role,c),until:S.season+1+Math.floor(R()*3),since:S.season-Math.floor(R()*4)};
}
function crewLevel(c){return clamp(4+c.rep*.12,3,17)}
function crewOf(c){
  if(c.crew){for(const role in CREW)if(!(role in c.crew)){const R=mkRng(hashStr('crew2'+role+c.id+':'+(S.seed||1)));const m=crewPerson(c,role,clamp(Math.round(crewLevel(c)+(R()-.5)*7),1,20),R);c.crew[role]=m;if(c.crewB)c.crewB+=m.wage}return c.crew}
  const R=mkRng(hashStr('crew'+c.id+':'+(S.seed||1))),lvl=crewLevel(c),cr={};
  for(const role in CREW){const q=clamp(Math.round(lvl+(R()-.5)*7),1,20);cr[role]=crewPerson(c,role,q,R);if(role==='dirq'&&c.staff&&c.staff.dir)cr[role].name=c.staff.dir.name}
  c.crew=cr;c.crewB=Math.round(crewCost(c)*1.15);
  return cr;
}
function crewCost(c){let s=0;for(const r in c.crew||{}){const m=c.crew[r];if(m)s+=m.wage}for(const x of c.scouts||[])s+=x.wage;return s}
function crewBudget(c){crewOf(c);return (c.crewB||crewCost(c))+(c.id===S.user?rw(crewWage(crewLevel(c),'scout',c)*.55*3):0)}
// Wirkung: −0,9 (sehr schwach/unbesetzt) … +1 (Weltklasse)
function crewK(c,role){if(!c||c.guest)return 0;const m=crewOf(c)[role];if(!m)return -.6;const mood=m.mood===undefined?60:m.mood;return (clamp(m.q+(mood-60)/20,1,21)-10)/10}

/* ---------- Wirkungen (aus Engine aufgerufen) ---------- */
function crewFitMul(c){return 1+.15*crewK(c,'fit')+.1*crewK(c,'phys')}
function crewInjMul(c){return Math.max(.4,1-.25*crewK(c,'phys'))}
function crewInjDur(c,n){return Math.max(1,Math.round(n*(1-.25*crewK(c,'doc'))))}
function crewMorTarget(c){return 70+6*crewK(c,'psy')}
function crewMatchMul(c){return 1+.02*crewK(c,'ast')+.015*crewK(c,'ana')}
function crewDevMul(p,c,d){
  if(!c)return d;
  if(d>0){let k=crewK(c,'ast')*.12+(p.pos==='TW'?crewK(c,'gk')*.25:0)+(p.age<=21?crewK(c,'u19')*.2:0);return d*(1+k)}
  return d*(1-.2*crewK(c,'fit'));
}
function crewMoney(c,tv,tickets){
  const spons=tv*.13*(1+.6*crewK(c,'ceo')),mkt=tickets*.08*crewK(c,'mkt'),interest=Math.max(0,c.budget)*.0004*crewK(c,'cfo'),cost=crewCost(c)*(1-.05*crewK(c,'cfo'));
  return {spons,mkt,interest,cost};
}

/* ---------- Saisonwechsel ---------- */
function crewSeason(){
  for(const c of S.clubs){if(c.guest||!c.crew)continue;
    for(const role in CREW){const m=c.crew[role];if(isVorRole(role)||isOfficeRole(role))continue;
      if(c.id===S.user){if(m&&m.until<S.season){addNews('board',`${CREW[role].lbl} verlässt den Verein`,`Der Vertrag von ${esc(m.name)} ist ausgelaufen. Die Stelle ist jetzt unbesetzt – unter „Mitarbeiter“ kannst du einen Nachfolger einstellen.`);c.crew[role]=null}
        else if(m)m.age++;continue}
      if(!m||m.until<S.season||rnd()<.12){const lvl=crewLevel(c);c.crew[role]=crewPerson(c,role,clamp(Math.round(lvl+(rnd()-.5)*7),1,20));if(role==='dirq'&&c.staff)c.crew[role].name=c.staff.dir.name}else m.age++;
    }
    if(c.id!==S.user)c.crewB=Math.round(crewCost(c)*1.15);
    if(c.id===S.user&&c.scouts){c.scouts=c.scouts.filter(s=>{if(s.until<S.season){addNews('board',`Scout ${s.name} hört auf`,`Sein Vertrag ist ausgelaufen – das Gebiet ${esc(regionLbl(s.region))} ist unbeobachtet.`);return false}s.age++;return true})}
  }
}
function crewExpiryWarn(){
  const u=userClub(),cr=crewOf(u),exp=Object.entries(cr).filter(([r,m])=>m&&m.until<=S.season&&!isVorRole(r)&&!isOfficeRole(r));
  if(exp.length)addNews('board','Auslaufende Mitarbeiterverträge',`Zum Saisonende laufen aus: ${exp.map(([r,m])=>`${esc(m.name)} (${CREW[r].lbl})`).join(', ')}. Unter „Mitarbeiter“ kannst du verlängern.`);
}

/* ---------- Arbeitsmarkt ---------- */
function crewCands(c,role){
  const R=mkRng(hashStr('cand'+role+':'+S.season+':'+S.week+':'+c.id)),lvl=crewLevel(c),out=[];
  for(let i=0;i<6;i++){const q=clamp(Math.round(lvl+(R()-.4)*10+(i===0?4:0)),1,20);const m=crewPerson(c,role,q,R);m.wage=rw(m.wage*(1.05+R()*.25));m.id='c'+i;
    m.keen=q<=lvl+2?1:R()<clamp(.9-(q-lvl-2)*.18,.05,.9)?1:0;out.push(m)}
  return out.sort((a,b)=>b.q-a.q);
}
function stars(q){const s=Math.round(q/4*2)/2;let h='';for(let i=1;i<=5;i++)h+=s>=i?'★':s>=i-.5?'⯪':'☆';return h}
function crewQLbl(q){return q>=17?'Weltklasse':q>=14?'Sehr gut':q>=11?'Gut':q>=8?'Durchschnitt':q>=5?'Schwach':'Sehr schwach'}

/* ---------- Oberfläche ---------- */
function renderStaff(){
  const u=userClub(),cr=crewOf(u),g=UI.crewG||'tasks',cost=crewCost(u),bud=crewBudget(u);
  const tabs=`<div class="seg" style="margin-bottom:12px">${CREW_GROUPS.map(([k,l])=>`<button class="${g===k?'on':''}" data-act="crewG" data-v="${k}">${l}</button>`).join('')}</div>`;
  const people=[];
  if(g==='lead'){people.push(`<div class="card crewc board"><div class="crole">Präsident · Vorsitz Aufsichtsrat</div><div class="cname">${esc(u.staff.pres.name)}</div><div class="small muted">${PRES[u.staff.pres.trait].label} – ${esc(PRES[u.staff.pres.trait].desc)}</div><div class="small muted" style="margin-top:6px">Gewählt von den Mitgliedern. Der Aufsichtsrat bestellt den Vorstand und kann ihn abberufen.</div></div>`)}
  if(g==='sport')people.push(`<div class="card crewc board"><div class="crole">Cheftrainer</div><div class="cname">${esc(S.manager||'Du')}</div><div class="small muted">Das bist du. Dein Stab entscheidet mit darüber, wie gut deine Ideen umgesetzt werden.</div></div>`);
  for(const [role,R] of Object.entries(CREW).filter(([r,R])=>R.g===g)){
    const m=cr[role],k=m?(m.q-10)/10:-.6;
    const ro=isVorRole(role)||isOfficeRole(role),tk=Object.entries(TASKS).filter(([k])=>owner(k)===role).map(([k,T])=>T.ic+' '+T.lbl);
    people.push(`<div class="card crewc ${m?'':'vacant'}"><div class="crole">${roleLbl(role)}</div>
      ${m?`<div class="cname">${esc(m.name)}</div><div class="small muted">${m.age} J. · ${esc(natName(m.nat))} · seit ${seasonLbl(m.since)}</div>
      <div class="cq"><span class="stars">${stars(m.q)}</span><b>${m.q}</b><span class="small muted">${crewQLbl(m.q)} · ${R.a}</span></div>
      <div class="small" style="margin-top:4px" title="${esc(CT_TR[crewTr(m)].d)}">${CT_TR[crewTr(m)].lbl} · ${moodLbl2(m.mood)[0]} ${moodLbl2(m.mood)[1]}</div>`:`<div class="cname bad">Unbesetzt</div><div class="small muted">Ohne Besetzung fehlt diese Arbeit komplett.</div>`}
      <div class="ceff ${k>=0?'good':'bad'}">${R.eff(k)}</div><div class="small muted">${R.desc}</div>
      ${m?`<div class="crow" style="margin-top:6px"><span>Gehalt<small>Vertrag bis ${contractEnd({club:1,until:m.until})}</small></span><b>${money(mon(m.wage))}/Monat</b></div>`:''}
      ${tk.length?`<div class="small" style="margin-top:6px"><b>Zuständig für:</b> ${tk.join(' · ')}</div>`:''}
      ${ro?`<div class="small muted" style="margin-top:6px">${isVorRole(role)?'Vom Aufsichtsrat bestellt':'Vom Vorstand eingestellt'} – du kannst nur einen Wechsel anregen.</div><div class="row" style="margin-top:8px">${m?`<button class="btn sm pri" data-act="ctOpen" data-v="${role}">💬 Gespräch</button>`:''}${orgReqBtn(role)}</div></div>`:`
      <div class="row" style="margin-top:8px">${m?`<button class="btn sm pri" data-act="ctOpen" data-v="${role}">💬 Gespräch</button><button class="btn sm" data-act="crewExt" data-v="${role}">Verlängern (+2 J.)</button><button class="btn sm" data-act="crewHire" data-v="${role}">${R.board?'Wechsel vorschlagen':'Ersetzen'}</button><button class="btn sm warn" data-act="crewFire" data-v="${role}">Trennen</button>`:`<button class="btn sm pri" data-act="crewHire" data-v="${role}">Stelle besetzen</button>`}</div></div>`}`);
  }
  return `<div class="row" style="justify-content:space-between;margin-bottom:10px"><h2 style="margin:0">Mitarbeiter</h2><div class="small">Personalkosten <b>${money(mon(cost))}</b> / Budget ${money(mon(bud))} pro Monat</div></div>
   <div class="bar" style="margin-bottom:12px"><i style="width:${clamp(cost/bud*100,0,100)}%;background:${cost>bud?'var(--bad)':'var(--accent)'}"></i></div>
   ${crewEvHtml()}${tabs}<div class="crewgrid">${g==='board'?boardPanel():g==='tasks'?renderTasks():people.join('')+(g==='scout'?scoutPanel():'')}</div>
   <p class="small muted">Qualität 1–20, 10 entspricht dem Durchschnitt. Starke Mitarbeiter wirken positiv, schwache oder fehlende negativ. Die Wirkung siehst du an jeder Karte.</p>`;
}
function crewModal(role){return ()=>{
  const u=userClub(),R=CREW[role],cur=crewOf(u)[role],cs=crewCands(u,role),bud=crewBudget(u),cost=crewCost(u)-(cur?cur.wage:0),sev=cur?crewSeverance(cur):0;
  const rows=cs.map(m=>{const over=cost+m.wage>bud;return `<div class="crow cand"><span><b>${esc(m.name)}</b> <span class="stars">${stars(m.q)}</span> <b>${m.q}</b><small>${m.age} J. · ${esc(natName(m.nat))} · ${crewQLbl(m.q)} · Wirkung: ${R.eff((m.q-10)/10)}</small></span>
    <span style="text-align:right"><b>${money(mon(m.wage))}/Monat</b><br>${m.keen?`<button class="btn sm ${over?'':'pri'}" data-act="crewTake" data-role="${role}" data-id="${m.id}" ${over?'disabled':''}>${over?'Budget reicht nicht':'Einstellen'}</button>`:'<span class="small muted">kein Interesse</span>'}</span></div>`}).join('');
  return `<h2>${R.lbl}: Kandidaten</h2><p class="small muted">${R.desc} ${cur?`Aktuell: ${esc(cur.name)} (${cur.q})${sev?` – die Trennung kostet ${money(sev)} Abfindung.`:''}`:''} Personalbudget frei: ${money(mon(bud-cost))}/Monat. Spitzenleute kommen nur zu Vereinen mit entsprechendem Ruf.</p>
   <div class="clist">${rows}</div><p class="small muted">Neue Verträge laufen 3 Jahre. Die Kandidatenliste ändert sich jede Woche.</p><div class="row" style="margin-top:10px"><button class="btn" data-act="closeModal">Schließen</button></div>`;
}}
function crewSeverance(m){return Math.round(m.wage*Math.max(0,(m.until-S.season)*52+Math.round((S.weeks-S.week)*52/Math.max(S.weeks,1)*.75))*.5/1000)*1000}
Object.assign(ACT,{
  crewG:d=>{UI.crewG=d.v;render()},
  crewHire:d=>{UI.modal=crewModal(d.v);render()},
  crewTake:d=>{const u=userClub(),cr=crewOf(u),cur=cr[d.role],m=crewCands(u,d.role).find(x=>x.id===d.id);if(!m)return;
    if(cur){const sev=crewSeverance(cur);u.budget-=sev;S.fin.staff=(S.fin.staff||0)+sev}
    m.until=S.season+3;m.since=S.season;delete m.id;delete m.keen;cr[d.role]=m;if(d.role==='dirq'&&u.staff&&u.staff.dir)u.staff.dir.name=m.name;
    addNews('board',`Neuer ${CREW[d.role].lbl}: ${m.name}`,`${esc(m.name)} (${m.age} J., Qualität ${m.q}) unterschreibt bis ${contractEnd({club:1,until:m.until})} – ${money(mon(m.wage))}/Monat.${cur?` ${esc(cur.name)} verlässt den Verein.`:''}`);
    UI.modal=null;save();toast(`${m.name} eingestellt`);render()},
  crewFire:d=>{const u=userClub(),cr=crewOf(u),m=cr[d.v];if(!m)return;const sev=crewSeverance(m);u.budget-=sev;S.fin.staff=(S.fin.staff||0)+sev;cr[d.v]=null;
    addNews('board',`Trennung: ${m.name}`,`${CREW[d.v].lbl} ${esc(m.name)} muss gehen. Abfindung: ${money(sev)}.`);save();toast('Trennung vollzogen');render()},
  crewExt:d=>{const u=userClub(),m=crewOf(u)[d.v];if(!m)return;const nw=rw(m.wage*1.08);if(crewCost(u)-m.wage+nw>crewBudget(u)){toast('Das Personalbudget reicht nicht');return}
    m.wage=nw;m.until=Math.max(m.until,S.season)+2;addNews('board',`${m.name} verlängert`,`${CREW[d.v].lbl} ${esc(m.name)} bleibt bis ${contractEnd({club:1,until:m.until})} (${money(mon(nw))}/Monat).`);save();toast('Vertrag verlängert');render()}
});
