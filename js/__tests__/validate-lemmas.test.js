// @ts-check
import { describe, it, expect } from "vitest";
import { validateLemma } from "../../scripts/validate-lemmas.mjs";

describe("validate-lemmas.validateLemma", () => {
  describe("valid lemmas", () => {
    it.each([
      "абазо", "говр", "беш", "маьлха", "дешнаш", "хӀинца", "гӀайгӀа",
      "оьрсийн", "Москва",
    ])("accepts: %s", (lemma) => {
      expect(validateLemma({ lemma, hash: "x", pos: "noun" })).toEqual({ ok: true });
    });
  });

  describe("rejected — bad length", () => {
    it("rejects 1-char lemma", () => {
      expect(validateLemma({ lemma: "а", pos: "noun" })).toEqual({
        ok: false, reason: "bad_length",
      });
    });
    it("rejects 31-char lemma", () => {
      const long = "а".repeat(31);
      expect(validateLemma({ lemma: long, pos: "noun" })).toEqual({
        ok: false, reason: "bad_length",
      });
    });
  });

  describe("rejected — blacklist", () => {
    it.each(["канза", "паккха", "иэс"])("rejects blacklisted: %s", (lemma) => {
      expect(validateLemma({ lemma, pos: "noun" })).toEqual({
        ok: false, reason: "blacklist",
      });
    });
  });

  describe("rejected — non-Chechen script", () => {
    it.each([
      "test", // Latin
      "日本語", // CJK
      "hello123", // alphanumeric mix (numbers)
      "abc def", // Latin
    ])("rejects non-Chechen: %s", (lemma) => {
      expect(validateLemma({ lemma, pos: "noun" })).toEqual({
        ok: false, reason: "non_chechen_script",
      });
    });
  });

  describe("rejected — repeated characters", () => {
    it("rejects 4+ repeated chars", () => {
      expect(validateLemma({ lemma: "ааааа", pos: "noun" })).toEqual({
        ok: false, reason: "repeated_chars",
      });
    });
  });

  describe("rejected — not meaningful", () => {
    it("rejects only punctuation (matches repeated_chars)", () => {
      expect(validateLemma({ lemma: "----", pos: "noun" })).toEqual({
        ok: false, reason: "repeated_chars",
      });
    });
    it("rejects only spaces (matches repeated_chars since space is filtered out)", () => {
      // "    " has 4 spaces which match /(.)\1{3,}/ → repeated_chars wins
      expect(validateLemma({ lemma: "    ", pos: "noun" })).toEqual({
        ok: false, reason: "repeated_chars",
      });
    });
  });

  describe("rejected — invalid input", () => {
    it("rejects null", () => {
      expect(validateLemma(null)).toEqual({ ok: false, reason: "no_lemma" });
    });
    it("rejects non-string lemma", () => {
      expect(validateLemma({ lemma: 123 })).toEqual({ ok: false, reason: "no_lemma" });
    });
  });
});
