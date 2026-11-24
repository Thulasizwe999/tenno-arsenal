'use strict';
/* Nightwave private profile UI and public activity feed. Personal progress never leaves this browser. */
const N_TYPES=['Daily','Weekly','Elite Weekly','Permanent Weekly','Recovered','Custom'];
const N_DEFAULT='Amir’s Shockwave';
const N_UI={feed:[],fetchedAt:null,loading:false,status:'Public Act feed not checked',type:'All',search:''};
function nData(){
 const g=pModel();
 g.nightwave ||= {season:N_DEFAULT,rank:null,prestige:null,standing:null,cred:null,claimed:{},acts:[],goal:'',checkedAt:null,archives:[]};
 const n=g.nightwave;
 n.claimed ||= {};n.acts ||= [];n.archives ||= [];
 if(n.season===undefined)n.season=N_DEFAULT;
 return n;
}
function nType(ch){
 if(ch.isPermanent)return 'Permanent Weekly';
 if(ch.isElite)return 'Elite Weekly';
 if(ch.isDaily)return 'Daily';
 return 'Weekly';
}
function nKey(a){
 return String(a.id||a.title||'').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'|'+String(a.activation||a.activatedAt||a.startAt||'').slice(0,10);
}
async function nFetch(show=false){
 if(N_UI.loading)return;
 N_UI.loading=true;N_UI.status='Checking public Nightwave Acts…';if(state.page==='progress'&&P_UI.tab==='nightwave')render();
 try {
  const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),13000);
  let data;
  try{const resp=await fetch('https://api.warframestat.us/ps4/nightwave?language=en',{signal:ctl.signal,cache:'no-store'});if(!resp.ok)throw Error('HTTP '+resp.status);data=await resp.json();}
  finally{clearTimeout(timeout);}
  const list=Array.isArray(data.activeChallenges)?data.activeChallenges:[];
  if(!list.length)throw Error('No active challenges returned');
  N_UI.feed=list.map((a,i)=>({
   id:String(a.id||a.challenge||('act-'+i)),title:String(a.title||a.name||'Unknown Act'),
   desc:String(a.desc||a.description||''),type:nType(a),
   reputation:Number(a.reputation)||0,activation:a.activation||a.activatedAt||a.startAt||'',
   expiry:a.expiry||a.expiryAt||a.expires||''
  }));
  N_UI.fetchedAt=new Date().toISOString();N_UI.status=N_UI.feed.length+' public active Acts · checked '+new Date().toLocaleString();
  if(show)toast('Current public Nightwave Acts updated');
 }catch(e){N_UI.status='Live Act feed unavailable. Previously saved Acts are still available.';if(show)toast('Could not load public Nightwave Acts',true);}
 finally{N_UI.loading=false;if(state.page==='progress'&&P_UI.tab==='nightwave')render();}
}
function nInput(key,value,placeholder,max=1000000){
 const val=value===null||value===undefined?'':String(value);
 return '<input class="field nNumber" type="number" min="0" max="'+max+'" step="1" data-n-field="'+key+'" placeholder="'+h(placeholder)+'" value="'+h(val)+'">';
}
function nActRows(n){
 const saved=n.acts.filter(a=>(N_UI.type==='All'||a.type===N_UI.type)&&(!N_UI.search||(a.title+' '+a.type+' '+a.desc).toLowerCase().includes(N_UI.search.toLowerCase())));
 let s='<section class="panel"><div class="editline"><div><h2>My Nightwave Acts</h2><p class="muted tiny">Manually tracked objectives, including past or Recovered Acts. Your saved status never resets just because the public weekly rotation changes.</p></div></div>';
 s+='<div class="filters"><select class="select" id="nFilterType">'+option(['All',...N_TYPES],N_UI.type)+'</select><input class="field" id="nFindAct" placeholder="Search saved Acts" value="'+h(N_UI.search)+'"></div>';
 if(saved.length){
  s+='<div class="tablewrap"><table class="data"><thead><tr><th>Act</th><th>Type</th><th>Progress</th><th>Standing</th><th>Complete</th><th></th></tr></thead><tbody>';
  for(const a of saved){const idx=n.acts.indexOf(a);
   s+='<tr><td class="name">'+h(a.title)+'<small class="muted">'+h(a.desc||'')+'</small></td>';
   s+='<td>'+h(a.type)+'</td><td><div class="nProgress"><input class="field" type="number" min="0" step="1" aria-label="Act progress" value="'+(a.progress??'')+'" data-n-progress="'+idx+'"> / <input class="field" type="number" min="1" aria-label="Act target" step="1" value="'+(a.target??'')+'" data-n-target="'+idx+'"></div></td>';
   s+='<td>'+h(a.reputation||'—')+'</td><td><input type="checkbox" class="check" data-n-done="'+idx+'" '+(a.done?'checked':'')+'></td>';
   s+='<td><button class="button small" data-n-remove="'+idx+'">Remove</button></td></tr>';
  }
  s+='</tbody></table></div>';
 }else s+=empty('No Acts saved in this view','Add a public live Act below or create one manually.');
 s+='<div class="formgrid nAdd"><label class="wide">Act name<input id="nNewTitle" class="field" placeholder="Act name"></label><label>Type<select id="nNewType" class="select">'+option(N_TYPES,'Weekly')+'</select></label><label>Standing reward<input id="nNewReputation" class="field" type="number" min="0" step="1" value="4500"></label><label>Target<input id="nNewTarget" class="field" type="number" min="1" placeholder="Optional"></label></div>';
 s+='<button class="button small" data-n-act="add">Add my Act</button></section>';
 return s;
}
function nLiveActs(n){
 let s='<section class="panel"><div class="editline"><div><h2>Current public Nightwave Acts</h2><p class="muted tiny">'+h(N_UI.status)+'</p></div><button class="button small" data-n-act="refresh">↻ Check Acts</button></div>';
 s+='<p class="helptext">This feed lists publicly active challenges for the Warframe world state. It does <strong>not</strong> reveal which Acts your PlayStation account has completed. Use “Track” to copy an Act into your private list.</p>';
 if(N_UI.feed.length){
  s+='<div class="tablewrap"><table class="data"><thead><tr><th>Act</th><th>Type</th><th>Standing</th><th></th></tr></thead><tbody>';
  for(const a of N_UI.feed){
   const id=nKey(a),present=n.acts.some(x=>x.id===id);
   s+='<tr><td class="name">'+h(a.title)+'<small class="muted">'+h(a.desc)+'</small></td><td>'+h(a.type)+'</td><td>'+h(a.reputation||'—')+'</td><td><button class="button small" data-n-track="'+h(id)+'" '+(present?'disabled':'')+'>'+(present?'Tracked':'Track')+'</button></td></tr>';
  }
  s+='</tbody></table></div>';
 }else s+=empty('No public Acts loaded','Use Check Acts, or record your current Acts manually.');
 s+='</section>';return s;
}
function nPage(){
 const n=nData(),rank=typeof n.rank==='number'?n.rank:null,prestige=typeof n.prestige==='number'?n.prestige:null,standing=typeof n.standing==='number'?n.standing:null;
 let s=title('Nightwave','Season progression, Acts, reward claims and Cred offerings');
 s+=statusNotice();
 s+='<div class="notice"><strong>Season reference:</strong> Amir’s Shockwave began 12 August 2026. The current public season and Acts may change; enter your personal rank from the Nightwave menu. Progress below is not synced from PlayStation.</div>';
 s+='<div class="panel"><div class="editline"><div><h2>My Nightwave season</h2><a href="https://www.warframe.com/en/nightwave" target="_blank" rel="noopener">Official Nightwave ↗</a></div><div class="formgrid">';
 s+='<label class="wide">Season name<input id="nSeasonName" class="field" value="'+h(n.season||N_DEFAULT)+'" placeholder="Season name"></label>';
 s+='<label>Rank (0–30)'+nInput('rank',n.rank,'Unknown',30)+'</label>';
 s+='<label>Prestige ranks'+nInput('prestige',n.prestige,'Unknown',150)+'</label>';
 s+='<label>Standing into current rank'+nInput('standing',n.standing,'Unknown',9999)+'</label>';
 s+='<label>Unspent season Cred'+nInput('cred',n.cred,'Unknown')+'</label>';
 s+='</div>';
 const claimed=Object.keys(n.claimed).filter(k=>n.claimed[k]).length;
 s+='<div class="nRibbon"><strong>'+(rank===null?'Rank not recorded':'Rank '+rank+(prestige?' · Prestige '+prestige:''))+'</strong><span>'+(standing===null?'Standing not recorded':standing.toLocaleString()+' / 10,000 Standing to next rank')+'</span><span>'+claimed+' / 30 rewards checked as claimed</span></div>';
 s+='<label class="nGoal">Current season goal<input class="field" data-n-goal value="'+h(n.goal||'')+'" placeholder="e.g. Hit rank 30; buy Nitain Extract"></label>';
 s+='<p class="helptext">Rank and Cred are recorded manually. Each 10,000 Standing unlocks one Nightwave reward tier. After rank 30, track Prestige separately.</p>';
 s+='<div class="editline"><div><h3>Reward tiers claimed</h3><p class="muted tiny">Tick only rewards actually claimed in-game; reaching a rank does not automatically mark its reward collected.</p></div></div>';
 s+='<div class="nRewards">'+Array.from({length:30},(_,i)=>{const key=String(i+1);return '<label class="nReward '+(n.claimed[key]?'nClaimed':'')+'"><input type="checkbox" class="check" data-n-claimed="'+key+'" '+(n.claimed[key]?'checked':'')+'><span>'+key+'</span></label>'}).join('')+'</div>';
 s+='<div class="nSeasonControls"><span class="muted tiny">Last verified: '+(n.checkedAt?new Date(n.checkedAt).toLocaleDateString():'Not checked in-game')+'</span><button class="button small" data-n-act="reviewed">Mark checked</button><button class="button small" data-n-act="newseason">Start a new season</button></div>';
 s+='</div>';
 s+=nActRows(n)+nLiveActs(n);
 s+='<div class="panel"><h2>Where in-game?</h2><p class="muted tiny">Open the Orbiter Nightwave radio console or Nightwave from the pause/menu interface. Check your rank and current Cred, claimed reward tiers and active Daily, Weekly, Elite Weekly or Permanent Weekly Acts. This is separate from faction Syndicate Standing.</p></div>';
 return s;
}
P_TABS.push(['nightwave','Nightwave']);
const nPrevPage=progressPage;
progressPage=function(){return P_UI.tab==='nightwave'?nPage():nPrevPage();};
const nPrevTasks=tasksData;
tasksData=function(){
 const out=nPrevTasks(),n=nData();
 for(const act of n.acts)if(!act.done)out.push({id:'nightwave:'+act.id,name:act.title,group:'Nightwave',action:'Complete '+act.type+' Act',detail:(act.progress??'—')+'/'+(act.target??'—')+' · '+(act.reputation||0)+' Standing',priority:3});
 if(n.goal)out.push({id:'nightwave:season-goal',name:n.goal,group:'Nightwave',action:'Season reward target',detail:n.season,priority:4});
 return out.sort((a,b)=>a.priority-b.priority||a.name.localeCompare(b.name));
};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-n-act],[data-n-track],[data-n-remove]');if(!b)return;
 const n=nData();
 if(b.dataset.nAct==='refresh'){nFetch(true);return;}
 if(b.dataset.nAct==='reviewed'){n.checkedAt=new Date().toISOString();pSave();render();toast('Nightwave checked date saved');return;}
 if(b.dataset.nAct==='add'){
  const title=document.getElementById('nNewTitle')?.value.trim(),type=document.getElementById('nNewType')?.value||'Custom';
  if(!title)return;
  const id='custom:'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  n.acts.push({id,title,type,progress:null,target:Math.max(0,Number(document.getElementById('nNewTarget')?.value)||0)||null,reputation:Math.max(0,Number(document.getElementById('nNewReputation')?.value)||0),done:false,added:new Date().toISOString()});
  pSave();render();return;
 }
 if(b.dataset.nAct==='newseason'){
  const value=document.getElementById('nSeasonName')?.value.trim();
  if(!value||value===n.season)return;
  if(!confirm('Archive the current Nightwave season, and start a new one named "'+value+'"? Your previous rank, rewards and Acts will be kept in a private archive.'))return;
  n.archives.push({season:n.season,rank:n.rank,prestige:n.prestige,standing:n.standing,cred:n.cred,claimed:n.claimed,acts:n.acts,goal:n.goal,closed:new Date().toISOString()});
  n.season=value;n.rank=null;n.prestige=null;n.standing=null;n.cred=null;n.claimed={};n.acts=[];n.goal='';n.checkedAt=null;
  pSave();render();toast('New Nightwave season started');return;
 }
 if(b.dataset.nTrack){
  const act=N_UI.feed.find(x=>nKey(x)===b.dataset.nTrack);
  if(!act||n.acts.some(x=>x.id===b.dataset.nTrack))return;
  n.acts.push({id:nKey(act),title:act.title,desc:act.desc,type:act.type,reputation:act.reputation,target:null,progress:null,done:false,added:new Date().toISOString()});
  pSave();render();return;
 }
 if(b.dataset.nRemove!==undefined){
  const i=Number(b.dataset.nRemove);
  if(!Number.isInteger(i)||i<0||i>=n.acts.length)return;
  n.acts.splice(i,1);pSave();render();return;
 }
});
document.addEventListener('change',e=>{
 const t=e.target,d=t.dataset,n=nData();
 if(t.id==='nFilterType'){N_UI.type=t.value;render();return;}
 let save=false;
 if(d.nField!==undefined){n[d.nField]=t.value===''?null:Math.max(0,Math.floor(Number(t.value)));save=true;}
 if(d.nGoal!==undefined){n.goal=t.value;save=true;}
 if(d.nClaimed!==undefined){n.claimed[d.nClaimed]=t.checked;save=true;}
 if(d.nDone!==undefined){const x=n.acts[Number(d.nDone)];if(x){x.done=t.checked;save=true;}}
 for(const [k,field] of [['nProgress','progress'],['nTarget','target']]){
  if(d[k]!==undefined){const x=n.acts[Number(d[k])];if(x){x[field]=t.value===''?null:Math.max(0,Math.floor(Number(t.value)));save=true;}}
 }
 if(save){pSave();toast('Nightwave saved privately');}
});
document.addEventListener('input',e=>{
 if(e.target.id!=='nFindAct')return;
 const cursor=e.target.selectionStart;N_UI.search=e.target.value;render();
 const x=document.getElementById('nFindAct');x?.focus();try{x?.setSelectionRange(cursor,cursor)}catch(_){}
});
const N_STYLES=document.createElement('style');N_STYLES.textContent='.nNumber{max-width:150px}.nRibbon{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:15px 0;padding:13px;border:1px solid var(--line);border-radius:9px;background:var(--raised)}.nRibbon strong{font-size:16px;color:var(--gold)}.nRibbon span{font-size:12px;color:var(--muted)}.nGoal{display:flex;flex-direction:column;gap:8px;font-size:12px;color:var(--muted)}.nRewards{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:7px;margin:15px 0}.nReward{border:1px solid var(--line);border-radius:8px;padding:8px 3px;display:flex;flex-direction:column;gap:4px;align-items:center;justify-content:center;font-size:12px;background:var(--raised)}.nClaimed{border-color:var(--green);color:var(--green)}.nProgress{display:flex;gap:5px;align-items:center}.nProgress input{min-width:60px;width:72px}.nSeasonControls{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:14px}.nAdd{margin:16px 0}.nReward input{margin:0}@media(max-width:650px){.nRewards{grid-template-columns:repeat(6,minmax(0,1fr))}.nProgress input{width:60px}}';document.head.append(N_STYLES);
if(state.page==='progress'&&P_UI.tab==='nightwave')render();
