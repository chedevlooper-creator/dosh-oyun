// @ts-check
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initState, getState, pushWrongGuess, resetWrongRow } from "../game/state.js";
import { S, hydrate } from "../engine/store.js";
import { onWrongGuess, spend, hintLetter, hintTarget, hintWand, onCellTap } from "../game/hints.js";
import { CFG } from "../data/config.js";

const SAMPLE_LEVEL = {
  id: 0,
  letters: ["а", "б", "в", "г"],
  words: [
    { word: "аб", row: 0, col: 0, dir: "across" },
    { word: "ба", row: 0, col: 2, dir: "across" },
  ],
  bonus: [],
};

beforeEach(() => {
  // Reset S (store) to a clean state with low coins
  hydrate({ _v: 2, coins: 1, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
  initState(SAMPLE_LEVEL);
  resetWrongRow();
  // Set up minimal DOM that hints/utils expect
  document.body.innerHTML = `
    <div id="toast"></div>
    <div id="info-strip"></div>
    <div id="grid-wrap"></div>
    <div id="grid"></div>
    <div id="lvl-progress"></div>
    <div id="lvl-num"></div>
    <div id="bonus-count"></div>
    <div id="bonus-chest"></div>
    <div id="game-coins"></div>
    <div id="home-coins"></div>
    <div id="map-coins"></div>
  `;
});

describe("hints.spend", () => {
  it("returns false when S.coins < cost and does not deduct", () => {
    const before = S.coins;
    const result = spend(10);
    expect(result).toBe(false);
    expect(S.coins).toBe(before);
  });

  it("returns true and deducts coins when S.coins >= cost", () => {
    hydrate({ _v: 2, coins: 50, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    const result = spend(10);
    expect(result).toBe(true);
    expect(S.coins).toBe(40);
  });

  it("increments G.hints and S.stats.hints on success", () => {
    hydrate({ _v: 2, coins: 50, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    const before = S.stats.hints;
    spend(5);
    expect(getState().hints).toBe(1);
    expect(S.stats.hints).toBe(before + 1);
  });
});

describe("hints.onWrongGuess", () => {
  it("increments wrongRow counter on each call", () => {
    const cbs = { checkAutoSolve: vi.fn(), checkDone: vi.fn() };
    expect(getState().wrongRow).toBe(0);
    onWrongGuess(cbs);
    expect(getState().wrongRow).toBe(1);
    onWrongGuess(cbs);
    expect(getState().wrongRow).toBe(2);
  });

  it("triggers pulse-ring at 4th wrong guess", () => {
    // Create the hint-letter button in DOM
    const btn = document.createElement("button");
    btn.id = "hint-letter";
    document.body.appendChild(btn);

    const cbs = { checkAutoSolve: vi.fn(), checkDone: vi.fn() };
    for (let i = 0; i < 3; i++) onWrongGuess(cbs);
    expect(btn.classList.contains("pulse-ring")).toBe(false);

    onWrongGuess(cbs); // 4th
    expect(btn.classList.contains("pulse-ring")).toBe(true);
  });

  it("rescues with a free cell at 6th wrong guess when S.coins < hintCost", () => {
    hydrate({ _v: 2, coins: 1, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    initState(SAMPLE_LEVEL);
    const cbs = { checkAutoSolve: vi.fn(), checkDone: vi.fn() };
    const filledBefore = [...getState().cells.values()].filter((c) => c.filled).length;

    for (let i = 0; i < 5; i++) onWrongGuess(cbs);
    expect(getState().rescued).toBeUndefined();
    expect(filledBefore).toBe(0);

    onWrongGuess(cbs); // 6th
    expect(getState().rescued).toBe(true);
    const filledAfter = [...getState().cells.values()].filter((c) => c.filled).length;
    expect(filledAfter).toBe(1);
  });

  it("does NOT rescue when S.coins >= hintCost", () => {
    hydrate({ _v: 2, coins: 1000, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    initState(SAMPLE_LEVEL);
    const cbs = { checkAutoSolve: vi.fn(), checkDone: vi.fn() };
    for (let i = 0; i < 6; i++) onWrongGuess(cbs);
    expect(getState().rescued).toBeUndefined();
  });

  it("only rescues once per level", () => {
    hydrate({ _v: 2, coins: 1, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    initState(SAMPLE_LEVEL);
    const cbs = { checkAutoSolve: vi.fn(), checkDone: vi.fn() };
    for (let i = 0; i < 6; i++) onWrongGuess(cbs);
    const filledAtSix = [...getState().cells.values()].filter((c) => c.filled).length;
    for (let i = 0; i < 5; i++) onWrongGuess(cbs);
    const filledAfterMore = [...getState().cells.values()].filter((c) => c.filled).length;
    expect(filledAfterMore).toBe(filledAtSix);
  });
});

describe("hints.hintLetter", () => {
  it("fills a random unfilled cell when enough coins", () => {
    hydrate({ _v: 2, coins: CFG.hintCost + 10, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    initState(SAMPLE_LEVEL);
    const cbs = { checkAutoSolve: vi.fn(), checkDone: vi.fn() };
    const filledBefore = [...getState().cells.values()].filter((c) => c.filled).length;
    hintLetter(cbs);
    const filledAfter = [...getState().cells.values()].filter((c) => c.filled).length;
    expect(filledAfter).toBe(filledBefore + 1);
    expect(S.coins).toBe(10);
  });

  it("does nothing when no cells are unfilled", () => {
    hydrate({ _v: 2, coins: 1000, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    initState(SAMPLE_LEVEL);
    for (const c of getState().cells.values()) c.filled = true;
    const cbs = { checkAutoSolve: vi.fn(), checkDone: vi.fn() };
    const before = S.coins;
    hintLetter(cbs);
    expect(S.coins).toBe(before);
  });

  it("does nothing when G.done is true", () => {
    hydrate({ _v: 2, coins: 1000, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    initState(SAMPLE_LEVEL);
    getState().done = true;
    const cbs = { checkAutoSolve: vi.fn(), checkDone: vi.fn() };
    const before = S.coins;
    hintLetter(cbs);
    expect(S.coins).toBe(before);
  });
});

describe("hints.hintTarget", () => {
  it("toggles G.targeting flag (when enough coins)", () => {
    hydrate({ _v: 2, coins: 1000, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    initState(SAMPLE_LEVEL);
    const initial = getState().targeting;
    hintTarget();
    expect(getState().targeting).toBe(!initial);
    hintTarget();
    expect(getState().targeting).toBe(initial);
  });

  it("does not toggle when coins are insufficient", () => {
    hydrate({ _v: 2, coins: 1, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    initState(SAMPLE_LEVEL);
    const initial = getState().targeting;
    hintTarget();
    expect(getState().targeting).toBe(initial);
  });
});

describe("hints.hintWand", () => {
  it("fills up to 3 random cells when enough coins", () => {
    hydrate({ _v: 2, coins: CFG.magicWandCost + 10, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    initState(SAMPLE_LEVEL);
    const cbs = { checkAutoSolve: vi.fn(), checkDone: vi.fn() };
    hintWand(cbs);
    const filled = [...getState().cells.values()].filter((c) => c.filled).length;
    // SAMPLE_LEVEL has 4 cells, wand fills min(3, available) = 3
    expect(filled).toBe(3);
  });

  it("does nothing when not enough coins", () => {
    hydrate({ _v: 2, coins: 1, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    initState(SAMPLE_LEVEL);
    const cbs = { checkAutoSolve: vi.fn(), checkDone: vi.fn() };
    const before = S.coins;
    hintWand(cbs);
    expect(S.coins).toBe(before);
  });
});

describe("hints.onCellTap", () => {
  it("fills the cell when in targeting mode and enough coins", () => {
    hydrate({ _v: 2, coins: CFG.targetHintCost + 10, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
    initState(SAMPLE_LEVEL);
    const cbs = { showWordInfo: vi.fn(), checkAutoSolve: vi.fn(), checkDone: vi.fn() };
    // Activate targeting
    getState().targeting = true;
    // Create a fake cell with el
    const cell = getState().cells.get("0,0");
    cell.el = document.createElement("div");
    cell.el.classList.add("cell");
    document.body.appendChild(cell.el);
    onCellTap(cell, cbs);
    expect(cell.filled).toBe(true);
    expect(getState().targeting).toBe(false);
  });

  it("does nothing when not in targeting mode and cell is empty", () => {
    initState(SAMPLE_LEVEL);
    const cbs = { showWordInfo: vi.fn(), checkAutoSolve: vi.fn(), checkDone: vi.fn() };
    const cell = getState().cells.get("0,0");
    cell.el = document.createElement("div");
    cell.el.classList.add("cell");
    document.body.appendChild(cell.el);
    onCellTap(cell, cbs);
    expect(cell.filled).toBe(false);
    expect(cbs.showWordInfo).not.toHaveBeenCalled();
  });
});
