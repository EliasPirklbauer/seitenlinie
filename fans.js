/* =====================================================================
   Seitenlinie – Fans: Stimmung, Treue, Choreos, Proteste, Zuschauer.
   Gilt für alle Vereine. Dazu: Pressekonferenzen der KI-Trainer.
   ===================================================================== */
function fansOf(c){
  if(!c.fans){const R=mkRng(hashStr('fans'+c.id+':'+(S.seed||1)));c.fans={mood:Math.round(clamp(52+(c.rep-60)*.15+R()*16,30,80)),loy:Math.round(clamp(35+R()*55+(c.rep-60)*.2,20,95)),next:null,log:[]}}
  return c.fans;
}
function fanLbl(v){return v>=82?['🔥','euphorisch']:v>=66?['😀','begeistert']:v>=50?['🙂','zufrieden']:v>=36?['😐','gespalten']:v>=24?['😠','wütend']:['📢','im Protestmodus']}
function fanHome(c){return c.guest?1:clamp(.5+fansOf(c).mood/100*.8,.6,1.3)}            // Heimvorteil-Faktor (≈1 bei Stimmung 62)
function fanAtt(c){if(c.guest)return 1;const F=fansOf(c);return clamp(.84+F.mood/100*.28+(F.loy-55)/450,.68,1.1)}
function fanLog(c,t){const F=fansOf(c);F.log.unshift({s:S.season,w:S.week,t});F.log=F.log.slice(0,12)}
function fanAdd(c,d){if(!c||c.guest)return;const F=fansOf(c);F.mood=clamp(F.mood+d*(d<0?1.25-F.loy/200:1),0,100)}

/* ---------- Woche: Ergebnisse, Tabellenlage, Ereignisse ---------- */
function fansWeekly(played){
  const ul=userClub().league;
  for(const {L,r} of played||[])for(const m of L.fixtures[r]){
    if(m.hg===null)continue;
    for(const [c,o,gf,ga] of [[club(m.h),club(m.a),m.hg,m.ag],[club(m.a),club(m.h),m.ag,m.hg]]){
      if(c.guest)continue;const F=fansOf(c),res=gf>ga?1:gf===ga?0:-1,exp=clamp((clubAvg(c)-clubAvg(o))/10,-1,1);
      fanAdd(c,(res-exp*.5)*2.6+(gf-ga>=3?1.5:gf-ga<=-3?-2:0));
      const home=c.id===m.h;if(home&&F.next){F.next=null}
    }
  }
  for(const c of S.clubs){if(c.guest||!league(c))continue;const F=fansOf(c),rk=rankOf(c.id),gap=rk-c.expRank;
    const target=clamp(60-gap*3.2+(c.lastAtt&&c.lastAtt>=c.stadium*.97?3:0),18,92);F.mood=clamp(F.mood+(target-F.mood)*.05,0,100);
    // Ereignis fürs nächste Heimspiel
    if(!F.next){if(F.mood>=80&&rnd()<.22)F.next='choreo';else if(F.mood<26&&rnd()<.3)F.next=rnd()<.4?'boycott':'protest'}
    if(F.next&&(F.next==='protest'||F.next==='boycott')&&!F.ann){F.ann=1;const mine=c.id===S.user;
      fanLog(c,F.next==='boycott'?'Die Ultras kündigen einen Stimmungsboykott an.':'Fans kündigen Proteste beim nächsten Heimspiel an.');
      if(mine)addNews('fans',`📢 Fans machen mobil`,F.next==='boycott'?'Die Kurve kündigt an, beim nächsten Heimspiel die ersten zwölf Minuten zu schweigen. Die Stimmung ist im Keller.':'Beim nächsten Heimspiel sind Protestaktionen angekündigt. Die Fans wollen Veränderungen sehen.');
      else if(c.league===ul)tn(true,[c.id],'transfer',`${c.short}: Fans proben den Aufstand`,`Bei ${esc(c.name)} brodelt es – ${F.next==='boycott'?'Stimmungsboykott':'Proteste'} beim nächsten Heimspiel angekündigt.`)}
    if(!F.next)F.ann=0;
    if(c.id!==S.user&&F.mood<20&&S.week>=S.weeks*.25&&c.firedSeason!==S.season&&rnd()<.05)fireCoach(c,'nach massiven Fanprotesten');
  }
}
// Transfers bewegen die Fans
function fansTransfer(p,from,to,fee){
  if(from&&!from.guest&&league(from)){const star=ovr(p)>=clubAvg(from)+3,long=p.since!==undefined&&S.season-p.since>=4;
    if(star||long){fanAdd(from,-(star?4:0)-(long?3:0));fanLog(from,`Unmut über den Abgang von ${pname(p)}.`);
      if(from.id===S.user)addNews('fans',`📢 Fans enttäuscht: ${fullname(p)} geht`,`Der Abgang ${long?'des langjährigen Publikumslieblings':'eines Leistungsträgers'} kommt in der Kurve schlecht an.`)}}
  if(to&&!to.guest&&league(to)&&ovr(p)>=clubAvg(to)+4){fanAdd(to,3);fanLog(to,`Vorfreude auf Neuzugang ${pname(p)}.`);if(to.id===S.user)addNews('fans',`📣 Fans feiern ${fullname(p)}`,'Der Neuzugang sorgt für Aufbruchstimmung – die Trikots gehen weg wie warme Semmeln.')}
}
// Zeile im Live-Ticker vor dem Anpfiff
function fanPreLine(hc,ac){
  const F=fansOf(hc),A=fansOf(ac);const L=[];
  if(F.next==='choreo')L.push(pick([`Gänsehaut! Die Heimkurve zeigt eine riesige Choreo in ${hc.short==='?'?'den Vereinsfarben':'den Vereinsfarben'} – das ganze Stadion singt mit.`,'Eine Choreo über die komplette Tribüne – die Fans von '+hc.name+' sind heute in Feierlaune.']));
  else if(F.next==='protest')L.push(pick(['Spruchbänder in der Kurve: „Wir wollen euch kämpfen sehen!“ – Pfiffe bei der Mannschaftsvorstellung.',`Protest im Stadion: Die Fans von ${hc.name} zeigen der Vereinsführung die rote Karte.`]));
  else if(F.next==='boycott')L.push('Gespenstische Stille: Die Heimkurve schweigt aus Protest – die ersten zwölf Minuten kein Gesang.');
  else if(F.mood>=70)L.push(`Die Heimfans von ${hc.name} sind bester Laune – ein echter Hexenkessel.`);
  else if(F.mood<35)L.push(`Gedrückte Stimmung auf den Rängen – die Fans von ${hc.name} warten auf eine Reaktion.`);
  if(A.mood>=75)L.push(`Auch der Gästeblock ist voll und laut – die Anhänger von ${ac.name} sind mitgereist.`);
  return L;
}
function fanEventMul(c){const F=fansOf(c);return F.next==='choreo'?1.02:F.next==='boycott'?.97:F.next==='protest'?.985:1}

/* ---------- Pressekonferenzen der KI-Trainer ---------- */
function coachLast(c){return c.staff.coach.name.split(' ').pop()}
function aiPressWeekly(played){
  S.apress=(S.apress||[]).filter(x=>x.s===S.season&&S.week-x.w<8);const ul=userClub().league,u=userClub();
  const show=c=>c.league===ul;
  for(const {L,r} of played||[])for(const m of L.fixtures[r]){
    if(m.hg===null)continue;
    for(const [c,o,gf,ga] of [[club(m.h),club(m.a),m.hg,m.ag],[club(m.a),club(m.h),m.ag,m.hg]]){
      if(c.guest||c.id===S.user)continue;const tr=c.staff.coach.trait,hotP=tr==='offensiv'||tr==='pressing'?.35:tr==='defensiv'||tr==='pragmatiker'?.12:.2,gap=rankOf(c.id)-c.expRank,cn=coachLast(c);
      c.cimg=c.cimg===undefined?55:c.cimg;let hl,team=0,fan=0,img=0;const x=rnd();
      if(gf>ga){if(x<hotP){hl=`${cn} nach dem ${gf}:${ga}: „Das war eine Ansage an die Liga“`;team=2;fan=1.5;img=-1}else if(x<.7){hl=pick([`${cn}: „Wir sind auf dem richtigen Weg“`,`${cn} lobt die Moral seiner Mannschaft`,`${cn}: „Genau so wollen wir Fußball spielen“`,`Zufriedener ${cn}: „Die Jungs haben sich das verdient“`]);team=1;img=1}else{hl=`${cn} bleibt nach dem Sieg bescheiden`;img=1}}
      else if(gf<ga){if(x<hotP*.6){hl=`${cn} schimpft über den Schiedsrichter`;fan=1.5;img=-3;c.budget-=nice(20000*Math.max(.3,c.econ))}
        else if(x<hotP*.6+.25){hl=`${cn} rechnet mit seiner Mannschaft ab`;team=-3;img=1}
        else if(gap>=4&&x<.8){hl=`${cn}: „Ich denke nicht an Rücktritt“`;img=-2;fan=-1}
        else{hl=pick([`${cn}: „Das geht auf meine Kappe“`,`${cn} stellt sich schützend vor sein Team`,`${cn}: „Wir müssen jetzt zusammenhalten“`]);team=1;img=2}}
      else{if(x<.5){hl=pick([`${cn}: „Ein Punkt, mit dem wir leben können“`,`${cn} sieht ein gerechtes Remis`,`${cn}: „Am Ende fehlte die Präzision“`])}else{hl=`${cn} ärgert sich über zwei verlorene Punkte`;team=-1;img=1}}
      if(team)for(const p of squadOf(c))p.mor=clamp(p.mor+team,15,100);
      if(fan)fanAdd(c,fan);c.cimg=clamp(c.cimg+img,0,100);
      if(show(c)&&(rnd()<.45||o.id===S.user))S.apress.unshift({s:S.season,w:S.week,cid:c.id,o:OUTLETS[Math.floor(rnd()*OUTLETS.length)],hl});
    }
  }
  // Vorberichte: der nächste Gegner äußert sich über dich
  const g=nextUserGames()[0];
  if(g&&g.w===S.week){const o=club(g.m.h===S.user?g.m.a:g.m.h);if(!o.guest){const tr=o.staff.coach.trait,hot=rnd()<(tr==='offensiv'||tr==='pressing'?.6:.3),cn=coachLast(o);
    const q=hot?pick([`Gegen ${u.name} rechnen wir uns einiges aus. Die sind nicht unschlagbar.`,`${mgrLast()} redet viel – wir lassen lieber Taten sprechen.`,`Ihre Mannschaft ist leicht auszurechnen.`,`Wir fahren dorthin, um zu gewinnen. Punkt.`])
      :pick([`${u.name} ist ein starker Gegner, wir haben großen Respekt.`,`${mgrLast()} macht dort gute Arbeit. Das wird schwer für uns.`,`Wir müssen an unser Leistungslimit gehen.`]);
    S.oppQuote={s:S.season,w:S.week,cid:o.id,q,hot};
    S.apress.unshift({s:S.season,w:S.week,cid:o.id,o:OUTLETS[Math.floor(rnd()*OUTLETS.length)],hl:`${cn} vor dem Duell mit ${u.name}: „${q}“`,me:1});}}
  S.apress=S.apress.slice(0,60);
}

/* ---------- Oberfläche ---------- */
const FAN_ACT={
  train:{lbl:'🏟️ Offenes Training',d:'Fans dürfen beim Training zuschauen, Autogramme inklusive.',mood:3,cd:4},
  visit:{lbl:'🍻 Fanclub-Besuch',d:'Du besuchst mit zwei Spielern einen Fanclub.',mood:4,img:1,cd:6},
  tickets:{lbl:'🎟️ Ticketaktion',d:'Günstigere Tickets fürs nächste Heimspiel – kostet Einnahmen.',mood:6,cost:1,cd:8}};
function fanActCost(u){return nice(u.stadium*ticketPrice(u)*.3)}
function renderFans(){
  const u=userClub(),F=fansOf(u),[ic,lb]=fanLbl(F.mood),cd=S.fanCd||{};
  const L=league(u),tbl=L.clubs.map(id=>club(id)).filter(c=>!c.guest).sort((a,b)=>fansOf(b).mood-fansOf(a).mood);
  const acts=Object.entries(FAN_ACT).map(([k,A])=>{const wait=(cd[k]||-99)+A.cd-S.week;return `<div class="crow"><span><b>${A.lbl}</b><small>${A.d}${A.cost?' Kosten: '+money(fanActCost(u))+'.':''}</small></span>${wait>0?`<span class="small muted">wieder in ${wait} ${wait===1?'Woche':'Wochen'}</span>`:`<button class="btn sm pri" data-act="fanAct" data-v="${k}">Machen</button>`}</div>`}).join('');
  return `<h2>Fans von ${esc(u.name)}</h2><div class="grid g2">
   <div class="card">${meter('Stimmung',F.mood)}<div class="small" style="margin:4px 0 10px">${ic} ${lb}</div>${meter('Treue',F.loy)}<div class="small muted" style="margin:4px 0 10px">Treue Fans kommen auch in schlechten Zeiten – und verzeihen schneller.</div>
     <div class="crow"><span>Zuschauer zuletzt<small>Kapazität ${u.stadium.toLocaleString('de-DE')}</small></span><b>${u.lastAtt?u.lastAtt.toLocaleString('de-DE'):'–'}</b></div>
     <div class="crow"><span>Nächstes Heimspiel<small>Wirkt auf Heimvorteil und Ticker</small></span><b>${F.next==='choreo'?'🎉 Choreo geplant':F.next==='protest'?'📢 Proteste angekündigt':F.next==='boycott'?'🤐 Stimmungsboykott':'normal'}</b></div>
     <p class="small muted" style="margin-top:10px">Die Stimmung hängt an Ergebnissen, Tabellenplatz, Transfers und deinen Worten in der Pressekonferenz. Sie bestimmt Zuschauerzahlen, Heimvorteil und – über den Fanvertreter im Aufsichtsrat – dein Standing im Verein.</p></div>
   <div class="card"><h3>Aktionen für die Fans</h3><div class="clist">${acts}</div>
     <h3 style="margin-top:14px">Was in der Kurve los war</h3>${F.log.length?F.log.slice(0,6).map(x=>`<div class="small" style="margin-top:3px"><span class="muted">W${x.w+1}</span> · ${esc(x.t)}</div>`).join(''):'<p class="small muted">Noch nichts Besonderes.</p>'}</div>
   <div class="card" style="grid-column:1/-1"><h3>Fanstimmung in der ${esc(L.name)}</h3><div class="tw"><table><thead><tr><th>#</th><th>Verein</th><th class="n">Stimmung</th><th class="n">Treue</th><th>Lage</th><th>Trainer in der Presse</th></tr></thead><tbody>
     ${tbl.map((c,i)=>{const G=fansOf(c),[ci,cl]=fanLbl(G.mood);return `<tr class="${c.id===S.user?'me':''}"><td>${i+1}</td><td>${badge(c,18)} ${esc(c.name)}</td><td class="n"><b>${Math.round(G.mood)}</b></td><td class="n">${Math.round(G.loy)}</td><td>${ci} ${cl}${G.next==='choreo'?' · Choreo':G.next?' · Protest':''}</td><td class="small">${c.id===S.user?imgLbl(pressOf().img):imgLbl(c.cimg===undefined?55:c.cimg)}</td></tr>`}).join('')}</tbody></table></div></div></div>`;
}
function pressReview(){return ()=>{
  const P=pressOf(),own=P.log.map(x=>({...x,cid:S.user})),all=[...own,...(S.apress||[])].sort((a,b)=>(b.s*100+b.w)-(a.s*100+a.w)).slice(0,40);
  return `<h2>📰 Pressespiegel</h2><p class="small muted">Schlagzeilen über dich und die Trainer deiner Liga. Dein Bild in der Öffentlichkeit: ${Math.round(P.img)} – ${imgLbl(P.img)}.</p>
   <div class="clist">${all.map(x=>{const c=club(x.cid);return `<div class="crow"><span>${badge(c,18)} <b>${esc(x.o)}:</b> ${esc(x.hl)}<small>${esc(c.name)} · Woche ${x.w+1}</small></span></div>`}).join('')||'<p class="small muted">Noch keine Schlagzeilen.</p>'}</div>
   <div class="row" style="margin-top:10px"><button class="btn" data-act="closeModal">Schließen</button></div>`}}
Object.assign(ACT,{
  fans:()=>{UI.view='fans';render();scrollTo(0,0)},
  pressReview:()=>{UI.modal=pressReview();render()},
  fanAct:d=>{const u=userClub(),A=FAN_ACT[d.v];S.fanCd=S.fanCd||{};if((S.fanCd[d.v]||-99)+A.cd>S.week)return;
    if(A.cost){const c=fanActCost(u);u.budget-=c;S.fin.staff=(S.fin.staff||0)+c}
    const k=1+.3*crewK(u,'mkt');fanAdd(u,A.mood*k);if(A.img)pressOf().img=clamp(pressOf().img+A.img,0,100);S.fanCd[d.v]=S.week;
    fanLog(u,A.lbl.replace(/^\S+\s/,'')+' – die Fans sind angetan.');save();toast('Die Fans freuen sich');render()}
});
