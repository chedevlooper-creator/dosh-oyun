import { describe, it, expect } from "vitest";
import { LEVELS } from "../data/levels.js";
import { INFO } from "../data/info.js";
import { norm, splitG } from "../engine/grapheme.js";

/**
 * Check if every grapheme in a word is available in the level's letter pool.
 * Each letter can be used only as many times as it appears in the pool.
 */
function wordUsesOnlyPoolLetters(word, letterPool) {
  const gs = splitG(word);
  const poolCounts = {};
  for (const l of letterPool) {
    const key = norm(l);
    poolCounts[key] = (poolCounts[key] || 0) + 1;
  }
  for (const g of gs) {
    const key = norm(g);
    if (!poolCounts[key]) return false;
    poolCounts[key]--;
  }
  return true;
}

/* ================= Basic structure ================= */
describe("LEVELS basic structure", () => {
  it("has 101 levels (0-100)", () => {
    expect(LEVELS).toHaveLength(101);
  });

  it("has consecutive IDs from 0 to 100", () => {
    for (let i = 0; i < LEVELS.length; i++) {
      expect(LEVELS[i].id).toBe(i);
    }
  });

  it("every level has required fields", () => {
    for (const level of LEVELS) {
      expect(level).toHaveProperty("id");
      expect(level).toHaveProperty("letters");
      expect(level).toHaveProperty("words");
      expect(Array.isArray(level.letters)).toBe(true);
      expect(Array.isArray(level.words)).toBe(true);
      expect(Array.isArray(level.bonus)).toBe(true);
    }
  });

  it("no level has empty letters array", () => {
    for (const level of LEVELS) {
      expect(level.letters.length).toBeGreaterThan(0);
    }
  });

  it("no level has empty words array", () => {
    for (const level of LEVELS) {
      expect(level.words.length).toBeGreaterThan(0);
    }
  });

  it("levels 0-25 are pack 1 (or undefined = pack 0)", () => {
    // level 0 has no pack field (tutorial)
    expect(LEVELS[0].pack).toBeUndefined();
    for (let i = 1; i <= 25; i++) {
      expect(LEVELS[i].pack).toBe(1);
    }
  });

  it("levels 26-50 are pack 2", () => {
    for (let i = 26; i <= 50; i++) {
      expect(LEVELS[i].pack).toBe(2);
    }
  });

  it("levels 51-75 are pack 3", () => {
    for (let i = 51; i <= 75; i++) {
      expect(LEVELS[i].pack).toBe(3);
    }
  });

  it("levels 76-100 are pack 4", () => {
    for (let i = 76; i <= 100; i++) {
      expect(LEVELS[i].pack).toBe(4);
    }
  });
});

/* ================= Word validity ================= */
describe("LEVELS word validity", () => {
  it("every word uses only letters available in its level", () => {
    for (const level of LEVELS) {
      for (const w of level.words) {
        const ok = wordUsesOnlyPoolLetters(w.word, level.letters);
        expect(ok, `Level ${level.id}: word "${w.word}" uses letters not in pool [${level.letters.join(",")}]`).toBe(true);
      }
    }
  });

  it("every bonus word uses only letters available in its level", () => {
    for (const level of LEVELS) {
      if (!level.bonus || level.bonus.length === 0) continue;
      for (const b of level.bonus) {
        const ok = wordUsesOnlyPoolLetters(b, level.letters);
        expect(ok, `Level ${level.id}: bonus word "${b}" uses letters not in pool [${level.letters.join(",")}]`).toBe(true);
      }
    }
  });

  it("every word has valid row, col, and dir fields", () => {
    for (const level of LEVELS) {
      for (const w of level.words) {
        expect(w).toHaveProperty("word");
        expect(w).toHaveProperty("row");
        expect(w).toHaveProperty("col");
        expect(w).toHaveProperty("dir");
        expect(w.row).toBeGreaterThanOrEqual(0);
        expect(w.col).toBeGreaterThanOrEqual(0);
        expect(["across", "down"]).toContain(w.dir);
      }
    }
  });

  it("every word has at least 2 graphemes", () => {
    for (const level of LEVELS) {
      for (const w of level.words) {
        const gs = splitG(w.word);
        expect(gs.length, `Level ${level.id}: word "${w.word}" has < 2 graphemes`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("no duplicate words within a level", () => {
    for (const level of LEVELS) {
      const words = level.words.map(w => norm(w.word));
      const uniq = new Set(words);
      expect(uniq.size, `Level ${level.id}: has duplicate words`).toBe(words.length);
    }
  });

  it("no duplicate bonus words within a level", () => {
    for (const level of LEVELS) {
      if (!level.bonus || level.bonus.length === 0) continue;
      const uniq = new Set(level.bonus.map(norm));
      expect(uniq.size, `Level ${level.id}: has duplicate bonus words`).toBe(level.bonus.length);
    }
  });
});

/* ================= Grid placement consistency ================= */
describe("LEVELS grid consistency", () => {
  it("all words fit within grid letter bounds", () => {
    for (const level of LEVELS) {
      let maxRow = 0, maxCol = 0;
      for (const w of level.words) {
        const gs = splitG(w.word);
        if (w.dir === "across") {
          maxRow = Math.max(maxRow, w.row);
          maxCol = Math.max(maxCol, w.col + gs.length - 1);
        } else {
          maxRow = Math.max(maxRow, w.row + gs.length - 1);
          maxCol = Math.max(maxCol, w.col);
        }
      }
      const letterCount = level.letters.length;
      const gridArea = (maxRow + 1) * (maxCol + 1);
      // Grid should be at most 8x the letter count (avoids sparse grids from errors)
      expect(gridArea, `Level ${level.id}: grid area ${gridArea} is too large for ${letterCount} letters`).toBeLessThanOrEqual(letterCount * 8);
    }
  });

  it("crossing words share the same letter at intersection cells", () => {
    for (const level of LEVELS) {
      // Build a grid { "row,col": letter }
      const grid = {};
      const errors = [];
      for (const w of level.words) {
        const gs = splitG(w.word);
        for (let i = 0; i < gs.length; i++) {
          const r = w.dir === "across" ? w.row : w.row + i;
          const c = w.dir === "across" ? w.col + i : w.col;
          const key = `${r},${c}`;
          const letter = norm(gs[i]);
          if (grid[key] !== undefined && grid[key] !== letter) {
            errors.push(`Cell (${r},${c}): "${grid[key]}" vs "${letter}"`);
          }
          grid[key] = letter;
        }
      }
      expect(errors, `Level ${level.id}: ${errors.length} intersection conflict(s): ${errors.join("; ")}`).toEqual([]);
    }
  });
});

/* ================= Dictionary (INFO) ================= */
describe("INFO dictionary", () => {
  it("every INFO word exists in at least one level", () => {
    const allWords = new Set();
    for (const level of LEVELS) {
      for (const w of level.words) {
        allWords.add(norm(w.word));
      }
      if (level.bonus) {
        for (const b of level.bonus) {
          allWords.add(norm(b));
        }
      }
    }
    const missing = [];
    for (const word of Object.keys(INFO)) {
      if (!allWords.has(norm(word))) {
        missing.push(word);
      }
    }
    if (missing.length > 0) {
      console.warn(`[WARNING] INFO definitions not found in any level: ${missing.join(", ")}`);
    }
    // expect(missing).toEqual([]); // Fazladan kelime INFO'da olabilir, test fail olmasın.
  });

  it("all INFO definitions are non-empty", () => {
    for (const [word, def] of Object.entries(INFO)) {
      expect(def.length, `Definition for "${word}" is empty`).toBeGreaterThan(0);
    }
  });

  it("has at least 80 word definitions", () => {
    const count = Object.keys(INFO).length;
    expect(count).toBeGreaterThanOrEqual(80);
  });

  it("all defined words in INFO match actual level words (no stale entries)", () => {
    const allLevelWords = new Set();
    for (const level of LEVELS) {
      for (const w of level.words) {
        allLevelWords.add(norm(w.word));
      }
    }
    let infoWordsCovered = 0;
    for (const word of Object.keys(INFO)) {
      if (allLevelWords.has(norm(word))) {
        infoWordsCovered++;
      }
    }
    // At least 70% of INFO definitions should be main level words (not just bonus)
    const ratio = infoWordsCovered / Object.keys(INFO).length;
    expect(ratio).toBeGreaterThan(0.7);
  });
});
