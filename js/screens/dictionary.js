/* ================= SÖZLÜK ================= */

import { S } from "../engine/save.js";
import { INFO } from "../data/levels.js";
import { norm, dispG } from "../engine/grapheme.js";
import { $, openPanel } from "../utils/dom.js";

/**
 * Sözlük panelini aç
 */
function openDict() {
  const words = Object.keys(S.dict).sort();

  const render = (q) => {
    const list = words.filter(w => !q || w.includes(norm(q)));
    if (!words.length) return `<p class="empty-state">ХӀинца а цахила.<br>Дешнаш кхочушдича, хьан дошам хӀокху чу йовлар ю.</p>`;
    if (!list.length) return `<p class="empty-state">Ца карийна.<br>Кхин а къастам я лаха.</p>`;
    return list.map(w =>
      `<div class="dict-item"><div class="w">${dispG(w)}</div>${INFO[w] ? `<div class="d">${INFO[w]}</div>` : ""}</div>`
    ).join("");
  };

  openPanel(`
    <h2>Дошам 📖</h2>
    <p class="panel-subtitle">Кхочушдина дешнаш а цар маьӀнаш а хӀокху чу кхолла.</p>
    <input class="dict-search" id="dict-q" placeholder="Лаха…" aria-label="Лаха дош">
    <div id="dict-list">${render("")}</div>
    <div class="btnrow"><button class="btn small" id="dc-close">Юха</button></div>`);

  document.getElementById("dict-q").addEventListener("input", (e) => {
    document.getElementById("dict-list").innerHTML = render(e.target.value);
  });
  document.getElementById("dc-close").onclick = () => {
    import("../utils/dom.js").then(({ closePanel }) => closePanel());
  };
}

export { openDict };
