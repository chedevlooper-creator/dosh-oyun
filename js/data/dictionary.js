// @ts-check
/* ================= ÇEÇENCE SÖZLÜK KATALOĞU =================
 * Tüm kelimeler için tek doğruluk kaynağı. Oyunun kendi içinden (S.dict)
 * VE tüm genel Çeçence sözlüğünden (INFO + Wiktionary) beslenir.
 *
 * "Eser" vizyonu: oyun, kelime öğrenmenin tek yolu değil — bu modül,
 * Çeçence'nin dijital ansiklopedisinin temelini oluşturur. Oyun buna
 * katkı sağlayan (S.dict'i büyüten) bir kanal, diğer kanallar
 * (topluluk katkısı, wiktionary fetch) da aynı kanalı besler.
 *
 * Public API:
 *   search(q, opts?)            — filtreleme, sıralama
 *   get(lemma)                  — tek kelime detayı
 *   list(opts?)                — tüm liste
 *   stats()                    — istatistikler (toplam/çözülmüş/eksik)
 *   addFound(lemma)            — S.dict'e ekle
 *   exportJSON() / exportCSV() — açık veri
 */

import { INFO } from "./info.js";
import { getMigrated } from "./dict-migration.js";
import { S } from "../engine/store.js";
import { norm } from "../engine/grapheme.js";

/** @typedef {Object} DictEntry
 *  @property {string} lemma
 *  @property {{ ce?: string, tr?: string, ru?: string, [k:string]: string|undefined }} gloss
 *  @property {string} [ipa]   - IPA telaffuz (Chechen native veya ru proxy)
 *  @property {string[]} [examples] - örnek cümleler
 *  @property {string} [etymology] - etimoloji notu
 *  @property {string[]} [tags] - semantik kategori (nature, family, vb.)
 *  @property {string} [source] - kaynak (wiktionary, native, vb.)
 *  @property {boolean} found - oyunda çözüldü mü
 *  @property {number} [addedAt] - S.dict'e eklenme timestamp
 */

/**
 * Bir kelimenin zenginleştirilmiş kaydını döndürür.
 * @param {string} lemma
 * @returns {DictEntry}
 */
export function get(lemma) {
  const l = norm(lemma);
  const m = getMigrated(l);
  const found = !!S.dict?.[l];
  return {
    lemma: l,
    gloss: {
      ce: m.ce,
      tr: m.tr,
      ru: m.ru,
    },
    ipa: m.ipa,
    examples: m.examples,
    etymology: m.etymology,
    tags: m.tags,
    source: m.source,
    found,
    addedAt: S.dict?.[l] || undefined,
  };
}

/** @returns {DictEntry[]} tüm kelimeler */
export function list() {
  return Object.keys(INFO).map(get);
}

/**
 * Arama + filtreleme + sıralama.
 * @param {string} q - arama sorgusu (Checen, Türkçe, Rusça, IPA)
 * @param {{
 *   tags?: string[],
 *   onlyFound?: boolean,
 *   onlyMissing?: boolean,
 *   sortBy?: "lemma" | "found" | "tag",
 *   limit?: number,
 * }} [opts]
 * @returns {DictEntry[]}
 */
export function search(q, opts = {}) {
  const { tags, onlyFound, onlyMissing, sortBy = "lemma", limit } = opts;
  const needle = q ? norm(q).toLowerCase() : "";

  let results = list();
  if (needle) {
    results = results.filter((e) => {
      if (e.lemma.toLowerCase().includes(needle)) return true;
      // gloss alanlarında ara
      for (const g of Object.values(e.gloss)) {
        if (g && norm(g).toLowerCase().includes(needle)) return true;
      }
      // IPA'da ara
      if (e.ipa && e.ipa.toLowerCase().includes(needle)) return true;
      return false;
    });
  }
  if (tags?.length) {
    results = results.filter((e) => tags.some((t) => e.tags.includes(t)));
  }
  if (onlyFound) results = results.filter((e) => e.found);
  if (onlyMissing) {
    results = results.filter((e) => !e.gloss.ce && !e.gloss.tr);
  }

  if (sortBy === "lemma") {
    results.sort((a, b) => a.lemma.localeCompare(b.lemma, "ce"));
  } else if (sortBy === "found") {
    results.sort((a, b) => Number(b.found) - Number(a.found));
  } else if (sortBy === "tag") {
    results.sort((a, b) => (a.tags[0] || "zzz").localeCompare(b.tags[0] || "zzz"));
  }

  return typeof limit === "number" ? results.slice(0, limit) : results;
}

/**
 * Sözlük istatistikleri.
 * @returns {{
 *   total: number,
 *   withGloss: number,
 *   missing: number,
 *   found: number,
 *   byTag: Record<string, number>,
 * }}
 */
export function stats() {
  const all = list();
  const total = all.length;
  const withGloss = all.filter((e) => e.gloss.ce || e.gloss.tr).length;
  const missing = total - withGloss;
  const found = all.filter((e) => e.found).length;
  const byTag = {};
  for (const e of all) {
    for (const t of e.tags) byTag[t] = (byTag[t] || 0) + 1;
  }
  return { total, withGloss, missing, found, byTag };
}

/** Oyunda bir kelime çözüldüğünde çağrılır. */
export function addFound(lemma) {
  const l = norm(lemma);
  S.dict[l] = Date.now();
  return l;
}

/** JSON formatında tüm sözlüğü dışa aktar (üçüncü parti araçlar için). */
export function exportJSON() {
  return JSON.stringify(
    list().map((e) => ({
      lemma: e.lemma,
      gloss: e.gloss,
      ipa: e.ipa,
      examples: e.examples,
      etymology: e.etymology,
      tags: e.tags,
      source: e.source,
    })),
    null,
    2,
  );
}

/** CSV formatında (Excel, Google Sheets için). */
export function exportCSV() {
  const rows = [["lemma", "ce", "tr", "ru", "ipa", "tags", "etymology", "source"]];
  for (const e of list()) {
    rows.push([
      e.lemma,
      e.gloss.ce || "",
      e.gloss.tr || "",
      e.gloss.ru || "",
      e.ipa || "",
      e.tags.join(";"),
      e.etymology || "",
      e.source || "",
    ]);
  }
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

/** Mevcut tag listesi (filtre dropdown'ı için). */
export function listTags() {
  const set = new Set();
  for (const e of list()) for (const t of e.tags) set.add(t);
  return [...set].sort();
}
