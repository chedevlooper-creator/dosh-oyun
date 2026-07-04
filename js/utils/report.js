/* ================= HATA BİLDİRİMİ (seam) =================
 * Üretimde gözlemlenebilirlik. Sentry Browser SDK kullanır
 * (VITE_SENTRY_DSN ayarlanmışsa). Kullanıcı izni
 * `localStorage.dosh-consent === "1"` ile kontrol edilir; varsayılan kapalı.
 *
 * Kullanım:
 *   import { reportError } from "../utils/report.js";
 *   try { ... } catch (e) { reportError(e, { where: "scene3d.init" }); }
 *
 * ?debug=1 modunda her zaman console'a yazar. */

import * as Sentry from "@sentry/browser";

const DSN = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SENTRY_DSN) || "";
let sentryReady = false;

function userConsented() {
  try { return globalThis.localStorage?.getItem("dosh-consent") === "1"; } catch { return false; }
}

function debugOn() {
  try { return new URLSearchParams(globalThis.location?.search || "").get("debug") === "1"; }
  catch { return false; }
}

function ensureSentry() {
  if (sentryReady || !DSN) return;
  sentryReady = true;
  try {
    Sentry.init({
      dsn: DSN,
      integrations: [],
      tracesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      enabled: userConsented(),
    });
  } catch (e) {
    console.warn("[report] Sentry init başarısız:", e);
  }
}

/**
 * Bir hatayı raporla. Sessizce yutar; UI'ı bozmamalı.
 * @param {Error|string} err
 * @param {Record<string, any>} [context]
 */
export function reportError(err, context) {
  ensureSentry();

  const payload = {
    msg: (err && err.message) || String(err),
    stack: (err && err.stack) || null,
    where: (context && context.where) || "unknown",
    ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
    t: Date.now(),
  };

  if (debugOn() || userConsented()) {
    try { console.warn("[report]", payload); } catch {}
  }

  if (DSN && userConsented()) {
    try {
      Sentry.captureException(
        err instanceof Error ? err : new Error(String(err)),
        { tags: { where: payload.where }, extra: context || {} },
      );
    } catch { /* sessiz */ }
  }
}

/** Kullanıcının hata raporu iznini oku/yaz (ayarlar ekranı kullanır) */
export function getConsent() { return userConsented(); }
export function setConsent(on) {
  try {
    if (on) localStorage.setItem("dosh-consent", "1");
    else localStorage.removeItem("dosh-consent");
  } catch {}
}

/** global window.onerror hook'u kur. main.js'den çağrılabilir. */
export function installGlobalHandler() {
  if (typeof globalThis === "undefined") return;

  if (DSN) {
    // Sentry aktif: kendi global handler'larını kullanır (init otomatik
    // window.onerror ve unhandledrejection'ı yakalar). Biz manuel
    // listener eklemiyoruz ki çifte raporlama olmasın.
    ensureSentry();
    return;
  }

  // Sentry yok: manuel handler'larla yetin
  globalThis.addEventListener("error", (e) => reportError(e.error || e.message, { where: "window.error" }));
  globalThis.addEventListener("unhandledrejection", (e) => reportError(e.reason, { where: "unhandledrejection" }));
}
