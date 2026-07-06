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
node scripts/analyze-coverage.mjs --md      # INFO gloss coverage → docs/eksik-kelimeler.md
node scripts/open-review-issues.mjs --limit 20
node scripts/optimize-images.mjs            # regenerate WebP backgrounds
```

## Content policy (HARD RULE)

**Never fabricate Chechen.** Puzzle words must come from Wiktionary Chechen lemma category (candidates: `docs/yeni-kelimeler-2026.md`). Word meanings (glosses in `js/data/info.js`) must be from native speakers — the "tahmini" column is NOT a valid source. UI strings in ce may only use words already attested in the codebase. `docs/eksik-kelimeler.md` is the community contribution table for missing glosses.

Chechen digraphs (аь гӀ кх къ кӀ оь пӀ тӀ уь хь хӀ цӀ чӀ юь яь) count as ONE letter. All word handling MUST go through `js/engine/grapheme.js` (`norm`, `splitG`, `dispG`). `norm` maps all palochka variants AND `I`/`i` to `Ӏ`; `dispG` renders uppercase with palochka→I.

## Architecture

**State** — `js/engine/store.js`: single source of truth. `S` (persistent: coins, stars, dict, settings, stats, daily) and `G` (active level) are Proxy-wrapped. Direct mutation (`S.coins += 5`) auto-debounces `save()` (300ms) and fires theme callbacks. When adding persistent fields: extend `_S`, add defaults to `hydrate()` in save.js, and add to `snapshot()`. localStorage key: `dosh-save-v1`; save.js has a versioned migration pipeline (`SAVE_VERSION`); `hydrate()` repairs missing fields so old backups import cleanly.

**Level packs** — `js/data/levels/pack-N.json` (25 levels each), lazy-loaded via `js/data/level-loader.js` (`import.meta.glob`). `js/data/level-index.js` is the tiny sync index (`PACK_RANGES`, `LEVEL_COUNT`, `LAST_LEVEL_ID`). Adding a pack: generate JSON, extend `PACK_RANGES` + counts, add metadata to `js/data/packs.js`, bump expected counts in tests.

**Game logic** — lives in `js/game/index.js` (`startLevel(id, opts)` is async); `js/screens/game.js` is a re-export shim kept for old import paths.

**Screens** — `js/screens/*` render into static `<section>` in `index.html`. `show("scr-*")` toggles `.on`. Modals via `js/screens/panel.js` (`openPanel(html)`). Circular imports between game/home/map are broken with dynamic `import()`.

**3D** — `js/fx/scene3d.js` (Three.js, ~490KB) is lazy-loaded ONLY when navigating to game/map screens via `js/utils/helpers.js` `show()`, not on initial page load. `GL.ready()` provides a public init check. Never statically import Three.js outside the fx directory. Scene themes are kept in sync through `retheme()` calls in `show()` and `settings.js`.

**Assets** — runtime-referenced files MUST live in `public/`. Backgrounds ship as WebP (JPEG fallback at runtime via `js/engine/theme.js`). PWA manifest is defined inline in `vite.config.js` (VitePWA plugin), not a standalone file. `vite-plugin-pwa` uses `autoUpdate` — no manual SW version bumps needed.

**i18n** — `js/utils/i18n.js` `t(key)` fallback: tr→ru→ce→key. Every new UI key needs at least a ce entry.

**Error reporting** — `js/utils/report.js` derives a Sentry endpoint from `VITE_SENTRY_DSN`, gated on user consent (`localStorage["dosh-consent"] === "1"`, settings 🐞 toggle; default off).

**Daily puzzle** — `js/engine/daily.js`: date-hash level pick, streak, share text. Daily mode (`G.daily`) must NOT write `S.stars` or map progression. Deep link: `/?daily=1`.

**Editor** — ships at `/editor` (Vite middleware rewrite to `/editor.html`, same in `vercel.json`). Noindexed. Playtest via `/?playtest=1` (reads `localStorage["editor-test-level"]`, disables 3D automatically).

## Testing notes

- Unit tests import levels with top-level `await loadAllLevels()`.
- `levels.test.js` and `packs.test.js` validate pool letters cover each word, consecutive IDs, index↔data consistency.
- E2E (`e2e/smoke.spec.js`) seeds save to skip tutorial/disable 3D, drives wheel via keyboard (Enter selects bubble, second Enter on last letter submits). `force: true` needed for buttons behind infinite CSS animations.
- Coverage tests enforce floors (≥30% main-word, ≥15% total INFO coverage). Adding uncovered words can break them; run `analyze-coverage.mjs` after content changes.

## Deploy

Vercel (`vercel.json`): strict CSP, cache headers, `/editor` rewrite+noindex. `NODE_ENV=production` at build (required for PWA plugin). Absolute URLs in `index.html`, `public/robots.txt`, `public/sitemap.xml` assume `https://dosh-oyun.vercel.app` — update all three if domain changes.

Repoyu gözden geçir: `.env` dosyası ignore edilmiş (`**/.env*` rule). Şablon için `.env.example` kullanılıyor. Vercel CLI dev özel token'ını `.env.local`'e yazar — repo'da olmamalı.

CI (`ci.yml`) runs lint → vitest → e2e → build on PRs to main. `content-pipeline.yml` auto-fetches from Wiktionary weekly, validates lemmas, emits daily word, auto-commits `js/data/next.json`.

## Mobile thermal performance

iPhone/iPad/Android termal yükünü azaltmak için P0–P1 düzeltmeleri uygulandı (`css/animations.css`, `css/layout.css`, `css/components.css` `@media (pointer:coarse)` kuralları). Yeni sonsuz animasyon/dekoratif CSS eklerken mobil eşdeğerini unutmayın; `kenburns`, `sunPulse`, `logoShine`, `ringSpin`, `borderFlow`, `pulseRing`, `skeletonShimmer`, `glowSweep`, `pulse-ring::after`, `ctaPulse`, `pricePulse`, `tower.float`, `btn-gift.glow`, `btn-daily.glow` mobilde zaten kapatılmış. Yeni eklenenler de aynı yere eklenmeli.

`js/main.js` tüm dokunmatik cihazlarda varsayılan olarak `S.settings.scene3d=false` yapar (üç boyutlu sahnenin termal yükünü önlemek için). `js/engine/store.js` mobile'larda save debounce'u 1000ms'ye çıkarır (300ms yerine). Bu kararlar surrealdegildir ama e2e testlerde (`?playtest=1` dışında) `S.settings.scene3d` açık kalmalı; testler bu ayarı varsaymamalı.