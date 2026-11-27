'use strict';
/* Tenno Arsenal: public Warframe world-state board. No account tokens or profile uploads.
   Read-only upstream: https://api.warframestat.us/ps4?language=en
   Personal planning shortlist lives only inside the current browser profile.
 */
const W_ENDPOINT='https://api.warframestat.us/ps4?language=en';
const W_DASH={
 snapshot:null,fetchedAt:null,lastAttempt:null,loading:false,attempted:false,error:'',
 view:'all',tier:'All',mode:'All',search:'',showExpired:false
};
const W_VIEWS=[['all','All opportunities'],['fissures','Void fissures'],['alerts','Alerts & events'],['invasions','Invasions'],['syndicates','Syndicates'],['nightwave','Nightwave'],['daily','Daily / weekly']];
const W_TIERS=['All','Lith','Meso','Neo','Axi','Requiem','Omnia'];
function wStr(v){return v===undefined||v===null?'':String(v);}
function wItems(v){return Array.isArray(v)?v:[];}
function wDate(v){
 if(!v)return null;
 if(typeof v==='number')v=v<1e11?v*1000:v;
 const n=Date.parse(v);
 return Number.isFinite(n)?n:typeof v==='number'&&Number.isFinite(v)?v:null;
}
function wFmt(v){
 const n=wDate(v);if(n===null)return 'Time unavailable';
 return new Date(n).toLocaleString(undefined,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
}
function wCountdown(iso){
 const n=wDate(iso);if(n===null)return 'No expiry published';
 const ms=n-Date.now();
 if(ms<=0)return 'Expired — refresh';
 const m=Math.ceil(ms/60000),d=Math.floor(m/1440),hh=Math.floor((m%1440)/60),mm=m%60;
 if(d)return d+'d '+hh+'h '+mm+'m';
 if(hh)return hh+'h '+mm+'m';
 return mm+'m';
}
function wLeft(iso){
 if(!wDate(iso))return '<span class="muted tiny">No expiry listed</span>';
 return '<span class="wClock" data-w-until="'+h(iso)+'" title="Expires '+h(wFmt(iso))+'">'+h(wCountdown(iso))+'</span>';
}
function wTick(){
 if(state.page!=='world')return;
 for(const el of document.querySelectorAll('[data-w-until]'))
  el.textContent=wCountdown(el.dataset.wUntil);
 const clock=document.getElementById('wLocalClock');
 if(clock)clock.textContent=new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
}
async function wFetch(explicit=false){
 if(W_DASH.loading)return;
 W_DASH.loading=true;W_DASH.attempted=true;W_DASH.lastAttempt=Date.now();W_DASH.error='';
 if(explicit&&state.page==='world')render();
 const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),16000);
 try{
  const resp=await fetch(W_ENDPOINT,{signal:ctl.signal,cache:'no-store',headers:{Accept:'application/json'}});
  if(!resp.ok)throw Error('WarframeStatus returned HTTP '+resp.status);
  const v=await resp.json();
  if(!v||typeof v!=='object'||Array.isArray(v)||!Array.isArray(v.fissures)||!Array.isArray(v.alerts))
   throw Error('World-state API returned an unexpected format');
  W_DASH.snapshot=v;W_DASH.fetchedAt=new Date().toISOString();
 }catch(err){
  W_DASH.error=err.name==='AbortError'?'WarframeStatus timed out.':'Unable to refresh world-state feed ('+(err.message||'network error')+').';
 }finally{
  clearTimeout(timeout);W_DASH.loading=false;
  if(state.page==='world'||state.page==='planner')render();
 }
}
function wName(v){if(typeof v==='string')return v;if(v&&typeof v==='object')return wStr(v.name||v.title||v.id||'');return wStr(v)}
function wReward(v){
 if(typeof v==='string')return v;
 if(Array.isArray(v))return v.map(wReward).filter(Boolean).join(' · ');
 if(!v||typeof v!=='object')return '';
 const names=[];
 if(v.asString)names.push(v.asString);
 if(v.itemString)names.push(v.itemString);
 for(const x of wItems(v.items))names.push(wName(x));
 for(const x of wItems(v.countedItems))names.push((x.count?x.count+'× ':'')+wName(x.type||x.item||x.name));
 if(v.credits&&names.length===0)names.push(Number(v.credits).toLocaleString()+' credits');
 return [...new Set(names.filter(Boolean))].join(' · ');
}
function wNode(x){return wStr(x?.node||x?.location||x?.planet||'Unknown location')}
function wMissionType(x){return wStr(x?.missionType||x?.type||x?.mission?.type||'Mission type not shown')}
function wExpiry(x){return x?.expiry||x?.endTime||x?.expiryAt||null}
function wActive(list){return wItems(list).filter(x=>!x?.expired&&(!wDate(wExpiry(x))||wDate(wExpiry(x))>Date.now()));}
function wMetaLabel(s){
 const label=wStr(s).trim();
 return label?'<span class="pill">'+h(label)+'</span>':'';
}
function wFilter(list,fields){
 const term=W_DASH.search.trim().toLowerCase();return !term?list:list.filter(x=>fields(x).toLowerCase().includes(term));
}
function wEntry(type,x){
 const node=wNode(x),mission=wMissionType(x),end=wExpiry(x),name=wStr(x?.title||x?.name||x?.mission?.node||'');
 return {id:type+':'+wStr(x?.id||node+'|'+name+'|'+end),type,node,mission,title:name||node,expiry:end};
}
function wPrivate(){return state.profileImported&&state.profile?.progress?.game?state.profile.progress.game:null}
function wPinned(){
 const g=wPrivate();return Array.isArray(g?.sessionCandidates)?g.sessionCandidates:[];
}
function wPinnedKey(type,x){return wEntry(type,x).id}
function wPinButton(type,x){
 const key=wPinnedKey(type,x),pinned=wPinned().some(v=>v.id===key);
 return '<button class="button small '+(pinned?'ghost':'')+'" data-w-pin="'+h(key)+'" data-w-type="'+h(type)+'" data-w-title="'+h(wEntry(type,x).title)+'" data-w-node="'+h(wEntry(type,x).node)+'" data-w-mission="'+h(wEntry(type,x).mission)+'" data-w-expiry="'+h(wEntry(type,x).expiry||'')+'" '+(!state.profileImported?'disabled title="Restore your private profile first"':'')+'>'+(pinned?'✓ Shortlisted':'+ Shortlist')+'</button>';
}
function wHeading(text,desc,action){
 return '<div class="editline"><div><h2>'+h(text)+'</h2>'+(desc?'<p class="muted tiny">'+h(desc)+'</p>':'')+'</div>'+(action||'')+'</div>';
}
function wTable(headers,rows){
 if(!rows.length)return '<p class="muted tiny wEmpty">No matching entries in the latest available feed.</p>';
 return '<div class="tablewrap"><table class="data wTable"><thead><tr>'+headers.map(x=>'<th>'+h(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
}
function wFissures(world){
 let all=wActive(world.fissures);
 const raw=all.length;
 all=all.filter(x=>
  (W_DASH.tier==='All'||wStr(x.tier).toLowerCase()===W_DASH.tier.toLowerCase())&&
  (W_DASH.mode==='All'||W_DASH.mode==='Steel Path'&&!!x.isHard||W_DASH.mode==='Void Storm'&&!!x.isStorm||W_DASH.mode==='Normal'&&!x.isHard&&!x.isStorm));
 all=wFilter(all,x=>[x.tier,x.node,x.missionType,x.enemy,x.planet].join(' '));
 all.sort((a,b)=>(wDate(a.expiry)||Infinity)-(wDate(b.expiry)||Infinity)||wNode(a).localeCompare(wNode(b)));
 const controls='<div class="wFilters"><select class="select" id="wTier">'+W_TIERS.map(x=>'<option '+(x===W_DASH.tier?'selected':'')+'>'+x+'</option>').join('')+'</select><select class="select" id="wMode">'+['All','Normal','Steel Path','Void Storm'].map(x=>'<option '+(x===W_DASH.mode?'selected':'')+'>'+x+'</option>').join('')+'</select></div>';
 const rows=all.slice(0,100).map(x=>'<tr><td class="name">'+h(wNode(x))+'<small class="muted">'+h(wStr(x.planet))+'</small></td><td>'+h(x.tier||'?')+' '+wMetaLabel(x.isStorm?'Void Storm':x.isHard?'Steel Path':'')+'</td><td>'+h(wMissionType(x))+'</td><td>'+wLeft(x.expiry)+'</td><td>'+wPinButton('fissure',x)+'</td></tr>');
 return '<section class="panel wSection">'+wHeading('Void fissures','Relic opening · active '+raw+' · individual Normal / Steel Path / Void Storm variants',controls)+wTable(['Location','Relic tier','Mission','Time left','Plan'],rows)+(all.length>100?'<p class="muted tiny">First 100 matches shown — filter to narrow.</p>':'')+'</section>';
}
function wAlerts(world){
 const list=wFilter(wActive(world.alerts),x=>[x.mission?.node,x.mission?.type,x.reward?.asString].join(' '));
 const rows=list.map(x=>'<tr><td class="name">'+h(wNode(x.mission||x))+'</td><td>'+h(wMissionType(x.mission||x))+'</td><td>'+h(wReward(x.reward||x.mission?.reward)||'Reward not listed')+'</td><td>'+wLeft(x.expiry)+'</td><td>'+wPinButton('alert',x)+'</td></tr>');
 return '<section class="panel wSection">'+wHeading('Alerts','Time-limited missions and special rewards')+wTable(['Location','Mission','Reward','Time left','Plan'],rows)+'</section>';
}
function wInvasions(world){
 const list=wFilter(wItems(world.invasions).filter(x=>!x.completed),x=>[x.node,x.desc,x.attackingFaction,x.defendingFaction,wReward(x.attackerReward),wReward(x.defenderReward)].join(' '));
 const rows=list.slice(0,75).map(x=>{
  const a=wReward(x.attackerReward),b=wReward(x.defenderReward),factions=[x.attackingFaction,x.defendingFaction].filter(Boolean).join(' vs ');
  return '<tr><td class="name">'+h(wNode(x))+'</td><td>'+h(factions||x.desc||'')+'</td><td>'+h([a,b].filter(Boolean).join(' / ')||'Rewards not listed')+'</td><td>'+h(x.completion?Math.round(Number(x.completion)*100)+'%':'In progress')+'</td><td>'+wPinButton('invasion',x)+'</td></tr>';
 });
 return '<section class="panel wSection">'+wHeading('Invasions','Compare reward sides before joining — completion usually requires multiple missions')+wTable(['Node','Sides','Rewards','Progress','Plan'],rows)+'</section>';
}
function wSyndicates(world){
 const list=wFilter(wItems(world.syndicateMissions),x=>[x.syndicate,...wItems(x.nodes)].join(' '));
 const rows=[];
 for(const x of list.slice(0,40)){
  const missions=wItems(x.nodes);const faction=x.syndicate||'Faction';
  for(const [i,node] of missions.slice(0,10).entries()){
   const v={id:wStr(x.id)+'-'+i,node,missionType:'Syndicate mission',expiry:x.expiry,title:faction};
   rows.push('<tr><td class="name">'+h(faction)+'</td><td>'+h(wName(node))+'</td><td>'+wLeft(x.expiry)+'</td><td>'+wPinButton('syndicate',v)+'</td></tr>');
  }
 }
 return '<section class="panel wSection">'+wHeading('Syndicate missions','Public daily missions. Completing one depends on your faction affiliation and access.')+wTable(['Faction','Location','Refresh','Plan'],rows.slice(0,100))+'</section>';
}
function wNightwave(world){
 const all=wActive(world.nightwave?.activeChallenges);
 const list=wFilter(all,x=>[x.title,x.desc,x.description,x.reputation].join(' '));
 const personal=wPrivate()?.nightwave?.acts||[];
 const rows=list.map((x,i)=>{
  const name=wStr(x.title||x.name||'Unknown Act'),match=personal.find(a=>wStr(a.title).trim().toLowerCase()===name.trim().toLowerCase());
  const description=wStr(x.desc||x.description||'');
  const label=x.isDaily?'Daily':x.isElite?'Elite Weekly':x.isPermanent?'Permanent':'Weekly';
  const status=match?(match.done?'Tracked · completed':match.progress!=null?('Tracked · '+match.progress+(match.target?'/'+match.target:'')):'Tracked · not marked complete'):'Not individually tracked';
  const act={id:wStr(x.id||name)+'|'+i,node:'Nightwave',title:name,missionType:label,expiry:x.expiry||world.nightwave?.expiry};
  return '<tr><td class="name">'+h(name)+'<small class="muted">'+h(description)+'</small></td><td>'+h(label)+'</td><td>'+h(x.reputation!=null?Number(x.reputation).toLocaleString()+' Standing':'—')+'</td><td>'+h(status)+'</td><td>'+wPinButton('nightwave',act)+'</td></tr>';
 });
 return '<section class="panel wSection">'+wHeading('Nightwave Acts','Live public challenges + your manually saved Act progress; no automatic account completion sync')+wTable(['Act','Type','Reward','Your record','Plan'],rows)+'</section>';
}
function wEvents(world){
 const list=wFilter(wActive(world.events),x=>[x.description,x.tooltip,x.mission?.node,x.node].join(' '));
 const rows=list.slice(0,35).map(x=>'<tr><td class="name">'+h(x.description||x.tooltip||x.name||'Event')+'</td><td>'+h(wNode(x.mission||x))+'</td><td>'+wLeft(x.expiry)+'</td><td>'+wPinButton('event',x)+'</td></tr>');
 return '<section class="panel wSection">'+wHeading('Events & operations','Special events shown by the world-state service')+wTable(['Event','Location','Time left','Plan'],rows)+'</section>';
}
function wCycle(label,x,kind){
 if(!x||typeof x!=='object')return '';
 let stateLabel=wStr(x.state);
 if(!stateLabel&&typeof x.isDay==='boolean')stateLabel=x.isDay?'Day':'Night';
 if(!stateLabel&&typeof x.isWarm==='boolean')stateLabel=x.isWarm?'Warm':'Cold';
 if(kind==='cambion')stateLabel=stateLabel||'Fass / Vome cycle';
 if(!stateLabel)stateLabel='Current state unavailable';
 return '<div class="wCycle"><strong>'+h(label)+'</strong><div class="wCycleState">'+h(stateLabel)+'</div><div class="muted tiny">Changes in '+(wExpiry(x)?wLeft(wExpiry(x)):x.timeLeft?h(x.timeLeft)+' (at last refresh)':'No change time published')+'</div></div>';
}
function wCycles(world){
 const cycles=[['Cetus / Plains',world.cetusCycle],['Earth',world.earthCycle],['Orb Vallis',world.vallisCycle],['Cambion Drift',world.cambionCycle,'cambion'],['Zariman',world.zarimanCycle],['Duviri',world.duviriCycle]].map(([name,x,kind])=>wCycle(name,x,kind)).filter(Boolean);
 const t=world.voidTrader;
 if(t&&typeof t==='object'){
  cycles.push('<div class="wCycle"><strong>Baro Ki’Teer</strong><div class="wCycleState">'+h(t.active?'Present at '+wStr(t.location):'Not currently here')+'</div><div class="muted tiny">'+wLeft(wExpiry(t))+'</div></div>');
 }
 return '<section class="panel wSection">'+wHeading('World cycles & trader','Current phase and the next published change time')+(cycles.length?'<div class="wCycles">'+cycles.join('')+'</div>':'<p class="muted tiny">No cycle data received.</p>')+'</section>';
}
function wVariants(title,x,prop,group){
 if(!x||typeof x!=='object')return '';
 const value=x[prop];const entries=wItems(value).length?wItems(value):(value&&typeof value==='object'&&(value.node||value.mission||value.nodes)?wItems(value.nodes).length?wItems(value.nodes):[value]:[]);
 let out='<div class="wDaily"><div class="wDailyHead"><strong>'+h(title)+'</strong><span class="muted tiny">'+wLeft(wExpiry(x))+'</span></div>';
 if(x.boss||x.faction)out+='<p class="muted tiny">'+h([x.boss,x.faction].filter(Boolean).join(' · '))+'</p>';
 if(entries.length)out+='<div class="wDailyRows">'+entries.map((y,i)=>'<div class="wDailyItem"><span>'+h(wStr(y.node||y.mission?.node||y.mission||'Mission '+(i+1)))+'</span><small>'+h(wStr(y.missionType||y.type||y.modifier||''))+'</small>'+wPinButton(group,{id:group+':'+i,node:y.node||y.mission?.node||title,title:title+' '+(i+1),missionType:y.missionType||y.type||'',expiry:x.expiry})+'</div>').join('')+'</div>';
 else if(x.node)out+='<p class="muted tiny">'+h(wNode(x))+' · '+h(wMissionType(x))+'</p>';
 out+='</div>';return out;
}
function wDaily(world){
 const blocks=[
 wVariants('Daily Sortie',world.sortie,'variants','sortie'),
 wVariants('Archon Hunt',world.archonHunt,'missions','archon'),
 wVariants('Steel Path Incursions',world.steelPath,'incursions','incursion'),
 wVariants('Deep Archimedea',world.deepArchimedia||world.deepArchimedea,'missions','archimedea'),
 wVariants('Arbitration',world.arbitration,'variants','arbitration')
 ].filter(Boolean);
 const sp=world.steelPath;
 if(sp?.currentReward)blocks.push('<div class="wDaily"><strong>Steel Path reward rotation</strong><p class="muted tiny">'+h(wReward(sp.currentReward)||wName(sp.currentReward))+'</p><span class="muted tiny">'+wLeft(sp.expiry)+'</span></div>');
 return '<section class="panel wSection">'+wHeading('Daily & weekly missions','Rotations are public; your account’s completion status is not synced')+(blocks.length?'<div class="wDailyGrid">'+blocks.join('')+'</div>':'<p class="muted tiny">No daily or weekly activity data received.</p>')+'</section>';
}
function wShortlist(){
 const candidates=wPinned().filter(x=>!x.expiry||!wDate(x.expiry)||wDate(x.expiry)>Date.now());
 if(!state.profileImported)return '<section class="panel wSection">'+wHeading('Session shortlist')+'<p class="muted tiny">Restore your private profile to shortlist missions. Public timers work without it.</p></section>';
 if(!candidates.length)return '<section class="panel wSection">'+wHeading('Session shortlist','Save any mission above to start building a multi-objective session plan')+'<p class="muted tiny">Nothing shortlisted yet. Select + Shortlist on a fissure, alert, invasion or Syndicate mission.</p></section>';
 const rows=candidates.map(x=>'<tr><td class="name">'+h(x.title||x.node)+'</td><td>'+h(x.type||'')+'</td><td>'+h(x.node||'')+'</td><td>'+wLeft(x.expiry)+'</td><td><button class="button small" data-w-remove="'+h(x.id)+'">Remove</button></td></tr>');
 return '<section class="panel wSection">'+wHeading('Your session shortlist','Saved only in this browser; expired entries disappear from the active list')+wTable(['Target','Source','Node','Expires',''],rows)+'<p class="helptext">Shortlisting is not a recommendation or a guarantee that two mission variants can be combined. The next Recommendations page will compare actual mission eligibility, objective overlaps, resources, Nightwave and mastery priorities.</p></section>';
}
function wPage(){
 if(!W_DASH.attempted){W_DASH.attempted=true;setTimeout(()=>wFetch(),0);}
 const world=W_DASH.snapshot;
 const actions='<button class="button gold" data-w-refresh="1" '+(W_DASH.loading?'disabled':'')+'>↻ '+(W_DASH.loading?'Updating…':'Refresh live feed')+'</button>';
 let s=title('Live Warframe world','PlayStation world-state timers, missions and opportunities in one place',actions);
 s+='<div class="wIntro"><span class="pill">Public world state · PlayStation endpoint</span><span class="muted tiny">Rotations can be shared with PC via the provider.</span><span class="muted tiny">Local time <strong id="wLocalClock">'+h(new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}))+'</strong></span></div>';
 if(W_DASH.error)s+='<div class="notice warn"><strong>Live feed refresh failed.</strong> '+h(W_DASH.error)+(world?' Showing the last successful snapshot, which may be outdated.':' Live times are unavailable.')+' <a href="https://hub.warframestat.us" target="_blank" rel="noopener">Open Warframe Hub ↗</a></div>';
 if(!world)return s+'<section class="panel wSection">'+wHeading(W_DASH.loading||!W_DASH.error?'Connecting to live world state…':'Live world-state feed not available')+'<p class="muted">The board shows live missions only after the public feed responds. Use Refresh to retry, or open Warframe Hub for another view.</p><p class="muted tiny">Source: <a href="https://docs.warframestat.us/" target="_blank" rel="noopener">WarframeStatus API documentation</a></p></section>';
 const last=Date.parse(W_DASH.fetchedAt),ageMin=Math.max(0,Math.floor((Date.now()-last)/60000)),stale=ageMin>=10||!!W_DASH.error;
 s+='<div class="wSnapshot"><span class="pill '+(stale?'gold':'ok')+'">'+(stale?'Check freshness':'Recently fetched')+'</span><span class="muted tiny">Fetched '+h(new Date(last).toLocaleString())+' · '+ageMin+' min ago</span><span class="muted tiny">Provider update '+h(world.timestamp?wFmt(world.timestamp):'not supplied')+'</span></div>';
 s+='<div class="cards wMetrics">'+[
 ['Active fissures',wActive(world.fissures).length,'Relic missions available'],
 ['Alerts',wActive(world.alerts).length,'Time-limited special missions'],
 ['Invasions',wItems(world.invasions).filter(x=>!x.completed).length,'Ongoing faction conflicts'],
 ['Syndicate groups',wItems(world.syndicateMissions).length,'Daily faction mission rotations']].map(([label,value,sub])=>'<div class="metric"><div class="lbl">'+h(label)+'</div><div class="val">'+value+'</div><div class="note">'+h(sub)+'</div></div>').join('')+'</div>';
 s+=wCycles(world);
 s+='<div class="wToolbar"><div class="wNav">'+W_VIEWS.map(([id,label])=>'<button class="button small '+(W_DASH.view===id?'gold':'ghost')+'" data-w-view="'+h(id)+'">'+h(label)+'</button>').join('')+'</div><input class="field" id="wSearch" placeholder="Find node, relic tier, reward or mission" value="'+h(W_DASH.search)+'"></div>';
 if(['all','fissures'].includes(W_DASH.view))s+=wFissures(world);
 if(['all','alerts'].includes(W_DASH.view)){s+=wAlerts(world);s+=wEvents(world);}
 if(['all','invasions'].includes(W_DASH.view))s+=wInvasions(world);
 if(['all','syndicates'].includes(W_DASH.view))s+=wSyndicates(world);
 if(['all','daily'].includes(W_DASH.view))s+=wDaily(world);
 if(['all','nightwave'].includes(W_DASH.view))s+=wNightwave(world);
 s+=wShortlist();
 s+='<section class="panel wSection"><h2>Using live missions for farming</h2><p class="muted tiny">This page shows public rotations, not personal account completions. A fissure, a Syndicate mission and a Steel Path Incursion listed at the same location are <strong>not automatically one combinable mission</strong>. The next Recommendations page will only propose stacking when mission variants, eligibility and objectives are compatible. Rewards, Nightwave Acts, resource tables and enemy spawns also need independent verification.</p><p class="muted tiny">Feed: <a href="https://docs.warframestat.us/" target="_blank" rel="noopener">WarframeStatus</a> · Backup view: <a href="https://hub.warframestat.us" target="_blank" rel="noopener">Warframe Hub</a> · No PlayStation login needed</p></section>';
 return s;
}
NAV.splice(Math.max(0,NAV.findIndex(x=>x[0]==='planner')),0,['world','◷','Live world']);
document.addEventListener('click',event=>{
 const el=event.target.closest('[data-w-refresh],[data-w-view],[data-w-pin],[data-w-remove]');
 if(!el)return;
 if(el.dataset.wRefresh!==undefined){wFetch(true);return;}
 if(el.dataset.wView){W_DASH.view=el.dataset.wView;render();return;}
 if(el.dataset.wRemove!==undefined){
  const g=wPrivate();if(!g)return;
  g.sessionCandidates=(g.sessionCandidates||[]).filter(x=>x.id!==el.dataset.wRemove);
  if(typeof pSave==='function')pSave();else persist();
  render();return;
 }
 if(el.dataset.wPin){
  const g=wPrivate();if(!g)return;
  g.sessionCandidates ||= [];
  const id=el.dataset.wPin;
  if(g.sessionCandidates.some(x=>x.id===id))g.sessionCandidates=g.sessionCandidates.filter(x=>x.id!==id);
  else{
   if(g.sessionCandidates.length>=50){toast('Shortlist limit is 50 entries',true);return;}
   g.sessionCandidates.push({id,type:el.dataset.wType||'',title:el.dataset.wTitle||'',node:el.dataset.wNode||'',mission:el.dataset.wMission||'',expiry:el.dataset.wExpiry||'',addedAt:new Date().toISOString()});
  }
  if(typeof pSave==='function')pSave();else persist();
  render();
 }
});
document.addEventListener('change',event=>{
 const el=event.target;
 if(el.id==='wTier'){W_DASH.tier=el.value;render();}
 if(el.id==='wMode'){W_DASH.mode=el.value;render();}
});
document.addEventListener('input',event=>{
 if(event.target.id!=='wSearch')return;
 const caret=event.target.selectionStart;W_DASH.search=event.target.value;render();
 const fresh=document.getElementById('wSearch');if(fresh){fresh.focus();try{fresh.setSelectionRange(caret,caret)}catch(_e){}}
});
if(typeof window!=='undefined'){window.setInterval(()=>{wTick();if(state.page==='world'&&!W_DASH.loading&&(!W_DASH.lastAttempt||Date.now()-W_DASH.lastAttempt>=5*60000))wFetch();},30000);if(window.location.hash==='#world')go('world');}
const W_STYLES=document.createElement('style');
W_STYLES.textContent='.mobileNav{overflow-x:auto;justify-content:flex-start;-webkit-overflow-scrolling:touch}.mobileNav button{min-width:60px;flex:0 0 60px}.wSection{margin-top:18px}.wIntro,.wSnapshot{display:flex;flex-wrap:wrap;align-items:center;gap:9px 15px;margin:10px 0 15px}.wMetrics{grid-template-columns:repeat(4,minmax(0,1fr));margin:12px 0}.wCycle{background:var(--raised);border:1px solid var(--line);border-radius:9px;padding:12px;min-width:0}.wCycles{margin:14px 0 4px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.wCycle strong{font-size:12px}.wCycleState{font-size:16px;font-weight:700;margin:7px 0}.wClock{white-space:nowrap;color:var(--gold);font-weight:700}.wToolbar{margin:20px 0 10px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;justify-content:space-between}.wNav,.wFilters{display:flex;align-items:center;flex-wrap:wrap;gap:6px}.wToolbar .field{flex:1;min-width:195px;max-width:330px}.wTable td{font-size:12px}.wTable .button{white-space:nowrap}.wTable td small{display:block;font-size:11px}.wDailyGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}.wDaily{background:var(--raised);border:1px solid var(--line);padding:12px;border-radius:9px}.wDailyHead{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}.wDailyRows{margin-top:7px}.wDailyItem{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line);font-size:12px}.wDailyItem:last-child{border-bottom:0}.wDailyItem span{flex:1;min-width:0}.wDailyItem small{color:var(--muted)}.wEmpty{margin:14px 0}.wSection h2{margin:0}@media(max-width:900px){.wMetrics{grid-template-columns:repeat(2,minmax(0,1fr))}.wCycles{grid-template-columns:repeat(2,minmax(0,1fr))}.wDailyGrid{grid-template-columns:1fr}}@media(max-width:600px){.wCycles{grid-template-columns:1fr 1fr}.wToolbar{align-items:stretch}.wToolbar .field{max-width:none}.wDailyItem{flex-wrap:wrap}.wDailyItem .button{margin-left:auto}}';
document.head.append(W_STYLES);
if(state.page==='overview')render();

/* Goal-driven session planner: local preferences, existing personal data, live feed. */
(function installGoalPlanner(){
 const goals=[['general','General priorities'],['helminth','Rank up Helminth'],['railjack','Progress Railjack'],['prime','Farm Prime parts'],['mastery','Gain mastery XP'],['mods','Farm mods / Arcanes'],['drifter','Progress Drifter Intrinsics']];
 const ui={goal:'general',mode:'Normal',tier:'All',prime:'',rail:'Unlock regions / nodes'};
 try{const saved=JSON.parse(localStorage.getItem('tenno-session-goal-v1')||'{}');for(const k of Object.keys(ui))if(typeof saved[k]==='string')ui[k]=saved[k];}catch(e){}
 if(!goals.some(x=>x[0]===ui.goal))ui.goal='general';
 const known=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x));
 const esc=x=>h(String(x??''));
 const select=(id,label,options,value)=>'<label>'+esc(label)+'<select class="select" id="'+id+'">'+options.map(o=>{const a=Array.isArray(o)?o:[o,o];return '<option value="'+esc(a[0])+'" '+(a[0]===value?'selected':'')+'>'+esc(a[1])+'</option>';}).join('')+'</select></label>';
 const step=(name,detail,extra='')=>({name,detail,extra});
 const source=(url,label)=>'<a href="'+url+'" target="_blank" rel="noopener">'+esc(label)+'</a>';
 const edit=r=>button('Review','edit-equipment','data-key="'+enc(ek(r.category,r.name))+'"','small');
 const openProgress=tab=>'<button class="button small" data-goal-progress="'+tab+'">Review progress</button>';
 const gear=()=>mergeEquip().filter(r=>r&&r.name);
 function readyFrames(){
  const ledger=new Map(pHelminthLedger().map(x=>[x.frame,x.status]));
  return gear().filter(r=>r.category==='Warframes'&&ledger.get(r.name)==='not-subsummed'&&ownedEquip(r)&&masteredEquip(r));
 }
 function railGate(g){
  const values=P_INTR.Railjack.map(n=>g.intrinsics.Railjack[n]);
  return {max:Math.max(0,...values.filter(known).map(Number)),complete:values.every(known),values};
 }
 function liveRows(storm,tiers,gate,g){
  if(!W_DASH.snapshot)return [];
  return wActive(W_DASH.snapshot.fissures).filter(x=>!!x.isStorm===storm&&(!tiers||tiers.includes(String(x.tier).toLowerCase()))&& (storm|| (ui.mode==='Steel Path'?!!x.isHard:!x.isHard))).map(x=>{
   const mission=wMissionType(x),node=wNode(x),planet=String(x.planet||node),expires=wDate(wExpiry(x)),remaining=expires?(expires-Date.now())/60000:null;
   const region=/veil/i.test(planet)?7:/pluto/i.test(planet)?5:/saturn|neptune/i.test(planet)?3:0;
   let score=storm?(/skirmish|exterminate/i.test(mission)?80:50):(/capture/i.test(mission)?100:/exterminate/i.test(mission)?85:/rescue/i.test(mission)?65:45);
   if(remaining!==null&&remaining<8)score-=35;
   if(storm&&gate&&region>gate.max)score-=gate.complete?100:30;
   const access=storm&&gate&&region>gate.max?(gate.complete?' · intrinsic gate not met':' · check intrinsic gate'):'';
   return {x,score,remaining,access,blocked:storm&&gate&&gate.complete&&region>gate.max};
  }).filter(r=>!r.blocked).sort((a,b)=>b.score-a.score||(b.remaining??0)-(a.remaining??0));
 }
 function liveSteps(rows,label){
  return rows.slice(0,5).map(({x,access,remaining})=>step(wNode(x)+' — '+wMissionType(x),String(x.tier||'')+' · '+label+(remaining===null?' · expiry unknown':' · '+wCountdown(wExpiry(x)))+access,wPinButton('fissure',x)));
 }
 function primeTargets(){
  return gear().filter(r=>/\bPrime\b/i.test(r.name)&&!ownedEquip(r)&&!masteredEquip(r)).map(r=>{
   const p=personalEquipment(r)||{},parts=(r.components||[]).filter(c=>c?.name&&!/orokin cell/i.test(c.name));
   const ownedPart=c=>Object.entries(p.parts||{}).some(([k,v])=>v&&[c.name,r.name+' '+c.name].some(n=>n.toLowerCase()===k.toLowerCase()))||(/^(blueprint|.* prime blueprint)$/i.test(c.name)&&p.blueprint);
   const missing=parts.filter(c=>!ownedPart(c));
   const held=parts.length-missing.length;
   return {r,p,parts,missing,held,score:(p.farm?1000:0)+(parts.length?held/parts.length*100:0)};
  }).sort((a,b)=>b.score-a.score||a.r.name.localeCompare(b.r.name));
 }
 function primeRelics(target){
  const matches=[];
  for(const c of target?.missing||[]){
   for(const d of c.drops||[]){
    const name=String(d.location||d.name||'');
    const m=name.match(/\b(Lith|Meso|Neo|Axi)\s+([A-Z]\d+)\b/i);
    if(m)matches.push({part:c.name,relic:m[0],tier:m[1].toLowerCase(),rarity:String(d.rarity||''),chance:known(d.chance)?Number(d.chance):null});
   }
  }
  return [...new Map(matches.map(x=>[x.part+'|'+x.relic,x])).values()];
 }
 function renderGoal(){
  const g=pModel(),steps=[],info=[];
  let controls=select('goalMode','Session goal',goals,ui.goal);
  if(ui.goal==='helminth'){
   const a=g.helminth,ready=readyFrames();
   info.push('Metamorphosis: '+(known(a.metamorphosis)?a.metamorphosis:'unknown')+(known(a.progress)&&known(a.nextThreshold)?' · '+Math.max(0,a.nextThreshold-a.progress).toLocaleString()+' XP to next reward':' · next-rank XP unknown'));
   if(!known(a.metamorphosis))steps.push(step('Confirm Helminth access and rank','Check the console and record the current rank and XP. If locked, obtain the Helminth Segment first.',openProgress('helminth')));
   if(ready.length){steps.push(step('Subsuming: start with a mastered, owned base Warframe','Only sacrifice a spare or replaceable copy you are willing to lose permanently. Check the current subsume slot, time and secretions. Subsuming also unlocks an ability.'));for(const r of ready.slice(0,5))steps.push(step(r.name,'Recorded mastered, owned and not subsumed. Confirm it is safe to sacrifice.',edit(r)));}
   else steps.push(step('Check base Warframes for a safe subsume','No confirmed mastered + owned + not-subsumed candidates in the saved profile. Do not sacrifice an unmastered frame or infer an unknown subsume status.',openProgress('helminth')));
   steps.push(step('Feed efficiently, then infuse and remove a low-cost ability','Use abundant resources with high appetite; avoid feeding a full secretion. Repeat infusion/removal only while you have spare resources. Compare costs in the console rather than consuming scarce materials.'));
   steps.push(step('Prepare the next base Warframe','Build or farm a non-Prime frame not yet subsumed; master it first if you still need mastery. Start its subsume when the slot is free.'));
   info.push('Secretion inventory, appetite and exact infusion costs are not tracked. '+source('https://wiki.warframe.com/w/Helminth','Mechanics reference'));
  }else if(ui.goal==='railjack'){
   controls+=select('goalRail','Railjack focus',['Unlock regions / nodes','Earn Intrinsics','Open relics too'],ui.rail);
   const gate=railGate(g),nodes=pChartNodes(g,'railjack'),unfinished=nodes.filter(n=>['incomplete','available','in-progress','not-completed'].includes(g.nodes.normal[n.id]));
   const missing=P_INTR.Railjack.filter(n=>!known(g.intrinsics.Railjack[n]));
   info.push('Highest recorded Intrinsic: '+(gate.values.some(known)?gate.max:'unknown')+' · '+(missing.length?missing.length+' tracks unknown':'all tracks recorded')+' · '+nodes.filter(n=>g.nodes.normal[n.id]==='completed').length+' / '+nodes.length+' catalogue nodes marked complete');
   if(missing.length)steps.push(step('Confirm your Railjack ranks and access','Missing tracks: '+missing.join(', ')+'. Unknown is not zero. Check your Railjack loadout and unlocked Proxima regions.',openProgress('intrinsics')));
   const next=[3,5,7].find(n=>n>gate.max);
   if(ui.rail==='Unlock regions / nodes'&&next&&gate.complete){const top=P_INTR.Railjack.filter(n=>Number(g.intrinsics.Railjack[n])===gate.max);steps.push(step('Reach Intrinsic rank '+next,'Advance an existing high-ranked track ('+top.join(' / ')+') towards the next region gate. Check quest and node prerequisites in Navigation; newer regions may have different requirements.'));}
   if(ui.rail==='Unlock regions / nodes'&&unfinished.length)for(const n of unfinished.slice(0,5))steps.push(step(n.name+' · '+n.planet,'Recorded not complete; choose only if accessible from your current chart.',openProgress('star')));
   const farm=step('Luckless Expanse — Venus Proxima Survival','A repeatable Intrinsics farm when accessible. Equip a suitable Warframe and Railjack crew; use an affinity booster if available. Leave when efficiency drops.');
   const live=liveSteps(liveRows(true,null,gate,g),'Void Storm · Intrinsics + relic opening');
   if(ui.rail==='Open relics too')steps.push(...live,farm);else steps.push(farm,...live);
   if(!live.length)steps.push(step('Check Void Storms','No accessible matching Storms confirmed in the loaded feed. Refresh; a Storm can combine Railjack progress with relic opening when you meet its requirements.'));
   info.push('Live Storms use published mission variants; access, equipment and node connections must be checked in-game. '+source('https://wiki.warframe.com/w/Railjack/Intrinsics','Intrinsics reference'));
  }else if(ui.goal==='prime'){
   const targets=primeTargets(),target=targets.find(t=>t.r.name===ui.prime);
   const top=targets.slice(0,150);if(target&&!top.includes(target))top.push(target);
   controls+=select('goalPrime','Prime target',[['','Any Prime / general farming'],...top.map(t=>[t.r.name,t.r.name+(t.parts.length?' ('+t.held+'/'+t.parts.length+' recorded)':'')])],ui.prime);
   controls+=select('goalTier','Relic tier',W_TIERS,ui.tier)+select('goalVariant','Mission variant',['Normal','Steel Path'],ui.mode);
   const relics=primeRelics(target),tiers=ui.tier==='All'?(target&&relics.length?[...new Set(relics.map(x=>x.tier))]:null):[ui.tier.toLowerCase()];
   if(target){
    steps.push(step(target.r.name,target.parts.length?'Parts not confirmed owned: '+(target.missing.map(c=>c.name).join(', ')||'none in catalogue; verify build requirements'):'No component data in catalogue; check Equipment or relic station.',edit(target.r)));
    if(relics.length)for(const x of relics.slice(0,12))steps.push(step(x.part+' — '+x.relic,'Catalogue drop reference'+(x.rarity?' · '+x.rarity:'')+'. Confirm relic ownership and refinement; availability/vaulting not inferred.'));
    else steps.push(step('Identify the exact relic in the in-game relic station','Search for the missing component. The current catalogue does not provide a verified relic mapping for this target.'));
   }else if(targets.length)for(const t of targets.filter(t=>t.held||t.p.farm).slice(0,4))steps.push(step('Near-term target: '+t.r.name,t.parts.length?t.held+' of '+t.parts.length+' catalogue components recorded; '+t.missing.map(c=>c.name).join(', ')+' not confirmed held.':'Pinned or partial item; review requirements.',edit(t.r)));
   const rows=liveRows(false,tiers,null,g).filter(r=>!['requiem','omnia'].includes(String(r.x.tier).toLowerCase())||ui.tier==='Omnia');
   if(rows.length)steps.push(...liveSteps(rows,'Fissure · '+ui.mode+' · check relic'));
   else steps.push(step('No matching fissure confirmed','Refresh live missions or change relic tier / variant. Do not run an unrelated tier for a specific relic.'));
   steps.push(step('Refine for the intended reward','For a rare target, use Radiant relics and preferably a matching four-player radshare. For a common target, intact relics are generally better. Collect ten Reactant before extraction.'));
   info.push('Relic quantities, Void Traces, squad availability and real completion times are not tracked. Capture / Exterminate are ranked as short-run candidates, not measured fastest routes. '+source('https://wiki.warframe.com/w/Void_Relic','Relic reference'));
  }else if(ui.goal==='mastery'){
   const ready=gear().filter(r=>ownedEquip(r)&&!masteredEquip(r)).map(r=>({r,rank:typeof mRankInfo==='function'?mRankInfo(r):{cap:30,rate:100}})).sort((a,b)=>b.rank.rate-a.rank.rate||a.r.name.localeCompare(b.r.name));
   info.push(ready.length+' owned, unmastered items recorded. XP remaining per item is not assumed from ownership.');
   for(const {r,rank} of ready.slice(0,8))steps.push(step(r.name,'Level for mastery · '+rank.rate+' XP per first-time rank (up to applicable cap).',edit(r)));
   steps.push(step('Combine equipment XP with your chosen farm','Bring unmastered gear only if it will not compromise your mission. Public affinity farming, e.g. Sanctuary Onslaught for appropriate gear, is an alternative.'));
   steps.push(step('Check unfinished Intrinsics','Each newly earned Intrinsic rank gives mastery XP; review your Railjack and Drifter ranks.',openProgress('intrinsics')));
  }else if(ui.goal==='mods'){
   const tasks=tasksData().filter(t=>t.id?.startsWith('mod:')||t.id?.startsWith('arc:'));
   for(const t of tasks.slice(0,12))steps.push(step(t.name,t.detail+' · check the drop source and rotation before farming.',button('Open','open-task','data-key="'+enc(t.id)+'"','small')));
   if(!tasks.length)steps.push(step('Pin the missing mods or Arcanes you want','Mark a farming target in your collection; it will appear here on your next visit.'));
   info.push('Drop probabilities and overlapping reward tables are not yet scored.');
  }else if(ui.goal==='drifter'){
   const ranks=g.intrinsics.Drifter;info.push(P_INTR.Drifter.map(n=>n+': '+(known(ranks[n])?ranks[n]:'unknown')).join(' · '));
   steps.push(step('Review your Drifter ranks and unspent points','Spend earned points on the unlocks you need. Unknown ranks are not counted as missing.',openProgress('intrinsics')));
   steps.push(step('Run Duviri Experience','Complete objectives and efficient nearby side activities for Intrinsics and decrees; progress the story and leave at a safe save point.'));
   steps.push(step('Choose Circuit if you also need its weekly rewards','Check the available reward path and eligibility first; do not assume it shares every Duviri objective.'));
  }else{
   steps.push(step('Pick a session goal','Choose a system above to get an ordered route instead of the general task backlog.'));
   steps.push(step('Level owned gear or finish a partially built item','Your existing personal priorities below are retained.'));
  }
  const liveNeeded=['prime','railjack'].includes(ui.goal);
  if(liveNeeded&&!W_DASH.attempted&&!W_DASH.loading)Promise.resolve().then(()=>{if(state.page==='planner')wFetch();});
  const fresh=liveNeeded?'<div class="editline"><span class="muted tiny">'+esc(W_DASH.loading?'Refreshing live world…':W_DASH.error|| (W_DASH.fetchedAt?'Live snapshot: '+new Date(W_DASH.fetchedAt).toLocaleString():'Live feed not yet loaded'))+'</span><button class="button small" data-goal-refresh>Refresh live missions</button></div>':'';
  return '<section class="panel" style="margin:12px 0"><h2>Goal-driven recommendations</h2><p class="muted tiny">Choose what you want to achieve this session. Routes use your saved progress and available mission data; verify unrecorded prerequisites in-game.</p><div class="formgrid">'+controls+'</div>'+fresh+(!state.profileImported?'<p class="notice">Import your private profile for personalised progress. Recommendations are provisional.</p>':'')+info.map(x=>'<p class="helptext">'+x+'</p>').join('')+'<h3>Recommended route (in priority order)</h3>'+steps.map((x,i)=>'<div class="task" style="align-items:flex-start"><span class="pill '+(i===0?'gold':'')+'">'+(i+1)+'</span><div style="flex:1;min-width:0"><div class="taskname">'+esc(x.name)+'</div><div class="tasksublabel" style="white-space:normal">'+esc(x.detail)+'</div></div>'+x.extra+'</div>').join('')+'</section>';
 }
 const original=plannerPage;
 plannerPage=function(){const base=original();const marker='<div class="cards">';const i=base.indexOf(marker);return i>=0?base.slice(0,i)+renderGoal()+base.slice(i):renderGoal()+base;};
 document.addEventListener('change',e=>{const k={goalMode:'goal',goalTier:'tier',goalVariant:'mode',goalPrime:'prime',goalRail:'rail'}[e.target.id];if(!k)return;ui[k]=e.target.value;try{localStorage.setItem('tenno-session-goal-v1',JSON.stringify(ui));}catch(err){}render();});
 document.addEventListener('click',e=>{const el=e.target.closest('[data-goal-progress],[data-goal-refresh]');if(!el)return;if(el.hasAttribute('data-goal-refresh')){wFetch(true);render();return;}P_UI.tab=el.dataset.goalProgress;if(P_UI.tab==='star')P_UI.chart='railjack';go('progress');});
})();
