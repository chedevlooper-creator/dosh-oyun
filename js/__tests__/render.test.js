// @ts-check
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initState, getState } from "../game/state.js";
import { setG } from "../engine/store.js";

const SAMPLE_LEVEL = {
  id: 0,
  letters: ["а", "б", "в", "г", "д"],
  words: [
    { word: "аб", row: 0, col: 0, dir: "across" },
    { word: "вг", row: 1, col: 0, dir: "across" },
  ],
  bonus: ["д"],
};

let lv;

beforeEach(() => {
  lv = JSON.parse(JSON.stringify(SAMPLE_LEVEL));
  initState(lv, { daily: false });

  document.body.innerHTML = `
    <div id="grid-wrap"><div id="grid"></div></div>
    <div id="wheel-zone"><div id="wheel"><svg><polyline points=""/></svg><button id="shuffle"></button></div></div>
    <div id="preview"></div>
  `;
});

afterEach(() => {
  document.body.innerHTML = "";
  // import modülleri browser-like durumdan temizle
  setG(null);
});

// buildGrid
describe("buildGrid", () => {
  it("creates grid cells from G.cells", async () => {
    const { buildGrid } = await import("../game/render.js");
    buildGrid();
    const grid = document.getElementById("grid");
    expect(grid.children.length).toBe(4);
  });

  it("sets role=grid on the grid element", async () => {
    const { buildGrid } = await import("../game/render.js");
    buildGrid();
    expect(document.getElementById("grid").getAttribute("role")).toBe("grid");
  });

  it("gives each cell role=gridcell and tabindex=0", async () => {
    const { buildGrid } = await import("../game/render.js");
    buildGrid();
    const cells = document.querySelectorAll(".cell");
    expect(cells.length).toBe(4);
    cells.forEach((el) => {
      expect(el.getAttribute("role")).toBe("gridcell");
      expect(el.getAttribute("tabindex")).toBe("0");
    });
  });

  it("sets aria-labels for each cell position", async () => {
    const { buildGrid } = await import("../game/render.js");
    buildGrid();
    const cells = document.querySelectorAll(".cell");
    expect(cells[0].getAttribute("aria-label")).toMatch(/1/);
  });

  it("recreates grid on second call (no duplicate cells)", async () => {
    const { buildGrid } = await import("../game/render.js");
    buildGrid();
    buildGrid();
    expect(document.querySelectorAll(".cell").length).toBe(4);
  });

  it("handles empty G gracefully", async () => {
    setG(null);
    const { buildGrid } = await import("../game/render.js");
    expect(() => buildGrid()).not.toThrow();
  });
});

// fillCell
describe("fillCell", () => {
  it("marks cell as filled", async () => {
    const { buildGrid, fillCell } = await import("../game/render.js");
    buildGrid();
    const G = getState();
    const cell = G.cells.get("0,0");
    fillCell(cell, false);
    expect(cell.filled).toBe(true);
    expect(cell.hint).toBe(false);
  });

  it("adds fill class to DOM element", async () => {
    const { buildGrid, fillCell } = await import("../game/render.js");
    buildGrid();
    const G = getState();
    const cell = G.cells.get("0,0");
    fillCell(cell, false);
    expect(cell.el.classList.contains("fill")).toBe(true);
  });

  it("adds hintfill class when hint=true", async () => {
    const { buildGrid, fillCell } = await import("../game/render.js");
    buildGrid();
    const G = getState();
    const cell = G.cells.get("0,0");
    fillCell(cell, true);
    expect(cell.el.classList.contains("hintfill")).toBe(true);
  });

  it("displays grapheme text via dispG", async () => {
    const { buildGrid, fillCell } = await import("../game/render.js");
    buildGrid();
    const G = getState();
    const cell = G.cells.get("0,0");
    fillCell(cell, false);
    expect(cell.el.textContent).toBe("А");
  });

  it("is idempotent (second call does nothing)", async () => {
    const { buildGrid, fillCell } = await import("../game/render.js");
    buildGrid();
    const G = getState();
    const cell = G.cells.get("0,0");
    fillCell(cell, false);
    const classesBefore = cell.el.className;
    fillCell(cell, false);
    expect(cell.el.className).toBe(classesBefore);
  });

  it("handles digraph graphemes in display", async () => {
    const digraphLv = {
      id: 99,
      letters: ["кӀ", "а"],
      words: [{ word: "кӀа", row: 0, col: 0, dir: "across" }],
      bonus: [],
    };
    initState(digraphLv, {});
    const { buildGrid, fillCell } = await import("../game/render.js");
    buildGrid();
    const G = getState();
    const cell0 = G.cells.get("0,0"); // digraph "кӀ"
    fillCell(cell0, false);
    expect(cell0.el.textContent).toBe("КI");
    const cell1 = G.cells.get("0,1"); // simple "а"
    fillCell(cell1, false);
    expect(cell1.el.textContent).toBe("А");
  });

  it("sets aria-label to include the filled letter", async () => {
    const { buildGrid, fillCell } = await import("../game/render.js");
    buildGrid();
    const G = getState();
    const cell = G.cells.get("0,0");
    fillCell(cell, false);
    expect(cell.el.getAttribute("aria-label")).toContain("А");
  });
});

// buildWheel
describe("buildWheel", () => {
  it("creates bubble elements for each letter", async () => {
    const { buildWheel } = await import("../game/render.js");
    buildWheel(["а", "б", "в"], null);
    const bubbles = document.querySelectorAll(".bub");
    expect(bubbles.length).toBe(3);
  });

  it("displays letters via dispG", async () => {
    const { buildWheel } = await import("../game/render.js");
    buildWheel(["а", "б"], null);
    const bubbles = document.querySelectorAll(".bub");
    expect(bubbles[0].textContent).toBe("А");
    expect(bubbles[1].textContent).toBe("Б");
  });

  it("gives each bubble role=button and tabindex=0", async () => {
    const { buildWheel } = await import("../game/render.js");
    buildWheel(["а"], null);
    const bub = document.querySelector(".bub");
    expect(bub.getAttribute("role")).toBe("button");
    expect(bub.getAttribute("tabindex")).toBe("0");
  });

  it("sets aria-label on each bubble", async () => {
    const { buildWheel } = await import("../game/render.js");
    buildWheel(["а"], null);
    const bub = document.querySelector(".bub");
    expect(bub.getAttribute("aria-label")).toContain("А");
  });

  it("replaces previous bubbles on second call", async () => {
    const { buildWheel } = await import("../game/render.js");
    buildWheel(["а", "б"], null);
    buildWheel(["к", "л", "м"], null);
    expect(document.querySelectorAll(".bub").length).toBe(3);
  });

  it("attaches keyboard handler when onBubbleKey is provided", async () => {
    const { buildWheel } = await import("../game/render.js");
    let called = false;
    buildWheel(["а"], (_e, _el) => { called = true; });
    const bub = document.querySelector(".bub");
    bub.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(called).toBe(true);
  });
});

// shuffleWheel
describe("shuffleWheel", () => {
  it("rebuilds wheel with same letters but shuffled order", async () => {
    // Use all level letters so shuffleWheel picks up the same set
    const allLetters = lv.letters; // ["а","б","в","г","д"]
    const { buildWheel, shuffleWheel } = await import("../game/render.js");
    buildWheel(allLetters, null);
    const firstOrder = [...document.querySelectorAll(".bub")].map((b) => b.textContent);
    shuffleWheel();
    const secondOrder = [...document.querySelectorAll(".bub")].map((b) => b.textContent);
    expect(secondOrder.sort()).toEqual(firstOrder.sort());
  });
});

// renderSel
describe("renderSel", () => {
  it("shows preview when sel is non-empty", async () => {
    const { buildWheel, renderSel } = await import("../game/render.js");
    buildWheel(["а", "б", "в"], null);
    const G = getState();
    const { getBubbles } = await import("../game/state.js");
    const bub0 = getBubbles()[0];
    G.sel = [bub0];
    renderSel();
    const pv = document.getElementById("preview");
    expect(pv.innerHTML).toContain("А");
  });

  it("clears preview when sel is empty", async () => {
    const { renderSel } = await import("../game/render.js");
    const pv = document.getElementById("preview");
    pv.innerHTML = "<div class='cap'>x</div>";
    renderSel();
    expect(pv.innerHTML).toBe("");
  });

  it("updates SVG polyline points", async () => {
    const { buildWheel, renderSel } = await import("../game/render.js");
    buildWheel(["а"], null);
    const { getBubbles } = await import("../game/state.js");
    const G = getState();
    const bub = getBubbles()[0];
    G.sel = [bub];
    renderSel();
    const svg = document.querySelector("#wheel svg polyline");
    expect(svg.getAttribute("points")).toBeTruthy();
  });
});

// clearSel
describe("clearSel", () => {
  it("returns a cleanup function that clears sel and removes sel class", async () => {
    const { buildWheel, clearSel } = await import("../game/render.js");
    buildWheel(["а", "б"], null);
    const { getBubbles } = await import("../game/state.js");
    const G = getState();
    const bub = getBubbles()[0];
    bub.el.classList.add("sel");
    G.sel = [bub];
    const cleanup = clearSel();
    cleanup();
    expect(G.sel.length).toBe(0);
    expect(bub.el.classList.contains("sel")).toBe(false);
  });

  it("does not throw when G is null", async () => {
    setG(null);
    const { clearSel } = await import("../game/render.js");
    expect(() => clearSel()).not.toThrow();
  });
});
