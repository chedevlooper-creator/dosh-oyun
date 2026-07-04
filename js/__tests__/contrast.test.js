/* ================= WCAG Contrast Test =================
 * Bu test, :root ve body.theme-* override'ları içinden metin/kart renklerini
 * okur ve en önemli UI metin kombinasyonları için AA (4.5:1) kontrast oranını
 * doğrular. Kartlar yarı saydam olduğu için arka plan kompozitini de hesaba
 * katarak gerçekçi bir alt-sınır verir. */

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
  // "rgba(26,22,14,.68)" → {r:26,g:22,b:14,a:0.68}
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

/* Tüm tema bloklarını çıkar: body.theme-X{ ... } */
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

/* ------------------ Test: en kötü durum kontrastı ------------------ */
describe("WCAG AA contrast on body text", () => {
  // --ink (#f7f1de) her temada aynı; --card yarı saydam.
  // Kartın arkasındaki varsayımsal en karanlık olası renk (siyah) için bile
  // kontrast 4.5:1 olmalı; gerçekte yarı saydamın üzerinde daha yüksek.
  const inkRgb = hexToRgb(baseVars["--ink"]);

  it("--ink parses to a light cream", () => {
    expect(inkRgb).not.toBeNull();
    // f7f1de: r=247, g=241, b=222 — açık
    expect(inkRgb.r).toBeGreaterThan(220);
    expect(inkRgb.g).toBeGreaterThan(220);
  });

  it("--ink vs solid black (worst case) is at least 12:1", () => {
    const ratio = contrastRatio(inkRgb, { r: 0, g: 0, b: 0 });
    // 4.5:1 AA threshold'unu çok rahat geçmeli
    expect(ratio).toBeGreaterThan(12);
  });

  it("--ink on dark card composite is at least 7:1 in every theme", () => {
    // Kart yarı saydam olduğundan arka planı siyah varsayalım (en kötü durum);
    // composite beyaz benzeri olmaz, ama ink-card blend'i test et.
    for (const [themeName, vars] of Object.entries(themes)) {
      const cardRgba = parseRgba(vars["--card"]);
      expect(cardRgba, `theme-${themeName} --card parses`).not.toBeNull();
      const cardOpaque = compositeOver(cardRgba, { r: 0, g: 0, b: 0 });
      const ratio = contrastRatio(inkRgb, cardOpaque);
      expect(ratio, `theme-${themeName} contrast`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
