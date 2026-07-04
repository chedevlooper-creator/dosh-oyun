/* ================= DOSH DRIVER =================
 * Headless-Chromium harness for driving the running game (dev server
 * must already be up — see SKILL.md). Uses the project's own Playwright
 * install; no extra deps.
 *
 *   node .claude/skills/run-dosh-oyun/driver.mjs <flow> [--url URL] [--out DIR]
 *
 * flows:
 *   home      ana ekran render olur → screenshot
 *   solve     harita → seviye 1 → "дош" çöz → screenshot (çekirdek döngü)
 *   daily     günlük bulmaca açılır → screenshot
 *   settings  ayarlar paneli + tema değişimi → screenshot
 *   all       hepsi sırayla (tek browser'da)
 *
 * Screenshot'lar OUT dizinine <flow>-<step>.png olarak düşer.
 * Konsol hataları yakalanır; varsa sonda listelenir ve exit 1.
 * ================================================ */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const flow = args.find((a) => !a.startsWith("--")) || "home";
const getOpt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const URL = getOpt("url", "http://localhost:8765");
const OUT = resolve(getOpt("out", "/tmp/dosh-shots"));
mkdirSync(OUT, { recursive: true });

/* Kayıt seed'i: tutorial atlanır, 3D/ses kapalı (headless'ta WebGL yok) */
const SEED = JSON.stringify({
  _v: 2,
  coins: 200,
  tut: true,
  settings: { theme: "kavkaz", scene3d: false, sound: false, music: false, lang: "ce" },
});

const consoleErrors = [];
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));

await page.addInitScript(([k, v]) => localStorage.setItem(k, v), ["dosh-save-v1", SEED]);

async function shot(name) {
  const p = `${OUT}/${name}.png`;
  await page.screenshot({ path: p });
  console.log(`  📸 ${p}`);
}

/* Çark: harf balonlarını klavyeyle sür (e2e/smoke.spec.js ile aynı yol).
 * Balon metni dispG ile BÜYÜK gösterilir → "iu" regex. Son harfte odak
 * balonda kalır; ikinci Enter kelimeyi gönderir. */
async function playWord(letters) {
  for (const ch of letters) {
    const bub = page.locator(".bub:not(.sel)", { hasText: new RegExp(`^${ch}$`, "iu") }).first();
    await bub.focus();
    await bub.press("Enter");
  }
  await page.keyboard.press("Enter");
}

async function goHome() {
  await page.goto(URL);
  // splash dokunuşla kapanır ama DOM'dan silinmesi ~2.6s (main.js) —
  // temiz screenshot için detach'i bekle
  await page.locator("#splash").click({ force: true }).catch(() => {});
  await page.waitForSelector("#splash", { state: "detached", timeout: 5000 }).catch(() => {});
  await page.waitForSelector("#btn-start", { state: "visible" });
}

const flows = {
  async home() {
    await goHome();
    await shot("home");
  },

  async solve() {
    await goHome();
    await page.click("#btn-start");
    await page.waitForSelector("#scr-map.on");
    await shot("solve-map");
    await page.locator(".node.cur").click();
    await page.waitForSelector("#scr-game.on");
    await page.waitForSelector(".bub"); // çark kuruldu
    await playWord(["д", "о", "ш"]);
    await page.waitForSelector(".cell.fill"); // ızgara doldu
    await shot("solve-word");
  },

  async daily() {
    await goHome();
    // sonsuz glow animasyonu → stability beklemesini atla
    await page.click("#btn-daily", { force: true });
    await page.waitForSelector("#scr-game.on");
    await page.waitForSelector(".bub");
    await shot("daily");
  },

  async settings() {
    await goHome();
    await page.click("#btn-settings");
    await page.waitForSelector("#veil.on");
    await page.locator('.tdot[data-t="night"]').click();
    await page.waitForFunction(() => document.body.classList.contains("theme-night"));
    await shot("settings-night");
    await page.click("#set-close");
  },
};

const toRun = flow === "all" ? Object.keys(flows) : [flow];
if (!toRun.every((f) => flows[f])) {
  console.error(`Bilinmeyen flow: ${flow}. Geçerli: ${Object.keys(flows).join(", ")}, all`);
  process.exit(2);
}

let failed = false;
for (const f of toRun) {
  console.log(`▶ ${f}`);
  try {
    await flows[f]();
    console.log(`✓ ${f}`);
  } catch (e) {
    failed = true;
    console.error(`✗ ${f}: ${e.message.split("\n")[0]}`);
    await shot(`${f}-FAILED`).catch(() => {});
  }
}

await browser.close();

if (consoleErrors.length) {
  console.error(`\nKonsol hataları (${consoleErrors.length}):`);
  for (const e of consoleErrors.slice(0, 10)) console.error(`  • ${e.slice(0, 200)}`);
  failed = true;
}
console.log(failed ? "\nSONUÇ: FAIL" : "\nSONUÇ: OK");
process.exit(failed ? 1 : 0);
