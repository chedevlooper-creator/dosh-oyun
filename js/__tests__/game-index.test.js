// @ts-check
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initState, getState, getBubbles } from "../game/state.js";
import { setG } from "../engine/store.js";

vi.mock("../engine/audio.js", () => ({ SFX: { pick: vi.fn(), solve: vi.fn(), bad: vi.fn(), bonus: vi.fn(), coin: vi.fn(), win: vi.fn() } }));
vi.mock("../utils/helpers.js", () => {
  const $ = (id) => document.getElementById(id);
  return { $, show: vi.fn(), updateCoins: vi.fn(), toast: vi.fn(), flyCoins: vi.fn(), vibrate: vi.fn(), onResize: vi.fn() };
});
vi.mock("../utils/analytics.js", () => ({ track: vi.fn(), EVENTS: {} }));
vi.mock("../utils/tts.js", () => ({ speak: vi.fn() }));
vi.mock("../data/level-loader.js", () => ({
  getLevel: vi.fn(() => Promise.resolve(null)),
}));
vi.mock("../data/config.js", () => ({
  CFG: { coinsPerGrapheme: 10, comboMilestone: 5, comboBonusCoins: 50, bonusWordCoins: 20, targetHintCost: 30 },
}));
vi.mock("../utils/i18n.js", () => ({ t: vi.fn((k) => k) }));

const SAMPLE_LEVEL = {
  id: 0,
  letters: ["а", "б", "в", "г"],
  words: [
    { word: "аб", row: 0, col: 0, dir: "across" },
    { word: "вг", row: 1, col: 0, dir: "across" },
  ],
  bonus: [],
};

let lv;

beforeEach(() => {
  lv = JSON.parse(JSON.stringify(SAMPLE_LEVEL));
  initState(lv, {});

  document.body.innerHTML = `
    <div id="grid-wrap"><div id="grid"></div></div>
    <div id="wheel-zone"><div id="wheel"><svg><polyline points=""></polyline></svg><button id="shuffle"></button></div></div>
    <div id="preview"></div>
    <div id="lvl-num"></div>
    <div id="lvl-progress"></div>
    <div id="bonus-count"></div>
    <div id="bonus-chest"></div>
    <div id="info-strip"></div>
    <div id="scr-game" class="on"></div>
    <div id="veil"><div id="panel"></div></div>
  `;
});

afterEach(() => {
  document.body.innerHTML = "";
  setG(null);
});

describe("selAdd", () => {
  it("adds bubble to selection and adds sel class", async () => {
    // Use buildWheel to create proper bubbles instead of manual ones
    const { buildWheel } = await import("../game/render.js");
    buildWheel(["а", "б"], null);
    const bubbles = getBubbles();

    const { selAdd } = await import("../game/index.js");
    selAdd(bubbles[0]);

    expect(getState().sel).toContain(bubbles[0]);
    expect(bubbles[0].el.classList.contains("sel")).toBe(true);
  });
});

describe("submitSel", () => {
  it("solves a correct word", async () => {
    const G = getState();
    const b1 = { letter: "а" };
    const b2 = { letter: "б" };
    G.sel = [b1, b2];

    const { submitSel } = await import("../game/index.js");
    submitSel();
    expect(G.words[0].solved).toBe(true);
  });

  it("rejects short selection (<2 letters)", async () => {
    const G = getState();
    G.sel = [{ letter: "а" }];

    const { submitSel } = await import("../game/index.js");
    submitSel();
    expect(G.words.every((w) => !w.solved)).toBe(true);
  });

  it("increments mistakes on wrong guess", async () => {
    const G = getState();
    G.sel = [{ letter: "а" }, { letter: "а" }];

    const { submitSel } = await import("../game/index.js");
    submitSel();
    expect(G.mistakes).toBe(1);
  });

  it("resets streak on wrong guess", async () => {
    const G = getState();
    G.streak = 5;
    G.sel = [{ letter: "а" }, { letter: "а" }];

    const { submitSel } = await import("../game/index.js");
    submitSel();
    expect(G.streak).toBe(0);
  });

  it("finds a bonus word", async () => {
    lv.bonus = ["ав"];
    initState(lv, {});
    const G = getState();
    G.sel = [{ letter: "а" }, { letter: "в" }];

    const { submitSel } = await import("../game/index.js");
    submitSel();
    expect(G.foundBonus.has("ав")).toBe(true);
  });
});

describe("buildGrid", () => {
  it("builds grid and attaches cell handlers", async () => {
    const { buildGrid } = await import("../game/index.js");
    buildGrid();
    const cells = document.querySelectorAll(".cell");
    expect(cells.length).toBe(4);
    expect(cells[0].getAttribute("role")).toBe("gridcell");
  });
});

describe("startLevel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("loads level data and initializes state", async () => {
    const loader = await import("../data/level-loader.js");
    loader.getLevel.mockResolvedValue(lv);

    const { startLevel } = await import("../game/index.js");
    await startLevel(99);

    expect(getState()).not.toBeNull();
    expect(getState().lv.id).toBe(0);
    vi.advanceTimersByTime(100);
  });

  it("shows toast on load failure", async () => {
    const loader = await import("../data/level-loader.js");
    loader.getLevel.mockRejectedValue(new Error("fail"));

    const { toast } = await import("../utils/helpers.js");
    const { startLevel } = await import("../game/index.js");
    await startLevel(999);

    expect(toast).toHaveBeenCalled();
    vi.advanceTimersByTime(100);
  });
});
