# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Дош (Dosh) — a Chechen word-puzzle PWA (Words-of-Wonders style). Vanilla JS ESM, no framework; Vite build; Three.js for the 3D background only. UI language is Chechen (ce) with ru/tr translations.

## Commands

```bash
npm run dev        # Vite dev server at http://localhost:8765
npm run build      # production build → dist/
npm run verify     # lint + unit tests + build (the full quality gate)
npm run lint       # eslint js/ + config files
npm test           # vitest run (js/__tests__/*.test.js, jsdom env)
npx vitest run js/__tests__/daily.test.js   # single test file
npm run test:e2e   # Playwright smoke (starts its own dev server)
node scripts/analyze-coverage.mjs [--md]    # INFO gloss coverage; --md writes docs/eksik-kelimeler.md
node scripts/generate-pack.mjs <N>          # generate a new level pack (deterministic, seeded)
```

CI (`.github/workflows/ci.yml`) runs lint → unit → e2e → build on PRs to main.

## Content policy (hard rule)

**Never fabricate Chechen.** Puzzle words must come from the Wiktionary Chechen lemma category (see `_wordlist_full.txt`, `docs/yeni-kelimeler-2026.md`); word meanings (glosses in `js/data/info.js`) must come from native speakers — the "tahmini" column in candidate reports is NOT a valid gloss source. UI strings in ce are composed only from words already attested in the codebase. `docs/eksik-kelimeler.md` is the community contribution table for missing glosses. Coverage tests enforce floors (≥30% main-word, ≥15% total INFO coverage) — adding uncovered words can break them.

Chechen digraphs (аь гӀ кх къ кӀ оь пӀ тӀ уь хь хӀ цӀ чӀ юь яь) count as ONE letter. All word handling must go through `js/engine/grapheme.js` (`norm`, `splitG`, `dispG`); `norm` maps palochka variants and I/i to `Ӏ`, `dispG` renders uppercase with palochka→I.

## Architecture

**State** — `js/engine/store.js` is the single source of truth. `S` (persistent: coins, stars, dict, settings, stats, daily) and `G` (active level) are Proxy-wrapped: direct mutation (`S.coins += 5`) auto-debounces `save()` (300ms) and fires theme callbacks. Persistence is localStorage (`dosh-save-v1`) via `js/engine/save.js`, with a versioned migration pipeline (`SAVE_VERSION`, `hydrate()` repairs missing fields — old backups import cleanly). When adding a persistent field: add to `_S`, `hydrate()` defaults, and `snapshot()`.

**Levels** — content lives in `js/data/levels/pack-N.json` (25 levels each), lazy-loaded per pack via `js/data/level-loader.js` (`import.meta.glob`, cached). `js/data/level-index.js` is the tiny sync index (`PACK_RANGES`, `LEVEL_COUNT`, `LAST_LEVEL_ID`) used by home/map without loading content. Adding a pack: generate JSON, extend `PACK_RANGES` + counts, add metadata to `js/data/packs.js`, bump expected counts in tests. `startLevel(id, opts)` in `js/screens/game.js` is async.

**Screens** — `js/screens/*` render into static sections in `index.html` (`show("scr-*")` toggles `.on`); modals go through `js/screens/panel.js` (`openPanel(html)`). Circular imports between screens are broken with dynamic `import()` (e.g. game→home/map).

**Daily puzzle** — pure logic in `js/engine/daily.js` (date-hash level pick, streak, share text); daily mode (`G.daily`) must NOT write `S.stars`/map progression. Deep link `/?daily=1`.

**3D scene** — `js/fx/scene3d.js` (Three.js, ~490KB chunk) is lazy-loaded from `js/main.js` only when `S.settings.scene3d !== false` and the OS doesn't prefer reduced motion. Never import it statically from the main path.

**Assets** — runtime-referenced files (bg photos, icons, robots, sitemap) MUST live in `public/` or they won't reach `dist/`. Backgrounds ship as WebP (JPEG fallback picked at runtime in `js/engine/theme.js`); regenerate with `node scripts/optimize-images.mjs`. The PWA manifest is defined in `vite.config.js` (VitePWA), not a standalone file.

**i18n** — `js/utils/i18n.js` `t(key)` falls back tr/ru → ce → key, so every new key needs at least a ce entry. Error reporting (`js/utils/report.js`) derives a Sentry endpoint from `VITE_SENTRY_DSN` and is gated on user consent (settings 🐞 toggle).

## Testing notes

- Unit tests import level data with top-level `await loadAllLevels()`.
- `js/__tests__/levels.test.js` structurally validates all packs (pool letters cover each word, consecutive ids); `packs.test.js` guards index↔data consistency — generator output that violates layout/pool rules fails here.
- E2E (`e2e/smoke.spec.js`) seeds the save to skip the tutorial and disable 3D, then drives the wheel via its keyboard path (Enter selects, second Enter on last letter submits). Wheel bubbles display uppercase; infinite `glow` animations need `force: true` clicks.

## Deploy

Vercel (`vercel.json`: strict CSP, cache headers, /editor rewrite+noindex). Absolute URLs (canonical/OG in `index.html`, `public/robots.txt`, `public/sitemap.xml`) assume `https://dosh-oyun.vercel.app` — update all three if the domain differs. The level editor ships at `/editor` (noindexed, dev tool).
