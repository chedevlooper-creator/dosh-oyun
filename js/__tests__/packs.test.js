// @ts-check
import { describe, it, expect } from "vitest";
import { PACKS, packFor } from "../data/packs.js";
import { LEVELS } from "../data/levels.js";

describe("PACKS metadata", () => {
  it("has exactly 4 packs matching the 4 level packs", () => {
    expect(PACKS).toHaveLength(4);
    expect(PACKS.map((p) => p.id)).toEqual([1, 2, 3, 4]);
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

  it("packFor(1..4) returns the matching pack", () => {
    for (let i = 1; i <= 4; i++) {
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
