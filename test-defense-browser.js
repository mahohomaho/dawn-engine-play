const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--allow-file-access-from-files'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(path.join(__dirname, 'index.html')).href);
  await page.evaluate(() => {
    const game = new window.GuildEngine.GameEngine();
    game.dispatch('CHOOSE_START', { job: 'warrior', pet: 'dog' });
    game.state.run.gold = 120;
    game.dispatch('REPAY');
    game.dispatch('SLEEP');
    localStorage.setItem('guild-rebuild-tutorial-v1', 'done');
    game.snapshot();
  });
  await page.reload();
  for (const remaining of [3, 2, 1]) {
    await page.getByRole('dialog', { name: '魔王軍襲来の予告' }).waitFor();
    assert.match(await page.locator('.raid-kicker').innerText(), new RegExp(`あと${remaining}日`));
    await page.getByRole('button', { name: /わかった/ }).click();
    assert.equal(await page.locator('.raid-warning-dialog').count(), 0);
    if (remaining > 1) {
      await page.getByRole('button', { name: '一日を終える' }).click();
      await page.getByRole('button', { name: '一日進める' }).click();
    }
  }
  await page.getByRole('button', { name: '一日を終える' }).click();
  assert.match(await page.getByRole('dialog', { name: '操作の確認' }).innerText(), /防衛戦が始まります/);
  await page.getByRole('button', { name: '一日進める' }).click();
  await page.locator('.combat-screen.is-defense').waitFor();
  assert.equal(await page.locator('.combat-stage').evaluate(node => getComputedStyle(node).getPropertyValue('--combat-background').includes('guild-square-defense-v1.png')), true);
  assert.equal(await page.locator('.combat-actor.hero').count(), 2);
  assert.equal(await page.locator('.combat-actor.enemy').count(), 1);
  assert.equal(await page.locator('.combat-retreat').count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.getByRole('button', { name: '自動戦闘 OFF' }).click();
  await page.getByRole('button', { name: '速度 1倍' }).click();
  assert.match(await page.locator('.combat-auto').innerText(), /ON/);
  assert.match(await page.locator('[data-act="speed"]').innerText(), /2倍/);
  await page.getByRole('button', { name: '自動戦闘 ON' }).click();
  await page.evaluate(() => { const button = document.querySelector('.combat-next'); button.click(); button.click(); button.click(); });
  await page.waitForTimeout(650);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('guild-rebuild-complete-v2')));
  assert(state.expedition === null || state.expedition.fight.round <= 1, 'rapid taps must not run multiple rounds');
  assert.deepEqual(errors, []);
  const victory = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const victoryPage = await victory.newPage();
  await victoryPage.goto(pathToFileURL(path.join(__dirname, 'index.html')).href);
  await victoryPage.evaluate(() => {
    const game = new window.GuildEngine.GameEngine();
    game.dispatch('CHOOSE_START', { job: 'warrior', pet: 'dog' });
    game.state.run.gold = 120;
    game.dispatch('REPAY');
    game.dispatch('START_DEFENSE');
    game.state.expedition.fight.enemies[0].hp = 1;
    game.state.expedition.fight.enemies[0].atk = 0;
    localStorage.setItem('guild-rebuild-tutorial-v1', 'done');
    game.snapshot();
  });
  await victoryPage.reload();
  await victoryPage.locator('.combat-next').click();
  await victoryPage.locator('.combat-result').waitFor();
  assert.match(await victoryPage.locator('.combat-result').innerText(), /GUILD DEFENDED!/);
  await victoryPage.locator('.combat-screen').waitFor({ state: 'detached', timeout: 5000 });
  assert.equal(await victoryPage.locator('.goal-aside').count(), 1);
  await victory.close();
  await browser.close();
  console.log('Guild defense browser checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
