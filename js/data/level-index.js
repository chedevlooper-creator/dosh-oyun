// @ts-check
/* ================= SEVİYE İNDEKSİ =================
 * Hafif, senkron indeks: hangi seviye hangi pakette. Seviye içerikleri
 * js/data/levels/pack-N.json dosyalarında yaşar ve level-loader.js
 * üzerinden lazy yüklenir. Yeni pack eklerken: JSON dosyasını koy,
 * buraya aralığını ekle (scripts/analyze-coverage.mjs de JSON'ları okur). */

export const PACK_RANGES = [
  {"pack":1,"from":0,"to":25},
  {"pack":2,"from":26,"to":50},
  {"pack":3,"from":51,"to":75},
  {"pack":4,"from":76,"to":100},
  {"pack":5,"from":101,"to":125},
  {"pack":6,"from":126,"to":150},
  {"pack":7,"from":151,"to":175},
];

export const LEVEL_COUNT = 176;
export const LAST_LEVEL_ID = 175;

/** @param {number} id @returns {number|null} */
export function packOfLevel(id) {
  const r = PACK_RANGES.find((r) => id >= r.from && id <= r.to);
  return r ? r.pack : null;
}
