const assert = require('node:assert/strict');
require('./data.js');
require('./catalog.js');
require('./v3-data.js');
require('./engine.js');
require('./v3-engine.js');
const { GameEngine, newState } = global.GuildEngine;

function ready(seed = 100) {
  const game = new GameEngine(newState(seed));
  game.dispatch('CHOOSE_START', { job: 'warrior', pet: 'dog' });
  game.state.run.gold = 120;
  game.dispatch('REPAY');
  return game;
}

const due = ready();
assert.equal(due.state.run.due.dueDay, 5);
for (const day of [2, 3, 4]) {
  assert.equal(due.dispatch('SLEEP').type, 'day');
  assert.equal(due.state.run.day, day);
  assert.equal(due.state.expedition, null);
}
due.state.run.stamina = 0;
assert.equal(due.dispatch('SLEEP').type, 'raidArrival');
assert.equal(due.state.run.day, 5);
assert.equal(due.state.expedition.kind, 'raid');
assert.equal(due.state.expedition.defense, true);
assert.equal(due.state.expedition.fight.enemyId, 'raid1');
assert.deepEqual(due.state.expedition.fight.heroes.map(actor => actor.id), ['hero', 'pet']);
assert.equal(due.dispatch('SLEEP').type, 'error');
assert.equal(due.dispatch('RETURN').type, 'error');
assert.equal(due.dispatch('BATTLE', { action: 'retreat' }).type, 'error');
assert.equal(due.state.expedition.fight.round, 0);

const loaded = new GameEngine(structuredClone(due.state));
assert.equal(loaded.state.expedition.fight.enemyId, 'raid1');
assert.equal(loaded.state.expedition.fight.round, 0);
const oldDue = ready(101);
oldDue.state.run.day = 5;
oldDue.state.run.stamina = 0;
const resumed = new GameEngine(structuredClone(oldDue.state));
assert.equal(resumed.state.expedition.fight.enemyId, 'raid1');
assert.equal(resumed.state.run.stamina, resumed.state.run.maxStamina - 13);

const party = ready(102);
party.state.run.alliesOwned = ['rio', 'nico', 'mina', 'erika'];
party.state.run.activeAllies = ['rio', 'nico', 'mina', 'erika'];
assert.equal(party.dispatch('START_DEFENSE').type, 'raidArrival');
assert.deepEqual(party.state.expedition.fight.heroes.map(actor => actor.id), ['hero', 'rio', 'nico', 'mina', 'pet']);
party.state.expedition.fight.enemies[0].hp = 1;
party.state.expedition.fight.enemies[0].atk = 0;
const beforeGold = party.state.run.gold;
assert.equal(party.dispatch('BATTLE', { action: 'attack' }).type, 'raidWin');
assert.equal(party.state.run.raidCount, 1);
assert.equal(party.state.run.due.type, 'debt');
assert.equal(party.state.expedition, null);
assert.equal(party.state.run.gold - beforeGold, global.GameData.enemies.raid1.reward);
assert.equal(party.dispatch('BATTLE', { action: 'attack' }).type, 'error');
assert.equal(party.state.run.raidCount, 1);

const defeat = ready(103);
defeat.dispatch('START_DEFENSE');
defeat.state.expedition.fight.heroes.forEach(actor => { actor.hp = 0; });
assert.equal(defeat.dispatch('BATTLE', { action: 'attack' }).type, 'heaven');
assert.equal(defeat.state.run.due.type, 'heaven');
assert.equal(defeat.state.expedition, null);
assert.equal(defeat.dispatch('BATTLE', { action: 'attack' }).type, 'error');

console.log('Guild defense checks passed');
