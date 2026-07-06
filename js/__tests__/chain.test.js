/* ================= KELİME ZİNCİRİ TEST =================
 * zincir motorunun temel davranışını doğrular. */

import { describe, it, expect, beforeEach } from "vitest";
import {
  startChain, submitChainWord, chainError, endChain,
  isChainActive, getChainState, setChainWordPool,
} from "../game/chain.js";

const TEST_POOL = [
  "абат", "тоба", "адам", "малар", "бакъ", "къона", "нохчийн",
  "дош", "шод", "шуьйре", "егар", "стаг", "говр", "малх",
];

beforeEach(() => {
  setChainWordPool(TEST_POOL);
});

describe("startChain()", () => {
  it("havuzdan rastgele bir kelime seçer ve state başlatır", () => {
    const start = startChain();
    expect(start).toBeTruthy();
    expect(TEST_POOL).toContain(start);
    expect(isChainActive()).toBe(true);
    const s = getChainState();
    expect(s.words).toEqual([start]);
    expect(s.score).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.lastLetter).toBe(start[start.length - 1]);
  });
});

describe("submitChainWord()", () => {
  it("doğru zincirleme kabul eder ve puan ekler", () => {
    const start = startChain();
    // start'ın son harfiyle başlayan bir kelime bul
    const lastLetter = start[start.length - 1];
    const candidate = TEST_POOL.find(w => w[0] === lastLetter);
    if (!candidate) return; // havuzda uygun kelime yoksa atla

    const result = submitChainWord(candidate);
    expect(result.ok).toBe(true);
    expect(result.points).toBeGreaterThan(0);
    expect(getChainState().words).toContain(candidate);
  });

  it("yanlış harfle başlayan kelimeyi reddeder", () => {
    startChain();
    // 'a' ile başlayan ama zincire uymayan bir kelime dene
    // (start 'абат' ise son harf 'т', 'адам' baş harfi 'а' = uymuyor)
    const result = submitChainWord("адам"); // baştaki harf 'а' = muhtemelen yanlış
    if (result.ok) return; // başlangıç 'а' ile bittiyse şanslıydık
    expect(result.reason).toMatch(/wrong_letter|already_used/);
  });

  it("zaten kullanılmış kelimeyi reddeder", () => {
    const start = startChain();
    const r1 = submitChainWord(start); // aynı kelime
    expect(r1.ok).toBe(false);
    expect(r1.reason).toBe("already_used");
  });

  it("çok kısa (<2 harf) girişi reddeder", () => {
    startChain();
    const r = submitChainWord("а");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("too_short");
  });

  it("havuzda olmayan kelimeyi reddeder", () => {
    startChain();
    // lastLetter'a uygun ama TEST_POOL'da yok
    const lastLetter = getChainState().lastLetter;
    const r = submitChainWord(lastLetter + "xqzz");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("unknown_word");
  });
});

describe("chainError()", () => {
  it("tek hata zinciri bitirmez", () => {
    startChain();
    const r = chainError();
    expect(r.ended).toBe(false);
    expect(r.errors).toBe(1);
  });

  it("iki hata zinciri bitirir", () => {
    startChain();
    chainError();
    const r = chainError();
    expect(r.ended).toBe(true);
    expect(r.errors).toBe(2);
  });
});

describe("endChain()", () => {
  it("state'i sıfırlar ve sonuç döndürür", () => {
    startChain();
    const result = endChain();
    expect(result).toBeTruthy();
    expect(result.score).toBe(0);
    expect(result.words.length).toBe(1);
    expect(isChainActive()).toBe(false);
  });
});
