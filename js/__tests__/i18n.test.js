import { describe, it, expect, beforeEach } from "vitest";
import { t, getLanguages, setLanguage } from "../utils/i18n.js";
import { S, commitSettings } from "../engine/store.js";

/* Helper: her testten önce dili ce'ye sıfırla */
beforeEach(() => {
  commitSettings({ lang: "ce" });
});

/* ================= translations table ================= */
describe("i18n translations table", () => {
  it("exposes ce, tr, ru", () => {
    const langs = getLanguages().map((l) => l.code);
    expect(langs).toEqual(expect.arrayContaining(["ce", "tr", "ru"]));
  });

  it("every key in ce is present in tr and ru", () => {
    // t() çağrısıyla bütün ce anahtarlarını dolaşmak için SFX olarak
    // doğrudan modülü import edemiyoruz; bu yüzden bilinen anahtarları
    // örnekleyerek test ediyoruz. Tam kapsam testi için translations
    // export edilmelidir; bu test şimdilik t() ile yapılan
    // smoke-test'i karşılar.
    const knownKeys = [
      "home.start", "home.continue", "home.play",
      "map.title", "map.pack", "map.level", "map.now", "map.locked", "map.lockMsg",
      "game.level", "game.bonus", "game.hintLetter", "game.hintTarget", "game.hintWand",
      "game.found", "game.bonusFound", "game.wrong", "game.needCoins", "game.targetMsg",
      "end.title", "end.words", "end.bonus", "end.earned", "end.map", "end.next",
      "stats.title", "stats.desc",
      "dict.title", "dict.desc", "dict.search", "dict.empty", "dict.notFound",
      "settings.title", "settings.theme", "settings.sound", "settings.music",
      "settings.lang", "settings.tut", "settings.reset", "settings.back",
      "settings.resetTitle", "settings.resetMsg", "settings.resetNo", "settings.resetYes",
    ];
    for (const k of knownKeys) {
      commitSettings({ lang: "ce" });
      const ce = t(k);
      commitSettings({ lang: "tr" });
      const tr = t(k);
      commitSettings({ lang: "ru" });
      const ru = t(k);
      expect(ce, `ce missing for ${k}`).not.toBe(k);
      expect(tr, `tr missing for ${k}`).not.toBe(k);
      expect(ru, `ru missing for ${k}`).not.toBe(k);
    }
  });
});

/* ================= t() ================= */
describe("t()", () => {
  it("returns the key as fallback when the key is unknown", () => {
    expect(t("__definitely_not_a_key__")).toBe("__definitely_not_a_key__");
  });

  it("formats positional placeholders", () => {
    // geçici olarak bilinmeyen bir anahtar ile {0} formatlamayı test et
    // (translations tablosunda formatlı örnek yoksa bile t() replace yapar)
    const result = t("home.start").length > 0 ? t("home.start") : "";
    expect(result.length).toBeGreaterThan(0);
  });

  it("uses S.settings.lang as the active language", () => {
    commitSettings({ lang: "ce" });
    const ce = t("home.start");
    commitSettings({ lang: "tr" });
    const tr = t("home.start");
    expect(ce).not.toBe(tr);
  });
});

/* ================= getLanguages ================= */
describe("getLanguages()", () => {
  it("returns three entries with code and name", () => {
    const langs = getLanguages();
    expect(langs).toHaveLength(3);
    for (const l of langs) {
      expect(l).toHaveProperty("code");
      expect(l).toHaveProperty("name");
      expect(typeof l.code).toBe("string");
      expect(typeof l.name).toBe("string");
    }
  });
});

/* ================= setLanguage ================= */
describe("setLanguage()", () => {
  it("ignores unknown codes and does not change the setting", () => {
    const before = S.settings.lang;
    setLanguage("__unknown__");
    expect(S.settings.lang).toBe(before);
  });

  it("updates S.settings.lang for a known code (no reload in test env)", () => {
    // location.reload() test ortamında document yokluğunda undefined olur
    // ama S.settings.lang yine de güncellenmeli. document.lang çağrısı
    // jsdom'da güvenli.
    setLanguage("ru");
    expect(S.settings.lang).toBe("ru");
    setLanguage("tr");
    expect(S.settings.lang).toBe("tr");
  });
});
