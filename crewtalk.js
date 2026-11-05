/* =====================================================================
   Seitenlinie – Mitarbeitergespräche: Persönlichkeit, Stimmung,
   echte Einschätzungen aus den Spieldaten, Abwerbeversuche
   ===================================================================== */
const CT_TR={
  ehrgeizig:{lbl:'Ehrgeizig',d:'will nach oben – liebt Ziele, wird bei Stillstand unruhig'},
  loyal:{lbl:'Loyal',d:'steht zum Verein, auch in schweren Zeiten'},
  kritisch:{lbl:'Kritisch',d:'sagt offen, was ihn stört – verträgt Kritik schlecht'},
  gelassen:{lbl:'Gelassen',d:'lässt sich von nichts aus der Ruhe bringen'},
  perfektionist:{lbl:'Perfektionist',d:'nimmt Kritik als Ansporn, Lob eher nüchtern'},
  teamplayer:{lbl:'Teamplayer',d:'blüht bei Wertschätzung auf'}};
function crewTr(m){if(!m.tr){const ks=Object.keys(CT_TR);m.tr=ks[hashStr('tr'+m.name)%ks.length]}if(m.mood===undefined)m.mood=60;return m.tr}
function moodLbl2(v){return v>=80?['😀','sehr zufrieden']:v>=60?['🙂','zufrieden']:v>=40?['😐','unzufrieden']:v>=25?['😠','frustriert']:['💥','kurz vor dem Absprung']}
function userForm(){const r=(S.ureps||[]).filter(x=>x.s===S.season).slice(-5);if(!r.length)return 0;return r.reduce((t,x)=>t+(x.gf>x.ga?1:x.gf<x.ga?-1:0),0)/r.length}

/* ---------- Einschätzungen aus echten Daten ---------- */
function crewAdvice(role){
  const u=userClub(),sq=squadOf(u),L=[];const first=(p)=>p.ln;
  switch(role){
    case 'ast':{const h=tacticHints(u).map(x=>x[1]);const wp=weakestPos(u);
      L.push(h.length?`Taktisch fällt mir auf: ${h[0]}`:'Taktisch sind wir gut aufgestellt, die Abläufe sitzen.');
      L.push(`Wo es hakt: auf der Position ${POS_LABEL[wp.pos]}. Da sind wir am dünnsten besetzt – vielleicht ein Thema fürs nächste Fenster.`);
      const best=sq.filter(p=>p.inj===0&&!u.lineup.includes(p.id)).sort((a,b)=>ovr(b)-ovr(a))[0];if(best)L.push(`Und ${best.fn} ${first(best)} drängt im Training richtig – er ist stärker als manche in der Startelf.`);break}
    case 'gk':{const g=sq.filter(p=>p.pos==='TW').sort((a,b)=>ovr(b)-ovr(a));
      L.push(g[0]?`${first(g[0])} ist unsere klare Nummer eins – Reflexe ${at(g[0],'ref')}, Strafraumbeherrschung ${at(g[0],'cmd')}.`:'Wir haben ehrlich gesagt keinen richtigen Torhüter. Das ist dringend.');
      if(g[1])L.push(`${first(g[1])} als Nummer zwei ${ovr(g[1])>=ovr(g[0])-4?'ist eine echte Alternative':'ist noch ein gutes Stück weg'}.${g[1].age<=22?' Er ist jung, da geht noch viel.':''}`);
      if(g.length<3)L.push('Wir bräuchten noch einen dritten Torwart fürs Training.');break}
    case 'fit':{const t=sq.filter(p=>p.fit<72&&p.inj===0).sort((a,b)=>a.fit-b.fit);
      L.push(t.length?`Achtung bei der Belastung: ${t.slice(0,3).map(p=>`${first(p)} (${Math.round(p.fit)} %)`).join(', ')} – die brauchen eine Pause, sonst steigt das Verletzungsrisiko.`:'Die Mannschaft ist körperlich in einem sehr guten Zustand.');
      const old=sq.filter(p=>p.age>=31).length;if(old>=3)L.push(`Wir haben ${old} Spieler über 30 – die steuere ich besonders vorsichtig.`);
      if(u.tactic.press==='hoch')L.push('Das Gegenpressing kostet viel Kraft. Über eine lange Saison müssen wir rotieren.');break}
    case 'ana':{const ng=nextUserGames()[0];if(!ng){L.push('Aktuell steht kein Spiel an – ich arbeite die letzten Partien auf.');break}
      const o=club(ng.m.h===S.user?ng.m.a:ng.m.h);ensureTactic(o);const sm=shapeMetrics(o),st=squadOf(o).sort((a,b)=>ovr(b)-ovr(a))[0];
      L.push(`Nächster Gegner: ${o.name}. Gegen den Ball stehen sie im ${sm.oopShape}, mit Ball im ${sm.ipShape} – ${MENTALITY[o.tactic.men]}, ${PRESSING[o.tactic.press]}.`);
      if(st)L.push(`Der gefährlichste Mann ist ${st.fn} ${first(st)} (${POS_LABEL[st.pos]}). Auf den müssen wir aufpassen.`);
      L.push(o.tactic.press==='hoch'?'Gegen ihr hohes Pressing helfen lange Bälle hinter die Kette.':o.tactic.men==='defensiv'?'Sie werden tief stehen – wir brauchen Geduld und Breite.':'Ein offenes Spiel – Umschaltmomente werden entscheiden.');break}
    case 'psy':{const un=sq.filter(p=>p.mor<45||p.unhappy).sort((a,b)=>a.mor-b.mor);
      L.push(un.length?`Sorgen machen mir ${un.slice(0,3).map(p=>first(p)).join(', ')}. ${un[0].unhappy?first(un[0])+' fühlt sich übergangen.':'Die Moral ist im Keller.'} Ein Gespräch oder Spielzeit würde helfen.`:'Die Stimmung in der Kabine ist gut. Keiner hängt durch.');
      const f=userForm();L.push(f>.3?'Die Siege geben Selbstvertrauen – jetzt nicht überheblich werden.':f<-.3?'Nach den Niederlagen zweifeln einige. Wir brauchen ein Erfolgserlebnis.':'Die Mannschaft ist mental stabil.');break}
    case 'doc':case 'phys':{const inj=sq.filter(p=>p.inj>0),risk=sq.filter(p=>at(p,'inp')>=15).sort((a,b)=>at(b,'inp')-at(a,'inp'));
      L.push(inj.length?`Ausfälle: ${inj.map(p=>`${first(p)} (${p.inj} ${p.inj===1?'Woche':'Wochen'})`).join(', ')}.`:'Aktuell haben wir keine Verletzten – toi, toi, toi.');
      if(risk.length)L.push(`Anfällig sind ${risk.slice(0,3).map(p=>first(p)).join(', ')}. Bei denen müssen wir die Belastung genau steuern.`);break}
    case 'scout':{const r=(S.reports||[])[0];const p=r&&S.players[r.pid];
      L.push(p?`Mein Favorit gerade: ${p.fn} ${first(p)}, ${p.age} Jahre, ${POS_LABEL[p.pos]}. ${r.txt}`:'Unser Netzwerk ist noch zu klein. Schick mehr Scouts raus, dann finden wir auch die Rohdiamanten.');
      L.push(`Wir beobachten im Moment ${scoutsOf().map(s=>regionLbl(s.region)).join(', ')||'kein Gebiet'}.`);break}
    case 'youth':case 'u19':{const y=sq.filter(p=>p.age<=20).sort((a,b)=>b.pot-a.pot);
      L.push(y[0]?`Unser größtes Talent ist ${y[0].fn} ${first(y[0])} – ${y[0].age} Jahre, Potenzial ${y[0].pot}. ${y[0].apps<3?'Er braucht dringend Einsatzminuten.':'Schön, dass er schon spielt.'}`:'Im Profikader haben wir aktuell keine echten Talente.');
      if(y[1])L.push(`Auch ${first(y[1])} (${y[1].age}) entwickelt sich gut.`);break}
    case 'cfo':case 'ceo':{const f=S.fin,inc=f.tv+f.tickets+f.prize+(f.cups||0)+(f.spons||0),exp=f.wages+(f.bonus||0)+(f.staff||0),sal=inc+f.tOut-exp-f.tIn;
      L.push(`Kontostand: ${spM(u.budget)}. Die Saison steht bisher bei ${sal>=0?'plus':'minus'} ${spM(Math.abs(sal))}.`);
      L.push(wageBill(u)>u.wBudget*.95?'Das Gehaltsbudget ist nahezu ausgereizt – bei Neuverpflichtungen müssen wir vorsichtig sein.':`Beim Gehalt haben wir noch Luft: ${spM(mon(u.wBudget-wageBill(u)))} im Monat.`);
      if(role==='ceo')L.push(`Unsere Sponsoren sind ${userForm()>0?'sehr zufrieden mit dem sportlichen Auftritt':'nervös – sie wollen Ergebnisse sehen'}.`);break}
    case 'mkt':L.push(`Zuletzt kamen ${u.lastAtt?u.lastAtt.toLocaleString('de-DE'):'–'} Zuschauer bei einer Kapazität von ${u.stadium.toLocaleString('de-DE')}.`);L.push(userForm()>0?'Die Trikots gehen weg wie warme Semmeln!':'Erfolg verkauft sich am besten – ein paar Siege würden helfen.');break;
    case 'dirq':L.push(`Transferbudget: ${spM(u.tBudget)}. ${isWindow()?'Das Fenster ist offen – wenn wir etwas machen wollen, dann jetzt.':'Das Fenster ist zu, aber ich sondiere schon den Markt.'}`);L.push(`Am dringendsten wäre aus meiner Sicht die Position ${POS_LABEL[weakestPos(u).pos]}.`);break;
  }
  return L;
}

/* ---------- Gespräch ---------- */
const CT_TOP=[['advice','💬 „Wie schätzt du die Lage ein?"'],['praise','👏 Lob aussprechen'],['crit','☝️ Kritik äußern'],['goal','🎯 Ziel vereinbaren'],['contract','📝 Über den Vertrag sprechen']];
function ctOpen(role){const m=crewOf(userClub())[role];if(!m)return;crewTr(m);UI.ct={role,msgs:[],pend:[]};
  const t=m.tr,greet={ehrgeizig:'Chef! Gut, dass Sie Zeit haben – ich habe einiges auf dem Herzen.',loyal:'Trainer, schön Sie zu sehen. Kaffee?',kritisch:'Na endlich. Ich wollte ohnehin mit Ihnen reden.',gelassen:'Hallo Trainer. Setzen Sie sich, ganz entspannt.',perfektionist:'Trainer. Ich habe meine Unterlagen dabei.',teamplayer:'Hallo Trainer! Schön, dass Sie vorbeischauen.'}[t];
  ctSay('sys',`${CREW[role].lbl} ${m.name} · ${CT_TR[t].lbl} (${CT_TR[t].d}) · Stimmung: ${moodLbl2(m.mood).join(' ')}`);ctSay('them',`*steht auf und gibt Ihnen die Hand* ${greet}`);
  UI.modal=ctModal();render()}
function ctSay(who,t){const C=UI.ct;if(!C)return;if(who==='me')C.msgs.push({who,t});else C.pend.push({who,t})}
function ctPump(){clearTimeout(ctPump.t);const C=UI.ct;if(!C||!C.pend.length||!UI.modal)return;const m=C.pend[0];ctPump.t=setTimeout(()=>{if(!UI.ct||!C.pend.length)return;C.msgs.push(C.pend.shift());render();setTimeout(()=>{const e=document.getElementById('vrlog');if(e)e.scrollTop=e.scrollHeight},0)},m.who==='sys'?400:Math.min(3200,700+m.t.length*20))}
function ctMove(top){
  const u=userClub(),C=UI.ct,role=C.role,m=crewOf(u)[role];if(!m)return;const t=crewTr(m),wk=S.season*100+S.week;m.tw=m.tw||{};
  const cool=k=>m.tw[k]&&wk-m.tw[k]<3;
  if(top==='advice'){ctSay('me',pick(['Wie schätzt du die Lage ein? Ganz offen.','Erzähl mal – was beschäftigt dich gerade in deinem Bereich?']));for(const l of crewAdvice(role))ctSay('them',l);return}
  if(top==='praise'){ctSay('me',pick(['Ich wollte dir einfach mal sagen: Du machst einen richtig guten Job.','Danke für deine Arbeit. Das sieht man auf dem Platz.']));
    if(cool('praise')){ctSay('them','*lächelt* Das sagten Sie neulich schon. Aber danke.');return}m.tw.praise=wk;
    const d={teamplayer:14,loyal:10,gelassen:6,ehrgeizig:7,kritisch:8,perfektionist:3}[t];m.mood=clamp(m.mood+d,0,100);
    ctSay('them',{teamplayer:'*strahlt* Das bedeutet mir wirklich viel, Trainer. Danke!',loyal:'Danke. Für diesen Verein gebe ich gern alles.',gelassen:'*nickt* Freut mich. Weiter so.',ehrgeizig:'Danke – aber da geht noch mehr, versprochen.',kritisch:'Hm. Schön zu hören. Ehrlich gesagt hätte ich das öfter gebraucht.',perfektionist:'Danke. Aber ich sehe noch drei Baustellen.'}[t]);return}
  if(top==='crit'){ctSay('me',pick(['Ich muss ehrlich sein: Ich erwarte mehr von deinem Bereich.','Mir gefällt einiges nicht, wie es gerade läuft.']));
    if(cool('crit')){ctSay('them','*verschränkt die Arme* Schon wieder? Ich habe es verstanden.');m.mood=clamp(m.mood-6,0,100);return}m.tw.crit=wk;
    const d={perfektionist:4,gelassen:-2,ehrgeizig:-4,teamplayer:-8,loyal:-6,kritisch:-14}[t];m.mood=clamp(m.mood+d,0,100);if(t==='perfektionist'||t==='ehrgeizig')m.boost=S.week+4;
    ctSay('them',{perfektionist:'*macht sich Notizen* Verstanden. Sie haben recht – ich ziehe die Zügel an.',gelassen:'Okay. Nehme ich mit. Wir kriegen das hin.',ehrgeizig:'*schluckt* Das ist hart. Aber gut, ich will es Ihnen beweisen.',teamplayer:'Das trifft mich, ehrlich gesagt. Ich dachte, wir ziehen an einem Strang.',loyal:'Ich gebe hier jeden Tag alles … aber gut, ich höre Sie.',kritisch:'*wird laut* Bei allem Respekt – vielleicht sollten Sie mal schauen, was Sie mir an Mitteln geben!'}[t]);return}
  if(top==='goal'){ctSay('me',pick(['Lass uns ein klares Ziel für die nächsten Wochen festlegen.','Ich möchte, dass wir uns gemeinsam ein Ziel setzen.']));
    if(cool('goal')){ctSay('them','Wir haben doch gerade erst eines vereinbart.');return}m.tw.goal=wk;
    const d={ehrgeizig:12,perfektionist:8,teamplayer:6,loyal:4,gelassen:2,kritisch:3}[t];m.mood=clamp(m.mood+d,0,100);m.boost=S.week+3;
    ctSay('them',{ehrgeizig:'*richtet sich auf* Genau das brauche ich! Messen Sie mich daran.',perfektionist:'Gut. Ich arbeite einen Plan aus – bis ins Detail.',teamplayer:'Gemeinsam schaffen wir das. Ich bin dabei.',loyal:'Für den Verein – selbstverständlich.',gelassen:'Klingt vernünftig. Machen wir.',kritisch:'Ziele sind gut. Dann brauche ich aber auch die Mittel dafür.'}[t]);return}
  if(top==='contract'){const yrs=m.until-S.season+1;ctSay('me','Lass uns über deinen Vertrag sprechen.');
    const want=m.mood>=70?1.05:m.mood>=45?1.12:1.25;C.offer=rw(m.wage*want);
    ctSay('them',m.mood<35?`*lehnt sich zurück* Ehrlich? Ich überlege, ob ich überhaupt bleibe. Wenn, dann nur für ${spM(mon(C.offer))} im Monat.`:`Mein Vertrag läuft noch ${yrs===1?'diese Saison':yrs+' Jahre'}. ${t==='loyal'?'Ich würde gern langfristig bleiben.':t==='ehrgeizig'?'Ich will wissen, wohin die Reise geht.':'Ich bin offen für eine Verlängerung.'} Ich stelle mir ${spM(mon(C.offer))} im Monat vor, drei Jahre.`);
    C.contract=1;return}
}
function ctModal(){return ()=>{
  const u=userClub(),C=UI.ct,m=crewOf(u)[C.role];if(!m)return '<p>Nicht mehr im Verein.</p><button class="btn" data-act="closeModal">Schließen</button>';
  setTimeout(ctPump,0);const busy=C.pend.length>0,[mi,ml]=moodLbl2(m.mood);
  return `<div class="vrc"><div class="vrhead"><div><h2 style="margin:0">Gespräch · ${esc(m.name)}</h2><div class="small muted">${CREW[C.role].lbl} · Qualität ${m.q} · ${CT_TR[crewTr(m)].lbl} · Stimmung ${mi} ${ml}</div></div></div>
   <div class="vrgrid"><div>${vrLog(C.msgs,null,m.name,busy?m.name:null)}</div><div class="card vrpanel ${busy?'busy':''}">${meter('Stimmung',m.mood)}
    <div class="small muted" style="margin:4px 0 10px">Gute Stimmung macht ihn besser (bis zu ±2 Qualitätspunkte). Frustrierte Mitarbeiter kündigen oder lassen sich abwerben.</div>
    <div class="vrargs col">${CT_TOP.map(([k,l])=>`<button data-act="ctMove" data-v="${k}">${l}</button>`).join('')}</div>
    ${C.contract&&C.offer?`<div class="news t-offer" style="margin-top:10px">Forderung: <b>${money(mon(C.offer))}/Monat</b>, 3 Jahre<div class="row" style="margin-top:6px"><button class="btn sm pri" data-act="ctSign">Annehmen</button><button class="btn sm" data-act="ctNo">Ablehnen</button></div></div>`:''}
   </div></div><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-act="ctClose">Gespräch beenden</button></div></div>`;
}}

/* ---------- Woche: Stimmung & Abwerbeversuche ---------- */
function crewWeekly(){
  if(!S||S.user===null)return;const u=userClub(),cr=crewOf(u),f=userForm();S.crewEv=(S.crewEv||[]).filter(e=>e.exp>=S.week&&e.season===S.season);
  for(const [role,m] of Object.entries(cr)){if(!m)continue;const t=crewTr(m);
    const target=55+f*10+(t==='loyal'?8:t==='gelassen'?4:0)+(m.wage>crewWage(m.q,role,u)*1.1?6:0);
    m.mood=clamp(m.mood+(target-m.mood)*.06+(rnd()-.5)*2,0,100);
    if(m.mood<22&&rnd()<.07){cr[role]=null;addNews('board',`${CREW[role].lbl} kündigt!`,`${esc(m.name)} ist mit der Situation unzufrieden und hat gekündigt. Die Stelle ist unbesetzt.`);continue}
    if(!S.crewEv.some(e=>e.role===role)&&m.q>=13&&(t==='ehrgeizig'||m.mood<45)&&rnd()<.015){
      const big=S.clubs.filter(c=>!c.guest&&c.id!==S.user&&c.rep>u.rep+3);if(!big.length)continue;const c=pick(big);
      S.crewEv.push({role,cid:c.id,season:S.season,w:S.week,exp:S.week+2});
      addNews('board',`Abwerbeversuch: ${m.name}`,`${esc(c.name)} will deinen ${CREW[role].lbl} ${esc(m.name)} verpflichten. Unter „Mitarbeiter“ kannst du reagieren – sonst ist er in zwei Wochen weg.`);}
  }
  // Abgelaufene Abwerbeversuche: Mitarbeiter geht
  for(const e of S.crewEv)if(e.exp===S.week){const m=cr[e.role];if(m&&!e.done){e.done=1;cr[e.role]=null;addNews('board',`${m.name} wechselt zu ${club(e.cid).name}`,`Du hast nicht reagiert – ${esc(m.name)} ist weg. Die Stelle ${CREW[e.role].lbl} ist unbesetzt.`)}}
}
function crewEvHtml(){
  const u=userClub(),cr=crewOf(u);return (S.crewEv||[]).filter(e=>!e.done&&cr[e.role]).map(e=>{const m=cr[e.role],c=club(e.cid);
    return `<div class="news t-offer" style="margin-bottom:10px"><b>Abwerbeversuch:</b> ${esc(c.name)} will ${esc(m.name)} (${CREW[e.role].lbl}, Qualität ${m.q}). Entscheidung bis Woche ${e.exp+1}.
     <div class="row" style="margin-top:6px"><button class="btn sm pri" data-act="crewKeep" data-v="${e.role}">Halten: +20 % Gehalt, Vertrag +2 Jahre</button><button class="btn sm" data-act="crewLet" data-v="${e.role}">Ziehen lassen (Ablöse ${money(m.wage*30)})</button></div></div>`}).join('');
}
Object.assign(ACT,{
  ctOpen:d=>ctOpen(d.v),
  ctMove:d=>{ctMove(d.v);render();setTimeout(()=>{const e=document.getElementById('vrlog');if(e)e.scrollTop=e.scrollHeight},0)},
  ctClose:()=>{const C=UI.ct;if(C){C.msgs.push(...C.pend);C.pend=[]}clearTimeout(ctPump.t);UI.ct=null;UI.modal=null;save();render()},
  ctSign:()=>{const u=userClub(),C=UI.ct,m=crewOf(u)[C.role];if(!m)return;if(crewCost(u)-m.wage+C.offer>crewBudget(u)){ctSay('sys','Das Personalbudget reicht dafür nicht.');render();return}
    m.wage=C.offer;m.until=S.season+2;m.mood=clamp(m.mood+15,0,100);C.contract=0;ctSay('me','Abgemacht. Drei weitere Jahre.');ctSay('them','*reicht Ihnen die Hand* Danke, Trainer. Darauf können Sie sich verlassen.');render()},
  ctNo:()=>{const C=UI.ct,m=crewOf(userClub())[C.role];C.contract=0;m.mood=clamp(m.mood-10,0,100);ctSay('me','Das kann ich dir im Moment nicht geben.');ctSay('them',m.tr==='loyal'?'Schade. Aber ich verstehe das.':'*seufzt* Dann muss ich mir meine Gedanken machen.');render()},
  crewKeep:d=>{const u=userClub(),m=crewOf(u)[d.v];if(!m)return;m.wage=rw(m.wage*1.2);m.until=Math.max(m.until,S.season)+2;m.mood=clamp(m.mood+20,0,100);const e=S.crewEv.find(x=>x.role===d.v&&!x.done);if(e)e.done=1;addNews('board',`${m.name} bleibt!`,`Mit einem verbesserten Vertrag (${money(mon(m.wage))}/Monat) hast du ihn gehalten.`);save();render()},
  crewLet:d=>{const u=userClub(),m=crewOf(u)[d.v];if(!m)return;const e=S.crewEv.find(x=>x.role===d.v&&!x.done);if(e)e.done=1;const fee=m.wage*30;u.budget+=fee;S.fin.spons=(S.fin.spons||0)+fee;crewOf(u)[d.v]=null;addNews('board',`${m.name} wechselt`,`Er geht zu ${esc(e?club(e.cid).name:'einem anderen Verein')}. Ausgleichszahlung: ${money(fee)}.`);save();render()}
});
