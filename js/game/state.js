// @ts-check
/* ================= OYUN DURUMU =================
 * G state nesnesi ve mutasyon yardımcıları. Sadece bu modül G'yi
 * mutate eder; diğer modüller update() helper'ı ile patch uygular. */

import { setG } from "../engine/store.js";
import { splitG } from "../engine/grapheme.js";

/**
 * @typedef {Object} LevelData
 * @property {number} id
 * @property {string[]} letters
 * @property {WordData[]} words
 * @property {string[]} [bonus]
 * @property {number} [pack]
 */

/**
 * @typedef {Object} WordData
 * @property {string} word
 * @property {number} row
 * @property {number} col
 * @property {string} dir
 */

/**
 * @typedef {Object} GameState
 * @property {LevelData} lv
 * @property {ProcessedWord[]} words
 * @property {Map<string, CellData>} cells
 * @property {Set<string>} bonusSet
 * @property {Set<string>} foundBonus
 * @property {number} mistakes
 * @property {number} hints
 * @property {number} streak
 * @property {number} earned
 * @property {Object[]} sel
 * @property {boolean} targeting
 * @property {boolean} done
 * @property {boolean} [daily]
 * @property {number} [wrongRow] - üst üste yanlış sayısı (takılma yardımcısı)
 * @property {boolean} [rescued] - bu seviyede bedava kurtarma harfi verildi mi
 * @property {boolean} [timeAttack] - Zamana Karşı modu aktif mi
 */

/**
 * @typedef {Object} ProcessedWord
 * @property {string} word
 * @property {number} row
 * @property {number} col
 * @property {string} dir
 * @property {string[]} g
 * @property {string} norm
 * @property {boolean} solved
 * @property {CellData[]} cells
 */

/**
 * @typedef {Object} CellData
 * @property {number} r
 * @property {number} c
 * @property {string} ch
 * @property {boolean} filled
 * @property {boolean} hint
 * @property {HTMLElement|null} el
 */

/** @type {GameState|null} */
let _G = null;

/**
 * G state'ine salt okunur erişim. Yeni kod getState() kullansın; bu export
 * eski API uyumluluğu için (import { G } from "./state.js" hâlâ çalışır).
 * @type {GameState|null}
 */
export const G = new Proxy({}, {
  get(_t, k) { return _G ? _G[k] : undefined; },
  set(_t, k, v) { if (_G) { _G[k] = v; return true; } return false; },
  has(_t, k) { return _G ? k in _G : false; },
  ownKeys() { return _G ? Reflect.ownKeys(_G) : []; },
  getOwnPropertyDescriptor(_t, k) {
    return _G ? Reflect.getOwnPropertyDescriptor(_G, k) : undefined;
  },
});

/** @type {{ el: HTMLElement, letter: string, x: number, y: number, idx: number,
 *          cx: number, cy: number, r: number }[]} */
const bubbles = [];
let dragging = false;

/** G state'ine salt okunur erişim. */
export function getState() { return G; }

/** Bubbles state'ine salt okunur erişim. */
export function getBubbles() { return bubbles; }

/** Dragging flag. */
export function isDragging() { return dragging; }
export function setDragging(v) { dragging = !!v; }

/**
 * Yeni seviye için G state'ini sıfırlar ve inşa eder. Store'a da bildirir
 * (atomik persist).
 * @param {LevelData} lv
 * @param {{ daily?: boolean, timeAttack?: boolean }} [opts]
 */
export function initState(lv, opts = {}) {
  const words = lv.words.map((w) => ({
    ...w,
    g: splitG(w.word),
    norm: splitG(w.word).join(""),
    solved: false,
  }));

  let minR = 1e9, minC = 1e9;
  for (const w of words) {
    minR = Math.min(minR, w.row);
    minC = Math.min(minC, w.col);
  }

  /** @type {Map<string, CellData>} */
  const cells = new Map();
  for (const w of words) {
    w.cells = [];
    for (let i = 0; i < w.g.length; i++) {
      const r = w.row - minR + (w.dir === "down" ? i : 0);
      const c = w.col - minC + (w.dir === "across" ? i : 0);
      const key = r + "," + c;
      if (!cells.has(key)) {
        cells.set(key, { r, c, ch: w.g[i], filled: false, hint: false, el: null });
      }
      w.cells.push(cells.get(key));
    }
  }

  const bonusSet = opts.timeAttack
    ? new Set()
    : new Set((lv.bonus || []).map((b) => splitG(b).join("")));

  _G = {
    lv, words, cells, bonusSet,
    foundBonus: new Set(),
    mistakes: 0, hints: 0, streak: 0, earned: 0,
    sel: [], targeting: false, done: false,
    daily: !!opts.daily,
    timeAttack: !!opts.timeAttack,
  };
  setG(_G);
  return _G;
}

/** Üst üste yanlış sayacını bir artırır, güncel değeri döndürür. */
export function pushWrongGuess() {
  if (!G) return 0;
  G.wrongRow = (G.wrongRow || 0) + 1;
  return G.wrongRow;
}

/** wrongRow sayacını sıfırlar (doğru cevapta). */
export function resetWrongRow() {
  if (G) G.wrongRow = 0;
}

/** Bu seviyede bedava kurtarma harfi kullanıldı mı? */
export function markRescued() {
  if (G) G.rescued = true;
}

/** Dolu olmayan hücreleri döndürür. */
export function unfilled() {
  if (!G) return [];
  return [...G.cells.values()].filter((c) => !c.filled);
}

/** Çözülmemiş hücrelerden rastgele bir tane seçer. */
export function randomUnfilled() {
  const u = unfilled();
  if (!u.length) return null;
  return u[(Math.random() * u.length) | 0];
}
