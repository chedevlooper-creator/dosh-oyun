// @ts-check
import { openPanel, closePanel } from "./panel.js";
import { THEMES, applyTheme } from "../engine/theme.js";
import { S } from "../engine/store.js";
import { clearAll, exportSave, importSave } from "../engine/save.js";
import { toast, today } from "../utils/helpers.js";
import { getConsent, setConsent } from "../utils/report.js";
import { openFeedback } from "./feedback.js";
import { SFX, MUSIC } from "../engine/audio.js";
import { tutorial } from "./tutorial.js";
import { $ } from "../utils/helpers.js";
import { t, getLanguages, setLanguage } from "../utils/i18n.js";
import { getPref, setPref as setTtsPref } from "../utils/tts.js";

/* ================= AYARLAR ================= */
export function openSettings(){
  const langs = getLanguages();
  const ttsPref = getPref();
  openPanel(`
    <h2><svg class="h-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-gear"/></svg> ${t("settings.title").replace(" ⚙️","")}</h2>
    <div class="opt-row"><span>${t("settings.theme")}</span>
      <div class="theme-dots">${THEMES.map(th=>
        `<button class="tdot ${S.settings.theme===th.id?"on":""}" data-t="${th.id}" title="${th.name}" aria-label="${th.name}" aria-pressed="${S.settings.theme===th.id}" style="background:${th.dot}"></button>`).join("")}
      </div></div>
    <div class="opt-row"><span class="opt-label"><svg class="o-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-bell"/></svg> ${t("settings.sound").replace(" 🔔","")}</span>
      <button class="toggle ${S.settings.sound?"on":""}" id="snd-toggle" role="switch" aria-checked="${S.settings.sound}" aria-label="${t("settings.sound")}"></button></div>
    <div class="opt-row"><span class="opt-label"><svg class="o-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-note"/></svg> ${t("settings.music").replace(" 🎵","")}</span>
      <button class="toggle ${S.settings.music?"on":""}" id="mus-toggle" role="switch" aria-checked="${S.settings.music}" aria-label="${t("settings.music")}"></button></div>
    <div class="opt-row"><span>${t("settings.lang")}</span>
      <select class="lang-select" id="lang-select" aria-label="${t("settings.lang")}">
        ${langs.map(l => `<option value="${l.code}" ${S.settings.lang===l.code?"selected":""}>${l.name}</option>`).join("")}
      </select>
    </div>
    <div class="opt-row"><span class="opt-label">${t("settings.tts")}</span>
      <select class="tts-select" id="tts-select" aria-label="${t("settings.tts")}">
        <option value="browser" ${ttsPref==="browser"?"selected":""}>${t("tts.browser")}</option>
        <option value="audio" ${ttsPref==="audio"?"selected":""}>${t("tts.audio")}</option>
        <option value="off" ${ttsPref==="off"?"selected":""}>${t("tts.off")}</option>
      </select>
    </div>
    <div class="opt-row"><span class="opt-label">${t("settings.hc")}</span>
      <button class="toggle ${document.body.classList.contains('hc')?"on":""}" id="hc-toggle" role="switch" aria-checked="${document.body.classList.contains('hc')}" aria-label="${t("settings.hc")}"></button>
    </div>
    <div class="opt-row"><span>${t("settings.tut")}</span>
      <button class="btn small ghost" id="set-tut">${t("home.play")}</button></div>
    <div class="opt-row"><span>${t("settings.feedback")}</span>
      <button class="btn small ghost" id="set-feedback" aria-label="${t("settings.feedback")}">✍️</button></div>
    <div class="opt-row"><span class="opt-label">${t("settings.report")}</span>
      <button class="toggle ${getConsent()?"on":""}" id="rep-toggle" role="switch" aria-checked="${getConsent()}" aria-label="${t("settings.report")}"></button></div>
    <div class="opt-row"><span>Хаамаш 💾</span>
      <span class="backup-btns">
        <button class="btn small ghost" id="set-export" aria-label="Хаамаш ⬇️">⬇️</button>
        <button class="btn small ghost" id="set-import" aria-label="Хаамаш ⬆️">⬆️</button>
        <input type="file" id="set-import-file" accept=".json,application/json" hidden>
      </span></div>
    <div class="opt-row" style="border:none"><span>${t("settings.reset")}</span>
      <button class="btn small ghost danger" id="set-reset" aria-label="${t("settings.reset")}"><svg class="o-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-reset"/></svg></button></div>
    <div class="btnrow"><button class="btn small" id="set-close">${t("settings.back")}</button></div>`);
  document.querySelectorAll(".tdot").forEach(d=>d.onclick=()=>{
    S.settings.theme = d.dataset.t;
    applyTheme();
    // 3D sahnenin retheme()'i lazy yüklü olabilir; import edip çağır
    import("../fx/scene3d.js").then((m) => {
      try { m.GL.retheme(); } catch {}
    }).catch(() => {});
    document.querySelectorAll(".tdot").forEach(x=>{
      x.classList.toggle("on",x===d);
      x.setAttribute("aria-pressed", String(x===d));
    });
  });
  $("snd-toggle").onclick = function(){
    S.settings.sound = !S.settings.sound;
    this.classList.toggle("on", S.settings.sound);
    this.setAttribute("aria-checked", S.settings.sound);
    if(S.settings.sound) SFX.coin();
  };
  $("mus-toggle").onclick = function(){
    MUSIC.toggle(!S.settings.music);
    this.classList.toggle("on", S.settings.music);
    this.setAttribute("aria-checked", S.settings.music);
  };
  $("set-tut").onclick = ()=>{ closePanel(); tutorial(); };
  $("set-feedback").onclick = ()=>openFeedback();
  $("rep-toggle").onclick = function(){
    const next = !getConsent();
    setConsent(next);
    this.classList.toggle("on", next);
    this.setAttribute("aria-checked", String(next));
  };
  $("set-export").onclick = ()=>{
    const blob = new Blob([exportSave()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dosh-save-${today()}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
    toast("✓ 💾");
  };
  $("set-import").onclick = ()=>$("set-import-file").click();
  $("set-import-file").onchange = (e)=>{
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      const res = importSave(String(reader.result));
      if(res.ok){ location.reload(); }
      else toast("JSON ⚠️", "bad");
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  $("lang-select").onchange = (e) => { setLanguage(e.target.value); };
  $("tts-select").onchange = (e) => { setTtsPref(e.target.value); };
  $("hc-toggle").onclick = function(){
    const next = !document.body.classList.contains("hc");
    document.body.classList.toggle("hc", next);
    this.classList.toggle("on", next);
    this.setAttribute("aria-checked", String(next));
  };
  $("set-reset").onclick = ()=>{
    openPanel(`<h2>${t("settings.resetTitle")}</h2><p class="center" style="font-size:16px">${t("settings.resetMsg")}</p>
      <div class="btnrow">
        <button class="btn small" id="rst-no">${t("settings.resetNo")}</button>
        <button class="btn small ghost" id="rst-yes" style="color:var(--danger)">${t("settings.resetYes")}</button>
      </div>`);
    $("rst-no").onclick = closePanel;
    $("rst-yes").onclick = ()=>{ clearAll(); location.reload(); };
  };
  $("set-close").onclick = closePanel;
}

