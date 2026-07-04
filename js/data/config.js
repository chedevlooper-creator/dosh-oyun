// @ts-check
/* ================= CFG — Oyun Yapılandırması ================= */

/**
 * Oyun parametreleri (orijinal oyunla birebir)
 * @type {Object}
 * @property {number} startCoins - Başlangıç coini
 * @property {number} hintCost - Harf ipucu maliyeti
 * @property {number} targetHintCost - Hedef ipucu maliyeti
 * @property {number} magicWandCost - Sihirli değnek maliyeti
 * @property {number} coinsPerGrapheme - Harf başına kazanılan coin
 * @property {number} bonusWordCoins - Bonus kelime başına coin
 * @property {number} comboMilestone - Combo eşiği
 * @property {number} comboBonusCoins - Combo bonus coini
 * @property {number} dailyGiftCoins - Günlük hediye coini
 */
const CFG = {
  startCoins: 100,
  hintCost: 25,
  targetHintCost: 35,
  magicWandCost: 60,
  coinsPerGrapheme: 5,
  bonusWordCoins: 10,
  comboMilestone: 3,
  comboBonusCoins: 15,
  dailyGiftCoins: 100,
  dailyRewardCoins: 50,
  dailyStreakBonus: 10,
  dailyStreakBonusCap: 7,
};

/**
 * Yıldız hesaplama
 * @param {number} mistakes - Hata sayısı
 * @param {number} hints - Kullanılan ipucu sayısı
 * @returns {number} 1, 2 veya 3 yıldız
 */
function starsFor(mistakes, hints) {
  if (mistakes === 0 && hints === 0) return 3;
  if (mistakes <= 2 && hints <= 1) return 2;
  return 1;
}

export { CFG, starsFor };
