// Presentation-only sprite registry. Provisional ally names can change without touching save data.
(function () {
  const root = 'assets/characters/';
  const heroes = {
    warrior: 'hero-warrior-v1.png', knight: '../../hero-knight-v1.png',
    thief: 'hero-thief-v1.png', mage: 'hero-mage-v1.png',
    priest: 'hero-priest-v1.png', gambler: 'hero-gambler-v2.png'
  };
  const allies = [
    ['karen', 'カレン', 'warrior', '一撃・純火力', false],
    ['borg', 'ボルグ', 'warrior', '低HP・自己強化', true],
    ['lily', 'リリィ', 'warrior', '手数・連鎖', true],
    ['gald', 'ガルド', 'knight', '鉄壁・かばう', false],
    ['isabel', 'イザベル', 'knight', '受け流し・反撃', true],
    ['elliot', 'エリオット', 'knight', '不屈・守護', true],
    ['yui', 'ユイ', 'thief', '毒・連鎖', false],
    ['shion', 'シオン', 'thief', '弱体・デバフ', true],
    ['nico', 'ニコ', 'thief', '略奪・宝箱', true],
    ['olwyn', 'オルウィン', 'mage', '雷・属性連鎖', false],
    ['mimi', 'ミミ', 'mage', '火炎・追加魔法', true],
    ['ash', 'アシュ', 'mage', '氷結・属性反応', true],
    ['serina', 'セリナ', 'priest', '回復・状態異常解除', false],
    ['lucian', 'ルシアン', 'priest', '祝福・バフ', false],
    ['fran', 'フラン', 'priest', '障壁・過剰回復', false],
    ['jack', 'ジャック', 'gambler', '大当たり・連続当選', false],
    ['viola', 'ヴィオラ', 'gambler', '失敗蓄積・不運貯金', true],
    ['moru', 'モル', 'gambler', '一攫千金・レア報酬', true]
  ].map(([id, name, job, specialty, provisional]) => ({
    id, name, job, specialty, provisional,
    src: root + (id === 'serina' ? 'serina-idle-v1.png' : `ally-${id}-v1.png`)
  }));
  window.CharacterArt = {
    hero: Object.fromEntries(Object.entries(heroes).map(([id, path]) => [id, root + path])),
    allies,
    byId: Object.fromEntries(allies.map(ally => [ally.id, ally]))
  };
  window.CharacterArt.galleryHTML = escape => {
    const labels = {warrior:'戦士',knight:'騎士',thief:'盗賊',mage:'魔法使い',priest:'僧侶',gambler:'賭博師'};
    const card = (src, name, detail='') => `<div class="character-card"><img src="${src}" alt="${escape(name)}" loading="lazy"><b>${escape(name)}</b>${detail ? `<small>${escape(detail)}</small>` : ''}</div>`;
    return `<section class="panel character-gallery"><h2>キャラクター図鑑</h2><p class="note">主人公6職・仲間18人の画像資料。現在のゲームで未実装の職業・仲間は鑑賞用です。「仮」の名前・設定は変更できます。</p><h3>主人公</h3><div class="character-grid">${Object.entries(window.CharacterArt.hero).map(([id,src]) => card(src,labels[id])).join('')}</div><h3>仲間</h3><div class="character-grid">${allies.map(a => card(a.src,a.name+(a.provisional?'（仮）':''),labels[a.job]+' · '+a.specialty)).join('')}</div></section>`;
  };
})();
