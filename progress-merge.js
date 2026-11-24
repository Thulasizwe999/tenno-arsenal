'use strict';
/* Game progress importer: public merge logic only, without personal data.
   Complements the existing verified inventory-patch import. */
const PG_ORIG_VALIDATE=isValidate,PG_ORIG_PREVIEW=isPreview,PG_ORIG_APPLY=isApply;
function pgAlreadyImported(j){
 return !!(j.captureId&&state.profile?.meta?.appliedProgressPatches?.includes(j.captureId));
}
function pgVerify(j){
 const p=j.gameProgress;
 if(!p)return;
 if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Game progress must be an object');
 if(!p.mastery||!p.originSummary||!p.focus||!p.intrinsics||!p.missionChanges)throw Error('Incomplete game progress snapshot');
 if(!Number.isSafeInteger(p.mastery.rank)||p.mastery.rank<0||p.mastery.rank>100)throw Error('Invalid Mastery Rank');
 if(!Number.isSafeInteger(p.mastery.totalXp)||p.mastery.totalXp<0)throw Error('Invalid mastery XP total');
 if(!Number.isSafeInteger(p.mastery.xpToNext)||p.mastery.xpToNext<0)throw Error('Invalid mastery remaining XP');
 if(!p.mastery.breakdown||typeof p.mastery.breakdown!=='object')throw Error('Missing mastery category breakdown');
 let sum=0;
 for(const v of Object.values(p.mastery.breakdown)){
  if(!Number.isSafeInteger(v)||v<0)throw Error('Invalid mastery breakdown XP');sum+=v;
 }
 if(sum!==p.mastery.totalXp)throw Error('Mastery category breakdown does not equal the total');
 const totals=p.originSummary;
 for(const mode of ['normal','steel']){
  const x=totals[mode];
  if(!x||['completed','total','xp','maxXp'].some(k=>!Number.isSafeInteger(x[k])||x[k]<0))throw Error('Invalid Origin '+mode+' summary');
  if(x.completed>x.total||x.xp>x.maxXp)throw Error('Origin progress exceeds its maximum');
 }
 for(const school of Object.keys(p.focus)){
  if(!P_SCHOOLS.includes(school))throw Error('Unknown Focus school '+school);
  const x=p.focus[school];
  if(typeof x?.unlocked!=='boolean'||typeof x?.active!=='boolean'||!Number.isSafeInteger(x.available)||x.available<0)throw Error('Invalid Focus school '+school);
 }
 for(const [mode,tracks] of Object.entries(p.intrinsics)){
  if(!P_INTR[mode])throw Error('Unknown Intrinsics track category');
  for(const [name,rank] of Object.entries(tracks)){
   if(!P_INTR[mode].includes(name)||!Number.isInteger(rank)||rank<0||rank>10)throw Error('Invalid '+mode+' '+name+' Intrinsic rank');
  }
 }
 if(p.intrinsicsUnspent)for(const value of Object.values(p.intrinsicsUnspent))if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid unspent Intrinsics');
 if(p.installedShards!==undefined&&!Array.isArray(p.installedShards))throw Error('Installed shards must be a list');
 const changes=p.missionChanges;
 if(!Array.isArray(changes.completeSteelOriginPlanets)||changes.completeSteelOriginPlanets.some(name=>typeof name!=='string'||!name.trim()))throw Error('Invalid Steel Path planet selection');
 if(typeof changes.completeNormalRailjack!=='boolean')throw Error('Invalid Railjack completion instruction');
 if(!j.captureId||!/^[-a-zA-Z0-9_:]{8,100}$/.test(j.captureId))throw Error('Game progress snapshot needs a unique capture ID');
}
isValidate=function(j){const out=PG_ORIG_VALIDATE(j);pgVerify(out);return out;};
isPreview=function(j){
 if(pgAlreadyImported(j))return [];
 const out=PG_ORIG_PREVIEW(j),p=j.gameProgress;
 if(!p)return out;
 const master=state.profile.meta||{};
 out.push(['Mastery Rank','Official profile',master.masteryRank??'Unknown',p.mastery.rank]);
 out.push(['Mastery XP','Official total',master.masteryXP??'Unknown',p.mastery.totalXp]);
 out.push(['Next rank','XP remaining',master.masteryToNext??'Unknown',p.mastery.xpToNext]);
 out.push(['Mastery','Category breakdown',Object.keys(mModel().official.breakdown||{}).length+' saved categories',Object.keys(p.mastery.breakdown).length+' confirmed categories']);
 const g=pModel();
 for(const mode of ['normal','steel']){
  const x=p.originSummary[mode],old=g.originSummary?.[mode];
  out.push(['Origin '+mode,'Official mission progress',old?old.completed+'/'+old.total:'Unknown',x.completed+'/'+x.total+' · '+x.xp+' / '+x.maxXp+' XP']);
 }
 for(const [school,info] of Object.entries(p.focus)){
  const prev=g.focus[school];
  out.push(['Focus',school,(prev.unlocked===null?'Unknown':prev.unlocked?'Unlocked':'Locked')+' · '+(prev.available??'—')+' unspent', (info.unlocked?'Unlocked':'Locked')+(info.active?' (active)':'')+' · '+info.available+' unspent']);
 }
 for(const [group,tracks] of Object.entries(p.intrinsics)){
  for(const [name,rank] of Object.entries(tracks))out.push(['Intrinsics',group+' · '+name,g.intrinsics[group]?.[name]??'Unknown',rank]);
 }
 if(p.intrinsicsUnspent)for(const [group,n] of Object.entries(p.intrinsicsUnspent))out.push(['Intrinsics',group+' points available',g.intrinsicsUnspent?.[group]??'Unknown',n]);
 if(p.installedShards)out.push(['Archon Shards','Installed on Warframes',g.shards.installed.length,p.installedShards.length]);
 const steel=p.missionChanges.completeSteelOriginPlanets;
 const eligible=pAllNodes(g).filter(n=>pChartOf(n)==='origin'&&steel.includes(n.planet));
 out.push(['Steel Path','Origin planets: '+steel.join(', '),eligible.filter(n=>g.nodes.steel[n.id]==='completed').length+' / '+eligible.length+' completed',eligible.length+' / '+eligible.length+' marked complete']);
 if(p.missionChanges.completeNormalRailjack){
  const rail=pAllNodes(g).filter(n=>pChartOf(n)==='railjack');
  out.push(['Railjack','Normal Proxima nodes',rail.filter(n=>g.nodes.normal[n.id]==='completed').length+' / '+rail.length+' completed',rail.length+' / '+rail.length+' marked complete']);
 }
 return out;
};
isApply=function(j){
 if(pgAlreadyImported(j))return 0;
 pgVerify(j);
 const hadOther=Object.keys(j).some(k=>['arcanes','shards','syndicates','nightwave','equipment'].includes(k));
 const previousInventory=state.profile.meta?.lastInventorySync;
 let count=PG_ORIG_APPLY(j);
 if(!hadOther){
  if(previousInventory===undefined)delete state.profile.meta.lastInventorySync;
  else state.profile.meta.lastInventorySync=previousInventory;
 }
 const p=j.gameProgress;if(!p)return count;
 const g=pModel(),meta=state.profile.meta;
 if(meta.masteryXP!==p.mastery.totalXp&&meta.previousMasteryXP===undefined)meta.previousMasteryXP=meta.masteryXP??null;
 meta.masteryXP=p.mastery.totalXp;
 meta.masteryRank=p.mastery.rank;
 meta.masteryToNext=p.mastery.xpToNext;
 meta.masteryVerifiedAt=j.capturedAt||new Date().toISOString();
 const official=mModel().official;
 official.total=p.mastery.totalXp;
 official.equipment=p.mastery.totalXp-(p.mastery.breakdown['Missions']||0)-(p.mastery.breakdown['The Steel Path Missions']||0)-(p.mastery.breakdown['Railjack Intrinsics']||0)-(p.mastery.breakdown['Drifter Intrinsics']||0);
 official.normal=p.mastery.breakdown['Missions']||0;
 official.steel=p.mastery.breakdown['The Steel Path Missions']||0;
 official.railjack=p.mastery.breakdown['Railjack Intrinsics']||0;
 official.drifter=p.mastery.breakdown['Drifter Intrinsics']||0;
 official.breakdown={...p.mastery.breakdown};
 official.checkedAt=j.capturedAt||new Date().toISOString();
 g.originSummary=JSON.parse(JSON.stringify(p.originSummary));
 g.originSummary.verifiedAt=j.capturedAt||new Date().toISOString();
 for(const [school,info] of Object.entries(p.focus)){
  Object.assign(g.focus[school],info);
  g.focus[school].checkedAt=j.capturedAt||new Date().toISOString();
 }
 for(const [group,tracks] of Object.entries(p.intrinsics)){
  Object.assign(g.intrinsics[group],tracks);
  if(P_INTR[group].every(name=>Number.isInteger(g.intrinsics[group][name])))state.profile.progress.intrinsics[group]=String(P_INTR[group].reduce((sum,name)=>sum+g.intrinsics[group][name],0));
 }
 g.intrinsicsUnspent ||= {};
 for(const [group,value] of Object.entries(p.intrinsicsUnspent||{}))g.intrinsicsUnspent[group]=value;
 if(p.installedShards!==undefined)g.shards.installed=JSON.parse(JSON.stringify(p.installedShards));
 const src=p.missionChanges;
 const steelNodes=pAllNodes(g).filter(n=>pChartOf(n)==='origin'&&src.completeSteelOriginPlanets.includes(n.planet));
 for(const n of steelNodes)g.nodes.steel[n.id]='completed';
 if(src.completeNormalRailjack){
  const railNodes=pAllNodes(g).filter(n=>pChartOf(n)==='railjack');
  for(const n of railNodes)g.nodes.normal[n.id]='completed';
 }
 meta.appliedProgressPatches ||= [];
 if(j.captureId&&!meta.appliedProgressPatches.includes(j.captureId))meta.appliedProgressPatches.push(j.captureId);
 meta.lastGameProgressCapture={id:j.captureId,at:j.capturedAt||new Date().toISOString(),originSteels:src.completeSteelOriginPlanets,railjackNormal:!!src.completeNormalRailjack};
 count+=Object.keys(p.mastery.breakdown).length+Object.keys(p.focus).length+Object.values(p.intrinsics).reduce((a,v)=>a+Object.keys(v).length,0)+steelNodes.length+(src.completeNormalRailjack?pAllNodes(g).filter(n=>pChartOf(n)==='railjack').length:0)+1;
 return count;
};
