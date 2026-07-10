// @ts-check
/* ================= TIME ATTACK =================
 * 60 saniyede mümkün olduğunca çok kelime çöz. Yeni oyun modu.
 * - Pool: packs 1-3'ten (kolay-orta), 50 seviye
 * - Skor: her kelime = 10 puan, bonus = 25, 3+ combo = 1.5x multiplier
 * - Local leaderboard: localStorage'a top 5 kaydedilir
 *
 * Bu modül, normal startLevel'den farklı bir state yönetimi gerektirir;
 * game/state.js ile aynı G state'i kullanır ama farklı bir timer ekler. */

import { S } from "../engine/store.js";
import { CFG } from "../data/config.js";
import { t } from "../utils/i18n.js";
import { SFX } from "../engine/audio.js";
import { show, updateCoins, toast, flyCoins } from "../utils/helpers.js";
import { initState, getState } from "./state.js";
import { buildWheel, buildGrid, fillCell } from "./render.js";
import { attachCellHandlers, onBubbleKey } from "./input.js";
import { submitSel, selAdd } from "./solve.js";
import { showWordInfo } from "./reward.js";
import { openPanel, closePanel } from "../screens/panel.js";
import { getLevel, loadAllLevels } from "../data/level-loader.js";

const TIME_LIMIT_MS = 60_000;
const POOL_PACKS = [1, 2, 3];
const POOL_SIZE = 50;
const STORAGE_KEY = "dosh-ta-best";
const COMBO_MULT = 1.5;

/**
 * @typedef {Object} TAState
 * @property {number} startMs
 * @property {number} remaining
 * @property {number} score
 * @property {number} streak
 * @property {number} best
 * @property {Array<{ score: number, date: string, words: number }>} leaderboard
 * @property {number} tickHandle
 * @property {number} levelIndex
 * @property {Array<{ id: number, lv: any }>} pool
 * @property {number} totalWords
 */

/** @type {TAState|null} */
let ta = null;

/** RNG helper: pool için deterministik ama session-içi farklı */
function pickLevel(levels) {
  if (!levels.length) return null;
  return levels[(Math.random() * levels.length) | 0];
}

/** localStorage'dan leaderboard oku. */
export function getLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/** Score'u leaderboard'a ekle, top 5'i döndür. */
function pushLeaderboard(score, words) {
  const list = getLeaderboard();
  list.push({
    score,
    words,
    date: new Date().toISOString().slice(0, 10),
  });
  list.sort((a, b) => b.score - a.score);
  const top = list.slice(0, 5);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(top));
  } catch { /* ignore */ }
  return top;
}

/** Pool: 50 seviye, packs 1-3'ten deterministik karışık. */
function buildPool(allLevels) {
  const filtered = allLevels.filter((lv) => POOL_PACKS.includes(lv.pack ?? 1));
  const pool = [];
  for (let i = 0; i < POOL_SIZE && filtered.length; i++) {
    const lv = pickLevel(filtered);
    if (!lv) break;
    pool.push({ id: lv.id, lv });
  }
  return pool;
}

/**
 * Yeni oyun başlat.
 * @param {any[]} allLevels - Tüm seviyeler
 * @param {number} bestStreak - Oyuncunun mevcut best streak'i
 */
export async function startTimeAttack(allLevels, bestStreak = 0) {
  if (!allLevels || !allLevels.length) {
    toast("ТӀегӀаш цакарийна 😕", "bad");
    return;
  }

  const pool = buildPool(allLevels);
  if (!pool.length) {
    toast("Пул цакарийна", "bad");
    return;
  }

  ta = {
    startMs: performance.now(),
    remaining: TIME_LIMIT_MS,
    score: 0,
    streak: 0,
    best: bestStreak,
    leaderboard: getLeaderboard(),
    tickHandle: 0,
    levelIndex: 0,
    pool,
    totalWords: 0,
  };

  // İlk seviyeyi yükle
  await loadNextTA(pool[0].id);
  showTAScreen();
  startTATick();
}

/** Time Attack UI'sını göster (oyun ekranı üzerine sayaç + skor). */
function showTAScreen() {
  if (!ta) return;
  // Mevcut oyun ekranını kullan, ek bilgileri göster
  let bar = document.getElementById("ta-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "ta-bar";
    bar.className = "ta-bar";
    bar.setAttribute("role", "status");
    bar.setAttribute("aria-live", "polite");
    const game = document.getElementById("scr-game");
    const gtop = game?.querySelector(".gtop");
    if (gtop) gtop.appendChild(bar);
  }
  updateTABar();
}

/** Sayaç + skor barını güncelle. */
export function updateTABar() {
  if (!ta) return;
  const bar = document.getElementById("ta-bar");
  if (!bar) return;
  const sec = Math.max(0, Math.ceil(ta.remaining / 1000));
  const pct = Math.max(0, Math.min(100, (ta.remaining / TIME_LIMIT_MS) * 100));
  bar.innerHTML = `
    <div class="ta-time" style="--p:${pct}%" aria-label="Kalan süre ${sec} saniye">
      <span>⏱ ${sec}s</span>
    </div>
    <div class="ta-score">Skor: <b>${ta.score}</b> · Streak: <b>${ta.streak}</b></div>`;
}

/** Periyodik tick: geri sayım + ekran güncelleme. */
function startTATick() {
  if (!ta) return;
  ta.tickHandle = setInterval(() => {
    if (!ta) return;
    ta.remaining = Math.max(0, TIME_LIMIT_MS - (performance.now() - ta.startMs));
    updateTABar();
    if (ta.remaining <= 0) endTimeAttack();
  }, 200);
}

/** Süre bitti — final skor, leaderboard. */
function endTimeAttack() {
  if (!ta) return;
  clearInterval(ta.tickHandle);
  ta.tickHandle = 0;
  const score = ta.score;
  const words = ta.totalWords;
  const newLb = pushLeaderboard(score, words);
  ta.leaderboard = newLb;
  toast(t("ta.end", score, words), "gold");
  SFX.win();
  // Skoru kalıcı kayda yaz
  S.stats.taGames = (S.stats.taGames || 0) + 1;
  if (score > (S.stats.taBest || 0)) {
    S.stats.taBest = score;
    S.stats.taWords = words;
  }
  // share text
  const share = `Dosh Time Attack: ${score} puan, ${words} kelime 🪙⏱`;
  try {
    if (navigator.share) navigator.share({ text: share }).catch(() => {});
  } catch { /* ignore */ }
  // leaderboard modal'ı aç
  showLeaderboardModal(newLb, score);
  // state temizliği
  ta = null;
}

/** Leaderboard modal'ı göster. */
function showLeaderboardModal(lb, lastScore) {
  const items = lb.map((e, i) => `
    <li class="ta-lb-row ${e.score === lastScore && e.date === new Date().toISOString().slice(0,10) ? 'ta-lb-new' : ''}">
      <span class="ta-lb-rank">#${i + 1}</span>
      <span class="ta-lb-score">${e.score}</span>
      <span class="ta-lb-words">${e.words} д</span>
      <span class="ta-lb-date">${e.date}</span>
    </li>
  `).join("");
  const html = `
    <h2>${t("ta.title")} ⏱</h2>
    <p class="panel-subtitle">${t("ta.desc")}</p>
    <ol class="ta-lb">${items || "<li>—</li>"}</ol>
    <div class="btnrow">
      <button class="btn small ghost" id="ta-retry">${t("ta.retry")}</button>
      <button class="btn small" id="ta-home">${t("ta.home")}</button>
    </div>
  `;
  openPanel(html);
  document.getElementById("ta-retry").onclick = () => {
    closePanel();
    // Yeniden başlat
    loadAllLevels().then((lv) => startTimeAttack(lv, S.stats?.bestStreak || 0));
  };
  document.getElementById("ta-home").onclick = () => {
    closePanel();
    import("../screens/home.js").then(({ renderHome }) => { renderHome(); show("scr-home"); });
  };
}

/** Sonraki seviyeyi yükle (mevcut state'i yeniden kurar). */
async function loadNextTA(levelId) {
  const lv = await getLevel(levelId).catch(() => null);
  if (!lv || !ta) return;

  initState(lv, { timeAttack: true });

  document.getElementById("lvl-num").textContent = (ta.levelIndex + 1) + "/" + ta.pool.length;
  document.getElementById("bonus-count").textContent = "0";
  show("scr-game");

  const G = getState();
  if (!G) return;

  // wheel + grid
  buildWheel(lv.letters.slice(), (e, el) => onBubbleKey(e, el, selAdd, () => submitSel()));
  requestAnimationFrame(() => {
    buildGrid();
    const curG = getState();
    if (!curG) return;
    for (const cell of curG.cells.values()) {
      if (!cell.el) continue;
      attachCellHandlers(cell.el, cell, (c) => {
        if (!curG.targeting && c.filled) {
          const w = curG.words.find((x) => x.solved && x.cells.includes(c));
          if (w) { showWordInfo(w); SFX.pick(0); }
          return;
        }
        if (!curG.targeting) return;
        curG.targeting = false;
        if (S.coins < CFG.targetHintCost) return;
        S.coins -= CFG.targetHintCost;
        fillCell(c, true);
        updateCoins();
      });
    }
  });
}

/**
 * Time Attack modunda kelime çözüldü: skor + streak güncelle.
 * game/index.js'den çağrılır.
 */
export function recordTAScore(wordNorm) {
  if (!ta) return;
  ta.totalWords++;
  ta.streak++;
  let points = 10 * (wordNorm.length);
  if (ta.streak % 5 === 0) {
    points = Math.floor(points * COMBO_MULT);
  }
  ta.score += points;
  updateTABar();
  SFX.coin();
  flyCoins(document.getElementById("grid"), 2);
}

/**
 * Mevcut seviyenin tüm kelimeleri çözüldüyse bir sonraki seviyeye atla.
 * solveWord'dan sonra, checkDone kontrolünden önce çağrılır.
 * Time Attack modunda standart levelComplete modal'ı gösterilmez —
 * bunun yerine sessizce sonraki seviyeye geçilir.
 */
export async function advanceTALevel() {
  if (!ta) return;
  const G = getState();
  if (!G) return;
  const allSolved = G.words.every((w) => w.solved);
  if (!allSolved) return;

  // seviyeyi ilerlet
  ta.levelIndex++;
  if (ta.levelIndex >= ta.pool.length) {
    // havuz bitti — yeni rasgele seviyelerle doldur
    const allLevels = await loadAllLevels();
    const filtered = allLevels.filter((lv) => POOL_PACKS.includes(lv.pack ?? 1));
    for (let i = 0; i < POOL_SIZE && filtered.length; i++) {
      const lv = filtered[(Math.random() * filtered.length) | 0];
      ta.pool.push({ id: lv.id, lv });
    }
  }
  const next = ta.pool[ta.levelIndex];
  await loadNextTA(next.id);
  toast(`⏱ Seviye ${ta.levelIndex + 1}`, "gold");
}

/** Time Attack aktif mi? */
export function isTimeAttack() {
  return ta !== null;
}

/** Time Attack durumunu sıfırla (back tuşu, vb.) */
export function resetTimeAttack() {
  if (ta?.tickHandle) clearInterval(ta.tickHandle);
  ta = null;
  const bar = document.getElementById("ta-bar");
  if (bar) bar.remove();
}
