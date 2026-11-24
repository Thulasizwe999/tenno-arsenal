'use strict';
/* Tenno Arsenal progression command centre.
 * Public UI/reference code only. All player records remain in the browser's private profile.
 * Never infer completion from an unknown or historical planet/gear checkmark.
 */
const D_AREAS=[
 {id:'equipment',title:'Equipment & mastery',icon:'⌖',where:'Arsenal · Foundry · Codex equipment',page:'equipment'},
 {id:'mods',title:'Mod collection',icon:'▦',where:'Orbiter Mods console · Companion app',page:'mods'},
 {id:'quests',title:'Story & quests',icon:'✦',where:'Codex → Quests',tab:'quests'},
 {id:'star',title:'Star chart',icon:'◎',where:'Navigation → Star Chart · Steel Path toggle',tab:'star'},
 {id:'focus',title:'Focus schools',icon:'◇',where:'Operator → Focus trees',tab:'focus'},
 {id:'shards',title:'Archon Shards',icon:'◈',where:'Helminth console → Archon Shards',tab:'shards'},
 {id:'intrinsics',title:'Intrinsics',icon:'✧',where:'Railjack Intrinsics · Duviri Drifter Intrinsics',tab:'intrinsics'},
 {id:'syndicates',title:'Syndicates',icon:'♜',where:'Orbiter Syndicate console · faction hub vendors',tab:'syndicates'},
 {id:'activities',title:'Game modes',icon:'⚔',where:'Navigation · weekly activity screens · hubs',tab:'activities'},
 {id:'milestones',title:'System unlocks',icon:'⚙',where:'Codex, Navigation and relevant Orbiter consoles',tab:'milestones'},
 {id:'hex',title:'KIM & GIM relationships',icon:'☷',where:'Höllvania KIM and Devil’s Triad GIM',tab:'hex'},
 {id:'arcanes',title:'Arcanes & Rivens',icon:'✥',where:'Arsenal / hub vendors · Mods → Rivens',page:'arcanes'}
];
const D_DAILY=['Sortie','Steel Path Incursions'];
const D_WEEKLY=['Archon Hunt','Netracells','Deep Archimedea','Temporal Archimedea','Normal Circuit','Steel Path Circuit','Kahl weekly mission','Höllvania 1999 Calendar','Descendia'];
const D_UI={showAll:false,weeklyAll:false,priorityAll:false,quickFilter:'All',reference:'syndicates'};
function dModel(){
 const g=sModel();
 g.dashboard ||= {};
 g.dashboard.reviewed ||= {};
 return g;
}
function dRecorded(v){return v!==undefined&&v!==null&&v!==''&&v!=='unknown';}
function dDate(v){
 if(!v)return 'Not checked';
 const t=new Date(v);
 if(!Number.isFinite(t.getTime()))return 'Not checked';
 return t.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
}
function dAge(v){
 if(!v)return null;
 const t=new Date(v).getTime();
 if(!Number.isFinite(t))return null;
 return Math.max(0,Math.floor((Date.now()-t)/86400000));
}
function dAgeText(v){
 const a=dAge(v);
 return a===null?'Not checked in-game':a===0?'Checked today':a===1?'Checked yesterday':'Checked '+a+' days ago';
}
function dRowStats(g){
 const profile=state.profile,gear=mergeEquip(),ownedGear=gear.filter(r=>ownedEquip(r)),mastered=gear.filter(r=>masteredEquip(r));
 const modList=allMods(),ownedMods=modList.filter(m=>modQty(m)>0),copies=modList.reduce((s,m)=>s+modQty(m),0);
 const qNames=[...new Set([...P_QUESTS.map(q=>q[0]),...(g.extraQuests||[]).map(x=>x.name)])],
 questsDone=qNames.filter(q=>g.quests[q]==='completed').length,questsKnown=qNames.filter(q=>dRecorded(g.quests[q])).length;
 const allNodes=new Set([...P_UI.nodes.map(n=>n.id),...g.nodes.custom.map(n=>n.id)]);
 const normal=Object.values(g.nodes.normal),steel=Object.values(g.nodes.steel);
 const normalDone=normal.filter(x=>x==='completed').length,steelDone=steel.filter(x=>x==='completed').length;
 const nodeKnown=normal.filter(dRecorded).length+steel.filter(dRecorded).length;
 const focusTotal=P_SCHOOLS.reduce((n,sc)=>n+(new Set([...(P_FOCUS[sc]||[]),...(g.focus[sc]?.custom||[])])).size,0);
 const focusSet=P_SCHOOLS.reduce((n,sc)=>n+Object.values(g.focus[sc]?.nodes||{}).filter(x=>x&&x.rank!==null&&x.rank!==undefined).length,0);
 const focusSchools=P_SCHOOLS.filter(sc=>g.focus[sc]?.unlocked!==null&&g.focus[sc]?.unlocked!==undefined).length;
 const spareCount=Object.values(g.shards.spare||{}).reduce((n,x)=>n+number(x),0);
 const spareRecorded=Object.values(g.shards.spare||{}).filter(dRecorded).length;
 const installations=g.shards.installed?.length||0;
 const intrNames=Object.entries(P_INTR).flatMap(([typ,names])=>names.map(name=>g.intrinsics[typ]?.[name]));
 const intrKnown=intrNames.filter(dRecorded).length;
 const syNames=[...new Set([...S_SYNDICATES.map(x=>x[0]),...(g.syndicates.custom||[])])];
 const syKnown=syNames.filter(name=>{const x=g.syndicates.members[name];return x&&(dRecorded(x.rank)||dRecorded(x.standing));}).length;
 const syMax=syNames.length;
 const acts=[...S_ACTIVITIES,...g.activities.custom.map(x=>[x.name,x.group,x.cadence,x.description])];
 const actKnown=acts.filter(x=>dRecorded(g.activities.entries[x[0]]?.status)).length;
 const actDone=acts.filter(x=>g.activities.entries[x[0]]?.status==='completed').length;
 const actOpen=acts.filter(x=>['available','in-progress'].includes(g.activities.entries[x[0]]?.status)).length;
 const milestoneNames=[...P_MILESTONES,...(g.extraMilestones||[])],milestoneKnown=milestoneNames.filter(x=>dRecorded(g.milestones[x])).length;
 const hexNames=[...new Set([...S_CORE_HEX,...S_GIM,...Object.keys(g.hexChemistry||{})])],hexKnown=hexNames.filter(name=>dRecorded(g.hexChemistry[name]?.chemistry)).length;
 const personalArc=(profile.arcanes||[]).length,personalRivens=(profile.rivens||[]).length;
 return {
  gear:gear.length,ownedGear:ownedGear.length,mastered:mastered.length,readyLevel:ownedGear.filter(r=>!masteredEquip(r)).length,
  mods:modList.length,ownedMods:ownedMods.length,copies,
  questsDone,questsKnown,questsTotal:qNames.length,
  normalDone,steelDone,nodeKnown,nodePossible:allNodes.size*2,nodeCatalogLoaded:allNodes.size>0,
  focusSet,focusTotal,focusSchools,spareCount,spareRecorded,installations,
  intrKnown,intrTotal:intrNames.length,syKnown,syMax,
  actKnown,actTotal:acts.length,actDone,actOpen,
  milestoneKnown,milestoneTotal:milestoneNames.length,hexKnown,hexTotal:hexNames.length,
  personalArc,personalRivens
 };
}
function dAreaInfo(id,c){
 const map={
 equipment:{main:c.mastered+' / '+c.gear+' mastered',sub:c.ownedGear+' owned · '+c.readyLevel+' ready to level',known:c.gear>0},
 mods:{main:c.ownedMods+' / '+c.mods+' owned',sub:c.copies+' copies at recorded ranks',known:c.mods>0},
 quests:{main:c.questsDone+' / '+c.questsTotal+' confirmed complete',sub:(c.questsTotal-c.questsKnown)+' quests not reviewed',known:c.questsKnown>0},
 star:{main:(c.nodeKnown?c.normalDone+' Normal · '+c.steelDone+' Steel Path':'No individual nodes checked'),sub:c.nodeKnown+' explicit node statuses'+(c.nodeCatalogLoaded?' · '+c.nodePossible+' possible statuses':' · node catalogue pending'),known:c.nodeKnown>0},
 focus:{main:c.focusSet+' / '+c.focusTotal+' ability ranks recorded',sub:c.focusSchools+' / 5 school unlock states checked',known:c.focusSet>0||c.focusSchools>0},
 shards:{main:c.spareRecorded?c.spareCount+' spare · '+c.installations+' installed':c.installations?c.installations+' installations recorded':'Shard inventory not recorded',sub:c.spareRecorded+' / 12 spare-count fields checked',known:c.spareRecorded>0||c.installations>0},
 intrinsics:{main:c.intrKnown+' / '+c.intrTotal+' tracks recorded',sub:'Railjack 5 · Drifter 4',known:c.intrKnown>0},
 syndicates:{main:c.syKnown+' / '+c.syMax+' factions recorded',sub:'Ranks · standing · next target',known:c.syKnown>0},
 activities:{main:c.actKnown+' / '+c.actTotal+' statuses recorded',sub:c.actOpen+' actionable · '+c.actDone+' last marked complete',known:c.actKnown>0},
 milestones:{main:c.milestoneKnown+' / '+c.milestoneTotal+' unlocks checked',sub:'System access is recorded manually',known:c.milestoneKnown>0},
 hex:{main:c.hexKnown+' / '+c.hexTotal+' relationships checked',sub:'Hex KIM · Devil’s Triad GIM',known:c.hexKnown>0},
 arcanes:{main:c.personalArc+' Arcane records',sub:c.personalRivens+' Riven records',known:c.personalArc>0||c.personalRivens>0}
 };
 return map[id]||{main:'Not recorded',sub:'',known:false};
}
function dJumpButton(area,buttonText='Open details'){
 const data=area.tab?'data-d-tab="'+h(area.tab)+'"':'data-d-page="'+h(area.page)+'"';
 return '<button class="button small" '+data+'>'+h(buttonText)+' →</button>';
}
function dAreas(g,c){
 const list=D_UI.showAll?D_AREAS:D_AREAS.slice(0,9);
 let out='<section class="panel dSection"><div class="editline"><div><h2>Progression reference</h2><p class="muted tiny">One place to remember where to check each system in-game. Review dates are personal confirmations, not game syncs.</p></div></div><div class="dAreas">';
 for(const a of list){
  const x=dAreaInfo(a.id,c),checked=g.dashboard.reviewed[a.id];
  out+='<article class="dArea"><div class="dAreaTop"><span class="dAreaIcon">'+h(a.icon)+'</span><div class="dAreaName">'+h(a.title)+'</div>'+(x.known?'<span class="pill ok">Has records</span>':'<span class="pill">Unknown</span>')+'</div>';
  out+='<div class="dMain">'+h(x.main)+'</div><div class="muted tiny">'+h(x.sub)+'</div>';
  out+='<div class="dWhere"><span class="muted tiny">WHERE IN-GAME</span><div>'+h(a.where)+'</div></div>';
  out+='<div class="dAreaFoot"><span class="muted tiny">'+h(dAgeText(checked))+'</span><div class="dAreaControls"><button class="button small ghost" data-d-reviewed="'+h(a.id)+'" title="Confirm that you looked at this in Warframe. Does not mark anything complete.">Mark checked</button>'+dJumpButton(a,'View')+'</div></div></article>';
 }
 out+='</div><div class="dShow"><button class="button small" data-d-expand="areas">'+(D_UI.showAll?'Show key areas':'Show all '+D_AREAS.length+' areas')+'</button></div></section>';
 return out;
}
function dWeekly(g){
 const activities=g.activities.entries;
 const names=[...D_DAILY,...D_WEEKLY];
 let items=names.map(name=>{
  const x=activities[name]||{},age=dAge(x.reviewed),daily=D_DAILY.includes(name),stale=age===null||age>=(daily?1:7);
  return {name,x,daily,stale,age};
 });
 if(!D_UI.weeklyAll)items=items.slice(0,7);
 let s='<section class="panel dSection"><div class="editline"><div><h2>Daily & weekly pulse</h2><p class="muted tiny">A reminder to verify the current rotation, not an automatically synchronised Warframe timer.</p></div>'+dJumpButton({tab:'activities'},'All modes')+'</div>';
 s+='<div class="dList">';
 for(const v of items){const status=v.x.status&&v.x.status!=='unknown'?v.x.status.replaceAll('-',' '):'Not recorded';
 s+='<div class="dListRow"><div class="dListBody"><strong>'+h(v.name)+'</strong><div class="muted tiny">'+(v.daily?'Daily':'Weekly')+' · '+h(status)+' · '+h(dAgeText(v.x.reviewed))+'</div></div>';
 s+='<span class="pill '+(v.stale?'gold':'ok')+'">'+(v.stale?'Check again':'Recently checked')+'</span></div>';
 }
 s+='</div><p class="helptext">A previously completed weekly entry remains a historical snapshot; it is not automatically counted as this week’s completion. Netracells and both Archimedea types share Search Pulses.</p>';
 s+='<button class="button small" data-d-expand="weekly">'+(D_UI.weeklyAll?'Show fewer':'Show all daily / weekly')+'</button></section>';return s;
}
function dPriorities(g){
 const all=tasksData(), tasks=all.filter(x=>x&&x.name&&typeof x.name==='string');
 const seen=new Set(),unique=tasks.filter(x=>{const key=x.id||x.name;if(seen.has(key))return false;seen.add(key);return true;});
 const list=D_UI.priorityAll?unique.slice(0,40):unique.slice(0,8);
 let s='<section class="panel dSection"><div class="editline"><div><h2>Next useful actions</h2><p class="muted tiny">Generated from recorded mastery, crafting, farming and progress targets — not guesses about what your account has unlocked.</p></div>'+dJumpButton({page:'planner'},'Full planner')+'</div>';
 if(!list.length)return s+empty('No next actions recorded','Mark an in-progress quest, available activity, farming goal or owned unmastered item.')+'</section>';
 s+='<div class="dList">';
 for(const task of list){
  let area=task.id?.startsWith('quest:')?'quests':task.id?.startsWith('story-node:')?'star':task.id?.startsWith('activity:')?'activities':task.id?.startsWith('syndicate:')?'syndicates':task.id?.startsWith('story-unlock:')?'milestones':task.id?.startsWith('mod:')?'mods':task.id?.startsWith('arc:')?'arcanes':'equipment';
  const ref=D_AREAS.find(a=>a.id===area)||D_AREAS[0];
  s+='<div class="dListRow"><div class="dListBody"><strong>'+h(task.name)+'</strong><div class="muted tiny">'+h(task.action||'Track objective')+' · '+h(task.group||'Other')+(task.detail?' · '+h(task.detail):'')+'</div></div>'+dJumpButton(ref,'Review')+'</div>';
 }
 s+='</div><div class="dShow"><button class="button small" data-d-expand="priority">'+(D_UI.priorityAll?'Show top eight':'Show more actions')+'</button></div></section>';return s;
}
function dAuditRoute(g){
 const rows=[
  ['1','Orbiter','Codex quests → Arsenal/Foundry → Mods console → Operator Focus → Helminth shards → Syndicate console',['quests','equipment','mods','focus','shards','syndicates']],
  ['2','Navigation','Review Normal/Steel Path nodes and rotating Sorties, Hunts, Incursions, Circuit and weekly activities',['star','activities']],
  ['3','Hubs & vendors','Cetus · Fortuna · Necralisk · Chrysalith · Sanctum Anatomica · Höllvania; check Standing, rewards and KIM/GIM',['syndicates','hex']],
  ['4','Specialised systems','Railjack/Drifter Intrinsics · Arcane and Riven collections · long-term unlocks',['intrinsics','arcanes','milestones']]
 ];
 let s='<section class="panel dSection"><div class="editline"><div><h2>Efficient in-game check route</h2><p class="muted tiny">Suggested order to minimise revisiting menus and vendors when updating the snapshot. Use the app between checks to see the last saved numbers.</p></div></div><div class="dRoute">';
 for(const [i,where,details,ids] of rows){
  const latest=ids.map(id=>g.dashboard.reviewed[id]).filter(Boolean).sort().at(-1);
  s+='<div class="dRouteStep"><span class="dRouteNum">'+i+'</span><div class="dRouteText"><strong>'+h(where)+'</strong><p class="muted tiny">'+h(details)+'</p><p class="muted tiny">'+ids.map(id=>{const a=D_AREAS.find(x=>x.id===id);return a?h(a.title):''}).join(' · ')+'</p></div><span class="muted tiny dRouteDate">'+h(latest?'Most recent review: '+dDate(latest):'No review recorded')+'</span></div>';
 }
 s+='</div></section>';return s;
}
function dQuickReference(g,c){
 const tabs=[['syndicates','Syndicates'],['focus','Focus'],['intrinsics','Intrinsics'],['shards','Shards']];
 let s='<section class="panel dSection"><div class="editline"><div><h2>Quick-reference values</h2><p class="muted tiny">Your last saved numbers, so you do not need to visit each in-game menu just to remember them.</p></div></div>';
 s+='<div class="dRefTabs">'+tabs.map(([key,text])=>'<button class="button small '+(D_UI.reference===key?'gold':'ghost')+'" data-d-ref="'+key+'">'+text+'</button>').join('')+'</div>';
 let to='syndicates';
 if(D_UI.reference==='syndicates'){
  const entries=[...S_SYNDICATES.map(x=>x[0]),...(g.syndicates.custom||[])].map(name=>({name,...(g.syndicates.members[name]||{})}));
  entries.sort((a,b)=>(dRecorded(b.rank)||dRecorded(b.standing)?1:0)-(dRecorded(a.rank)||dRecorded(a.standing)?1:0)||a.name.localeCompare(b.name));
  const have=entries.filter(x=>dRecorded(x.rank)||dRecorded(x.standing));
  s+='<p class="muted tiny">'+have.length+' of '+entries.length+' factions have saved values. Showing recorded factions first.</p><div class="dRefRows">';
  for(const x of (have.length?have.slice(0,10):entries.slice(0,6))){
   s+='<div class="dRefRow"><strong>'+h(x.name)+'</strong><span>Rank '+(dRecorded(x.rank)?h(x.rank):'—')+'</span><span>'+ (x.name==='Nightcap'?'Analysed ':'Standing ')+(dRecorded(x.standing)?h(x.standing):'—')+'</span></div>';
  }
  s+='</div>';to='syndicates';
 }else if(D_UI.reference==='focus'){
  s+='<div class="dRefRows">';
  for(const name of P_SCHOOLS){const f=g.focus[name]||{},count=Object.values(f.nodes||{}).filter(x=>x&&dRecorded(x.rank)).length;const unlock=f.unlocked===null||f.unlocked===undefined?'Unknown':f.unlocked?'Unlocked':'Locked';
   s+='<div class="dRefRow"><strong>'+h(name)+'</strong><span>'+h(unlock)+'</span><span>'+count+' nodes ranked</span><span>'+ (dRecorded(f.available)?number(f.available).toLocaleString()+' unspent Focus':'Unspent —')+'</span></div>';
  }
  s+='</div>';to='focus';
 }else if(D_UI.reference==='intrinsics'){
  s+='<div class="dRefRows">';
  for(const [type,names] of Object.entries(P_INTR))for(const name of names){const value=g.intrinsics[type]?.[name];
   s+='<div class="dRefRow"><strong>'+h(name)+'</strong><span>'+h(type)+'</span><span>'+ (dRecorded(value)?'Rank '+h(value)+' / 10':'Not recorded')+'</span></div>';
  }
  s+='</div>';to='intrinsics';
 }else if(D_UI.reference==='shards'){
  s+='<p class="muted tiny">Spare = not installed. Installed shards are counted separately and may not correspond to spare inventory.</p><div class="dRefRows">';
  for(const color of P_COLORS){const base=g.shards.spare[color+'|Standard'],tau=g.shards.spare[color+'|Tauforged'];const inUse=(g.shards.installed||[]).filter(x=>x.color===color).length;
   s+='<div class="dRefRow"><strong>'+h(color)+'</strong><span>Standard '+(dRecorded(base)?h(base):'—')+'</span><span>Tau '+(dRecorded(tau)?h(tau):'—')+'</span><span>Installed '+inUse+'</span></div>';
  }
  s+='</div>';to='shards';
 }
 s+='<div class="dShow">'+dJumpButton({tab:to},'Update values')+'</div></section>';
 return s;
}
function dCoverage(g,c){
 const areas=[
  {name:'Quests',v:c.questsKnown,max:c.questsTotal,href:'quests'},
  {name:'Focus abilities',v:c.focusSet,max:c.focusTotal,href:'focus'},
  {name:'Intrinsics',v:c.intrKnown,max:c.intrTotal,href:'intrinsics'},
  {name:'Syndicates',v:c.syKnown,max:c.syMax,href:'syndicates'},
  {name:'Game modes',v:c.actKnown,max:c.actTotal,href:'activities'},
  {name:'System unlocks',v:c.milestoneKnown,max:c.milestoneTotal,href:'milestones'}
 ];
 let s='<section class="panel dSection"><h2>How complete are your records?</h2><p class="muted tiny">Coverage measures what you have <strong>checked and recorded</strong>, not how much of Warframe you have beaten.</p>';
 for(const a of areas){
  const pct=a.max?Math.min(100,a.v/a.max*100):0;
  s+='<div class="dCov"><div class="dCovLabel"><span>'+h(a.name)+'</span><strong>'+a.v+' / '+a.max+' recorded</strong></div><div class="progressbar"><div style="width:'+pct.toFixed(1)+'%"></div></div><button class="dOpen" data-d-tab="'+h(a.href)+'">Review →</button></div>';
 }
 s+='<p class="helptext">Mission nodes and shards are shown separately because the number of live nodes and your total installed shard slots can change. A planet-level check from the old sheet is never treated as a fully completed planet.</p></section>';return s;
}
function dOverview(){
 if(!state.profileImported){
  return title('Tenno command centre','Your progress at a glance, without visiting every in-game vendor and console')+
   statusNotice()+
   '<div class="panel"><h2>One home for the whole game</h2><p class="muted">Restore your private SpineCrown profile to see mastery, quest progress, Syndicates, Focus, intrinsics, shards and a session planner here. Unrecorded data stays unknown.</p><p class="muted tiny">This public website contains no personal PlayStation data.</p></div>';
 }
 const g=dModel(),c=dRowStats(g);
 let s=title('Tenno command centre','Your recorded game progress, what to tackle next, and where to check each system in Warframe',button('Back up progress','backup','','small')+' '+button('Session planner','goto','data-target="planner"','small')+' '+button('Audit mastery','goto','data-target="mastery"','gold'));
 s+=statusNotice();
 s+='<div class="dSnapshot"><span class="pill ok">Private profile loaded</span><span class="muted tiny">Imported snapshot: '+h(state.profile.meta.inventoryAsOf||state.profile.meta.source||'historical spreadsheet')+'</span><span class="muted tiny">Last browser edit: '+h(dDate(state.profile.meta.lastUpdated))+'</span><span class="muted tiny">Catalogue: '+h(catalogueStatusText())+'</span></div>';
 s+='<div class="cards dMetrics">';
 const items=[
 ['Mastery rank',String(state.profile.meta.masteryRank||'—'),c.mastered+' / '+c.gear+' equipment mastered'],
 ['Quests complete',c.questsDone+' / '+c.questsTotal,(c.questsTotal-c.questsKnown)+' quests have no recorded status'],
 ['Mission nodes',c.nodeKnown?c.normalDone+' + '+c.steelDone:'—',c.nodeKnown?'Normal + Steel Path confirmed complete':'Individual mission progress not recorded'],
 ['Syndicates',c.syKnown+' / '+c.syMax,'Factions with recorded rank or standing'],
 ['Intrinsics',c.intrKnown+' / '+c.intrTotal,'Tracks with confirmed ranks'],
 ['Play next',String(c.actOpen+c.readyLevel),'Available/in-progress modes + ready-to-level gear']
 ];
 for(const item of items)s+='<div class="metric"><div class="lbl">'+h(item[0])+'</div><div class="val">'+h(item[1])+'</div><div class="note">'+h(item[2])+'</div></div>';
 s+='</div>';
 s+='<div class="dTwo">'+dPriorities(g)+dWeekly(g)+'</div>';
 s+=dCoverage(g,c);
 s+=dQuickReference(g,c);
 s+=dAuditRoute(g);
 s+=dAreas(g,c);
 s+='<div class="panel dSection"><h2>What this dashboard does — and does not do</h2><p class="muted tiny">It summarises the progress you have actually saved in Tenno Arsenal. Your historical workbook data is not a live PlayStation sync. New game catalogue entries can refresh separately, but personal game activity, Standing, Focus, quests and shards require checking in Warframe or a verified import. Click <strong>Mark checked</strong> only after confirming a section in-game; this records the review date without marking content complete. Use <strong>Backup</strong> to preserve your private data before clearing browser storage or switching devices.</p></div>';
 return s;
}
overview=dOverview;
for(const nav of NAV)if(nav[0]==='overview')nav[2]='Command centre';
document.addEventListener('click',event=>{
 const el=event.target.closest('[data-d-expand],[data-d-reviewed],[data-d-tab],[data-d-page],[data-d-ref]');
 if(!el)return;
 if(el.dataset.dRef){D_UI.reference=el.dataset.dRef;render();return;}
 if(el.dataset.dExpand){
  if(el.dataset.dExpand==='areas')D_UI.showAll=!D_UI.showAll;
  if(el.dataset.dExpand==='weekly')D_UI.weeklyAll=!D_UI.weeklyAll;
  if(el.dataset.dExpand==='priority')D_UI.priorityAll=!D_UI.priorityAll;
  render();return;
 }
 if(el.dataset.dReviewed){
  if(!state.profileImported){toast('Restore your private profile first',true);return;}
  const a=D_AREAS.find(x=>x.id===el.dataset.dReviewed);if(!a)return;
  dModel().dashboard.reviewed[a.id]=new Date().toISOString();
  pSave();render();toast(a.title+' review date saved');return;
 }
 if(el.dataset.dTab){
  P_UI.tab=el.dataset.dTab;go('progress');return;
 }
 if(el.dataset.dPage){go(el.dataset.dPage);return;}
});
const D_STYLE=document.createElement('style');
D_STYLE.textContent='.dSnapshot{display:flex;flex-wrap:wrap;align-items:center;gap:9px 16px;margin:0 0 16px}.dMetrics{grid-template-columns:repeat(3,minmax(0,1fr))}.dTwo{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:15px;margin:19px 0}.dSection{margin:18px 0}.dSection h2{margin:0}.dSection p{margin-top:8px}.dList{margin-top:14px}.dListRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}.dListRow:last-child{border-bottom:0}.dListBody{min-width:0;flex:1}.dListBody strong{display:block;font-size:13px}.dListBody .muted{font-size:11px}.dListRow .button{flex:none}.dListRow .pill{white-space:nowrap}.dCov{display:grid;grid-template-columns:minmax(180px,1fr) minmax(70px,1.6fr) 67px;align-items:center;gap:12px;margin:16px 0}.dCovLabel{display:flex;flex-direction:column;gap:3px;font-size:13px}.dCovLabel strong{font-size:11px;color:var(--muted);font-weight:500}.dOpen{color:var(--cyan);border:0;background:transparent;cursor:pointer;font-size:12px}.dAreas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin-top:16px}.dArea{display:flex;flex-direction:column;gap:9px;padding:14px;background:var(--raised);border:1px solid var(--line);border-radius:var(--r);min-width:0}.dAreaTop{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.dAreaIcon{width:26px;height:26px;color:var(--gold);display:grid;place-items:center;background:#111d2d;border-radius:6px}.dAreaName{font-size:13px;font-weight:700;flex:1}.dAreaTop .pill{font-size:10px}.dMain{font-size:15px;font-weight:700;letter-spacing:-.02em}.dWhere{padding:10px;border:1px dashed #394e65;border-radius:7px;font-size:12px;line-height:1.5;margin-top:auto}.dAreaFoot{display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap;padding-top:5px}.dAreaControls{display:flex;gap:6px;align-items:center}.dAreaControls .button{font-size:11px;padding:6px 8px}.dShow{margin-top:12px}.dCov .progressbar{width:100%}@media(max-width:1180px){.dAreas{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:950px){.dTwo{grid-template-columns:1fr}.dMetrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.dAreas{grid-template-columns:1fr}.dMetrics{grid-template-columns:repeat(2,minmax(0,1fr))}.dCov{grid-template-columns:minmax(0,1fr) minmax(80px,1fr) 55px;gap:6px}.dListRow{align-items:flex-start;flex-wrap:wrap}.dListRow .button{margin-left:auto}.dAreaFoot{align-items:center}}';
document.head.append(D_STYLE);
const D_REF_STYLE=document.createElement('style');D_REF_STYLE.textContent='.dRefTabs{display:flex;gap:7px;flex-wrap:wrap;margin:15px 0}.dRefRows{display:flex;flex-direction:column;gap:0}.dRefRow{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 0;border-bottom:1px solid var(--line);font-size:12px}.dRefRow strong{flex:1;min-width:135px;font-size:13px}.dRefRow span{color:var(--muted)}.dRefRow:last-child{border-bottom:0}';document.head.append(D_REF_STYLE);
const D_ROUTE_STYLE=document.createElement('style');D_ROUTE_STYLE.textContent='.dRoute{margin-top:13px}.dRouteStep{display:flex;align-items:flex-start;gap:13px;padding:13px 0;border-bottom:1px solid var(--line)}.dRouteStep:last-child{border-bottom:0}.dRouteNum{background:var(--raised);color:var(--gold);border:1px solid var(--line);border-radius:8px;min-width:28px;height:28px;display:grid;place-items:center;font-weight:700}.dRouteText{flex:1;min-width:0}.dRouteText strong{font-size:13px}.dRouteText p{margin:4px 0}.dRouteDate{max-width:140px;text-align:right}@media(max-width:600px){.dRouteStep{flex-wrap:wrap}.dRouteDate{max-width:none;margin-left:40px;text-align:left}}';document.head.append(D_ROUTE_STYLE);
if(state.page==='overview')render();
