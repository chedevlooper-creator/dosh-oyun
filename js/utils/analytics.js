// @ts-check
/* ================= ANALYTICS =================
 * Vercel Analytics + Sentry breadcrumbs üzerinden custom event takibi.
 * Vercel Analytics otomatik pageview + Web Vitals sağlar; bu modül
 * custom UI event'lerini (level_start, level_complete, hint_used, vb.)
 * yayınlar.
 *
 * Kullanım:
 *   import { track } from "../utils/analytics.js";
 *   track("level_start", { level: 5, pack: 1 });
 *
 * Vercel Dashboard: Settings → Analytics → Enable
 * Sentry Dashboard: breadcrumbs ve custom data otomatik görünür. */

/** @typedef {string} EventName */
/** @typedef {Record<string, any>} EventProps */

/** Bilinen event listesi (analytics dashboard'da kategori olarak kullanılır). */
export const EVENTS = Object.freeze({
  LEVEL_START: "level_start",
  LEVEL_COMPLETE: "level_complete",
  LEVEL_QUIT: "level_quit",
  HINT_USED: "hint_used",
  DAILY_COMPLETE: "daily_complete",
  LANG_CHANGE: "lang_change",
  TTS_PLAY: "tts_play",
});

/** Vercel Analytics dynamic load için sayaç. */
let _loaded = false;

/**
 * Vercel Analytics'i runtime'da yükle (lazy — performans için).
 * Vercel env'de VERCEL_ANALYTICS_ID veya window.va otomatik inject edilir.
 * Eğer inject edilmediyse, sessizce no-op.
 */
function ensureVercelLoaded() {
  if (_loaded) return;
  _loaded = true;
  if (typeof window === "undefined") return;
  // Vercel Analytics, snippet'i deploy sırasında otomatik enjekte eder.
  // Burada ekstra yükleme gerekmiyor; sadece window.va var mı kontrolü.
}

let _Sentry = null;
let _sentryLoad = null;

async function _getSentry() {
  if (_Sentry) return _Sentry;
  if (_sentryLoad) return _sentryLoad;
  _sentryLoad = import("@sentry/browser").then((m) => {
    _Sentry = m;
    return _Sentry;
  }).catch(() => { _sentryLoad = null; return null; });
  return _sentryLoad;
}

async function _breadcrumb(event, data) {
  if (!event) return;
  const Sentry = await _getSentry();
  if (!Sentry || !Sentry.addBreadcrumb) return;
  try {
    Sentry.addBreadcrumb({
      category: "ui",
      message: event,
      data,
      level: "info",
    });
  } catch { /* sentry yoksa sessiz */ }
}

/**
 * Event yayınla. Vercel Analytics + Sentry breadcrumb.
 * @param {EventName} event
 * @param {EventProps} [props]
 */
export function track(event, props = {}) {
  if (!event) return;
  const safeProps = sanitize(props);

  // Vercel Analytics
  ensureVercelLoaded();
  try {
    if (typeof window !== "undefined" && typeof window.va === "function") {
      window.va("track", event, safeProps);
    }
  } catch { /* Vercel analytics yoksa sessizce geç */ }

  // Sentry breadcrumb (async — fire-and-forget)
  _breadcrumb(event, safeProps);

  // Konsola debug amaçlı (production'da kapatılabilir, default: kapalı)
  if (globalThis.__ANALYTICS_DEBUG) {
    console.warn(`[analytics] ${event}`, safeProps);
  }
}

/** PII / büyük obje temizliği. */
function sanitize(props) {
  if (!props || typeof props !== "object") return {};
  const out = {};
  for (const k of Object.keys(props)) {
    const v = props[k];
    if (v == null) continue;
    if (typeof v === "function") continue;
    if (typeof v === "string" && v.length > 200) {
      out[k] = v.slice(0, 200);
    } else if (typeof v === "object") {
      out[k] = sanitize(v); // recursive
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Sayfa görüntüleme event'i. SPA route'ları için manuel çağrılabilir. */
export function pageview(name) {
  ensureVercelLoaded();
  try {
    if (typeof window !== "undefined" && typeof window.va === "function") {
      window.va("pageview", { name });
    }
  } catch { /* no-op */ }
}
