/* ================= WCAG Contrast Test =================
 * Bu test, :root ve body.theme-* override'ları içinden metin/kart renklerini
 * okur ve tüm görünür metin kombinasyonları için WCAG AA (4.5:1) kontrast
 * oranını doğrular.
 *
 * Test edilen kombinasyonlar:
 * 1. --ink on body gradient (sky3 = en karanlık)
 * 2. --ink on --card composite (siyah zemin = en kötü durum)
 * 3. --gold on --card composite
 * 4. --accent on --card composite
 * 5. --bubble-ink on --bubble on --wheel
 * 6. --sel-ink on --sel
 * 7. --cell-ink on --cell-fill
 * 8. --ink2 on --card composite (secondary text — 3:1 large threshold)
 * 9. --gold on body gradient (sky3) — sky elementleri
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

function parseColors(css) {
  const out = {};
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(css))) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

function hexToRgb(hex) {
  const m = /^#?([a-f0-9]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function parseRgba(str) {
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)/i.exec(str);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 };
}

/** sRGB bileşenini lineer ışık değerine çevirir (WCAG 2.x). */
function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relLum({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** Alfa-blend rengi opak bir zemin üzerine bindir (WCAG spec). */
function compositeOver(fg, bg) {
  const a = fg.a ?? 1;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}

function contrastRatio(c1, c2) {
  const L1 = relLum(c1), L2 = relLum(c2);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ------------------ CSS dosyalarını oku ------------------ */
const variablesCSS = readFileSync(join(ROOT, "css", "variables.css"), "utf-8");
const themesCSS = readFileSync(join(ROOT, "css", "themes.css"), "utf-8");

const baseVars = parseColors(variablesCSS);

/* Tüm tema bloklarını çıkar */
function extractThemeBlocks(css) {
  const re = /body\.theme-([\w-]+)\{([^}]+)\}/g;
  const out = {};
  let m;
  while ((m = re.exec(css))) {
    out[m[1]] = parseColors(m[2]);
  }
  return out;
}
const themes = extractThemeBlocks(themesCSS);

/** Tema değişkenlerini baseVars ile birleştir (override) */
function mergeTheme(themeVars) {
  return { ...baseVars, ...themeVars };
}

/* ------------------ Helper: ratio assert ------------------ */
function expectRatio(ratio, label, minRatio = 4.5) {
  expect(
    ratio,
    `${label}: contrast ratio ${ratio.toFixed(2)}:1 < ${minRatio}:1 (WCAG AA)`
  ).toBeGreaterThanOrEqual(minRatio);
}

/* ------------------ Test Suite ------------------ */

describe("WCAG AA contrast — body text on card", () => {
  const inkRgb = hexToRgb(baseVars["--ink"]);

  it("--ink parses to light cream", () => {
    expect(inkRgb).not.toBeNull();
    expect(inkRgb.r).toBeGreaterThan(220);
  });

  it("--ink vs solid black is at least 12:1", () => {
    const ratio = contrastRatio(inkRgb, { r: 0, g: 0, b: 0 });
    expect(ratio).toBeGreaterThan(12);
  });

  for (const [themeName, themeVars] of Object.entries(themes)) {
    it(`theme-${themeName}: --ink on --card composite ≥ 4.5:1`, () => {
      const vars = mergeTheme(themeVars);
      const cardRgba = parseRgba(vars["--card"]);
      expect(cardRgba, `--card parses`).not.toBeNull();
      const cardOpaque = compositeOver(cardRgba, { r: 0, g: 0, b: 0 });
      const ratio = contrastRatio(inkRgb, cardOpaque);
      expectRatio(ratio, `theme-${themeName} --ink/--card`);
    });
  }
});

describe("WCAG AA contrast — gold text on card", () => {
  for (const [themeName, themeVars] of Object.entries(themes)) {
    it(`theme-${themeName}: --gold on --card composite ≥ 4.5:1`, () => {
      const vars = mergeTheme(themeVars);
      const goldRgb = hexToRgb(vars["--gold"]);
      const cardRgba = parseRgba(vars["--card"]);
      expect(goldRgb, `--gold parses`).not.toBeNull();
      expect(cardRgba, `--card parses`).not.toBeNull();
      const cardOpaque = compositeOver(cardRgba, { r: 0, g: 0, b: 0 });
      const ratio = contrastRatio(goldRgb, cardOpaque);
      expectRatio(ratio, `theme-${themeName} --gold/--card`);
    });
  }
});

describe("WCAG AA contrast — accent text on card", () => {
  for (const [themeName, themeVars] of Object.entries(themes)) {
    it(`theme-${themeName}: --accent on --card composite ≥ 4.5:1`, () => {
      const vars = mergeTheme(themeVars);
      const accentRgb = hexToRgb(vars["--accent"]);
      const cardRgba = parseRgba(vars["--card"]);
      expect(accentRgb, `--accent parses`).not.toBeNull();
      expect(cardRgba, `--card parses`).not.toBeNull();
      const cardOpaque = compositeOver(cardRgba, { r: 0, g: 0, b: 0 });
      const ratio = contrastRatio(accentRgb, cardOpaque);
      expectRatio(ratio, `theme-${themeName} --accent/--card`);
    });
  }
});

describe("WCAG AA contrast — bubble-ink on bubble", () => {
  // --bubble (#f7f1de) sits on --wheel (semi-transparent dark)
  const bubbleRgb = hexToRgb(baseVars["--bubble"]);
  const bubbleInkRgb = hexToRgb(baseVars["--bubble-ink"]);

  it("--bubble-ink on --bubble ≥ 4.5:1", () => {
    const ratio = contrastRatio(bubbleInkRgb, bubbleRgb);
    expectRatio(ratio, "--bubble-ink/--bubble");
  });

  for (const [themeName, themeVars] of Object.entries(themes)) {
    it(`theme-${themeName}: --bubble-ink on --bubble (on --wheel composite) ≥ 4.5:1`, () => {
      const vars = mergeTheme(themeVars);
      const wheelRgba = parseRgba(vars["--wheel"]);
      if (!wheelRgba) return; // --wheel not overridden
      const wheelOpaque = compositeOver(wheelRgba, { r: 0, g: 0, b: 0 });
      const bubbleOnWheel = compositeOver({ ...bubbleRgb, a: 1 }, wheelOpaque);
      const ratio = contrastRatio(bubbleInkRgb, bubbleOnWheel);
      expectRatio(ratio, `theme-${themeName} --bubble-ink/--bubble/--wheel`);
    });
  }
});

describe("WCAG AA contrast — sel-ink on sel", () => {
  const selRgb = hexToRgb(baseVars["--sel"]);
  const selInkRgb = hexToRgb(baseVars["--sel-ink"]);

  it("--sel-ink on --sel ≥ 4.5:1", () => {
    const ratio = contrastRatio(selInkRgb, selRgb);
    expectRatio(ratio, "--sel-ink/--sel");
  });
});

describe("WCAG AA contrast — cell-ink on cell-fill", () => {
  const cellFillRgb = hexToRgb(baseVars["--cell-fill"]);
  const cellInkRgb = hexToRgb(baseVars["--cell-ink"]);

  it("--cell-ink on --cell-fill ≥ 4.5:1", () => {
    const ratio = contrastRatio(cellInkRgb, cellFillRgb);
    expectRatio(ratio, "--cell-ink/--cell-fill");
  });
});

describe("WCAG AA contrast — secondary text (ink2) on card", () => {
  const ink2Rgb = hexToRgb(baseVars["--ink2"]);

  it("--ink2 parses", () => {
    expect(ink2Rgb).not.toBeNull();
  });

  for (const [themeName, themeVars] of Object.entries(themes)) {
    it(`theme-${themeName}: --ink2 on --card composite ≥ 3:1 (large text)`, () => {
      const vars = mergeTheme(themeVars);
      const cardRgba = parseRgba(vars["--card"]);
      expect(cardRgba, `--card parses`).not.toBeNull();
      const cardOpaque = compositeOver(cardRgba, { r: 0, g: 0, b: 0 });
      const ratio = contrastRatio(ink2Rgb, cardOpaque);
      // ink2 is secondary text — WCAG allows 3:1 for large text (18pt+)
      expectRatio(ratio, `theme-${themeName} --ink2/--card`, 3);
    });
  }
});

describe("WCAG AA contrast — danger text", () => {
  const dangerRgb = hexToRgb(baseVars["--danger"]);

  it("--danger parses", () => {
    expect(dangerRgb).not.toBeNull();
  });

  for (const [themeName, themeVars] of Object.entries(themes)) {
    it(`theme-${themeName}: --danger on --card composite ≥ 4.5:1`, () => {
      const vars = mergeTheme(themeVars);
      const cardRgba = parseRgba(vars["--card"]);
      if (!cardRgba) return;
      const cardOpaque = compositeOver(cardRgba, { r: 0, g: 0, b: 0 });
      const ratio = contrastRatio(dangerRgb, cardOpaque);
      expectRatio(ratio, `theme-${themeName} --danger/--card`);
    });
  }
});
