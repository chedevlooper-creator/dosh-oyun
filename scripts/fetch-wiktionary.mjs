#!/usr/bin/env node
/* ================= WIKTIONARY FETCH =================
 * ru.wiktionary.org API'sinden Chechen lemmaları çeker, normalize eder,
 * JSON olarak yazar. CI'da --dry-run ile test edilir (gerçek fetch yapmaz).
 *
 * Çıktı: scripts/cache/lemmas-raw.json
 * Idempotent: SHA-256 hash ile duplicate kontrolü.
 *
 * Rate limit: 1 req/sec (User-Agent tanımlı)
 * Endpoint: https://ru.wiktionary.org/w/api.php */

import { createHash } from "node:crypto";
import { writeFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, "cache");
const OUT_FILE = join(CACHE_DIR, "lemmas-raw.json");
const HASH_FILE = join(CACHE_DIR, "lemmas.hash");

const API = "https://ru.wiktionary.org/w/api.php";
const UA = "Dosh-Content-Bot/1.0 (https://github.com/chedevlooper-creator/dosh-oyun; contact: che.devlooper@gmail.com)";

/** @type {string[]} */
const CATEGORIES = [
  "Категория:Чеченские_существительные",
  "Категория:Чеченские_глаголы",
  "Категория:Чеченские_прилагательные",
];

/** Çıktı obje tipi */
const fetchOpts = {
  headers: { "User-Agent": UA },
  // eslint-disable-next-line node/no-unsupported-features/node-builtins
  signal: AbortSignal.timeout(10_000),
};

/**
 * Bir kategorinin üyelerini çek.
 * @param {string} category
 * @param {number} [limit=500]
 * @returns {Promise<string[]>}
 */
async function fetchCategoryMembers(category, limit = 500) {
  const url = new URL(API);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "categorymembers");
  url.searchParams.set("cmtitle", category);
  url.searchParams.set("cmlimit", String(limit));
  url.searchParams.set("format", "json");

  const res = await fetch(url, fetchOpts);
  if (!res.ok) {
    throw new Error(`Wiktionary HTTP ${res.status}: ${category}`);
  }
  /** @type {{ query?: { categorymembers?: { title: string }[] } }} */
  const data = await res.json();
  return (data?.query?.categorymembers || []).map((m) => m.title);
}

/** Rate limit: 1 req/sec */
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Ham başlıkları temizle (filtre, normalizasyon). */
function cleanTitle(t) {
  if (!t) return null;
  // Çok kısa, sadece noktalama veya sayı olanları atla
  if (t.length < 2) return null;
  if (!/[а-яёА-ЯЁӀӀ]/.test(t)) return null; // Kiril/Chechen harf yoksa atla
  return t.trim();
}

/**
 * Çıktı normalize: lemma + sha256.
 * @param {string[]} titles
 * @returns {Array<{ lemma: string, hash: string, source: string, pos: string, fetched_at: string }>}
 */
function normalize(titles, source) {
  const seen = new Set();
  const out = [];
  const fetchedAt = new Date().toISOString();
  for (const t of titles) {
    const lemma = cleanTitle(t);
    if (!lemma) continue;
    if (seen.has(lemma)) continue;
    seen.add(lemma);
    const hash = createHash("sha256").update(lemma).digest("hex").slice(0, 16);
    // POS tahmini: kategori adından
    const pos = source.includes("глаголы") ? "verb"
              : source.includes("прилагательные") ? "adj"
              : "noun";
    out.push({ lemma, hash, source, pos, fetched_at: fetchedAt });
  }
  return out;
}

/** Mevcut hash'i oku (değişmemişse skip için). */
async function readPrevHash() {
  try { return (await import("node:fs/promises")).readFile(HASH_FILE, "utf-8"); }
  catch { return ""; }
}

/** @param {string} h */
async function writeHash(h) {
  await writeFile(HASH_FILE, h, "utf-8");
}

/** @param {string} f */
async function fileExists(f) {
  try { await access(f); return true; } catch { return false; }
}

async function main() {
  const isDry = process.argv.includes("--dry-run");
  if (isDry) {
    console.log("[fetch-wiktionary] --dry-run: gerçek fetch yapılmayacak");
    console.log(`  CACHE_DIR: ${CACHE_DIR}`);
    console.log(`  OUT_FILE: ${OUT_FILE}`);
    console.log(`  CATEGORIES: ${CATEGORIES.length}`);
    return;
  }

  await mkdir(CACHE_DIR, { recursive: true });

  /** @type {Array<{ lemma: string, hash: string, source: string, pos: string, fetched_at: string }>} */
  const all = [];
  for (const cat of CATEGORIES) {
    process.stdout.write(`  → ${cat} ... `);
    try {
      const titles = await fetchCategoryMembers(cat);
      const normalized = normalize(titles, cat);
      all.push(...normalized);
      console.log(`${normalized.length} lemma`);
    } catch (e) {
      console.log(`HATA: ${e.message}`);
    }
    await sleep(1100); // 1 req/sec + buffer
  }

  const prev = await readPrevHash();
  const newHash = createHash("sha256")
    .update(JSON.stringify(all))
    .digest("hex")
    .slice(0, 16);
  if (prev === newHash) {
    console.log(`[fetch-wiktionary] hash değişmedi (${newHash}), skip`);
    return;
  }

  await writeFile(OUT_FILE, JSON.stringify(all, null, 2), "utf-8");
  await writeHash(newHash);
  console.log(`[fetch-wiktionary] yazıldı: ${OUT_FILE} (${all.length} lemma, hash=${newHash})`);
}

main().catch((e) => {
  console.error("[fetch-wiktionary] fatal:", e);
  process.exit(1);
});
