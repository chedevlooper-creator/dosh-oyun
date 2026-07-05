// @ts-check
import { describe, it, expect } from "vitest";
import {
  migrateEntry, getAllMigrated, getMigrated, KNOWN_TAGS,
} from "../data/dict-migration.js";

describe("dict-migration.migrateEntry", () => {
  it("passes through valid old schema (ce, tr)", () => {
    const m = migrateEntry({ ce: "хьа", tr: "sen" });
    expect(m.ce).toBe("хьа");
    expect(m.tr).toBe("sen");
    expect(m.ru).toBe("");
    expect(m.ipa).toBe("");
    expect(m.examples).toEqual([]);
    expect(m.tags).toEqual([]);
  });

  it("preserves new fields when present", () => {
    const m = migrateEntry({
      ce: "хьа", tr: "sen", ru: "ты",
      ipa: "[xa]", examples: ["Хьа дика ву"], tags: ["pronoun"],
      etymology: "Proto-Nakh *xa", source: "wiktionary",
    });
    expect(m.ipa).toBe("[xa]");
    expect(m.examples).toEqual(["Хьа дика ву"]);
    expect(m.tags).toEqual(["pronoun"]);
    expect(m.etymology).toBe("Proto-Nakh *xa");
  });

  it("returns blank for null/undefined", () => {
    expect(migrateEntry(null)).toEqual({
      ce: "", tr: "", ru: "", ipa: "",
      examples: [], etymology: "", tags: [], source: "wiktionary",
    });
    expect(migrateEntry(undefined)).toBeDefined();
  });

  it("coerces wrong types safely", () => {
    const m = migrateEntry({
      ce: 123, tr: null, ipa: 456,
      examples: "not an array", tags: [1, "valid", null],
    });
    expect(m.ce).toBe("");
    expect(m.tr).toBe("");
    expect(m.ipa).toBe("");
    expect(m.examples).toEqual([]);
    expect(m.tags).toEqual(["valid"]);
  });

  it("fills defaults for missing keys", () => {
    const m = migrateEntry({ ce: "а" });
    expect(m.ru).toBe("");
    expect(m.examples).toEqual([]);
    expect(m.source).toBe("wiktionary");
  });
});

describe("dict-migration.getAllMigrated", () => {
  it("returns object with all INFO entries normalized", () => {
    const all = getAllMigrated();
    expect(Object.keys(all).length).toBeGreaterThan(50);
    for (const v of Object.values(all)) {
      expect(v).toHaveProperty("ce");
      expect(v).toHaveProperty("tr");
      expect(v).toHaveProperty("ipa");
      expect(v).toHaveProperty("examples");
      expect(v).toHaveProperty("tags");
    }
  });
});

describe("dict-migration.getMigrated", () => {
  it("returns migrated entry for known lemma", () => {
    const m = getMigrated("абат");
    expect(m.ce).toBeTruthy();
  });

  it("returns blank entry for unknown lemma", () => {
    const m = getMigrated("нонсенс");
    expect(m.ce).toBe("");
    expect(m.tags).toEqual([]);
  });
});

describe("dict-migration.KNOWN_TAGS", () => {
  it("exposes the documented tag list", () => {
    expect(KNOWN_TAGS).toContain("nature");
    expect(KNOWN_TAGS).toContain("family");
    expect(KNOWN_TAGS).toContain("animal");
  });

  it("contains no duplicates", () => {
    expect(new Set(KNOWN_TAGS).size).toBe(KNOWN_TAGS.length);
  });
});
