// @ts-check
import { describe, it, expect } from "vitest";
import { PACKS, packFor } from "../data/packs.js";
import { loadAllLevels } from "../data/level-loader.js";
import { packOfLevel, LEVEL_COUNT, LAST_LEVEL_ID, PACK_RANGES } from "../data/level-index.js";

const LEVELS = await loadAllLevels();

describe("PACKS metadata", () => {
  it("has exactly 6 packs matching the 6 level packs", () => {
    expect(PACKS).toHaveLength(6);
    expect(PACKS.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("every pack has a non-empty title and intro in ce, tr, and ru", () => {
    for (const pack of PACKS) {
      expect(pack.title?.ce, `pack ${pack.id} missing ce title`).toBeTruthy();
      expect(pack.title?.tr, `pack ${pack.id} missing tr title`).toBeTruthy();
      expect(pack.title?.ru, `pack ${pack.id} missing ru title`).toBeTruthy();
      expect(pack.intro?.ce, `pack ${pack.id} missing ce intro`).toBeTruthy();
      expect(pack.intro?.tr, `pack ${pack.id} missing tr intro`).toBeTruthy();
      expect(pack.intro?.ru, `pack ${pack.id} missing ru intro`).toBeTruthy();
    }
  });

  it("every pack.theme matches a known visual theme id", () => {
    const known = new Set(["kavkaz", "night", "forest", "autumn", "winter"]);
    for (const pack of PACKS) {
      expect(known.has(pack.theme), `pack ${pack.id} has unknown theme ${pack.theme}`).toBe(true);
    }
  });

  it("packFor(1..6) returns the matching pack", () => {
    for (let i = 1; i <= 6; i++) {
      const p = packFor(i);
      expect(p?.id).toBe(i);
    }
  });

  it("packFor(unknown) returns null", () => {
    expect(packFor(0)).toBeNull();
    expect(packFor(99)).toBeNull();
  });

  it("every level in LEVELS maps to a known pack", () => {
    const ids = new Set(PACKS.map((p) => p.id));
    for (const lv of LEVELS) {
      const pack = lv.pack || Math.floor(lv.id / 25) + 1;
      expect(ids.has(pack), `level ${lv.id} references unknown pack ${pack}`).toBe(true);
    }
  });
});

/* level-index.js indeksi lazy-load'un tek senkron kaynağı — veriyle
 * ayrışırsa harita/oyun yanlış paketten seviye arar. */
describe("level-index consistency", () => {
  it("LEVEL_COUNT and LAST_LEVEL_ID match the actual data", () => {
    expect(LEVEL_COUNT).toBe(LEVELS.length);
    expect(LAST_LEVEL_ID).toBe(LEVELS[LEVELS.length - 1].id);
  });

  it("PACK_RANGES cover all ids contiguously without overlap", () => {
    const sorted = [...PACK_RANGES].sort((a, b) => a.from - b.from);
    expect(sorted[0].from).toBe(0);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].from).toBe(sorted[i - 1].to + 1);
    }
    expect(sorted[sorted.length - 1].to).toBe(LAST_LEVEL_ID);
  });

  it("packOfLevel matches each level's own pack field", () => {
    for (const lv of LEVELS) {
      const expected = lv.pack || Math.floor(lv.id / 25) + 1;
      expect(packOfLevel(lv.id), `level ${lv.id}`).toBe(expected);
    }
  });

  it("packOfLevel returns null outside the range", () => {
    expect(packOfLevel(-1)).toBeNull();
    expect(packOfLevel(LAST_LEVEL_ID + 1)).toBeNull();
  });
});
