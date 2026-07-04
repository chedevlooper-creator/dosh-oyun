// @ts-check
/* ================= ÇOKLU DİL (i18n) ALTYAPISI ================= */

import { S, commitSettings } from "../engine/store.js";

/** Dil kodu → yön eşlemesi */
export const DIR_MAP = {
  ce: "ltr",
  ru: "ltr",
  tr: "ltr",
  // Gelecekte RTL diller: ar: "rtl", fa: "rtl", he: "rtl", ku: "rtl", ur: "rtl"
};

/** Mevcut dilin yönünü döndürür */
export function getDir() {
  const lang = S.settings.lang || "ce";
  return DIR_MAP[lang] || "ltr";
}

const translations = {
  ce: {
    // Ana Ekran
    "home.start": "Ловза йолае ▶",
    "home.continue": "Кхин дӀа ▶",
    "home.play": "Ловзар",
    // Harita
    "map.title": "ТӀегӀанийн карта",
    "map.pack": "ДАКЪА",
    "map.level": "ТӀегӀа",
    "map.now": "ХӀинца",
    "map.locked": "ГӀайгӀа",
    "map.lockMsg": "Хьалхара тӀегӀа чекхйаккха 🔒",
    // Oyun
    "game.level": "ТӀЕГӀА",
    "game.bonus": "Бонус<br>дешнаш",
    "game.hintLetter": "ХӀарф<br>хьахо",
    "game.hintTarget": "ХӀан<br>хьахо",
    "game.hintWand": "Хьехаман<br>тай",
    "game.found": "ХӀара дош карийна!",
    "game.bonusFound": "Карина бонус",
    "game.wrong": "Дош нийса дац!",
    "game.needCoins": "🪙 оьшу",
    "game.targetMsg": "Яьшка харжа 🎯",
    // Seviye Sonu
    "end.title": "Декъал! 🎉",
    "end.words": "Кхочушдина дешнаш",
    "end.bonus": "Бонус дешнаш 💎",
    "end.earned": "Карина сом",
    "end.map": "Карта",
    "end.next": "Кхин дӀа ▶",
    // İstatistik & Sözlük
    "stats.title": "Статистика 📊",
    "stats.desc": "Хьан кхочушдина болх, ловзарийн маьӀна а сомийн бехкам.",
    "dict.title": "Дошам 📖",
    "dict.desc": "Кхочушдина дешнаш а цар маьӀнаш а хӀокху чу кхолла.",
    "dict.search": "Лаха…",
    "dict.empty": "ХӀинца а цахила.<br>Дешнаш кхочушдича, хьан дошам хӀокху чу йовлар ю.",
    "dict.notFound": "Ца карийна.<br>Кхин а къастам я лаха.",
    // Ayarlar
    "settings.title": "Нисдарш ⚙️",
    "settings.theme": "Кеп",
    "settings.sound": "Аз 🔔",
    "settings.music": "Мукъам 🎵",
    "settings.lang": "Мотт 🌐",
    "settings.tut": "Хьехам",
    "settings.reset": "Юхадаккха",
    "settings.back": "Юха",
    "settings.resetTitle": "Юхадаккха",
    "settings.resetMsg": "Массо а хаамаш дӀадаха?",
    "settings.resetNo": "ХӀан-хӀа",
    "settings.resetYes": "ХӀаъ, юхадаккха",
  },
  ru: {
    // Russian (для второй аудитории)
    "home.start": "Начать ▶",
    "home.continue": "Продолжить ▶",
    "home.play": "Играть",
    "map.title": "Карта уровней",
    "map.pack": "ПАКЕТ",
    "map.level": "Уровень",
    "map.now": "Сейчас",
    "map.locked": "Заблокировано",
    "map.lockMsg": "Сначала завершите предыдущий уровень 🔒",
    "game.level": "УРОВЕНЬ",
    "game.bonus": "Бонусные<br>слова",
    "game.hintLetter": "Буква<br>подсказка",
    "game.hintTarget": "Цель<br>подсказка",
    "game.hintWand": "Волшебная<br>палочка",
    "game.found": "Это слово уже найдено!",
    "game.bonusFound": "Бонус найден",
    "game.wrong": "Неверное слово!",
    "game.needCoins": "🪙 нужно",
    "game.targetMsg": "Выберите клетку 🎯",
    "end.title": "Поздравляем! 🎉",
    "end.words": "Найденные слова",
    "end.bonus": "Бонусные слова 💎",
    "end.earned": "Заработано",
    "end.map": "Карта",
    "end.next": "Дальше ▶",
    "stats.title": "Статистика 📊",
    "stats.desc": "Ваш прогресс и достижения.",
    "dict.title": "Словарь 📖",
    "dict.desc": "Найденные слова и их значения собираются здесь.",
    "dict.search": "Поиск…",
    "dict.empty": "Пока пусто.<br>По мере нахождения слов ваш словарь будет заполняться.",
    "dict.notFound": "Не найдено.<br>Попробуйте другой поиск.",
    "settings.title": "Настройки ⚙️",
    "settings.theme": "Тема",
    "settings.sound": "Звук 🔔",
    "settings.music": "Музыка 🎵",
    "settings.lang": "Язык 🌐",
    "settings.tut": "Обучение",
    "settings.reset": "Сброс",
    "settings.back": "Назад",
    "settings.resetTitle": "Сброс",
    "settings.resetMsg": "Удалить весь прогресс?",
    "settings.resetNo": "Нет",
    "settings.resetYes": "Да, сбросить",
  },
  tr: {
    // Türkçe örnek çeviriler (diaspora için)
    "home.start": "Başla ▶",
    "home.continue": "Devam Et ▶",
    "home.play": "Oyun",
    "map.title": "Seviye Haritası",
    "map.pack": "BÖLÜM",
    "map.level": "Seviye",
    "map.now": "Şimdi",
    "map.locked": "Kilitli",
    "map.lockMsg": "Önceki seviyeyi tamamlayın 🔒",
    "game.level": "SEVİYE",
    "game.bonus": "Bonus<br>Kelimeler",
    "game.hintLetter": "Harf<br>İpucu",
    "game.hintTarget": "Hedef<br>İpucu",
    "game.hintWand": "Sihirli<br>Değnek",
    "game.found": "Bu kelime zaten bulundu!",
    "game.bonusFound": "Bonus bulundu",
    "game.wrong": "Yanlış kelime!",
    "game.needCoins": "🪙 gerekiyor",
    "game.targetMsg": "Bir kutu seçin 🎯",
    "end.title": "Tebrikler! 🎉",
    "end.words": "Bulunan kelimeler",
    "end.bonus": "Bonus kelimeler 💎",
    "end.earned": "Kazanılan",
    "end.map": "Harita",
    "end.next": "İleri ▶",
    "stats.title": "İstatistikler 📊",
    "stats.desc": "Oyun ilerlemeniz ve başarılarınız.",
    "dict.title": "Sözlük 📖",
    "dict.desc": "Bulduğunuz kelimeler ve anlamları burada toplanır.",
    "dict.search": "Ara…",
    "dict.empty": "Henüz boş.<br>Kelime buldukça sözlüğünüz dolacak.",
    "dict.notFound": "Bulunamadı.<br>Başka bir kelime arayın.",
    "settings.title": "Ayarlar ⚙️",
    "settings.theme": "Tema",
    "settings.sound": "Ses 🔔",
    "settings.music": "Müzik 🎵",
    "settings.lang": "Dil 🌐",
    "settings.tut": "Nasıl Oynanır",
    "settings.reset": "Sıfırla",
    "settings.back": "Geri",
    "settings.resetTitle": "Sıfırla",
    "settings.resetMsg": "Tüm ilerleme silinsin mi?",
    "settings.resetNo": "Hayır",
    "settings.resetYes": "Evet, sil",
  }
};

/**
 * Mevcut dile göre çeviri döndürür
 * @param {string} key - Çeviri anahtarı (örn: "home.start")
 * @param  {...any} args - Format parametreleri
 * @returns {string}
 */
export function t(key, ...args) {
  const lang = S.settings.lang || "ce";
  const dict = translations[lang] || translations["ce"];
  let str = dict[key] || translations["ce"][key] || key;
  
  if (args.length > 0) {
    args.forEach((arg, i) => {
      str = str.replace(`{${i}}`, arg);
    });
  }
  return str;
}

export function getLanguages() {
  return [
    { code: "ce", name: "Нохчийн", dir: "ltr" },
    { code: "tr", name: "Türkçe", dir: "ltr" },
    { code: "ru", name: "Русский", dir: "ltr" },
  ];
}

export function setLanguage(code) {
  if (translations[code]) {
    commitSettings({ lang: code });
    if (typeof document !== "undefined") {
      document.documentElement.lang = code;
      document.documentElement.dir = DIR_MAP[code] || "ltr";
    }
    location.reload();
  }
}
