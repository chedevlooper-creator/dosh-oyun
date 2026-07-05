// @ts-check
import { $ } from "../utils/helpers.js";
import { t } from "../utils/i18n.js";

/* ================= PANEL (modal) ================= */
let lastFocus = null;
export function openPanel(html){
  if(!$("veil").classList.contains("on")) lastFocus = document.activeElement;
  $("panel").innerHTML = html;
  // Her panele köşe kapatma butonu
  const x = document.createElement("button");
  x.className = "panel-x";
  x.setAttribute("aria-label", t("panel.close"));
  x.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-x"/></svg>`;
  x.onclick = closePanel;
  $("panel").prepend(x);
  $("veil").classList.add("on");
  $("veil").setAttribute("aria-hidden", "false");
  $("veil").setAttribute("aria-modal", "true");
  const h = $("panel").querySelector("h2");
  if(h){
    if(!h.id) h.id = "panel-h";
    $("veil").setAttribute("aria-labelledby", h.id);
  }
  const f = $("panel").querySelector("button:not(.panel-x), input, [tabindex]");
  if(f) f.focus({ preventScroll:true });
  else $("panel").focus({ preventScroll:true });
}
export function closePanel(){
  $("veil").classList.remove("on");
  $("veil").setAttribute("aria-hidden", "true");
  $("veil").removeAttribute("aria-modal");
  $("veil").removeAttribute("aria-labelledby");
  if(lastFocus && lastFocus.focus){
    try{ lastFocus.focus({ preventScroll:true }); }catch{}
  }
}
$("veil").addEventListener("click", e=>{ if(e.target===$("veil")) closePanel(); });
addEventListener("keydown", e=>{
  if(!$("veil").classList.contains("on")) return;
  if(e.key === "Escape"){ closePanel(); return; }
  if(e.key !== "Tab") return;
  const f = [...$("panel").querySelectorAll("button, input, [tabindex]")]
    .filter(el => !el.disabled && el.tabIndex !== -1);
  if(!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
});
