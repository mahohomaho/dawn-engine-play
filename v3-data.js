(function(root){'use strict';
const D=root.GameData,C=root.GuildCatalog;
D.C.schemaVersion=3;
D.C.bagSlots=36;D.C.overflowSlots=12;D.C.skillZoomMin=.5;D.C.skillZoomMax=2;
D.jobs.knight={name:'騎士',role:'仲間を守る盾',hp:39,atk:7,def:5,speed:6,action:'味方の被弾をかばう'};
D.jobs.mage={name:'魔法使い',role:'属性の連鎖',hp:25,atk:10,def:1,speed:11,action:'魔法が響き合う'};
D.allies.luca={name:'ルカ',job:'knight',role:'護衛',passive:'全員の防御+1',weapon:'盾剣'};
D.allies.sora={name:'ソラ',job:'mage',role:'属性',passive:'属性追加威力+5%',weapon:'杖'};
const kind={武器:'weapon',防具:'armor',装飾:'accessory',本:'book',素材:'material',換金品:'treasure',鍵:'tome',消耗品:'respec',賞金固有:'accessory',採取限定:'accessory'};
const atk={I01:3,I02:2,I03:5,I04:7,I05:6,I06:11};
const defense={I07:4,I08:3,I09:2,I10:8};
for(const item of C.items){const price={common:10,uncommon:25,rare:60,epic:140,legendary:350}[item.rarity];D.items[item.id]={name:item.name,kind:kind[item.kind]||'material',rarity:item.rarity,sell:item.id==='I32'?120:price,atk:atk[item.id]||0,def:defense[item.id]||0,description:item.effect,source:item.source};}
const groups=[['攻撃','attack','#d77560'],['確率','critical','#e5ae61'],['生存','survival','#75c69c'],['賞金','bounty','#e5bd6c'],['幸運','luck','#a9a2e8'],['採取','gather','#8ccf86'],['仲間','companions','#d89bbb'],['ペット一本道','petGrowth','#b9ca75'],['名声','fame','#f1b889'],['酒場','tavern','#d99770'],['加工','processing','#9bb7a7'],['探索','explore','#80a8db']];
const groupId=Object.fromEntries(groups.map(x=>[x[0],x[1]]));
const effects={
S01:[{stat:'attack',amount:2}],S02:[{stat:'weaponPct',amount:10}],S03:[{stat:'firstHitPct',amount:20}],S04:[{stat:'statusDamagePct',amount:30}],S05:[{flag:'battleMaster'}],
S06:[{stat:'crit',amount:3}],S07:[{stat:'lightningRate',amount:15}],S08:[{flag:'fireLink'}],S09:[{flag:'overflowAttack'}],S10:[{flag:'stormCircuit'}],
S11:[{stat:'hp',amount:8}],S12:[{stat:'damageReduction',amount:5}],S13:[{flag:'lastStand'}],S14:[{stat:'lowHpDamagePct',amount:25}],S15:[{flag:'unyielding'}],
S16:[{stat:'bountyGoldPct',amount:5}],S17:[{stat:'bountyReduction',amount:8}],S18:[{stat:'revengeDamagePct',amount:15}],S19:[{stat:'bountyUniquePct',amount:20}],S20:[{flag:'revengeStrike'}],
S21:[{stat:'chestRate',amount:2}],S22:[{stat:'chestDoubleRate',amount:10}],S23:[{stat:'lowRaritySalePct',amount:20}],S24:[{flag:'discoveryChain'}],S25:[{stat:'legendaryRatePct',amount:30}],
S26:[{stat:'materialSalePct',amount:5}],S27:[{stat:'gatherFallback',amount:20}],S28:[{stat:'gatherDoubleRate',amount:15}],S29:[{flag:'gatherPoison'}],S30:[{stat:'gatherLegendaryPct',amount:50}],
S31:[{stat:'comboDamagePct',amount:10}],S32:[{stat:'allySlots',amount:1}],S33:[{stat:'allySlots',amount:1}],S34:[{stat:'allySlots',amount:1}],S35:[{flag:'reservePassive'}],
S36:[{stat:'petPointPct',amount:10}],S37:[{stat:'petPointPct',amount:10}],S38:[{stat:'petPointPct',amount:20}],S39:[{stat:'petPointPct',amount:30}],S40:[{stat:'petPointPct',amount:50}],
S41:[{stat:'fameGoldPct',amount:.5}],S42:[{stat:'fameAttackPct',amount:.3}],S43:[{flag:'fameHome'}],S44:[{flag:'openTavern'}],S45:[{stat:'mealPower',amount:10}],S46:[{stat:'mealSlots',amount:1}],S47:[{stat:'tavernGold',amount:8}],S48:[{stat:'comboDamagePct',amount:25}],
S49:[{stat:'materialSalePct',amount:8}],S50:[{stat:'processSlots',amount:1}],S51:[{stat:'processSpeedPct',amount:8}],S52:[{flag:'materialReturn'}],S53:[{stat:'travelDiscount',amount:1}],S54:[{flag:'checkpointGuard'}],S55:[{flag:'firstDepthLoot'}],
S56:[{stat:'jobRate',amount:10}],S57:[{stat:'thiefEvade',amount:10}],S58:[{stat:'emergencyHeal',amount:5}],S59:[{stat:'emergencyUses',amount:1}],S60:[{stat:'guardRate',amount:15}],S61:[{stat:'counterRate',amount:20}],S62:[{stat:'killFollowRate',amount:15}],S63:[{stat:'killFollowDamagePct',amount:30}],S64:[{stat:'spellEchoRate',amount:10}],S65:[{stat:'echoTargets',amount:1}],
S66:[{stat:'statusDamagePct',amount:30}],S67:[{stat:'petPointPct',amount:20}],S68:[{stat:'mealPower',amount:20}],S69:[{stat:'lightningDamage',amount:25}],S70:[{flag:'overcharge'}],S71:[{stat:'speed',amount:2}],S72:[{stat:'legendaryRatePct',amount:50}],S73:[{flag:'starSurge'}],S74:[{flag:'firstDepthLoot'}]
};
const jobGroup={盗賊専用:'thief',回復役専用:'priest',騎士専用:'knight',戦士専用:'warrior',魔法使い専用:'mage'};
const bookGroup={森の秘伝:'I33',雷の秘伝:'I34',星の秘伝:'I35'};
const byGroup=Object.fromEntries(groups.map(([name,id,color])=>[name,{id,name,color,nodes:[]}]));
const jobs={};const hidden=[];
for(const skill of C.skills){const g=skill.group,isJob=!!jobGroup[g],isBook=!!bookGroup[g],treeId=isJob?'job-'+jobGroup[g]:isBook?(g==='森の秘伝'?'gather':g==='雷の秘伝'?'critical':'luck'):groupId[g];
  const parents=[...skill.requires.matchAll(/S\d{2}/g)].map(x=>x[0]);
  const prerequisiteMode=skill.requires.includes('または')?'any':'all';
  const groupNodes=C.skills.filter(s=>s.group===g);const pos=groupNodes.findIndex(s=>s.id===skill.id);
  const node={nodeId:skill.id,treeId,name:skill.name,costG:skill.cost,rarity:skill.rarity,description:skill.effect,effects:effects[skill.id]||[],prerequisites:parents,prerequisiteMode,tier:pos,x:40+pos*150,y:(pos%2)*110-50,unlockKind:isBook?'book':'normal',sourceBookId:isBook?bookGroup[g]:null};
  if(isBook){node.x=650+(Number(skill.id.slice(1))%3)*130;node.y=180+(Number(skill.id.slice(1))%3)*80;hidden.push(node);}
  else if(isJob){const id=jobGroup[g];if(!jobs[id])jobs[id]={id:'job-'+id,name:g,color:'#edbd7c',nodes:[]};jobs[id].nodes.push(node);}
  else byGroup[g].nodes.push(node);
}
D.trees=groups.map(g=>byGroup[g[0]]);D.jobTrees=jobs;D.hiddenNodes=hidden;D.nodeMap=Object.fromEntries([...D.trees.flatMap(t=>t.nodes),...Object.values(jobs).flatMap(t=>t.nodes),...hidden,...D.heavenTree.nodes,...D.weaponProtect].map(n=>[n.nodeId,n]));D.allNodes=Object.values(D.nodeMap);D.catalog=C;
D.gatherAreas=[
 {id:'yard',name:'花の草原',travel:6,unlock:null,empty:.40,common:.54,rare:.058,legendary:.002,commonItem:'I25',rareItem:'I27'},
 {id:'mist',name:'霧の森',travel:12,unlock:null,requiresBoss:'forest',empty:.34,common:.55,rare:.105,legendary:.005,commonItem:'I26',rareItem:'I28'},
 {id:'marsh',name:'雷鳴の洞窟',travel:18,unlock:null,requiresBoss:'mine',empty:.30,common:.57,rare:.12,legendary:.01,commonItem:'I29',rareItem:'I30'}
];
D.dungeons=[{id:'forest',name:'若葉の森',travel:8,unlock:null,boss:'forestGuardian',book:'I33',enemy:'goblin',trap:[1,3]},{id:'mine',name:'廃鉱',travel:15,unlock:null,requiresBoss:'forest',boss:'oreGuardian',book:'I34',enemy:'caveBat',trap:[3,7]},{id:'tower',name:'星見の塔',travel:23,unlock:null,requiresBoss:'mine',boss:'starGuardian',book:'I35',enemy:'starWisp',trap:[5,10]}];
D.bountyDefs.redcap.unique=[['I37',.04],['I32',.03]];D.bountyDefs.runawayMage.unique=[['I38',.015],['I32',.03]];
for(const item of C.items)if(item.kind==='本')D.items[item.id].stackPolicy='none';
})(typeof window!=='undefined'?window:globalThis);
