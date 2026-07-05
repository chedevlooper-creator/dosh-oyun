// @ts-check
/* ================= INPUT =================
 * Pointer + klavye event'leri. Tek noktada toplanmıştır: çark sürükleme,
 * hücre tıklama, hücre klavye gezinme, baloncuk klavye seçimi.
 *
 * Dışarıya takılacak callback'ler init'te verilir — bu modül DOM event'lerini
 * bilir, iş mantığını bilmez. */

import { getState, getBubbles, isDragging, setDragging } from "./state.js";

/**
 * Verilen koordinatlara en yakın balonu bulur.
 * @param {number} x viewport x
 * @param {number} y viewport y
 */
export function bubbleAt(x, y) {
  const bubbles = getBubbles();
  for (const b of bubbles) {
    if ((x - b.cx) ** 2 + (y - b.cy) ** 2 <= b.r * b.r) return b;
  }
  return null;
}

/**
 * Çark sürükleme dinleyicilerini kurar. selAdd/submitSel callback'leri
 * dışarıdan verilir (game.js orkestratöründe select kelime akışını bağlar).
 * @param {{
 *   onSelectAdd: (b: any) => void,
 *   onSubmit: () => void,
 *   onPopLast: () => void,
 * }} cbs
 */
export function setupWheelListeners(cbs) {
  const wheel = document.getElementById("wheel");

  const onPointerDown = (e) => {
    const G = getState();
    if (!G || G.done) return;
    const b = bubbleAt(e.clientX, e.clientY);
    if (!b) return;
    setDragging(true);
    try { wheel.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    G.sel = [];
    const bubbles = getBubbles();
    bubbles.forEach((x) => x.el.classList.remove("sel"));
    cbs.onSelectAdd(b);
  };

  const onPointerMove = (e) => {
    if (!isDragging()) return;
    const G = getState();
    if (!G) return;
    const b = bubbleAt(e.clientX, e.clientY);
    if (!b) return;
    const i = G.sel.indexOf(b);
    if (i === -1) cbs.onSelectAdd(b);
    else if (i === G.sel.length - 2) cbs.onPopLast();
  };

  const onPointerUp = () => {
    if (!isDragging()) return;
    setDragging(false);
    cbs.onSubmit();
  };

  wheel.addEventListener("pointerdown", onPointerDown);
  wheel.addEventListener("pointermove", onPointerMove, { passive: true });
  addEventListener("pointerup", onPointerUp);

  // Bir sonraki seviyeye geçerken listener'ları temizlemek için
  return () => {
    wheel.removeEventListener("pointerdown", onPointerDown);
    wheel.removeEventListener("pointermove", onPointerMove);
    removeEventListener("pointerup", onPointerUp);
  };
}

/**
 * Bir hücre elemanına tıklama ve klavye handler'ı takar. onCellTap iş
 * mantığını dışarıdan alır.
 * @param {HTMLElement} el
 * @param {import("./state.js").CellData} cell
 * @param {(cell: any) => void} onCellTap
 */
export function attachCellHandlers(el, cell, onCellTap) {
  el.addEventListener("click", () => onCellTap(cell));
  el.addEventListener("keydown", (e) => onCellKey(e, cell, onCellTap));
}

/** Hücre için klavye handler — ok tuşları komşuya, Enter/Space hedefi seçer. */
function onCellKey(e, cell, onCellTap) {
  const G = getState();
  if (!G) return;
  const map = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
  if (e.key in map) {
    e.preventDefault();
    const [dr, dc] = map[e.key];
    const target = G.cells.get(`${cell.r + dr},${cell.c + dc}`);
    if (target && target.el) target.el.focus();
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    onCellTap(cell);
  }
}

/**
 * Çarktaki tüm baloncuklara klavye handler'ı bağlar (render.js tarafından
 * buildWheel içinde her bir bub'a takılır). Enter/Space seçer veya son
 * seçimi submit eder.
 */
export function onBubbleKey(e, el, selAdd, submitSel) {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  const G = getState();
  const bubbles = getBubbles();
  if (!G) return;
  const b = bubbles.find((bub) => bub.el === el);
  if (!b) return;
  const i = G.sel.indexOf(b);
  if (i === -1) selAdd(b);
  else if (i === G.sel.length - 1) submitSel();
}
