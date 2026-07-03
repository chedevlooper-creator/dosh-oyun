/* ================= SES (WebAudio Sentez) ================= */

import { S } from "../engine/save.js";

let AC = null;

/**
 * AudioContext al (tembel başlatma)
 * @returns {AudioContext}
 */
function ac() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === "suspended") AC.resume();
  return AC;
}

/**
 * Basit ton (oscillator) üret
 * @param {number} f - Frekans (Hz)
 * @param {number} dur - Süre (sn)
 * @param {OscillatorType} type - Dalga türü
 * @param {number} vol - Ses seviyesi
 * @param {number} when - Gecikme (sn)
 */
function tone(f, dur = 0.12, type = "sine", vol = 0.16, when = 0) {
  if (!S.settings.sound) return;
  try {
    const ctx = ac(), t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  } catch (e) { /* ignore */ }
}

/** Ses efektleri */
const SFX = {
  pick(i) { tone(430 + i * 55, .09, "sine", .14); },
  solve() { [523, 659, 784].forEach((f, i) => tone(f, .16, "sine", .16, i * .07)); },
  bonus() { [880, 1174].forEach((f, i) => tone(f, .12, "triangle", .15, i * .08)); },
  coin() { tone(1318, .09, "triangle", .12); },
  bad() { tone(150, .2, "sawtooth", .12); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, .22, "sine", .16, i * .1)); },
  hint() { tone(987, .14, "sine", .13); tone(1318, .14, "sine", .11, .1); },
  gift() { [659, 784, 987, 1318].forEach((f, i) => tone(f, .18, "triangle", .15, i * .09)); },
};

/**
 * Ortam müziği (sentezlenmiş pentatonik, dosyasız)
 */
const MUSIC = (() => {
  let running = false, timer = 0, master = null, next = 0, step = 0;
  // Kafkas havası: mi minör pentatonik
  const SCALE = [164.81, 196.0, 220.0, 246.94, 293.66, 329.63, 392.0];

  function ensure() {
    const ctx = ac();
    if (!master) {
      master = ctx.createGain();
      master.gain.value = 0.05;
      master.connect(ctx.destination);
    }
    return ctx;
  }

  function pluck(ctx, f, t, dur) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = "triangle"; o.frequency.value = f;
    lp.type = "lowpass"; lp.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function pad(ctx, f, t, dur) {
    [f, f * 1.5].forEach((ff, k) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = ff / 2;
      o.detune.value = k ? 6 : -6;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.22 / (k + 1), t + dur * 0.4);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.1);
    });
  }

  function schedule() {
    if (!running) return;
    const ctx = ensure();
    while (next < ctx.currentTime + 2.4) {
      const beat = 0.9;
      if (step % 8 === 0) pad(ctx, SCALE[[0, 2, 4][(step / 8 | 0) % 3]], next, beat * 8);
      if (step % 2 === 0) {
        const f = SCALE[(Math.random() * SCALE.length) | 0] * (Math.random() < 0.3 ? 2 : 1);
        pluck(ctx, f, next + Math.random() * 0.06, beat * 1.6);
      }
      next += beat; step++;
    }
  }

  return {
    start() {
      if (running || !S.settings.music) return;
      try {
        const ctx = ensure();
        running = true;
        next = ctx.currentTime + 0.1;
        step = 0;
        timer = setInterval(schedule, 800);
        schedule();
      } catch (e) { /* ignore */ }
    },
    stop() { running = false; clearInterval(timer); },
    toggle(on) {
      S.settings.music = on;
      save();
      if (on) this.start(); else this.stop();
    },
  };
})();

export { ac, tone, SFX, MUSIC };
