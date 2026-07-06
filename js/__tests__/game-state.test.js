// @ts-check
import { describe, it, expect, beforeEach } from "vitest";
import {
  G, getState, initState, pushWrongGuess, resetWrongRow, markRescued,
  unfilled, randomUnfilled,
} from "../game/state.js";

const SAMPLE_LEVEL = {
  id: 0,
  letters: ["а", "б", "в", "г"],
  words: [
    { word: "аб", row: 0, col: 0, dir: "across" },
    { word: "ба", row: 0, col: 2, dir: "across" },
  ],
  bonus: [],
};

/** @type {import("../game/state.js").LevelData} */
let lv;

beforeEach(() => {
  lv = JSON.parse(JSON.stringify(SAMPLE_LEVEL));
  initState(lv, { daily: false });
});

describe("state.initState", () => {
  it("populates G with level, words, cells, and default counters", () => {
    const s = getState();
    expect(s).not.toBeNull();
    expect(s.lv.id).toBe(0);
    expect(s.words).toHaveLength(2);
    expect(s.cells.size).toBe(4); // 2 cells per word, 2 words = 4 unique positions
    expect(s.mistakes).toBe(0);
    expect(s.hints).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.earned).toBe(0);
    expect(s.done).toBe(false);
    expect(s.daily).toBe(false);
  });

  it("processes word graphemes via splitG", () => {
    const s = getState();
    expect(s.words[0].g).toEqual(["а", "б"]);
    expect(s.words[0].norm).toBe("аб");
  });

  it("stores cells as a Map keyed by 'r,c'", () => {
    const s = getState();
    expect(s.cells.has("0,0")).toBe(true);
    expect(s.cells.has("0,1")).toBe(true);
    expect(s.cells.get("0,0").ch).toBe("а");
  });

  it("propagates daily flag to opts", () => {
    initState(lv, { daily: true });
    expect(getState().daily).toBe(true);
  });

  it("calls setG to notify store proxy", () => {
    // setG is the store's internal setter. It updates _G inside store.js
    // and triggers _onGClear subscribers. After initState, getG() should
    // return the new state.
    initState(lv);
    // Re-import to read getG fresh (import hoisting may have captured earlier)
    return import("../engine/store.js").then((store) => {
      expect(store.getG()).not.toBeNull();
      expect(store.getG().lv.id).toBe(0);
    });
  });
});

describe("state.pushWrongGuess", () => {
  it("starts at 0 (undefined → 0+1=1)", () => {
    resetWrongRow();
    expect(pushWrongGuess()).toBe(1);
  });

  it("increments the counter on each call", () => {
    resetWrongRow();
    expect(pushWrongGuess()).toBe(1);
    expect(pushWrongGuess()).toBe(2);
    expect(pushWrongGuess()).toBe(3);
  });

  it("triggers rescue condition at 6th call (read by hints.onWrongGuess)", () => {
    resetWrongRow();
    for (let i = 1; i <= 5; i++) pushWrongGuess();
    expect(getState().wrongRow).toBe(5);
    pushWrongGuess();
    expect(getState().wrongRow).toBe(6);
  });
});

describe("state.resetWrongRow", () => {
  it("resets the counter to 0", () => {
    pushWrongGuess();
    pushWrongGuess();
    expect(getState().wrongRow).toBe(2);
    resetWrongRow();
    expect(getState().wrongRow).toBe(0);
  });
});

describe("state.markRescued", () => {
  it("sets G.rescued = true exactly once", () => {
    expect(getState().rescued).toBeUndefined();
    markRescued();
    expect(getState().rescued).toBe(true);
  });
});

describe("state.unfilled", () => {
  it("returns all cells initially", () => {
    const u = unfilled();
    expect(u).toHaveLength(4);
  });

  it("excludes filled cells", () => {
    const s = getState();
    const c = s.cells.get("0,0");
    c.filled = true;
    const u = unfilled();
    expect(u).toHaveLength(3);
    expect(u.find((x) => x.c === 0 && x.r === 0)).toBeUndefined();
  });
});

describe("state.randomUnfilled", () => {
  it("returns a cell when there are unfilled cells", () => {
    const cell = randomUnfilled();
    expect(cell).not.toBeNull();
    expect(cell.filled).toBe(false);
  });

  it("returns null when all cells are filled", () => {
    const s = getState();
    for (const c of s.cells.values()) c.filled = true;
    expect(randomUnfilled()).toBeNull();
  });
});

describe("state.G proxy", () => {
  it("reflects properties of underlying state object", () => {
    expect(G.lv.id).toBe(0);
    expect(G.mistakes).toBe(0);
  });

  it("writes go through to underlying state", () => {
    G.mistakes = 5;
    expect(getState().mistakes).toBe(5);
  });
});
