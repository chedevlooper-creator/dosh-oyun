// @ts-check
/* ================= ÇEÇEN GRAFEM İŞLEMLERİ ================= */

/** Palochka karakteri (Ӏ) */
const PAL = "Ӏ";

/** Çeçence digraflar (2 harfli tek ses) */
const DIGRAPHS = [
  "аь", "гӀ", "кх", "къ", "кӀ",
  "оь", "пӀ", "тӀ", "уь", "хь",
  "хӀ", "цӀ", "чӀ", "юь", "яь",
].map(norm);

const DSET = new Set(DIGRAPHS);

/**
 * Metni normalize et: küçük harf, palochka uniform
 * @param {string} s
 * @returns {string}
 */
function norm(s) {
  return s.toLowerCase().replace(/[Ӏӏ]|[iI]/g, PAL).trim();
}

/**
 * Kelimeyi grafem dizisine ayır (digraflar öncelikli)
 * @param {string} word
 * @returns {string[]}
 */
function splitG(word) {
  const w = norm(word);
  const out = [];
  for (let i = 0; i < w.length; ) {
    const two = w.slice(i, i + 2);
    if (i + 1 < w.length && DSET.has(two)) { out.push(two); i += 2; }
    else { out.push(w[i]); i += 1; }
  }
  return out;
}

/**
 * Görsel gösterim: büyük harf, palochka → I
 * @param {string} g
 * @returns {string}
 */
function dispG(g) {
  return g.toUpperCase().replace(/[Ӏӏ]/g, "I");
}

export { PAL, DIGRAPHS, DSET, norm, splitG, dispG };
