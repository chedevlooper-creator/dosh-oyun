// @ts-check
import { LEVEL_COUNT, LAST_LEVEL_ID, packOfLevel } from "../data/level-index.js";
import { packFor } from "../data/packs.js";
import { S } from "../engine/store.js";
import { updateCoins, $, show, toast } from "../utils/helpers.js";
import { t } from "../utils/i18n.js";
import { SFX } from "../engine/audio.js";


/* ================= HARİTA ================= */
export function firstUnsolved(){
  for(let id = 0; id < LEVEL_COUNT; id++) if(!(id in S.stars)) return id;
  return LAST_LEVEL_ID;
}
export function openMap(){
  updateCoins();
  const cur = firstUnsolved();
  const lang = S.settings.lang || "ce";
  const wrap = $("map-scroll"); wrap.innerHTML = "";
  let grid = null, lastPack = null, ni = 0;
  for(let id = 0; id < LEVEL_COUNT; id++){
    const pack = packOfLevel(id) || Math.floor(id/25)+1;
    if(pack !== lastPack){
      lastPack = pack;
      const meta = packFor(pack);
      const head = document.createElement("div"); head.className="pack-head";
      const lab = document.createElement("div"); lab.className="pack-label";
      lab.textContent = (t("map.pack") || "ДАКЪА") + " " + pack;
      head.appendChild(lab);
      if (meta) {
        const title = document.createElement("div"); title.className = "pack-title";
        title.textContent = (meta.title && meta.title[lang]) || meta.title?.ce || "";
        head.appendChild(title);
        const intro = document.createElement("div"); intro.className = "pack-intro";
        intro.textContent = (meta.intro && meta.intro[lang]) || meta.intro?.ce || "";
        head.appendChild(intro);
      }
      wrap.appendChild(head);
      grid = document.createElement("div"); grid.className="map-grid"; wrap.appendChild(grid);
    }
    const n = document.createElement("button"); n.className = "node in";
    n.style.animationDelay = Math.min(ni++ * 12, 380) + "ms"; // kademeli giriş, ekran dışı için tavan
    const st = S.stars[id] || 0;
    const locked = id > cur;
    n.setAttribute("aria-label", "ТӀегӀа " + (id + 1) + (st ? ", " + st + " седа" : (locked ? ", гӀайгӀа" : ", хӀинца")));
    if(st){ n.classList.add("done"); n.innerHTML = `<div>${id+1}</div><div class="st">${"★".repeat(st)}</div>`; }
    else if(id === cur){ n.classList.add("cur"); n.innerHTML = `<div>${id+1}</div><div class="state">ХӀинца</div>`; }
    else if(locked){ n.classList.add("lock"); n.innerHTML = `<svg class="lock-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-lock"/></svg><div class="state">ГӀайгӀа</div>`; n.title = "Хьалхара тӀегӀа чекхйаккха"; n.setAttribute("aria-disabled","true"); }
    else n.textContent = id+1;
    if(!locked) n.onclick = ()=>{ SFX.coin(); import("./game.js").then(m => m.startLevel(id)); };
    else n.onclick = ()=>toast("Хьалхара тӀегӀа чекхйаккха 🔒");
    grid.appendChild(n);
  }
  show("scr-map");
  const curNode = wrap.querySelector(".node.cur"); if(curNode) setTimeout(()=>curNode.scrollIntoView({block:"center",behavior:"smooth"}),80);
}
$("map-back").onclick = ()=>{ import("./home.js").then(({ renderHome }) => { renderHome(); show("scr-home"); }); };

