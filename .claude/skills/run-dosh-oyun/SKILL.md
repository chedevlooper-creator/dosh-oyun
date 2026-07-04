---
name: run-dosh-oyun
description: Build, run, and drive Dosh (Дош, the Chechen word-puzzle PWA). Use when asked to start the game, run its dev server, take a screenshot of the UI, drive/solve a level programmatically, or run its unit/e2e tests.
---

Dosh is a Vite-served vanilla-JS web game. "Running it" headless means:
start the dev server, then drive headless Chromium against it with
`.claude/skills/run-dosh-oyun/driver.mjs` (uses the project's own
Playwright — no extra deps). All paths are relative to the repo root.

## Prerequisites

Node ≥ 20 (verified with v22). Playwright's Chromium must be present
(the repo's e2e suite needs it too):

```bash
npm ci
npx playwright install chromium
```

## Run (agent path)

1. Start the dev server in the background and poll the port
   (don't `sleep` — first start can be slow):

```bash
nohup npm run dev > /tmp/dosh-dev.log 2>&1 &
timeout 30 bash -c 'until curl -sf http://localhost:8765/ >/dev/null 2>&1; do sleep 0.5; done' && echo UP
```

2. Drive it:

```bash
node .claude/skills/run-dosh-oyun/driver.mjs all
```

| flow | what it does |
|---|---|
| `home` | load, dismiss splash, screenshot the home screen |
| `solve` | map → level 1 → solve "дош" via the wheel → screenshot |
| `daily` | open the daily puzzle, screenshot the wheel |
| `settings` | open settings, switch to night theme, screenshot |
| `all` | all of the above in one browser session |

Options: `--url http://localhost:8766` (if Vite moved ports),
`--out DIR` (default `/tmp/dosh-shots`). Screenshots land as
`<flow>-<step>.png`; console errors are collected and fail the run
(exit 1). Exit 0 + `SONUÇ: OK` means the game genuinely rendered and
played.

The driver seeds `localStorage["dosh-save-v1"]` before load: tutorial
skipped (`tut: true`), 3D/sound/music off (no WebGL headless). Copy
that pattern for any new flow.

3. Stop the server when done:

```bash
pkill -f "v[i]te"
```

## Run (human path)

`npm run dev` → open http://localhost:8765 in a browser. Useless
headless. The level editor is at http://localhost:8765/editor.

## Test

```bash
npm test              # vitest: 10 files / 119 tests, ~1s
npm run test:e2e      # Playwright smoke: 6 tests; reuses a running dev server, or starts its own
npm run verify        # lint + unit + build (the repo's quality gate)
```

## Gotchas

- **`pkill -f vite` kills your own shell** — the pattern matches the
  bash command line that contains it. Always use the bracket trick:
  `pkill -f "v[i]te"`.
- **Port 8765 busy → Vite silently moves to 8766** ("Port 8765 is in
  use, trying another one..." in the log) and the driver then times out
  against 8765. Kill stale servers first, or pass `--url` with the port
  from `/tmp/dosh-dev.log`.
- **Splash removal is time-based** — clicking `#splash` starts the fade
  but the element is only removed from the DOM ~2.6 s after load
  ([js/main.js](../../../js/main.js)). Screenshot before that and you get the splash,
  not the home screen. The driver waits for `#splash` to detach.
- **The wheel is driven by keyboard, not drag** — focus a `.bub`,
  press Enter to select; after the last letter the focus stays on the
  bubble and a second Enter submits the word. Bubble text renders
  UPPERCASE (`dispG`), so match letters with a `iu`-flagged regex.
- **`#btn-daily` has an infinite glow animation** — Playwright's
  stability wait never settles; click it with `{ force: true }`.
- **Seed the save or you fight the tutorial** — without
  `tut: true` in the seeded save the tutorial overlay intercepts
  clicks. Keep `scene3d: false` too; headless Chromium has no WebGL and
  the 3D scene only adds noise.

## Troubleshooting

- **Driver times out on `#btn-start`**: dev server not actually on
  8765. `cat /tmp/dosh-dev.log` — if Vite says it moved to 8766, kill
  everything (`pkill -f "v[i]te"`) and restart, or pass `--url`.
- **`browserType.launch: Executable doesn't exist`**: run
  `npx playwright install chromium`.
