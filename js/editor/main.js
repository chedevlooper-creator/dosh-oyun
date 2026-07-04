/* ================= DOSH LEVEL EDITOR ================= */
/* Oyuna entegre versiyon — ../../css/editor.css ile kullanılır */

import { norm, splitG, dispG, DSET } from "../engine/grapheme.js";
import { LEVELS } from "../data/levels.js";

/* ================= STATE ================= */

const state = {
  id: 0, pack: 0, rows: 4, cols: 4,
  grid: [],        // grid[r][c] = normalized grapheme string or ""
  words: [],       // { word, row, col, dir }[]
  bonus: [],       // string[]
  extraLetters: [],// string[]
  wordDefMode: false,
  wordDefStart: null,
};

/* ================= DOM REFS ================= */

const $ = (id) => document.getElementById(id);
const gridTable = $("grid");
const valMsg = $("validation-msg");

/* ================= GRID ================= */

function initGrid(rows, cols) {
  state.rows = rows; state.cols = cols;
  state.grid = Array.from({ length: rows }, () => Array(cols).fill(""));
}

function renderGrid() {
  gridTable.innerHTML = "";
  for (let r = 0; r < state.rows; r++) {
    const tr = document.createElement("tr");
    for (let c = 0; c < state.cols; c++) {
      const td = document.createElement("td");
      td.dataset.r = r; td.dataset.c = c;
      const input = document.createElement("input");
      input.className = "cell-input";
      input.type = "text"; input.maxLength = 2;
      input.value = dispG(state.grid[r][c]);
      input.placeholder = "·";
      input.addEventListener("blur", () => {
        input.value = dispG(state.grid[r][c]);
        td.classList.remove("active");
      });
      input.addEventListener("input", () => {
        const raw = input.value, n = norm(raw);
        if (!n.length) state.grid[r][c] = "";
        else if (n.length === 1) state.grid[r][c] = n;
        else if (n.length === 2) state.grid[r][c] = DSET.has(n) ? n : n[0];
        else state.grid[r][c] = n[0];
        input.value = dispG(state.grid[r][c]);
        td.className = state.grid[r][c] ? "filled" : "";
        if (findCellConflicts(r, c).length) td.classList.add("conflict");
        updateAll();
      });
      input.addEventListener("keydown", (e) => {
        if ((e.key === "Backspace" || e.key === "Delete") && !input.value.length) {
          e.preventDefault();
          state.grid[r][c] = ""; updateAll();
          moveTo(r, c - 1);
        }
        if (["ArrowRight","ArrowLeft","ArrowDown","ArrowUp","Enter","Tab"].includes(e.key)) {
          e.preventDefault();
          const dirs = { ArrowRight: [0,1], ArrowLeft: [0,-1], ArrowDown: [1,0], ArrowUp: [-1,0], Enter: [0,1], Tab: [0,1] };
          const [dr, dc] = dirs[e.key] || [0,0];
          moveTo(r + dr, c + dc);
        }
      });
      td.appendChild(input);
      if (state.grid[r][c]) td.classList.add("filled");
      if (findCellConflicts(r, c).length) td.classList.add("conflict");
      tr.appendChild(td);
    }
    gridTable.appendChild(tr);
  }
  renderWordMarkers();
}

function moveTo(r, c) {
  if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return;
  const inp = gridTable.querySelector(`td[data-r="${r}"][data-c="${c}"] .cell-input`);
  if (inp) { inp.focus(); inp.select(); }
}

/* ================= WORD DEFINITION ================= */

$("btn-def-word").addEventListener("click", () => {
  if (state.wordDefMode) { exitWordDef(); return; }
  enterWordDef();
});

function enterWordDef() {
  state.wordDefMode = true; state.wordDefStart = null;
  $("btn-def-word").textContent = "İptal";
  valMsg.textContent = "Başlangıç hücresine tıkla..."; valMsg.className = "ok";
}

function exitWordDef() {
  state.wordDefMode = false; state.wordDefStart = null;
  $("btn-def-word").textContent = "Kelime Tanımla";
  gridTable.querySelectorAll("td").forEach(td => td.style.outline = "");
  valMsg.textContent = "—"; valMsg.className = "";
}

gridTable.addEventListener("click", (e) => {
  const td = e.target.closest("td");
  if (!td) return;
  const r = +td.dataset.r, c = +td.dataset.c;

  if (!state.wordDefMode) {
    const inp = td.querySelector(".cell-input");
    if (inp) { inp.focus(); inp.select(); }
    return;
  }

  e.preventDefault();

  if (!state.wordDefStart) {
    if (!state.grid[r][c]) { valMsg.textContent = "Önce harf yerleştir!"; valMsg.className = "err"; return; }
    state.wordDefStart = { r, c };
    td.style.outline = "3px solid var(--accent2)";
    valMsg.textContent = `Başlangıç: (${r},${c}) → Bitiş hücresine tıkla`; valMsg.className = "ok";
    return;
  }

  const sr = state.wordDefStart.r, sc = state.wordDefStart.c;
  const dir = $("dir-select").value;
  const dr = dir === "down" ? 1 : 0, dc = dir === "across" ? 1 : 0;

  if ((dir === "across" && (r !== sr || c <= sc)) || (dir === "down" && (c !== sc || r <= sr))) {
    valMsg.textContent = `Bitiş hücresi yanlış yönde!`; valMsg.className = "err"; return;
  }

  const len = dir === "across" ? c - sc + 1 : r - sr + 1;
  if (len < 2) { valMsg.textContent = "En az 2 hücre!"; valMsg.className = "err"; return; }

  const gs = [];
  for (let i = 0; i < len; i++) {
    const nr = sr + i * dr, nc = sc + i * dc;
    if (!state.grid[nr][nc]) { valMsg.textContent = `Hücre (${nr},${nc}) boş!`; valMsg.className = "err"; return; }
    gs.push(state.grid[nr][nc]);
  }

  const word = gs.join("");
  const dup = state.words.some(w => w.word === word && w.row === sr && w.col === sc && w.dir === dir);
  if (dup) { valMsg.textContent = "Zaten var!"; valMsg.className = "err"; return; }

  state.words.push({ word, row: sr, col: sc, dir });
  exitWordDef();
  updateAll();
  valMsg.textContent = `✅ "${dispG(word)}" eklendi`; valMsg.className = "ok";
});

/* ================= LEVEL LOADER (from game data) ================= */

$("btn-load-level").addEventListener("click", () => {
  const id = prompt(`Level ID girin (0-${LEVELS.length - 1}):`, "0");
  if (id === null) return;
  const n = parseInt(id);
  if (isNaN(n) || n < 0 || n >= LEVELS.length) {
    valMsg.textContent = `❌ Geçersiz ID (0-${LEVELS.length - 1})`; valMsg.className = "err"; return;
  }
  const lv = LEVELS[n];
  importLevelData(lv);
  valMsg.textContent = `✅ Level ${lv.id} yüklendi: ${lv.words.length} kelime, ${(lv.bonus||[]).length} bonus`;
  valMsg.className = "ok";
});

function importLevelData(lv) {
  state.id = lv.id || 0;
  state.pack = lv.pack || 0;
  state.words = lv.words.map(w => ({ word: w.word, row: w.row, col: w.col, dir: w.dir || "across" }));
  state.bonus = lv.bonus || [];
  state.extraLetters = [];

  let maxR = 0, maxC = 0;
  for (const w of state.words) {
    const gs = splitG(w.word);
    const dr = w.dir === "down" ? 1 : 0, dc = w.dir === "across" ? 1 : 0;
    for (let i = 0; i < gs.length; i++) {
      maxR = Math.max(maxR, w.row + i * dr);
      maxC = Math.max(maxC, w.col + i * dc);
    }
  }

  initGrid(maxR + 1, maxC + 1);
  for (const w of state.words) {
    const gs = splitG(w.word);
    const dr = w.dir === "down" ? 1 : 0, dc = w.dir === "across" ? 1 : 0;
    for (let i = 0; i < gs.length; i++) {
      state.grid[w.row + i * dr][w.col + i * dc] = gs[i];
    }
  }

  $("lvl-id").value = state.id;
  $("lvl-pack").value = state.pack;
  $("grid-rows").value = state.rows;
  $("grid-cols").value = state.cols;
  updateAll();
}

/* ================= BONUS ================= */

$("btn-add-bonus").addEventListener("click", () => {
  const v = norm($("bonus-input").value);
  if (v.length < 2) { valMsg.textContent = "En az 2 grafem!"; valMsg.className = "err"; return; }
  if (state.bonus.includes(v)) { valMsg.textContent = "Zaten var!"; valMsg.className = "err"; return; }
  state.bonus.push(v);
  $("bonus-input").value = "";
  updateAll();
});
$("bonus-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-add-bonus").click(); });

/* ================= EXTRA LETTERS ================= */

$("btn-add-extra").addEventListener("click", () => {
  const parts = norm($("extra-input").value).split(/[\s,]+/).filter(Boolean);
  for (const p of parts) {
    if (p.length === 1 || (p.length === 2 && DSET.has(p))) state.extraLetters.push(p);
  }
  $("extra-input").value = "";
  updateAll();
});
$("extra-input").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-add-extra").click(); });

/* ================= RENDER ================= */

function renderWords() {
  const list = $("word-list"); list.innerHTML = "";
  $("word-count").textContent = state.words.length;
  state.words.forEach((w, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="word-text">${dispG(w.word)}</span> <span class="word-pos">(${w.row},${w.col})</span> <span class="word-dir">${w.dir === "across" ? "→" : "↓"}</span> <span class="del-btn" data-i="${i}">✕</span>`;
    li.querySelector(".del-btn").onclick = () => { state.words.splice(i,1); updateAll(); };
    list.appendChild(li);
  });
}

function renderBonus() {
  const list = $("bonus-list"); list.innerHTML = "";
  $("bonus-count").textContent = state.bonus.length;
  state.bonus.forEach((b, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="bonus-word">${dispG(b)}</span> <span class="del-btn" data-i="${i}">✕</span>`;
    li.querySelector(".del-btn").onclick = () => { state.bonus.splice(i,1); updateAll(); };
    list.appendChild(li);
  });
}

function renderExtra() {
  const list = $("extra-list"); list.innerHTML = "";
  $("extra-count").textContent = state.extraLetters.length;
  state.extraLetters.forEach((e, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="extra-word">${dispG(e)}</span> <span class="del-btn" data-i="${i}">✕</span>`;
    li.querySelector(".del-btn").onclick = () => { state.extraLetters.splice(i,1); updateAll(); };
    list.appendChild(li);
  });
}

function renderPool() {
  const counts = {};
  for (let r = 0; r < state.rows; r++)
    {for (let c = 0; c < state.cols; c++)
      {if (state.grid[r][c]) counts[state.grid[r][c]] = (counts[state.grid[r][c]] || 0) + 1;}}
  for (const ch of state.extraLetters) counts[ch] = (counts[ch] || 0) + 1;

  const pd = $("pool-display"); pd.innerHTML = "";
  $("pool-count").textContent = Object.values(counts).reduce((a,b) => a+b, 0);
  Object.entries(counts).sort((a,b) => a[0].localeCompare(b[0])).forEach(([ch, n]) => {
    const s = document.createElement("span");
    s.className = "pool-letter";
    s.textContent = dispG(ch) + (n > 1 ? `×${n}` : "");
    pd.appendChild(s);
  });
}

function renderWordMarkers() {
  gridTable.querySelectorAll(".word-start").forEach(td => td.classList.remove("word-start"));
  state.words.forEach((w, i) => {
    const td = gridTable.querySelector(`td[data-r="${w.row}"][data-c="${w.col}"]`);
    if (td) { td.classList.add("word-start"); td.dataset.wordIdx = String(i+1); }
  });
}

/* ================= VALIDATION ================= */

function findCellConflicts(r, c) {
  const ch = state.grid[r][c];
  if (!ch) return [];
  const out = [];
  for (const w of state.words) {
    const gs = splitG(w.word);
    const dr = w.dir === "down" ? 1 : 0, dc = w.dir === "across" ? 1 : 0;
    for (let i = 0; i < gs.length; i++) {
      if (w.row + i * dr === r && w.col + i * dc === c && norm(gs[i]) !== ch)
        {out.push({ word: w.word, expected: gs[i] });}
    }
  }
  return out;
}

function validate() {
  const errs = [];
  if (!state.words.length) return { ok: false, errors: ["En az 1 kelime tanımlanmalı"] };

  for (let i = 0; i < state.words.length; i++) {
    const w = state.words[i];
    const gs = splitG(w.word);
    if (gs.length < 2) { errs.push(`Kelime ${i+1}: "${dispG(w.word)}" çok kısa`); continue; }
    const dr = w.dir === "down" ? 1 : 0, dc = w.dir === "across" ? 1 : 0;
    for (let j = 0; j < gs.length; j++) {
      const r = w.row + j*dr, c = w.col + j*dc;
      if (r >= state.rows || c >= state.cols) { errs.push(`Kelime ${i+1}: taşma (${r},${c})`); continue; }
      if (!state.grid[r][c]) { errs.push(`Kelime ${i+1}: hücre (${r},${c}) boş`); continue; }
      if (norm(state.grid[r][c]) !== norm(gs[j])) errs.push(`Kelime ${i+1}: (${r},${c})'de ${dispG(state.grid[r][c])} var, ${dispG(gs[j])} bekleniyor`);
    }
  }

  const seen = new Set();
  for (const w of state.words) {
    const gs = splitG(w.word);
    const dr = w.dir === "down" ? 1 : 0, dc = w.dir === "across" ? 1 : 0;
    for (let i = 0; i < gs.length; i++) {
      const key = `${w.row + i*dr},${w.col + i*dc}`;
      if (seen.has(key)) {
        findCellConflicts(w.row + i*dr, w.col + i*dc).forEach(cf =>
          errs.push(`Çakışma: "${dispG(cf.expected)}"`));
      }
      seen.add(key);
    }
  }

  const wordSet = new Set();
  state.words.forEach(w => { const k = norm(w.word); if (wordSet.has(k)) errs.push(`Tekrar: "${dispG(w.word)}"`); wordSet.add(k); });

  const bonusSet = new Set();
  state.bonus.forEach(b => { const k = norm(b); if (bonusSet.has(k)) errs.push(`Bonus tekrar: "${dispG(b)}"`); bonusSet.add(k); });

  return { ok: !errs.length, errors: errs };
}

function renderValidation() {
  const r = validate();
  valMsg.innerHTML = ""; valMsg.className = "";
  if (r.ok && state.words.length) {
    valMsg.textContent = "✅ Her şey uyumlu! Export'a hazır."; valMsg.className = "ok";
  } else if (r.errors.length) {
    valMsg.className = "err";
    valMsg.textContent = "❌ " + r.errors.slice(0, 6).join("\n");
    if (r.errors.length > 6) valMsg.textContent += `\n...+${r.errors.length - 6} hata`;
  }
}

/* ================= UPDATE ALL ================= */

function updateAll() {
  renderGrid();
  renderWords();
  renderBonus();
  renderExtra();
  renderPool();
  renderValidation();
  renderWordMarkers();
  $("lvl-id").value = state.id;
  $("lvl-pack").value = state.pack;
}

/* ================= EXPORT / IMPORT ================= */

function exportLevel() {
  const r = validate();
  if (!r.ok && state.words.length && !confirm("Hatalar var. Yine de export?")) return;

  const counts = {};
  for (let r = 0; r < state.rows; r++)
    {for (let c = 0; c < state.cols; c++)
      {if (state.grid[r][c]) counts[state.grid[r][c]] = (counts[state.grid[r][c]] || 0) + 1;}}
  for (const ch of state.extraLetters) counts[ch] = (counts[ch] || 0) + 1;

  const pool = [];
  for (const [ch, n] of Object.entries(counts)) for (let i = 0; i < n; i++) pool.push(ch);

  const level = {
    id: state.id,
    letters: pool,
    words: state.words.map(w => ({ word: w.word, row: w.row, col: w.col, dir: w.dir })),
    bonus: state.bonus.length ? [...state.bonus] : [],
  };
  if (state.pack > 0) level.pack = state.pack;

  $("export-text").value = JSON.stringify(level, null, 2);
  $("export-modal").showModal();
}

$("btn-export").addEventListener("click", exportLevel);
$("modal-close").onclick = () => $("export-modal").close();
$("export-modal").addEventListener("click", (e) => { if (e.target === $("export-modal")) $("export-modal").close(); });
$("modal-copy").onclick = () => {
  const t = $("export-text");
  t.select();
  navigator.clipboard.writeText(t.value).then(() => {
    $("modal-copy").textContent = "Kopyalandı!";
    setTimeout(() => { $("modal-copy").textContent = "Kopyala"; }, 2000);
  });
};

$("btn-import").addEventListener("click", () => $("import-file").click());
$("import-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try { importLevelData(JSON.parse(ev.target.result)); }
    catch (err) { valMsg.textContent = "❌ JSON hatası: " + err.message; valMsg.className = "err"; }
  };
  reader.readAsText(file);
  e.target.value = "";
});

/* ================= UI CONTROLS ================= */

$("btn-resize").addEventListener("click", () => {
  const rows = +$("grid-rows").value || 4, cols = +$("grid-cols").value || 4;
  const ng = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => (state.grid[r] && state.grid[r][c]) || ""));
  state.rows = rows; state.cols = cols; state.grid = ng;
  exitWordDef(); updateAll();
});

$("btn-clear").addEventListener("click", () => {
  if (!confirm("Tüm veriyi temizle?")) return;
  state.words = []; state.bonus = []; state.extraLetters = [];
  exitWordDef();
  initGrid(state.rows, state.cols);
  updateAll();
  valMsg.textContent = "Temizlendi"; valMsg.className = "";
});

$("btn-validate").addEventListener("click", renderValidation);
$("lvl-id").addEventListener("change", () => { state.id = +$("lvl-id").value || 0; });
$("lvl-pack").addEventListener("change", () => { state.pack = +$("lvl-pack").value || 0; });

// Paste JSON via double-click on validation area
valMsg.addEventListener("dblclick", () => {
  const text = prompt("Level JSON yapıştır:");
  if (text) { try { importLevelData(JSON.parse(text)); } catch (err) { valMsg.textContent = "❌ " + err.message; valMsg.className = "err"; } }
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === "E") { e.preventDefault(); exportLevel(); }
  if (e.key === "Escape" && state.wordDefMode) exitWordDef();
});

/* ================= INIT ================= */

initGrid(4, 4);
$("grid-rows").value = 4; $("grid-cols").value = 4;
updateAll();
console.log("🏗️ Дош Editor (oyun içi) hazır! /editor");
