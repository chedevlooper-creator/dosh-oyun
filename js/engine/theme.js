// @ts-check
import { S } from "./store.js";

/* ================= TEMA =================
 * Tema değişimi iki şey yapar:
 * 1. <body> üzerine 'theme-*' class'ı uygular (CSS değişkenleri için)
 * 2. Aktif temanın arka plan fotoğrafını (data-t ile eşleşen .ph divi) yükler.
 *    Diğer temaların fotoğrafları sayfa açılışında değil, ilk kez o temaya
 *    geçildiğinde indirilir — bu 5×JPG (~2.4MB) maliyetini başlangıçtan
 *    kaldırır (F13). */

export const THEMES = [
  {id:"kavkaz", name:"Кавказ", dot:"linear-gradient(135deg,#7ec8e3,#123c5a)", img:"bg-kavkaz.jpg"},
  {id:"night",  name:"Буьйса", dot:"linear-gradient(135deg,#1b2450,#070a20)", img:"bg-night.jpg"},
  {id:"forest", name:"Хьун",   dot:"linear-gradient(135deg,#a8d5a2,#1d5c40)", img:"bg-forest.jpg"},
  {id:"autumn", name:"Гуьйре", dot:"linear-gradient(135deg,#ffd9a0,#8a4530)", img:"bg-autumn.jpg"},
  {id:"winter", name:"Ӏа",     dot:"linear-gradient(135deg,#dceefb,#4a7ba6)", img:"bg-winter.jpg"},
];

/* WebP yarı boyut (scripts/optimize-images.mjs üretir); desteklemeyen
 * eski Safari (<14) JPEG'e düşer. Canvas encode desteği decode desteğinin
 * güvenli bir alt kümesi olduğundan yanlış pozitif vermez. */
const WEBP_OK = (() => {
  try {
    return document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
  } catch { return false; }
})();
function themeImg(t){
  return WEBP_OK ? t.img.replace(/\.jpg$/, ".webp") : t.img;
}

// başlangıçta aktif temanın fotoğrafını hemen yükle (FOUC'suz)
function preloadInitial(){
  const initial = S?.settings?.theme || "kavkaz";
  const el = document.querySelector(`#photo .ph[data-t="${initial}"]`);
  if (el && !el.style.backgroundImage) {
    const theme = THEMES.find(t => t.id === initial) || THEMES[0];
    el.style.backgroundImage = `url('${themeImg(theme)}')`;
  }
}

export function applyTheme(){
  // eski tema class'larını kaldır
  for (const c of [...document.body.classList]) {
    if (c.startsWith("theme-")) document.body.classList.remove(c);
  }
  document.body.classList.add("theme-"+S.settings.theme);
  // aktif temayı görünür yap, diğerlerini gizle (CSS .on seçici ile)
  const activeId = S.settings.theme;
  document.querySelectorAll("#photo .ph").forEach(el => {
    if (el.dataset.t === activeId) {
      // lazy: eğer daha önce yüklenmediyse şimdi yükle
      if (!el.style.backgroundImage) {
        const t = THEMES.find(th => th.id === el.dataset.t);
        if (t) el.style.backgroundImage = `url('${themeImg(t)}')`;
      }
      el.classList.add("on");
    } else {
      el.classList.remove("on");
    }
  });
}

// ilk yükleme: HTML body parse edilmeden çağrılırsa el bulunamaz;
// applyTheme()'in ilk çağrısı yine de yükleyecek. Yine de erken başlatmak için:
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", preloadInitial, { once: true });
  } else {
    preloadInitial();
  }
}
