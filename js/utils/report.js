/* ================= HATA BİLDİRİMİ (seam) =================
 * Üretimde gözlemlenebilirlik için ince bir nokta. Şu an sadece konsola
 * yazıyor; gerçek bir backend (Sentry/PostHog/Cloudflare Analytics Engine)
 * bağlamak için tek bir yere POST atılacak. Kullanıcı izni
 * `localStorage.dosh-consent === "1"` ile kontrol edilir; varsayılan kapalı.
 *
 * Kullanım:
 *   import { reportError } from "../utils/report.js";
 *   try { ... } catch (e) { reportError(e, { where: "scene3d.init" }); }
 *
 * ?debug=1 modunda her zaman console'a yazar (zaten var olan davranış). */

const ENDPOINT = ""; // boş = sadece konsol
let installed = false;

function userConsented() {
  try { return globalThis.localStorage?.getItem("dosh-consent") === "1"; } catch (e) { return false; }
}

function debugOn() {
  try { return new URLSearchParams(globalThis.location?.search || "").get("debug") === "1"; }
  catch (e) { return false; }
}

/**
 * Bir hatayı raporla. Sessizce yutar; UI'ı bozmamalı.
 * @param {Error|string} err
 * @param {Record<string, any>} [context]
 */
export function reportError(err, context) {
  if (installed === false) installed = true; // bir kez flag'le (no-op)
  const payload = {
    msg: (err && err.message) || String(err),
    stack: (err && err.stack) || null,
    where: (context && context.where) || "unknown",
    ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
    t: Date.now(),
  };
  if (debugOn() || userConsented()) {
    // konsola yaz (debug=1 modunda her zaman; aksi halde izin varsa)
    try { console.warn("[report]", payload); } catch (e) {}
  }
  if (ENDPOINT && userConsented()) {
    // network: reportError çağrısı asla UI'ı bloklamamalı
    try {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => { /* sessiz */ });
    } catch (e) { /* sessiz */ }
  }
}

/** global window.onerror hook'u kur. main.js'den çağrılabilir. */
export function installGlobalHandler() {
  if (typeof globalThis === "undefined") return;
  globalThis.addEventListener("error", (e) => reportError(e.error || e.message, { where: "window.error" }));
  globalThis.addEventListener("unhandledrejection", (e) => reportError(e.reason, { where: "unhandledrejection" }));
}
