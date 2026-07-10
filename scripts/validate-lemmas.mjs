#!/usr/bin/env node
/* ================= LEMMA VALIDATION =================
 * Wiktionary'den gelen lemmaları heuristik kalite kontrolünden geçirir.
 * Kirli / yanlış / düşük kaliteli olanları eler.
 *
 * Validasyon mantığı js/data/validate-lemma.js'de yaşar.
 * Bu script sadece dosya I/O ve akış yönetimi yapar.
 *
 * Çıktı: scripts/cache/lemmas-validated.json */

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* ---------- ortak validasyon modülü ---------- */
import { validateLemma } from "../js/data/validate-lemma.js";
export { validateLemma };

const __dirname = dirname(fileURLToPath(import.meta.url));
const IN_FILE = join(__dirname, "cache", "lemmas-raw.json");
const OUT_FILE = join(__dirname, "cache", "lemmas-validated.json");
const SKIP_FILE = join(__dirname, "cache", "lemmas-skipped.json");

/** @typedef {{ lemma: string, hash: string, source: string, pos: string, fetched_at: string }} Lemma */

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
