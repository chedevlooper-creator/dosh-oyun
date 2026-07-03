import { openPanel, closePanel } from "./panel.js";
import { THEMES, applyTheme } from "../engine/theme.js";
import { S } from "../engine/store.js";
import { clearAll } from "../engine/save.js";
import { SFX, MUSIC } from "../engine/audio.js";
import { tutorial } from "./tutorial.js";
import { $ } from "../utils/helpers.js";
import { GL } from "../fx/scene3d.js";

/* ================= AYARLAR ================= */
export function openSettings(){
  openPanel(`
    <h2>Нисдарш ⚙️</h2>
    <div class="opt-row"><span>Кеп</span>
      <div class="theme-dots">${THEMES.map(t=>
        `<button class="tdot ${S.settings.theme===t.id?"on":""}" data-t="${t.id}" title="${t.name}" aria-label="${t.name}" aria-pressed="${S.settings.theme===t.id}" style="background:${t.dot}"></button>`).join("")}
      </div></div>
    <div class="opt-row"><span>Аз 🔔</span>
      <button class="toggle ${S.settings.sound?"on":""}" id="snd-toggle"></button></div>
    <div class="opt-row"><span>Мукъам 🎵</span>
      <button class="toggle ${S.settings.music?"on":""}" id="mus-toggle"></button></div>
    <div class="opt-row"><span>Хьехам</span>
      <button class="btn small ghost" id="set-tut">Ловзар</button></div>
    <div class="opt-row" style="border:none"><span>Юхадаккха</span>
      <button class="btn small ghost" id="set-reset" style="color:var(--danger)">⟲</button></div>
    <div class="btnrow"><button class="btn small" id="set-close">Юха</button></div>`);
  document.querySelectorAll(".tdot").forEach(d=>d.onclick=()=>{
    S.settings.theme = d.dataset.t;
    applyTheme(); GL.retheme();
    document.querySelectorAll(".tdot").forEach(x=>{
      x.classList.toggle("on",x===d);
      x.setAttribute("aria-pressed", x===d);
    });
  });
  $("snd-toggle").onclick = function(){
    S.settings.sound = !S.settings.sound;
    this.classList.toggle("on", S.settings.sound);
    if(S.settings.sound) SFX.coin();
  };
  $("mus-toggle").onclick = function(){
    MUSIC.toggle(!S.settings.music);
    this.classList.toggle("on", S.settings.music);
  };
  $("set-tut").onclick = ()=>{ closePanel(); tutorial(); };
  $("set-reset").onclick = ()=>{
    openPanel(`<h2>Юхадаккха</h2><p class="center" style="font-size:16px">Массо а хаамаш дӀадаха?</p>
      <div class="btnrow">
        <button class="btn small" id="rst-no">ХӀан-хӀа</button>
        <button class="btn small ghost" id="rst-yes" style="color:var(--danger)">ХӀаъ, юхадаккха</button>
      </div>`);
    $("rst-no").onclick = closePanel;
    $("rst-yes").onclick = ()=>{ clearAll(); location.reload(); };
  };
  $("set-close").onclick = closePanel;
}

