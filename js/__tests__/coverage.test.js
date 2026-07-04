// @ts-check
import { describe, it, expect } from "vitest";
import { loadAllLevels } from "../data/level-loader.js";
import { INFO } from "../data/info.js";
import { norm, splitG } from "../engine/grapheme.js";

const LEVELS = await loadAllLevels();

/**
 * Enumerate all Chechen words that appear as main grid words or bonus words
 * across the level set, then check INFO coverage.
 *
 * This is a content-coverage test, not a correctness test. Missing INFO
 * entries are reported (and asserted above a floor) but never silently
 * filled — glosses must come from a native speaker (content policy:
 * CLAUDE.md + README "İçerik kuralları").
 */

function allLevelWords() {
  const set = new Set();
  const main = new Set();
  for (const level of LEVELS) {
    for (const w of level.words) {
      const key = norm(w.word);
      set.add(key);
      main.add(key);
    }
    if (level.bonus) {
      for (const b of level.bonus) {
        set.add(norm(b));
      }
    }
  }
  return { all: set, main };
}

describe("INFO coverage", () => {
  const { all, main } = allLevelWords();
  const infoKeys = new Set(Object.keys(INFO).map(norm));

  const missingMain = [...main].filter((w) => !infoKeys.has(w));
  const missingAny = [...all].filter((w) => !infoKeys.has(w));

  it("has 126 levels in the source of truth", () => {
    expect(LEVELS).toHaveLength(126);
  });

  it("main grid INFO coverage is at least 30% (regression guard)", () => {
    // Soft floor: 30% of main words covered. The 2026 baseline before
    // this expansion was 116/372 ≈ 31%. We do NOT assert 100% because
    // many words still await native-speaker confirmation (contribution
    // table: docs/eksik-kelimeler.md); fabricated glosses are forbidden.
    const ratio = 1 - missingMain.length / main.size;
    expect(ratio, `Missing ${missingMain.length} main words; sample: ${missingMain.slice(0, 5).join(", ")}`).toBeGreaterThanOrEqual(0.3);
  });

  it("total INFO coverage is at least 15% (regression guard)", () => {
    const covered = [...all].filter((w) => infoKeys.has(w)).length;
    const ratio = covered / all.size;
    expect(ratio, `Covered ${covered}/${all.size}; missing sample: ${missingAny.slice(0, 5).join(", ")}`).toBeGreaterThanOrEqual(0.15);
  });

  it("every INFO entry uses non-empty ce and tr fields", () => {
    for (const [word, def] of Object.entries(INFO)) {
      expect(def?.ce, `Empty ce for ${word}`).toBeTruthy();
      expect(def?.tr, `Empty tr for ${word}`).toBeTruthy();
    }
  });

  it("every INFO entry uses grapheme-resolvable text (no orphan digraphs)", () => {
    for (const word of Object.keys(INFO)) {
      const gs = splitG(word);
      expect(gs.length, `${word} resolves to 0 graphemes`).toBeGreaterThan(0);
    }
  });

  it("ru field is optional but, when present, non-empty", () => {
    for (const [word, def] of Object.entries(INFO)) {
      if (def?.ru !== undefined) {
        expect(def.ru, `Empty ru for ${word}`).toBeTruthy();
      }
    }
  });

  it("surfaces the uncovered list (informational)", () => {
    // This test never fails; it just prints so a developer can see the gap.
    if (missingAny.length > 0) {
      console.warn(`[INFO coverage] ${missingAny.length} words without an entry. See docs/eksik-kelimeler.md for the contribution table. Sample: ${missingAny.slice(0, 5).join(", ")}`);
    }
    expect(missingAny).toBeDefined();
  });
});
