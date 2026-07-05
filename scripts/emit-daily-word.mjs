#!/usr/bin/env node
/* ================= DAILY WORD EMITTER =================
 * Her gün yeni bir Chechen kelimesini `js/data/next.json`'a yazar.
 * Üretim oyunu açıldığında bu kelimeyi "Bugünün kelimesi" olarak gösterir.
 *
 * Kullanım:
 *   node scripts/emit-daily-word.mjs
 *   (veya CI'da her gün UTC 00:00'da) */

import { readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const SELF_DIR = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(SELF_DIR, "..", "js", "data");
const OUT_FILE = join(DATA_DIR, "next.json");
const SOURCE_FILE = join(SELF_DIR, "cache", "lemmas-validated.json");

/** @param {string} f */
async function fileExists(f) {
  try { await access(f); return true; } catch { return false; }
}

/** ISO tarihten deterministik bir sayı üret (gün başına sabit). */
function daySeed() {
  const d = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return parseInt(createHash("sha256").update(d).digest("hex").slice(0, 8), 16);
}

async function main() {
  if (!(await fileExists(SOURCE_FILE))) {
    console.error(`[emit-daily-word] ${SOURCE_FILE} bulunamadı. Önce validate-lemmas çalıştırın.`);
    process.exit(1);
  }
  const validated = JSON.parse(await readFile(SOURCE_FILE, "utf-8"));
  if (!Array.isArray(validated) || !validated.length) {
    console.error(`[emit-daily-word] validate-lemmas çıktısı boş.`);
    process.exit(1);
  }
  const seed = daySeed();
  const idx = seed % validated.length;
  const pick = validated[idx];

  const next = {
    lemma: pick.lemma,
    hash: pick.hash,
    pos: pick.pos,
    date: new Date().toISOString().slice(0, 10),
    source: "wiktionary",
  };
  await writeFile(OUT_FILE, JSON.stringify(next, null, 2), "utf-8");
  console.log(`[emit-daily-word] ${next.date}: ${next.lemma} (${next.pos}) → ${OUT_FILE}`);
}

main().catch((e) => {
  console.error("[emit-daily-word] fatal:", e);
  process.exit(1);
});
