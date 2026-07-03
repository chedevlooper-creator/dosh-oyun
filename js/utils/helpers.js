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

/* ---------- V6 YARDIMCI FONKSİYONLAR ---------- */
let bannerTimer = 0;
export function banner(msg, cls=""){
  const b = $("banner"); if(!b) return;
  b.textContent = msg; b.className = "on " + cls;
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(()=>{ b.className = ""; }, 2200);
}
export function hapticTap(){
  try{ if(navigator.vibrate) navigator.vibrate(10); }catch(e){}
}
export function hapticSuccess(){
  try{ if(navigator.vibrate) navigator.vibrate([15,40,20]); }catch(e){}
}
export function hapticError(){
  try{ if(navigator.vibrate) navigator.vibrate([60,30,60]); }catch(e){}
}
/* Splash için parçacıklar üret */
export function initSplashParticles(){
  const host = $("splash")?.querySelector(".sparticles");
  if(!host) return;
  for(let i=0;i<18;i++){
    const s = document.createElement("span");
    s.style.cssText = `position:absolute;left:${Math.random()*100}%;top:${60+Math.random()*40}%;width:${3+Math.random()*4}px;height:${3+Math.random()*4}px;border-radius:50%;background:radial-gradient(circle,rgba(242,181,61,.9),transparent 70%);animation:driftUp ${3+Math.random()*3}s linear ${Math.random()*3}s infinite`;
    host.appendChild(s);
  }
}
/* Sayı artış animasyonu (coins, stars) */
export function bumpNumber(el, from, to, dur=600){
  if(!el) return;
  const t0 = performance.now();
  function step(t){
    const k = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    el.style.transform = `scale(${1 + Math.sin(k * Math.PI) * 0.18})`;
    if(k < 1) requestAnimationFrame(step);
    else el.style.transform = "";
  }
  requestAnimationFrame(step);
}

