// @ts-check
import { applyTheme } from "./engine/theme.js";
import { renderHome } from "./screens/home.js";
import { show, $, initSplashParticles, hapticTap } from "./utils/helpers.js";
import { onResize } from "./utils/resize.js";
import { ac, MUSIC, SFX } from "./engine/audio.js";
import { load } from "./engine/save.js";
import { G, setOnThemeChange, S } from "./engine/store.js";
import { buildGrid, fillCell, initGameScreens } from "./screens/game.js";

"use strict";

/* ================= 3D SAHNE (LAZY) =================
 * Three.js bundle'ı (~600KB) ana yola dahil edilmesin diye dynamic import
 * ile yüklenir. Sahne sadece S.settings.scene3d true olduğunda veya ilk
 * kez ekrana (game/map) girildiğinde başlatılır. */
let GL = null;
let glLoading = null;
function loadGL() {
  if (GL) return Promise.resolve(GL);
  if (glLoading) return glLoading;
  glLoading = import("./fx/scene3d.js").then((m) => {
    GL = m.GL;
    return GL;
  }).catch((e) => {
    console.warn("[main] 3D scene yüklenemedi, devre dışı:", e);
    glLoading = null;
    return null;
  });
  return glLoading;
}

/* ================= STATE YÜKLE ================= */
load();
// documentElement.lang'i kayıtlı dile senkronize et (varsayılan ce kalır)
try { if (S && S.settings && typeof S.settings.lang === "string") document.documentElement.lang = S.settings.lang; } catch {}

/* ================= TEMA → 3D SAHNE BAĞLANTISI ================= */
// Tema değiştiğinde sahne yüklüyse retheme çağır, değilse yükleme tetikle
setOnThemeChange(() => {
  if (GL) { try { GL.retheme(); } catch {} }
  else if (S.settings.scene3d !== false) loadGL();
});

// P3.5: Hata Ayıklama (Debug) Modu
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === '1') {
  window.__DOSH_DEBUG__ = true;
  console.warn("[DEBUG] Debug modu aktif. Store durumu:", S);
  console.warn("[DEBUG] Kayıt verisini sıfırlamak için: localStorage.removeItem('dosh-save-v1'); location.reload();");
}

/* ================= BAŞLAT ================= */
applyTheme(); renderHome(); show("scr-home");
initGameScreens();

// 3D sahne: scene3d setting false ise hiç yükleme, aksi halde idle'da başlat
if (S.settings.scene3d !== false) {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => loadGL().then((gl) => { if (gl) { gl.init(); gl.retheme(); } }));
  } else {
    setTimeout(() => loadGL().then((gl) => { if (gl) { gl.init(); gl.retheme(); } }), 200);
  }
}

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

// Grid'i yeniden boyutlandırmada yeniden inşa et
onResize(() => {
  if (G && $("scr-game") && $("scr-game").classList.contains("on")) {
    const filled = [...G.cells.values()].filter(c => c.filled);
    buildGrid();
    filled.forEach(c => { c.filled = false; fillCell(c, c.hint); });
  }
});
