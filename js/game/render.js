// @ts-check
/* ================= RENDER =================
 * DOM oluşturma ve güncelleme: ızgara, hücreler, harf çarkı (wheel),
 * baloncuklar, seçim önizleme. Bu modül state.js'ten okur, DOM'a yazar. */

import { t } from "../utils/i18n.js";
import { dispG, norm } from "../engine/grapheme.js";
import { SFX } from "../engine/audio.js";
import { getState, getBubbles } from "./state.js";

/* Mobil (dokunmatik) düzen: çark büyük (parmak hedefi), ızgara kompakt.
 * Her çağrıda okunur — masaüstünde touch ekran takılıp çıkabilir. */
function isCoarse() {
  return typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
}

/* ---------- ÖNİZLEME (renderSel için önbellek) ---------- */
let _capEl = null;
let _capSpans = [];
let _polylineEl = null; // SVG polyline cache — her pointermove'da querySelector yapma

function _ensureCap() {
  if (!_capEl) {
    _capEl = document.createElement("div");
    _capEl.className = "cap";
  }
  return _capEl;
}

function _updateCap(sel) {
  const pv = document.getElementById("preview");
  if (!sel.length) {
    // Önbelleği temizle; pv.innerHTML = "" garanti boşaltır
    _capEl = null;
    _capSpans = [];
    pv.innerHTML = "";
    return;
  }
  if (!_capEl) _ensureCap();
  // Mevcut span'leri güncelle veya yenilerini ekle
  while (_capSpans.length < sel.length) {
    const s = document.createElement("span");
    _capSpans.push(s);
    _capEl.appendChild(s);
  }
  for (let i = 0; i < sel.length; i++) {
    _capSpans[i].textContent = dispG(sel[i].letter);
  }
  // Fazla span'leri gizle
  for (let i = sel.length; i < _capSpans.length; i++) {
    _capSpans[i].textContent = "";
  }
  if (!_capEl.parentNode) pv.appendChild(_capEl);
}

/* ---------- IZGARA ---------- */

export function buildGrid() {
  const G = getState();
  if (!G) return;
  const wrap = document.getElementById("grid-wrap");
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", t("game.gridLabel"));

  let maxR = 0, maxC = 0;
  for (const c of G.cells.values()) {
    maxR = Math.max(maxR, c.r);
    maxC = Math.max(maxC, c.c);
  }
  const rows = maxR + 1, cols = maxC + 1;
  const availW = Math.min(wrap.clientWidth - 8, 536);
  const availH = wrap.clientHeight - 8;
  const gap = 5;
  // Küçük ızgaralar geniş/uzun ekranlarda kaybolmasın: az hücre varsa üst sınır büyür.
  // Mobilde hücreler daha kompakt — dikey alan çarka bırakılır.
  const coarse = isCoarse();
  const maxSize = (rows <= 4 && cols <= 5) ? (coarse ? 56 : 76)
    : (rows <= 6 && cols <= 7) ? (coarse ? 46 : 62)
      : (coarse ? 40 : 52);
  const size = Math.max(22, Math.min(maxSize, Math.floor(Math.min(
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
    el.setAttribute("role", "gridcell");
    el.setAttribute("tabindex", "0");
    el.dataset.row = cell.r;
    el.dataset.col = cell.c;
    el.setAttribute("aria-label", t("game.cellPos", cell.r + 1, cell.c + 1));
    // Listener'lar input.js'ten takılır; sadece click handler burada
    // çünkü her hücre kendi callback'ini bilmeli
    cell.el = el;
    grid.appendChild(el);
  }
}

/**
 * Hücreyi doldur
 * @param {import("./state.js").CellData} cell
 * @param {boolean} [hint=false]
 */
export function fillCell(cell, hint = false) {
  if (cell.filled) return;
  cell.filled = true;
  cell.hint = hint;
  if (!cell.el) return;
  cell.el.textContent = dispG(cell.ch);
  cell.el.classList.add("fill");
  if (hint) cell.el.classList.add("hintfill");
  // doldurulmuş hücrenin aria-label'ını harfle güncelle (ekran okuyucu)
  cell.el.setAttribute("aria-label",
    t("game.cellFilled", cell.r + 1, cell.c + 1, dispG(cell.ch)));
}

/* ---------- ÇARK (WHEEL) ---------- */

/**
 * @param {string[]} letters
 * @param {(b: any) => void} [onBubbleKey] - baloncuk klavye handler'ı (input.js bağlar)
 */
export function buildWheel(letters, onBubbleKey) {
  const wheel = document.getElementById("wheel");
  wheel.querySelectorAll(".bub").forEach((b) => b.remove());
  _polylineEl = null; // wheel yeniden oluştu, cache'i sıfırla
  const n = letters.length;
  const zone = document.getElementById("wheel-zone");
  // Mobilde çark ekran genişliğini neredeyse tamamen kullanır (büyük parmak
  // hedefleri). Zone yüksekliğine bakılmaz — zone çarka göre boyutlanır
  // (döngüsel ölçüm); onun yerine sabit şeritler (başlık, bilgi, araçlar,
  // önizleme) gerçek DOM'dan ölçülür (safe-area ve kompakt mod farkları
  // cihazdan cihaza değişir), ızgaraya asgari pay bırakılır, kalan çarka.
  // Masaüstünde eski kompakt ölçü korunur.
  let D;
  if (isCoarse()) {
    let fixed = 14; // zone dikey padding'i
    const scr = document.getElementById("scr-game");
    if (scr) {
      for (const el of scr.children) {
        if (el.id !== "grid-wrap" && el.id !== "wheel-zone") fixed += el.offsetHeight;
      }
    }
    const gridBudget = Math.max(96, innerHeight * 0.16);
    D = Math.max(220, Math.min(430, Math.min(
      innerWidth - 20,
      innerHeight - fixed - gridBudget,
    )));
  } else {
    D = Math.max(190, Math.min(340, Math.min(
      innerWidth - 40,
      Math.max(zone.clientHeight || 260, 200) + 60,
    )));
  }
  wheel.style.width = wheel.style.height = D + "px";

  const svg = wheel.querySelector("svg");
  svg.setAttribute("viewBox", "0 0 " + D + " " + D);
  svg.innerHTML = "<polyline points=''/>";

  // Baloncuk boyutu çark çapıyla orantılı: büyük çarkta boş görünmesin
  const bs = Math.max(30, Math.min(D * 0.21, (D * 2.55) / n));
  const R = D / 2 - bs / 2 - 7;

  // Karıştır butonu çarkla orantılı ölçeklensin (ikon boyutu CSS % ile)
  const sh = document.getElementById("shuffle");
  const shs = Math.round(Math.max(44, Math.min(64, D * 0.17)));
  sh.style.width = sh.style.height = shs + "px";

  // wheel'in viewport koordinatlarını bir kez oku; tüm balonlar için
  // cx/cy/r'yi buradan türet. Sonradan her pointermove'da getBoundingClientRect
  // çağırmaya gerek kalmaz.
  const wheelRect = wheel.getBoundingClientRect();
  const wox = wheelRect.left;
  const woy = wheelRect.top;
  const rad = bs / 2 + 6;

  const bubbles = getBubbles();
  bubbles.length = 0;
  letters.forEach((L, i) => {
    const ang = -Math.PI / 2 + i * (2 * Math.PI / n);
    const x = D / 2 + R * Math.cos(ang);
    const y = D / 2 + R * Math.sin(ang);
    const el = document.createElement("div");
    el.className = "bub";
    el.style.animationDelay = (i * 35) + "ms"; // kademeli pop-in
    el.style.width = el.style.height = bs + "px";
    el.style.left = (x - bs / 2) + "px";
    el.style.top = (y - bs / 2) + "px";
    el.style.fontSize = (L.length > 1 ? bs * 0.42 : bs * 0.5) + "px";
    el.textContent = dispG(L);
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", t("game.letterLabel", dispG(L)));
    if (onBubbleKey) {
      el.addEventListener("keydown", (e) => onBubbleKey(e, el));
    }
    wheel.appendChild(el);
    bubbles.push({
      el, letter: norm(L), x, y, idx: i,
      // viewport-space cache: getBoundingClientRect yerine doğrudan bunları oku
      cx: wox + x, cy: woy + y, r: rad,
    });
  });
}

export function shuffleWheel() {
  const G = getState();
  if (!G) return;
  const ls = G.lv.letters.slice();
  for (let i = ls.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [ls[i], ls[j]] = [ls[j], ls[i]];
  }
  buildWheel(ls);
  // çark tam tur döner; bubIn animasyonlarıyla karışmasın diye ada göre filtrele
  const wheel = document.getElementById("wheel");
  wheel.classList.remove("shuffling");
  void wheel.offsetWidth; // animasyonu yeniden tetikle
  wheel.classList.add("shuffling");
  wheel.addEventListener("animationend", function h(e) {
    if (e.animationName !== "wheelShuffle") return;
    wheel.classList.remove("shuffling");
    wheel.removeEventListener("animationend", h);
  });
  SFX.coin();
}

/* ---------- SEÇİM ÖNİZLEME ---------- */

export function renderSel() {
  const G = getState();
  if (!G) return;
  _updateCap(G.sel);
  if (!_polylineEl) _polylineEl = document.querySelector("#wheel svg polyline");
  if (!_polylineEl) return;
  // Balon x/y çark-izafidir; SVG viewBox çark boyutuna eşit, doğrudan kullan
  _polylineEl.setAttribute("points", G.sel.map((b) => b.x + "," + b.y).join(" "));
}

/** Seçimi temizle (görsel + state). */
export function clearSel(cls = "") {
  const G = getState();
  const _bubbles = getBubbles();
  if (!G) return () => {};
  if (_capEl && cls) _capEl.classList.add(cls);
  return () => {
    _bubbles.forEach((x) => x.el.classList.remove("sel"));
    G.sel = [];
    renderSel();
  };
}
