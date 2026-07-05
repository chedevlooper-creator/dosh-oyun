// @ts-check
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initState, getState, getBubbles, isDragging, setDragging } from "../game/state.js";
import { setG } from "../engine/store.js";
import { buildGrid } from "../game/render.js";
import { bubbleAt, setupWheelListeners, attachCellHandlers, onBubbleKey } from "../game/input.js";

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
  initState(lv, { daily: false });

  document.body.innerHTML = `
    <div id="grid-wrap"><div id="grid"></div></div>
    <div id="wheel-zone"><div id="wheel"><svg><polyline points=""></polyline></svg><button id="shuffle"></button></div></div>
    <div id="preview"></div>
  `;
});

afterEach(() => {
  document.body.innerHTML = "";
  setDragging(false);
  setG(null);
});

/** Helper: create manual bubbles in the wheel for testing */
function createBubbles(data) {
  const bubbles = getBubbles();
  bubbles.length = 0;
  data.forEach((d) => {
    const el = document.createElement("div");
    el.className = "bub";
    document.getElementById("wheel").appendChild(el);
    bubbles.push({ el, cx: d.cx, cy: d.cy, r: d.r });
  });
  return bubbles;
}

describe("bubbleAt", () => {
  it("returns null when no bubbles exist", () => {
    expect(bubbleAt(100, 100)).toBeNull();
  });

  it("returns the bubble under the given coordinates", () => {
    createBubbles([
      { cx: 100, cy: 100, r: 30 },
      { cx: 200, cy: 100, r: 30 },
    ]);
    expect(bubbleAt(105, 105)).toBe(getBubbles()[0]);
    expect(bubbleAt(195, 100)).toBe(getBubbles()[1]);
  });

  it("returns null when coordinates don't hit any bubble", () => {
    createBubbles([{ cx: 100, cy: 100, r: 30 }]);
    expect(bubbleAt(500, 500)).toBeNull();
  });
});

describe("setupWheelListeners", () => {
  /** @type {Function[]} */
  const cleanups = [];

  afterEach(() => {
    cleanups.forEach((fn) => fn());
    cleanups.length = 0;
  });

  function pointerEvent(type, opts) {
    return new PointerEvent(type, { bubbles: true, ...opts });
  }

  function setup(cbs) {
    const cleanup = setupWheelListeners(cbs);
    if (typeof cleanup === "function") cleanups.push(cleanup);
  }

  it("on pointerdown: starts drag and calls onSelectAdd", () => {
    createBubbles([{ cx: 100, cy: 100, r: 50 }]);
    const onSelectAdd = vi.fn();
    const onSubmit = vi.fn();
    const onPopLast = vi.fn();
    setup({ onSelectAdd, onSubmit, onPopLast });

    const wheel = document.getElementById("wheel");
    wheel.dispatchEvent(pointerEvent("pointerdown", { clientX: 100, clientY: 100, pointerId: 1 }));

    expect(isDragging()).toBe(true);
    expect(onSelectAdd).toHaveBeenCalledWith(getBubbles()[0]);
  });

  it("on pointerdown: does nothing when pointer misses all bubbles", () => {
    createBubbles([{ cx: 100, cy: 100, r: 50 }]);
    const onSelectAdd = vi.fn();
    const onSubmit = vi.fn();
    const onPopLast = vi.fn();
    setup({ onSelectAdd, onSubmit, onPopLast });

    const wheel = document.getElementById("wheel");
    wheel.dispatchEvent(pointerEvent("pointerdown", { clientX: 500, clientY: 500, pointerId: 1 }));
    expect(onSelectAdd).not.toHaveBeenCalled();
  });

  it("on pointermove: adds bubble when entering new one", () => {
    createBubbles([
      { cx: 100, cy: 100, r: 30 },
      { cx: 200, cy: 100, r: 30 },
    ]);
    const onSelectAdd = vi.fn();
    const onSubmit = vi.fn();
    const onPopLast = vi.fn();
    setup({ onSelectAdd, onSubmit, onPopLast });

    const bubbles = getBubbles();
    getState().sel = [bubbles[0]];
    setDragging(true);

    const wheel = document.getElementById("wheel");
    wheel.dispatchEvent(pointerEvent("pointermove", { clientX: 200, clientY: 100 }));
    expect(onSelectAdd).toHaveBeenCalledWith(bubbles[1]);
  });

  it("on pointermove: pops last when re-entering previous bubble", () => {
    createBubbles([
      { cx: 100, cy: 100, r: 30 },
      { cx: 200, cy: 100, r: 30 },
      { cx: 300, cy: 100, r: 30 },
    ]);
    const onSelectAdd = vi.fn();
    const onSubmit = vi.fn();
    const onPopLast = vi.fn();
    setup({ onSelectAdd, onSubmit, onPopLast });

    const bubbles = getBubbles();
    getState().sel = [bubbles[0], bubbles[1], bubbles[2]];
    setDragging(true);

    const wheel = document.getElementById("wheel");
    wheel.dispatchEvent(pointerEvent("pointermove", { clientX: 200, clientY: 100 }));
    expect(onPopLast).toHaveBeenCalled();
  });

  it("on pointermove: does nothing when not dragging", () => {
    createBubbles([{ cx: 100, cy: 100, r: 30 }]);
    const onSelectAdd = vi.fn();
    const onSubmit = vi.fn();
    const onPopLast = vi.fn();
    setup({ onSelectAdd, onSubmit, onPopLast });

    setDragging(false);
    const wheel = document.getElementById("wheel");
    wheel.dispatchEvent(pointerEvent("pointermove", { clientX: 100, clientY: 100 }));
    expect(onSelectAdd).not.toHaveBeenCalled();
  });

  it("pointerup: ends drag and calls onSubmit", () => {
    const onSelectAdd = vi.fn();
    const onSubmit = vi.fn();
    const onPopLast = vi.fn();
    setup({ onSelectAdd, onSubmit, onPopLast });

    setDragging(true);
    window.dispatchEvent(new PointerEvent("pointerup"));
    expect(isDragging()).toBe(false);
    expect(onSubmit).toHaveBeenCalled();
  });

  it("does nothing on pointerdown when game is done", () => {
    createBubbles([{ cx: 100, cy: 100, r: 50 }]);
    const onSelectAdd = vi.fn();
    const onSubmit = vi.fn();
    const onPopLast = vi.fn();
    setup({ onSelectAdd, onSubmit, onPopLast });

    getState().done = true;
    const wheel = document.getElementById("wheel");
    wheel.dispatchEvent(pointerEvent("pointerdown", { clientX: 100, clientY: 100, pointerId: 1 }));
    expect(onSelectAdd).not.toHaveBeenCalled();
  });
});

describe("attachCellHandlers", () => {
  it("click triggers onCellTap with the cell", () => {
    const el = document.createElement("div");
    const cell = { r: 0, c: 0 };
    const onCellTap = vi.fn();
    attachCellHandlers(el, cell, onCellTap);

    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onCellTap).toHaveBeenCalledWith(cell);
  });

  it("Enter key triggers onCellTap", () => {
    const el = document.createElement("div");
    const cell = { r: 0, c: 0 };
    const onCellTap = vi.fn();
    attachCellHandlers(el, cell, onCellTap);

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onCellTap).toHaveBeenCalledWith(cell);
  });

  it("Space key triggers onCellTap", () => {
    const el = document.createElement("div");
    const cell = { r: 0, c: 0 };
    const onCellTap = vi.fn();
    attachCellHandlers(el, cell, onCellTap);

    el.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(onCellTap).toHaveBeenCalledWith(cell);
  });

  it("Arrow keys move focus to adjacent cell", () => {
    buildGrid();
    const G = getState();
    const cell0 = G.cells.get("0,0");
    const cell1 = G.cells.get("0,1");

    const onCellTap = vi.fn();
    attachCellHandlers(cell0.el, cell0, onCellTap);
    attachCellHandlers(cell1.el, cell1, onCellTap);

    cell0.el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(document.activeElement).toBe(cell1.el);
  });

  it("Arrow keys do nothing when target cell is outside the grid", () => {
    buildGrid();
    const G = getState();
    const cell0 = G.cells.get("0,0");
    const onCellTap = vi.fn();
    attachCellHandlers(cell0.el, cell0, onCellTap);

    cell0.el.focus();
    cell0.el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(document.activeElement).toBe(cell0.el);
  });

  it("does not throw when G is null", () => {
    setG(null);
    const el = document.createElement("div");
    const cell = { r: 0, c: 0 };
    expect(() => {
      attachCellHandlers(el, cell, vi.fn());
    }).not.toThrow();
  });
});

describe("onBubbleKey", () => {
  /** Helper to set up bubbles */
  function makeBubbles() {
    const bubbles = getBubbles();
    bubbles.length = 0;
    for (let i = 0; i < 2; i++) {
      const el = document.createElement("div");
      el.className = "bub";
      document.getElementById("wheel").appendChild(el);
      bubbles.push({ el });
    }
    return bubbles;
  }

  it("Enter calls selAdd when bubble not in selection", () => {
    makeBubbles();
    const bubbles = getBubbles();

    const selAdd = vi.fn();
    const submitSel = vi.fn();
    onBubbleKey({ key: "Enter", preventDefault: vi.fn() }, bubbles[0].el, selAdd, submitSel);

    expect(selAdd).toHaveBeenCalledWith(bubbles[0]);
    expect(submitSel).not.toHaveBeenCalled();
  });

  it("Enter calls submitSel when bubble is the last in selection", () => {
    makeBubbles();
    const bubbles = getBubbles();
    getState().sel = [bubbles[0], bubbles[1]];

    const selAdd = vi.fn();
    const submitSel = vi.fn();
    onBubbleKey({ key: "Enter", preventDefault: vi.fn() }, bubbles[1].el, selAdd, submitSel);

    expect(submitSel).toHaveBeenCalled();
    expect(selAdd).not.toHaveBeenCalled();
  });

  it("Space works same as Enter", () => {
    makeBubbles();
    const bubbles = getBubbles();

    const selAdd = vi.fn();
    const submitSel = vi.fn();
    onBubbleKey({ key: " ", preventDefault: vi.fn() }, bubbles[0].el, selAdd, submitSel);

    expect(selAdd).toHaveBeenCalled();
  });

  it("ignores other keys", () => {
    const selAdd = vi.fn();
    const submitSel = vi.fn();
    onBubbleKey({ key: "Tab", preventDefault: vi.fn() }, null, selAdd, submitSel);

    expect(selAdd).not.toHaveBeenCalled();
    expect(submitSel).not.toHaveBeenCalled();
  });

  it("does nothing when bubble not found", () => {
    const selAdd = vi.fn();
    const submitSel = vi.fn();
    const el = document.createElement("div");
    onBubbleKey({ key: "Enter", preventDefault: vi.fn() }, el, selAdd, submitSel);
    expect(selAdd).not.toHaveBeenCalled();
  });
});
