import { LEVELS } from "../data/levels.js";
import { S } from "../engine/store.js";
import { updateCoins, $, show, toast } from "../utils/helpers.js";
import { SFX } from "../engine/audio.js";
import { startLevel } from "./game.js";
import { renderHome } from "./home.js";

/* ================= HARİTA ================= */
export function firstUnsolved(){
  for(const lv of LEVELS) if(!(lv.id in S.stars)) return lv.id;
  return LEVELS[LEVELS.length-1].id;
}
export function openMap(){
  updateCoins();
  const cur = firstUnsolved();
  const wrap = $("map-scroll"); wrap.innerHTML = "";
  let grid = null, lastPack = null, ni = 0;
  for(const lv of LEVELS){
    const pack = lv.pack || Math.floor(lv.id/25)+1;
    if(pack !== lastPack){
      lastPack = pack;
      const lab = document.createElement("div"); lab.className="pack-label";
      lab.textContent = "ДАКЪА " + pack;
      wrap.appendChild(lab);
      grid = document.createElement("div"); grid.className="map-grid"; wrap.appendChild(grid);
    }
    const n = document.createElement("button"); n.className = "node in";
    n.style.animationDelay = Math.min(ni++ * 12, 380) + "ms"; // kademeli giriş, ekran dışı için tavan
    const st = S.stars[lv.id] || 0;
    const locked = lv.id > cur;
    n.setAttribute("aria-label", "ТӀегӀа " + (lv.id + 1) + (st ? ", " + st + " седа" : (locked ? ", гӀайгӀа" : ", хӀинца")));
    if(st){ n.classList.add("done"); n.innerHTML = `<div>${lv.id+1}</div><div class="st">${"★".repeat(st)}</div>`; }
    else if(lv.id === cur){ n.classList.add("cur"); n.innerHTML = `<div>${lv.id+1}</div><div class="state">ХӀинца</div>`; }
    else if(locked){ n.classList.add("lock"); n.innerHTML = `<div>🔒</div><div class="state">ГӀайгӀа</div>`; n.title = "Хьалхара тӀегӀа чекхйаккха"; n.setAttribute("aria-disabled","true"); }
    else n.textContent = lv.id+1;
    if(!locked) n.onclick = ()=>{ SFX.coin(); startLevel(lv.id); };
    else n.onclick = ()=>toast("Хьалхара тӀегӀа чекхйаккха 🔒");
    grid.appendChild(n);
  }
  show("scr-map");
  const curNode = wrap.querySelector(".node.cur"); if(curNode) setTimeout(()=>curNode.scrollIntoView({block:"center",behavior:"smooth"}),80);
}
$("map-back").onclick = ()=>{ renderHome(); show("scr-home"); };

