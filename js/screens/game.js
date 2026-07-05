// @ts-check
/* ================= OYUN EKRANI (geriye uyumluluk) =================
 * Bu dosya artık sadece public API'yi re-export ediyor. Tüm mantık
 * js/game/ modüllerinde (state, render, input, hints, reward).
 *
 * Eski import'lar (örn. `import { startLevel } from "./screens/game.js"`)
 * çalışmaya devam eder; yeni kod doğrudan `import { ... } from "../game"` kullanmalı. */

export {
  G, bubbles, startLevel, buildGrid, fillCell,
  setupWheelListeners, initGameScreens,
} from "../game/index.js";
