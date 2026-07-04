import { describe, it, expect } from "vitest";
import { snapshot, SAVE_VERSION, S } from "../engine/store.js";
import { exportSave, importSave } from "../engine/save.js";

/* ================= snapshot() schema ================= */
describe("snapshot()", () => {
  it("includes _v equal to SAVE_VERSION", () => {
    const snap = snapshot();
    expect(snap._v).toBe(SAVE_VERSION);
  });

  it("SAVE_VERSION is at least 2 (schema is versioned)", () => {
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(2);
  });

  it("snapshot is a plain object (no Proxy flags)", () => {
    const snap = snapshot();
    expect(snap).toBeTypeOf("object");
    expect(snap.__proxy).toBeUndefined();
    expect(snap.stars.__proxy).toBeUndefined();
    expect(snap.dict.__proxy).toBeUndefined();
    expect(snap.settings.__proxy).toBeUndefined();
    expect(snap.stats.__proxy).toBeUndefined();
  });

  it("snapshot is JSON-serialisable (no Map/Set leakage)", () => {
    const snap = snapshot();
    const json = JSON.stringify(snap);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

/* ================= yedekleme (export / import) ================= */
describe("exportSave / importSave", () => {
  it("export produces valid JSON carrying the schema version", () => {
    const data = JSON.parse(exportSave());
    expect(data._v).toBe(SAVE_VERSION);
    expect(typeof data.coins).toBe("number");
  });

  it("round-trip restores the exported state", () => {
    S.coins = 777;
    S.stars[3] = 2;
    const backup = exportSave();
    S.coins = 5;
    delete S.stars[3];
    const res = importSave(backup);
    expect(res.ok).toBe(true);
    expect(S.coins).toBe(777);
    expect(S.stars[3]).toBe(2);
  });

  it("rejects malformed JSON", () => {
    expect(importSave("{oops")).toEqual({ ok: false, error: "parse" });
  });

  it("rejects JSON that is not a save file", () => {
    expect(importSave("[1,2,3]")).toEqual({ ok: false, error: "format" });
    expect(importSave('{"foo":1}')).toEqual({ ok: false, error: "format" });
    expect(importSave('{"coins":"x","settings":{}}')).toEqual({ ok: false, error: "format" });
  });

  it("repairs missing fields via hydrate defaults", () => {
    const res = importSave('{"coins":42,"settings":{}}');
    expect(res.ok).toBe(true);
    expect(S.coins).toBe(42);
    expect(S.settings.theme).toBe("kavkaz");
    expect(S.daily.streak).toBe(0);
  });
});
