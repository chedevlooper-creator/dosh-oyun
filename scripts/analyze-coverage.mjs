import { readFileSync, readdirSync } from "node:fs";
import { INFO } from "../js/data/info.js";

// Seviye verisi pack JSON'larında yaşar (js/data/levels/); plain node'da
// import.meta.glob olmadığından doğrudan dosyadan okunur.
const levelsDir = new URL("../js/data/levels/", import.meta.url);
const LEVELS = readdirSync(levelsDir)
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => JSON.parse(readFileSync(new URL(f, levelsDir), "utf8")))
  .sort((a, b) => a.id - b.id);

// Ana kelimeler (tekrarsız, normalize edilmiş)
const mainWords = new Set();
const bonusWords = new Set();

for (const lv of LEVELS) {
  for (const w of lv.words) {
    mainWords.add(w.word);
  }
  if (lv.bonus) {
    for (const b of lv.bonus) {
      bonusWords.add(b);
    }
  }
}

// Mevcut INFO anahtarları
const infoKeys = new Set(Object.keys(INFO));

let covered = 0, missing = [];
for (const w of mainWords) {
  if (infoKeys.has(w)) covered++;
  else missing.push(w);
}

const total = mainWords.size;
const pct = ((covered / total) * 100).toFixed(1);

console.log(`Toplam ana kelime: ${total}`);
console.log(`Coverage: ${covered}/${total} (${pct}%)`);
console.log(`\nEksik ana kelimeler (${missing.length}):`);
for (const w of missing.sort()) {
  console.log(`  "${w}": { ce: "", tr: "" },`);
}

// Bonus coverage
let bonusCovered = 0, bonusMissing = [];
for (const w of bonusWords) {
  if (infoKeys.has(w)) bonusCovered++;
  else bonusMissing.push(w);
}
const bonusTotal = bonusWords.size;
const bonusPct = ((bonusCovered / bonusTotal) * 100).toFixed(1);
console.log(`\nToplam bonus kelime: ${bonusTotal}`);
console.log(`Bonus coverage: ${bonusCovered}/${bonusTotal} (${bonusPct}%)`);
console.log(`\nEksik bonus kelimeler (${bonusMissing.length}):`);
for (const w of bonusMissing.sort()) {
  console.log(`  "${w}": { ce: "", tr: "" },`);
}
