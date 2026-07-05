// @ts-check
/* ================= SÖZLÜK ŞEMA MIGRATION =================
 * Eski şema: { ce, tr } sadece
 * Yeni şema: { ce, tr, ru, ipa, examples[], etymology, tags[], source, ... }
 *
 * Backward-compatible: mevcut {ce, tr} kayıtları yeni şemayla
 * birleştirilir; eksik alanlar boş string/array döner. */

import { INFO } from "./info.js";

/**
 * Bir kelime kaydını normalize eder (eski şemayı yeni şemaya migrate eder).
 * @param {any} raw
 * @returns {{
 *   ce: string, tr: string, ru: string,
 *   ipa: string,
 *   examples: string[],
 *   etymology: string,
 *   tags: string[],
 *   source: string,
 * }}
 */
export function migrateEntry(raw) {
  if (!raw || typeof raw !== "object") {
    return blankEntry();
  }
  return {
    ce: typeof raw.ce === "string" ? raw.ce : "",
    tr: typeof raw.tr === "string" ? raw.tr : "",
    ru: typeof raw.ru === "string" ? raw.ru : "",
    ipa: typeof raw.ipa === "string" ? raw.ipa : "",
    examples: Array.isArray(raw.examples) ? raw.examples.filter((x) => typeof x === "string") : [],
    etymology: typeof raw.etymology === "string" ? raw.etymology : "",
    tags: Array.isArray(raw.tags) ? raw.tags.filter((x) => typeof x === "string") : [],
    source: typeof raw.source === "string" ? raw.source : "wiktionary",
  };
}

function blankEntry() {
  return {
    ce: "", tr: "", ru: "",
    ipa: "", examples: [], etymology: "", tags: [],
    source: "wiktionary",
  };
}

/** Bilinen tüm kelimeleri migrate edilmiş hâlde döndürür. */
export function getAllMigrated() {
  const out = {};
  for (const [lemma, raw] of Object.entries(INFO)) {
    out[lemma] = migrateEntry(raw);
  }
  return out;
}

/**
 * Sözlükten belirli bir lemma'nın migrate edilmiş kaydını al.
 * @param {string} lemma
 */
export function getMigrated(lemma) {
  return migrateEntry(INFO[lemma]);
}

/** Bilinen tag listesi (topluluk sınıflandırması için referans). */
export const KNOWN_TAGS = [
  "nature",      // doğa (dağ, nehir, ağaç)
  "family",      // aile
  "food",        // yiyecek
  "animal",      // hayvan
  "body",        // vücut
  "home",        // ev
  "time",        // zaman
  "emotion",     // duygu
  "abstract",    // soyut kavram
  "action",      // eylem/fiil
  "object",      // nesne
  "weather",     // hava durumu
  "color",       // renk
  "number",      // sayı
  "greeting",    // selamlama
  "language",    // dil/dilbilgisi
];
