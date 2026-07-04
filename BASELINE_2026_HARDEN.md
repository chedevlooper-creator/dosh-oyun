# Baseline (pre-hardening)

- Date: 2026-07-03
- Commit: f492168
- Worktree: `/home/pc/dosh-oyun` (main)

## Source inventory

- 3,694 LOC of game JS (`js/`), 27 source files
- Tests: 3 files, 476 LOC, 13% source/test ratio
- Runtime: zero npm dependencies; vendored `three.min.js` r128 (592 KB) + `fx.js` (24 KB)
- Assets: 5× background JPGs (~2.4 MB), `chechen-culture-canvas.png` (3.8 MB unreferenced), 2× woff2 fonts, 2× icons
- `package.json` devDependencies: vite ^6.4.3, vite-plugin-pwa ^1.3.0, vitest ^4.1.9, jsdom, @testing-library/dom

## Duplicate / dead code (F12, F34, F36, F37, F38, F58)

| Live path | Dead path | Live imports | Dead imports |
|---|---|---|---|
| `js/engine/audio.js` (91) | `js/fx/audio.js` (127) | `main.js`, `settings.js`, `home.js`, `game.js`, `map.js`, `tutorial.js` | none |
| `js/fx/scene3d.js` (392) | `js/fx/three-scene.js` (277) | `main.js`, `settings.js`, `utils/helpers.js` | none |
| `js/fx/particles.js` (94) | `js/fx/confetti.js` (24) | none (particles' `confetti` export is the only consumer) | `home.js`, `game.js` |
| `js/engine/grapheme.js` (49) | `js/utils/graphemes.js` (18) | `game.js`, `editor/main.js`, `levels.test.js`, `grapheme.test.js` | `dict.js` |
| `js/data/config.js` (40) | `js/utils/constants.js` (5) | `game.js`, `config.test.js` | `home.js` |
| `js/utils/helpers.js` (82) | `js/utils/dom.js` (92) | `main.js`, `panel.js`, `engine/save.js`, `engine/audio.js`, `engine/save.js`, `tutorial.js`, `settings.js`, `dict.js`, `map.js`, `home.js`, `screens/game.js` (vibrate, flyCoins) | `game.js` (`$, show, openPanel, closePanel, updateCoins, toast`) |

## Service worker conflict (F53)

- Hand-written `sw.js` declares `CACHE = "dosh-v7"` (drift from `package.json` v4.0.0)
- `vite-plugin-pwa` `autoUpdate` generates a competing SW via `virtual:pwa-register` (registered in `js/main.js:53-57`)
- Generated SW wins in production; hand-written `sw.js` is effectively dead

## Findings index (audit reference)

- BLOCKER: F1, F2, F12, F15, F18*, F21/F25, F22, F29, F34, F36, F37, F38, F49, F53, F57, F58
- QUALITY: F4, F7, F10, F11, F13, F16, F19, F22, F23, F24, F26, F27, F30, F31, F33, F35, F42, F50, F51, F54, F61
- NICE-TO-HAVE: F5, F8, F9, F14, F17, F20, F28, F32, F39, F43, F44, F45, F46, F47, F48, F52, F55, F59, F60, F62, F63, F64

\* F18 (prefers-reduced-motion) — audit reported as not on `fx/scene3d.js`; verified during the prep pass: `fx/scene3d.js` does import `prefersReducedMotion` and uses it on every frame. The active file is correct; the dead `fx/three-scene.js` is the one that "uses it" but never runs. Closing as non-issue.

## Tooling availability (this sandbox)

- Node v22.23.1, npm available
- npm registry writes are network-blocked in this sandbox; pre-existing `node_modules` partially populated, vitest/vite missing
- Tests + build verification deferred to user environment. Code-level verification (import-graph grep, no-reference grep) is performed in this pass.
