(function(root){'use strict';
const labels={attack:'攻撃力',allyAttack:'仲間攻撃',hp:'最大HP',allyHp:'仲間HP',defense:'防御力',allyDefense:'仲間防御',speed:'素早さ',crit:'会心率',damageReduction:'被ダメージ軽減',gatherSuccess:'採取成功率',rareRate:'希少品発見率',lightningRate:'雷撃発動率',lightningDamage:'雷撃威力',battleGoldPct:'討伐G',materialSalePct:'素材売値',chestDoubleRate:'宝箱のG倍化率',gatherLegendaryPct:'伝説素材発見率',counterRate:'反撃率',lowHpCrit:'瀕死時会心率',questGoldPct:'依頼報酬',travelDiscount:'移動スタミナ軽減',heal:'回復量',weaponPct:'武器攻撃補正',allySlots:'仲間出撃枠'};
const slots=[['weapon','武器','weaponUid'],['armor','防具','armorUid'],['accessory','装飾品','accessoryUid']];
const allySkills={rio:['撃破後の追い討ち'],nico:['攻撃後の追加攻撃'],mina:['ヒール','緊急ヒール'],bera:['撃破後の追い討ち'],yui:['攻撃後の追加攻撃'],luca:['通常攻撃'],sora:['通常攻撃']};
const allyBio={rio:'前線に立ち、敵を倒した勢いで追い討ちを狙う剣士。',nico:'素早い手数と宝箱の勘が光る盗賊。',mina:'傷ついた仲間を見逃さない癒やし手。',bera:'仲間の命を守る、頼れる前衛。',yui:'危険な道を先に読み、素材を見つける探索役。',luca:'ギルドの先頭に立つ騎士。',sora:'魔力を武器に戦う術師。'};
const artFallback={rio:'karen',mina:'serina',bera:'borg',luca:'gald',sora:'olwyn'};
function itemFor(run,uid){return run.inventory.find(item=>item.uid===uid)||null;}
function itemStat(data,item,key){return item?(Number(data.items[item.defId]?.[key])||0)+(key==='atk'?(item.level||0):0):0;}
function sources(game,data,key){const r=game.state.run,m=game.state.meta,job=r.job,skill=r.skills.reduce((sum,id)=>{const node=data.nodeMap[id];if(!node||node.treeId.startsWith('job-')&&node.treeId!==`job-${job}`)return sum;return sum+(node.effects||[]).reduce((n,e)=>n+(e.stat===key?(e.amount||0):0),0);},0);const heaven=(m.heavenSkills||[]).reduce((sum,id)=>sum+(data.nodeMap[id]?.effects||[]).reduce((n,e)=>n+(e.stat===key?(e.amount||0):0),0),0);const training=key==='attack'?(m.training?.assault||0)*2:key==='allyAttack'?(m.training?.assault||0):key==='defense'?(m.training?.guard||0):key==='allyHp'?(m.training?.guard||0)*3:0;return {skill,heaven:heaven+training};}
function entries(game,data,actor='hero'){
 const r=game.state.run,eff=game.runEffects(),hero=actor==='hero',ally=hero?null:data.allies[actor],job=data.jobs[hero?r.job:ally?.job];if(!job)return null;
 const weapon=itemFor(r,r.weaponUid),armor=itemFor(r,r.armorUid),baseHp=hero?job.hp:job.hp,permHp=hero?(r.hpBase-job.hp):sources(game,data,'allyHp').heaven,skillHp=hero?sources(game,data,'hp').skill:sources(game,data,'allyHp').skill;
 const attackSkill=sources(game,data,'attack'),allyAttack=sources(game,data,'allyAttack'),defSkill=sources(game,data,'defense'),allyDef=sources(game,data,'allyDefense'),speedSkill=sources(game,data,'speed');
 const atkParts=[['職業基礎',job.atk],['スキルツリー',attackSkill.skill+(hero?0:allyAttack.skill)],['永続強化',attackSkill.heaven+(hero?0:allyAttack.heaven)],['装備',hero?itemStat(data,weapon,'atk'):0]];
 const defParts=[['職業基礎',job.def],['スキルツリー',hero?defSkill.skill:allyDef.skill],['永続強化',hero?defSkill.heaven:allyDef.heaven],['装備',hero?itemStat(data,armor,'def'):0],['相棒',hero&&r.pet==='slime'?1:0]];
 const hpParts=[['職業基礎',baseHp],['スキルツリー',skillHp],['永続強化',permHp]];
 const speedParts=[['職業基礎',job.speed],['スキルツリー',hero?speedSkill.skill:0]];
 const critSkill=sources(game,data,'crit'),accessory=itemFor(r,r.accessoryUid),critParts=[['基礎会心',hero?5:0],['スキルツリー',critSkill.skill],['永続強化',critSkill.heaven],['装備',accessory?.defId==='I11'?2:0],['その他',Math.max(0,(eff.crit||0)-critSkill.skill-critSkill.heaven-(accessory?.defId==='I11'?2:0))]];
 const total=parts=>parts.reduce((sum,[,value])=>sum+value,0);
 const multiplier=hero?(1+r.sleepBuff/100):1,meal=hero&&game.state.expedition?.meals?.includes('attack')?1.1+(eff.mealPower||0)/100:1;
 const attack=Math.floor(total(atkParts)*multiplier*meal);
 const fight=game.state.expedition?.fight?.heroes?.find(f=>f.id===actor);
 const withBattle=(parts,base,actual)=>actual==null||actual===base?parts:[...parts,['戦闘中の条件・料理・作戦',actual-base]];
 return {id:actor,name:hero?'主人公':ally.name,job:job.name,role:hero?job.role:ally.role,level:null,stats:[{key:'hp',name:'最大HP',value:fight?.maxHp??total(hpParts),parts:withBattle(hpParts,total(hpParts),fight?.maxHp)},{key:'atk',name:'攻撃力',value:fight?.atk??attack,parts:withBattle(atkParts,attack,fight?.atk),formula:multiplier!==1||meal!==1?`就寝・料理倍率 ×${(multiplier*meal).toFixed(2)}（端数切り捨て）`:''},{key:'def',name:'防御力',value:fight?.def??total(defParts),parts:withBattle(defParts,total(defParts),fight?.def)},{key:'speed',name:'素早さ',value:fight?.speed??total(speedParts),parts:withBattle(speedParts,total(speedParts),fight?.speed)},{key:'crit',name:'会心率',value:total(critParts),parts:critParts,unit:'%'},{key:'evade',name:'回避率',value:0,parts:[['現行戦闘での回避判定',0]],unit:'%'}],currentHp:fight?.hp??(hero?(game.state.expedition?.hp??game.actorHealth('hero',total(hpParts))):game.actorHealth(actor,total(hpParts))),skills:hero?[job.action]:allySkills[actor]||[job.action],bio:hero?job.role:allyBio[actor],passive:hero?'':ally.passive,active:hero||r.activeAllies.includes(actor)};
}
function equipment(game,data,actor='hero'){
 const r=game.state.run;if(actor!=='hero')return {slots:[],note:'現在の戦闘ルールでは仲間の個別装備枠はありません。共通スキルと仲間向け強化が適用されます。'};
 return {slots:slots.map(([kind,name,field])=>({kind,name,capacity:1,item:itemFor(r,r[field])})),note:'主人公は武器・防具・装飾品を各1個装備できます。お守りの独立枠はありません。'};
}
function comparison(game,data,uid){const r=game.state.run,item=itemFor(r,uid),def=data.items[item?.defId],slot=slots.find(([kind])=>kind===def?.kind);if(!slot)return null;const current=itemFor(r,r[slot[2]]),delta={atk:itemStat(data,item,'atk')-itemStat(data,current,'atk'),def:itemStat(data,item,'def')-itemStat(data,current,'def'),crit:(item?.defId==='I11'?2:0)-(current?.defId==='I11'?2:0)};return {slot:slot[1],current,candidate:item,delta,description:def.description||'',equipped:current?.uid===item.uid};}
function passives(game,data,actor='hero'){
 const r=game.state.run,e=game.runEffects(),sheet=entries(game,data,actor),out=[];if(!sheet)return out;
 for(const [key,label] of Object.entries(labels)){if(['attack','allyAttack','hp','allyHp','defense','allyDefense','speed','crit'].includes(key))continue;const value=e[key],percent=key.toLowerCase().includes('rate')||key.toLowerCase().includes('pct')||['gatherSuccess','rareRate','damageReduction','lightningDamage'].includes(key);if(typeof value==='number'&&value!==0)out.push(`${label} ${value>0?'+':''}${value}${percent?'%':''}`);}
 if(actor==='hero'){if(r.sleepBuff)out.push(`就寝による攻撃倍率 +${r.sleepBuff}%`);if(r.pet&&data.pets[r.pet])out.push(`${data.pets[r.pet].nick}：${data.pets[r.pet].passive}`);if(r.activeAllies.includes('mina'))out.push('ミナ：戦闘勝利後にHP+1');for(const id of r.booksRead||[]){const book=data.items[id];if(book)out.push(`${book.name}：${book.description||'常時効果'}`);}}
 else if(actor==='mina')out.push('戦闘勝利後に主人公のHP+1');
 if(actor==='hero'||r.activeAllies.includes(actor)){const nodes=r.skills.map(id=>data.nodeMap[id]).filter(node=>node&&(!node.treeId.startsWith('job-')||node.treeId===`job-${r.job}`));for(const node of nodes.slice(-8))out.push(`取得：${node.name} — ${node.description||'常時発動'}`);if(nodes.length>8)out.push(`ほか${nodes.length-8}件の取得スキル`);}
 return out;
}
root.CharacterSheet={entries,equipment,comparison,passives,allySkills,allyBio,artFallback};
if(typeof module!=='undefined'&&module.exports)module.exports=root.CharacterSheet;
})(typeof window!=='undefined'?window:globalThis);
