import { S } from "../engine/store.js";
import { openPanel, closePanel } from "./panel.js";
import { $ } from "../utils/helpers.js";

/* ================= İSTATİSTİK ================= */
export function openStats(){
  const st = S.stats;
  const totalStars = Object.values(S.stars).reduce((a,b)=>a+b,0);
  openPanel(`
    <h2><svg class="h-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-chart"/></svg> Статистика</h2>
    <p class="panel-subtitle">Хьан кхочушдина болх, ловзарийн маьӀна а сомийн бехкам.</p>
    <div class="panel-section">
      <div class="panel-section-title">Кхочушдар</div>
      <div class="stat-grid">
        <div class="stat-card"><div class="v">${Object.keys(S.stars).length}</div><div class="k">ТӀегӀан</div></div>
        <div class="stat-card"><div class="v">${totalStars} ⭐</div><div class="k">Седийн</div></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Ловзар</div>
      <div class="stat-grid">
        <div class="stat-card"><div class="v">${st.words}</div><div class="k">Кхочушдина дешнаш</div></div>
        <div class="stat-card"><div class="v">${st.bonusWords}</div><div class="k">Карина бонус</div></div>
        <div class="stat-card"><div class="v">${st.hints}</div><div class="k">Хьехамаш</div></div>
        <div class="stat-card"><div class="v">${st.bestStreak} 🔥</div><div class="k">Уггаре дукха могӀа</div></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Сом</div>
      <div class="stat-grid">
        <div class="stat-card"><div class="v">${st.coinsEarned}</div><div class="k">Даьккхина 🪙</div></div>
        <div class="stat-card"><div class="v">${st.coinsSpent}</div><div class="k">Доьхна 🪙</div></div>
      </div>
    </div>
    <div class="btnrow"><button class="btn small" id="st-close">Юха</button></div>`);
  $("st-close").onclick = closePanel;
}

