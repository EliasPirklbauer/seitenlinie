/* =====================================================================
   Seitenlinie – Medienfehden & Hausmedien. Jeder Trainer (auch die KI)
   hat ein Verhältnis zu jeder Redaktion. Bei Fehden schreibt eine
   Redaktion gezielt gegen ihn an, ein Hausmedium hält zu ihm.
   ===================================================================== */
const FEUD=30,FRIEND=72;
function authorsOf(o){return Object.keys(AUTH).filter(a=>AUTH[a].o===o)}
function outAuthor(o,pref){const l=authorsOf(o);return l.find(a=>AUTH[a].st===pref)||l[Math.floor(rnd()*l.length)]}
function aiMrel(c){
  if(!c.mrel){const R=mkRng(hashStr('mrel'+c.id+':'+(S.seed||1))),tr=c.staff.coach.trait;c.mrel={};
    for(const o in MEDIA)c.mrel[o]=Math.round(clamp(50+(R()-.5)*30+(o==='abendpost'&&(tr==='offensiv'||tr==='pressing')?-8:0)+(o==='taktik'&&(tr==='ballbesitz'||tr==='pragmatiker')?8:0),15,85))}
  return c.mrel;
}
function relOf(c,o){return c.id===S.user?mrel(o):aiMrel(c)[o]}
function relSet(c,o,v){if(c.id===S.user){mrel(o);S.mrel[o]=clamp(v,0,100)}else aiMrel(c)[o]=clamp(v,0,100)}
function feudLbl(v){return v<FEUD?['⚔️','Fehde']:v>=FRIEND?['🤝','Hausmedium']:['','']}
function bestWorst(c){const e=Object.keys(MEDIA).map(o=>[o,relOf(c,o)]).sort((a,b)=>b[1]-a[1]);return {best:e[0],worst:e[e.length-1]}}

/* ---------- Geschichten ---------- */
function feudStory(c,o){
  const mine=c.id===S.user,sq=squadOf(c),f=mine?userForm():formOf(c).reduce((t,x)=>t+(x==='S'?1:x==='N'?-1:0),0)/5,cn=mine?mgrName():c.staff.coach.name,cl=cn.split(' ').pop(),a=outAuthor(o,o==='abendpost'?'boulevard':null),A=AUTH[a];
  const un=sq.filter(p=>p.unhappy||p.mor<48).sort((a,b)=>ovr(b)-ovr(a))[0],sd=crewOf(c).dirq,rk=rankOf(c.id);
  const opts=[],tags=[];
  if(un)tags.push('un'),opts.push(()=>{un.mor=clamp(un.mor-4,15,100);return [`Exklusiv: ${un.ln} will weg von ${c.name}!`,`Die Unzufriedenheit wächst.`,[`Nach Informationen von ${MEDIA[o].n} hat ${ml.p(un)} genug. Im Umfeld des Spielers ist von „fehlender Wertschätzung“ durch ${esc(cn)} die Rede.`,`${ml.c(c)} wollte sich auf Anfrage nicht äußern. Das sagt auch etwas.`],{pids:[un.id],img:-2,board:-1}]});
  if(sd)tags.push('sd'),opts.push(()=>[`Hintergrund: ${cl} und ${sd.name.split(' ').pop()} – eine Zweckehe?`,`Wie belastbar ist die Achse zwischen Trainer und Sportdirektor?`,[`Bei ${ml.c(c)} sprechen Trainer ${esc(cn)} und ${esc(sd.name)} nach außen mit einer Stimme. Hinter den Kulissen soll es anders aussehen.`,`Mehrere Quellen berichten von Meinungsverschiedenheiten über die Kaderplanung. ${f<0?'In der sportlichen Krise wird daraus schnell ein Machtkampf.':'Noch halten die Ergebnisse alles zusammen.'}`],{rel:-2,img:-1,board:-1}]);
  if(f<0)tags.push('f'),opts.push(()=>[`${cl} ist mit seinem Latein am Ende`,`Die ${MEDIA[o].n}-Analyse einer Mannschaft ohne Plan.`,[`Platz ${rk}. Die letzten Auftritte von ${ml.c(c)} waren erschreckend ideenlos. Wo ist die Handschrift von ${esc(cn)}?`,`Die Mannschaft wirkt verunsichert, die Wechsel kommen zu spät, die Ansprache verpufft. ${A.st==='boulevard'?'Wie lange schaut sich der Aufsichtsrat das noch an?':'Es braucht dringend neue Impulse.'}`],{img:-3,board:-2,team:-1}]);
  tags.push('k');opts.push(()=>[`Kabinengeflüster: Unruhe bei ${c.name}`,`Nicht alle Spieler stehen hinter dem Trainer.`,[`Aus der Kabine von ${ml.c(c)} dringt Unmut nach außen. Einige Führungsspieler sollen die Trainingsmethoden von ${esc(cn)} hinterfragen.`,`${A.st==='boulevard'?'Brodelt es schon?':'Noch ist das ein Grummeln – aber ein hörbares.'}`],{img:-2,team:-1}]);
  S.fst=S.fst||{};const free=opts.map((f,i)=>i).filter(i=>{const k=c.id+':'+tags[i],w=S.fst[k];return w===undefined||S.season*100+S.week-w>=8});if(!free.length)return;
  const ix=free[Math.floor(rnd()*free.length)];S.fst[c.id+':'+tags[ix]]=S.season*100+S.week;const [t,teaser,body,x]=opts[ix]();
  mEmit(a,A.st==='boulevard'?'comment':'analysis',t,teaser,body,{cids:[c.id],pids:x.pids||[]});
  if(mine){const P=pressOf(),B=boardOf();P.img=clamp(P.img+(x.img||0),0,100);B.trust=clamp(B.trust+(x.board||0),0,100);if(x.rel)relAdd(x.rel);if(x.team)for(const p of sq)p.mor=clamp(p.mor+x.team,15,100);
    addNews('press',`⚔️ ${MEDIA[o].n} schießt gegen dich`,`„${esc(t)}“ – die Fehde mit ${MEDIA[o].n} hinterlässt Spuren.`)}
  else{c.cimg=clamp((c.cimg||55)+(x.img||0),0,100);if(x.team)for(const p of sq)p.mor=clamp(p.mor+x.team,15,100)}
}
function friendStory(c,o){
  const mine=c.id===S.user,cn=mine?mgrName():c.staff.coach.name,cl=cn.split(' ').pop(),a=outAuthor(o),A=AUTH[a];
  mEmit(a,'analysis',pickR([`Warum ${cl} der richtige Mann für ${c.name} ist`,`${cl} und die Kunst der Geduld`,`Unaufgeregt erfolgreich: Der Weg von ${cl}`]),`Eine Würdigung der Arbeit von ${cn}.`,[`Man muss nicht laut sein, um gute Arbeit zu machen. ${esc(cn)} hat bei ${ml.c(c)} eine klare Idee etabliert – auch wenn nicht jedes Ergebnis passt.`,`Wer genau hinschaut, sieht die Entwicklung: in der Struktur, in der Mentalität, im Umgang mit jungen Spielern.`],{cids:[c.id]});
  if(mine){pressOf().img=clamp(pressOf().img+2,0,100);boardOf().trust=clamp(boardOf().trust+1,0,100)}else c.cimg=clamp((c.cimg||55)+2,0,100);
}
function pickR(a){return a[Math.floor(rnd()*a.length)]}

/* ---------- Woche ---------- */
function feudWeekly(){
  if(!S||S.user===null||S.fired)return;const u=userClub(),ul=u.league;
  for(const o in MEDIA){mrel(o);S.mrel[o]=clamp(S.mrel[o]+(50-S.mrel[o])*.02,0,100);const v=S.mrel[o];
    if(v<FEUD&&rnd()<.25)feudStory(u,o);else if(v>=FRIEND&&rnd()<.12)friendStory(u,o);
    const was=(S.feudSt||{})[o],now=v<FEUD?'f':v>=FRIEND?'h':'';S.feudSt=S.feudSt||{};
    if(was!==now){S.feudSt[o]=now;if(now==='f')addNews('press',`⚔️ Fehde mit ${MEDIA[o].n}`,`Das Verhältnis ist zerrüttet. Rechne mit gezielt negativen Geschichten – eine Aussprache kann helfen (unter „Medien → Redaktionen“).`);if(now==='h')addNews('press',`🤝 ${MEDIA[o].n} steht hinter dir`,`Die Redaktion ist dir wohlgesonnen – sie berichtet fair und verteidigt dich auch in schwierigen Zeiten.`)}}
  for(const c of S.clubs){if(c.guest||c.id===S.user||!league(c))continue;const R=aiMrel(c),vis=c.league===ul;
    for(const o in R){R[o]=clamp(R[o]+(50-R[o])*.02,0,100);if(vis&&R[o]<FEUD&&rnd()<.12)feudStory(c,o);else if(vis&&R[o]>=FRIEND&&rnd()<.04)friendStory(c,o)}
    if(rnd()<.015){const o=pickR(Object.keys(MEDIA));R[o]=clamp(R[o]-28,0,100);c.cimg=clamp((c.cimg||55)-3,0,100);
      if(vis)mEmit(outAuthor(o),'coach',`Eklat: ${c.staff.coach.name} attackiert ${MEDIA[o].n}`,`Auf der Pressekonferenz von ${c.name} kam es zum Streit.`,[`${esc(c.staff.coach.name)} hat auf der Pressekonferenz von ${ml.c(c)} einen Reporter von ${MEDIA[o].n} scharf angegangen: „Mit Ihnen rede ich nicht mehr.“`,`Die Redaktion kündigte an, „genauer hinzuschauen“. Eine Fehde ist geboren.`],{cids:[c.id]})}
    if(c.cimg!==undefined&&c.cimg<22&&S.week>=S.weeks*.3&&c.firedSeason!==S.season&&rankOf(c.id)>c.expRank&&rnd()<.04)fireCoach(c,'nach anhaltender Medienkritik');
  }
}
// Pressekonferenz-Töne verändern das Verhältnis zu den Redaktionen
function feudTone(tone){
  if(!S||S.user===null)return;
  if(tone==='hot'){mrelAdd('abendpost',2);mrelAdd('kanal7',1);mrelAdd('sportblatt',-2);mrelAdd('rundschau',-1)}
  else if(tone==='dodge'){mrelAdd('abendpost',-1);mrelAdd('echo',-1)}
  else if(tone==='calm'||tone==='humble'){mrelAdd('sportblatt',1);mrelAdd('rundschau',1)}
}
// Aussprache mit einer Redaktion
function feudTalk(o){
  S.feudCd=S.feudCd||{};if((S.feudCd[o]||-99)+6>S.week)return toast('Ihr habt euch erst kürzlich ausgesprochen.');
  S.feudCd[o]=S.week;const v=mrel(o),gain=v<FEUD?14:8;mrelAdd(o,gain);const A=AUTH[outAuthor(o)];
  addNews('press',`☕ Aussprache mit ${MEDIA[o].n}`,`Du hast dich mit ${A.n} zum Hintergrundgespräch getroffen. Verhältnis: ${mrelLbl(mrel(o))}.`);save();render();
}
function feudPanel(){
  const u=userClub(),L=league(u),cl=L.clubs.map(id=>club(id)).filter(c=>!c.guest);
  const mine=Object.entries(MEDIA).map(([o,M])=>{const v=mrel(o),[ic,lb]=feudLbl(v),cd=(S.feudCd||{})[o],wait=cd!==undefined?cd+6-S.week:0;return `<div class="crow"><span><b style="color:${M.c}">${M.n}</b>${ic?' '+ic+' <b>'+lb+'</b>':''}<small>${mrelLbl(v)}</small></span><span style="min-width:140px">${meter('',v)}${wait>0?`<div class="small muted">Aussprache wieder in ${wait} W.</div>`:`<button class="btn sm" data-act="feudTalk" data-v="${o}">☕ Aussprache</button>`}</span></div>`}).join('');
  const rows=cl.map(c=>{const B=bestWorst(c),bw=B.worst[1]<FEUD?'⚔️ ':'',bb=B.best[1]>=FRIEND?'🤝 ':'';return `<tr class="${c.id===S.user?'me':''}"><td>${badge(c,18)} ${esc(c.name)}</td><td>${c.id===S.user?'Du':esc(c.staff.coach.name)}</td><td>${bb}${MEDIA[B.best[0]].n} <span class="muted small">${Math.round(B.best[1])}</span></td><td>${bw}${MEDIA[B.worst[0]].n} <span class="muted small">${Math.round(B.worst[1])}</span></td></tr>`}).join('');
  return `<div class="card" style="margin-bottom:12px"><h3>Dein Verhältnis zu den Redaktionen</h3><p class="small muted">Unter ${FEUD} herrscht Fehde – die Redaktion schreibt gezielt gegen dich. Ab ${FRIEND} ist sie dein Hausmedium und steht dir bei. Boulevard mag klare Kante, seriöse Blätter Sachlichkeit.</p><div class="clist">${mine}</div></div>
   <div class="card" style="margin-bottom:12px"><h3>Lieblings- und Hassmedien der Trainer in der ${esc(L.name)}</h3><div class="tw"><table><thead><tr><th>Verein</th><th>Trainer</th><th>Lieblingsmedium</th><th>Hassmedium</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
Object.assign(ACT,{feudTalk:d=>feudTalk(d.v)});
