// @ts-check
import { describe, it, expect, beforeEach, vi } from "vitest";
import { track, pageview, EVENTS } from "../utils/analytics.js";

// Sentry mock
vi.mock("@sentry/browser", () => ({
  addBreadcrumb: vi.fn(),
}));

import * as Sentry from "@sentry/browser";

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

  it("calls Sentry.addBreadcrumb with the event", () => {
    track("test_event", { foo: 1 });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "ui",
        message: "test_event",
        data: { foo: 1 },
        level: "info",
      }),
    );
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
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
  });

  it("truncates long strings to 200 chars", () => {
    const long = "x".repeat(500);
    track("test", { long });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ data: { long: "x".repeat(200) } }),
    );
  });

  it("drops null and undefined props", () => {
    track("test", { a: 1, b: null, c: undefined, d: "ok" });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ data: { a: 1, d: "ok" } }),
    );
  });

  it("drops function values", () => {
    track("test", { a: 1, fn: () => "x" });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ data: { a: 1 } }),
    );
  });

  it("recursively sanitizes nested objects", () => {
    track("test", { outer: { inner: "x".repeat(500) } });
    const call = Sentry.addBreadcrumb.mock.calls[0][0];
    expect(call.data.outer.inner).toHaveLength(200);
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
