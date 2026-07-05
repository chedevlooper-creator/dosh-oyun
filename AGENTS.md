# AGENTS.md

Дош (Dosh) — Chechen word-puzzle PWA. Vanilla JS ESM, Vite build, Three.js for 3D background only. UI language is Chechen (ce), with ru/tr fallbacks.

## Commands

```bash
npm run dev             # http://localhost:8765 (custom port, NOT 5173)
npm run verify          # lint + vitest + build (full quality gate)
npm run lint            # eslint on js/ + config files
npm test                # vitest run (jsdom env, tests under js/__tests__/)
npm run test:e2e        # Playwright smoke (auto-starts dev server at :8765)
npx vitest run js/__tests__/daily.test.js   # single test file
node scripts/generate-pack.mjs <N>          # deterministic new level pack
node scripts/analyze-coverage.mjs --md      # INFO gloss coverage → docs/
node scripts/open-review-issues.mjs --limit 20
```

## Content policy (HARD RULE)

**Never fabricate Chechen.** Puzzle words must come from Wiktionary Chechen lemma category (candidates: `docs/yeni-kelimeler-2026.md`). Word meanings (glosses in `js/data/info.js`) must be from native speakers — the "tahmini" column is NOT a valid source. UI strings in ce may only use words already attested in the codebase.

Chechen digraphs (аь гӀ кх къ кӀ оь пӀ тӀ уь хь хӀ цӀ чӀ юь яь) count as ONE letter. All word handling MUST go through `js/engine/grapheme.js` (`norm`, `splitG`, `dispG`). `norm` maps all palochka variants AND `I`/`i` to `Ӏ`.

## Architecture

**State** — `js/engine/store.js`: single source of truth. `S` (persistent: coins, stars, dict, settings, stats, daily) and `G` (active level) are Proxy-wrapped. Direct mutation (`S.coins += 5`) auto-debounces `save()` (300ms) and fires theme callbacks. When adding persistent fields: extend `_S`, add defaults to `hydrate()` in save.js, and add to `snapshot()`. localStorage key: `dosh-save-v1`; save.js has a versioned migration pipeline (`SAVE_VERSION`).

**Level packs** — `js/data/levels/pack-N.json` (25 levels each), lazy-loaded via `js/data/level-loader.js` (`import.meta.glob`). `js/data/level-index.js` is the tiny sync index (`PACK_RANGES`, `LEVEL_COUNT`, `LAST_LEVEL_ID`). Adding a pack: generate JSON, extend `PACK_RANGES` + counts, add metadata to `js/data/packs.js`, bump expected counts in tests.

**Screens** — `js/screens/*` render into static `<section>` in `index.html`. `show("scr-*")` toggles `.on`. Modals via `js/screens/panel.js` (`openPanel(html)`). Circular imports between game/home/map are broken with dynamic `import()`.

**3D** — `js/fx/scene3d.js` (Three.js, ~490KB) is lazy-loaded from `js/main.js` via dynamic `import()`. Gated on `S.settings.scene3d !== false` AND user doesn't prefer reduced motion. Never statically import Three.js outside the fx directory.

**Assets** — runtime-referenced files MUST live in `public/`. Backgrounds ship as WebP (JPEG fallback at runtime via `js/engine/theme.js`). PWA manifest is defined inline in `vite.config.js` (VitePWA plugin), not a standalone file. `vite-plugin-pwa` uses `autoUpdate` — no manual SW version bumps needed.

**i18n** — `js/utils/i18n.js` `t(key)` fallback: tr→ru→ce→key. Every new UI key needs at least a ce entry.

**Daily puzzle** — `js/engine/daily.js`: date-hash level pick, streak, share text. Daily mode (`G.daily`) must NOT write `S.stars` or map progression. Deep link: `/?daily=1`.

**Editor** — ships at `/editor` (Vite middleware rewrite to `/editor.html`, same in `vercel.json`). Noindexed. Playtest via `/?playtest=1` (reads `localStorage["editor-test-level"]`, disables 3D automatically).

## Testing notes

- Unit tests import levels with top-level `await loadAllLevels()`.
- `levels.test.js` and `packs.test.js` validate pool letters cover each word, consecutive IDs, index↔data consistency.
- E2E (`e2e/smoke.spec.js`) seeds save to skip tutorial/disable 3D, drives wheel via keyboard (Enter selects bubble, second Enter on last letter submits). `force: true` needed for buttons behind infinite CSS animations.
- Coverage tests enforce floors (≥30% main-word, ≥15% total INFO coverage). Adding uncovered words can break them; run `analyze-coverage.mjs` after content changes.

## Deploy

Vercel (`vercel.json`): strict CSP, cache headers, `/editor` rewrite+noindex. `NODE_ENV=production` at build (required for PWA plugin). Absolute URLs in `index.html`, `public/robots.txt`, `public/sitemap.xml` assume `https://dosh-oyun.vercel.app` — update all three if domain changes.

CI (`ci.yml`) runs lint → vitest → e2e → build on PRs to main. `content-pipeline.yml` auto-fetches from Wiktionary weekly, validates lemmas, emits daily word, auto-commits `js/data/next.json`.