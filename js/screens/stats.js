// @ts-check
import { S } from "../engine/store.js";
import { openPanel, closePanel } from "./panel.js";
import { $ } from "../utils/helpers.js";
import { currentStreak } from "../engine/daily.js";
import { t } from "../utils/i18n.js";

/* ================= İSTATİSTİK ================= */
export function openStats(){
  const st = S.stats;
  const totalStars = Object.values(S.stars).reduce((a,b)=>a+b,0);
  openPanel(`
    <h2><svg class="h-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-chart"/></svg> ${t("stats.title")}</h2>
    <p class="panel-subtitle">${t("stats.desc")}</p>
    <div class="panel-section">
      <div class="panel-section-title">${t("stats.progress")}</div>
      <div class="stat-grid">
        <div class="stat-card"><div class="v">${Object.keys(S.stars).length}</div><div class="k">${t("stats.levels")}</div></div>
        <div class="stat-card"><div class="v">${totalStars} ⭐</div><div class="k">${t("stats.stars")}</div></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">${t("stats.gameplay")}</div>
      <div class="stat-grid">
        <div class="stat-card"><div class="v">${st.words}</div><div class="k">${t("stats.wordsFound")}</div></div>
        <div class="stat-card"><div class="v">${st.bonusWords}</div><div class="k">${t("stats.bonusFound")}</div></div>
        <div class="stat-card"><div class="v">${st.hints}</div><div class="k">${t("stats.hints")}</div></div>
        <div class="stat-card"><div class="v">${st.bestStreak} 🔥</div><div class="k">${t("stats.streak")}</div></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">${t("stats.daily")} 📅</div>
      <div class="stat-grid">
        <div class="stat-card"><div class="v">${currentStreak()} 🔥</div><div class="k">${t("stats.streakNow")}</div></div>
        <div class="stat-card"><div class="v">${S.daily.best} 🔥</div><div class="k">${t("stats.streakBest")}</div></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">${t("stats.coins")}</div>
      <div class="stat-grid">
        <div class="stat-card"><div class="v">${st.coinsEarned}</div><div class="k">${t("stats.earned")}</div></div>
        <div class="stat-card"><div class="v">${st.coinsSpent}</div><div class="k">${t("stats.spent")}</div></div>
      </div>
    </div>
    <div class="btnrow"><button class="btn small" id="st-close">${t("settings.back")}</button></div>`);
  $("st-close").onclick = closePanel;
}

