// @ts-check
/* ================= OYUN EKRANI İNİTİALİZASYONU =================
 * Event delegation, buton handler'ları, wheel listener kurulumu.
 * Bu modül sadece DOM event'leri kurar; iş mantığı index.js'de.
 */

import { getState } from "./state.js";
import { resetTimeAttack } from "./time-attack.js";
import { shuffleWheel } from "./render.js";

import {
  setupWheelListeners as _setupWheelListeners, onCellKey,
} from "./input.js";
import { hintLetter, hintTarget, hintWand } from "./hints.js";
import { showBonusChest } from "./reward.js";
import { track, EVENTS } from "../utils/analytics.js";
import { show } from "../utils/helpers.js";

/**
 * Public callback'leri dışarıdan alır.
 * Bu sayede init.js solve/index'e bağımlı kalmaz (circular dependency önlenir).
 * @param {object} cbs
 * @param {Function} cbs.selAdd
 * @param {Function} cbs.submitSel
 * @param {Function} cbs.checkAutoSolve
 * @param {Function} cbs.checkDone
 * @param {Function} cbs.onCellTapHandler
 */
export function initGameScreens(cbs) {
  document.getElementById("map-back").onclick = () => {
    import("../screens/home.js").then(({ renderHome }) => { renderHome(); show("scr-home"); });
  };

  document.getElementById("game-back").onclick = () => {
    const G = getState();
    if (G) {
      const total = G.words?.length || 0;
      const solved = G.words?.filter((w) => w.solved).length || 0;
      const progressPct = total ? Math.round((solved / total) * 100) : 0;
      track(EVENTS.LEVEL_QUIT, {
        level: G.lv?.id,
        pack: G.lv?.pack ?? 0,
        progress_pct: progressPct,
        solved,
        total,
        daily: !!G.daily,
      });
      resetTimeAttack();
    }
    if (G && G.daily) {
      import("../screens/home.js").then(({ renderHome }) => { renderHome(); show("scr-home"); });
    } else {
      import("../screens/map.js").then((m) => m.openMap());
    }
  };

  document.getElementById("game-settings").onclick = () => {
    import("../screens/settings.js").then(({ openSettings }) => openSettings());
  };

  document.getElementById("shuffle").onclick = shuffleWheel;
  document.getElementById("hint-letter").onclick = () =>
    hintLetter({ checkAutoSolve: cbs.checkAutoSolve, checkDone: cbs.checkDone });
  document.getElementById("hint-target").onclick = hintTarget;
  document.getElementById("hint-wand").onclick = () =>
    hintWand({ checkAutoSolve: cbs.checkAutoSolve, checkDone: cbs.checkDone });
  document.getElementById("bonus-chest").onclick = showBonusChest;

  // Delegasyon: #grid tıklama
  document.getElementById("grid").addEventListener("click", (e) => {
    const cellEl = e.target.closest(".cell");
    if (!cellEl) return;
    const G = getState();
    if (!G) return;
    const key = cellEl.dataset.row + "," + cellEl.dataset.col;
    const cell = G.cells.get(key);
    if (cell) cbs.onCellTapHandler(cell);
  });

  // Delegasyon: #grid klavye
  document.getElementById("grid").addEventListener("keydown", (e) => {
    const cellEl = e.target.closest(".cell");
    if (!cellEl) return;
    const G = getState();
    if (!G) return;
    const key = cellEl.dataset.row + "," + cellEl.dataset.col;
    const cell = G.cells.get(key);
    if (cell) onCellKey(e, cell, cbs.onCellTapHandler);
  });

  // Wheel listener'ları kur
  _setupWheelListeners({
    onSelectAdd: cbs.selAdd,
    onSubmit: () => cbs.submitSel(),
    onPopLast: cbs.selPopLast,
  });
}
