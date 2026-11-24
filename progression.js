
'use strict';
const P_QUESTS=[
['Awakening','Story'],["Vor's Prize",'Story'],['The Teacher','Story'],["Saya's Vigil",'Story'],['Vox Solaris','Story'],['Once Awake','Story'],['Heart of Deimos','Story'],['The Archwing','Story'],['Natah','Story'],['The Second Dream','Story'],['Rising Tide','Story'],['The War Within','Story'],['Chains of Harrow','Story'],['Apostasy Prologue','Story'],['The Sacrifice','Story'],['Prelude to War','Story'],['The New War','Story'],['The Duviri Paradox','Story'],['Jade Shadows','Story'],['Jade Shadows: Constellations','Story'],['Whispers in the Walls','Story'],['The Lotus Eaters','Story'],['The Hex','Story'],['The Old Peace','Story'],['Lua','Prologue to Tau'],['Vessel','Prologue to Tau'],
['Howl of the Kubrow','Side'],['A Man of Few Words','Side'],['Stolen Dreams','Side'],['The New Strange','Side'],['Hidden Messages','Side'],['The Limbo Theorem','Side'],['Patient Zero','Side'],['The Jordas Precept','Side'],['Sands of Inaros','Side'],['The Silver Grove','Side'],['The Glast Gambit','Side'],["Octavia's Anthem",'Side'],['The Deadlock Protocol','Side'],['Call of the Tempestarii','Side'],['The Waverider','Side'],['Angels of the Zariman','Side'],['Veilbreaker','Side'],['Mask of the Revenant','Side']];
const P_SCHOOLS=['Madurai','Vazarin','Naramon','Unairu','Zenurik'];
const P_FOCUS={
Madurai:['Power Transfer','Void Strike','Void Fuel','Contamination Wave','Distilled Contamination','Chained Sling','Sling Strength','Phoenix Talons','Phoenix Spirit','Inner Gaze','Eternal Gaze'],
Vazarin:['Guardian Shell','Guardian Break','Void Snare','Protective Sling','Mending Unity','Mending Soul','Enduring Tides','Rejuvenating Tides'],
Naramon:['Power Spike','Affinity Spike','Void Levitation','Lethal Levitation','Opening Slam',"Killer's Rush",'Sling Stun','Mind Step','Far Sling'],
Unairu:['Caustic Strike','Magnetic Flare','Poise','Stone Skin','Reinforced Return','Unairu Wisp','Last Gasp','Vengeance'],
Zenurik:['Wellspring','Hardened Wellspring','Temporal Drag','Temporal Shot','Inner Might','Energy Pulse','Disarming Sling','Void Siphon','Void Flow']};
const P_WAY={Madurai:['Inner Gaze','Eternal Gaze'],Vazarin:['Enduring Tides','Rejuvenating Tides'],Naramon:['Mind Step','Far Sling'],Unairu:['Last Gasp','Vengeance'],Zenurik:['Void Siphon','Void Flow']};
const P_COLORS=['Crimson','Azure','Amber','Violet','Topaz','Emerald'];
const P_INTR={Railjack:['Tactical','Piloting','Gunnery','Engineering','Command'],Drifter:['Riding','Combat','Opportunity','Endurance']};
const P_MILESTONES=['Arbitrations unlocked','Steel Path unlocked','Helminth Segment installed','Invigoration Segment installed','Archon Shard Segment installed','Coalescent Fusion Segment installed','The Circuit unlocked','Steel Path Circuit unlocked','Incarnon Genesis unlocked','Kahl Garrison unlocked','Netracells unlocked','Deep Archimedea unlocked','Temporal Archimedea unlocked','The Perita Rebellion unlocked',"Follie's Hunt unlocked"];
const P_TABS=[['star','Star chart'],['quests','Quests'],['focus','Focus trees'],['shards','Archon Shards'],['helminth','Helminth'],['intrinsics','Intrinsics'],['milestones','Unlocks']];
const P_STATES=['unknown','locked','available','in-progress','completed'];
const P_QUEST_STATES=['unknown','not-started','in-progress','completed'];
const P_UI={tab:'star',chart:'origin',mode:'normal',planet:'Earth',school:'Zenurik',questType:'All',search:'',nodes:(typeof TENNO_MISSION_SEED!=='undefined'?TENNO_MISSION_SEED.slice():[]),loading:false,feed:'Public mission catalogue available'};
const P_NODE_KEY='tenno-arsenal-solnodes-v1';
function pModel(){
const pr=state.profile.progress|| (state.profile.progress={});
pr.starChart ||= {};pr.steelPath ||= {};pr.intrinsics ||= {};
const g=pr.game|| (pr.game={});
g.quests ||= {};g.extraQuests ||= [];g.nodes ||= {normal:{},steel:{},custom:[]};
g.nodes.normal ||= {};g.nodes.steel ||= {};g.nodes.custom ||= [];
g.focus ||= {};for(const sc of P_SCHOOLS){g.focus[sc] ||= {unlocked:null,available:null,spent:null,tektolyst:null,tauronRank:null,nodes:{},custom:[]};g.focus[sc].nodes ||= {};g.focus[sc].custom ||= [];}
g.shards ||= {spare:{},installed:[]};g.shards.spare ||= {};g.shards.installed ||= [];
g.helminth ||= {metamorphosis:null,progress:null,nextThreshold:null,unlockedAbilities:null,totalAbilities:null,checkedAt:null};
g.intrinsics ||= {};for(const typ of Object.keys(P_INTR))g.intrinsics[typ] ||= {};
g.milestones ||= {};g.extraMilestones ||= [];
return g;
}
/* One-time requested baseline: mark the current public Normal chart complete.
   Record its exact node IDs so future additions remain unknown. Manual changes are never overwritten on reload. */
function pMarkNormalBaseline(force=false){
 if(!state.profileImported||!state.profile||!P_UI.nodes?.length)return 0;
 const g=pModel();
 if(!force&&g.nodes.normalBaseline?.version===1)return 0;
 const all=[...new Map([...P_UI.nodes,...g.nodes.custom].map(n=>[n.id,n])).values()].filter(n=>n.id&&n.planet&&n.name&&n.chart!=='1999');
 if(all.length<250)return 0;
 for(const n of all)g.nodes.normal[n.id]='completed';
 g.nodes.normalBaseline={version:1,appliedAt:new Date().toISOString(),count:all.length,nodeIds:all.map(n=>n.id)};
 pSave();return all.length;
}
function pSave(){state.profile.meta.lastUpdated=new Date().toISOString();persist();}
function pDrop(opts,value,attrs=''){return '<select class="select" '+attrs+'>'+opts.map(([v,s])=>'<option value="'+h(v)+'" '+(String(value)===String(v)?'selected':'')+'>'+h(s)+'</option>').join('')+'</select>';}
function pStatus(v,attrs='',quest=false){return pDrop((quest?P_QUEST_STATES:P_STATES).map(k=>[k,({'unknown':'Unknown / not recorded','not-started':'Not started','in-progress':'In progress','completed':'Completed','available':'Available','locked':'Locked'}[k]||k)]),v||'unknown',attrs);}
function pOverview(g){
const quests=[...P_QUESTS.map(x=>x[0]),...g.extraQuests.map(x=>x.name)];
const qdone=quests.filter(x=>g.quests[x]==='completed').length;
const qknown=quests.filter(x=>g.quests[x]&&g.quests[x]!=='unknown').length;
const originIds=new Set(pChartNodes(g,'origin').map(n=>n.id));
const cDone=Object.entries(g.nodes.normal).filter(([id,v])=>originIds.has(id)&&v==='completed').length;
const sDone=Object.entries(g.nodes.steel).filter(([id,v])=>originIds.has(id)&&v==='completed').length;
const countedNormal=g.originSummary?.normal,countedSteel=g.originSummary?.steel;
const shardKnown=Object.keys(g.shards.spare).length||g.shards.installed.length;
const loose=Object.values(g.shards.spare).reduce((a,n)=>a+number(n),0);
const intrinsicKnown=Object.values(g.intrinsics).flatMap(o=>Object.values(o)).filter(x=>x!==null&&x!==undefined&&x!=='').length;
return '<div class="cards"><div class="metric"><div class="lbl">Quests confirmed complete</div><div class="val">'+qdone+' / '+quests.length+'</div><div class="note">'+(quests.length-qknown)+' not yet reviewed</div></div><div class="metric"><div class="lbl">Origin System · official</div><div class="val">'+(countedNormal?countedNormal.completed+' / '+countedNormal.total:cDone+' recorded')+'</div><div class="note">Steel Path: '+(countedSteel?countedSteel.completed+' / '+countedSteel.total:sDone+' recorded')+' · separately tracked from Railjack</div></div><div class="metric"><div class="lbl">Spare / installed shards</div><div class="val">'+(shardKnown?loose+' / '+g.shards.installed.length:'—')+'</div><div class="note">No shard quantity inferred</div></div><div class="metric"><div class="lbl">Intrinsic trees checked</div><div class="val">'+intrinsicKnown+' / 9</div><div class="note">Separate Railjack and Drifter ranks</div></div></div>';
}
progressPage=function(){
const g=pModel();
let s=title('World & story progression','Track real game completion beyond equipment and mods');
s+=statusNotice();
s+='<div class="notice"><strong>Progress you have not recorded is unknown, not incomplete.</strong> The Normal mission catalogue is prefilled Completed once; new mission nodes remain unknown. Steel Path is tracked separately and is not prefilled.</div>';
s+=pOverview(g);
s+='<div class="pTabs">'+P_TABS.map(([k,label])=>'<button class="button '+(P_UI.tab===k?'gold':'ghost')+'" data-p-tab="'+k+'">'+label+'</button>').join('')+'</div>';
if(P_UI.tab==='star')s+=pStar(g);
if(P_UI.tab==='quests')s+=pQuests(g);
if(P_UI.tab==='focus')s+=pFocus(g);
if(P_UI.tab==='shards')s+=pShards(g);
if(P_UI.tab==='helminth')s+=pHelminth(g);
if(P_UI.tab==='intrinsics')s+=pIntrinsics(g);
if(P_UI.tab==='milestones')s+=pMilestones(g);
return s;
};
const P_CHARTS=[
 ['origin','Origin System','Navigation: Origin planets and regular mission nodes'],
 ['railjack','Railjack Proxima','Navigation: Railjack / Empyrean Proxima map'],
 ['1999','Höllvania 1999','Pom-2 → NavNow, Höllvania missions and Faceoff'],
 ['duviri','Duviri','Duviri Experience, Lone Story and Circuit'],
 ['hubs','Hubs & special','Relays, open worlds and special entries that are not standard mission-clear nodes']
];
const P_RAIL_PLANETS=['Earth','Venus','Saturn','Uranus','Neptune','Pluto','Veil'];
function pChartOf(node){
 if(node.chart)return node.chart;
 if(node.id?.startsWith('CrewBattleNode')||node.planet==='Veil')return 'railjack';
 if(node.planet==='Höllvania'||node.planet==='Hollvania')return '1999';
 if(node.planet==='Duviri')return 'duviri';
 if(/hub/i.test(node.id||'')||/relay/i.test(node.type||'')||/free roam/i.test(node.type||'')||!String(node.type||'').trim())return 'hubs';
 return 'origin';
}
function pAllNodes(g){return [...new Map([...P_UI.nodes,...g.nodes.custom].map(n=>[n.id,n])).values()];}
function pChartNodes(g,chart){return pAllNodes(g).filter(n=>pChartOf(n)===(chart||P_UI.chart));}
function pPlanets(g,chart){
 const list=pChartNodes(g,chart);
 const names=[...new Set(list.map(x=>x.planet).filter(Boolean))];
 const favorites=chart==='railjack'?P_RAIL_PLANETS:['Earth','Venus','Mercury','Mars','Deimos','Phobos','Ceres','Jupiter','Europa','Saturn','Uranus','Neptune','Pluto','Eris','Sedna','Lua','Void','Kuva Fortress','Zariman'];
 return names.sort((a,b)=>{const ia=favorites.indexOf(a),ib=favorites.indexOf(b);return (ia<0?999:ia)-(ib<0?999:ib)||a.localeCompare(b);});
}
function pMarkChartNormal(chart){
 if(!state.profileImported)return 0;
 const g=pModel(),entries=pChartNodes(g,chart);
 if(!entries.length)return 0;
 for(const n of entries)g.nodes.normal[n.id]='completed';
 g.nodes.chartManualChecks ||= {};
 g.nodes.chartManualChecks[chart]=new Date().toISOString();
 pSave();return entries.length;
}
function pStar(g){
 pMarkNormalBaseline();
 const chart=P_UI.chart,all=pChartNodes(g,chart),planets=pPlanets(g,chart);
 if(!planets.includes(P_UI.planet))P_UI.planet=planets[0]||'';
 const curr=g.nodes[P_UI.mode];
 const visible=all.filter(n=>n.planet===P_UI.planet&&(!P_UI.search||(n.name+' '+n.type).toLowerCase().includes(P_UI.search.toLowerCase())));
 const completeNormal=all.filter(n=>g.nodes.normal[n.id]==='completed').length;
 const completeSteel=all.filter(n=>g.nodes.steel[n.id]==='completed').length;
 const knownNormal=all.filter(n=>g.nodes.normal[n.id]&&g.nodes.normal[n.id]!=='unknown').length;
 const knownSteel=all.filter(n=>g.nodes.steel[n.id]&&g.nodes.steel[n.id]!=='unknown').length;
 let out='<div class="panel"><div class="editline"><div><h2>Star charts & mission progress</h2><p class="muted tiny">The Origin System, Railjack, Höllvania, Duviri and hub maps are tracked separately. Normal and Steel Path are independent in each.</p></div><button class="button small" data-p-act="refresh">↻ Refresh public missions</button></div>';
 out+='<div class="pTabs pChartTabs">'+P_CHARTS.map(([id,label])=>'<button class="button small '+(chart===id?'gold':'ghost')+'" data-p-chart="'+id+'">'+h(label)+'</button>').join('')+'</div>';
 out+='<p class="muted tiny">'+h(P_CHARTS.find(x=>x[0]===chart)?.[2]||'')+'</p>';
 out+='<div class="pChartStatus"><span>Normal: <strong>'+completeNormal+' / '+all.length+'</strong> completed <small class="muted">('+knownNormal+' reviewed)</small></span><span>Steel Path: <strong>'+completeSteel+' / '+all.length+'</strong> completed <small class="muted">('+knownSteel+' reviewed)</small></span></div>';
 const summary=g.originSummary;
 if(chart==='origin'&&summary){
  out+='<div class="notice"><strong>Official in-game Origin profile:</strong> Normal '+summary.normal.completed+' / '+summary.normal.total+' nodes ('+summary.normal.xp.toLocaleString()+' / '+summary.normal.maxXp.toLocaleString()+' mastery XP) · Steel Path '+summary.steel.completed+' / '+summary.steel.total+' nodes ('+summary.steel.xp.toLocaleString()+' / '+summary.steel.maxXp.toLocaleString()+' XP). <span class="muted">This is your confirmed profile total, and may differ from the manual node checklist until you identify the missing nodes.</span></div>';
 }
 out+='<div class="filters">'+pDrop(planets.map(n=>[n,chart==='railjack'?n+' Proxima':n]),P_UI.planet,'id="pPlanet"')+pDrop([['normal','Normal'],['steel','Steel Path']],P_UI.mode,'id="pMode"')+'<input class="search" id="pNodeSearch" value="'+h(P_UI.search)+'" placeholder="Search missions"></div>';
 out+='<p class="helptext">'+h(P_UI.feed)+' · '+all.length+' entries in '+h(P_CHARTS.find(x=>x[0]===chart)?.[1]||chart)+'</p>';
 if(chart==='1999')out+='<div class="pOld">1999 entries are mission types and modes from NavNow, not a one-to-one Origin node or mastery-XP list. Completion is left Unknown until confirmed.</div>';
 if(chart==='railjack')out+='<div class="pOld">Railjack Proxima is independent of Origin planets. Normal Railjack missions can be marked complete without affecting Railjack Steel Path.</div>';
 if(chart==='hubs')out+='<div class="pOld">Hubs, open-world free-roam locations and inactive special entries are displayed separately from missions counted towards Origin System completion.</div>';
 if(visible.length){
  out+='<div class="tablewrap"><table class="data"><thead><tr><th>Node / mode</th><th>Mission</th><th>Status</th></tr></thead><tbody>';
  for(const n of visible.slice(0,150))out+='<tr><td class="name">'+h(n.name)+'</td><td class="muted">'+h(n.type||'—')+'</td><td>'+pStatus(curr[n.id],'data-p-node="'+h(n.id)+'" aria-label="Status for '+h(n.name)+'"')+'</td></tr>';
  out+='</tbody></table></div>';
 }else out+=empty('No missions here','Choose another region or add a custom entry.');
 out+='<div class="editline pAdd"><input class="field" id="pNewNode" placeholder="Node or mission name"><input class="field" id="pNewMission" placeholder="Mission type"><button class="button small" data-p-act="add-node">Add node</button></div>';
 out+='<div class="editline pAdd"><button class="button small" data-p-act="recomplete">Mark all '+h(P_CHARTS.find(x=>x[0]===chart)?.[1]||chart)+' Normal complete</button><span class="muted tiny">Manual override only; prompts for confirmation and never touches Steel Path.</span></div></div>';
 return out;
}
function pQuests(g){
const rows=[...P_QUESTS.map(([name,group])=>({name,group})),...g.extraQuests];
const groups=['All',...new Set(rows.map(x=>x.group))],shown=rows.filter(x=>P_UI.questType==='All'||x.group===P_UI.questType);
let s='<div class="panel"><div class="editline"><div><h2>Quest journal</h2><p class="muted tiny">Includes 2026 Prologue to Tau chapters. Refer to the in-game Codex for your current status.</p></div><a class="button small" target="_blank" rel="noopener" href="https://www.warframe.com/en/guides/quests">Official quest guide ↗</a></div>';
s+='<div class="filters"><select class="select" id="pQuestType">'+option(groups,P_UI.questType)+'</select></div><div class="tablewrap"><table class="data"><thead><tr><th>Quest</th><th>Group</th><th>Status</th></tr></thead><tbody>';
for(const x of shown)s+='<tr><td class="name">'+h(x.name)+'</td><td class="muted">'+h(x.group)+'</td><td>'+pStatus(g.quests[x.name],'data-p-quest="'+enc(x.name)+'"',true)+'</td></tr>';
s+='</tbody></table></div><div class="editline pAdd"><input class="field" id="pNewQuest" placeholder="Add a quest not listed"><button class="button small" data-p-act="add-quest">Add quest</button></div></div>';return s;
}
function pFocus(g){
const sc=P_UI.school,v=g.focus[sc],names=[...new Set([...P_FOCUS[sc],...v.custom])];
let s='<div class="panel"><h2>Focus schools & abilities</h2><p class="muted tiny">Track individual ranks and Waybound unlocks. If recent abilities are not listed, add them without replacing existing progress.</p><div class="pTabs">';
s+=P_SCHOOLS.map(x=>'<button class="button small '+(x===sc?'gold':'ghost')+'" data-p-school="'+x+'">'+x+'</button>').join('')+'</div>';
const yn=(field,label)=>'<label>'+label+pDrop([['','Unknown'],['yes','Yes'],['no','No']],v[field]===null?'':v[field]?'yes':'no','data-p-focus-field="'+field+'"')+'</label>';
const num=(field,label,max)=>'<label>'+label+'<input class="field" type="number" min="0" '+(max?'max="'+max+'"':'')+' placeholder="Unknown" data-p-focus-field="'+field+'" value="'+(v[field]??'')+'"></label>';
s+='<div class="formgrid">'+yn('unlocked','School unlocked')+yn('active','Currently active')+num('available','Unspent Focus')+num('spent','Invested Focus')+yn('tektolyst','Tektolyst artifact')+num('tauronRank','Tauron upgrades (0–5)',5)+'</div><p class="helptext">Individual ability maximum ranks depend on the node; the game is the authority. New Tauron Strike branches appeared in The Old Peace.</p>';
s+='<div class="tablewrap"><table class="data"><thead><tr><th>Focus node</th><th>Rank</th><th>Waybound unbound</th></tr></thead><tbody>';
for(const name of names){const a=v.nodes[name]||{},isWay=P_WAY[sc].includes(name);s+='<tr><td class="name">'+h(name)+'</td><td><input class="field pRank" type="number" min="0" max="10" placeholder="Unknown" value="'+(a.rank??'')+'" data-p-focus-node="'+enc(name)+'"></td><td>'+(isWay?'<label><input class="check" type="checkbox" data-p-way="'+enc(name)+'" '+(a.unbound?'checked':'')+'> Unbound</label>':'—')+'</td></tr>';}
s+='</tbody></table></div><div class="editline pAdd"><input class="field" id="pNewFocus" placeholder="Add new Focus ability"><button class="button small" data-p-act="add-focus">Add node</button></div></div>';return s;
}
function pShards(g){
let s='<div class="panel"><h2>Archon Shard inventory</h2><p class="muted tiny">Only spare (uninstalled) shards go here. Installed shards are recorded by Warframe below. Blank means unrecorded, not zero.</p><div class="pShards">';
for(const color of P_COLORS){s+='<div class="pShard"><strong>'+color+'</strong>';
for(const tier of ['Standard','Tauforged']){const k=color+'|'+tier;s+='<label>'+tier+' <input class="field" type="number" min="0" placeholder="Unknown" value="'+(g.shards.spare[k]??'')+'" data-p-stock="'+k+'"></label>';}s+='</div>';}s+='</div></div>';
s+='<div class="panel"><h2>Installed on Warframes</h2>';
if(g.shards.installed.length){s+='<div class="tablewrap"><table class="data"><thead><tr><th>Warframe</th><th>Slot</th><th>Shard</th><th>Note</th><th></th></tr></thead><tbody>';
g.shards.installed.forEach((a,i)=>{s+='<tr><td class="name">'+h(a.frame)+'</td><td>'+number(a.slot)+'</td><td>'+h(a.color)+' '+(a.tau?'Tauforged':'')+'</td><td>'+h(a.note||'—')+'</td><td><button class="button small" data-p-act="remove-shard" data-p-index="'+i+'">Remove</button></td></tr>';});s+='</tbody></table></div>';}
else s+=g.shards.installedConfirmedAt?'<div class="notice"><strong>No shards installed.</strong> Confirmed in-game on '+h(new Date(g.shards.installedConfirmedAt).toLocaleDateString())+'. Spare shards remain in the inventory above.</div>':empty('No shard installations recorded yet','No installed shards have been recorded yet. This does not mean you own none.');
s+='<div class="formgrid pAdd"><label>Warframe<input class="field" id="pFrame" list="pFrames" placeholder="e.g. Wisp Prime"></label><label>Slot (1–5)<input class="field" id="pSlot" type="number" min="1" max="5" value="1"></label><label>Colour<select class="select" id="pColor">'+option(P_COLORS,'Crimson')+'</select></label><label><input type="checkbox" id="pTau"> Tauforged</label><label class="wide">Bonus / notes<input class="field" id="pShardNote"></label></div>';
s+='<datalist id="pFrames">'+mergeEquip().filter(x=>x.category==='Warframes').map(x=>'<option value="'+h(x.name)+'">').join('')+'</datalist><button class="button gold" data-p-act="add-shard">Record installed shard</button><p class="helptext">Installing a shard does not automatically deduct an unverified spare quantity.</p></div>';return s;
}
function pHelminth(g){
 const a=g.helminth||{};
 let s='<section class="panel"><h2>Helminth metamorphosis and subsuming</h2><p class="muted tiny">The snapshot shows your Helminth rank and how many abilities are unlocked, but not the identities of every unlocked ability. Your individual Warframe and subsuming records stay separate.</p>';
 const valid=a.metamorphosis!==null&&a.metamorphosis!==undefined;
 const unlocked=a.unlockedAbilities??null,total=a.totalAbilities??null,step=a.progress??null,threshold=a.nextThreshold??null;
 s+='<div class="cards"><div class="metric"><div class="lbl">Metamorphosis</div><div class="val">'+(valid?h(a.metamorphosis):'—')+'</div><div class="note">As shown at the Helminth console</div></div>';
 s+='<div class="metric"><div class="lbl">Abilities unlocked</div><div class="val">'+(unlocked!==null&&total!==null?h(unlocked)+' / '+h(total):'—')+'</div><div class="note">'+(unlocked!==null&&total!==null?Math.max(0,total-unlocked)+' not unlocked':'Exact ability names not verified')+'</div></div>';
 s+='<div class="metric"><div class="lbl">Towards next reward</div><div class="val">'+(step!==null&&threshold!==null?h(Number(step).toLocaleString())+' / '+h(Number(threshold).toLocaleString()):'—')+'</div><div class="note">'+(step!==null&&threshold!==null?Math.max(0,threshold-step).toLocaleString()+' remaining':'Unrecorded')+'</div></div></div>';
 s+='<div class="formgrid">';
 const fields=[['metamorphosis','Metamorphosis rank'],['progress','Current progress XP'],['nextThreshold','Next reward XP threshold'],['unlockedAbilities','Unlocked abilities'],['totalAbilities','Total available abilities']];
 for(const [key,label] of fields)s+='<label>'+h(label)+'<input class="field" type="number" min="0" max="100000000" step="1" value="'+(a[key]??'')+'" placeholder="Unknown" data-p-helminth="'+key+'"></label>';
 s+='</div>';
 s+='<p class="helptext">Last checked in-game: '+(a.checkedAt?h(new Date(a.checkedAt).toLocaleDateString()):'Not yet confirmed')+'. Abilities unlocked does not identify individual subsumed Warframes. Keep your individual subsuming records in Equipment; do not automatically mark an ability unlocked based on this total.</p>';
 s+=button('Open equipment / subsuming','goto','data-target="equipment"','small');
 s+='</section>';return s;
}
function pIntrinsics(g){
let s='<div class="panel"><h2>Individual Intrinsics</h2><p class="muted tiny">Each track ranges from 0 to 10. Unknown remains blank until you check in-game.</p>';
for(const type of Object.keys(P_INTR)){const legacy=state.profile.progress.intrinsics[type];s+='<h3>'+type+'</h3><p class="helptext">Recorded total: '+h(legacy===undefined?'not recorded':legacy)+' ranks'+(g.intrinsicsUnspent?.[type]!==undefined?' · '+g.intrinsicsUnspent[type]+' unspent points':'')+'.</p><div class="pRanks">';
for(const name of P_INTR[type]){const val=g.intrinsics[type][name];s+='<label>'+name+'<select class="select" data-p-intrinsic="'+type+'|'+name+'">'+option(['Unknown',...Array.from({length:11},(_,i)=>String(i))],val===null||val===undefined?'Unknown':String(val))+'</select></label>';}s+='</div>';}
s+='</div>';return s;
}
function pMilestones(g){
let s='<div class="panel"><h2>Unlocks and ongoing game progress</h2><p class="muted tiny">Record actual access to game systems, not guesses from mastery.</p><div class="tablewrap"><table class="data"><thead><tr><th>System / milestone</th><th>Status</th></tr></thead><tbody>';
for(const name of [...P_MILESTONES,...g.extraMilestones])s+='<tr><td class="name">'+h(name)+'</td><td>'+pStatus(g.milestones[name],'data-p-milestone="'+enc(name)+'"')+'</td></tr>';
s+='</tbody></table></div><div class="editline pAdd"><input class="field" id="pNewMilestone" placeholder="Custom milestone"><button class="button small" data-p-act="add-milestone">Add</button></div></div>';return s;
}
async function pFetchNodes(showToast=false){
if(P_UI.loading)return;P_UI.loading=true;P_UI.feed='Checking community mission data';
try{
const response=await fetch('https://raw.githubusercontent.com/WFCD/warframe-worldstate-data/master/data/solNodes.json',{cache:'no-cache'});
if(!response.ok)throw Error(String(response.status));
const raw=await response.json(),found=[];
for(const [id,obj] of Object.entries(raw)){const match=String(obj.value||'').match(/^(.+?) \(([^)]+)\)$/);if(!match||/Ancient Retribution/i.test(obj.type||''))continue;found.push({id,name:match[1],planet:match[2],type:obj.type||''});}
if(found.length<80)throw Error('Unexpected mission data');
P_UI.nodes=[...new Map([...P_UI.nodes,...found].map(n=>[n.id,n])).values()];P_UI.feed=P_UI.nodes.length+' mission nodes loaded · '+new Date().toLocaleDateString();
pMarkNormalBaseline();
try{localStorage.setItem(P_NODE_KEY,JSON.stringify({at:Date.now(),nodes:found}))}catch(e){}
if(showToast)toast('Mission list updated');
}catch(e){P_UI.feed='Live mission list unavailable; saved nodes and manual entries still work';if(showToast)toast('Mission data not available',true)}
finally{P_UI.loading=false;if(state.page==='progress')render();}
}
const pCache=loadJSON(P_NODE_KEY);if(pCache?.nodes?.length){P_UI.nodes=[...new Map([...P_UI.nodes,...pCache.nodes].map(n=>[n.id,n])).values()];P_UI.feed=P_UI.nodes.length+' mission nodes (bundled + cached)';}
if(P_UI.nodes.length){pMarkNormalBaseline();pFetchNodes(false);}else pFetchNodes(false);
NAV.splice(NAV.findIndex(x=>x[0]==='progress'),1,['progress','◉','World & story']);
const pOldTopNav=topNav;
topNav=function(){pOldTopNav();const menu=$('#mobileNav');if(menu&&!menu.querySelector('[data-nav="progress"]')){const el=document.createElement('button');el.dataset.nav='progress';el.className=state.page==='progress'?'active':'';el.innerHTML='<span>◉</span>Story';menu.insertBefore(el,menu.lastElementChild);}};
const pOldTasks=tasksData;tasksData=function(){const items=pOldTasks(),g=pModel();
for(const [name,st] of Object.entries(g.quests))if(st==='in-progress'||st==='not-started')items.push({id:'quest:'+name,name,group:'Quest',action:st==='in-progress'?'Continue quest':'Start quest',detail:'Story progression',priority:st==='in-progress'?2:4});
const known=new Map([...P_UI.nodes,...g.nodes.custom].map(n=>[n.id,n]));
for(const mode of ['normal','steel'])for(const [id,st] of Object.entries(g.nodes[mode]))if(st==='available'||st==='in-progress'){const n=known.get(id);if(n)items.push({id:'story-node:'+mode+':'+id,name:n.name+' ('+n.planet+')',group:mode==='steel'?'Steel Path':'Star chart',action:'Clear mission node',detail:n.type||'',priority:3});}
for(const [name,st] of Object.entries(g.milestones))if(st==='available'||st==='in-progress')items.push({id:'story-unlock:'+name,name,group:'Game unlock',action:'Complete milestone',detail:st,priority:4});
return items.sort((a,b)=>a.priority-b.priority||a.name.localeCompare(b.name));};
document.addEventListener('click',ev=>{
const tab=ev.target.closest('[data-p-tab]');if(tab){P_UI.tab=tab.dataset.pTab;P_UI.search='';render();return;}
const chartButton=ev.target.closest('[data-p-chart]');if(chartButton){P_UI.chart=chartButton.dataset.pChart;P_UI.planet=pPlanets(pModel(),P_UI.chart)[0]||'';P_UI.search='';render();return;}
 const school=ev.target.closest('[data-p-school]');if(school){P_UI.school=school.dataset.pSchool;render();return;}
const el=ev.target.closest('[data-p-act]');if(!el)return;const g=pModel(),a=el.dataset.pAct;let change=false;
if(a==='refresh'){pFetchNodes(true);return;}
if(a==='recomplete'){if(!confirm('Mark all '+P_CHARTS.find(x=>x[0]===P_UI.chart)?.[1]+' Normal entries Completed? This will overwrite manual Normal statuses in this chart only. Steel Path is unaffected.'))return;const count=pMarkChartNormal(P_UI.chart);if(count){render();toast('Marked '+count+' Normal mission nodes complete');}else toast('Load your private profile and mission catalogue first',true);return;}
if(a==='add-node'){const name=$('#pNewNode')?.value.trim(),type=$('#pNewMission')?.value.trim();if(!name)return;const id='custom:'+slug(P_UI.chart+':'+P_UI.planet+':'+name);if(!g.nodes.custom.some(x=>x.id===id)){g.nodes.custom.push({id,name,planet:P_UI.planet,type:type||'Custom',chart:P_UI.chart});change=true;}}
if(a==='add-quest'){const name=$('#pNewQuest')?.value.trim();if(name&&!P_QUESTS.some(x=>x[0]===name)&&!g.extraQuests.some(x=>x.name===name)){g.extraQuests.push({name,group:'Custom'});change=true;}}
if(a==='add-focus'){const name=$('#pNewFocus')?.value.trim(),v=g.focus[P_UI.school];if(name&&!P_FOCUS[P_UI.school].includes(name)&&!v.custom.includes(name)){v.custom.push(name);change=true;}}
if(a==='add-milestone'){const name=$('#pNewMilestone')?.value.trim();if(name&&!P_MILESTONES.includes(name)&&!g.extraMilestones.includes(name)){g.extraMilestones.push(name);change=true;}}
if(a==='add-shard'){const frame=$('#pFrame')?.value.trim(),slot=Number($('#pSlot')?.value),color=$('#pColor')?.value,tau=$('#pTau')?.checked,note=$('#pShardNote')?.value;if(!frame||!Number.isInteger(slot)||slot<1||slot>5){toast('Enter a Warframe and a slot from 1–5',true);return;}if(g.shards.installed.some(x=>x.frame.toLowerCase()===frame.toLowerCase()&&x.slot===slot)){toast('That Warframe slot is already recorded',true);return;}g.shards.installed.push({frame,slot,color,tau,note});change=true;}
if(a==='remove-shard'){const i=Number(el.dataset.pIndex);if(Number.isInteger(i)&&i>=0&&i<g.shards.installed.length){g.shards.installed.splice(i,1);change=true;}}
if(change){pSave();render();toast('Progress saved');}
});
document.addEventListener('change',ev=>{
const el=ev.target,g=pModel();let save=false;
if(el.id==='pPlanet'){P_UI.planet=el.value;render();return;}if(el.id==='pMode'){P_UI.mode=el.value;render();return;}if(el.id==='pQuestType'){P_UI.questType=el.value;render();return;}
if(el.dataset.pNode){g.nodes[P_UI.mode][el.dataset.pNode]=el.value;save=true;}
else if(el.dataset.pQuest){g.quests[dec(el.dataset.pQuest)]=el.value;save=true;}
else if(el.dataset.pMilestone){g.milestones[dec(el.dataset.pMilestone)]=el.value;save=true;}
else if(el.dataset.pIntrinsic){const [type,name]=el.dataset.pIntrinsic.split('|');g.intrinsics[type][name]=el.value==='Unknown'?null:Number(el.value);save=true;}
else if(el.dataset.pStock){if(el.value==='')delete g.shards.spare[el.dataset.pStock];else g.shards.spare[el.dataset.pStock]=cleanInt(el.value);save=true;}
else if(el.dataset.pHelminth){const fld=el.dataset.pHelminth; if(['metamorphosis','progress','nextThreshold','unlockedAbilities','totalAbilities'].includes(fld)){g.helminth[fld]=el.value===''?null:cleanInt(el.value);g.helminth.checkedAt=new Date().toISOString();save=true;}}
 else if(el.dataset.pFocusField){const v=g.focus[P_UI.school],field=el.dataset.pFocusField;if(field==='unlocked'||field==='tektolyst'||field==='active')v[field]=el.value===''?null:el.value==='yes';else v[field]=el.value===''?null:Math.min(field==='tauronRank'?5:100000000,cleanInt(el.value));save=true;}
else if(el.dataset.pFocusNode){const name=dec(el.dataset.pFocusNode),v=g.focus[P_UI.school];v.nodes[name] ||= {};v.nodes[name].rank=el.value===''?null:Math.min(10,cleanInt(el.value));save=true;}
else if(el.dataset.pWay){const name=dec(el.dataset.pWay),v=g.focus[P_UI.school];v.nodes[name] ||= {};v.nodes[name].unbound=el.checked;save=true;}
if(save){pSave();toast('Progress saved privately');}
});
document.addEventListener('input',ev=>{if(ev.target.id!=='pNodeSearch')return;const car=ev.target.selectionStart;P_UI.search=ev.target.value;render();const t=$('#pNodeSearch');t?.focus();try{t?.setSelectionRange(car,car)}catch(e){}});
const P_CHART_STYLE=document.createElement('style');P_CHART_STYLE.textContent='.pChartStatus{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:14px 0;padding:12px;background:var(--raised);border:1px solid var(--line);border-radius:9px;font-size:13px}.pChartTabs{margin-bottom:10px}.pChartTabs button{flex:1 1 140px}';document.head.append(P_CHART_STYLE);
const P_STYLE=document.createElement('style');P_STYLE.textContent='.pTabs{display:flex;flex-wrap:wrap;gap:8px;margin:17px 0}.pTabs .button{padding:9px 12px}.pOld{padding:11px;border:1px solid var(--line);border-radius:8px;margin-bottom:10px}.pAdd{margin-top:17px;flex-wrap:wrap}.pAdd .field{flex:1;min-width:130px}.pShards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:13px 0}.pShard{display:flex;flex-direction:column;gap:10px;border:1px solid var(--line);border-radius:9px;padding:12px}.pShard strong{color:var(--gold)}.pShard label{display:flex;gap:8px;align-items:center;justify-content:space-between;font-size:12px;color:var(--muted)}.pShard input{max-width:110px}.pRanks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;margin:12px 0 22px}.pRanks label{display:flex;flex-direction:column;gap:6px}.pRank{max-width:110px}@media(max-width:750px){.pShards,.pRanks{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:470px){.pShards,.pRanks{grid-template-columns:1fr}.pTabs .button{flex:1 1 40%}}';document.head.append(P_STYLE);
if(state.page==='progress')render();
