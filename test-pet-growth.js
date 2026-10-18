const assert = require('node:assert/strict');
require('./data.js');
require('./catalog.js');
require('./v3-data.js');
const PG = require('./pet-growth.js');
require('./engine.js');
require('./v3-engine.js');
const { GameEngine, newState } = global.GuildEngine;

function start(pet = 'dog', seed = 777) {
  const game = new GameEngine(newState(seed));
  game.dispatch('CHOOSE_START', { job: 'warrior', pet });
  return game;
}

for (const id of ['dog', 'cat', 'owl', 'slime']) {
  for (const level of [1, 9, 10, 19, 20, 30, 50, 100, 1000, 1001]) {
    const basic = PG.basic(id, level);
    assert(Number.isFinite(basic.multiplier));
    assert(PG.basic(id, level + 1).multiplier > basic.multiplier, `${id} level ${level} must grow`);
    assert(Number.isFinite(PG.stats(id, level).hp));
  }
}
assert.notEqual(PG.basic('dog', 30).followup, PG.basic('cat', 30).followup);
assert.equal(PG.basic('dog', 10).crit, 10);
assert(PG.basic('owl', 10).weakpoint > 0);
assert(PG.basic('slime', 10).heal);

const batch = start();
batch.state.run.petPoints = 20;
assert.equal(batch.dispatch('LEVEL_PET', { pet: 'dog', count: 5 }).type, 'petLevel');
assert.equal(batch.state.run.petLevels.dog, 6);
assert.equal(batch.state.run.petPoints, 15);
assert.equal(batch.dispatch('LEVEL_PET', { pet: 'dog', count: 11 }).type, 'error');
batch.state.run.petLevels.dog = 19;
batch.state.run.petPoints = 2;
assert.equal(batch.dispatch('LEVEL_PET', { pet: 'dog' }).type, 'petLevel');
assert.equal(batch.state.run.petLevels.dog, 20);
assert.equal(batch.dispatch('CHOOSE_PET_SKILL', { id: 'P02' }).type, 'pet');
assert.equal(batch.state.run.petSecond.dog, 'P02');
assert(PG.basic('dog', 21, 'P02').multiplier > PG.basic('dog', 21).multiplier);
const loaded = new GameEngine(structuredClone(batch.state));
assert.equal(loaded.state.run.petSecond.dog, 'P02');
assert.equal(PG.basic('dog', loaded.petLevel('dog'), loaded.state.run.petSecond.dog).multiplier, PG.basic('dog', 20, 'P02').multiplier);

function petHit(level) {
  const game = start();
  game.state.run.petLevels.dog = level;
  game.dispatch('DEPART', { kind: 'dungeon', area: 'forest' });
  game.state.expedition.encounter = { enemy: 'goblin' };
  game.dispatch('BATTLE');
  const fight = game.state.expedition.fight;
  fight.heroes[0].hp = 0;
  fight.heroes.at(-1).atk = 100;
  fight.enemies[0].hp = fight.enemies[0].maxHp = 1000;
  fight.enemies[0].atk = 0;
  game.random = () => .5;
  game.dispatch('BATTLE', { action: 'attack' });
  assert(fight.log.some(line => line.includes('コロの噛みつき！')));
  return Number(fight.log.find(line => line.startsWith('コロ→')).split(' ').at(-1));
}
assert.equal(petHit(2), petHit(1) + 1);

const high = start('cat');
high.state.run.petLevels.cat = 1000;
high.state.run.petPoints = 1000;
high.dispatch('CHOOSE_PET_SKILL', { id: 'P03' });
assert(Number.isFinite(PG.second('P03', 1000).tavernPct));
assert.equal(high.dispatch('LEVEL_PET', { pet: 'cat' }).type, 'petLevel');
assert.equal(high.petLevel('cat'), 1001);

function preparedFight(pet, level, secondId) {
  const game = start(pet);
  game.state.run.petLevels[pet] = level;
  game.state.run.petSecond = game.state.run.petSecond || {};
  game.state.run.petSecond[pet] = secondId;
  game.dispatch('DEPART', { kind: 'dungeon', area: 'forest' });
  game.state.expedition.encounter = { enemy: 'goblin' };
  game.dispatch('BATTLE');
  const fight = game.state.expedition.fight;
  fight.heroes[0].hp = 0;
  fight.heroes.at(-1).atk = 1;
  fight.enemies[0].hp = fight.enemies[0].maxHp = 100000;
  fight.enemies[0].atk = 8;
  return { game, fight };
}
const delayed = preparedFight('dog', 1000, 'P02');
delayed.game.random = () => .5;
delayed.game.dispatch('BATTLE');
assert(delayed.fight.log.some(line => line.includes('足止め吠え')));
assert(!delayed.fight.log.some(line => line.startsWith('森のゴブリン→')));

const guarded = preparedFight('slime', 1000, 'P07');
guarded.game.random = () => .5;
guarded.game.dispatch('BATTLE');
assert(guarded.fight.log.some(line => line.includes('分けっこ')));

const tavern = start('cat');
tavern.state.run.petLevels.cat = 1000;
tavern.state.run.petSecond = {};
tavern.state.run.petSecond.cat = 'P03';
tavern.state.run.skills.push('S44');
const beforeGold = tavern.state.run.gold;
tavern.dispatch('SLEEP');
assert.equal(tavern.state.run.gold - beforeGold, Math.floor(8 * (1 + (PG.passive('cat', 1000).tavernPct + PG.second('P03', 1000).tavernPct) / 100)));

console.log('Pet growth checks passed');
