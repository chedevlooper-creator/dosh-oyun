// @ts-check
/* ================= REWARD =================
 * Seviye sonu / günlük bulmaca sonu: yıldız, coin, recap, share, panel açma.
 * Bu modül state.js'ten okur, store'a yazar, panel.js + helpers.js + daily.js
 * + audio/particles ile entegre olur. */

import { S } from "../engine/store.js";
import { starsFor } from "../data/config.js";
import { LAST_LEVEL_ID } from "../data/level-index.js";
import { t } from "../utils/i18n.js";
import { dispG } from "../engine/grapheme.js";
import { SFX } from "../engine/audio.js";
import { confetti } from "../fx/particles.js";
import { toast, vibrate, updateCoins, show } from "../utils/helpers.js";
import { openPanel, closePanel } from "../screens/panel.js";
import { recordDailyWin, dailyShareText } from "../engine/daily.js";
import { INFO } from "../data/info.js";
import { getState } from "./state.js";
import { track, EVENTS } from "../utils/analytics.js";

/**
 * Seviye içi ilerleme: çözülen/toplam kelime (üst barda, seviye numarasının yanında).
 */
export function updateWordProgress() {
  const el = document.getElementById("lvl-progress");
  const G = getState();
  if (!el || !G) return;
  const solved = G.words.filter((w) => w.solved).length;
  el.textContent = solved + "/" + G.words.length;
}

/**
 * Bilgi şeridinde kelimenin anlamını göster (çözüm anında + dolu hücreye dokununca).
 * @param {import("./state.js").ProcessedWord} w
 */
export function showWordInfo(w) {
  const strip = document.getElementById("info-strip");
  if (!strip) return;
  const info = INFO[w.norm];
  const ce = info ? (info.ce ?? "") : "";
  const tr = info ? (info.tr ?? "") : "";
  strip.innerHTML = `
    <div class="info-word">${dispG(w.norm)}</div>
    ${ce ? `<div class="info-line"><span class="lang">чеч.</span> ${dispG(ce)}</div>` : ""}
    ${tr ? `<div class="info-line"><span class="lang">тр.</span> ${dispG(tr)}</div>` : ""}`;
  strip.className = "on";
}

/**
 * Öğrenme özeti: seviyenin ana kelimeleri + INFO'daki anlamları.
 * Oyunu "çöz-geç"ten "çöz-öğren" döngüsüne çeviren kart.
 */
export function wordsRecapHTML() {
  const G = getState();
  if (!G) return "";
  const items = G.words.map((w) => {
    const info = INFO[w.norm];
    const ce = info && info.ce ? info.ce : "";
    const tr = info && info.tr ? info.tr : "";
    const gloss = (ce || tr)
      ? `${ce ? `<span class="lang">чеч.</span> ${dispG(ce)}` : ""}${tr ? ` <span class="lang">тр.</span> ${dispG(tr)}` : ""}`
      : `<span class="recap-miss">—</span>`;
    return `<div class="recap-item"><b>${dispG(w.norm)}</b><span class="recap-gloss">${gloss}</span></div>`;
  }).join("");
  return `<div class="panel-section">
    <div class="panel-section-title">Дешнаш 📖</div>
    <div class="recap-list">${items}</div>
  </div>`;
}

/**
 * Bonus kelime özetini toast ile göster.
 */
export function showBonusChest() {
  const G = getState();
  if (!G) return;
  const list = [...G.foundBonus].map(dispG).join(", ") || "—";
  toast(t("game.bonusChest", list));
}

/**
 * Coin sayacı animasyonu: 0'dan hedefe doğru akar (kübik easing).
 * @param {HTMLElement} el
 * @param {number} total
 */
export function animateCoinCounter(el, total) {
  if (!el) return;
  const t0 = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / 900);
    el.textContent = "+" + Math.round(total * (1 - Math.pow(1 - k, 3))) + " 🪙";
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/**
 * Yıldızları sırayla yak (panel açıldıktan sonra).
 * @param {HTMLElement} rowEl stars-row container
 * @param {number} st yıldız sayısı (0-3)
 */
export function animateStars(rowEl, st) {
  if (!rowEl) return;
  const row = rowEl.children;
  for (let i = 0; i < st; i++) {
    setTimeout(() => {
      row[i].classList.add("lit");
      SFX.coin();
    }, 400 + i * 350);
  }
}

/**
 * Seviye tamamlandı: panel aç, yıldız/coin/recap göster, ilerleme kaydet.
 * @param {{ onMap: () => void, onNext: () => void }} cbs
 */
export function levelComplete(cbs) {
  const G = getState();
  if (!G || G.done) return;
  G.done = true;
  if (G.daily) { dailyComplete(cbs); return; }
  const st = starsFor(G.mistakes, G.hints);
  track(EVENTS.LEVEL_COMPLETE, {
    level: G.lv.id,
    pack: G.lv.pack ?? 0,
    stars: st,
    mistakes: G.mistakes,
    hints: G.hints,
    earned: G.earned,
  });
  const prev = S.stars[G.lv.id] || 0;
  S.stars[G.lv.id] = Math.max(prev, st);
  S.stats.levelsDone = Math.max(S.stats.levelsDone, Object.keys(S.stars).length);
  confetti(140);
  SFX.win();
  vibrate([50, 60, 50, 60, 120]);

  const isLast = G.lv.id >= LAST_LEVEL_ID;
  openPanel(`
    <h2>${t("end.title")}</h2>
    <div class="stars-row" id="stars-row"><span>⭐</span><span>⭐</span><span>⭐</span></div>
    <div class="reward-line"><span>${t("end.level")}</span><b>${G.lv.id + 1}</b></div>
    <div class="reward-line"><span>${t("end.words")}</span><b>${G.words.length}</b></div>
    <div class="reward-line"><span>${t("end.bonus")}</span><b>${G.foundBonus.size}</b></div>
    <div class="reward-line"><span>${t("end.earned")}</span><b id="lc-coins">+0 🪙</b></div>
    ${wordsRecapHTML()}
    <div class="btnrow">
      <button class="btn small ghost" id="lc-map">${t("end.map")}</button>
      ${isLast ? "" : `<button class="btn small" id="lc-next">${t("end.next")}</button>`}
    </div>`);

  animateStars(document.getElementById("stars-row"), st);
  animateCoinCounter(document.getElementById("lc-coins"), G.earned);

  document.getElementById("lc-map").onclick = () => { closePanel(); cbs.onMap(); };
  const nx = document.getElementById("lc-next");
  if (nx) nx.onclick = () => { closePanel(); cbs.onNext(); };
}

/**
 * Günlük bulmaca sonu: yıldız/harita ilerlemesi yazmaz, streak güncellenir,
 * ödül coin'i eklenir.
 * @param {{ onMap: () => void }} _cbs
 */
export function dailyComplete(_cbs) {
  const G = getState();
  if (!G) return;
  const res = recordDailyWin();
  if (!res.already && res.reward > 0) {
    S.coins += res.reward;
    S.stats.coinsEarned = (S.stats.coinsEarned || 0) + res.reward;
  }
  confetti(140);
  SFX.win();
  vibrate([50, 60, 50, 60, 120]);
  track(EVENTS.DAILY_COMPLETE, {
    streak: res.streak,
    reward: res.reward,
    already: res.already,
    mistakes: G.mistakes,
  });

  openPanel(`
    <h2>Декъал! 🎉</h2>
    <div class="daily-flame">🔥 ${res.streak}</div>
    <div class="reward-line"><span>Кхочушдина дешнаш</span><b>${G.words.length}</b></div>
    <div class="reward-line"><span>Бонус дешнаш 💎</span><b>${G.foundBonus.size}</b></div>
    <div class="reward-line"><span>Карина сом</span><b>+${G.earned + res.reward} 🪙</b></div>
    ${wordsRecapHTML()}
    <div class="btnrow">
      <button class="btn small ghost" id="lc-share" aria-label="ДӀахьажо 📤">📤</button>
      <button class="btn small" id="lc-home">Юха</button>
    </div>`);
  updateCoins();
  document.getElementById("lc-home").onclick = () => {
    closePanel();
    import("../screens/home.js").then((m) => { m.renderHome(); show("scr-home"); });
  };
  document.getElementById("lc-share").onclick = async () => {
    const text = dailyShareText({
      cells: G.cells.values(),
      streak: res.streak,
      bonus: G.foundBonus.size,
      mistakes: G.mistakes,
      url: location.protocol.startsWith("http") ? location.origin : "",
    });
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      toast("✓ 📋");
    } catch (e) {
      if (e && e.name !== "AbortError") console.warn("[daily] paylaşım:", e);
    }
  };
}
