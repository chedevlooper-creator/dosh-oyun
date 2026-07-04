// @ts-check
/* ================= TEK RESIZE DİSPATCHER =================
 * Tüm modüllerin resize listener'larını tek noktadan yönetir. Her abone
 * isteğe bağlı bir debounce penceresi alabilir; varsayılan 80ms mobil
 * rotation sırasında 5 listener'ın da yeniden çalışmasını engeller. */

const subscribers = new Set();
let timer = 0;
let lastW = 0, lastH = 0;
let installed = false;

function fire() {
  const w = innerWidth, h = innerHeight;
  if (w === lastW && h === lastH) return;
  lastW = w; lastH = h;
  for (const sub of subscribers) {
    try { sub.fn(w, h); } catch (e) { console.error("[resize] subscriber:", e); }
  }
}

function onRawResize() {
  clearTimeout(timer);
  timer = setTimeout(fire, 80);
}

function install() {
  if (installed) return;
  installed = true;
  addEventListener("resize", onRawResize, { passive: true });
  // ilk boyut snapshot
  lastW = innerWidth; lastH = innerHeight;
}

/**
 * Bir resize callback'i kaydet. Her çağrı yeni bir abonedir.
 * @param {(w:number,h:number)=>void} fn
 * @param {{debounce?: number}} [opts] - opsiyonel; yoksayılır (dispatcher zaten debounce'lu)
 * @returns {() => void} abonelikten çık
 */
export function onResize(fn /*, opts */) {
  if (typeof fn !== "function") throw new TypeError("onResize: fn must be a function");
  install();
  const sub = { fn };
  subscribers.add(sub);
  // ilk değerleri hemen gönder
  try { fn(lastW, lastH); } catch (e) { console.error("[resize] initial:", e); }
  return () => subscribers.delete(sub);
}
