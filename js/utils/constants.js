/* ================= SABİTLER (orijinal oyunla birebir) ================= */
export const CFG = { startCoins:100, hintCost:25, targetHintCost:35, magicWandCost:60,
  coinsPerGrapheme:5, bonusWordCoins:10, comboMilestone:3, comboBonusCoins:15, dailyGiftCoins:100 };
export function starsFor(mistakes,hints){ if(mistakes===0&&hints===0)return 3; if(mistakes<=2&&hints<=1)return 2; return 1; }

