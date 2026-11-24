'use strict';
/* Tenno Arsenal / Mastery Audit.
 * Rules and public reference constants only; all personal states are browser-local.
 * Distinguishes the previous recorded XP baseline, current estimated XP and official verified XP.
 * No assumption that a "mastered" checkbox proves rank 40 or a planet checkbox proves all nodes.
 */
const M_REGION=[
 ['Earth',308],['Venus',1269],['Mercury',1049],['Mars',1777],['Phobos',3274],
 ['Ceres',2356],['Jupiter',2956],['Europa',1718],['Saturn',2656],['Uranus',1709],
 ['Neptune',1803],['Pluto',1572],['Eris',1561],['Sedna',3511]
];
const M_CATEGORIES=['Warframes','Primary','Secondary','Melee','Companions','Adversary Weapons','Robotic Weapons','Vehicles','Necramechs','Arch-Guns','Arch-Melees','Amps','Modular'];
const M_NOTE='Warframe awards 100 mastery per weapon, prism, kitgun chamber or Zaw strike rank; 200 per frame, companion, vehicle or Necramech rank; 1,500 per Intrinsic rank. Mission and junction rewards vary by node. Previously recorded planet totals are estimates, not proof that every individual node is done.';
const M_REF='https://wiki.warframe.com/w/Mastery_Rank';
function mModel(){
 const g=pModel();
 g.masteryAudit ||= {};
 const a=g.masteryAudit;
 a.official ||= {total:null,equipment:null,normal:null,steel:null,railjack:null,drifter:null,checkedAt:null};
 a.nodeXp ||= {normal:{},steel:{}};
 a.nodeXp.normal ||= {};a.nodeXp.steel ||= {};
 return a;
}
function mHas(v){return v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));}
function mNum(v){return mHas(v)?Math.max(0,Math.floor(Number(v))):null}
function mRankInfo(r){
 const name=(r.name||'').trim(),type=r.category||'';
 if(type==='Amps'&&name.toLowerCase()==='amp')return {cap:0,rate:0,kind:'Non-mastery profile entry'};
 if(type==='Necramechs')return {cap:40,rate:200,kind:'Necramech — 40 ranks'};
 if(type==='Adversary Weapons'||name==='Paracesis'||/^(Kuva|Tenet|Coda)\s/i.test(name)||/^Dual Coda /i.test(name))return {cap:40,rate:100,kind:'Overlevelled weapon — 40 ranks'};
 if(['Warframes','Companions','Vehicles'].includes(type))return {cap:30,rate:200,kind:'200 XP per earned rank'};
 return {cap:30,rate:100,kind:'100 XP per earned rank'};
}
function mItemEarned(r,all){
 const rule=mRankInfo(r),v=r.masteryEarnedRank;
 if(rule.cap===0)return {rank:0,xp:0,rule,verified:false,reason:'Non-mastery profile entry'};
 if(r.category==='Amps'&&r.name==='Mote Amp'){
  const clone=all.some(x=>x.category==='Amps'&&x.name==='Mote Prism'&&x.mastered);
  if(clone)return {rank:0,xp:0,rule,verified:false,reason:'Mote Amp / Mote Prism duplicated — check actual XP'};
 }
 if(mHas(v)){
  const rank=Math.min(rule.cap,mNum(v));
  return {rank,xp:rank*rule.rate,rule,verified:true,reason:'Earned rank entered explicitly'};
 }
 const rank=r.mastered?Math.min(rule.cap,30):0;
 return {rank,xp:rank*rule.rate,rule,verified:rule.cap===30&&!!r.mastered,reason:rule.cap>30&&r.mastered?'Mastered checkbox proves at least 30, not rank 40':r.mastered?'Mastered checkbox, assumed rank 30':'No mastery rank recorded'};
}
function mIntrinsic(g,category,official){
 const names=P_INTR[category],values=names.map(name=>g.intrinsics[category]?.[name]);
 const known=values.filter(v=>mHas(v)).length,verifiedAll=known===names.length;
 const legacyRaw=state.profile.progress?.intrinsics?.[category],legacy=mNum(legacyRaw);
 const exact=values.reduce((s,v)=>s+(mHas(v)?Math.min(10,mNum(v)):0),0);
 const recorded=verifiedAll?exact:legacy!==null?legacy:exact;
 return {xp:mHas(official)?mNum(official):recorded*1500,ranks:recorded,known,total:names.length,source:mHas(official)?'Official XP':verifiedAll?'All individual tracks':legacy!==null?'Historical rank total':'Partially recorded ranks',provisional:!mHas(official)&&!verifiedAll};
}
function mStar(g,mode,a){
 const legacy=mode==='normal'?'starChart':'steelPath';
 const official=mode==='normal'?a.official.normal:a.official.steel;
 const regionMap=state.profile.progress?.[legacy]||{};
 let historical=0,checked=0;
 for(const [region,weight] of M_REGION){
  if(regionMap[region]===true){historical+=weight;checked++;}
 }
 const completed=Object.entries(g.nodes?.[mode]||{}).filter(([,v])=>v==='completed');
 const refs=new Map([...(P_UI.nodes||[]),...(g.nodes.custom||[])].map(node=>[node.id,node]));
 let nodeXp=0,unvalued=[],nodeRows=[],notCovered=0;
 for(const [id] of completed){
  const node=refs.get(id),region=node?.planet||'',covered=regionMap[region]===true;
  if(covered)continue;
  notCovered++;nodeRows.push({id,name:node?.name||id,planet:region});
  if(mHas(a.nodeXp[mode][id]))nodeXp+=mNum(a.nodeXp[mode][id]);
  else unvalued.push({id,name:node?.name||id,planet:region});
 }
 return {xp:mHas(official)?mNum(official):historical+nodeXp,source:mHas(official)?'Verified game-profile XP':checked?'Historical region XP + individually valued nodes':'Individually valued nodes only',historical,checked,completedCount:completed.length,notCovered,nodeRows,unvalued,usedOfficial:mHas(official),provisional:!mHas(official)};
}
function mRankTarget(total){
 if(!Number.isFinite(total)||total<0)return {rank:'—',next:'—',remaining:0};
 const mr=Math.min(30,Math.floor(Math.sqrt(total/2500)));
 if(total<2250000)return {rank:'MR'+mr,next:'MR'+(mr+1),remaining:2500*(mr+1)*(mr+1)-total};
 const lr=Math.max(0,Math.floor((total-2250000)/147500));
 return {rank:lr?'LR'+lr:'MR30',next:'LR'+(lr+1),remaining:2250000+(lr+1)*147500-total};
}
function mCalc(){
 const g=pModel(),a=mModel(),all=mergeEquip(),cats={};
 const special=[],nonMastery=[],missing=[],uncertain=[];
 for(const key of M_CATEGORIES)cats[key]={count:0,mastered:0,xp:0,fullPotential:0,unranked:0};
 let earned=0,paracesis=null;
 for(const r of all){
  const rule=mRankInfo(r),e=mItemEarned(r,all),cat=r.category||'Other';
  const c=cats[cat] ||= {count:0,mastered:0,xp:0,fullPotential:0,unranked:0};
  c.count++;c.mastered+=r.mastered?1:0;c.xp+=e.xp;c.fullPotential+=rule.cap*rule.rate;
  if(!r.mastered)c.unranked++;
  earned+=e.xp;
  if(rule.cap===0&&r.mastered)nonMastery.push(r);
  if(rule.cap===40&&(r.mastered||mHas(r.masteryEarnedRank)))special.push({...r,calc:e});
  if(rule.cap===40&&r.mastered&&!mHas(r.masteryEarnedRank))uncertain.push({...r,calc:e});
  if(r.name==='Paracesis')paracesis={...r,calc:e};
  if(rule.cap&&e.rank<rule.cap)missing.push({...r,calc:e,remaining:(rule.cap-e.rank)*rule.rate});
 }
 const rail=mIntrinsic(g,'Railjack',a.official.railjack),drifter=mIntrinsic(g,'Drifter',a.official.drifter);
 const normal=mStar(g,'normal',a),steel=mStar(g,'steel',a);
 const sum=earned+rail.xp+drifter.xp+normal.xp+steel.xp;
 const officialTotal=mNum(a.official.total),sheet=mNum(state.profile.meta?.previousMasteryXP??state.profile.meta?.masteryXP);
 const derived=mRankTarget(officialTotal??sum);
 missing.sort((a,b)=>b.remaining-a.remaining||a.name.localeCompare(b.name));
 const sheetDelta=sheet===null?null:sum-sheet,gameDelta=officialTotal===null?null:sum-officialTotal;
 const issues=[];
 if(nonMastery.length)issues.push({level:'high',title:'Non-mastery Amp entry',text:nonMastery.map(x=>x.name).join(', ')+' is marked mastered but grants no mastery. A previous estimate incorrectly credited 3,000 XP for each.'});
 if(uncertain.length)issues.push({level:'high',title:'Overlevelled items need rank confirmation',text:uncertain.map(x=>x.name).join(', ')+'. The audit only credits rank 30 until you record the highest rank you actually earned.'});
 if(normal.provisional)issues.push({level:'warn',title:'Normal star-chart XP remains provisional',text:normal.checked+' of 14 previously recorded destination checks give '+normal.historical.toLocaleString()+' XP. This does not prove 2026 node completeness. Enter the XP from your in-game profile for an exact total.'});
 if(steel.provisional)issues.push({level:'warn',title:'Steel Path cannot be verified from planet checks alone',text:'The saved profile has '+steel.checked+' destinations marked complete. Recorded individual nodes without exact XP are not valued automatically.'});
 if(normal.unvalued.length||steel.unvalued.length)issues.push({level:'high',title:'Completed mission nodes without verified XP',text:(normal.unvalued.length+steel.unvalued.length)+' completed node records lie outside historically completed regions and lack a confirmed mastery reward.'});
 if(rail.provisional||drifter.provisional)issues.push({level:'warn',title:'Intrinsics still rely on older rank totals',text:'Record all nine individual tracks, or enter official Railjack and Drifter Intrinsic mastery totals.'});
 if(all.some(x=>x.category==='Amps'&&x.name==='Mote Amp'&&x.mastered)&&all.some(x=>x.category==='Amps'&&x.name==='Mote Prism'&&x.mastered))issues.push({level:'high',title:'Duplicate Mote Amp / Mote Prism entries',text:'Only one legitimate mastery progression should count for the Mote Amp. Check your actual Amp XP.'});
 if(gameDelta!==null&&gameDelta!==0)issues.push({level:'high',title:'Calculated XP differs from your game profile',text:'Calculated minus in-game = '+gameDelta.toLocaleString()+' XP. Check individual ranks, missions and intrinsics before changing any recorded progress.'});
 return {all,cats,earned,rail,drifter,normal,steel,sum,sheet,sheetDelta,officialTotal,gameDelta,derived,issues,missing,special,nonMastery,uncertain,model:a,starModel:g};
}
function mIn(v){return mHas(v)?String(mNum(v)):'';}
function mMetric(label,value,detail){
 return '<div class="metric"><div class="lbl">'+h(label)+'</div><div class="val">'+h(value)+'</div><div class="note">'+h(detail)+'</div></div>';
}
function mLine(label,value,detail=''){
 return '<div class="mLine"><span><strong>'+h(label)+'</strong>'+ (detail?'<small class="muted">'+h(detail)+'</small>':'')+'</span><b>'+Number(value).toLocaleString()+' XP</b></div>';
}
function masteryPage(){
 const x=mCalc(),c=x.cats,a=x.model;
 let s=title('Mastery audit','Reconstruct your mastery from earned equipment ranks, missions and Intrinsics',button('Backup before editing','backup','','small')+' '+button('View equipment','goto','data-target="equipment"','small'));
 s+=statusNotice();
 s+='<div class="notice"><strong>Two different numbers:</strong> <em>Calculated XP</em> uses the ranks and progress recorded in Tenno Arsenal, with conservative rank-40 assumptions. <em>Official XP</em> is whatever you verify in your in-game player profile. Previously recorded totals are comparison points, not authoritative live game totals.</div>';
 s+='<div class="cards mStats">';
 s+=mMetric('Calculated mastery',x.sum.toLocaleString(),'Provisional • from saved records');
 s+=mMetric('Earlier tracked mastery',x.sheet===null?'—':x.sheet.toLocaleString(),'Previous saved XP figure');
 s+=mMetric('Official game mastery',x.officialTotal===null?'Not entered':x.officialTotal.toLocaleString(),'Verified from your in-game profile');
 s+=mMetric('Next mastery threshold',x.derived.next,(x.derived.remaining).toLocaleString()+' XP remaining • based on '+(x.officialTotal!==null?'official XP':'calculated XP'));
 s+='</div>';
 if(a.official.breakdown&&Object.keys(a.official.breakdown).length){s+='<section class="panel"><div class="editline"><div><h2>Official in-game mastery breakdown</h2><p class="muted tiny">Exact category XP from the game profile. These values are independent of the estimated item-by-item reconstruction.</p></div></div><div class="tablewrap"><table class="data"><thead><tr><th>Category</th><th>Verified XP</th></tr></thead><tbody>';for(const [name,value] of Object.entries(a.official.breakdown))s+='<tr><td class="name">'+h(name)+'</td><td>'+Number(value).toLocaleString()+'</td></tr>';s+='</tbody></table></div><div class="mTotal"><strong>Total confirmed mastery</strong><strong>'+Object.values(a.official.breakdown).reduce((n,v)=>n+Number(v),0).toLocaleString()+' XP</strong></div></section>';}
 s+='<div class="mColumns"><section class="panel"><h2>XP by source</h2>';
 s+=mLine('Equipment',x.earned,'Mastery earned from equipment ranks');
 s+=mLine('Normal missions & junctions',x.normal.xp,x.normal.source);
 s+=mLine('Steel Path missions & junctions',x.steel.xp,x.steel.source);
 s+=mLine('Railjack Intrinsics',x.rail.xp,x.rail.source);
 s+=mLine('Drifter Intrinsics',x.drifter.xp,x.drifter.source);
 s+='<div class="mTotal"><strong>Total reconstructed XP</strong><strong>'+x.sum.toLocaleString()+'</strong></div>';
 s+='<p class="helptext">'+h(M_NOTE)+'</p></section>';
 s+='<section class="panel"><h2>Reconciliation</h2>';
 s+='<p class="muted tiny">A difference is not automatically missing game content. It can mean outdated saved progress, an incorrect mastery flag, a partial rank, a bugged profile entry or incomplete mission records.</p>';
 s+=x.sheetDelta===null?'<div class="mCompare">No previously saved XP total available.</div>':'<div class="mCompare"><strong>Versus saved total</strong><span class="'+(x.sheetDelta?'mWarning':'mGood')+'">'+(x.sheetDelta>0?'+':'')+x.sheetDelta.toLocaleString()+' XP</span></div>';
 s+=x.gameDelta===null?'<div class="mCompare"><strong>Versus official profile</strong><span class="muted">Not entered yet</span></div>':'<div class="mCompare"><strong>Versus official profile</strong><span class="'+(x.gameDelta?'mWarning':'mGood')+'">'+(x.gameDelta>0?'+':'')+x.gameDelta.toLocaleString()+' XP</span></div>';
 s+='<p class="muted tiny">The prior saved total is '+(x.sheetDelta===null?'not recorded':'recorded as '+x.sheet.toLocaleString()+' XP')+'. Its 14 planet-region mission weights total 27,519 XP; that estimate is not a current per-node XP calculation.</p>';
 const sourceCompare=[['Equipment',x.earned,a.official.equipment],['Normal missions',x.normal.xp,a.official.normal],['Steel Path',x.steel.xp,a.official.steel],['Railjack Intrinsics',x.rail.xp,a.official.railjack],['Drifter Intrinsics',x.drifter.xp,a.official.drifter]];
 if(sourceCompare.some(row=>mHas(row[2]))){
  s+='<h3>Official XP differences by source</h3><div class="mSourceCompare">';
  for(const [label,calc,official] of sourceCompare){
   if(!mHas(official))continue;
   const delta=calc-mNum(official);
   s+='<div class="mCompare"><strong>'+h(label)+'</strong><span class="'+(delta?'mWarning':'mGood')+'">'+(delta>0?'+':'')+delta.toLocaleString()+' XP</span></div>';
  }
  s+='</div>';
 }
 s+='<a href="'+M_REF+'" target="_blank" rel="noopener">Reference: Warframe mastery calculation ↗</a></section></div>';
 s+='<section class="panel"><h2>Check against your in-game profile</h2><p class="muted tiny">Enter the XP shown in your game profile. Blank means unknown, including separate mastery categories. These fields never overwrite your imported mastery number or equipment history.</p><div class="mInputs">';
 const inputs=[
 ['total','Official total mastery XP'],['equipment','Equipment mastery XP (if shown)'],
 ['normal','Normal star-chart mastery XP'],['steel','Steel Path mastery XP'],
 ['railjack','Railjack Intrinsics mastery XP'],['drifter','Drifter Intrinsics mastery XP']
 ];
 for(const [key,label] of inputs)s+='<label>'+h(label)+'<input class="field" type="number" min="0" step="1" placeholder="Unknown" value="'+mIn(a.official[key])+'" data-m-official="'+key+'"></label>';
 s+='</div><div class="mVerify">Last game-profile verification: <strong>'+(a.official.checkedAt?h(new Date(a.official.checkedAt).toLocaleDateString()):'Not recorded')+'</strong> <button class="button small" data-m-mark-profile="1">Mark profile checked now</button></div>';
 s+='</section>';
 s+='<section class="panel"><div class="editline"><div><h2>Items that require checking</h2><p class="muted tiny">Priority order: calculations that can distort XP first, then missing history.</p></div><span class="pill gold">'+x.issues.length+' findings</span></div>';
 if(x.issues.length){s+='<div class="mIssues">';for(const issue of x.issues)s+='<div class="mIssue '+(issue.level==='high'?'mCritical':'')+'"><strong>'+h(issue.title)+'</strong><p>'+h(issue.text)+'</p></div>';s+='</div>';}
 else s+=empty('No flagged issues','The audit currently finds no exceptions in the saved data.');
 s+='</section>';
 s+='<section class="panel"><h2>Equipment XP by category</h2><p class="muted tiny">A mastered checkbox counts as rank 30 unless you explicitly record a higher earned rank. Only unique rank progression earns mastery; duplicate builds and Forma releveling do not repeat it.</p><div class="tablewrap"><table class="data"><thead><tr><th>Category</th><th>Mastered items</th><th>Calculated XP</th><th>Remaining theoretical XP</th></tr></thead><tbody>';
 for(const key of M_CATEGORIES){const row=c[key];if(!row||!row.count)continue;s+='<tr><td class="name">'+h(key)+'</td><td>'+row.mastered+' / '+row.count+'</td><td>'+row.xp.toLocaleString()+'</td><td>'+Math.max(0,row.fullPotential-row.xp).toLocaleString()+'</td></tr>';}
 s+='</tbody></table></div><p class="helptext">Theoretical remaining XP includes catalogue entries that could be unavailable, duplicated, exclusive or newly released. It is <strong>not</strong> a guaranteed farmable XP total.</p></section>';
 s+='<section class="panel"><h2>Rank-40 equipment audit</h2><p class="muted tiny">Paracesis, Kuva/Tenet/Coda weapons and Necramechs can earn mastery above rank 30. Choose the <strong>highest rank you have ever earned</strong>. Leaving a rank blank conservatively credits only 30 for mastered items. The previous estimate assumed Paracesis had reached rank 40.</p>';
 if(!x.special.length){s+=empty('No rank-40 mastered equipment recorded','Once you mark these items mastered, they appear here.');}
 else {s+='<div class="tablewrap"><table class="data"><thead><tr><th>Equipment</th><th>Earned rank</th><th>XP counted</th><th>Potential above 30</th></tr></thead><tbody>';
 for(const row of x.special){
  const key=ek(row.category,row.name),v=row.masteryEarnedRank,rule=row.calc.rule;
  const opts=[['','Unverified (use rank 30)'],...Array.from({length:11},(_,i)=>[String(30+i),String(30+i)])];
  s+='<tr><td class="name">'+h(row.name)+'<small class="muted">'+h(row.category)+'</small></td><td>'+pDrop(opts,mHas(v)?String(v):'','data-m-rank="'+enc(key)+'"')+'</td><td>'+row.calc.xp.toLocaleString()+'</td><td>'+Math.max(0,(rule.cap-row.calc.rank)*rule.rate).toLocaleString()+'</td></tr>';
 }
 s+='</tbody></table></div>';}
 s+='</section>';
 const ownedUnfinished=x.all.filter(item=>item.owned&&!item.mastered&&mRankInfo(item).cap>0);
 if(ownedUnfinished.length){
  s+='<section class="panel"><h2>Owned equipment still gaining mastery</h2><p class="muted tiny">Record the highest earned rank, even if Forma has since reset the current rank. Blank counts as unverified.</p><div class="tablewrap"><table class="data"><thead><tr><th>Equipment</th><th>Earned rank</th><th>XP counted</th><th>XP remaining</th></tr></thead><tbody>';
  for(const item of ownedUnfinished){
   const calc=mItemEarned(item,x.all),rule=calc.rule,options=[['','Unverified'],...Array.from({length:rule.cap+1},(_,n)=>[String(n),String(n)])];
   s+='<tr><td class="name">'+h(item.name)+'</td><td>'+pDrop(options,mHas(item.masteryEarnedRank)?String(item.masteryEarnedRank):'','data-m-rank="'+enc(ek(item.category,item.name))+'"')+'</td><td>'+calc.xp.toLocaleString()+'</td><td>'+Math.max(0,(rule.cap-calc.rank)*rule.rate).toLocaleString()+'</td></tr>';
  }
  s+='</tbody></table></div></section>';
 }
 s+='<section class="panel"><h2>Mission mastery verification</h2><p class="muted tiny">The saved profile includes 14 planet-level XP estimates. For missions added later or missions not covered by those historical region totals, individual node completion is not enough: its awarded mastery XP must be known. Use your game-profile XP above for the most reliable result.</p>';
 s+='<div class="mColumns"><div><strong>Normal star chart</strong><p class="muted tiny">'+x.normal.checked+' region totals available · '+x.normal.historical.toLocaleString()+' estimated XP · '+x.normal.completedCount+' individual nodes recorded</p></div><div><strong>Steel Path</strong><p class="muted tiny">'+x.steel.checked+' region totals available · '+x.steel.historical.toLocaleString()+' estimated XP · '+x.steel.completedCount+' individual nodes recorded</p></div></div>';
 const nodeRows=[...x.normal.nodeRows.map(y=>({...y,mode:'normal'})),...x.steel.nodeRows.map(y=>({...y,mode:'steel'}))];
 if(nodeRows.length){
 s+='<div class="tablewrap"><table class="data"><thead><tr><th>Completed node</th><th>Chart</th><th>Verified mastery XP</th></tr></thead><tbody>';
 for(const row of nodeRows.slice(0,80))s+='<tr><td class="name">'+h(row.name)+'<small class="muted">'+h(row.planet||'Unknown planet')+'</small></td><td>'+h(row.mode==='normal'?'Normal':'Steel Path')+'</td><td><input class="field mSmall" type="number" min="0" step="1" placeholder="Unknown" data-m-node="'+h(row.mode+'|'+row.id)+'" value="'+mIn(a.nodeXp[row.mode][row.id])+'"></td></tr>';
 s+='</tbody></table></div>';
 }
 s+='<p class="helptext">Warning: Normal/Steel mission XP cannot be calculated exactly from node names or a planet checkbox alone. A future live node-XP dataset could improve this. The 27,519 XP region estimate may differ from currently obtainable mission XP.</p></section>';
 s+='<section class="panel"><h2>Potential next mastery gains</h2><p class="muted tiny">Listed in theoretical XP order, not in order of farming difficulty. Incomplete and unreleased items must be verified before treating them as available.</p><div class="tablewrap"><table class="data"><thead><tr><th>Equipment</th><th>Current credited XP</th><th>Remaining XP</th><th></th></tr></thead><tbody>';
 for(const row of x.missing.slice(0,35))s+='<tr><td class="name">'+h(row.name)+'<small class="muted">'+h(row.category)+'</small></td><td>'+row.calc.xp.toLocaleString()+'</td><td>'+row.remaining.toLocaleString()+'</td><td><button class="button small" data-m-open="'+enc(ek(row.category,row.name))+'">View equipment</button></td></tr>';
 s+='</tbody></table></div></section>';
 return s;
}
NAV.splice(1,0,['mastery','∑','Mastery audit']);
const M_OVERVIEW=overview;
overview=function(){
 const base=M_OVERVIEW();
 if(!state.profileImported)return base;
 const a=mCalc(),which=a.officialTotal!==null?'in-game verified':'provisional',delta=a.gameDelta??a.sheetDelta;
 return base+'<section class="panel"><div class="editline"><div><h2>Mastery audit</h2><p class="muted tiny">Independent calculation from your mastered items, mission history and Intrinsics. The number is '+h(which)+' until it matches your in-game profile.</p></div><button class="button gold" data-action="goto" data-target="mastery">Open mastery audit →</button></div><div class="cards">'+mMetric('Reconstructed XP',a.sum.toLocaleString(),'Check flagged entries before relying on this')+mMetric('To '+a.derived.next,a.derived.remaining.toLocaleString()+' XP','Based on '+(a.officialTotal===null?'provisional calculation':'verified profile'))+mMetric('Audit flags',String(a.issues.length),'Found issues requiring attention')+'</div></section>';
};
document.addEventListener('click',ev=>{
 const t=ev.target.closest('[data-m-open],[data-m-mark-profile]');if(!t)return;
 if(t.dataset.mOpen){equipEditor(dec(t.dataset.mOpen));return;}
 if(t.dataset.mMarkProfile){
  mModel().official.checkedAt=new Date().toISOString();state.profile.meta.lastUpdated=new Date().toISOString();persist();render();toast('Game profile review date recorded');
 }
});
document.addEventListener('change',ev=>{
 const t=ev.target;if(!t.dataset.mOfficial&&!t.dataset.mRank&&!t.dataset.mNode)return;
 const a=mModel();let changed=false;
 if(t.dataset.mOfficial){
  a.official[t.dataset.mOfficial]=t.value===''?null:mNum(t.value);changed=true;
 }
 if(t.dataset.mRank){
  const key=dec(t.dataset.mRank),r=state.profile.equipment[key];
  if(r){if(t.value==='')delete r.masteryEarnedRank;else r.masteryEarnedRank=Math.max(0,Math.min(mRankInfo(r).cap,mNum(t.value)));changed=true;}
 }
 if(t.dataset.mNode){
  const [mode,...rest]=t.dataset.mNode.split('|'),id=rest.join('|');
  if(['normal','steel'].includes(mode)){
   if(t.value==='')delete a.nodeXp[mode][id];else a.nodeXp[mode][id]=mNum(t.value);
   changed=true;
  }
 }
 if(changed){state.profile.meta.lastUpdated=new Date().toISOString();persist();render();toast('Mastery audit updated in your private profile');}
});
const M_STYLE=document.createElement('style');
M_STYLE.textContent='.mStats{grid-template-columns:repeat(4,minmax(0,1fr))}.mColumns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin:17px 0}.mColumns>.panel{margin:0}.mLine,.mCompare{display:flex;gap:10px;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding:10px 0}.mLine span{display:flex;flex-direction:column;gap:3px}.mLine small{font-size:11px}.mLine b{font-size:13px;white-space:nowrap}.mTotal{display:flex;justify-content:space-between;padding:16px 0;color:var(--gold);gap:12px}.mCompare strong{font-size:13px}.mCompare span{font-weight:700}.mWarning{color:var(--gold)}.mGood{color:var(--green)}.mInputs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin-top:15px}.mInputs label{display:flex;flex-direction:column;gap:7px;font-size:12px;color:var(--muted)}.mVerify{margin:14px 0 0;display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-size:12px;color:var(--muted)}.mIssues{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin-top:13px}.mIssue{padding:13px;border-left:3px solid #64778c;background:var(--raised);border-radius:5px}.mIssue.mCritical{border-color:var(--gold)}.mIssue strong{font-size:13px}.mIssue p{margin:5px 0 0;color:var(--muted);font-size:12px}.mSmall{width:135px;max-width:100%}.data td small{display:block;font-size:11px}.mStats{margin-bottom:15px}@media(max-width:1100px){.mStats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.mColumns,.mInputs,.mIssues{grid-template-columns:1fr}.mStats{grid-template-columns:repeat(2,minmax(0,1fr))}.mLine b{white-space:normal;text-align:right}}';
document.head.append(M_STYLE);
if(state.page==='overview')render();
