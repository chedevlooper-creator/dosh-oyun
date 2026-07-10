import { test, expect } from "@playwright/test";

/* ================= SMOKE: gerçek oyun akışı =================
 * Kayıt seed'lenir (tutorial atlanır, 3D kapalı — headless'ta WebGL
 * gerekmez), sonra çekirdek döngü klavye erişilebilirliğiyle sürülür:
 * harf balonları Enter ile seçilir, son harfte ikinci Enter gönderir. */

const SAVE_KEY = "dosh-save-v1";
const SEED = JSON.stringify({
  _v: 2,
  coins: 100,
  tut: true,
  settings: { theme: "kavkaz", scene3d: false, sound: false, music: false, lang: "ce" },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([k, v]) => localStorage.setItem(k, v),
    [SAVE_KEY, SEED],
  );
  await page.goto("/");
  // açılış ekranı dokunuşla kapanır; kalktıysa sorun değil
  await page.locator("#splash").click({ force: true }).catch(() => {});
});

/** Çarktaki harfleri Enter ile seç, son harfte ikinci Enter'la gönder.
 * Balon metni dispG ile BÜYÜK harf gösterilir → regex "iu". */
async function playWord(page, letters) {
  for (const ch of letters) {
    const bub = page
      .locator(".bub:not(.sel)", { hasText: new RegExp(`^${ch}$`, "iu") })
      .first();
    await bub.focus();
    await bub.press("Enter");
  }
  // odak son balonda kaldı; ikinci Enter kelimeyi gönderir
  await page.keyboard.press("Enter");
}

test("ana ekran yüklenir", async ({ page }) => {
  await expect(page.locator("#logo")).toHaveText("Дош");
  await expect(page.locator("#btn-start")).toBeVisible();
  await expect(page.locator("#btn-daily")).toBeVisible();
});

test("harita → seviye 1 → iki kelime → seviye sonu paneli", async ({ page }) => {
  await page.click("#btn-start");
  await expect(page.locator("#scr-map")).toHaveClass(/on/);

  await page.locator(".node.cur").click();
  await expect(page.locator("#scr-game")).toHaveClass(/on/);
  await expect(page.locator(".bub")).toHaveCount(4); // seviye 0: д о ш о

  await playWord(page, ["д", "о", "ш"]);
  await expect(page.locator(".cell.fill")).toHaveCount(3);
  await expect(page.locator("#lvl-progress")).toHaveText("1/2");

  // dolu hücreye dokun → anlam şeridi kelimeyi gösterir
  await page.locator(".cell.fill").first().click();
  await expect(page.locator("#info-strip")).toHaveClass(/on/);
  await expect(page.locator("#info-strip .info-word")).toContainText("ДОШ");

  await playWord(page, ["д", "о"]);
  // seviye sonu: kutlama paneli + öğrenme özeti
  await expect(page.locator("#panel h2")).toContainText("Декъал");
  await expect(page.locator(".recap-item").first()).toBeVisible();
});

test("günlük bulmaca açılır ve çark gelir", async ({ page }) => {
  // glow animasyonu sonsuz döngü → stability beklemesini atla
  await page.click("#btn-daily", { force: true });
  await expect(page.locator("#scr-game")).toHaveClass(/on/);
  await expect(page.locator(".bub").first()).toBeVisible();
});

test("ayarlar açılır, tema değişir, kapanır", async ({ page }) => {
  await page.click("#btn-settings");
  await expect(page.locator("#veil")).toHaveClass(/on/);
  await page.locator('.tdot[data-t="night"]').click();
  await expect(page.locator("body")).toHaveClass(/theme-night/);
  await page.click("#set-close");
  await expect(page.locator("#veil")).not.toHaveClass(/on/);
});

test("geri bildirim paneli: tür/kelime/mesaj bağlantılara işlenir", async ({ page }) => {
  await page.click("#btn-settings");
  await page.click("#set-feedback");
  await expect(page.locator("#fb-word")).toBeVisible();

  await page.locator('.fb-type[data-t="fix"]').click();
  await page.fill("#fb-word", "болх");
  await page.fill("#fb-text", "test mesajı");

  const gh = await page.locator("#fb-github").getAttribute("href");
  expect(gh).toContain("labels=feedback,word-fix");
  expect(gh).toContain(encodeURIComponent("Нисдар: болх"));
  const mail = await page.locator("#fb-mail").getAttribute("href");
  expect(mail).toContain("mailto:");
  expect(mail).toContain(encodeURIComponent("test mesajı"));
});

test("sözlük paneli tüm kelimeleri gösterir", async ({ page }) => {
  await page.click("#btn-dict");
  await expect(page.locator("#panel h2")).toContainText("Дошам");
  // INFO verisi yüklü olduğu için boş durum gösterilmez
  await expect(page.locator("#panel .dict-card").first()).toBeVisible({ timeout: 5000 });
});

/* ================= ADIM 7: GENİŞLETİLMİŞ E2E TESTS ================= */

test.describe("time attack", () => {
  test("başlatılır ve zaman çubuğu görünür", async ({ page }) => {
    await page.click("#btn-timeattack");
    await expect(page.locator("#scr-game")).toHaveClass(/on/);
    await expect(page.locator("#ta-bar")).toBeVisible();
    // TA'de lvl-progress gösterilmez; lvl-num seviye sayacını gösterir
    await expect(page.locator("#lvl-num")).not.toBeEmpty();
  });
});

test.describe("hints", () => {
  test("harf ipucu bir hücreyi doldurur", async ({ page }) => {
    await page.click("#btn-start");
    await page.locator(".node.cur").click();
    await expect(page.locator("#scr-game")).toHaveClass(/on/);
    await page.click("#hint-letter");
    await expect(page.locator(".cell.fill").first()).toBeVisible();
    await expect(page.locator(".cell.hintfill").first()).toBeVisible();
  });

  test("hedef ipucu tıklanan hücreyi doldurur", async ({ page }) => {
    await page.click("#btn-start");
    await page.locator(".node.cur").click();
    await page.click("#hint-target");
    await expect(page.locator(".cell.target").first()).toBeVisible();
    await page.locator(".cell.target").first().click();
    await expect(page.locator(".cell.fill.hintfill").first()).toBeVisible();
  });

  test("sihirli değnek 3 hücre doldurur", async ({ page }) => {
    await page.click("#btn-start");
    await page.locator(".node.cur").click();
    await page.click("#hint-wand");
    await expect(page.locator(".cell.fill")).toHaveCount(3);
    await expect(page.locator(".cell.hintfill")).toHaveCount(3);
  });
});

test.describe("bonus kelime", () => {
  test("bonus kelime bulunur ve sayaç güncellenir", async ({ page }) => {
    await page.click("#btn-start");
    await page.locator(".node.cur").click();
    await expect(page.locator("#scr-game")).toHaveClass(/on/);
    // Level 0 bonus: шод — select ш, о, д
    for (const ch of ["ш", "о", "д"]) {
      await page.locator(".bub:not(.sel)", { hasText: new RegExp(`^${ch}$`, "iu") }).first().focus();
      await page.locator(".bub:not(.sel)", { hasText: new RegExp(`^${ch}$`, "iu") }).first().press("Enter");
    }
    await page.keyboard.press("Enter");
    await expect(page.locator("#bonus-count")).toHaveText("1");
    await expect(page.locator("#toast")).toContainText("Карина бонус");
  });
});

test.describe("dil değiştirme", () => {
  test("dil seçeneği kaydedilir ve sayfa yüklendiğinde okunur", async ({ page }) => {
    // beforeEach'deki addInitScript lang'i "ce" yapar.
    // Bu test için ikinci bir initScript ekleyip öncekinin
    // etkisini geçersiz kılıyoruz (FIFO sırasıyla çalışırlar).
    await page.addInitScript(([k]) => {
      const raw = localStorage.getItem(k);
      if (raw) {
        const data = JSON.parse(raw);
        data.settings.lang = "ru";
        localStorage.setItem(k, JSON.stringify(data));
      }
    }, [SAVE_KEY]);
    await page.goto("/");
    await page.locator("#splash").click({ force: true }).catch(() => {});
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("ru");
  });
});

test.describe("yıldız", () => {
  test("seviye 0 hatasız tamamlanınca 3 yıldız", async ({ page }) => {
    await page.click("#btn-start");
    await page.locator(".node.cur").click();
    await expect(page.locator("#scr-game")).toHaveClass(/on/);

    // Kelime 1: дош
    await playWord(page, ["д", "о", "ш"]);
    await expect(page.locator("#lvl-progress")).toHaveText("1/2");
    // Kelime 2: до
    await playWord(page, ["д", "о"]);
    // Kutlama paneli + 3 yıldız
    await expect(page.locator("#panel h2")).toContainText("Декъал");
    await expect(page.locator("#stars-row")).toBeVisible();
    await expect(page.locator("#stars-row .lit")).toHaveCount(3);
  });
});
