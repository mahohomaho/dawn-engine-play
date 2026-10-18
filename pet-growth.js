(function(root){
  'use strict';
  const D=root.GameData||(typeof require!=='undefined'?require('./data.js'):null);
  const defs={
    dog:{name:'噛みつき',step:10,milestones:[{level:10,label:'噛みつきの会心率+10%'},{level:30,label:'噛みつき後に8%で追撃'},{level:50,label:'会心率がさらに+5%'}]},
    cat:{name:'ひっかき',step:8,milestones:[{level:10,label:'8%で身軽な追撃'},{level:30,label:'追撃率がさらに+8%'},{level:50,label:'酒場収入の加算が強化'}]},
    owl:{name:'風切り',step:7,milestones:[{level:10,label:'12%で弱点を突き、与ダメージ+25%'},{level:30,label:'弱点を突く確率が+8%'},{level:50,label:'採取成功率の成長が強化'}]},
    slime:{name:'ぷるんと体当たり',step:9,milestones:[{level:10,label:'攻撃後20%で主人公のHPを1回復'},{level:30,label:'回復量が2に増加'},{level:50,label:'主人公への被ダメージ軽減が強化'}]}
  };
  const levelOf=value=>Number.isSafeInteger(value)&&value>=1?value:1;
  const rate=(base,step,level,max=80)=>Math.min(max,Math.round((base+step*Math.max(0,level-1))*10)/10);
  const percent=tenth=>tenth%10===0?String(tenth/10):(tenth/10).toFixed(1);
  function basic(id,value,secondId){
    const level=levelOf(value),def=defs[id]||defs.dog;
    const secondBonus=secondId&&level>=20?Math.max(0,level-20):0;
    const multiplierTenths=Math.min(1e12,1000+Math.min(1e12,level-1)*def.step+secondBonus);
    const crit=id==='dog'&&level>=10?10+(level>=50?5:0):0;
    const followup=id==='dog'&&level>=30?rate(8,.025,level-29,45):id==='cat'&&level>=10?rate(level>=30?16:8,.025,level-(level>=30?29:9),45):0;
    const weakpoint=id==='owl'&&level>=10?rate(level>=30?20:12,.02,level-(level>=30?29:9),45):0;
    const heal=id==='slime'&&level>=10?{chance:rate(20,.02,level-9,60),amount:level>=30?2+Math.floor((level-30)/100):1}:null;
    const effects=[];
    if(crit)effects.push(`会心率+${crit}%`);
    if(followup)effects.push(`${percent(Math.round(followup*10))}%で追撃（元の一撃の50%）`);
    if(weakpoint)effects.push(`${percent(Math.round(weakpoint*10))}%で弱点攻撃（与ダメージ+25%）`);
    if(heal)effects.push(`${percent(Math.round(heal.chance*10))}%で主人公のHPを${heal.amount}回復`);
    return {name:def.name,multiplier:multiplierTenths/10,crit,followup,weakpoint,heal,effects,milestones:def.milestones,nextMilestone:def.milestones.find(m=>m.level>level)||null,unlocked:def.milestones.filter(m=>m.level===level)};
  }
  function stats(id,value,effects={}){const level=levelOf(value),pet=D.pets[id];return {hp:Math.min(Number.MAX_SAFE_INTEGER,12+level+(effects.petHp||0)),atk:Math.min(Number.MAX_SAFE_INTEGER,pet.atk+Math.floor(level/5)+(effects.petPower||0)),def:pet.def,speed:pet.speed};}
  function passive(id,value){const level=levelOf(value);switch(id){
    case 'dog':return {heal:1+Math.floor((level-1)/10),text:`戦闘勝利後、主人公のHP+${1+Math.floor((level-1)/10)}`};
    case 'cat':{const bonus=5+(level-1)*(level>=50?.2:.1);return {tavernPct:bonus,text:`酒場日収+${Math.round(bonus*10)/10}%（端数切り捨て）`};}
    case 'owl':{const bonus=Math.min(25,3+(level-1)*(level>=50?.15:.1));return {gatherPct:bonus,text:`採取成功率+${Math.round(bonus*10)/10}pt`};}
    case 'slime':{const reduction=1+Math.floor((level-1)/(level>=50?20:25));return {guard:Math.min(80,reduction),text:`主人公への被ダメージ−${Math.min(80,reduction)}（最低1）`};}
  }}
  function second(id,value){const level=levelOf(value),growth=Math.max(0,level-20),name=(root.GuildCatalog?.pets||[]).find(item=>item.id===id)?.name||id;
    const result={id,name,baseBonusPct:Math.round(growth)/10};
    switch(id){
      case 'P01':result.chestBonus=Math.min(10,2+growth*.04);result.text=`探索3歩ごと、宝箱の追加発見率+${result.chestBonus.toFixed(1)}pt（最大10pt）`;break;
      case 'P02':result.delay=Math.min(70,10+growth*.06);result.text=`${result.delay.toFixed(1)}%で敵の初行動を遅らせる（ボスは半率）`;break;
      case 'P03':result.tavernPct=20+growth*.1;result.text=`酒場日収+${result.tavernPct.toFixed(1)}%（端数切り捨て）`;break;
      case 'P04':result.followup=Math.min(70,15+growth*.04);result.power=50+growth*.2;result.text=`主人公の会心時${result.followup.toFixed(1)}%で追撃（ペット攻撃力の${result.power.toFixed(1)}%）`;break;
      case 'P05':result.rareMultiplier=Math.min(3,1.2+growth*.002);result.text=`採取時のレア素材抽選率×${result.rareMultiplier.toFixed(3)}（基礎率の3倍まで）`;break;
      case 'P06':result.trapAvoid=Math.min(80,20+growth*.04);result.text=`罠に遭遇した時${result.trapAvoid.toFixed(1)}%で危険を知らせ、被害を防ぐ`;break;
      case 'P07':result.guardPct=Math.min(80,10+growth*.04);result.text=`スライムが受ける単発ダメージを${result.guardPct.toFixed(1)}%軽減（1ターン1回）`;break;
      case 'P08':result.duplicate=Math.min(70,5+growth*.04);result.text=`コモン・アンコモン素材を採った時${result.duplicate.toFixed(1)}%で同じ素材を+1`;break;
      default:result.text='第二スキルの効果は未設定';
    }
    result.text+=`。さらに基本スキル倍率+${result.baseBonusPct.toFixed(1)}%`;
    return result;
  }
  root.PetGrowth={basic,stats,passive,second,levelOf};
  // The catalog is generated from the written specification. Show the live
  // Lv.20 values in every existing screen that reads its pet entries.
  for(const option of root.GuildCatalog?.pets||[]){
    if(/^P0[1-8]$/.test(option.id))option.effect=second(option.id,20).text;
  }
  if(typeof module!=='undefined'&&module.exports)module.exports=root.PetGrowth;
})(typeof window!=='undefined'?window:globalThis);
