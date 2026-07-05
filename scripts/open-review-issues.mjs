#!/usr/bin/env node
/* ================= REVIEW ISSUE BOT =================
 * Validate edilmiş lemma listesinden native speaker review için
 * GitHub Issue'lar açar. Her yeni kelime bir issue olarak etiketlenir,
 * reviewer onayladığında "approved" yorumu bırakır ve bot PR açar.
 *
 * Kullanım:
 *   node scripts/open-review-issues.mjs [--dry-run] [--limit N]
 *
 *   --dry-run: gerçek issue açmaz, sadece ne açılacağını gösterir
 *   --limit N : en fazla N issue açar (default: 20)
 *
 * Issue template (.github/ISSUE_TEMPLATE/chechen-word.md):
 *   ## Lemma: {{lemma}}
 *   ## POS: {{pos}}
 *   ## Source: {{source}}
 *   ## Wiktionary URL: {{url}}
 *
 *   ## Native speaker checklist
 *   - [ ] Anlam doğru mu?
 *   - [ ] IPA doğru mu?
 *   - [ ] Glossing (ce/tr/ru) eklensin mi?
 *
 *   Onaylamak için: `approved` yazın → bot PR açar.
 *
 * Gereksinim: gh CLI authenticated (gh auth status ile kontrol) */

import { readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(spawn);
const SELF_DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE_FILE = join(SELF_DIR, "cache", "lemmas-validated.json");
const LOG_FILE = join(SELF_DIR, "cache", "review-issues.log");

/** @param {string} f */
async function fileExists(f) {
  try { await access(f); return true; } catch { return false; }
}

/** gh CLI komutunu çalıştırır. */
async function gh(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn("gh", args, {
      cwd: opts.cwd || SELF_DIR,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr, code });
      else reject(new Error(`gh exit ${code}: ${stderr || stdout}`));
    });
  });
}

/**
 * Issue body template
 * @param {{ lemma: string, pos: string, source: string, hash: string }} lemma
 */
function buildIssueBody(lemma) {
  const url = `https://ru.wiktionary.org/wiki/${encodeURIComponent(lemma.lemma)}`;
  return `## Lemma
**${lemma.lemma}**

## POS
${lemma.pos}

## Source
${lemma.source}

## Wiktionary URL
${url}

## Hash
\`${lemma.hash}\`

## Native speaker checklist
- [ ] Anlam doğru mu? (\`js/data/info.js\`'e \`{ ce, tr, ru }\` gloss eklensin mi?)
- [ ] IPA doğru mu?
- [ ] Hint'ler ve diyalog için örnek cümle eklensin mi?

## Onay prosedürü
- **Onaylamak için** bu yoruma \`approved\` yazın → bot PR açacak ve \`js/data/info.js\`'e ekleyecek.
- **Reddetmek için** \`rejected: <sebep>\` yazın.

> Bu issue otomatik açıldı: ${new Date().toISOString()}`;
}

/** @param {string} s */
function trim(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

async function main() {
  const args = process.argv.slice(2);
  const isDry = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 20;

  if (!(await fileExists(SOURCE_FILE))) {
    console.error(`[review-bot] ${SOURCE_FILE} bulunamadı. Önce validate-lemmas çalıştırın.`);
    process.exit(1);
  }

  // gh auth kontrolü (dry-run dışında)
  if (!isDry) {
    try {
      await gh(["auth", "status"]);
    } catch (e) {
      console.error(`[review-bot] gh auth başarısız: ${e.message}`);
      console.error(`  Önce 'gh auth login' çalıştırın.`);
      process.exit(1);
    }
  }

  const lemmas = JSON.parse(await readFile(SOURCE_FILE, "utf-8"));
  if (!Array.isArray(lemmas) || !lemmas.length) {
    console.error(`[review-bot] validate-lemmas çıktısı boş.`);
    process.exit(1);
  }

  // Zaten açılmış issue'ları oku (duplicate önleme)
  let opened = [];
  if (await fileExists(LOG_FILE)) {
    try { opened = JSON.parse(await readFile(LOG_FILE, "utf-8")); } catch { opened = []; }
  }
  const openedSet = new Set(opened);
  const todo = lemmas.filter((l) => !openedSet.has(l.hash)).slice(0, limit);

  console.log(`[review-bot] ${lemmas.length} lemma, ${openedSet.size} zaten açılmış, ${todo.length} yeni açılacak (${isDry ? "DRY-RUN" : "CANLI"})`);

  for (const lemma of todo) {
    const title = `Checen word review: ${trim(lemma.lemma, 60)} (${lemma.pos})`;
    const body = buildIssueBody(lemma);

    if (isDry) {
      console.log(`  [DRY] #? ${title}`);
      console.log(`        body: ${body.slice(0, 80).replace(/\n/g, " ")}…`);
      continue;
    }

    try {
      const { stdout } = await gh([
        "issue", "create",
        "--repo", "chedevlooper-creator/dosh-oyun",
        "--title", title,
        "--body", body,
        "--label", "content-review,word-review",
        "--assignee", "chedevlooper-creator",
      ]);
      const issueUrl = stdout.trim();
      const numMatch = issueUrl.match(/\/issues\/(\d+)/);
      const issueNum = numMatch ? numMatch[1] : "?";
      opened.push({ hash: lemma.hash, lemma: lemma.lemma, issue: issueNum, url: issueUrl, opened_at: new Date().toISOString() });
      console.log(`  ✓ #${issueNum} ${lemma.lemma}`);
    } catch (e) {
      console.error(`  ✗ ${lemma.lemma}: ${e.message}`);
    }
  }

  if (!isDry) {
    await writeFile(LOG_FILE, JSON.stringify(opened, null, 2), "utf-8");
    console.log(`[review-bot] log güncellendi: ${LOG_FILE}`);
  }
}

main().catch((e) => {
  console.error("[review-bot] fatal:", e);
  process.exit(1);
});
