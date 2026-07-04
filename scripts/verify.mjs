import { chromium } from "/home/pc/dosh-oyun/node_modules/playwright/index.mjs";
const OUT = "/tmp/claude-1000/-home-pc-dosh-oyun/601d4269-c826-4e2c-8446-e182813bed25/scratchpad";
const SEED = JSON.stringify({ _v: 2, coins: 120, tut: true, stars: { 0: 3, 1: 2 },
  settings: { theme: "kavkaz", scene3d: false, sound: false, music: false, lang: "ce" } });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.addInitScript(([k, v]) => localStorage.setItem(k, v), ["dosh-save-v1", SEED]);
await page.goto("http://localhost:8765/");
await page.waitForTimeout(3000);
// çizgi kalıntısı testi: seviye 3'ü aç, beш çöz
await page.click("#btn-start"); await page.waitForTimeout(500);
await page.locator(".node.cur").click(); await page.waitForTimeout(900);
async function play(letters) {
  let bub;
  for (const ch of letters) {
    bub = page.locator(".bub:not(.sel)", { hasText: new RegExp(`^${ch}$`, "iu") }).first();
    await bub.focus(); await bub.press("Enter");
  }
  await page.keyboard.press("Enter");
}
await play(["б", "е", "ш"]);
await page.waitForTimeout(1300);
await page.screenshot({ path: `${OUT}/v1-solved-line.png` });
// ayarlar: dil seçici
await page.click("#game-settings"); await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/v2-settings.png` });
// feedback butonları
await page.click("#set-feedback"); await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/v3-feedback.png` });
await page.keyboard.press("Escape"); await page.keyboard.press("Escape");
// daily göstergesi
await page.click("#game-back"); await page.waitForTimeout(400);
await page.click("#map-back"); await page.waitForTimeout(400);
await page.click("#btn-daily", { force: true }); await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/v4-daily.png` });
await browser.close();
console.log("ok");
