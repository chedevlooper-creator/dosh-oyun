// @ts-check
import { S } from "../engine/store.js";
import { LEVEL_COUNT } from "../data/level-index.js";
import { CFG } from "../data/config.js";
import { updateCoins, toast, today, $ } from "../utils/helpers.js";
import { t } from "../utils/i18n.js";
import { ac, SFX } from "../engine/audio.js";
import { tutorial } from "./tutorial.js";
import { openMap } from "./map.js";
import { openSettings } from "./settings.js";
import { openStats } from "./stats.js";
import { openDict } from "./dict.js";
import { confetti } from "../fx/particles.js";
import { dailyLevelId, isDailyDone, currentStreak } from "../engine/daily.js";
import { startLevel } from "./game.js";
import { startTimeAttack } from "../game/time-attack.js";
import { loadAllLevels } from "../data/level-loader.js";

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
$("btn-start").onclick = ()=>{ ac(); SFX.coin();
  if(!S.tut){ tutorial(); return; }
  openMap(); };
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
$("btn-settings").onclick = ()=>openSettings();
$("btn-stats").onclick = ()=>openStats();
$("btn-dict").onclick = ()=>openDict();
$("btn-timeattack").onclick = () => {
  ac(); SFX.coin();
  loadAllLevels().then((lv) => startTimeAttack(lv, S.stats?.bestStreak || 0));
};

