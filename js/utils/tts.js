// @ts-check
/* ================= TTS (Text-to-Speech) =================
 * Chechen kelimeleri sesli okuma. Web Speech API öncelikli (sıfır maliyet,
 * sıfır bundle); fallback olarak pre-recorded audio (Vercel Blob'da host
 * edilebilir).
 *
 * Kullanıcı tercihi localStorage'da saklanır:
 *   "browser"  → speechSynthesis (varsayılan)
 *   "audio"    → yalnızca pre-recorded audio (düşük kaliteli cihazlarda)
 *   "off"      → kapalı
 *
 * Chechen için native TTS yok. Web Speech API'nin desteklediği en yakın
 * proxy: ru (Rusça). Rusça sesle okunan Chechen metin yine de anlamlı
 * bir yaklaşık telaffuz verir; sesli okuma "audio cue" olarak da değer
 * taşır (erişilebilirlik + hafıza pekiştirme). */

import { track, EVENTS } from "./analytics.js";

const PREF_KEY = "dosh-tts-pref";
const LAST_SPEAK_KEY = "dosh-tts-last";

/** @typedef {"browser" | "audio" | "off"} TtsPref */

/** Kullanıcı tercihini oku. */
export function getPref() {
  try {
    const v = localStorage.getItem(PREF_KEY);
    if (v === "browser" || v === "audio" || v === "off") return v;
  } catch { /* localStorage unavailable */ }
  return "browser";
}

/** Kullanıcı tercihini yaz. */
export function setPref(v) {
  try { localStorage.setItem(PREF_KEY, v); } catch { /* ignore */ }
}

/** TTS tercihi "off" mu? */
export function isOff() {
  return getPref() === "off";
}

/** speechSynthesis API mevcut mu? */
export function isBrowserTtsSupported() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) return true;
  if (typeof globalThis !== "undefined" && "speechSynthesis" in globalThis) return true;
  return false;
}

/** Chechen için en uygun dil kodunu döndürür: önce ce, yoksa ru. */
function pickLang(lang) {
  if (!isBrowserTtsSupported()) return "";
  const ss = (typeof window !== "undefined" && window.speechSynthesis) || globalThis.speechSynthesis;
  const voices = (ss && ss.getVoices) ? ss.getVoices() : [];
  const wanted = [lang, "ce", "ru"];
  for (const code of wanted) {
    if (voices.some((v) => v.lang && v.lang.toLowerCase().startsWith(code))) {
      return code;
    }
  }
  return lang;
}

/** voices yüklenene kadar bekler (ilk kullanımda async). */
function waitForVoices(timeout = 500) {
  return new Promise((resolve) => {
    if (!isBrowserTtsSupported()) return resolve([]);
    const ss = (typeof window !== "undefined" && window.speechSynthesis) || globalThis.speechSynthesis;
    if (!ss) return resolve([]);
    const v = ss.getVoices();
    if (v && v.length) return resolve(v);
    const onVoices = () => {
      if (ss.removeEventListener) ss.removeEventListener("voiceschanged", onVoices);
      resolve(ss.getVoices());
    };
    if (ss.addEventListener) ss.addEventListener("voiceschanged", onVoices);
    setTimeout(() => resolve(ss.getVoices() || []), timeout);
  });
}

/**
 * Kelimeyi sesli oku.
 * @param {string} word - okunacak kelime
 * @param {"ce" | "tr" | "ru"} [lang="ce"] - dil kodu
 * @returns {{ ok: boolean, source: "browser" | "audio" | "skipped" | "unsupported" }}
 */
export async function speak(word, lang = "ce") {
  if (!word) return { ok: false, source: "skipped" };
  if (isOff()) return { ok: false, source: "skipped" };
  const pref = getPref();
  try { localStorage.setItem(LAST_SPEAK_KEY, Date.now().toString()); } catch { /* ignore */ }

  if (pref === "browser" || pref === "audio") {
    if (isBrowserTtsSupported()) {
      try {
        await waitForVoices();
        const utter = new SpeechSynthesisUtterance(word);
        const voiceLang = pickLang(lang);
        if (voiceLang) utter.lang = voiceLang;
        utter.rate = 0.85;
        utter.pitch = 1.0;
        utter.volume = 1.0;
        // Önceki konuşma varsa iptal et (üst üste binme)
        const ss = (typeof window !== "undefined" && window.speechSynthesis) || globalThis.speechSynthesis;
        if (ss) {
          ss.cancel();
          ss.speak(utter);
          track(EVENTS.TTS_PLAY, { word, lang, source: "browser" });
          return { ok: true, source: "browser" };
        } else {
          console.warn("[tts] speechSynthesis destekleniyor ama erişilemedi");
        }
      } catch (e) {
        console.warn("[tts] speechSynthesis başarısız, audio fallback deneniyor:", e);
      }
    }

    // Audio fallback: /audio/<lang>/<word>.mp3
    try {
      const url = audioUrl(word, lang);
      if (url) {
        const audio = new Audio(url);
        audio.play().catch((e) => console.warn("[tts] audio play başarısız:", e));
        track(EVENTS.TTS_PLAY, { word, lang, source: "audio" });
        return { ok: true, source: "audio" };
      }
    } catch (e) {
      console.warn("[tts] audio fallback başarısız:", e);
    }

    return { ok: false, source: "unsupported" };
  }
  return { ok: false, source: "skipped" };
}

/**
 * Pre-recorded audio için URL döndürür. Dosya yoksa null.
 * @param {string} word
 * @param {string} lang
 * @returns {string|null}
 */
export function audioUrl(word, lang) {
  if (!word) return null;
  // normalized word (transliterasyon yok — sadece güvenli karakterlere çevir)
  const safe = word.toLowerCase().replace(/[^a-zа-яё0-9]/gi, "");
  if (!safe) return null;
  return `/audio/${lang}/${safe}.mp3`;
}

/** speak() için DOM-friendly event yayınlar (analytics için). */
const _listeners = new Set();
export function onSpeak(cb) { _listeners.add(cb); return () => _listeners.delete(cb); }
