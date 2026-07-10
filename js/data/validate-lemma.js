// @ts-check
/* ================= LEMMA VALIDATION (shared) =================
 * Pure validation logic — no Node.js dependencies.
 * Single source of truth for both:
 *   - scripts/validate-lemmas.mjs (CLI, imports from here)
 *   - js/__tests__/validate-lemmas.test.js (tests, imports from here)
 */

/** Kara liste: bilinen kirli/yanlış kelimeler. */
const BLACKLIST = new Set(["канза", "паккха", "иэс"]);

/** Çok kısa veya Çok uzun kelimeleri ele. */
function isLengthOk(lemma) {
  return lemma.length >= 2 && lemma.length <= 30;
}

/** Chechen alfabesinde olmayan karakterler içeren kelimeleri ele. */
function isChechenScript(lemma) {
  // Kiril + Chechen (Ӏ, ӏ) + boşluk/tire (scripts/validate-lemmas.mjs ile aynı)
  return /^[а-яёА-ЯЁӀӏ\-' ]+$/.test(lemma);
}

/** Tekrarlayan karakterler: "аааа", "----" gibi. */
function hasRepeatedChars(lemma) {
  return /(.)\1{3,}/.test(lemma);
}

/** Sadece tire/boşluk'tan oluşan kelimeler. */
function isMeaningful(lemma) {
  return /[а-яёА-ЯЁӀӏ]/.test(lemma);
}

/**
 * Tek bir lemma için validasyon sonucu.
 * @param {{ lemma?: string, hash?: string, pos?: string }} l
 * @returns {{ ok: boolean, reason?: string }}
 */
export function validateLemma(l) {
  if (!l || typeof l.lemma !== "string") return { ok: false, reason: "no_lemma" };
  const w = l.lemma;
  if (BLACKLIST.has(w)) return { ok: false, reason: "blacklist" };
  if (!isLengthOk(w)) return { ok: false, reason: "bad_length" };
  if (!isChechenScript(w)) return { ok: false, reason: "non_chechen_script" };
  if (hasRepeatedChars(w)) return { ok: false, reason: "repeated_chars" };
  if (!isMeaningful(w)) return { ok: false, reason: "not_meaningful" };
  return { ok: true };
}
