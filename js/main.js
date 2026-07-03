import { applyTheme } from "./engine/theme.js";
import { renderHome } from "./screens/home.js";
import { show, $ } from "./utils/helpers.js";
import { GL } from "./fx/scene3d.js";
import { ac, MUSIC } from "./engine/audio.js";
import { load, save } from "./engine/save.js";
import { G, setOnThemeChange, S } from "./engine/store.js";
import { buildGrid, fillCell } from "./screens/game.js";

"use strict";

/* ================= STATE YÜKLE ================= */
load();

/* ================= TEMA → 3D SAHNE BAĞLANTISI ================= */
// P1.2: window.applyTheme patch kaldırıldı; doğrudan callback bağlantısı
setOnThemeChange(() => { try { GL.retheme(); } catch (e) {} });

// P3.5: Hata Ayıklama (Debug) Modu
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === '1') {
  window.__DOSH_DEBUG__ = true;
  console.log("[DEBUG] Debug modu aktif. Store durumu:", S);
  console.log("[DEBUG] Kayıt verisini sıfırlamak için: localStorage.removeItem('dosh-save-v1'); location.reload();");
}

/* ================= BAŞLAT ================= */
applyTheme(); renderHome(); show("scr-home");
GL.init(); GL.retheme();

// açılış ekranı: sahne hazır olunca yumuşakça kapan
(function(){
  const sp = $("splash");
  if (!sp) return;
  const off = () => sp.classList.add("off");
  setTimeout(off, 1400);
  sp.addEventListener("pointerdown", off);
  setTimeout(() => sp.remove(), 2600);
})();

// ilk dokunuşta ses motorunu + müziği başlat (tarayıcı autoplay kuralı)
addEventListener("pointerdown", function once(){
  removeEventListener("pointerdown", once);
  try { ac(); MUSIC.start(); } catch (e) {}
}, { once: true });

// PWA service worker (vite-plugin-pwa üzerinden otomatik)
import { registerSW } from 'virtual:pwa-register';

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  registerSW({ immediate: true });
}

// Grid'i yeniden boyutlandırmada yeniden inşa et
addEventListener("resize", () => {
  if (G && $("scr-game") && $("scr-game").classList.contains("on")) {
    const filled = [...G.cells.values()].filter(c => c.filled);
    buildGrid();
    filled.forEach(c => { c.filled = false; fillCell(c, c.hint); });
  }
});
