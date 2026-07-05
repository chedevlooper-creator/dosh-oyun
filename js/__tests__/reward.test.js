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
  it("calls toast with bonus word info", async () => {
    G.foundBonus.add("ав");
    const { showBonusChest } = await import("../game/reward.js");
    showBonusChest();
    const { toast } = await import("../utils/helpers.js");
    expect(toast).toHaveBeenCalled();
  });
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
