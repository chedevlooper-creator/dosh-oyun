/* ================= OYUN MOTORU ================= */

import { S, commitG, addFoundWord, setG } from "../engine/store.js";
import { LEVELS } from "../data/levels.js";
import { INFO } from "../data/info.js";
import { CFG, starsFor } from "../data/config.js";
import { norm, splitG, dispG } from "../engine/grapheme.js";
import { $, show, openPanel, closePanel, updateCoins, toast } from "../utils/dom.js";
import { vibrate, flyCoins } from "../utils/helpers.js";
import { SFX } from "../engine/audio.js";
import { confetti } from "../fx/confetti.js";

/* ================= OYUN DURUMU ================= */

/**
 * @typedef {Object} LevelData
 * @property {number} id
 * @property {string[]} letters
 * @property {WordData[]} words
 * @property {string[]} [bonus]
 * @property {number} [pack]
 */

/**
 * @typedef {Object} WordData
 * @property {string} word
 * @property {number} row
 * @property {number} col
 * @property {string} dir
 */

/**
 * @typedef {Object} GameState
 * @property {LevelData} lv
 * @property {ProcessedWord[]} words
 * @property {Map<string, CellData>} cells
 * @property {Set<string>} bonusSet
 * @property {Set<string>} foundBonus
 * @property {number} mistakes
 * @property {number} hints
 * @property {number} streak
 * @property {number} earned
 * @property {Object[]} sel
 * @property {boolean} targeting
 * @property {boolean} done
 */

/**
 * @typedef {Object} ProcessedWord
 * @property {string} word
 * @property {number} row
 * @property {number} col
 * @property {string} dir
 * @property {string[]} g
 * @property {string} norm
 * @property {boolean} solved
 * @property {CellData[]} cells
 */

/**
 * @typedef {Object} CellData
 * @property {number} r
 * @property {number} c
 * @property {string} ch
 * @property {boolean} filled
 * @property {boolean} hint
 * @property {HTMLElement|null} el
 */

/** @type {GameState|null} */
let G = null;

/** @type {{ el: HTMLElement, letter: string, x: number, y: number, idx: number }[]} */
let bubbles = [];
let dragging = false;

/* ================= SEVİYE BAŞLAT ================= */

/**
 * Seviyeyi başlat
 * @param {number} id - Seviye ID
 */
function startLevel(id) {
  const lv = LEVELS.find(l => l.id === id);
  if (!lv) return;

  const words = lv.words.map(w => ({
    ...w,
    g: splitG(w.word),
    norm: splitG(w.word).join(""),
    solved: false,
  }));

  let minR = 1e9, minC = 1e9;
  for (const w of words) { minR = Math.min(minR, w.row); minC = Math.min(minC, w.col); }

  /** @type {Map<string, CellData>} */
  const cells = new Map();
  for (const w of words) {
    w.cells = [];
    for (let i = 0; i < w.g.length; i++) {
      const r = w.row - minR + (w.dir === "down" ? i : 0);
      const c = w.col - minC + (w.dir === "across" ? i : 0);
      const key = r + "," + c;
      if (!cells.has(key)) cells.set(key, { r, c, ch: w.g[i], filled: false, hint: false, el: null });
      w.cells.push(cells.get(key));
    }
  }

  const bonusSet = new Set((lv.bonus || []).map(b => splitG(b).join("")));

  G = {
    lv, words, cells, bonusSet,
    foundBonus: new Set(),
    mistakes: 0, hints: 0, streak: 0, earned: 0,
    sel: [], targeting: false, done: false,
  };
  setG(G); // store'a da bildir (atomik persist)

  document.getElementById("lvl-num").textContent = id + 1;
  document.getElementById("bonus-count").textContent = "0";
  const strip = document.getElementById("info-strip");
  strip.className = "";
  strip.innerHTML = "";
  updateCoins(S);
  show("scr-game");
  buildWheel(lv.letters.slice());
  requestAnimationFrame(() => buildGrid());
}

/* ================= IZGARA ================= */

function buildGrid() {
  if (!G) return;
  const wrap = document.getElementById("grid-wrap");
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  let maxR = 0, maxC = 0;
  for (const c of G.cells.values()) { maxR = Math.max(maxR, c.r); maxC = Math.max(maxC, c.c); }
  const rows = maxR + 1, cols = maxC + 1;
  const availW = Math.min(wrap.clientWidth - 8, 536);
  const availH = wrap.clientHeight - 8;
  const gap = 5;
  const size = Math.max(22, Math.min(52, Math.floor(Math.min(
    (availW - gap * (cols - 1)) / cols,
    (availH - gap * (rows - 1)) / rows,
  ))));

  grid.style.width = (cols * size + (cols - 1) * gap) + "px";
  grid.style.height = (rows * size + (rows - 1) * gap) + "px";

  for (const cell of G.cells.values()) {
    const el = document.createElement("div");
    el.className = "cell";
    el.style.width = el.style.height = size + "px";
    el.style.left = (cell.c * (size + gap)) + "px";
    el.style.top = (cell.r * (size + gap)) + "px";
    el.style.fontSize = (cell.ch.length > 1 ? size * 0.42 : size * 0.52) + "px";
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", "Hücre");
    el.addEventListener("click", () => onCellTap(cell));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCellTap(cell);
      }
    });
    cell.el = el;
    grid.appendChild(el);
  }
}

/**
 * Hücreyi doldur
 * @param {CellData} cell
 * @param {boolean} [hint=false]
 */
function fillCell(cell, hint = false) {
  if (cell.filled) return;
  cell.filled = true;
  cell.hint = hint;
  if (!cell.el) return;
  cell.el.textContent = dispG(cell.ch);
  cell.el.classList.add("fill");
  if (hint) cell.el.classList.add("hintfill");
}

/* ================= ÇARK ================= */

function buildWheel(letters) {
  const wheel = document.getElementById("wheel");
  wheel.querySelectorAll(".bub").forEach(b => b.remove());
  const n = letters.length;
  const zone = document.getElementById("wheel-zone");
  const D = Math.max(190, Math.min(300, Math.min(innerWidth - 40, (zone.clientHeight || 260) + 140)));
  wheel.style.width = wheel.style.height = D + "px";

  const svg = wheel.querySelector("svg");
  svg.setAttribute("viewBox", "0 0 " + D + " " + D);
  svg.innerHTML = "<polyline points=''/>";

  const bs = Math.max(30, Math.min(56, (D * 2.55) / n));
  const R = D / 2 - bs / 2 - 7;

  bubbles = letters.map((L, i) => {
    const ang = -Math.PI / 2 + i * (2 * Math.PI / n);
    const x = D / 2 + R * Math.cos(ang);
    const y = D / 2 + R * Math.sin(ang);
    const el = document.createElement("div");
    el.className = "bub";
    el.style.width = el.style.height = bs + "px";
    el.style.left = (x - bs / 2) + "px";
    el.style.top = (y - bs / 2) + "px";
    el.style.fontSize = (L.length > 1 ? bs * 0.42 : bs * 0.5) + "px";
    el.textContent = dispG(L);
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", "Harf " + dispG(L));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const b = bubbles.find(bub => bub.el === el);
        if (!b) return;
        const i = G.sel.indexOf(b);
        if (i === -1) selAdd(b);
        else if (i === G.sel.length - 1) submitSel();
      }
    });
    wheel.appendChild(el);
    return { el, letter: norm(L), x, y, idx: i };
  });
}

function shuffleWheel() {
  if (!G) return;
  const ls = G.lv.letters.slice();
  for (let i = ls.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [ls[i], ls[j]] = [ls[j], ls[i]];
  }
  buildWheel(ls);
  SFX.coin();
}

/* ---------- ÇARK SÜRÜKLEME ---------- */

function bubbleAt(x, y) {
  for (const b of bubbles) {
    const r = b.el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width / 2 + 6;
    if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) return b;
  }
  return null;
}

function selAdd(b) {
  if (!G) return;
  G.sel.push(b);
  b.el.classList.add("sel");
  SFX.pick(G.sel.length - 1);
  vibrate(8);
  renderSel();
}

function renderSel() {
  if (!G) return;
  const pv = document.getElementById("preview");
  if (!G.sel.length) { pv.innerHTML = ""; return; }
  pv.innerHTML = `<div class="cap">${G.sel.map(b => dispG(b.letter)).join("")}</div>`;
  const svg = document.querySelector("#wheel svg polyline");
  const wr = document.getElementById("wheel").getBoundingClientRect();
  svg.setAttribute("points", G.sel.map(b => {
    const r = b.el.getBoundingClientRect();
    return (r.left + r.width / 2 - wr.left) + "," + (r.top + r.height / 2 - wr.top);
  }).join(" "));
}

function setupWheelListeners() {
  const wheel = document.getElementById("wheel");
  wheel.addEventListener("pointerdown", e => {
    if (!G || G.done) return;
    const b = bubbleAt(e.clientX, e.clientY);
    if (!b) return;
    dragging = true;
    try { wheel.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    G.sel = [];
    bubbles.forEach(x => x.el.classList.remove("sel"));
    selAdd(b);
  });

  wheel.addEventListener("pointermove", e => {
    if (!dragging) return;
    const b = bubbleAt(e.clientX, e.clientY);
    if (!b) return;
    if (!G) return;
    const i = G.sel.indexOf(b);
    if (i === -1) selAdd(b);
    else if (i === G.sel.length - 2) {
      const last = G.sel.pop();
      last.el.classList.remove("sel");
      renderSel();
    }
  }, { passive: true });

  addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    submitSel();
  });
}

/* ---------- KELİME GÖNDERME ---------- */

function submitSel() {
  if (!G) return;
  const word = G.sel.map(b => b.letter).join("");
  const clear = (cls) => {
    const pv = document.querySelector("#preview .cap");
    if (pv && cls) pv.classList.add(cls);
    setTimeout(() => {
      bubbles.forEach(x => x.el.classList.remove("sel"));
      G.sel = [];
      renderSel();
    }, cls ? 450 : 60);
  };

  if (G.sel.length < 2) { clear(); return; }

  const target = G.words.find(w => !w.solved && w.norm === word);
  if (target) { clear("ok"); solveWord(target, false); return; }

  if (G.words.some(w => w.solved && w.norm === word) || G.foundBonus.has(word)) {
    clear("dup");
    toast("ХӀара дош карийна!");
    return;
  }

  if (G.bonusSet.has(word)) {
    clear("ok");
    G.foundBonus.add(word);
    document.getElementById("bonus-count").textContent = G.foundBonus.size;
    // atomik bonus merge
    addFoundWord(word, { isBonus: true, coins: CFG.bonusWordCoins });
    G.earned += CFG.bonusWordCoins;
    updateCoins(S);
    SFX.bonus();
    flyCoins(document.getElementById("bonus-chest"), 3);
    toast("💎 Карина бонус  +" + CFG.bonusWordCoins + " 🪙", "gold");
    return;
  }

  // Hata
  G.mistakes++;
  G.streak = 0;
  clear("bad");
  SFX.bad();
  vibrate([40, 50, 40]);
  toast("Дош нийса дац!", "bad");
}

/**
 * Kelimeyi çöz
 * @param {Object} w
 * @param {boolean} byHint
 */
function solveWord(w, byHint) {
  if (!G) return;
  w.solved = true;
  if (!byHint) {
    vibrate(25);
    const gw = document.getElementById("grid-wrap");
    gw.classList.remove("shake");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        gw.classList.add("shake");
      });
    });
  }

  w.cells.forEach((c, i) => setTimeout(() => {
    fillCell(c, byHint);
    if (!byHint && c.el) {
      c.el.classList.add("glowup");
      setTimeout(() => c.el.classList.remove("glowup"), 700);
    }
  }, i * 70));

  addFoundWord(w.norm); // dict'e ekle
  S.stats.words++;
  // proxy üzerinden atama otomatik save tetikler

  if (!byHint) {
    G.streak++;
    S.stats.bestStreak = Math.max(S.stats.bestStreak, G.streak);
    const coins = w.g.length * CFG.coinsPerGrapheme;
    const combo = (G.streak % CFG.comboMilestone === 0) ? CFG.comboBonusCoins : 0;
    S.coins += coins + combo;
    S.stats.coinsEarned += coins + combo;
    G.earned += coins + combo;
    SFX.solve();
    flyCoins(document.getElementById("grid"), 4);
    if (combo) setTimeout(() => { toast("🔥 x" + G.streak + "  +" + combo + " 🪙", "gold"); SFX.coin(); }, 500);
  }

  const info = INFO[w.norm];
  if (info) {
    const strip = document.getElementById("info-strip");
    strip.innerHTML = `<b>${dispG(w.norm)}</b> — ${info}`;
    strip.className = "on";
  }

  updateCoins(S);
  checkAutoSolve();
  if (G.words.every(x => x.solved)) setTimeout(levelComplete, w.cells.length * 70 + 600);
}

function checkAutoSolve() {
  if (!G) return;
  for (const w of G.words) {
    if (!w.solved && w.cells.every(c => c.filled)) solveWord(w, true);
  }
}

/* ---------- İPUÇLARI ---------- */

function unfilled() {
  if (!G) return [];
  return [...G.cells.values()].filter(c => !c.filled);
}

function spend(cost) {
  if (S.coins < cost) { toast(cost + " 🪙 оьшу", "bad"); SFX.bad(); return false; }
  S.coins -= cost;             // proxy otomatik save
  S.stats.coinsSpent += cost;
  S.stats.hints++;
  if (G) G.hints++;
  updateCoins(S);
  return true;
}

function hintLetter() {
  if (!G || G.done) return;
  const u = unfilled();
  if (!u.length) return;
  if (!spend(CFG.hintCost)) return;
  fillCell(u[(Math.random() * u.length) | 0], true);
  SFX.hint();
  checkAutoSolve();
  checkDone();
}

function hintTarget() {
  if (!G || G.done) return;
  if (!unfilled().length) return;
  if (S.coins < CFG.targetHintCost) { toast(CFG.targetHintCost + " 🪙 оьшу", "bad"); SFX.bad(); return; }
  G.targeting = !G.targeting;
  for (const c of G.cells.values()) {
    if (c.el) c.el.classList.toggle("target", G.targeting);
  }
  if (G.targeting) toast("Яьшка харжа 🎯");
}

function onCellTap(cell) {
  if (!G || !G.targeting || cell.filled) return;
  G.targeting = false;
  for (const c of G.cells.values()) {
    if (c.el) c.el.classList.remove("target");
  }
  if (!spend(CFG.targetHintCost)) return;
  fillCell(cell, true);
  SFX.hint();
  checkAutoSolve();
  checkDone();
}

function hintWand() {
  if (!G || G.done) return;
  const u = unfilled();
  if (!u.length) return;
  if (!spend(CFG.magicWandCost)) return;
  for (let k = 0; k < 3; k++) {
    const arr = unfilled();
    if (!arr.length) break;
    fillCell(arr[(Math.random() * arr.length) | 0], true);
  }
  SFX.hint();
  checkAutoSolve();
  checkDone();
}

function checkDone() {
  if (G && G.words.every(x => x.solved) && !G.done) setTimeout(levelComplete, 700);
}

function showBonusChest() {
  if (!G) return;
  const list = [...G.foundBonus].map(dispG).join(", ") || "—";
  toast("💎 " + list);
}

/* ---------- SEVİYE SONU ---------- */

function levelComplete() {
  if (!G || G.done) return;
  G.done = true;
  const st = starsFor(G.mistakes, G.hints);
  const prev = S.stars[G.lv.id] || 0;
  S.stars[G.lv.id] = Math.max(prev, st); // proxy otomatik save
  S.stats.levelsDone = Math.max(S.stats.levelsDone, Object.keys(S.stars).length);
  confetti(140);
  SFX.win();
  vibrate([50, 60, 50, 60, 120]);

  const isLast = G.lv.id >= LEVELS[LEVELS.length - 1].id;
  openPanel(`
    <h2>Декъал! 🎉</h2>
    <div class="stars-row" id="stars-row"><span>⭐</span><span>⭐</span><span>⭐</span></div>
    <div class="reward-line"><span>ТӀегӀа</span><b>${G.lv.id + 1}</b></div>
    <div class="reward-line"><span>Кхочушдина дешнаш</span><b>${G.words.length}</b></div>
    <div class="reward-line"><span>Бонус дешнаш 💎</span><b>${G.foundBonus.size}</b></div>
    <div class="reward-line"><span>Карина сом</span><b>+${G.earned} 🪙</b></div>
    <div class="btnrow">
      <button class="btn small ghost" id="lc-map">Карта</button>
      ${isLast ? "" : `<button class="btn small" id="lc-next">Кхин дӀа ▶</button>`}
    </div>`);

  const row = document.getElementById("stars-row").children;
  for (let i = 0; i < st; i++) setTimeout(() => { row[i].classList.add("lit"); SFX.coin(); }, 400 + i * 350);
  document.getElementById("lc-map").onclick = () => { closePanel(); goToMap(); };
  const nx = document.getElementById("lc-next");
  if (nx) nx.onclick = () => { closePanel(); startLevel(G.lv.id + 1); };
}

/** Map'e git (dinamik import ile sirküler bağımlılığı kır) */
function goToMap() {
  import("./map.js").then(m => m.openMap());
}

/* ---------- İNİTİALİZASYON ---------- */

function initGameScreens() {
  document.getElementById("map-back").onclick = () => {
    import("./home.js").then(({ renderHome }) => { renderHome(); show("scr-home"); });
  };

  document.getElementById("game-back").onclick = goToMap;
  document.getElementById("game-settings").onclick = () => {
    import("./settings.js").then(({ openSettings }) => openSettings());
  };

  document.getElementById("shuffle").onclick = shuffleWheel;
  document.getElementById("hint-letter").onclick = hintLetter;
  document.getElementById("hint-target").onclick = hintTarget;
  document.getElementById("hint-wand").onclick = hintWand;
  document.getElementById("bonus-chest").onclick = showBonusChest;

  setupWheelListeners();
}

// Yeniden boyutlandırmada grid'i yeniden inşa et
addEventListener("resize", () => {
  if (G && document.getElementById("scr-game").classList.contains("on")) {
    const filled = [...G.cells.values()].filter(c => c.filled);
    buildGrid();
    filled.forEach(c => { c.filled = false; fillCell(c, c.hint); });
  }
});

export { G, bubbles, startLevel, setupWheelListeners, initGameScreens, buildGrid, fillCell };
