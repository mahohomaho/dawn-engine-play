const assert=require('node:assert/strict');
const feedback=require('./action-feedback.js');
const data=require('./data.js');
const state=()=>({run:{gold:0,inventory:[]},expedition:{bag:[],overflow:[],bagGold:0,fight:null}});

{
  const s=state(),before=feedback.capture(s);
  s.expedition.bag.push({uid:'u1',defId:'herb',rarity:'common'},{uid:'u2',defId:'clover',rarity:'legendary'});
  const effect=feedback.derive(before,s,{type:'gather'},'GATHER',data);
  assert.deepEqual(effect.loot.map(item=>item.id),['clover','herb']);
  assert.equal(effect.notable,true);
  assert.equal(effect.empty,false);
  assert.equal(s.expedition.bag.length,2);
}
{
  const s=state(),before=feedback.capture(s);
  const effect=feedback.derive(before,s,{type:'gather'},'GATHER',data);
  assert.equal(effect.empty,true);
}
{
  const s=state();s.expedition.fight={enemyId:'goblin',log:['前の攻撃']};
  const before=feedback.capture(s);
  s.expedition.fight.log.push('主人公→森のゴブリン 12 会心','森のゴブリン→主人公 4','⚡雷撃 6');
  const effect=feedback.derive(before,s,{type:'round'},'BATTLE',data);
  assert.deepEqual(effect.hits.map(hit=>[hit.amount,hit.side,!!hit.critical,!!hit.lightning]),[[12,'enemy',true,false],[4,'party',false,false],[6,'enemy',false,true]]);
  assert.deepEqual(feedback.newLines(['a','b','c'],['c','d']),['d']);
}
{
  const s=state();s.expedition.fight={enemyId:'goblin',log:['前の攻撃']};
  const before=feedback.capture(s);
  s.expedition.fight=null;s.expedition.bagGold=18;
  s.expedition.bag.push({uid:'loot-1',defId:'clover',rarity:'legendary'});
  const effect=feedback.derive(before,s,{type:'win',log:['前の攻撃','主人公→森のゴブリン 11','勝利 +18G']},'BATTLE',data);
  assert.equal(effect.win,true);
  assert.equal(effect.gold,18);
  assert.deepEqual(effect.hits.map(hit=>hit.amount),[11]);
  assert.deepEqual(effect.loot.map(item=>item.id),['clover']);
}
console.log('Action feedback checks passed');
