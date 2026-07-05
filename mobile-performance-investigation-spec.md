# Mobile Performance Investigation — Dosh (Дош) PWA

> **Goal**: Identify why the game causes rapid phone heating and frame drops on iPhone (and potentially other mobile devices), even on the home screen, and propose targeted fixes.

---

## 1. User Profile & Device

| Property | Value |
|---|---|
| Device | iPhone 12/13/14 (A14–A15 chip, capable GPU) |
| Mode | PWA (added to home screen) |
| iOS Version | Not confirmed (guessing 17–18) |
| Low Power Mode | Off |
| Reduce Motion | Off (default) |
| Heat onset | **Immediately** (10–15 seconds after launch) |
| Heat location | Home screen **and** game screen |
| 3D toggle | Off does **NOT** fix the issue |
| Ken Burns effect | User didn't notice it (but it's running) |

---

## 2. Methodology

The investigation was conducted by:

1. Static code analysis of all JS modules and CSS files.
2. Interview with the user (3 rounds, 12 questions) to narrow down device/environment/symptoms.
3. Known iOS Safari / WebKit GPU compositing behaviour research.

---

## 3. Architecture Overview

```
Dosh (Vanilla JS ESM + Vite)
├── js/main.js              ← Entry point
├── js/fx/
│   ├── scene3d.js           ← Three.js (~600KB chunk, lazy-loaded)
│   └── particles.js          ← Canvas 2D confetti + flyCoins
├── js/engine/
│   ├── store.js              ← Proxy-based state (auto-save at 300ms)
│   ├── save.js               ← localStorage commit
│   ├── theme.js              ← Background photo loader
│   └── audio.js              ← WebAudio synthesis + music scheduler
├── js/game/
│   ├── render.js             ← DOM grid/wheel/renderer
│   ├── input.js              ← Pointer/touch event orchestration
│   ├── hints.js              ← Hint system
│   ├── reward.js             ← Level-complete effects
│   └── time-attack.js        ← Timer + score mode
├── js/screens/
│   ├── home.js, map.js, game.js, settings.js, etc.
├── js/utils/
│   ├── helpers.js, resize.js, tts.js, analytics.js, report.js
└── css/
    ├── variables.css, themes.css, layout.css, components.css, animations.css
```

---

## 4. Root Cause Analysis

After ruling out the Three.js 3D scene (user confirmed disabling it doesn't help), the following **remaining suspects** were identified, grouped by severity.

### 4.1 🔴 HIGH — CSS `backdrop-filter: blur()` on iOS

**Location**: `css/components.css` (`.glass`, `.toolrow`, `#toast`, `#wheel`, `#panel`, `#veil`)

- `.glass` class is applied to hero card, dock buttons, panels
- `backdrop-filter: blur(16px) saturate(1.35)` forces **the entire GPU compositor to re-render everything behind the element into a texture** every frame
- On iOS Safari/WebKit, `backdrop-filter` is especially expensive because it:
  1. Captures the background into a separate render target
  2. Applies a Gaussian blur kernel
  3. Composites the result
- Even with the `(pointer:coarse)` media query reducing blur to `8px`, it is still active
- The home screen has **at least 7 elements** with `backdrop-filter`

**Relevant CSS selectors** (all with backdrop-filter):
```css
.glass                              /* hero, dock, panel */
.toolrow                            /* game screen tool dock */
#wheel                              /* letter wheel */
#toast                              /* notification toast */
#veil                               /* modal overlay */
#preview .cap                       /* selection preview */
.cell                               /* grid cells — but blur is disabled on mobile via media query */
```

### 4.2 🔴 HIGH — Continuous CSS Animations & Transitions

**Location**: `css/animations.css`, `css/components.css`, `css/layout.css`

All of these run **infinitely** and cause continuous GPU compositing:

| Animation | Duration | Element | Description |
|---|---|---|---|
| `kenburns` | **48s** infinite | `#photo .ph.on` | Background photo scale+translate — forces full-screen repaint |
| `float` | **4s** infinite | `.tower`, `.logo` | Y-axis translation |
| `logoSway` | **7s** infinite | `.logo` | 3D Y-rotation |
| `logoShine` | **6s** infinite | `.logo` | Background-position sweep |
| `sunPulse` | **6s** infinite | `.sun` | Scale + opacity pulse |
| `ctaPulse` | **3.2s** infinite | `#btn-start` (delayed 2s) | Filter + drop-shadow |
| `ringSpin` | **14s** infinite | `#wheel::before` | Conic gradient rotation |
| `borderFlow` | **5s** infinite | `.hero::before` | Background-position sweep |
| `pricePulse` | **2.4s** infinite | `.tool .price` | Box-shadow pulse |
| `glowSweep` | **2.4s** infinite | `.progressbar::after` | X-translation |
| `glowSweep` | **2.5s** infinite | `.glow-sweep::before` | X-translation |
| `skeletonShimmer` | **1.6s** infinite | `.skeleton` | Background-position |
| `pulseRing` | **1.4s** infinite | `.pulse-ring::after` | Scale + opacity |
| `giftGlow` | **1.4s** infinite | `#btn-gift.glow` | Box-shadow + scale |

**Total: ~15 continuous CSS animations running on the home screen alone.**

### 4.3 🟡 MEDIUM — 3D CSS Transforms on Every Screen

**Location**: `css/layout.css`

```css
.screen {
  transform: translateY(26px) translateZ(-70px) rotateX(5deg);
  transition: opacity .4s, transform .5s cubic-bezier(.22,1,.36,1);
}
```

- `translateZ(-70px)` **forces the screen into a 3D compositing layer** on iOS Safari
- `rotateX(5deg)` triggers continuous GPU compositing for all child elements
- The `.screen.on` class resets to `transform: none`, but the transition itself constantly re-composites
- Similarly, `#wheel`, `.panel`, and `#grid-wrap` use 3D transforms (`rotateX(12deg)`, `rotateX(14deg)`, `perspective: 900px`)

### 4.4 🟡 MEDIUM — Multiple Drop-Shadow & Box-Shadow Layers

**Location**: Various CSS files

- `.bub` has 3 shadow layers (box + inset ×2)
- `.bub.sel` has 4 shadow layers
- `.logo` has **3 stacked `drop-shadow()` filters** + background-clip text
- `.tower` has **2 drop-shadow filters**
- `.btn` has 3 box-shadow layers
- Each shadow layer adds GPU fill-rate cost, especially when animated

### 4.5 🟡 MEDIUM — JavaScript Overhead

| Issue | Location | Details |
|---|---|---|
| **Dynamic import of scene3d on every screen change** | `js/utils/helpers.js:22` | `show()` always calls `import("../fx/scene3d.js")` even when 3D is disabled — triggers chunk fetch + module evaluation |
| **Store save debounce (300ms)** | `js/engine/store.js:40` | Every interaction triggers `localStorage.setItem` at most 300ms later — JSON.stringify on entire state |
| **Resize handler (80ms debounce)** | `js/utils/resize.js:23` | Fires all subscribers (scene3d resize, game rebuild, particles resize) |
| **Visibility change listener overhead** | `js/fx/scene3d.js:323` | `document.addEventListener("visibilitychange")` — even when 3D is off, this module's IIFE still creates the listener |
| **Sentry dynamic import** | `js/utils/report.js:14` | `import("@sentry/browser")` adds ~30KB parse/execute cost |

### 4.6 🟢 LOW — Photo Background Loading

- 5 themes with JPG/WebP images (~1.5–2.4 MB total)
- Despite lazy loading, the Ken Burns animation keeps the active photo in a continuous repaint cycle
- On statically composed pages, this is easily the single most expensive visual element

---

## 5. Most Probable Culprit Ranking

| Rank | Root Cause | Evidence |
|---|---|---|
| **1** | **`backdrop-filter: blur()` on multiple glass elements** | Blur is the #1 GPU performance killer on iOS Safari. Multiple elements with blur = multiple render target captures per frame. |
| **2** | **Continuous Ken Burns animation on full-screen background photo** | Forces the entire background layer to be re-composited even when nothing changes. 48s loop means the GPU never rests. |
| **3** | **15+ infinite CSS animations** | Each one forces the compositor to check if a repaint is needed. Combined with blur, this creates sustained GPU load. |
| **4** | **3D CSS transforms on screens** | `translateZ()`/`rotateX()` on `.screen` forces all child content into GPU compositing layers, multiplying memory and bandwidth. |

---

## 6. Proposed Fixes (Prioritized)

### P0 — Immediate, high impact

1. **Disable `backdrop-filter` entirely on mobile** — Remove or set to `none` when `(pointer: coarse)`:
   ```css
   @media (pointer: coarse) {
     .glass, .toolrow, #veil, #toast, #wheel, #preview .cap {
       backdrop-filter: none !important;
       -webkit-backdrop-filter: none !important;
     }
   }
   ```

2. **Reduce Ken Burns animation to static on mobile**:
   ```css
   @media (pointer: coarse) {
     #photo .ph.on { animation: none; }
   }
   ```

3. **Disable `translateZ`/3D transforms on screens for mobile**:
   ```css
   @media (pointer: coarse) {
     .screen { transform: translateY(26px); }  /* no translateZ, no rotateX */
     .screen.on { transform: none; }
   }
   ```

### P1 — Medium impact, quick wins

4. **Batch `backdrop-filter` reductions for non-mobile contexts** — Since the user is on mobile, P0 covers this.

5. **Remove infinite animations on non-interactive elements** (logo shine, glow sweep, pricePulse) on mobile:
   ```css
   @media (pointer: coarse) {
     .logo { animation: float 4s ease-in-out infinite; }  /* keep only float */
     .pulse-ring::after { animation: none; }
     .glow-sweep::before { animation: none; }
     .progressbar::after { animation: none; }
     .tool .price { animation: none; }
   }
   ```

6. **Disable body vignette overlay on mobile** (`body::after` with radial gradient):
   ```css
   @media (pointer: coarse) {
     body::after { display: none; }
   }
   ```

### P2 — JavaScript optimizations

7. **Guard scene3d import in `show()`** — Skip dynamic import when 3D is disabled:
   ```js
   if (S.settings.scene3d !== false) {
     import("../fx/scene3d.js").then(...)
   }
   ```

8. **Increase save debounce** from 300ms to 1000ms on mobile.

9. **Lazy-load Sentry only when consent is given**, not on startup.

10. **Debounce or throttle the pointermove handler** in scene3d.js to ~60fps max.

---

## 7. Verification Strategy

1. **Safari Web Inspector** attached to the PWA:
   - Open Safari on macOS → Develop → [Device Name] → Dosh
   - Go to **Layers** tab → verify number of compositing layers
   - Go to **Timeline** / **Performance** tab → record 5s on home screen
   - Look for: paint count, compositing layer count, GPU memory

2. **`fps-emit` / `requestAnimationFrame` delta profiling**:
   - Add a simple FPS counter: measure `performance.now()` deltas in the main animation loop
   - Verify if frames are dropping below 30fps

3. **Toggle A/B test**:
   - Build a branch with P0 + P1 CSS fixes applied
   - User opens the same level on the same phone for 2 minutes
   - Compare: heat (touch test), frame drops (visual), battery drain (Settings → Battery)

---

## 8. Non-Issues (Ruled Out)

| Candidate | Reason Ruled Out |
|---|---|
| Three.js 3D scene | User confirmed: turning it off does NOT reduce heat |
| Web Audio / music scheduler | Runs only on first pointer interaction; intermittent, not continuous |
| localStorage save calls | 300ms debounce; only writes on state changes, not continuous |
| Level data loading | Lazy-loaded only on demand; home screen has no level data |
| Fly coin / confetti particles | Only trigger on specific events, not continuous |
| TTS / speechSynthesis | Only on word solve; home screen doesn't trigger |
| Vite / bundle size | Cold load only, not a runtime issue |

---

## 9. Open Questions

- [ ] Does the user have `prefers-reduced-motion` enabled? (They were unsure.)
- [ ] What iOS version? (They skipped the question.)
- [ ] Does Low Power Mode help when turned on? (Not tested.)
- [ ] Does the heat persist after killing the PWA and reopening?
- [ ] What is the exact FPS? (No profiling tool on device.)

---

*Spec generated on July 5, 2026 by Buffy after codebase analysis + 3-round user interview.*
