/* ================= STORE PROXY TEST =================
 * engine/store.js'in proxy tabanlı reaktif state'ini, hydrate pipeline'ını
 * ve addFoundWord atomik merge'ini doğrular. Her test kendinden önceki
 * state'i hydrate(snapshot()) ile sıfırlar; bu sayede sıra bağımsız olur. */

import { describe, it, expect, beforeEach } from "vitest";
import {
  S, G, setG, getG,
  commitS, commitSettings, commitG, addFoundWord,
  snapshot, hydrate,
  setOnThemeChange,
} from "../engine/store.js";

beforeEach(() => {
  // Test başında state'i sıfırla: snapshot() ile yeni boş snapshot al,
  // sonra hydrate ile geri yükle. Bu _S'i default'lara döndürür.
  const fresh = {
    _v: 2,
    coins: 100,
    stars: {},
    dict: {},
    settings: { theme: "kavkaz", scene3d: true, sound: true, music: true, lang: "ce" },
    stats: { words: 0, coinsEarned: 0, coinsSpent: 0, hints: 0, bonusWords: 0, bestStreak: 0, levelsDone: 0 },
    lastDaily: "",
    lastGift: "",
    tut: false,
  };
  hydrate(fresh);
});

/* ================= Proxy set/get ================= */
describe("S proxy", () => {
  it("S.coins reads the underlying _S.coins", () => {
    expect(S.coins).toBe(100);
  });

  it("S.coins = 50 writes through the proxy", () => {
    S.coins = 50;
    expect(S.coins).toBe(50);
  });

  it("nested S.settings.theme writes through the inner proxy", () => {
    S.settings.theme = "night";
    expect(S.settings.theme).toBe("night");
  });
});

/* ================= commitS ================= */
describe("commitS()", () => {
  it("merges a patch into persistent state", () => {
    commitS({ coins: 250 });
    expect(S.coins).toBe(250);
  });

  it("preserves untouched fields", () => {
    commitS({ coins: 5 });
    expect(S.settings.lang).toBe("ce");
    expect(S.tut).toBe(false);
  });
});

/* ================= commitSettings ================= */
describe("commitSettings()", () => {
  it("merges into S.settings and notifies theme callback on theme change", () => {
    let notified = 0;
    setOnThemeChange(() => { notified++; });
    commitSettings({ lang: "tr" });
    expect(S.settings.lang).toBe("tr");
    expect(notified).toBe(0);

    commitSettings({ theme: "winter" });
    expect(S.settings.theme).toBe("winter");
    expect(notified).toBeGreaterThanOrEqual(1);
  });
});

/* ================= addFoundWord ================= */
describe("addFoundWord()", () => {
  it("registers a new word and returns the coin delta", () => {
    const r = addFoundWord("дош", { coins: 15 });
    expect(r.coinDelta).toBe(15);
    expect(S.dict["дош"]).toBe(1);
    expect(S.coins).toBe(115);
  });

  it("distinguishes bonus words (stats.bonusWords) from regular (stats.words)", () => {
    addFoundWord("дош", { coins: 15 });
    addFoundWord("шод", { isBonus: true, coins: 10 });
    expect(S.stats.words).toBe(1);
    expect(S.stats.bonusWords).toBe(1);
    expect(S.stats.coinsEarned).toBe(25);
  });

  it("does not double-count a word already in dict", () => {
    addFoundWord("дош", { coins: 15 });
    addFoundWord("дош", { coins: 15 });
    // dict hâlâ 1 entry; ama coinsEarned iki kez artar (kullanıcı isteği)
    expect(Object.keys(S.dict)).toHaveLength(1);
  });

  it("returns coinDelta = 0 when opts.coins is omitted", () => {
    const r = addFoundWord("тест", {});
    expect(r.coinDelta).toBe(0);
    expect(S.coins).toBe(100); // değişmedi
    expect(S.dict["тест"]).toBe(1);
  });
});

/* ================= setG / commitG ================= */
describe("G proxy (active game state)", () => {
  it("setG replaces the active state, getG returns it", () => {
    setG({ lv: { id: 0 }, cells: new Map() });
    expect(getG()).not.toBeNull();
    expect(G.lv.id).toBe(0);
  });

  it("commitG merges into the active state", () => {
    setG({ lv: { id: 0 }, cells: new Map() });
    commitG({ mistakes: 3 });
    expect(G.mistakes).toBe(3);
  });

  it("G is a no-op when no level is active", () => {
    setG(null);
    // commitG null _G'i atlar, G.x = 1 atamaz
    expect(() => commitG({ x: 1 })).not.toThrow();
  });
});

/* ================= hydrate defaults for new fields ================= */
describe("hydrate() initializes TA stats fields", () => {
  it("sets taBest, taGames, taWords to 0 when missing from persisted data", () => {
    hydrate({ _v: 2, coins: 200, stars: {}, dict: {}, settings: { theme: "kavkaz" } });
    expect(S.stats.taBest).toBe(0);
    expect(S.stats.taGames).toBe(0);
    expect(S.stats.taWords).toBe(0);
  });
});

/* ================= snapshot integrity ================= */
describe("snapshot() doesn't leak Proxy markers", () => {
  it("no __proxy on top-level or nested", () => {
    S.coins = 999;
    S.dict["foo"] = 1;
    S.stars["0"] = 3;
    const snap = snapshot();
    expect(snap.__proxy).toBeUndefined();
    expect(snap.dict.__proxy).toBeUndefined();
    expect(snap.stars.__proxy).toBeUndefined();
    expect(snap.settings.__proxy).toBeUndefined();
    expect(snap.stats.__proxy).toBeUndefined();
  });
});
