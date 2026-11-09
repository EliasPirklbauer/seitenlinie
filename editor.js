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
   <p class="small muted" style="margin-top:0">Deine Änderungen gelten für alle <b>neuen</b> Karrieren. Laufende Spielstände bleiben unverändert. Aktuell bearbeitet: ${Object.keys(edDB().clubs).length} Vereine, ${Object.keys(edDB().leagues).length} Ligennamen.</p>
   <div class="edgrid"><div class="card"><h3>Verbände</h3>${confedTabs(E.confed,'edConfed')}<input data-chg="edQ" placeholder="Land suchen …" value="${esc(E.q||'')}" style="width:100%;margin-bottom:8px"><div class="edlist">${assocs}</div></div>${mid}${right}</div></div>`;
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
  edResetAll:()=>{if(!confirm('Alle Änderungen im Editor löschen?'))return;EDB_CACHE={clubs:{},leagues:{}};edSave();toast('Editor zurückgesetzt');render()},
  edExport:()=>{const txt=JSON.stringify({type:'seitenlinie-editor',v:1,...edDB()},null,1),blob=new Blob([txt],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='seitenlinie-vereine.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
});
Object.assign(CHG,{
  edQ:el=>{UI.ed.q=el.value;render();const i=document.querySelector('input[data-chg=edQ]');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},
  edLeague:el=>{const k=el.dataset.k,[code,t]=k.split('|'),d=LEAGUE_DATA[code]||{},base=(d.names&&d.names[t-1])||null,v=el.value.trim();if(!v||v===base)delete edDB().leagues[k];else edDB().leagues[k]=v;edSave();render()},
  edImport:el=>{const f=el.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(!o.clubs)throw 0;EDB_CACHE={clubs:o.clubs||{},leagues:o.leagues||{}};edSave();toast('Vereinsdatenbank importiert');render()}catch(e){toast('Ungültige Datei')}};r.readAsText(f)}
});
