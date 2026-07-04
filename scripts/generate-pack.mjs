/* ================= PACK ÜRETECİ =================
 * Yeni seviye paketi üretir: node scripts/generate-pack.mjs <packNo>
 *
 * İçerik politikası (README "İçerik kuralları" + CLAUDE.md):
 * - ANA kelimeler yalnızca INFO'da doğrulanmış anlamı olanlardan seçilir
 *   (seviye sonu öğrenme özeti + coverage testleri korunur).
 * - BONUS kelimeler önce INFO'lu/oyunda-var olanlardan; Wiktionary aday
 *   listesinden (docs/yeni-kelimeler-2026.md) eklenenler, toplam INFO
 *   kapsamını %16'nın altına düşürmeyecek bütçeyle sınırlanır.
 * - Anlam (gloss) ASLA üretilmez; adaylar sadece bulmaca kelimesi olur.
 *
 * Deterministiktir (sabit seed) — aynı girdiyle aynı paket çıkar. */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { norm, splitG } from "../js/engine/grapheme.js";
import { INFO } from "../js/data/info.js";

const PACK = parseInt(process.argv[2] || "5", 10);
const LEVELS_PER_PACK = 25;
const SEED = 20260704 + PACK;

/* ---------- deterministik RNG ---------- */
let _s = SEED;
function rnd() {
  _s |= 0; _s = (_s + 0x6D2B79F5) | 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (arr) => arr[(rnd() * arr.length) | 0];
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------- mevcut veri ---------- */
const levelsDir = new URL("../js/data/levels/", import.meta.url);
const existing = readdirSync(levelsDir)
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => JSON.parse(readFileSync(new URL(f, levelsDir), "utf8")));
const firstId = Math.max(...existing.map((l) => l.id)) + 1;

const existingVocab = new Set();
for (const lv of existing) {
  for (const w of lv.words) existingVocab.add(splitG(w.word).join(""));
  for (const b of lv.bonus || []) existingVocab.add(splitG(b).join(""));
}

/* Wiktionary aday listesi (yalnızca kelime sütunu; "tahmini" anlamlar yok sayılır) */
const candFile = new URL("../docs/yeni-kelimeler-2026.md", import.meta.url);
let candidates = [];
try {
  const md = readFileSync(candFile, "utf8");
  candidates = [...md.matchAll(/^\|\s*\d+\s*\|\s*([а-яёӀӏА-ЯЁa-zA-Z]+)\s*\|/gmu)]
    .map((m) => splitG(m[1]).join(""))
    .filter((w) => {
      const g = splitG(w);
      return g.length >= 2 && g.length <= 6;
    });
} catch { /* aday dosyası yoksa yalnızca mevcut söz varlığı kullanılır */ }

const infoKeys = new Set(Object.keys(INFO).map((w) => splitG(w).join("")));

/* ---------- multiset yardımcıları ---------- */
const countsOf = (gs) => { const m = {}; for (const g of gs) m[g] = (m[g] || 0) + 1; return m; };
const fitsPool = (gs, pool) => {
  const c = countsOf(gs);
  return Object.entries(c).every(([g, n]) => (pool[g] || 0) >= n);
};
const unionMax = (a, b) => {
  const m = { ...a };
  for (const [g, n] of Object.entries(b)) m[g] = Math.max(m[g] || 0, n);
  return m;
};
const poolSize = (pool) => Object.values(pool).reduce((x, y) => x + y, 0);

/* ---------- kelime havuzları ---------- */
const mains = [...infoKeys]
  .map((w) => ({ w, g: splitG(w) }))
  .filter((x) => x.g.length >= 3 && x.g.length <= 6);
const bonusVocab = [...new Set([...existingVocab, ...infoKeys, ...candidates])]
  .map((w) => ({ w, g: splitG(w) }))
  .filter((x) => x.g.length >= 2 && x.g.length <= 6);

/* ---------- crossword yerleşimi ---------- */
function tryLayout(words) {
  // words: [{w,g}]; ilk kelime yatay, ikincisi onu kesen dikey, üçüncüsü fırsatçı
  const [W1, W2, W3] = words;
  const crosses = [];
  for (let i = 0; i < W1.g.length; i++)
    for (let j = 0; j < W2.g.length; j++)
      if (W1.g[i] === W2.g[j]) crosses.push([i, j]);
  if (!crosses.length) return null;
  const [i, j] = pick(crosses);

  const map = new Map();
  const put = (gs, r0, c0, dir) => {
    for (let k = 0; k < gs.length; k++) {
      const r = r0 + (dir === "down" ? k : 0);
      const c = c0 + (dir === "across" ? k : 0);
      if (r < 0 || c < 0) return false;
      const key = r + "," + c;
      if (map.has(key) && map.get(key) !== gs[k]) return false;
      map.set(key, gs[k]);
    }
    return true;
  };

  const placed = [];
  if (!put(W1.g, j, 0, "across")) return null;
  placed.push({ word: W1.w, row: j, col: 0, dir: "across" });
  if (!put(W2.g, 0, i, "down")) return null;
  placed.push({ word: W2.w, row: 0, col: i, dir: "down" });

  if (W3) {
    let done = false;
    // W1'i başka bir sütunda dikey kes
    for (let k = 0; k < W1.g.length && !done; k++) {
      if (k === i) continue;
      for (let m = 0; m < W3.g.length && !done; m++) {
        if (W1.g[k] !== W3.g[m] || j - m < 0) continue;
        const snap = new Map(map);
        if (put(W3.g, j - m, k, "down")) {
          placed.push({ word: W3.w, row: j - m, col: k, dir: "down" });
          done = true;
        } else { map.clear(); for (const [key, v] of snap) map.set(key, v); }
      }
    }
    // olmadıysa W2'yi başka bir satırda yatay kes
    for (let r = 0; r < W2.g.length && !done; r++) {
      if (r === j) continue;
      for (let m = 0; m < W3.g.length && !done; m++) {
        if (W2.g[r] !== W3.g[m] || i - m < 0) continue;
        const snap = new Map(map);
        if (put(W3.g, r, i - m, "across")) {
          placed.push({ word: W3.w, row: r, col: i - m, dir: "across" });
          done = true;
        } else { map.clear(); for (const [key, v] of snap) map.set(key, v); }
      }
    }
    if (!done) return null;
  }
  return placed;
}

/* ---------- seviye üretimi ---------- */
const usedMain = new Set();
const levels = [];
let guard = 0;

while (levels.length < LEVELS_PER_PACK && guard++ < 20000) {
  const W1 = pick(mains);
  if (!W1 || usedMain.has(W1.w) || W1.g.length < 4) continue;

  const c1 = countsOf(W1.g);
  const partners = mains.filter((x) => {
    if (x.w === W1.w || usedMain.has(x.w)) return false;
    if (!x.g.some((g) => W1.g.includes(g))) return false;
    const u = unionMax(c1, countsOf(x.g));
    return poolSize(u) - poolSize(c1) <= 2 && poolSize(u) <= 8;
  });
  if (!partners.length) continue;
  const W2 = pick(partners);

  let pool = unionMax(c1, countsOf(W2.g));
  let chosen = [W1, W2];

  if (rnd() < 0.55) {
    const thirds = mains.filter((x) =>
      x.w !== W1.w && x.w !== W2.w && !usedMain.has(x.w) &&
      x.g.length >= 3 && fitsPool(x.g, pool));
    if (thirds.length) chosen = [W1, W2, pick(thirds)];
  }

  const placed = tryLayout(chosen);
  if (!placed) continue;

  const mainSet = new Set(chosen.map((x) => x.w));
  const bonus = shuffle(bonusVocab.filter((x) => !mainSet.has(x.w) && fitsPool(x.g, pool)))
    .sort((a, b) => {
      const ka = infoKeys.has(a.w) ? 0 : existingVocab.has(a.w) ? 1 : 2;
      const kb = infoKeys.has(b.w) ? 0 : existingVocab.has(b.w) ? 1 : 2;
      return ka - kb;
    })
    .slice(0, 4)
    .map((x) => x.w);

  const letters = shuffle(Object.entries(pool).flatMap(([g, n]) => Array(n).fill(g)));

  chosen.forEach((x) => usedMain.add(x.w));
  levels.push({ id: firstId + levels.length, letters, words: placed, bonus, pack: PACK });
}

if (levels.length < LEVELS_PER_PACK) {
  console.error(`Yalnızca ${levels.length} seviye üretilebildi; söz varlığı yetersiz.`);
  process.exit(1);
}

/* ---------- kapsam bütçesi: toplam INFO oranı %16 altına inmesin ---------- */
function coverage() {
  const all = new Set(existingVocab);
  for (const lv of levels) {
    for (const w of lv.words) all.add(splitG(w.word).join(""));
    for (const b of lv.bonus) all.add(b);
  }
  const covered = [...all].filter((w) => infoKeys.has(w)).length;
  return { covered, total: all.size, ratio: covered / all.size };
}
// Hedef: mevcut taban oranını düşürme (test tabanı %15'in üstünde,
// %15.25 mutlak alt sınırla). Aday kaynaklı bonusları gerekirse kırp.
const baseCovered = [...existingVocab].filter((w) => infoKeys.has(w)).length;
const target = Math.max(0.1525, baseCovered / existingVocab.size - 0.002);
for (const lv of levels) {
  if (coverage().ratio >= target) break;
  lv.bonus = lv.bonus.filter((b) => infoKeys.has(b) || existingVocab.has(b));
}
const cov = coverage();
console.log(`INFO kapsamı: ${cov.covered}/${cov.total} (${(cov.ratio * 100).toFixed(1)}%) · hedef ≥${(target * 100).toFixed(2)}%`);
if (cov.ratio < 0.1525) {
  console.error("Kapsam %15.25 güvenlik sınırının altında; aday bonus sayısını azaltın.");
  process.exit(1);
}

/* ---------- yaz ---------- */
const outFile = new URL(`../js/data/levels/pack-${PACK}.json`, import.meta.url);
writeFileSync(outFile, JSON.stringify(levels) + "\n");
const from = levels[0].id, to = levels[levels.length - 1].id;
console.log(`pack-${PACK}.json: ${levels.length} seviye (id ${from}-${to})`);
console.log(`level-index.js'e ekle: { pack: ${PACK}, from: ${from}, to: ${to} } · LEVEL_COUNT=${to + 1} · LAST_LEVEL_ID=${to}`);
