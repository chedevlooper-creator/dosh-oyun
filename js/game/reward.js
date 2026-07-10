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
import { speak } from "../utils/tts.js";

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
const TAG_COLORS = {
  animal: "#4caf50", food: "#ff9800", body: "#e91e63",
  abstract: "#9c27b0", language: "#2196f3", time: "#00bcd4",
  nature: "#8bc34a", home: "#795548", weather: "#607d8b",
  color: "#ff5722", family: "#f44336", object: "#673ab7",
  action: "#03a9f4", number: "#ffc107",
};

export function showWordInfo(w) {
  const strip = document.getElementById("info-strip");
  if (!strip) return;
  swipeState = null; // devam eden swipe'ı iptal et
  const info = INFO[w.norm];
  const ce = info ? (info.ce ?? "") : "";
  const tr = info ? (info.tr ?? "") : "";
  const ipa = info ? (info.ipa ?? "") : "";
  const etymology = info ? (info.etymology ?? "") : "";
  const tags = info ? (info.tags ?? []) : [];
  const examples = info ? (info.examples ?? []) : [];
  const fallbackColor = "var(--ink2)";
  strip.innerHTML = `
    <div class="info-word">${dispG(w.norm)} <button class="info-speak" data-word="${w.norm}" aria-label="${t("tts.speakLabel")}">🔊</button></div>
    ${ipa ? `<div class="info-ipa">${ipa}</div>` : ""}
    ${ce ? `<div class="info-line"><span class="lang">чеч.</span> ${dispG(ce)}</div>` : ""}
    ${tr ? `<div class="info-line"><span class="lang">тр.</span> ${dispG(tr)}</div>` : ""}
    ${etymology ? `<div class="info-etym">${etymology}</div>` : ""}
    ${examples.length ? `<div class="info-examples">${examples.map(ex => `<div class="info-ex">${ex}</div>`).join("")}</div>` : ""}
    ${tags.length ? `<div class="info-tags">${tags.map((tag) => { const c = TAG_COLORS[tag] || fallbackColor; return `<span class="info-tag" style="background:${c}22;color:${c};border:1px solid ${c}44">${tag}</span>`; }).join("")}</div>` : ""}`;
  strip.className = "on";
  // Bounce animasyonu: class'ı kaldır/ekle ile yeniden tetikle
  strip.classList.remove("on");
  void strip.offsetHeight; // reflow
  strip.classList.add("on");
}

/* Delegated listener — #info-strip içindeki tüm .info-speak tıklamalarını yakala */
if (typeof document !== "undefined") {
  document.getElementById("info-strip")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".info-speak");
    if (btn) speak(btn.dataset.word || "", S.settings.lang);
  });
}

/* ================= SWIPE-TO-DISMISS (info-strip) =================
 * Aşağı kaydırarak bilgi şeridini kapatma. Dokunmatik + fare desteği. */
const SWIPE_THRESHOLD = 80; // px — bu kadar sürüklenince kapanır
const SWIPE_FRICTION = 0.6; // direnç katsayısı (0-1)

let swipeState = null;

function initSwipe() {
  const strip = document.getElementById("info-strip");
  if (!strip) return;

  const getY = (e) => {
    if (e.touches) return e.touches[0].clientY;
    return e.clientY;
  };

  const onStart = (e) => {
    if (!strip.classList.contains("on")) return;
    // Sadece tutamak bölgesinden (üst 30px) veya strip dışından başlat
    const rect = strip.getBoundingClientRect();
    const touchY = getY(e);
    const relativeY = touchY - rect.top;
    if (relativeY > 40) return; // içerik kaydırma için serbest bırak

    swipeState = { startY: touchY, currentY: touchY, dismissed: false };
    strip.classList.add("dragging");
    strip.classList.remove("dismissing", "dismiss");
    strip.style.transform = `translateY(0)`;
  };

  const onMove = (e) => {
    if (!swipeState || swipeState.dismissed) return;
    const y = getY(e);
    swipeState.currentY = y;
    const dy = (y - swipeState.startY) * SWIPE_FRICTION;
    if (dy <= 0) return; // yukarı sürüklemeyi yok say

    const clamped = Math.min(dy, window.innerHeight * 0.6);
    strip.style.transform = `translateY(${clamped}px)`;
    strip.style.opacity = Math.max(0, 1 - clamped / (SWIPE_THRESHOLD * 2));
  };

  const onEnd = () => {
    if (!swipeState || swipeState.dismissed) return;
    const dy = (swipeState.currentY - swipeState.startY) * SWIPE_FRICTION;
    strip.classList.remove("dragging");
    strip.style.opacity = "";

    if (dy > SWIPE_THRESHOLD) {
      // Kapat
      swipeState.dismissed = true;
      strip.classList.add("dismiss");
      setTimeout(() => {
        strip.classList.remove("on", "dismiss");
        strip.style.transform = "";
        swipeState = null;
      }, 320);
    } else {
      // Geri dön (snap back)
      strip.classList.add("dismissing");
      strip.style.transform = "";
      setTimeout(() => {
        strip.classList.remove("dismissing");
        if (swipeState) swipeState = null;
      }, 300);
    }
  };

  // Dokunmatik olaylar
  strip.addEventListener("touchstart", onStart, { passive: true });
  strip.addEventListener("touchmove", onMove, { passive: true });
  strip.addEventListener("touchend", onEnd);
  strip.addEventListener("touchcancel", onEnd);

  // Fare olayları (masaüstü test için)
  strip.addEventListener("pointerdown", (e) => {
    // Dokunmatikse touch zaten handle ediyor
    if (e.pointerType !== "mouse") return;
    onStart(e);
    const onPointerMove = (ev) => { ev.preventDefault(); onMove(ev); };
    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      onEnd();
    };
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  });
}

// Sayfa yüklendiğinde swipe dinleyicilerini kur
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSwipe);
  } else {
    initSwipe();
  }
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
 * Bonus sandık açılma animasyonu: butona tıklanınca ikon patlar,
 * altın partiküller saçılır, ardından toast ile bonus listesi gösterilir.
 * Çağrılmışken tekrar tıklanmayı önler.
 */
export function showBonusChest() {
  const G = getState();
  if (!G) return;
  const btn = document.getElementById("bonus-chest");
  if (!btn || btn.classList.contains("opening")) return;

  // Açılma animasyonu başlat
  btn.classList.add("opening");

  // Partikül patlaması: altın yıldızlar, elmaslar, ışıltılar
  const rect = btn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const particles = ["✦", "♦", "∙", "+", "⬩", "*", "🪙"];
  for (let i = 0; i < 10; i++) {
    const el = document.createElement("div");
    el.className = "bonus-particle" + (i % 3 === 0 ? " coin" : i % 5 === 0 ? " star" : "");
    el.textContent = particles[i % particles.length];
    const angle = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5);
    const dist = 40 + Math.random() * 60;
    el.style.left = (cx + Math.cos(angle) * dist) + "px";
    el.style.top = (cy + Math.sin(angle) * dist) + "px";
    el.style.animationDelay = (Math.random() * 0.15) + "s";
    document.body.appendChild(el);
    // Animasyon sonunda temizle
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }

  // Sayı badge'inde parıltı
  const countEl = document.getElementById("bonus-count");
  if (countEl) {
    countEl.classList.remove("pulse");
    void countEl.offsetWidth; // reflow
    countEl.classList.add("pulse");
    setTimeout(() => countEl.classList.remove("pulse"), 600);
  }

  // Kısa bir gecikme ile buton animasyonunu bitir ve toast göster
  setTimeout(() => {
    btn.classList.remove("opening", "opening-error");
    const list = [...G.foundBonus].map(dispG).join(", ") || "—";
    toast(t("game.bonusChest", list));
    SFX.coin();
  }, 600);
  // Güvenlik: 2sn sonra opening class hala varsa zorla temizle
  setTimeout(() => {
    if (btn.classList.contains("opening")) {
      btn.classList.remove("opening");
    }
  }, 2000);
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
