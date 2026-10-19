(function(root){
  'use strict';
  const base='assets/sprites/';
  const enemy={goblin:'goblin',caveBat:'cave-bat',starWisp:'star-wisp',forestGuardian:'forest-guardian',oreGuardian:'ore-guardian',starGuardian:'star-guardian',redcap:'redcap',runawayMage:'runaway-mage',raid1:'raid-scout',raid2:'raid-soldier',raid3:'raid-captain',raid4:'raid-general',raid5:'raid-grand-general',demonKing:'demon-king'};
  for(let tier=6;tier<=19;tier++)enemy[`raid${tier}`]=['raid-scout','raid-soldier','raid-captain','raid-general','raid-grand-general'][Math.min(4,Math.floor((tier-1)/4))];
  const item={herb:'herb',blueHerb:'blue-flower',mushroom:'mushroom',moonleaf:'moonleaf',crystalMoss:'crystal',ancientSeed:'seed',clover:'clover',potion:'potion',redcapCharm:'ring',redcapJournal:'book',spellCharm:'gem',mageBook:'book',forestTome:'book',mineTome:'book',towerTome:'book',respec:'scroll',rustySword:'sword',banditDagger:'dagger',lightSword:'sword',mageStaff:'staff',guildSaber:'sword',emberBlade:'dagger',starLance:'spear',dawnEdge:'greatsword',kingsOath:'greatsword',
    I01:'sword',I02:'dagger',I03:'spear',I04:'spear',I05:'dagger',I06:'greatsword',I07:'shield',I08:'cloak',I09:'boots',I10:'armor',I11:'ring',I12:'bell',I13:'ring',I14:'clover',I15:'compass',I16:'compass',I17:'book',I18:'book',I19:'book',I20:'book',I21:'book',I22:'book',I23:'book',I24:'book',I25:'herb',I26:'hardwood',I27:'honey-crystal',I28:'silver-mushroom',I29:'lightning-stone',I30:'star-dew',I31:'medal',I32:'banknotes',I33:'book',I34:'book',I35:'book',I36:'scroll',I37:'keys',I38:'ring',I39:'seed',I40:'coins'};
  const byKind={material:'herb',consumable:'potion',weapon:'sword',armor:'armor',accessory:'ring',book:'book',tome:'book',respec:'scroll',treasure:'coins',relic:'gem'};
  root.SpriteArt={
    enemy:id=>base+`enemy-${enemy[id]||'goblin'}.png`,
    pet:id=>base+`pet-${['dog','cat','owl','slime'].includes(id)?id:'dog'}.png`,
    item:(id,def)=>base+`item-${item[id]||byKind[def?.kind]||'gem'}.png`
  };
})(typeof window!=='undefined'?window:globalThis);
