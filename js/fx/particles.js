// @ts-check
/* ================= KONFETİ / PARTICLE F/X ================= */

import { prefersReducedMotion } from "../utils/helpers.js";
import { onResize } from "../utils/resize.js";

const fx = document.getElementById("fx");
const fctx = fx ? fx.getContext("2d") : null;
const parts = [];
let raf = 0;
let lastDrawn = 0;

function fxSize() {
  if (!fx || !fctx) return;
  const dpr = Math.min(devicePixelRatio, 2);
  fx.width = innerWidth * dpr;
  fx.height = innerHeight * dpr;
  fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
onResize(fxSize);

/**
 * Konfeti patlat
 * @param {number} n - Parçacık sayısı
 */
function confetti(n = 90) {
  if (!fctx || prefersReducedMotion()) return;
  const colors = ["#ffc94d", "#43d9a3", "#7ad0ff", "#ff8fa3", "#c9a3ff", "#ffffff"];
  for (let i = 0; i < n; i++) {
    parts.push({
      x: innerWidth / 2 + (Math.random() - 0.5) * 160,
      y: innerHeight * 0.32,
      vx: (Math.random() - 0.5) * 11,
      vy: -Math.random() * 11 - 3,
      g: .28,
      r: Math.random() * 5 + 3,
      c: colors[(Math.random() * colors.length) | 0],
      a: 1,
      rot: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.3,
    });
  }
  ensureLoop();
}

function ensureLoop() {
  if (raf) return;
  let last = 0;
  const step = (t) => {
    if (!fctx) { raf = 0; return; }
    // parçacık yoksa ve 800ms'dir çizim yapılmadıysa loop'u durdur
    if (parts.length === 0) {
      if (t - lastDrawn > 800) { raf = 0; return; }
    }
    if (t - last < 16) { raf = requestAnimationFrame(step); return; }
    last = t; lastDrawn = t;
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    let wi = 0;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].a > 0.02 && parts[i].y < innerHeight + 30) parts[wi++] = parts[i];
    }
    parts.length = wi;
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += p.g;
      p.rot += p.vr; p.a -= 0.004;
      fctx.save();
      fctx.globalAlpha = p.a;
      fctx.translate(p.x, p.y);
      fctx.rotate(p.rot);
      fctx.fillStyle = p.c;
      fctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
      fctx.restore();
    }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

/**
 * Uçan para animasyonu
 * @param {HTMLElement|null} fromEl - Kaynak element
 * @param {number} n - Para sayısı
 */
function flyCoins(fromEl, n = 5) {
  if (prefersReducedMotion() || !fctx) return;
  const target = document.getElementById("game-coins");
  if (!target) return;
  const targetRect = target.getBoundingClientRect();
  const fromRect = fromEl
    ? fromEl.getBoundingClientRect()
    : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };

  for (let i = 0; i < Math.min(n, 7); i++) {
    const c = document.createElement("div");
    c.className = "flycoin"; c.textContent = "🪙";
    c.style.left = (fromRect.left + fromRect.width / 2) + "px";
    c.style.top = (fromRect.top + fromRect.height / 2) + "px";
    document.body.appendChild(c);
    requestAnimationFrame(() => {
      setTimeout(() => {
        c.style.left = targetRect.left + "px";
        c.style.top = targetRect.top + "px";
        c.style.opacity = "0";
        c.style.transform = "scale(.4)";
      }, i * 70);
    });
    setTimeout(() => c.remove(), 1100 + i * 70);
  }
}

export { confetti, flyCoins, fxSize };
