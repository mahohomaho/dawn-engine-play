(function(root){
  'use strict';
  const rank={common:0,uncommon:1,rare:2,epic:3,legendary:4};
  const rewards=state=>[...(state.expedition?.bag||[]),...(state.expedition?.overflow||[]),...(state.run?.inventory||[])];
  function capture(state){return {
    items:new Set(rewards(state).map(item=>item.uid)),
    log:[...(state.expedition?.fight?.log||[])],
    enemyId:state.expedition?.fight?.enemyId||state.expedition?.encounter?.enemy||null,
    bagGold:state.expedition?.bagGold||0,
    gold:state.run?.gold||0
  };}
  function newLines(before,after){
    if(!after.length)return [];
    if(after.length>=before.length&&before.every((line,i)=>line===after[i]))return after.slice(before.length);
    for(let overlap=Math.min(before.length,after.length);overlap>0;overlap--){
      if(before.slice(-overlap).every((line,i)=>line===after[i]))return after.slice(overlap);
    }
    return after;
  }
  function derive(before,state,result,action,data){
    if(result?.type==='error'||!['GATHER','STEP','BATTLE'].includes(action))return null;
    const fresh=rewards(state).filter(item=>!before.items.has(item.uid));
    const groups=new Map();
    for(const item of fresh){const key=`${item.defId}:${item.rarity}`;const group=groups.get(key)||{id:item.defId,rarity:item.rarity,count:0};group.count++;groups.set(key,group);}
    const loot=[...groups.values()].sort((a,b)=>(rank[b.rarity]||0)-(rank[a.rarity]||0));
    const afterLog=state.expedition?.fight?.log||result?.log||[];
    const enemyId=before.enemyId||state.expedition?.fight?.enemyId||null;
    const enemyName=data.enemies[enemyId]?.name;
    const hits=[];
    for(const line of newLines(before.log,afterLog)){
      const hit=line.match(/^(.+?)→(.+?) (\d+)( 会心)?$/);
      if(hit){hits.push({amount:Number(hit[3]),side:hit[2]===enemyName?'enemy':'party',critical:!!hit[4],actor:hit[1]});continue;}
      const lightning=line.match(/^⚡雷撃 (\d+)$/);
      if(lightning){hits.push({amount:Number(lightning[1]),side:'enemy',lightning:true});continue;}
      const heal=line.match(/(?:を|ヒール )\+?(\d+)回復$|ヒール \+(\d+)$|HP\+(\d+)/);
      if(heal)hits.push({amount:Number(heal[1]||heal[2]||heal[3]),side:'party',heal:true});
    }
    const kind=action==='GATHER'?'gather':action==='STEP'?'explore':hits.length?'attack':'engage';
    const gold=Math.max(0,(state.expedition?.bagGold||0)-before.bagGold+(state.run?.gold||0)-before.gold);
    const notable=loot[0]&&rank[loot[0].rarity]>=2;
    return {kind,loot,hits,gold,notable:!!notable,empty:action==='GATHER'&&!loot.length,win:['win','bossWin','bountyWin','raidWin','ending'].includes(result?.type),duration:notable?3300:2300};
  }
  root.GuildActionFeedback={capture,derive,newLines};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.GuildActionFeedback;
})(typeof window!=='undefined'?window:globalThis);
