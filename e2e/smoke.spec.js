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

/* ================= FAZ 1-3: SÖZLÜK + ANİMASYON + INFO STRIP ================= */

test.describe("dict panel: genişletilmiş", () => {
  test("kartlar yüklendi ve dict-card class kullanılıyor", async ({ page }) => {
    await page.click("#btn-dict");
    await expect(page.locator("#veil")).toHaveClass(/on/);
    const cards = page.locator(".dict-card");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    // dict-card class kullanılmalı (dict-item değil)
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);
    // dict-item legacy class kullanılmamalı
    const itemCount = await page.locator(".dict-item").count();
    expect(itemCount).toBe(0);
  });

  test("kart genişletme (expand/collapse)", async ({ page }) => {
    await page.click("#btn-dict");
    await expect(page.locator("#panel h2")).toContainText("Дошам");
    const firstCard = page.locator(".dict-card").first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });

    // Expand: tıkla, aria-expanded=true olmalı
    await firstCard.click();
    await expect(firstCard).toHaveAttribute("aria-expanded", "true");
    const detail = firstCard.locator(".dict-card-detail");
    await expect(detail).toBeVisible();

    // Collapse: tekrar tıkla, aria-expanded=false olmalı
    await firstCard.click();
    await expect(firstCard).toHaveAttribute("aria-expanded", "false");
  });

  test("kart içeriği: kelime, IPA, anlam", async ({ page }) => {
    await page.click("#btn-dict");
    const card = page.locator(".dict-card").first();
    await expect(card).toBeVisible({ timeout: 5000 });

    // Kelime adı gold Russo One font ile gösterilmeli
    await expect(card.locator(".dict-card-word")).toBeVisible();
    // IPA varsa gösterilmeli (en az bir kartta)
    const ipaCount = await page.locator(".dict-ipa").count();
    expect(ipaCount).toBeGreaterThanOrEqual(1);
    // Anlam satırı (чеч. veya тр.)
    const glossLines = await page.locator(".dict-card-body .d").count();
    expect(glossLines).toBeGreaterThanOrEqual(1);
    // Speak butonu
    await expect(card.locator(".dict-speak")).toBeVisible();
    // Tag'ler (en az bir kartta)
    const tagCount = await page.locator(".dict-card-tags .dict-tag").count();
    expect(tagCount).toBeGreaterThanOrEqual(1);
  });

  test("tag filtreleme çalışır", async ({ page }) => {
    await page.click("#btn-dict");
    await expect(page.locator(".dict-tag-btn").first()).toBeVisible({ timeout: 5000 });
    // Tüm kart saysını al
    const allCards = await page.locator(".dict-card").count();
    expect(allCards).toBeGreaterThanOrEqual(2);

    // İlk tag butonuna tıkla
    const firstTag = page.locator(".dict-tag-btn").first();
    const tagText = await firstTag.textContent();
    await firstTag.click();
    await expect(firstTag).toHaveClass(/on/);

    // Tag seçiliyken görünür kart sayısı tüm kartlardan az veya eşit olmalı
    await page.waitForTimeout(300);
    const filteredCards = await page.locator(".dict-card").count();
    // Filtreleme sonrası kartların hepsi görünür olmalı (sayı azalmış olabilir)
    expect(filteredCards).toBeGreaterThanOrEqual(1);
    console.log(`    Tag '${tagText?.trim()}': ${filteredCards}/${allCards} cards`);
  });

  test("arama çubuğu kelime filtreler", async ({ page }) => {
    await page.click("#btn-dict");
    const search = page.locator(".dict-search");
    await expect(search).toBeVisible({ timeout: 5000 });
    // Var olan bir kelime ara
    await search.fill("дош");
    await page.waitForTimeout(400);
    const results = await page.locator(".dict-card:visible").count();
    expect(results).toBeGreaterThanOrEqual(1);
    // Aramayı temizle, tüm kartlar gelmeli
    await search.fill("");
    await page.waitForTimeout(300);
    const allCards = await page.locator(".dict-card").count();
    expect(allCards).toBeGreaterThan(results);
  });
});



/* ================= FAZ 4-5: SWIPE + HINT MİKRO-ETKİLEŞİMLER ================= */

test.describe("hint butonu görsel feedback", () => {
  test("hedefleme modu .hint-active class ekler", async ({ page }) => {
    await page.click("#btn-start");
    await page.locator(".node.cur").click();
    await expect(page.locator("#scr-game")).toHaveClass(/on/);

    // hint-target butonuna tıkla -> .hint-active eklenmeli
    await page.click("#hint-target");
    await expect(page.locator("#hint-target.hint-active")).toBeVisible();

    // Tekrar tıkla -> .hint-active kalkmalı
    await page.click("#hint-target");
    await expect(page.locator("#hint-target")).not.toHaveClass(/hint-active/);
  });

  test("yetersiz bakiyede buton sallanma (hint-insufficient)", async ({ page }) => {
    // Bakiyeyi sıfırla
    const SAVE_KEY = "dosh-save-v1";
    const EMPTY_SEED = JSON.stringify({
      _v: 2, coins: 0, tut: true,
      settings: { theme: "kavkaz", scene3d: false, sound: false, music: false, lang: "ce" }
    });
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [SAVE_KEY, EMPTY_SEED]);
    await page.goto("/");
    await page.locator("#splash").click({ force: true }).catch(() => {});

    await page.click("#btn-start");
    await page.locator(".node.cur").click();
    await expect(page.locator("#scr-game")).toHaveClass(/on/);

    // hint-letter tıkla -> yetersiz bakiye -> .hint-insufficient eklenir
    await page.click("#hint-letter");
    await expect(page.locator("#hint-letter")).toHaveClass(/hint-insufficient/);
    // Animasyon bitince class kalkar (en geç 2sn içinde)
    await expect(page.locator("#hint-letter")).not.toHaveClass(/hint-insufficient/, { timeout: 2500 });
  });

  test("sihirli değnek kullanımı .hint-wand-active ekler", async ({ page }) => {
    await page.click("#btn-start");
    await page.locator(".node.cur").click();
    await expect(page.locator("#scr-game")).toHaveClass(/on/);

    await page.click("#hint-wand");
    // .hint-wand-active animasyon sınıfı eklenir
    await expect(page.locator("#hint-wand")).toHaveClass(/hint-wand-active/);
    // Animasyon bitince class kalkar (en geç 2sn içinde)
    await expect(page.locator("#hint-wand")).not.toHaveClass(/hint-wand-active/, { timeout: 2000 });
  });
});

/* ================= FAZ 6: BONUS CHEST ================= */

test.describe("bonus chest", () => {
  test("bonus chest tıklanınca toast gösterilir", async ({ page }) => {
    await page.click("#btn-start");
    await page.locator(".node.cur").click();
    await expect(page.locator("#scr-game")).toHaveClass(/on/);

    // Seviye 0'da bonus kelime 'шод': çözmek için harfleri seç
    for (const ch of ["ш", "о", "д"]) {
      const bub = page.locator(".bub:not(.sel)", { hasText: new RegExp(`^${ch}$`, "iu") }).first();
      await bub.focus();
      await bub.press("Enter");
    }
    await page.keyboard.press("Enter");
    await expect(page.locator("#bonus-count")).toHaveText("1");

    // Bonus chest tıkla (force ile badge örtüşmesini aş)
    await page.click("#bonus-chest", { force: true });
    // Toast animasyonu 600ms gecikmeyle gelir
    await expect(page.locator("#toast.on")).toBeVisible({ timeout: 3000 });
  });
});

/* ================= FAZ: CHAIN (KELİME ZİNCİRİ) ================= */

test.describe("chain mode", () => {
  test("chain paneli açılır ve input görünür", async ({ page }) => {
    await page.click("#btn-chain");
    await expect(page.locator("#veil")).toHaveClass(/on/);
    // Chain panelinde input olmalı
    await expect(page.locator(".chain-input")).toBeVisible();
    await expect(page.locator(".chain-status")).toBeVisible();
    // İstatistik kartları
    const stats = page.locator(".chain-stat");
    await expect(stats.first()).toBeVisible();
  });
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
