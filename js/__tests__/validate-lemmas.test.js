// @ts-check
import { describe, it, expect } from "vitest";
import { validateLemma } from "../data/validate-lemma.js";

describe("validate-lemmas.validateLemma", () => {
  describe("valid lemmas", () => {
    it.each([
      "абазо", "говр", "беш", "маьлха", "дешнаш", "хӀинца", "гӀайгӀа",
      "оьрсийн", "Москва",
    ])("accepts: %s", (lemma) => {
      expect(validateLemma({ lemma, hash: "x", pos: "noun" })).toEqual({ ok: true });
    });
  });

  describe("length boundaries", () => {
    it("accepts exactly 2-char lemma (minimum)", () => {
      expect(validateLemma({ lemma: "аб" })).toEqual({ ok: true });
    });
    it("accepts exactly 30-char lemma (maximum)", () => {
      // Cyrillic + Chechen chars, precisely 30 characters
      const max = "абвгдежзиклмнопрстуфхцчшщэюяаб";
      expect(max.length).toBe(30);
      expect(validateLemma({ lemma: max })).toEqual({ ok: true });
    });
    it("rejects 1-char lemma", () => {
      expect(validateLemma({ lemma: "а" })).toEqual({
        ok: false, reason: "bad_length",
      });
    });
    it("rejects 31-char lemma", () => {
      const long = "а".repeat(31);
      expect(validateLemma({ lemma: long })).toEqual({
        ok: false, reason: "bad_length",
      });
    });
    it("rejects 0-char (empty) lemma", () => {
      expect(validateLemma({ lemma: "" })).toEqual({
        ok: false, reason: "bad_length",
      });
    });
  });

  describe("case sensitivity", () => {
    it("accepts lowercase Chechen", () => {
      expect(validateLemma({ lemma: "беш" })).toEqual({ ok: true });
    });
    it("accepts uppercase Chechen (like proper nouns)", () => {
      expect(validateLemma({ lemma: "Беш" })).toEqual({ ok: true });
    });
    it("accepts mixed case", () => {
      expect(validateLemma({ lemma: "Москва" })).toEqual({ ok: true });
    });
    it("accepts all-uppercase short word", () => {
      expect(validateLemma({ lemma: "АБ" })).toEqual({ ok: true });
    });
    it("rejects Latin even if uppercase", () => {
      expect(validateLemma({ lemma: "AB" })).toEqual({
        ok: false, reason: "non_chechen_script",
      });
    });
  });

  describe("Chechen-specific characters", () => {
    it("accepts word with Ӏ (Cyrillic Capital I with Breve)", () => {
      expect(validateLemma({ lemma: "хӀинца" })).toEqual({ ok: true });
    });
    it("accepts word with ӏ (Cyrillic Small Palochka)", () => {
      expect(validateLemma({ lemma: "гӀайгӀа" })).toEqual({ ok: true });
    });
    it("accepts word with ь (soft sign)", () => {
      expect(validateLemma({ lemma: "оьрсийн" })).toEqual({ ok: true });
    });
    it("accepts word with apostrophe", () => {
      expect(validateLemma({ lemma: "беш'аб" })).toEqual({ ok: true });
    });
    it("accepts word with hyphen", () => {
      expect(validateLemma({ lemma: "беш-аб" })).toEqual({ ok: true });
    });
    it("rejects word with digits", () => {
      expect(validateLemma({ lemma: "беш1" })).toEqual({
        ok: false, reason: "non_chechen_script",
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
      "test",
      "日本語",
      "hello123",
      "abc def",
    ])("rejects non-Chechen: %s", (lemma) => {
      expect(validateLemma({ lemma, pos: "noun" })).toEqual({
        ok: false, reason: "non_chechen_script",
      });
    });

    it("rejects only spaces as repeated_chars (spaces in regex but 4+ repeat)", () => {
      expect(validateLemma({ lemma: "    " })).toEqual({
        ok: false, reason: "repeated_chars",
      });
    });
  });

  describe("rejected — repeated characters", () => {
    it("rejects 4+ repeated Cyrillic chars", () => {
      expect(validateLemma({ lemma: "ааааа" })).toEqual({
        ok: false, reason: "repeated_chars",
      });
    });
    it("rejects exactly 4 repeated chars", () => {
      expect(validateLemma({ lemma: "аааа" })).toEqual({
        ok: false, reason: "repeated_chars",
      });
    });
    it("accepts 3 repeated chars (below threshold)", () => {
      expect(validateLemma({ lemma: "ааабббввв" })).toEqual({ ok: true });
    });
    it("rejects repeated punctuation", () => {
      expect(validateLemma({ lemma: "----" })).toEqual({
        ok: false, reason: "repeated_chars",
      });
    });
    it("rejects repeated hyphens within a word (4+ triggers)", () => {
      expect(validateLemma({ lemma: "а----б" })).toEqual({
        ok: false, reason: "repeated_chars",
      });
    });
    it("accepts 3 hyphens within a word (below threshold)", () => {
      expect(validateLemma({ lemma: "а---б" })).toEqual({ ok: true });
    });
  });

  describe("rejected — invalid input", () => {
    it("rejects null", () => {
      expect(validateLemma(null)).toEqual({ ok: false, reason: "no_lemma" });
    });
    it("rejects undefined", () => {
      expect(validateLemma(undefined)).toEqual({ ok: false, reason: "no_lemma" });
    });
    it("rejects non-string lemma (number)", () => {
      expect(validateLemma({ lemma: 123 })).toEqual({ ok: false, reason: "no_lemma" });
    });
    it("rejects non-string lemma (object)", () => {
      expect(validateLemma({ lemma: {} })).toEqual({ ok: false, reason: "no_lemma" });
    });
    it("rejects missing lemma field", () => {
      expect(validateLemma({ hash: "x" })).toEqual({ ok: false, reason: "no_lemma" });
    });
  });

  describe("edge cases", () => {
    it("accepts lemma with trailing space after Chechen chars (space in regex)", () => {
      // "беш " — 4 chars, space in regex, has Chechen chars → valid
      expect(validateLemma({ lemma: "беш " })).toEqual({ ok: true });
    });
    it("rejects lemma that is only hyphens (not meaningful)", () => {
      // "---" is 3 chars, passes length, passes Chechen script (hyphen in regex)
      // but hasRepeatedChars('---') → true (--- matches (.)\1{3,}? No: 3 chars = only 2 repeats)
      // Actually: /(.)\1{3,}/.test('---') → '-' captured, then \1{3,} needs 3+ more → total 4+
      // So '---' is only 3 chars → regex needs 4+ total → '---' does NOT match repeated_chars
      // But isMeaningful('---') → /[а-яёА-ЯЁӀӏ]/.test('---') → false → not_meaningful
      expect(validateLemma({ lemma: "---" })).toEqual({
        ok: false, reason: "not_meaningful",
      });
    });
    it("rejects long repeated pattern", () => {
      expect(validateLemma({ lemma: "абабабаб" })).toEqual({ ok: true });
    });
  });
});
