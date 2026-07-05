// @ts-check
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const indexHtml = readFileSync(join(ROOT, "index.html"), "utf-8");
const componentsCss = readFileSync(join(ROOT, "css", "components.css"), "utf-8");
const animationsCss = readFileSync(join(ROOT, "css", "animations.css"), "utf-8");
const themesCss = readFileSync(join(ROOT, "css", "themes.css"), "utf-8");

describe("a11y.skip-link", () => {
  it("has a skip link in index.html", () => {
    expect(indexHtml).toMatch(/<a[^>]+class="skip-link"/);
  });

  it("skip-link points to a meaningful anchor", () => {
    // skip-link <a> tag'inin içinde hem class="skip-link" hem href="#anchor" olmalı
    const m = indexHtml.match(/<a[^>]*class="skip-link"[^>]*>/);
    expect(m).not.toBeNull();
    const tag = m[0];
    expect(tag).toMatch(/href="#[a-zA-Z0-9_-]+"/);
  });

  it("skip-link has a visible focus state in CSS", () => {
    expect(componentsCss).toMatch(/\.skip-link:focus/);
  });
});

describe("a11y.aria-roles", () => {
  it("toast has role=status and aria-live=polite", () => {
    expect(indexHtml).toMatch(/id="toast"[^>]*role="status"/);
    expect(indexHtml).toMatch(/id="toast"[^>]*aria-live="polite"/);
  });

  it("banner has role=status and aria-live=polite", () => {
    expect(indexHtml).toMatch(/id="banner"[^>]*role="status"/);
    expect(indexHtml).toMatch(/id="banner"[^>]*aria-live="polite"/);
  });

  it("home progress bar has proper ARIA attributes", () => {
    expect(indexHtml).toMatch(/role="progressbar"/);
    expect(indexHtml).toMatch(/aria-valuemin="0"/);
    expect(indexHtml).toMatch(/aria-valuemax="100"/);
  });

  it("panel (modal) has role=dialog", () => {
    expect(indexHtml).toMatch(/id="veil"[^>]*role="dialog"/);
  });

  it("decorative SVGs are aria-hidden", () => {
    const svgMatches = indexHtml.match(/<svg[^>]*>/g) || [];
    // En az bir svg aria-hidden olmalı
    const withHidden = svgMatches.filter((s) => s.includes('aria-hidden="true"'));
    expect(withHidden.length).toBeGreaterThan(0);
  });
});

describe("a11y.labels", () => {
  it("navigation buttons have aria-labels", () => {
    expect(indexHtml).toMatch(/id="map-back"[^>]*aria-label/);
    expect(indexHtml).toMatch(/id="game-back"[^>]*aria-label/);
    expect(indexHtml).toMatch(/id="game-settings"[^>]*aria-label/);
    expect(indexHtml).toMatch(/id="shuffle"[^>]*aria-label/);
  });

  it("hint buttons have aria-labels", () => {
    expect(indexHtml).toMatch(/id="hint-letter"[^>]*aria-label/);
    expect(indexHtml).toMatch(/id="hint-target"[^>]*aria-label/);
    expect(indexHtml).toMatch(/id="hint-wand"[^>]*aria-label/);
  });

  it("html element has lang attribute", () => {
    expect(indexHtml).toMatch(/<html[^>]+lang=/);
  });
});

describe("a11y.reduced-motion", () => {
  it("has a prefers-reduced-motion media query", () => {
    expect(animationsCss).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)/);
  });

  it("resets animation and transition durations to minimal", () => {
    // tüm prefers-reduced-motion bloklarını topla, hepsi minimal duration kullanmalı
    const blocks = animationsCss.match(/@media\s+\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/g) || [];
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(block).toMatch(/animation-duration:\s*0?\.0*0*1ms/);
      expect(block).toMatch(/transition-duration:\s*0?\.0*0*1ms/);
    }
  });
});

describe("a11y.high-contrast", () => {
  it("has a body.hc theme rule", () => {
    expect(themesCss).toMatch(/body\.hc\s*\{/);
  });

  it("increases focus outline width in HC mode", () => {
    expect(themesCss).toMatch(/body\.hc[^{]*focus-visible[^{]*\{[^}]*outline-width:\s*3px/);
  });
});

describe("a11y.focus-visible", () => {
  it("has a focus-visible style for interactive elements", () => {
    expect(componentsCss).toMatch(/:focus-visible/);
    expect(componentsCss).toMatch(/outline:\s*2px solid/);
  });
});
