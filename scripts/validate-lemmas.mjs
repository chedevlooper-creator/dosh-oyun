#!/usr/bin/env node
/* ================= LEMMA VALIDATION =================
 * Wiktionary'den gelen lemmaları heuristik kalite kontrolünden geçirir.
 * Kirli / yanlış / düşük kaliteli olanları eler.
 *
 * Çıktı: scripts/cache/lemmas-validated.json */

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IN_FILE = join(__dirname, "cache", "lemmas-raw.json");
const OUT_FILE = join(__dirname, "cache", "lemmas-validated.json");
const SKIP_FILE = join(__dirname, "cache", "lemmas-skipped.json");

/** @typedef {{ lemma: string, hash: string, source: string, pos: string, fetched_at: string }} Lemma */

/** Kara liste: bilinen kirli/yanlış kelimeler. */
const BLACKLIST = new Set([
  "канза",
  "паккха", // birden fazla anlam, bağlama göre değişir
  "иэс", // çok genel
]);

/** Çok kısa veya Çok uzun kelimeleri ele. */
function isLengthOk(lemma) {
  return lemma.length >= 2 && lemma.length <= 30;
}

/** Chechen alfabesinde olmayan karakterler içeren kelimeleri ele. */
function isChechenScript(lemma) {
  // Kiril + Chechen (Ӏ, ӏ) + boşluk/tire
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
 * @param {Lemma} l
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

/** @param {string} f */
async function fileExists(f) {
  try { await access(f); return true; } catch { return false; }
}

async function main() {
  if (!(await fileExists(IN_FILE))) {
    console.error(`[validate-lemmas] ${IN_FILE} bulunamadı. Önce fetch-wiktionary çalıştırın.`);
    process.exit(1);
  }

  const raw = JSON.parse(await readFile(IN_FILE, "utf-8"));
  /** @type {Lemma[]} */
  const lemmas = Array.isArray(raw) ? raw : [];
  const validated = [];
  const skipped = [];
  for (const l of lemmas) {
    const r = validateLemma(l);
    if (r.ok) validated.push(l);
    else skipped.push({ ...l, skip_reason: r.reason });
  }

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(validated, null, 2), "utf-8");
  await writeFile(SKIP_FILE, JSON.stringify(skipped, null, 2), "utf-8");
  console.log(`[validate-lemmas] ${validated.length} geçerli, ${skipped.length} elenen`);
  console.log(`  → ${OUT_FILE}`);
  console.log(`  → ${SKIP_FILE}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("[validate-lemmas] fatal:", e);
    process.exit(1);
  });
}
