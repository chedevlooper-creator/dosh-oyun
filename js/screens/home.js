// @ts-check
import { S } from "../engine/store.js";
import { LEVEL_COUNT } from "../data/level-index.js";
import { CFG } from "../data/config.js";
import { updateCoins, toast, today, $ } from "../utils/helpers.js";
import { t } from "../utils/i18n.js";
import { ac, SFX } from "../engine/audio.js";
import { confetti } from "../fx/particles.js";
import { dailyLevelId, isDailyDone, currentStreak } from "../engine/daily.js";
import { startLevel } from "./game.js";
import { loadAllLevels } from "../data/level-loader.js";
import { startTimeAttack } from "../game/time-attack.js";

/* ================= ANA EKRAN ================= */
export function renderHome(){
  updateCoins();
  const done = Object.keys(S.stars).length;
  const totalStars = Object.values(S.stars).reduce((a,b)=>a+b,0);
  const percent = LEVEL_COUNT ? (done/LEVEL_COUNT*100) : 0;
  $("home-progress").innerHTML = `<strong>${done}</strong> / ${LEVEL_COUNT} · <strong>${totalStars}</strong> ⭐ · ${percent.toFixed(0)}%`;
  $("home-stars").textContent = totalStars;
  $("btn-start").innerHTML = `${S.tut ? t("home.continue") : t("home.start")}`;
  $("btn-start").setAttribute("aria-label", S.tut ? t("home.continue") : t("home.start"));
  requestAnimationFrame(()=>{
    const bar = $("home-bar");
    if (bar) {
      bar.style.width = percent.toFixed(1) + "%";
      bar.setAttribute("aria-valuenow", percent.toFixed(0));
    }
  });
  $("btn-gift").classList.toggle("glow", S.lastGift !== today());
  // günlük bulmaca: yapılmadıysa parla, streak alevini güncelle
  const dDone = isDailyDone();
  $("btn-daily").classList.toggle("glow", !dDone);
  $("btn-daily").classList.toggle("done", dDone);
  const streak = currentStreak();
  $("daily-streak").textContent = dDone ? "✓" + (streak > 1 ? " 🔥" + streak : "") : (streak > 0 ? "🔥" + streak : "");
}
$("btn-start").onclick = () => { ac(); SFX.coin();
  if (!S.tut) {
    import("./tutorial.js").then(({ tutorial }) => tutorial());
    return;
  }
  import("./map.js").then(({ openMap }) => openMap());
};
$("btn-gift").onclick = ()=>{
  if(S.lastGift === today()){ toast("Кхана юха вола 🌙"); return; }
  S.lastGift = today(); S.coins += CFG.dailyGiftCoins; S.stats.coinsEarned += CFG.dailyGiftCoins;
  // proxy otomatik save tetikler
  updateCoins(); renderHome(); confetti(60); SFX.gift();
  toast("+"+CFG.dailyGiftCoins+" 🪙", "gold");
};
$("btn-daily").onclick = ()=>{
  ac(); SFX.coin();
  if(isDailyDone()){ toast("Кхана юха вола 🌙"); return; }
  startLevel(dailyLevelId(), { daily: true });
};
$("btn-settings").onclick = () => import("./settings.js").then(({ openSettings }) => openSettings());
$("btn-stats").onclick = () => import("./stats.js").then(({ openStats }) => openStats());
$("btn-dict").onclick = () => import("./dict.js").then(({ openDict }) => openDict());
$("btn-timeattack").onclick = () => {
  ac(); SFX.coin();
  loadAllLevels().then((lv) => startTimeAttack(lv, S.stats?.bestStreak || 0));
};
$("btn-chain")?.addEventListener?.("click", () => {
  ac(); SFX.coin();
  import("./chain.js").then(({ openChain }) => openChain());
});

// TA en iyi skoru göster (varsa)
const taBest = S.stats?.taBest || 0;
const taLabel = $("btn-timeattack")?.querySelector(".lb");
if (taLabel && taBest > 0) {
  taLabel.textContent = `⏱ ${taBest}`;
}
// Zincir butonu i18n
const chainBtn = $("btn-chain");
if (chainBtn) {
  const chainLb = chainBtn.querySelector(".lb");
  if (chainLb) chainLb.textContent = t("chain.btn");
  chainBtn.setAttribute("aria-label", t("chain.btn"));
}

