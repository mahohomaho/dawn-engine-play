(function (root) {
  'use strict';

  const cloneActor = actor => ({
    id: actor.id, name: actor.name, job: actor.job, hp: actor.hp,
    maxHp: actor.maxHp, statuses: Array.isArray(actor.statuses) ? [...actor.statuses] : []
  });
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const key = (side, id) => `${side}-${String(id).replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  function capture(state) {
    const fight = state.expedition?.fight;
    if (!fight) return null;
    return {
      fight,
      defense: state.expedition?.kind === 'raid',
      raidTier: state.expedition?.raidTier,
      log: [...fight.log],
      heroes: fight.heroes.map(cloneActor),
      enemies: fight.enemies.map(cloneActor),
      round: fight.round
    };
  }

  function parseLine(line, heroes, enemies) {
    const all = [...heroes.map(actor => ({ ...actor, side: 'hero' })),
      ...enemies.map(actor => ({ ...actor, side: 'enemy' }))];
    const byName = name => all.find(actor => actor.name === name);
    let match = /^(.+?)→(.+?) (\d+)(?: (会心))?$/.exec(line);
    if (match) {
      const actor = byName(match[1]), target = byName(match[2]);
      if (!actor || !target) return null;
      return { kind: attackKind(actor), actor: key(actor.side, actor.id),
        target: key(target.side, target.id), amount: +match[3], critical: !!match[4], line };
    }
    match = /^(.+?)が(.+?)を(\d+)回復(?:（緊急ヒール）)?$/.exec(line);
    if (match) {
      const actor = byName(match[1]), target = byName(match[2]);
      if (!actor || !target) return null;
      return { kind: 'heal', actor: key(actor.side, actor.id),
        target: key(target.side, target.id), amount: +match[3], line };
    }
    match = /^(.+?)の緊急ヒール \+(\d+)$/.exec(line);
    if (match) {
      const actor = byName(match[1]);
      if (actor) return { kind: 'heal', actor: key(actor.side, actor.id),
        target: null, amount: +match[2], line };
    }
    match = /^⚡雷撃 (\d+)$/.exec(line);
    if (match && enemies[0]) return { kind: 'lightning', actor: null,
      target: key('enemy', enemies[0].id), amount: +match[1], line };
    match = /^ポーションでHP\+(\d+)$/.exec(line);
    if (match && heroes[0]) return { kind: 'heal', actor: key('hero', heroes[0].id),
      target: key('hero', heroes[0].id), amount: +match[1], line };
    match = /^ぷるの再生 \+(\d+)$/.exec(line);
    if (match && heroes[0]) return { kind: 'heal', actor: key('hero', 'pet'),
      target: key('hero', heroes[0].id), amount: +match[1], line };
    if (/MISS|ミス/.test(line)) return { kind: 'miss', actor: null, target: null, amount: 0, line };
    if (/毒|火傷|麻痺|凍結|気絶/.test(line)) return { kind: 'status', actor: null, target: null, amount: 0, line };
    return null;
  }

  function attackKind(actor) {
    if (actor.job === 'mage' || actor.job === 'priest') return 'magic';
    if (actor.job === 'warrior' || actor.job === 'knight' || actor.job === 'thief') return 'slash';
    return 'impact';
  }

  function newLines(before, after) {
    if (after.length >= before.length && before.every((line, index) => line === after[index])) return after.slice(before.length);
    for (let overlap = Math.min(before.length, after.length); overlap > 0; overlap--) {
      if (before.slice(-overlap).every((line, index) => line === after[index])) return after.slice(overlap);
    }
    return after;
  }

  function prepare(before, result) {
    if (!before || result?.type === 'error') return null;
    const logs = newLines(before.log, before.fight.log);
    // The engine may clear the encounter or trim its 80-line history after the round.
    const relevant = logs.length ? logs : (result?.log || []);
    let skillCallout = '';
    const actions = relevant.flatMap(line => {
      if (/^.+の.+！$/.test(line)) { skillCallout = line; return []; }
      const action = parseLine(line, before.heroes, before.enemies);
      if (!action) return [];
      if (skillCallout) { action.callout = skillCallout; skillCallout = ''; }
      return [action];
    });
    return {
      heroes: before.heroes, enemies: before.enemies,
      defense: before.defense,
      raidTier: before.raidTier,
      finalHeroes: before.fight.heroes.map(cloneActor),
      finalEnemies: before.fight.enemies.map(cloneActor),
      actions, logs: [...before.fight.log], round: before.round + 1,
      result: result?.type, message: result?.message || ''
    };
  }

  function actorImage(actor, side, options) {
    if (side === 'enemy') return options.sprites.enemy(actor.id);
    if (actor.id === 'hero') return options.art.hero[options.run.job] || options.art.hero.knight;
    if (actor.id === 'pet') return options.sprites.pet(options.run.pet);
    return options.art.byId[actor.id]?.src || 'ally-placeholder.svg';
  }

  function actorMarkup(actor, side, options) {
    const id = key(side, actor.id), ratio = Math.max(0, Math.min(100, actor.hp / Math.max(1, actor.maxHp) * 100));
    const statuses = Array.isArray(actor.statuses) ? actor.statuses : [];
    return `<div class="combat-actor ${side} ${ratio <= 25 ? 'is-low' : ''}" data-combat-id="${id}">
      <div class="combat-portrait"><img src="${actorImage(actor, side, options)}" alt="${escapeHtml(actor.name)}"></div>
      <div class="combat-identity"><b>${escapeHtml(actor.name)}</b><div class="combat-hpbar" role="meter" aria-label="${escapeHtml(actor.name)}のHP" aria-valuenow="${actor.hp}" aria-valuemin="0" aria-valuemax="${actor.maxHp}"><i style="width:${ratio}%"></i></div><small class="combat-hptext">${actor.hp}/${actor.maxHp}</small>${statuses.length ? `<span class="combat-status">${statuses.map(escapeHtml).join(' ')}</span>` : ''}</div>
      <div class="combat-floats" aria-hidden="true"></div></div>`;
  }

  function currentEnemyId(expedition, data) {
    if (expedition.fight) return expedition.fight.enemyId;
    if (expedition.encounter) return expedition.encounter.enemy;
    if (expedition.kind === 'raid') return expedition.raidTier === data.C.totalRaids ? 'demonKing' : `raid${expedition.raidTier}`;
    if (expedition.kind === 'final') return 'demonKing';
    if (expedition.kind === 'bounty') return data.bountyDefs[expedition.area]?.enemy;
    return null;
  }

  function render(options) {
    const { expedition: x, data: D, playback, run, button: btn } = options;
    const fight = x?.fight, enemyId = x && currentEnemyId(x, D);
    const defense = x?.kind === 'raid' || !!playback?.defense;
    const heroes = playback?.heroes || fight?.heroes || [
      { id: 'hero', name: '主人公', hp: x?.hp || 0, maxHp: options.maxHp, statuses: [] },
      ...(run.activeAllies || []).slice(0, defense ? 3 : 4).map(id => ({ id, name: D.allies[id]?.name || id, hp: D.jobs[D.allies[id]?.job]?.hp || 1, maxHp: D.jobs[D.allies[id]?.job]?.hp || 1, statuses: [] })),
      { id: 'pet', name: D.pets[run.pet]?.nick || '相棒', hp: 12 + (run.petLevels?.[run.pet] || 0), maxHp: 12 + (run.petLevels?.[run.pet] || 0), statuses: [] }
    ];
    const enemies = playback?.enemies || fight?.enemies || (enemyId ? [{ id: enemyId,
      name: D.enemies[enemyId]?.name || '魔物', hp: D.enemies[enemyId]?.hp || 1,
      maxHp: D.enemies[enemyId]?.hp || 1, statuses: [] }] : []);
    const area = D.worldMap.find(place => place.id === x?.area);
    const areaName = defense ? 'ギルド前の広場' : D.gatherAreas.find(place => place.id === x?.area)?.name || D.dungeons.find(place => place.id === x?.area)?.name || area?.name || x?.area || '遠征';
    const background = defense ? 'guild-square-defense-v1.png' : area?.backdrop || 'forest-v3.png';
    const log = playback?.logs || fight?.log || x?.battleLog || [];
    const isFighting = !!(fight || playback), auto = x?.auto || {};
    const won = ['win', 'bossWin', 'bountyWin', 'raidWin', 'ending'].includes(playback?.result);
    const lost = ['defeat', 'heaven'].includes(playback?.result);
    const resultLabel = playback && !x?.fight ? (won ? defense ? 'GUILD DEFENDED!' : 'VICTORY!' : lost ? defense ? '防衛線が突破された……' : 'DEFEAT' : '') : '';
    const reward = won && options.feedback ? `<div class="reward-reveal combat-victory" role="status"><b>${defense ? 'GUILD DEFENDED!' : '勝利！'}</b>${options.feedback.gold ? `<strong class="reward-amount">+${options.feedback.gold}G</strong>` : ''}${options.feedback.loot.length ? `<small>${options.feedback.loot.slice(0,3).map(item => `${escapeHtml(D.items[item.id]?.name || item.id)}${item.count > 1 ? ` ×${item.count}` : ''}`).join(' · ')}${options.feedback.loot.length>3?' ほか':''}</small>` : ''}</div>` : '';
    const resolved = !!playback && !fight;
    const controls = resolved ? `<div class="combat-resolved">${defense && won ? 'ギルドの防衛に成功しました！<br>' : defense && lost ? 'ギルドは魔王軍に制圧された。<br>' : ''}${escapeHtml(playback.message)}</div>` : isFighting ? `<div class="combat-main-actions ${defense ? 'defense-actions' : ''}">${btn('次のラウンド', 'battle', { action: 'attack' }, 'primary combat-next')}${defense ? '' : btn('撤退', 'battle', { action: 'retreat' }, 'warn combat-retreat')}</div>
      <div class="combat-secondary">${run.job === 'priest' ? btn('ヒール', 'battle', { action: 'heal' }, 'green') : ''}${run.inventory.some(item => item.defId === 'potion') ? btn('ポーション', 'battle', { action: 'potion' }, 'green') : ''}</div>` : `<div class="combat-main-actions">${run.stamina >= D.C.battleStartCost ? btn('戦闘を始める ⚡3', 'battle', {}, 'primary combat-next') : btn('スタミナ不足 · 帰還', 'return', {}, 'primary combat-next')}${btn('ギルドへ帰還', 'return', {}, 'combat-retreat')}</div>`;
    return `<section class="combat-screen ${playback ? 'is-playing' : ''} ${defense ? 'is-defense' : ''}" aria-label="${defense ? 'ギルド防衛戦' : '戦闘画面'}">
      <div class="combat-stage ${heroes.length > 4 ? 'is-crowded' : ''}" style="--combat-background:url('${background}')">
        <div class="combat-stage-head"><span>${escapeHtml(areaName)}</span><strong>${defense ? `防衛戦 ${playback?.raidTier || x?.raidTier || run.raidCount + 1}/${D.C.totalRaids} · ` : ''}${isFighting ? `ROUND ${playback?.round ?? fight?.round ?? 0}` : 'ENCOUNTER!'}</strong></div>
        <div class="combat-party" data-count="${heroes.length}">${heroes.map(actor => actorMarkup(actor, 'hero', options)).join('')}</div>
        <div class="combat-effect" aria-hidden="true"><div class="combat-effect-mark"></div></div>
        <div class="combat-foes">${enemies.map(actor => actorMarkup(actor, 'enemy', options)).join('')}</div>
        <div class="combat-action-callout" role="status" aria-live="polite">${!isFighting && enemies[0] ? `${escapeHtml(enemies[0].name)}が現れた！` : ''}</div>
        ${defense && fight?.round === 0 && !playback ? `<div class="defense-alarm" role="status"><b>魔王軍襲来！！</b><span>${escapeHtml(enemies[0]?.name || '魔王軍')}がギルド前に現れた！</span></div>` : ''}
        ${won ? reward : resultLabel ? `<div class="combat-result" role="status">${resultLabel}</div>` : ''}
      </div>
      <div class="combat-dock"><div class="combat-summary"><b>${enemies[0] ? escapeHtml(enemies[0].name) : '戦闘'}</b><span>⚡ ${Math.floor(run.stamina)}　${defense ? `編成 ${heroes.length}人` : `🎒 ${(x?.bag?.length || 0) + (x?.overflow?.length || 0)}個`}</span></div>
        ${controls}${resolved ? '' : `<div class="combat-tools">${btn(`自動戦闘 ${auto.battle ? 'ON' : 'OFF'}`, 'auto', { battle: !auto.battle }, `small combat-auto ${auto.battle ? 'is-on' : ''}`)}${btn(`速度 ${options.speed}倍`, 'speed', {}, 'small')}</div>`}
        <details class="combat-log"><summary>戦闘ログ ${log.length ? `(${log.length})` : ''}</summary><div class="log">${log.slice(-30).map(escapeHtml).join('<br>')}</div></details>
        ${defense ? '' : `<details class="combat-stops"><summary>自動停止の条件</summary><div class="grid2">${[['stopBoss', 'ボス前'], ['stopRare', '発見時'], ['stopBag', 'バッグ満杯'], ['stopLowHp', 'HP低下']].map(([id, label]) => btn(`${label} ${auto[id] ? 'ON' : 'OFF'}`, 'auto', { [id]: !auto[id] }, 'small')).join('')}</div></details>`}
      </div></section>`;
  }

  function play(rootElement, presentation, speed, onComplete) {
    const stage = rootElement.querySelector('.combat-stage');
    if (!stage || !presentation) { onComplete(); return () => {}; }
    const reduced = root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const actions = presentation.actions;
    const step = reduced ? 0 : Math.max(180, Math.min(330, 1250 / Math.max(1, actions.length))) / (speed === 2 ? 2 : 1);
    const health = new Map([...presentation.heroes.map(a => [key('hero', a.id), a.hp]),
      ...presentation.enemies.map(a => [key('enemy', a.id), a.hp])]);
    let timer, cancelled = false, index = 0;
    const finish = () => {
      if (cancelled) return;
      [...presentation.finalHeroes.map(a => [key('hero', a.id), a]),
        ...presentation.finalEnemies.map(a => [key('enemy', a.id), a])].forEach(([id, actor]) => updateHp(rootElement, id, actor.hp, actor.maxHp));
      timer = setTimeout(onComplete, ['win', 'bossWin', 'bountyWin', 'raidWin', 'ending', 'defeat', 'heaven'].includes(presentation.result) ? (reduced ? 0 : 650 / (speed === 2 ? 2 : 1)) : 0);
    };
    const next = () => {
      if (cancelled) return;
      stage.querySelectorAll('.combat-actor').forEach(node => node.classList.remove('is-attacking', 'is-hit', 'is-healing'));
      stage.querySelector('.combat-effect').className = 'combat-effect';
      if (index >= actions.length) { finish(); return; }
      const action = actions[index++], actor = action.actor && rootElement.querySelector(`[data-combat-id="${action.actor}"]`), target = action.target && rootElement.querySelector(`[data-combat-id="${action.target}"]`);
      actor?.classList.add('is-attacking');
      target?.classList.add(action.kind === 'heal' ? 'is-healing' : 'is-hit');
      stage.querySelector('.combat-effect').classList.add(`effect-${action.kind}`);
      stage.querySelector('.combat-action-callout').textContent = action.callout ? `${action.callout} ${action.line}` : action.line;
      if (target && action.amount) {
        const previous = health.get(action.target) ?? 0;
        const max = +(target.querySelector('.combat-hpbar')?.getAttribute('aria-valuemax') || 1);
        const hp = Math.max(0, Math.min(max, previous + (action.kind === 'heal' ? action.amount : -action.amount)));
        health.set(action.target, hp);
        const float = document.createElement('span');
        float.className = `combat-number number-${action.kind} ${action.critical ? 'is-critical' : ''}`;
        float.textContent = action.kind === 'heal' ? `+${action.amount}` : action.kind === 'miss' ? 'MISS' : `${action.amount}${action.critical ? '!' : ''}`;
        float.style.setProperty('--offset', `${(index % 3 - 1) * 17}px`);
        target.querySelector('.combat-floats')?.append(float);
        timer = setTimeout(() => { if (!cancelled) updateHp(rootElement, action.target, hp, max); }, step * .34);
        setTimeout(() => float.remove(), Math.max(700, step * 2));
      }
      timer = setTimeout(next, step);
    };
    timer = setTimeout(next, reduced ? 0 : 90 / (speed === 2 ? 2 : 1));
    return () => { cancelled = true; clearTimeout(timer); };
  }

  function updateHp(rootElement, id, hp, max) {
    const node = rootElement.querySelector(`[data-combat-id="${id}"]`);
    if (!node) return;
    const bar = node.querySelector('.combat-hpbar');
    bar?.setAttribute('aria-valuenow', String(hp));
    if (bar) bar.querySelector('i').style.width = `${Math.max(0, Math.min(100, hp / Math.max(1, max) * 100))}%`;
    node.querySelector('.combat-hptext').textContent = `${hp}/${max}`;
    node.classList.toggle('is-low', hp / Math.max(1, max) <= .25);
  }

  root.BattleView = { capture, prepare, parseLine, render, play, currentEnemyId };
})(typeof window !== 'undefined' ? window : globalThis);
