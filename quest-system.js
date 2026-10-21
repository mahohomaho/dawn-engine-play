(function(root){
'use strict';
const P=root.GuildEngine.GameEngine.prototype;
const definitions={
  gather5:{name:'採取の手伝い',target:5,reward:25,label:'採取'},
  forest10:{name:'森の道の調査',target:10,reward:40,label:'若葉の森の探索'},
  raid:{name:'襲来を退ける',target:1,reward:60,label:'防衛成功'}
};
const old={apply:P.apply,sleep:P.sleep,step:P.step};
P.questValue=function(type){const r=this.state.run;return type==='gather5'?r.petGatherCount||0:type==='forest10'?r.questForestSteps||0:r.raidCount||0;};
P.ensureQuestBoard=function(){
  const r=this.state.run;
  if(Array.isArray(r.questBoard))return;
  r.questForestSteps??=r.dungeons?.forest?.checkpoint||0;
  const cycle=Math.floor((r.day-1)/3);
  r.questBoard=Object.keys(definitions).map(type=>({id:`${type}:${cycle}`,type,cycle,base:0,accepted:r.questAccepted?.includes(type)||false,claimed:r.quests?.includes(type)||false,notified:r.quests?.includes(type)||false,legacy:true}));
  r.nextQuestDay=(cycle+1)*3+1;
};
P.questBoardRows=function(){this.ensureQuestBoard();return this.state.run.questBoard.filter(q=>!q.claimed).map(q=>({...q,...definitions[q.type],progress:Math.max(0,this.questValue(q.type)-(q.base||0)),ready:q.accepted&&this.questValue(q.type)-(q.base||0)>=definitions[q.type].target}));};
P.questUnclaimed=function(){return this.questBoardRows().some(q=>q.ready);};
P.acceptQuest=function(p){
  if(this.state.expedition)return this.fail('ギルドで受注できます');
  this.ensureQuestBoard();const r=this.state.run,q=r.questBoard.find(x=>x.id===p.id||x.legacy&&x.type===p.id),def=definitions[q?.type];
  if(!q||!def||q.claimed)return this.fail('依頼がありません');
  if(!q.accepted){q.accepted=true;q.base=Math.max(this.questValue(q.type),...r.questBoard.filter(other=>other!==q&&other.type===q.type&&other.accepted&&!other.claimed).map(other=>(other.base||0)+def.target));return this.event('quest',`${def.name}を受注した`);}
  if(this.questValue(q.type)-(q.base||0)<def.target)return this.fail('まだ達成していません');
  q.claimed=true;this.wallet(def.reward,'quest',{eligible:true,daily:true});
  return this.event('quest',`${def.name}の報酬 ${def.reward}Gを受け取った`);
};
P.step=function(){const area=this.state.expedition?.area,kind=this.state.expedition?.kind,result=old.step.call(this);if(kind==='dungeon'&&area==='forest'&&result.type!=='error'){this.state.run.questForestSteps=(this.state.run.questForestSteps||0)+1;}return result;};
P.sleep=function(){this.ensureQuestBoard();const before=this.state.run.day,result=old.sleep.call(this);const r=this.state.run;if(r.day===before)return result;let refreshed=false;while(r.day>=r.nextQuestDay){r.questBoard=r.questBoard.filter(q=>q.accepted&&!q.claimed);const cycle=Math.floor((r.nextQuestDay-1)/3);for(const type of Object.keys(definitions))r.questBoard.push({id:`${type}:${cycle}`,type,cycle,base:0,accepted:false,claimed:false,notified:false});r.nextQuestDay+=3;refreshed=true;}if(refreshed){result.questRefresh=true;this.state.events.push({type:'questRefresh',message:'新しい依頼が届きました！'});if(this.state.events.length>50)this.state.events.shift();}return result;};
P.apply=function(type,p){this.ensureQuestBoard();const result=old.apply.call(this,type,p);if(result?.type==='error')return result;const completed=[];for(const q of this.questBoardRows()){if(q.ready&&!q.notified){const original=this.state.run.questBoard.find(x=>x.id===q.id);original.notified=true;completed.push({id:q.id,name:q.name,reward:q.reward});}}if(completed.length)result.questCompletions=completed;return result;};
root.GuildQuests={definitions};
if(typeof module!=='undefined'&&module.exports)module.exports=root.GuildQuests;
})(typeof window!=='undefined'?window:globalThis);
