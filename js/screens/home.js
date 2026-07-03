import { S } from "../engine/store.js";
import { LEVELS } from "../data/levels.js";
import { CFG } from "../utils/constants.js";
import { updateCoins, toast, today, $ } from "../utils/helpers.js";
import { ac, SFX } from "../engine/audio.js";
import { tutorial } from "./tutorial.js";
import { openMap } from "./map.js";
import { openSettings } from "./settings.js";
import { openStats } from "./stats.js";
import { openDict } from "./dict.js";
import { confetti } from "../fx/confetti.js";

/* ================= ANA EKRAN ================= */
export function renderHome(){
  updateCoins();
  const done = Object.keys(S.stars).length;
  const totalStars = Object.values(S.stars).reduce((a,b)=>a+b,0);
  const percent = LEVELS.length ? (done/LEVELS.length*100) : 0;
  $("home-progress").innerHTML = `<strong>${done}</strong> / ${LEVELS.length} · <strong>${totalStars}</strong> ⭐ · ${percent.toFixed(0)}%`;
  $("home-stars").textContent = totalStars;
  $("btn-start").innerHTML = `${S.tut ? "Кхин дӀа ▶" : "Ловза йолае ▶"}`;
  $("btn-start").setAttribute("aria-label", S.tut ? "Кхин дӀа, тӀегӀанийн карта" : "Ловза йолае, хьехам доладу");
  requestAnimationFrame(()=>{ $("home-bar").style.width = percent.toFixed(1) + "%"; });
  $("btn-gift").classList.toggle("glow", S.lastGift !== today());
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
$("btn-settings").onclick = ()=>openSettings();
$("btn-stats").onclick = ()=>openStats();
$("btn-dict").onclick = ()=>openDict();

