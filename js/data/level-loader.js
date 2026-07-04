// @ts-check
/* ================= SEVİYE YÜKLEYİCİ (LAZY) =================
 * Seviye içerikleri pack başına ayrı JSON chunk'larında yaşar; ilk
 * erişimde dynamic import ile yüklenir ve bellekte cache'lenir. Böylece
 * ana bundle seviye verisiyle şişmez ve içerik 500+ seviyeye ölçeklenir.
 * Senkron ihtiyaçlar (toplam sayı, pack aralıkları) level-index.js'te. */

import { PACK_RANGES, packOfLevel } from "./level-index.js";

/** Vite: her pack-N.json ayrı chunk olur, çağrılınca yüklenir */
const packFiles = import.meta.glob("./levels/pack-*.json", { import: "default" });

/** @type {Map<number, Promise<any[]>>} */
const cache = new Map();

/**
 * Bir paketin tüm seviyelerini yükler (cache'li).
 * @param {number} packId
 * @returns {Promise<any[]>}
 */
export function loadPack(packId) {
  const hit = cache.get(packId);
  if (hit) return hit;
  const loader = packFiles[`./levels/pack-${packId}.json`];
  if (!loader) return Promise.reject(new Error(`[levels] pack ${packId} bulunamadı`));
  const p = /** @type {Promise<any[]>} */ (loader());
  cache.set(packId, p);
  // yükleme hatasında (ör. offline + cache miss) tekrar denenebilsin
  p.catch(() => cache.delete(packId));
  return p;
}

/**
 * Tek seviyeyi id ile getirir.
 * @param {number} id
 * @returns {Promise<any|null>}
 */
export async function getLevel(id) {
  const pack = packOfLevel(id);
  if (pack == null) return null;
  const levels = await loadPack(pack);
  return levels.find((l) => l.id === id) || null;
}

/**
 * Tüm seviyeleri id sırasıyla getirir (editör ve testler için).
 * @returns {Promise<any[]>}
 */
export async function loadAllLevels() {
  const lists = await Promise.all(PACK_RANGES.map((r) => loadPack(r.pack)));
  return lists.flat().sort((a, b) => a.id - b.id);
}
