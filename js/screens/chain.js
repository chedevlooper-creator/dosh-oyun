// @ts-check
/* ================= KELİME ZİNCİRİ EKRANI =================
 * Zincir modunun UI'ı. Tam ekran modal yerine ayrı bir section
 * olabilirdi, ama tek-akış oyun için modal yeterli. */

import { S } from "../engine/store.js";
import { openPanel, closePanel } from "./panel.js";
import { $ } from "../utils/helpers.js";
import { t } from "../utils/i18n.js";
import { SFX } from "../engine/audio.js";
import { dispG } from "../engine/grapheme.js";
import {
  startChain, submitChainWord, chainError, endChain, isChainActive, getChainState,
  setChainWordPool,
} from "../game/chain.js";
import { loadAllLevels } from "../data/level-loader.js";

/** İlk açılışta kelime havuzunu kur (INFO + pack bonus). */
let _poolReady = null;
function ensurePool() {
  if (_poolReady) return _poolReady;
  _poolReady = (async () => {
    const levels = await loadAllLevels();
    const set = new Set();
    for (const lv of levels) {
      for (const b of (lv.bonus || [])) set.add(String(b).toLowerCase().trim());
    }
    // INFO'yu dynamic import et (test ortamında require)
    try {
      const { INFO } = await import("../data/info.js");
      for (const k of Object.keys(INFO)) set.add(k.toLowerCase().trim());
    } catch {}
    setChainWordPool([...set]);
  })();
  return _poolReady;
}

function _buildPanelHtml(state) {
  const last = state.lastLetter ? dispG(state.lastLetter) : "—";
  return `
    <h2>${t("chain.title")} 🔗</h2>
    <p class="panel-subtitle">${t("chain.desc")}</p>
    <div class="chain-status">
      <div class="chain-stat"><div class="v">${state.score}</div><div class="k">${t("chain.score")}</div></div>
      <div class="chain-stat big"><div class="v">${last}</div><div class="k">${t("chain.nextLetter")}</div></div>
      <div class="chain-stat"><div class="v">${state.words.length}</div><div class="k">${t("chain.length")}</div></div>
    </div>
    ${state.errors > 0 ? `<p class="chain-warn">⚠️ ${t("chain.errors", state.errors, 2)}</p>` : ""}
    <input type="text" id="chain-input" autocomplete="off" autocapitalize="none" spellcheck="false"
      placeholder="${t("chain.placeholder")}" class="chain-input"
      aria-label="${t("chain.placeholder")}">
    <div class="chain-last" id="chain-last">${t("chain.last")}: ${state.words.slice(-3).map(dispG).join(" → ") || "—"}</div>
    <div class="btnrow">
      <button class="btn small ghost" id="chain-quit">${t("chain.quit")}</button>
    </div>
  `;
}

function _attachHandlers() {
  const input = $("chain-input");
  if (!input) return;
  // otomatik odak
  setTimeout(() => input.focus(), 50);

  const submit = () => {
    const raw = input.value;
    input.value = "";
    if (!raw) return;
    const r = submitChainWord(raw);
    if (r.ok) {
      SFX.solve();
      _refresh();
    } else {
      const e = chainError();
      SFX.bad();
      if (e.ended) {
        _showEnd();
      } else {
        _refresh();
      }
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  });
  $("chain-quit").onclick = () => {
    if (isChainActive()) endChain();
    closePanel();
  };
}

function _refresh() {
  const state = getChainState();
  if (!state) { _showEnd(); return; }
  const panel = document.getElementById("panel");
  if (!panel) return;
  // Hafif yenileme: sadece durum bölümünü güncelle
  const status = panel.querySelector(".chain-status");
  const last = panel.querySelector(".chain-last");
  if (status) {
    const lastG = state.lastLetter ? dispG(state.lastLetter) : "—";
    status.innerHTML = `
      <div class="chain-stat"><div class="v">${state.score}</div><div class="k">${t("chain.score")}</div></div>
      <div class="chain-stat big"><div class="v">${lastG}</div><div class="k">${t("chain.nextLetter")}</div></div>
      <div class="chain-stat"><div class="v">${state.words.length}</div><div class="k">${t("chain.length")}</div></div>`;
  }
  if (last) {
    last.textContent = `${t("chain.last")}: ${state.words.slice(-3).map(dispG).join(" → ") || "—"}`;
  }
  // Hata uyarısı
  const oldWarn = panel.querySelector(".chain-warn");
  if (oldWarn) oldWarn.remove();
  if (state.errors > 0) {
    const warn = document.createElement("p");
    warn.className = "chain-warn";
    warn.textContent = `⚠️ ${t("chain.errors", state.errors, 2)}`;
    const input = $("chain-input");
    if (input && input.parentNode) input.parentNode.insertBefore(warn, input);
  }
  setTimeout(() => $("chain-input")?.focus(), 10);
}

function _showEnd() {
  // endChain zaten S.stats'a yazdı
  const best = S.stats.chainBest || 0;
  const longest = S.stats.chainLongest || 0;
  const games = S.stats.chainGames || 0;
  openPanel(`
    <h2>${t("chain.endTitle")} 🎉</h2>
    <p class="panel-subtitle">${t("chain.endDesc")}</p>
    <div class="stat-grid">
      <div class="stat-card"><div class="v">${best}</div><div class="k">${t("chain.bestScore")}</div></div>
      <div class="stat-card"><div class="v">${longest}</div><div class="k">${t("chain.bestLength")}</div></div>
      <div class="stat-card"><div class="v">${games}</div><div class="k">${t("chain.gamesPlayed")}</div></div>
    </div>
    <div class="btnrow">
      <button class="btn small ghost" id="chain-retry">${t("chain.retry")}</button>
      <button class="btn small" id="chain-home">${t("chain.home")}</button>
    </div>`);
  $("chain-retry").onclick = () => openChain();
  $("chain-home").onclick = () => {
    closePanel();
    import("./home.js").then(({ renderHome }) => { renderHome(); });
  };
}

export async function openChain() {
  await ensurePool();
  const start = startChain();
  if (!start) {
    // havuz boş
    openPanel(`<h2>${t("chain.title")}</h2><p>${t("chain.empty")}</p>`);
    return;
  }
  openPanel(_buildPanelHtml(getChainState()));
  _attachHandlers();
  SFX.coin();
}
