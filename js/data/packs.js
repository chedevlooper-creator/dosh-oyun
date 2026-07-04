// @ts-check
/* ================= PACK METADATA =================
 * Each pack covers 25 levels. Names are derived from the level content
 * themes (household / nature / community / culture) — they are packaging
 * strings, not Chechen content that needs native-speaker review.
 *
 * `theme` is a hint to the map screen / home screen: it does NOT change
 * the global active theme (the user picks that in settings). It just
 * suggests a mood and is rendered as a small badge.
 */
export const PACKS = [
  {
    id: 1,
    title: { ce: "ДОШ — Дешнаш", tr: "Dersler", ru: "Уроки" },
    subtitle: { ce: "ХӀара дош", tr: "Temel sözcükler", ru: "Базовые слова" },
    intro: {
      ce: "Цхьа хӀава, цхьа дош. ХӀинца кхочушбеш.",
      tr: "Bir harf, bir kelime. Şimdi öğren.",
      ru: "Одна буква, одно слово. Начни сейчас.",
    },
    theme: "kavkaz",
  },
  {
    id: 2,
    title: { ce: "АьЛ — Дахар", tr: "Doğa", ru: "Природа" },
    subtitle: { ce: "Тахана, хи, хӀорд", tr: "Toprak, su, deniz", ru: "Земля, вода, море" },
    intro: {
      ce: "Дахаран дешнаш — тахана, хи, малх.",
      tr: "Yaşamın kelimeleri: toprak, su, güneş.",
      ru: "Слова жизни: земля, вода, солнце.",
    },
    theme: "forest",
  },
  {
    id: 3,
    title: { ce: "ЮЬР — Юкъаралла", tr: "Birlik", ru: "Община" },
    subtitle: { ce: "Стаг, доьзал, элла", tr: "İnsan, aile, köy", ru: "Человек, семья, село" },
    intro: {
      ce: "Стагнаш юкъара — дешнаш, низам, ден.",
      tr: "İnsanlar arasında: sözler, düzen, gün.",
      ru: "Между людьми: слова, порядок, дни.",
    },
    theme: "autumn",
  },
  {
    id: 4,
    title: { ce: "НОХЧО — Тахан", tr: "Vatan", ru: "Родина" },
    subtitle: { ce: "Нохчий, мохк, тайп", tr: "Çeçen, toprak, teyit", ru: "Чечня, земля, тейп" },
    intro: {
      ce: "Нохчийн мохк — дешнаш ларйеш лаьца.",
      tr: "Çeçen toprağı — kelimelerle anlatılır.",
      ru: "Чеченская земля — словами описана.",
    },
    theme: "winter",
  },
  {
    id: 5,
    title: { ce: "БУЬЙСА — Дешнаш", tr: "Gece", ru: "Ночь" },
    subtitle: { ce: "Дошам, болх, дахар", tr: "Sözlük, iş, yaşam", ru: "Словарь, труд, жизнь" },
    intro: {
      ce: "Кхин дӀа — дешнаш а, дошам а.",
      tr: "Devam et — yeni bulmacalar, aynı sözlük.",
      ru: "Продолжай — новые уровни, тот же словарь.",
    },
    theme: "night",
  },
];

export function packFor(packId) {
  return PACKS.find((p) => p.id === packId) || null;
}
