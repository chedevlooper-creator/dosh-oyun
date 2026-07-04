// @ts-check
import { S } from "../engine/store.js";
import { norm, dispG } from "../engine/grapheme.js";
import { INFO } from "../data/info.js";
import { openPanel, closePanel } from "./panel.js";
import { $ } from "../utils/helpers.js";

/* ================= SÖZLÜK ================= */

/** Anlamı eksik kelime için önceden doldurulmuş GitHub issue bağlantısı */
function contribURL(w){
  const title = encodeURIComponent(`МаьӀна: ${w}`);
  const body = encodeURIComponent(`Дош: ${w}\n\nчеч. (нохчийн маьӀна):\n\ntr (Türkçe anlam):\n\nKaynak (Wiktionary vb.):`);
  return `https://github.com/chedevlooper-creator/dosh-oyun/issues/new?title=${title}&body=${body}&labels=word-gloss`;
}
export function openDict(){
  const words = Object.keys(S.dict).sort();
  const render = q => {
    const list = words.filter(w=>!q || w.includes(norm(q)));
    if(!words.length) return `<p class="empty-state">ХӀинца а цахила.<br>Дешнаш кхочушдича, хьан дошам хӀокху чу йовлар ю.</p>`;
    if(!list.length) return `<p class="empty-state">Ца карийна.<br>Кхин а къастам я лаха.</p>`;
    return list.map(w=>{
      const info = INFO[w];
      const ce = info ? (info.ce ?? "") : "";
      const tr = info ? (info.tr ?? "") : "";
      // anlamı henüz girilmemiş kelime: topluluk katkısına davet et
      const miss = !ce && !tr
        ? `<div class="d dict-miss"><a href="${contribURL(w)}" target="_blank" rel="noopener">✍️ МаьӀна…</a></div>`
        : "";
      return `<div class="dict-item">
        <div class="w">${dispG(w)}</div>
        ${ce ? `<div class="d"><span class="lang">чеч.</span> ${dispG(ce)}</div>` : ""}
        ${tr ? `<div class="d"><span class="lang">тр.</span> ${dispG(tr)}</div>` : ""}
        ${miss}
      </div>`;
    }).join("");
  };
  openPanel(`
    <h2><svg class="h-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-book"/></svg> Дошам</h2>
    <p class="panel-subtitle">Кхочушдина дешнаш а цар маьӀнаш а хӀокху чу кхолла.</p>
    <input class="dict-search" id="dict-q" placeholder="Лаха…" aria-label="Лаха дош">
    <div id="dict-list">${render("")}</div>
    <div class="btnrow"><button class="btn small" id="dc-close">Юха</button></div>`);
  $("dict-q").addEventListener("input", e=>{ $("dict-list").innerHTML = render(e.target.value); });
  $("dc-close").onclick = closePanel;
}

