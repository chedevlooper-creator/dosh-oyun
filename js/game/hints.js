// @ts-check
/* ================= HINTS =================
 * Coin harcama, harf hedefleme, sihirli değnek, takılma yardımcısı.
 * State.js'ten okur, render.js'ten DOM API'sini kullanır, store'a
 * proxy üzerinden yazar (otomatik save tetikler). */

import { S } from "../engine/store.js";
import { CFG } from "../data/config.js";
import { t } from "../utils/i18n.js";
import { SFX } from "../engine/audio.js";
import { toast, updateCoins } from "../utils/helpers.js";
import { track, EVENTS } from "../utils/analytics.js";
import {
  getState, randomUnfilled, unfilled, pushWrongGuess,
  markRescued,
} from "./state.js";
import { fillCell } from "./render.js";

/**
 * Coin harcamayı dene. Yeterli bakiye yoksa false döndürür ve kullanıcıyı
 * bilgilendirir. Başarı durumunda bakiyeyi ve istatistikleri günceller.
 * @param {number} cost
 * @returns {boolean}
 */
export function spend(cost) {
  if (S.coins < cost) {
    toast(t("game.needCoins", cost), "bad");
    SFX.bad();
    return false;
  }
  S.coins -= cost;
  S.stats.coinsSpent += cost;
  S.stats.hints++;
  const G = getState();
  if (G) G.hints++;
  updateCoins();
  return true;
}

/**
 * Üst üste yanlış cevapta takılma yardımcısı. 4. yanlışta ipucu butonunu
 * vurgular, 6. yanlışta (ve yetersiz bakiyede) bir bedava harf verir.
 * @param {{ checkAutoSolve: () => void, checkDone: () => void }} cbs
 */
export function onWrongGuess(cbs) {
  const G = getState();
  if (!G) return;
  const wr = pushWrongGuess();
  if (wr === 4) {
    const hb = document.getElementById("hint-letter");
    if (hb) {
      hb.classList.add("pulse-ring");
      setTimeout(() => hb.classList.remove("pulse-ring"), 4200);
    }
    toast(t("game.hintPrompt"));
  }
  if (wr >= 6 && !G.rescued && S.coins < CFG.hintCost) {
    markRescued();
    const cell = randomUnfilled();
    if (cell) {
      fillCell(cell, true);
      SFX.hint();
      toast(t("game.hintGift"), "gold");
      cbs.checkAutoSolve();
      cbs.checkDone();
    }
  }
}

/** Harf ipucu: rastgele bir boş hücreyi doldur (maliyetli). */
export function hintLetter(cbs) {
  const G = getState();
  if (!G || G.done) return;
  if (!unfilled().length) return;
  const btn = document.getElementById("hint-letter");
  if (!spend(CFG.hintCost)) {
    // Yetersiz bakiye: butonda sallanma feedback
    if (btn) {
      btn.classList.add("hint-insufficient");
      setTimeout(() => btn.classList.remove("hint-insufficient"), 500);
    }
    return;
  }
  const cell = randomUnfilled();
  if (!cell) return;
  fillCell(cell, true);
  SFX.hint();
  // Başarı feedback: butona parıltı
  if (btn) {
    btn.classList.add("hint-success");
    setTimeout(() => btn.classList.remove("hint-success"), 600);
  }
  track(EVENTS.HINT_USED, { type: "letter", level: G.lv.id, cost: CFG.hintCost });
  cbs.checkAutoSolve();
  cbs.checkDone();
}

/** Hedef ipucu: kullanıcının bir hücreyi seçmesi için targeting mode'a geç. */
export function hintTarget() {
  const G = getState();
  if (!G || G.done) return;
  if (!unfilled().length) return;
  const btn = document.getElementById("hint-target");
  if (S.coins < CFG.targetHintCost) {
    toast(t("game.needCoins", CFG.targetHintCost), "bad");
    SFX.bad();
    if (btn) {
      btn.classList.add("hint-insufficient");
      btn.querySelector(".price")?.classList.add("price-shake");
      setTimeout(() => {
        btn.classList.remove("hint-insufficient");
        btn.querySelector(".price")?.classList.remove("price-shake");
      }, 500);
    }
    return;
  }
  G.targeting = !G.targeting;
  for (const c of G.cells.values()) {
    if (c.el) c.el.classList.toggle("target", G.targeting);
  }
  // Hedefleme modu aktif görsel feedback
  if (btn) btn.classList.toggle("hint-active", G.targeting);
  if (G.targeting) toast(t("game.targetMsg"));
}

/**
 * Hücre tıklama handler'ı. Hedefleme modunda harf açar, kapalıyken dolu
 * hücrede bilgi şeridini gösterir.
 * @param {import("./state.js").CellData} cell
 * @param {{ showWordInfo: (w: any) => void, checkAutoSolve: () => void, checkDone: () => void }} cbs
 */
export function onCellTap(cell, cbs) {
  const G = getState();
  if (!G) return;
  if (!G.targeting && cell.filled) {
    // Hedefleme kapalıyken dolu hücreye dokunuş: kelimenin anlamını hatırlat
    const w = G.words.find((x) => x.solved && x.cells.includes(cell));
    if (w) {
      cbs.showWordInfo(w);
      SFX.pick(0);
    }
    return;
  }
  if (!G.targeting || cell.filled) return;
  G.targeting = false;
  for (const c of G.cells.values()) {
    if (c.el) c.el.classList.remove("target");
  }
  // Hedefleme modu kapandı: butondan aktif glow kaldır
  document.getElementById("hint-target")?.classList.remove("hint-active");
  if (!spend(CFG.targetHintCost)) return;
  fillCell(cell, true);
  SFX.hint();
  track(EVENTS.HINT_USED, { type: "target", level: G.lv.id, cost: CFG.targetHintCost });
  cbs.checkAutoSolve();
  cbs.checkDone();
}

/** Sihirli değnek: 3 rastgele harfi bedeli karşılığı doldur. */
export function hintWand(cbs) {
  const G = getState();
  if (!G || G.done) return;
  if (!unfilled().length) return;
  const btn = document.getElementById("hint-wand");
  if (!spend(CFG.magicWandCost)) {
    // Yetersiz bakiye: butonda sallanma feedback
    if (btn) {
      btn.classList.add("hint-insufficient");
      setTimeout(() => btn.classList.remove("hint-insufficient"), 500);
    }
    return;
  }
  for (let k = 0; k < 3; k++) {
    const cell = randomUnfilled();
    if (!cell) break;
    fillCell(cell, true);
  }
  SFX.hint();
  // Başarı feedback: wand özel üçlü parıltı animasyonu
  if (btn) {
    btn.classList.add("hint-wand-active");
    setTimeout(() => btn.classList.remove("hint-wand-active"), 800);
  }
  track(EVENTS.HINT_USED, { type: "wand", level: G.lv.id, cost: CFG.magicWandCost });
  cbs.checkAutoSolve();
  cbs.checkDone();
}
