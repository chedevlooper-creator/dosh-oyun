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

let _Sentry = null;
let _sentryLoad = null;

const DSN = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SENTRY_DSN) || "";

function userConsented() {
  try { return globalThis.localStorage?.getItem("dosh-consent") === "1"; } catch { return false; }
}

function debugOn() {
  try { return new URLSearchParams(globalThis.location?.search || "").get("debug") === "1"; }
  catch { return false; }
}

async function _getSentry() {
  if (_Sentry) return _Sentry;
  if (_sentryLoad) return _sentryLoad;
  _sentryLoad = import("@sentry/browser").then((m) => {
    _Sentry = m;
    try {
      _Sentry.init({
        dsn: DSN,
        integrations: [],
        defaultIntegrations: false,
        tracesSampleRate: 0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        enabled: userConsented(),
      });
    } catch (e) {
      console.warn("[report] Sentry init başarısız:", e);
      _Sentry = null;
    }
    return _Sentry;
  }).catch((e) => {
    console.warn("[report] Sentry yüklenemedi:", e);
    _sentryLoad = null;
    return null;
  });
  return _sentryLoad;
}

function ensureSentry() {
  if ((_Sentry || _sentryLoad) || !DSN) return;
  _getSentry();
}

/**
 * Bir hatayı raporla. Sessizce yutar; UI'ı bozmamalı.
 * @param {Error|string} err
 * @param {Record<string, any>} [context]
 */
export function reportError(err, context) {
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
    _capture(err, context, payload.where);
  }
}

async function _capture(err, context, where) {
  const Sentry = await _getSentry();
  if (!Sentry) return;
  try {
    Sentry.captureException(
      err instanceof Error ? err : new Error(String(err)),
      { tags: { where }, extra: context || {} },
    );
  } catch { /* sessiz */ }
}

/** Kullanıcının hata raporu iznini oku/yaz (ayarlar ekranı kullanır) */
export function getConsent() { return userConsented(); }
export function setConsent(on) {
  try {
    if (on) {
      localStorage.setItem("dosh-consent", "1");
      if (DSN) ensureSentry(); // consent verilince Sentry lazy-load başlat
    }
    else localStorage.removeItem("dosh-consent");
  } catch {}
}

/** global window.onerror hook'u kur. main.js'den çağrılabilir. */
export function installGlobalHandler() {
  if (typeof globalThis === "undefined") return;

  // Her zaman manuel handler'ları senkron kur (Sentry arkada yüklenir,
  // integrations: [] ile çifte raporlama olmaz)
  globalThis.addEventListener("error", (e) => reportError(e.error || e.message, { where: "window.error" }));
  globalThis.addEventListener("unhandledrejection", (e) => reportError(e.reason, { where: "unhandledrejection" }));

  // Sentry sadece kullanıcı izin verirse yüklenir (lazy)
  // consent sonradan setConsent(true) ile verilirse ensureSentry tetiklenir
}
