'use strict';
/* Tenno Arsenal: small, reviewed, section-only inventory imports.
 * Generated inventory patches contain only observed values, never a full replacement profile.
 * No data is sent to GitHub; imported changes apply to existing browser-local profile.
 */
const IS_FORMAT='tenno-arsenal-inventory-patch';
let IS_PENDING=null,IS_FILE_NAME='';
const IS_HAS=(o,k)=>!!o&&Object.prototype.hasOwnProperty.call(o,k);
const IS_N=(n,min=0,max=1e9)=>{
 const v=Number(n);
 return Number.isSafeInteger(v)&&v>=min&&v<=max?v:null;
};
function isValidate(j){
 if(!j||j.format!==IS_FORMAT||j.version!==1)throw Error('Expected a Tenno Arsenal inventory patch (version 1)');
 const allowed=['arcanes','shards','syndicates','nightwave','equipment','gameProgress','gameProgressDelta'];
 if(!allowed.some(k=>IS_HAS(j,k)))throw Error('Patch contains no supported sections');
 if(IS_HAS(j,'arcanes')&&!Array.isArray(j.arcanes))throw Error('Arcanes must be a list');
 if(IS_HAS(j,'syndicates')&&!Array.isArray(j.syndicates))throw Error('Syndicates must be a list');
 if(IS_HAS(j,'equipment')&&!Array.isArray(j.equipment))throw Error('Equipment must be a list');
 if(IS_HAS(j,'shards')&&(!j.shards||typeof j.shards!=='object'||Array.isArray(j.shards)))throw Error('Shards must be an object');
 if(IS_HAS(j,'nightwave')&&(!j.nightwave||typeof j.nightwave!=='object'||Array.isArray(j.nightwave)))throw Error('Nightwave must be an object');
 if(j.arcanes?.length>1200||j.syndicates?.length>200||j.equipment?.length>5000)throw Error('Implausible patch size');
 return j;
}
function isPreview(j){
 const rows=[];
 for(const x of j.arcanes||[])if(x?.name&&[x.rank,x.extra,x.copiesByRank].some(v=>v!==undefined)){
  const old=state.profile.arcanes.find(a=>a.name?.toLowerCase()===String(x.name).toLowerCase())||{};
  rows.push(['Arcane',x.name,'Rank '+(old.rank??'—')+' / spare '+(old.extra??'—'),'Rank '+(x.rank??old.rank??'—')+' / spare '+(x.extra??old.extra??'—')+(x.copiesByRank?' · copy ranks included':'')]);
 }
 for(const [k,v] of Object.entries(j.shards?.spare||{})){
  const old=state.profile.progress.game?.shards?.spare?.[k];
  rows.push(['Archon Shard',k,old??'Not recorded',v]);
 }
 for(const x of j.syndicates||[])if(x?.name){
  const old=state.profile.progress.game?.syndicates?.members?.[x.name]||{};
  rows.push(['Syndicate',x.name,'Rank '+(old.rank??'—')+' / Standing '+(old.standing??'—'),'Rank '+(x.rank??old.rank??'—')+' / Standing '+(x.standing??old.standing??'—')]);
 }
 if(j.nightwave)for(const key of ['season','rank','prestige','standing','cred','goal']){
  if(!IS_HAS(j.nightwave,key))continue;
  const old=state.profile.progress.game?.nightwave?.[key];
  rows.push(['Nightwave',key,old??'Not recorded',j.nightwave[key]]);
 }
 if(j.nightwave?.acts)rows.push(['Nightwave','Acts','Existing Acts retained',j.nightwave.acts.length+' observed Act entries to merge']);
 if(j.nightwave?.claimed)rows.push(['Nightwave','Reward claims','Existing claims retained',Object.keys(j.nightwave.claimed).length+' confirmed claims to merge']);
 for(const x of j.equipment||[])if(x?.category&&x?.name){
  const key=ek(x.category,x.name),old=state.profile.equipment[key]||{};
  rows.push(['Equipment',x.name,(old.owned?'Owned':'Unknown')+' / '+(old.blueprint?'Blueprint':'—'),(x.owned===true?'Owned':x.owned===false?'Not owned':'Unchanged')+' / '+(x.blueprint===true?'Blueprint':x.blueprint===false?'No BP':'Unchanged')]);
 }
 return rows;
}
function isApply(j){
 const player=state.profile,p=pModel();
 let updated=0;
 for(const obj of j.arcanes||[]){
  if(typeof obj?.name!=='string'||!obj.name.trim())continue;
  const name=obj.name.trim(),entry=player.arcanes.find(a=>a.name?.toLowerCase()===name.toLowerCase());
  let rank,extra,ranked=null;
  if(IS_HAS(obj,'rank')){rank=IS_N(obj.rank,0,10);if(rank===null)throw Error('Invalid Arcane rank for '+name);}
  if(IS_HAS(obj,'extra')){extra=IS_N(obj.extra,0,100000);if(extra===null)throw Error('Invalid Arcane extra count for '+name);}
  if(IS_HAS(obj,'copiesByRank')){
   if(!obj.copiesByRank||typeof obj.copiesByRank!=='object'||Array.isArray(obj.copiesByRank))throw Error('Invalid copy ranks for '+name);
   ranked={};
   for(const [r,q] of Object.entries(obj.copiesByRank)){
    if(IS_N(r,0,10)===null||IS_N(q,0,100000)===null)throw Error('Invalid rank quantity in '+name);
    ranked[r]=Number(q);
   }
  }
  const target=entry||{name,collection:'',rank:0,extra:0,farm:false,notes:''};
  if(rank!==undefined)target.rank=rank;
  if(extra!==undefined)target.extra=extra;
  if(ranked)target.copiesByRank=ranked;
  target.inventoryCheckedAt=j.capturedAt||new Date().toISOString();
  if(!entry)player.arcanes.push(target);
  updated++;
 }
 const validShards=['Crimson','Azure','Amber','Violet','Topaz','Emerald'];
 const validTiers=['Standard','Tauforged'];
 if(j.shards?.spare){
  p.shards ||= {spare:{},installed:[]};p.shards.spare ||= {};
  for(const [k,q] of Object.entries(j.shards.spare)){
   const [color,tier]=k.split('|'),n=IS_N(q,0,100000);
   if(!validShards.includes(color)||!validTiers.includes(tier)||n===null)throw Error('Invalid Archon Shard quantity: '+k);
   p.shards.spare[k]=n;updated++;
  }
 }
 for(const obj of j.syndicates||[]){
  if(typeof obj?.name!=='string'||!obj.name.trim())continue;
  const name=obj.name.trim();
  p.syndicates ||= {members:{},pledged:'',custom:[]};
  p.syndicates.members ||= {};
  const existing=p.syndicates.members[name] ||= {};
  if(IS_HAS(obj,'rank')){const n=IS_N(obj.rank,-2,10);if(n===null)throw Error('Invalid Syndicate rank: '+name);existing.rank=n;}
  if(IS_HAS(obj,'standing')){const n=IS_N(obj.standing,-100000,100000000);if(n===null)throw Error('Invalid Syndicate standing: '+name);existing.standing=n;}
  existing.inventoryCheckedAt=j.capturedAt||new Date().toISOString();
  updated++;
 }
 if(j.nightwave){
  p.nightwave ||= {season:'',rank:null,prestige:null,standing:null,cred:null,claimed:{},acts:[],goal:'',archives:[]};
  const target=p.nightwave,source=j.nightwave;
  for(const key of ['season','goal'])if(IS_HAS(source,key)){if(typeof source[key]!=='string')throw Error('Invalid Nightwave '+key);target[key]=source[key];updated++;}
  for(const key of ['rank','prestige','standing','cred'])if(IS_HAS(source,key)){const n=IS_N(source[key],0,key==='rank'?150:100000000);if(n===null)throw Error('Invalid Nightwave '+key);target[key]=n;updated++;}
  if(source.claimed&&typeof source.claimed==='object'){
   target.claimed ||= {};
   for(const [key,value] of Object.entries(source.claimed)){
    if(IS_N(key,1,30)===null||typeof value!=='boolean')throw Error('Invalid Nightwave claimed reward');
    target.claimed[key]=value;updated++;
   }
  }
  if(source.acts){
   if(!Array.isArray(source.acts))throw Error('Nightwave Acts must be a list');
   target.acts ||= [];
   for(const act of source.acts){
    if(typeof act?.title!=='string'||!act.title.trim())continue;
    const id=String(act.id||'captured:'+slug(act.title)),record=target.acts.find(a=>a.id===id)||{id,title:act.title,type:act.type||'Weekly',done:false};
    for(const key of ['progress','target','reputation'])if(IS_HAS(act,key)){const n=IS_N(act[key],0,1000000);if(n===null)throw Error('Invalid Nightwave Act '+key);record[key]=n;}
    if(IS_HAS(act,'done')){if(typeof act.done!=='boolean')throw Error('Invalid Act completion');record.done=act.done;}
    if(!target.acts.some(a=>a.id===id))target.acts.push(record);
    updated++;
   }
  }
  target.checkedAt=j.capturedAt||new Date().toISOString();
 }
 for(const obj of j.equipment||[]){
  if(!obj||typeof obj.name!=='string'||typeof obj.category!=='string')continue;
  const id=ek(obj.category,obj.name),old=player.equipment[id]||{name:obj.name,category:obj.category};
  for(const key of ['owned','blueprint'])if(IS_HAS(obj,key)){
   if(typeof obj[key]!=='boolean')throw Error('Invalid equipment '+key+' for '+obj.name);
   old[key]=obj[key];updated++;
  }
  old.inventoryCheckedAt=j.capturedAt||new Date().toISOString();
  player.equipment[id]=old;
 }
 player.meta ||= {};
 player.meta.lastInventorySync={at:new Date().toISOString(),capturedAt:j.capturedAt||null,sections:Object.keys(j).filter(k=>['arcanes','shards','syndicates','nightwave','equipment'].includes(k)),records:updated};
 player.meta.lastUpdated=new Date().toISOString();
 return updated;
}
const IS_OLD_SETTINGS=settingsPage;
function isMergeSection(){
 let s='';
 s+='<section class="panel"><h2>Merge a verified inventory or game-progress update</h2><p class="muted tiny">Import a reviewed Companion-app inventory capture or in-game progress confirmation. The preview shows only fields being changed. Unmentioned equipment, mods, missions, quests, notes and other records are preserved. This is <strong>not</strong> a full-profile restore.</p>';
 s+='<input type="file" id="isPatchFile" accept=".json,application/json" style="display:none"><button class="button gold" data-is-action="browse">Choose verified update JSON</button>';
 if(IS_PENDING){
  const rows=isPreview(IS_PENDING);
  s+='<div class="notice"><strong>Ready to review:</strong> '+rows.length+' observed changes from '+h(IS_FILE_NAME)+(IS_PENDING.capturedAt?' · '+h(IS_PENDING.capturedAt):'')+'. Nothing has been applied yet.</div>';
  s+='<div class="tablewrap"><table class="data"><thead><tr><th>Area</th><th>Item</th><th>Saved</th><th>Incoming</th></tr></thead><tbody>';
  for(const x of rows.slice(0,150))s+='<tr>'+x.map(v=>'<td>'+h(v)+'</td>').join('')+'</tr>';
  s+='</tbody></table></div>';
  if(rows.length>150)s+='<p class="muted tiny">Showing first 150 changes; all verified patch fields will be applied.</p>';
  s+='<p class="helptext">A private backup is downloaded before this merge. Unseen records are not deleted, and already applied updates will not run twice. Apply only changes verified against the game or Companion recording.</p>';
  s+='<button class="button gold" data-is-action="apply">Back up & apply verified values</button> <button class="button small" data-is-action="cancel">Cancel</button>';
 }
 s+='</section>';
 return s;
}
settingsPage=function(){return IS_OLD_SETTINGS()+isMergeSection();};
function inventoryPage(){
 const actions=button('Back to Command Centre','goto','data-target="overview"','small')+' '+button('Settings','goto','data-target="settings"','small');
 return title('Import updates','Safely merge verified Companion inventory and in-game progression',actions)+statusNotice()+isMergeSection();
}
NAV.splice(NAV.findIndex(x=>x[0]==='settings'),0,['inventory','⇧','Import inventory']);
document.addEventListener('DOMContentLoaded',()=>{
 if(location.hash==='#inventory')go('inventory');
});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-is-action]');if(!b)return;
 if(b.dataset.isAction==='browse'){document.getElementById('isPatchFile')?.click();return;}
 if(b.dataset.isAction==='cancel'){IS_PENDING=null;IS_FILE_NAME='';render();return;}
 if(b.dataset.isAction==='apply'){
  if(!IS_PENDING||!state.profileImported){toast('Restore your profile and select a patch first',true);return;}
  const count=isPreview(IS_PENDING).length;
  if(!count){toast('No verified records to merge',true);return;}
  if(!confirm('Apply '+count+' observed inventory changes to this browser profile? A private backup will be downloaded first. Other progress is retained.'))return;
  const before=JSON.parse(JSON.stringify(state.profile));
  try{
   /* validate against a private clone before touching the active profile */
   const real=state.profile;state.profile=JSON.parse(JSON.stringify(before));
   let result;
   try{result=isApply(IS_PENDING)}catch(err){state.profile=real;throw err;}
   state.profile=real;
   fileDownload('Tenno_Arsenal_Pre_Inventory_Update_'+today()+'.json',before);
   try{result=isApply(IS_PENDING);persist();}
   catch(err){state.profile=before;persist();throw err;}
   IS_PENDING=null;IS_FILE_NAME='';render();toast(result+' inventory fields updated; other progress preserved');
  }catch(err){toast('Update cancelled: '+err.message,true);}
 }
});
document.addEventListener('change',e=>{
 if(e.target.id!=='isPatchFile')return;
 const f=e.target.files?.[0];if(!f)return;
 if(f.size>5000000){toast('Patch file too large',true);e.target.value='';return;}
 const reader=new FileReader();
 reader.onload=()=>{
  try{IS_PENDING=isValidate(JSON.parse(reader.result));IS_FILE_NAME=f.name;render();toast('Review the changes before applying');}
  catch(err){IS_PENDING=null;toast('Invalid inventory update: '+err.message,true);}
 };
 reader.readAsText(f);e.target.value='';
});
if(state.page==='settings'||state.page==='inventory')render();
