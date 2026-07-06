// @ts-check
/* ================= KELİME ZİNCİRİ =================
 * Yeni oyun modu: her kelimenin son harfi, bir sonraki kelimenin
 * ilk harfi olmalı. Sürekli büyüyen zincir, çığ gibi artan puan.
 *
 * Oynanış:
 *   1. Rastgele bir başlangıç kelimesi seçilir
 *   2. Oyuncu zincirdeki son kelimenin son harfi ile başlayan yeni
 *      bir kelime yazar
 *   3. Her doğru kelime +uzunluk * 5 coin ve +streak bonusu
 *   4. 2 kez üst üste hata yaparsa zincir biter
 *   5. Skor, en uzun zincir ve en yüksek skor S.stats'a kaydedilir
 *
 * Bu mod sınırsız oynanışa izin verir — pack seviyelerine bağlı değil. */

import { S } from "../engine/store.js";
import { CFG } from "../data/config.js";
import { norm, splitG } from "../engine/grapheme.js";

/** @typedef {{
 *   score: number,
 *   streak: number,
 *   words: string[],
 *   usedWords: Set<string>,
 *   startWord: string,
 *   lastLetter: string,
 *   errors: number,
 * }} ChainState */

/** @type {ChainState | null} */
let cs = null;

/** Tüm zincir kelimelerinin norm listesi. lazy-load edilir. */
let _wordPool = null;

/**
 * INFO'daki tüm kelimeleri ve pack bonus kelimelerini topla.
 * @returns {string[]}
 */
export function getChainWordPool() {
  if (_wordPool) return _wordPool;
  const set = new Set();

  // Pack bonus kelimeleri (oyunun doğal kelime havuzu)
  try {
    const ctx = require.context("../data/levels", false, /pack-\d+\.json$/);
    ctx.keys().forEach(k => {
      try {
        const data = ctx(k);
        for (const lv of (data.default || data)) {
          for (const w of (lv.bonus || [])) set.add(norm(String(w)));
        }
      } catch {}
    });
  } catch {
    // Node test ortamında require.context çalışmaz, sadece INFO kullanılır
  }

  // INFO'daki kelimeler (herhangi bir dili olanlar)
  // Test ortamında info.js'i import edebiliriz
  try {
    const { INFO } = require("../data/info.js");
    for (const k of Object.keys(INFO)) set.add(norm(k));
  } catch {}

  _wordPool = [...set].filter(w => w.length >= 2);
  return _wordPool;
}

/** Test ortamı için: pool'u dışarıdan set et. */
export function setChainWordPool(words) {
  _wordPool = words.map(norm).filter(w => w.length >= 2);
}

/**
 * Verilen harfle başlayan rastgele bir kelime seç (henüz kullanılmamış).
 * @param {string} letter
 * @returns {string|null}
 */
function pickWord(letter) {
  const pool = getChainWordPool();
  const candidates = pool.filter(w => w[0] === letter && !cs.usedWords.has(w));
  if (!candidates.length) return null;
  return candidates[(Math.random() * candidates.length) | 0];
}

/** İlk kelimeyi oluştur ve zinciri başlat. */
export function startChain() {
  const pool = getChainWordPool();
  if (!pool.length) return null;
  const start = pool[(Math.random() * pool.length) | 0];
  cs = {
    score: 0,
    streak: 0,
    words: [start],
    usedWords: new Set([start]),
    startWord: start,
    lastLetter: lastGrapheme(start),
    errors: 0,
  };
  return start;
}

/** Zincirin son grafemini (harf/digraf) döndür. */
function lastGrapheme(word) {
  const g = splitG(word);
  return g[g.length - 1];
}

/** İlk grafemi döndür. */
function firstGrapheme(word) {
  const g = splitG(word);
  return g[0];
}

/**
 * Oyuncunun gönderdiği kelimeyi kontrol et.
 * @param {string} rawWord - ham giriş (oyuncunun yazdığı)
 * @returns {{ ok: true, next: string, points: number } | { ok: false, reason: string }}
 */
export function submitChainWord(rawWord) {
  if (!cs) return { ok: false, reason: "no_chain" };
  const word = norm(String(rawWord || "").trim());
  if (word.length < 2) return { ok: false, reason: "too_short" };
  if (cs.usedWords.has(word)) return { ok: false, reason: "already_used" };

  const expected = cs.lastLetter;
  const got = firstGrapheme(word);
  if (got !== expected) {
    return { ok: false, reason: "wrong_letter", expected, got };
  }

  // Kelime gerçekten havuzda var mı? (Kullanıcı uydurma kelime giremesin)
  const pool = getChainWordPool();
  if (!pool.includes(word)) {
    return { ok: false, reason: "unknown_word" };
  }

  // Skor: uzunluk * coin + streak bonus
  const len = splitG(word).length;
  const base = len * CFG.coinsPerGrapheme;
  const streakBonus = cs.streak > 0 && cs.streak % 3 === 0 ? CFG.comboBonusCoins : 0;
  const points = base + streakBonus;

  cs.words.push(word);
  cs.usedWords.add(word);
  cs.score += points;
  cs.streak++;
  cs.lastLetter = lastGrapheme(word);

  return { ok: true, next: cs.lastLetter, points, chainLen: cs.words.length, score: cs.score };
}

/**
 * Yanlış cevap (sticker'ı temizle ama zincir devam etsin).
 * İki üst üste hata olursa zincir biter.
 * @returns {{ ended: boolean, errors: number }}
 */
export function chainError() {
  if (!cs) return { ended: false, errors: 0 };
  cs.errors++;
  cs.streak = 0;
  if (cs.errors >= 2) {
    const errs = cs.errors;
    endChain();
    return { ended: true, errors: errs };
  }
  return { ended: false, errors: cs.errors };
}

/** Zinciri sonlandır, S.stats'a yaz. */
export function endChain() {
  if (!cs) return null;
  const result = {
    score: cs.score,
    longestChain: cs.words.length,
    errors: cs.errors,
    words: [...cs.words],
  };

  S.stats.chainGames = (S.stats.chainGames || 0) + 1;
  if (cs.score > (S.stats.chainBest || 0)) S.stats.chainBest = cs.score;
  if (cs.words.length > (S.stats.chainLongest || 0)) S.stats.chainLongest = cs.words.length;

  cs = null;
  return result;
}

/** Mevcut state (UI için). */
export function getChainState() {
  return cs ? { ...cs, usedWords: undefined } : null;
}

/** Aktif mi? */
export function isChainActive() {
  return cs !== null;
}
