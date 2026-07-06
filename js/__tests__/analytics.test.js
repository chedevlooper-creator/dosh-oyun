import { describe, it, expect, beforeEach, vi } from "vitest";
import { track, pageview, EVENTS } from "../utils/analytics.js";

describe("analytics.EVENTS", () => {
  it("exposes the documented event names", () => {
    expect(EVENTS.LEVEL_START).toBe("level_start");
    expect(EVENTS.LEVEL_COMPLETE).toBe("level_complete");
    expect(EVENTS.HINT_USED).toBe("hint_used");
    expect(EVENTS.LANG_CHANGE).toBe("lang_change");
    expect(EVENTS.TTS_PLAY).toBe("tts_play");
  });
});

describe("analytics.track", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.va;
  });

  it("does not throw when no analytics are available", () => {
    expect(() => track("test_event", { foo: 1 })).not.toThrow();
  });

  it("calls window.va when Vercel Analytics is available", () => {
    const va = vi.fn();
    window.va = va;
    track("test_event", { bar: 2 });
    expect(va).toHaveBeenCalledWith("track", "test_event", { bar: 2 });
  });

  it("does not throw when Vercel Analytics is absent", () => {
    expect(() => track("test", {})).not.toThrow();
  });

  it("skips empty event names", () => {
    track("", {});
    track(null);
    // no throw, no va call
  });

  it("truncates long strings to 200 chars via va", () => {
    const va = vi.fn();
    window.va = va;
    const long = "x".repeat(500);
    track("test", { long });
    expect(va).toHaveBeenCalledWith("track", "test", { long: "x".repeat(200) });
  });

  it("drops null and undefined props via va", () => {
    const va = vi.fn();
    window.va = va;
    track("test", { a: 1, b: null, c: undefined, d: "ok" });
    expect(va).toHaveBeenCalledWith("track", "test", { a: 1, d: "ok" });
  });

  it("drops function values via va", () => {
    const va = vi.fn();
    window.va = va;
    track("test", { a: 1, fn: () => "x" });
    expect(va).toHaveBeenCalledWith("track", "test", { a: 1 });
  });

  it("recursively sanitizes nested objects via va", () => {
    const va = vi.fn();
    window.va = va;
    track("test", { outer: { inner: "x".repeat(500) } });
    const call = va.mock.calls[0][2];
    expect(call.outer.inner).toHaveLength(200);
  });

  it("handles non-object props gracefully", () => {
    expect(() => track("test", "not an object")).not.toThrow();
    expect(() => track("test", null)).not.toThrow();
  });
});

describe("analytics.pageview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.va;
  });

  it("calls window.va with the page name", () => {
    const va = vi.fn();
    window.va = va;
    pageview("home");
    expect(va).toHaveBeenCalledWith("pageview", { name: "home" });
  });

  it("does not throw when va is absent", () => {
    expect(() => pageview("home")).not.toThrow();
  });
});
