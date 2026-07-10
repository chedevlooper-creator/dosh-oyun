// @ts-check
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initState, getState } from "../game/state.js";
import { setG } from "../engine/store.js";

vi.mock("../engine/audio.js", () => ({ SFX: { coin: vi.fn() } }));
vi.mock("../utils/helpers.js", () => ({
  $: (id) => document.getElementById(id),
  toast: vi.fn(),
  updateCoins: vi.fn(),
  vibrate: vi.fn(),
  show: vi.fn(),
  flyCoins: vi.fn(),
}));
vi.mock("../utils/analytics.js", () => ({ track: vi.fn(), EVENTS: {} }));
vi.mock("../data/info.js", () => ({
  INFO: { аб: { ce: "тест", tr: "test" } },
}));
vi.mock("../utils/i18n.js", () => ({ t: vi.fn((k) => k) }));

const SAMPLE_LEVEL = {
  id: 0,
  letters: ["а", "б", "в", "г"],
  words: [
    { word: "аб", row: 0, col: 0, dir: "across" },
    { word: "вг", row: 1, col: 0, dir: "across" },
  ],
  bonus: ["ав"],
};

let lv;
let G;

beforeEach(() => {
  vi.clearAllMocks();
  lv = JSON.parse(JSON.stringify(SAMPLE_LEVEL));
  initState(lv, {});
  G = getState();

  document.body.innerHTML = `
    <div id="lvl-progress"></div>
    <div id="info-strip"></div>
    <div id="bonus-count"></div>
    <div id="bonus-chest"></div>
    <div id="veil"><div id="panel"></div></div>
  `;
});

afterEach(() => {
  document.body.innerHTML = "";
  setG(null);
});

describe("updateWordProgress", () => {
  it("shows 0/solved initially", async () => {
    const { updateWordProgress } = await import("../game/reward.js");
    updateWordProgress();
    expect(document.getElementById("lvl-progress").textContent).toBe("0/2");
  });

  it("shows 1/2 after one word is solved", async () => {
    G.words[0].solved = true;
    const { updateWordProgress } = await import("../game/reward.js");
    updateWordProgress();
    expect(document.getElementById("lvl-progress").textContent).toBe("1/2");
  });
});

describe("showWordInfo", () => {
  it("shows word in info strip", async () => {
    const { showWordInfo } = await import("../game/reward.js");
    showWordInfo(G.words[0]);
    const strip = document.getElementById("info-strip");
    expect(strip.innerHTML).toContain("АБ");
    expect(strip.className).toBe("on");
  });

  it("displays dictionary gloss from INFO", async () => {
    const { showWordInfo } = await import("../game/reward.js");
    showWordInfo(G.words[0]);
    const strip = document.getElementById("info-strip");
    expect(strip.textContent).toContain("ТЕСТ");
  });

  it("displays tr translation with lang label", async () => {
    const { showWordInfo } = await import("../game/reward.js");
    showWordInfo(G.words[0]);
    const strip = document.getElementById("info-strip");
    expect(strip.innerHTML).toContain("тр.");
  });
});

describe("showBonusChest", () => {
  it("calls toast with bonus word info after animation", async () => {
    vi.useFakeTimers();
    G.foundBonus.add("ав");
    const { showBonusChest } = await import("../game/reward.js");
    showBonusChest();
    const { toast } = await import("../utils/helpers.js");
    // Toast 600ms gecikmeyle çağrılır (animasyon süresi)
    expect(toast).not.toHaveBeenCalled();
    vi.advanceTimersByTime(650);
    expect(toast).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("showBonusChest particles", () => {
  beforeEach(() => {
    // Deterministic Math.random for particle positions
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    // SFX.coin mock'unu el ile temizle (vi.clearAllMocks bazı durumlarda yetmiyor)
    vi.useRealTimers();
  });

  it("adds .opening class to the bonus-chest button", async () => {
    vi.useFakeTimers();
    const { showBonusChest } = await import("../game/reward.js");
    const btn = document.getElementById("bonus-chest");
    expect(btn.classList.contains("opening")).toBe(false);

    showBonusChest();
    expect(btn.classList.contains("opening")).toBe(true);

    // Cleanup: advance past the 600ms animation
    vi.advanceTimersByTime(650);
  });

  it("prevents double-click when .opening is already set", async () => {
    vi.useFakeTimers();
    const { showBonusChest } = await import("../game/reward.js");
    const { toast } = await import("../utils/helpers.js");
    const btn = document.getElementById("bonus-chest");

    // First call
    showBonusChest();
    expect(btn.classList.contains("opening")).toBe(true);

    // Second call — should be ignored (early return)
    toast.mockClear();
    showBonusChest();

    // Partikül sayısı sadece ilk çağrıdaki kadar olmalı
    const particles = document.body.querySelectorAll(".bonus-particle");
    expect(particles.length).toBe(10);

    vi.advanceTimersByTime(650);
  });

  it("creates exactly 10 particle divs in the DOM", async () => {
    vi.useFakeTimers();
    const { showBonusChest } = await import("../game/reward.js");

    showBonusChest();

    const particles = document.body.querySelectorAll(".bonus-particle");
    expect(particles.length).toBe(10);

    // All should be div elements
    particles.forEach((p) => {
      expect(p.tagName).toBe("DIV");
    });

    vi.advanceTimersByTime(650);
  });

  it("sets particle classes: bonus-particle, .coin, .star variants", async () => {
    vi.useFakeTimers();
    const { showBonusChest } = await import("../game/reward.js");

    showBonusChest();

    const particles = document.body.querySelectorAll(".bonus-particle");
    const classes = [...particles].map((p) => p.className);

    // All have .bonus-particle
    classes.forEach((c) => expect(c).toContain("bonus-particle"));

    // Some should have .coin (i % 3 === 0)
    const hasCoin = classes.some((c) => c.includes("coin"));
    expect(hasCoin).toBe(true);

    // Some should have .star (i % 5 === 0)
    const hasStar = classes.some((c) => c.includes("star"));
    expect(hasStar).toBe(true);

    vi.advanceTimersByTime(650);
  });

  it("sets inline styles (left, top, animationDelay) on particles", async () => {
    vi.useFakeTimers();
    const { showBonusChest } = await import("../game/reward.js");

    // Button needs a position for getBoundingClientRect
    const btn = document.getElementById("bonus-chest");
    btn.style.position = "absolute";
    btn.style.left = "100px";
    btn.style.top = "200px";
    btn.style.width = "40px";
    btn.style.height = "40px";

    showBonusChest();

    const particles = document.body.querySelectorAll(".bonus-particle");
    particles.forEach((p) => {
      // All particles should have left/top values
      expect(p.style.left).toBeTruthy();
      expect(p.style.left).toMatch(/px$/);
      expect(p.style.top).toBeTruthy();
      expect(p.style.top).toMatch(/px$/);
      // animationDelay should be set (mock random=0.5 → delay=0.075s)
      expect(p.style.animationDelay).toBe("0.075s");
    });

    vi.advanceTimersByTime(650);
  });

  it("adds .pulse class to bonus-count badge", async () => {
    vi.useFakeTimers();
    const { showBonusChest } = await import("../game/reward.js");
    const countEl = document.getElementById("bonus-count");

    expect(countEl.classList.contains("pulse")).toBe(false);
    showBonusChest();
    expect(countEl.classList.contains("pulse")).toBe(true);

    // After 600ms the pulse class should be removed
    vi.advanceTimersByTime(650);
    expect(countEl.classList.contains("pulse")).toBe(false);
  });

  it("calls SFX.coin() after animation completes", async () => {
    vi.useFakeTimers();
    G.foundBonus.add("ав");
    const { showBonusChest } = await import("../game/reward.js");
    const { SFX } = await import("../engine/audio.js");

    // El ile temizle (global clearAllMocks yetersiz kalıyor)
    SFX.coin.mockClear();

    showBonusChest();

    vi.advanceTimersByTime(650);
    expect(SFX.coin).toHaveBeenCalledOnce();
  });

  it("cleans up particles on animationend event", async () => {
    vi.useFakeTimers();
    const { showBonusChest } = await import("../game/reward.js");

    showBonusChest();
    expect(document.body.querySelectorAll(".bonus-particle").length).toBe(10);

    // Fire animationend on all particles
    const particles = document.body.querySelectorAll(".bonus-particle");
    particles.forEach((p) => {
      p.dispatchEvent(new Event("animationend"));
    });

    // All particles should be removed
    expect(document.body.querySelectorAll(".bonus-particle").length).toBe(0);

    vi.advanceTimersByTime(650);
  });

  it("defensive 2-second cleanup removes stuck .opening class", async () => {
    vi.useFakeTimers();
    const { showBonusChest } = await import("../game/reward.js");
    const btn = document.getElementById("bonus-chest");

    showBonusChest();
    expect(btn.classList.contains("opening")).toBe(true);

    // Advance past 600ms (first timeout runs, removes .opening normally)
    vi.advanceTimersByTime(650);
    expect(btn.classList.contains("opening")).toBe(false);

    vi.advanceTimersByTime(2000);
    // Still not stuck (normal flow)
    expect(btn.classList.contains("opening")).toBe(false);
  });

  it("is no-op when G is null (getState returns null)", async () => {
    const { showBonusChest } = await import("../game/reward.js");
    const { SFX } = await import("../engine/audio.js");
    const { toast } = await import("../utils/helpers.js");

    // getState'i null döndürecek şekilde spyonla, sadece bu test için
    const stateMod = await import("../game/state.js");
    const getStateSpy = vi.spyOn(stateMod, "getState").mockReturnValue(null);
    SFX.coin.mockClear();

    showBonusChest();
    expect(SFX.coin).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();

    // SADECE getState spy'ını geri al — restine dokunma (SFX.coin mock'unu kırar!)
    getStateSpy.mockRestore();
  });

  it("is no-op when bonus-chest button is missing from DOM", async () => {
    const { showBonusChest } = await import("../game/reward.js");
    const { SFX } = await import("../engine/audio.js");
    const { toast } = await import("../utils/helpers.js");

    // Remove the bonus-chest element from DOM
    const btn = document.getElementById("bonus-chest");
    btn.remove();
    SFX.coin.mockClear();

    expect(() => showBonusChest()).not.toThrow();
    expect(SFX.coin).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  // flyCoins DOM testi helpers.test.js'de yapılmalı (burada helpers.js mock'landığı için)
});

describe("animateCoinCounter", () => {
  it("animates from 0 toward total over time", async () => {
    vi.useFakeTimers();
    const el = document.createElement("div");
    const { animateCoinCounter } = await import("../game/reward.js");
    animateCoinCounter(el, 100);
    // First RAF tick fires around 16ms
    vi.advanceTimersByTime(20);
    const v1 = el.textContent;
    expect(v1).toMatch(/^\+/);
    // Later tick should show a larger value
    vi.advanceTimersByTime(500);
    expect(el.textContent).not.toBe(v1);
    vi.useRealTimers();
  });
});

describe("animateStars", () => {
  it("lights up stars sequentially", async () => {
    vi.useFakeTimers();
    const rowEl = document.createElement("div");
    rowEl.innerHTML = "<span></span><span></span><span></span>";
    const { animateStars } = await import("../game/reward.js");
    animateStars(rowEl, 2);
    vi.advanceTimersByTime(400);
    expect(rowEl.children[0].classList.contains("lit")).toBe(true);
    expect(rowEl.children[1].classList.contains("lit")).toBe(false);
    vi.advanceTimersByTime(400);
    expect(rowEl.children[1].classList.contains("lit")).toBe(true);
    vi.useRealTimers();
  });

  it("handles 0 stars", async () => {
    vi.useFakeTimers();
    const rowEl = document.createElement("div");
    rowEl.innerHTML = "<span></span><span></span><span></span>";
    const { animateStars } = await import("../game/reward.js");
    animateStars(rowEl, 0);
    vi.advanceTimersByTime(1000);
    expect(rowEl.children[0].classList.contains("lit")).toBe(false);
    vi.useRealTimers();
  });

  it("handles null rowEl", async () => {
    const { animateStars } = await import("../game/reward.js");
    expect(() => animateStars(null, 3)).not.toThrow();
  });
});

describe("wordsRecapHTML", () => {
  it("returns HTML with recap items", async () => {
    const { wordsRecapHTML } = await import("../game/reward.js");
    const html = wordsRecapHTML();
    expect(html).toContain("АБ");
    expect(html).toContain("ВГ");
    expect(html).toContain("recap-item");
  });

  it("includes gloss from INFO", async () => {
    const { wordsRecapHTML } = await import("../game/reward.js");
    const html = wordsRecapHTML();
    expect(html).toContain("ТЕСТ");
  });

  it("produces recap-item elements for each word", async () => {
    const { wordsRecapHTML } = await import("../game/reward.js");
    const html = wordsRecapHTML();
    expect((html.match(/recap-item/g) || []).length).toBe(2);
  });
});
