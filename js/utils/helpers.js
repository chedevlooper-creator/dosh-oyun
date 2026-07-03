import { S } from "../engine/store.js";
import { GL } from "../fx/scene3d.js";

/* ================= YARDIMCILAR ================= */
export const $ = id => document.getElementById(id);
export function show(scr){
  document.querySelectorAll(".screen").forEach(s=>{
    s.classList.remove("on");
    s.setAttribute("aria-hidden","true");
    s.inert = true;
  });
  $(scr).classList.add("on");
  $(scr).setAttribute("aria-hidden","false");
  $(scr).inert = false;
  try{ GL.view(scr); }catch(e){} // sahne kamerası ekrana eşlik eder
}
let toastTimer = 0;
export function toast(msg, cls=""){
  const t = $("toast"); t.textContent = msg; t.className = "on "+cls;
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.className="", 1800);
}
export function updateCoins(){
  ["home-coins","map-coins","game-coins"].forEach(id=>{ const e=$(id); if(e) e.textContent = S.coins; });
}
export function flyCoins(fromEl, n=5){
  const target = $("game-coins").getBoundingClientRect();
  const from = fromEl ? fromEl.getBoundingClientRect() : {left:innerWidth/2, top:innerHeight/2, width:0, height:0};
  for(let i=0;i<Math.min(n,7);i++){
    const c = document.createElement("div"); c.className="flycoin"; c.textContent="🪙";
    c.style.left=(from.left+from.width/2)+"px"; c.style.top=(from.top+from.height/2)+"px";
    document.body.appendChild(c);
    requestAnimationFrame(()=>{ setTimeout(()=>{
      c.style.left=(target.left)+"px"; c.style.top=(target.top)+"px"; c.style.opacity="0"; c.style.transform="scale(.4)";
    }, i*70); });
    setTimeout(()=>c.remove(), 1100+i*70);
  }
}
export function today(){ const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
export function vibrate(p){ try{ navigator.vibrate ? navigator.vibrate(p) : 0; }catch(e){} }

