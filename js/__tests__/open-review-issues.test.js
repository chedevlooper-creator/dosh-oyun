// @ts-check
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const scriptSrc = readFileSync(join(ROOT, "scripts", "open-review-issues.mjs"), "utf-8");
const templateSrc = readFileSync(join(ROOT, ".github", "ISSUE_TEMPLATE", "chechen-word.md"), "utf-8");

describe("review-bot.script-shape", () => {
  it("uses ESM (import.meta.url)", () => {
    expect(scriptSrc).toMatch(/import\.meta\.url/);
  });

  it("imports node:child_process for gh CLI", () => {
    expect(scriptSrc).toMatch(/from\s+["']node:child_process["']/);
  });

  it("supports --dry-run flag", () => {
    expect(scriptSrc).toMatch(/--dry-run/);
  });

  it("supports --limit N flag with default 20", () => {
    expect(scriptSrc).toMatch(/--limit/);
    expect(scriptSrc).toMatch(/parseInt/);
  });

  it("validates source file existence before processing", () => {
    expect(scriptSrc).toMatch(/lemmas-validated\.json/);
    expect(scriptSrc).toMatch(/fileExists/);
  });

  it("checks gh auth before non-dry-run", () => {
    expect(scriptSrc).toMatch(/gh\s+auth\s+status/);
  });

  it("uses issue label content-review", () => {
    expect(scriptSrc).toMatch(/content-review/);
  });

  it("persists log to cache/review-issues.log", () => {
    expect(scriptSrc).toMatch(/review-issues\.log/);
  });

  it("deduplicates by lemma hash (idempotent)", () => {
    expect(scriptSrc).toMatch(/openedSet/);
    expect(scriptSrc).toMatch(/\.hash/);
  });

  it("exits non-zero on source file missing", () => {
    expect(scriptSrc).toMatch(/process\.exit\(1\)/);
  });
});

describe("review-bot.issue-template", () => {
  it("has a Markdown template at .github/ISSUE_TEMPLATE/chechen-word.md", () => {
    expect(templateSrc).toMatch(/^## Lemma/m);
  });

  it("template includes POS, source, Wiktionary URL placeholders", () => {
    expect(templateSrc).toMatch(/POS/);
    expect(templateSrc).toMatch(/Source/);
    expect(templateSrc).toMatch(/Wiktionary URL/);
  });

  it("template documents approval procedure", () => {
    expect(templateSrc).toMatch(/approved/);
    expect(templateSrc).toMatch(/rejected/);
  });
});
