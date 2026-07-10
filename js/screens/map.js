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
      ni = 0; // Reset counter for local S-curve within this pack
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
    
    // Winding path S-curve logic: 3 columns
    const r = Math.floor(ni / 3);
    const col = (r % 2 === 0) ? ((ni % 3) + 1) : (3 - (ni % 3));
    n.style.gridColumn = String(col);
    n.style.gridRow = String(r + 1);
    n.style.animationDelay = Math.min(ni * 12, 380) + "ms";
    ni++;

    const st = S.stars[id] || 0;
    const locked = id > cur;
    n.setAttribute("aria-label", "ТӀегӀа " + (id + 1) + (st ? ", " + st + " седа" : (locked ? ", гӀайгӀa" : ", хӀинца")));
    
    if(st){
      n.classList.add("done");
      n.innerHTML = `<div>${id+1}</div><div class="st">${"★".repeat(st)}</div>`;
    }
    else if(id === cur){
      n.classList.add("cur");
      n.innerHTML = `
        <svg class="map-eagle" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5c-1.8-1.2-4.5-1.5-6.5-.8.7 1.8 2 3.5 4.5 4.2 2 .6 3.8 0 4.8-.7 1 .7 2.8 1.3 4.8.7 2.5-.7 3.8-2.4 4.5-4.2-2-.7-4.7-.4-6.5.8Z" fill="var(--gold)"/>
        </svg>
        <div>${id+1}</div>
        <div class="state">ХӀинца</div>
      `;
    }
    else if(locked){
      n.classList.add("lock");
      n.innerHTML = `<div>${id+1}</div><svg class="lock-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-lock"/></svg>`;
      n.title = "Хьалхара тӀегӀа чекхйаккха";
      n.setAttribute("aria-disabled","true");
    }
    else {
      n.textContent = id+1;
    }

    if(!locked) n.onclick = ()=>{ SFX.coin(); import("./game.js").then(m => m.startLevel(id)); };
    else n.onclick = ()=>toast("Хьалхара тӀегӀа чекхйаккха 🔒");
    grid.appendChild(n);
  }
  show("scr-map");
  const curNode = wrap.querySelector(".node.cur");
  if(curNode) setTimeout(()=>curNode.scrollIntoView({block:"center",behavior:"smooth"}),80);
  
  // Draw winding trail lines connecting levels
  requestAnimationFrame(() => drawMapPaths());
}

/**
 * Draws dashed connection lines (mountain trails) between level nodes.
 */
function drawMapPaths() {
  const grids = document.querySelectorAll(".map-grid");
  grids.forEach((grid) => {
    // Clean up existing SVG trails
    grid.querySelectorAll(".map-path-svg").forEach(svg => svg.remove());

    const nodes = Array.from(grid.querySelectorAll(".node"));
    if (nodes.length < 2) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "map-path-svg");

    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    poly.setAttribute("fill", "none");
    poly.setAttribute("stroke", "rgba(242, 181, 61, 0.45)"); // semi-transparent gold
    poly.setAttribute("stroke-width", "5");
    poly.setAttribute("stroke-dasharray", "10,8");
    poly.setAttribute("stroke-linecap", "round");
    poly.setAttribute("stroke-linejoin", "round");

    const points = [];
    nodes.forEach((node) => {
      const cx = node.offsetLeft + node.offsetWidth / 2;
      const cy = node.offsetTop + node.offsetHeight / 2;
      points.push(`${cx},${cy}`);
    });

    poly.setAttribute("points", points.join(" "));
    svg.appendChild(poly);
    grid.insertBefore(svg, grid.firstChild); // below buttons
  });
}

// Recalculate trail points on window resize
window.addEventListener("resize", () => {
  if (document.getElementById("scr-map").classList.contains("on")) {
    drawMapPaths();
  }
});

$("map-back").onclick = ()=>{ import("./home.js").then(({ renderHome }) => { renderHome(); show("scr-home"); }); };
