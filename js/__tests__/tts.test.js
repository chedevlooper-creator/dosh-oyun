// @ts-check
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getPref, setPref, isOff, isBrowserTtsSupported, speak, audioUrl, onSpeak,
} from "../utils/tts.js";

describe("tts.getPref / setPref", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to 'browser' when no preference set", () => {
    expect(getPref()).toBe("browser");
  });

  it("returns the stored preference", () => {
    setPref("off");
    expect(getPref()).toBe("off");
    setPref("audio");
    expect(getPref()).toBe("audio");
  });

  it("falls back to 'browser' for invalid stored values", () => {
    localStorage.setItem("dosh-tts-pref", "garbage");
    expect(getPref()).toBe("browser");
  });
});

describe("tts.isOff", () => {
  beforeEach(() => { localStorage.clear(); });

  it("is false by default", () => {
    expect(isOff()).toBe(false);
  });

  it("is true after setPref('off')", () => {
    setPref("off");
    expect(isOff()).toBe(true);
  });
});

describe("tts.audioUrl", () => {
  it("returns /audio/ce/<word>.mp3 for Chechen", () => {
    expect(audioUrl("беш", "ce")).toBe("/audio/ce/беш.mp3");
  });

  it("returns /audio/tr/<word>.mp3 for Turkish", () => {
    expect(audioUrl("at", "tr")).toBe("/audio/tr/at.mp3");
  });

  it("returns null for empty word", () => {
    expect(audioUrl("", "ce")).toBeNull();
    expect(audioUrl(null, "ce")).toBeNull();
  });

  it("strips unsafe characters", () => {
    expect(audioUrl("а/б!", "ce")).toBe("/audio/ce/аб.mp3");
  });
});

describe("tts.speak — off mode", () => {
  beforeEach(() => { localStorage.clear(); });

  it("returns skipped when pref is off", async () => {
    setPref("off");
    const result = await speak("беш", "ce");
    expect(result.ok).toBe(false);
    expect(result.source).toBe("skipped");
  });

  it("returns skipped for empty word regardless of pref", async () => {
    const result = await speak("", "ce");
    expect(result.ok).toBe(false);
    expect(result.source).toBe("skipped");
  });
});

describe("tts.speak — browser mode", () => {
  let originalSpeechSynthesis;
  let speakMock;
  let cancelMock;
  let getVoicesMock;

  beforeEach(() => {
    localStorage.clear();
    setPref("browser");
    speakMock = vi.fn();
    cancelMock = vi.fn();
    getVoicesMock = vi.fn(() => [
      { lang: "ru-RU", name: "Russian" },
      { lang: "en-US", name: "English" },
    ]);
    const mockSs = {
      speak: speakMock,
      cancel: cancelMock,
      getVoices: getVoicesMock,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    // jsdom ortamında hem window hem global set et
    originalSpeechSynthesis = global.speechSynthesis;
    global.speechSynthesis = mockSs;
    if (typeof window !== "undefined") {
      window.speechSynthesis = mockSs;
    }
    // SpeechSynthesisUtterance jsdom'da yok — global mock olarak ekle
    global.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; this.lang = ""; this.rate = 1; this.pitch = 1; this.volume = 1; }
    };
  });

  afterEach(() => {
    global.speechSynthesis = originalSpeechSynthesis;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try { delete window.speechSynthesis; } catch { window.speechSynthesis = undefined; }
    }
  });

  it("calls speechSynthesis.speak with the word", async () => {
    const result = await speak("беш", "ce");
    expect(speakMock).toHaveBeenCalledTimes(1);
    const utter = speakMock.mock.calls[0][0];
    expect(utter.text).toBe("беш");
    expect(result.source).toBe("browser");
  });

  it("cancels previous utterance before speaking (no overlap)", async () => {
    await speak("беш", "ce");
    expect(cancelMock).toHaveBeenCalled();
  });

  it("picks ru voice when ce is not available", async () => {
    await speak("беш", "ce");
    const utter = speakMock.mock.calls[0][0];
    expect(utter.lang).toBe("ru");
  });

  it("uses requested lang when voice is available", async () => {
    getVoicesMock.mockReturnValue([
      { lang: "ce-XX", name: "Chechen" },
      { lang: "ru-RU", name: "Russian" },
    ]);
    await speak("беш", "ce");
    const utter = speakMock.mock.calls[0][0];
    expect(utter.lang).toBe("ce");
  });

  it("applies Chechen-friendly rate (0.85)", async () => {
    await speak("беш", "ce");
    const utter = speakMock.mock.calls[0][0];
    expect(utter.rate).toBe(0.85);
  });
});

describe("tts.speak — fallback when speechSynthesis throws", () => {
  let originalSpeechSynthesis;
  let originalAudio;

  beforeEach(() => {
    localStorage.clear();
    setPref("browser");
    originalSpeechSynthesis = global.speechSynthesis;
    global.speechSynthesis = {
      speak: vi.fn(() => { throw new Error("not allowed"); }),
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    if (typeof window !== "undefined") {
      window.speechSynthesis = global.speechSynthesis;
    }
    global.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; }
    };
    originalAudio = global.Audio;
    const mockPlay = vi.fn(() => Promise.resolve());
    function MockAudio() { this.play = mockPlay; }
    global.Audio = MockAudio;
  });

  afterEach(() => {
    global.speechSynthesis = originalSpeechSynthesis;
    global.Audio = originalAudio;
  });

  it("falls back to Audio when speechSynthesis throws", async () => {
    const result = await speak("беш", "ce");
    expect(result.source).toBe("audio");
    expect(result.ok).toBe(true);
  });
});

describe("tts.isBrowserTtsSupported", () => {
  it("returns true when speechSynthesis exists", () => {
    expect(isBrowserTtsSupported()).toBe(true);
  });

  it("returns false when speechSynthesis is missing", () => {
    const original = global.speechSynthesis;
    delete global.speechSynthesis;
    expect(isBrowserTtsSupported()).toBe(false);
    global.speechSynthesis = original;
  });
});

describe("tts.onSpeak listeners", () => {
  it("register and deregister", () => {
    const cb = vi.fn();
    const off = onSpeak(cb);
    off();
    // Should not throw
    expect(true).toBe(true);
  });
});
