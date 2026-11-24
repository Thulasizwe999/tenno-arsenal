'use strict';
/* Tenno Arsenal: public reference data only. All player progress lives in the private browser profile. */
const S_SYNDICATES=[
 ['Steel Meridian','Relay',5,'Standing'],['Arbiters of Hexis','Relay',5,'Standing'],
 ['Cephalon Suda','Relay',5,'Standing'],['The Perrin Sequence','Relay',5,'Standing'],
 ['Red Veil','Relay',5,'Standing'],['New Loka','Relay',5,'Standing'],
 ['Ostron','Open world',5,'Standing'],['The Quills','Open world',5,'Standing'],
 ['Solaris United','Open world',5,'Standing'],['Vox Solaris','Open world',5,'Standing'],
 ['Ventkids','Open world',5,'Standing'],['Entrati','Open world',5,'Standing'],
 ['Necraloid','Open world',3,'Standing'],['The Holdfasts','Open world',5,'Standing'],
 ['Cavia','Open world',5,'Standing'],['The Hex','Open world',5,'Standing'],
 ['Cephalon Simaris','Specialist',null,'Standing'],
 ['Conclave','Specialist',5,'Standing'],["Kahl's Garrison",'Specialist',5,'Stock'],
 ['Nightcap','Specialist',5,'Mushrooms analysed']
];
const S_ACTIVITIES=[
 ['Sortie','Weekly & repeatable','Daily','Complete daily three-mission Sortie'],
 ['Archon Hunt','Weekly & repeatable','Weekly','Weekly Archon Hunt and shard reward'],
 ['Netracells','Weekly & repeatable','Weekly','Shared weekly Search Pulses with Archimedea'],
 ['Deep Archimedea','Weekly & repeatable','Weekly','Personal Research Points and Elite variant'],
 ['Temporal Archimedea','Weekly & repeatable','Weekly','1999 Archimedea and Elite variant; shared Search Pulses'],
 ['The Icebind','Weekly & repeatable','Repeatable','Six-player Cryobell challenge, launched 7 October 2026'],
 ['Steel Path Incursions','Weekly & repeatable','Daily','Daily Steel Path Incursions and Steel Essence'],
 ['Arbitrations','Weekly & repeatable','Repeatable','Vitus Essence / adaptation and related goals'],
 ['Normal Circuit','Duviri','Weekly','Warframe reward track and weekly Circuit tier'],
 ['Steel Path Circuit','Duviri','Weekly','Incarnon Genesis adapters and weekly tier'],
 ['The Duviri Experience','Duviri','Repeatable','Drifter exploration, decrees, resources'],
 ['The Lone Story','Duviri','Repeatable','Duviri boss and Pathos Clamp runs'],
 ['Isleweaver','Duviri','Repeatable','Duviri Isleweaver progression and associated rewards'],
 ['Zariman bounties','Open worlds & hubs','Repeatable','Voidplumes and Holdfasts goals'],
 ['Sanctum Anatomica bounties','Open worlds & hubs','Repeatable','Cavia standing, Voca and research'],
 ['Cetus / Plains bounties','Open worlds & hubs','Repeatable','Ostron reputation and Plains rewards'],
 ['Fortuna / Orb Vallis bounties','Open worlds & hubs','Repeatable','Solaris and Vox Solaris'],
 ['Deimos / Cambion Drift bounties','Open worlds & hubs','Repeatable','Entrati standing and Isolation Vaults'],
 ['Deepmines / Nightcap','Open worlds & hubs','Permanent','16 Mushroom Field Guide species; 3 entries each'],
 ['Eidolon hunts','Open worlds & hubs','Repeatable','Teralyst, Gantulyst and Hydrolyst captures'],
 ['Orb Mother battles','Open worlds & hubs','Repeatable','Profit-Taker and Exploiter Orb'],
 ['Conservation, fishing and mining','Open worlds & hubs','Optional','Open-world collections and reputation'],
 ['Railjack mission chart','Railjack & equipment systems','Permanent','Railjack Proxima nodes, both Normal and Steel Path as available'],
 ['Kuva Lich','Adversaries','Repeatable','Active Lich, weapon element/bonus, converted or vanquished'],
 ['Sister of Parvos','Adversaries','Repeatable','Active Sister, Tenet rewards and hounds'],
 ['Technocyte Coda','Adversaries','Repeatable','1999 Coda adversary, Coda weapons and rewards'],
 ['Incarnon evolution challenges','Railjack & equipment systems','Permanent','Unlock evolution stages of owned Incarnon weapons'],
 ['Helminth / subsuming','Railjack & equipment systems','Permanent','Helminth unlocks, invigoration and subsumed collection'],
 ['Nightwave season','Seasonal & social','Seasonal','Current season rank, Acts and reward track'],
 ['Höllvania 1999 Calendar','Seasonal & social','Weekly','Weekly calendar activities and season goals'],
 ['Hex KIM chemistry','Seasonal & social','Permanent','Individual chemistry, conversations and relationship goals'],
 ['Kahl weekly mission','Seasonal & social','Weekly','Kahl Garrison missions and Stock purchases'],
 ['Void Fissures / relic opening','Seasonal & social','Repeatable','Target Prime parts and relic reserves'],
 ['Codex scans / fragments','Exploration & collections','Permanent','Codex scans, fragments, Kuria and Somachord'],
 ['Nightcap mushroom journal','Exploration & collections','Permanent','All 16 mushroom species fully analysed'],
 ['Dojo research / clan tech','Exploration & collections','Permanent','Unresearched clan blueprints and lab technology'],
 ['Conclave / Lunaro','Exploration & collections','Optional','PvP modes and Conclave standing'],
 ['K-Drive / Ventkids','Exploration & collections','Optional','K-Drive mastery, races and Ventkids standing'],
 ['Operator / Drifter cosmetics','Exploration & collections','Optional','Quills/Vox/other cosmetic and equipment goals'],
 ['Platinum / trading goals','Exploration & collections','Optional','Wishlist of items to trade or buy']
];
const S_CORE_HEX=['Arthur','Aoi','Amir','Eleanor','Lettie','Quincy'];
const S_CADENCE=['All','Daily','Weekly','Repeatable','Permanent','Seasonal','Optional'];
const S_UI={syGroup:'All',aGroup:'All',cadence:'All',search:''};
const S_STATUS=[['unknown','Unknown / not recorded'],['locked','Locked'],['available','Available'],['in-progress','In progress'],['completed','Completed'],['not-applicable','Not applicable']];
const S_ESC=(s)=>h(String(s??''));
const S_ID=(s)=>enc(String(s));
function sModel(){
 const g=pModel();
 g.syndicates ||= {members:{},pledged:''};
 g.syndicates.members ||= {};
 g.syndicates.custom ||= [];
 g.activities ||= {entries:{},custom:[]};
 g.activities.entries ||= {};
 g.activities.custom ||= [];
 g.hexChemistry ||= {};
 return g;
}
function sSyndicates(g){
 const d=sModel().syndicates,groups=['All','Relay','Open world','Specialist','Custom'],
 rows=[...S_SYNDICATES,...d.custom.map(name=>[name,'Custom',5,'Standing'])].filter(x=>S_UI.syGroup==='All'||x[1]===S_UI.syGroup);
 const pledge=[['','Not recorded'],...S_SYNDICATES.filter(x=>x[1]==='Relay').map(x=>[x[0],x[0]])];
 const known=Object.values(d.members).filter(v=>v&&(v.rank!==null&&v.rank!==undefined||v.standing!==null&&v.standing!==undefined)).length;
 let s='<div class="panel"><div class="editline"><div><h2>Syndicates & standing</h2><p class="muted tiny">Rank, standing, pledge, goals and currencies are stored privately. Empty means <strong>not checked</strong> — not rank 0.</p></div></div>';
 s+='<div class="notice"><strong>'+known+' / '+(S_SYNDICATES.length+d.custom.length)+' factions reviewed.</strong> Rank and Standing are independent. Relay allegiance affects opposing factions. Nightcap uses mushrooms analysed and Fergolyte instead of normal Standing.</div>';
 s+='<div class="formgrid"><label>Current Relay pledge '+pDrop(pledge,d.pledged||'','data-s-pledge')+'</label><label>Category '+pDrop(groups.map(x=>[x,x]),S_UI.syGroup,'data-s-sygroup')+'</label></div>';
 s+='<div class="tablewrap"><table class="data"><thead><tr><th>Faction</th><th>Rank</th><th>Standing / progress</th><th>Next target</th><th>Notes</th></tr></thead><tbody>';
 for(const [name,group,max,metric] of rows){
  const x=d.members[name]||{},opts=max===null?[['','Not ranked']]:[['','Unknown'],...Array.from({length:max+1+(group==='Relay'?2:0)},(_,i)=>{const n=i-(group==='Relay'?2:0);return [String(n),String(n)]})];
  s+='<tr><td class="name">'+S_ESC(name)+'<div class="muted tiny">'+S_ESC(group)+(name==='Nightcap'?' · 16 mushrooms total':'')+'</div></td>';
  s+='<td>'+pDrop(opts,x.rank===null||x.rank===undefined?'':String(x.rank),'data-s-rank="'+S_ID(name)+'" '+(max===null?'disabled':''))+'</td>';
  s+='<td><input class="field sNumber" type="number" min="0" '+(name==='Nightcap'?'max="16"':'')+' placeholder="'+S_ESC(metric)+'" value="'+(x.standing??'')+'" data-s-stand="'+S_ID(name)+'"></td>';
  s+='<td><input class="field sGoal" placeholder="What to unlock next?" value="'+S_ESC(x.goal||'')+'" data-s-goal="'+S_ID(name)+'"></td>';
  s+='<td><input class="field sGoal" placeholder="Optional notes" value="'+S_ESC(x.notes||'')+'" data-s-note="'+S_ID(name)+'"></td></tr>';
 }
 s+='</tbody></table></div>';
 s+='<div class="editline pAdd"><input class="field" id="sNewSyndicate" placeholder="Add future or custom faction"><button class="button small" data-s-act="add-syndicate">Add faction</button></div>';
 s+='<p class="helptext">The Cleaving Glaive is <strong>announced for Warframe: Tau (December 2026)</strong>, but not yet a playable Syndicate as of 24 November. Add it after release if you wish. Nightcap rank 0–5 is based on completed Mushroom Field Guide species; this is not a normal Standing balance.</p></div>';return s;
}
function sActivities(g){
 const a=sModel().activities,rows=[...S_ACTIVITIES,...a.custom.map(x=>[x.name,x.group||'Custom',x.cadence||'Optional',x.description||''])];
 const groups=['All',...new Set(rows.map(x=>x[1]))],filtered=rows.filter(x=>(S_UI.aGroup==='All'||x[1]===S_UI.aGroup)&&(S_UI.cadence==='All'||x[2]===S_UI.cadence)&&(!S_UI.search||(x[0]+' '+x[1]+' '+x[3]).toLowerCase().includes(S_UI.search.toLowerCase())));
 const planned=rows.filter(x=>['available','in-progress'].includes(a.entries[x[0]]?.status)).length;
 let s='<div class="panel"><h2>Game modes & long-term activities</h2><p class="muted tiny">Choose what matters to you. Record an unlock or completion state, a numeric progress amount when useful, and a farming goal. The app does not silently clear weekly entries or claim live mission status.</p>';
 s+='<div class="notice"><strong>'+rows.length+' activities · '+planned+' actionable.</strong> Daily and weekly progress is a manual snapshot; check the last-updated date before relying on a completed tick after a game reset.</div>';
 s+='<div class="filters">'+pDrop(groups.map(x=>[x,x]),S_UI.aGroup,'data-s-agroup')+pDrop(S_CADENCE.map(x=>[x,x]),S_UI.cadence,'data-s-cadence')+'<input class="field" id="sFindAct" placeholder="Search modes" value="'+S_ESC(S_UI.search)+'"></div>';
 s+='<div class="tablewrap"><table class="data"><thead><tr><th>Activity</th><th>Status</th><th>Progress</th><th>Goal / reminder</th><th>Last reviewed</th></tr></thead><tbody>';
 for(const [name,group,cadence,description] of filtered){
  const x=a.entries[name]||{};
  s+='<tr><td class="name">'+S_ESC(name)+'<div class="muted tiny">'+S_ESC(group)+' · '+S_ESC(cadence)+'</div><div class="muted tiny">'+S_ESC(description)+'</div></td>';
  s+='<td>'+pDrop(S_STATUS,x.status||'unknown','data-s-astatus="'+S_ID(name)+'"')+'</td>';
  s+='<td><input class="field sNumber" type="number" min="0" placeholder="—" value="'+(x.count??'')+'" data-s-acount="'+S_ID(name)+'"></td>';
  s+='<td><input class="field sGoal" placeholder="e.g. 2/5 runs, weapon farm" value="'+S_ESC(x.goal||'')+'" data-s-agoal="'+S_ID(name)+'"></td>';
  s+='<td class="muted tiny">'+(x.reviewed?S_ESC(x.reviewed.slice(0,10)):'Not checked')+'</td></tr>';
 }
 s+='</tbody></table></div>';
 s+='<p class="helptext"><strong>Important:</strong> Netracells, Deep Archimedea and Temporal Archimedea share weekly Search Pulses. Treat them as alternative ways to spend a common resource, not three independent weekly allowances. Number fields are optional counts, not a claim that you completed the mode.</p>';
 s+='<div class="editline pAdd"><input class="field" id="sNewActivity" placeholder="Custom mode or target"><button class="button small" data-s-act="add-activity">Add activity</button></div></div>';
 return s;
}
function sHex(g){
 const rel=sModel().hexChemistry;
 let s='<div class="panel"><h2>1999 — Hex chemistry</h2><p class="muted tiny">Keep chemistry labels as shown in your KIM interface. Unknown relationships stay blank. This does not automatically read your PlayStation progress.</p>';
 s+='<div class="tablewrap"><table class="data"><thead><tr><th>Member</th><th>Current chemistry</th><th>Next conversation / goal</th></tr></thead><tbody>';
 for(const name of [...new Set([...S_CORE_HEX,...Object.keys(rel)])]){
  const x=rel[name]||{};
  s+='<tr><td class="name">'+S_ESC(name)+'</td><td><input class="field sGoal" value="'+S_ESC(x.chemistry||'')+'" placeholder="Not recorded" data-s-chem="'+S_ID(name)+'"></td><td><input class="field sGoal" value="'+S_ESC(x.goal||'')+'" placeholder="Optional goal" data-s-hexgoal="'+S_ID(name)+'"></td></tr>';
 }
 s+='</tbody></table></div><div class="editline pAdd"><input class="field" id="sNewHex" placeholder="Additional KIM contact"><button class="button small" data-s-act="add-hex">Add person</button></div></div>';return s;
}
P_TABS.push(['syndicates','Syndicates'],['activities','Game modes'],['hex','1999 KIM']);
const sOriginalProgressPage=progressPage;
progressPage=function(){
 if(!['syndicates','activities','hex'].includes(P_UI.tab))return sOriginalProgressPage();
 const g=sModel();
 let s=title('World & story progression','Syndicates, game modes and real in-game completion');
 s+=statusNotice();
 s+='<div class="notice"><strong>Your profile remains private.</strong> New progress starts as unrecorded. Use Backup to retain your updates; no new import is needed.</div>';
 s+='<div class="pTabs">'+P_TABS.map(([k,label])=>'<button class="button '+(P_UI.tab===k?'gold':'ghost')+'" data-p-tab="'+k+'">'+S_ESC(label)+'</button>').join('')+'</div>';
 if(P_UI.tab==='syndicates')s+=sSyndicates(g);
 if(P_UI.tab==='activities')s+=sActivities(g);
 if(P_UI.tab==='hex')s+=sHex(g);
 return s;
};
const sOldTasks=tasksData;
tasksData=function(){
 const out=sOldTasks(),g=sModel();
 for(const [name,x] of Object.entries(g.activities.entries)){
  if(!x||!['available','in-progress'].includes(x.status))continue;
  out.push({id:'activity:'+name,name,group:'Game mode',action:x.status==='in-progress'?'Continue objective':'Plan activity',detail:x.goal||'Record in-game result',priority:x.status==='in-progress'?2:4});
 }
 for(const [name,x] of Object.entries(g.syndicates.members)){
  if(!x?.goal)continue;
  out.push({id:'syndicate:'+name,name,group:'Syndicate',action:'Progress faction goal',detail:x.goal,priority:4});
 }
 return out.sort((a,b)=>a.priority-b.priority||a.name.localeCompare(b.name));
};
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-s-act]');if(!button)return;
 const g=sModel();let changed=false;
 if(button.dataset.sAct==='add-syndicate'){const name=document.getElementById('sNewSyndicate')?.value.trim();if(name&&!S_SYNDICATES.some(x=>x[0]===name)&&!g.syndicates.custom.includes(name)){g.syndicates.custom.push(name);changed=true;}}
 if(button.dataset.sAct==='add-activity'){const name=document.getElementById('sNewActivity')?.value.trim();if(name&&!S_ACTIVITIES.some(x=>x[0]===name)&&!g.activities.custom.some(x=>x.name===name)){g.activities.custom.push({name,group:'Custom',cadence:'Optional',description:''});changed=true;}}
 if(button.dataset.sAct==='add-hex'){const name=document.getElementById('sNewHex')?.value.trim();if(name&&!S_CORE_HEX.includes(name)&&!g.hexChemistry[name]){g.hexChemistry[name]={chemistry:'',goal:''};changed=true;}}
 if(changed){pSave();render();toast('Saved to your private profile');}
});
document.addEventListener('change',e=>{
 const t=e.target,d=t.dataset;if(!Object.keys(d).some(k=>k.startsWith('s')))return;
 const g=sModel();let changed=false;
 if(d.sSygroup!==undefined){S_UI.syGroup=t.value;render();return;}
 if(d.sAgroup!==undefined){S_UI.aGroup=t.value;render();return;}
 if(d.sCadence!==undefined){S_UI.cadence=t.value;render();return;}
 if(d.sPledge!==undefined){g.syndicates.pledged=t.value;changed=true;}
 const syfield=[['sRank','rank'],['sStand','standing'],['sGoal','goal'],['sNote','notes']].find(x=>d[x[0]]!==undefined);
 if(syfield){const name=dec(d[syfield[0]]);const x=g.syndicates.members[name] ||= {};const key=syfield[1];x[key]=key==='rank'||key==='standing'?(t.value===''?null:Number(t.value)):t.value;changed=true;}
 const actfield=[['sAstatus','status'],['sAcount','count'],['sAgoal','goal']].find(x=>d[x[0]]!==undefined);
 if(actfield){const name=dec(d[actfield[0]]);const x=g.activities.entries[name] ||= {};const key=actfield[1];x[key]=key==='count'?(t.value===''?null:Math.max(0,Number(t.value))):t.value;x.reviewed=new Date().toISOString();changed=true;}
 const hexfield=[['sChem','chemistry'],['sHexgoal','goal']].find(x=>d[x[0]]!==undefined);
 if(hexfield){const name=dec(d[hexfield[0]]);const x=g.hexChemistry[name] ||= {};x[hexfield[1]]=t.value;changed=true;}
 if(changed){pSave();toast('Progress saved privately');}
});
document.addEventListener('input',e=>{
 if(e.target.id!=='sFindAct')return;
 const pos=e.target.selectionStart;S_UI.search=e.target.value;render();
 const newInput=document.getElementById('sFindAct');newInput?.focus();try{newInput?.setSelectionRange(pos,pos)}catch(_){}
});
const S_STYLE=document.createElement('style');S_STYLE.textContent='.sNumber{width:115px;max-width:100%}.sGoal{width:230px;max-width:100%}.tablewrap .data td{vertical-align:middle}.pTabs{row-gap:8px}@media(max-width:600px){.sGoal{min-width:135px}.sNumber{width:100px}}';document.head.append(S_STYLE);

if(state.page==='progress')render();
