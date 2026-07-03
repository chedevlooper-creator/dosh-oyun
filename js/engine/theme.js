import { S } from "./store.js";

/* ================= TEMA ================= */
export const THEMES = [
  {id:"kavkaz", name:"Кавказ", dot:"linear-gradient(135deg,#7ec8e3,#123c5a)"},
  {id:"night",  name:"Буьйса", dot:"linear-gradient(135deg,#1b2450,#070a20)"},
  {id:"forest", name:"Хьун",   dot:"linear-gradient(135deg,#a8d5a2,#1d5c40)"},
  {id:"autumn", name:"Гуьйре", dot:"linear-gradient(135deg,#ffd9a0,#8a4530)"},
  {id:"winter", name:"Ӏа",     dot:"linear-gradient(135deg,#dceefb,#4a7ba6)"},
];
export function applyTheme(){
  [...document.body.classList].filter(c=>c.startsWith("theme-")).forEach(c=>document.body.classList.remove(c));
  document.body.classList.add("theme-"+S.settings.theme);
  document.querySelectorAll("#photo .ph").forEach(el =>
    el.classList.toggle("on", el.dataset.t === S.settings.theme));
}

