// @ts-check
import { S } from "../engine/store.js";
import { norm, dispG } from "../engine/grapheme.js";
import { INFO } from "../data/info.js";
import { openPanel, closePanel } from "./panel.js";
import { $ } from "../utils/helpers.js";
import { openFeedback } from "./feedback.js";
import { t } from "../utils/i18n.js";
import { speak } from "../utils/tts.js";

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
    if(!words.length) return `<p class="empty-state">${t("dict.empty")}</p>`;
    if(!list.length) return `<p class="empty-state">${t("dict.notFound")}</p>`;
    return list.map(w=>{
      const info = INFO[w];
      const ce = info ? (info.ce ?? "") : "";
      const tr = info ? (info.tr ?? "") : "";
      // anlamı henüz girilmemiş kelime: topluluk katkısına davet et
      const miss = !ce && !tr
        ? `<div class="d dict-miss"><a href="${contribURL(w)}" target="_blank" rel="noopener">✍️ МаьӀна…</a></div>`
        : "";
      return `<div class="dict-item">
        <button class="dict-fb" data-w="${w}" aria-label="✍️ ${dispG(w)}">✍️</button>
        <div class="w">${dispG(w)}</div>
        <button class="dict-speak" data-w="${w}" aria-label="${t("tts.speakLabel")}">🔊</button>
        ${ce ? `<div class="d"><span class="lang">чеч.</span> ${dispG(ce)}</div>` : ""}
        ${tr ? `<div class="d"><span class="lang">тр.</span> ${dispG(tr)}</div>` : ""}
        ${miss}
      </div>`;
    }).join("");
  };
  openPanel(`
    <h2><svg class="h-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-book"/></svg> ${t("dict.title")}</h2>
    <p class="panel-subtitle">${t("dict.desc")}</p>
    <input class="dict-search" id="dict-q" placeholder="${t("dict.search")}" aria-label="${t("dict.searchLabel")}">
    <div id="dict-list">${render("")}</div>
    <div class="btnrow"><button class="btn small" id="dc-close">${t("settings.back")}</button></div>`);
  $("dict-q").addEventListener("input", e=>{ $("dict-list").innerHTML = render(e.target.value); });
  // kelimeye özel geri bildirim (delegasyon: liste aramada yeniden çizilir)
  $("dict-list").addEventListener("click", e=>{
    const target = /** @type {HTMLElement} */(e.target);
    const fb = target.closest?.(".dict-fb");
    if (fb) { openFeedback({ word: fb.dataset.w, type: "fix" }); return; }
    const sp = target.closest?.(".dict-speak");
    if (sp) speak(sp.dataset.w, S.settings.lang);
  });
  $("dc-close").onclick = closePanel;
}

