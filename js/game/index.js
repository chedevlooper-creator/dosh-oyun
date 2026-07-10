// @ts-check
/* ================= GAME (public API) =================
 * Oyun modülünün tek orkestratörü. State, render, input, hints, reward
 * modüllerini bağlar ve dışarıya public API sunar.
 *
 * Tüketenler (sadece bu dosyayı import etmeli):
 *   - js/screens/game.js (geriye uyumluluk için re-export)
 *   - js/main.js
 *   - js/screens/home.js
 *
 * Public API:
 *   startLevel(id, opts?)
 *   initGameScreens()
 *   buildGrid()
 *   fillCell(cell, hint?)
 *   G (state) — store.js'deki proxy'den okunur
 *   bubbles
 *   setupWheelListeners() (geriye uyumluluk) */

import { getLevel } from "../data/level-loader.js";
import { show, updateCoins, toast } from "../utils/helpers.js";
import { onResize } from "../utils/resize.js";
import { track, EVENTS } from "../utils/analytics.js";
import { isTimeAttack, recordTAScore, advanceTALevel } from "./time-attack.js";
import {
  G as storeG, getState, getBubbles, initState, isDragging,
} from "./state.js";
import {
  buildGrid as _buildGrid, fillCell as _fillCell, buildWheel,
} from "./render.js";
import { onBubbleKey } from "./input.js";
import { initGameScreens as _initGameScreens } from "./init.js";
import {
  selAdd, selPopLast, submitSel, checkAutoSolve, checkDone, onCellTapHandler,
} from "./solve.js";

/* ---------- STATE EXPORT'LARI ---------- */
export { selAdd, selPopLast, submitSel } from "./solve.js";
export const G = storeG;
export const bubbles = getBubbles();

/* ---------- CALLBACKS ---------- */

function onMap() {
  import("../screens/map.js").then((m) => m.openMap());
}

function onNext() {
  const st = getState();
  if (st) startLevel(st.lv.id + 1);
}

/**
 * Callback nesnesi — solve.js'e circular dependency olmadan bağlanır.
 * Recursive callback'ler kendi cbs'lerini self-reference olarak sarmalar.
 */
function getSolveCbs() {
  const cbs = {
    checkAutoSolve: () => checkAutoSolve(cbs),
    checkDone: () => checkDone({ onMap, onNext }),
    onMap,
    onNext,
    isTimeAttack,
    recordTAScore,
    advanceTALevel,
  };
  return cbs;
}

/* ---------- PUBLIC: SEVİYE BAŞLAT ---------- */

/**
 * Seviyeyi başlat.
 * @param {number} id
 * @param {{ daily?: boolean }} [opts]
 * @param {object} [lv] - Doğrudan level verisi (test play için)
 */
export async function startLevel(id, opts = {}, lv) {
  if (!lv) {
    lv = await getLevel(id).catch((e) => {
      console.warn("[game] seviye yüklenemedi:", e);
      return null;
    });
  }
  if (!lv) { toast("ТӀегӀа ца йеллало 😕"); return; }

  initState(lv, opts);

  track(EVENTS.LEVEL_START, { level: id, pack: lv.pack ?? 0, daily: !!opts.daily });

  document.getElementById("lvl-num").textContent = id + 1;
  document.getElementById("bonus-count").textContent = "0";
  const { updateWordProgress } = await import("./reward.js");
  updateWordProgress();
  const strip = document.getElementById("info-strip");
  strip.className = "";
  strip.innerHTML = "";
  updateCoins();
  show("scr-game");
  const cbs = getSolveCbs();
  buildWheel(lv.letters.slice(), (e, el) => onBubbleKey(e, el, selAdd, () => submitSel(cbs)));
  requestAnimationFrame(() => buildGrid());
}

/* ---------- PUBLIC: GRID + FILL ---------- */

export function buildGrid() {
  _buildGrid();
}

export function fillCell(cell, hint) {
  _fillCell(cell, hint);
}

/* ---------- PUBLIC: WHEEL LISTENERS ---------- */
export function setupWheelListeners() {
  // Artık initGameScreens içinde inline olarak kuruluyor.
}

/* ---------- PUBLIC: INIT ---------- */

export function initGameScreens() {
  const cbs = getSolveCbs();
  _initGameScreens({
    selAdd,
    selPopLast,
    submitSel: () => submitSel(cbs),
    checkAutoSolve: () => checkAutoSolve(cbs),
    checkDone: () => checkDone({ onMap, onNext }),
    onCellTapHandler: (cell) => onCellTapHandler(cell, {
      checkAutoSolve: () => checkAutoSolve(cbs),
      checkDone: () => checkDone({ onMap, onNext }),
    }),
  });
}

/* ---------- RESIZE HANDLER ---------- */

onResize(() => {
  const G = getState();
  if (G && document.getElementById("scr-game")?.classList.contains("on")) {
    const filled = [...G.cells.values()].filter((c) => c.filled);
    buildGrid();
    filled.forEach((c) => { c.filled = false; _fillCell(c, c.hint); });
    if (!getState().sel.length && !isDragging()) {
      const cbs = getSolveCbs();
      buildWheel(G.lv.letters.slice(),
        (e, el) => onBubbleKey(e, el, selAdd, () => submitSel(cbs)));
    }
  }
});
