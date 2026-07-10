// @ts-check
/* ================= KELİME ÇÖZME MANTIGI =================
 * Seçim → eşleşme → çözüm / yanlış akışı.
 * Bu modül hem render hem state hem hints hem reward ile orkestrasyon yapar.
 *
 * Circular dependency önlemi: time-attack.js'den import yok.
 * Tüm external callbacks (isTimeAttack, recordTAScore, advanceTALevel, onMap, onNext)
 * solve.js'e cbs parametresi iletilir.
 */

import { S, addFoundWord } from "../engine/store.js";
import { CFG } from "../data/config.js";
import { t } from "../utils/i18n.js";
import { SFX } from "../engine/audio.js";
import { updateCoins, toast, flyCoins, vibrate } from "../utils/helpers.js";
import { speak } from "../utils/tts.js";
import { getState, resetWrongRow } from "./state.js";
import { fillCell as _fillCell, renderSel, clearSel } from "./render.js";
import { onWrongGuess, onCellTap } from "./hints.js";
import { updateWordProgress, showWordInfo } from "./reward.js";

/* ---------- SEÇIM ---------- */

/**
 * Seçili balonu sel listesine ekle.
 */
export function selAdd(b) {
  const G = getState();
  if (!G) return;
  const isFirst = G.sel.length === 0;
  G.sel.push(b);
  b.el.classList.add("sel");
  SFX.pick(G.sel.length - 1);
  if (isFirst) vibrate(8);
  renderSel();
}

/** Son seçimi geri al (pointermove'da geriye doğru gidildiğinde). */
export function selPopLast() {
  const G = getState();
  if (!G) return;
  const last = G.sel.pop();
  if (last) last.el.classList.remove("sel");
  renderSel();
}

/* ---------- YANLIS / BONUS / KOPYA ---------- */

/** Daha önce çözülmüş kelimeyi veya bonusu tekrar gönderme girişimi. */
function _handleDuplicate() {
  clearSel()("dup");
  toast(t("game.found"));
}

/** Bonus kelime bulundu: coin + UI güncelleme. */
function _handleBonus(word) {
  const G = getState();
  if (!G) return;
  clearSel()("ok");
  resetWrongRow();
  G.foundBonus.add(word);
  document.getElementById("bonus-count").textContent = G.foundBonus.size;
  addFoundWord(word, { isBonus: true, coins: CFG.bonusWordCoins });
  G.earned += CFG.bonusWordCoins;
  updateCoins();
  SFX.bonus();
  flyCoins(document.getElementById("bonus-chest"), 3);
  toast(t("game.bonusMsg", CFG.bonusWordCoins), "gold");
}

/** Yanlış cevap: hata sayacını artır, ipucu yardımını tetikle. */
function _handleMistake(cbs) {
  const G = getState();
  if (!G) return;
  G.mistakes++;
  G.streak = 0;
  clearSel()("bad");
  SFX.bad();
  vibrate([40, 50, 40]);
  toast(t("game.wrong"), "bad");
  if (cbs?.checkAutoSolve) {
    onWrongGuess({ checkAutoSolve: cbs.checkAutoSolve, checkDone: cbs.checkDone });
  }
}

/* ---------- KELIME ÇÖZME ---------- */

/**
 * Kelimeyi çöz (doğru cevap veya otomatik tamamlama).
 * @param {import("./state.js").ProcessedWord} w
 * @param {boolean} byHint
 * @param {object} [cbs] - callbacks: { checkAutoSolve, checkDone, onMap, onNext, isTimeAttack, recordTAScore, advanceTALevel }
 */
export function solveWord(w, byHint, cbs) {
  const G = getState();
  if (!G) return;
  w.solved = true;
  resetWrongRow();
  updateWordProgress();
  if (!byHint) {
    vibrate(25);
    const gw = document.getElementById("grid-wrap");
    gw.classList.remove("shake");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        gw.classList.add("shake");
      });
    });
  }

  w.cells.forEach((c, i) => setTimeout(() => {
    _fillCell(c, byHint);
    if (!byHint && c.el) {
      c.el.classList.add("glowup");
      setTimeout(() => c.el.classList.remove("glowup"), 700);
    }
  }, i * 70));

  addFoundWord(w.norm);
  S.stats.words++;

  if (!byHint) {
    G.streak++;
    S.stats.bestStreak = Math.max(S.stats.bestStreak, G.streak);
    const coins = w.g.length * CFG.coinsPerGrapheme;
    const combo = (G.streak % CFG.comboMilestone === 0) ? CFG.comboBonusCoins : 0;
    S.coins += coins + combo;
    S.stats.coinsEarned += coins + combo;
    G.earned += coins + combo;
    SFX.solve();
    flyCoins(document.getElementById("grid"), 4);
    if (combo) setTimeout(() => { toast(t("game.combo", G.streak, combo), "gold"); SFX.coin(); }, 500);
  }

  showWordInfo(w);
  updateCoins();
  if (!byHint) {
    speak(w.norm, S.settings.lang);
  }
  if (!byHint && cbs?.isTimeAttack?.()) {
    cbs.recordTAScore(w.norm);
    cbs.advanceTALevel();
  }
  cbs?.checkAutoSolve?.();
  if (G.words.every((x) => x.solved)) {
    import("./reward.js").then(({ levelComplete }) => {
      setTimeout(() => levelComplete({ onMap: cbs?.onMap, onNext: cbs?.onNext }), w.cells.length * 70 + 600);
    });
  }
}

/* ---------- TÜM KELIME ÇÖZÜM MANTIGI ---------- */

/**
 * Tüm kelime çözüm mantığı (seçim → hedef eşleşme veya yanlış).
 * @param {object} [cbs] - callbacks: { checkAutoSolve, checkDone, onMap, onNext, isTimeAttack, recordTAScore, advanceTALevel }
 */
export function submitSel(cbs) {
  const G = getState();
  if (!G) return;
  const word = G.sel.map((b) => b.letter).join("");

  if (G.sel.length < 2) { clearSel()(); return; }

  const target = G.words.find((w) => !w.solved && w.norm === word);
  if (target) { clearSel()("ok"); solveWord(target, false, cbs); return; }

  if (G.words.some((w) => w.solved && w.norm === word) || G.foundBonus.has(word)) {
    _handleDuplicate(); return;
  }

  if (G.bonusSet.has(word)) { _handleBonus(word); return; }

  _handleMistake(cbs);
}

/* ---------- HÜCRE TIKLAMA ---------- */

/**
 * Bir hücre tıklandığında çağrılır (input.js + DOM).
 * @param {object} cell
 * @param {object} [cbs] - callbacks: { checkAutoSolve, checkDone }
 */
export function onCellTapHandler(cell, cbs) {
  onCellTap(cell, {
    showWordInfo,
    checkAutoSolve: cbs?.checkAutoSolve,
    checkDone: cbs?.checkDone,
  });
}

/* ---------- OTOMATIK ÇÖZÜM ---------- */

/** Tüm kelimelerin hücreleri doluysa otomatik çöz.
 * @param {object} [cbs] - callbacks: { checkAutoSolve, checkDone, onMap, onNext, isTimeAttack, recordTAScore, advanceTALevel }
 */
export function checkAutoSolve(cbs) {
  const G = getState();
  if (!G) return;
  for (const w of G.words) {
    if (!w.solved && w.cells.every((c) => c.filled)) solveWord(w, true, cbs);
  }
}

/** Tüm kelimeler çözüldüyse tamamlanma akışını başlat.
 * @param {object} [cbs] - callbacks: { onMap, onNext }
 */
export function checkDone(cbs) {
  const G = getState();
  if (G && G.words.every((x) => x.solved) && !G.done) {
    import("./reward.js").then(({ levelComplete }) => {
      setTimeout(() => levelComplete({ onMap: cbs?.onMap, onNext: cbs?.onNext }), 700);
    });
  }
}
