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

import { S, addFoundWord } from "../engine/store.js";
import { getLevel } from "../data/level-loader.js";
import { CFG } from "../data/config.js";
import { t } from "../utils/i18n.js";
import { SFX } from "../engine/audio.js";
import { show, updateCoins, toast, flyCoins, vibrate } from "../utils/helpers.js";
import { onResize } from "../utils/resize.js";
import { speak } from "../utils/tts.js";
import { track, EVENTS } from "../utils/analytics.js";
import { resetTimeAttack, isTimeAttack, recordTAScore } from "./time-attack.js";
import {
  G as storeG, getState, getBubbles, initState, isDragging,
} from "./state.js";
import {
  buildGrid as _buildGrid, fillCell as _fillCell, buildWheel, shuffleWheel,
  renderSel, clearSel,
} from "./render.js";
import { setupWheelListeners as _setupWheelListeners, onBubbleKey, onCellKey } from "./input.js";
import {
  onWrongGuess, hintLetter, hintTarget, hintWand, onCellTap,
} from "./hints.js";
import {
  levelComplete as _levelComplete,
  updateWordProgress, showWordInfo, showBonusChest,
} from "./reward.js";

/* ---------- STATE EXPORT'LARI ----------
 * Eski import'lar için: `import { G, bubbles } from "../screens/game.js"`.
 * Yeni import'lar için: `import { G, bubbles } from "../game/index.js"`. */
export const G = storeG; // store proxy (state.js'deki module-local G ile karışmasın)
export const bubbles = getBubbles();

/* ---------- KELİME ÇÖZME + YANLIŞ AKIŞI ----------
 * Bu fonksiyonlar reward.js'in dışındadır çünkü hem render'ı hem state'i
 * hem store'u hem de hints'i birlikte kullanır. Orkestrasyon gerektirir. */

import { resetWrongRow } from "./state.js";

/**
 * Seçili balonu sel listesine ekle.
 */
export function selAdd(b) {
  const G = getState();
  if (!G) return;
  G.sel.push(b);
  b.el.classList.add("sel");
  SFX.pick(G.sel.length - 1);
  vibrate(8);
  renderSel();
}

/** Son seçimi geri al (pointermove'da geriye doğru gidildiğinde). */
function selPopLast() {
  const G = getState();
  if (!G) return;
  const last = G.sel.pop();
  if (last) last.el.classList.remove("sel");
  renderSel();
}

/** Tüm kelime çözüm mantığı (seçim → hedef eşleşme veya yanlış). */
export function submitSel() {
  const G = getState();
  if (!G) return;
  const word = G.sel.map((b) => b.letter).join("");
  const doClear = clearSel();

  if (G.sel.length < 2) { doClear(); return; }

  const target = G.words.find((w) => !w.solved && w.norm === word);
  if (target) { doClear("ok"); solveWord(target, false); return; }

  if (G.words.some((w) => w.solved && w.norm === word) || G.foundBonus.has(word)) {
    doClear("dup");
    toast(t("game.found"));
    return;
  }

  if (G.bonusSet.has(word)) {
    doClear("ok");
    resetWrongRow();
    G.foundBonus.add(word);
    document.getElementById("bonus-count").textContent = G.foundBonus.size;
    addFoundWord(word, { isBonus: true, coins: CFG.bonusWordCoins });
    G.earned += CFG.bonusWordCoins;
    updateCoins();
    SFX.bonus();
    flyCoins(document.getElementById("bonus-chest"), 3);
    toast(t("game.bonusMsg", CFG.bonusWordCoins), "gold");
    return;
  }

  // Hata
  G.mistakes++;
  G.streak = 0;
  doClear("bad");
  SFX.bad();
  vibrate([40, 50, 40]);
  toast(t("game.wrong"), "bad");
  onWrongGuess({ checkAutoSolve, checkDone });
}

/** Bir hücre tıklandığında çağrılır (input.js + DOM). */
function onCellTapHandler(cell) {
  onCellTap(cell, { showWordInfo, checkAutoSolve, checkDone });
}

/** Tüm kelimelerin hücreleri doluysa otomatik çöz (cell.dolduruldu → solved). */
function checkAutoSolve() {
  const G = getState();
  if (!G) return;
  for (const w of G.words) {
    if (!w.solved && w.cells.every((c) => c.filled)) solveWord(w, true);
  }
}

/**
 * Kelimeyi çöz (doğru cevap veya otomatik tamamlama).
 * @param {import("./state.js").ProcessedWord} w
 * @param {boolean} byHint
 */
function solveWord(w, byHint) {
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
  // TTS: kelime çözüldüğünde sesli oku (oyuncu ayarı kapalıysa atlanır)
  if (!byHint) {
    speak(w.norm, S.settings.lang);
  }
  // Time Attack: puan kaydet ve seviye atla
  if (!byHint && isTimeAttack()) {
    recordTAScore(w.norm);
    const tta = import("./time-attack.js");
    tta.then((mod) => {
      if (mod.isTimeAttack()) mod.advanceTALevel();
    });
  }
  checkAutoSolve();
  if (G.words.every((x) => x.solved)) {
    setTimeout(() => levelComplete(onMap, onNext), w.cells.length * 70 + 600);
  }
}

/** Tüm kelimeler çözüldüyse (solved) tamamlanma akışını başlat. */
function checkDone() {
  const G = getState();
  if (G && G.words.every((x) => x.solved) && !G.done) {
    setTimeout(() => levelComplete(onMap, onNext), 700);
  }
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
  updateWordProgress();
  const strip = document.getElementById("info-strip");
  strip.className = "";
  strip.innerHTML = "";
  updateCoins();
  show("scr-game");
  buildWheel(lv.letters.slice(), (e, el) => onBubbleKey(e, el, selAdd, () => submitSel()));
  requestAnimationFrame(() => buildGrid());
}

/* ---------- PUBLIC: GRID + FILL ---------- */

export function buildGrid() {
  _buildGrid();
}

export function fillCell(cell, hint) {
  _fillCell(cell, hint);
}

/* ---------- PUBLIC: WHEEL LISTENERS ----------
 * Eski public API: setupWheelListeners() (parametresiz).
 * Eski game.js'te initGameScreens içinden çağrılıyordu; artık input.js'de
 * parametreli versiyonu kullanılıyor. Geriye uyumluluk için no-op re-export. */
export function setupWheelListeners() {
  // Artık initGameScreens içinde inline olarak kuruluyor.
}

/* ---------- NAVIGATION CALLBACKS ---------- */

function onMap() {
  import("../screens/map.js").then((m) => m.openMap());
}

function onNext() {
  const G = getState();
  if (G) startLevel(G.lv.id + 1);
}

/* ---------- PUBLIC: İNİTİALİZASYON ---------- */

export function initGameScreens() {
  document.getElementById("map-back").onclick = () => {
    import("../screens/home.js").then(({ renderHome }) => { renderHome(); show("scr-home"); });
  };

  // günlük bulmacadan çıkış haritaya değil ana ekrana döner
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
      // Time Attack aktifse timer'ı temizle
      if (typeof resetTimeAttack === "function") resetTimeAttack();
    }
    if (G && G.daily) {
      import("../screens/home.js").then(({ renderHome }) => { renderHome(); show("scr-home"); });
    } else onMap();
  };
  document.getElementById("game-settings").onclick = () => {
    import("../screens/settings.js").then(({ openSettings }) => openSettings());
  };

  document.getElementById("shuffle").onclick = shuffleWheel;
  document.getElementById("hint-letter").onclick = () =>
    hintLetter({ checkAutoSolve, checkDone });
  document.getElementById("hint-target").onclick = hintTarget;
  document.getElementById("hint-wand").onclick = () =>
    hintWand({ checkAutoSolve, checkDone });
  document.getElementById("bonus-chest").onclick = showBonusChest;

  // Delegasyon: #grid tıklama — per-cell listener yerine tek dinleyici
  document.getElementById("grid").addEventListener("click", (e) => {
    const cellEl = e.target.closest(".cell");
    if (!cellEl) return;
    const G = getState();
    if (!G) return;
    const key = cellEl.dataset.row + "," + cellEl.dataset.col;
    const cell = G.cells.get(key);
    if (cell) onCellTapHandler(cell);
  });

  // Delegasyon: #grid klavye
  document.getElementById("grid").addEventListener("keydown", (e) => {
    const cellEl = e.target.closest(".cell");
    if (!cellEl) return;
    const G = getState();
    if (!G) return;
    const key = cellEl.dataset.row + "," + cellEl.dataset.col;
    const cell = G.cells.get(key);
    if (cell) onCellKey(e, cell, onCellTapHandler);
  });

  setupWheelListenersImpl();
}

function setupWheelListenersImpl() {
  _setupWheelListeners({
    onSelectAdd: selAdd,
    onSubmit: () => submitSel(),
    onPopLast: selPopLast,
  });
}

/* ---------- PUBLIC: LEVEL COMPLETE DELEGATION ---------- */

function levelComplete(onMapCb, onNextCb) {
  _levelComplete({ onMap: onMapCb, onNext: onNextCb });
}

/* ---------- RESIZE HANDLER ---------- */

onResize(() => {
  const G = getState();
  if (G && document.getElementById("scr-game")?.classList.contains("on")) {
    const filled = [...G.cells.values()].filter((c) => c.filled);
    buildGrid();
    filled.forEach((c) => { c.filled = false; _fillCell(c, c.hint); });
    if (!getState().sel.length && !isDragging()) {
      buildWheel(G.lv.letters.slice(),
        (e, el) => onBubbleKey(e, el, selAdd, () => submitSel()));
    }
  }
});
