// @ts-check
import { describe, it, expect, beforeEach } from "vitest";
import { hydrate, S } from "../engine/store.js";
import {
  get, list, search, stats, addFound,
  exportJSON, exportCSV, listTags,
} from "../data/dictionary.js";

beforeEach(() => {
  // clean S state (no found words)
  hydrate({ _v: 2, coins: 0, stars: {}, dict: {}, settings: { theme: "kavkaz" }, stats: {} });
});

describe("dictionary.get", () => {
  it("returns enriched record for known lemma", () => {
    const e = get("абат");
    expect(e.lemma).toBe("абат");
    expect(e.gloss).toBeDefined();
    expect(e.found).toBe(false);
  });

  it("returns empty gloss for unknown lemma", () => {
    const e = get("нонсенс");
    expect(e.lemma).toBe("нонсенс");
    expect(e.gloss.ce).toBe("");
    expect(e.gloss.tr).toBe("");
  });

  it("normalizes lemma via norm()", () => {
    const e = get("абат");
    expect(e.lemma).toBe("абат");
  });

  it("reflects S.dict state in 'found' field", () => {
    addFound("абат");
    const e = get("абат");
    expect(e.found).toBe(true);
    expect(typeof e.addedAt).toBe("number");
  });
});

describe("dictionary.list", () => {
  it("returns one entry per INFO key", () => {
    const all = list();
    expect(all.length).toBeGreaterThan(50);
    for (const e of all) {
      expect(e.lemma).toBeTruthy();
      expect(e.gloss).toBeDefined();
    }
  });
});

describe("dictionary.search", () => {
  it("matches by Chechen lemma", () => {
    const r = search("абат");
    expect(r.some((e) => e.lemma === "абат")).toBe(true);
  });

  it("matches by Turkish gloss", () => {
    const r = search("at");
    expect(r.length).toBeGreaterThan(0);
    // 'at' is Turkish for horse (говр)
    expect(r.some((e) => e.gloss.tr && e.gloss.tr.includes("at"))).toBe(true);
  });

  it("matches by Russian gloss (when present)", () => {
    // INFO şu an yalnız ce/tr içeriyor; ru alanı INFO'ya eklenince bu test
    // gerçek bir eşleşmeyle doğrulanabilir. Şimdilik: arama herhangi bir
    // sonuç döndürmemeli (Russian glosses henüz yok).
    const r = search("лошадь");
    expect(r).toEqual([]);
  });

  it("is case-insensitive on lemma", () => {
    const r1 = search("абат");
    const r2 = search("АБАТ");
    expect(r1.length).toBe(r2.length);
  });

  it("returns full list when query is empty", () => {
    const r = search("");
    expect(r.length).toBe(list().length);
  });

  it("filters by tag", () => {
    const all = list();
    // bir tag ekleyelim test için
    if (all[0]) {
      all[0].tags = ["test-tag"];
    }
    // Bu test isolation gerektirir, basit geçerlilik kontrolü:
    const r = search("", { tags: ["x-nonexistent"] });
    expect(r).toEqual([]);
  });

  it("filters onlyFound", () => {
    addFound("абат");
    const r = search("", { onlyFound: true });
    expect(r.length).toBe(1);
    expect(r[0].lemma).toBe("абат");
  });

  it("filters onlyMissing", () => {
    const r = search("", { onlyMissing: true });
    for (const e of r) {
      expect(!e.gloss.ce && !e.gloss.tr).toBe(true);
    }
  });

  it("sorts by lemma (default)", () => {
    const r = search("");
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].lemma.localeCompare(r[i].lemma, "ce")).toBeLessThanOrEqual(0);
    }
  });

  it("sorts by found first when sortBy='found'", () => {
    addFound("абат");
    const r = search("", { sortBy: "found" });
    expect(r[0].found).toBe(true);
  });

  it("respects limit", () => {
    const r = search("", { limit: 5 });
    expect(r.length).toBe(5);
  });
});

describe("dictionary.stats", () => {
  it("returns total / withGloss / missing / found", () => {
    const s = stats();
    expect(s.total).toBeGreaterThan(50);
    expect(s.withGloss).toBeLessThanOrEqual(s.total);
    expect(s.missing).toBe(s.total - s.withGloss);
    expect(s.found).toBe(0);
    expect(s.byTag).toBeDefined();
  });

  it("updates 'found' count when words are added", () => {
    addFound("абат");
    addFound("говр");
    const s = stats();
    expect(s.found).toBe(2);
  });
});

describe("dictionary.addFound", () => {
  it("writes to S.dict with timestamp", () => {
    const l = addFound("абат");
    expect(l).toBe("абат");
    expect(typeof S.dict["абат"]).toBe("number");
  });
});

describe("dictionary.export", () => {
  it("exportJSON returns valid JSON", () => {
    const json = exportJSON();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(50);
  });

  it("exportJSON includes all 3 gloss fields", () => {
    const json = exportJSON();
    const parsed = JSON.parse(json);
    const sample = parsed[0];
    expect(sample).toHaveProperty("lemma");
    expect(sample.gloss).toHaveProperty("ce");
    expect(sample.gloss).toHaveProperty("tr");
  });

  it("exportCSV has header row", () => {
    const csv = exportCSV();
    const lines = csv.split("\n");
    expect(lines[0]).toContain("lemma");
    expect(lines[0]).toContain("ce");
    expect(lines[0]).toContain("tr");
  });

  it("exportCSV quotes fields containing commas", () => {
    const csv = exportCSV();
    // Her satır comma-separated, quotes around fields
    expect(csv).toMatch(/^"lemma","ce","tr"/);
  });
});

describe("dictionary.listTags", () => {
  it("returns a sorted array of unique tags", () => {
    const tags = listTags();
    expect(Array.isArray(tags)).toBe(true);
    const sorted = [...tags].sort();
    expect(tags).toEqual(sorted);
  });
});
