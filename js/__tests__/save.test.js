import { describe, it, expect } from "vitest";
import { snapshot, SAVE_VERSION } from "../engine/store.js";

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
