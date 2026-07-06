#!/usr/bin/env node
/* ================= WIKTIONARY GLOSS FETCH =================
 * ru.wiktionary.org API'sinden Çeçence kelimelerin anlamlarını çeker.
 * Her lemma için action=parse API'si ile sayfa içeriğini alır,
 * HTML'den Çeçence ve Rusça anlamları ayıklar.
 *
 * Çıktı: scripts/cache/glosses.json
 *
 * Kullanım:
 *   node scripts/fetch-glosses.mjs                  # tüm lemmalar
 *   node scripts/fetch-glosses.mjs --dry-run        # sadece test
 *   node scripts/fetch-glosses.mjs --limit=10       # ilk 10 lemma
 *   node scripts/fetch-glosses.mjs --resume         # kaldığı yerden devam
 *
 * Rate limit: 1 req/sec */

import { createHash } from "node:crypto";
import { writeFile, readFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, "cache");
const GLOSSES_FILE = join(CACHE_DIR, "glosses.json");
const PROGRESS_FILE = join(CACHE_DIR, "glosses-progress.json");
const LEMMAS_FILE = join(CACHE_DIR, "lemmas-validated.json");

const API = "https://ru.wiktionary.org/w/api.php";
const UA = "Dosh-Content-Bot/1.0 (https://github.com/chedevlooper-creator/dosh-oyun; contact: che.devlooper@gmail.com)";

const CATEGORIES = [
  "Категория:Чеченские_существительные",
  "Категория:Чеченские_глаголы",
  "Категория:Чеченские_прилагательные",
];

/** @param {number} ms */
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Ham başlıkları temizle. */
function cleanTitle(t) {
  if (!t || t.length < 2) return null;
  if (!/[а-яёА-ЯЁӀӏ]/.test(t)) return null;
  return t.trim();
}

/**
 * API'den bir kategorinin üyelerini çek.
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

  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${category}`);
  const data = await res.json();
  return (data?.query?.categorymembers || []).map((m) => m.title);
}

/**
 * Bir lemma sayfasının parse edilmiş HTML'ini çek.
 * @param {string} lemma
 * @returns {Promise<string|null>}
 */
async function fetchPageText(lemma) {
  const url = new URL(API);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", lemma);
  url.searchParams.set("prop", "text");
  url.searchParams.set("format", "json");
  url.searchParams.set("disabletoc", "1");

  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.error) return null;
  return data?.parse?.text?.["*"] || null;
}

/**
 * Sayfanın Çeçence dil sayfası olup olmadığını kontrol et.
 * ru.wiktionary.org'da Çeçence sayfaları genelde şu başlığı içerir:
 *   <span class="mw-headline" id="Чеченский">Чеченский</span>
 * veya:
 *   <h2><span id="Чеченский">Чеченский</span></h2>
 */
function isChechenPage(html) {
  return /id="Чеченский"/.test(html)
    || /id="Нохчийн"/.test(html)
    || />Чеченский</.test(html);
}

/**
 * HTML'den Çeçence ve Rusça anlamları çıkar.
 * ru.wiktionary.org'da Çeçence sayfaları şu yapıdadır:
 *   <h2><span id="Чеченский">Чеченский</span></h2>
 *   <p><b>kelime</b> — anlam1, anlam2</p>
 *   <p>Значение: ...</p>
 *
 * @param {string} html
 * @param {string} lemma
 * @returns {{ gloss_ce: string, gloss_tr: string } | null}
 */
function parseGlossFromHtml(html, lemma) {
  if (!html) return null;

  // Sadece Çeçence sayfalarını işle
  if (!isChechenPage(html)) return null;

  // HTML entity'leri decode et
  const decoded = html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

  // "Чеченский" başlığından sonraki içeriği al
  const chechenSection = decoded.match(/id="Чеченский"[\s\S]*?(?=<h2[^>]*>|$)/i);
  const targetHtml = chechenSection ? chechenSection[0] : decoded;

  const plainText = targetHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  let gloss_ce = "";
  let gloss_tr = "";

  // Çeçence anlam: <b>lemma</b> — <i>transliterasyon</i> hemen ardından gelen metin
  // Pattern: lemma'dan sonra gelen ilk anlamlı cümle
  const afterLemma = plainText.slice(plainText.indexOf(lemma) + lemma.length);
  if (afterLemma) {
    // İlk 200 karakteri al, noktalama ve referansları temizle
    const cleaned = afterLemma
      .replace(/[―—–•·◆✓✔✗✘●○]/g, "")
      .replace(/\[[^\]]*\]/g, "")
      .replace(/\{[^}]*\}/g, "")
      .replace(/Отсутствует пример употребления[^.]*\.?/g, "")
      .replace(/см\. рекомендации\.?/g, "")
      .replace(/Синонимы\s*Антонимы\s*Гиперонимы\s*Гипонимы\s*Родственные слова\s*Ближайшее родство[^]*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length > 3 && cleaned.length < 500) {
      gloss_ce = cleaned;
    }
  }

  // Rusça/Türkçe anlam: Значение bölümünü ara
  const znachMatch = plainText.match(/Значение[:\s]+([^]+?)(?=[А-ЯЁ][а-яё]+[:]|$)/i);
  if (znachMatch) {
    gloss_tr = znachMatch[1]
      .replace(/\[[^\]]*\]/g, "")
      .replace(/\{[^}]*\}/g, "")
      .replace(/Отсутствует пример употребления[^.]*\.?/g, "")
      .replace(/см\. рекомендации\.?/g, "")
      .replace(/Синонимы\s*Антонимы.*$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
  }

  // gloss_ce çok uzunsa veya anlamsızsa kısalt
  if (gloss_ce.length > 300) {
    gloss_ce = gloss_ce.slice(0, 300);
  }

  if (!gloss_ce && !gloss_tr) return null;
  return { gloss_ce, gloss_tr };
}

/**
 * Tüm lemmaları topla (kategorilerden).
 * @returns {Promise<string[]>}
 */
async function collectLemmas() {
  // Önce cache'lenmiş listeyi dene
  try {
    const raw = await readFile(LEMMAS_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length) {
      console.log(`[fetch-glosses] ${data.length} lemma cache'ten okundu`);
      return data.map((l) => (typeof l === "string" ? l : l.lemma)).filter(Boolean);
    }
  } catch { /* cache yok, API'den çek */ }

  console.log("[fetch-glosses] API'den lemma listesi çekiliyor...");
  const seen = new Set();
  for (const cat of CATEGORIES) {
    process.stdout.write(`  → ${cat.split(":").pop()} ... `);
    try {
      const titles = await fetchCategoryMembers(cat);
      let count = 0;
      for (const t of titles) {
        const cleaned = cleanTitle(t);
        if (cleaned && !seen.has(cleaned)) {
          seen.add(cleaned);
          count++;
        }
      }
      console.log(`${count} yeni`);
    } catch (e) {
      console.log(`HATA: ${e.message}`);
    }
    await sleep(1100);
  }

  const list = [...seen];
  // Cache'le
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(LEMMAS_FILE, JSON.stringify(list, null, 2), "utf-8");
  console.log(`[fetch-glosses] ${list.length} lemma toplam`);
  return list;
}

/**
 * Progress dosyasından kalan lemmaları oku.
 * @returns {Promise<{ done: Set<string>, results: Array<object> }>}
 */
async function loadProgress() {
  try {
    const raw = await readFile(PROGRESS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return {
      done: new Set(data.done || []),
      results: data.results || [],
    };
  } catch {
    return { done: new Set(), results: [] };
  }
}

/** Progress'i kaydet. */
async function saveProgress(done, results) {
  await writeFile(
    PROGRESS_FILE,
    JSON.stringify({ done: [...done], results }, null, 2),
    "utf-8",
  );
}

async function main() {
  const args = process.argv.slice(2);
  const isDry = args.includes("--dry-run");
  const resume = args.includes("--resume");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

  await mkdir(CACHE_DIR, { recursive: true });

  if (isDry) {
    console.log("[fetch-glosses] --dry-run: gerçek fetch yapılmayacak");
    console.log(`  GLOSSES_FILE: ${GLOSSES_FILE}`);
    console.log(`  LEMMAS_FILE: ${LEMMAS_FILE}`);
    return;
  }

  const lemmas = await collectLemmas();
  const toFetch = lemmas.slice(0, limit);

  let { done, results } = resume ? await loadProgress() : { done: new Set(), results: [] };
  const remaining = toFetch.filter((l) => !done.has(l));

  if (remaining.length === 0) {
    console.log("[fetch-glosses] Tüm lemmalar işlenmiş.");
    await writeFile(GLOSSES_FILE, JSON.stringify(results, null, 2), "utf-8");
    return;
  }

  console.log(`[fetch-glosses] ${remaining.length} lemma işlenecek...`);

  for (let i = 0; i < remaining.length; i++) {
    const lemma = remaining[i];
    const pct = ((i / remaining.length) * 100).toFixed(0);
    process.stdout.write(`  [${pct}%] ${lemma.padEnd(20)} `);

    try {
      const html = await fetchPageText(lemma);
      if (html) {
        const gloss = parseGlossFromHtml(html, lemma);
        if (gloss && (gloss.gloss_ce || gloss.gloss_tr)) {
          results.push({ lemma, ...gloss });
          console.log("✓");
        } else {
          console.log("✗ (anlam bulunamadı)");
        }
      } else {
        console.log("✗ (sayfa yok)");
      }
    } catch (e) {
      console.log(`✗ (${e.message})`);
    }

    done.add(lemma);

    // Her 10 lemmada bir progress kaydet
    if ((i + 1) % 10 === 0) {
      await saveProgress(done, results);
    }

    await sleep(1100);
  }

  // Son durumu kaydet
  await saveProgress(done, results);
  await writeFile(GLOSSES_FILE, JSON.stringify(results, null, 2), "utf-8");

  console.log(`[fetch-glosses] Tamamlandı: ${results.length} anlamlı kelime`);
  console.log(`  Çıktı: ${GLOSSES_FILE}`);
}

main().catch((e) => {
  console.error("[fetch-glosses] fatal:", e);
  process.exit(1);
});
