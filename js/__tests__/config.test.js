import { describe, it, expect } from "vitest";
import { CFG, starsFor } from "../data/config.js";

/* ================= CFG constants ================= */
describe("CFG constants", () => {
  it("has all required keys", () => {
    const keys = [
      "startCoins", "hintCost", "targetHintCost", "magicWandCost",
      "coinsPerGrapheme", "bonusWordCoins", "comboMilestone",
      "comboBonusCoins", "dailyGiftCoins",
    ];
    for (const k of keys) {
      expect(CFG).toHaveProperty(k);
    }
  });

  it("has positive coin values", () => {
    expect(CFG.startCoins).toBeGreaterThan(0);
    expect(CFG.hintCost).toBeGreaterThan(0);
    expect(CFG.targetHintCost).toBeGreaterThan(0);
    expect(CFG.magicWandCost).toBeGreaterThan(0);
    expect(CFG.coinsPerGrapheme).toBeGreaterThan(0);
    expect(CFG.bonusWordCoins).toBeGreaterThan(0);
    expect(CFG.dailyGiftCoins).toBeGreaterThan(0);
  });

  it("has reasonable hint costs (cost < gift)", () => {
    expect(CFG.hintCost).toBeLessThan(CFG.dailyGiftCoins);
    expect(CFG.targetHintCost).toBeLessThan(CFG.dailyGiftCoins);
    expect(CFG.magicWandCost).toBeLessThan(CFG.dailyGiftCoins);
  });

  it("hint cost hierarchy: hint < target < wand", () => {
    expect(CFG.hintCost).toBeLessThan(CFG.targetHintCost);
    expect(CFG.targetHintCost).toBeLessThan(CFG.magicWandCost);
  });

  it("combo bonus gold is less than daily gift", () => {
    expect(CFG.comboBonusCoins).toBeLessThan(CFG.dailyGiftCoins);
  });

  it("coins per grapheme is positive and reasonable", () => {
    expect(CFG.coinsPerGrapheme).toBeGreaterThan(0);
    expect(CFG.coinsPerGrapheme).toBeLessThanOrEqual(CFG.hintCost);
  });
});

/* ================= starsFor() ================= */
describe("starsFor()", () => {
  it("returns 3 stars when no mistakes and no hints", () => {
    expect(starsFor(0, 0)).toBe(3);
  });

  it("returns 2 stars with up to 2 mistakes and 0-1 hints", () => {
    expect(starsFor(1, 0)).toBe(2);
    expect(starsFor(2, 0)).toBe(2);
    expect(starsFor(0, 1)).toBe(2);
    expect(starsFor(1, 1)).toBe(2);
    expect(starsFor(2, 1)).toBe(2);
  });

  it("returns 1 star with high mistakes or hints", () => {
    expect(starsFor(0, 2)).toBe(1);
    expect(starsFor(3, 0)).toBe(1);
    expect(starsFor(5, 0)).toBe(1);
    expect(starsFor(100, 100)).toBe(1);
  });

  it("returns 1 star when both mistakes and hints exceed threshold", () => {
    expect(starsFor(3, 2)).toBe(1);
    expect(starsFor(3, 1)).toBe(1);
    expect(starsFor(5, 5)).toBe(1);
  });

  it("returns 2 stars at the exact boundary", () => {
    // boundary: mistakes ≤ 2 and hints ≤ 1
    expect(starsFor(2, 0)).toBe(2);
    expect(starsFor(0, 1)).toBe(2);
    expect(starsFor(2, 1)).toBe(2);
  });

  it("handles negative input gracefully", () => {
    const r = starsFor(-1, -1);
    expect([1, 2, 3]).toContain(r);
  });
});
