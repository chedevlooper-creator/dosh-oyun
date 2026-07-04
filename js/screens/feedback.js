// @ts-check
/* ================= OYUNCU GERİ BİLDİRİMİ =================
 * Yeni kelime önerisi / kelime düzeltmesi. Backend yok: bildirim,
 * değerlendirme kuyruğu olarak GitHub issue'ya (feedback etiketi) ya da
 * e-postaya gider. Gloss politikası değişmez — gelen öneriler ekip
 * tarafından değerlendirilmeden oyuna girmez. */

import { openPanel, closePanel } from "./panel.js";
import { $ } from "../utils/helpers.js";
import { t } from "../utils/i18n.js";

const REPO_ISSUES = "https://github.com/chedevlooper-creator/dosh-oyun/issues/new";
const MAIL = "che.devlooper@gmail.com";

/**
 * @param {{ word?: string, type?: "new"|"fix" }} [prefill]
 */
export function openFeedback(prefill = {}) {
  const type = prefill.type || "new";
  openPanel(`
    <h2>✍️ ${t("fb.title")}</h2>
    <p class="panel-subtitle">${t("fb.desc")}</p>
    <div class="fb-types" role="radiogroup" aria-label="${t("fb.title")}">
      <button class="btn small ghost fb-type ${type === "new" ? "on" : ""}" data-t="new" role="radio" aria-checked="${type === "new"}">➕ ${t("fb.new")}</button>
      <button class="btn small ghost fb-type ${type === "fix" ? "on" : ""}" data-t="fix" role="radio" aria-checked="${type === "fix"}">✏️ ${t("fb.fix")}</button>
    </div>
    <input class="dict-search" id="fb-word" placeholder="${t("fb.word")}" value="${(prefill.word || "").replace(/"/g, "&quot;")}" aria-label="${t("fb.word")}">
    <textarea class="fb-text" id="fb-text" rows="4" placeholder="${t("fb.msg")}" aria-label="${t("fb.msg")}"></textarea>
    <div class="btnrow">
      <a class="btn small" id="fb-github" target="_blank" rel="noopener" href="#">GitHub ↗</a>
      <a class="btn small ghost" id="fb-mail" href="#">✉️</a>
      <button class="btn small ghost" id="fb-close">${t("settings.back")}</button>
    </div>`);

  let curType = type;
  const sync = () => {
    const word = /** @type {HTMLInputElement} */($("fb-word")).value.trim();
    const msg = /** @type {HTMLTextAreaElement} */($("fb-text")).value.trim();
    const label = curType === "new" ? "word-suggestion" : "word-fix";
    const title = (curType === "new" ? "Дош: " : "Нисдар: ") + (word || "—");
    const body = `Дош: ${word}\n\n${msg}\n\n—\n(oyun içi geri bildirim / in-game feedback)`;
    $("fb-github").setAttribute("href",
      `${REPO_ISSUES}?labels=feedback,${label}&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`);
    $("fb-mail").setAttribute("href",
      `mailto:${MAIL}?subject=${encodeURIComponent("[Дош] " + title)}&body=${encodeURIComponent(body)}`);
  };

  document.querySelectorAll(".fb-type").forEach((b) => {
    b.addEventListener("click", () => {
      curType = /** @type {HTMLElement} */(b).dataset.t === "fix" ? "fix" : "new";
      document.querySelectorAll(".fb-type").forEach((x) => {
        x.classList.toggle("on", x === b);
        x.setAttribute("aria-checked", String(x === b));
      });
      sync();
    });
  });
  $("fb-word").addEventListener("input", sync);
  $("fb-text").addEventListener("input", sync);
  $("fb-close").onclick = closePanel;
  sync();
}
