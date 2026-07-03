# Dosh (Дош) - Code Wiki Documentation

Welcome to the Code Wiki for **Dosh (Дош)**, a Chechen word puzzle game built as a Progressive Web App (PWA). This document provides a comprehensive overview of the project's architecture, major modules, key functions, dependencies, and instructions for running the project.

## 1. Overall Project Architecture

Dosh is built with a modern, dependency-light **Vanilla JS (ESM)** architecture. It avoids heavy frontend frameworks (like React or Vue) in favor of native DOM manipulation and an elegant, centralized state management system using JavaScript Proxies.

### Key Architectural Patterns:
- **Centralized State Management (Single Source of Truth):** All game state and persistent data are managed through a central `store.js` module. Direct mutations to the state automatically trigger side-effects (like saving to `localStorage` or updating the 3D scene).
- **Module-Based Structure:** The application is highly modularized (ES6 modules), separating data, UI screens, visual effects, and engine logic.
- **Progressive Web App (PWA):** Configured via Vite and `vite-plugin-pwa`, enabling offline play, installation to the home screen, and asset caching.
- **3D Graphics Engine:** Uses `Three.js` (embedded as `three.min.js`) for rich, procedural 3D backgrounds (mountains, parallax effects, particle systems) directly rendered onto a WebGL canvas behind the UI.
- **Synthesized Audio:** Generates game sounds and ambient music procedurally via the Web Audio API without relying on external `.mp3` or `.wav` files.

---

## 2. Responsibilities of Major Modules

The project is structured under the `js/` directory into several logical domains:

### `js/engine/` (Core Game Engine)
- **`store.js`:** The heart of the application. Exports reactive proxies `S` (Persistent State like coins, dict, stats) and `G` (Active Game State like current level progress). Handles atomic operations and debounced saving.
- **`save.js`:** Handles serialization and deserialization of the persistent state (`S`) to and from `localStorage`. Manages storage quota limits safely.
- **`audio.js`:** Procedural audio generation. Contains the `MUSIC` synthesizer and sound effect triggers (e.g., cell clicks, level completion).
- **`theme.js`:** Manages CSS variable updates and DOM class toggles when the user switches visual themes (e.g., Kavkaz, Winter, Night).
- **`grapheme.js`:** Handles Chechen-specific text processing (e.g., treating digraphs like "аь", "кх" as single letters).

### `js/screens/` (UI Components & Views)
- **`game.js`:** The core gameplay loop. Responsible for building the letter wheel, the word grid, handling user input (swipes/clicks), and validating words.
- **`home.js`:** Renders the main menu (Hero card, Play button, Daily tasks).
- **`dict.js` / `dictionary.js`:** Manages the discovered words dictionary screen.
- **`settings.js`:** Renders and handles user preferences (sound, music, 3D graphics toggle, language).
- **`map.js`:** Displays the level progression map.

### `js/fx/` (Visual Effects & 3D)
- **`scene3d.js` & `three-scene.js`:** Initializes and manages the Three.js WebGL context. Renders procedural mountains, weather effects (snow, fireflies), and handles camera parallax based on device tilt or mouse movement.
- **`particles.js` & `confetti.js`:** 2D canvas/DOM-based particle effects for rewards and level completion.

### `js/utils/` (Shared Utilities)
- **`helpers.js`:** DOM query selectors (`$`), display toggles (`show`, `hide`), and generic utility functions.
- **`i18n.js`:** Internationalization module handling UI text translations.
- **`dom.js`:** Advanced DOM manipulation and event delegation helpers.

### `js/data/` (Game Content)
- **`levels.js`:** Defines the structure of the 100 game levels (words, grid layout, allowed bonus words).
- **`config.js` / `info.js`:** General game configuration and meta-information.

---

## 3. Descriptions of Key Classes and Functions

Since the project uses an ES6 functional approach, here are the most critical functions acting as the system's pillars:

### State Management (`js/engine/store.js`)
- **`makeProxy(target, scope)`**: Wraps state objects in a JavaScript Proxy. Intercepts `set` and `deleteProperty` operations to automatically trigger `scheduleSave()` and notify the theme engine if necessary.
- **`commitS(patch)` / `commitG(patch)`**: Safely merges new data into the persistent (`S`) or game (`G`) state.
- **`addFoundWord(wordNorm, opts)`**: Atomically registers a discovered word, calculates coin rewards (base + bonus), and updates statistics.

### Save System (`js/engine/save.js`)
- **`save()`**: Serializes `store.snapshot()` and writes it to `localStorage`. Includes a `try-catch` block to handle `QuotaExceededError` if the device storage is full.
- **`load()`**: Retrieves data from `localStorage` and hydrates the store upon application boot.

### Game Logic (`js/screens/game.js`)
- **`buildGrid()`**: Constructs the DOM elements for the crossword grid based on the current level data from `G`.
- **`fillCell(cell, hint)`**: Animates and populates a grid cell when a correct word is guessed. Includes 3D flip CSS animations.
- **`initGameScreens()`**: Sets up event listeners for the game board, letter wheel, and handles the logic for drawing lines between selected letters.

### 3D Graphics (`js/fx/scene3d.js`)
- **`GL.init()`**: Bootstraps the Three.js scene, camera, renderer, and post-processing pipeline (e.g., Bloom effects).
- **`GL.retheme()`**: Updates lighting, fog, and background textures/colors in the 3D scene to match the active theme stored in `S.settings.theme`.

---

## 4. Dependency Relationships

The project minimizes external dependencies to ensure fast load times and a small footprint.

### Build & Development Dependencies (`package.json`)
- **`vite`**: The primary build tool and development server. Handles ESM bundling and asset serving.
- **`vite-plugin-pwa`**: Injects service worker (`sw.js`) and web app manifest configurations for offline support.
- **`vitest`**: The testing framework used to validate level consistency and game logic (configured in `test` scripts).
- **`jsdom` & `@testing-library/dom`**: Used alongside Vitest for headless DOM testing.

### Runtime Dependencies
- **`three.min.js`**: (Embedded directly in the project root) The only major external runtime library, used exclusively for the 3D background scene. It is chunked separately via Rollup in `vite.config.js`.

### Internal Flow
1. `index.html` loads `js/main.js`.
2. `js/main.js` hydrates the state (`store.js` -> `save.js`).
3. `js/main.js` registers the PWA service worker and initializes the `Three.js` scene.
4. `js/main.js` renders the `home.js` screen, which in turn listens to the `store.js` proxies to update the UI reactively.

---

## 5. Instructions for Running the Project

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Development Mode
To run the project locally with hot-module replacement (HMR):
```bash
# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```
The game will be available at `http://localhost:8765` (or another port if occupied).

### Running Offline / Simple Server
If you don't want to install Node.js dependencies, you can run the game using any standard HTTP server (since it uses native ESM):
```bash
python -m http.server 8765
```

### Production Build
To create an optimized, minified production build:
```bash
npm run build
```
The compiled files will be output to the `dist/` directory. This directory can be deployed to Vercel, Netlify, or GitHub Pages.

### Testing
To run the automated test suite (verifying levels, graphemes, and configurations):
```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

### Debugging
You can append `?debug=1` to the URL (e.g., `http://localhost:8765/?debug=1`) to enable the debug mode. This exposes the global state `__DOSH_DEBUG__` and prints the internal `S` store to the browser console.
