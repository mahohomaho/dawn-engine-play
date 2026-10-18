const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = pathToFileURL(path.join(__dirname, 'index.html')).href;
  await page.goto(url);
  await page.evaluate(() => {
    const game = new window.GuildEngine.GameEngine();
    game.dispatch('CHOOSE_START', { job: 'warrior', pet: 'dog' });
    game.state.run.petPoints = 100;
    localStorage.setItem('guild-rebuild-tutorial-v1', 'done');
    game.snapshot();
  });
  await page.reload();
  await page.locator('[data-panel="ally"]').click();
  if (process.env.PET_SCREENSHOT) await page.screenshot({ path: process.env.PET_SCREENSHOT });
  assert.match(await page.locator('.pet-skill-card').first().innerText(), /噛みつき[\s\S]*100%/);
  assert.match(await page.locator('.pet-growth-next').innerText(), /100% → 101%/);
  assert.equal(await page.locator('.pet-large-art').evaluate(image => image.naturalWidth > 0), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('[data-act="levelPet"]').first().click();
  assert.match(await page.locator('.pet-level-dialog').innerText(), /Lv\.1 → Lv\.2/);
  assert.match(await page.locator('.pet-level-dialog').innerText(), /100% → 101%/);
  await page.locator('[data-act="petGrowthDismiss"]').click();
  assert.match(await page.locator('.pet-hero-card').innerText(), /Lv\.2/);

  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('guild-rebuild-complete-v2'));
    state.run.petLevels.dog = 9;
    state.run.petPoints = 100;
    localStorage.setItem('guild-rebuild-complete-v2', JSON.stringify(state));
  });
  await page.reload();
  await page.locator('[data-panel="ally"]').click();
  await page.locator('[data-act="levelPet"]').first().click();
  assert.match(await page.locator('.pet-level-dialog').innerText(), /SKILL POWER UP!/);
  assert.match(await page.locator('.pet-new-effect').innerText(), /会心率\+10%/);
  await page.locator('[data-act="petGrowthDismiss"]').click();

  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('guild-rebuild-complete-v2'));
    state.run.petLevels.dog = 19;
    state.run.petPoints = 100;
    localStorage.setItem('guild-rebuild-complete-v2', JSON.stringify(state));
  });
  await page.reload();
  await page.locator('[data-panel="ally"]').click();
  await page.locator('[data-act="levelPet"]').first().click();
  await page.locator('[data-act="petGrowthDismiss"]').click();
  assert.equal(await page.locator('.pet-second-option').count(), 2);
  await page.locator('.pet-second-option').nth(1).locator('[data-act="petSkill"]').click();
  assert.match(await page.locator('.pet-skill-card').last().innerText(), /足止め吠え/);
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('guild-rebuild-complete-v2')));
  assert.equal(saved.run.petLevels.dog, 20);
  assert.equal(saved.run.petSecond.dog, 'P02');
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('Pet growth browser checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
