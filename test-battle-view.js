const assert = require('node:assert/strict');
require('./battle-view.js');
const view = globalThis.BattleView;

const heroes = [
  { id: 'hero', name: '主人公', job: 'warrior', hp: 24, maxHp: 30 },
  { id: 'pet', name: 'ポチ', job: 'pet', hp: 10, maxHp: 14 }
];
const enemies = [{ id: 'goblin', name: '森のゴブリン', hp: 12, maxHp: 12 }];
const fight = { heroes: structuredClone(heroes), enemies: structuredClone(enemies), log: [], round: 0 };
const before = view.capture({ expedition: { fight } });
fight.log.push('主人公→森のゴブリン 5 会心', '森のゴブリン→ポチ 3', 'ポチ→森のゴブリン 2', '勝利 +7G');
fight.heroes[1].hp = 7;
fight.enemies[0].hp = 0;
const presentation = view.prepare(before, { type: 'win', message: '勝利', log: fight.log });
assert.equal(presentation.actions.length, 3);
assert.deepEqual(presentation.actions.map(action => action.kind), ['slash', 'impact', 'impact']);
assert.equal(presentation.actions[0].critical, true);
assert.equal(presentation.actions[1].target, 'hero-pet');
assert.equal(presentation.finalEnemies[0].hp, 0);
assert.equal(view.parseLine('主人公がポチを5回復', heroes, enemies).kind, 'heal');
assert.equal(view.parseLine('⚡雷撃 6', heroes, enemies).kind, 'lightning');
assert.equal(view.parseLine('MISS', heroes, enemies).kind, 'miss');
const longFight = { heroes: structuredClone(heroes), enemies: structuredClone(enemies),
  log: Array.from({ length: 80 }, (_, index) => `古い記録${index}`), round: 4 };
const longBefore = view.capture({ expedition: { fight: longFight } });
longFight.log.splice(0, 2);
longFight.log.push('主人公→森のゴブリン 4', '森のゴブリン→主人公 2');
assert.equal(view.prepare(longBefore, { type: 'round' }).actions.length, 2);
console.log('Battle presentation checks passed');
