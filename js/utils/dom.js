/* ================= DOM YARDIMCILARI ================= */

/**
 * getElementById kısayolu
 * @param {string} id
 * @returns {HTMLElement|null}
 */
const $ = (id) => document.getElementById(id);

/** Son açılan panel odağı (geri yüklemek için) */
let _lastFocus = null;

/** Toast bildirim zamanlayıcısı */
let toastTimer = 0;

/**
 * Ekran göster/gizle
 * @param {string} scr - Ekran ID'si (ör: "scr-home")
 */
function show(scr) {
  document.querySelectorAll(".screen").forEach((s) => {
    s.classList.remove("on");
    s.setAttribute("aria-hidden", "true");
    s.inert = true;
  });
  const el = $(scr);
  el.classList.add("on");
  el.setAttribute("aria-hidden", "false");
  el.inert = false;
}

/**
 * Toast bildirimi göster
 * @param {string} msg - Mesaj metni
 * @param {string} [cls] - CSS class (gold, bad)
 */
function toast(msg, cls = "") {
  const t = $("toast");
  t.textContent = msg;
  t.className = "on " + cls;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ""), 1800);
}

/**
 * Panel (modal) aç
 * @param {string} html - Panel içeriği HTML
 */
function openPanel(html) {
  _lastFocus = document.activeElement;
  const p = $("panel");
  p.innerHTML = html;
  const v = $("veil");
  v.classList.add("on");
  v.setAttribute("aria-hidden", "false");
  v.setAttribute("aria-modal", "true");
  const h = p.querySelector("h2");
  if (h) {
    if (!h.id) h.id = "panel-h";
    v.setAttribute("aria-labelledby", h.id);
  }
  const f = p.querySelector("button, input, [tabindex]");
  if (f) f.focus({ preventScroll: true });
  else p.focus({ preventScroll: true });
}

/**
 * Panel kapat
 */
function closePanel() {
  const v = $("veil");
  v.classList.remove("on");
  v.removeAttribute("aria-modal");
  v.removeAttribute("aria-labelledby");
  v.setAttribute("aria-hidden", "true");
  if (_lastFocus && _lastFocus.focus) {
    try { _lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }
}

/**
 * Coin gösterimlerini güncelle
 * @param {import("../engine/save.js").S} S
 */
function updateCoins(S) {
  ["home-coins", "map-coins", "game-coins"].forEach((id) => {
    const e = $(id);
    if (e) e.textContent = S.coins;
  });
}

export { $, show, toast, openPanel, closePanel, updateCoins };
