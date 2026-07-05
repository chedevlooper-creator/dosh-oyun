// @ts-check
/* ================= SÖZLÜK EKRANI =================
 * Tüm Çeçence kelimelerin görüntülendiği "yaşayan arşiv" ekranı.
 * Sadece oyunda çözülmüş kelimeleri değil, INFO'daki tüm kelimeleri
 * gösterir — çözülmemiş olanlar "henüz karşılaşmadın" rozeti ile.
 *
 * Erişilebilir: arama, kategori filtresi, TTS, katkı butonu. */

import { S } from "../engine/store.js";
import { dispG } from "../engine/grapheme.js";
import { openPanel, closePanel } from "./panel.js";
import { $ } from "../utils/helpers.js";
import { openFeedback } from "./feedback.js";
import { t } from "../utils/i18n.js";
import { speak } from "../utils/tts.js";
import * as dict from "../data/dictionary.js";

/** Anlamı eksik kelime için önceden doldurulmuş GitHub issue bağlantısı */
function contribURL(w) {
  const title = encodeURIComponent(`МаьӀна: ${w}`);
  const body = encodeURIComponent(`Дош: ${w}\n\nчеч. (нохчийн маьӀна):\n\ntr (Türkçe anlam):\n\nKaynak (Wiktionary vb.):`);
  return `https://github.com/chedevlooper-creator/dosh-oyun/issues/new?title=${title}&body=${body}&labels=word-gloss`;
}

/**
 * Tek bir kelime satırı renderla.
 * @param {import("../data/dictionary.js").DictEntry} e
 */
function renderItem(e) {
  const ce = e.gloss.ce || "";
  const tr = e.gloss.tr || "";
  const miss = !ce && !tr
    ? `<div class="d dict-miss"><a href="${contribURL(e.lemma)}" target="_blank" rel="noopener">✍️ МаьӀна…</a></div>`
    : "";

  const examples = (e.examples || []).slice(0, 2).map((ex) =>
    `<div class="d dict-ex">"${dispG(ex)}"</div>`,
  ).join("");

  const ipa = e.ipa ? `<span class="dict-ipa">[${e.ipa}]</span>` : "";
  const tags = (e.tags || []).slice(0, 3).map((tag) =>
    `<span class="dict-tag">${tag}</span>`,
  ).join("");

  const statusBadge = e.found
    ? `<span class="dict-badge dict-badge-found" aria-label="Bu kelimeyi oyunda çözdün">✓</span>`
    : `<span class="dict-badge" aria-label="Henüz karşılaşmadın">○</span>`;

  return `<div class="dict-item">
    <button class="dict-fb" data-w="${e.lemma}" aria-label="✍️ ${dispG(e.lemma)}">✍️</button>
    <div class="w">${dispG(e.lemma)} ${ipa} ${statusBadge} ${tags}</div>
    <button class="dict-speak" data-w="${e.lemma}" aria-label="${t("tts.speakLabel")}">🔊</button>
    ${ce ? `<div class="d"><span class="lang">чеч.</span> ${dispG(ce)}</div>` : ""}
    ${tr ? `<div class="d"><span class="lang">тр.</span> ${dispG(tr)}</div>` : ""}
    ${examples}
    ${miss}
  </div>`;
}

export function openDict() {
  // başlangıç state: tüm kelimeler, sadece oyunda çözülmüş olanlar
  // başlangıç state: tüm kelimeler, sadece oyunda çözülmüş olanlar
  const state = { q: "", tags: [], onlyFound: false, onlyMissing: false };

  const render = () => {
    const opts = {};
    if (state.q) opts.sortBy = "lemma";
    if (state.tags.length) opts.tags = state.tags;
    if (state.onlyFound) opts.onlyFound = true;
    if (state.onlyMissing) opts.onlyMissing = true;
    if (state.q) opts.limit = 200; // güvenlik: sınırsız scroll
    const list = dict.search(state.q, opts);
    if (!list.length) {
      return `<p class="empty-state">${state.q ? t("dict.notFound") : t("dict.empty")}</p>`;
    }
    return list.map(renderItem).join("");
  };

  const stat = dict.stats();
  const tagList = dict.listTags();
  const allTagsRow = tagList.map((tg) =>
    `<button class="dict-tag-btn ${state.tags.includes(tg) ? 'on' : ''}" data-tag="${tg}">${tg}</button>`,
  ).join("");

  openPanel(`
    <h2><svg class="h-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-book"/></svg> ${t("dict.title")}</h2>
    <p class="panel-subtitle">${t("dict.desc")}</p>
    <div class="dict-stats" aria-label="Sözlük istatistikleri">
      <span><b>${stat.total}</b> ${t("dict.total") || "toplam"}</span>
      <span><b>${stat.withGloss}</b> ${t("dict.glossed") || "anlamlı"}</span>
      <span><b>${stat.found}</b> ${t("dict.found") || "çözülmüş"}</span>
      <span><b>${stat.missing}</b> ${t("dict.missing") || "eksik"}</span>
    </div>
    <div class="dict-toolbar">
      <input class="dict-search" id="dict-q" placeholder="${t("dict.search")}" aria-label="${t("dict.searchLabel")}" value="${state.q}">
      <label class="dict-toggle"><input type="checkbox" id="dict-only-found" ${state.onlyFound ? "checked" : ""}> ${t("dict.foundOnly") || "Sadece çözülmüş"}</label>
      <label class="dict-toggle"><input type="checkbox" id="dict-only-missing" ${state.onlyMissing ? "checked" : ""}> ${t("dict.missingOnly") || "Sadece eksik"}</label>
    </div>
    <div class="dict-tags-row" role="group" aria-label="Kategori filtresi">${allTagsRow}</div>
    <div id="dict-list" class="dict-list">${render()}</div>
    <div class="btnrow">
      <button class="btn small ghost" id="dict-export-json" aria-label="JSON olarak dışa aktar">⬇ JSON</button>
      <button class="btn small ghost" id="dict-export-csv" aria-label="CSV olarak dışa aktar">⬇ CSV</button>
      <button class="btn small" id="dc-close">${t("settings.back")}</button>
    </div>`);

  const $q = $("dict-q");
  $q.addEventListener("input", (e) => {
    state.q = e.target.value;
    $("dict-list").innerHTML = render();
  });
  $("dict-only-found").addEventListener("change", (e) => {
    state.onlyFound = e.target.checked;
    state.onlyMissing = false;
    $("dict-only-missing").checked = false;
    $("dict-list").innerHTML = render();
  });
  $("dict-only-missing").addEventListener("change", (e) => {
    state.onlyMissing = e.target.checked;
    state.onlyFound = false;
    $("dict-only-found").checked = false;
    $("dict-list").innerHTML = render();
  });
  // Tag toggle
  $("dict-list").parentElement.querySelectorAll(".dict-tag-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tg = btn.dataset.tag;
      if (state.tags.includes(tg)) {
        state.tags = state.tags.filter((x) => x !== tg);
        btn.classList.remove("on");
      } else {
        state.tags.push(tg);
        btn.classList.add("on");
      }
      $("dict-list").innerHTML = render();
    });
  });
  // Liste içi delegation
  $("dict-list").addEventListener("click", (e) => {
    const target = /** @type {HTMLElement} */(e.target);
    const fb = target.closest?.(".dict-fb");
    if (fb) { openFeedback({ word: fb.dataset.w, type: "fix" }); return; }
    const sp = target.closest?.(".dict-speak");
    if (sp) speak(sp.dataset.w, S.settings.lang);
  });
  // Export
  $("dict-export-json").onclick = () => {
    const blob = new Blob([dict.exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dosh-dictionary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  $("dict-export-csv").onclick = () => {
    const blob = new Blob([dict.exportCSV()], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dosh-dictionary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  $("dc-close").onclick = closePanel;
}
