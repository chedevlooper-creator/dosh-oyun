// @ts-check
import { applyTheme } from "./engine/theme.js";
import { show, $, initSplashParticles, hapticTap } from "./utils/helpers.js";
import { ac, MUSIC, SFX } from "./engine/audio.js";
import { dailyLevelId, isDailyDone } from "./engine/daily.js";
import { load } from "./engine/save.js";
import { S } from "./engine/store.js";
import { initGameScreens, startLevel } from "./screens/game.js";
import { getDir } from "./utils/i18n.js";
import { installGlobalHandler } from "./utils/report.js";

"use strict";

/* =========================================================
 * MOBİL TERMAL — dokunmatik cihazlarda Three.js sahnesi
 * varsayılan kapalı. WebGL (3D dağlar, partiküller, bloom)
 * mobil GPU'da sürekli işlem yapar → ısınma + batarya tüketimi.
 * Kullanıcı ayarlardan manuel açabilir. E2E testler kendi
 * localStorage seed'inde bu kararı override eder.
 * ========================================================= */
try {
  const isTouch = matchMedia("(pointer: coarse)").matches;
  if (isTouch && S.settings.scene3d === undefined) {
    S.settings.scene3d = false;
  }
} catch {}

/* ================= STATE YÜKLE ================= */
load();
// Küresel hata yakalayıcıları kur (Sentry + window.onerror + unhandledrejection)
installGlobalHandler();
// documentElement.lang ve dir'i kayıtlı dile senkronize et (varsayılan ce, ltr)
try {
  if (S && S.settings && typeof S.settings.lang === "string") {
    document.documentElement.lang = S.settings.lang;
    document.documentElement.dir = getDir();
  }
} catch {}

/* ================= BAŞLAT ================= */
// P3.5: Hata Ayıklama (Debug) Modu (production build'te tree-shake olur)
const urlParams = new URLSearchParams(window.location.search);
if (import.meta.env.DEV && urlParams.get('debug') === '1') {
  window.__DOSH_DEBUG__ = true;
  console.warn("[DEBUG] Debug modu aktif. Store durumu:", S);
  console.warn("[DEBUG] Kayıt verisini sıfırlamak için: localStorage.removeItem('dosh-save-v1'); location.reload();");
}

applyTheme();
import("./screens/home.js").then(({ renderHome }) => { renderHome(); show("scr-home"); });
initGameScreens();

// PWA kısayolu: /?daily=1 → günlük bulmacayı doğrudan aç (yapılmadıysa)
if (urlParams.get("daily") === "1") {
  if (!isDailyDone()) startLevel(dailyLevelId(), { daily: true });
}

// Editor test play: /?playtest=1
if (urlParams.get("playtest") === "1") {
  try {
    const raw = localStorage.getItem("editor-test-level");
    if (raw) {
      const lv = JSON.parse(raw);
      localStorage.removeItem("editor-test-level");
      // Disable 3D for test play to avoid unnecessary load
      S.settings.scene3d = false;
      setTimeout(() => startLevel(lv.id || 0, {}, lv), 100);
    }
  } catch (e) { console.warn("[playtest]", e); }
}

// 3D sahne artık burada yüklenmez — sadece helpers.js `show()` üzerinden
// oyun/harita ekranına girilince lazy import edilir. Bu, ana ekranda
// Three.js (~489KB) yüklenmesini önleyerek FCP/LCP'yi iyileştirir.

// açılış ekranı: sahne hazır olunca yumuşakça kapan
(function(){
  const sp = $("splash");
  if (!sp) return;
  initSplashParticles();
  const off = () => {
    sp.classList.add("off");
    try{ SFX.transition(); }catch{}
  };
  setTimeout(off, 1400);
  sp.addEventListener("pointerdown", () => { off(); hapticTap(); });
  setTimeout(() => sp.remove(), 2600);
})();

// ilk dokunuşta ses motorunu + müziği başlat (tarayıcı autoplay kuralı)
addEventListener("pointerdown", function once(){
  removeEventListener("pointerdown", once);
  try { ac(); MUSIC.start(); hapticTap(); } catch {}
}, { once: true });

// PWA service worker (vite-plugin-pwa üzerinden otomatik)
import { registerSW } from 'virtual:pwa-register';

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  registerSW({ immediate: true });
}

// Grid resize: game/index.js'deki tek handler kullanılıyor