import { describe, it, expect } from "vitest";
import { PAL, DIGRAPHS, DSET, norm, splitG, dispG } from "../engine/grapheme.js";

/* ================= norm() ================= */
describe("norm()", () => {
  it("lowercases input", () => {
    expect(norm("ДОШ")).toBe("дош");
    expect(norm("АБВГ")).toBe("абвг");
  });

  it("normalizes palochka variants to PAL (Ӏ)", () => {
    expect(norm("ӏ")).toBe(PAL);   // Cyrillic ӏ
    expect(norm("I")).toBe(PAL);   // Latin I
    expect(norm("i")).toBe(PAL);   // Latin i
    expect(norm("мӏара")).toBe(`м${PAL}ара`);
    expect(norm("МIара")).toBe(`м${PAL}ара`);
  });

  it("trims whitespace", () => {
    expect(norm("  дош  ")).toBe("дош");
    expect(norm("\tцӀен\n")).toBe("цӀен");
  });

  it("handles digraphs correctly", () => {
    expect(norm("КӀай")).toBe(`к${PAL}ай`);
    expect(norm("Хьоза")).toBe("хьоза");
    expect(norm("ГӀала")).toBe(`г${PAL}ала`);
  });

  it("returns empty string for whitespace-only input", () => {
    expect(norm("   ")).toBe("");
    expect(norm("")).toBe("");
  });
});

/* ================= splitG() ================= */
describe("splitG()", () => {
  it("splits simple words into single-letter graphemes", () => {
    expect(splitG("дош")).toEqual(["д", "о", "ш"]);
    expect(splitG("барт")).toEqual(["б", "а", "р", "т"]);
  });

  it("recognises two-letter digraphs as single graphemes", () => {
    expect(splitG("хьоза")).toEqual(["хь", "о", "з", "а"]);
    expect(splitG("цӀен")).toEqual(["цӀ", "е", "н"]);
    expect(splitG("кӀайн")).toEqual(["кӀ", "а", "й", "н"]);
    expect(splitG("яьшка")).toEqual(["яь", "ш", "к", "а"]);
  });

  it("handles words with multiple digraphs", () => {
    expect(splitG("кӀеда")).toEqual(["кӀ", "е", "д", "а"]);
    expect(splitG("тӀулг")).toEqual(["тӀ", "у", "л", "г"]);
    expect(splitG("сахьт")).toEqual(["с", "а", "хь", "т"]);
  });

  it("handles mixed digraph and non-digraph", () => {
    expect(splitG("аьтту")).toEqual(["аь", "т", "т", "у"]);
    expect(splitG("пхьид")).toEqual(["п", "хь", "и", "д"]);
  });

  it("counts grapheme length correctly for digraph-heavy words", () => {
    // цӀен → цӀ + е + н = 3 grafem
    expect(splitG("цӀен")).toHaveLength(3);
    // хьоза → хь + о + з + а = 4 grafem
    expect(splitG("хьоза")).toHaveLength(4);
  });

  it("preserves palochka digraphs", () => {
    // кI is a digraph in DIGRAPHS
    expect(splitG("кӀай")).toEqual(["кӀ", "а", "й"]);
    expect(splitG("пӀелг")).toEqual(["пӀ", "е", "л", "г"]);
    expect(splitG("чӀара")).toEqual(["чӀ", "а", "р", "а"]);
  });

  it("normalizes input before splitting", () => {
    expect(splitG("КӀайн")).toEqual(["кӀ", "а", "й", "н"]);
    expect(splitG("ХьОза")).toEqual(["хь", "о", "з", "а"]);
  });

  it("handles empty string", () => {
    expect(splitG("")).toEqual([]);
  });
});

/* ================= dispG() ================= */
describe("dispG()", () => {
  it("uppercases graphemes", () => {
    expect(dispG("а")).toBe("А");
    expect(dispG("до")).toBe("ДО");
  });

  it("converts palochka to Latin I in display form", () => {
    expect(dispG("Ӏ")).toBe("I");
    expect(dispG("кӀ")).toBe("КI");
    expect(dispG("цӀ")).toBe("ЦI");
    expect(dispG("тӀ")).toBe("ТI");
  });

  it("uppercases digraphs correctly", () => {
    expect(dispG("хь")).toBe("ХЬ");
    expect(dispG("аь")).toBe("АЬ");
    expect(dispG("яь")).toBe("ЯЬ");
  });

  it("handles multi-character display", () => {
    expect(dispG("кӀай")).toBe("КIАЙ");
    expect(dispG("жима")).toBe("ЖИМА");
  });
});

/* ================= DIGRAPHS set integrity ================= */
describe("DIGRAPHS integrity", () => {
  it("all digraphs are two characters long", () => {
    for (const d of DIGRAPHS) {
      expect(d.length).toBe(2);
    }
  });

  it("all digraphs are in DSET", () => {
    for (const d of DIGRAPHS) {
      expect(DSET.has(d)).toBe(true);
    }
  });

  it("DSET has correct count of Chechen digraphs", () => {
    // Chechen has 15 digraphs: аь, гI, кх, къ, кI, оь, пI, тI, уь, хь, хI, цI, чI, юь, яь
    expect(DIGRAPHS.length).toBe(15);
    expect(DSET.size).toBe(15);
  });

  it("all known Chechen digraphs are present", () => {
    const expected = [
      "аь", "гӀ", "кх", "къ", "кӀ",
      "оь", "пӀ", "тӀ", "уь", "хь",
      "хӀ", "цӀ", "чӀ", "юь", "яь",
    ];
    // normalise to match DIGRAPHS format
    for (const d of expected) {
      expect(DSET.has(norm(d))).toBe(true);
    }
  });
});
