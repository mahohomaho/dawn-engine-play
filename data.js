(function(root){
  'use strict';
  const C={schemaVersion:2,maxStamina:100,initialGold:0,initialDebt:120,initialHP:30,deadlineDays:5,debtAmounts:[120,200,320,420,520,680],totalDebts:6,totalRaids:6,travelGather:[10,20,30],travelDungeon:[10,20,30],gatherCost:10,stepCost:2,battleStartCost:3,bagSlots:30,overflowSlots:10,skillZoomMin:.35,skillZoomMax:2.5};
  const pets={
    dog:{name:'犬',nick:'コロ',role:'戦闘後の回復',passive:'戦闘勝利後にHP+1',second:'ボス戦で仲間の攻撃+2%',atk:2,def:1,speed:9,color:'#c58859'},
    cat:{name:'猫',nick:'ミケ',role:'酒場と幸運',passive:'酒場日収+5%',second:'宝箱のG+10%',atk:1,def:1,speed:12,color:'#d6ad78'},
    owl:{name:'フクロウ',nick:'フク',role:'採取の目利き',passive:'採取成功率+3%',second:'レア素材追加抽選',atk:1,def:1,speed:11,color:'#92724f'},
    slime:{name:'スライム',nick:'ぷる',role:'守りと吸収',passive:'被ダメージ−1',second:'戦闘中3ラウンドごとにHP+1',atk:2,def:2,speed:5,color:'#60b9bc'}
  };
  const jobs={
    warrior:{name:'戦士',role:'安定した前衛',hp:34,atk:9,def:3,speed:8,action:'撃破時、別の敵へ追撃を狙う'},
    thief:{name:'盗賊',role:'素早い連撃',hp:28,atk:7,def:2,speed:15,action:'攻撃直後に再攻撃を狙う'},
    priest:{name:'僧侶',role:'回復と緊急対応',hp:30,atk:7,def:2,speed:10,action:'ヒール後に危険な味方を緊急回復'}
  };
  const allies={
    rio:{name:'リオ',job:'warrior',role:'前衛',passive:'全員の防御+1',weapon:'片手剣'},
    nico:{name:'ニコ',job:'thief',role:'連撃',passive:'宝箱G+5%',weapon:'短剣'},
    mina:{name:'ミナ',job:'priest',role:'回復',passive:'戦闘後HP+1',weapon:'杖'},
    bera:{name:'ベラ',job:'warrior',role:'護衛',passive:'全員の最大HP+2',weapon:'槍'},
    yui:{name:'ユイ',job:'thief',role:'探索',passive:'採取成功率+2%',weapon:'双剣'}
  };
  const gatherAreas=[
    {id:'yard',name:'ギルド裏庭',travel:10,unlock:null,empty:.40,common:.55,rare:.048,legendary:.002,commonItem:'herb',rareItem:'blueHerb'},
    {id:'mist',name:'霧の森',travel:20,unlock:'gather:1',empty:.32,common:.59,rare:.085,legendary:.005,commonItem:'mushroom',rareItem:'moonleaf'},
    {id:'marsh',name:'古代の湿地',travel:30,unlock:'gather:2',empty:.27,common:.60,rare:.12,legendary:.01,commonItem:'crystalMoss',rareItem:'ancientSeed'}
  ];
  const dungeons=[
    {id:'forest',name:'若葉の森',travel:10,unlock:null,boss:'forestGuardian',book:'forestTome',enemy:'goblin',trap:[1,3]},
    {id:'mine',name:'廃鉱',travel:20,unlock:'survival:24',boss:'oreGuardian',book:'mineTome',enemy:'caveBat',trap:[3,7]},
    {id:'tower',name:'星見の塔',travel:30,unlock:'thunder:24',boss:'starGuardian',book:'towerTome',enemy:'starWisp',trap:[5,10]}
  ];
  const enemies={
    goblin:{name:'森のゴブリン',hp:12,atk:4,def:0,speed:6,reward:6},caveBat:{name:'坑道コウモリ',hp:27,atk:9,def:2,speed:14,reward:16},starWisp:{name:'星の灯火',hp:44,atk:15,def:4,speed:12,reward:28},
    forestGuardian:{name:'樹海の番人',hp:90,atk:12,def:3,speed:7,reward:55},oreGuardian:{name:'鉄の巨像',hp:160,atk:19,def:7,speed:5,reward:100},starGuardian:{name:'星見の守護者',hp:240,atk:27,def:9,speed:13,reward:160},
    redcap:{name:'盗賊団長・赤帽子',hp:60,atk:11,def:2,speed:13,reward:60},runawayMage:{name:'逃亡魔術師',hp:80,atk:15,def:1,speed:11,reward:90},
    raid1:{name:'魔王軍の斥候',hp:42,atk:8,def:1,speed:8,reward:45},raid2:{name:'魔王軍の先兵',hp:85,atk:14,def:3,speed:10,reward:80},raid3:{name:'魔王軍の隊長',hp:150,atk:20,def:5,speed:11,reward:130},raid4:{name:'魔王軍の猛将',hp:190,atk:23,def:6,speed:12,reward:220},raid5:{name:'魔王軍の大将',hp:245,atk:27,def:7,speed:13,reward:300},demonKing:{name:'魔王',hp:330,atk:31,def:9,speed:14,reward:300}
  };
  const bountyDefs={redcap:{name:'盗賊団長・赤帽子',area:'forest',enemy:'redcap',reward:60,unique:[['redcapCharm',.10],['redcapJournal',.03]],weapons:['banditDagger','lightSword']},runawayMage:{name:'逃亡魔術師',area:'mine',enemy:'runawayMage',reward:90,unique:[['spellCharm',.10],['mageBook',.03]],weapons:['mageStaff','lightSword']}};
  const items={
    herb:{name:'薬草',kind:'material',rarity:'common',sell:5},blueHerb:{name:'青い薬草',kind:'material',rarity:'rare',sell:12},mushroom:{name:'森のキノコ',kind:'material',rarity:'common',sell:7},moonleaf:{name:'月光葉',kind:'material',rarity:'rare',sell:18},crystalMoss:{name:'結晶苔',kind:'material',rarity:'common',sell:11},ancientSeed:{name:'古代の種',kind:'material',rarity:'rare',sell:28},clover:{name:'夜明けの四つ葉',kind:'material',rarity:'legendary',sell:180},
    potion:{name:'ポーション',kind:'consumable',rarity:'uncommon',sell:18},redcapCharm:{name:'赤帽子の護符',kind:'relic',rarity:'rare',sell:40},redcapJournal:{name:'盗賊団長の手記',kind:'book',rarity:'epic',sell:60,stackPolicy:'none'},spellCharm:{name:'魔術師の護符',kind:'relic',rarity:'rare',sell:65},mageBook:{name:'逃亡魔術師の書',kind:'book',rarity:'epic',sell:85,stackPolicy:'none'},
    forestTome:{name:'森の秘伝書',kind:'tome',rarity:'rare',sell:20},mineTome:{name:'廃鉱の秘伝書',kind:'tome',rarity:'rare',sell:25},towerTome:{name:'星見の秘伝書',kind:'tome',rarity:'epic',sell:30},respec:{name:'振り直し札',kind:'respec',rarity:'rare',sell:20},
    rustySword:{name:'見習いの剣',kind:'weapon',rarity:'common',sell:10,atk:3},banditDagger:{name:'盗賊の短剣',kind:'weapon',rarity:'uncommon',sell:28,atk:5},lightSword:{name:'軽量の剣',kind:'weapon',rarity:'uncommon',sell:24,atk:4},mageStaff:{name:'魔術師の杖',kind:'weapon',rarity:'rare',sell:40,atk:6}
  };
  const rarityLabels={common:'コモン',uncommon:'アンコモン',rare:'レア',epic:'エピック',legendary:'レジェンダリー'};
  const treeSpecs=[['attack','攻撃','#d77560'],['critical','会心','#e5ae61'],['thunder','雷と属性','#80a8db'],['survival','生存','#75c69c'],['bounty','賞金','#e5bd6c'],['luck','幸運と宝箱','#a9a2e8'],['gather','採取','#8ccf86'],['companions','仲間','#d89bbb'],['petIndividual','ペット個体','#7cbcc1'],['petGrowth','ペット育成','#b9ca75'],['tavern','酒場','#d99770'],['processing','加工場','#9bb7a7']];
  const statCycle={attack:[['attack',3],['hp',2],['crit',.5]],critical:[['crit',.5],['attack',2],['critDamage',1]],thunder:[['lightningRate',1],['lightningDamage',1],['attack',1]],survival:[['hp',2],['defense',1],['heal',1]],bounty:[['battleGold',1],['battleGoldPct',1],['bountyGold',1]],luck:[['chestGoldPct',1],['rareRate',.1],['attack',1]],gather:[['gatherSuccess',1],['materialSalePct',1],['rareRate',.1]],companions:[['allyAttack',1],['allyHp',2],['allyDefense',1]],petIndividual:[['petPower',1],['petHp',2],['petRate',.5]],petGrowth:[['petPointPct',2],['petPointPct',2],['petPointPct',3]],tavern:[['tavernGold',1],['mealPower',1],['hp',1]],processing:[['materialSalePct',2],['processSpeedPct',1],['processSlots',0]]};
  const statNames={attack:'攻撃力',hp:'最大HP',crit:'会心率',critDamage:'会心ダメージ',lightningRate:'雷撃率',lightningDamage:'雷撃威力',defense:'防御力',heal:'回復量',battleGold:'戦闘報酬',battleGoldPct:'戦闘報酬率',bountyGold:'賞金',chestGoldPct:'宝箱のG',rareRate:'レア率',gatherSuccess:'採取成功率',materialSalePct:'素材売値',allyAttack:'仲間の攻撃',allyHp:'仲間のHP',allyDefense:'仲間の防御',petPower:'ペットの攻撃',petHp:'ペットのHP',petRate:'ペット効果',petPointPct:'育成点追加率',tavernGold:'酒場収入',mealPower:'料理の力',processSpeedPct:'加工速度',processSlots:'加工枠',speed:'素早さ',heavenHp:'初期HP',heavenStamina:'最大スタミナ',heavenGold:'初期G'};
  function costFor(tier,spoke){return tier<=1?5+spoke*2:tier===2?20+spoke*3:tier===3?55+spoke*9:tier===4?130+spoke*14:tier===5?280+spoke*24:tier===6?600+spoke*48:1200+spoke*100;}
  function generateTree(id,name,color,count=80){const nodes=[],spokes=id==='petGrowth'?1:12;for(let i=0;i<count;i++){
      const tier=id==='petGrowth'?i: i===0?0:1+Math.floor((i-1)/spokes),spoke=id==='petGrowth'?0:i===0?0:(i-1)%spokes;
      const angle=spoke/spokes*Math.PI*2-Math.PI/2,radius=80+tier*92;
      const x=id==='petGrowth'?80+Math.floor(i/8)*110:Math.round(Math.cos(angle)*radius),y=id==='petGrowth'?i%8*95:Math.round(Math.sin(angle)*radius);
      const cycle=statCycle[id]||(id==='heaven'?[['heavenHp',1],['heavenStamina',1],['heavenGold',1]]:[['attack',1],['hp',2],['speed',1]]),stat=cycle[i%cycle.length],prerequisites=[];
      if(i>0)prerequisites.push(id==='petGrowth'?`${id}:${i-1}`:tier===1?`${id}:0`:`${id}:${i-spokes}`);
      if(id!=='petGrowth'&&tier>=3&&spoke%4===3&&i>spokes+1)prerequisites.push(`${id}:${i-1}`);
      const label=i===0?`${name}の起点`:id==='petGrowth'?`育成の記録 ${i}`:`${name}の星 ${i}`;
      nodes.push({nodeId:`${id}:${i}`,treeId:id,x,y,prerequisites,unlockKind:'normal',costG:id==='petGrowth'?Math.ceil(5*Math.pow(1.15,i)):costFor(tier,spoke),rarity:tier>=6?'epic':tier>=4?'rare':tier>=2?'uncommon':'common',name:label,description:`${statNames[stat[0]]||stat[0]} +${stat[1]}。同じ系統を奥へ進める。`,effects:stat[1]?[{stat:stat[0],amount:stat[1]}]:[],tier,spoke});
    }return {id,name,color,nodes};}
  const trees=treeSpecs.map(([id,name,color])=>generateTree(id,name,color));
  const byId=Object.fromEntries(trees.map(t=>[t.id,t]));
  function patch(id,fields){Object.assign(trees.flatMap(t=>t.nodes).find(n=>n.nodeId===id),fields);}
  patch('gather:1',{name:'霧の森への地図',description:'新しい採取地へ行ける。',effects:[{flag:'mistGather'}]});
  patch('gather:2',{name:'湿地の道しるべ',description:'古代の湿地へ行ける。',effects:[{flag:'marshGather'}]});
  patch('gather:3',{name:'連続採取',description:'採取を1/5/10回でまとめて進める。',effects:[{flag:'batchGather'}]});
  patch('survival:3',{name:'寝る子は育つ',description:'余ったスタミナで翌日の攻撃を強化。',effects:[{flag:'sleepBuff'}]});
  patch('survival:24',{name:'廃鉱の許可証',description:'廃鉱へ進める。',effects:[{flag:'mineAccess'}]});
  patch('thunder:24',{name:'星見の道',description:'星見の塔へ進める。',effects:[{flag:'towerAccess'}]});
  patch('thunder:36',{name:'過充電',description:'雷撃率の超過分を威力へ変える。',effects:[{flag:'overcharge'}]});
  patch('companions:1',{name:'控えの加護',costG:1000,prerequisites:[],description:'控えの仲間のパッシブ25%を得る。',effects:[{flag:'reservePassive'}]});
  patch('companions:2',{name:'出撃枠の拡張 I',description:'人の仲間の出撃枠+1。',effects:[{stat:'allySlots',amount:1}]});
  patch('companions:14',{name:'出撃枠の拡張 II',description:'人の仲間の出撃枠+1。',effects:[{stat:'allySlots',amount:1}]});
  patch('tavern:0',{name:'酒場開業',costG:80,description:'閉まっている施設を開き、翌日から日収8G。',effects:[{flag:'openTavern'}]});
  patch('tavern:1',{name:'攻めの料理',description:'出撃前に攻撃の料理を注文できる。',effects:[{flag:'attackMeal'}]});
  patch('tavern:2',{name:'採取の料理',description:'出撃前に採取の料理を注文できる。',effects:[{flag:'gatherMeal'}]});
  patch('tavern:3',{name:'食いしん坊',description:'料理の予約枠+1。',effects:[{stat:'mealSlots',amount:1}]});
  patch('processing:0',{name:'素材の目利き',description:'加工場がなくても素材売値+2%。',effects:[{stat:'materialSalePct',amount:2}]});
  patch('processing:1',{name:'追加の作業台',description:'加工枠+1。',effects:[{stat:'processSlots',amount:1}]});
  patch('attack:36',{name:'余剰の鍛錬',description:'確率超過を攻撃力に変える。',effects:[{flag:'overflowAttack'}]});
  const jobTrees=Object.fromEntries(Object.keys(jobs).map(job=>[job,generateTree(`job-${job}`,`${jobs[job].name}の技`,'#e6b981',40)]));
  for(const [job,t] of Object.entries(jobTrees)){t.nodes[0].name=`${jobs[job].name}の心得`;t.nodes[0].effects=[{stat:'jobRate',amount:3}];t.nodes[0].description=`${jobs[job].name}固有行動の発動率+3%。`;for(let i=1;i<t.nodes.length;i+=6){t.nodes[i].effects=[{stat:'jobRate',amount:2+Math.floor(i/12)}];t.nodes[i].description=`${jobs[job].name}固有行動の発動率を強化。`;}}
  const heavenTree=generateTree('heaven','天界','#b8a9e5',80);heavenTree.nodes[0].name='オート探索';heavenTree.nodes[0].costG=5;heavenTree.nodes[0].effects=[{flag:'autoExplore'}];
  for(let i=1;i<=7;i++)heavenTree.nodes[i].prerequisites=[];
  [['heaven:1','基礎HP+2',5,'heavenHp',2],['heaven:2','最大スタミナ+5',8,'heavenStamina',5],['heaven:3','初期G+5',8,'heavenGold',5],['heaven:4','採取の追求枠',5,'pursuitSlots',1],['heaven:5','ペット初期レベル+2',10,'petStartLevel',2],['heaven:6','育成効率+10%',10,'petPointPct',10],['heaven:7','余剰の鍛錬',15,'overflowAttack',1]].forEach(([id,name,cost,stat,amount])=>patchHeaven(id,{name,costG:cost,effects:[{stat,amount}]}));
  function patchHeaven(id,fields){Object.assign(heavenTree.nodes.find(n=>n.nodeId===id),fields);}
  const bookSources={forestTome:['attack','gather','petIndividual'],mineTome:['survival','companions','processing'],towerTome:['thunder','tavern','critical']};
  const hiddenNodes=[];Object.entries(bookSources).forEach(([book,ids])=>ids.forEach((treeId,branch)=>{for(let i=0;i<4;i++){const anchor=byId[treeId].nodes[25+branch*4+i];hiddenNodes.push({nodeId:`${book}:${treeId}:${i}`,treeId,x:anchor.x+40+i*28,y:anchor.y+50+i*25,prerequisites:[anchor.nodeId],unlockKind:'book',sourceBookId:book,costG:100+i*90,rarity:'rare',name:`${items[book].name}の奥義 ${i+1}`,description:`📖《${items[book].name}》由来の追加効果。`,effects:[{stat:statCycle[treeId][i%3][0],amount:5+i}]});}}));
  const weaponProtect=[5,15,40].map((cost,i)=>({nodeId:`heaven:weaponProtect${i+1}`,treeId:'heaven',x:150+i*85,y:160,prerequisites:i?[`heaven:weaponProtect${i}`]:[],unlockKind:'stolen',costG:cost,rarity:'rare',name:`奪われた武器の記憶 ${i+1}`,description:`賞金首の武器奪取率を${30-(i+1)*10}%に下げる。`,effects:[{stat:'weaponProtection',amount:10}]}));
  const allNodes=[...trees.flatMap(t=>t.nodes),...Object.values(jobTrees).flatMap(t=>t.nodes),...heavenTree.nodes,...hiddenNodes,...weaponProtect];
  const nodeMap=Object.fromEntries(allNodes.map(n=>[n.nodeId,n]));
  const data={C,pets,jobs,allies,gatherAreas,dungeons,enemies,bountyDefs,items,rarityLabels,trees,jobTrees,heavenTree,hiddenNodes,weaponProtect,nodeMap,bookSources,allNodes};
  root.GameData=data;if(typeof module!=='undefined'&&module.exports)module.exports=data;
})(typeof window!=='undefined'?window:globalThis);
