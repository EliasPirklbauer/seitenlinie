/* =====================================================================
   Seitenlinie – Editor: eigene Vereinsdatenbank vor dem Karrierestart.
   Name, Kürzel, Farben, Stadion, Stärke, Finanzen, Fans und Führungs-
   personal – dazu Ligennamen und Plätze tauschen (z. B. Auf-/Abstieg).
   Gilt für alle neuen Karrieren; bestehende Spielstände bleiben unberührt.
   ===================================================================== */
const ED_SEED=0;
function edState(){return UI.ed=UI.ed||{confed:'UEFA',assoc:'GER',tier:1,sel:0,q:''}}
function edStruct(code){return assocStructure(code,ED_SEED)}
function edCount(code){const k=code+'|';return Object.keys(edDB().clubs).filter(x=>x.startsWith(k)).length+Object.keys(edDB().leagues).filter(x=>x.startsWith(k)).length}
function edEff(code,tier,i){const L=edStruct(code)[tier-1];if(!L)return null;const nm=L.clubs[i],sp=clubSpec(code,tier,i,L.clubs.length,nm,ED_SEED);return {name:nm,...sp}}
const ED_F=[['name','Vereinsname','text'],['short','Kürzel (3–4 Zeichen)','text'],['city','Stadt','text'],['founded','Gegründet','number'],['stName','Stadionname','text'],['stadium','Kapazität','number']];

function renderEditor(){
  const E=edState(),q=(E.q||'').toLowerCase();
  const list=ASSOCS.filter(a=>a.confed===E.confed&&!(LEAGUE_DATA[a.code]||{}).noLeague&&(!q||a.name.toLowerCase().includes(q))).sort((a,b)=>b.str-a.str);
  const assocs=list.map(a=>{const n=edCount(a.code);return `<div class="edrow ${E.assoc===a.code?'on':''}" data-act="edAssoc" data-v="${a.code}"><span>${esc(a.name)}</span>${n?`<span class="pill">✎ ${n}</span>`:`<span class="small gold">${stars(a.str)}</span>`}</div>`}).join('');
  let mid='',right='';
  const ST=edStruct(E.assoc);
  if(ST.length){
    const tier=Math.min(E.tier,ST.length),L=ST[tier-1],lk=E.assoc+'|'+tier;
    const rows=L.clubs.map((nm,i)=>{const sp=clubSpec(E.assoc,tier,i,L.clubs.length,nm,ED_SEED),ov=edOv(E.assoc,tier,i);
      return `<tr class="${E.sel===i?'me':''} click" data-act="edSel" data-v="${i}"><td class="n small muted">${i+1}</td><td>${badge({colors:sp.colors,short:sp.short},22)} <b>${esc(nm)}</b>${ov?' <span class="gold" title="bearbeitet">✎</span>':''}</td><td class="n">${sp.rep}</td><td class="n">${sp.stadium.toLocaleString('de-DE')}</td><td class="n">${money(sp.budget)}</td></tr>`}).join('');
    mid=`<div class="card"><h3>${esc(ASSOC[E.assoc].name)} · Ligen</h3>
      <div class="seg" style="margin-bottom:10px">${ST.map(l=>`<button class="${l.tier===tier?'on':''}" data-act="edTier" data-v="${l.tier}">${esc(l.name)}</button>`).join('')}</div>
      <label class="f">Name der Liga</label><input data-chg="edLeague" data-k="${lk}" value="${esc(L.name)}" style="width:100%;margin-bottom:10px">
      ${L.real?'':'<p class="small muted">Diese Liga hat keine festen Vereinsnamen – ohne eigene Namen wird je Karriere neu ausgewürfelt.</p>'}
      <div class="tw"><table><thead><tr><th class="n">#</th><th>Verein</th><th class="n">Stärke</th><th class="n">Stadion</th><th class="n">Budget</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="small muted" style="margin-top:8px">Die Reihenfolge bestimmt die Grundstärke (oben = stärker). Mit „Platz tauschen“ verschiebst du Vereine – auch zwischen den Ligen.</p></div>`;
    const i=Math.min(E.sel,L.clubs.length-1),X=edEff(E.assoc,tier,i),o=X.o||{},st=X.staff;
    const inp=(k,l,t,val,ph)=>`<div><label class="f">${l}</label><input id="ed_${k}" type="${t}" value="${val!=null?esc(String(val)):''}" placeholder="${esc(String(ph!=null?ph:''))}" style="width:100%"></div>`;
    const sel=(k,l,MAP,val)=>`<div><label class="f">${l}</label><select id="ed_${k}" style="width:100%">${Object.entries(MAP).map(([kk,v])=>`<option value="${kk}" ${val===kk?'selected':''}>${esc(v.label)}</option>`).join('')}</select></div>`;
    const swap=ST.flatMap(l=>l.clubs.map((nm,j)=>({t:l.tier,j,nm,ln:l.name}))).filter(x=>!(x.t===tier&&x.j===i));
    right=`<div class="card"><h3>Verein bearbeiten</h3>
      <div class="row" style="flex-wrap:nowrap;margin-bottom:12px">${badge({colors:X.colors,short:X.short},52)}<div><div style="font-size:19px;font-weight:700">${esc(X.name)}</div><div class="small muted">${esc(L.name)} · Platz ${i+1} in der Setzliste${Object.keys(o).length?' · <span class="gold">bearbeitet</span>':''}</div></div></div>
      <div class="edform">
       ${inp('name','Vereinsname','text',o.name||X.name,'')}${inp('short','Kürzel','text',o.short||'',X.short)}
       ${inp('city','Stadt','text',o.city||'','')}${inp('founded','Gegründet','number',o.founded||'','z. B. 1900')}
       <div><label class="f">Vereinsfarben</label><div class="row" style="flex-wrap:nowrap"><input id="ed_c1" type="color" value="${X.colors[0]}"><input id="ed_c2" type="color" value="${X.colors[1]}"><span class="small muted">Haupt- / Zweitfarbe</span></div></div><div></div>
       ${inp('stName','Stadionname','text',o.stName||'','')}${inp('stadium','Kapazität','number',o.stadium||'',X.stadium)}
       <div class="full"><label class="f">Stärke / Renommee: <b id="ed_repv">${X.rep}</b></label><input id="ed_rep" type="range" min="5" max="99" value="${X.rep}" style="width:100%" oninput="document.getElementById('ed_repv').textContent=this.value"><div class="small muted">Bestimmt die Qualität des Kaders, Ruf, Erwartungen und Einnahmen.</div></div>
       <div class="full"><label class="f">Wirtschaftskraft: <b id="ed_econv">${Math.round(X.econ*100)} %</b></label><input id="ed_econ" type="range" min="2" max="115" value="${Math.round(X.econ*100)}" style="width:100%" oninput="document.getElementById('ed_econv').textContent=this.value+' %'"><div class="small muted">Einfluss auf Gehälter, TV-Geld, Sponsoren und Ticketpreise.</div></div>
       ${inp('budget','Kontostand (Mio. €)','number',o.budget!=null?o.budget/1e6:'',(X.budget/1e6).toFixed(1))}${inp('tb','Transferbudget (Mio. €)','number',o.tb!=null?o.tb/1e6:'','automatisch')}
       <div class="full"><label class="f">Fan-Treue: <b id="ed_loyv">${o.loy!=null?o.loy:'automatisch'}</b></label><input id="ed_loy" type="range" min="20" max="95" value="${o.loy!=null?o.loy:60}" style="width:100%" oninput="document.getElementById('ed_loyv').textContent=this.value"><label class="small"><input type="checkbox" id="ed_loyon" ${o.loy!=null?'checked':''}> eigene Fan-Treue verwenden</label></div>
       ${inp('pres','Präsident','text',o.pres||'','zufällig')}${sel('presT','Typ',PRES,st.pres.trait)}
       ${inp('dir','Sportdirektor','text',o.dir||'','zufällig')}${sel('dirT','Typ',DIR,st.dir.trait)}
       ${inp('coach','Trainer','text',o.coach||'','zufällig')}${sel('coachT','Typ',COACH,st.coach.trait)}
      </div>
      <div class="row" style="margin-top:14px"><button class="btn pri" data-act="edSaveClub">💾 Speichern</button><button class="btn" data-act="edResetClub">Zurücksetzen</button></div>
      <div class="row" style="margin-top:12px"><select id="ed_swap" style="flex:1;min-width:180px"><option value="">Platz tauschen mit …</option>${swap.map(x=>`<option value="${x.t}|${x.j}">${esc(x.ln)}: ${esc(x.nm)}</option>`).join('')}</select><button class="btn" data-act="edSwap">⇄ Tauschen</button></div>
      <p class="small muted" style="margin-top:8px">Leere Felder = automatisch. Typen ohne eigene Angabe werden je Karriere ausgewürfelt; die Vorauswahl zeigt ein Beispiel.</p></div>`;
  }else mid='<div class="card"><p class="muted">Dieser Verband hat keinen eigenen Ligabetrieb.</p></div>';
  return `<div class="main" style="margin:auto;padding-top:calc(18px + var(--sat));max-width:1500px">
   <div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="margin:0">🛠️ Editor · Vereinsdatenbank</h2>
    <div class="row"><button class="btn" data-act="edExport">📤 Exportieren</button><label class="btn" style="cursor:pointer">📥 Importieren<input type="file" accept=".json,application/json" data-chg="edImport" style="display:none"></label><button class="btn warn" data-act="edResetAll">Alles zurücksetzen</button><button class="btn pri" data-act="edClose">Fertig</button></div></div>
   <p class="small muted" style="margin-top:0">Deine Änderungen gelten für alle <b>neuen</b> Karrieren. Laufende Spielstände bleiben unverändert. Aktuell bearbeitet: ${Object.keys(edDB().clubs).length} Vereine, ${Object.keys(edDB().leagues).length} Ligennamen, ${edPlayers().length} eigene Spieler.</p>
   <div class="seg" style="margin-bottom:12px"><button class="${E.tab!=='pl'?'on':''}" data-act="edTab" data-v="cl">🏟️ Vereine & Ligen</button><button class="${E.tab==='pl'?'on':''}" data-act="edTab" data-v="pl">👤 Spieler</button></div>
   ${E.tab==='pl'?edPlayersPage():`<div class="edgrid"><div class="card"><h3>Verbände</h3>${confedTabs(E.confed,'edConfed')}<input data-chg="edQ" placeholder="Land suchen …" value="${esc(E.q||'')}" style="width:100%;margin-bottom:8px"><div class="edlist">${assocs}</div></div>${mid}${right}</div>`}</div>`;
}
function edVal(k){const el=document.getElementById('ed_'+k);return el?el.value.trim():''}
function edCollect(X){
  const o={},num=k=>{const v=edVal(k);return v===''?null:+v};
  const nm=edVal('name');if(nm&&(nm!==X.name||X.o.name))o.name=nm;
  const sh=edVal('short').toUpperCase().replace(/[^A-Z0-9ÄÖÜ]/g,'').slice(0,4);if(sh)o.short=sh;
  for(const k of ['city','stName','pres','dir','coach'])if(edVal(k))o[k]=edVal(k);
  const fd=num('founded');if(fd)o.founded=Math.round(fd);
  const c1=edVal('c1'),c2=edVal('c2');if(c1!==X.colors[0]||c2!==X.colors[1]||X.o.c1){o.c1=c1;o.c2=c2}
  const cap=num('stadium');if(cap)o.stadium=clamp(Math.round(cap),500,150000);
  const rep=+edVal('rep');if(rep!==X.rep||X.o.rep!=null)o.rep=rep;
  const ec=+edVal('econ')/100;if(Math.abs(ec-X.econ)>.004||X.o.econ!=null)o.econ=clamp(ec,.02,1.15);
  const b=num('budget');if(b!=null)o.budget=Math.round(b*1e6);
  const tb=num('tb');if(tb!=null)o.tb=Math.max(0,Math.round(tb*1e6));
  if(document.getElementById('ed_loyon').checked)o.loy=+edVal('loy');
  const st=X.staff;for(const [k,base] of [['presT',st.pres.trait],['dirT',st.dir.trait],['coachT',st.coach.trait]]){const v=edVal(k);if(v!==base||X.o[k])o[k]=v}
  return o;
}
function edBaseName(){const E=UI.ed,d=LEAGUE_DATA[E.assoc]||{};const t=Math.min(E.tier,edStruct(E.assoc).length);return d.clubs&&d.clubs[t-1]?d.clubs[t-1].split('|')[E.sel]:null}
function edKey(){const E=UI.ed;return E.assoc+'|'+Math.min(E.tier,edStruct(E.assoc).length)+'|'+E.sel}
Object.assign(ACT,{
  edOpen:()=>{edState();render();scrollTo(0,0)},
  edClose:()=>{UI.ed=null;render();scrollTo(0,0)},
  edConfed:d=>{UI.ed.confed=d.v;render()},
  edAssoc:d=>{Object.assign(UI.ed,{assoc:d.v,tier:1,sel:0});render()},
  edTier:d=>{UI.ed.tier=+d.v;UI.ed.sel=0;render()},
  edSel:d=>{UI.ed.sel=+d.v;render()},
  edSaveClub:()=>{const E=UI.ed,t=Math.min(E.tier,edStruct(E.assoc).length),X=edEff(E.assoc,t,E.sel),o=edCollect(X),k=edKey();
    if(Object.keys(o).length)edDB().clubs[k]=o;else delete edDB().clubs[k];edSave();toast('Gespeichert – gilt für neue Karrieren');render()},
  edResetClub:()=>{delete edDB().clubs[edKey()];edSave();toast('Auf Originaldaten zurückgesetzt');render()},
  edSwap:()=>{const v=edVal('swap');if(!v)return toast('Erst einen Verein wählen');const E=UI.ed,t=Math.min(E.tier,edStruct(E.assoc).length),[t2,j2]=v.split('|').map(Number);
    const A=edEff(E.assoc,t,E.sel),B=edEff(E.assoc,t2,j2),pack=X=>{const o={...X.o,name:X.name,rep:X.rep,econ:X.econ,c1:X.colors[0],c2:X.colors[1],short:X.short};if(!X.o.stadium)o.stadium=X.stadium;if(X.o.budget==null)o.budget=X.budget;return o};
    const pa=pack(A),pb=pack(B);edDB().clubs[E.assoc+'|'+t2+'|'+j2]=pa;edDB().clubs[edKey()]=pb;edSave();E.tier=t2;E.sel=j2;toast(`${A.name} ⇄ ${B.name}`);render()},
  edResetAll:()=>{if(!confirm('Alle Änderungen im Editor löschen?'))return;EDB_CACHE={clubs:{},leagues:{},players:[]};edSave();toast('Editor zurückgesetzt');render()},
  edExport:()=>{const txt=JSON.stringify({type:'seitenlinie-editor',v:1,...edDB()},null,1),blob=new Blob([txt],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='seitenlinie-vereine.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
});
Object.assign(CHG,{
  edQ:el=>{UI.ed.q=el.value;render();const i=document.querySelector('input[data-chg=edQ]');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},
  edLeague:el=>{const k=el.dataset.k,[code,t]=k.split('|'),d=LEAGUE_DATA[code]||{},base=(d.names&&d.names[t-1])||null,v=el.value.trim();if(!v||v===base)delete edDB().leagues[k];else edDB().leagues[k]=v;edSave();render()},
  edImport:el=>{const f=el.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(!o.clubs)throw 0;EDB_CACHE={clubs:o.clubs||{},leagues:o.leagues||{},players:o.players||[]};edSave();toast('Vereinsdatenbank importiert');render()}catch(e){toast('Ungültige Datei')}};r.readAsText(f)}
});

/* =====================================================================
   Editor · Spieler: eigene Spieler mit Werten, Positionen, Potenzial,
   Nation und Verein. Sie ersetzen beim Karrierestart den schwächsten
   Spieler ihrer Position im Zielverein (oder sind vereinslos).
   ===================================================================== */
const ED_GRP=[['tech','Technik'],['ment','Mental'],['phys','Physis'],['gk','Torwart'],['hid','Persönlichkeit (versteckt)']];
function edPlayers(){return edDB().players=edDB().players||[]}
function edGenAt(pos,target,age,seed){
  const save=RNG;RNG=hashStr(String(seed))>>>0;let lo=15,hi=99,best=null;
  for(let k=0;k<9;k++){const q=(lo+hi)/2,at_=genAttributes(pos,q,age),tmp={pos,at:at_,pp:''};tmp.pp=genFamiliarity(pos,tmp.at.charCodeAt(AIDX.ver)-64);const o=Math.round(rawRateAt(tmp,pos));best={at:at_,pp:tmp.pp};if(o<target)lo=q;else if(o>target)hi=q;else break}
  RNG=save;return best;
}
function edOvr(d){const p={pos:d.pos,at:d.at,pp:d.pp};return Math.round(rawRateAt(p,d.pos))}
function edNewDraft(){const g=edGenAt('ST',68,22,'new'+Date.now());return {fn:'',ln:'',nat:'GER',age:22,pos:'ST',alt:[],ovr:68,pot:76,club:'free',yrs:3,wage:'',at:g.at,pp:g.pp}}
function edPlRead(){
  const D=UI.ed.draft;if(!D||!document.getElementById('ep_fn'))return;const v=k=>document.getElementById('ep_'+k);
  D.fn=v('fn').value.trim();D.ln=v('ln').value.trim();D.nat=v('nat').value;D.age=clamp(+v('age').value||20,15,42);D.pos=v('pos').value;
  D.pot=clamp(+v('pot').value||D.ovr,1,99);D.yrs=clamp(+v('yrs').value||2,1,6);D.wage=v('wage').value;D.club=v('club').value;D.clubAssoc=v('cassoc').value;
  D.alt=POS_LIST.filter(p=>{const c=document.getElementById('ep_alt_'+p);return c&&c.checked&&p!==D.pos});
  const a=ATTR_KEYS.map(k=>{const el=document.getElementById('ep_a_'+k);return el?clamp(+el.value||1,1,20):D.at.charCodeAt(AIDX[k])-64});D.at=encodeAt(a);
  const pp=D.pp.split('').map(c=>c.charCodeAt(0)-64);pp[POS_IDX[D.pos]]=20;for(const p of POS_LIST)if(p!==D.pos)pp[POS_IDX[p]]=D.alt.includes(p)?Math.max(17,pp[POS_IDX[p]]):Math.min(pp[POS_IDX[p]],14);D.pp=String.fromCharCode(...pp.map(x=>64+x));
  D.ovr=edOvr(D);
}
function edClubLabel(k){if(k==='free')return 'vereinslos';const [code,t,i]=k.split('|');const L=edStruct(code)[+t-1];return L?`${L.clubs[+i]} (${ASSOC[code].name})`:k}
function edPlayersPage(){
  const E=UI.ed,P=edPlayers(),D=E.draft;
  const list=P.map((e,i)=>`<tr class="${E.psel===i?'me':''} click" data-act="epSel" data-v="${i}"><td><span class="pill">${e.pos}</span></td><td><b>${esc(e.fn+' '+e.ln)}</b><div class="small muted">${e.age} J. · ${esc(ASSOC[e.nat]?ASSOC[e.nat].name:e.nat)}</div></td><td class="n">${ovrTag(edOvr(e))}</td><td class="n">${e.pot}</td><td class="small">${esc(edClubLabel(e.club))}</td></tr>`).join('');
  const left=`<div class="card"><h3>Eigene Spieler (${P.length})</h3><button class="btn pri" data-act="epNew" style="margin-bottom:10px">＋ Neuer Spieler</button>
    ${P.length?`<div class="tw"><table><thead><tr><th>Pos</th><th>Spieler</th><th class="n">Stärke</th><th class="n">Pot.</th><th>Verein</th></tr></thead><tbody>${list}</tbody></table></div>`:'<p class="small muted">Noch keine eigenen Spieler. Lege einen an – zum Beispiel dich selbst als Spielertrainer oder ein Wunschtalent.</p>'}</div>`;
  if(!D)return `<div class="edgrid2">${left}<div class="card"><p class="muted">Wähle links einen Spieler oder lege einen neuen an.</p></div></div>`;
  const ca=D.clubAssoc||(D.club!=='free'?D.club.split('|')[0]:'GER'),ST=edStruct(ca);
  const clubOpts=`<option value="free" ${D.club==='free'?'selected':''}>– vereinslos –</option>`+ST.map(l=>`<optgroup label="${esc(l.name)}">${l.clubs.map((nm,i)=>{const k=ca+'|'+l.tier+'|'+i;return `<option value="${k}" ${D.club===k?'selected':''}>${esc(nm)}</option>`}).join('')}</optgroup>`).join('');
  const assocOpts=ASSOCS.filter(a=>!(LEAGUE_DATA[a.code]||{}).noLeague).slice().sort((a,b)=>a.name.localeCompare(b.name,'de')).map(a=>`<option value="${a.code}" ${ca===a.code?'selected':''}>${esc(a.name)}</option>`).join('');
  const natOpts=ASSOCS.slice().sort((a,b)=>a.name.localeCompare(b.name,'de')).map(a=>`<option value="${a.code}" ${D.nat===a.code?'selected':''}>${esc(a.name)}</option>`).join('');
  const o=edOvr(D),tmp={pos:D.pos,at:D.at,pp:D.pp};
  const grp=ED_GRP.filter(([g])=>g!=='gk'||D.pos==='TW').map(([g,l])=>`<div class="epg"><div class="small muted" style="text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">${l}</div>${ATTR_DEF.filter(d=>d[2]===g).map(([k,lab])=>{const v=D.at.charCodeAt(AIDX[k])-64,key=(WEIGHTS[D.pos][k]||0)>=1;return `<label class="epa ${key?'key':''}"><span>${lab}</span><input id="ep_a_${k}" type="number" min="1" max="20" value="${v}"></label>`}).join('')}</div>`).join('');
  const right=`<div class="card"><h3>${E.psel==='new'?'Neuer Spieler':'Spieler bearbeiten'}</h3>
    <div class="row" style="margin-bottom:12px"><span class="pill">${D.pos}</span><b style="font-size:19px">${esc((D.fn+' '+D.ln).trim()||'Unbenannt')}</b>${ovrTag(o)}<span class="small muted">Pot. ${D.pot} · ${D.age} J.</span></div>
    <div class="edform">
      <div><label class="f">Vorname</label><input id="ep_fn" value="${esc(D.fn)}" style="width:100%"></div><div><label class="f">Nachname</label><input id="ep_ln" value="${esc(D.ln)}" style="width:100%"></div>
      <div><label class="f">Nationalität</label><select id="ep_nat" style="width:100%">${natOpts}</select></div><div><label class="f">Alter</label><input id="ep_age" type="number" min="15" max="42" value="${D.age}" style="width:100%"></div>
      <div><label class="f">Hauptposition</label><select id="ep_pos" data-chg="epPos" style="width:100%">${POS_LIST.map(p=>`<option value="${p}" ${D.pos===p?'selected':''}>${p} – ${POS_LABEL[p]}</option>`).join('')}</select></div>
      <div><label class="f">Nebenpositionen</label><div class="row" style="gap:4px">${POS_LIST.filter(p=>p!==D.pos).map(p=>`<label class="small epchk"><input type="checkbox" id="ep_alt_${p}" ${D.alt.includes(p)?'checked':''}> ${p}</label>`).join('')}</div></div>
      <div class="full"><label class="f">Stärke: <b id="ep_ovrv">${D.ovr}</b> – erzeugt passende Werte</label><div class="row" style="flex-wrap:nowrap"><input id="ep_ovr" type="range" min="30" max="95" value="${D.ovr}" style="flex:1" oninput="document.getElementById('ep_ovrv').textContent=this.value"><button class="btn sm" data-act="epGen">🎲 Werte erzeugen</button></div></div>
      <div><label class="f">Potenzial</label><input id="ep_pot" type="number" min="30" max="99" value="${D.pot}" style="width:100%"></div>
      <div><label class="f">Vertragslaufzeit (Jahre)</label><input id="ep_yrs" type="number" min="1" max="6" value="${D.yrs}" style="width:100%"></div>
      <div><label class="f">Land des Vereins</label><select id="ep_cassoc" data-chg="epCassoc" style="width:100%">${assocOpts}</select></div>
      <div><label class="f">Verein</label><select id="ep_club" style="width:100%">${clubOpts}</select></div>
      <div><label class="f">Gehalt (€ pro Monat)</label><input id="ep_wage" type="number" min="0" value="${esc(String(D.wage||''))}" placeholder="automatisch" style="width:100%"></div><div></div>
    </div>
    <h3 style="margin-top:14px">Attribute (1–20)</h3><p class="small muted" style="margin-top:-4px">Hervorgehobene Werte sind für die Position besonders wichtig. Die Stärke ergibt sich aus den Attributen.</p>
    <div class="epgrid">${grp}</div>
    <div class="row" style="margin-top:14px"><button class="btn pri" data-act="epSave">💾 Speichern</button>${E.psel!=='new'?'<button class="btn warn" data-act="epDel">Löschen</button>':''}<button class="btn" data-act="epCancel">Abbrechen</button></div></div>`;
  return `<div class="edgrid2">${left}${right}</div>`;
}
Object.assign(ACT,{
  edTab:d=>{edPlRead();UI.ed.tab=d.v;render()},
  epNew:()=>{UI.ed.psel='new';UI.ed.draft=edNewDraft();render()},
  epSel:d=>{const e=edPlayers()[+d.v];UI.ed.psel=+d.v;UI.ed.draft=JSON.parse(JSON.stringify(e));render()},
  epGen:()=>{edPlRead();const D=UI.ed.draft,t=+document.getElementById('ep_ovr').value,g=edGenAt(D.pos,t,D.age,(D.fn+D.ln+t+Date.now()));D.at=g.at;const keepAlt=D.alt;D.pp=g.pp;D.alt=keepAlt;D.ovr=edOvr(D);if(D.pot<D.ovr)D.pot=D.ovr;render();edPlRead();render()},
  epSave:()=>{edPlRead();const D=UI.ed.draft;if(!D.fn&&!D.ln)return toast('Bitte einen Namen eingeben');if(D.pot<D.ovr)D.pot=D.ovr;const P=edPlayers(),x={...D};delete x.clubAssoc;
    if(UI.ed.psel==='new'){P.push(x);UI.ed.psel=P.length-1}else P[UI.ed.psel]=x;edSave();toast('Spieler gespeichert – gilt für neue Karrieren');render()},
  epDel:()=>{const P=edPlayers();P.splice(UI.ed.psel,1);UI.ed.psel=null;UI.ed.draft=null;edSave();toast('Spieler gelöscht');render()},
  epCancel:()=>{UI.ed.psel=null;UI.ed.draft=null;render()}
});
Object.assign(CHG,{
  epPos:()=>{edPlRead();render()},
  epCassoc:()=>{edPlRead();UI.ed.draft.club='free';render()}
});
// Beim Karrierestart: eigene Spieler in die Welt setzen
function edInsertPlayers(){
  const P=(edDB().players||[]);if(!P.length)return;const map={};for(const c of S.clubs)if(c.slot)map[c.slot]=c;
  for(const e of P){
    const c=e.club==='free'?null:map[e.club];if(e.club!=='free'&&!c)continue;
    const p=genPlayer(e.pos,60,e.age,e.nat);Object.assign(p,{fn:e.fn,ln:e.ln,nat:ASSOC[e.nat]?e.nat:p.nat,age:e.age,at:e.at,pp:e.pp,ed:1});CACHE.rate.delete(p);CACHE.ovr.delete(p);
    p.pot=Math.max(e.pot||0,ovr(p));p.val=calcValue(p);p.wage=e.wage?rw(wk(+e.wage)):rw(calcWage(p)*(c?c.econ:1));p.until=S.season+(e.yrs||2)-1;S.players[p.id]=p;
    if(c){const same=squadOf(c).filter(x=>x.pos===e.pos&&!x.ed).sort((a,b)=>ovr(a)-ovr(b))[0];if(same){c.players=c.players.filter(id=>id!==same.id);delete S.players[same.id]}p.club=c.id;c.players.push(p.id);assignRoles(c)}
  }
}
