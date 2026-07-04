// @ts-check
/* ================= ДЕННА ДОШ — GÜNLÜK BULMACA =================
 * Tarihten deterministik seviye seçimi + streak (seri) takibi.
 * Saf mantık modülü: DOM'a dokunmaz, UI bağlantısı home.js/game.js'te.
 * Kayıt alanı: S.daily = { last: "YYYY-M-D", streak, best }
 * (tarih formatı helpers.today() ile aynı — lastGift ile tutarlı). */

import { LEVEL_COUNT } from "../data/level-index.js";
import { CFG } from "../data/config.js";
import { S } from "./store.js";
import { today } from "../utils/helpers.js";

/**
 * Tarih anahtarından deterministik seviye id'si üretir (FNV-1a hash).
 * Aynı gün herkes aynı seviyeyi oynar; ertesi gün değişir.
 * @param {string} [dateStr]
 * @returns {number} 0..LEVEL_COUNT-1
 */
export function dailyLevelId(dateStr = today()) {
  let h = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % LEVEL_COUNT;
}

/**
 * Dünün tarih anahtarı (today() ile aynı format: yıl-ay-gün, sıfırsız).
 * @param {Date} [now]
 */
export function yesterdayKey(now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

/** @param {string} [dateStr] */
export function isDailyDone(dateStr = today()) {
  return S.daily.last === dateStr;
}

/**
 * Günlük bulmaca kazanımını işler: streak günceller, ödülü hesaplar.
 * Aynı gün ikinci kez çağrılırsa hiçbir şey değiştirmez.
 * Coin ekleme çağıranın işi (UI animasyonuyla birlikte yapılır).
 * @param {string} [dateStr]
 * @param {string} [yKey]
 * @returns {{ streak: number, reward: number, already: boolean }}
 */
export function recordDailyWin(dateStr = today(), yKey = yesterdayKey()) {
  if (S.daily.last === dateStr) {
    return { streak: S.daily.streak, reward: 0, already: true };
  }
  const streak = S.daily.last === yKey ? S.daily.streak + 1 : 1;
  const bonusDays = Math.min(streak - 1, CFG.dailyStreakBonusCap);
  const reward = CFG.dailyRewardCoins + bonusDays * CFG.dailyStreakBonus;
  S.daily.last = dateStr;
  S.daily.streak = streak;
  S.daily.best = Math.max(S.daily.best, streak);
  return { streak, reward, already: false };
}

/**
 * Wordle tarzı paylaşım metni: bulmacanın ızgara silüeti (spoiler'sız),
 * tarih, streak alevi ve bonus/temiz-oyun rozetleri.
 * @param {{ cells: Iterable<{r:number,c:number}>, streak: number,
 *           bonus?: number, mistakes?: number, dateStr?: string, url?: string }} p
 * @returns {string}
 */
export function dailyShareText(p) {
  const set = new Set();
  let maxR = 0, maxC = 0;
  for (const c of p.cells) {
    set.add(c.r + "," + c.c);
    maxR = Math.max(maxR, c.r);
    maxC = Math.max(maxC, c.c);
  }
  const rows = [];
  for (let r = 0; r <= maxR; r++) {
    let line = "";
    for (let c = 0; c <= maxC; c++) line += set.has(r + "," + c) ? "🟩" : "⬛";
    rows.push(line);
  }
  const head = "Дош 📅 " + (p.dateStr || today()) + (p.streak > 1 ? " 🔥" + p.streak : "");
  const badges = [];
  if (p.bonus) badges.push("💎" + p.bonus);
  if (p.mistakes === 0) badges.push("✨");
  return [head, badges.join(" "), ...rows, p.url || ""].filter(Boolean).join("\n");
}

/**
 * Görüntülenecek güncel streak: dün ya da bugün oynanmadıysa seri koptu, 0 göster.
 * (Kayıttaki streak değerine dokunmaz; recordDailyWin zaten sıfırdan başlatır.)
 * @param {string} [dateStr]
 * @param {string} [yKey]
 */
export function currentStreak(dateStr = today(), yKey = yesterdayKey()) {
  if (S.daily.last === dateStr || S.daily.last === yKey) return S.daily.streak;
  return 0;
}
